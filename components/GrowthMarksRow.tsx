import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { ROW_EDGE_PADDING, TAB_MARK_ROUTES } from './TabPositionMark';
import { evaluateAchievementCriteria } from '../lib/achievementCriteria';
import { getGrowthVineState, type GrowthVineState, type LeafStage } from '../lib/growthVine';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Phase 2 of the header growth vine/Timeline plan (2026-08-21, see the
// Notion App Development Log and the "Header Vine, Timeline & Life" phased
// build plan). Fills the reserved band Phase 0 opened up under the tab
// mark (ScreenHeader's own GROWTH_MARKS_ROW_HEIGHT) with data-backed
// marks, one per tab, spread across the full width in tab order.
//
// Each mark sat directly under that tab's own dot until 1.0.39.13, when
// the row above became a single glyph for the tab you are standing on.
// There is nothing overhead to line up with any more, so this row keeps
// the ten slots on its own. It still reads TAB_MARK_ROUTES and
// ROW_EDGE_PADDING from TabPositionMark rather than keeping a second copy
// of that layout math, so the tab list and the edge inset stay one thing.
//
// Deliberately placeholder geometry, not real illustration -- "logic
// before art" (see the phased plan's own Phase 2/3 split). A circle
// growing through 3 sizes stands in for a leaf's own future growth
// stages; a small diamond stands in for fruit. Real leaf/fruit art
// (Phase 3) swaps in for these shapes without needing this file's own
// data flow or animation timing rebuilt.
//
// This is also the first real caller of evaluateAchievementCriteria
// (Phase 1 deliberately left it uncalled, "deciding when to check is
// Phase 2's own decision"). Runs once whenever the (tabs) group as a
// whole regains focus (same granularity ScreenHeader's own firstName
// fetch already uses, see that file's 2026-07-27 comment for why that's
// the right granularity for a header mounted once, not per-tab-swipe),
// not on a timer and not in the background -- background execution is
// throttled on both mobile OSes, the same constraint this app's reminder
// architecture already designs around.
export function GrowthMarksRow({ enabled }: { enabled: boolean }) {
  const [vineState, setVineState] = useState<GrowthVineState | null>(null);
  // 2026-09-16: a mark that has been earned still shows under its tab
  // with low stimulation on, it just appears rather than springing in.
  const reducedMotion = useReducedMotion();

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let isMounted = true;
      (async () => {
        await evaluateAchievementCriteria();
        const state = await getGrowthVineState();
        if (isMounted) setVineState(state);
      })().catch((error) => {
        // A failed check here must never take the header down with it --
        // this is a small ambient decoration, not core app function.
        console.error('[GrowthMarksRow] Failed to evaluate growth vine state', error);
      });
      return () => {
        isMounted = false;
      };
    }, [enabled]),
  );

  if (!enabled || !vineState) {
    // Renders nothing rather than a placeholder shimmer -- the space
    // itself stays reserved by ScreenHeader regardless (see
    // GROWTH_MARKS_ROW_HEIGHT there), so there's no layout jump, just an
    // empty band until the first real state resolves or while the
    // preference is off.
    return null;
  }

  return (
    <View style={styles.row} pointerEvents="none">
      {TAB_MARK_ROUTES.map((route) => {
        const tabState = vineState.perTab.find((state) => state.tab.toString() === route.path.toString());
        if (!tabState) return <View key={route.path.toString()} style={styles.slot} />;

        return (
          <View key={route.path.toString()} style={styles.slot}>
            {tabState.fruitStage === 'ripe' ? (
              <Animated.View
                key="fruit"
                entering={reducedMotion ? undefined : ZoomIn.springify()}
                style={[styles.fruit, { backgroundColor: FRUIT_PLACEHOLDER_COLOR }]}
              />
            ) : tabState.leafStage !== 'none' ? (
              <Animated.View
                key={tabState.leafStage}
                entering={reducedMotion ? undefined : ZoomIn.springify()}
                style={[
                  styles.leaf,
                  LEAF_STAGE_SIZE[tabState.leafStage],
                  { backgroundColor: route.color },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// Placeholder only -- a real material/metallic treatment for fruit
// (distinct from the tab-jewel-tone leaves, see the original brainstorm's
// own "color always means type... a different visual family entirely"
// reasoning) is Phase 3's job, not guessed at with a real hex value here.
const FRUIT_PLACEHOLDER_COLOR = '#C9A227';

const LEAF_STAGE_SIZE: Partial<Record<LeafStage, { width: number; height: number; borderRadius: number }>> = {
  sprout: { width: 4, height: 4, borderRadius: 2 },
  growing: { width: 7, height: 7, borderRadius: 3.5 },
  full: { width: 10, height: 10, borderRadius: 5 },
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ROW_EDGE_PADDING,
  },
  // A fixed-width slot per tab, so a mark holds its place in the row
  // rather than drifting sideways as its own size changes. It was sized
  // to match the dot that used to sit directly above it; the dots became
  // one centred glyph in 1.0.39.13, but the fixed slot is still what keeps
  // a growing leaf from shoving its neighbours along.
  slot: {
    width: 12,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {},
  fruit: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
});
