// Standard questionnaires in the check-in (D13 in the competitive build
// plan, 2026-09-30): four published scales a person can add to the
// periodic check-in at app/assessment.tsx, each scored the way its authors
// published it and nothing more.
//
// WHICH SCALES, AND WHY THESE
//
//   PHQ-9 (mood) and GAD-7 (worry): Kroenke, Spitzer and Williams, and
//     Spitzer, Kroenke, Williams and Lowe. Pfizer holds the copyright and
//     states "No permission required to reproduce, translate, display or
//     distribute." Their published bands are used as given.
//   MFIS-5 (fatigue): items 1, 9, 10, 17 and 19 of the Modified Fatigue
//     Impact Scale, from the MS Council for Clinical Practice Guidelines'
//     MSQLI. In the public domain, free for commercial use. It has no
//     published bands, so none are shown.
//   PEG (pain): Krebs et al., J Gen Intern Med 2009;24:733-738. In the
//     public domain. Scored as the average of its three items; no bands.
//
//   Checked and left out (2026-09-30): the Fatigue Severity Scale is free
//   only for non-profit research, and the Brief Pain Inventory and FACIT-F
//   are licensed. Neither belongs in a paid app without a licence.
//
// WORDING
//
//   Item wording is the published wording. The PHQ-9 prints two em dashes
//   (items 6 and 8); here they are a comma and parentheses, which changes
//   punctuation and no words.
//
// HOW IT BEHAVES
//
//   - A band is named only when every scored item is answered, because the
//     bands were published for a full answer sheet. A partial sheet shows
//     how many were answered and no band.
//   - A band is the scale's published name for a range of scores, and the
//     sentence says it is not a diagnosis.
//   - Any answer above "Not at all" on PHQ-9 item 9 brings a line asking the
//     person to tell somebody today, with where to find help. It never says
//     the answer is or is not an emergency.
//   - Last time and this time are put side by side as numbers. Nothing here
//     calls a change good or bad.
//
// No I/O and no React; scripts/test_standard_questionnaires.js runs it
// directly.

export type QuestionnaireCode = 'phq9' | 'gad7' | 'mfis5' | 'peg';

export type QuestionnaireItem = { code: string; prompt: string; scored: boolean };

export type Band = { min: number; max: number; label: string };

export type Questionnaire = {
  code: QuestionnaireCode;
  /** What the chip says: "Mood (PHQ-9)". */
  chip: string;
  title: string;
  stem: string;
  items: QuestionnaireItem[];
  /** Answer choices for the scored items, value then words. */
  scale: { value: number; label: string }[];
  /** Answer choices for an unscored item, when it has its own. */
  unscoredScale?: { value: number; label: string }[];
  /** "sum" adds the scored items; "mean" averages them. */
  scoring: 'sum' | 'mean';
  maxScore: number;
  bands: Band[] | null;
  /** Finishes "Higher means ...". */
  higherMeans: string;
  source: string;
};

const FOUR_POINT = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const DIFFICULTY = [
  { value: 0, label: 'Not difficult at all' },
  { value: 1, label: 'Somewhat difficult' },
  { value: 2, label: 'Very difficult' },
  { value: 3, label: 'Extremely difficult' },
];

const DIFFICULTY_PROMPT =
  'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?';

const PFIZER = 'Copyright Pfizer Inc. No permission required to reproduce, translate, display or distribute.';

const ZERO_TO_TEN = Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) }));

export const QUESTIONNAIRES: Questionnaire[] = [
  {
    code: 'phq9',
    chip: 'Mood (PHQ-9)',
    title: 'Mood: the PHQ-9',
    stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    items: [
      { code: 'phq9_1', prompt: 'Little interest or pleasure in doing things', scored: true },
      { code: 'phq9_2', prompt: 'Feeling down, depressed, or hopeless', scored: true },
      { code: 'phq9_3', prompt: 'Trouble falling or staying asleep, or sleeping too much', scored: true },
      { code: 'phq9_4', prompt: 'Feeling tired or having little energy', scored: true },
      { code: 'phq9_5', prompt: 'Poor appetite or overeating', scored: true },
      {
        code: 'phq9_6',
        prompt: 'Feeling bad about yourself, or that you are a failure or have let yourself or your family down',
        scored: true,
      },
      { code: 'phq9_7', prompt: 'Trouble concentrating on things, such as reading the newspaper or watching television', scored: true },
      {
        code: 'phq9_8',
        prompt:
          'Moving or speaking so slowly that other people could have noticed? Or the opposite (being so fidgety or restless that you have been moving around a lot more than usual)',
        scored: true,
      },
      { code: 'phq9_9', prompt: 'Thoughts that you would be better off dead or of hurting yourself in some way', scored: true },
      { code: 'phq9_difficulty', prompt: DIFFICULTY_PROMPT, scored: false },
    ],
    scale: FOUR_POINT,
    unscoredScale: DIFFICULTY,
    scoring: 'sum',
    maxScore: 27,
    bands: [
      { min: 0, max: 4, label: 'minimal' },
      { min: 5, max: 9, label: 'mild' },
      { min: 10, max: 14, label: 'moderate' },
      { min: 15, max: 19, label: 'moderately severe' },
      { min: 20, max: 27, label: 'severe' },
    ],
    higherMeans: 'more of these problems, more often',
    source: `Kroenke K, Spitzer RL, Williams JB. J Gen Intern Med 2001;16:606-613. ${PFIZER}`,
  },
  {
    code: 'gad7',
    chip: 'Worry (GAD-7)',
    title: 'Worry: the GAD-7',
    stem: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    items: [
      { code: 'gad7_1', prompt: 'Feeling nervous, anxious, or on edge', scored: true },
      { code: 'gad7_2', prompt: 'Not being able to stop or control worrying', scored: true },
      { code: 'gad7_3', prompt: 'Worrying too much about different things', scored: true },
      { code: 'gad7_4', prompt: 'Trouble relaxing', scored: true },
      { code: 'gad7_5', prompt: 'Being so restless that it is hard to sit still', scored: true },
      { code: 'gad7_6', prompt: 'Becoming easily annoyed or irritable', scored: true },
      { code: 'gad7_7', prompt: 'Feeling afraid, as if something awful might happen', scored: true },
      { code: 'gad7_difficulty', prompt: DIFFICULTY_PROMPT, scored: false },
    ],
    scale: FOUR_POINT,
    unscoredScale: DIFFICULTY,
    scoring: 'sum',
    maxScore: 21,
    bands: [
      { min: 0, max: 4, label: 'minimal' },
      { min: 5, max: 9, label: 'mild' },
      { min: 10, max: 14, label: 'moderate' },
      { min: 15, max: 21, label: 'severe' },
    ],
    higherMeans: 'more of these problems, more often',
    source: `Spitzer RL, Kroenke K, Williams JB, Lowe B. Arch Intern Med 2006;166:1092-1097. ${PFIZER}`,
  },
  {
    code: 'mfis5',
    chip: 'Fatigue (MFIS-5)',
    title: 'Fatigue: the MFIS-5',
    stem: 'Because of my fatigue during the past 4 weeks:',
    items: [
      { code: 'mfis5_1', prompt: 'I have been less alert.', scored: true },
      { code: 'mfis5_9', prompt: 'I have been limited in my ability to do things away from home.', scored: true },
      { code: 'mfis5_10', prompt: 'I have trouble maintaining physical effort for long periods.', scored: true },
      { code: 'mfis5_17', prompt: 'I have been less able to complete tasks that require physical effort.', scored: true },
      { code: 'mfis5_19', prompt: 'I have had trouble concentrating.', scored: true },
    ],
    scale: [
      { value: 0, label: 'Never' },
      { value: 1, label: 'Rarely' },
      { value: 2, label: 'Sometimes' },
      { value: 3, label: 'Often' },
      { value: 4, label: 'Almost always' },
    ],
    scoring: 'sum',
    maxScore: 20,
    bands: null,
    higherMeans: 'fatigue got in the way more often',
    source: 'Modified Fatigue Impact Scale, 5-item version (items 1, 9, 10, 17, 19), Multiple Sclerosis Council for Clinical Practice Guidelines, 1998. In the public domain.',
  },
  {
    code: 'peg',
    chip: 'Pain (PEG)',
    title: 'Pain: the PEG',
    stem: 'For each, pick a number from 0 to 10.',
    items: [
      {
        code: 'peg_pain',
        prompt: 'What number best describes your pain on average in the past week? 0 is no pain, 10 is pain as bad as you can imagine.',
        scored: true,
      },
      {
        code: 'peg_enjoyment',
        prompt:
          'What number best describes how, during the past week, pain has interfered with your enjoyment of life? 0 is does not interfere, 10 is completely interferes.',
        scored: true,
      },
      {
        code: 'peg_activity',
        prompt:
          'What number best describes how, during the past week, pain has interfered with your general activity? 0 is does not interfere, 10 is completely interferes.',
        scored: true,
      },
    ],
    scale: ZERO_TO_TEN,
    scoring: 'mean',
    maxScore: 10,
    bands: null,
    higherMeans: 'more pain, or pain getting in the way more',
    source: 'Krebs EE et al. J Gen Intern Med 2009;24:733-738. In the public domain.',
  },
];

const BY_CODE = new Map(QUESTIONNAIRES.map((q) => [q.code, q]));

export function questionnaire(code: QuestionnaireCode): Questionnaire {
  const found = BY_CODE.get(code);
  if (!found) throw new Error(`No questionnaire called ${code}`);
  return found;
}

export function isQuestionnaireCode(value: string): value is QuestionnaireCode {
  return BY_CODE.has(value as QuestionnaireCode);
}

/** Which questionnaire an answer belongs to, from its item code. */
export function questionnaireForItem(itemCode: string): Questionnaire | null {
  for (const q of QUESTIONNAIRES) if (q.items.some((item) => item.code === itemCode)) return q;
  return null;
}

/** The choices an item is answered with. */
export function choicesFor(q: Questionnaire, item: QuestionnaireItem): { value: number; label: string }[] {
  return item.scored ? q.scale : (q.unscoredScale ?? q.scale);
}

/** The chosen list as stored, in the order the scales are listed. */
export function parseChosen(stored: string | null): QuestionnaireCode[] {
  if (!stored) return [];
  const wanted = new Set(stored.split(',').map((part) => part.trim()));
  return QUESTIONNAIRES.filter((q) => wanted.has(q.code)).map((q) => q.code);
}

export function serializeChosen(codes: readonly QuestionnaireCode[]): string {
  return QUESTIONNAIRES.filter((q) => codes.includes(q.code))
    .map((q) => q.code)
    .join(',');
}

export type QuestionnaireScore = {
  code: QuestionnaireCode;
  answered: number;
  scoredItems: number;
  /** The total, or the average for PEG; null until every scored item is answered. */
  score: number | null;
  band: Band | null;
  /** The answer to the unscored difficulty item, as words. */
  difficulty: string | null;
};

type Answer = { itemCode: string; value: number };

export function scoreQuestionnaire(q: Questionnaire, answers: readonly Answer[]): QuestionnaireScore {
  const byItem = new Map(answers.map((a) => [a.itemCode, a.value]));
  const scored = q.items.filter((item) => item.scored);
  const values = scored.map((item) => byItem.get(item.code)).filter((v): v is number => typeof v === 'number');
  const complete = values.length === scored.length;
  const sum = values.reduce((total, v) => total + v, 0);
  const score = complete ? (q.scoring === 'mean' ? Math.round((sum / scored.length) * 10) / 10 : sum) : null;
  const band = score != null && q.bands ? (q.bands.find((b) => score >= b.min && score <= b.max) ?? null) : null;
  const unscored = q.items.find((item) => !item.scored);
  const difficultyValue = unscored ? byItem.get(unscored.code) : undefined;
  const difficulty =
    difficultyValue == null ? null : (choicesFor(q, unscored!).find((c) => c.value === difficultyValue)?.label ?? null);
  return { code: q.code, answered: values.length, scoredItems: scored.length, score, band, difficulty };
}

/** Whether any answer in the list belongs to this questionnaire. */
export function hasAnswers(q: Questionnaire, answers: readonly Answer[]): boolean {
  return answers.some((a) => q.items.some((item) => item.code === a.itemCode));
}

/** "PHQ-9", from the chip's brackets. */
export function shortName(q: Questionnaire): string {
  return /\(([^)]+)\)/.exec(q.chip)?.[1] ?? q.title;
}

function formatScore(q: Questionnaire, score: number): string {
  return q.scoring === 'mean' ? `${score.toFixed(1)} out of ${q.maxScore}` : `${score} out of ${q.maxScore}`;
}

/** The main line under a questionnaire's result. */
export function scoreLine(q: Questionnaire, s: QuestionnaireScore): string {
  if (s.score == null) {
    return `${s.answered} of ${s.scoredItems} answered. A score is worked out once all ${s.scoredItems} are answered.`;
  }
  const head = q.scoring === 'mean' ? `Average ${formatScore(q, s.score)}` : `Score ${formatScore(q, s.score)}`;
  if (!s.band) return `${head}. Higher means ${q.higherMeans}.`;
  return `${head}, in the band the scale's authors call ${s.band.label} (${s.band.min} to ${s.band.max}).`;
}

/** What the band means and does not mean. */
export function bandNote(q: Questionnaire): string {
  if (q.bands) {
    return `The bands are the published ranges for the ${shortName(q)}. A score is not a diagnosis; your clinician can say what it means for you.`;
  }
  return 'This scale has no published bands, so none are shown. A score is not a diagnosis; your clinician can say what it means for you.';
}

/** "Last time, on Sep 2, 2026: 12 out of 27." Or null when there is no earlier full score. */
export function lastTimeLine(q: Questionnaire, previous: { score: number | null; on: string } | null): string | null {
  if (!previous || previous.score == null) return null;
  return `Last time, on ${previous.on}: ${formatScore(q, previous.score)}.`;
}

/** Any answer above "Not at all" on PHQ-9 item 9. */
export function needsSafetyLine(answers: readonly Answer[]): boolean {
  return answers.some((a) => a.itemCode === 'phq9_9' && a.value > 0);
}

export const SAFETY_LINE =
  'You said thoughts of being better off dead or of hurting yourself came up. Please tell somebody today: your clinician, someone you trust, or a crisis line. If you might act on these thoughts, call your local emergency number now.';

export const HELPLINE_URL = 'https://findahelpline.com';

export const HELPLINE_LABEL = 'Find a free crisis line in your country';

export const QUESTIONNAIRES_INTRO =
  'Published scales you can add to this check-in. Each is scored the way its authors published it.';
