// Reading a recipe page, matching its lines to foods, and keeping the import
// while it is reviewed (G1, 1.0.53.12). Every decision about the text is in
// lib/recipeImport.ts; this file does the fetching and the database.
//
// Matching follows the voice log's rule: a line's candidates are searched
// with the same ladder and scored with the same overlap score, and only a
// confident match is filled in for the person. Anything less stays open to
// be picked or left out, so a guess never reaches a builder unseen.

import {
  getDatabase,
  resolveFoodOptionForBaseName,
  searchReferenceFoodNamesAcrossCategories,
  type GlobalFoodMatch,
} from './db';
import { getDesktopBridge, isDesktopApp } from './desktop/bridge';
import { CONFIDENT_MATCH_SCORE, buildFoodSearchLadder, scoreNameMatch } from './quickLog';
import {
  extractRecipeFromHtml,
  isFetchableUrl,
  newImportLine,
  pageTitleFromHtml,
  siteNameFromUrl,
  toBuilderAmount,
  type ImportUnit,
  type ImportedRecipe,
  type RecipeImportLine,
  type RecipeImportMatch,
} from './recipeImport';

const FETCH_TIMEOUT_MS = 15000;

export type FetchedRecipe =
  | { kind: 'recipe'; recipe: ImportedRecipe }
  | { kind: 'noRecipe'; url: string; site: string; pageTitle: string };

/** Reads the page and looks for its Recipe block. Rejects with a sentence. */
export async function fetchRecipeFromUrl(rawUrl: string): Promise<FetchedRecipe> {
  const url = rawUrl.trim();
  if (!isFetchableUrl(url)) throw new Error('That does not look like a web address. It should start with http:// or https://.');
  let html: string;
  let finalUrl = url;
  if (isDesktopApp()) {
    const web = getDesktopBridge().web;
    if (!web) throw new Error('This version of the desktop app cannot read web pages. Install the newest one to import from a link.');
    const page = await web.fetchPage(url);
    html = page.text;
    finalUrl = page.finalUrl || url;
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/html,application/xhtml+xml' } });
      if (!response.ok) throw new Error(`The site answered ${response.status}.`);
      html = await response.text();
      finalUrl = response.url || url;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('The site took longer than 15 seconds to answer.');
      if (error instanceof Error && /network request failed/i.test(error.message)) {
        throw new Error('The page could not be reached. Check the connection and the address.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  const recipe = extractRecipeFromHtml(html, url);
  if (recipe) return { kind: 'recipe', recipe: { ...recipe, sourceUrl: url, sourceSite: siteNameFromUrl(finalUrl) || recipe.sourceSite } };
  return { kind: 'noRecipe', url, site: siteNameFromUrl(finalUrl), pageTitle: pageTitleFromHtml(html) };
}

export type ImportCandidate = { match: GlobalFoodMatch; score: number };

/** Candidates for one line, best first. Empty when the search finds nothing. */
export async function findImportCandidates(text: string, limit = 8): Promise<ImportCandidate[]> {
  let matches: GlobalFoodMatch[] = [];
  for (const query of buildFoodSearchLadder(text)) {
    matches = await searchReferenceFoodNamesAcrossCategories(query, undefined, limit);
    if (matches.length > 0) break;
  }
  return matches
    .map((match) => ({ match, score: scoreNameMatch(text, match.baseName) }))
    .sort((a, b) => b.score - a.score);
}

/** A candidate turned into a food the builders can hold. */
export async function resolveImportCandidate(candidate: ImportCandidate, picked: boolean): Promise<RecipeImportMatch | null> {
  const option = await resolveFoodOptionForBaseName(candidate.match.category, candidate.match.baseName);
  if (!option) return null;
  return {
    foodId: option.foodId,
    source: option.source,
    foodName: candidate.match.baseName,
    category: candidate.match.category,
    score: picked ? null : candidate.score,
    picked,
  };
}

/** Fills in a line only when its best candidate is a confident match. */
export async function autoMatchLine(line: RecipeImportLine): Promise<RecipeImportLine> {
  if (line.isHeader || line.leftOut || line.match || !line.searchText) return line;
  const candidates = await findImportCandidates(line.searchText);
  const top = candidates[0];
  if (!top || top.score < CONFIDENT_MATCH_SCORE) return line;
  const match = await resolveImportCandidate(top, false);
  return match ? { ...line, match } : line;
}

// --- Storage ---------------------------------------------------------------------

export type RecipeImportRecord = {
  id: string;
  sourceUrl: string | null;
  sourceSite: string | null;
  title: string;
  author: string | null;
  yieldText: string | null;
  servings: number | null;
  servingSizeAmount: number | null;
  servingSizeUnit: string | null;
  instructions: string[];
  lines: RecipeImportLine[];
  builderType: string | null;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  source_url: string | null;
  source_site: string | null;
  title: string;
  author: string | null;
  yield_text: string | null;
  servings: number | null;
  serving_size_amount: number | null;
  serving_size_unit: string | null;
  instructions_json: string;
  lines_json: string;
  builder_type: string | null;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
};

function parseJsonArray<T>(text: string): T[] {
  try {
    const value = JSON.parse(text);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function fromRow(row: Row): RecipeImportRecord {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourceSite: row.source_site,
    title: row.title,
    author: row.author,
    yieldText: row.yield_text,
    servings: row.servings,
    servingSizeAmount: row.serving_size_amount,
    servingSizeUnit: row.serving_size_unit,
    instructions: parseJsonArray<string>(row.instructions_json),
    lines: parseJsonArray<RecipeImportLine>(row.lines_json),
    builderType: row.builder_type,
    openedAt: row.opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRecipeImport(input: {
  sourceUrl: string | null;
  sourceSite: string | null;
  title: string;
  author: string | null;
  yieldText: string | null;
  servings: number | null;
  instructions: string[];
  ingredientLines: string[];
}): Promise<RecipeImportRecord> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `recipe_import_${Date.now()}`;
  const lines = input.ingredientLines.map(newImportLine);
  await db.runAsync(
    `INSERT INTO recipe_imports (id, source_url, source_site, title, author, yield_text, servings, instructions_json, lines_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.sourceUrl,
    input.sourceSite,
    input.title.trim() || 'Imported recipe',
    input.author,
    input.yieldText,
    input.servings,
    JSON.stringify(input.instructions),
    JSON.stringify(lines),
    now,
    now,
  );
  return (await getRecipeImport(id))!;
}

export async function getRecipeImport(id: string): Promise<RecipeImportRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Row>('SELECT * FROM recipe_imports WHERE id = ?', id);
  return row ? fromRow(row) : null;
}

export async function listRecipeImports(): Promise<RecipeImportRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>('SELECT * FROM recipe_imports ORDER BY created_at DESC');
  return rows.map(fromRow);
}

export async function saveRecipeImport(record: RecipeImportRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE recipe_imports SET title = ?, servings = ?, serving_size_amount = ?, serving_size_unit = ?, lines_json = ?, builder_type = ?, updated_at = ?
     WHERE id = ?`,
    record.title.trim() || 'Imported recipe',
    record.servings,
    record.servingSizeAmount,
    record.servingSizeUnit,
    JSON.stringify(record.lines),
    record.builderType,
    new Date().toISOString(),
    record.id,
  );
}

export async function deleteRecipeImport(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipe_imports WHERE id = ?', id);
}

/**
 * Puts every kept line into the builder's units for this measurement
 * system and saves, ready for getBuilderFavorite to hand to a builder.
 */
export async function prepareImportForBuilder(record: RecipeImportRecord, system: 'metric' | 'imperial'): Promise<void> {
  const lines = record.lines.map((line) => {
    if (line.isHeader || line.leftOut || !line.match || line.quantity === null) {
      return { ...line, builderQuantity: null, builderUnit: null };
    }
    const amount = toBuilderAmount(line.quantity, line.unit as ImportUnit, system);
    return { ...line, builderQuantity: amount.quantity, builderUnit: amount.unit };
  });
  await saveRecipeImport({ ...record, lines });
}
