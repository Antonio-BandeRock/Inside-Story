// "Turn it into…" on a capture note (C5, C6 and C7 of the competitive build
// plan, Phase 2, 2026-09-26).
//
// Sorting a note has always only pointed it somewhere: "To buy" opens the
// grocery list and leaves the typing to the person. That keeps the inbox's
// rule that nothing is made without a decision, and it also means "eggs,
// milk and bread" gets typed twice. This panel is the decision. Each choice
// shows exactly what it is about to make (the day in full, the three things
// to buy, the four steps) with a way to take any piece out, and nothing is
// written until its button is pressed.
//
//   On a day      a reminder that day, or a Days Until counter to it. Dates
//                 the note mentions are offered first (lib/plainDate.ts).
//   Upkeep        opens Life > Upkeep with the words as the name. The rest
//                 (how often, when last done) is the person's to fill in, so
//                 the note is sorted there rather than marked done.
//   Grocery list  one line per thing, on the list being shopped.
//   Steps         a new routine with these steps, or one Did I Do It check
//                 for each.
//
// A note that became something is marked done rather than deleted, so it
// can still be looked back at, the same as Reconcile's "Put it on a day".
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { groceryItemsFromNote, splitCaptureNote, type CaptureNote } from '../lib/captureNotes';
import { setCaptureNoteDestination, setCaptureNoteDone } from '../lib/captureNotesDb';
import { addCountdown } from '../lib/countdownDb';
import { scheduleReminder } from '../lib/db';
import { addNamesToActiveGroceryList } from '../lib/groceryDb';
import {
  dateKey,
  daysFromToday,
  describePlainDate,
  plainDateToLocalDateTime,
  readPlainDateField,
  readPlainDates,
  type PlainDate,
} from '../lib/plainDate';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { addRoutineStep, createDoneCheck, createRoutine } from '../lib/routinesDb';

type Mode = 'menu' | 'day' | 'grocery' | 'steps';

type Props = {
  note: CaptureNote;
  /** Called after anything is written, so the inbox reloads. */
  onChanged: () => void;
  /** What was made, for the screen to say once the note has moved to the
   *  dealt-with list. */
  onFinished: (result: CaptureTurnResult) => void;
};

export type CaptureTurnResult = { message: string; open?: { label: string; href: Href } };

const REMINDER_FALLBACK_TIME = '09:00';

const MENU: { mode: Mode | 'upkeep'; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'day', label: 'On a day', icon: 'calendar-outline' },
  { mode: 'upkeep', label: 'An upkeep item', icon: 'construct-outline' },
  { mode: 'grocery', label: 'On the grocery list', icon: 'cart-outline' },
  { mode: 'steps', label: 'Steps or checks', icon: 'list-outline' },
];

function lifeLens(lens: string): Href {
  return { pathname: '/life', params: { openLifeLens: lens } } as Href;
}

export function CaptureTurnInto({ note, onChanged, onFinished }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('menu');
  const [busy, setBusy] = useState(false);
  // On a day
  const [picked, setPicked] = useState<PlainDate | null>(null);
  const [typedWhen, setTypedWhen] = useState('');
  // Grocery list and steps
  const [splitAtAnd, setSplitAtAnd] = useState(true);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [routineName, setRoutineName] = useState<string | null>(null);

  const now = new Date();

  // Dates the note mentions come first, then the three every note gets.
  const dayOptions = useMemo(() => {
    const at = new Date();
    const seen = new Set<string>();
    const out: PlainDate[] = [];
    const add = (found: PlainDate | undefined) => {
      if (!found) return;
      const key = `${found.date}T${found.time ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(found);
    };
    readPlainDates(note.text, at, 'future').forEach(add);
    for (const words of ['tomorrow', 'this weekend', 'next week']) add(readPlainDates(words, at, 'future')[0]);
    return out;
  }, [note.text]);

  const typedFound = readPlainDateField(typedWhen, now, 'future');

  const groceryItems = groceryItemsFromNote(note.text, splitAtAnd);
  const split = splitCaptureNote(note.text, splitAtAnd);
  const pieces = mode === 'grocery' ? groceryItems : split.items;
  const kept = pieces.filter((unused, index) => !removed.has(index));
  const nameForRoutine = routineName ?? split.heading ?? '';

  function choose(next: Mode | 'upkeep') {
    if (next === 'upkeep') {
      void (async () => {
        await setCaptureNoteDestination(note.id, 'upkeep');
        onChanged();
        router.push({ pathname: '/life', params: { openLifeLens: 'upkeep', upkeepName: note.text } } as Href);
      })();
      return;
    }
    setRemoved(new Set());
    setPicked(null);
    setMode(next);
  }

  async function finish(result: CaptureTurnResult) {
    await setCaptureNoteDone(note.id, true);
    setBusy(false);
    onFinished(result);
    onChanged();
  }

  async function remindThen(found: PlainDate) {
    if (busy) return;
    setBusy(true);
    await scheduleReminder({ title: note.text, scheduledFor: plainDateToLocalDateTime(found, REMINDER_FALLBACK_TIME) });
    void syncReminderNotifications();
    await finish({
      message: `The phone will say it ${describePlainDate({ ...found, time: found.time ?? REMINDER_FALLBACK_TIME }, now)}. The note is marked done.`,
    });
  }

  async function countTo(found: PlainDate) {
    const days = daysFromToday(found, now);
    if (busy || days < 1) return;
    setBusy(true);
    await addCountdown({ name: note.text, about: null, startedOn: dateKey(now), days });
    void syncReminderNotifications();
    await finish({
      message: `A counter of ${days === 1 ? '1 day' : `${days} days`}, landing ${describePlainDate({ ...found, time: null }, now)}. The note is marked done.`,
      open: { label: 'Open Days Until', href: lifeLens('daysUntil') },
    });
  }

  async function addToGrocery() {
    if (busy || kept.length === 0) return;
    setBusy(true);
    const count = await addNamesToActiveGroceryList(kept);
    await setCaptureNoteDestination(note.id, 'shopping');
    await finish({
      message: `${count === 1 ? '1 thing' : `${count} things`} on the grocery list. The note is marked done.`,
      open: { label: 'Open the grocery list', href: lifeLens('groceryList') },
    });
  }

  async function makeRoutine() {
    const name = nameForRoutine.trim();
    if (busy || kept.length === 0 || name.length < 2) return;
    setBusy(true);
    const id = await createRoutine(name, 'other');
    if (!id) {
      setBusy(false);
      return;
    }
    for (const step of kept) await addRoutineStep(id, step, null, null);
    await finish({
      message: `${name}, with ${kept.length === 1 ? '1 step' : `${kept.length} steps`}. Give it an occasion or a time on Routines. The note is marked done.`,
      open: { label: 'Open Routines', href: lifeLens('routines') },
    });
  }

  async function makeChecks() {
    if (busy || kept.length === 0) return;
    setBusy(true);
    for (const item of kept) await createDoneCheck(item, 'daily');
    await finish({
      message: `${kept.length === 1 ? '1 check' : `${kept.length} checks`} on Did I Do It, each asked about daily. Change any of them there. The note is marked done.`,
      open: { label: 'Open Did I Do It', href: lifeLens('didIDoIt') },
    });
  }

  function toggleRemoved(index: number) {
    const next = new Set(removed);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setRemoved(next);
  }

  if (mode === 'menu') {
    return (
      <View style={styles.panel}>
        <View style={styles.pillWrap}>
          {MENU.map((option) => (
            <TouchableOpacity key={option.mode} style={styles.pill} onPress={() => choose(option.mode)}>
              <Ionicons name={option.icon} size={14} color={colors.accent} />
              <Text style={styles.pillText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helper}>Each one shows what it will make before anything is saved.</Text>
      </View>
    );
  }

  const back = (
    <TouchableOpacity style={styles.backRow} onPress={() => setMode('menu')} hitSlop={8}>
      <Ionicons name="chevron-back" size={14} color={colors.textMuted} />
      <Text style={styles.helper}>Something else</Text>
    </TouchableOpacity>
  );

  if (mode === 'day') {
    const options = typedFound ? [...dayOptions, typedFound] : dayOptions;
    return (
      <View style={styles.panel}>
        {back}
        <Text style={styles.label}>Which day?</Text>
        <View style={styles.pillWrap}>
          {options.map((option) => {
            const active = picked?.date === option.date && picked?.time === option.time;
            return (
              <TouchableOpacity
                key={`${option.date}T${option.time ?? ''}`}
                style={[styles.pill, active ? styles.pillOn : null]}
                onPress={() => setPicked(option)}
              >
                <Text style={[styles.pillText, active ? styles.pillTextOn : null]}>{describePlainDate(option, now)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppTextInput
          style={styles.input}
          value={typedWhen}
          onChangeText={setTypedWhen}
          placeholder="Or say when: next Thursday at 4, 3 March"
          placeholderTextColor={colors.textMuted}
        />
        {typedWhen.trim() && !typedFound ? (
          <Text style={styles.helper}>Those words do not read as a day yet. Try a weekday, a date like 3 March, or in 2 weeks.</Text>
        ) : null}
        {picked ? (
          <View style={styles.choiceBlock}>
            <TouchableOpacity style={styles.fillButton} onPress={() => void remindThen(picked)} disabled={busy}>
              <Ionicons name="alarm-outline" size={16} color={colors.background} />
              <Text style={styles.fillButtonText}>
                {`Remind me ${describePlainDate({ ...picked, time: picked.time ?? REMINDER_FALLBACK_TIME }, now)}`}
              </Text>
            </TouchableOpacity>
            {daysFromToday(picked, now) >= 1 ? (
              <TouchableOpacity style={styles.outlineButton} onPress={() => void countTo(picked)} disabled={busy}>
                <Ionicons name="hourglass-outline" size={16} color={colors.accent} />
                <Text style={styles.outlineButtonText}>Count the days to it</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      {back}
      <Text style={styles.label}>{mode === 'grocery' ? 'These go on the list' : 'These become the steps'}</Text>
      {pieces.length === 0 ? <Text style={styles.helper}>Nothing to add from these words.</Text> : null}
      {pieces.map((piece, index) => {
        const out = removed.has(index);
        return (
          <View key={`${index}-${piece}`} style={styles.pieceRow}>
            <Text style={[styles.body, styles.pieceText, out ? styles.pieceOut : null]}>{piece}</Text>
            <TouchableOpacity
              onPress={() => toggleRemoved(index)}
              hitSlop={10}
              accessibilityLabel={out ? `Put ${piece} back` : `Leave ${piece} out`}
            >
              <Ionicons name={out ? 'add-circle-outline' : 'close'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => {
          setSplitAtAnd(!splitAtAnd);
          setRemoved(new Set());
        }}
      >
        <Ionicons name={splitAtAnd ? 'square-outline' : 'checkbox-outline'} size={16} color={colors.accent} />
        <Text style={styles.helper}>Keep words joined by “and” together</Text>
      </TouchableOpacity>
      {mode === 'grocery' ? (
        <TouchableOpacity
          style={[styles.fillButton, kept.length === 0 ? styles.off : null]}
          onPress={() => void addToGrocery()}
          disabled={busy || kept.length === 0}
        >
          <Ionicons name="cart-outline" size={16} color={colors.background} />
          <Text style={styles.fillButtonText}>Add to the grocery list</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.choiceBlock}>
          <Text style={styles.label}>A routine called</Text>
          <AppTextInput
            style={styles.input}
            value={nameForRoutine}
            onChangeText={setRoutineName}
            placeholder="Morning, Leaving the house"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.fillButton, kept.length === 0 || nameForRoutine.trim().length < 2 ? styles.off : null]}
            onPress={() => void makeRoutine()}
            disabled={busy || kept.length === 0 || nameForRoutine.trim().length < 2}
          >
            <Ionicons name="walk-outline" size={16} color={colors.background} />
            <Text style={styles.fillButtonText}>A new routine with these steps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineButton, kept.length === 0 ? styles.off : null]}
            onPress={() => void makeChecks()}
            disabled={busy || kept.length === 0}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.accent} />
            <Text style={styles.outlineButtonText}>Did I Do It checks, one each</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  body: { ...typography.body, color: colors.textPrimary, ...textShadow },
  label: { ...typography.label, color: colors.menuLabelMuted, ...textShadow },
  helper: { ...typography.caption, color: colors.textMuted, ...textShadow },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.accent },
  pillText: { ...typography.caption, color: colors.accent, textShadowColor: 'transparent', textShadowRadius: 0 },
  pillTextOn: { color: colors.background },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    backgroundColor: colors.surface,
    ...textShadow,
  },
  choiceBlock: { gap: 8 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pieceText: { flex: 1 },
  pieceOut: { color: colors.textMuted, textDecorationLine: 'line-through' },
  fillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  fillButtonText: { ...typography.bodyEmphasis, color: colors.background, flexShrink: 1 },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  outlineButtonText: { ...typography.bodyEmphasis, color: colors.accent, textShadowColor: 'transparent', textShadowRadius: 0 },
  off: { opacity: 0.45 },
});
