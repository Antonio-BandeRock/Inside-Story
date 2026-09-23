// Tell Claude: the button, and the sheet a note is typed into.
//
// Mounted once at the app root (app/_layout.tsx) and rendering nothing at
// all while the Profile switch is off, which is how it sits for anybody but
// the person building this app. lib/devNotes.ts holds the shape of a note
// and the reasoning behind the whole thing, lib/devNotesDb.ts the reading
// and writing, lib/tellClaude.ts how a long press on a band reaches here.
//
// Two ways in, because the request named both. A long press on any fold
// band (components/TabBand.tsx) anchors a note to that band, so a form with
// six steps inside one band is one note covering all six. The button covers
// everything outside a band: Home, where a long press is already how
// sections are rearranged, and the Windows app, where "I cannot do a long
// press on so we need a button."
//
// Deliberately NOT a Modal. AppKeyboard is a View this app draws at the
// root, and a Modal is a separate native window that would cover it, so a
// note would have nothing to type on. An absolute View mounted before
// AppKeyboard paints under it, which is the same reason OverlayRoot sits
// where it does.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import {
  DEV_NOTE_CAPTIONS,
  DEV_NOTE_KINDS,
  DEV_NOTE_LABELS,
  describeDevNoteWhere,
  devNoteProblem,
} from '../lib/devNotes';
import type { DevNoteKind } from '../lib/devNotes';
import { addDevNote, syncDevNotes } from '../lib/devNotesDb';
import {
  currentTellClaudeScreen,
  registerTellClaudeOpener,
  setTellClaudeEnabled,
} from '../lib/tellClaude';
import type { TellClaudeTarget } from '../lib/tellClaude';
import { AppTextInput } from './AppTextInput';

type Open = {
  tab: string | null;
  lens: string | null;
  bandId: string | null;
  bandTitle: string | null;
};

export function TellClaudeHost() {
  const { developerNotes } = useVisualPreferences();
  const [open, setOpen] = useState<Open | null>(null);
  const [kind, setKind] = useState<DevNoteKind>('wording');
  const [body, setBody] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  // The one place the switch is read, published to lib/tellClaude.ts so a
  // band can ask without every band subscribing to the preferences.
  useEffect(() => {
    setTellClaudeEnabled(developerNotes);
  }, [developerNotes]);

  const start = useCallback((target: TellClaudeTarget) => {
    const where = currentTellClaudeScreen();
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
    <>
      {open ? null : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => start({})}
          accessibilityLabel="Tell Claude about this screen"
          hitSlop={8}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
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
    </>
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
