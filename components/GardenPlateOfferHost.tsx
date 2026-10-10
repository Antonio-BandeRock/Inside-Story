// The "from your garden" sheet, offered the moment a meal is saved.
//
// Phase 6 of the 2026-09-23 cross-app push. lib/plateSource.ts holds the
// matching and every sentence, lib/plateSourceDb.ts the reads and the one
// write, lib/gardenPlateOffer.ts the single line each meal screen calls.
//
// Mounted once at the app root, the components/TellClaudeHost.tsx shape, for
// the same reason: a meal is saved from five separate screens and this has to
// paint over the whole window from any of them, including from inside a
// builder's modal. It renders nothing at all until a saved meal turns out to
// match a picking that still has something on it, so somebody with no garden
// never sees it.
//
// Deliberately NOT a Modal, again the TellClaudeHost reasoning: AppKeyboard is
// a View this app draws at the root, and a native Modal is a separate window
// that would cover it.
//
// Since 2026-09-27 the same sheet also offers food measured in Life > Kitchen
// and ferments (lib/onHand.ts), titled for whichever of the two it holds. A
// kitchen row the meal's units cannot be matched to is shown and cannot be
// ticked; one already taken off for a grocery list naming this meal starts
// unticked.
//
// Every row starts ticked and can be unticked. A tomato in the fridge and a
// tomato from the shop look the same to the app, so the person settles it, and
// nothing comes off a picking that fed nobody.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { registerGardenPlateOpener } from '../lib/gardenPlateOffer';
import { describePlateAction, describePlateOffer } from '../lib/plateSource';
import type { PlateOffer } from '../lib/plateSource';
import { getPlateOfferForMeal, keepPlateUses } from '../lib/plateSourceDb';
import { describePantryAction, describePantryOffer, type PantryOffer } from '../lib/onHand';
import { getPantryOffersForMeal, keepPantryUses } from '../lib/onHandDb';

type Open = {
  mealId: string;
  mealName: string;
  usedOn: string;
  offers: PlateOffer[];
  pantry: PantryOffer[];
};

export function GardenPlateOfferHost() {
  const [open, setOpen] = useState<Open | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [chosenPantry, setChosenPantry] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const start = useCallback((mealId: string) => {
    // Nothing is awaited by the caller: the meal screen has already moved on,
    // and this comes up a moment later or not at all.
    getPlateOfferForMeal(mealId)
      .then(async (found) => {
        if (!found) return;
        const pantry = await getPantryOffersForMeal(mealId, found.offers);
        if (found.offers.length === 0 && pantry.length === 0) return;
        setOpen({ ...found, pantry });
        setChosen(found.offers.map((offer) => offer.harvestId));
        setChosenPantry(pantry.filter((offer) => offer.takeable && offer.ticked).map((offer) => offer.key));
        setSaving(false);
        setSaved(null);
      })
      .catch((error) => {
        console.error('[gardenPlate] could not look for pickings', error);
      });
  }, []);

  useEffect(() => registerGardenPlateOpener(start), [start]);

  if (!open) return null;

  const picked = open.offers.filter((offer) => chosen.includes(offer.harvestId));
  const pickedPantry = open.pantry.filter((offer) => offer.takeable && chosenPantry.includes(offer.key));
  const nothingPicked = picked.length === 0 && pickedPantry.length === 0;
  const title =
    open.offers.length > 0 && open.pantry.length > 0 ? 'From your garden and kitchen' : open.offers.length > 0 ? 'From your garden' : 'From your kitchen';

  function togglePantry(key: string) {
    setChosenPantry((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function toggle(harvestId: string) {
    setChosen((current) =>
      current.includes(harvestId) ? current.filter((id) => id !== harvestId) : [...current, harvestId],
    );
  }

  async function keep() {
    if (!open || saving || nothingPicked) return;
    setSaving(true);
    try {
      if (picked.length > 0) await keepPlateUses(open.mealId, picked, open.usedOn);
      if (pickedPantry.length > 0) await keepPantryUses(pickedPantry);
      setSaved('Written down.');
    } catch (error) {
      console.error('[gardenPlate] could not write that down', error);
      setSaved('Could not write that down.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.where}>{open.mealName}</Text>
        {saved ? (
          <>
            <Text style={styles.message}>{saved}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.okButton} onPress={() => setOpen(null)} hitSlop={8}>
                <Text style={styles.okButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {open.offers.length > 0 ? <Text style={styles.headline}>{describePlateOffer(open.offers)}</Text> : null}
            {open.pantry.length > 0 ? <Text style={styles.headline}>{describePantryOffer(open.pantry)}</Text> : null}
            <ScrollView style={styles.rows} contentContainerStyle={styles.rowsContent}>
              {open.offers.map((offer) => {
                const on = chosen.includes(offer.harvestId);
                return (
                  <TouchableOpacity
                    key={offer.harvestId}
                    style={[styles.row, on ? styles.rowOn : null]}
                    onPress={() => toggle(offer.harvestId)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <Text style={styles.rowName}>{offer.foodName}</Text>
                    <Text style={styles.rowLine}>{offer.line}</Text>
                  </TouchableOpacity>
                );
              })}
              {open.pantry.map((offer) => {
                const on = offer.takeable && chosenPantry.includes(offer.key);
                return (
                  <TouchableOpacity
                    key={`pantry:${offer.key}`}
                    style={[styles.row, on ? styles.rowOn : null]}
                    onPress={() => togglePantry(offer.key)}
                    disabled={!offer.takeable}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: !offer.takeable }}
                  >
                    <Text style={styles.rowName}>{offer.foodName}</Text>
                    <Text style={styles.rowLine}>{offer.line}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.caption}>
              {nothingPicked
                ? 'Nothing is ticked, so nothing gets written down and nothing comes off what is on hand.'
                : [picked.length > 0 ? describePlateAction(picked) : null, open.pantry.length > 0 ? describePantryAction(pickedPantry.length) : null]
                    .filter(Boolean)
                    .join(' ')}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setOpen(null)} hitSlop={8}>
                <Text style={styles.cancelButtonText}>Not this time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.okButton, nothingPicked ? styles.okButtonOff : null]}
                onPress={keep}
                disabled={saving || nothingPicked}
                hitSlop={8}
              >
                <Text style={styles.okButtonText}>{saving ? 'Saving' : 'Keep'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 460,
  },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, fontSize: 18, ...textShadow },
  where: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: 12, ...textShadow },
  headline: { ...typography.body, color: colors.textSecondary, marginBottom: 10, ...textShadow },
  message: { ...typography.body, color: colors.textSecondary, marginTop: 6, ...textShadow },
  // Capped so a meal built from eight things out of the garden scrolls rather
  // than pushing the buttons off a short window.
  rows: { maxHeight: 280 },
  rowsContent: { gap: 8, paddingBottom: 2 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    opacity: 0.55,
  },
  rowOn: { borderColor: colors.primary, opacity: 1 },
  rowName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  rowLine: { ...typography.caption, color: colors.textSecondary, marginTop: 3, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 14, justifyContent: 'flex-start' },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  okButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  okButtonOff: { opacity: 0.5 },
  okButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    // Dark text: cancel the shadow the base style carries. See
    // constants/typography.ts.
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
