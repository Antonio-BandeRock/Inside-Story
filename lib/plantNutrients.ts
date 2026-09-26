// What a plant short of one nutrient looks like, and how to put it right.
//
// 2026-09-26, direct request: "In the Garden tab, there needs to be
// information about how to grow each thing, what type of soil it likes,
// what deficiencies of nutrients look like and how to fix it based on
// real world gardening advice they can be pointed to, like PubMed,
// outside of the device." The crops are lib/cropGuides.ts; this is the
// half about leaves, shared by every crop so a crop guide can name a
// nutrient and the reader can open the whole account of it.
//
// Three rules hold across every entry, each from the standing brief:
//
//  1. Where the symptom shows first comes before what it looks like. A
//     nutrient the plant can move (nitrogen, phosphorus, potassium,
//     magnesium, molybdenum) is drawn out of the old leaves to feed the
//     new, so the old leaves show it first; one it cannot move shows on
//     the newest growth. That one fact halves the list before a reader
//     has to compare shades of yellow.
//  2. The fix that works with the soil comes first and the conventional
//     fix follows it, described fairly (Living with nature, 2026-09-26).
//     Neither is presented as the only honest choice, and where a bottled
//     fix is the one that works fast, that is said.
//  3. Test before treating. Most of these are not a shortage in the soil
//     at all but a pH that locks the nutrient away, or water that cannot
//     carry it to the leaf, and adding more of a nutrient the soil
//     already holds does nothing for the plant and can harm the soil.
//
// Pure data and one lookup, no React, so scripts/test_crop_guides.js can
// check every link and every name without a phone.

export type PlantNutrientKey = 'N' | 'P' | 'K' | 'Ca' | 'Mg' | 'S' | 'Fe' | 'Mn' | 'Zn' | 'B' | 'Cu' | 'Mo';

export type GuideSource = { label: string; url: string };

export type PlantNutrient = {
  key: PlantNutrientKey;
  name: string;
  // Where it shows first, which is the first thing to look at.
  showsOn: 'older' | 'newer';
  role: string;
  looks: string;
  causes: string;
  withTheSoil: string;
  conventional: string;
  caution: string;
  sources: GuideSource[];
};

const RHS_DEFICIENCIES: GuideSource = {
  label: 'RHS: Nutrient deficiencies',
  url: 'https://www.rhs.org.uk/prevention-protection/nutrient-deficiencies',
};
const RHS_PH: GuideSource = {
  label: 'RHS: Soil pH and testing',
  url: 'https://www.rhs.org.uk/soil-composts-mulches/ph-and-testing-soil',
};
const RHS_LIME: GuideSource = { label: 'RHS: Lime and liming', url: 'https://www.rhs.org.uk/soil-composts-mulches/lime-liming' };
const RHS_ACID: GuideSource = { label: 'RHS: Acidifying soil', url: 'https://www.rhs.org.uk/soil-composts-mulches/acidifying-soil' };
const RHS_FERTILISERS: GuideSource = { label: 'RHS: Fertilisers', url: 'https://www.rhs.org.uk/garden-jobs/fertilisers' };
const RHS_ORGANIC_MATTER: GuideSource = {
  label: 'RHS: Organic matter',
  url: 'https://www.rhs.org.uk/soil-composts-mulches/organic-matter-how-to-use-in-garden',
};
const RHS_BLOSSOM_END_ROT: GuideSource = { label: 'RHS: Blossom end rot', url: 'https://www.rhs.org.uk/problems/blossom-end-rot' };
const RHS_BITTER_PIT: GuideSource = { label: 'RHS: Bitter pit in apples', url: 'https://www.rhs.org.uk/problems/bitter-pit-in-apples' };
const UF_SOIL_PH: GuideSource = {
  label: 'University of Florida IFAS: Soil pH and the home garden',
  url: 'https://edis.ifas.ufl.edu/publication/SS480',
};

// A PubMed search rather than one paper, so the link always resolves and
// shows the research as it stands on the day it is opened. PubMed holds
// studies (field trials, plant physiology), which is depth for someone who
// wants it, not a how-to; the advisory services above are the how-to.
export function pubmedSearchUrl(terms: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(terms)}`;
}

function pubmed(terms: string): GuideSource {
  return { label: 'PubMed: the research', url: pubmedSearchUrl(terms) };
}

export const PLANT_NUTRIENTS: PlantNutrient[] = [
  {
    key: 'N',
    name: 'Nitrogen',
    showsOn: 'older',
    role: 'Builds leaves and stems. The nutrient a plant uses most of, and the one a growing plant runs short of most often.',
    looks: 'The oldest leaves turn pale green, then yellow all over, veins included, while the new growth stays greener. The whole plant is small and thin-stemmed, and in sweetcorn the yellowing runs down the middle of the lower leaves from the tip in a V.',
    causes: 'Sandy soil that heavy rain washes through, cold soil in spring before soil life wakes up to release it, and fresh sawdust or woody chippings dug in, which soil microbes feed on by taking nitrogen out of the soil for a while.',
    withTheSoil: 'Compost and well-rotted manure every year. Peas, beans or a clover cover crop grown before a hungry crop, since the bacteria on their roots take nitrogen from the air. Grass clippings as a thin mulch, and a nettle or comfrey soak watered on as a quick liquid feed. Keep woody mulch on top of the soil rather than dug in.',
    conventional: 'A fast nitrogen fertiliser (sulphate of ammonia, or a balanced general fertiliser) greens a plant within days. Dried blood is the fast organic equivalent.',
    caution: 'Too much gives soft, lush leaves that aphids favour, fruit and roots at the expense of leaf, and nitrogen that the rain carries on into streams. Feed a little and often rather than a lot at once.',
    sources: [RHS_DEFICIENCIES, RHS_FERTILISERS, RHS_ORGANIC_MATTER, pubmed('nitrogen deficiency vegetable crops')],
  },
  {
    key: 'P',
    name: 'Phosphorus',
    showsOn: 'older',
    role: 'Roots, flowering and the energy chemistry inside every cell.',
    looks: 'Slow, stunted growth with dull, dark or bluish-green leaves. The older leaves and the undersides of leaves take on a purple or reddish tint, most obvious on tomato and sweetcorn seedlings.',
    causes: 'Cold soil in spring is the usual reason, and the purple fades once the soil warms. A very acid or very alkaline soil holds phosphorus in forms roots cannot take up. A true shortage is uncommon in gardens that have been manured for years, and many such soils hold too much rather than too little.',
    withTheSoil: 'Wait for warmer soil before planting out warm crops. Compost and manure, and bone meal worked in for slow release. Leaving the soil undug keeps the fungal networks (mycorrhizae) that reach phosphorus a root cannot reach alone.',
    conventional: 'Superphosphate, or a balanced fertiliser, once a soil test shows the soil is short.',
    caution: 'Phosphorus that runs off a garden feeds algae in ponds and rivers, and a soil loaded with it can leave plants short of zinc and iron. Test the soil before adding any.',
    sources: [RHS_DEFICIENCIES, RHS_PH, pubmed('phosphorus deficiency plant symptoms')],
  },
  {
    key: 'K',
    name: 'Potassium (potash)',
    showsOn: 'older',
    role: 'Flowering, fruiting, sweetness, and how well a plant handles drought, cold and disease.',
    looks: 'The edges and tips of older leaves turn yellow, then brown and crisp, as though scorched, sometimes with purple tints. Flowers and fruit are few and small, and tomatoes ripen unevenly, with hard green or yellow patches.',
    causes: 'Light sandy soils and chalky soils hold little of it, and heavy cropping carries it away in every harvest.',
    withTheSoil: 'Comfrey, as a mulch or a liquid feed, is rich in it. Compost, seaweed, and a light scatter of ash from untreated wood also supply it; wood ash raises pH, so use it on acid soil and sparingly.',
    conventional: 'Sulphate of potash, or a high-potash liquid tomato feed during flowering and fruiting.',
    caution: 'Heavy potash feeding is a common cause of magnesium and calcium shortage, because the three compete to be taken up. Feed potash to what the plant is doing (fruiting), not all season.',
    sources: [RHS_DEFICIENCIES, RHS_FERTILISERS, pubmed('potassium deficiency plant symptoms')],
  },
  {
    key: 'Ca',
    name: 'Calcium',
    showsOn: 'newer',
    role: 'Builds cell walls. Without it the fastest-growing tissue (fruit tips, heart leaves) breaks down.',
    looks: 'Rarely leaves at all. It shows as blossom-end rot (a sunken black patch at the base of tomatoes, peppers and squash), tipburn (browned edges on the inner leaves of lettuce and cabbage), bitter pit (small brown sunken spots in apples), and blackheart in celery.',
    causes: 'Almost always water, not the soil. Calcium moves only in the water a plant draws up, so dry spells, irregular watering and pots that dry out stop it reaching fruit even in a soil full of it. Too much potash or nitrogen and very acid soil add to it.',
    withTheSoil: 'Water deeply and on a steady schedule, and mulch to hold moisture evenly. On an acid soil, lime brings the pH up and supplies calcium together.',
    conventional: 'Calcium sprays through the season are used on apples against bitter pit. For blossom-end rot the fix is watering; adding calcium to a soil that already has plenty changes nothing.',
    caution: 'Eggshells break down over years, too slowly to help this season. The fruit already marked stays marked; the next fruits are the ones that benefit.',
    sources: [RHS_BLOSSOM_END_ROT, RHS_BITTER_PIT, RHS_DEFICIENCIES, pubmed('calcium deficiency blossom end rot')],
  },
  {
    key: 'Mg',
    name: 'Magnesium',
    showsOn: 'older',
    role: 'The atom at the centre of chlorophyll, the green that catches light.',
    looks: 'Yellowing between the veins of older leaves while the veins themselves stay green, often turning to reddish-brown or purple patches. Common on tomatoes, apples and grapes.',
    causes: 'Acid, sandy soils, heavy rain washing it through, and above all heavy potash feeding, which crowds magnesium out.',
    withTheSoil: 'Compost every year, and ease off potash. On an acid soil, dolomitic limestone supplies magnesium while it raises the pH.',
    conventional: 'Epsom salts (magnesium sulphate) watered onto the soil, about 30 g per square metre, or dissolved in water and sprayed on the leaves for a faster, shorter-lived effect.',
    caution: 'Leaves already yellowed stay yellow; judge the fix by the new leaves.',
    sources: [RHS_DEFICIENCIES, RHS_LIME, pubmed('magnesium deficiency tomato')],
  },
  {
    key: 'S',
    name: 'Sulphur',
    showsOn: 'newer',
    role: 'Proteins, and the sharp flavours of onions, garlic and cabbages.',
    looks: 'Young leaves pale yellow all over, veins included. It looks like nitrogen shortage, except it starts at the top of the plant instead of the bottom.',
    causes: 'Uncommon. Sandy soils low in organic matter, far from any source of it in rain.',
    withTheSoil: 'Compost and manure supply it.',
    conventional: 'Gypsum, or any fertiliser named a sulphate (sulphate of potash, sulphate of ammonia), which supplies it alongside its other nutrient.',
    caution: 'Elemental sulphur is a different thing: it acidifies soil, and is used for that rather than as a feed.',
    sources: [RHS_FERTILISERS, pubmed('sulfur deficiency plant symptoms')],
  },
  {
    key: 'Fe',
    name: 'Iron',
    showsOn: 'newer',
    role: 'Needed to make chlorophyll.',
    looks: 'The youngest leaves turn yellow between the veins, with the veins staying sharply green; in a bad case the new leaves are almost white. Blueberries, raspberries, citrus and other acid-loving plants show it first.',
    causes: 'Nearly always pH, not a lack of iron. On an alkaline or chalky soil, or watered with hard tap water, iron is locked into forms a root cannot take up (lime-induced chlorosis). Waterlogged roots do the same.',
    withTheSoil: 'Grow acid-loving plants in soil that suits them: in a chalky garden that means containers of ericaceous compost watered with rainwater. Lower the pH of a slightly alkaline bed slowly, over seasons, and keep roots out of standing water.',
    conventional: 'Chelated (sequestered) iron, watered on or sprayed, greens the leaves within weeks. It treats the symptom and needs repeating as long as the pH stays high.',
    caution: 'Ordinary iron sulphate added to an alkaline soil is locked up again quickly. Fix the pH, or grow the plant in a pot.',
    sources: [RHS_DEFICIENCIES, RHS_ACID, UF_SOIL_PH, pubmed('iron deficiency chlorosis calcareous soil')],
  },
  {
    key: 'Mn',
    name: 'Manganese',
    showsOn: 'newer',
    role: 'Works alongside iron in making chlorophyll and in the chemistry of photosynthesis.',
    looks: 'Yellowing between the veins of young and middle leaves, often with small brown spots, so the leaf looks speckled. Peas show it as marsh spot, a brown patch inside the seed.',
    causes: 'Alkaline or over-limed soil, and light soils rich in organic matter.',
    withTheSoil: 'Stop liming, and let the pH come down. Compost helps a light soil hold what it has.',
    conventional: 'A foliar spray of manganese sulphate.',
    caution: 'On very acid, waterlogged soils the opposite happens and plants take up too much. A soil test tells which.',
    sources: [RHS_DEFICIENCIES, RHS_PH, pubmed('manganese deficiency plants soil pH')],
  },
  {
    key: 'Zn',
    name: 'Zinc',
    showsOn: 'newer',
    role: 'Growth hormones and leaf size.',
    looks: 'New leaves small, narrow and bunched at the shoot tips (little leaf, rosetting), with mottled yellowing between the veins. In sweetcorn, pale stripes run either side of the midrib of young leaves.',
    causes: 'Alkaline soils, soils loaded with phosphorus, and gardens where the topsoil has been scraped away.',
    withTheSoil: 'Compost and manure, and holding back on phosphorus.',
    conventional: 'A foliar spray of zinc sulphate, used on citrus, pecans and sweetcorn where a test shows shortage.',
    caution: 'Zinc is toxic to plants and soil life in excess. Only after a test.',
    sources: [UF_SOIL_PH, pubmed('zinc deficiency plants alkaline soil')],
  },
  {
    key: 'B',
    name: 'Boron',
    showsOn: 'newer',
    role: 'Growing tips, flowering and fruit set.',
    looks: 'Growing tips die back and new leaves are thick, brittle or distorted. Brassicas get hollow, cracked stems; swedes and turnips get brown heart; beetroot gets black patches inside; celery stems crack across; papayas are lumpy and misshapen.',
    causes: 'Light sandy soils after heavy rain, dry spells, and over-liming.',
    withTheSoil: 'Compost and seaweed supply small amounts, which is often all that is needed.',
    conventional: 'Borax, applied at a rate measured in grams across many square metres, mixed with sand for even spreading, and only where a test or a history of the symptoms points to it.',
    caution: 'The gap between too little and too much is narrower for boron than for any other nutrient here, and an overdose poisons the soil for seasons. Measure, and never repeat it on a hunch.',
    sources: [RHS_DEFICIENCIES, pubmed('boron deficiency vegetable crops')],
  },
  {
    key: 'Cu',
    name: 'Copper',
    showsOn: 'newer',
    role: 'Enzymes, and the strength of plant tissue.',
    looks: 'Young leaves wilt, twist or turn pale and bluish, and shoot tips die back.',
    causes: 'Rare in gardens. Peaty soils and very sandy ones.',
    withTheSoil: 'Compost.',
    conventional: 'Copper sulphate at the rate a soil test gives.',
    caution: 'Copper builds up in soil and harms earthworms. Copper fungicide sprays already add it, so a sprayed garden is the last place to add more.',
    sources: [pubmed('copper deficiency plants symptoms')],
  },
  {
    key: 'Mo',
    name: 'Molybdenum',
    showsOn: 'older',
    role: 'Lets a plant use the nitrogen it takes up, and lets peas and beans fix nitrogen from the air.',
    looks: 'In cauliflower and broccoli, whiptail: new leaves narrow to little more than the midrib. Other crops go pale and their leaf edges curl.',
    causes: 'Acid soil. Molybdenum is the one nutrient that becomes harder to get as soil grows more acid, the reverse of iron and manganese.',
    withTheSoil: 'Lime an acid soil to around pH 6.5 before brassicas, which also discourages clubroot.',
    conventional: 'Sodium molybdate at a tiny rate, sprayed or watered on.',
    caution: 'Liming usually fixes it on its own, so lime first and check again.',
    sources: [RHS_DEFICIENCIES, RHS_LIME, pubmed('molybdenum deficiency whiptail cauliflower')],
  },
];

export function findPlantNutrient(key: PlantNutrientKey): PlantNutrient | undefined {
  return PLANT_NUTRIENTS.find((nutrient) => nutrient.key === key);
}

// What can look like a shortage and is not one. Read before buying
// anything, because every one of these is more common in a garden than a
// true deficiency.
export const NUTRIENT_LOOK_ALIKES: { heading: string; body: string }[] = [
  {
    heading: 'Too dry or too wet',
    body: 'Roots in dry soil cannot draw anything up, and roots in waterlogged soil are short of air and stop working. Either one yellows leaves in ways that copy nitrogen, iron or potassium shortage. Check the soil a finger deep before anything else.',
  },
  {
    heading: 'Cold',
    body: 'Cold soil slows roots and soil life. Purple seedlings in a cold spring are usually cold, not a phosphorus shortage, and green up as the soil warms.',
  },
  {
    heading: 'Old leaves doing what old leaves do',
    body: 'The lowest leaves of many plants yellow and drop as the plant ages or as the canopy shades them. One or two yellow leaves at the bottom of a healthy plant is not a symptom.',
  },
  {
    heading: 'Damaged roots',
    body: 'Root-feeding grubs, root-knot nematodes, digging too close, and pots with circling roots all starve a plant in soil that holds plenty.',
  },
  {
    heading: 'Weedkiller drift',
    body: 'New growth that twists, cups or grows in narrow straps after a neighbour sprayed, or after manure from fields treated with a persistent weedkiller, is chemical damage. Tomatoes, beans and potatoes show it most.',
  },
  {
    heading: 'Virus',
    body: 'A mosaic of light and dark green that does not follow the veins, with crinkled or mottled leaves, points to a virus rather than a nutrient.',
  },
  {
    heading: 'Too much feed',
    body: 'Crisp brown leaf edges after heavy feeding can be salt burn from fertiliser, not potassium shortage. It is common in pots.',
  },
];

// pH, since it decides what a root can reach far more often than the
// nutrient itself is missing.
export const SOIL_PH_GUIDE: { heading: string; body: string }[] = [
  {
    heading: 'Why pH comes first',
    body: 'Most vegetables grow best between pH 6.0 and 7.0, where the most nutrients are available at once. Above about 7.5, iron, manganese, zinc and phosphorus are locked away; below about 5.5, molybdenum, calcium and magnesium are harder to get and some metals become too available. A leaf symptom is often a pH problem.',
  },
  {
    heading: 'Testing',
    body: 'A kit from a garden centre gives pH in minutes. A laboratory test, often through a university extension service or a soil lab, gives the nutrients as well and is worth doing once before spending on amendments. Take several small samples across a bed and mix them.',
  },
  {
    heading: 'Raising pH (a soil too acid)',
    body: 'Garden lime (ground limestone), or dolomitic lime where magnesium is short too, worked in during autumn or winter so it has time to act. Wood ash raises pH faster and should be used lightly. Lime and fresh manure applied together lose nitrogen to the air, so keep them weeks apart.',
  },
  {
    heading: 'Lowering pH (a soil too alkaline)',
    body: 'Sulphur chips or powder, which soil bacteria turn to acid slowly over months. On chalk or limestone the rock underneath keeps pushing the pH back up, so plants that need acid soil (blueberries, most citrus in the ground) are easier grown in containers of ericaceous compost watered with rainwater.',
  },
  {
    heading: 'Working with the soil',
    body: 'Compost and other organic matter buffer pH in both directions, hold nutrients where roots can reach them, and feed the soil life that releases nutrients as plants need them. Adding organic matter every year does more for most gardens than any single bottle.',
  },
];

export const SOIL_GUIDE_SOURCES: GuideSource[] = [RHS_PH, RHS_LIME, RHS_ACID, RHS_ORGANIC_MATTER, UF_SOIL_PH];
