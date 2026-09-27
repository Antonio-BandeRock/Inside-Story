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
//
// 2026-09-24: what Phase 2 is allowed to draw, settled in the design
// conversation that followed 1.0.51.1 emptying every tab screen body. The
// full account is in docs/CLAUDE-ARCHIVE-2026-09-14.md under "The reward
// design for the freed tab screens", and CLAUDE.md open next step 29 is the
// short version. Nothing there is approved for building yet, but the
// constraints are, and each one rules out a design a later session would
// otherwise reach for first:
//
// - What grows is MADE OUT OF the person's records, never awarded for them.
//   A record cannot be taken away, needs no praise language, and stops
//   growing through a gap instead of wilting.
// - So no streak, level, point total or percentage. scripts/test_keeping_up.js
//   bans praise ("well done", "good job", "keep it up") as squarely as blame,
//   and a blank period draws as a gap rather than a zero, which is what makes
//   accumulating growth the only shape that fits.
// - No animation. AnimatedSky came out 2026-08-17 for measured battery drain
//   and this would be mounted behind nine tabs at once: static, composed on
//   focus.
// - It stays reachable when a tab's background is Off, Generic or a photo the
//   person added, on the instruction that "the achievements continue to build
//   themselves so if the user decides to look, they can." Low Stimulation
//   turns it off with everything else.
// - Elapsed time earns part of it, not volume alone, or "more logging" quietly
//   becomes "better person", which is scoring in a costume. And nothing ever
//   regresses.
// - Signals must not grow with symptom count, or the app rewards being sick.
//   Count the check-ins, never what was in them.
//
// 2026-09-27, C17 of the competitive build plan: docs/progress-design.md
// settled both gates, and the owner approved its four decisions. Growth is
// variety plus elapsed time, with repetition counted once per week, and
// that lives in lib/progress.ts rather than here, since it is not a yes or
// no fact. The spread was filled from the design's section 4: every tab
// that records anything now has firsts, Life the most, being the tab the
// second audience lives on. Trends and Reports record nothing, so they have
// none, which is correct rather than a gap.
//
// Each criterion now carries a firstQuery returning one column, `at`: WHEN
// the first such record happened, not when anybody noticed. A first stays
// once met even if its record is deleted later (decision 2 of the design),
// which the INSERT OR IGNORE in recordAchievementCriterionMet already did.
//
// Two firsts from the design are left out because nothing records them:
// "a rule made from a Pattern Finder candidate" (personal_rules.source only
// knows self and doctor) and "a Where Is It answer" (a search, never
// stored). Each needs a column before it can be counted.
import { getAchievedCriteriaDates, getDatabase, recordAchievementCriterionMet } from './db';

export type ProgressTabPath =
  | '/'
  | '/food'
  | '/schedule'
  | '/log'
  | '/insights'
  | '/trends'
  | '/reports'
  | '/garden'
  | '/life';

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
  | 'builder_dessert'
  | 'all_builders_used'
  | 'favorite_saved'
  | 'product_scanned'
  | 'recipe_imported'
  | 'recipe_shared'
  | 'ferment_started'
  | 'fermentation_harvest_logged'
  | 'personal_rule_created'
  | 'healing_stage_declared'
  | 'lab_result_logged'
  | 'safe_food_added'
  | 'symptom_assessment_completed'
  | 'checkin_made'
  | 'tracker_named'
  | 'food_trial_logged'
  | 'food_trial_finished'
  | 'therapy_session_logged'
  | 'period_day_recorded'
  | 'meal_logged'
  | 'supplement_dose_logged'
  | 'prescription_dose_logged'
  | 'appointment_completed'
  | 'hydration_logged'
  | 'exercise_logged'
  | 'meal_plan_set'
  | 'garden_area_added'
  | 'garden_planting_added'
  | 'garden_harvest_logged'
  | 'garden_reading_recorded'
  | 'compost_pile_started'
  | 'harvest_gift_received'
  | 'harvest_passed_on'
  | 'garden_countdown_done'
  | 'treatment_added'
  | 'medicine_label_kept'
  | 'emergency_card_filled'
  | 'emergency_contact_added'
  | 'routine_run'
  | 'done_mark_made'
  | 'upkeep_done'
  | 'countdown_reached'
  | 'kitchen_place_recorded'
  | 'grocery_list_finished'
  | 'family_member_added'
  | 'connection_paired'
  | 'work_checkin'
  | 'money_recorded'
  | 'budget_set'
  | 'savings_goal_set'
  | 'goal_contribution'
  | 'capture_note_made'
  | 'today_pick_made';

export type CriterionDefinition = {
  key: AchievementCriterionKey;
  label: string;
  // The tab whose picture and progress band this first belongs to.
  tab: ProgressTabPath;
  // Returns one row with one column, `at`, NULL when nothing has happened
  // yet. Undefined only for 'all_builders_used', the one derived criterion.
  firstQuery?: string;
};

function firstOf(table: string, column: string, where?: string): string {
  return `SELECT MIN(${column}) AS at FROM ${table}${where ? ` WHERE ${where}` : ''}`;
}

// The 12 Food builders, each checked the same way against its own table.
// Desserts joined 2026-09-27; before that "Used every Food builder" could be
// met without it.
const BUILDER_CRITERIA: CriterionDefinition[] = [
  { key: 'builder_meal', label: 'Used the Meal builder', tab: '/food', firstQuery: firstOf('meals', 'created_at') },
  { key: 'builder_side', label: 'Used the Side builder', tab: '/food', firstQuery: firstOf('sides', 'created_at') },
  { key: 'builder_salad', label: 'Used the Salad builder', tab: '/food', firstQuery: firstOf('salads', 'created_at') },
  { key: 'builder_smoothie', label: 'Used the Smoothie builder', tab: '/food', firstQuery: firstOf('smoothies', 'created_at') },
  {
    key: 'builder_fermentation',
    label: 'Used the Fermentation builder',
    tab: '/food',
    firstQuery: firstOf('fermentations', 'created_at'),
  },
  { key: 'builder_beverage', label: 'Used the Beverage builder', tab: '/food', firstQuery: firstOf('beverages', 'created_at') },
  { key: 'builder_snack', label: 'Used the Snack builder', tab: '/food', firstQuery: firstOf('snacks', 'created_at') },
  {
    key: 'builder_baked_goods',
    label: 'Used the Baked Goods builder',
    tab: '/food',
    firstQuery: firstOf('baked_goods', 'created_at'),
  },
  { key: 'builder_soup', label: 'Used the Soup builder', tab: '/food', firstQuery: firstOf('soups', 'created_at') },
  { key: 'builder_sauce', label: 'Used the Sauces builder', tab: '/food', firstQuery: firstOf('sauces', 'created_at') },
  { key: 'builder_handheld', label: 'Used the Handhelds builder', tab: '/food', firstQuery: firstOf('handhelds', 'created_at') },
  { key: 'builder_dessert', label: 'Used the Desserts builder', tab: '/food', firstQuery: firstOf('desserts', 'created_at') },
];

const OTHER_CRITERIA: CriterionDefinition[] = [
  // Food
  { key: 'favorite_saved', label: 'Saved a favorite', tab: '/food', firstQuery: firstOf('favorites', 'created_at') },
  { key: 'product_scanned', label: 'Scanned a product', tab: '/food', firstQuery: firstOf('scanned_products', 'scanned_at') },
  { key: 'recipe_imported', label: 'Brought in a recipe from a web page', tab: '/food', firstQuery: firstOf('recipe_imports', 'created_at') },
  // shared_recipes holds recipes RECEIVED from someone (from_name,
  // received_at), so the label says that; it read "Shared a recipe" until
  // 2026-09-27.
  { key: 'recipe_shared', label: 'Received a recipe from someone', tab: '/food', firstQuery: firstOf('shared_recipes', 'received_at') },
  { key: 'ferment_started', label: 'Started a ferment', tab: '/food', firstQuery: firstOf('fermentation_batches', 'started_at') },
  {
    key: 'fermentation_harvest_logged',
    label: 'Harvested a ferment',
    tab: '/food',
    firstQuery: firstOf('fermentation_harvests', 'created_at'),
  },

  // Insights
  { key: 'personal_rule_created', label: 'Made a personal rule', tab: '/insights', firstQuery: firstOf('personal_rules', 'created_at') },
  {
    key: 'healing_stage_declared',
    label: 'Chose a healing stage',
    tab: '/insights',
    firstQuery: firstOf('user_condition_stages', 'updated_at'),
  },
  {
    key: 'lab_result_logged',
    label: 'Recorded a lab result',
    tab: '/insights',
    firstQuery: firstOf('lab_results', 'COALESCE(tested_at, created_at)'),
  },
  { key: 'safe_food_added', label: 'Added a food to Safe Foods', tab: '/insights', firstQuery: firstOf('my_safe_foods', 'added_at') },

  // Signals
  {
    key: 'symptom_assessment_completed',
    label: 'Completed a symptom assessment',
    tab: '/log',
    firstQuery: firstOf('symptom_assessments', 'COALESCE(completed_at, created_at)'),
  },
  { key: 'checkin_made', label: 'Made a check-in', tab: '/log', firstQuery: firstOf('wellbeing_checkins', 'logged_at') },
  { key: 'tracker_named', label: 'Named a tracker of your choosing', tab: '/log', firstQuery: firstOf('custom_trackers', 'created_at') },
  { key: 'food_trial_logged', label: 'Started trying a new food', tab: '/log', firstQuery: firstOf('food_trials', 'started_at') },
  {
    key: 'food_trial_finished',
    label: 'Finished trying a new food',
    tab: '/log',
    firstQuery: firstOf('food_trials', 'resolved_at', "status IN ('cleared', 'flagged') AND resolved_at IS NOT NULL"),
  },
  { key: 'therapy_session_logged', label: 'Recorded a therapy session', tab: '/log', firstQuery: firstOf('therapy_sessions', 'performed_at') },
  { key: 'period_day_recorded', label: 'Recorded a period day', tab: '/log', firstQuery: firstOf('cycle_days', 'day') },

  // Schedules
  {
    // A beverage is left out so this stays distinct from hydration_logged,
    // which would otherwise always be met on the same first drink.
    key: 'meal_logged',
    label: 'Logged a meal',
    tab: '/schedule',
    firstQuery: firstOf('meals', 'eaten_at', "meal_type != 'beverage'"),
  },
  {
    key: 'supplement_dose_logged',
    label: 'Marked a supplement dose taken',
    tab: '/schedule',
    firstQuery: firstOf('schedule_items', 'updated_at', "item_type = 'supplement' AND status = 'logged'"),
  },
  {
    key: 'prescription_dose_logged',
    label: 'Marked a prescription dose taken',
    tab: '/schedule',
    firstQuery: firstOf('schedule_items', 'updated_at', "item_type = 'prescription' AND status = 'logged'"),
  },
  {
    key: 'appointment_completed',
    label: 'Kept an appointment',
    tab: '/schedule',
    firstQuery: firstOf('schedule_items', 'updated_at', "item_type = 'appointment' AND status = 'completed'"),
  },
  {
    // Hydration is Meals, filtered: a drink is a meal whose meal_type is
    // 'beverage'.
    key: 'hydration_logged',
    label: 'Logged a drink',
    tab: '/schedule',
    firstQuery: firstOf('meals', 'eaten_at', "meal_type = 'beverage'"),
  },
  { key: 'exercise_logged', label: 'Logged movement', tab: '/schedule', firstQuery: firstOf('exercise_logs', 'logged_at') },
  { key: 'meal_plan_set', label: 'Put a meal on the Meal Plan', tab: '/schedule', firstQuery: firstOf('meal_plan_slots', 'created_at') },

  // Garden
  { key: 'garden_area_added', label: 'Made a garden area', tab: '/garden', firstQuery: firstOf('garden_plots', 'created_at') },
  {
    key: 'garden_planting_added',
    label: 'Recorded a planting',
    tab: '/garden',
    firstQuery: firstOf('garden_plantings', 'COALESCE(planted_at, created_at)'),
  },
  {
    key: 'garden_harvest_logged',
    label: 'Recorded a harvest',
    tab: '/garden',
    firstQuery: firstOf('garden_harvests', 'COALESCE(harvested_at, created_at)'),
  },
  { key: 'garden_reading_recorded', label: 'Recorded a growing reading', tab: '/garden', firstQuery: firstOf('garden_readings', 'measured_on') },
  {
    key: 'compost_pile_started',
    label: 'Started a compost pile',
    tab: '/garden',
    firstQuery: firstOf('compost_piles', 'COALESCE(started_on, created_at)'),
  },
  {
    key: 'harvest_gift_received',
    label: 'Received food from another garden',
    tab: '/garden',
    firstQuery: firstOf('harvest_shares_received', 'received_on'),
  },
  {
    key: 'harvest_passed_on',
    label: 'Gave, traded or sold part of a harvest',
    tab: '/garden',
    firstQuery: firstOf('harvest_dispositions', 'occurred_on'),
  },
  {
    key: 'garden_countdown_done',
    label: 'Reached a garden Days Until counter',
    tab: '/garden',
    firstQuery: firstOf('garden_countdowns', 'done_at', 'done_at IS NOT NULL'),
  },

  // Life. My Meds is a Life lens, so a medicine written down is a Life first.
  { key: 'treatment_added', label: 'Wrote down a medicine or supplement', tab: '/life', firstQuery: firstOf('treatments', 'created_at') },
  { key: 'medicine_label_kept', label: 'Kept a medicine label', tab: '/life', firstQuery: firstOf('medicine_labels', 'retrieved_at') },
  {
    key: 'emergency_card_filled',
    label: 'Filled in the emergency card',
    tab: '/life',
    firstQuery: firstOf('emergency_profile', 'COALESCE(confirmed_at, created_at)'),
  },
  { key: 'emergency_contact_added', label: 'Added an emergency contact', tab: '/life', firstQuery: firstOf('emergency_contacts', 'created_at') },
  { key: 'routine_run', label: 'Walked through a routine', tab: '/life', firstQuery: firstOf('routine_runs', 'started_at') },
  { key: 'done_mark_made', label: 'Marked something done in Did I Do It', tab: '/life', firstQuery: firstOf('done_check_marks', 'marked_at') },
  { key: 'upkeep_done', label: 'Did an upkeep job', tab: '/life', firstQuery: firstOf('upkeep_doings', 'done_on') },
  { key: 'countdown_reached', label: 'Reached a Days Until counter', tab: '/life', firstQuery: firstOf('countdowns', 'done_at', 'done_at IS NOT NULL') },
  {
    key: 'kitchen_place_recorded',
    label: 'Wrote down where something is kept',
    tab: '/life',
    firstQuery: firstOf('kitchen_items', 'location_set_at', "location IS NOT NULL AND location != ''"),
  },
  {
    key: 'grocery_list_finished',
    label: 'Finished a grocery list',
    tab: '/life',
    firstQuery: firstOf('grocery_lists', 'completed_at', 'completed_at IS NOT NULL'),
  },
  { key: 'family_member_added', label: 'Added a family member', tab: '/life', firstQuery: firstOf('family_members', 'created_at') },
  // Moved from Food 2026-09-27: pairing is about the people in a life.
  { key: 'connection_paired', label: 'Connected with someone', tab: '/life', firstQuery: firstOf('connections', 'paired_at') },
  { key: 'work_checkin', label: 'Made a work check-in', tab: '/life', firstQuery: firstOf('work_checkins', 'COALESCE(created_at, week_of)') },
  { key: 'money_recorded', label: 'Recorded money in or out', tab: '/life', firstQuery: firstOf('finance_entries', 'occurred_on') },
  { key: 'budget_set', label: 'Set a budget', tab: '/life', firstQuery: firstOf('finance_budgets', 'created_at') },
  { key: 'savings_goal_set', label: 'Set a savings goal', tab: '/life', firstQuery: firstOf('finance_goals', 'created_at') },
  {
    key: 'goal_contribution',
    label: 'Put money toward a goal',
    tab: '/life',
    firstQuery: firstOf('finance_goal_contributions', 'occurred_on'),
  },

  // Home
  { key: 'capture_note_made', label: 'Wrote a quick note to sort later', tab: '/', firstQuery: firstOf('capture_notes', 'created_at') },
  { key: 'today_pick_made', label: 'Chose something in Today I Want To', tab: '/', firstQuery: firstOf('today_picks', 'created_at') },
];

export const ACHIEVEMENT_CRITERIA: CriterionDefinition[] = [
  ...BUILDER_CRITERIA,
  ...OTHER_CRITERIA,
  // Derived from whether every builder criterion is met, so no query.
  { key: 'all_builders_used', label: 'Used every Food builder', tab: '/food' },
];

export const BUILDER_CRITERION_KEYS: readonly AchievementCriterionKey[] = BUILDER_CRITERIA.map((criterion) => criterion.key);

// Runs every not-yet-met criterion's query, records any that are now met
// at the moment the first such record happened, and returns only the keys
// newly met on this call. Always safe to call repeatedly: a met key is
// never queried again and never overwritten.
//
// Foreground-triggered by whatever calls it (Your Progress, a tab's
// progress picture), never a background job, for the same throttling reason
// the reminder architecture designs around.
export async function evaluateAchievementCriteria(): Promise<AchievementCriterionKey[]> {
  const db = await getDatabase();
  const alreadyMet = await getAchievedCriteriaDates();
  const newlyMet: AchievementCriterionKey[] = [];

  for (const criterion of ACHIEVEMENT_CRITERIA) {
    if (alreadyMet.has(criterion.key)) continue;
    if (!criterion.firstQuery) continue;
    let at: string | null = null;
    try {
      const row = await db.getFirstAsync<{ at: string | null }>(criterion.firstQuery);
      at = row?.at ?? null;
    } catch {
      // A table missing on an old install means not met yet, never a crash.
      at = null;
    }
    if (at) {
      await recordAchievementCriterionMet(criterion.key, at);
      newlyMet.push(criterion.key);
      alreadyMet.set(criterion.key, at);
    }
  }

  // The capstone is met on the day the last builder was first used.
  if (!alreadyMet.has('all_builders_used')) {
    const dates = BUILDER_CRITERIA.map((criterion) => alreadyMet.get(criterion.key));
    if (dates.every((date): date is string => Boolean(date))) {
      const latest = dates.reduce((a, b) => (b > a ? b : a));
      await recordAchievementCriterionMet('all_builders_used', latest);
      newlyMet.push('all_builders_used');
    }
  }

  return newlyMet;
}
