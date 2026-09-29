// Save the garden as spreadsheet files (I15, 2026-09-28): one button per
// file (plantings, harvests, what was done), each handing its CSV to the
// share sheet on a phone or Save As on a computer. The same buttons stand
// on Garden > Plots & Plantings and under the Garden report on Reports; the
// host gives them a surface. Columns are in lib/gardenCsv.ts.

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { GARDEN_CSV_CAPTION, GARDEN_CSV_KINDS, nothingToSave, type GardenCsvKind } from '../lib/gardenCsv';
import { exportGardenCsv } from '../lib/gardenCsvDb';
import { useInfoAlert } from './InfoAlert';

type Props = {
  /** Replaces the standard caption, for a host with no range above it. */
  caption?: string;
};

export function GardenCsvButtons({ caption = GARDEN_CSV_CAPTION }: Props) {
  const [busy, setBusy] = useState<GardenCsvKind | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  async function handleSave(kind: GardenCsvKind) {
    if (busy) return;
    setBusy(kind);
    try {
      const outcome = await exportGardenCsv(kind);
      if (outcome.status === 'empty') showInfoAlert('Nothing to Save', nothingToSave(kind));
      else if (outcome.status === 'failed') showInfoAlert('File not made', outcome.message);
      else if (outcome.status === 'savedOnly') {
        showInfoAlert(
          'File saved, sharing not available',
          `This phone offered no share sheet for a file, so the file stayed where it was written: ${outcome.uri}`,
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.captionText}>{caption}</Text>
      <View style={styles.buttonRow}>
        {GARDEN_CSV_KINDS.map((entry) => (
          <TouchableOpacity
            key={entry.kind}
            style={[styles.button, busy === entry.kind && styles.buttonBusy]}
            onPress={() => handleSave(entry.kind)}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel={`${entry.label} as CSV`}
          >
            <Text style={styles.buttonText}>{busy === entry.kind ? 'Making the file…' : entry.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
  },
  buttonBusy: { opacity: 0.6 },
  buttonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
