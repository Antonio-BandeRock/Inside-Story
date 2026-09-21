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
//             gardenCountdown's countdownDueDate is the one place that adds
//             them; gardenCountdownDb's listRunningGardenCountdowns already
//             knows which are still running under an area still in use.
//
// It is the one dated source that lands on Garden rather than Life when
// tapped, which is what the tab field on a source is for.

import { formatFinanceMoney } from './financeCore';
import { countdownDueDate } from './gardenCountdown';
import { listRunningGardenCountdowns } from './gardenCountdownDb';
import { listRecurring } from './financeDb';
import { nextOccurrence } from './financeSchedule';
import { listUpkeepItems } from './upkeepDb';
import { upkeepCategoryLabel, upkeepStanding } from './upkeep';
import { listBenefits } from './workDb';
import { benefitStanding, formatBenefitAmount } from './workBenefits';
import type { DatedReminderKind } from './reminderSchedule';

/** Where a tapped reminder lands. All three live in Life, under a lens that
 *  already takes a deep link (openLifeLens, app/(tabs)/life.tsx). */
export type DatedReminderLens = 'finances' | 'upkeep' | 'work' | 'plotsAndPlantings';
/** A countdown lands on Garden when tapped; the other three on Life. */
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
  const [recurring, upkeepItems, benefits, countdowns] = await Promise.all([
    listRecurring(),
    listUpkeepItems(),
    listBenefits(),
    listRunningGardenCountdowns(),
  ]);

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
  // from lib/gardenCountdown.ts, the same arithmetic the counter's row
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
      lens: 'plotsAndPlantings',
    });
  }

  return sources;
}
