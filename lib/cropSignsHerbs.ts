// What is wrong with a plant, crop by crop: the herbs (I26, from batch 2,
// 2026-09-29). Gathered by lib/cropSigns.ts, which explains the rules
// every sign here follows: each cites a page about that crop, a sign no
// source for the crop describes is left out rather than borrowed, and the
// fixes are put right from the soil and name no bag or bottle.
//
// The e-GRO alerts are written for greenhouse and hydroponic growers. They
// are cited for what the trouble looks like on the plant, which is the
// same on a windowsill or in a bed; their feeding advice is not repeated.
//
// Pure: no React and no database.

import type { CropConfirm, CropSign } from './cropSignTypes';
import type { GuideSource } from './plantNutrients';

// Basil.
const egro = (page: string, title: string): GuideSource => ({
  label: `e-GRO: ${title}`,
  url: `https://www.e-gro.org/pdf/${page}.pdf`,
});
const EGRO_BASIL_MG = egro('E303', 'Magnesium deficiency of hydroponic and container grown basil');
const EGRO_BASIL_MG_OR_MICRO = egro('E401', 'Magnesium or micronutrient deficiency in basil?');
const EGRO_BASIL_MICRO_EXCESS = egro('2023-12-41', 'Micronutrient madness: basil');
const EGRO_BASIL_CHILL = egro('E306', 'Preventing chilling injury of basil');
const EGRO_BASIL_COLD = egro('e1002', 'Avoiding cold damage on basil');
const EGRO_BASIL_SLOW = egro('E103', 'Slow basil growth');
const EGRO_BASIL_PURPLE = egro('E203', 'Not-so purple basil');
const EGRO_BASIL_DOWNY = egro('E407', 'Managing basil downy mildew');
const EGRO_BASIL_FUSARIUM = egro('E102', 'Basil fusarium wilt');
const EGRO_PYTHIUM = egro('E301', 'Pythium root rot on basil and spinach');
const NEV_BASIL: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Basil',
  url: 'https://nevegetable.org/crops/basil',
};
const UMD_BASIL: GuideSource = {
  label: 'University of Maryland: Growing basil in a home garden',
  url: 'https://extension.umd.edu/resource/growing-basil-home-garden',
};
const NCSU_BASIL: GuideSource = {
  label: 'NC State Extension Gardener Plant Toolbox: Sweet basil',
  url: 'https://plants.ces.ncsu.edu/plants/ocimum-basilicum/',
};
const ILLINOIS_BASIL: GuideSource = {
  label: 'University of Illinois Extension: Basil',
  url: 'https://extension.illinois.edu/herbs/basil',
};
const USU_BASIL: GuideSource = {
  label: 'Utah State University: How to grow basil in your garden',
  url: 'https://extension.usu.edu/yardandgarden/research/basil-in-the-garden',
};

export const HERB_SIGNS: Record<string, CropSign[]> = {
  basil: [
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yn', 'yo', 'ed'],
      looks: 'Faint yellowing between the veins of the fully grown leaves. On basil those sit near the top, just under the growing tip, so it is easily taken for an iron or manganese shortage. Later the edges yellow too, and the older leaves get brown or reddish brown dead patches.',
      why: 'Basil is sensitive to it. The plant moves magnesium to its tip from the nearest grown leaves, which on basil are the top ones.',
      fix: 'In a pot, repot into fresh compost-rich potting mix. In a bed, work in compost and go easy on potassium-rich feeds, which crowd magnesium out. Lime with dolomitic lime only if a pH test shows the soil is acid.',
      sources: [EGRO_BASIL_MG, EGRO_BASIL_MG_OR_MICRO],
    },
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn'],
      looks: 'The newest leaves at the very tip yellow between green veins, while the grown leaves below stay green.',
      why: 'On basil it usually comes from too much water, root rot or alkaline soil rather than too little iron in the soil.',
      fix: 'Let the top of the soil dry between waterings, make sure the pot or bed drains, and check the pH. Basil grows well from about pH 6.0 to 6.8.',
      sources: [EGRO_BASIL_MICRO_EXCESS, EGRO_BASIL_MG_OR_MICRO, NEV_BASIL],
    },
    {
      kind: 'excess',
      label: 'Too much of the trace nutrients',
      where: ['yo', 'ed'],
      looks: 'The lower leaves yellow and then die in patches. Boron, iron, manganese, zinc or copper can each do it, and they look the same.',
      why: 'Basil needs very little feeding, and a small excess of any trace nutrient burns the lower leaves.',
      fix: 'Stop any trace nutrient feed and water the pot through to wash the excess out. Compost gives basil all the trace nutrients it needs.',
      sources: [EGRO_BASIL_MICRO_EXCESS],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['ot', 'ha'],
      looks: 'Lush, soft growth with weaker flavour, and cut leaves that darken sooner after picking.',
      fix: 'Feed with compost rather than rich feeds. A light topdressing after the first or second cutting is all basil needs.',
      sources: [NEV_BASIL, UMD_BASIL],
    },
    {
      kind: 'mimic',
      label: 'Cold',
      where: ['sp', 'wi', 'yo'],
      looks: 'Brown patches between the veins, sometimes a darkened stem, then wilting, drooping leaves and a dull look with less scent. The older leaves drop a few days after it warms up again.',
      why: 'Basil comes from the tropics and is damaged below about 12°C (54°F), even without frost. Once it shows, the leaves do not recover.',
      fix: 'Plant out only once nights stay warm, keep pots away from cold windows and draughts, and bring them in before cold nights.',
      sources: [EGRO_BASIL_CHILL, EGRO_BASIL_COLD, UMD_BASIL],
    },
    {
      kind: 'mimic',
      label: 'Too little light and warmth',
      where: ['st'],
      looks: 'Basil grows slowly and makes few new leaves, most of all from late autumn to early spring. It is the light and the temperature, not a shortage.',
      why: 'Warmth sets how fast new leaves come and light sets how much the plant can grow. Adding more feed does not speed it up.',
      fix: 'Give basil the sunniest spot there is, six hours of direct sun or more, or a grow light indoors in winter, and keep it warm.',
      sources: [EGRO_BASIL_SLOW, UMD_BASIL],
    },
    {
      kind: 'mimic',
      label: 'Purple basil turning green',
      where: ['pu', 'ot'],
      looks: 'Purple basil comes up mottled green and purple, mostly in winter and early spring.',
      why: 'Low light. The purple colour grows stronger as the light increases. Some varieties are always mottled, so check what yours should look like.',
      fix: 'Move it into more light or under a grow light, and the new leaves colour up.',
      sources: [EGRO_BASIL_PURPLE],
    },
    {
      kind: 'mimic',
      label: 'Downy mildew',
      where: ['yo', 'sp'],
      looks: 'Yellow patches held in bands between the larger veins, with a grey or purple fuzz of spores underneath. It spreads within days.',
      why: 'A water mould that needs damp, humid air around the leaves. The leaves are still safe to eat.',
      fix: 'Grow resistant varieties, space the plants for air, water the soil and not the leaves, and pull affected plants. Sow again in a pot or another part of the garden.',
      sources: [EGRO_BASIL_DOWNY, UMD_BASIL],
    },
    {
      kind: 'mimic',
      label: 'Fusarium wilt',
      where: ['wi', 'yo', 'st', 'cu'],
      looks: 'Plants 15 to 30 cm (6 to 12 inches) tall suddenly wilt, stay small or yellow. Brown streaks run up the stem, often on one side first, the tip can twist over like a shepherd\'s crook, and the older leaves drop.',
      why: 'A fungus that blocks the water vessels, most often brought in on seed. Sweet basil suffers most, and it lives in the soil for years.',
      fix: 'Buy seed from a source that tests for it, never save seed from affected plants, and pull and remove them. Grow basil in a new bed or in pots of fresh mix for years after.',
      sources: [EGRO_BASIL_FUSARIUM, NCSU_BASIL],
    },
    {
      kind: 'mimic',
      label: 'Root rot',
      where: ['wi', 'ro', 'yo', 'st'],
      looks: 'The plants stay small and yellow, then wilt in the middle of the day and do not recover. The roots are brown with few fine roots.',
      why: 'Water moulds such as Pythium in wet, poorly drained soil or standing water. The yellowing is often taken for a shortage.',
      fix: 'Use a free-draining mix, never leave pots standing in water, and water only when the top of the soil dries.',
      sources: [EGRO_PYTHIUM],
    },
    {
      kind: 'mimic',
      label: 'Flowering',
      where: ['bo', 'ot'],
      looks: 'Spikes of small white or purple flowers at the tips, then seed. The leaves lose flavour and the plant stops making new ones.',
      why: 'Summer heat and dry soil push basil to flower.',
      fix: 'Keep the soil moist, pinch out the flower buds as soon as they show, and pinch the stem tips as they grow so the plant branches.',
      sources: [USU_BASIL, ILLINOIS_BASIL, NCSU_BASIL],
    },
  ],
};

export const HERB_SIGN_CONFIRM: Record<string, CropConfirm> = {
  basil: {
    text: 'Confirm with a leaf test from a lab, beside a pH test of the soil or mix. The e-GRO alerts say a magnesium shortage and a trace nutrient shortage look alike on basil, and that too much of a trace nutrient can only be told apart by a leaf test. Cold, low light, mildew and wilt show in no nutrient test.',
    sources: [EGRO_BASIL_MG_OR_MICRO, EGRO_BASIL_MICRO_EXCESS],
  },
};
