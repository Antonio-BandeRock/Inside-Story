// Which of these is actually cheaper, 2026-09-01.
//
// Asked for directly, and the reasoning is the whole design: "I like the
// advice on pricing it per liter, but they won't know that unless they have a
// tool they can use to compare pricing per amount. That could be very useful
// in comparing pricing between competitive brands."
//
// Quoting a price per litre on a line already bought is useful after the fact.
// It does nothing at the moment that matters, which is standing in front of
// two bottles at different prices in different sizes. That is a sum people try
// to do in their head and mostly get wrong, because the bigger bottle is not
// reliably the cheaper one.
//
// Reached from a grocery list line, where it comes back with the winner's
// price already filled in, or on its own for a straight comparison.
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getStoredMeasurementSystem } from '../lib/db';
import { updateGroceryItemPurchase } from '../lib/groceryDb';
import {
  comparePrices,
  parsePriceInput,
  purchaseSizeUnitFor,
  unitPriceLabelFor,
  type PurchaseForm,
} from '../lib/groceryList';
import { recognizeTextFromImage } from '../lib/ocr';

type Entry = { label: string; priceText: string; sizeText: string };

const BLANK: Entry = { label: '', priceText: '', sizeText: '' };

// Two to start, because a comparison needs two. More can be added, since a
// shelf often has four of the same thing.
const STARTING_ENTRIES: Entry[] = [{ ...BLANK }, { ...BLANK }];

function parseNumberOrNull(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function PriceCompareScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const { listId, itemId, foodName, form } = useLocalSearchParams<{
    listId?: string;
    itemId?: string;
    foodName?: string;
    form?: string;
  }>();

  const purchaseForm = (form === 'volume' || form === 'weight' || form === 'count' ? form : null) as PurchaseForm | null;
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const [entries, setEntries] = useState<Entry[]>(STARTING_ENTRIES);
  const [readingIndex, setReadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Null when nobody has set one, which is not an error: metric is this
    // app's own default everywhere else it asks.
    void getStoredMeasurementSystem().then((system) => setMeasurementSystem(system ?? 'metric'));
  }, []);

  const sizeUnit = purchaseSizeUnitFor(purchaseForm, measurementSystem);
  const unitLabel = unitPriceLabelFor(purchaseForm, measurementSystem);

  const results = useMemo(
    () =>
      comparePrices(
        entries.map((entry) => ({
          label: entry.label,
          price: parseNumberOrNull(entry.priceText),
          size: parseNumberOrNull(entry.sizeText),
        })),
        purchaseForm,
        measurementSystem,
      ),
    [entries, purchaseForm, measurementSystem],
  );

  const bestIndex = results.findIndex((result) => result.isBest);

  const update = useCallback((index: number, patch: Partial<Entry>) => {
    setEntries((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }, []);

  async function handleScanPrice(index: number) {
    setReadingIndex(index);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showInfoAlert(
          'Camera access needed',
          'Inside Story needs your camera to read a price off the shelf label. You can still type it in.',
        );
        return;
      }
      const shot = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (shot.canceled || shot.assets.length === 0) return;
      const text = await recognizeTextFromImage(shot.assets[0].uri);
      const price = text ? parsePriceInput(text) : null;
      if (price == null) {
        showInfoAlert('Could not read a price', 'Nothing on that photo looked like a price. Try again closer to the label, or type it in.');
        return;
      }
      update(index, { priceText: String(price) });
    } catch {
      showInfoAlert('Could not read a price', 'Something went wrong reading that photo. You can type it in instead.');
    } finally {
      setReadingIndex(null);
    }
  }

  function handleSpokenPrice(index: number, text: string) {
    const price = parsePriceInput(text);
    if (price == null) {
      showInfoAlert('Did not catch a price', `Heard "${text}". Try saying it like "three ninety nine", or type it in.`);
      return;
    }
    update(index, { priceText: String(price) });
  }

  // Puts the winner onto the line that sent us here, so a comparison ends in
  // the list being right rather than in a number to remember and retype.
  async function handleUseWinner() {
    if (!listId || !itemId || bestIndex < 0) return;
    const winner = entries[bestIndex];
    setSaving(true);
    try {
      await updateGroceryItemPurchase(itemId, {
        price: parseNumberOrNull(winner.priceText),
        priceUnit: 'total',
        purchasedQuantity: parseNumberOrNull(winner.sizeText),
        note: winner.label.trim() ? winner.label.trim() : undefined,
      });
      router.replace(`/grocery-list?listId=${encodeURIComponent(listId)}`);
    } catch (error) {
      showInfoAlert('Could not save that', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{foodName ? `Which ${foodName} is cheaper?` : 'Which is cheaper?'}</Text>
          <Text style={styles.muted}>
            {`Put in what each one costs and how big it is. Everything gets worked out ${unitLabel}, which is the only way two different sizes can be compared.`}
          </Text>
        </View>

        {entries.map((entry, index) => {
          const result = results[index];
          return (
            <View key={index} style={[styles.card, result.isBest && styles.cardBest]}>
              <View style={styles.rowHead}>
                <Text style={styles.sectionLabel}>{`Option ${index + 1}`}</Text>
                {result.isBest ? (
                  <View style={styles.bestTag}>
                    <Ionicons name="pricetag" size={14} color={colors.background} />
                    <Text style={styles.bestTagText}>Best value</Text>
                  </View>
                ) : null}
                {entries.length > 2 ? (
                  <TouchableOpacity
                    onPress={() => setEntries((current) => current.filter((_, i) => i !== index))}
                    accessibilityLabel={`Remove option ${index + 1}`}
                  >
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <AppTextInput
                style={styles.input}
                value={entry.label}
                onChangeText={(text) => update(index, { label: text })}
                placeholder="Brand or which one it is (optional)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.editorLabel}>What does it cost?</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <AppTextInput
                  style={styles.priceInput}
                  value={entry.priceText}
                  onChangeText={(text) => update(index, { priceText: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
                <VoiceInputButton onResult={(text) => handleSpokenPrice(index, text)} size={22} color={colors.textSecondary} />
                <TouchableOpacity
                  style={[styles.iconButton, readingIndex === index && styles.disabled]}
                  activeOpacity={0.85}
                  onPress={() => handleScanPrice(index)}
                  disabled={readingIndex === index}
                  accessibilityLabel={`Read option ${index + 1}'s price from the shelf label`}
                >
                  <Ionicons name={readingIndex === index ? 'hourglass-outline' : 'camera-outline'} size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.editorLabel}>{`How big is it? (${sizeUnit})`}</Text>
              <AppTextInput
                style={styles.input}
                value={entry.sizeText}
                onChangeText={(text) => update(index, { sizeText: text })}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />

              {result.display ? (
                <Text style={result.isBest ? styles.unitPriceBest : styles.unitPrice}>
                  {result.display}
                  {result.dearerByPercent != null ? `  ·  ${result.dearerByPercent}% dearer` : ''}
                </Text>
              ) : (
                <Text style={styles.muted}>Add a price and a size to compare this one.</Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => setEntries((current) => [...current, { ...BLANK }])}
        >
          <Ionicons name="add" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Add Another to Compare</Text>
        </TouchableOpacity>

        {listId && itemId ? (
          <TouchableOpacity
            style={[styles.primaryButton, (bestIndex < 0 || saving) && styles.disabled]}
            activeOpacity={0.85}
            onPress={handleUseWinner}
            disabled={bestIndex < 0 || saving}
          >
            <Ionicons name="cart-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>
              {bestIndex < 0 ? 'Fill in two to compare' : 'Put the Best Value on My List'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  cardBest: { borderColor: colors.statusGood, borderWidth: 2 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  editorLabel: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  unitPrice: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  unitPriceBest: { ...typography.bodyEmphasis, color: colors.statusGood, ...textShadow },
  bestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.statusGood,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  // Dark text on the light status fill: cancel the shadow it would inherit.
  bestTagText: { ...typography.caption, color: colors.background, textShadowColor: 'transparent', textShadowRadius: 0 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currency: { ...typography.sectionTitle, color: colors.textSecondary, ...textShadow },
  priceInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
