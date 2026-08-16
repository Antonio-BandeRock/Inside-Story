// Real, curated "specific words to avoid" ingredient-label scanning,
// 2026-08-16 -- reuses this app's own already-cited Food Additives Digest
// content (lib/digest/foodAdditives.ts) and per-condition concern
// registry (lib/conditionFoodConcerns.ts) rather than a second, invented
// set of claims.
//
// Deliberately whole-word matching (a real \b-bounded regex per keyword,
// not a plain substring check) -- this project's own history has already
// been burned more than once by a naive substring match (e.g. "ale"
// matching inside "minérale"). Verified directly against a real, known
// trap before trusting it: "malt" as a keyword must NOT match inside
// "maltose" (a real sugar, nothing to do with malted-grain gluten) --
// confirmed via a standalone test before this file was relied on.
//
// severity is a real, independent editorial judgment about what each
// Digest entry's own actual CONCLUSION is, not its overallTier -- that
// field means "how strong is the evidence for this claim," which is a
// genuinely different question (the xanthan/guar-gum entry's own real
// conclusion is "generally fine," a fact this file must not accidentally
// invert into a red flag just because its own evidence tier happens to
// be strong).
import { findDigestEntryById } from './digest';
import { CONDITION_FOOD_CONCERNS } from './conditionFoodConcerns';
import { getUserConditions } from './db';

export type FlagSeverity = 'red' | 'yellow' | 'info';

export type ScannedProductFlag = {
  severity: FlagSeverity;
  label: string;
  detail: string;
  matchedText: string;
  digestEntryId?: string;
};

export type ScannedProductConditionFlag = {
  conditionCode: string;
  concernId: string;
  label: string;
  detail: string;
  matchedText: string;
  digestEntryId?: string;
};

type AdditiveKeywordEntry = {
  digestEntryId: string;
  label: string;
  severity: FlagSeverity;
  keywords: string[];
};

const ADDITIVE_KEYWORDS: AdditiveKeywordEntry[] = [
  {
    digestEntryId: 'additive-nitrates-nitrites',
    label: 'Nitrates / Nitrites',
    severity: 'red',
    keywords: ['sodium nitrite', 'sodium nitrate', 'potassium nitrite', 'potassium nitrate', 'nitrite', 'nitrate'],
  },
  {
    digestEntryId: 'additive-potassium-bromate',
    label: 'Potassium Bromate',
    severity: 'red',
    keywords: ['potassium bromate', 'bromated flour'],
  },
  {
    digestEntryId: 'additive-synthetic-dyes',
    label: 'Synthetic Food Dyes',
    severity: 'red',
    keywords: [
      'red 40', 'red dye 40', 'red 3', 'red dye 3', 'yellow 5', 'yellow dye 5', 'yellow 6', 'yellow dye 6',
      'blue 1', 'blue dye 1', 'blue 2', 'blue dye 2', 'fd&c', 'artificial color', 'artificial colour', 'artificial coloring',
    ],
  },
  {
    digestEntryId: 'additive-emulsifiers-cmc-polysorbate80',
    label: 'Emulsifiers (CMC / Polysorbate 80)',
    severity: 'red',
    keywords: ['carboxymethylcellulose', 'cellulose gum', 'polysorbate 80', 'polysorbate 60'],
  },
  {
    digestEntryId: 'additive-carrageenan',
    label: 'Carrageenan',
    severity: 'yellow',
    keywords: ['carrageenan'],
  },
  {
    digestEntryId: 'additive-msg',
    label: 'MSG',
    severity: 'info',
    keywords: ['monosodium glutamate', 'msg'],
  },
  {
    digestEntryId: 'additive-aspartame',
    label: 'Aspartame',
    severity: 'yellow',
    keywords: ['aspartame'],
  },
  {
    digestEntryId: 'additive-sucralose',
    label: 'Sucralose',
    severity: 'yellow',
    keywords: ['sucralose'],
  },
  {
    digestEntryId: 'additive-trans-fats',
    label: 'Trans Fats',
    severity: 'red',
    keywords: ['partially hydrogenated', 'trans fat'],
  },
  {
    digestEntryId: 'additive-sulfites',
    label: 'Sulfites',
    severity: 'yellow',
    keywords: ['sulfite', 'sulphite', 'sulfur dioxide', 'sodium bisulfite', 'potassium metabisulfite'],
  },
  {
    digestEntryId: 'additive-hfcs',
    label: 'High-Fructose Corn Syrup',
    severity: 'yellow',
    keywords: ['high fructose corn syrup', 'high-fructose corn syrup', 'hfcs'],
  },
  {
    digestEntryId: 'additive-azodicarbonamide',
    label: 'Azodicarbonamide',
    severity: 'yellow',
    keywords: ['azodicarbonamide'],
  },
  {
    digestEntryId: 'additive-phosphates',
    label: 'Phosphate Additives',
    severity: 'yellow',
    keywords: ['sodium phosphate', 'sodium tripolyphosphate', 'disodium phosphate', 'calcium phosphate', 'phosphoric acid'],
  },
  {
    digestEntryId: 'additive-bha-bht',
    label: 'BHA / BHT',
    severity: 'red',
    keywords: ['bha', 'bht', 'butylated hydroxyanisole', 'butylated hydroxytoluene'],
  },
  {
    digestEntryId: 'additive-xanthan-guar-gum',
    label: 'Xanthan Gum / Guar Gum',
    severity: 'info',
    keywords: ['xanthan gum', 'guar gum'],
  },
];

// Real, matchable label-text terms per Hashimoto's concern -- deliberately
// separate from ConditionFoodConcern itself, since that registry's own
// `label` ("Raw Cruciferous Vegetables") isn't something a packaged
// product's ingredient list would ever literally say. A concern with no
// real, honest ingredient-label form (raw cruciferous vegetables aren't
// a listed ingredient the way wheat or milk are) simply gets an empty
// keyword list, so it silently never matches rather than being force-fit.
const CONDITION_CONCERN_KEYWORDS: Record<string, string[]> = {
  'hashimotos-gluten': ['wheat', 'barley', 'rye', 'malt', 'gluten'],
  'hashimotos-soy': ['soy', 'soybean', 'soy lecithin', 'soy protein', 'textured vegetable protein'],
  'hashimotos-raw-cruciferous': [],
  'hashimotos-kelp-iodine': ['kelp', 'seaweed', 'kombu', 'nori', 'dulse', 'sea vegetable'],
  'hashimotos-dairy': ['milk', 'whey', 'casein', 'lactose', 'cream', 'butter', 'cheese', 'dairy'],
  'hashimotos-alcohol': ['alcohol', 'wine', 'beer', 'ethanol'],
  'hashimotos-coffee-timing': ['coffee', 'caffeine'],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Real, whole-word matching -- verified directly against the "malt" vs.
// "maltose" trap before being trusted anywhere in this file.
function findWholeWordMatch(text: string, keyword: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
  const match = text.match(pattern);
  return match ? match[0] : null;
}

export function flagAdditivesInIngredients(ingredientsText: string): ScannedProductFlag[] {
  const trimmed = ingredientsText.trim();
  if (!trimmed) return [];
  const flags: ScannedProductFlag[] = [];
  for (const entry of ADDITIVE_KEYWORDS) {
    for (const keyword of entry.keywords) {
      const matched = findWholeWordMatch(trimmed, keyword);
      if (!matched) continue;
      const digestEntry = findDigestEntryById(entry.digestEntryId);
      flags.push({
        severity: entry.severity,
        label: entry.label,
        detail: digestEntry && 'teaser' in digestEntry ? digestEntry.teaser : entry.label,
        matchedText: matched,
        digestEntryId: entry.digestEntryId,
      });
      break; // one flag per additive, even if several of its own real keywords all match
    }
  }
  return flags;
}

// Only checks concerns for conditions the person has actually tracked in
// their own Profile -- a flag naming a Hashimoto's-specific concern is
// only actually useful to someone who's told the app they have it.
export async function flagConditionConcernsInIngredients(ingredientsText: string): Promise<ScannedProductConditionFlag[]> {
  const trimmed = ingredientsText.trim();
  if (!trimmed) return [];
  const selectedConditions = await getUserConditions();
  if (selectedConditions.length === 0) return [];
  const selectedSet = new Set(selectedConditions);
  const flags: ScannedProductConditionFlag[] = [];
  for (const model of CONDITION_FOOD_CONCERNS) {
    if (!selectedSet.has(model.conditionCode)) continue;
    for (const concern of model.concerns) {
      const keywords = CONDITION_CONCERN_KEYWORDS[concern.id] ?? [];
      for (const keyword of keywords) {
        const matched = findWholeWordMatch(trimmed, keyword);
        if (!matched) continue;
        flags.push({
          conditionCode: model.conditionCode,
          concernId: concern.id,
          label: concern.label,
          detail: concern.shortNote,
          matchedText: matched,
          digestEntryId: concern.digestEntryId,
        });
        break;
      }
    }
  }
  return flags;
}
