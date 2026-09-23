import { formatAmount } from './nutrientAnalysis';
import { formatTime12 } from './timeOfDay';

// Where a dose lands in the day, next to what is being eaten around it.
//
// 2026-09-22, direct instruction: "Supplements have some specific rules
// about when they are to be taken, with or without food, with water, or
// with fat, or not with specific foods, or not with specific other
// vitamins and minerals and acids and hormones ... So, when they were
// taken throughout the day is part of scheduling and should be visible
// right along side the meal schedule."
//
// The interaction-rules engine (lib/interactionRules.ts) already checks a
// dose time against another DOSE time. Nothing checked a dose time against
// a MEAL, so a levothyroxine dose twenty minutes before a yogurt breakfast
// passed silently while the same person taking a calcium capsule at that
// moment was warned. This module closes that half, and interleaves the two
// kinds of entry into one day so the person sees the order they happen in.
//
// Deliberately free of SQLite and React: every input arrives already
// resolved, which is what lets scripts/test_dose_meal_timing.js check the
// arithmetic and the wording without a phone.

// The subset of an interaction_rules row this module reads. Declared
// structurally rather than imported from lib/db.ts so nothing here depends
// on the database layer; an InteractionRuleRecord satisfies it as is.
export type TimingRule = {
  id: string;
  ruleType: string;
  checkable: boolean;
  subjectAKind: string;
  subjectA: string;
  subjectBKind: string | null;
  subjectB: string | null;
  minSeparationHours: number | null;
  severity: 'caution' | 'note';
  title: string;
  guidance: string;
  citation: string;
  mechanism: string | null;
};

// The subset of a nutrient_timing row this module reads, on the same terms
// as TimingRule above. A NutrientTiming satisfies it as is.
export type TimingReference = {
  nutrientCode: string;
  solubility: string;
  bestTaken: string;
  citation: string | null;
};

export type TimelineMeal = {
  id: string;
  title: string;
  // 'HH:MM', 24-hour.
  time: string;
  mealType: string | null;
  status: string;
  // What this person's share of the meal carries, by nutrient code, in the
  // reference database's canonical unit for that nutrient.
  nutrients: Record<string, number>;
  // False when nothing in the meal could be resolved to a food, so its
  // nutrients are unknown rather than zero. The difference matters: zero
  // clears a dose, unknown does not.
  nutrientsResolved: boolean;
};

export type TimelineDose = {
  id: string;
  time: string;
  treatmentId: string;
  treatmentName: string;
  treatmentType: string;
  status: string;
  // "75 mcg" or "2 capsules", already composed by the caller.
  doseLabel: string | null;
  // Which nutrients a supplement carries, by code. Empty for a
  // prescription or an OTC item, whose identity is its generic name.
  nutrientCodes: string[];
  genericName: string | null;
};

export type DoseFoodNote = {
  // clash: a meal near this dose carries something that competes with it.
  // missing: the dose wants fat or food, and nothing near it has any.
  // good: what the dose wants is already there.
  // unknown: a meal near the dose has nothing linked to the food database,
  // so what it carries could not be checked.
  kind: 'clash' | 'missing' | 'good' | 'unknown';
  headline: string;
  detail: string;
  citation: string | null;
  mechanism: string | null;
  ruleId: string | null;
};

export type DoseGuidanceLine = { nutrientName: string; bestTaken: string; citation: string | null };

export type TimelineEntry =
  | { kind: 'meal'; time: string; sortKey: string; meal: TimelineMeal }
  | {
      kind: 'dose';
      time: string;
      sortKey: string;
      dose: TimelineDose;
      notes: DoseFoodNote[];
      // What the reference database says about when this dose is best
      // taken, one line per nutrient it carries that has a row. Shown on
      // request rather than sitting on screen, since it is reference text
      // rather than a verdict about today.
      guidance: DoseGuidanceLine[];
    };

// How much of a nutrient in one meal is enough to affect a dose beside it.
// These are working thresholds picked so a trace amount raises nothing,
// not doses from a trial: the absorption literature behind the separation
// rules tested supplement-sized amounts, and no source states the figure
// at which an ordinary meal starts to matter. Every sentence below names
// the amount the meal actually carries, so the person reads the number
// rather than trusting the line that surfaced it.
const MEAL_AMOUNT_THAT_MATTERS: Record<string, number> = {
  calcium: 200,
  iron: 3,
  zinc: 3,
  magnesium: 80,
  copper: 0.5,
  potassium: 500,
};

// The same figure lib/interactionRules.ts uses for its whole-day fat
// check, applied here to one meal instead.
const MIN_MEANINGFUL_FAT_GRAMS = 5;

// A fat-soluble dose wants fat in the same sitting. Two hours either side
// is generous for what "the same meal" means in practice, and being
// generous is the right direction: a warning that fired on a dose taken
// with dinner would teach somebody to stop reading them.
const FAT_WINDOW_HOURS = 2;

// The canonical unit for the handful of nutrients these rules name. The
// reference database is the authority on this everywhere else; the rules
// in play here cover six minerals and fat, so carrying the pairs locally
// keeps this module free of the database rather than threading a second
// lookup through every caller.
function unitFor(code: string): string {
  return code === 'fat_total' ? 'g' : 'mg';
}

export function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours)) return 0;
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

// "at the same time", "25 minutes apart", "3 hours 10 minutes apart".
export function describeGap(minutes: number): string {
  const gap = Math.abs(Math.round(minutes));
  if (gap === 0) return 'at the same time';
  if (gap < 60) return `${gap} minutes apart`;
  const hours = Math.floor(gap / 60);
  const rest = gap % 60;
  const hourPart = `${hours} hour${hours === 1 ? '' : 's'}`;
  if (rest === 0) return `${hourPart} apart`;
  return `${hourPart} ${rest} minutes apart`;
}

function nutrientLabel(code: string, names: Record<string, string>): string {
  return names[code] ?? code.replace(/_/g, ' ');
}

// A meal that was skipped is not eaten, so it competes with nothing.
function mealCounts(meal: TimelineMeal): boolean {
  return meal.status !== 'skipped';
}

function enoughToMatter(code: string, amount: number): boolean {
  const threshold = MEAL_AMOUNT_THAT_MATTERS[code];
  if (threshold == null) return amount > 0;
  return amount >= threshold;
}

// Whether one side of a rule names this dose. A supplement is matched by
// the nutrients it carries, a prescription or OTC item by its generic
// name, falling back to a substring of whatever the person called it,
// which is the matching lib/interactionRules.ts already does.
export function doseMatchesSubject(dose: TimelineDose, kind: string | null, subject: string | null): boolean {
  if (!kind || !subject) return false;
  if (kind === 'nutrient') return dose.nutrientCodes.includes(subject);
  if (kind === 'prescription') {
    const needle = subject.toLowerCase();
    if (dose.genericName) return dose.genericName.toLowerCase() === needle;
    return dose.treatmentName.toLowerCase().includes(needle);
  }
  return false;
}

// Every note this dose earns from the meals around it, worst first.
export function doseFoodNotes(
  dose: TimelineDose,
  meals: TimelineMeal[],
  rules: TimingRule[],
  nutrientNames: Record<string, string> = {},
): DoseFoodNote[] {
  if (dose.status === 'skipped') return [];
  const eaten = meals.filter(mealCounts);
  const doseMinutes = minutesOfDay(dose.time);
  const notes: DoseFoodNote[] = [];
  let anyNutrientRuleApplied = false;
  let anyUnresolvedNearby = false;

  for (const rule of rules) {
    if (!rule.checkable) continue;

    if (rule.ruleType === 'timing_separation' && rule.minSeparationHours != null) {
      // Only a nutrient can come from a plate, so the side this dose does
      // NOT match has to be a nutrient for a meal to be checkable at all.
      let nutrientCode: string | null = null;
      if (doseMatchesSubject(dose, rule.subjectAKind, rule.subjectA) && rule.subjectBKind === 'nutrient') {
        nutrientCode = rule.subjectB;
      } else if (doseMatchesSubject(dose, rule.subjectBKind, rule.subjectB) && rule.subjectAKind === 'nutrient') {
        nutrientCode = rule.subjectA;
      }
      if (!nutrientCode) continue;
      anyNutrientRuleApplied = true;

      const windowMinutes = rule.minSeparationHours * 60;
      let closest: { meal: TimelineMeal; gap: number; amount: number } | null = null;
      for (const meal of eaten) {
        const gap = Math.abs(minutesOfDay(meal.time) - doseMinutes);
        if (gap >= windowMinutes) continue;
        if (!meal.nutrientsResolved) {
          anyUnresolvedNearby = true;
          continue;
        }
        const amount = meal.nutrients[nutrientCode] ?? 0;
        if (!enoughToMatter(nutrientCode, amount)) continue;
        if (!closest || gap < closest.gap) closest = { meal, gap, amount };
      }
      if (!closest) continue;

      const name = nutrientLabel(nutrientCode, nutrientNames);
      const hours = rule.minSeparationHours;
      notes.push({
        kind: 'clash',
        headline: `Too close to ${closest.meal.title}`,
        detail:
          `${closest.meal.title} at ${formatTime12(closest.meal.time)} carries about ` +
          `${formatAmount(closest.amount, unitFor(nutrientCode))} of ${name}, ${describeGap(closest.gap)} from this dose. ` +
          `${rule.guidance} Aim for at least ${hours} hour${hours === 1 ? '' : 's'} between them.`,
        citation: rule.citation,
        mechanism: rule.mechanism,
        ruleId: rule.id,
      });
      continue;
    }

    if (rule.ruleType === 'dietary_cofactor' && rule.subjectB === 'fat_total') {
      if (!doseMatchesSubject(dose, rule.subjectAKind, rule.subjectA)) continue;
      const windowMinutes = FAT_WINDOW_HOURS * 60;
      let best: { meal: TimelineMeal; grams: number } | null = null;
      let unresolvedInWindow = false;
      for (const meal of eaten) {
        const gap = Math.abs(minutesOfDay(meal.time) - doseMinutes);
        if (gap > windowMinutes) continue;
        if (!meal.nutrientsResolved) {
          unresolvedInWindow = true;
          continue;
        }
        const grams = meal.nutrients['fat_total'] ?? 0;
        if (grams < MIN_MEANINGFUL_FAT_GRAMS) continue;
        if (!best || grams > best.grams) best = { meal, grams };
      }

      if (best) {
        notes.push({
          kind: 'good',
          headline: `${best.meal.title} covers the fat this one needs`,
          detail:
            `${best.meal.title} at ${formatTime12(best.meal.time)} carries about ${Math.round(best.grams)} g of fat, ` +
            `which is what this dose absorbs with.`,
          citation: rule.citation,
          mechanism: rule.mechanism,
          ruleId: rule.id,
        });
      } else if (!unresolvedInWindow) {
        notes.push({
          kind: 'missing',
          headline: 'Nothing with fat in it near this dose',
          detail:
            `${rule.guidance} Nothing carrying much fat is scheduled within ${FAT_WINDOW_HOURS} hours of this time. ` +
            `Moving the dose to a meal that has some fat in it is usually easier than changing the meal.`,
          citation: rule.citation,
          mechanism: rule.mechanism,
          ruleId: rule.id,
        });
      }
      continue;
    }
  }

  if (anyNutrientRuleApplied && anyUnresolvedNearby) {
    notes.push({
      kind: 'unknown',
      headline: 'One meal near this dose could not be checked',
      detail:
        'A meal scheduled near this time has nothing linked to the food database, so what it carries is unknown ' +
        'rather than nothing. Building it in the Food tab is what gives it ingredients to read.',
      citation: null,
      mechanism: null,
      ruleId: null,
    });
  }

  const order: Record<DoseFoodNote['kind'], number> = { clash: 0, missing: 1, unknown: 2, good: 3 };
  return notes.sort((a, b) => order[a.kind] - order[b.kind]);
}

export function doseGuidance(
  dose: TimelineDose,
  timings: TimingReference[],
  nutrientNames: Record<string, string> = {},
): DoseGuidanceLine[] {
  const lines: DoseGuidanceLine[] = [];
  for (const code of dose.nutrientCodes) {
    const timing = timings.find((entry) => entry.nutrientCode === code);
    if (!timing) continue;
    lines.push({ nutrientName: nutrientLabel(code, nutrientNames), bestTaken: timing.bestTaken, citation: timing.citation });
  }
  return lines;
}

// Meals and doses in one day, in the order they happen. A dose and a meal
// at the same minute put the meal first, since somebody reading the day
// thinks about the plate before the pill beside it.
export function buildDayTimeline(
  meals: TimelineMeal[],
  doses: TimelineDose[],
  rules: TimingRule[],
  timings: TimingReference[],
  nutrientNames: Record<string, string> = {},
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const meal of meals) {
    entries.push({ kind: 'meal', time: meal.time, sortKey: `${meal.time}_0_${meal.id}`, meal });
  }
  for (const dose of doses) {
    entries.push({
      kind: 'dose',
      time: dose.time,
      sortKey: `${dose.time}_1_${dose.id}`,
      dose,
      notes: doseFoodNotes(dose, meals, rules, nutrientNames),
      guidance: doseGuidance(dose, timings, nutrientNames),
    });
  }
  return entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

// One line above the day, or null when there is nothing to say. Counts
// doses rather than notes, since two warnings on one dose is still one
// thing to move.
export function timelineSummary(entries: TimelineEntry[]): string | null {
  let clashing = 0;
  let missing = 0;
  for (const entry of entries) {
    if (entry.kind !== 'dose') continue;
    if (entry.notes.some((note) => note.kind === 'clash')) clashing += 1;
    else if (entry.notes.some((note) => note.kind === 'missing')) missing += 1;
  }
  if (clashing === 0 && missing === 0) return null;
  const parts: string[] = [];
  if (clashing === 1) parts.push('1 dose sits too close to a meal that competes with it');
  else if (clashing > 1) parts.push(`${clashing} doses sit too close to meals that compete with them`);
  if (missing === 1) parts.push('1 dose has no meal near it to absorb with');
  else if (missing > 1) parts.push(`${missing} doses have no meal near them to absorb with`);
  return `${parts.join(', and ')}.`;
}
