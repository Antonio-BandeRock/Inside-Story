// Say Where Something Is, from the quick-access menu, 1.0.66.9 (2026-10-10).
// Direct request: "The Where is it needs a companion button. Where is it asks
// where something is that the app already knows the location because the
// person told the app. Where is it can only draw on what the user has told it
// about where something is located. We need a button for them to do that."
//
// Two boxes, what and where, and the places already written down offered as
// one tap each so the same cupboard is not spelt three ways. Saving goes
// through rememberWhere in lib/whereIsItDb.ts, which moves a thing Kitchen
// already has rather than making a second one.
//
// Not a Modal, for the same reason as AskRecordsSheet: the boxes are typed
// into with the drawn keyboard, which paints at the root. Mounted in
// app/_layout.tsx before AppKeyboard and placed just above the keyboard.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors } from '../constants/colors';
import { useFooterBandHeight, useHubMenuCardSpan, useMenuCardBottom } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import { explainNotYet } from '../lib/notYet';
import { announcePlaceSaved, subscribeQuickAccess } from '../lib/quickAccess';
import { PLACE_NAME_MAX, isPlaceNameUsable, suggestPlaces } from '../lib/whereIsIt';
import { listPlaceRecords, rememberWhere, type RememberedWhere } from '../lib/whereIsItDb';
import { AppTextInput } from './AppTextInput';
import { ThumbRow } from './ThumbRow';

export function SayWhereSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const footerHeight = useFooterBandHeight();
  const menuBottom = useMenuCardBottom();
  const { left, width } = useHubMenuCardSpan();
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState('');
  const [place, setPlace] = useState('');
  const [knownPlaces, setKnownPlaces] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<RememberedWhere | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  function startOver() {
    setWhat('');
    setPlace('');
    setSaved(null);
    setFailed(null);
    listPlaceRecords()
      .then((records) => setKnownPlaces(suggestPlaces(records, 8)))
      .catch(() => setKnownPlaces([]));
  }

  useEffect(
    () =>
      subscribeQuickAccess((sheet) => {
        if (sheet !== 'sayWhere') return;
        startOver();
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  if (!open) return null;

  const bottom = isDesktopApp() ? menuBottom : footerHeight + KEYBOARD_HEIGHT + 8;
  const maxHeight = Math.max(160, windowHeight - bottom - insets.top - 16);

  async function save() {
    if (saving) return;
    if (!what.trim()) {
      explainNotYet('Say what the thing is first, in the top box.');
      return;
    }
    if (!isPlaceNameUsable(place)) {
      explainNotYet('Say where it is, in the second box, or pick one of the places below it.');
      return;
    }
    setSaving(true);
    setFailed(null);
    try {
      const result = await rememberWhere(what, place);
      if (result) {
        setSaved(result);
        announcePlaceSaved();
      }
    } catch (error) {
      setFailed(error instanceof Error && error.message ? error.message : 'That could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function openWhereIsIt() {
    setOpen(false);
    router.push('/where-is-it');
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={() => setOpen(false)} accessible={false} />
      <View style={[styles.sheet, { left, width, bottom, maxHeight }]}>
        <View style={styles.titleRow}>
          <Ionicons name="pin-outline" size={20} color={colors.textPrimary} style={textShadow} />
          <Text style={styles.title}>Say Where Something Is</Text>
        </View>
        {saved ? (
          <>
            <Text style={styles.body}>
              {saved.kind === 'moved'
                ? `${saved.what} is now down as ${saved.place}, in place of where it was before.`
                : `${saved.what} is written down as ${saved.place}. Where Is It will find it there.`}
            </Text>
            <ThumbRow primary="first" style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setOpen(false)}>
                <Text style={styles.primaryText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={startOver}>
                <Text style={styles.secondaryText}>Another</Text>
              </TouchableOpacity>
            </ThumbRow>
          </>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.caption}>
                Where Is It can only answer with what you have told it. Say what the thing is and where you put it.
              </Text>
              <AppTextInput
                style={styles.input}
                placeholder="What is it? (spare keys)"
                placeholderTextColor={colors.textMuted}
                value={what}
                onChangeText={setWhat}
                autoFocus
                disableKeyboardLift
              />
              <AppTextInput
                style={styles.input}
                placeholder="Where is it? (hall cupboard)"
                placeholderTextColor={colors.textMuted}
                value={place}
                onChangeText={setPlace}
                maxLength={PLACE_NAME_MAX}
                returnKeyType="done"
                onSubmitEditing={() => void save()}
                disableKeyboardLift
              />
              {knownPlaces.length > 0 ? (
                <View style={styles.chips}>
                  {knownPlaces.map((known) => (
                    <TouchableOpacity key={known} style={styles.chip} activeOpacity={0.8} onPress={() => setPlace(known)}>
                      <Text style={styles.chipText}>{known}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {failed ? <Text style={styles.failed}>{failed}</Text> : null}
            </ScrollView>
            <ThumbRow primary="last" style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={openWhereIsIt}>
                <Text style={styles.secondaryText}>Where Is It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                disabled={saving}
                onPress={() => void save()}
              >
                <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </ThumbRow>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.bodyEmphasis, fontSize: 16, fontWeight: '400', color: colors.textPrimary, ...textShadow },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: 10 },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  body: { ...typography.body, color: colors.textPrimary, ...textShadow },
  failed: { ...typography.caption, color: colors.accent, ...textShadow },
  input: {
    ...typography.body,
    ...textShadow,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  primaryText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
});
