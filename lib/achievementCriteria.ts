// Phase 1 of the header growth vine/Timeline plan (2026-08-21, see the
// Notion App Development Log and the "Header Vine, Timeline & Life" phased
// build plan). This is the shared "has X happened" registry both the
// future vine (Phase 2 onward) and self-created goal linking (Phase 4)
// read from, deliberately built before either of those exists -- see
// achievement_criteria_progress's own CREATE TABLE comment in lib/db.ts
// for the storage side of this.
//
// Tier 1 only, by design: every criterion here is backed by a table that
// already exists for its own ordinary reason (a Food builder saving a
// record, a harvest being logged, a rule being created), so "has this
// happened" is just a query, nothing new has to be tracked to answer it.
// Tier 2 (screen-open-only criteria -- every Insights lens opened, every
// Trends view explored, a Digest entry actually opened, all 9 tabs opened)
// needs its own new local usage-tracking table first and is deliberately
// Phase 7, not built here.
//
// One honest scope note, not guessed past:
// - `tab` below is a first-pass best guess at which tab's own color a
//   criterion's future leaf should borrow (Phase 2's job), not something
//   exhaustively confirmed against how each feature is actually
//   categorized in-app -- fine to revisit once the vine actually needs it.
import { getAchievedCriteriaKeys, getDatabase, recordAchievementCriterionMet } from './db';
import type { TabRoute } from '../constants/tabs';

export type AchievementCriterionKey =
  | 'builder_meal'
  | 'builder_side'
  | 'builder_salad'
  | 'builder_smoothie'
  | 'builder_fermentation'
  | 'builder_beverage'
  | 'builder_snack'
  | 'builder_baked_goods'
  | 'builder_soup'
  | 'builder_sauce'
  | 'builder_handheld'
  | 'all_builders_used'
  | 'favorite_saved'
  | 'personal_rule_created'
  | 'healing_stage_declared'
  | 'lab_result_logged'
  | 'symptom_assessment_completed'
  | 'schedule_meal_planned'
  | 'schedule_supplement_planned'
  | 'schedule_prescription_planned'
  | 'schedule_appointment_planned'
  | 'hydration_logged'
  | 'exercise_logged'
  | 'treatment_added'
  | 'garden_harvest_logged'
  | 'fermentation_harvest_logged'
  | 'product_scanned'
  | 'recipe_shared'
  | 'connection_paired'
  | 'food_trial_logged';

type CriterionDefinition = {
  key: AchievementCriterionKey;
  label: string;
  // Which tab's own jewel color this criterion's eventual leaf borrows --
  // see this file's own header comment for why this is a first pass, not
  // an exhaustively confirmed mapping.
  tab: TabRoute['path'];
  // Undefined only for 'all_builders_used', the one derived, non-SQL
  // criterion -- see evaluateAchievementCriteria's own handling of it.
  existsQuery?: string;
};

// The 11 real Food builders, each checked identically (does at least one
// row exist in this table) against a different table name -- written out
// literally rather than derived from a lookup, so every key here stays a
// plain, direct member of AchievementCriterionKey with nothing clever for
// the type checker to untangle.
const BUILDER_CRITERIA: CriterionDefinition[] = [
  { key: 'builder_meal', label: 'Used the Meal builder', tab: '/food', existsQuery: 'SELECT 1 FROM meals LIMIT 1' },
  { key: 'builder_side', label: 'Used the Side builder', tab: '/food', existsQuery: 'SELECT 1 FROM sides LIMIT 1' },
  { key: 'builder_salad', label: 'Used the Salad builder', tab: '/food', existsQuery: 'SELECT 1 FROM salads LIMIT 1' },
  {
    key: 'builder_smoothie',
    label: 'Used the Smoothie builder',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM smoothies LIMIT 1',
  },
  {
    key: 'builder_fermentation',
    label: 'Used the Fermentation builder',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM fermentations LIMIT 1',
  },
  {
    key: 'builder_beverage',
    label: 'Used the Beverage builder',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM beverages LIMIT 1',
  },
  { key: 'builder_snack', label: 'Used the Snack builder', tab: '/food', existsQuery: 'SELECT 1 FROM snacks LIMIT 1' },
  {
    key: 'builder_baked_goods',
    label: 'Used the Baked Goods builder',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM baked_goods LIMIT 1',
  },
  { key: 'builder_soup', label: 'Used the Soup builder', tab: '/food', existsQuery: 'SELECT 1 FROM soups LIMIT 1' },
  { key: 'builder_sauce', label: 'Used the Sauces builder', tab: '/food', existsQuery: 'SELECT 1 FROM sauces LIMIT 1' },
  {
    key: 'builder_handheld',
    label: 'Used the Handhelds builder',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM handhelds LIMIT 1',
  },
];

const OTHER_CRITERIA: CriterionDefinition[] = [
  { key: 'favorite_saved', label: 'Saved a favorite', tab: '/food', existsQuery: 'SELECT 1 FROM favorites LIMIT 1' },
  {
    key: 'personal_rule_created',
    label: 'Created a personal rule',
    tab: '/insights',
    existsQuery: 'SELECT 1 FROM personal_rules LIMIT 1',
  },
  {
    key: 'healing_stage_declared',
    label: 'Declared a healing stage',
    tab: '/insights',
    existsQuery: 'SELECT 1 FROM user_condition_stages LIMIT 1',
  },
  {
    key: 'lab_result_logged',
    label: 'Logged a lab result',
    tab: '/insights',
    existsQuery: 'SELECT 1 FROM lab_results LIMIT 1',
  },
  {
    key: 'symptom_assessment_completed',
    label: 'Completed a symptom assessment',
    tab: '/log',
    existsQuery: 'SELECT 1 FROM symptom_assessments LIMIT 1',
  },
  {
    key: 'schedule_meal_planned',
    label: 'Scheduled a meal',
    tab: '/schedule',
    existsQuery: "SELECT 1 FROM schedule_items WHERE item_type = 'meal' LIMIT 1",
  },
  {
    key: 'schedule_supplement_planned',
    label: 'Scheduled a supplement',
    tab: '/schedule',
    existsQuery: "SELECT 1 FROM schedule_items WHERE item_type = 'supplement' LIMIT 1",
  },
  {
    key: 'schedule_prescription_planned',
    label: 'Scheduled a prescription',
    tab: '/schedule',
    existsQuery: "SELECT 1 FROM schedule_items WHERE item_type = 'prescription' LIMIT 1",
  },
  {
    key: 'schedule_appointment_planned',
    label: 'Scheduled a doctor appointment',
    tab: '/schedule',
    existsQuery: "SELECT 1 FROM schedule_items WHERE item_type = 'appointment' LIMIT 1",
  },
  {
    // Not a separate item_type -- confirmed directly against
    // app/(tabs)/schedule.tsx's own Hydration lens, which states plainly
    // "Hydration is Meals, filtered": a beverage IS a meal (meals.meal_type
    // = 'beverage', a real, confirmed column value), and the Hydration
    // lens is just that same data shown with a running water total, not a
    // second tracking system. Checking meals directly, not schedule_items,
    // is also the more honest signal for an achievement specifically --
    // this is about something that actually happened, not merely got
    // scheduled for later.
    key: 'hydration_logged',
    label: 'Logged a beverage (hydration)',
    tab: '/schedule',
    existsQuery: "SELECT 1 FROM meals WHERE meal_type = 'beverage' LIMIT 1",
  },
  {
    key: 'exercise_logged',
    label: 'Logged exercise',
    tab: '/schedule',
    existsQuery: 'SELECT 1 FROM exercise_logs LIMIT 1',
  },
  {
    key: 'treatment_added',
    label: 'Added a medication or supplement',
    tab: '/insights',
    existsQuery: 'SELECT 1 FROM treatments LIMIT 1',
  },
  {
    key: 'garden_harvest_logged',
    label: 'Logged a Garden harvest',
    tab: '/garden',
    existsQuery: 'SELECT 1 FROM garden_harvests LIMIT 1',
  },
  {
    key: 'fermentation_harvest_logged',
    label: 'Logged a Fermentation harvest',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM fermentation_harvests LIMIT 1',
  },
  {
    key: 'product_scanned',
    label: 'Scanned a product',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM scanned_products LIMIT 1',
  },
  { key: 'recipe_shared', label: 'Shared a recipe', tab: '/food', existsQuery: 'SELECT 1 FROM shared_recipes LIMIT 1' },
  {
    key: 'connection_paired',
    label: 'Paired a Connection',
    tab: '/food',
    existsQuery: 'SELECT 1 FROM connections LIMIT 1',
  },
  {
    key: 'food_trial_logged',
    label: 'Logged a food trial',
    tab: '/insights',
    existsQuery: 'SELECT 1 FROM food_trials LIMIT 1',
  },
];

export const ACHIEVEMENT_CRITERIA: CriterionDefinition[] = [
  ...BUILDER_CRITERIA,
  ...OTHER_CRITERIA,
  // Deliberately no existsQuery -- derived from whether every one of
  // BUILDER_CRITERIA is already met, not a table of its own to query. See
  // evaluateAchievementCriteria below.
  { key: 'all_builders_used', label: 'Used every Food builder', tab: '/food' },
];

// Runs every not-yet-met criterion's own check, records any that just
// became true (INSERT OR IGNORE under the hood, so this is always safe to
// call repeatedly), and returns only the keys newly met on *this* call --
// the real, useful signal for a future caller (the vine, a Timeline entry)
// that wants to react to something just having happened, not the full
// list of everything ever achieved (getAchievedCriteriaKeys already
// answers that).
//
// Deliberately foreground-triggered by whatever calls this (a screen's own
// useFocusEffect, a builder's own save handler), not a background job --
// background execution is throttled on both mobile OSes, the same
// constraint the rest of this app's reminder architecture already designs
// around, so there's no reliable "check this the instant it becomes true"
// moment to build toward here either.
export async function evaluateAchievementCriteria(): Promise<AchievementCriterionKey[]> {
  const db = await getDatabase();
  const alreadyMet = await getAchievedCriteriaKeys();
  const newlyMet: AchievementCriterionKey[] = [];

  for (const criterion of ACHIEVEMENT_CRITERIA) {
    if (alreadyMet.has(criterion.key)) continue;
    if (!criterion.existsQuery) continue; // 'all_builders_used', handled below

    const row = await db.getFirstAsync(criterion.existsQuery);
    if (row) {
      await recordAchievementCriterionMet(criterion.key);
      newlyMet.push(criterion.key);
      alreadyMet.add(criterion.key);
    }
  }

  // Derived capstone, checked last against the now-current state (which
  // may include builder criteria this very call just recorded) rather
  // than the state from before this function ran.
  if (!alreadyMet.has('all_builders_used')) {
    const allBuildersMet = BUILDER_CRITERIA.every((criterion) => alreadyMet.has(criterion.key));
    if (allBuildersMet) {
      await recordAchievementCriterionMet('all_builders_used');
      newlyMet.push('all_builders_used');
    }
  }

  return newlyMet;
}
