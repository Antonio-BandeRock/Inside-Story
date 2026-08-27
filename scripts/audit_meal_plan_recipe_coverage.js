// 2026-08-26, direct request: "find out how many breakfast, lunch, and
// dinners there are that can relate to any of the conditions, and make
// sure there are at least 30 for each of them for breakfast, lunch, and
// dinner." A read-only audit, no database or recipes.ts writes -- built
// to answer that question precisely before deciding what (if anything)
// actually needs new recipe content, rather than guessing at the scale.
//
// Mirrors lib/dailyMealPlan.ts's own real eligibility logic exactly
// (BREAKFAST_ELIGIBLE_RECIPE_IDS, the lunch/dinner builder-type pools,
// and conditionTierForEntry's own green/yellow/red resolution), extracted
// from lib/digest/recipes.ts by regex block-splitting rather than an
// actual TS compile step (this project's own established pattern for a
// read-only content audit, see the 2026-08-23 alphabetization sweep).
const fs = require('fs');
const path = require('path');

const RECIPES_FILE = path.join(__dirname, '..', 'lib', 'digest', 'recipes.ts');
const DAILY_MEAL_PLAN_FILE = path.join(__dirname, '..', 'lib', 'dailyMealPlan.ts');

const CONDITION_CODES = [
  'hashimotos', 'graves', 'rheumatoid_arthritis', 'lupus', 'multiple_sclerosis', 'psoriasis',
  'sjogrens', 'celiac', 'ibd', 'ibs', 'type_1_diabetes', 'type_2_diabetes', 'pcos',
  'chronic_kidney_disease', 'fatty_liver_disease', 'gout', 'cardiovascular_disease',
  'prostate_health', 'migraine',
];

const LUNCH_MAIN_TYPES = new Set(['side', 'salad', 'soup', 'handheld', 'smoothie']);
const DINNER_MAIN_TYPES = new Set(['side', 'salad', 'soup', 'handheld']);

function extractBreakfastEligibleIds() {
  const content = fs.readFileSync(DAILY_MEAL_PLAN_FILE, 'utf8');
  const start = content.indexOf('BREAKFAST_ELIGIBLE_RECIPE_IDS = new Set<string>([');
  const end = content.indexOf(']);', start);
  const block = content.slice(start, end);
  // 2026-08-26, hardened after this exact regex twice miscounted a real
  // batch: a `//` comment line inside this array (explaining why a batch
  // of ids was added) is completely normal here, and any apostrophe in
  // it (an entirely ordinary word like "Hashimoto's") reads as a string
  // delimiter to a naive quote-matching regex, silently swallowing every
  // real id up to the next apostrophe. Comment lines are stripped before
  // matching now, so writing a normal, apostrophe-containing comment in
  // this array never silently corrupts this count again.
  const codeOnly = block
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  const ids = [...codeOnly.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  return new Set(ids);
}

function extractRecipeEntries(content) {
  const entryStartRe = /\{\s*\n\s*id: '([^']+)',/g;
  const starts = [];
  let m;
  while ((m = entryStartRe.exec(content)) !== null) {
    starts.push({ id: m[1], index: m.index });
  }
  const entries = [];
  for (let i = 0; i < starts.length; i++) {
    const blockStart = starts[i].index;
    const blockEnd = i + 1 < starts.length ? starts[i + 1].index : content.length;
    const block = content.slice(blockStart, blockEnd);
    const linkedRecipeMatch = block.match(/linkedCuratedRecipeId: '([^']+)'/);
    const linkedTypeMatch = block.match(/linkedBuilderType: '([^']+)'/);
    if (!linkedRecipeMatch || !linkedTypeMatch) continue;

    const recipeCardMatch = block.match(/recipeCard: \{([\s\S]*?)\n {4}\},\n {2}\},/);
    const cardBlock = recipeCardMatch ? recipeCardMatch[1] : block;

    const safeForMatch = cardBlock.match(/safeForConditions: \[([^\]]*)\]/);
    const safeForConditions = safeForMatch
      ? [...safeForMatch[1].matchAll(/'([^']+)'/g)].map((mm) => mm[1])
      : [];

    const cautionsMatch = cardBlock.match(/conditionCautions: \{([\s\S]*?)\n {6}\},/);
    const conditionCautions = {};
    if (cautionsMatch) {
      const cautionsBlock = cautionsMatch[1];
      const cautionRe = /(\w+): \{ severity: '(\w+)'/g;
      let cm;
      while ((cm = cautionRe.exec(cautionsBlock)) !== null) {
        conditionCautions[cm[1]] = cm[2];
      }
    }

    entries.push({
      id: starts[i].id,
      linkedCuratedRecipeId: linkedRecipeMatch[1],
      linkedBuilderType: linkedTypeMatch[1],
      safeForConditions,
      conditionCautions,
    });
  }
  return entries;
}

function conditionTier(entry, code) {
  if (entry.safeForConditions.includes(code)) return 'green';
  return entry.conditionCautions[code] || null;
}

function isSafe(entry, code) {
  const tier = conditionTier(entry, code);
  return tier === 'green' || tier === 'yellow';
}

function main() {
  const breakfastEligibleIds = extractBreakfastEligibleIds();
  const recipesContent = fs.readFileSync(RECIPES_FILE, 'utf8');
  const entries = extractRecipeEntries(recipesContent);
  console.log('Total recipe entries parsed with a real linkedCuratedRecipeId + linkedBuilderType: ' + entries.length);

  const byId = new Map(entries.map(function (e) { return [e.linkedCuratedRecipeId, e]; }));
  console.log('Distinct linkedCuratedRecipeId values: ' + byId.size);

  const breakfastEntries = entries.filter(function (e) { return breakfastEligibleIds.has(e.linkedCuratedRecipeId); });
  console.log('Breakfast-eligible entries actually resolved in recipes.ts: ' + breakfastEntries.length + ' (of ' + breakfastEligibleIds.size + ' ids named in BREAKFAST_ELIGIBLE_RECIPE_IDS)');

  const lunchEntries = entries.filter(function (e) { return LUNCH_MAIN_TYPES.has(e.linkedBuilderType); });
  const dinnerEntries = entries.filter(function (e) { return DINNER_MAIN_TYPES.has(e.linkedBuilderType); });
  console.log('Lunch-main-eligible entries (side/salad/soup/handheld/smoothie): ' + lunchEntries.length);
  console.log('Dinner-main-eligible entries (side/salad/soup/handheld): ' + dinnerEntries.length);

  function hasDietTag(id, tag) {
    const idx = recipesContent.indexOf("linkedCuratedRecipeId: '" + id + "'");
    if (idx === -1) return false;
    const nearby = recipesContent.slice(idx, idx + 2000);
    const tagsMatch = nearby.match(/dietTags: \[([^\]]*)\]/);
    if (!tagsMatch) return false;
    return tagsMatch[1].indexOf("'" + tag + "'") !== -1;
  }

  console.log('\n=== VEGAN coverage per meal (diet-only, no condition applied) ===');
  [['Breakfast', breakfastEntries], ['Lunch', lunchEntries], ['Dinner', dinnerEntries]].forEach(function (pair) {
    const label = pair[0];
    const pool = pair[1];
    const veganCount = pool.filter(function (e) { return hasDietTag(e.linkedCuratedRecipeId, 'Vegan'); }).length;
    console.log(label + ': ' + veganCount + ' vegan-tagged (of ' + pool.length + ' total eligible)');
  });

  console.log('\n=== Per-condition, per-meal SAFE recipe counts (green or yellow, no red) ===');
  console.log('condition'.padEnd(26) + 'breakfast'.padStart(10) + 'lunch'.padStart(8) + 'dinner'.padStart(8));
  const gaps = [];
  CONDITION_CODES.forEach(function (code) {
    const bCount = breakfastEntries.filter(function (e) { return isSafe(e, code); }).length;
    const lCount = lunchEntries.filter(function (e) { return isSafe(e, code); }).length;
    const dCount = dinnerEntries.filter(function (e) { return isSafe(e, code); }).length;
    console.log(code.padEnd(26) + String(bCount).padStart(10) + String(lCount).padStart(8) + String(dCount).padStart(8));
    if (bCount < 30) gaps.push(code + ' breakfast: ' + bCount);
    if (lCount < 30) gaps.push(code + ' lunch: ' + lCount);
    if (dCount < 30) gaps.push(code + ' dinner: ' + dCount);
  });

  console.log('\n=== VEGAN + condition combined (both diet AND condition, matching the actual generator) ===');
  console.log('condition'.padEnd(26) + 'breakfast'.padStart(10) + 'lunch'.padStart(8) + 'dinner'.padStart(8));
  CONDITION_CODES.forEach(function (code) {
    const bCount = breakfastEntries.filter(function (e) { return isSafe(e, code) && hasDietTag(e.linkedCuratedRecipeId, 'Vegan'); }).length;
    const lCount = lunchEntries.filter(function (e) { return isSafe(e, code) && hasDietTag(e.linkedCuratedRecipeId, 'Vegan'); }).length;
    const dCount = dinnerEntries.filter(function (e) { return isSafe(e, code) && hasDietTag(e.linkedCuratedRecipeId, 'Vegan'); }).length;
    console.log(code.padEnd(26) + String(bCount).padStart(10) + String(lCount).padStart(8) + String(dCount).padStart(8));
  });

  console.log('\n=== Combinations below the 30-minimum bar (condition alone, not combined with a diet) ===');
  console.log(gaps.length === 0 ? 'None -- every condition already has 30+ for every meal type.' : gaps.join('\n'));
}

main();
