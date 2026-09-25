// Walk me through it (1.0.51.10): the strip at the top of every screen while
// somebody does one guide step. Mounted once at the app root beside
// StoryReturnHost and rendering nothing unless a walk is under way. Every
// decision (which line, when it moves on) is in lib/storyWalk.ts; this file
// watches where the person is and whether the record has appeared.
//
// Hidden on the Your Story page, where the guide itself is on screen; the
// walk carries on the moment they leave it again.
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getStoryReturn, setStoryReturn, storyReturnTarget } from '../lib/storyReturn';
import {
  WALK_BACK_LABEL,
  WALK_CAPTION,
  WALK_CLOSE_LABEL,
  WALK_GROW_LABEL,
  WALK_SHRINK_LABEL,
  WALK_NEXT_LABEL,
  WALK_NO_RECORD_LINE,
  WALK_SAVED_LINE,
  WALK_STOP_LABEL,
  WALK_STORY_LABEL,
  WALK_WAITING_LINE,
  canStepBack,
  getStoryWalk,
  setStoryWalk,
  subscribeStoryWalk,
  walkBack,
  walkEntry,
  walkNext,
  walkPosition,
  walkSteps,
  type StoryWalk,
  type WalkPoint,
} from '../lib/storyWalk';
import { currentTellClaudeScreen, subscribeTellClaudeScreen, type TellClaudeScreen } from '../lib/tellClaude';
import { loadYourStoryWithGuides } from '../lib/yourStoryDb';

// How often the record is looked for while a walk waits on it.
const RECORD_CHECK_MS = 6000;

export function useStoryWalk(): StoryWalk | null {
  const [walk, setWalk] = useState<StoryWalk | null>(getStoryWalk);
  useEffect(() => {
    setWalk(getStoryWalk());
    return subscribeStoryWalk(setWalk);
  }, []);
  return walk;
}

function useReportedScreen(): TellClaudeScreen {
  const [screen, setScreen] = useState<TellClaudeScreen>(currentTellClaudeScreen);
  useEffect(() => {
    setScreen(currentTellClaudeScreen());
    return subscribeTellClaudeScreen(setScreen);
  }, []);
  return screen;
}

function pointIcon(point: WalkPoint): { name: ComponentProps<typeof Ionicons>['name']; turn: string } | null {
  if (point === 'hub') return { name: 'arrow-down', turn: '0deg' };
  if (point === 'corner') return { name: 'arrow-down', turn: '45deg' };
  if (point === 'bookmarks') return { name: 'arrow-down', turn: '20deg' };
  return null;
}

export function StoryWalkHost() {
  const walk = useStoryWalk();
  const pathname = usePathname();
  const screen = useReportedScreen();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  // Folded to its one line, so whatever sits at the top of the screen can
  // be reached; the line itself still changes as the person moves.
  const [small, setSmall] = useState(false);

  const entry = walk ? walkEntry(walk) : null;
  const steps = useMemo(() => (entry ? walkSteps(entry) : []), [entry]);
  const walkKey = walk ? `${walk.guide}:${walk.entryKey}` : null;

  useEffect(() => {
    setSaved(false);
    setSmall(false);
  }, [walkKey]);

  // The walk finishes when the record appears, looked for on every move and
  // every few seconds while it waits.
  const checkRecord = useCallback(async () => {
    const now = getStoryWalk();
    if (!now || now.startedDone) return;
    const found = walkEntry(now);
    if (!found || (!found.item && !found.record)) return;
    try {
      const { guides } = await loadYourStoryWithGuides();
      const state = guides.find((guide) => guide.def.key === now.guide)?.entries.find((view) => view.entry.key === now.entryKey)?.state;
      const still = getStoryWalk();
      if (state === 'done' && still && still.guide === now.guide && still.entryKey === now.entryKey) setSaved(true);
    } catch (error) {
      console.warn('Walk me through it: record check failed', error);
    }
  }, []);

  useEffect(() => {
    if (!walkKey || saved) return;
    void checkRecord();
    const timer = setInterval(() => void checkRecord(), RECORD_CHECK_MS);
    return () => clearInterval(timer);
  }, [walkKey, saved, pathname, checkRecord]);

  if (!walk || !entry || pathname === '/your-story') return null;

  const place = { pathname, tab: screen.tab, lens: screen.lens };
  const at = walkPosition(steps, walk.cursor, walk.skipped, place);
  const step = at < steps.length ? steps[at] : null;
  const waits = !walk.startedDone && !!(entry.item || entry.record);

  const stop = () => setStoryWalk(null);
  const toStory = () => {
    const origin = getStoryReturn()?.origin ?? { kind: 'page' as const, guide: walk.guide };
    setStoryWalk(null);
    setStoryReturn(null);
    const target = storyReturnTarget(origin);
    router.navigate({ pathname: target.pathname, params: target.params } as Href);
  };

  let say: string;
  let after: string | null = null;
  if (saved) {
    say = WALK_SAVED_LINE;
    after = entry.leadsTo ?? entry.forYou;
  } else if (step) {
    say = step.say;
  } else {
    say = waits ? WALK_WAITING_LINE : WALK_NO_RECORD_LINE;
  }
  const arrow = !saved && step ? pointIcon(step.point) : null;
  const finished = saved || (!step && !waits);

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { top: insets.top + 6 }]}>
      <View style={styles.strip} accessibilityLiveRegion="polite">
        {small ? null : (
          <Text style={styles.caption} numberOfLines={2}>
            {WALK_CAPTION}: {entry.doThis}
          </Text>
        )}
        <View style={styles.sayRow}>
          {arrow ? (
            <Ionicons
              name={arrow.name}
              size={20}
              color={colors.primary}
              style={[textShadow, { transform: [{ rotate: arrow.turn }] }]}
            />
          ) : (
            <Ionicons
              name={saved ? 'checkmark-circle' : 'footsteps-outline'}
              size={18}
              color={colors.primary}
              style={textShadow}
            />
          )}
          <Text style={styles.say} numberOfLines={small ? 2 : undefined}>
            {say}
          </Text>
          <TouchableOpacity
            onPress={() => setSmall((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={small ? WALK_GROW_LABEL : WALK_SHRINK_LABEL}
            hitSlop={10}
          >
            <Ionicons name={small ? 'chevron-down' : 'chevron-up'} size={18} color={colors.primary} style={textShadow} />
          </TouchableOpacity>
        </View>
        {after && !small ? <Text style={styles.after}>{after}</Text> : null}
        {small ? null : (
          <View style={styles.actions}>
            {!saved && step && canStepBack(steps, at) ? (
              <WalkButton icon="arrow-back" label={WALK_BACK_LABEL} onPress={() => setStoryWalk(walkBack(walk, at))} />
            ) : null}
            {!saved && step ? (
              <WalkButton
                icon="arrow-forward"
                label={WALK_NEXT_LABEL}
                onPress={() => setStoryWalk(walkNext(walk, steps, at))}
              />
            ) : null}
            <WalkButton icon="book-outline" label={WALK_STORY_LABEL} onPress={toStory} />
            <WalkButton icon="close" label={finished ? WALK_CLOSE_LABEL : WALK_STOP_LABEL} onPress={stop} />
          </View>
        )}
      </View>
    </View>
  );
}

function WalkButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={14} color={colors.primary} style={textShadow} />
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 12, right: 12 },
  strip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow },
  sayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  say: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  after: { ...typography.body, color: colors.textSecondary, ...textShadow },
  actions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  buttonText: { ...typography.body, color: colors.primary, ...textShadow },
});
