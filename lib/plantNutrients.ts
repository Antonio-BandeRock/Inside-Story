// What a plant short of one nutrient looks like, and how to put it right.
//
// 2026-09-26, direct request: "In the Garden tab, there needs to be
// information about how to grow each thing, what type of soil it likes,
// what deficiencies of nutrients look like and how to fix it based on
// real world gardening advice they can be pointed to, like PubMed,
// outside of the device." The crops are lib/cropGuides.ts and their
// problems lib/cropProblems.ts; this is the half about leaves, shared by
// every crop so a crop's problem can name a nutrient and the reader can
// open the whole account of it.
//
// Three rules hold across every entry, each from the standing brief:
//
//  1. Where the symptom shows first comes before what it looks like. A
//     nutrient the plant can move (nitrogen, phosphorus, potassium,
//     magnesium, molybdenum) is drawn out of the old leaves to feed the
//     new, so the old leaves show it first; one it cannot move shows on
//     the newest growth. That one fact halves the list before a reader
//     has to compare shades of yellow.
//  2. The fix that feeds the soil comes first, and the bagged or bottled
//     fix is named only to say why to skip it (2026-09-26, direct
//     instruction: "we are trying to promote not using chemicals to grow
//     their crops and instead make live soil through composting and other
//     methods such as Korean Natural Farming, with chemical be persuaded
//     against"). The persuasion stays truthful: it says what the bag does
//     well, what it does to the soil, and never mocks anybody for using
//     it. Mined minerals (lime, dolomite, gypsum, rock dust, borax at a
//     measured rate) are rock from the ground and count as working with
//     the soil. Korean Natural Farming inputs are described with the
//     evidence they have, which is mostly practitioner experience plus a
//     few University of Hawaii trials, and are never called proven.
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
  // The bag or bottle somebody might reach for, and truthfully why to
  // skip it. Never offered as the fix.
  whyNotChemical: string;
  caution: string;
  sources: GuideSource[];
};

export const RHS_DEFICIENCIES: GuideSource = {
  label: 'RHS: Nutrient deficiencies',
  url: 'https://www.rhs.org.uk/prevention-protection/nutrient-deficiencies',
};
const RHS_PH: GuideSource = {
  label: 'RHS: Soil pH and testing',
  url: 'https://www.rhs.org.uk/soil-composts-mulches/ph-and-testing-soil',
};
const RHS_LIME: GuideSource = { label: 'RHS: Lime and liming', url: 'https://www.rhs.org.uk/soil-composts-mulches/lime-liming' };
const RHS_ACID: GuideSource = { label: 'RHS: Acidifying soil', url: 'https://www.rhs.org.uk/soil-composts-mulches/acidifying-soil' };
const RHS_ORGANIC_MATTER: GuideSource = {
  label: 'RHS: Organic matter',
  url: 'https://www.rhs.org.uk/soil-composts-mulches/organic-matter-how-to-use-in-garden',
};
const RHS_COMPOSTING: GuideSource = { label: 'RHS: Composting', url: 'https://www.rhs.org.uk/soil-composts-mulches/composting' };
const RHS_BLOSSOM_END_ROT: GuideSource = { label: 'RHS: Blossom end rot', url: 'https://www.rhs.org.uk/problems/blossom-end-rot' };
const RHS_BITTER_PIT: GuideSource = { label: 'RHS: Bitter pit in apples', url: 'https://www.rhs.org.uk/problems/bitter-pit-in-apples' };
const UF_SOIL_PH: GuideSource = {
  label: 'University of Florida IFAS: Soil pH and the home garden',
  url: 'https://edis.ifas.ufl.edu/publication/SS480',
};

const GO = 'https://www.gardenorganic.org.uk';
export const GO_COMPOST: GuideSource = {
  label: 'Garden Organic: How to make compost',
  url: `${GO}/expert-advice/garden-management/composting/how-to-make-compost`,
};
export const GO_NO_DIG: GuideSource = {
  label: 'Garden Organic: The no-dig method',
  url: `${GO}/expert-advice/garden-management/soil/the-nodig-method`,
};
export const GO_GREEN_MANURES: GuideSource = {
  label: 'Garden Organic: Green manures',
  url: `${GO}/expert-advice/garden-management/soil/green-manures`,
};
export const GO_MYCORRHIZAE: GuideSource = {
  label: 'Garden Organic: Mycorrhizal fungi',
  url: `${GO}/expert-advice/garden-management/soil/mycorrhizal-fungi`,
};
export const GO_COMFREY: GuideSource = { label: 'Garden Organic: All about comfrey', url: `${GO}/expert-advice/all-about-comfrey` };
export const GO_LIQUID_FEEDS: GuideSource = {
  label: 'Garden Organic: Making liquid feeds (PDF)',
  url: 'https://garden-organic.files.svdcdn.com/production/documents/A41-Making-liquid-feeds.pdf',
};
export const GO_MULCH: GuideSource = { label: 'Garden Organic: How to mulch', url: `${GO}/how-to-mulch` };
export const GO_LEAFMOULD: GuideSource = {
  label: 'Garden Organic: Leafmould',
  url: `${GO}/expert-advice/garden-management/composting/leafmould`,
};
export const GO_EARTHWORMS: GuideSource = {
  label: 'Garden Organic: Earthworms',
  url: `${GO}/expert-advice/garden-management/soil/earthworms`,
};
export const GO_SOIL_HEALTH: GuideSource = {
  label: 'Garden Organic: Build and maintain soil health',
  url: `${GO}/expert-advice/build-and-maintain-soil-health`,
};
export const GO_PESTICIDES: GuideSource = { label: 'Garden Organic: Pesticides', url: `${GO}/expert-advice/pesticides` };

function ctahr(id: string, label: string): GuideSource {
  return { label: `University of Hawaii CTAHR: ${label} (PDF)`, url: `https://www.ctahr.hawaii.edu/oc/freepubs/pdf/${id}.pdf` };
}
export const KNF_IMO = ctahr('SA-19', 'Indigenous microorganisms (IMO)');
export const KNF_FPJ = ctahr('SA-7', 'Fermented plant juice (FPJ)');
export const KNF_LAB = ctahr('SA-8', 'Lactic acid bacteria (LAB)');
export const KNF_SEAWATER = ctahr('SA-9', 'Seawater as a plant input');
export const KNF_WCA = ctahr('SA-10', 'Water-soluble calcium (WCA)');
export const KNF_OHN = ctahr('SA-11', 'Oriental herbal nutrient (OHN)');
export const KNF_FAA = ctahr('SA-12', 'Fish amino acids (FAA)');
export const KNF_BACTERIA = ctahr('SA-21', 'Phosphorus-solubilizing and nitrogen-fixing bacteria in Korean Natural Farming');
export const CTAHR_COVER_CROP_N = ctahr('SA-15', 'Nitrogen from cover crops');
export const CTAHR_SOIL_P = ctahr('SCM-33', 'Soil phosphorus');
export const CTAHR_LOCAL_INPUTS: GuideSource = {
  label: 'University of Hawaii CTAHR: Local and on-farm fertilizers',
  url: 'https://cms.ctahr.hawaii.edu/soap/Resources/Local-Fertilizers',
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
    withTheSoil: 'Compost and well-rotted manure every year. Peas, beans or a clover cover crop grown before a hungry crop, since the bacteria on their roots take nitrogen from the air. Grass clippings as a thin mulch, and a nettle or comfrey soak watered on as a quick liquid feed. In Korean Natural Farming, fish amino acid (fish scraps fermented with brown sugar, diluted about 1 to 1,000) is the nitrogen feed, and fermented plant juice from fast-growing tips is given during leafy growth. Keep woody mulch on top of the soil rather than dug in.',
    whyNotChemical: 'Sulphate of ammonia, urea and the blue granular feeds green a plant in days, which is why they sell. They are soluble salts: they feed the plant while bypassing the soil life that would have fed it, acidify the soil over years, and whatever the plant does not take up the next rain carries into streams. A soil fed this way needs the bag again every year.',
    caution: 'Too much nitrogen from any source gives soft, lush leaves that aphids favour, fruit and roots at the expense of leaf, and runoff. Feed a little and often rather than a lot at once.',
    sources: [RHS_DEFICIENCIES, GO_GREEN_MANURES, KNF_FAA, CTAHR_COVER_CROP_N, pubmed('nitrogen deficiency vegetable crops')],
  },
  {
    key: 'P',
    name: 'Phosphorus',
    showsOn: 'older',
    role: 'Roots, flowering and the energy chemistry inside every cell.',
    looks: 'Slow, stunted growth with dull, dark or bluish-green leaves. The older leaves and the undersides of leaves take on a purple or reddish tint, most obvious on tomato and sweetcorn seedlings.',
    causes: 'Cold soil in spring is the usual reason, and the purple fades once the soil warms. A very acid or very alkaline soil holds phosphorus in forms roots cannot take up. A true shortage is uncommon in gardens that have been manured for years, and many such soils hold too much rather than too little.',
    withTheSoil: 'Wait for warmer soil before planting out warm crops. Compost and manure, and bone meal worked in for slow release. Leaving the soil undug keeps the fungal networks (mycorrhizae) that reach phosphorus a root cannot reach alone. Korean Natural Farming makes water-soluble calcium phosphate by soaking charred bones in vinegar, given at flowering.',
    whyNotChemical: 'Superphosphate is rock phosphate treated with acid so it dissolves fast. Roots that are handed soluble phosphorus stop feeding the mycorrhizal fungi that fetch it for them, so the fungi decline, and most garden soils that are tested turn out to hold plenty already. What runs off feeds algae in ponds and rivers.',
    caution: 'A soil loaded with phosphorus from any source can leave plants short of zinc and iron. Test the soil before adding any.',
    sources: [RHS_DEFICIENCIES, GO_MYCORRHIZAE, CTAHR_SOIL_P, KNF_BACTERIA, pubmed('phosphorus deficiency plant symptoms')],
  },
  {
    key: 'K',
    name: 'Potassium (potash)',
    showsOn: 'older',
    role: 'Flowering, fruiting, sweetness, and how well a plant handles drought, cold and disease.',
    looks: 'The edges and tips of older leaves turn yellow, then brown and crisp, as though scorched, sometimes with purple tints. Flowers and fruit are few and small, and tomatoes ripen unevenly, with hard green or yellow patches.',
    causes: 'Light sandy soils and chalky soils hold little of it, and heavy cropping carries it away in every harvest.',
    withTheSoil: 'Comfrey, as a mulch or a liquid feed, is rich in it. Compost, seaweed, and a light scatter of ash from untreated wood also supply it; wood ash raises pH, so use it on acid soil and sparingly. Korean Natural Farming gives fermented fruit juice, ripe fruit and banana peel fermented with brown sugar, during flowering and fruiting.',
    whyNotChemical: 'Sulphate of potash and bottled tomato feeds work quickly, and they are salts that build up in pots and in dry soil and burn leaf edges, the very symptom they are bought to cure. Heavy potash feeding is also the commonest cause of magnesium and calcium shortage, since the three compete to be taken up. Comfrey grown in a corner of the garden supplies the same potassium every year for nothing.',
    caution: 'Feed potash to what the plant is doing (fruiting), not all season, whatever its source.',
    sources: [RHS_DEFICIENCIES, GO_COMFREY, GO_LIQUID_FEEDS, pubmed('potassium deficiency plant symptoms')],
  },
  {
    key: 'Ca',
    name: 'Calcium',
    showsOn: 'newer',
    role: 'Builds cell walls. Without it the fastest-growing tissue (fruit tips, heart leaves) breaks down.',
    looks: 'Rarely leaves at all. It shows as blossom-end rot (a sunken black patch at the base of tomatoes, peppers and squash), tipburn (browned edges on the inner leaves of lettuce and cabbage), bitter pit (small brown sunken spots in apples), and blackheart in celery.',
    causes: 'Almost always water, not the soil. Calcium moves only in the water a plant draws up, so dry spells, irregular watering and pots that dry out stop it reaching fruit even in a soil full of it. Too much potash or nitrogen and very acid soil add to it.',
    withTheSoil: 'Water deeply and on a steady schedule, and mulch to hold moisture evenly; compost helps the soil hold that water. On an acid soil, lime brings the pH up and supplies calcium together. Korean Natural Farming makes water-soluble calcium by soaking toasted eggshells in vinegar until they stop fizzing, then sprays it diluted about 1 to 1,000 on young fruit; it is a practitioner method with little trial evidence yet.',
    whyNotChemical: 'Calcium nitrate and calcium chloride sprays are sold against blossom-end rot and bitter pit. They add salt and fast nitrogen, and they cannot fix the usual cause, which is water not reaching the fruit. Adding calcium to a soil that already has plenty changes nothing.',
    caution: 'Whole eggshells break down over years, too slowly to help this season. The fruit already marked stays marked; the next fruits are the ones that benefit.',
    sources: [RHS_BLOSSOM_END_ROT, RHS_BITTER_PIT, KNF_WCA, GO_MULCH, pubmed('calcium deficiency blossom end rot')],
  },
  {
    key: 'Mg',
    name: 'Magnesium',
    showsOn: 'older',
    role: 'The atom at the centre of chlorophyll, the green that catches light.',
    looks: 'Yellowing between the veins of older leaves while the veins themselves stay green, often turning to reddish-brown or purple patches. Common on tomatoes, apples and grapes.',
    causes: 'Acid, sandy soils, heavy rain washing it through, and above all heavy potash feeding, which crowds magnesium out.',
    withTheSoil: 'Compost every year, and ease off potash. On an acid soil, dolomitic limestone supplies magnesium while it raises the pH. Diluted seawater, used in Korean Natural Farming at about 1 to 30, carries magnesium with its other minerals.',
    whyNotChemical: 'Epsom salts are sold as the cure and the magnesium in them does reach the leaf. In most gardens the shortage was made by potash feeding, though, and another salt treats the leaf rather than the cause; ease off the potash and the magnesium the soil holds becomes available again.',
    caution: 'Leaves already yellowed stay yellow; judge the fix by the new leaves. Seawater carries salt, so use it rarely and never on salt-sensitive crops or in pots.',
    sources: [RHS_DEFICIENCIES, RHS_LIME, KNF_SEAWATER, pubmed('magnesium deficiency tomato')],
  },
  {
    key: 'S',
    name: 'Sulphur',
    showsOn: 'newer',
    role: 'Proteins, and the sharp flavours of onions, garlic and cabbages.',
    looks: 'Young leaves pale yellow all over, veins included. It looks like nitrogen shortage, except it starts at the top of the plant instead of the bottom.',
    causes: 'Uncommon. Sandy soils low in organic matter, far from any source of it in rain.',
    withTheSoil: 'Compost and manure supply it. Gypsum, a mined mineral, supplies it without changing the pH.',
    whyNotChemical: 'Fertilisers named a sulphate supply sulphur as a side effect of something else, which means adding ammonia or potash the soil may not need to fix a shortage compost would have covered.',
    caution: 'Elemental sulphur is a different thing: it acidifies soil, and is used for that rather than as a feed.',
    sources: [RHS_ORGANIC_MATTER, GO_COMPOST, pubmed('sulfur deficiency plant symptoms')],
  },
  {
    key: 'Fe',
    name: 'Iron',
    showsOn: 'newer',
    role: 'Needed to make chlorophyll.',
    looks: 'The youngest leaves turn yellow between the veins, with the veins staying sharply green; in a bad case the new leaves are almost white. Blueberries, raspberries, citrus and other acid-loving plants show it first.',
    causes: 'Nearly always pH, not a lack of iron. On an alkaline or chalky soil, or watered with hard tap water, iron is locked into forms a root cannot take up (lime-induced chlorosis). Waterlogged roots do the same.',
    withTheSoil: 'Grow acid-loving plants in soil that suits them: in a chalky garden that means containers of peat-free ericaceous compost watered with rainwater. Mulch with pine needles, leafmould or composted bark, and lower the pH of a slightly alkaline bed slowly, over seasons, with sulphur. Compost feeds the soil microbes whose acids keep iron in reach of roots. Keep roots out of standing water.',
    whyNotChemical: 'Chelated (sequestered) iron greens the leaves within weeks, and it does work. It treats the symptom only: as long as the pH stays high it has to be bought and applied again every season, and the synthetic chelates persist in water after the plant has taken the iron.',
    caution: 'Ordinary iron sulphate added to an alkaline soil is locked up again quickly. Fix the pH, or grow the plant in a pot.',
    sources: [RHS_DEFICIENCIES, RHS_ACID, UF_SOIL_PH, GO_LEAFMOULD, pubmed('iron deficiency chlorosis calcareous soil')],
  },
  {
    key: 'Mn',
    name: 'Manganese',
    showsOn: 'newer',
    role: 'Works alongside iron in making chlorophyll and in the chemistry of photosynthesis.',
    looks: 'Yellowing between the veins of young and middle leaves, often with small brown spots, so the leaf looks speckled. Peas show it as marsh spot, a brown patch inside the seed.',
    causes: 'Alkaline or over-limed soil, and light soils rich in organic matter.',
    withTheSoil: 'Stop liming, and let the pH come down. Compost helps a light soil hold what it has, and seaweed supplies traces.',
    whyNotChemical: 'Manganese sulphate sprays green the leaves for a few weeks and do nothing about the pH that caused it, so the spraying never ends. Most gardens with this symptom were limed too often.',
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
    withTheSoil: 'Compost and manure, which carry zinc in forms roots take up, and holding back on phosphorus. Undug soil keeps the mycorrhizal fungi that fetch zinc for the roots.',
    whyNotChemical: 'Zinc sulphate sprays are sold for citrus and sweetcorn. Zinc builds up in soil and harms earthworms and soil life in excess, and the shortage is usually made by phosphorus feeding or high pH, which a spray does not touch.',
    caution: 'Only add zinc from any source after a test shows the soil is short.',
    sources: [UF_SOIL_PH, GO_MYCORRHIZAE, pubmed('zinc deficiency plants alkaline soil')],
  },
  {
    key: 'B',
    name: 'Boron',
    showsOn: 'newer',
    role: 'Growing tips, flowering and fruit set.',
    looks: 'Growing tips die back and new leaves are thick, brittle or distorted. Brassicas get hollow, cracked stems; swedes and turnips get brown heart; beetroot gets black patches inside; celery stems crack across; papayas are lumpy and misshapen.',
    causes: 'Light sandy soils after heavy rain, dry spells, and over-liming.',
    withTheSoil: 'Compost and seaweed supply small amounts, which is often all that is needed, and steady moisture lets roots take it up. Where a test confirms a true shortage, borax, a mined mineral, is used at a rate measured in grams across many square metres, mixed with sand for even spreading.',
    whyNotChemical: 'Boron is sold in bottled trace-element mixes that add it whether the soil needs it or not. The gap between too little and too much is narrower for boron than for any other nutrient here, so a mix used on a hunch can poison the bed for seasons.',
    caution: 'Measure, and never repeat it on a hunch.',
    sources: [RHS_DEFICIENCIES, GO_COMPOST, pubmed('boron deficiency vegetable crops')],
  },
  {
    key: 'Cu',
    name: 'Copper',
    showsOn: 'newer',
    role: 'Enzymes, and the strength of plant tissue.',
    looks: 'Young leaves wilt, twist or turn pale and bluish, and shoot tips die back.',
    causes: 'Rare in gardens. Peaty soils and very sandy ones.',
    withTheSoil: 'Compost, which carries copper in amounts plants can use and soil life can handle.',
    whyNotChemical: 'Copper sulphate and copper fungicide sprays add far more than a plant needs. Copper builds up in soil and harms earthworms, so a garden sprayed with copper for years is more likely to have too much than too little.',
    caution: 'Test before adding copper from any source.',
    sources: [GO_EARTHWORMS, pubmed('copper deficiency plants symptoms')],
  },
  {
    key: 'Mo',
    name: 'Molybdenum',
    showsOn: 'older',
    role: 'Lets a plant use the nitrogen it takes up, and lets peas and beans fix nitrogen from the air.',
    looks: 'In cauliflower and broccoli, whiptail: new leaves narrow to little more than the midrib. Other crops go pale and their leaf edges curl.',
    causes: 'Acid soil. Molybdenum is the one nutrient that becomes harder to get as soil grows more acid, the reverse of iron and manganese.',
    withTheSoil: 'Lime an acid soil to around pH 6.5 before brassicas, which also discourages clubroot. Compost buffers the pH from year to year.',
    whyNotChemical: 'Sodium molybdate is sold in tiny doses and does work, but liming fixes the cause and usually cures it on its own, so the bottle is rarely needed.',
    caution: 'Lime first and check again before adding anything else.',
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
    body: 'Sulphur chips or powder, which soil bacteria turn to acid slowly over months, and mulches of pine needles or leafmould. On chalk or limestone the rock underneath keeps pushing the pH back up, so plants that need acid soil (blueberries, most citrus in the ground) are easier grown in containers of peat-free ericaceous compost watered with rainwater.',
  },
  {
    heading: 'Working with the soil',
    body: 'Compost and other organic matter buffer pH in both directions, hold nutrients where roots can reach them, and feed the soil life that releases nutrients as plants need them. Adding organic matter every year does more for most gardens than any single bottle.',
  },
];

export const SOIL_GUIDE_SOURCES: GuideSource[] = [RHS_PH, RHS_LIME, RHS_ACID, RHS_ORGANIC_MATTER, UF_SOIL_PH];

// Living soil, compost and Korean Natural Farming, as one account a reader
// can open from any crop. Every problem in lib/cropProblems.ts leads with
// a fix drawn from here.
export const LIVING_SOIL_GUIDE: { heading: string; body: string }[] = [
  {
    heading: 'Why living soil',
    body: 'A spoonful of healthy soil holds more living things than there are people on Earth: bacteria, fungi, protozoa, mites and worms. They break down dead matter into the nutrients roots take up, hand minerals to roots in exchange for sugar, hold water, and crowd out many root diseases. Feed that life and it feeds the plants, year after year, without anything being bought.',
  },
  {
    heading: 'Compost',
    body: 'Roughly equal volumes of green material (kitchen scraps, fresh weeds, grass) and brown material (dry leaves, straw, cardboard), kept as damp as a wrung-out sponge and turned now and then, become compost in a few months to a year. Spread 2 to 5 cm on the surface every year and let the worms take it down. Leafmould, made from autumn leaves alone, is the best mulch for acid-loving plants.',
  },
  {
    heading: 'No-dig and mulch',
    body: 'Digging breaks up the fungal threads and worm tunnels that soil life takes years to build. Laying compost on top, and planting into it, keeps them. Keep the soil covered with mulch or plants at all times: bare soil dries, crusts and washes away.',
  },
  {
    heading: 'Cover crops and green manures',
    body: 'Clover, vetch, field beans and other legumes sown after a harvest fix nitrogen from the air through the bacteria on their roots; rye and phacelia hold nutrients the winter rain would wash out. Cut them before they set seed and leave them on the surface, or under a sheet, to feed the soil.',
  },
  {
    heading: 'Comfrey and nettle feeds',
    body: 'Comfrey leaves steeped in water for a few weeks make a feed rich in potassium for fruiting crops; nettles make one richer in nitrogen for leafy crops. Dilute about 1 to 10 before watering on. The Bocking 14 comfrey does not seed, so it stays where it is planted.',
  },
  {
    heading: 'Korean Natural Farming',
    body: 'A system from South Korea, developed by Cho Han-kyu, that makes its own inputs from local materials: the soil life from a nearby forest, fermented plants and fruit, fish, eggshells, bones and seawater. The idea is to multiply the microbes already adapted to a place and feed plants what they need at each stage of growth, using almost nothing bought.',
  },
  {
    heading: 'IMO: indigenous microorganisms',
    body: 'Cooked rice left in a box under leaf litter in a nearby wood for a few days gathers the local fungi and bacteria as white mould. That is mixed with brown sugar, then multiplied on rice bran or wheat bran and finally mixed with soil, and spread on beds as a living inoculant.',
  },
  {
    heading: 'FPJ and FFJ: fermented plant and fruit juice',
    body: 'Fast-growing plant tips (for FPJ) or ripe fruit (for FFJ) are layered with an equal weight of brown sugar for about a week, and the liquid drawn off. FPJ is watered on diluted about 1 to 500 to 1 to 1,000 during leafy growth; FFJ at a similar dilution during flowering and fruiting.',
  },
  {
    heading: 'FAA: fish amino acid',
    body: 'Fish heads, guts and bones fermented with an equal weight of brown sugar for several weeks give a nitrogen-rich liquid, used at about 1 to 1,000. Of all the Korean Natural Farming inputs it has the clearest nutrient content.',
  },
  {
    heading: 'WCA and WCA-P: water-soluble calcium',
    body: 'Eggshells, toasted until they brown, soaked in brown rice vinegar until they stop fizzing (WCA). Bones charred and soaked the same way give calcium with phosphorus (WCA-P). Both are used at about 1 to 1,000 when fruit is setting.',
  },
  {
    heading: 'LAB and OHN',
    body: 'Lactic acid bacteria (LAB) come from the water rice was rinsed in, left to sour, then fed with milk; the clear serum is used diluted to improve soil and compost. Oriental herbal nutrient (OHN) is an extract of garlic, ginger, cinnamon, liquorice and angelica root in alcohol, used as a plant tonic.',
  },
  {
    heading: 'How strong the evidence is',
    body: 'Compost, mulch, cover crops and no-dig rest on decades of field trials. Korean Natural Farming rests mostly on the experience of the farmers who use it, plus a small number of trials, many from the University of Hawaii, that found some inputs supply measurable nutrients and microbes while others are hard to tell apart from water in a trial. That is reason to try it carefully, keep notes, and judge by the results in your beds, not to expect a miracle.',
  },
  {
    heading: 'Why not synthetic fertiliser',
    body: 'Bagged fertilisers feed the plant directly as soluble salts and leave the soil life that would have fed it with nothing to do. Over years that life declines, the soil holds less water and fewer nutrients, and the garden depends on the bag. Much of what is spread washes into streams, and making nitrogen fertiliser uses large amounts of fossil gas. They work fast, which is their appeal; what they cost is the soil.',
  },
  {
    heading: 'Why not pesticides and fungicides',
    body: 'A spray that kills a pest kills the ladybirds, hoverflies, ground beetles and parasitic wasps that were eating it, so the pest comes back faster than its predators. Fungicides harm the fungi roots depend on as well as the one they target, and several garden chemicals linger in soil and water. Healthy soil, the right plant in the right place, crop rotation, netting and encouraging predators prevent most problems a spray is bought for.',
  },
];

export const LIVING_SOIL_SOURCES: GuideSource[] = [
  GO_COMPOST,
  GO_NO_DIG,
  GO_GREEN_MANURES,
  GO_COMFREY,
  GO_LIQUID_FEEDS,
  GO_MYCORRHIZAE,
  GO_SOIL_HEALTH,
  GO_PESTICIDES,
  RHS_COMPOSTING,
  KNF_IMO,
  KNF_FPJ,
  KNF_FAA,
  KNF_WCA,
  KNF_LAB,
  KNF_OHN,
  KNF_SEAWATER,
  KNF_BACTERIA,
  CTAHR_LOCAL_INPUTS,
  { label: 'PubMed: Korean Natural Farming research', url: pubmedSearchUrl('Korean natural farming') },
  { label: 'PubMed: compost and soil microbial life', url: pubmedSearchUrl('compost soil microbial community vegetable') },
];

// Where a person can ask someone about their own garden. Services and
// organisations, not shops.
export const WHERE_TO_ASK: { heading: string; body: string; url: string }[] = [
  {
    heading: 'Ask Extension',
    body: 'Free questions answered by university extension staff and Master Gardener volunteers across the United States. Attach a photo of the plant.',
    url: 'https://ask.extension.org/',
  },
  {
    heading: 'Garden Organic',
    body: 'The UK charity for organic growing, with guides to every common crop, a composting advice service, and members who can ask its experts.',
    url: 'https://www.gardenorganic.org.uk/',
  },
  {
    heading: 'Composting help from Garden Organic',
    body: 'Practical help with a compost heap that is too wet, too slow or smells, from trained volunteers.',
    url: 'https://www.gardenorganic.org.uk/expert-advice/garden-management/composting/get-hands-on-composting-advice',
  },
  {
    heading: 'ATTRA, sustainable agriculture',
    body: 'The US National Center for Appropriate Technology answers questions on organic and sustainable growing, free, by phone or online.',
    url: 'https://attra.ncat.org/',
  },
  {
    heading: 'University of Hawaii Sustainable and Organic Agriculture Program',
    body: 'The main university source for Korean Natural Farming, with free guides to every input and the trials behind them.',
    url: 'https://cms.ctahr.hawaii.edu/soap/Resources/Local-Fertilizers',
  },
  {
    heading: 'Soil Association',
    body: 'The UK organic certifier, with advice on soil health and farming without synthetic inputs.',
    url: 'https://www.soilassociation.org/',
  },
  {
    heading: 'Composting at home, US EPA',
    body: 'A plain guide to what goes in a home compost pile and what stays out.',
    url: 'https://www.epa.gov/recycle/composting-home',
  },
];
