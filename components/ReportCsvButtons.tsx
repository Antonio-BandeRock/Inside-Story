// Save a report as spreadsheet files (K5, 2026-09-29): one button for the
// whole report in one file, and one per table that has rows, each handing
// its CSV to the share sheet on a phone or Save As on a computer. The host
// gives them a surface. Contents are in lib/reportCsv.ts.

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { REPORT_CSV_CAPTION, REPORT_CSV_NO_TABLES, reportCsvTables } from '../lib/reportCsv';
import { exportReportCsv } from '../lib/reportCsvExport';
import type { ReportDocument } from '../lib/reportGenerator';
import { useInfoAlert } from './InfoAlert';

const WHOLE = '__whole__';

type Props = {
  report: ReportDocument;
  /** Called once a file has been handed over. */
  onSaved?: () => void;
};

export function ReportCsvButtons({ report, onSaved }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const tables = reportCsvTables(report);

  async function handleSave(key: string) {
    if (busy) return;
    setBusy(key);
    try {
      const outcome = await exportReportCsv(report, key === WHOLE ? null : key);
      if (outcome.status === 'failed') showInfoAlert('File not made', outcome.message);
      else {
        onSaved?.();
        if (outcome.status === 'savedOnly') {
          showInfoAlert(
            'File saved, sharing not available',
            `This phone offered no share sheet for a file, so the file stayed where it was written: ${outcome.uri}`,
          );
        }
      }
    } finally {
      setBusy(null);
    }
  }

  const buttons = [{ key: WHOLE, label: 'Whole report' }, ...tables.map((table) => ({ key: table.key, label: table.heading }))];

  return (
    <View style={styles.wrap}>
      <Text style={styles.captionText}>{tables.length > 0 ? REPORT_CSV_CAPTION : REPORT_CSV_NO_TABLES}</Text>
      <View style={styles.buttonRow}>
        {buttons.map((entry) => (
          <TouchableOpacity
            key={entry.key}
            style={[styles.button, busy === entry.key && styles.buttonBusy]}
            onPress={() => handleSave(entry.key)}
            disabled={busy !== null}
            accessibilityRole="button"
            accessibilityLabel={`${entry.label} as CSV`}
          >
            <Text style={styles.buttonText}>{busy === entry.key ? 'Making the file…' : entry.label}</Text>
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
