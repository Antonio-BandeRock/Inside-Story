// What is wrong with a plant, crop by crop (I26 reworked, 2026-09-29).
//
// The first version started from a symptom and read it the same way for
// every crop. 2026-09-29, direct statement: "what every plant presents or
// does when it is high or low on any specific nutrient or is being over or
// under watered doesn't always follow the same path or indictive
// information that every other plant will follow". So each crop here
// carries its own signs: too little of a nutrient, too much of one where a
// source says so, watering, soil pH, and the diseases that look like a
// shortage in that crop. Every sign cites a page about that crop. Where no
// source for a crop describes a sign, the sign is left out rather than
// borrowed from another crop or from the general leaf guide, which is why
// the lists are uneven from crop to crop. Crops are added in batches, the
// best documented first, and a crop with no signs yet is not offered.
//
// Each crop ends with how to confirm it, a soil test and where the sources
// give one a leaf or tissue test, because a sign is the likeliest cause,
// never a diagnosis.
//
// The fixes are this app's, put right from the soil the way
// lib/cropProblems.ts puts them, and name no bag or bottle
// (scripts/test_crop_signs.js checks). The sources back what the sign
// looks like and why; where a source says a spray does not help, the fix
// says so.
//
// Cannabis is here as a crop and nothing else: how it grows and what goes
// wrong with it, never how it is used. 2026-09-29, direct statement: "My
// customers aren't intended to be children ... If they have children, this
// information can stay on the adult side until they are above 18 or
// administered by the parent (user)." This is bundled reading on the
// person's own device and never travels between people
// (lib/peerRelationships.ts sends only what a relationship names). When a
// child's view is built under the Guardian tier, the cannabis guide and
// its signs stay off it until the child is 18 or the parent opens it.
//
// Pure: no React and no database.

import { CROP_PROBLEMS, type CropProblem } from './cropProblems';
import { CROP_PROBLEM_SYMPTOMS, SYMPTOMS, type Symptom, type SymptomKey } from './cropSymptoms';
import type { GuideSource, PlantNutrientKey } from './plantNutrients';

export type CropSignKind = 'short' | 'excess' | 'water' | 'ph' | 'mimic';

export const CROP_SIGN_KIND_LABELS: Record<CropSignKind, string> = {
  short: 'Too little of a nutrient',
  excess: 'Too much of a nutrient',
  water: 'Watering',
  ph: 'Soil pH',
  mimic: 'Looks like a shortage, is not',
};

export const CROP_SIGN_KIND_ORDER: CropSignKind[] = ['short', 'excess', 'water', 'ph', 'mimic'];

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

// Tomato.
const MBG_TOMATO: GuideSource = {
  label: 'Missouri Botanical Garden: Nutrient deficiencies in tomatoes',
  url: 'https://www.missouribotanicalgarden.org/gardens-gardening/your-garden/help-for-the-home-gardener/advice-tips-resources/insects-pests-and-problems/environmental/nutrient-deficiencies-in-tomatoes',
};
const CORNELL_TOMATO: GuideSource = {
  label: 'Cornell: Tomato nutrient deficiencies',
  url: 'https://www.vegetables.cornell.edu/pest-management/keys-for-identifying-vegetable-diseases/tomato-diagnostic-key/symptoms-on-leaves/nutrient-deficiencies/',
};
const UMD_TOMATO: GuideSource = {
  label: 'University of Maryland: Physiological disorders of tomato fruit',
  url: 'https://extension.umd.edu/sites/extension.umd.edu/files/2021-06/PhysiologicalDisordersTomatoFruit.pdf',
};
const BER_REVIEW: GuideSource = {
  label: 'Blossom-end rot in tomato, a research review (PMC)',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10515260/',
};
const PNW_TOMATO_EARLY_BLIGHT: GuideSource = {
  label: 'PNW Plant Disease Handbook: Tomato early blight',
  url: 'https://pnwhandbooks.org/plantdisease/host-disease/tomato-solanum-lycopersicum-early-blight',
};
const PNW_TOMATO_FUSARIUM: GuideSource = {
  label: 'PNW Plant Disease Handbook: Tomato Fusarium wilt',
  url: 'https://pnwhandbooks.org/plantdisease/host-disease/tomato-solanum-lycopersicum-fusarium-wilt',
};
const PNW_TOMATO_VERTICILLIUM: GuideSource = {
  label: 'PNW Plant Disease Handbook: Tomato Verticillium wilt',
  url: 'https://pnwhandbooks.org/plantdisease/host-disease/tomato-solanum-lycopersicum-verticillium-wilt',
};

// Hops.
export const USA_HOPS_NUTRIENTS: GuideSource = {
  label: 'USA Hops field guide: Nutrient disorders of hop',
  url: 'https://www.usahops.org/cabinet/data/9.pdf',
};
export const OSU_HOPS_FERTILITY: GuideSource = {
  label: 'Oregon State University: Hops fertilizer guide (FG 79)',
  url: 'https://extension.oregonstate.edu/catalog/fg-79-hops-fertilizer-guide',
};
const ONTARIO_HOPS: GuideSource = {
  label: 'Ontario: Nutrient deficiency identification guide for hops',
  url: 'https://www.ontario.ca/page/nutrient-deficiency-identification-guide-hops',
};
const PNW_HOP_DOWNY: GuideSource = {
  label: 'PNW Plant Disease Handbook: Hop downy mildew',
  url: 'https://pnwhandbooks.org/plantdisease/host-disease/hop-humulus-lupulus-downy-mildew',
};
const PNW_HOP_VERTICILLIUM: GuideSource = {
  label: 'PNW Plant Disease Handbook: Hop Verticillium wilt',
  url: 'https://pnwhandbooks.org/plantdisease/host-disease/hop-humulus-lupulus-verticillium-wilt',
};

// Cannabis.
export const USU_HEMP_NUTRIENTS: GuideSource = {
  label: 'Utah State University: Hemp nutrient deficiencies',
  url: 'https://extension.usu.edu/planthealth/ipm/notes_ag/hemp-nutrient-deficiencies',
};
const NCSU_HEMP_TISSUE: GuideSource = {
  label: 'NC State: Hemp leaf tissue nutrient ranges',
  url: 'https://content.ces.ncsu.edu/hemp-leaf-tissue-nutrient-ranges',
};
export const NCSU_HEMP_GREENHOUSE: GuideSource = {
  label: 'NC State: Nutrition guides for greenhouse hemp',
  url: 'https://hemp.ces.ncsu.edu/news/nutritional-guides-for-greenhouse-hemp/',
};
export const PSU_HEMP: GuideSource = {
  label: 'Penn State Extension: Industrial hemp production',
  url: 'https://extension.psu.edu/industrial-hemp-production',
};
const USU_HEMP_MILDEW: GuideSource = {
  label: 'Utah State University: Hemp powdery mildew',
  url: 'https://extension.usu.edu/planthealth/ipm/notes_ag/hemp-powdery-mildew',
};

export const CROP_SIGNS: Record<string, CropSign[]> = {
  tomato: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'st'],
      looks: 'The whole plant is stunted, and the oldest leaves turn yellow first, then the younger ones.',
      fix: 'Work compost or well-rotted manure in around the plant and mulch it, and water on a comfrey or nettle feed while it fruits. A legume cover crop the winter before feeds the soil for next year’s tomatoes.',
      sources: [MBG_TOMATO],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['pu', 'st'],
      looks: 'Young plants turn purplish, and the undersides of the older leaves go reddish purple.',
      why: 'Cold soil stops the roots taking up phosphorus, so seedlings planted out early often show it and green up once the soil warms.',
      fix: 'Wait a week or two of warm weather before acting. Where it lasts, dig compost and well-rotted manure in where the roots are, since phosphorus hardly moves in soil, and keep the ground covered to feed the soil life that frees it.',
      sources: [MBG_TOMATO],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['ed', 'yn', 'ha'],
      looks: 'The edges of the newer leaves turn yellow, then the tissue between the veins dies, and ripe fruit keeps yellow or green shoulders.',
      why: 'Low potassium, worst on soils low in organic matter and in cool, wet, cloudy weather. A potassium spray on the leaves does not put it right.',
      fix: 'Mulch with comfrey leaves and topdress with compost every season to lift the organic matter, and add a thin dusting of wood ash only after a pH test shows the soil is not already alkaline.',
      sources: [MBG_TOMATO, UMD_TOMATO],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'sp'],
      looks: 'Yellowing between the veins starts on the oldest leaves, and the yellow blotches later turn brown and die.',
      why: 'Low magnesium in the soil, or too much potassium, which blocks it.',
      fix: 'Stop adding wood ash and other potassium-rich feeds if you have been, topdress with compost and a little seaweed meal, and test before adding dolomitic lime, which only suits acid soil.',
      sources: [MBG_TOMATO, CORNELL_TOMATO],
    },
    {
      kind: 'short',
      nutrient: 'Mn',
      label: 'Manganese shortage',
      where: ['yn', 'cu'],
      looks: 'The leaves at the shoot tips pucker between the veins, and the tops of the puckers turn yellow.',
      fix: 'Test the pH, since manganese is most often locked away in soil that is too alkaline rather than missing. Work in compost and leaf mould to bring the pH down slowly and stop adding lime or wood ash.',
      sources: [MBG_TOMATO],
    },
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn'],
      looks: 'New growth turns yellow between veins that stay green. It is rare on mature leaves.',
      why: 'Iron locked away in soil that is too alkaline, far more often than a soil without iron.',
      fix: 'Test the pH. Above 7, stop adding lime and wood ash, and work in compost, leaf mould and pine needle mulch every year, which bring the pH down slowly and free the iron already there.',
      sources: [MBG_TOMATO, CORNELL_TOMATO],
    },
    {
      kind: 'excess',
      nutrient: 'K',
      label: 'Too much potassium',
      where: ['yo', 'yn'],
      looks: 'Shows as the shortages it causes, most often magnesium yellowing between the veins of the older leaves.',
      why: 'Potassium in excess blocks the plant taking up other nutrients.',
      fix: 'Stop adding wood ash, comfrey concentrate and other potassium-rich feeds until a soil test says the level has come down, and keep feeding with plain compost.',
      sources: [MBG_TOMATO],
    },
    {
      kind: 'water',
      label: 'Uneven watering',
      where: ['ha', 'ro'],
      looks: 'Blossom-end rot, a dark sunken patch on the flower end of the fruit, and fruit splitting in rings or lines from the stem, often after heavy rain following a dry spell.',
      why: 'Calcium reaches the fruit only with the water, so soil swinging between wet and dry, and damaged roots, leave the fruit short even in soil that holds plenty. A calcium spray on the leaves does not help.',
      fix: 'Water deeply and on a steady rhythm rather than a little every day, mulch thickly with compost or straw to hold the moisture even, keep the leaves that shade the fruit, and avoid digging near the roots.',
      sources: [UMD_TOMATO, BER_REVIEW],
    },
    {
      kind: 'ph',
      label: 'Soil too alkaline',
      where: ['yn', 'ha'],
      looks: 'New leaves yellowing between green veins, and more blotchy ripening, once the soil climbs past about pH 6.8.',
      why: 'Tomatoes do best at pH 6.2 to 6.8. Above that iron and manganese are locked away, and blotchy ripening is lowest near pH 6.4 and highest above 6.7.',
      fix: 'Test before adding anything, and never lime or add wood ash without a pH test. To bring the pH down, add compost and leaf mould every year rather than anything quick.',
      sources: [MBG_TOMATO, UMD_TOMATO],
    },
    {
      kind: 'mimic',
      label: 'Early blight',
      where: ['yo', 'sp'],
      looks: 'Blackish brown spots with rings like a target on the older leaves, the tissue around them yellow, and the whole leaf yellowing when the spots are many. The rings tell it from a shortage.',
      why: 'A fungus that lives on old tomato debris and spreads on wet leaves.',
      fix: 'Keep tomatoes out of that bed for three or four years, clear the debris at the end of the season or hot compost it, water so the leaves dry quickly, and keep the plants growing well.',
      sources: [PNW_TOMATO_EARLY_BLIGHT],
    },
    {
      kind: 'mimic',
      label: 'Fusarium or Verticillium wilt',
      where: ['yo', 'wi'],
      looks: 'Lower leaves yellow mostly on one side, the plant wilts in the heat of the day and recovers by evening, and a cut stem is brown inside. The two wilts look alike.',
      why: 'Soil fungi that block the water-carrying tissue, not a shortage, though the yellowing looks like one.',
      fix: 'Grow resistant varieties, marked F and V, remove and bin affected plants roots and all rather than composting them, and keep tomatoes out of that bed for four to six years. For Fusarium, a soil near pH 6.5 to 7 helps.',
      sources: [PNW_TOMATO_FUSARIUM, PNW_TOMATO_VERTICILLIUM],
    },
  ],
  hops: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'st', 'ha'],
      looks: 'Stunted bines, a general yellowing worst on the oldest leaves, and small cones.',
      fix: 'Topdress each hill with compost and well-rotted manure in spring, mulch it, and grow a legume cover crop between rows where there is room.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['st', 'ha'],
      looks: 'The lower leaves curve downward and turn a dark, dull green, the bines stay thin, and cones turn brown.',
      fix: 'Work compost and well-rotted manure into the soil around the crown in spring, where the roots can reach it, and keep the ground mulched to feed the soil life that frees phosphorus.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['yo', 'st'],
      looks: 'Weak bines with fewer burrs, and older leaves that bronze between the veins, turn an ashy grey and drop early.',
      fix: 'Mulch the hills with comfrey leaves and compost, and add wood ash only after a test shows the soil is not alkaline.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Calcium shortage',
      where: ['yn', 'ed', 'cu'],
      looks: 'The growing points and the edges of young leaves yellow and die. It looks much like boron shortage.',
      fix: 'Test the pH, since calcium runs short mostly in acid soil. On acid soil add garden lime or wood ash by the test result, with compost, and keep the watering steady so calcium can travel.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'sp'],
      looks: 'Older leaves yellow between the veins, those patches then die, and the leaves drop.',
      why: 'Acid soil, or too much potassium, which blocks it.',
      fix: 'On acid soil, dolomitic lime by the test result brings both pH and magnesium up. Topdress with compost and a little seaweed meal, and ease off wood ash and comfrey concentrate.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'S',
      label: 'Sulphur shortage',
      where: ['yn', 'st'],
      looks: 'Stunted plants with spindly stems and yellow younger leaves.',
      why: 'Most common on acid, coarse soils that water runs straight through.',
      fix: 'Build the soil’s organic matter with compost and well-rotted manure every year, which hold sulphur where water would wash it away, and mulch to keep it there.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn'],
      looks: 'Young leaves yellow between veins that stay green. In spring on cold, wet soil it can come and go, and clears as the soil warms.',
      why: 'Alkaline soil, or acid soil below about pH 5.7, where manganese interferes with iron.',
      fix: 'Wait for warm weather if it is spring. Where it lasts, test the pH and move it toward the middle of the hop range with compost and leaf mould on alkaline soil or lime on very acid soil.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Mn',
      label: 'Manganese shortage',
      where: ['yn', 'sp'],
      looks: 'Young leaves yellow, with white speckling.',
      why: 'Alkaline soil. Cyst nematodes on the roots also cut how much the plant takes up.',
      fix: 'Test the pH and bring alkaline soil down slowly with compost and leaf mould, and stop adding lime or wood ash.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Zn',
      label: 'Zinc shortage',
      where: ['cu', 'yn', 'st'],
      looks: 'Small, misshapen, yellow leaves that curl up and snap, and short side arms. It looks like a virus, apple mosaic.',
      why: 'Soil above about pH 7.5, and too much phosphorus.',
      fix: 'Test the pH, stop adding lime and wood ash on limy soil, work in compost and leaf mould every year, and ease off manure where a test shows phosphorus is high.',
      sources: [USA_HOPS_NUTRIENTS, OSU_HOPS_FERTILITY],
    },
    {
      kind: 'short',
      nutrient: 'B',
      label: 'Boron shortage',
      where: ['cu', 'st', 'ot'],
      looks: 'Shoots come up late, young leaves are stunted and crinkled, shoot tips yellow and die, and leaves stay small and brittle with fluffy tips.',
      why: 'Most common on acid or sandy soils.',
      fix: 'Build organic matter with compost every year, which holds boron in sandy soil, and bring very acid soil toward the middle of the hop range. Boron turns harmful at not much above what a plant needs, so add none without a test.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Mo',
      label: 'Molybdenum shortage',
      where: ['yo', 'sp'],
      looks: 'Older leaves yellow with white speckling. It is often taken for nitrogen shortage.',
      why: 'Soil at pH 5.7 or below locks molybdenum away.',
      fix: 'Raise the pH toward 6.5 with garden lime or wood ash by the test result, and add compost. Molybdenum comes free as the soil becomes less acid.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['sp', 'ho', 'wi'],
      looks: 'Lush growth that brings on powdery mildew, Verticillium wilt, spider mites and aphids.',
      fix: 'Feed with compost rather than rich manure or nitrogen feeds, and give only what the crop needs, which a soil test shows.',
      sources: [USA_HOPS_NUTRIENTS, PNW_HOP_VERTICILLIUM],
    },
    {
      kind: 'excess',
      label: 'Too much phosphorus, potassium or calcium',
      where: ['yo', 'cu'],
      looks: 'Shows as the shortage each one causes: too much phosphorus brings on zinc shortage, too much potassium magnesium shortage, and too much calcium both.',
      fix: 'Stop adding the one a soil test shows is high, most often manure for phosphorus and wood ash for potassium and calcium, and keep feeding with plain compost.',
      sources: [USA_HOPS_NUTRIENTS],
    },
    {
      kind: 'water',
      label: 'Too much water, or water on the leaves',
      where: ['yo', 'wi', 'sp', 'cu'],
      looks: 'Heavy watering in spring brings on Verticillium wilt, and water sprayed over the plants spreads downy mildew. Both are below.',
      fix: 'Water at the base by drip or a soaker hose, go easy in spring while the soil is still cool and wet, and give more once the bines are growing fast in summer.',
      sources: [PNW_HOP_VERTICILLIUM, PNW_HOP_DOWNY],
    },
    {
      kind: 'ph',
      label: 'Soil outside the hop range',
      where: ['yn', 'yo', 'cu', 'sp'],
      looks: 'Below about pH 5.7, manganese turns toxic and blocks iron, and molybdenum runs short. Above 7.5, zinc runs short. Acid soil also favours Fusarium, and alkaline soil Verticillium.',
      fix: 'Keep the soil between pH 5.7 and 7.5, tested every year. Lime or wood ash by the result raises it; compost and leaf mould bring it down slowly.',
      sources: [USA_HOPS_NUTRIENTS, OSU_HOPS_FERTILITY],
    },
    {
      kind: 'mimic',
      label: 'Downy mildew',
      where: ['cu', 'st', 'sp', 'ha'],
      looks: 'In spring, rigid, stunted, brittle shoots come up silvery or pale green among the normal ones, with dark purple to black undersides, then brown angular spots and browning cones. The stunted young growth looks like boron shortage.',
      why: 'A water mould that lives in the crown and spreads on wet leaves.',
      fix: 'Cut back the first shoots from the crown before training, strip the leaves off the lowest metre or so of each bine, water at the base, and grow a resistant kind such as Fuggle or Tettnang.',
      sources: [PNW_HOP_DOWNY],
    },
    {
      kind: 'mimic',
      label: 'Verticillium wilt',
      where: ['yo', 'wi'],
      looks: 'Leaves yellow and die from the base up, in stripes of dark dead tissue between yellow like a tiger, and a bine cut near the base is light brown under the bark.',
      why: 'A soil fungus that blocks the water-carrying tissue.',
      fix: 'Grow a resistant kind, keep weeds down around the hills, go easy on water in spring and on nitrogen, and dig out and bin a badly affected plant rather than composting it.',
      sources: [PNW_HOP_VERTICILLIUM],
    },
  ],
  cannabis: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'bo', 'st'],
      looks: 'Yellowing starts on the older leaves at the tips and moves toward the middle, the yellowest leaves drop, and the plant flowers early with fewer flowers.',
      why: 'Nitrogen washes out of soil easily, and the plant needs most of it while it is growing leaves.',
      fix: 'Topdress with compost or well-rotted manure and water on a comfrey or nettle feed while it grows. After harvest, dig in compost or sow a cover crop to feed the soil for next year.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['pu', 'cu', 'st'],
      looks: 'Purple leaf stalks, bluish-green leaves, dark copper or purple blotches on the lower leaves, which curl down, and small, late flower buds.',
      why: 'Most common while it flowers, and worse in clay, soggy or cold soil and above pH 7, where phosphorus is locked away.',
      fix: 'Work compost and fine bone meal into the soil before planting, where the roots will be, loosen heavy soil with compost, and let the soil warm before planting out.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['ed', 'cu', 'sp'],
      looks: 'The edges and tips of young leaves turn rusty brown, dry out and curl up, rust-coloured blotches spread, and the stems stay weak.',
      why: 'Salt in the soil, from heavy feeding or salty water, and cold soil both stop the roots taking potassium up.',
      fix: 'Water deeply with clean water to wash salts below the roots, loosen a crusted surface, then mulch with comfrey leaves and topdress with compost.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Calcium shortage',
      where: ['cu', 'sp', 'ro'],
      looks: 'Lower leaves contort and curl, with yellowish-brown irregular spots while the rest of the leaf stays green, and root tips die back.',
      why: 'Usually the roots failing to move calcium, from too much water, salt or root damage, and more common in acid soil.',
      fix: 'Let the soil dry a little between waterings, wash out built-up salts with clean water, and on acid soil add garden lime or wood ash by a pH test.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn'],
      looks: 'Yellowing between the veins starts on the youngest growth, then leaves die and drop.',
      why: 'The commonest shortage in field hemp where soil is alkaline, since high pH binds the iron. Too much water, poor drainage, salt, cold soil and too much phosphorus, manganese, zinc or copper make it worse.',
      fix: 'Water less, above all in clay and in cold weather, improve the drainage with compost, and bring alkaline soil down slowly with compost and leaf mould.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'sp', 'cu'],
      looks: 'Older leaves yellow between the veins, rust-brown spots appear at the edges, tips and between the veins, and the leaves curl upward and drop.',
      why: 'Too much potassium or calcium, clay, heavy watering, acid or cold soil, and nights below about 18°C (64°F) with days below about 24°C (75°F).',
      fix: 'Let the soil dry a little between waterings, plant out after the soil and nights have warmed, open clay with compost, and on acid soil add dolomitic lime by a pH test.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'Mn',
      label: 'Manganese shortage',
      where: ['yn', 'sp'],
      looks: 'Younger leaves yellow between the veins with dark green edges, with dead spots when it is severe, and slow growth.',
      why: 'Soil above pH 6.5, or too much iron.',
      fix: 'Test the pH and bring it down slowly with compost and leaf mould, and stop adding lime or wood ash.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'short',
      nutrient: 'B',
      label: 'Boron shortage',
      where: ['cu', 'st', 'ro'],
      looks: 'New tips stunted, twisted and clustered and looking burned, thick brittle leaves, rust-coloured corky patches on the stems, and swollen, discoloured root tips.',
      why: 'Found in very poor soils that are never fed.',
      fix: 'Build the soil with compost and well-rotted manure every year. Boron turns harmful at not much above what a plant needs, so add none on its own without a test.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['ho', 'ro'],
      looks: 'Leaves darken from the lowest up, foliage grows lush, stems are weak and break, and aphids move in.',
      fix: 'Stop feeding and water through with clean water where the soil drains. Feed next season with compost rather than rich manure.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'P',
      label: 'Too much phosphorus',
      where: ['yn'],
      looks: 'Looks like iron or zinc shortage on the new growth.',
      why: 'Manure added year after year, above all under drip watering, which never washes it through. Watering does not wash it out.',
      fix: 'Stop adding manure and bone meal until a soil test says the level has come down, and feed with plain compost.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      label: 'Too much potassium or calcium',
      where: ['yo', 'yn', 'wi'],
      looks: 'Shows as the shortages it causes. Too much potassium blocks calcium, magnesium, zinc and iron; too much calcium blocks potassium, iron, magnesium and manganese, and can wilt the leaves slightly.',
      fix: 'Stop adding wood ash, lime and potassium-rich feeds until a soil test says the level has come down, and feed with plain compost.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'B',
      label: 'Too much boron',
      where: ['ed', 'yo'],
      looks: 'The older leaves go first: the edges yellow and then die, like scorch from salty soil.',
      why: 'Rare in nature. It comes from adding too much, including boric acid ant baits.',
      fix: 'Stop whatever added it, including ant baits near the plants. It is hard to put right before the crop is mature, so water through with clean water where the soil drains and wait.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'Fe',
      label: 'Too much iron',
      where: ['sp'],
      looks: 'Bronze leaves with small black spots.',
      why: 'Only from adding too much.',
      fix: 'Stop adding anything with iron in it and feed with plain compost.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'excess',
      nutrient: 'Mn',
      label: 'Too much manganese',
      where: ['yn', 'sp'],
      looks: 'Yellowing with dark orange to rusty brown mottling on the new growth, and slow growth.',
      why: 'Acid soil lets the roots take up too much.',
      fix: 'Test the pH and raise acid soil toward 6.5 with garden lime or wood ash by the result, with compost.',
      sources: [USU_HEMP_NUTRIENTS],
    },
    {
      kind: 'water',
      label: 'Too much water, poor drainage, or salty water',
      where: ['yn', 'yo', 'cu', 'ed'],
      looks: 'The iron, magnesium and calcium shortages above, in soil that holds plenty of each, and brown scorched edges from salt.',
      why: 'Wet, cold or badly drained roots stop taking these up, and salt in the soil or in the water locks potassium away.',
      fix: 'Let the top of the soil dry between waterings, water by drip, open heavy soil with compost or grow in a raised bed, and have the water tested if it may be salty.',
      sources: [USU_HEMP_NUTRIENTS, PSU_HEMP],
    },
    {
      kind: 'ph',
      label: 'Soil outside pH 6.0 to 7.0',
      where: ['yn', 'pu', 'cu', 'sp'],
      looks: 'Above pH 6.5 manganese runs short, above 7 phosphorus is locked away, and high pH is the commonest reason for iron shortage. In acid soil calcium runs short and manganese can turn toxic.',
      fix: 'Keep the soil between pH 6.0 and 7.0, tested before planting. Lime or wood ash by the result raises it; compost and leaf mould bring it down slowly.',
      sources: [USU_HEMP_NUTRIENTS, PSU_HEMP],
    },
  ],
};

export const CROP_SIGN_CONFIRM: Record<string, CropConfirm> = {
  tomato: {
    text: 'Confirm with a soil test for pH, potassium, calcium and magnesium before adding anything. Blossom-end rot and splitting are nearly always the watering, which no test shows, so look at the watering first.',
    sources: [MBG_TOMATO, UMD_TOMATO],
  },
  hops: {
    text: 'Confirm with a soil test every year, and a leaf or leaf stalk test from a lab during the season, which says what the plant has taken up rather than what the soil holds.',
    sources: [USA_HOPS_NUTRIENTS, OSU_HOPS_FERTILITY, ONTARIO_HOPS],
  },
  cannabis: {
    text: 'Confirm with a soil test in spring and a leaf test from a lab, taking leaves from plants showing the sign and from healthy ones to compare. A lab reads them against published ranges for the crop.',
    sources: [USU_HEMP_NUTRIENTS, NCSU_HEMP_TISSUE],
  },
};

// Pages the powdery mildew problem for cannabis stands on, for the crop
// problem sources in lib/cropProblems.ts.
export const CANNABIS_MILDEW_SOURCE = USU_HEMP_MILDEW;

/** Crop keys with signs, in the order the batches added them. */
export function cropsWithSigns(): string[] {
  return Object.keys(CROP_SIGNS);
}

function problemSymptoms(cropKey: string): SymptomKey[] {
  return Object.values(CROP_PROBLEM_SYMPTOMS[cropKey] ?? {}).flat();
}

/** The symptoms a crop has something to say about, in picker order. */
export function cropSymptomChoices(cropKey: string): Symptom[] {
  const covered = new Set<SymptomKey>([...(CROP_SIGNS[cropKey] ?? []).flatMap((sign) => sign.where), ...problemSymptoms(cropKey)]);
  return SYMPTOMS.filter((symptom) => covered.has(symptom.key));
}

/** A crop's signs showing as this symptom, or all of them for null. */
export function cropSignsFor(cropKey: string, symptom: SymptomKey | null): CropSign[] {
  const signs = CROP_SIGNS[cropKey] ?? [];
  return symptom ? signs.filter((sign) => sign.where.includes(symptom)) : signs;
}

/** A crop's known problems showing as this symptom, or all of them for null. */
export function cropProblemsShowing(cropKey: string, symptom: SymptomKey | null): CropProblem[] {
  const problems = CROP_PROBLEMS[cropKey] ?? [];
  if (!symptom) return problems;
  const tags = CROP_PROBLEM_SYMPTOMS[cropKey] ?? {};
  return problems.filter((problem) => (tags[problem.label] ?? []).includes(symptom));
}

export function cropSignSources(cropKey: string): GuideSource[] {
  const seen = new Set<string>();
  const out: GuideSource[] = [];
  for (const source of [...(CROP_SIGNS[cropKey] ?? []).flatMap((sign) => sign.sources), ...(CROP_SIGN_CONFIRM[cropKey]?.sources ?? [])]) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    out.push(source);
  }
  return out;
}

export const CROP_SIGN_INTRO =
  'Each crop shows trouble differently, so start from the crop. Pick it, then what you see, and this lists the signs that crop is known to show that way: too little or too much of a nutrient, watering, soil pH, and the diseases that look like a shortage, each from a page about that crop. Nothing leaves the phone.';

export const CROP_SIGN_BATCH_LINE =
  'Crops are added a few at a time, each checked against sources for that crop, so a crop missing here has no signs yet. Its three known problems are under How to Grow Each Crop.';

export const CROP_SIGN_CAUTION =
  'These are the likeliest causes, not a diagnosis. Check the soil a finger deep before anything else, and test it before adding anything to it.';

export function cropSignHeading(symptom: Symptom | null, cropName: string): string {
  return symptom ? `What ${symptom.phrase} on ${cropName.toLowerCase()} can be` : `Every sign ${cropName.toLowerCase()} is known to show`;
}
