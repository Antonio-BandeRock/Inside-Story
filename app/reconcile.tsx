// Reconciliation, 1.0.39.15. Direct instruction:
//
//   "The Capture band needs to have a Reconciliation function for them to be
//   able to get to the list of their thoughts so they can be named,
//   categorized and scheduled or whatever needs to be done to them. The same
//   needs to apply for tasks and whether or not they actually ate and drank
//   the amounts that were scheduled, or if they were skipped, or rescheduled,
//   or replaced, etc. All of this needs to be very quick action capable for
//   each thing."
//
// One screen for every loose end at once. A thought written down at a red
// light and a breakfast whose time came and went are the same kind of thing:
// something that needs a second of attention and has not had it. Until now
// they lived in different places, and one of them lived nowhere at all.
//
// Three sections, in the order somebody can actually answer them:
//
//   1. Thoughts. What is sitting in the capture inbox, with the naming,
//      categorizing and day-picking all on the row itself. app/capture.tsx is
//      still the full inbox and this links to it; what is here is the part
//      that can be done without leaving.
//
//   2. What the app assumed. A scheduled meal whose time passed has been
//      recorded as eaten automatically since 2026-08-14, which is the right
//      default and was also, until now, unanswerable. These come back and ask.
//
//   3. What nobody has answered for. Everything still planned whose time has
//      gone, whatever it is: meals, drinks, doses, garden work, appointments
//      and now scheduled thoughts.
//
// Every answer is one tap. The wording, the statuses and where a "move it"
// chip lands are all in lib/reconciliation.ts, which has no database and no
// colours in it so scripts/test_reconciliation.js can check the rules without
// a phone. This file resolves them against real rows and paints them.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import {
  CAPTURE_DESTINATIONS,
  captureDestination,
  describeCaptureAge,
  MAX_CAPTURE_LENGTH,
  type CaptureDestination,
  type CaptureDestinationKey,
  type CaptureNote,
} from '../lib/captureNotes';
import {
  listCaptureNotes,
  setCaptureNoteDestination,
  setCaptureNoteDone,
  updateCaptureNoteText,
} from '../lib/captureNotesDb';
import {
  correctAssumedScheduleItem,
  listAssumedScheduleItems,
  listOpenScheduleItems,
  moveScheduleItem,
  scheduleReminder,
  setScheduleItemStatus,
  type ScheduleItemRecord,
} from '../lib/db';
import {
  assumedActions,
  assumptionMustBeUndone,
  describeLateness,
  formatClock,
  groupReconcileItems,
  lookbackDateString,
  moveOptions,
  parseLocalDateTime,
  reconcileKindFor,
  RECONCILE_ACTIONS,
  RECONCILE_KIND_LABELS,
  scheduleStatusForOutcome,
  sortReconcileItems,
  thoughtTimeOptions,
  type ReconcileItem,
  type ReconcileKind,
  type ReconcileOutcome,
} from '../lib/reconciliation';

// Same resolution app/capture.tsx makes: a destination wears the colour and
// the icon of the tab it hands off to, so the pills read as the place before
// the word is read at all.
function destinationColor(destination: CaptureDestination): string {
  if (!destination.tabPath) return colors.primary;
  return TAB_ROUTES.find((route) => route.path === destination.tabPath)?.color ?? colors.primary;
}

const DESTINATION_ICONS: Record<CaptureDestinationKey, ComponentProps<typeof Ionicons>['name']> = {
  calendar: 'calendar-outline',
  shopping: 'cart-outline',
  garden: 'leaf-outline',
  upkeep: 'construct-outline',
  money: 'wallet-outline',
  health: 'pulse-outline',
  thought: 'bulb-outline',
};

const KIND_ICONS: Record<ReconcileKind, ComponentProps<typeof Ionicons>['name']> = {
  meal: 'restaurant-outline',
  drink: 'water-outline',
  dose: 'medkit-outline',
  task: 'checkbox-outline',
  appointment: 'calendar-outline',
};

function toReconcileItem(record: ScheduleItemRecord): ReconcileItem {
  return {
    id: record.id,
    itemType: record.itemType,
    mealType: record.mealType,
    title: record.title,
    scheduledFor: record.scheduledFor,
    status: record.status,
  };
}

// Which row has its extra chips open. One at a time across the whole screen,
// the same rule app/capture.tsx follows for destination pills: a second open
// row turns a list of one-tap answers into a wall of them.
type OpenRow = { id: string; mode: 'move' | 'when' | 'where' } | null;

export default function ReconcileScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [open, setOpen] = useState<ScheduleItemRecord[]>([]);
  const [assumed, setAssumed] = useState<ScheduleItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<OpenRow>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const refresh = useCallback(async () => {
    const fromDate = lookbackDateString(new Date());
    const [captured, openItems, assumedItems] = await Promise.all([
      listCaptureNotes(),
      listOpenScheduleItems(fromDate),
      listAssumedScheduleItems(fromDate),
    ]);
    setNotes(captured.filter((note) => note.status !== 'done'));
    setOpen(openItems);
    setAssumed(assumedItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function toggleRow(id: string, mode: 'move' | 'when' | 'where') {
    setOpenRow(openRow && openRow.id === id && openRow.mode === mode ? null : { id, mode });
  }

  async function answer(item: ReconcileItem, outcome: ReconcileOutcome) {
    const kind = reconcileKindFor(item.itemType, item.mealType);
    setOpenRow(null);
    // "Ate something else" says so in the record in words, because the status
    // on its own cannot say what was eaten and this screen deliberately does
    // not ask. Whatever it was belongs in the Meals builder, where it gets
    // real components and real amounts, and the note is what points at the
    // gap rather than the app inventing a meal to fill it.
    const note = outcome === 'replaced' ? 'Something else was eaten instead of this.' : undefined;
    await setScheduleItemStatus(item.id, scheduleStatusForOutcome(kind, outcome), note);
    await refresh();
    if (outcome === 'replaced') {
      showInfoAlert(
        'Noted as replaced',
        'This one is marked as replaced rather than skipped, so the record does not say you went without eating. What you actually ate is not in here yet: add it in Food when you have a minute, and it will count towards the day.',
      );
    }
  }

  async function answerAssumed(item: ReconcileItem, outcome: ReconcileOutcome) {
    const kind = reconcileKindFor(item.itemType, item.mealType);
    setOpenRow(null);
    if (assumptionMustBeUndone(outcome)) {
      await correctAssumedScheduleItem(item.id, scheduleStatusForOutcome(kind, outcome));
      await refresh();
      showInfoAlert(
        'Taken back out',
        'The app had recorded this as eaten because its time passed and nothing said otherwise. That entry is gone now, so the day no longer counts food that was not eaten.',
      );
      return;
    }
    await setScheduleItemStatus(item.id, scheduleStatusForOutcome(kind, outcome));
    await refresh();
    if (outcome === 'partial') {
      showInfoAlert(
        'Marked as partly eaten',
        'The amounts stay exactly as they were planned, because nobody told the app how much was left and a figure nobody chose does not belong in the record. Open the meal in Food if you want to change what it counted.',
      );
    }
  }

  async function move(item: ReconcileItem, scheduledFor: string) {
    setOpenRow(null);
    await moveScheduleItem(item.id, scheduledFor);
    await refresh();
  }

  async function sortNote(note: CaptureNote, key: CaptureDestinationKey | null) {
    setOpenRow(null);
    await setCaptureNoteDestination(note.id, key);
    await refresh();
  }

  async function putNoteOnADay(note: CaptureNote, scheduledFor: string) {
    setOpenRow(null);
    await scheduleReminder({ title: note.text, scheduledFor });
    // The note itself is marked dealt with rather than deleted, so the words
    // somebody wrote at the time stay readable next to the reminder they
    // turned into. Nothing is consumed by being sorted here either.
    await setCaptureNoteDone(note.id, true);
    await refresh();
  }

  async function saveEdit(note: CaptureNote) {
    const ok = await updateCaptureNoteText(note.id, editingText);
    if (!ok) {
      showInfoAlert(
        'Nothing to keep',
        'A note needs at least a couple of characters. Open Capture if you want to delete it instead.',
      );
      return;
    }
    setEditingId(null);
    setEditingText('');
    await refresh();
  }

  const now = new Date();
  const openItems = sortReconcileItems(open.map(toReconcileItem));
  const assumedItems = sortReconcileItems(assumed.map(toReconcileItem));
  const groups = groupReconcileItems(openItems);
  const nothingLeft = !loading && notes.length === 0 && openItems.length === 0 && assumedItems.length === 0;

  function renderChips(item: ReconcileItem, actions: ReturnType<typeof assumedActions>, onPick: (outcome: ReconcileOutcome) => void) {
    return (
      <View style={styles.pillWrap}>
        {actions.map((action) => (
          <TouchableOpacity key={action.outcome} style={styles.answerPill} onPress={() => void onPick(action.outcome)}>
            <Text style={styles.answerPillText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.movePill} onPress={() => toggleRow(item.id, 'move')}>
          <Ionicons name="time-outline" size={14} color={colors.accent} />
          <Text style={styles.movePillText}>Move it</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderMoveRow(item: ReconcileItem) {
    if (!openRow || openRow.id !== item.id || openRow.mode !== 'move') return null;
    return (
      <View style={styles.pillWrap}>
        {moveOptions(item.scheduledFor, now).map((option) => (
          <TouchableOpacity key={option.key} style={styles.timePill} onPress={() => void move(item, option.scheduledFor)}>
            <Text style={styles.timePillText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderScheduleRow(item: ReconcileItem, mode: 'open' | 'assumed') {
    const kind = reconcileKindFor(item.itemType, item.mealType);
    const due = parseLocalDateTime(item.scheduledFor);
    return (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemHeadRow}>
          <Ionicons name={KIND_ICONS[kind]} size={16} color={colors.textSecondary} />
          <Text style={styles.itemTitle}>{item.title}</Text>
        </View>
        <Text style={styles.itemMeta}>
          {due ? `${formatClock(due)} · ` : ''}
          {describeLateness(item.scheduledFor, now)}
        </Text>
        {mode === 'assumed'
          ? renderChips(item, assumedActions(kind), (outcome) => void answerAssumed(item, outcome))
          : renderChips(item, RECONCILE_ACTIONS[kind], (outcome) => void answer(item, outcome))}
        {renderMoveRow(item)}
      </View>
    );
  }

  function renderNoteRow(note: CaptureNote) {
    const destination = captureDestination(note.destination);
    const editing = editingId === note.id;
    return (
      <View key={note.id} style={styles.itemCard}>
        {editing ? (
          <View style={styles.editRow}>
            <AppTextInput
              style={styles.editField}
              value={editingText}
              onChangeText={setEditingText}
              multiline
              autoFocus
              maxLength={MAX_CAPTURE_LENGTH}
              placeholder="What was it?"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => void saveEdit(note)} hitSlop={10} accessibilityLabel="Keep this wording">
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingId(null)} hitSlop={10} accessibilityLabel="Leave it as it was">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          // Tapping the words is how a note gets named properly, which is the
          // first of the three things asked for. No separate edit button: the
          // text is the target, the way it is in the inbox itself.
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setEditingId(note.id);
              setEditingText(note.text);
            }}
          >
            <Text style={styles.itemTitle}>{note.text}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.itemMetaRow}>
          {note.source === 'spoken' ? <Ionicons name="mic-outline" size={13} color={colors.textMuted} /> : null}
          <Text style={styles.itemMeta}>{describeCaptureAge(note.createdAt, now)}</Text>
          {destination ? (
            <Text style={[styles.itemMeta, { color: destinationColor(destination) }]}>· {destination.label}</Text>
          ) : null}
        </View>
        <View style={styles.pillWrap}>
          <TouchableOpacity style={styles.movePill} onPress={() => toggleRow(note.id, 'where')}>
            <Ionicons name="file-tray-outline" size={14} color={colors.accent} />
            <Text style={styles.movePillText}>{destination ? 'Somewhere else' : 'Where does it go?'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.movePill} onPress={() => toggleRow(note.id, 'when')}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <Text style={styles.movePillText}>Put it on a day</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.answerPill} onPress={() => void setCaptureNoteDone(note.id, true).then(refresh)}>
            <Text style={styles.answerPillText}>Dealt with</Text>
          </TouchableOpacity>
        </View>
        {openRow && openRow.id === note.id && openRow.mode === 'where' ? (
          <View style={styles.pillWrap}>
            {CAPTURE_DESTINATIONS.map((option) => {
              const active = note.destination === option.key;
              const color = destinationColor(option);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.pill, { borderColor: color }, active ? { backgroundColor: color } : null]}
                  onPress={() => void sortNote(note, active ? null : option.key)}
                  onLongPress={() => showInfoAlert(option.label, option.hint)}
                >
                  <Ionicons name={DESTINATION_ICONS[option.key]} size={14} color={active ? colors.background : color} />
                  <Text style={[styles.pillText, { color: active ? colors.background : color }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        {openRow && openRow.id === note.id && openRow.mode === 'when' ? (
          <View>
            <View style={styles.pillWrap}>
              {thoughtTimeOptions(now).map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.timePill}
                  onPress={() => void putNoteOnADay(note, option.scheduledFor)}
                >
                  <Text style={styles.timePillText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Said out loud because it is the rule the whole capture inbox
                runs on: the app will not pick a day for you, and picking one
                here is the only thing that turns a note into something that
                comes back and asks. */}
            <Text style={styles.footnote}>
              Picking one of these makes a reminder that will come and find you. Nothing gets a date until you choose
              it.
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Reconcile' }} />
      {infoAlertElement}
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.leadBox}>
          <Text style={styles.lead}>
            Everything waiting on a second of your attention, in one place. A week back, no further: anything older stays
            as it is rather than turning into a wall of questions nobody can answer.
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Looking…</Text>
          </View>
        ) : null}

        {nothingLeft ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nothing to sort out. Every thought has somewhere to be and everything that was planned has an answer.
            </Text>
          </View>
        ) : null}

        {notes.length > 0 ? (
          <>
            <View style={styles.sectionHeadingCard}>
              <Ionicons name="bulb-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.sectionHeading}>
                {notes.length === 1 ? '1 thought' : `${notes.length} thoughts`}
              </Text>
              <TouchableOpacity
                style={styles.headingLink}
                onPress={() => router.push('/capture' as Href)}
                hitSlop={8}
              >
                <Text style={styles.headingLinkText}>Full inbox</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} />
              </TouchableOpacity>
            </View>
            {notes.map((note) => renderNoteRow(note))}
          </>
        ) : null}

        {assumedItems.length > 0 ? (
          <>
            <View style={styles.sectionHeadingCard}>
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.sectionHeading}>Did these happen?</Text>
            </View>
            {/* The honest version of a default that has been in the app since
                2026-08-14. Somebody reading Trends deserves to know which
                numbers came from them and which came from the plan. */}
            <View style={styles.leadBox}>
              <Text style={styles.footnote}>
                The app recorded these as done because their time passed and nothing said otherwise. Say so if one of them
                did not happen, and it comes back out of your totals.
              </Text>
            </View>
            {assumedItems.map((item) => renderScheduleRow(item, 'assumed'))}
          </>
        ) : null}

        {groups.map((group) => (
          <View key={group.kind} style={styles.groupBlock}>
            <View style={styles.sectionHeadingCard}>
              <Ionicons name={KIND_ICONS[group.kind]} size={16} color={colors.textPrimary} />
              <Text style={styles.sectionHeading}>{RECONCILE_KIND_LABELS[group.kind]}</Text>
              <Text style={styles.sectionCount}>{group.items.length}</Text>
            </View>
            {group.items.map((item) => renderScheduleRow(item, 'open'))}
          </View>
        ))}

        {!loading && openItems.length > 0 ? (
          <View style={styles.leadBox}>
            <Text style={styles.footnote}>
              Moving something changes when it is due and nothing else. It stays planned, so it will show up and remind
              you at the new time like anything else still ahead.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  // The lead and each footnote sit on a band of their own, since nothing
  // sits on the screen without a surface.
  leadBox: { ...homeBandStyle, borderColor: colors.tabLife, padding: HOME_BAND_CONTENT_PADDING },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  emptyCard: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  sectionHeadingCard: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, ...textShadow },
  sectionCount: { ...typography.caption, color: colors.textMuted, ...textShadow },
  headingLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headingLinkText: { ...typography.caption, color: colors.accent, ...textShadow },
  groupBlock: { gap: HOME_BAND_GAP },
  itemCard: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  itemHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  itemMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  // The answers themselves are filled, because they are the thing to tap.
  // Everything that opens another row of choices is outlined, so a chip that
  // settles something never looks like a chip that asks something.
  answerPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  answerPillText: { ...typography.caption, color: colors.background },
  movePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceMuted,
  },
  movePillText: { ...typography.caption, color: colors.accent },
  timePill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  timePillText: { ...typography.caption, color: colors.textPrimary },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { ...typography.caption },
  editRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  editField: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    textAlignVertical: 'top',
    ...textShadow,
  },
  footnote: { ...typography.caption, color: colors.textMuted, ...textShadow },
});
