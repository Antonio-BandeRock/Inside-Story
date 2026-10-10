// Ask Your Records from the quick-access menu, 1.0.66.6 (2026-10-10). Direct
// request: "Let's change Where is it and Ask Your Records from being on the
// Home screen to being quick access buttons on the navigation hand side."
// The Home card it replaces (C22, 2026-09-30) is gone; what it did is the same.
//
// The box answers nothing itself: lib/askRecords.ts reads the words and names
// the one to three places that can show the answer, so every answer is the one
// that place already gives, with the counts and limits it already states.
//
// Not a Modal, because the box is typed into with the drawn keyboard
// (components/AppKeyboard.tsx), which paints at the root and would sit under a
// Modal's window. Mounted in app/_layout.tsx before AppKeyboard, the way Tell
// Claude's sheet is, and on a phone placed just above the keyboard's top edge.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors } from '../constants/colors';
import { useFooterBandHeight, useHubMenuCardSpan, useMenuCardBottom } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { routeQuestion, type AskAnswer } from '../lib/askRecords';
import { isDesktopApp } from '../lib/desktop/bridge';
import { subscribeQuickAccess } from '../lib/quickAccess';
import { AppTextInput } from './AppTextInput';

export function AskRecordsSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const footerHeight = useFooterBandHeight();
  const menuBottom = useMenuCardBottom();
  const { left, width } = useHubMenuCardSpan();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const answers = useMemo(() => routeQuestion(question), [question]);

  useEffect(
    () =>
      subscribeQuickAccess((sheet) => {
        if (sheet !== 'askRecords') return;
        setQuestion('');
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

  function openAnswer(answer: AskAnswer) {
    setOpen(false);
    const target = answer.target;
    if (target.kind === 'trends') {
      router.push({
        pathname: '/trends',
        params: target.range ? { openTrendsLens: target.lens, openTrendsRange: target.range } : { openTrendsLens: target.lens },
      });
    } else if (target.kind === 'whereIsIt') {
      router.push({ pathname: '/where-is-it', params: { q: target.query } });
    } else {
      router.push({ pathname: '/life', params: { openLifeLens: 'searchReading', searchQuery: target.query } });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={() => setOpen(false)} accessible={false} />
      <View style={[styles.sheet, { left, width, bottom, maxHeight }]}>
        <View style={styles.titleRow}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} style={textShadow} />
          <Text style={styles.title}>Ask Your Records</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.caption}>
            Ask the way you would say it, and this names the places that can show you. It works out nothing on its own.
          </Text>
          <AppTextInput
            style={styles.input}
            placeholder="What did I eat before my last flare?"
            value={question}
            onChangeText={setQuestion}
            returnKeyType="search"
            autoFocus
            disableKeyboardLift
          />
          {answers.map((answer) => (
            <TouchableOpacity key={answer.label} style={styles.answerRow} onPress={() => openAnswer(answer)} activeOpacity={0.8}>
              <View style={styles.answerText}>
                <Text style={styles.answerLabel}>{answer.label}</Text>
                <Text style={styles.caption}>{answer.caption}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} activeOpacity={0.85} onPress={() => setOpen(false)}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
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
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  answerText: { flex: 1, gap: 2 },
  answerLabel: { ...typography.bodyEmphasis, ...textShadow, color: colors.textPrimary },
  closeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
