// The shapes behind lib/cropSigns.ts, kept apart so the per-group files
// of signs (lib/cropSignsVegetables.ts and the rest) can use them without
// importing the index that gathers them. Pure: no React and no database.

import type { GuideSource, PlantNutrientKey } from './plantNutrients';
import type { SymptomKey } from './cropSymptoms';

export type CropSignKind = 'short' | 'excess' | 'water' | 'ph' | 'mimic';

export type CropSign = {
  kind: CropSignKind;
  nutrient?: PlantNutrientKey;
  label: string;
  /** The symptoms a person would pick for it, from SYMPTOMS. */
  where: SymptomKey[];
  looks: string;
  why?: string;
  fix: string;
  /** Pages about this crop that describe the sign. */
  sources: GuideSource[];
};

export type CropConfirm = { text: string; sources: GuideSource[] };
