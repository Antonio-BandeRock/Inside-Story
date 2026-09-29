// What is wrong with a plant, crop by crop: pepper and aubergine (I26,
// from batch 3, 2026-09-29). Gathered by lib/cropSigns.ts, which explains
// the rules every sign here follows: each cites a page about that crop, a
// sign no source for the crop describes is left out rather than borrowed,
// and the fixes are put right from the soil and name no bag or bottle.
//
// Tomato and potato live elsewhere (lib/cropSigns.ts and
// lib/cropSignsVegetables.ts). The pepper guide covers chillies as well,
// since lib/cropGuides.ts reads chilli, jalapeno and capsicum as a pepper.
// Aubergine carries one nutrient sign, calcium through blossom end rot,
// because that is the one shortage the pages found describe on aubergine;
// the leaf shortages Yara describes on pepper are not borrowed for it.
//
// Pure: no React and no database.

import type { CropConfirm, CropSign } from './cropSignTypes';
import type { GuideSource } from './plantNutrients';

const yaraPepper = (nutrient: string): GuideSource => ({
  label: `Yara: ${nutrient[0].toUpperCase()}${nutrient.slice(1)} deficiency in sweet pepper`,
  url: `https://www.yara.co.uk/crop-nutrition/sweet-pepper/nutrient-deficiencies-pepper/${nutrient}-deficiency-pepper/`,
});
const umnPepper = (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: What is wrong with my pepper? ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/pepper/${page}.html`,
});
const umnEggplant = (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: What is wrong with my eggplant? ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/eggplant/${page}.html`,
});

const RHS_PEPPERS: GuideSource = {
  label: 'RHS: How to grow sweet peppers',
  url: 'https://www.rhs.org.uk/vegetables/peppers/grow-your-own',
};
const RHS_AUBERGINES: GuideSource = {
  label: 'RHS: How to grow aubergines',
  url: 'https://www.rhs.org.uk/vegetables/aubergines/grow-your-own',
};
const RHS_BLOSSOM_END_ROT: GuideSource = {
  label: 'RHS: Blossom end rot on tomatoes, aubergines and peppers',
  url: 'https://www.rhs.org.uk/problems/blossom-end-rot',
};
const NEV_PEPPER: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Pepper',
  url: 'https://nevegetable.org/crops/pepper',
};
const NEV_PEPPER_DISORDERS: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Pepper physiological disorders',
  url: 'https://nevegetable.org/book/crops/pepper/pepper-physiological-disorders',
};
const NEV_EGGPLANT: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Eggplant',
  url: 'https://nevegetable.org/crops/eggplant',
};

const P_COLLAPSED = umnPepper('seedlingcollapsed', 'Collapsed seedling');
const P_CUT = umnPepper('seedlingplantcutatbase', 'Plant cut at base');
const P_STUNTED = umnPepper('plantstunted', 'Stunted plant');
const P_STEM = umnPepper('stemdiscolored', 'Spots on the stem');
const P_HOLES = umnPepper('leavesholes', 'Holes in leaves');
const P_WILTED = umnPepper('leaveswilted', 'Wilted leaves');
const P_SPOTS = umnPepper('leavesspots', 'Spots on leaves');
const P_DISTORTED = umnPepper('leavesdistorted', 'Distorted leaves');
const P_FRUIT_SPOTS = umnPepper('fruitspots', 'Spots on fruit');
const P_FRUIT_ROT = umnPepper('fruitrotten', 'Rotten fruit');

const E_COLLAPSED = umnEggplant('seedlingcollapsed', 'Collapsed seedling');
const E_CUT = umnEggplant('seedlingplantcutatbase', 'Plant cut at base');
const E_STUNTED = umnEggplant('plantstunted', 'Stunted plant');
const E_STEM = umnEggplant('stemdiscolored', 'Discoloured stems');
const E_HOLES = umnEggplant('leavesholes', 'Holes in leaves');
const E_WILTED = umnEggplant('leaveswilted', 'Leaves wilt');
const E_DISCOLOURED = umnEggplant('leavesdiscolored', 'Discoloured leaves');
const E_FRUIT_SPOTS = umnEggplant('fruitspots', 'Spots or rot on fruit');

export const SOLANUM_SIGNS: Record<string, CropSign[]> = {
  pepper: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'st'],
      looks: 'Growth slows badly. The lower leaves yellow and die early, and the leaves are small and pale yellow green all over.',
      why: 'Worse on sandy soil and soil low in organic matter, in drought or after heavy rain, and where straw or raw manure was dug in, since soil life takes up nitrogen while it breaks them down.',
      fix: 'Dig well-rotted compost or manure in before planting, never fresh straw or raw manure, grow peppers after beans or a clover green manure, and keep a mulch of compost over the soil.',
      sources: [yaraPepper('nitrogen'), NEV_PEPPER],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['yo', 'sp', 'st', 'ha'],
      looks: 'The plant and its leaves stay much smaller than they should, the leaves are mottled pale between the veins with a dead seam along the main vein, and the fruit are shorter and narrower.',
      why: 'Worse in acid or very chalky soil, soil low in organic matter, and cold or wet weather.',
      fix: 'Plant out once the soil is warm, bring the pH to about 6.0 to 6.8, and dig compost in where the roots will run so soil life keeps phosphorus moving.',
      sources: [yaraPepper('phosphorus'), NEV_PEPPER],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['ed', 'yo', 'sp', 'wi'],
      looks: 'The plant is stunted and the leaves bend down and look limp. The older leaves yellow at the edges and between the veins, small sunken whitish spots appear, and then patches die until the leaf looks scorched.',
      why: 'Worse on acid or sandy soil, in drought, after heavy rain, and on soil rich in magnesium.',
      fix: 'Keep adding compost and mulch, which hold potassium. Plants in pots want a high-potassium organic liquid feed each week once they flower, and a comfrey feed made at home is one.',
      sources: [yaraPepper('potassium'), RHS_PEPPERS],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'ed'],
      looks: 'The older leaves go pale between the veins, starting at the edges, while the main veins and a band along them stay green. Later dead patches spread in from the edge.',
      why: 'Worse on sandy or acid soil, soil rich in potassium or given a lot of it, and in cold wet spells. Manganese and iron shortages look alike but start on the young leaves.',
      fix: 'Go easy on potassium-rich feeds, add compost, and test the pH: if the soil is acid, lime with dolomitic lime, which carries magnesium.',
      sources: [yaraPepper('magnesium')],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Blossom end rot (calcium not reaching the fruit)',
      where: ['ha', 'yn'],
      looks: 'A large sunken, water-soaked patch on the side or flower end of the fruit that goes tan and soft, then black, and the fruit may be short and stumpy. In a bad case the young upper leaves yellow between the veins, with brown spots at the edges, and bend down.',
      why: 'Almost never a shortage in the soil. Calcium travels in the water moving through the plant, so dry spells, uneven watering, drought followed by rain, and a small pot stop enough of it reaching the fruit.',
      fix: 'Water evenly so the soil never dries right out, mulch to hold the moisture, give pot-grown plants a bigger pot or border soil, and go easy on rich feeds. Sprays onto the fruit do not work. Later fruit set normally once watering is steady.',
      sources: [NEV_PEPPER_DISORDERS, yaraPepper('calcium'), RHS_BLOSSOM_END_ROT, P_FRUIT_SPOTS],
    },
    {
      kind: 'short',
      nutrient: 'S',
      label: 'Sulphur shortage',
      where: ['yn', 'st'],
      looks: 'The youngest leaves at the top go an even light green all over, veins and all, which is what tells it from iron or manganese.',
      why: 'Worse on acid, sandy, waterlogged soil low in organic matter.',
      fix: 'Build the organic matter up with compost every year, which is where most of a soil\'s sulphur is held, and keep the soil open and drained.',
      sources: [yaraPepper('sulphur')],
    },
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn', 'wi', 'st'],
      looks: 'The top leaves turn yellow green between the veins while the veins stay dark green, then the veins pale too. The plant is short and the leaves limp.',
      why: 'Iron is locked up at high pH and in chalky or waterlogged soil.',
      fix: 'Keep the soil drained, test the pH and do not lime above about 6.8, and work in compost, which keeps iron in a form roots can take.',
      sources: [yaraPepper('iron'), NEV_PEPPER],
    },
    {
      kind: 'short',
      nutrient: 'Mn',
      label: 'Manganese shortage',
      where: ['yn'],
      looks: 'The young leaves go pale between the veins while even the smallest veins stay dark green, which is what tells it from magnesium, which starts on the older leaves.',
      why: 'Worse on high pH, sandy or very organic soil, and in cold wet spells.',
      fix: 'Test the pH and stop liming if it is high, and keep the soil drained.',
      sources: [yaraPepper('manganese')],
    },
    {
      kind: 'short',
      nutrient: 'Zn',
      label: 'Zinc shortage',
      where: ['st'],
      looks: 'A stunted plant with the leaves crowded close together on short stems, and leaves smaller than they should be.',
      why: 'Worse on high pH, on soil rich in phosphorus or given a lot of it, and in cold wet weather.',
      fix: 'Go easy on phosphorus-rich feeds and bone meal, test the pH and do not over-lime, and add compost.',
      sources: [yaraPepper('zinc')],
    },
    {
      kind: 'short',
      nutrient: 'Mo',
      label: 'Molybdenum shortage',
      where: ['cu', 'yn'],
      looks: 'The young leaves are misshapen: parts of the leaf are missing, or the leaf is crinkled.',
      why: 'A shortage of acid soil.',
      fix: 'Test the pH and lime acid soil toward 6.5, since molybdenum is freed as the pH rises.',
      sources: [yaraPepper('molybdenum')],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['fl', 'ha', 'ot'],
      looks: 'A big, leafy, dark green plant with fewer flowers and fruit than it should carry.',
      why: 'Too much nitrogen pushes leaf growth and cuts the crop.',
      fix: 'Feed with compost dug in before planting and little more, above all after beans, a clover green manure or where manure went in.',
      sources: [NEV_PEPPER],
    },
    {
      kind: 'ph',
      label: 'Soil pH off',
      where: ['st', 'yo', 'yn'],
      looks: 'Slow, pale growth that feeding does not help. Peppers want a pH of about 6.0 to 6.8: below it phosphorus, molybdenum and calcium are harder to reach, and above it iron, manganese and zinc.',
      fix: 'Test the pH and lime only as the test says, a season before planting. Compost worked in every year steadies the soil either way.',
      sources: [NEV_PEPPER, yaraPepper('molybdenum'), yaraPepper('iron')],
    },
    {
      kind: 'water',
      label: 'Too dry',
      where: ['fl', 'wi', 'ha'],
      looks: 'Flower buds fall off, the plant wilts in the heat, and the fruit may get blossom end rot. Plants in pots dry out fastest.',
      fix: 'Keep the soil evenly moist, check pots every day in hot weather and water them daily if they need it, and mulch with compost.',
      sources: [RHS_PEPPERS, P_FRUIT_ROT],
    },
    {
      kind: 'water',
      label: 'Waterlogged, heavy soil',
      where: ['ro', 'wi'],
      looks: 'Plants wilt and roots rot in heavy or poorly drained ground.',
      fix: 'Grow in a raised bed, or work compost into heavy soil, so water drains away from the roots.',
      sources: [NEV_PEPPER],
    },
    {
      kind: 'mimic',
      label: 'Too hot to set fruit',
      where: ['fl', 'ha'],
      looks: 'Plenty of flowers but few fruit in a hot greenhouse or a hot spell.',
      why: 'Temperatures above 30°C (86°F) cut fruiting.',
      fix: 'Ventilate the greenhouse, put up shading in summer, and damp the floor down on hot days to raise the humidity.',
      sources: [RHS_PEPPERS],
    },
    {
      kind: 'mimic',
      label: 'Cold, frost or a chill',
      where: ['wi', 'st', 'ot'],
      looks: 'Whole leaves, young shoots or the whole plant discolour and wilt, and the inside of the fruit may discolour. Outdoors in a cool summer, the plant stalls and the fruit fail to ripen.',
      why: 'Peppers want at least 12°C (54°F) at night and grow best above 15°C (59°F).',
      fix: 'Plant out only once nights stay above 12°C (54°F), harden plants off first, and grow them under cover where summers are cool.',
      sources: [P_WILTED, RHS_PEPPERS],
    },
    {
      kind: 'mimic',
      label: 'Sunscald',
      where: ['ha', 'sp'],
      looks: 'The side of the fruit facing the sun turns pale tan or white and may dry and wrinkle, and on new transplants the sun side of young stems goes white.',
      why: 'Fruit left bare by wide spacing, lost leaves or broken stems cook in the sun.',
      fix: 'Keep the plants leafy with steady watering in hot weather, space them close enough to shade each other, and stake them so they do not fall open.',
      sources: [NEV_PEPPER_DISORDERS, P_STEM, P_FRUIT_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Viruses',
      where: ['yn', 'cu', 'st', 'ha'],
      looks: 'Leaves mottled with yellow and light green, misshapen, sometimes long and thin like a shoestring or curled, fruit with yellow blotches or brown rings, and plants stunted beside healthy ones.',
      why: 'Cucumber mosaic, potato virus Y, tomato spotted wilt and others. The patchy pattern, with healthy plants beside sick ones, is what tells it from a shortage.',
      fix: 'There is no cure, so pull and bin the plant. Grow a variety bred to resist the common pepper viruses, and keep weeds and aphids down.',
      sources: [P_STUNTED, P_DISTORTED, NEV_PEPPER],
    },
    {
      kind: 'mimic',
      label: 'Phytophthora blight',
      where: ['ro', 'wi', 'sp', 'ha'],
      looks: 'Dark sunken patches on the stem with everything beyond wilting, tan bleached spots on the leaves, soft water-soaked spots on the fruit, which shrivel on the plant under white mould, and a whole plant that wilts and browns.',
      why: 'A water mould of wet soil that spreads fast in cool wet weather.',
      fix: 'Grow on a raised bed, never where water lies, and do not grow peppers on that ground again for some years.',
      sources: [P_STEM, P_WILTED, NEV_PEPPER],
    },
    {
      kind: 'mimic',
      label: 'Verticillium wilt',
      where: ['wi', 'yo', 'sp'],
      looks: 'Leaves yellow and wilt, often on one side, with yellow wedge-shaped patches that brown in the middle. The lower leaves go first, and a cut down the stem near the soil shows tan veins.',
      why: 'A soil fungus, common in cool weather of 20 to 24°C (68 to 75°F).',
      fix: 'There is no cure. Lift the plant with its roots, and grow peppers and their family on other ground for several years.',
      sources: [P_WILTED],
    },
    {
      kind: 'mimic',
      label: 'Bacterial spot',
      where: ['sp', 'yo', 'ha'],
      looks: 'Round brown spots with a dark edge, worst on the lower leaves, and raised corky brown spots on the fruit.',
      why: 'Bacteria of warm, wet weather, 24 to 30°C (75 to 86°F). Leaves lost to it leave the fruit open to sunscald.',
      fix: 'Grow a resistant variety from clean seed, water the soil and not the leaves, do not work among wet plants, and rotate.',
      sources: [P_SPOTS, P_FRUIT_SPOTS, NEV_PEPPER],
    },
    {
      kind: 'mimic',
      label: 'Anthracnose on ripe fruit',
      where: ['ha', 'sp'],
      looks: 'Round, sunken spots with a black centre on ripe and overripe fruit, which make pink spores when damp. Leaves and stems stay clean.',
      why: 'A fungus of warm, wet weather.',
      fix: 'Pick fruit as it ripens, do not leave overripe fruit on the plant, water the soil and not the plant, and rotate.',
      sources: [P_FRUIT_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Grey mould',
      where: ['ha', 'ro'],
      looks: 'A soft rot on stems, flowers or fruit under a fuzzy grey growth.',
      why: 'A very common fungus of damp, still air under cover.',
      fix: 'Ventilate the greenhouse, space plants for air, and pick off dead leaves and flowers.',
      sources: [RHS_PEPPERS],
    },
    {
      kind: 'mimic',
      label: 'Damping off',
      where: ['ro', 'wi'],
      looks: 'The seedling stem darkens at the soil and the seedling falls over, wilts and rots, sometimes under a cobweb of mould.',
      fix: 'Sow in fresh seed mix at 18 to 21°C (65 to 70°F), water to keep the mix moist but not wet, and give the seedlings air and light.',
      sources: [P_COLLAPSED, RHS_PEPPERS],
    },
    {
      kind: 'mimic',
      label: 'Aphids',
      where: ['cu', 'yo', 'wi'],
      looks: 'Colonies of small soft insects on the shoot tips and under the leaves, and in large numbers yellowing and wilting.',
      fix: 'Check the tips and under the leaves often and rub out the first colonies, and plant flowers for the ladybirds, lacewings and hoverflies that eat them.',
      sources: [RHS_PEPPERS, P_WILTED],
    },
    {
      kind: 'mimic',
      label: 'Something chewing it',
      where: ['ho', 'ha'],
      looks: 'Small pits and shot holes in the leaves from flea beetles, large holes and stripped plants from hornworm caterpillars or slugs, holes in the fruit, or young plants cut off at the soil by cutworms.',
      fix: 'Put a collar of card round each new transplant, hand-pick caterpillars and go out on damp evenings for slugs, cover young plants with fine netting against flea beetles, and plant flowers for the birds and beetles that eat them.',
      sources: [P_HOLES, P_CUT],
    },
  ],
  aubergine: [
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Blossom end rot (calcium not reaching the fruit)',
      where: ['ha'],
      looks: 'The side or bottom of the fruit turns tan and soft, then black and sunken, and the fruit may be short and stumpy.',
      why: 'Almost never a shortage in the soil. Calcium travels in the water moving through the plant, so uneven watering, drought followed by rain, and a small pot stop enough reaching the fruit.',
      fix: 'Water evenly so the soil never dries out, mulch to hold the moisture, and grow in a bigger pot or in border soil. Sprays onto the fruit do not work.',
      sources: [E_FRUIT_SPOTS, RHS_BLOSSOM_END_ROT],
    },
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'Slow, pale plants that feeding does not help. Aubergines want a pH of about 6.5 to 6.8.',
      fix: 'Test the pH and lime only as the test says, a season before planting. Compost worked in every year steadies the soil.',
      sources: [NEV_EGGPLANT],
    },
    {
      kind: 'water',
      label: 'Too dry at flowering',
      where: ['fl', 'ha', 'wi'],
      looks: 'Fewer fruit and a smaller crop, wilting in the heat, and plants in pots drying out fast.',
      why: 'Aubergines need water most while they flower and set fruit.',
      fix: 'Keep the soil steadily moist, water pots daily in hot weather or run a drip line, and mulch with compost.',
      sources: [NEV_EGGPLANT, RHS_AUBERGINES],
    },
    {
      kind: 'mimic',
      label: 'Too hot or too cool to set fruit',
      where: ['fl', 'ha'],
      looks: 'Flowers drop without setting, or open poorly.',
      why: 'Days above 32°C (90°F), and nights below 16°C (60°F) or above 21°C (70°F), cut flowering and make the flowers drop.',
      fix: 'Grow in the warmest, sunniest sheltered spot, ventilate and damp down a greenhouse on hot days, and plant out only once nights are warm.',
      sources: [NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'No insects to pollinate',
      where: ['fl', 'ha'],
      looks: 'Flowers under cover fall without setting fruit.',
      fix: 'Open greenhouse doors and vents on warm days while the plants flower, mist the flowers, or pollinate them by hand with a small paintbrush.',
      sources: [RHS_AUBERGINES],
    },
    {
      kind: 'mimic',
      label: 'Cold or a chill',
      where: ['wi', 'sp', 'ha', 'st'],
      looks: 'Leaves look water-soaked and soft, then turn black. The fruit bronzes on the surface, goes brown inside with brown seeds, then softens and rots, which can show up to a week after the cold.',
      why: 'Aubergine is more sensitive to cold than tomato or pepper, and outdoors in a cool summer it may crop little or not at all.',
      fix: 'Harden plants off, plant out only once the weather is warm, and grow them under cover where summers are cool.',
      sources: [E_STUNTED, E_WILTED, RHS_AUBERGINES, NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'Too many fruit on a large-fruited plant',
      where: ['ha'],
      looks: 'Many fruit that stay small, and late fruit that never ripen.',
      fix: 'On large-fruited varieties, take off further flowers once five or six fruit have set, and pick fruit while glossy so new ones keep setting.',
      sources: [RHS_AUBERGINES],
    },
    {
      kind: 'mimic',
      label: 'Sunscald',
      where: ['ha', 'sp'],
      looks: 'The side of the fruit facing the sun turns pale tan or white and may dry and wrinkle.',
      fix: 'Keep the plants leafy, with steady water and healthy foliage, so the leaves shade the fruit.',
      sources: [E_FRUIT_SPOTS, NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'Verticillium wilt',
      where: ['wi', 'yo', 'ed'],
      looks: 'The leaf edges and tips turn yellow, then whole leaves yellow and wilt, often on one side. The lower leaves go first, and a cut down the stem near the soil shows tan veins.',
      why: 'A soil fungus. Black plastic mulch lowers the damage on aubergine.',
      fix: 'There is no cure. Lift the plant with its roots, mulch the bed, and grow aubergines and their family on other ground for several years.',
      sources: [E_WILTED, NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'Phomopsis blight',
      where: ['sp', 'ha', 'ro'],
      looks: 'Round grey to brown leaf spots with a pale centre, dark sunken patches on the stem just above the soil, and pale, sunken oval spots on the fruit with rings of tiny black dots.',
      why: 'A fungus of warm, wet weather.',
      fix: 'Grow from clean seed, clear old plants at the end of the season, water the soil and not the plant, and rotate.',
      sources: [E_COLLAPSED],
    },
    {
      kind: 'mimic',
      label: 'White mould',
      where: ['ro', 'wi', 'sp'],
      looks: 'A dark, firm, water-soaked patch on the stem. The girdled stem dies and turns bone white, with black bodies like mouse droppings inside, and white cotton on it when the air is humid.',
      why: 'A soil fungus of cool, humid weather.',
      fix: 'Space the plants for air, clear infected plants before the black bodies drop into the soil, and rotate.',
      sources: [E_STEM],
    },
    {
      kind: 'mimic',
      label: 'Phytophthora blight',
      where: ['ro', 'wi', 'ha'],
      looks: 'Dark sunken patches on the stem with everything beyond wilting, soft dark water-soaked spots on the fruit, which shrivel under white mould, and a whole plant that wilts and browns.',
      why: 'A water mould of wet soil that spreads fast in cool wet weather.',
      fix: 'Grow on a raised bed in well-drained soil and rotate the tomato family and cucurbits off that ground for years.',
      sources: [E_STEM, NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'Anthracnose on ripe fruit',
      where: ['ha', 'sp'],
      looks: 'Sunken round spots on ripe and overripe fruit with rings of small black dots, turning all black, and salmon pink spores when damp. Leaves and stems stay clean.',
      fix: 'Pick fruit while glossy and firm, before it overripens, water the soil and not the fruit, and rotate.',
      sources: [E_FRUIT_SPOTS, NEV_EGGPLANT],
    },
    {
      kind: 'mimic',
      label: 'Viruses',
      where: ['yn', 'cu', 'st', 'ha'],
      looks: 'Leaves mottled with yellow and light green, misshapen, sometimes long and thin like a shoestring or curled, and fruit with yellow blotches or brown rings.',
      fix: 'There is no cure, so pull and bin the plant. Keep weeds down and plant flowers for the insects that eat aphids.',
      sources: [E_STUNTED],
    },
    {
      kind: 'mimic',
      label: 'Red spider mite',
      where: ['yo', 'sp', 'cu'],
      looks: 'A russet, mottled look to the leaves from feeding underneath, sometimes distorted leaves, fine webbing under the leaves and early leaf fall. Worst in hot, dry weather and under glass.',
      fix: 'Mist greenhouse plants with tepid water, ideally twice a day, or damp the floor down in the morning, and keep the plants well watered.',
      sources: [E_DISCOLOURED, RHS_AUBERGINES],
    },
    {
      kind: 'mimic',
      label: 'Aphids, whitefly or leafhoppers',
      where: ['cu', 'yo', 'st'],
      looks: 'Curled, stunted, wilting leaves under colonies of aphids, sticky leaves with black mould on them from whitefly, or wrinkled leaves with a yellow tinge from leafhoppers.',
      fix: 'Check under the leaves often and rub out the first colonies, open the greenhouse for air, and plant flowers for the ladybirds, lacewings and hoverflies that eat them.',
      sources: [E_STUNTED, E_DISCOLOURED, RHS_AUBERGINES],
    },
    {
      kind: 'mimic',
      label: 'Beetles and cutworms',
      where: ['ho'],
      looks: 'Shot holes in the leaves from tiny black flea beetles, leaves stripped by striped Colorado potato beetles and their reddish grubs, or young plants cut off at the soil by cutworms.',
      fix: 'Cover young plants with fine netting, hand-pick beetles, grubs and egg clusters, put a card collar round each transplant, and keep the plants growing strongly. Heavy flea beetle feeding can make a plant wilt.',
      sources: [E_HOLES, E_CUT],
    },
    {
      kind: 'mimic',
      label: 'Damping off',
      where: ['ro', 'wi'],
      looks: 'The seedling stem darkens at the soil and the seedling falls over, wilts and rots, sometimes under a cobweb of mould.',
      fix: 'Sow in fresh seed mix at 21°C (70°F) or more, water to keep the mix moist but not wet, and give the seedlings good light.',
      sources: [E_COLLAPSED, RHS_AUBERGINES],
    },
  ],
};

export const SOLANUM_SIGN_CONFIRM: Record<string, CropConfirm> = {
  pepper: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, and lime only as it says. Where a leaf shortage is suspected in a growing plant, a leaf test from a lab tells which nutrient it is, since several of them look alike. Blossom end rot, sunscald, heat and viruses show in no nutrient test.',
    sources: [NEV_PEPPER, yaraPepper('magnesium')],
  },
  aubergine: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, and lime only as it says. Blossom end rot comes from watering far more often than from a soil short of calcium, so a test that shows plenty of calcium points to the watering.',
    sources: [NEV_EGGPLANT, RHS_BLOSSOM_END_ROT],
  },
};
