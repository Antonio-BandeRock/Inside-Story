import {
  getDailyNutrientBreakdown,
  getTreatmentNutrients,
  listInteractionRules,
  listPrescriptionTreatments,
  listScheduledPrescriptionsForDate,
  listScheduledSupplementsForDate,
  listSupplementTreatments,
  listUpcomingAppointments,
  type ScheduleItemRecord,
  type TreatmentRecord,
} from './db';

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
};

// A cited rule shown as static reference content, for a rule this app
// simply can't evaluate against real data (checkable=false in
// scripts/add_interaction_rules.py). Every rule shipped today is
// checkable, so this is currently always empty -- kept as a real,
// documented path (not dead code) since a future rule may legitimately
// need to stay reference-only, the same way the levothyroxine and biotin
// rules did before prescriptions and appointments were built out.
export type ReferenceOnlyRule = {
  ruleId: string;
  severity: 'caution' | 'note';
  title: string;
  guidance: string;
  citation: string;
};

export type InteractionEvaluation = {
  warnings: InteractionWarning[];
  referenceOnly: ReferenceOnlyRule[];
};

function timeToHours(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours + minutes / 60;
}

// A rule's subject is either a nutrient (matched against a supplement's
// documented ingredients by nutrient_code) or a prescription (matched
// against a prescription treatment's own name, case-insensitively -- a
// prescription has no structured ingredient list the way a supplement
// does, so free-text name matching is the only option, e.g. subject
// 'levothyroxine' matching a treatment named "Levothyroxine 75mcg").
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
    return context.prescriptionTreatments.filter((treatment) => treatment.name.toLowerCase().includes(needle));
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
  const [rules, activeSupplements, activePrescriptions, scheduledSupplementDoses, scheduledPrescriptionDoses, breakdown, upcomingAppointments] =
    await Promise.all([
      listInteractionRules(),
      listSupplementTreatments(true),
      listPrescriptionTreatments(true),
      listScheduledSupplementsForDate(date),
      listScheduledPrescriptionsForDate(date),
      getDailyNutrientBreakdown(date),
      listUpcomingAppointments(date, addDaysToDateString(date, APPOINTMENT_LOOKAHEAD_WINDOW_DAYS)),
    ]);

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
    prescriptionTreatments: activePrescriptions,
  };

  const warnings: InteractionWarning[] = [];
  const referenceOnly: ReferenceOnlyRule[] = [];

  for (const rule of rules) {
    if (!rule.checkable) {
      referenceOnly.push({
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.title,
        guidance: rule.guidance,
        citation: rule.citation,
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
        });
      }
    }
  }

  return { warnings, referenceOnly };
}
