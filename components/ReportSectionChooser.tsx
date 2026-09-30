// K10, 2026-09-29: tick which sections a report carries before it is
// shared. Folded to one line saying how many are in; opened, one row a
// section with a tick box, and All sections to put everything back. The
// Reports tab keeps the choice per kind of report (lib/reportSectionsDb.ts)
// and rebuilds the report without what is unticked, which is never read.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { cleanLeftOut, reportSectionChoices, sectionCountLabel, type ReportKind, type ReportSectionId } from '../lib/reportKinds';

type Props = {
  kind: ReportKind;
  leftOut: readonly ReportSectionId[];
  tabColor: string;
  onChange: (leftOut: ReportSectionId[]) => void;
};

export function ReportSectionChooser({ kind, leftOut, tabColor, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const choices = reportSectionChoices(kind);
  const clean = cleanLeftOut(kind, leftOut);
  const ticked = choices.length - clean.length;
  if (choices.length <= 1) return null;

  function toggle(id: ReportSectionId) {
    if (clean.includes(id)) {
      onChange(clean.filter((other) => other !== id));
      return;
    }
    // The last section ticked stays in: a report needs something in it.
    if (ticked <= 1) return;
    onChange(cleanLeftOut(kind, [...clean, id]));
  }

  return (
    <View>
      <TouchableOpacity style={styles.header} onPress={() => setOpen((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.title}>Sections in this report</Text>
        <Text style={styles.count}>{sectionCountLabel(kind, clean)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.list}>
          <Text style={styles.caption}>
            Untick a section to leave it out of this report. It is not read at all, and the report says how many sections were left out without naming them. This report remembers the choice.
          </Text>
          {choices.map((choice) => {
            const isIn = !clean.includes(choice.id);
            const locked = isIn && ticked <= 1;
            return (
              <TouchableOpacity
                key={choice.id}
                style={styles.row}
                onPress={() => toggle(choice.id)}
                disabled={locked}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isIn, disabled: locked }}
              >
                <Ionicons name={isIn ? 'checkbox' : 'square-outline'} size={22} color={isIn ? tabColor : colors.textSecondary} />
                <Text style={[styles.rowText, !isIn && styles.rowTextOut]}>{choice.label}</Text>
              </TouchableOpacity>
            );
          })}
          {ticked <= 1 ? <Text style={styles.caption}>At least one section stays in.</Text> : null}
          {clean.length > 0 ? (
            <TouchableOpacity style={[styles.allButton, { borderColor: tabColor }]} onPress={() => onChange([])}>
              <Text style={styles.allButtonText}>All sections</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, ...textShadow },
  count: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  list: { marginTop: 10, gap: 4 },
  caption: { ...typography.caption, color: colors.textSecondary, marginBottom: 6, ...textShadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  rowTextOut: { color: colors.textSecondary },
  // A filled surface: an outline-only control sits its label on the photo.
  allButton: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  allButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
});
