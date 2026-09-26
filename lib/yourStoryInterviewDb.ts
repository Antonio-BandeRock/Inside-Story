// The database side of Your Story's interview (lib/yourStoryInterview.ts
// holds every question and sentence). Two jobs: the answers that leave no
// record anywhere else, in your_story_answers, and gathering the facts the
// questions are answered by.
//
// Everything else a question is answered by already has a home: conditions,
// stages, eating styles and allergies in their own tables through lib/db.ts,
// the parts of life in user_beats, and medicines in treatments. Nothing
// here stores "done".
import { buildYourStory, dayKey } from './yourStory';
import type { YourStoryView } from './yourStory';
import { buildGuides } from './yourStoryGuides';
import type { GuideView } from './yourStoryGuides';
import { buildInterview } from './yourStoryInterview';
import type { InterviewAnswer, InterviewFacts, InterviewView } from './yourStoryInterview';
import { loadYourStoryFacts, lookForGuideRecords, markYourStorySeen } from './yourStoryDb';
import { getConditionStagingModel } from './conditionStages';
import { NEURO_PROFILE_LABELS } from './neuroProfile';
import {
  getConditionStages,
  getDatabase,
  getDietPreferences,
  getUserConditions,
  listAllConditions,
  listFoodAllergies,
  listNeuroProfile,
} from './db';

export async function setYourStoryAnswer(key: string, answer: string | null = null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO your_story_answers (question_key, answered_on, answer) VALUES (?, ?, ?)
      ON CONFLICT(question_key) DO UPDATE SET answered_on = excluded.answered_on, answer = excluded.answer
    `,
    key,
    dayKey(new Date()),
    answer,
  );
}

export async function clearYourStoryAnswer(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM your_story_answers WHERE question_key = ?', key);
}

async function readAnswers(): Promise<Record<string, InterviewAnswer>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ question_key: string; answered_on: string; answer: string | null }>(
    'SELECT question_key, answered_on, answer FROM your_story_answers',
  );
  const answers: Record<string, InterviewAnswer> = {};
  for (const row of rows) answers[row.question_key] = { on: row.answered_on, answer: row.answer };
  return answers;
}

// A failure in any one read leaves that part empty rather than blanking the
// whole interview, the same stance the guides take.
async function safely<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.warn('Your Story interview read failed', error);
    return fallback;
  }
}

export type YourStoryEverything = { view: YourStoryView; guides: GuideView[]; interview: InterviewView };

// Your Story, its guides and its interview in one read, so the Home card and
// the full page never disagree about what is on record.
export async function loadYourStoryEverything(withGuides = true): Promise<YourStoryEverything> {
  const facts = await loadYourStoryFacts();
  const view = buildYourStory(facts);
  for (const seen of view.newlySeen) {
    await markYourStorySeen(seen.key, seen.day);
  }
  const db = await getDatabase();
  const [records, conditions, allConditions, stages, diets, allergies, neuro, answers] = await Promise.all([
    safely(() => lookForGuideRecords(db), {}),
    safely(getUserConditions, [] as string[]),
    safely(listAllConditions, []),
    safely(getConditionStages, {} as Record<string, string>),
    safely(getDietPreferences, [] as string[]),
    safely(listFoodAllergies, [] as string[]),
    safely(listNeuroProfile, []),
    safely(readAnswers, {} as Record<string, InterviewAnswer>),
  ]);
  const conditionNames: Record<string, string> = {};
  for (const condition of allConditions) conditionNames[condition.code] = condition.name;
  const conditionChoices = allConditions.filter((condition) => condition.status !== 'planned').map((condition) => condition.code);
  const stagedConditions: InterviewFacts['stagedConditions'] = [];
  for (const code of conditions) {
    const model = getConditionStagingModel(code);
    if (!model) continue;
    const stageLabels: Record<string, string> = {};
    for (const stage of model.stages) stageLabels[stage.code] = stage.label;
    stagedConditions.push({ code, label: conditionNames[code] ?? model.conditionLabel, stageLabels });
  }
  const interview = buildInterview({
    story: view,
    conditionChoices,
    conditions,
    conditionNames,
    stagedConditions,
    stages,
    neuro,
    neuroLabels: NEURO_PROFILE_LABELS,
    diets,
    allergies,
    answers,
    records,
  });
  return { view, guides: withGuides ? buildGuides(facts, records) : [], interview };
}
