// Hands-on therapy vocabulary -- added 2026-09-04, direct request after a
// shared conversation about a sacral adjustment and easier urination:
// "we need to be able to build a tracker for it like those that are named
// such as Bearable."
//
// This is app-level UI vocabulary, not researched/cited reference content,
// so it lives as a plain TS constant rather than a bundled DB table --
// the same reasoning lib/checkinTags.ts already carries for its own
// picklist. What the Digest says ABOUT each of these therapies is cited
// content and lives in lib/digest/complementaryTherapies.ts and
// lib/digest/handsOnTherapies.ts; this file only names them.
//
// Deliberately NOT folded into the existing `treatments` table, which
// holds substances (supplement / prescription / otc) with a dose and a
// frequency. A hands-on session is an event on a date with a duration,
// not a substance with a dose, and the whole point of tracking it is
// asking what happened in the days AFTER it -- a question the treatments
// table has no shape for.

export type TherapyCategory = 'manipulation' | 'needling' | 'soft_tissue' | 'movement';

export type TherapyTypeDefinition = {
  code: string;
  label: string;
  category: TherapyCategory;
  // A short, plain description of what the session actually involves,
  // shown next to the picker so someone logging a session picks the row
  // that matches what was really done to them rather than the closest
  // familiar word.
  description: string;
};

export const THERAPY_CATEGORIES: Record<TherapyCategory, string> = {
  manipulation: 'Joint & Spinal Manipulation',
  needling: 'Needling & Point Stimulation',
  soft_tissue: 'Soft Tissue & Massage',
  movement: 'Movement & Rehabilitation',
};

export const THERAPY_TYPES: TherapyTypeDefinition[] = [
  {
    code: 'chiropractic',
    label: 'Chiropractic adjustment',
    category: 'manipulation',
    description: 'A thrust or mobilization applied to a joint, most often in the spine or pelvis.',
  },
  {
    code: 'osteopathic_manipulation',
    label: 'Osteopathic manipulation (OMT)',
    category: 'manipulation',
    description: 'Hands-on manipulation performed by an osteopathic physician.',
  },
  {
    code: 'acupuncture',
    label: 'Acupuncture',
    category: 'needling',
    description: 'Fine needles placed at specific points and left in for a set time.',
  },
  {
    code: 'electroacupuncture',
    label: 'Electroacupuncture',
    category: 'needling',
    description: 'Acupuncture with a small electrical current passed between the needles.',
  },
  {
    code: 'dry_needling',
    label: 'Dry needling',
    category: 'needling',
    description: 'Needles placed into a tight muscle band, usually by a physical therapist.',
  },
  {
    code: 'acupressure',
    label: 'Acupressure',
    category: 'needling',
    description: 'Pressure applied by hand to the same points acupuncture uses, with no needles.',
  },
  {
    code: 'deep_tissue_massage',
    label: 'Deep tissue massage',
    category: 'soft_tissue',
    description: 'Sustained, firm pressure into the deeper muscle and connective tissue layers.',
  },
  {
    code: 'swedish_massage',
    label: 'Swedish / relaxation massage',
    category: 'soft_tissue',
    description: 'Lighter, flowing full-body strokes aimed at relaxation rather than a specific tissue.',
  },
  {
    code: 'myofascial_release',
    label: 'Myofascial / trigger point release',
    category: 'soft_tissue',
    description: 'Targeted work on one restricted area or tender point rather than the whole body.',
  },
  {
    code: 'cupping',
    label: 'Cupping',
    category: 'soft_tissue',
    description: 'Suction cups placed on the skin to lift the tissue underneath.',
  },
  {
    code: 'pelvic_floor_pt',
    label: 'Pelvic floor physical therapy',
    category: 'movement',
    description: 'Assessment and hands-on treatment of the pelvic floor muscles, plus prescribed exercises.',
  },
  {
    code: 'physical_therapy',
    label: 'Physical therapy',
    category: 'movement',
    description: 'A supervised session of prescribed exercise, manual therapy, or both.',
  },
  {
    code: 'other',
    label: 'Something else',
    category: 'movement',
    description: 'Any other hands-on session. Name it in the notes so your own record stays readable.',
  },
];

export function getTherapyTypeDefinition(code: string): TherapyTypeDefinition | undefined {
  return THERAPY_TYPES.find((type) => type.code === code);
}

export function therapyTypeLabel(code: string): string {
  return getTherapyTypeDefinition(code)?.label ?? code;
}

export function getTherapyTypesByCategory(): {
  category: TherapyCategory;
  label: string;
  types: TherapyTypeDefinition[];
}[] {
  return (Object.keys(THERAPY_CATEGORIES) as TherapyCategory[]).map((category) => ({
    category,
    label: THERAPY_CATEGORIES[category],
    types: THERAPY_TYPES.filter((type) => type.category === category),
  }));
}
