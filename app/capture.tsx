// The capture inbox, 2026-09-16. Direct instruction, the second half of the
// day's request: "then the capture inbox."
//
// What it is for, in the tracker row's own words: this app has plenty of
// places to PUT a thing and nowhere to THROW one. Every capture path already
// built knows what kind of thing it is receiving before it starts. Log Again
// knows it is a meal. The scanner knows it is a product. Say What You Ate
// knows it is food. This one must not know anything, because "call the
// dentist", "buy filters" and "Juan's birthday Friday" are not the same kind
// of thing and deciding which is which is exactly what stops a thought from
// ever getting written down.
//
// Two rules shape the screen:
//
//   1. The bar is a sticky note. Open, speak or type, done. The field is
//      focused on arrival, the microphone starts on its own when someone came
//      here to speak, and saving asks nothing else. If it is slower than
//      reaching for paper, nobody uses it, and that lands straight on the
//      retention risk this brief names as risk #1.
//
//   2. Sorting never creates anything by itself. Sending a note to the garden
//      opens Garden's own Upcoming Tasks; it does not invent a task with a
//      date nobody picked. A garden task needs a day, an upkeep item needs a
//      cadence, a bill needs a rule, and a five-word note carries none of
//      them. Guessing would put figures nobody chose into the record, which is
//      the same refusal lib/quickLog.ts makes about an amount it cannot
//      honestly resolve.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import {
  CAPTURE_DESTINATIONS,
  captureDestination,
  cleanCaptureText,
  countCaptureNotes,
  describeCaptureAge,
  groupSortedByDestination,
  isCaptureTextUsable,
  MAX_CAPTURE_LENGTH,
  type CaptureDestination,
  type CaptureDestinationKey,
  type CaptureNote,
} from '../lib/captureNotes';
import {
  createCaptureNote,
  deleteCaptureNote,
  listCaptureNotes,
  setCaptureNoteDestination,
  setCaptureNoteDone,
  updateCaptureNoteText,
} from '../lib/captureNotesDb';
import { useWalkMark } from '../components/WalkMark';

// A destination wears the colour and icon of the tab it hands off to, rather
// than a palette invented here, so "In the garden" reads as Garden before the
// word is read at all. A thought kept as a thought belongs to no tab and gets
// the app's own primary.
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
  place: 'location-outline',
  thought: 'bulb-outline',
};

export default function CaptureScreen() {
  // The outline on a button a Your Story walk line names (components/WalkMark.ts).
  const walkMark = useWalkMark();
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // speak=1 means the person already chose voice one screen earlier (the Home
  // card's own "Say it"), so the microphone starts itself rather than making
  // them tap a second time to begin. Same reasoning as VoiceInputButton's own
  // autoStart prop, which is what carries it.
  const { speak } = useLocalSearchParams<{ speak?: string }>();
  const startListening = speak === '1';

  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // The note whose destination pills are open. One at a time: seven pills
  // under every row at once would be a wall.
  const [sortingId, setSortingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showDone, setShowDone] = useState(false);
  // Whether the last thing typed came from the microphone, so the saved note
  // records how it arrived. Reset on every manual keystroke.
  const spokenRef = useRef(false);

  const refresh = useCallback(async () => {
    const rows = await listCaptureNotes();
    setNotes(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save() {
    const text = cleanCaptureText(draft);
    if (!isCaptureTextUsable(text) || saving) return;
    setSaving(true);
    const id = await createCaptureNote(text, spokenRef.current ? 'spoken' : 'typed');
    setSaving(false);
    if (!id) return;
    setDraft('');
    spokenRef.current = false;
    await refresh();
  }

  async function sortNote(note: CaptureNote, key: CaptureDestinationKey | null) {
    setSortingId(null);
    await setCaptureNoteDestination(note.id, key);
    await refresh();
  }

  async function toggleDone(note: CaptureNote) {
    await setCaptureNoteDone(note.id, note.status !== 'done');
    await refresh();
  }

  async function removeNote(note: CaptureNote) {
    await deleteCaptureNote(note.id);
    await refresh();
  }

  async function saveEdit(note: CaptureNote) {
    const ok = await updateCaptureNoteText(note.id, editingText);
    if (!ok) {
      showInfoAlert(
        'Nothing to keep',
        'A note needs at least a couple of characters. Delete it instead if it was written by mistake.',
      );
      return;
    }
    setEditingId(null);
    setEditingText('');
    await refresh();
  }

  function openDestination(destination: CaptureDestination) {
    if (!destination.open) return;
    const { pathname, params } = destination.open;
    router.push(params ? ({ pathname, params } as Href) : (pathname as Href));
  }

  const counts = countCaptureNotes(notes);
  const waiting = notes.filter((note) => note.status === 'waiting');
  const sortedGroups = groupSortedByDestination(notes);
  const done = notes.filter((note) => note.status === 'done');
  const now = new Date();

  function renderNoteRow(note: CaptureNote) {
    const destination = captureDestination(note.destination);
    const editing = editingId === note.id;
    return (
      <View key={note.id} style={styles.noteCard}>
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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setEditingId(note.id);
              setEditingText(note.text);
            }}
          >
            <Text style={[styles.noteText, note.status === 'done' ? styles.noteTextDone : null]}>{note.text}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.noteMetaRow}>
          {note.source === 'spoken' ? (
            <Ionicons name="mic-outline" size={13} color={colors.textMuted} />
          ) : null}
          <Text style={styles.noteMeta}>{describeCaptureAge(note.createdAt, now)}</Text>
        </View>
        <View style={styles.noteActionRow}>
          {note.status !== 'done' ? (
            <TouchableOpacity
              style={styles.noteAction}
              onPress={() => setSortingId(sortingId === note.id ? null : note.id)}
            >
              <Ionicons name="file-tray-outline" size={15} color={colors.accent} />
              <Text style={styles.noteActionText}>{destination ? 'Move it' : 'Where does it go?'}</Text>
            </TouchableOpacity>
          ) : null}
          {destination?.open ? (
            <TouchableOpacity style={styles.noteAction} onPress={() => openDestination(destination)}>
              <Ionicons name="open-outline" size={15} color={destinationColor(destination)} />
              <Text style={[styles.noteActionText, { color: destinationColor(destination) }]}>
                Open {destination.label.replace(/^(On the |In the |To )/, '')}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.noteAction} onPress={() => void toggleDone(note)}>
            <Ionicons
              name={note.status === 'done' ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
              size={15}
              color={colors.primary}
            />
            <Text style={[styles.noteActionText, { color: colors.primary }]}>
              {note.status === 'done' ? 'Put it back' : 'Done'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noteAction} onPress={() => void removeNote(note)}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.noteActionText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
        {sortingId === note.id ? (
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
                  <Ionicons
                    name={DESTINATION_ICONS[option.key]}
                    size={14}
                    color={active ? colors.background : color}
                  />
                  <Text style={[styles.pillText, { color: active ? colors.background : color }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Capture' }} />
      {infoAlertElement}
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.leadBox}>
          <Text style={styles.lead}>
            Get it out of your head first. What it turns out to be can wait until you have a minute.
          </Text>
        </View>

        <View style={styles.captureCard}>
          <View style={styles.captureRow}>
            <AppTextInput
              style={[styles.captureField, walkMark('capture.box')]}
              value={draft}
              onChangeText={(text) => {
                spokenRef.current = false;
                setDraft(text);
              }}
              placeholder="Call the dentist"
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus={!startListening}
              maxLength={MAX_CAPTURE_LENGTH}
            />
            <VoiceInputButton
              size={24}
              color={colors.accent}
              autoStart={startListening}
              onResult={(transcript, isFinal) => {
                // Every result, partial included, so the words appear while
                // they are being said. The same shape a search box uses; see
                // VoiceInputButton's own header comment.
                spokenRef.current = true;
                setDraft(transcript);
                if (isFinal && isCaptureTextUsable(transcript)) {
                  // Nothing is saved from speech without the words being on
                  // screen first, but once they are there and the person has
                  // stopped talking, there is nothing left to decide.
                  setDraft(cleanCaptureText(transcript));
                }
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, !isCaptureTextUsable(draft) ? styles.saveButtonOff : null]}
            onPress={() => void save()}
            disabled={!isCaptureTextUsable(draft) || saving}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color={colors.background} />
            <Text style={styles.saveButtonText}>{saving ? 'Keeping it…' : 'Throw it in'}</Text>
          </TouchableOpacity>
          <Text style={styles.privacyNote}>
            Speech is turned into words by your phone, and the note stays on it. See Profile for what your phone does
            with dictation.
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Looking…</Text>
          </View>
        ) : null}

        {!loading && counts.waiting === 0 && counts.sorted === 0 && done.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nothing in here. That is the normal state: this fills up when something occurs to you at the wrong
              moment, and empties when you get to it.
            </Text>
          </View>
        ) : null}

        {waiting.length > 0 ? (
          <View style={styles.sectionHeadingCard}>
            <Ionicons name="file-tray-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.sectionHeading}>
              {waiting.length === 1 ? '1 thing waiting' : `${waiting.length} things waiting`}
            </Text>
          </View>
        ) : null}
        {waiting.map((note) => renderNoteRow(note))}

        {sortedGroups.map((group) => (
          <View key={group.destination.key} style={styles.groupBlock}>
            <View style={[styles.sectionHeadingCard, { borderColor: destinationColor(group.destination) }]}>
              <Ionicons
                name={DESTINATION_ICONS[group.destination.key]}
                size={16}
                color={destinationColor(group.destination)}
              />
              <Text style={styles.sectionHeading}>{group.destination.label}</Text>
              {group.destination.open ? (
                <TouchableOpacity
                  style={styles.groupOpen}
                  onPress={() => openDestination(group.destination)}
                  hitSlop={8}
                >
                  <Text style={[styles.groupOpenText, { color: destinationColor(group.destination) }]}>Open</Text>
                  <Ionicons name="chevron-forward" size={14} color={destinationColor(group.destination)} />
                </TouchableOpacity>
              ) : null}
            </View>
            {group.notes.map((note) => renderNoteRow(note))}
          </View>
        ))}

        {done.length > 0 ? (
          <TouchableOpacity style={styles.sectionHeadingCard} onPress={() => setShowDone(!showDone)} activeOpacity={0.8}>
            <Ionicons name={showDone ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textMuted} />
            <Text style={styles.sectionHeading}>
              {done.length === 1 ? '1 dealt with' : `${done.length} dealt with`}
            </Text>
          </TouchableOpacity>
        ) : null}
        {showDone ? done.map((note) => renderNoteRow(note)) : null}

        {done.length > 0 && showDone ? (
          <View style={styles.leadBox}>
            <Text style={styles.footnote}>
              Notes you have finished with stay here for two months, so you can see what keeps coming back.
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
  // The lead and the footnote each sit on a band of their own, since nothing
  // sits on the screen without a surface.
  leadBox: { ...homeBandStyle, borderColor: colors.tabLife, padding: HOME_BAND_CONTENT_PADDING },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  captureCard: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  captureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  captureField: {
    flex: 1,
    minHeight: 64,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    ...textShadow,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  saveButtonOff: { opacity: 0.45 },
  saveButtonText: { ...typography.bodyEmphasis, color: colors.background },
  privacyNote: { ...typography.caption, color: colors.textMuted, ...textShadow },
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
  groupBlock: { gap: HOME_BAND_GAP },
  groupOpen: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  groupOpenText: { ...typography.caption, ...textShadow },
  noteCard: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  noteText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  noteTextDone: { color: colors.textMuted },
  noteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noteMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  noteActionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  noteAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noteActionText: { ...typography.caption, color: colors.accent, ...textShadow },
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
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
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
  footnote: { ...typography.caption, color: colors.textMuted, ...textShadow },
});
