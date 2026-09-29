// What is wrong with a plant, crop by crop: the onion family (I26, batch 3,
// 2026-09-29). Gathered by lib/cropSigns.ts, which explains the rules
// every sign here follows: each cites a page about that crop, a sign no
// source for the crop describes is left out rather than borrowed, and the
// fixes are put right from the soil and name no bag or bottle.
//
// The shortage signs are onion's alone: Yara writes them for onions, and
// no source found describes them on garlic, leeks or shallots, so those
// three carry the pests, diseases, watering and weather their own pages
// name. Yara is a fertiliser company, so its pages are cited for what the
// shortage looks like on onions and nothing else. The New England guide's
// soil section covers onion, scallion and shallot together, and its leek
// page points back to it for soil.
//
// Pure: no React and no database.

import type { CropConfirm, CropSign } from './cropSignTypes';
import type { GuideSource } from './plantNutrients';

const yaraOnion = (nutrient: string): GuideSource => ({
  label: `Yara: ${nutrient[0].toUpperCase()}${nutrient.slice(1)} deficiency in onions`,
  url: `https://www.yara.us/crop-nutrition/onion/nutrient-deficiencies/${nutrient}-deficiency-onions/`,
});
const umnOnion = (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: What is wrong with my onion? ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/onion/${page}.html`,
});
const UMN_ONION_BULB = umnOnion('bulbdevelopment', 'Poor bulb development');
const UMN_ONION_THIN = umnOnion('leavesthin', 'Thin, pale leaves');
const UMN_ONION_FUZZY = umnOnion('bulbfuzzy', 'Fuzzy growth on the bulb');
const UMN_ONION_SOFT = umnOnion('bulbsoft', 'Soft bulb');
const UMN_ONION_DISTORTED = umnOnion('leavesdistorted', 'Distorted leaves');
const UMN_ONION_SPOTS = umnOnion('leavesspots', 'Spots on the leaves');
const UMN_ONION_WILT = umnOnion('leaveswilt', 'Wilting or yellow leaves');
const UMN_ONION_ROOTS = umnOnion('rootsdiscolored', 'Discoloured roots');
const UMN_ONION_HOLES = umnOnion('bulbholes', 'Holes in the bulb');
const UMN_ONION_GALLS = umnOnion('rootsgalls', 'Galls on the roots');
const NEV_ONION: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Onion, scallion and shallot',
  url: 'https://nevegetable.org/crops/onion-scallion-and-shallot',
};
const NEV_GARLIC: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Garlic',
  url: 'https://nevegetable.org/crops/garlic',
};
const NEV_LEEK: GuideSource = {
  label: 'UMass New England Vegetable Management Guide: Leek',
  url: 'https://nevegetable.org/crops/leek',
};
const umd = (page: string, title: string): GuideSource => ({
  label: `University of Maryland: ${title}`,
  url: `https://extension.umd.edu/resource/${page}`,
});
const UMD_ONIONS = umd('growing-onions-home-garden', 'Growing onions in a home garden');
const UMD_GARLIC = umd('growing-garlic-home-garden', 'Growing garlic in a home garden');
const UMD_LEEKS = umd('growing-leeks-home-garden', 'Growing leeks in a home garden');
const UMD_BOLTING = umd('flower-stalks-form-or-bolting-vegetables', 'Flower stalks form, or bolting, in vegetables');
const UMD_WHITE_ROT = umd('white-rot-alliums-home-garden', 'White rot of alliums in the home garden');
const UMD_BULB_MITE = umd('garlic-bulb-mites', 'Garlic bulb mites');
const UMD_LEAFMINER = umd('leafminers-vegetables', 'Leafminers on vegetables');
const rhs = (path: string, title: string): GuideSource => ({
  label: `RHS: ${title}`,
  url: `https://www.rhs.org.uk/${path}`,
});
const RHS_ONIONS = rhs('vegetables/onions/grow-your-own', 'How to grow onions');
const RHS_GARLIC = rhs('vegetables/garlic/grow-your-own', 'How to grow garlic');
const RHS_LEEKS = rhs('vegetables/leeks/grow-your-own', 'How to grow leeks');
const RHS_SHALLOTS = rhs('vegetables/shallots/grow-your-own', 'How to grow shallots');
const RHS_WHITE_ROT = rhs('disease/onion-white-rot', 'Onion white rot');
const RHS_LEEK_RUST = rhs('disease/leek-rust', 'Leek rust');
const RHS_NECK_ROT = rhs('disease/onion-neck-rot', 'Onion neck rot');
const RHS_DOWNY = rhs('disease/onion-downy-mildew', 'Onion downy mildew');
const RHS_LEAF_MINER = rhs('biodiversity/allium-leaf-miner', 'Allium leaf miner');
const RHS_LEEK_MOTH = rhs('biodiversity/leek-moth', 'Leek moth');
const RHS_ONION_FLY = rhs('biodiversity/onion-fly', 'Onion fly');

// Signs the four share, written once so they read the same. Each is cited
// to the pages that name it for every crop it is given to.
const whiteRot = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'White rot',
  where: ['wi', 'yo', 'ro', 'st'],
  looks: 'The leaves yellow, wilt and die back, often in patches, and in wet weather the plants sit loose in the soil instead. The base of the bulb is covered in white fluffy growth, then in tiny black specks like poppy seed.',
  why: 'A fungus whose black specks live in the soil for many years, carried on boots, tools and planting stock. It cannot be got out of a bed once it is there.',
  fix: 'Plant only clean, certified sets and cloves, never garlic from the shop, and never compost affected plants. Work in plenty of compost, and keep the whole onion family off that bed for at least four to five years, growing it somewhere else.',
  sources,
});
const leafMiner = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Allium leaf miner',
  where: ['sp', 'ho', 'ro', 'cu'],
  looks: 'A straight line of small white dots down a leaf, then twisted leaves, and maggots and brown pupae inside the stem and bulb, which often rot after.',
  why: 'A small fly that lays in spring (March to June) and again in autumn (September to November). The autumn generation does the most harm.',
  fix: 'Cover the crop with fine insect mesh from before the flies are about until they have gone, and move the onion family to a new bed each year so the pupae in the soil wake to nothing.',
  sources,
});
const leekMoth = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Leek moth',
  where: ['ho', 'sp', 'ro'],
  looks: 'White patches on the leaves, then tunnels down into the stem and bulb, which can rot. Young plants can be killed.',
  fix: 'Keep fine mesh over the crop for the whole season and rotate beds. Leave cover for ground beetles and rove beetles, which eat the pupae, and squash the white, net-like cocoons on the leaves.',
  sources,
});
const onionFly = (sources: GuideSource[]): CropSign => ({
  kind: 'mimic',
  label: 'Onion fly',
  where: ['yo', 'wi', 'ho', 'ro'],
  looks: 'The outer leaves yellow and wilt, seedlings die, and the bulb is eaten out from below. Worst in June and July.',
  why: 'Its maggots feed on the roots and base, unlike the leaf miner, which starts in the leaf.',
  fix: 'Grow under fine mesh, give the predators that eat the flies a home, and lift and remove badly hit plants before the maggots leave them. Sets come through the first generation better than seedlings.',
  sources,
});

export const ALLIUM_SIGNS: Record<string, CropSign[]> = {
  onion: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'yn', 'st', 'ha'],
      looks: 'The leaf tips yellow first, then the whole plant turns pale green to yellow, with thin necks and small bulbs.',
      fix: 'Onions are hungry early and should ripen lean. Work compost or well-rotted manure in before planting, or grow them after beans or a clover green manure, and topdress with compost while the leaves are growing. Stop feeding once the bulbs start to swell.',
      sources: [UMN_ONION_BULB, UMN_ONION_THIN],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['st'],
      looks: 'The young plants are slow to establish and grow, with poor, stunted roots.',
      why: 'It runs short in soil that is very acid or very alkaline, low in organic matter, or cold and wet in spring.',
      fix: 'Keep the pH near neutral and work compost in every year, which feeds the soil life that frees phosphorus for the roots. Warm soil helps too, so do not rush planting into cold, wet ground.',
      sources: [yaraOnion('phosphorus')],
    },
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo', 'ed'],
      looks: 'The older leaves yellow along their whole length, then the tips brown and die back, and growth slows.',
      why: 'Common on sandy or acid soil and on soil given a lot of potassium, which crowds magnesium out.',
      fix: 'Go easy on potassium-rich feeds, work compost in, and if a test shows the soil is acid, lime with dolomitic lime, which carries magnesium.',
      sources: [yaraOnion('magnesium')],
    },
    {
      kind: 'short',
      nutrient: 'Mn',
      label: 'Manganese shortage',
      where: ['yo', 'ed'],
      looks: 'The outer leaves show yellow stripes between the veins, and later the tips burn. Onions are very sensitive to it.',
      fix: 'Manganese is locked up in soil that is alkaline or has been limed too much. Test the pH before liming again, and work compost in, which keeps trace nutrients within reach of the roots.',
      sources: [yaraOnion('magnesium')],
    },
    {
      kind: 'short',
      nutrient: 'Zn',
      label: 'Zinc shortage',
      where: ['cu', 'yn', 'st'],
      looks: 'The plants are stunted, and the leaves twist and bend outwards. The younger leaves turn faintly yellow and striped. Young plants are the most sensitive.',
      why: 'Worst on alkaline or chalky soil, in cold, wet weather, and in soil very rich in phosphorus.',
      fix: 'Keep the pH near neutral, go easy on phosphorus-rich feeds such as bone meal, and work compost in. Plants often grow out of it once the soil warms.',
      sources: [yaraOnion('zinc')],
    },
    {
      kind: 'short',
      nutrient: 'S',
      label: 'Sulphur shortage',
      where: ['yn', 'st', 'ot'],
      looks: 'Fewer leaves, and the young leaves turn evenly yellow. Onions short of sulphur are milder, since sulphur carries their flavour.',
      why: 'It runs short on acid, sandy or waterlogged soil and on soil low in organic matter.',
      fix: 'Sulphur comes from organic matter, so work compost or animal manure in every year. The New England guide notes that a lot of sulphur makes onions hotter, so there is no need to add more than compost gives.',
      sources: [yaraOnion('sulfur'), NEV_ONION],
    },
    {
      kind: 'short',
      nutrient: 'Cu',
      label: 'Copper shortage',
      where: ['cu', 'ed', 'ha'],
      looks: 'The leaf tips turn white and twist like a corkscrew or bend at right angles. The bulb skins stay thin and pale.',
      why: 'Most likely on very organic, peaty, chalky or sandy soil, and where a lot of nitrogen is given.',
      fix: 'Compost and manure carry copper, so a bed fed with them rarely runs short. Go easy on rich nitrogen feeds, and add nothing for copper without a soil test.',
      sources: [yaraOnion('copper')],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Calcium shortage',
      where: ['ed', 'wi'],
      looks: 'The leaf tips, or short lengths of leaf, die back without turning yellow first, and the top of the leaf falls over.',
      why: 'Most likely on acid, sandy or peaty soil, and in a drought, since calcium moves with the water.',
      fix: 'Test the pH and lime if it is acid, keep the soil evenly moist with a mulch, and work compost in.',
      sources: [yaraOnion('calcium')],
    },
    {
      kind: 'short',
      nutrient: 'B',
      label: 'Boron shortage',
      where: ['cu', 'st'],
      looks: 'The plants stay deep green but turn brittle, stunted or misshapen.',
      why: 'Most likely on sandy, alkaline soil low in organic matter, and in a drought.',
      fix: 'Keep the soil evenly moist, stop liming, and work compost and manure in every year, since both carry boron. Add nothing for boron without a soil test: it is easy to give too much.',
      sources: [yaraOnion('boron')],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen late on',
      where: ['ha', 'ot'],
      looks: 'The onions stay green and leafy when they should be ripening, the necks stay thick, and the bulbs rot or sprout in store.',
      why: 'Nitrogen late in the season, from feed, manure or a dug-in green manure, delays ripening and cuts how well the bulbs keep.',
      fix: 'Feed with compost before planting and stop feeding by midsummer. Eat any thick-necked onions first rather than storing them.',
      sources: [NEV_ONION, RHS_NECK_ROT],
    },
    {
      kind: 'water',
      label: 'Too little water',
      where: ['ha', 'st'],
      looks: 'Small bulbs, with weeds often crowding the row.',
      why: 'Bulb size follows the water the plants get, and onions have shallow roots and compete poorly with weeds.',
      fix: 'Water in dry spells while the bulbs swell, then ease off as the leaves start to fall over. Mulch with compost or grass clippings to hold the water and keep weeds down, and do not draw soil up over the bulbs, which invites rot.',
      sources: [UMD_ONIONS],
    },
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'The plants struggle from the start and stay small, with no spots or pests to explain it.',
      why: 'The New England guide keeps onions at pH 6.5 to 6.8 and says they do not tolerate acid soil, above all while young.',
      fix: 'Test the pH, and lime in autumn if the test says so, well ahead of planting.',
      sources: [NEV_ONION],
    },
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'A thick flower stalk grows up from the centre, and the bulb will not store.',
      why: 'Onions flower in their second year. A cold spell early in their growth makes them think a winter has passed. Large sets bolt more than small ones, and sets more than seed.',
      fix: 'Plant heat-treated sets, choose small ones, and do not plant into cold soil. Sow seed where bolting keeps happening. Snap off a flower stalk as it shows and eat that onion first.',
      sources: [UMD_BOLTING, NEV_ONION, RHS_ONIONS],
    },
    whiteRot([UMD_WHITE_ROT, RHS_WHITE_ROT, UMN_ONION_FUZZY]),
    {
      kind: 'mimic',
      label: 'Fusarium basal rot',
      where: ['yo', 'wi', 'ro'],
      looks: 'The leaves yellow and brown from the tip down and wilt. The base of the bulb turns brown and watery, the roots rot, the plant pulls up easily, and there can be white fuzz on the flat base of the bulb.',
      fix: 'Keep the soil free-draining, avoid wounding the bulbs when weeding, remove affected plants, and move the onion family to a new bed for several years.',
      sources: [UMN_ONION_WILT, UMN_ONION_FUZZY],
    },
    {
      kind: 'mimic',
      label: 'Pink root',
      where: ['yo', 'ro', 'st'],
      looks: 'The leaves yellow with a reddish tinge from the tip down, and the roots turn dark pink to maroon and shrivel. The bulbs stay small.',
      why: 'A soil fungus, worst in poor soil and where onions have been grown often.',
      fix: 'Build the soil up with compost, and grow nothing of the onion family in that bed for at least four years.',
      sources: [UMN_ONION_ROOTS, UMN_ONION_WILT],
    },
    {
      kind: 'mimic',
      label: 'Downy mildew',
      where: ['yo', 'sp', 'ha'],
      looks: 'Pale green to yellow patches, then the leaves yellow and die from the tip down, with a white then purplish grey fuzz. The bulbs sprout early or shrivel in store.',
      why: 'A water mould of cool, wet seasons, worst in crowded rows and damp, sheltered spots.',
      fix: 'Space the plants for air, weed often, and pull affected plants. Leave no bulbs in the ground, plant only firm sets, and keep onions off that bed for five years.',
      sources: [RHS_DOWNY, UMN_ONION_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Botrytis leaf blight',
      where: ['sp'],
      looks: 'Small white spots with a light green or silvery halo, which sink and turn straw-coloured in the centre. It spreads fast in cool, wet weather.',
      fix: 'Space the plants for air, water the soil in the morning rather than the leaves, and clear old onion leaves off the bed.',
      sources: [UMN_ONION_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Purple blotch',
      where: ['sp', 'pu'],
      looks: 'Spots that look like targets, purple to brown with rings and a white rim, and a brown to black powder on them in wet weather. Older and damaged leaves suffer most.',
      fix: 'Space the plants for air, water at the base, keep thrips down so the leaves are not damaged, and rotate beds.',
      sources: [UMN_ONION_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Neck rot',
      where: ['ha', 'ro'],
      looks: 'Seen in store: the bulb rots from the neck down, turns soft and brown as if cooked, grows grey mould, and dries to a shrivelled husk. White onions are hit hardest.',
      fix: 'Rotate over three years, stop feeding nitrogen by midsummer, water in dry spells, and dry the bulbs fast and thoroughly after lifting. Do not store thick-necked bulbs, and keep the rest cool, dry and airy.',
      sources: [RHS_NECK_ROT],
    },
    {
      kind: 'mimic',
      label: 'Soft rot',
      where: ['ro', 'ha', 'wi'],
      looks: 'The leaves pale and wilt, and inside the bulb the scales turn grey and water-soaked with a foul smell.',
      why: 'Bacteria that follow wounds, most often from onion maggots, in warm, wet weather.',
      fix: 'Keep the pests that wound the bulbs off with mesh, keep the soil free-draining, and lift and dry the bulbs well.',
      sources: [UMN_ONION_SOFT],
    },
    {
      kind: 'mimic',
      label: 'A virus',
      where: ['cu', 'yn', 'st'],
      looks: 'Yellow streaks at the base of the young leaves, which crinkle, flatten and fall over. The plants stay small. Aster yellows also yellows the youngest leaves from the base, leaving them flat and streaked, in plants scattered through the row.',
      why: 'Onion yellow dwarf virus comes in on infected sets and is spread by aphids. Aster yellows is carried by leafhoppers. No feed or watering puts either right.',
      fix: 'Pull and remove affected plants, keep weeds down, since they hold the disease, and plant clean sets from a trusted source.',
      sources: [UMN_ONION_DISTORTED, UMN_ONION_BULB],
    },
    {
      kind: 'mimic',
      label: 'Thrips',
      where: ['sp', 'ho', 'ha'],
      looks: 'Whitish spots and streaks on the leaves, which turn silvery in a bad attack. The bulbs stay small or misshapen.',
      fix: 'Keep weeds down around the bed, water in dry spells, since thrips thrive in hot, dry weather, and leave room for the predatory insects that eat them.',
      sources: [UMN_ONION_DISTORTED, UMN_ONION_SPOTS],
    },
    leafMiner([RHS_LEAF_MINER, UMD_LEAFMINER, RHS_ONIONS]),
    onionFly([RHS_ONION_FLY, UMN_ONION_HOLES]),
    leekMoth([RHS_LEEK_MOTH, RHS_ONIONS]),
    {
      kind: 'mimic',
      label: 'Stem and bulb nematode',
      where: ['cu', 'st', 'ha', 'ro'],
      looks: 'The leaves twist and the plants stay small. The base of the bulb goes spongy and the bulb can crack.',
      why: 'Tiny worms that live inside the plant, brought in on sets and in soil.',
      fix: 'Plant clean sets, pull and remove affected plants, and grow no onion family crops in that bed for several years.',
      sources: [UMN_ONION_SOFT, UMN_ONION_DISTORTED],
    },
    {
      kind: 'mimic',
      label: 'Root knot nematodes',
      where: ['st', 'yo', 'ro'],
      looks: 'The plants stay small, and the leaves yellow and die early. Lifted and washed, the roots carry small round swellings.',
      fix: 'Move onions to a new bed, and build the soil with compost, which feeds the soil life that keeps these worms down.',
      sources: [UMN_ONION_GALLS, UMN_ONION_WILT],
    },
    {
      kind: 'mimic',
      label: 'Wireworms',
      where: ['ho', 'ha'],
      looks: 'Small round holes bored into the bulbs.',
      why: 'The larvae of click beetles, most common in the first years after grass or lawn is dug up for a bed.',
      fix: 'Dig the ground over a few times before planting where it was lately grass, and let birds work it.',
      sources: [UMN_ONION_HOLES],
    },
  ],
  shallot: [
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'The plants struggle from the start and the clusters stay small, with no spots or pests to explain it.',
      why: 'The New England guide keeps onions and shallots at pH 6.5 to 6.8 and says they do not tolerate acid soil, above all while young.',
      fix: 'Test the pH, and lime in autumn if the test says so, well ahead of planting.',
      sources: [NEV_ONION],
    },
    {
      kind: 'water',
      label: 'Poor, dry soil',
      where: ['st', 'ha'],
      looks: 'Small clusters of small bulbs, slow to fill out.',
      why: 'Shallots have a limited root system, so they depend on the soil around them being rich and holding water.',
      fix: 'Fork well-rotted manure or compost in before planting, mulch, and water in dry spells while the bulbs swell.',
      sources: [RHS_SHALLOTS],
    },
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'A flower stalk grows up from the centre of the cluster.',
      why: 'Cold weather early in growth. Sets bolt more than seed-raised plants.',
      fix: 'Plant heat-treated sets or sow seed, choose varieties that resist bolting, and plant in late March or April rather than into cold soil. Snap off any flower stalk and use those bulbs first.',
      sources: [RHS_SHALLOTS, UMD_ONIONS],
    },
    {
      kind: 'mimic',
      label: 'Downy mildew',
      where: ['yo', 'sp', 'ha'],
      looks: 'The leaves yellow and die from the tip down, with a white then purplish fuzz. The bulbs sprout early or shrivel in store.',
      why: 'A water mould of cool, wet seasons, worst in crowded rows and damp, sheltered spots.',
      fix: 'Space the plants for air, weed often, pull affected plants, and plant only firm bulbs. Some varieties resist it. Keep the onion family off that bed for five years.',
      sources: [RHS_DOWNY, RHS_SHALLOTS],
    },
    {
      kind: 'mimic',
      label: 'Neck rot',
      where: ['ha', 'ro'],
      looks: 'Seen in store: the bulb rots from the neck down, turns soft and brown with grey mould, and dries to a shrivelled husk.',
      fix: 'Rotate over three years, go easy on nitrogen, water in dry spells, and dry the bulbs fast and thoroughly after lifting. Store only firm, thin-necked bulbs, somewhere cool, dry and airy.',
      sources: [RHS_NECK_ROT, RHS_SHALLOTS],
    },
    whiteRot([RHS_WHITE_ROT, RHS_SHALLOTS]),
    leafMiner([RHS_LEAF_MINER, RHS_SHALLOTS]),
    onionFly([RHS_ONION_FLY, RHS_SHALLOTS]),
    leekMoth([RHS_LEEK_MOTH, RHS_SHALLOTS]),
  ],
  garlic: [
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Nitrogen after the bulbs start',
      where: ['ha', 'ot'],
      looks: 'Big, leafy plants with small bulbs.',
      why: 'Nitrogen given once the bulbs have started to form goes into leaves at the expense of the bulb.',
      fix: 'Feed with compost at planting and again lightly in early spring, then stop.',
      sources: [NEV_GARLIC],
    },
    {
      kind: 'water',
      label: 'Wet, heavy or dry soil',
      where: ['st', 'ha', 'ro'],
      looks: 'Poor growth and small bulbs at lifting.',
      why: 'Garlic has shallow roots. Waterlogged soil, compacted or clay soil, and drought all cut the crop, and a wet finish invites disease.',
      fix: 'Grow in loose, well-drained soil rich in compost, or in a raised bed on clay. Water in dry spells in spring, then water less often as harvest nears.',
      sources: [NEV_GARLIC, UMD_GARLIC, RHS_GARLIC],
    },
    {
      kind: 'ph',
      label: 'Soil pH off',
      where: ['st'],
      looks: 'Slow, poor growth with no spots or pests to explain it.',
      why: 'The New England guide keeps garlic at pH 6.0 to 6.8.',
      fix: 'Test the pH before planting, and lime acid soil the autumn before if the test says so.',
      sources: [NEV_GARLIC],
    },
    {
      kind: 'mimic',
      label: 'Planted too late',
      where: ['ha', 'st'],
      looks: 'Small bulbs, or bulbs that never split into cloves.',
      why: 'The cloves need about two months of cold, near 0 to 10°C (32 to 50°F), to form a good bulb, so spring planting gives smaller bulbs. Small cloves give small bulbs too.',
      fix: 'Plant the largest cloves in autumn so they get their winter in the ground.',
      sources: [UMD_GARLIC, RHS_GARLIC],
    },
    {
      kind: 'mimic',
      label: 'Flower stalks',
      where: ['bo'],
      looks: 'Hardneck garlic sends up a curling stalk, the scape, in late spring. Softneck garlic rarely does, except in poor conditions.',
      why: 'The scape is natural on hardneck garlic, but left on, it takes energy from the bulb, which comes smaller and keeps less well.',
      fix: 'Snap off the scapes as they curl, and eat them. Where softneck garlic bolts, look to the soil and the watering.',
      sources: [RHS_GARLIC, UMD_GARLIC, UMD_BOLTING],
    },
    {
      kind: 'mimic',
      label: 'Waxy breakdown',
      where: ['ha'],
      looks: 'Cloves that turn yellow to amber, translucent and waxy.',
      why: 'Heat after harvest: bulbs left out in full sun above about 49°C (120°F).',
      fix: 'Dry garlic in the shade somewhere airy, never out in hot sun.',
      sources: [NEV_GARLIC],
    },
    {
      kind: 'mimic',
      label: 'Rust',
      where: ['sp', 'yo'],
      looks: 'Bright orange spots on both sides of the leaves. In a bad attack the leaves shrivel.',
      why: 'The same rust fungus as on leeks. It is worst on soil rich in nitrogen and short of potassium, and in crowded plants.',
      fix: 'Space the cloves for air, feed with compost rather than rich feeds, and clear old leaves off the bed. The bulbs are still good to eat.',
      sources: [RHS_LEEK_RUST, RHS_GARLIC],
    },
    {
      kind: 'mimic',
      label: 'Garlic bulb mites',
      where: ['yo', 'ed', 'st', 'ro'],
      looks: 'A general yellowing with brown leaf tips, gaps in the row and stunted plants that pull out easily. Rots often follow in the damaged bulbs.',
      why: 'Tiny mites brought in on saved or bought bulbs.',
      fix: 'Plant clean cloves from a trusted source, never shop garlic, and do not replant from a crop that had them. Rotate beds.',
      sources: [UMD_BULB_MITE, UMD_GARLIC],
    },
    whiteRot([UMD_WHITE_ROT, RHS_WHITE_ROT, RHS_GARLIC]),
    leafMiner([RHS_LEAF_MINER, UMD_LEAFMINER, UMD_GARLIC]),
    leekMoth([RHS_LEEK_MOTH, RHS_GARLIC]),
    onionFly([RHS_ONION_FLY, RHS_GARLIC]),
  ],
  leek: [
    {
      kind: 'water',
      label: 'Too little water',
      where: ['st', 'ha'],
      looks: 'The leeks grow slowly and stay thin, with short shanks.',
      why: 'Leeks have shallow roots, so drought cuts the crop.',
      fix: 'Water regularly in dry weather, mulch with compost, and keep the rows weeded, above all in the first two months.',
      sources: [UMD_LEEKS],
    },
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'The plants struggle from the start and stay small, with no spots or pests to explain it.',
      why: 'The New England guide feeds leeks the same way as onions, which it keeps at pH 6.5 to 6.8.',
      fix: 'Test the pH, and lime in autumn if the test says so, well ahead of planting.',
      sources: [NEV_LEEK, NEV_ONION],
    },
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'A hard flower stalk grows up through the centre, and the leek turns woody.',
      why: 'Leeks flower in their second year, so plants left into spring go to seed.',
      fix: 'Lift and use winter leeks by early spring, and choose varieties that resist bolting.',
      sources: [UMD_LEEKS, RHS_LEEKS],
    },
    {
      kind: 'mimic',
      label: 'Rust',
      where: ['sp', 'yo'],
      looks: 'Bright orange spots on both sides of the leaves. In a bad attack the leaves shrivel.',
      why: 'A fungus worst on soil rich in nitrogen and short of potassium, and in crowded plants.',
      fix: 'Space the plants for air, feed with compost rather than rich feeds, clear old leaves off the bed, and grow varieties that resist it where it has been before. The stems are still good to eat.',
      sources: [RHS_LEEK_RUST, RHS_LEEKS],
    },
    whiteRot([RHS_WHITE_ROT, RHS_LEEKS]),
    leafMiner([RHS_LEAF_MINER, UMD_LEAFMINER, UMD_LEEKS]),
    leekMoth([RHS_LEEK_MOTH, RHS_LEEKS]),
    onionFly([RHS_ONION_FLY, RHS_LEEKS]),
  ],
};

export const ALLIUM_SIGN_CONFIRM: Record<string, CropConfirm> = {
  onion: {
    text: 'Confirm with a soil test for pH and nutrients before planting, since the New England guide keeps onions at pH 6.5 to 6.8 by soil test. Lift a plant and look at the roots and the base of the bulb before blaming the soil: white fuzz, pink roots or maggots mean a disease or a pest, which no nutrient test shows.',
    sources: [NEV_ONION, UMN_ONION_WILT],
  },
  shallot: {
    text: 'Confirm with a soil test for pH before planting, which the New England guide keeps at 6.5 to 6.8 for shallots. Bolting, mildew and rot come from the weather, the planting stock and the bed, which no test shows.',
    sources: [NEV_ONION],
  },
  garlic: {
    text: 'Confirm with a soil test for pH and nutrients before planting, which the New England guide keeps at 6.0 to 6.8 for garlic. Small bulbs usually come from late planting, small cloves, wet or heavy soil or late nitrogen, and none of those shows in a test.',
    sources: [NEV_GARLIC],
  },
  leek: {
    text: 'Confirm with a soil test for pH before planting: the New England guide feeds leeks as it feeds onions, at pH 6.5 to 6.8. Rust, bolting and the pests come from the weather, the variety and the bed, which no test shows.',
    sources: [NEV_LEEK, NEV_ONION],
  },
};
