// Gathers what lib/captureSuggest.ts reasons from (C8): the names of things
// the person keeps, and every note they have already sorted. Read only; a
// suggestion writes nothing until it is tapped, and then it is an ordinary
// sort through setCaptureNoteDestination.
import { getDatabase } from './db';
import { ALL_CAPTURE_DESTINATION_KEYS, type CaptureDestinationKey } from './captureNotes';
import {
  buildSuggestModel,
  leaveOneOut,
  type LeaveOneOutResult,
  type SortedExample,
  type SuggestModel,
  type SuggestVocabulary,
} from './captureSuggest';

// Enough names to know the person, never so many that matching a note slows.
const NAME_LIMIT = 400;

async function names(sql: string): Promise<string[]> {
  const db = await getDatabase();
  try {
    const rows = await db.getAllAsync<{ name: string | null }>(`${sql} LIMIT ${NAME_LIMIT}`);
    return [...new Set(rows.map((row) => (row.name ?? '').trim()).filter(Boolean))];
  } catch (error) {
    // A table from a later version missing on an old copy leaves that kind
    // of evidence out rather than the whole suggestion.
    console.warn('[captureSuggest] Could not read names', error);
    return [];
  }
}

export async function loadSuggestVocabulary(): Promise<SuggestVocabulary> {
  const [growing, gardenAreas, upkeep, bills, accounts, meds, groceries, kitchen] = await Promise.all([
    names(`SELECT DISTINCT food_name AS name FROM garden_plantings WHERE status IN ('growing', 'planned')`),
    names('SELECT name FROM garden_plots WHERE archived_at IS NULL'),
    names('SELECT name FROM upkeep_items'),
    names('/* vault:tool */ SELECT name FROM finance_recurring'),
    names('/* vault:tool */ SELECT name FROM finance_accounts WHERE active = 1'),
    names('SELECT name FROM treatments WHERE active = 1'),
    names('SELECT DISTINCT food_name AS name FROM grocery_list_items'),
    names('SELECT DISTINCT food_name AS name FROM kitchen_items'),
  ]);
  return { growing, gardenAreas, upkeep, bills, accounts, meds, groceries, kitchen };
}

/** Every note ever sorted, oldest first so a later sorting of the same words
 *  wins. Done notes count too: where a note went is not undone by doing it. */
export async function loadSortedExamples(): Promise<SortedExample[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ text: string; destination: string }>(
    `SELECT text, destination FROM capture_notes
      WHERE destination IS NOT NULL
      ORDER BY COALESCE(sorted_at, created_at) ASC`,
  );
  const known = new Set<string>(ALL_CAPTURE_DESTINATION_KEYS);
  return rows
    .filter((row) => known.has(row.destination))
    .map((row) => ({ text: row.text, destination: row.destination as CaptureDestinationKey }));
}

export async function loadSuggestModel(): Promise<SuggestModel> {
  const [vocabulary, sorted] = await Promise.all([loadSuggestVocabulary(), loadSortedExamples()]);
  return buildSuggestModel(vocabulary, sorted);
}

/** For Developer Tools: how the suggestions would have done on this
 *  person's sorted notes. */
export async function checkSuggestionsAgainstSorted(): Promise<LeaveOneOutResult> {
  const [vocabulary, sorted] = await Promise.all([loadSuggestVocabulary(), loadSortedExamples()]);
  return leaveOneOut(vocabulary, sorted);
}
