// What changed since this device was last in step, in words a person reads.
//
// 2026-09-22, direct report: "the message on the mobile or the windows
// version lets me know it is warning that it will be using the version
// from the other device because it has changed something this version
// needs to pick up, but it doesn't actually say what the change was that
// caused this update to synchronize from the other device. It should say
// what the change was that happened so the user can be reminded of it."
//
// HOW IT WORKS. Every snapshot save stamps each table with its row count
// and a hash of its contents (stampTables), compares that against the
// stamp kept from the last save or load (describeChanges), and writes the
// resulting phrases into the snapshot itself, inside the encryption. The
// device that loads the copy reads them back and says them. The plain
// record in the shared folder is deliberately left alone: it carries no
// health content so a device can see that something arrived without a
// password, and "2 more lab results" would break that.
//
// A COUNT COMES FROM ONE TABLE PER AREA. A salad and its six ingredient
// rows are one salad, so each area names the table whose rows are the
// things a person would count, and lists its supporting tables as quiet:
// they mark the area as changed without adding to the number. Areas where
// a count means nothing at all (a profile, the settings) count nothing and
// only ever report edits.
//
// A TABLE THE STAMP HAS NEVER SEEN IS PASSED OVER, once. A version that
// adds a table arrives with rows in it already, and calling those an
// addition would be wrong; they are counted from the next stamp onward.
//
// This module does no I/O and imports nothing, so
// scripts/test_snapshot_changes.js can check every phrase without a phone.
// lib/snapshotSync.ts builds the sentences around these phrases and
// lib/snapshotSyncDevice.ts does the reading and writing.

/** One table's shape at a moment: how many rows, and what was in them. */
export type TableStamp = { n: number; h: string };

export type TableStamps = Record<string, TableStamp>;

/** Mirrors APP_META_TABLE in lib/snapshotSync.ts; neither file imports. */
const APP_META = 'app_meta';

/** How many phrases are said before the rest become "and N other things". */
export const MOST_CHANGES_SAID = 4;

type Area = {
  /** How one of them is said: "3 more meal" would be wrong, "1 more meal" is right. */
  one: string;
  many: string;
  /** The table whose rows are the things somebody would count. */
  count: readonly string[];
  /** Tables that mark this area changed without changing the number. */
  quiet: readonly string[];
};

// Bookkeeping the app keeps for itself. A log of what happened and a cache
// of totals already in the database are not something to remind anybody of,
// and achievement progress is worked out from everything else.
// dev_notes is here for a different reason: the Tell Claude notes are
// about building this app rather than about the person using it.
const NOT_WORTH_SAYING: readonly string[] = [
  'activity_log',
  'daily_nutrient_totals_cache',
  'dev_seed_records',
  'dev_notes',
  'achievement_criteria_progress',
];

// app_meta is one row per setting, so it is stamped a row at a time and
// each key is its own area. Everything unlisted reads as app settings.
const APP_META_AREAS: Record<string, string> = {
  visual_preferences: 'how the app looks',
  reminder_preferences: 'your reminder settings',
  general_health_preferences: 'your health settings',
  digest_feedback: 'what you marked as helpful',
  measurement_system: 'your measurement units',
  curated_recipe_photo_overrides: 'recipe photos',
};

// A cache or a one-time repair mark, which say nothing about what a person did.
const APP_META_NOT_WORTH_SAYING: readonly string[] = [
  'home_sky_location',
  'home_sky_weather',
  'grocery_line_transpose_repair_v2',
  'cooking_method_reresolve_v1',
];

const AREAS: readonly Area[] = [
  { one: 'meal', many: 'meals', count: ['meals'], quiet: ['meal_items', 'meal_components', 'meal_photo_drafts'] },
  {
    one: 'day in your meal plan',
    many: 'days in your meal plan',
    count: ['meal_plan_slots'],
    quiet: ['partner_meal_plan_slots'],
  },
  { one: 'smoothie', many: 'smoothies', count: ['smoothies'], quiet: ['smoothie_ingredients'] },
  { one: 'salad', many: 'salads', count: ['salads'], quiet: ['salad_ingredients'] },
  { one: 'soup', many: 'soups', count: ['soups'], quiet: ['soup_ingredients'] },
  { one: 'sauce', many: 'sauces', count: ['sauces'], quiet: ['sauce_ingredients'] },
  { one: 'side', many: 'sides', count: ['sides'], quiet: ['side_ingredients'] },
  { one: 'snack', many: 'snacks', count: ['snacks'], quiet: ['snack_ingredients'] },
  { one: 'dessert', many: 'desserts', count: ['desserts'], quiet: ['dessert_ingredients'] },
  { one: 'baked good', many: 'baked goods', count: ['baked_goods'], quiet: ['baked_goods_ingredients'] },
  { one: 'beverage', many: 'beverages', count: ['beverages'], quiet: ['beverage_ingredients'] },
  { one: 'handheld', many: 'handhelds', count: ['handhelds'], quiet: ['handheld_ingredients'] },
  {
    one: 'fermentation',
    many: 'fermentations',
    count: ['fermentations'],
    quiet: [
      'fermentation_batches',
      'fermentation_batch_strains',
      'fermentation_ingredients',
      'fermentation_harvests',
      'fermentation_task_links',
    ],
  },
  { one: 'favorite', many: 'favorites', count: ['favorites'], quiet: [] },
  { one: 'safe food', many: 'safe foods', count: ['my_safe_foods'], quiet: [] },
  {
    one: 'grocery list item',
    many: 'grocery list items',
    count: ['grocery_list_items'],
    quiet: ['grocery_lists'],
  },
  { one: 'kitchen item', many: 'kitchen items', count: ['kitchen_items'], quiet: [] },
  { one: 'scheduled item', many: 'scheduled items', count: ['schedule_items'], quiet: [] },
  { one: 'upkeep item', many: 'upkeep items', count: ['upkeep_items'], quiet: ['upkeep_doings'] },
  {
    one: 'routine',
    many: 'routines',
    count: ['routines'],
    quiet: ['routine_steps', 'routine_occasions', 'routine_runs'],
  },
  {
    one: 'Did I Do It entry',
    many: 'Did I Do It entries',
    count: ['done_checks'],
    quiet: ['done_check_marks'],
  },
  { one: 'capture', many: 'captures', count: ['capture_notes'], quiet: [] },
  {
    one: 'medication or supplement',
    many: 'medications and supplements',
    count: ['treatments'],
    quiet: ['treatment_nutrients'],
  },
  { one: 'personal rule', many: 'personal rules', count: ['personal_rules'], quiet: [] },
  {
    one: 'assessment',
    many: 'assessments',
    count: ['symptom_assessments'],
    quiet: ['symptom_assessment_responses'],
  },
  { one: 'check-in', many: 'check-ins', count: ['wellbeing_checkins'], quiet: ['checkin_tags'] },
  { one: 'health record', many: 'health records', count: ['health_records'], quiet: [] },
  { one: 'lab result', many: 'lab results', count: ['lab_results'], quiet: [] },
  { one: 'measurement', many: 'measurements', count: ['body_measurements'], quiet: [] },
  { one: 'day of steps', many: 'days of steps', count: ['daily_step_counts'], quiet: [] },
  { one: 'exercise entry', many: 'exercise entries', count: ['exercise_logs'], quiet: [] },
  { one: 'therapy session', many: 'therapy sessions', count: ['therapy_sessions'], quiet: [] },
  { one: 'food trial', many: 'food trials', count: ['food_trials'], quiet: ['food_trial_task_links'] },
  {
    one: 'scanned product',
    many: 'scanned products',
    count: ['scanned_products'],
    quiet: ['scanned_product_nutrients', 'scanned_product_prices'],
  },
  {
    one: 'profile detail',
    many: 'profile details',
    count: [],
    quiet: [
      'user_profile',
      'user_conditions',
      'user_condition_stages',
      'curious_about_conditions',
      'diet_preferences',
      'user_food_allergies',
      'user_nutrient_targets',
      'user_neuro_profile',
      'user_beats',
      'your_story_items',
      'your_story_answers',
    ],
  },
  { one: 'family member', many: 'family members', count: ['family_members'], quiet: ['family_member_conditions'] },
  {
    one: 'emergency detail',
    many: 'emergency details',
    count: [],
    quiet: ['emergency_profile', 'emergency_contacts'],
  },
  { one: 'work entry', many: 'work entries', count: ['work_checkins'], quiet: ['work_benefits'] },
  {
    one: 'finance entry',
    many: 'finance entries',
    count: ['finance_entries'],
    quiet: [
      'finance_accounts',
      'finance_account_balance_history',
      'finance_budgets',
      'finance_goals',
      'finance_goal_contributions',
      'finance_goal_costs',
      'finance_health_accounts',
      'finance_insurance_plans',
      'finance_medical_bills',
      'finance_networth_snapshots',
      'finance_recurring',
    ],
  },
  { one: 'connection', many: 'connections', count: ['connections'], quiet: [] },
  { one: 'shared recipe', many: 'shared recipes', count: ['shared_recipes'], quiet: [] },
  { one: 'garden area', many: 'garden areas', count: ['garden_plots'], quiet: ['garden_spaces'] },
  { one: 'planting', many: 'plantings', count: ['garden_plantings'], quiet: ['garden_task_links'] },
  // harvest_uses is quiet, 2026-09-23: marking a picking onto a plate is
  // not another harvest, and a count comes from one table per area.
  { one: 'harvest', many: 'harvests', count: ['garden_harvests'], quiet: ['harvest_uses'] },
  // Its own area, 2026-09-23: a soil temperature is not a harvest and not
  // a planting, and somebody measuring an indoor tent between grows may be
  // adding nothing else at all.
  { one: 'growing conditions reading', many: 'growing conditions readings', count: ['garden_readings'], quiet: [] },
  // Both kinds of counter read as one thing here, 2026-09-22: somebody who
  // started three of them does not care which tab each was born on.
  { one: 'Days Until counter', many: 'Days Until counters', count: ['garden_countdowns', 'countdowns'], quiet: [] },
  { one: 'night logged', many: 'nights logged', count: ['nocturia_nights'], quiet: [] },
  {
    one: 'piece of grow setup',
    many: 'pieces of grow setup',
    count: ['garden_equipment'],
    quiet: ['garden_custom_terms'],
  },
  {
    one: 'growing cost',
    many: 'growing costs',
    count: ['garden_cost_details'],
    quiet: ['garden_cost_groups', 'garden_cost_kinds', 'electricity_bills'],
  },
  { one: 'compost record', many: 'compost records', count: ['compost_events'], quiet: ['compost_piles'] },
  {
    one: 'harvest share',
    many: 'harvest shares',
    count: ['harvest_dispositions'],
    quiet: ['harvest_disposition_receipts', 'harvest_shares_received'],
  },
];

type Lookup = { area: Area; counts: boolean };

const BY_TABLE: Record<string, Lookup> = (() => {
  const map: Record<string, Lookup> = {};
  for (const area of AREAS) {
    for (const table of area.count) map[table] = { area, counts: true };
    for (const table of area.quiet) map[table] = { area, counts: false };
  }
  return map;
})();

/** "garden_task_links" for a table nothing here names yet. */
function madeUpArea(table: string): Area {
  const words = table.replace(/_/g, ' ').trim();
  const one = words.endsWith('s') ? words.slice(0, -1) : words;
  const many = words.endsWith('s') ? words : words + 's';
  return { one, many, count: [table], quiet: [] };
}

function lookUp(table: string): Lookup | null {
  if (NOT_WORTH_SAYING.includes(table)) return null;
  if (table.startsWith(APP_META + '/')) {
    const key = table.slice(APP_META.length + 1);
    if (APP_META_NOT_WORTH_SAYING.includes(key)) return null;
    const many = APP_META_AREAS[key] ?? 'app settings';
    return { area: { one: many, many, count: [], quiet: [table] }, counts: false };
  }
  const known = BY_TABLE[table];
  if (known) return known;
  return { area: madeUpArea(table), counts: true };
}

/**
 * Every table's row count and a hash of its contents. app_meta is stamped a
 * row at a time, since one settings row changing is worth saying on its own
 * and the table as a whole is not.
 *
 * The hash function is handed in rather than imported, so this module stays
 * free of imports and testable on its own. lib/snapshotSyncDevice.ts passes
 * fingerprintText from lib/snapshotSync.ts.
 */
export function stampTables(
  tables: Record<string, Record<string, unknown>[]>,
  hashText: (text: string) => string,
): TableStamps {
  const stamps: TableStamps = {};
  for (const [table, rows] of Object.entries(tables)) {
    if (!Array.isArray(rows)) continue;
    if (table === APP_META) {
      for (const row of rows) {
        const key = typeof row.key === 'string' ? row.key : '';
        if (!key) continue;
        stamps[APP_META + '/' + key] = { n: 1, h: hashText(JSON.stringify(row.value ?? null)) };
      }
      continue;
    }
    stamps[table] = { n: rows.length, h: hashText(JSON.stringify(rows)) };
  }
  return stamps;
}

type Tally = { area: Area; delta: number; changed: boolean };

/**
 * What a person would say has changed between two stamps, most of it first.
 *
 * A table in one stamp and not the other is passed over: an app version
 * that adds or drops a table would otherwise read as somebody having added
 * or thrown away everything in it. An app_meta row is the exception, since
 * a setting written for the first time is a change somebody made.
 */
export function describeChanges(before: TableStamps | null, after: TableStamps): string[] {
  if (!before) return [];
  const tallies = new Map<string, Tally>();
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const table of names) {
    const was = before[table];
    const now = after[table];
    const isMetaRow = table.startsWith(APP_META + '/');
    if (!isMetaRow && (!was || !now)) continue;
    const wasCount = was ? was.n : 0;
    const nowCount = now ? now.n : 0;
    if (was && now && wasCount === now.n && was.h === now.h) continue;
    const found = lookUp(table);
    if (!found) continue;
    const key = found.area.many;
    const tally = tallies.get(key) ?? { area: found.area, delta: 0, changed: false };
    tally.changed = true;
    if (found.counts) tally.delta += nowCount - wasCount;
    tallies.set(key, tally);
  }

  const ranked = [...tallies.values()].sort((a, b) => {
    const size = Math.abs(b.delta) - Math.abs(a.delta);
    if (size !== 0) return size;
    return a.area.many.localeCompare(b.area.many);
  });

  const phrases = ranked.map((tally) => {
    if (tally.delta > 0) return tally.delta + ' more ' + (tally.delta === 1 ? tally.area.one : tally.area.many);
    if (tally.delta < 0) {
      const gone = -tally.delta;
      return gone + ' fewer ' + (gone === 1 ? tally.area.one : tally.area.many);
    }
    return 'edits to ' + tally.area.many;
  });

  if (phrases.length <= MOST_CHANGES_SAID) return phrases;
  const rest = phrases.length - MOST_CHANGES_SAID;
  return [...phrases.slice(0, MOST_CHANGES_SAID), rest + ' other thing' + (rest === 1 ? '' : 's')];
}

/** The stamp kept in app_meta, read back, or null for anything that is not one. */
export function parseStamps(text: string | null | undefined): TableStamps | null {
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const stamps: TableStamps = {};
  for (const [table, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const stamp = value as Partial<TableStamp>;
    if (typeof stamp.n !== 'number' || typeof stamp.h !== 'string') continue;
    stamps[table] = { n: stamp.n, h: stamp.h };
  }
  return Object.keys(stamps).length > 0 ? stamps : null;
}

/** The phrases carried inside a snapshot, read back from a copy of any age. */
export function parseChangeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((phrase): phrase is string => typeof phrase === 'string' && phrase.length > 0);
}

/** The words a table's rows are said in, and whether counting them means anything. */
export type TableWords = { one: string; many: string; counts: boolean };

/**
 * How one table is spoken about, for lib/snapshotMerge.ts, which works a
 * row at a time and so cannot use the counts above.
 *
 * `counts` is false for a table that only marks its area as touched: the
 * six ingredient rows under a salad are not six salads, so they read as
 * edits to salads however they arrived. A settings row is addressed as
 * "app_meta/<key>", the same way stampTables addresses it.
 */
export function wordsForTable(table: string): TableWords | null {
  const found = lookUp(table);
  if (!found) return null;
  return { one: found.area.one, many: found.area.many, counts: found.counts };
}
