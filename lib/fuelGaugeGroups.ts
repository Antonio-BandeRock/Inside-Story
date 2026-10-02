// Today's nutrients grouped by body system or by condition (G32 of the
// competitive build plan, 2026-10-02). A fold inside Today's Fuel Gauges on
// Home. The gauges show the nutrients somebody chose; this sets every
// nutrient with a daily target into groups, so "how is my thyroid side of
// today going" reads as one line rather than nine rings to hunt across.
//
// Two rules hold every sentence here:
// 1. A group says what it counts and where the grouping comes from. It
//    never says a body system or a condition is short, low or fine; the
//    figure is the share of the whole day's target logged so far, which
//    climbs as the day goes on.
// 2. A grouping carries a source. The body systems come from one register,
//    the EU list of permitted health claims, so every "iodine belongs under
//    thyroid" is a published, authorised statement rather than this app's
//    opinion. The conditions come from a guideline or a trial each, and a
//    condition the app holds no cited reason for says so rather than being
//    given a list anyway.
//
// Pure and free of runtime imports (scripts/test_fuel_gauge_groups.js loads
// it directly).

export const FUEL_GAUGE_GROUPS_TITLE = 'Grouped by Body System or Condition';

export type GroupingMode = 'system' | 'condition';

export type NutrientGroup = {
  key: string;
  name: string;
  codes: string[];
  // One sentence saying why these nutrients are grouped here.
  note: string;
  citations: string[];
};

const EU_REGISTER = 'Commission Regulation (EU) No 432/2012, the EU register of permitted health claims (with later amendments)';

// In the order a person most often asks about them, thyroid first since it
// is where the gauges began, then the frame of the body, then the rest.
export const BODY_SYSTEM_GROUPS: NutrientGroup[] = [
  {
    key: 'thyroid',
    name: 'Thyroid',
    codes: ['iodine', 'selenium'],
    note: 'The two nutrients the register names for thyroid hormone production or thyroid function.',
    citations: [EU_REGISTER],
  },
  {
    key: 'bones',
    name: 'Bones and teeth',
    codes: ['calcium', 'phosphorus', 'magnesium', 'vitamin_d', 'vitamin_k', 'manganese', 'zinc', 'protein', 'vitamin_c'],
    note: 'Named in the register for bones or teeth; vitamin C for the collagen in them.',
    citations: [EU_REGISTER],
  },
  {
    key: 'muscles',
    name: 'Muscles',
    codes: ['calcium', 'magnesium', 'potassium', 'vitamin_d', 'protein'],
    note: 'Named in the register for muscle function, and protein for muscle mass.',
    citations: [EU_REGISTER],
  },
  {
    key: 'nerves',
    name: 'Nerves',
    codes: [
      'calcium',
      'copper',
      'iodine',
      'magnesium',
      'potassium',
      'thiamin_b1',
      'riboflavin_b2',
      'niacin_b3',
      'vitamin_b6',
      'biotin_b7',
      'vitamin_b12',
      'vitamin_c',
    ],
    note: 'Named in the register for the nervous system or for nerve signalling.',
    citations: [EU_REGISTER],
  },
  {
    key: 'mind',
    name: 'Thinking and mood',
    codes: [
      'iodine',
      'iron',
      'zinc',
      'magnesium',
      'thiamin_b1',
      'niacin_b3',
      'pantothenic_acid_b5',
      'vitamin_b6',
      'biotin_b7',
      'folate_b9',
      'vitamin_b12',
      'vitamin_c',
      'water',
    ],
    note: 'Named in the register for cognitive function, mental performance or psychological function.',
    citations: [EU_REGISTER],
  },
  {
    key: 'blood',
    name: 'Blood',
    codes: ['iron', 'copper', 'riboflavin_b2', 'vitamin_b6', 'folate_b9', 'vitamin_b12', 'vitamin_k', 'calcium'],
    note: 'Named in the register for red blood cells, carrying oxygen, moving iron, or clotting.',
    citations: [EU_REGISTER],
  },
  {
    key: 'immune',
    name: 'Immune system',
    codes: ['copper', 'iron', 'selenium', 'zinc', 'vitamin_a', 'vitamin_b6', 'folate_b9', 'vitamin_b12', 'vitamin_c', 'vitamin_d'],
    note: 'Named in the register for the function of the immune system.',
    citations: [EU_REGISTER],
  },
  {
    key: 'energy',
    name: 'Energy and tiredness',
    codes: [
      'calcium',
      'copper',
      'iodine',
      'iron',
      'magnesium',
      'manganese',
      'phosphorus',
      'thiamin_b1',
      'riboflavin_b2',
      'niacin_b3',
      'pantothenic_acid_b5',
      'vitamin_b6',
      'biotin_b7',
      'vitamin_b12',
      'vitamin_c',
    ],
    note: 'Named in the register for energy-yielding metabolism or for reducing tiredness.',
    citations: [EU_REGISTER],
  },
  {
    key: 'heart',
    name: 'Heart and blood pressure',
    codes: ['thiamin_b1', 'potassium', 'sodium'],
    note: 'Thiamin is named in the register for the heart and potassium for blood pressure. Sodium is here as an amount with a ceiling, so its figure is the share of that ceiling.',
    citations: [
      EU_REGISTER,
      'Arnett DK et al. 2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease. Circulation 2019;140:e596-e646.',
    ],
  },
  {
    key: 'skin',
    name: 'Skin, hair and nails',
    codes: ['copper', 'iodine', 'selenium', 'zinc', 'vitamin_a', 'riboflavin_b2', 'niacin_b3', 'biotin_b7', 'vitamin_c'],
    note: 'Named in the register for skin, hair, nails or their colour; vitamin C for the collagen in skin.',
    citations: [EU_REGISTER],
  },
  {
    key: 'eyes',
    name: 'Eyes',
    codes: ['vitamin_a', 'riboflavin_b2', 'zinc'],
    note: 'Named in the register for vision.',
    citations: [EU_REGISTER],
  },
  {
    key: 'gut',
    name: 'Gut and liver',
    codes: ['fiber_total', 'choline'],
    note: 'The register names particular fibres, such as rye and wheat bran fibre, for bowel function, and choline for the liver. The fibre figure counts every fibre, not only those.',
    citations: [EU_REGISTER],
  },
  {
    key: 'cells',
    name: 'Protecting cells',
    codes: ['copper', 'manganese', 'selenium', 'zinc', 'riboflavin_b2', 'vitamin_c', 'vitamin_e'],
    note: 'Named in the register for protecting cells from oxidative stress.',
    citations: [EU_REGISTER],
  },
  {
    key: 'fluid',
    name: 'Fluid and body temperature',
    codes: ['water', 'magnesium'],
    note: 'Water is named in the register for physical function and body temperature, and magnesium for electrolyte balance.',
    citations: [EU_REGISTER],
  },
  {
    key: 'hormones',
    name: 'Hormones and fertility',
    codes: ['zinc', 'selenium', 'pantothenic_acid_b5', 'vitamin_b6', 'folate_b9'],
    note: 'Named in the register for fertility, steroid hormones, hormonal activity, or tissue growth in pregnancy.',
    citations: [EU_REGISTER],
  },
];

const GIOP =
  'Humphrey MB et al. 2022 American College of Rheumatology Guideline for the Prevention and Treatment of Glucocorticoid-Induced Osteoporosis. Arthritis Rheumatol 2023;75(12):2088-2102.';
const METFORMIN_B12 =
  'Aroda VR et al. Long-term metformin use and vitamin B12 deficiency in the Diabetes Prevention Program Outcomes Study. J Clin Endocrinol Metab 2016;101(4):1754-1761.';
const ADA_2024 =
  'American Diabetes Association. Facilitating Positive Health Behaviors and Well-being to Improve Health Outcomes: Standards of Care in Diabetes 2024. Diabetes Care 2024;47(Suppl 1):S77-S110.';

// Keyed by the snake_case code in the `conditions` reference table, the same
// codes Profile stores. Every one of the 19 is here, including the two the
// app has no cited list for, which carry an empty list and say so.
export const CONDITION_GROUPS: Record<string, NutrientGroup> = {
  hashimotos: {
    key: 'hashimotos',
    name: "Hashimoto's Thyroiditis",
    codes: ['selenium', 'iodine', 'iron', 'zinc', 'vitamin_d'],
    note: 'Named in reviews of nutrition in Hashimoto\'s. Selenium is the one with trial evidence on antibodies; iodine cuts both ways, so more is not the aim.',
    citations: [
      'Wichman J et al. Selenium supplementation significantly reduces thyroid autoantibody levels in patients with chronic autoimmune thyroiditis: a systematic review and meta-analysis. Thyroid 2016;26(12):1681-1692.',
      "Ihnatowicz P et al. The importance of nutritional factors and dietary management of Hashimoto's thyroiditis. Ann Agric Environ Med 2020;27(2):184-193.",
    ],
  },
  graves: {
    key: 'graves',
    name: "Graves' Disease",
    codes: ['selenium', 'iodine'],
    note: 'Selenium from a trial in mild Graves\' eye disease. Iodine is here because too much of it matters, so more is not the aim.',
    citations: [
      "Marcocci C et al. Selenium and the course of mild Graves' orbitopathy. N Engl J Med 2011;364:1920-1931.",
      'Excess iodine intake: sources, assessment, and effects on thyroid function. PubMed 30891786.',
    ],
  },
  celiac: {
    key: 'celiac',
    name: 'Celiac Disease',
    codes: ['iron', 'folate_b9', 'vitamin_b12', 'vitamin_d', 'calcium', 'zinc', 'fiber_total'],
    note: 'Named in the celiac guideline as often short at diagnosis, and fibre because a gluten-free diet tends to carry less of it.',
    citations: [
      'Rubio-Tapia A et al. ACG Clinical Guidelines: Diagnosis and Management of Celiac Disease. Am J Gastroenterol 2013;108(5):656-676.',
    ],
  },
  ibd: {
    key: 'ibd',
    name: 'Inflammatory Bowel Disease',
    codes: ['iron', 'vitamin_d', 'calcium', 'vitamin_b12', 'folate_b9', 'zinc'],
    note: 'Named in the ESPEN guideline on nutrition in IBD as ones to check.',
    citations: ['Forbes A et al. ESPEN guideline: Clinical nutrition in inflammatory bowel disease. Clin Nutr 2017;36(2):321-347.'],
  },
  chronic_kidney_disease: {
    key: 'chronic_kidney_disease',
    name: 'Chronic Kidney Disease',
    codes: ['protein', 'sodium', 'potassium', 'phosphorus'],
    note: 'A kidney diet often sets limits on these four. Each figure is the share of the general daily target, which your kidney team may set differently.',
    citations: [
      'Ikizler TA et al. KDOQI Clinical Practice Guideline for Nutrition in CKD: 2020 Update. Am J Kidney Dis 2020;76(3 Suppl 1):S1-S107.',
    ],
  },
  rheumatoid_arthritis: {
    key: 'rheumatoid_arthritis',
    name: 'Rheumatoid Arthritis',
    codes: ['folate_b9', 'calcium', 'vitamin_d'],
    note: 'Folate goes with methotrexate in the RA guideline, and calcium and vitamin D with steroid treatment such as prednisone.',
    citations: [
      'Fraenkel L et al. 2021 American College of Rheumatology Guideline for the Treatment of Rheumatoid Arthritis. Arthritis Care Res 2021;73(7):924-939.',
      GIOP,
    ],
  },
  psoriasis: {
    key: 'psoriasis',
    name: 'Psoriasis / Psoriatic Arthritis',
    codes: ['folate_b9'],
    note: 'Folate goes with methotrexate in the psoriasis guideline, so it applies to anybody taking it.',
    citations: [
      'Menter A et al. Joint AAD-NPF guidelines of care for the management and treatment of psoriasis with systemic nonbiologic therapies. J Am Acad Dermatol 2020;82(6):1445-1486.',
    ],
  },
  lupus: {
    key: 'lupus',
    name: 'Lupus (SLE)',
    codes: ['calcium', 'vitamin_d'],
    note: 'Calcium and vitamin D go with steroid treatment such as prednisone in the ACR bone guideline.',
    citations: [GIOP],
  },
  multiple_sclerosis: {
    key: 'multiple_sclerosis',
    name: 'Multiple Sclerosis',
    codes: ['vitamin_d'],
    note: 'Lower vitamin D levels went with a higher chance of MS in a large study. That is an association, not a trial result.',
    citations: [
      'Munger KL et al. Serum 25-hydroxyvitamin D levels and risk of multiple sclerosis. JAMA 2006;296(23):2832-2838.',
    ],
  },
  type_1_diabetes: {
    key: 'type_1_diabetes',
    name: 'Type 1 Diabetes',
    codes: ['fiber_total'],
    note: 'Fibre is named in the ADA Standards of Care for eating with diabetes.',
    citations: [ADA_2024],
  },
  type_2_diabetes: {
    key: 'type_2_diabetes',
    name: 'Type 2 Diabetes',
    codes: ['fiber_total', 'sodium', 'vitamin_b12'],
    note: 'Fibre and sodium are named in the ADA Standards of Care. Vitamin B12 is here because long use of metformin went with lower B12.',
    citations: [ADA_2024, METFORMIN_B12],
  },
  pcos: {
    key: 'pcos',
    name: 'PCOS',
    codes: ['vitamin_b12'],
    note: 'Vitamin B12 is here for anybody taking metformin, which went with lower B12 with long use.',
    citations: [METFORMIN_B12],
  },
  cardiovascular_disease: {
    key: 'cardiovascular_disease',
    name: 'Cardiovascular Disease',
    codes: ['sodium', 'potassium', 'fiber_total'],
    note: 'Sodium is named in the ACC/AHA guideline, and potassium and fibre come with the DASH way of eating it points to. Sodium\'s figure is the share of a ceiling.',
    citations: [
      'Arnett DK et al. 2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease. Circulation 2019;140:e596-e646.',
      'Appel LJ et al. A clinical trial of the effects of dietary patterns on blood pressure. N Engl J Med 1997;336:1117-1124.',
    ],
  },
  fatty_liver_disease: {
    key: 'fatty_liver_disease',
    name: 'Fatty Liver Disease (MASLD)',
    codes: ['choline'],
    note: 'The daily amount of choline was set from what keeps the liver from storing fat.',
    citations: [
      'Institute of Medicine. Dietary Reference Intakes for Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic Acid, Biotin, and Choline. National Academies Press, 1998.',
    ],
  },
  ibs: {
    key: 'ibs',
    name: 'Irritable Bowel Syndrome',
    codes: ['fiber_total'],
    note: 'The ACG guideline names soluble fibre. The figure counts every fibre, so it cannot tell soluble from the rest.',
    citations: ['Lacy BE et al. ACG Clinical Guideline: Management of Irritable Bowel Syndrome. Am J Gastroenterol 2021;116(1):17-44.'],
  },
  migraine: {
    key: 'migraine',
    name: 'Migraine',
    codes: ['magnesium', 'riboflavin_b2'],
    note: 'Named in the AAN and AHS guideline on preventing migraine, where the amounts studied were supplements far above what food gives.',
    citations: [
      'Holland S et al. Evidence-based guideline update: NSAIDs and other complementary treatments for episodic migraine prevention in adults. Neurology 2012;78(17):1346-1353.',
    ],
  },
  prostate_health: {
    key: 'prostate_health',
    name: 'Prostate Health (BPH & Prostate Cancer Risk)',
    codes: ['zinc'],
    note: 'Prostate tissue holds more zinc than any other tissue. The evidence is from laboratory and population studies, not trials.',
    citations: [
      'Chemoprevention of Prostate Cancer by Natural Agents: Evidence from Molecular and Epidemiological Studies. Anticancer Res 2019;39(10):5231.',
    ],
  },
  gout: {
    key: 'gout',
    name: 'Gout',
    codes: [],
    note: 'Gout is shaped mostly by purines, alcohol and sugary drinks, and the gauges count none of those, so nothing is grouped here.',
    citations: [
      'Richette P et al. 2016 updated EULAR evidence-based recommendations for the management of gout. Ann Rheum Dis 2017;76(1):29-42.',
    ],
  },
  sjogrens: {
    key: 'sjogrens',
    name: "Sjogren's Syndrome",
    codes: [],
    note: "The app holds no cited reason to group any of these nutrients under Sjogren's, so none are shown here.",
    citations: [],
  },
};

export type GroupedNutrient = {
  code: string;
  line: string;
};

export type GroupedRow = {
  key: string;
  name: string;
  note: string;
  citations: string[];
  nutrients: GroupedNutrient[];
  // Set when the group's list is empty or none of its nutrients has a
  // daily target in the reference data.
  emptyLine: string | null;
};

type Entry = {
  nutrientCode: string;
  displayName: string;
  percentOfTarget: number;
  fromFood: number;
  fromSupplements: number;
  combinedTotal: number;
};

/** "Iron 40%", with the supplement's share named when one contributed. */
export function describeGroupedNutrient(entry: Entry): string {
  if (!Number.isFinite(entry.percentOfTarget)) return `${entry.displayName}: no daily target to count against`;
  const percent = Math.round(entry.percentOfTarget);
  if (entry.fromSupplements > 0 && entry.combinedTotal > 0) {
    const fromSupplement = Math.round((entry.percentOfTarget * entry.fromSupplements) / entry.combinedTotal);
    if (entry.fromFood <= 0) return `${entry.displayName} ${percent}%, all of it from a supplement`;
    return `${entry.displayName} ${percent}%, ${fromSupplement}% of that from a supplement`;
  }
  return `${entry.displayName} ${percent}%`;
}

function rowFor(group: NutrientGroup, entries: Entry[]): GroupedRow {
  const nutrients = group.codes
    .map((code) => entries.find((entry) => entry.nutrientCode === code))
    .filter((entry): entry is Entry => entry != null)
    .map((entry) => ({ code: entry.nutrientCode, line: describeGroupedNutrient(entry) }));
  let emptyLine: string | null = null;
  if (group.codes.length === 0) emptyLine = 'Nothing grouped here.';
  else if (nutrients.length === 0) emptyLine = 'None of these has a daily target in the reference data yet.';
  return { key: group.key, name: group.name, note: group.note, citations: group.citations, nutrients, emptyLine };
}

export function groupBySystem(entries: Entry[]): GroupedRow[] {
  return BODY_SYSTEM_GROUPS.map((group) => rowFor(group, entries));
}

/**
 * One row per condition the person tracks, in the order Profile holds
 * them. A code the app does not know is passed over rather than drawn as a
 * blank row.
 */
export function groupByCondition(conditionCodes: string[], entries: Entry[]): GroupedRow[] {
  return conditionCodes
    .map((code) => CONDITION_GROUPS[code])
    .filter((group): group is NutrientGroup => group != null)
    .map((group) => rowFor(group, entries));
}

export const FUEL_GAUGE_GROUPS_INTRO =
  "Every nutrient with a daily target, set into groups. A nutrient can sit in more than one group. Each figure is the share of the whole day's target from what you have logged so far, food and supplements together, so it climbs as the day goes on.";

export const NO_CONDITIONS_LINE =
  'No conditions are chosen in Profile, so there is nothing to group by. Choose yours in Profile, under Your conditions.';

export const GROUP_SOURCE_LINE = 'Tap a group for where its grouping comes from.';
