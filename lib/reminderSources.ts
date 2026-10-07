// The things that carry a date but never lived in the schedule, 2026-09-16.
//
// Direct request: reminder coverage for everything else that carries a date.
// Bills, upkeep and expiring work benefits all sit in Life, all have a date
// that matters, and until this pass none of them could reach the phone.
// Garden tasks were the fourth on that list and are not here, because they
// already are schedule_items rows (item_type 'garden', see
// scheduleGardenTask in lib/db.ts) and so travel the existing candidate path
// with nothing new needed but a kind.
//
// These three do need something new, and it is not much: each already has a
// module that works out the date from whatever it stores, and the rule this
// file follows is to call that module rather than re-derive anything.
//
//   Bills     finance_recurring keeps a due_rule_json and
//             financeSchedule's nextOccurrence turns it into the next date.
//   Upkeep    upkeep_items is LAST-DONE-anchored, not calendar-anchored
//             (see that table's own comment for why the two are genuinely
//             different), and upkeep's upkeepStanding does that arithmetic.
//   Benefits  work_benefits has reset_on, and workBenefits' benefitStanding
//             says whether there is anything left to lose when it comes.
//
// Re-deriving any of those three here would be the drift this project keeps
// having to unpick elsewhere: correct the rule in one place and the reminder
// would quietly disagree.
//
// A fourth joined 2026-09-21, the Days Until counters under garden areas
// ("Add a reminder on the day for a Days Until counter"), on the same rule:
//
//   Counters  garden_countdowns has started_on and days, and
//             countdown's countdownDueDate is the one place that adds
//             them; gardenCountdownDb's listRunningGardenCountdowns already
//             knows which are still running under an area still in use.
//
// That source stopped being only about the garden on 2026-09-22, when a
// counter could be started for anything at all (lib/countdownDb.ts). Both
// kinds raise the same reminder on the same rule; they differ only in where
// a tap lands, Garden for one and Life for the other, which is what the tab
// field on a source is for.
//
// A fifth joined 2026-09-23, a compost pile waiting to be turned:
//
//   Compost   compost_piles carries the pile's cadence and compost_events
//             carries every turn, and compost's compostTurnDueOn adds the
//             two. Before this the Compost lens booked a single garden task
//             that did not come back and did not clear when the pile was
//             actually turned; now the date is worked out from the pile
//             itself, so recording a turn moves it and nobody has to book
//             anything again.

import { formatFinanceMoney } from './financeCore';
import { countdownDueDate } from './countdown';
import { listRunningGardenCountdowns } from './gardenCountdownDb';
import { listRunningCountdowns } from './countdownDb';
import { compostTurnDueOn, compostTurnInterval, describeCompostTurn } from './compost';
import { listCompostPilesToTurn } from './compostDb';
import { listRecurring } from './financeDb';
import { nextOccurrence } from './financeSchedule';
import { listUpkeepItems } from './upkeepDb';
import { upkeepCategoryLabel, upkeepStanding } from './upkeep';
import { listBenefits } from './workDb';
import { benefitStanding, formatBenefitAmount } from './workBenefits';
import type { DatedReminderKind } from './reminderSchedule';
import { listAllActiveTreatments } from './db';
import { listSupplyReadings } from './medDetailsDb';
import { describeRefillDue } from './medSupply';
import { listKitchenInventory } from './kitchenDb';
import { formatGroceryAmount } from './groceryList';
import { isUseByDate } from './useBy';
import { listOpenTodos } from './todosDb';
import { cropPlanReminders } from './cropPlan';
import { listCropPlanSteps, listCropPlans } from './cropPlanDb';
import { readCachedFrostDates } from './homeSky';
import { frostAnchor } from './sowingWindows';

/** Where a tapped reminder lands, each a lens that already takes a deep
 *  link (openLifeLens in app/(tabs)/life.tsx, openGardenLens in
 *  app/(tabs)/garden.tsx). */
export type DatedReminderLens =
  | 'finances'
  | 'upkeep'
  | 'work'
  | 'daysUntil'
  | 'compost'
  | 'myMeds'
  | 'kitchen'
  | 'todos'
  | 'sowingCalendar';
/** A garden counter and a compost pile land on Garden when tapped;
 *  everything else on Life. */
export type DatedReminderTab = 'life' | 'garden';

export type DatedReminderSource = {
  kind: DatedReminderKind;
  /** The row's own id, which is what makes the notification identifier
   *  stable: the same bill keeps the same reminder across reconciles rather
   *  than being cancelled and rescheduled every time the app opens. */
  sourceId: string;
  title: string;
  /** One short line of context, or null when there is nothing honest to add.
   *  An amount nobody entered is never guessed at. */
  detail: string | null;
  /** 'YYYY-MM-DD'. */
  dueOn: string;
  tab: DatedReminderTab;
  lens: DatedReminderLens;
  /** False when the notification cannot carry a button that answers it:
   *  upkeep that expires, since renewing it needs the new date (C1,
   *  lib/reminderActions.ts). Absent means it can. */
  markable?: boolean;
};

/**
 * Everything with a date worth a reminder, as of `today`.
 *
 * Anything whose date cannot be worked out is left out rather than guessed
 * at, which is the same stance each of these areas already takes on its own
 * screen: an every-2-weeks bill with no anchor, a service that has never
 * been done, a benefit nobody gave a reset date. Those are reported as
 * missing pieces where they are entered, and a reminder invented from a
 * guessed date would be worse than none.
 */
export async function listDatedReminderSources(today: string): Promise<DatedReminderSource[]> {
  const [recurring, upkeepItems, benefits, countdowns, freeCountdowns, piles] = await Promise.all([
    listRecurring(true),
    listUpkeepItems(),
    listBenefits(),
    listRunningGardenCountdowns(),
    listRunningCountdowns(),
    listCompostPilesToTurn(),
  ]);
  const [activeTreatments, supplies] = await Promise.all([listAllActiveTreatments(), listSupplyReadings(today)]);
  const [kitchenFood, kitchenOther] = await Promise.all([listKitchenInventory('food'), listKitchenInventory('non_food')]);
  const todos = await listOpenTodos();

  const sources: DatedReminderSource[] = [];

  // Bills. Expenses only, because being reminded that a salary is due
  // achieves nothing. Autopay rows are left out too: the money moves on its
  // own, and the reminder would be telling somebody about a thing that
  // needs no action from them, which is how a notification stream stops
  // being read.
  for (const row of recurring) {
    if (!row.active || row.direction !== 'expense' || row.autopay || !row.rule) continue;
    const dueOn = nextOccurrence(row.rule, today);
    if (!dueOn) continue;
    sources.push({
      kind: 'bill',
      sourceId: row.id,
      title: row.name,
      detail: row.amount > 0 ? formatFinanceMoney(row.amount) : null,
      dueOn,
      tab: 'life',
      lens: 'finances',
    });
  }

  // Upkeep. Both cadences arrive the same way here because upkeepStanding
  // has already turned "six months after it was last done" and "the day the
  // passport expires" into one date.
  for (const item of upkeepItems) {
    if (!item.active) continue;
    const standing = upkeepStanding(item, today);
    if (!standing.dueOn) continue;
    sources.push({
      kind: 'upkeep',
      sourceId: item.id,
      title: item.name,
      detail:
        item.cadence === 'expires'
          ? item.renewable
            ? `${upkeepCategoryLabel(item.category)}, renewable`
            : `${upkeepCategoryLabel(item.category)}, does not renew`
          : upkeepCategoryLabel(item.category),
      dueOn: standing.dueOn,
      tab: 'life',
      lens: 'upkeep',
      markable: item.cadence !== 'expires',
    });
  }

  // Work benefits. Only the ones with something still in them: a reminder
  // that an allowance already spent to the last dollar is about to reset is
  // noise. expiringUnused is exactly that question, and it is already the
  // one the Work screen flags on.
  for (const benefit of benefits) {
    if (!benefit.active || !benefit.resetOn || benefit.resets === 'never') continue;
    const standing = benefitStanding(benefit, today);
    if (standing.remaining == null || standing.remaining <= 0) continue;
    sources.push({
      kind: 'benefit',
      sourceId: benefit.id,
      title: benefit.name,
      detail: `${formatBenefitAmount(benefit.kind, standing.remaining)} still unused`,
      dueOn: benefit.resetOn.slice(0, 10),
      tab: 'life',
      lens: 'work',
    });
  }

  // Days Until counters, 2026-09-21. Only the running ones under areas
  // still in use, which is the same list Home shows; a counter marked done
  // or removed, or whose area moved to Past Areas, leaves this list and the
  // next reconcile clears whatever it had queued. The day it lands comes
  // from lib/countdown.ts, the same arithmetic the counter's row
  // reads by. The detail names the area, and the planting when the counter
  // is for one, so the line says where to go and look.
  for (const countdown of countdowns) {
    sources.push({
      kind: 'countdown',
      sourceId: countdown.id,
      title: countdown.name,
      detail: countdown.plantingName ? `${countdown.plotName}, ${countdown.plantingName}` : countdown.plotName,
      dueOn: countdownDueDate(countdown),
      tab: 'garden',
      lens: 'daysUntil',
    });
  }

  // The counters that are about anything else, 2026-09-22. Same arithmetic,
  // same one reminder on the day it lands; the detail is whatever the person
  // wrote under the name, and there may be nothing, in which case the name
  // carries the line by itself. Ids cannot collide with the garden ones,
  // which is what the two prefixes in the two add functions are for.
  for (const countdown of freeCountdowns) {
    sources.push({
      kind: 'countdown',
      sourceId: countdown.id,
      title: countdown.name,
      detail: countdown.about,
      dueOn: countdownDueDate(countdown),
      tab: 'life',
      lens: 'daysUntil',
    });
  }

  // Compost piles waiting to be turned, 2026-09-23. Active piles only,
  // which is the same line summarizeCompostPile draws: a curing pile is
  // left alone by definition and a finished one is gone. The day comes
  // from lib/compost.ts, the same arithmetic behind the turning sentence
  // on the pile's row, so the reminder and the row cannot say different
  // things. Recording a turn moves the day on, which is why this kind
  // nudges while it is overdue.
  for (const { pile, lastTurnedOn } of piles) {
    const dueOn = compostTurnDueOn(pile, lastTurnedOn);
    if (!dueOn) continue;
    sources.push({
      kind: 'compost',
      sourceId: pile.id,
      title: pile.name,
      detail: `${describeCompostTurn(lastTurnedOn, today)}, turned every ${compostTurnInterval(pile)} days`,
      dueOn,
      tab: 'garden',
      lens: 'compost',
    });
  }

  // A med running low (A3, Phase 2). Only a med still being tracked and
  // counted, with a pace on the schedule or in its marks: a count with
  // nothing to divide it by has no day to name, and a day guessed at would
  // be worse than none. Saving a fresh count moves the day on. Not
  // markable, since answering it takes the new count.
  for (const treatment of activeTreatments) {
    const reading = supplies.get(treatment.id);
    if (!reading?.remindOn) continue;
    sources.push({
      kind: 'refill',
      sourceId: treatment.id,
      title: treatment.name,
      detail: describeRefillDue(treatment.name, reading),
      dueOn: reading.remindOn,
      tab: 'life',
      lens: 'myMeds',
      markable: false,
    });
  }

  // Something in the kitchen with a use-by date (H2, 2026-09-28). Only what
  // still has some left, which is all listKitchenInventory returns, so
  // marking a thing used up or gone takes its reminder with it. The detail
  // is how much is left and where it was put, so the line says what to go
  // and look for. Not markable: the answer is using it, which is recorded on
  // the Kitchen.
  for (const item of [...kitchenFood, ...kitchenOther]) {
    if (!isUseByDate(item.useBy)) continue;
    const left = `${formatGroceryAmount(item.quantityRemaining, item.unit)} left`;
    sources.push({
      kind: 'useBy',
      sourceId: item.id,
      title: item.foodName,
      detail: item.location ? `${left}, ${item.location}` : left,
      dueOn: item.useBy,
      tab: 'life',
      lens: 'kitchen',
      markable: false,
    });
  }

  // A to-do given a day (C10, 2026-09-30). Only open ones, and only the
  // day it holds now: marking a repeating one done moves its day on, so
  // the reminder moves with it. Done on the notification marks it done.
  // Every one lands on Life > To-Do, which holds both kinds.
  for (const todo of todos) {
    if (!todo.dueOn || todo.dueOn < today) continue;
    sources.push({
      kind: 'todo',
      sourceId: todo.id,
      title: todo.title,
      detail: todo.notes ? todo.notes.split('\n')[0].slice(0, 120) : null,
      dueOn: todo.dueOn,
      tab: 'life',
      lens: 'todos',
    });
  }

  // My Crops (2026-10-01): only the crops somebody chose, from the frost
  // dates last worked out for the saved place, with no fetch. No crops or
  // no worked-out place means nothing at all.
  const plans = await listCropPlans();
  if (plans.length > 0) {
    const frost = await readCachedFrostDates();
    const anchor = frost.status === 'ready' ? frostAnchor(frost.dates.frost, frost.dates.southern) : null;
    if (anchor) {
      const steps = await listCropPlanSteps();
      for (const r of cropPlanReminders(plans, steps, anchor, today)) {
        if (r.dueOn < today) continue;
        sources.push({ ...r, tab: 'garden', lens: 'sowingCalendar', markable: true });
      }
    }
  }

  return sources;
}
