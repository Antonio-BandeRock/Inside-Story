// Phase 2 of the header growth vine/Timeline plan (2026-08-21, see the
// Notion App Development Log and the "Header Vine, Timeline & Life" phased
// build plan). Pure logic, deliberately built and testable ahead of any
// real illustration (Phase 3) -- "logic before art," this file's whole
// reason for existing separately from the UI that will eventually render
// it.
//
// Reads Phase 1's own registry (lib/achievementCriteria.ts) rather than
// keeping a second list of what belongs to which tab -- every criterion's
// own `tab` field is the one source of truth for that grouping.
import { getAchievedCriteriaKeys } from './db';
import { ACHIEVEMENT_CRITERIA, type AchievementCriterionKey } from './achievementCriteria';
import { TAB_ROUTES, type TabRoute } from '../constants/tabs';

export type LeafStage = 'none' | 'sprout' | 'growing' | 'full';
export type FruitStage = 'none' | 'ripe';

export type TabGrowthState = {
  tab: TabRoute['path'];
  leafStage: LeafStage;
  fruitStage: FruitStage;
  metCount: number;
  totalCount: number;
};

export type GrowthVineState = {
  // One entry per real, non-Home tab (same exclusion TabPositionDots
  // already makes -- Home was never part of this system, direct request:
  // "Home doesn't need to be represented in the top").
  perTab: TabGrowthState[];
  isMature: boolean;
};

// Which real, existing criterion (if any) counts as a given tab's own
// capstone, gating that tab's fruit. Only Food has one today
// (all_builders_used, Phase 1's one derived criterion) -- every other
// tab's own capstone doesn't exist yet in the registry, so its fruit stays
// 'none' forever until that's actually added, not faked here to look more
// finished than it is.
const CAPSTONE_CRITERIA_BY_TAB: Partial<Record<string, AchievementCriterionKey>> = {
  '/food': 'all_builders_used',
};

// The plant needs real leaf growth across enough tabs before it can fruit
// at all -- direct sequencing from the original brainstorm: "the plant
// starts to mature over time to produce small fruits that eventually grow
// bigger as new achievements are made on top of the old." A first-pass,
// deliberately simple threshold (at least half of the tracked tabs have
// grown past a bare vine), not tuned against any real usage data yet --
// worth revisiting once this has actually been lived with, the same
// honesty this project already applies to every other first-pass number
// (the vine's own cap/pacing numbers are explicitly still open in the
// phased plan, this is the same kind of thing).
const MATURITY_LEAF_STAGE_THRESHOLD: LeafStage = 'sprout';
const MATURITY_TAB_FRACTION = 0.5;

const LEAF_STAGE_ORDER: LeafStage[] = ['none', 'sprout', 'growing', 'full'];

function computeLeafStage(metCount: number, totalCount: number): LeafStage {
  if (totalCount === 0 || metCount === 0) return 'none';
  const ratio = metCount / totalCount;
  if (ratio >= 1) return 'full';
  if (ratio >= 0.5) return 'growing';
  return 'sprout';
}

function leafStageAtLeast(stage: LeafStage, minimum: LeafStage): boolean {
  return LEAF_STAGE_ORDER.indexOf(stage) >= LEAF_STAGE_ORDER.indexOf(minimum);
}

// Reads whatever's already been recorded in achievement_criteria_progress
// (via getAchievedCriteriaKeys, Phase 1) and derives the vine's current
// shape from it. Never evaluates criteria itself -- evaluateAchievementCriteria
// (lib/achievementCriteria.ts) is the one place new achievements actually
// get detected and recorded; this function only ever reads the result.
export async function getGrowthVineState(): Promise<GrowthVineState> {
  const achievedKeys = await getAchievedCriteriaKeys();

  // Grouped by tab, excluding the one derived capstone (all_builders_used)
  // -- a capstone is a bonus on top of a tab's own full leaf, not one more
  // criterion padding out that same tab's own leaf ratio.
  const criteriaByTab = new Map<string, AchievementCriterionKey[]>();
  for (const criterion of ACHIEVEMENT_CRITERIA) {
    if (criterion.key === 'all_builders_used') continue;
    const tabKey = criterion.tab.toString();
    const existing = criteriaByTab.get(tabKey) ?? [];
    existing.push(criterion.key);
    criteriaByTab.set(tabKey, existing);
  }

  const dotTabs = TAB_ROUTES.filter((route) => route.path.toString() !== '/');

  const leafOnly = dotTabs.map((route) => {
    const tabKey = route.path.toString();
    const criteriaKeys = criteriaByTab.get(tabKey) ?? [];
    const metCount = criteriaKeys.filter((key) => achievedKeys.has(key)).length;
    return {
      tab: route.path,
      leafStage: computeLeafStage(metCount, criteriaKeys.length),
      metCount,
      totalCount: criteriaKeys.length,
    };
  });

  const matureTabCount = leafOnly.filter((state) =>
    leafStageAtLeast(state.leafStage, MATURITY_LEAF_STAGE_THRESHOLD),
  ).length;
  const isMature = leafOnly.length > 0 && matureTabCount / leafOnly.length >= MATURITY_TAB_FRACTION;

  // Fruit is gated on the *plant's* maturity, not just its own tab's
  // capstone -- direct sequencing requirement above. A tab's capstone
  // being met before the plant as a whole is mature just means the fruit
  // is waiting, not that it shows early.
  const perTab: TabGrowthState[] = leafOnly.map((state) => {
    const capstoneKey = CAPSTONE_CRITERIA_BY_TAB[state.tab.toString()];
    const fruitStage: FruitStage = isMature && capstoneKey && achievedKeys.has(capstoneKey) ? 'ripe' : 'none';
    return { ...state, fruitStage };
  });

  return { perTab, isMature };
}
