import {
  endOfLocalDay,
  getDailyNutrientBreakdown,
  getMealItemsInWindow,
  getTreatmentNutrients,
  getUserConditions,
  getUserProfile,
  listInteractionRules,
  listOtcTreatments,
  listPersonalRules,
  listPrescriptionTreatments,
  listScheduledPrescriptionsForDate,
  listScheduledSupplementsForDate,
  listSupplementTreatments,
  listUpcomingAppointments,
  type PersonalRule,
  type ScheduleItemRecord,
  type TreatmentRecord,
} from './db';
import { ageFromBirthDate } from './profile';

const APPOINTMENT_LOOKAHEAD_WINDOW_DAYS = 60;

function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setDate(parsed.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

// A triggered, personalized warning from a checkable rule -- 'confirmed'
// means it was evaluated against real scheduled dose times or logged food;
// 'unverified' means both halves of the rule (e.g. a supplement and a
// prescription) are active but at least one has no specific dose time set,
// so the timing itself couldn't actually be checked (only that the person
// takes both).
export type InteractionWarning = {
  ruleId: string;
  severity: 'caution' | 'note';
  title: string;
  message: string;
  citation: string;
  confidence: 'confirmed' | 'unverified';
  // A generic (no personal data involved) explanation of the actual
  // mechanism behind this rule, shown only on request -- see
  // InteractionRuleRecord's own comment in lib/db.ts. Null for any rule
  // that hasn't been individually researched and written yet.
  mechanism: string | null;
};

// A cited rule shown as static reference content, for a rule this app
// can't evaluate against real data precisely (checkable=0 in
// scripts/add_interaction_rules.py) -- a dose-CONSISTENCY note rather
// than a timing gap, a symptom to watch for by name, a genuinely serious
// caution that's worth stating plainly rather than computing exactly.
// Real as of 2026-08-18: 17 rows in the live reference database, added
// across many condition build-outs (Graves', Psoriasis, Gout, CVD, and
// more). Still gated on the person's own active treatments -- see
// evaluateInteractionRules' own handling below -- so this only ever
// shows something that actually has to do with what they take.
export type ReferenceOnlyRule = {
  ruleId: string;
  severity: 'caution' | 'note';
  title: string;
  guidance: string;
  citation: string;
  // See InteractionWarning's own comment above -- same field, same
  // discipline.
  mechanism: string | null;
};

export type InteractionEvaluation = {
  warnings: InteractionWarning[];
  referenceOnly: ReferenceOnlyRule[];
  // The person's own rules, currently applying -- see personal_rules'
  // own table comment in lib/db.ts and matchingPersonalRules below for
  // exactly what "currently applying" means per link type. Deliberately
  // a real PersonalRule[], not a separate summarized shape -- the caller
  // already has everything it needs (description, source, link info) to
  // render these distinctly from warnings/referenceOnly without a
  // second lookup.
  personalRules: PersonalRule[];
};

// 2026-08-18 -- the personal-rule half of this engine. Deliberately no
// timing math the way timing_separation above has; a real, simple
// "does this currently apply" check per link_type: 'none' rules always
// show (nothing to check against), 'treatment' rules show only while
// that specific treatment is active, 'food' rules show only when
// something logged today contains the person's own typed keyword.
// Condition-linking was considered and deliberately left out of this
// pass -- a real, cheap future addition, not part of what was asked for.
async function matchingPersonalRules(date: string, activeTreatmentIds: Set<string>): Promise<PersonalRule[]> {
  const allRules = await listPersonalRules(true);
  if (allRules.length === 0) return [];

  const needsFoodLog = allRules.some((rule) => rule.linkType === 'food');
  let todaysFoodNames: string[] = [];
  if (needsFoodLog) {
    const items = await getMealItemsInWindow(date, endOfLocalDay(date));
    todaysFoodNames = items.map((item) => item.foodName.toLowerCase());
  }

  return allRules.filter((rule) => {
    if (rule.linkType === 'none') return true;
    if (rule.linkType === 'treatment') {
      return rule.linkValue != null && activeTreatmentIds.has(rule.linkValue);
    }
    if (rule.linkType === 'food') {
      const needle = (rule.linkValue ?? '').toLowerCase().trim();
      if (!needle) return false;
      return todaysFoodNames.some((name) => name.includes(needle));
    }
    return false;
  });
}

function timeToHours(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours + minutes / 60;
}

// A rule's subject is either a nutrient (matched against a supplement's
// documented ingredients by nutrient_code) or a prescription/OTC treatment.
// Updated 2026-08-08 for My Meds: prefers an exact match against the
// treatment's own structured genericName when one is set (reliable
// regardless of what the person actually named the item, e.g. "Metformin
// 500mg" or "my diabetes pill" both have genericName 'metformin'), and
// only falls back to the original free-text substring match against
// `name` for treatments that predate genericName or were never given one --
// the same graceful-degradation shape this app already uses elsewhere
// rather than a breaking change to matching that's worked until now.
// `prescriptionTreatments` here is deliberately still named for
// prescriptions only in the type below, but as of My Meds also receives
// OTC treatments from the caller, since both are matched identically by
// this same function -- see evaluateInteractionRules' own subjectContext.
function activeTreatmentsForSubject(
  kind: string,
  subject: string,
  context: {
    supplementTreatments: TreatmentRecord[];
    ingredientsByTreatment: Record<string, { nutrientCode: string }[]>;
    prescriptionTreatments: TreatmentRecord[];
  },
): TreatmentRecord[] {
  if (kind === 'nutrient') {
    return context.supplementTreatments.filter((treatment) =>
      (context.ingredientsByTreatment[treatment.id] ?? []).some((ingredient) => ingredient.nutrientCode === subject),
    );
  }
  if (kind === 'prescription') {
    const needle = subject.toLowerCase();
    return context.prescriptionTreatments.filter((treatment) =>
      treatment.genericName ? treatment.genericName.toLowerCase() === needle : treatment.name.toLowerCase().includes(needle),
    );
  }
  return [];
}

// Checks every checkable rule against this person's actual active
// supplements, active prescriptions, today's scheduled dose times, and
// today's logged food -- and returns the non-checkable rules
// unconditionally as reference content. Only rules that actually apply to
// what the person is doing (e.g. they track both halves of a
// timing_separation pair) ever produce a warning -- consistent with the
// rest of the app not nagging about hypothetical, inapplicable situations.
export async function evaluateInteractionRules(date: string): Promise<InteractionEvaluation> {
  const [
    rules,
    activeSupplements,
    activePrescriptions,
    activeOtc,
    scheduledSupplementDoses,
    scheduledPrescriptionDoses,
    breakdown,
    upcomingAppointments,
    profile,
    conditionCodes,
  ] = await Promise.all([
    listInteractionRules(),
    listSupplementTreatments(true),
    listPrescriptionTreatments(true),
    listOtcTreatments(true),
    listScheduledSupplementsForDate(date),
    listScheduledPrescriptionsForDate(date),
    getDailyNutrientBreakdown(date),
    listUpcomingAppointments(date, addDaysToDateString(date, APPOINTMENT_LOOKAHEAD_WINDOW_DAYS)),
    getUserProfile(),
    getUserConditions(),
  ]);
  // Resolved once per evaluation, not per rule -- the same real age
  // ('age_threshold_caution' rules below check against this) every time a
  // birth date is on file, null when it isn't (Profile's own birth-date
  // fields are all optional).
  const ageYears = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null;

  const ingredientsByTreatment: Record<string, { nutrientCode: string }[]> = {};
  await Promise.all(
    activeSupplements.map(async (treatment) => {
      ingredientsByTreatment[treatment.id] = await getTreatmentNutrients(treatment.id);
    }),
  );

  const dosesByTreatmentId: Record<string, ScheduleItemRecord[]> = {};
  for (const dose of [...scheduledSupplementDoses, ...scheduledPrescriptionDoses]) {
    if (!dose.linkedTreatmentId) continue;
    (dosesByTreatmentId[dose.linkedTreatmentId] ??= []).push(dose);
  }

  const subjectContext = {
    supplementTreatments: activeSupplements,
    ingredientsByTreatment,
    // OTC treatments merged in alongside prescriptions, 2026-08-08 for My
    // Meds -- a rule's own subject_a_kind='prescription' is really "matched
    // by generic name/free-text name against a single-substance treatment,"
    // which is exactly as true of an OTC item (e.g. omeprazole) as a real
    // prescription. Not renamed to something more generic (e.g.
    // 'medication') to avoid touching every existing rule row's own
    // subject_a_kind value in the reference database for a naming-only
    // change.
    prescriptionTreatments: [...activePrescriptions, ...activeOtc],
  };

  // Built once here, not inside matchingPersonalRules -- these three
  // arrays are already resolved above for the cited-rule matching this
  // function already does, so a 'treatment'-linked personal rule reuses
  // the identical "is this currently active" data rather than a second
  // fetch.
  const activeTreatmentIds = new Set([
    ...activeSupplements.map((treatment) => treatment.id),
    ...activePrescriptions.map((treatment) => treatment.id),
    ...activeOtc.map((treatment) => treatment.id),
  ]);
  const personalRules = await matchingPersonalRules(date, activeTreatmentIds);

  const warnings: InteractionWarning[] = [];
  const referenceOnly: ReferenceOnlyRule[] = [];

  for (const rule of rules) {
    if (!rule.checkable) {
      // 2026-08-18 direct correction: this used to push every checkable=0
      // rule unconditionally, with no check for whether the person's own
      // active treatments have anything to do with it -- confirmed via a
      // direct query, that meant showing all 17 real reference-only rows
      // to everyone, every time, the same as someone tracking nothing at
      // all. Every other rule type below already gates on a real subject
      // match before pushing anything; this one never did. Gated on
      // subjectA only, the same one-sided precedent the checkable
      // dietary_cofactor rules just below already use -- a real, deliberate
      // choice over also requiring subjectB: several of these rows name a
      // category (e.g. "another immunosuppressant") rather than one
      // literal, matchable drug in subjectB, and gating that too would
      // risk silently hiding a real caution rather than just under-showing
      // one -- subjectA alone is what makes this relevant at all.
      // Same real 'condition' handling age_threshold_caution below already
      // uses -- none of today's 17 rows are condition-linked (confirmed
      // directly), but activeTreatmentsForSubject only ever resolves
      // 'nutrient'/'prescription', so a future condition-linked
      // reference-only rule would otherwise silently never show at all.
      const subjectAApplies =
        rule.subjectAKind === 'condition'
          ? conditionCodes.includes(rule.subjectA)
          : activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext).length > 0;
      if (!subjectAApplies) continue;
      referenceOnly.push({
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.title,
        guidance: rule.guidance,
        citation: rule.citation,
        mechanism: rule.mechanism,
      });
      continue;
    }

    if (rule.ruleType === 'timing_separation' && rule.subjectBKind && rule.subjectB && rule.minSeparationHours != null) {
      const treatmentsA = activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext);
      const treatmentsB = activeTreatmentsForSubject(rule.subjectBKind, rule.subjectB, subjectContext);
      if (treatmentsA.length === 0 || treatmentsB.length === 0) {
        continue;
      }

      const timesA = treatmentsA.flatMap((treatment) =>
        (dosesByTreatmentId[treatment.id] ?? []).map((dose) => timeToHours(dose.scheduledFor.slice(11, 16))),
      );
      const timesB = treatmentsB.flatMap((treatment) =>
        (dosesByTreatmentId[treatment.id] ?? []).map((dose) => timeToHours(dose.scheduledFor.slice(11, 16))),
      );

      if (timesA.length === 0 || timesB.length === 0) {
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} You're tracking both, but at least one has no specific dose time set today -- add a reminder time below to let this be checked precisely.`,
          citation: rule.citation,
          confidence: 'unverified',
          mechanism: rule.mechanism,
        });
        continue;
      }

      let closestGapHours = Infinity;
      for (const hourA of timesA) {
        for (const hourB of timesB) {
          closestGapHours = Math.min(closestGapHours, Math.abs(hourA - hourB));
        }
      }

      if (closestGapHours < rule.minSeparationHours) {
        const gapLabel = closestGapHours < 0.1 ? 'at the same time' : `about ${closestGapHours.toFixed(1)} hour(s) apart`;
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} Today's scheduled times are ${gapLabel} -- aim for at least ${rule.minSeparationHours} hours.`,
          citation: rule.citation,
          confidence: 'confirmed',
          mechanism: rule.mechanism,
        });
      }
      continue;
    }

    if (rule.ruleType === 'appointment_caution' && rule.subjectBKind === 'appointment_type' && rule.subjectB && rule.lookaheadDays != null) {
      const treatmentsA = activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext);
      if (treatmentsA.length === 0) {
        continue;
      }

      const cutoffDate = addDaysToDateString(date, rule.lookaheadDays);
      const matchingAppointment = upcomingAppointments.find(
        (appointment) =>
          appointment.appointmentType === rule.subjectB &&
          appointment.status === 'planned' &&
          appointment.scheduledFor.slice(0, 10) <= cutoffDate,
      );

      if (matchingAppointment) {
        const appointmentDate = matchingAppointment.scheduledFor.slice(0, 10);
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} Appointment: ${appointmentDate} -- "${matchingAppointment.title}".`,
          citation: rule.citation,
          confidence: 'confirmed',
          mechanism: rule.mechanism,
        });
      }
      continue;
    }

    if (rule.ruleType === 'dietary_cofactor' && rule.subjectB === 'fat_total') {
      const treatmentsA = activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext);
      if (treatmentsA.length === 0) {
        continue;
      }
      const fatToday = breakdown.dayTotals['fat_total'] ?? 0;
      const MIN_MEANINGFUL_FAT_GRAMS = 5;
      if (fatToday < MIN_MEANINGFUL_FAT_GRAMS) {
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} You've logged very little dietary fat so far today (about ${Math.round(fatToday)}g).`,
          citation: rule.citation,
          confidence: 'confirmed',
          mechanism: rule.mechanism,
        });
      }
      continue;
    }

    // Added 2026-08-08 for My Meds -- a real new rule shape, not just a new
    // row in an existing one. Unlike timing_separation, this doesn't care
    // about dose TIMES at all (e.g. metformin measurably lowering TSH
    // isn't fixed by spacing the two doses apart -- it's a real,
    // persistent pharmacological effect for as long as both are active).
    // Fires once, at 'note' or 'caution' severity as the rule itself
    // specifies, whenever both named subjects are simultaneously active,
    // with no scheduled-dose-time dependency the way timing_separation
    // has.
    if (rule.ruleType === 'concurrent_use_caution' && rule.subjectBKind && rule.subjectB) {
      const treatmentsA = activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext);
      const treatmentsB = activeTreatmentsForSubject(rule.subjectBKind, rule.subjectB, subjectContext);
      if (treatmentsA.length === 0 || treatmentsB.length === 0) {
        continue;
      }
      warnings.push({
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.title,
        message: rule.guidance,
        citation: rule.citation,
        confidence: 'confirmed',
        mechanism: rule.mechanism,
      });
      continue;
    }

    // Added 2026-08-08 -- a real, personalized rule keyed on the person's
    // own age, resolved from their real Profile birth date, not a
    // hypothetical "this applies to older adults" note shown to everyone
    // regardless of who they actually are. subjectAKind is either
    // 'nutrient'/'prescription' (an active treatment, matched the same way
    // every other rule type already does) or the new 'condition' kind
    // (matched against the person's own selected conditions from Profile).
    // At least one of minAge/maxAge is set on a real row of this type; a
    // rule fires when the resolved subject is real AND the person's real
    // age falls inside whatever band is set.
    if (rule.ruleType === 'age_threshold_caution' && (rule.minAge != null || rule.maxAge != null)) {
      const subjectApplies =
        rule.subjectAKind === 'condition'
          ? conditionCodes.includes(rule.subjectA)
          : activeTreatmentsForSubject(rule.subjectAKind, rule.subjectA, subjectContext).length > 0;
      if (!subjectApplies) {
        continue;
      }
      if (ageYears == null) {
        // A real, honest "can't personalize this yet" state -- distinct
        // from every other rule's own 'unverified' case (a missing dose
        // TIME), this one is a missing birth date. Surfaced rather than
        // silently skipped, since the subject genuinely does apply; the
        // only thing missing is the one real input needed to check it.
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} Add your birth date in Profile to see whether this specifically applies to you.`,
          citation: rule.citation,
          confidence: 'unverified',
          mechanism: rule.mechanism,
        });
        continue;
      }
      const withinBand = (rule.minAge == null || ageYears >= rule.minAge) && (rule.maxAge == null || ageYears <= rule.maxAge);
      if (withinBand) {
        warnings.push({
          ruleId: rule.id,
          severity: rule.severity,
          title: rule.title,
          message: `${rule.guidance} Based on the age in your profile (${ageYears}).`,
          citation: rule.citation,
          confidence: 'confirmed',
          mechanism: rule.mechanism,
        });
      }
      continue;
    }
  }

  return { warnings, referenceOnly, personalRules };
}
