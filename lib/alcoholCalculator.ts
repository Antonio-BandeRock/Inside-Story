// Real, cited math for estimating the ethanol/calorie content of an
// alcoholic ingredient at a specific ABV/residual-sugar/cook-duration --
// 2026-08-10, the calculator this app's own Status section named as a
// real, deliberate future feature back on 2026-08-03: "an ABV/RS
// calculator as an add-on (not a replacement for the real lab-measured
// varietal rows already in the database) for wine, cider, and
// liqueurs/cordials (all have genuinely variable added/residual sugar)
// and a simpler ABV-only variant for plain spirits (to cover an
// off-catalog proof, e.g. cask strength or overproof rum)."
//
// This is for the case a person's own real bottle -- a specific proof, a
// homemade wine, an off-catalog cask-strength spirit, a wine/spirit
// reduced down in a soup or sauce -- doesn't match any single database row
// closely enough, and they want a real, honest estimate built from the
// actual chemistry instead of picking whichever generic entry is closest.
// Deliberately does NOT try to override a food's actual TRACKED nutrient
// values -- that stays exactly what it already is, the real lab-measured
// reference-database row a person selected. This is a standalone,
// informational estimate, the same non-gating, tap-to-see-more shape as
// the alcohol/coffee/juice advisories already built into these same four
// builders (see components/AlcoholCalculator.tsx).
//
// Deliberately excludes beer entirely, matching this app's own already-
// established reasoning (see constants/foodBuilderCategories.ts and
// CLAUDE.md's own 2026-08-02 Alcohol-cleanup entries): real brewing
// chemistry means dextrins/starches survive fermentation as real,
// unfermented carbs an ABV-only or ABV+RS formula would systematically
// undercount -- the same reason Beer & Cider is hidden from browsing
// pending a real barcode-scan feature rather than approximated here.
//
// Every constant below is a real, independently verified value, not
// assumed from memory:
// - Ethanol density (0.789 g/mL at 20°C) -- standard physical constant.
// - Ethanol energy value (7 kcal/g) -- the Atwater general conversion
//   factor (6.9 kcal/g unrounded, 29 kJ/g rounded), the same "x 7" figure
//   already used in this app's own earlier reasoning about wine/spirit
//   calorie math (see CLAUDE.md's own 2026-08-02 alcohol-cleanup entries:
//   "calories = volume x ABV% x 0.789 x 7 for alcohol").
// - Residual-sugar calories use the standard Atwater carbohydrate factor
//   (4 kcal/g) -- sugar isn't reduced by the retention percentage below,
//   since sugar doesn't evaporate the way ethanol does; a long reduction
//   concentrates sugar into a smaller final volume rather than removing
//   any of its real mass, which is a separate question ("how much of the
//   finished, reduced dish will actually be eaten") this calculator
//   deliberately doesn't attempt.
// - Alcohol-retention-by-cooking-method percentages -- Augustin J,
//   Augustin E, Cutrufelli RL, Hagen SR, Teitzel C. "Alcohol retention in
//   food preparation." J Am Diet Assoc. 1992;92(4):486-8 (PMID 1556354),
//   the real, original peer-reviewed study behind the retention figures
//   widely reproduced online (six real recipes tested across several
//   cooking methods, alcohol retention ranging from 4% to 85% depending
//   on method and duration). Real cooking retention varies by recipe, pan
//   surface area, and stirring -- these are reasonable estimates from a
//   real study, not an exact promise for any specific dish.

export const ETHANOL_DENSITY_G_PER_ML = 0.789;
export const ETHANOL_KCAL_PER_G = 7;
export const SUGAR_KCAL_PER_G = 4;

// How many of the chosen Volume this covers -- 2026-08-11, added alongside
// the calculator becoming a real, trackable ingredient source rather than
// purely informational (see components/AlcoholCalculator.tsx's own header
// comment). Volume itself stays "one pour," so someone doesn't have to do
// mental math (44 mL x 2) to log two shots -- the math happens here
// instead, multiplying straight into calculateAlcoholEstimate's own
// volumeMl input, which is linear in volume so this is exact, not an
// approximation.
export const POURS_PRESETS: { label: string; value: string }[] = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return { label: `${n} pour${n === 1 ? '' : 's'}`, value: String(n) };
});

export type AlcoholRetentionOption = {
  id: string;
  label: string;
  retainedPercent: number;
};

// Ordered least- to most-cooked, "Not Cooked" first as the real default
// for a beverage/ferment that's simply poured or added at the end, not
// reduced -- matches these builders' own COOKING_METHODS convention of a
// real, deliberate first answer rather than an absent one.
export const ALCOHOL_RETENTION_OPTIONS: AlcoholRetentionOption[] = [
  { id: 'not-cooked', label: 'Not Cooked (Poured As-Is)', retainedPercent: 100 },
  { id: 'stored-overnight', label: 'Stored Overnight, No Heat', retainedPercent: 70 },
  { id: 'flambeed', label: 'Flambeed', retainedPercent: 75 },
  { id: 'simmer-15', label: 'Simmered/Baked, 15 Minutes', retainedPercent: 40 },
  { id: 'simmer-30', label: 'Simmered/Baked, 30 Minutes', retainedPercent: 35 },
  { id: 'simmer-60', label: 'Simmered/Baked, 1 Hour', retainedPercent: 25 },
  { id: 'simmer-90', label: 'Simmered/Baked, 1.5 Hours', retainedPercent: 20 },
  { id: 'simmer-120', label: 'Simmered/Baked, 2 Hours', retainedPercent: 10 },
  { id: 'simmer-150', label: 'Simmered/Baked, 2.5+ Hours', retainedPercent: 5 },
];

export const ALCOHOL_RETENTION_CITATION =
  'Retention figures: Augustin et al. 1992, J Am Diet Assoc (PMID 1556354). Real retention varies by recipe, pan size, and stirring -- treat this as a reasonable estimate, not an exact figure for your specific dish.';

// Common real-world ABV percentages, spanning dealcoholized/low-alcohol
// through standard wine/fortified-wine/spirit/overproof ranges -- a
// searchable list (see AlcoholCalculator.tsx), so an off-list exact value
// is still just as reachable via typed search as a round one. US alcohol
// proof = 2 x ABV%, noted directly on the spirit-strength entries since
// that's the language most bottles/off-catalog pours actually use.
export const ABV_PRESETS: { label: string; value: string }[] = [
  { label: '0.5%', value: '0.5' },
  { label: '3%', value: '3' },
  { label: '3.5%', value: '3.5' },
  { label: '4%', value: '4' },
  { label: '4.5%', value: '4.5' },
  { label: '5%', value: '5' },
  { label: '5.5%', value: '5.5' },
  { label: '6%', value: '6' },
  { label: '7%', value: '7' },
  { label: '8%', value: '8' },
  { label: '9%', value: '9' },
  { label: '10%', value: '10' },
  { label: '11%', value: '11' },
  { label: '11.5%', value: '11.5' },
  { label: '12%', value: '12' },
  { label: '12.5%', value: '12.5' },
  { label: '13%', value: '13' },
  { label: '13.5%', value: '13.5' },
  { label: '14%', value: '14' },
  { label: '14.5%', value: '14.5' },
  { label: '15%', value: '15' },
  { label: '16%', value: '16' },
  { label: '17% (Fortified Wine)', value: '17' },
  { label: '18% (Fortified Wine)', value: '18' },
  { label: '19%', value: '19' },
  { label: '20% (Fortified Wine)', value: '20' },
  { label: '21%', value: '21' },
  { label: '22%', value: '22' },
  { label: '23%', value: '23' },
  { label: '24%', value: '24' },
  { label: '25%', value: '25' },
  { label: '30% (60 Proof)', value: '30' },
  { label: '35% (70 Proof)', value: '35' },
  { label: '38% (76 Proof)', value: '38' },
  { label: '40% (80 Proof)', value: '40' },
  { label: '43% (86 Proof)', value: '43' },
  { label: '45% (90 Proof)', value: '45' },
  { label: '47% (94 Proof)', value: '47' },
  { label: '50% (100 Proof)', value: '50' },
  { label: '53% (~106 Proof)', value: '53' },
  { label: '55% (110 Proof)', value: '55' },
  { label: '57% (~114 Proof, Cask Strength)', value: '57' },
  { label: '60% (120 Proof)', value: '60' },
  { label: '63% (~126 Proof, Overproof)', value: '63' },
  { label: '65% (130 Proof)', value: '65' },
  { label: '68% (136 Proof, Overproof Rum)', value: '68' },
  { label: '70% (140 Proof)', value: '70' },
  { label: '75% (150 Proof)', value: '75' },
  { label: '80% (160 Proof)', value: '80' },
  { label: '95% (190 Proof, Grain Alcohol)', value: '95' },
];

// Real, common serving/pour/bottle volumes in mL -- searchable, with a
// real-world equivalent noted where one's genuinely well known (a 1.5 fl
// oz shot, a standard 750 mL bottle), plain round numbers elsewhere.
export const VOLUME_ML_PRESETS: { label: string; value: string }[] = [
  { label: '15 mL (1 tbsp)', value: '15' },
  { label: '30 mL (1 fl oz)', value: '30' },
  { label: '44 mL (1.5 fl oz shot)', value: '44' },
  { label: '59 mL (2 fl oz)', value: '59' },
  { label: '75 mL', value: '75' },
  { label: '100 mL', value: '100' },
  { label: '118 mL (4 fl oz)', value: '118' },
  { label: '148 mL (5 fl oz wine pour)', value: '148' },
  { label: '150 mL', value: '150' },
  { label: '175 mL', value: '175' },
  { label: '200 mL', value: '200' },
  { label: '237 mL (1 cup)', value: '237' },
  { label: '250 mL', value: '250' },
  { label: '300 mL', value: '300' },
  { label: '330 mL (~11 fl oz can)', value: '330' },
  { label: '355 mL (12 fl oz can)', value: '355' },
  { label: '375 mL (half bottle)', value: '375' },
  { label: '400 mL', value: '400' },
  { label: '440 mL (~15 fl oz can)', value: '440' },
  { label: '473 mL (16 fl oz pint)', value: '473' },
  { label: '500 mL', value: '500' },
  { label: '568 mL (UK imperial pint)', value: '568' },
  { label: '600 mL', value: '600' },
  { label: '700 mL', value: '700' },
  { label: '750 mL (standard bottle)', value: '750' },
  { label: '800 mL', value: '800' },
  { label: '946 mL (1 quart)', value: '946' },
  { label: '1000 mL (1 liter)', value: '1000' },
  { label: '1500 mL (magnum)', value: '1500' },
  { label: '1892 mL (half gallon)', value: '1892' },
  { label: '2000 mL', value: '2000' },
  { label: '3000 mL (double magnum)', value: '3000' },
  { label: '3785 mL (1 gallon)', value: '3785' },
];

// Real, typical wine/liqueur residual-sugar bands (g/L), each paired with
// the conventional bone-dry/dry/off-dry/medium/sweet descriptor the wine
// industry commonly uses -- a labeling convenience, not itself a load-
// bearing scientific claim (the math only cares about the g/L number
// entered). "0 g/L (Dry / Spirits)" leads as the real default: a plain
// spirit genuinely carries close to zero residual sugar.
export const RESIDUAL_SUGAR_PRESETS: { label: string; value: string }[] = [
  { label: '0 g/L (Dry / Spirits)', value: '0' },
  { label: '2 g/L (Bone Dry Wine)', value: '2' },
  { label: '6 g/L (Dry Wine)', value: '6' },
  { label: '10 g/L (Off-Dry)', value: '10' },
  { label: '17 g/L (Off-Dry)', value: '17' },
  { label: '25 g/L (Medium)', value: '25' },
  { label: '35 g/L (Medium-Sweet)', value: '35' },
  { label: '50 g/L (Sweet)', value: '50' },
  { label: '75 g/L (Sweet)', value: '75' },
  { label: '100 g/L (Very Sweet)', value: '100' },
  { label: '150 g/L (Dessert Wine)', value: '150' },
  { label: '200 g/L (Liqueur / Cordial)', value: '200' },
  { label: '250 g/L (Liqueur / Cordial)', value: '250' },
];

export type AlcoholEstimateInput = {
  volumeMl: number;
  abvPercent: number;
  residualSugarGPerL: number;
  retainedPercent: number;
};

export type AlcoholEstimateResult = {
  ethanolGramsRaw: number;
  ethanolGramsRetained: number;
  ethanolCalories: number;
  sugarGrams: number;
  sugarCalories: number;
  totalCalories: number;
};

// Grams of ethanol = Volume(mL) x ABV(%) x 0.789 / 100 -- the same
// formula whether or not any of it is later reduced by cooking.
export function calculateEthanolGrams(volumeMl: number, abvPercent: number): number {
  return (volumeMl * abvPercent * ETHANOL_DENSITY_G_PER_ML) / 100;
}

export function calculateAlcoholEstimate(input: AlcoholEstimateInput): AlcoholEstimateResult {
  const ethanolGramsRaw = calculateEthanolGrams(input.volumeMl, input.abvPercent);
  const ethanolGramsRetained = ethanolGramsRaw * (input.retainedPercent / 100);
  const ethanolCalories = ethanolGramsRetained * ETHANOL_KCAL_PER_G;
  // Residual sugar in g/L converted via volume in liters (mL / 1000) --
  // never touched by retainedPercent, see this file's own header comment
  // for why.
  const sugarGrams = (input.volumeMl * input.residualSugarGPerL) / 1000;
  const sugarCalories = sugarGrams * SUGAR_KCAL_PER_G;
  return {
    ethanolGramsRaw,
    ethanolGramsRetained,
    ethanolCalories,
    sugarGrams,
    sugarCalories,
    totalCalories: ethanolCalories + sugarCalories,
  };
}
