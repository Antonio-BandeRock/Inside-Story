// Plan by sentence (C9). Under the Capture box: when the words say a day, a
// time or a repeat, this shows what they were read as, each part beside the
// words it came from, and offers one button that names exactly what will be
// saved. Nothing is kept until that button is pressed, and the kind can be
// changed first. The reading itself is lib/planSentence.ts.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { scheduleAppointment, scheduleGardenTask, scheduleReminder } from '../lib/db';
import type { KeepReminding } from '../lib/keepReminding';
import {
  describePlanWhen,
  PLAN_KIND_LABELS,
  PLAN_KINDS,
  planSaveLabel,
  planScheduledFor,
  readPlanSentence,
  type PlanKind,
  type PlanVocabulary,
} from '../lib/planSentence';
import { syncReminderNotifications } from '../lib/reminderNotifications';

type Props = {
  text: string;
  now: Date;
  vocabulary: PlanVocabulary;
  keepReminding: KeepReminding;
  disabled: boolean;
  /** Called once it is kept, with a sentence saying what was kept. */
  onSaved: (message: string) => void;
};

export function PlanSentencePanel({ text, now, vocabulary, keepReminding, disabled, onSaved }: Props) {
  // A kind picked by hand applies to the words it was picked for.
  const [picked, setPicked] = useState<{ text: string; kind: PlanKind } | null>(null);
  const [saving, setSaving] = useState(false);
  const reading = readPlanSentence(text, now, vocabulary);
  if (!reading) return null;
  const kind = picked && picked.text === text ? picked.kind : reading.kind;
  const scheduledFor = planScheduledFor(reading);
  const canSave = !reading.blocked && scheduledFor && !disabled && !saving;
  const when = describePlanWhen(reading, now);
  const kindNote = kind === reading.kind
    ? reading.kindReason
    : kind === 'appointment' && reading.repeat.type !== 'none'
      ? 'An appointment is kept one visit at a time, so only the first visit is saved.'
      : `Changed to ${PLAN_KIND_LABELS[kind].toLowerCase()} by you.`;

  async function save() {
    if (!canSave || !scheduledFor) return;
    setSaving(true);
    try {
      if (kind === 'appointment') {
        await scheduleAppointment({ title: reading!.action, scheduledFor });
      } else if (kind === 'garden') {
        await scheduleGardenTask({ title: reading!.action, scheduledFor, repeat: reading!.repeat });
      } else {
        await scheduleReminder({
          title: reading!.action,
          scheduledFor,
          repeat: reading!.repeat,
          keepRemindingMinutes: keepReminding,
        });
      }
      const firstOnly = kind === 'appointment' && reading!.repeat.type !== 'none';
      const whenSaved = firstOnly
        ? describePlanWhen({ ...reading!, repeat: { type: 'none' } }, now)
        : when;
      const where = kind === 'appointment'
        ? 'Schedules > Appointments'
        : kind === 'garden'
          ? 'Garden'
          : 'Schedules';
      onSaved(`${reading!.action}. ${whenSaved}. Kept in ${where}.`);
      void syncReminderNotifications();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Read as a plan</Text>
      <View style={styles.line}>
        <Text style={styles.lineLabel}>What</Text>
        <Text style={styles.lineValue}>{reading.action || 'Nothing yet'}</Text>
      </View>
      {when ? (
        <View style={styles.line}>
          <Text style={styles.lineLabel}>When</Text>
          <Text style={styles.lineValue}>{when}</Text>
        </View>
      ) : null}
      {reading.pieces.map((piece) => (
        <Text key={`${piece.words}-${piece.reads}`} style={styles.piece}>
          “{piece.words}” read as {piece.reads}.
        </Text>
      ))}
      {reading.timeAssumed ? <Text style={styles.piece}>No time was said, so it is set for 9:00 AM.</Text> : null}
      {reading.unsettled.map((line) => (
        <Text key={line} style={styles.unsettled}>
          {line}
        </Text>
      ))}
      <View style={styles.kindRow}>
        {PLAN_KINDS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.kindPill, option === kind ? styles.kindPillOn : null]}
            onPress={() => setPicked({ text, kind: option })}
            accessibilityRole="button"
            accessibilityState={{ selected: option === kind }}
          >
            <Text style={[styles.kindPillText, option === kind ? styles.kindPillTextOn : null]}>
              {PLAN_KIND_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.piece}>{kindNote}</Text>
      {reading.blocked ? (
        <Text style={styles.unsettled}>{reading.blocked}</Text>
      ) : (
        <TouchableOpacity
          style={[styles.saveButton, !canSave ? styles.saveButtonOff : null]}
          onPress={() => void save()}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          <Text style={styles.saveButtonText}>{saving ? 'Keeping it…' : planSaveLabel(reading, kind)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tabLife,
    backgroundColor: colors.surface,
  },
  heading: { ...typography.label, color: colors.menuLabelMuted, ...textShadow },
  line: { flexDirection: 'row', gap: 8 },
  lineLabel: { ...typography.caption, color: colors.textMuted, width: 44, ...textShadow },
  lineValue: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  piece: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  unsettled: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', ...textShadow },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  kindPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  kindPillOn: { backgroundColor: colors.accent },
  kindPillText: { ...typography.caption, color: colors.accent, textShadowColor: 'transparent', textShadowRadius: 0 },
  kindPillTextOn: { color: colors.background },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  saveButtonOff: { opacity: 0.45 },
  saveButtonText: { ...typography.bodyEmphasis, color: colors.accent, textShadowColor: 'transparent', textShadowRadius: 0 },
});
