// Tell Claude: the button, the sheet a note is typed into, and the editor
// for changing words in place.
//
// Mounted once at the app root (app/_layout.tsx) and rendering nothing at
// all while the Profile switch is off, which is how it sits for anybody but
// the person building this app. lib/devNotes.ts holds the shape of a note
// and the reasoning behind the whole thing, lib/devNotesDb.ts the reading
// and writing, lib/tellClaude.ts how a long press on a band reaches here,
// and lib/wordingEdits.ts plus components/EditableText.tsx how a tap on
// words reaches the editor.
//
// Three ways in. A long press on any fold band (components/TabBand.tsx)
// anchors a note to that band, so a form with six steps inside one band is
// one note covering all six. The button covers everything outside a band:
// Home, where a long press is already how sections are rearranged, and the
// Windows app, where "I cannot do a long press on so we need a button." And
// since 1.0.51.12 the button offers Edit wording, which underlines every
// piece of text on screen; tapping any of it opens a small editor holding
// those exact words, placed so the words themselves stay in sight, which is
// what the note sheet could not do: "the window that opens covers all of the
// text on the screen."
//
// Deliberately NOT a Modal. AppKeyboard is a View this app draws at the
// root, and a Modal is a separate native window that would cover it, so a
// note would have nothing to type on. An absolute View mounted before
// AppKeyboard paints under it, which is the same reason OverlayRoot sits
// where it does.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { isDesktopApp } from '../lib/desktop/bridge';
import {
  DEV_NOTE_CAPTIONS,
  DEV_NOTE_KINDS,
  DEV_NOTE_LABELS,
  describeDevNoteWhere,
  describeWordingChange,
  devNoteProblem,
  wordingEditProblem,
} from '../lib/devNotes';
import type { DevNoteKind } from '../lib/devNotes';
import { addDevNote, reloadWordingEdits, syncDevNotes } from '../lib/devNotesDb';
import {
  currentTellClaudeScreen,
  registerTellClaudeOpener,
  setTellClaudeEnabled,
} from '../lib/tellClaude';
import type { TellClaudeTarget } from '../lib/tellClaude';
import {
  getWordingEditState,
  registerWordingTapHandler,
  setWordingEditMode,
  setWordingEditsAvailable,
  subscribeWordingEdits,
  type WordingTap,
} from '../lib/wordingEdits';
import { AppTextInput } from './AppTextInput';
import { PlainTextZone } from './EditableText';
import { useKeyboardLift } from './KeyboardLift';

type Open = {
  tab: string | null;
  lens: string | null;
  bandId: string | null;
  bandTitle: string | null;
};

// Room kept between the words being edited and the editor, and the editor's
// height before it has measured itself.
const WORDS_GAP = 12;
const EDITOR_HEIGHT_GUESS = 220;

export function TellClaudeHost() {
  const { developerNotes, developerNotesPreview } = useVisualPreferences();
  const [open, setOpen] = useState<Open | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState(getWordingEditState().editing);
  const [kind, setKind] = useState<DevNoteKind>('wording');
  const [body, setBody] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  // The one place the switch is read, published to lib/tellClaude.ts so a
  // band can ask without every band subscribing to the preferences, and to
  // lib/wordingEdits.ts so every piece of text can.
  useEffect(() => {
    setTellClaudeEnabled(developerNotes);
    setWordingEditsAvailable(developerNotes, developerNotesPreview);
    if (developerNotes) {
      reloadWordingEdits().catch((error) => console.error('[tellClaude] could not read the wording edits', error));
    }
  }, [developerNotes, developerNotesPreview]);

  useEffect(() => subscribeWordingEdits((state) => setEditing(state.editing)), []);

  const start = useCallback((target: TellClaudeTarget) => {
    const where = currentTellClaudeScreen();
    setChoosing(false);
    setOpen({
      tab: where.tab,
      lens: where.lens,
      bandId: target.bandId ?? null,
      bandTitle: target.bandTitle ?? null,
    });
    setKind('wording');
    setBody('');
    setProblem(null);
    setSaved(null);
  }, []);

  useEffect(() => registerTellClaudeOpener(start), [start]);

  if (!developerNotes) return null;

  async function save() {
    if (!open || saving) return;
    const wrong = devNoteProblem(body);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    setSaving(true);
    try {
      await addDevNote({ kind, body, ...open });
      // Straight out to the file, so a note is readable without waiting for
      // anything else to happen. A folder nobody has set up yet is not an
      // error here: the note is in the table either way, and the next sync
      // publishes whatever never reached the file.
      const result = await syncDevNotes();
      setSaved(result.problem ? 'Written down here. It will go out when the folder is reachable.' : 'Written down.');
    } catch (error) {
      console.error('[tellClaude] could not write the note', error);
      setSaved('Could not write that down.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PlainTextZone>
      {open || choosing ? null : editing ? (
        <TouchableOpacity
          style={[styles.button, styles.doneButton]}
          onPress={() => setWordingEditMode(false)}
          accessibilityLabel="Stop editing words"
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={16} color={colors.textOnPrimary} />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setChoosing(true)}
          accessibilityLabel="Tell Claude about this screen"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
      {choosing ? (
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChoosing(false)} />
          <View style={styles.card}>
            <Text style={styles.title}>Tell Claude</Text>
            <TouchableOpacity
              style={styles.choice}
              onPress={() => {
                setChoosing(false);
                setWordingEditMode(true);
              }}
            >
              <Text style={styles.choiceTitle}>Edit wording</Text>
              <Text style={styles.choiceCaption}>
                Every piece of text is underlined. Tap any of it to change the words right there, then tap Done
                against the left edge when you are finished.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choice} onPress={() => start({})}>
              <Text style={styles.choiceTitle}>Leave a note</Text>
              <Text style={styles.choiceCaption}>
                For anything that is not just the words: something missing, a step in the wrong order, something
                broken, an idea.
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setChoosing(false)} hitSlop={8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
      {open ? (
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
          <View style={styles.card}>
            <Text style={styles.title}>Tell Claude</Text>
            <Text style={styles.where}>{describeDevNoteWhere(open)}</Text>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {DEV_NOTE_KINDS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pill, kind === option ? styles.pillActive : null]}
                      onPress={() => setKind(option)}
                      hitSlop={6}
                    >
                      <Text style={[styles.pillText, kind === option ? styles.pillTextActive : null]}>
                        {DEV_NOTE_LABELS[option]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.caption}>{DEV_NOTE_CAPTIONS[kind]}</Text>
                <AppTextInput
                  style={styles.input}
                  value={body}
                  onChangeText={(text) => {
                    setBody(text);
                    setProblem(null);
                  }}
                  multiline
                  placeholder="What should change?"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                {problem ? <Text style={styles.error}>{problem}</Text> : null}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setOpen(null)} hitSlop={8}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.okButton} onPress={save} disabled={saving} hitSlop={8}>
                    <Text style={styles.okButtonText}>{saving ? 'Saving' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      ) : null}
      {editing ? <WordingEditor /> : null}
    </PlainTextZone>
  );
}

/**
 * The editor for words tapped in Edit wording mode. No backdrop, so the
 * screen stays readable around it. On a phone it sits just above the drawn
 * keyboard and the screen is lifted until the tapped words clear it; on the
 * Windows app, which has no drawn keyboard, it sits in whichever half of the
 * window the words are not in.
 */
function WordingEditor() {
  const [tap, setTap] = useState<WordingTap | null>(null);
  const [newText, setNewText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorHeight, setEditorHeight] = useState(EDITOR_HEIGHT_GUESS);
  const { liftFieldIntoView, releaseLift, getLift } = useKeyboardLift();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const footerBandHeight = useFooterBandHeight();
  const desktop = isDesktopApp();
  // The lift in force when the words were measured, so a later re-lift reads
  // their position the way computeNextLift expects it: as it is now.
  const liftAtTap = useRef(0);

  useEffect(
    () =>
      registerWordingTapHandler((next) => {
        liftAtTap.current = getLift();
        setTap(next);
        setNewText(next.shownText);
        setProblem(null);
      }),
    [getLift],
  );

  // Released when the editor goes, whichever way it goes.
  useEffect(() => () => releaseLift(), [releaseLift]);

  const keepWordsInSight = useCallback(() => {
    if (!tap || desktop) return;
    const wordsBottomNow = tap.bottom + liftAtTap.current - getLift();
    liftFieldIntoView(wordsBottomNow + editorHeight + WORDS_GAP);
  }, [tap, desktop, editorHeight, getLift, liftFieldIntoView]);

  useEffect(() => {
    keepWordsInSight();
  }, [keepWordsInSight]);

  if (!tap) return null;

  function close() {
    setTap(null);
    releaseLift();
  }

  async function record(wanted: string) {
    if (!tap || saving) return;
    setSaving(true);
    try {
      const where = currentTellClaudeScreen();
      await addDevNote({
        kind: 'wording',
        body: describeWordingChange(tap.originalText, wanted),
        tab: where.tab,
        lens: where.lens,
        bandId: null,
        bandTitle: null,
        originalText: tap.originalText,
        newText: wanted,
      });
      close();
      // Out to the file without holding the editor open for it. A folder
      // nobody has set up yet is not an error: the note is kept here and
      // goes out with the next sync.
      syncDevNotes().catch((error) => console.error('[tellClaude] could not send the notes', error));
    } catch (error) {
      console.error('[tellClaude] could not write the wording edit', error);
      setProblem('Could not write that down.');
    } finally {
      setSaving(false);
    }
  }

  function saveEdit() {
    if (!tap) return;
    const wrong = wordingEditProblem(tap.originalText, newText, tap.shownText);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    void record(newText);
  }

  const wordsInLowerHalf = tap.top > windowHeight / 2;
  const placement = desktop
    ? wordsInLowerHalf
      ? { top: insets.top + 16 }
      : { bottom: 24 }
    : { bottom: footerBandHeight + KEYBOARD_HEIGHT + 8 };
  const alreadyEdited = tap.shownText !== tap.originalText;

  return (
    <View
      style={[styles.editor, placement]}
      onLayout={(event) => setEditorHeight(Math.ceil(event.nativeEvent.layout.height))}
    >
      <Text style={styles.editorTitle}>Change these words</Text>
      {alreadyEdited ? <Text style={styles.editorCaption}>The app says: {tap.originalText}</Text> : null}
      <AppTextInput
        style={styles.editorInput}
        value={newText}
        onChangeText={(text) => {
          setNewText(text);
          setProblem(null);
        }}
        multiline
        autoFocus
        selectAllOnMount={false}
        disableKeyboardLift
        onFocus={keepWordsInSight}
      />
      {problem ? <Text style={styles.error}>{problem}</Text> : null}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={close} hitSlop={8}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        {alreadyEdited ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => void record(tap.originalText)}
            disabled={saving}
            hitSlop={8}
          >
            <Text style={styles.cancelButtonText}>Put Back</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.okButton} onPress={saveEdit} disabled={saving} hitSlop={8}>
          <Text style={styles.okButtonText}>{saving ? 'Saving' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Against the left edge at about mid-height, which is the one part of the
  // window nothing else in this app draws in: the hubs, the corner box and
  // the version number all cluster along the bottom, and every screen's own
  // header sits along the top. Small, and gone entirely when the switch is
  // off, so it costs the app nothing to carry.
  button: {
    position: 'absolute',
    left: 0,
    top: '45%',
    paddingVertical: 10,
    paddingLeft: 6,
    paddingRight: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
  },
  // The same spot while words are being edited, filled so it reads as the
  // way out rather than as the way in.
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneButtonText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
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
  choice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  choiceTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  choiceCaption: { ...typography.caption, color: colors.textSecondary, marginTop: 4, ...textShadow },
  editor: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignSelf: 'center',
    maxWidth: 560,
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
  },
  editorTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  editorCaption: { ...typography.caption, color: colors.textMuted, marginTop: 4, ...textShadow },
  editorInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    minHeight: 44,
    maxHeight: 140,
    textAlignVertical: 'top',
    ...textShadow,
  },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, fontSize: 18, ...textShadow },
  where: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: 12, ...textShadow },
  message: { ...typography.body, color: colors.textSecondary, marginTop: 6, ...textShadow },
  pillRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  pillTextActive: {
    color: colors.textOnPrimary,
    // Dark text: cancel the shadow the base style carries. See
    // constants/typography.ts.
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 10, marginBottom: 8, ...textShadow },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 96,
    textAlignVertical: 'top',
    ...textShadow,
  },
  error: { ...typography.caption, color: colors.danger, marginTop: 6, ...textShadow },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 14, justifyContent: 'flex-start' },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  okButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  okButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
