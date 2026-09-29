// What the seed packet says, under a planting in Garden > Plots & Plantings
// (I17, 2026-09-28): the variety as the packet prints it, its days to
// maturity, and a photo of the packet. Folded to one line until opened.
//
// Days given here set the planting's expected first harvest to that many
// days from the day it went in, in place of the crop's usual window.
// Clearing them leaves the expected harvest as it stands. The rules and
// wording are in lib/seedPacket.ts.

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { updateGardenPlanting } from '../lib/db';
import { countMediaFor } from '../lib/mediaDb';
import { dateLabel } from '../lib/moonSky';
import {
  packetDaysRangeLine,
  packetHarvestDate,
  packetHarvestLine,
  readPacketDays,
  SEED_PACKET_CAPTION,
  SEED_PACKET_OWNER_KIND,
  seedPacketSummary,
} from '../lib/seedPacket';
import { AppTextInput } from './AppTextInput';
import { PhotoStrip } from './PhotoStrip';

const TAB_COLOR = colors.tabGarden;

type Props = {
  plantingId: string;
  foodName: string;
  plantedAt: string;
  varietyNote: string | null;
  packetDays: number | null;
  /** After a save, so the row above shows the variety and harvest dates. */
  onSaved: () => Promise<void> | void;
};

export function SeedPacketSection({ plantingId, foodName, plantedAt, varietyNote, packetDays, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [variety, setVariety] = useState(varietyNote ?? '');
  const [days, setDays] = useState(packetDays === null ? '' : String(packetDays));
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadCount = useCallback(async () => {
    setPhotoCount(await countMediaFor(SEED_PACKET_OWNER_KIND, plantingId));
  }, [plantingId]);

  useFocusEffect(
    useCallback(() => {
      loadCount().catch(() => undefined);
    }, [loadCount]),
  );

  function toggle() {
    if (!open) {
      setVariety(varietyNote ?? '');
      setDays(packetDays === null ? '' : String(packetDays));
      setError(null);
    } else {
      loadCount().catch(() => undefined);
    }
    setOpen(!open);
  }

  const reading = readPacketDays(days);
  const plantedOn = plantedAt.slice(0, 10);

  async function handleSave() {
    if (reading.status === 'invalid') {
      setError(packetDaysRangeLine());
      return;
    }
    const given = reading.status === 'days' ? reading.days : null;
    const harvestOn = given === null ? null : packetHarvestDate(plantedOn, given);
    await updateGardenPlanting(plantingId, {
      varietyNote: variety.trim() || null,
      packetDays: given,
      ...(harvestOn ? { expectedHarvestStart: harvestOn, expectedHarvestEnd: harvestOn } : {}),
    });
    setError(null);
    setOpen(false);
    await loadCount();
    await onSaved();
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={toggle} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide the seed packet' : 'Seed packet'}</Text>
      </TouchableOpacity>
      {!open ? (
        <Text style={styles.captionText}>{seedPacketSummary(varietyNote, packetDays, photoCount)}</Text>
      ) : (
        <View style={styles.nested}>
          <Text style={styles.captionText}>{SEED_PACKET_CAPTION}</Text>
          <Text style={styles.fieldLabel}>Variety</Text>
          <AppTextInput
            style={styles.textInput}
            value={variety}
            onChangeText={setVariety}
            placeholder="As printed on the packet"
          />
          <Text style={styles.fieldLabel}>Days to maturity</Text>
          <AppTextInput
            style={[styles.textInput, styles.daysInput]}
            value={days}
            onChangeText={(text) => {
              setDays(text);
              setError(null);
            }}
            placeholder="Days"
            keyboardType="number-pad"
          />
          {reading.status === 'days' ? (
            <Text style={styles.captionText}>
              {packetHarvestLine(reading.days, dateLabel(packetHarvestDate(plantedOn, reading.days)))}
            </Text>
          ) : reading.status === 'invalid' ? (
            <Text style={styles.captionText}>{packetDaysRangeLine()}</Text>
          ) : packetDays !== null ? (
            <Text style={styles.captionText}>With the days cleared, the expected harvest stays as it is now.</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <PhotoStrip
            ownerKind={SEED_PACKET_OWNER_KIND}
            ownerId={plantingId}
            tabColor={TAB_COLOR}
            addLabel="Photo of the Packet"
            title={`${foodName} seed packet`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  daysInput: { width: 110 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
