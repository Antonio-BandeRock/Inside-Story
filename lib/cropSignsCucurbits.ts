// What is wrong with a plant, crop by crop: courgette and squash (I26,
// from batch 3, 2026-09-29). Gathered by lib/cropSigns.ts, which explains
// the rules every sign here follows: each cites a page about that crop, a
// sign no source for the crop describes is left out rather than borrowed,
// and the fixes are put right from the soil and name no bag or bottle.
//
// Cucumber lives in lib/cropSignsVegetables.ts and melon with the fruit.
// The squash guide covers pumpkins too, since lib/cropGuides.ts reads
// "pumpkin" as a squash. Courgette carries no nutrient shortage signs:
// the fertility pages found describe them on pumpkin and winter squash,
// and none describes them on courgette, so they are not borrowed.
//
// Pure: no React and no database.

import type { CropConfirm, CropSign } from './cropSignTypes';
import type { GuideSource } from './plantNutrients';

const RHS_CUCURBIT_PROBLEMS: GuideSource = {
  label: 'RHS: Courgette, marrow, pumpkin and squash problems',
  url: 'https://www.rhs.org.uk/problems/courgette-marrow-pumpkin-and-squash',
};
const RHS_COURGETTES: GuideSource = {
  label: 'RHS: How to grow courgettes',
  url: 'https://www.rhs.org.uk/vegetables/courgettes/grow-your-own',
};
const RHS_SQUASH: GuideSource = {
  label: 'RHS: How to grow squashes',
  url: 'https://www.rhs.org.uk/vegetables/squash/grow-your-own',
};
const RHS_PUMPKINS: GuideSource = {
  label: 'RHS: How to grow pumpkins',
  url: 'https://www.rhs.org.uk/vegetables/pumpkins/grow-your-own',
};
const NEV_SQUASH: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Pumpkin, squash and gourds',
  url: 'https://nevegetable.org/crops/pumpkin-squash-and-gourds',
};
const CORNELL_SQUASH_FERTILITY: GuideSource = {
  label: 'Cornell University (Reiners): Pumpkin and squash fertility management (archived copy)',
  url: 'https://web.archive.org/web/20260311073537/http://www.hort.cornell.edu/expo/proceedings/2014/Vine%20crops/Pumpkin%2C%20Squash%20Feryility%20Reiners.pdf',
};
const UGA_VEG_DEFICIENCY: GuideSource = {
  label: 'University of Georgia: Nutritional deficiencies in vegetables',
  url: 'https://fieldreport.caes.uga.edu/publications/B1569/nutritional-deficiencies-in-vegetables/',
};
const UF_SUMMER_SQUASH: GuideSource = {
  label: 'University of Florida: Summer squash production',
  url: 'https://edis.ifas.ufl.edu/publication/tr012',
};

const umnSummer = (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: Summer squash and zucchini, ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/summersquash/${page}.html`,
});
const umnWinter = (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: Winter squash and pumpkins, ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/wintersquash/${page}.html`,
});
const usu = (page: string, title: string): GuideSource => ({
  label: `Utah State University: ${title}`,
  url: `https://extension.usu.edu/vegetableguide/cucurbits/${page}`,
});
const USU_WATER = usu('irrigation', 'Watering cucurbits');
const USU_SOIL = usu('soil', 'Soil and fertility for cucurbits');
const USU_PM = usu('powdery-mildew', 'Powdery mildew on cucurbits');
const USU_CMV = usu('cucumber-mosaic-virus', 'Cucumber mosaic virus');
const USU_WMV = usu('watermelon-mosaic-virus', 'Watermelon mosaic virus');
const USU_SQUASH_BUG = usu('squash-bug', 'Squash bug');
const USU_BEETLES = usu('cucumber-beetles', 'Cucumber beetles');
const USU_MITES = usu('spider-mites', 'Spider mites on cucurbits');
const USU_APHIDS = usu('aphids', 'Aphids on cucurbits');
const USU_PYTHIUM = usu('pythium', 'Pythium root rot of cucurbits');
const USU_VERTICILLIUM = usu('verticilium', 'Verticillium wilt of cucurbits');

// Both crops are Cucurbita and read alike on the Minnesota pages, so each
// sign below is built once and handed the pages for the crop it goes on.
type Pages = {
  seedling: GuideSource;
  collapsed: GuideSource;
  blossom: GuideSource;
  spots: GuideSource;
  discoloured: GuideSource;
  distorted: GuideSource;
  wilting: GuideSource;
  rotten: GuideSource;
  holes: GuideSource;
  deformed: GuideSource;
};
const SUMMER: Pages = {
  seedling: umnSummer('seedlingemergence', 'poor or no emergence'),
  collapsed: umnSummer('seedlingcollapsed', 'collapsed seedling'),
  blossom: umnSummer('blossomfuzzy', 'fuzzy growth on the blossom'),
  spots: umnSummer('leavesspots', 'spots on leaves'),
  discoloured: umnSummer('leavesdiscolored', 'discoloured leaves'),
  distorted: umnSummer('leavesdistorted', 'distorted, curled leaves'),
  wilting: umnSummer('leaveswilting', 'wilting leaves'),
  rotten: umnSummer('fruitrotten', 'rotten fruit'),
  holes: umnSummer('fruitholes', 'holes in fruit'),
  deformed: umnSummer('fruitdeformed', 'misshapen fruit'),
};
const WINTER: Pages = {
  seedling: umnWinter('seedlingemergence', 'poor or no emergence'),
  collapsed: umnWinter('seedlingcollapsed', 'collapsed seedling'),
  blossom: umnWinter('blossomfuzzy', 'fuzzy growth on the blossom'),
  spots: umnWinter('leavesspots', 'spots on leaves'),
  discoloured: umnWinter('leavesdiscolored', 'discoloured leaves'),
  distorted: umnWinter('leavesdistorted', 'distorted, curled leaves'),
  wilting: umnWinter('leaveswilting', 'wilting leaves'),
  rotten: umnWinter('fruitrotten', 'rotten fruit'),
  holes: umnWinter('fruitholes', 'holes in fruit'),
  deformed: umnWinter('fruitdeformed', 'misshapen fruit'),
};

const tooMuchNitrogen = (sources: GuideSource[]): CropSign => ({
  kind: 'excess',
  nutrient: 'N',
  label: 'Too much nitrogen: all leaf and few fruit',
  where: ['fl', 'ha', 'ot'],
  looks: 'A huge, dark green plant with plenty of leaf but few female flowers (the ones with a small swelling of fruit behind the petals) and few fruit.',
  why: 'Rich soil pushes leaf at the cost of flowers, and a dense canopy shades the female flowers so the bees find them less easily.',
  fix: 'Feed with compost dug in before planting and no more. After beans, peas or a clover green manure, or where manure went in, little else is needed. Give the plants room so the flowers are in the light.',
  sources,
});
const coldStart = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Cold weather or cold soil',
  where: ['ed', 'wi', 'yo', 'st'],
  looks: 'After weather below about 10°C (50°F) and wet, or soil below about 17°C (62°F), the leaf edges turn olive green then brown, and in a bad case whole leaves, young shoots or the plant wilt and discolour.',
  why: 'Squash is tender. Cold does this whatever the soil holds.',
  fix: 'Plant out only after the last frost, once the soil has warmed, harden plants off first, and cover them with fleece on cold nights in early summer.',
  sources,
});
const dampingOff = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Damping off',
  where: ['ro', 'wi'],
  looks: 'Seed fails to come up, or seedlings discolour, look water soaked and fall over at the soil line, sometimes with a cobweb of mould on the stem or the mix.',
  why: 'Soil moulds that thrive in cold, wet soil and mix.',
  fix: 'Sow into warm soil or indoors in fresh seed mix, water from below, and let the surface dry between waterings.',
  sources: [p.seedling, p.collapsed],
});
const powderyMildew = (extra: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Powdery mildew',
  where: ['sp', 'yo'],
  looks: 'Pale yellow spots on the oldest leaves first, then a white to grey powdery felt that rubs off, in spots or covering the leaf. Bad cases wither the leaves and leave the fruit sunscalded.',
  why: 'Dry roots make it worse, and it comes most later in the season.',
  fix: 'Dig compost in to hold moisture, mulch, and water the soil and not the leaves in dry spells. Space the plants for air, pick off the first leaves it shows on, and grow a variety with resistance.',
  sources: [...extra, RHS_CUCURBIT_PROBLEMS, USU_PM],
});
const downyMildew = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Downy mildew',
  where: ['sp', 'yo'],
  looks: 'Pale green to yellow patches on the top of the leaf held in by the veins, so they look angular, with a purplish grey fuzz underneath in humid weather. In wet weather the leaves brown quickly, as if frosted.',
  why: 'A water mould spread on the wind that needs a wet leaf to get in.',
  fix: 'Water the soil and not the leaves, water in the morning, space the plants for air, and pull badly hit plants. Grow later sowings where the air moves.',
  sources,
});
const mosaic = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Mosaic viruses',
  where: ['yn', 'cu', 'ha', 'st'],
  looks: 'Blotchy, wavy patterns of yellow and green on the leaves, which may be wrinkled, curled, or narrow and fern-like. Fruit is blotched, ringed or knobbly but not rotten.',
  why: 'Cucumber, watermelon, squash and zucchini yellow mosaic viruses, most carried by aphids from weeds and other plants. The patchy pattern is what tells it from a shortage.',
  fix: 'There is no cure, so pull and bin the plant. Keep weeds around the bed down, grow a resistant variety, and plant flowers nearby for the hoverflies and ladybirds that eat aphids.',
  sources,
});
const phytophthora = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Phytophthora blight',
  where: ['ro', 'wi', 'sp', 'ha'],
  looks: 'Water-soaked brown patches on the stems and leaf stalks, large brown spots on the leaves, and fruit with soft, water-soaked patches under a white mould. The whole plant can collapse once the crown rots.',
  why: 'A water mould that lives in the soil and spreads in standing water and splashing rain.',
  fix: 'Grow on a raised bed or a low mound so water drains away from the stem, never where water lies, and rotate cucurbits, peppers and tomatoes off that ground for years.',
  sources,
});
const blossomRot = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Wet rot on the flowers (Choanephora)',
  where: ['ha', 'fl'],
  looks: 'The flowers grow a white then purplish black fuzz, and the flower end of the young fruit goes soft and rotten under a fuzz like black-headed pins.',
  why: 'A fungus of warm, wet weather that spreads from the flowers to the fruit, carried by wind, bees and beetles.',
  fix: 'Space plants for air, water the soil and not the plant, and pick off rotting fruit and old flowers. It passes when the weather dries.',
  sources,
});
const poorPollination = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Poor pollination',
  where: ['ha', 'fl'],
  looks: 'Young fruit swells at the stalk end, then the flower end shrivels and rots, or falls off small. Early on, only male flowers may come. It looks like blossom end rot but is a flower that was never pollinated.',
  why: 'Cold, dull weather keeps the bees away, young plants make only male flowers at first, and under cover the insects cannot reach the flowers.',
  fix: 'Wait for warmer weather, grow flowers nearby for bees, open greenhouse doors on warm days, or pollinate by hand: pick a male flower, strip the petals, and press it into the centre of each female flower.',
  sources,
});
const footRot = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Foot and root rot, or verticillium wilt',
  where: ['ro', 'wi'],
  looks: 'The base of the stem darkens and rots and the roots may rot too, or the top of the plant wilts and dies back.',
  why: 'Soil fungi, helped by water sitting around the neck of the plant.',
  fix: 'Plant on a slight mound on heavy soil, water into a pot sunk beside the plant rather than at the stem, keep mulch away from the stem, and lift a collapsed plant with its roots and the soil around them.',
  sources: [RHS_CUCURBIT_PROBLEMS, USU_PYTHIUM, USU_VERTICILLIUM, p.wilting],
});
const vineBorer = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Squash vine borer',
  where: ['wi', 'yo', 'ho'],
  looks: 'A plant wilts and yellows suddenly, and there are holes near the base of the stem packed with green to orange sawdust-like droppings.',
  why: 'The grub of a moth that looks like a wasp, eating inside the stem. It is found in North America.',
  fix: 'Cover young plants with fine netting until they flower, heap soil over the stem joints so the vine roots again beyond the damage, and clear old vines at the end of the season.',
  sources: [p.wilting, p.discoloured],
});
const squashBug = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Squash bugs',
  where: ['wi', 'yo', 'sp', 'ho'],
  looks: 'Speckled leaves that yellow, then brown, and wilting where the feeding is heavy, with flat grey-brown bugs and clusters of eggs under the leaves.',
  why: 'Sap-sucking bugs that like squash and pumpkin most of all the cucurbits. It looks like a shortage from a distance.',
  fix: 'Check under the leaves every few days and crush the egg clusters, lay a board by the plants and clear what shelters under it each morning, and clear old vines and rubbish in autumn. Butternut and royal acorn squash resist them, and yellow crookneck and Hubbard are hit hardest.',
  sources: [USU_SQUASH_BUG, p.wilting],
});
const beetles = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Cucumber beetles',
  where: ['ho', 'ha', 'fl'],
  looks: 'Holes eaten in the leaves and flowers and scars on the fruit, from small yellow-green beetles, striped or spotted with black.',
  why: 'Found in North America from early summer. On squash the wilt they carry is less common than on cucumber.',
  fix: 'Cover young plants with fine netting until they flower, then uncover for the bees. Keep the bed clear of old vines.',
  sources: [USU_BEETLES, p.holes],
});
const slugs = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Slugs and snails',
  where: ['ho', 'ha'],
  looks: 'Young plants, flowers and small fruit eaten, often overnight in damp weather, with silvery slime trails.',
  why: 'Grown plants tolerate it. It is the young ones that need protecting.',
  fix: 'Raise plants indoors until they are big and sturdy before planting out, and go out on damp evenings to pick slugs off. Frogs, toads, birds and ground beetles eat them.',
  sources,
});
const miteOrAphid = (p: Pages): CropSign => ({
  kind: 'mimic',
  label: 'Spider mites or aphids',
  where: ['yo', 'sp', 'cu'],
  looks: 'Pale, finely speckled leaves with webbing underneath from mites in hot, dry weather, or yellowing leaves and soft tips crowded with small soft-bodied insects from aphids.',
  why: 'Both suck sap, and aphids carry the mosaic viruses.',
  fix: 'Keep the plants well watered, since mites thrive on dry plants, hose them off the undersides, and plant flowers for the ladybirds, lacewings and hoverflies that eat them.',
  sources: [USU_MITES, USU_APHIDS, p.discoloured],
});
const weedkillerManure: CropSign = {
  kind: 'mimic',
  label: 'Weedkiller in manure or on the wind',
  where: ['cu', 'yo', 'st'],
  looks: 'Stunted, twisted and distorted growth with yellowing leaves, often right after manure or compost was dug in.',
  why: 'Hormone weedkiller residues survive in manure from animals fed on treated grass, or drift from nearby spraying.',
  fix: 'Ask where manure came from before using it, test a batch by sowing a few beans in it, and make compost at home.',
  sources: [RHS_CUCURBIT_PROBLEMS],
};

export const CUCURBIT_SIGNS: Record<string, CropSign[]> = {
  courgette: [
    tooMuchNitrogen([NEV_SQUASH, RHS_CUCURBIT_PROBLEMS]),
    {
      kind: 'water',
      label: 'Too little water',
      where: ['wi', 'fl', 'sp', 'ha'],
      looks: 'Wilting in the heat, flowers dropping without setting fruit, fewer female flowers, and more powdery mildew on the leaves.',
      why: 'Courgettes are thirsty, most of all in pots and once they are fruiting, and dry soil just before and during flowering cuts the female flowers.',
      fix: 'Keep the soil evenly moist, water into a pot sunk beside the plant so the water reaches the roots and not the stem, and lay a thick mulch of compost over the soil, clear of the stem.',
      sources: [RHS_COURGETTES, NEV_SQUASH, USU_WATER],
    },
    {
      kind: 'water',
      label: 'Water sitting at the stem',
      where: ['ro', 'wi'],
      looks: 'The base of the stem goes soft and rots, and the plant wilts even in moist soil.',
      fix: 'Water around the plant or into a sunk pot rather than onto the neck, keep mulch a hand width from the stem, and plant on a low mound on heavy soil.',
      sources: [RHS_COURGETTES, RHS_CUCURBIT_PROBLEMS],
    },
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'Plants grow slowly and yellow for no clear reason. Squash and courgettes want a pH of about 6.5 to 6.8.',
      fix: 'Test the pH, and lime only as the test says, in autumn if possible. Compost worked in every year steadies the soil either way.',
      sources: [NEV_SQUASH],
    },
    poorPollination([RHS_COURGETTES, RHS_CUCURBIT_PROBLEMS, NEV_SQUASH, SUMMER.deformed]),
    {
      kind: 'mimic',
      label: 'Heat and no male flowers',
      where: ['fl', 'ha'],
      looks: 'Female flowers open with no male flowers to pollinate them, most in late summer and autumn, and in a hot greenhouse.',
      why: 'Long hot spells, above about 32°C (90°F) by day and 21°C (70°F) at night for a week, cut the flowers the plant makes.',
      fix: 'Ventilate a greenhouse, keep outdoor plants watered and mulched in heat, and avoid planting out after midsummer.',
      sources: [RHS_CUCURBIT_PROBLEMS, NEV_SQUASH],
    },
    {
      kind: 'mimic',
      label: 'Fruit left to grow on',
      where: ['fl', 'ha'],
      looks: 'The plant stops setting new fruit, and young fruit drop off, while one or two grow into marrows.',
      why: 'The plant holds back new fruit to feed the ones it is already carrying.',
      fix: 'Pick courgettes small and often, every day or two at the height of summer.',
      sources: [RHS_CUCURBIT_PROBLEMS, RHS_COURGETTES],
    },
    {
      kind: 'mimic',
      label: 'Bitter fruit',
      where: ['ot'],
      looks: 'A courgette tastes sharply bitter. Do not eat it: it causes stomach upsets.',
      why: 'Too much of the plant\'s defence chemicals, cucurbitacins, mostly from a mutation, and more likely in plants grown from saved seed that crossed with an ornamental gourd.',
      fix: 'Pull out the plant and do not save its seed. Buy fresh seed rather than saving from courgettes grown near gourds.',
      sources: [RHS_CUCURBIT_PROBLEMS],
    },
    {
      kind: 'mimic',
      label: 'Silver patches that belong there',
      where: ['sp', 'ot'],
      looks: 'Silvery grey patches along the veins of the leaves on a healthy plant, taken for mildew. Many courgette varieties have silver-mottled leaves.',
      why: 'It is the variety. Mildew is powder that rubs off and spreads, and the silver marking does neither.',
      fix: 'Nothing to put right. Rub a patch with a finger: if nothing comes off and it follows the veins, it is the leaf.',
      sources: [RHS_COURGETTES],
    },
    coldStart([SUMMER.discoloured, RHS_COURGETTES, UF_SUMMER_SQUASH]),
    dampingOff(SUMMER),
    powderyMildew([RHS_COURGETTES, SUMMER.spots, UF_SUMMER_SQUASH]),
    downyMildew([SUMMER.spots, UF_SUMMER_SQUASH]),
    mosaic([RHS_CUCURBIT_PROBLEMS, SUMMER.distorted, UF_SUMMER_SQUASH, USU_CMV, USU_WMV]),
    phytophthora([SUMMER.collapsed, UF_SUMMER_SQUASH]),
    blossomRot([SUMMER.blossom, UF_SUMMER_SQUASH]),
    footRot(SUMMER),
    {
      kind: 'mimic',
      label: 'Root knot nematodes',
      where: ['ro', 'yo', 'st', 'wi'],
      looks: 'Yellowing, stunted plants that wilt in the day, with knobbly swellings along the roots when one is dug up.',
      why: 'Tiny soil worms, common on sandy soil in warm regions. The yellowing is taken for a shortage.',
      fix: 'Move cucurbits to fresh ground, build the soil up with compost, which feeds the soil life that keeps them down.',
      sources: [UF_SUMMER_SQUASH],
    },
    vineBorer(SUMMER),
    squashBug(SUMMER),
    beetles(SUMMER),
    miteOrAphid(SUMMER),
    slugs([RHS_COURGETTES, RHS_CUCURBIT_PROBLEMS, SUMMER.holes]),
    weedkillerManure,
  ],
  squash: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'st'],
      looks: 'Yellow plants with stunted, weak growth.',
      why: 'Nitrogen held in organic matter is set free by soil life, which slows in cold, dry, waterlogged or compacted soil, so a shortage can show in a soil that holds plenty.',
      fix: 'Dig in compost or well-rotted manure before planting, and grow squash after beans, peas or a clover green manure. Wait for the soil to warm, and keep it loose and moist.',
      sources: [CORNELL_SQUASH_FERTILITY, NEV_SQUASH],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['pu', 'st'],
      looks: 'A purplish colour on the undersides of the leaves, and slow growth.',
      why: 'Phosphorus locks up in acid and in alkaline soil and is freed slowly, more slowly in cold soil, so a soil test can show plenty while the plant goes short.',
      fix: 'Bring the pH to about 6.5, plant out only once the soil is warm, and dig compost in where the roots will run.',
      sources: [CORNELL_SQUASH_FERTILITY],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['ed', 'ha'],
      looks: 'Usually no clear sign, only a smaller crop. In a bad case the leaf edges scorch brown.',
      why: 'Potassium washes out of sandy and gravelly soil and is held tight in clay.',
      fix: 'Keep adding compost, mulch with comfrey leaves or give a comfrey liquid feed made at home once the fruit swells, and test the soil to know for sure.',
      sources: [CORNELL_SQUASH_FERTILITY],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'pu'],
      looks: 'Yellow patches between the leaf veins, sometimes reddish, turning brown.',
      why: 'Most common on acid, heavily leached soil and on soil high in potassium or calcium.',
      fix: 'Go easy on potassium-rich feeds and add compost. Test the pH, and if the soil is acid, lime with dolomitic lime, which carries magnesium.',
      sources: [CORNELL_SQUASH_FERTILITY],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Calcium not reaching the plant',
      where: ['yn', 'cu', 'ed', 'ha'],
      looks: 'The young leaves are stunted, distorted and spotted, and die at the edges. The fruit can get blossom end rot: a black, leathery, sunken patch at the flower end.',
      why: 'Dry soil stops calcium reaching the plant even where the soil holds plenty, and a lot of potassium, magnesium or sodium crowds it out.',
      fix: 'Keep the soil evenly moist with a thick mulch and steady watering, and go easy on rich feeds. Lime only if a pH test says so.',
      sources: [CORNELL_SQUASH_FERTILITY, UGA_VEG_DEFICIENCY],
    },
    tooMuchNitrogen([CORNELL_SQUASH_FERTILITY, NEV_SQUASH, RHS_CUCURBIT_PROBLEMS]),
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo', 'sp'],
      looks: 'Slow, yellowish plants that answer no feeding, since every nutrient is hardest to reach when the pH is off. Below about pH 6, manganese builds up and shows as water-soaked patches on the leaves.',
      why: 'Squash and pumpkins grow best near pH 6.5, and many people count the pH as the most important part of a soil test.',
      fix: 'Test the pH and lime to the test in autumn, a season before planting, since it takes months to work. Compost every year steadies the soil.',
      sources: [CORNELL_SQUASH_FERTILITY, NEV_SQUASH, UGA_VEG_DEFICIENCY],
    },
    {
      kind: 'water',
      label: 'Too little water',
      where: ['wi', 'fl', 'sp', 'ha'],
      looks: 'Wilting in the heat, poor fruiting, fewer female flowers, and more powdery mildew.',
      fix: 'Water deeply in dry spells, into a pot sunk beside the plant so it reaches the roots, and mulch with compost, keeping it clear of the stem.',
      sources: [RHS_SQUASH, RHS_PUMPKINS, NEV_SQUASH, USU_WATER],
    },
    {
      kind: 'water',
      label: 'Fruit rotting on damp soil',
      where: ['ha', 'ro'],
      looks: 'A winter squash or pumpkin rots on the side lying on the ground, or a soft patch rots in store where the stalk was cut short.',
      fix: 'Set each growing fruit on a tile, brick or board, and cut it with at least 10 cm (4 in) of stalk. Cure in the sun before storing.',
      sources: [RHS_SQUASH, RHS_PUMPKINS],
    },
    poorPollination([RHS_CUCURBIT_PROBLEMS, NEV_SQUASH, WINTER.deformed]),
    {
      kind: 'mimic',
      label: 'Heat and dry weather at flowering',
      where: ['fl', 'ha'],
      looks: 'Few female flowers and poor fruit set after a long hot spell.',
      why: 'More than a week above about 32°C (90°F) by day and 21°C (70°F) at night, or dry soil before and during bloom, cuts the female flowers.',
      fix: 'Keep the soil moist through flowering with a mulch and deep watering, and sow so the plants flower before the hottest weeks where summers are fierce.',
      sources: [NEV_SQUASH],
    },
    coldStart([WINTER.discoloured, RHS_SQUASH, RHS_PUMPKINS]),
    dampingOff(WINTER),
    powderyMildew([RHS_SQUASH, RHS_PUMPKINS, WINTER.spots]),
    downyMildew([WINTER.spots]),
    mosaic([RHS_CUCURBIT_PROBLEMS, WINTER.distorted, USU_CMV, USU_WMV]),
    phytophthora([WINTER.collapsed]),
    {
      kind: 'mimic',
      label: 'Gummy stem blight and black rot',
      where: ['sp', 'ed', 'ha'],
      looks: 'Brown leaf edges or round tan spots with yellow halos that dry and crack, tan patches on the stems with black dots and a dark gummy ooze, and fruit that rots black, often starting where it lies on the soil.',
      why: 'A fungus that carries over on old vines and seed.',
      fix: 'Keep the fruit off the soil, water the soil and not the leaves, clear and compost old vines hot or bin them, and rotate cucurbits off the bed for two years.',
      sources: [WINTER.spots, WINTER.rotten, USU_SOIL],
    },
    {
      kind: 'mimic',
      label: 'White mould',
      where: ['ha', 'ro'],
      looks: 'Fruit rots and goes watery under a white cottony mould with small hard black bodies like raisins in it. Most on pumpkin and some winter squash.',
      why: 'A soil fungus of cool, wet weather that the black bodies carry over for years.',
      fix: 'Space plants for air, keep the fruit off the soil, pick out rotting fruit before the black bodies fall.',
      sources: [WINTER.rotten],
    },
    blossomRot([WINTER.blossom]),
    footRot(WINTER),
    vineBorer(WINTER),
    squashBug(WINTER),
    beetles(WINTER),
    miteOrAphid(WINTER),
    slugs([RHS_SQUASH, RHS_PUMPKINS, RHS_CUCURBIT_PROBLEMS, WINTER.holes]),
    weedkillerManure,
  ],
};

export const CUCURBIT_SIGN_CONFIRM: Record<string, CropConfirm> = {
  courgette: {
    text: 'Confirm with a soil test for pH and the main nutrients before feeding anything. No source describes a courgette leaf test in a home garden, so where a shortage is suspected, a test of the soil it grows in is the place to start. Pollination, heat, cold, mildew, viruses and pests show in no nutrient test.',
    sources: [NEV_SQUASH, RHS_CUCURBIT_PROBLEMS],
  },
  squash: {
    text: 'Confirm with a soil test for pH and the main nutrients at least every three years, and a leaf test from a lab if a shortage is suspected in a growing plant. Potassium shortage shows little on squash, so only a test finds it.',
    sources: [CORNELL_SQUASH_FERTILITY, NEV_SQUASH],
  },
};
