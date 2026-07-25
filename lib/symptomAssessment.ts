// Pure scoring for the periodic, retakeable self-assessment (hypothyroid
// symptoms, digestive/IBS, wellbeing). No DB/React dependency -- callers in
// lib/db.ts and the UI supply the item codes/values already loaded.
//
// Item-code lists below must match scripts/build_food_reference_db.py's
// ASSESSMENT_ITEMS -- this is fixed, versioned content (like the D1-D6
// rubric), not something meant to vary per install.

export type AssessmentResponseValue = { itemCode: string; value: number };

function valueFor(responses: AssessmentResponseValue[], itemCode: string): number | null {
  const match = responses.find((r) => r.itemCode === itemCode);
  return match ? match.value : null;
}

// --- Hypothyroid symptoms: 13 items, each 0 (not at all) - 4 (very severe) ---

const HYPOTHYROID_ITEM_CODES = [
  'hypo_fatigue',
  'hypo_cold_intolerance',
  'hypo_dry_skin',
  'hypo_hair_loss',
  'hypo_constipation',
  'hypo_weight_gain',
  'hypo_muscle_aches',
  'hypo_brain_fog',
  'hypo_swelling',
  'hypo_slowed_movement',
  'hypo_voice_changes',
  'hypo_joint_pain',
  'hypo_hearing_changes',
];

export type HypothyroidSymptomScore = {
  rawScore: number;
  maxScore: number;
  // 0-100, lower is better (this is a symptom-burden score, not a wellbeing one).
  percentScore: number;
  itemsAnswered: number;
};

export function scoreHypothyroidSymptoms(responses: AssessmentResponseValue[]): HypothyroidSymptomScore {
  let rawScore = 0;
  let itemsAnswered = 0;

  for (const code of HYPOTHYROID_ITEM_CODES) {
    const value = valueFor(responses, code);
    if (value != null) {
      rawScore += value;
      itemsAnswered += 1;
    }
  }

  const maxScore = HYPOTHYROID_ITEM_CODES.length * 4;
  return { rawScore, maxScore, percentScore: (rawScore / maxScore) * 100, itemsAnswered };
}

// --- Digestive/IBS: 5 items following the real IBS-SSS structure/bands ---

export type DigestiveSeverityBand = 'remission' | 'mild' | 'moderate' | 'severe';

export type DigestiveSymptomScore = {
  // 0-500, lower is better -- matches the published IBS-SSS scale exactly
  // so the bands below are the real, cited cutoffs, not invented ones.
  rawScore: number;
  band: DigestiveSeverityBand;
};

// Citation: Francis CY, Morris J, Whorwell PJ, "The irritable bowel severity
// scoring system," Aliment Pharmacol Ther. 1997;11(2):395-402.
export function scoreDigestiveSymptoms(responses: AssessmentResponseValue[]): DigestiveSymptomScore {
  const painSeverity = valueFor(responses, 'ibs_pain_severity') ?? 0;
  const painFrequencyDays = valueFor(responses, 'ibs_pain_frequency') ?? 0;
  const bloating = valueFor(responses, 'ibs_bloating') ?? 0;
  const bowelDissatisfaction = valueFor(responses, 'ibs_bowel_satisfaction') ?? 0;
  const lifeInterference = valueFor(responses, 'ibs_life_interference') ?? 0;

  // The frequency item is "days out of the last 10," scaled x10 to sit on
  // the same 0-100 basis as the four VAS-style items, matching the real
  // IBS-SSS methodology.
  const rawScore = painSeverity + painFrequencyDays * 10 + bloating + bowelDissatisfaction + lifeInterference;

  let band: DigestiveSeverityBand;
  if (rawScore < 75) band = 'remission';
  else if (rawScore < 175) band = 'mild';
  else if (rawScore < 300) band = 'moderate';
  else band = 'severe';

  return { rawScore, band };
}

// --- Wellbeing: 5 items, each 0 (none of the time) - 5 (all of the time) ---

const WELLBEING_ITEM_CODES = [
  'wellbeing_cheerful',
  'wellbeing_calm',
  'wellbeing_energetic',
  'wellbeing_rested',
  'wellbeing_engaged',
];

export type WellbeingScore = {
  rawScore: number;
  // 0-100, higher is better -- same raw-score-x4 conversion the WHO-5
  // methodology this domain is modeled on uses.
  percentScore: number;
  itemsAnswered: number;
};

export function scoreWellbeing(responses: AssessmentResponseValue[]): WellbeingScore {
  let rawScore = 0;
  let itemsAnswered = 0;

  for (const code of WELLBEING_ITEM_CODES) {
    const value = valueFor(responses, code);
    if (value != null) {
      rawScore += value;
      itemsAnswered += 1;
    }
  }

  return { rawScore, percentScore: rawScore * 4, itemsAnswered };
}

export type AssessmentScores = {
  hypothyroidSymptoms: HypothyroidSymptomScore;
  digestiveSymptoms: DigestiveSymptomScore;
  wellbeing: WellbeingScore;
};

export function scoreAssessment(responses: AssessmentResponseValue[]): AssessmentScores {
  return {
    hypothyroidSymptoms: scoreHypothyroidSymptoms(responses),
    digestiveSymptoms: scoreDigestiveSymptoms(responses),
    wellbeing: scoreWellbeing(responses),
  };
}

export type AssessmentComparison = {
  hypothyroidSymptomsDeltaPercent: number; // negative = improved (less symptom burden)
  digestiveSymptomsDeltaRaw: number; // negative = improved (lower IBS-SSS)
  wellbeingDeltaPercent: number; // positive = improved
};

// Simple delta between two scored assessments -- deliberately just the
// numbers, no generated prose; the UI decides how to phrase "you're doing
// better," this just tells it which direction and by how much.
export function compareAssessmentScores(previous: AssessmentScores, current: AssessmentScores): AssessmentComparison {
  return {
    hypothyroidSymptomsDeltaPercent: current.hypothyroidSymptoms.percentScore - previous.hypothyroidSymptoms.percentScore,
    digestiveSymptomsDeltaRaw: current.digestiveSymptoms.rawScore - previous.digestiveSymptoms.rawScore,
    wellbeingDeltaPercent: current.wellbeing.percentScore - previous.wellbeing.percentScore,
  };
}
