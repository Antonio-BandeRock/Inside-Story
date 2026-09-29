// What is wrong with a plant, crop by crop: sweetcorn, asparagus, celery,
// globe artichoke, okra, sweet potato, melon, rhubarb, Jerusalem artichoke,
// kohlrabi, pak choi and rocket, the vegetables of batch 4 (I26, 2026-09-29). Gathered by
// lib/cropSigns.ts, which explains the rules every sign here follows: each
// cites a page about that crop, a sign no source for the crop describes is
// left out rather than borrowed, and the fixes are put right from the soil
// and name no bag or bottle.
//
// Asparagus carries no nutrient shortage sign, because none of the pages
// found describes one on asparagus. What they do describe is acid soil and
// phosphorus that has to be put deep before planting, which is where the
// asparagus signs start.
//
// Pure: no React and no database.

import type { CropConfirm, CropSign } from './cropSignTypes';
import type { GuideSource } from './plantNutrients';

const umn = (crop: string, cropName: string) => (page: string, what: string): GuideSource => ({
  label: `University of Minnesota: What is wrong with my ${cropName}? ${what}`,
  url: `https://apps.extension.umn.edu/garden/diagnose/plant/vegetable/${crop}/${page}.html`,
});
const umnCorn = umn('corn', 'sweet corn');
const umnAsparagus = umn('asparagus', 'asparagus');

const nev = (slug: string, name: string): GuideSource => ({
  label: `UMass New England Vegetable Management Guide: ${name}`,
  url: `https://nevegetable.org/crops/${slug}`,
});
const rhs = (path: string, name: string): GuideSource => ({
  label: `RHS: How to grow ${name}`,
  url: `https://www.rhs.org.uk/${path}/grow-your-own`,
});

const NEV_CORN = nev('corn-sweet', 'Sweet corn');
const NEV_ASPARAGUS = nev('asparagus', 'Asparagus');
const RHS_SWEETCORN = rhs('vegetables/sweetcorn', 'sweetcorn');
const RHS_ASPARAGUS = rhs('vegetables/asparagus', 'asparagus');

const nevPage = (path: string, name: string): GuideSource => ({
  label: `UMass New England Vegetable Management Guide: ${name}`,
  url: `https://nevegetable.org/${path}`,
});

const NEV_CELERY = nev('celery-and-celeriac', 'Celery and celeriac');
const NEV_CELERY_DISEASE = nevPage('crops/celery-celeriac/disease-control', 'Celery and celeriac disease control');
const NEV_CELERY_INSECT = nevPage('crops/celery-celeriac/insect-control', 'Celery and celeriac insect control');
const NEV_CELERY_DISORDERS = nevPage('book/crops/celery-and-celeriac/celery-and-celeriac-physiological-disorders', 'Celery and celeriac physiological disorders');
const RHS_CELERY = rhs('vegetables/celery', 'celery');

const NEV_ARTICHOKE = nev('globe-artichoke', 'Globe artichoke');
const NEV_ARTICHOKE_DISEASE = nevPage('crops/globe-artichoke/disease-control', 'Globe artichoke disease control');
const NEV_ARTICHOKE_INSECT = nevPage('crops/globe-artichoke/insect-control', 'Globe artichoke insect control');
const RHS_ARTICHOKE = rhs('vegetables/globe-artichokes', 'globe artichokes');

const NEV_OKRA = nev('okra', 'Okra');
const NEV_OKRA_DISEASE = nevPage('crops/okra/disease-control', 'Okra disease control');
const NEV_OKRA_INSECT = nevPage('crops/okra/insect-control', 'Okra insect control');
const RHS_OKRA = rhs('vegetables/okra', 'okra');

const NEV_SWEETPOTATO = nev('sweet-potato', 'Sweet potato');
const NEV_SWEETPOTATO_DISEASE = nevPage('crops/sweet-potato/disease-control', 'Sweet potato disease control');
const NEV_SWEETPOTATO_INSECT = nevPage('crops/sweet-potato/insect-control', 'Sweet potato insect control');
const RHS_SWEETPOTATO = rhs('vegetables/sweet-potatoes', 'sweet potatoes');

const NEV_RHUBARB = nev('rhubarb', 'Rhubarb');
const RHS_RHUBARB = rhs('vegetables/rhubarb', 'rhubarb');
const RHS_VIRUSES: GuideSource = { label: 'RHS: Plant viruses', url: 'https://www.rhs.org.uk/disease/plant-viruses' };

const RHS_JERUSALEM = rhs('vegetables/jerusalem-artichokes', 'Jerusalem artichokes');
const RHS_SCLEROTINIA: GuideSource = { label: 'RHS: Sclerotinia disease', url: 'https://www.rhs.org.uk/disease/sclerotinia-disease' };
const RHS_SLUGS: GuideSource = { label: 'RHS: Slugs and snails', url: 'https://www.rhs.org.uk/biodiversity/slugs-and-snails' };

const umnMelon = umn('melons', 'melons');
const M_EMERGENCE = umnMelon('seedlingemergence', 'Poor or no emergence');
const M_COLLAPSED = umnMelon('seedlingcollapsed', 'Collapsed seedling');
const M_SEEDLING_HOLES = umnMelon('seedlingholes', 'Holes in seedling leaves');
const M_SPOTS = umnMelon('leavesspots', 'Spots on leaves');
const M_DISCOLOURED = umnMelon('leavesdiscolored', 'Discoloured leaves');
const M_FRUIT_HOLES = umnMelon('fruitholes', 'Holes in fruit');
const M_DEFORMED = umnMelon('fruitdeformed', 'Misshapen, deformed fruit');
const NEV_MELON = nev('cucumber-muskmelon-and-watermelon', 'Cucumber, muskmelon and watermelon');
const NEV_MELON_DISEASE = nevPage('crops/cucumber-muskmelon-and-watermelon/disease-control', 'Cucumber and melon disease control');
const NEV_MELON_INSECT = nevPage('crops/cucumber-muskmelon-and-watermelon/insect-control', 'Cucumber and melon insect control');
const RHS_MELON = rhs('fruit/melons', 'melons');

const NEV_BRASSICA = nev('cabbage-broccoli-cauliflower-and-other-brassica-crops', 'Cabbage, broccoli, cauliflower and other brassica crops');
const NEV_SALAD = nev('salad-mix-and-microgreens', 'Salad mix and microgreens');
const RHS_KOHLRABI = rhs('vegetables/kohl-rabi', 'kohlrabi');
const RHS_PAKCHOI = rhs('vegetables/pak-choi', 'pak choi');
const RHS_ROCKET = rhs('vegetables/rocket', 'rocket');
const RHS_CLUBROOT: GuideSource = { label: 'RHS: Club root', url: 'https://www.rhs.org.uk/disease/club-root' };
const RHS_FLEA_BEETLE: GuideSource = { label: 'RHS: Flea beetles on brassicas and allied plants', url: 'https://www.rhs.org.uk/biodiversity/flea-beetles-on-brassicas-and-allied-plants' };
const RHS_CABBAGE_ROOT_FLY: GuideSource = { label: 'RHS: Cabbage root fly', url: 'https://www.rhs.org.uk/biodiversity/cabbage-root-fly' };
const RHS_CATERPILLARS: GuideSource = { label: 'RHS: Cabbage caterpillars', url: 'https://www.rhs.org.uk/biodiversity/cabbage-caterpillars' };
const RHS_MEALY_APHID: GuideSource = { label: 'RHS: Mealy cabbage aphid', url: 'https://www.rhs.org.uk/biodiversity/mealy-cabbage-aphid' };
const RHS_PIGEONS: GuideSource = { label: 'RHS: Pigeons', url: 'https://www.rhs.org.uk/biodiversity/pigeons' };

const C_EMERGENCE = umnCorn('poornoemergence', 'Poor or no emergence');
const C_CUT = umnCorn('plantcutatbase', 'Plant cut at base');
const C_STUNTED = umnCorn('plantstunted', 'Stunted plant');
const C_FALLEN = umnCorn('plantfallenover', 'Plant fallen over');
const C_POOR_FILL = umnCorn('kernalpoorfill', 'Poor kernel fill');
const C_EAR_GROWTH = umnCorn('earunusualgrowth', 'Unusual growth on the ear');
const C_KERNELS = umnCorn('kernalschewingdamage', 'Chewing damage on kernels');
const C_DISTORTED = umnCorn('leavesdeformeddistorted', 'Deformed or distorted leaves');
const C_SPOTS = umnCorn('leavesspotsstreaks', 'Spots or streaks on leaves');
const C_DISCOLOURED = umnCorn('leavesdiscolored', 'Discoloured leaves');

const A_DEFORMED = umnAsparagus('speardeformed', 'Deformed spear');
const A_CUT = umnAsparagus('spearcutatbase', 'Spear cut at base');
const A_SPOTS = umnAsparagus('spearspots', 'Spots on spear');
const A_FERN = umnAsparagus('ferndiscolored', 'Discoloured fern');
const A_CHEWED = umnAsparagus('fernschewed', 'Ferns chewed');
const A_STUNTED = umnAsparagus('plantstunted', 'Stunted plant');

export const MORE_VEGETABLE_SIGNS: Record<string, CropSign[]> = {
  sweetcorn: [
    {
      kind: 'short',
      nutrient: 'N',
      label: 'Nitrogen shortage',
      where: ['yo', 'st'],
      looks: 'The whole plant is pale green and stunted, and the lower leaves yellow in a V that runs from the leaf tip back along the middle. Those leaves may go brown and die.',
      fix: 'Dig in well-rotted compost or manure before planting, or grow sweetcorn after beans, peas or a clover green manure, which leaves less nitrogen to find. Keep a mulch of compost over the soil as the plants grow.',
      sources: [C_STUNTED, C_DISCOLOURED, NEV_CORN],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus shortage',
      where: ['pu', 'st'],
      looks: 'The leaves are narrow with a bluish tint, and the tips of the upper leaves turn purple.',
      why: 'More common after a cold, wet spring, when cold soil holds phosphorus back from young roots, and on early sowings in cold soil.',
      fix: 'Sow or plant out only once the soil has warmed, warm it first under a cloche, and keep the soil well fed with compost, which holds phosphorus where roots can reach it. The purple often goes once the soil warms.',
      sources: [C_STUNTED, NEV_CORN, RHS_SWEETCORN],
    },
    {
      kind: 'short',
      nutrient: 'K',
      label: 'Potassium shortage',
      where: ['yo', 'ed'],
      looks: 'The lower leaves yellow starting at the tip, and the leaf edges go brown.',
      fix: 'Add compost or well-rotted manure every year and keep the soil mulched, which holds potassium, and return the stalks to the compost heap or the soil after harvest.',
      sources: [C_STUNTED, C_DISCOLOURED, NEV_CORN],
    },
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'Growth is slow and uneven and the plants never look as green or strong as they should, with no clear pattern on the leaves.',
      fix: 'Test the soil and lime only as the test says, to hold the pH between 6.5 and 6.8.',
      sources: [NEV_CORN],
    },
    {
      kind: 'water',
      label: 'Dry soil at silking and as the cobs swell',
      where: ['ha', 'wi'],
      looks: 'The leaves roll and go dull grey green in the heat of the day, and the cobs that follow are small, short or badly filled.',
      why: 'Sweetcorn needs the most water as the silks appear and as the cobs swell, and light soils dry fastest.',
      fix: 'Water deeply in dry spells, above all once the tassels and silks appear and as the cobs swell, and mulch with compost to hold the water in. Build organic matter up year by year so the soil holds more.',
      sources: [RHS_SWEETCORN, NEV_CORN],
    },
    {
      kind: 'mimic',
      label: 'Cold soil at sowing',
      where: ['ot', 'st'],
      looks: 'Few or no seedlings come up, and those that do sit still for weeks.',
      why: 'Below 65°F (18°C) in the soil, and worst with supersweet varieties, whose seed comes up poorly in cold, wet soil. The RHS gives 10°C (50°F) as the least the seed needs.',
      fix: 'Wait for warm soil, warm it under a cloche first, or sow in pots indoors and plant out after the last frost once the plants are hardened off.',
      sources: [C_EMERGENCE, NEV_CORN, RHS_SWEETCORN],
    },
    {
      kind: 'mimic',
      label: 'Poor pollination',
      where: ['ha', 'fl'],
      looks: 'The cobs have gaps where kernels are missing, from a few open patches to a cob with almost no kernels.',
      why: 'Sweetcorn is pollinated by the wind, so a single long row or too few plants leaves the silks short of pollen. Extreme heat at pollination does the same.',
      fix: 'Plant in a block of short rows, not one long row, and tap the stems once the tassels open to shake the pollen down onto the silks.',
      sources: [C_POOR_FILL, RHS_SWEETCORN],
    },
    {
      kind: 'mimic',
      label: 'Plants too close',
      where: ['ha', 'st'],
      looks: 'The cobs are small, and some stalks grow no cob at all.',
      fix: 'Give early varieties 8 to 10 inches (20 to 25 cm) and main-season varieties 10 to 12 inches (25 to 30 cm) in the row.',
      sources: [NEV_CORN],
    },
    {
      kind: 'mimic',
      label: 'Supersweet crossed with another variety',
      where: ['ha', 'ot'],
      looks: 'The cobs are starchy and not as sweet as they should be, though they look normal.',
      fix: 'Keep supersweet varieties well apart from other sweetcorn, or sow them so they flower at a different time.',
      sources: [RHS_SWEETCORN, NEV_CORN],
    },
    {
      kind: 'mimic',
      label: 'Dwarf mosaic and chlorotic dwarf viruses',
      where: ['sp', 'st', 'ha'],
      looks: 'The leaves are mottled or streaked light and dark green, the plant is stunted and may grow many side shoots, and it grows a poor cob or none.',
      fix: 'There is no cure, so pull the plant and bin it, and grow a variety bred to resist the viruses where they come back.',
      sources: [C_STUNTED, C_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Stewart’s wilt',
      where: ['sp', 'wi', 'ed'],
      looks: 'Pale green to yellow streaks with wavy edges run along the leaf veins, older leaves scorch brown at the edges, and a cut stalk oozes yellow slime. A plant hit early wilts and may die.',
      fix: 'There is no cure, so pull the plant. It is rare in cold-winter gardens such as Minnesota, and a resistant variety is the answer where it comes back.',
      sources: [C_STUNTED, C_DISCOLOURED],
    },
    {
      kind: 'mimic',
      label: 'Corn smut',
      where: ['ha', 'cu'],
      looks: 'Kernels swell into large pale green to silvery galls up to five inches across that turn purplish black and burst into black powder, with firm bumps on the leaves, stems and tassels.',
      fix: 'Cut the galls off before they burst and bin them, not the compost heap, and grow sweetcorn on other ground next year.',
      sources: [C_EAR_GROWTH, RHS_SWEETCORN],
    },
    {
      kind: 'mimic',
      label: 'Common rust',
      where: ['sp'],
      looks: 'Long rusty orange brown streaks on the leaves, whose powdery spores rub off on the hands. The streaks turn black at the end of the season.',
      fix: 'Grow a resistant variety, give the plants room for air to move, and clear the old stalks away after harvest.',
      sources: [C_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Leaf blights and leaf spots',
      where: ['sp', 'yo'],
      looks: 'Tan ovals with a brown edge that grow into long streaks (anthracnose), cigar-shaped grey green to tan spots one to six inches long (northern leaf blight), narrow rectangular tan to grey spots (grey leaf spot), or small round spots with a yellow halo (eye spot), all starting on the lower leaves and working up.',
      why: 'Warm, wet weather, and ground where sweetcorn has grown several years running, since the diseases live on in the old stalks.',
      fix: 'Grow sweetcorn on other ground each year, dig the old stalks in or compost them hot, and grow a resistant variety.',
      sources: [C_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Borers and rootworms',
      where: ['ro', 'wi', 'ho'],
      looks: 'Small shot holes in the leaves and holes in the stalk with brown frass coming out (corn borer), or plants that lean or fall over because grubs have eaten the roots (rootworm), whose beetles eat the silks and leave the cobs short of kernels.',
      fix: 'Grow sweetcorn on other ground each year, since rootworm grubs hatch where the last crop grew, and clear the old stalks away, where borers spend the winter.',
      sources: [C_FALLEN, C_POOR_FILL, C_KERNELS],
    },
    {
      kind: 'mimic',
      label: 'Earworms and sap beetles in the cob',
      where: ['ha', 'ho'],
      looks: 'Kernels eaten at the tip of the cob by a striped caterpillar (earworm), or single kernels hollowed out with small dark beetles and grubs in the tip (sap beetles).',
      fix: 'Pick the cobs as soon as they are ripe, never leave damaged or overripe cobs in the bed, and cut the eaten tip off at harvest.',
      sources: [C_KERNELS],
    },
    {
      kind: 'mimic',
      label: 'Aphids',
      where: ['cu', 'yo', 'ho'],
      looks: 'Crowds of small blue green to grey insects on the tassels, sticky shiny honeydew, and curled or yellowed leaves.',
      fix: 'Leave them to ladybirds, lacewings and hoverflies, and grow flowers near the bed for them. A strong spray of water knocks a colony off.',
      sources: [C_DISTORTED, C_DISCOLOURED],
    },
    {
      kind: 'mimic',
      label: 'Seed rot, seed maggots and damping off',
      where: ['ot', 'ro', 'wi'],
      looks: 'The seed rots in the ground or white maggots eat it, or the seedlings come up pale and stunted with dark sunken spots on the stem and wilt.',
      why: 'All of them are worst in cold, wet soil early in the season.',
      fix: 'Sow only into warm soil, or raise the plants in pots indoors.',
      sources: [C_EMERGENCE, RHS_SWEETCORN],
    },
    {
      kind: 'mimic',
      label: 'Cutworms, slugs and snails',
      where: ['ro', 'ho'],
      looks: 'Young plants chewed through at the soil in spring, or leaves shredded and slime trails on young plants.',
      fix: 'Put a card collar round each young plant, go out at dusk to pick slugs off, and raise plants indoors so they go out big enough to cope.',
      sources: [C_CUT, RHS_SWEETCORN],
    },
    {
      kind: 'mimic',
      label: 'Birds, mice, squirrels and badgers',
      where: ['ha', 'ot', 'ho'],
      looks: 'Seed dug up after sowing, or ripe cobs torn open and the kernels eaten.',
      fix: 'Sow indoors rather than in the ground, and net the plants as the cobs form, or cover each cob with a bag.',
      sources: [RHS_SWEETCORN],
    },
  ],
  asparagus: [
    {
      kind: 'ph',
      label: 'Soil too acid',
      where: ['st', 'yo'],
      looks: 'The spears come up thin and few, and the fern stays weak, with nothing on it to point anywhere else.',
      why: 'Asparagus does not grow in acid soil, and a bed stands for ten years or more, so the root zone has to be right from the start.',
      fix: 'Test the soil the year before planting and lime as the test says, worked in deep to where the crowns will sit, for a pH of 6.8 to 7.0.',
      sources: [NEV_ASPARAGUS],
    },
    {
      kind: 'short',
      nutrient: 'P',
      label: 'Phosphorus left at the surface',
      where: ['st'],
      looks: 'The bed is slow to build up and the spears stay thin, with no marks on the fern.',
      why: 'Phosphorus hardly moves in the soil, so what is spread on top of a planted bed seldom reaches the roots.',
      fix: 'Work compost, and anything the soil test says is lacking, deep into the whole root zone before the crowns go in, and mulch with compost every year after.',
      sources: [NEV_ASPARAGUS, RHS_ASPARAGUS],
    },
    {
      kind: 'water',
      label: 'Waterlogged or dry soil',
      where: ['ro', 'st'],
      looks: 'Crowns rot in wet ground, or a new bed puts up little fern in its first summer.',
      fix: 'Grow asparagus in free-draining soil, on a raised bed where the ground is heavy. Water new plants through their first summer; an established bed only needs it in long dry spells.',
      sources: [RHS_ASPARAGUS, NEV_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Late frost on the spears',
      where: ['cu', 'ha'],
      looks: 'The spears that were up turn soft, bent or brown after a cold night in spring.',
      fix: 'Plant the bed where frost does not settle, and cut spears that were caught so the next ones come through.',
      sources: [NEV_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Asparagus beetles',
      where: ['cu', 'ho'],
      looks: 'Spears bent over into a shepherd’s crook, and the fern stripped by blue black beetles with six cream spots and their slug-like grey grubs with black heads. The red orange beetle with twelve black spots feeds on the berries.',
      fix: 'Pick the beetles, grubs and eggs off every few days from spring, and cut down and remove the old fern in late autumn, where the beetles spend the winter.',
      sources: [A_DEFORMED, A_CHEWED, NEV_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Phytophthora crown and spear rot',
      where: ['ro', 'cu', 'wi'],
      looks: 'A soft, dark, water-soaked patch at the soil on the spear, which curls over that side and collapses, slimy and smelling bad, with water-soaked spots on the roots.',
      fix: 'Grow only in free-draining soil, raise the bed where water lies, and never replant where it has struck.',
      sources: [A_DEFORMED, A_SPOTS],
    },
    {
      kind: 'mimic',
      label: 'Fusarium crown and root rot',
      where: ['yo', 'st', 'ro'],
      looks: 'A few yellow, stunted shoots scattered through the bed, reddish brown marks on the lower stems and roots, and a crown gone dry and brown inside.',
      why: 'A soil fungus that stays where asparagus grew before, worst on plants stressed by drought or in low ground.',
      fix: 'Never plant a new bed where asparagus grew before, grow an all-male variety bred to tolerate fusarium, and keep the plants unstressed with steady water and weeding in the first two seasons.',
      sources: [A_STUNTED, A_FERN, NEV_ASPARAGUS, RHS_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Rust',
      where: ['sp', 'yo'],
      looks: 'Pale orange ovals on the lower fern stems in spring, then reddish brown powdery spots in summer that rub off on the hands, and the fern dies early.',
      fix: 'Cut down and remove the old fern in late autumn, give the plants room for air to move, and grow a variety bred to resist it.',
      sources: [A_FERN, NEV_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Purple spot and cercospora leaf spot',
      where: ['sp', 'yo'],
      looks: 'Small sunken purple ovals on the spears and fern that grow a brown centre (purple spot), or oval tan to grey spots with a reddish brown edge, the fern browning from the bottom up (cercospora).',
      why: 'Purple spot is common on exposed sandy sites, and cercospora is worst once the plants crowd each other. Losing the fern early means fewer spears next year.',
      fix: 'Cut down and remove the old fern in late autumn, space the crowns so air moves between them, and keep weeds out of the bed.',
      sources: [A_SPOTS, A_FERN, NEV_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Aphids and witch’s broom',
      where: ['cu', 'st', 'ho'],
      looks: 'The fern grows short and bushy like a broom, with small pale green powdery insects on it, and young plants may die.',
      fix: 'Leave them to ladybirds and hoverflies, and grow flowers near the bed for them.',
      sources: [A_DEFORMED],
    },
    {
      kind: 'mimic',
      label: 'Cutworms, slugs and snails',
      where: ['ro', 'ho'],
      looks: 'Spears chewed through near the soil in spring and summer, or seedlings eaten.',
      fix: 'Keep the bed clear of weeds where they hide, and go out at dusk to pick slugs and cutworms off.',
      sources: [A_CUT, RHS_ASPARAGUS],
    },
    {
      kind: 'mimic',
      label: 'Weeds and cutting too soon',
      where: ['st'],
      looks: 'Thin spears and a bed that never builds up.',
      why: 'Weeds late in the season hold the crowns back, and cutting before the plants have built up weakens them.',
      fix: 'Keep the bed weeded, above all in the first two seasons, mulch with compost each late winter, and wait for the bed to settle in before cutting.',
      sources: [NEV_ASPARAGUS, RHS_ASPARAGUS],
    },
  ],
  celery: [
    {
      kind: 'short',
      nutrient: 'Mg',
      label: 'Magnesium shortage',
      where: ['yo'],
      looks: 'The older leaves yellow between the veins while the veins stay green.',
      why: 'Celery is a heavy feeder and more prone to magnesium shortage than most vegetables.',
      fix: 'Test the soil, and where it is acid and low in magnesium, lime it with dolomitic limestone, which carries magnesium, the autumn before. Dig in plenty of well-rotted compost or manure before planting.',
      sources: [NEV_CELERY],
    },
    {
      kind: 'short',
      nutrient: 'Ca',
      label: 'Blackheart (calcium not reaching the heart)',
      where: ['cu', 'ro'],
      looks: 'The growing points of the innermost stalks, the heart, go brown and die. If it goes on, the whole crown can be lost in a few days.',
      why: 'Calcium not reaching the heart because the water supply is uneven, rather than a soil short of calcium. It is the celery form of tipburn.',
      fix: 'Keep the soil evenly moist all the way through, with drip or a soaker hose and a thick mulch of compost, and never let it dry out and then flood. Keep the pH in range so calcium stays free.',
      sources: [NEV_CELERY_DISORDERS, NEV_CELERY],
    },
    {
      kind: 'short',
      nutrient: 'B',
      label: 'Boron shortage (brown checking)',
      where: ['ha', 'ed'],
      looks: 'Brown, cross-cracked checks and russeting along the inside of the stalks.',
      why: 'Most likely where boron is low and potassium high, above all on peaty, very organic soils.',
      fix: 'Confirm it with a leaf test first, since boron is harmful in excess. Keep plenty of compost in the soil, which holds boron, and do not pile on potash-rich material such as wood ash.',
      sources: [NEV_CELERY],
    },
    {
      kind: 'ph',
      label: 'Soil pH out of range',
      where: ['yo', 'st'],
      looks: 'Slow, pale plants on acid soil, and the magnesium and calcium signs above showing first.',
      why: 'Celery grows best at pH 6.0 to 6.8.',
      fix: 'Test the pH, and where it is too acid, lime the autumn before planting as the test says, with dolomitic lime where magnesium is low too.',
      sources: [NEV_CELERY],
    },
    {
      kind: 'water',
      label: 'Dry soil',
      where: ['ha', 'st', 'ot'],
      looks: 'Stalks that stay thin, turn stringy and taste strong.',
      why: 'Celery needs soil that never dries out. Once it does, the stalks do not swell.',
      fix: 'Grow it in soil made moisture-retentive with plenty of compost, mulch it, and water steadily in dry weather, about the same amount every few days.',
      sources: [RHS_CELERY, NEV_CELERY],
    },
    {
      kind: 'mimic',
      label: 'Bolting after cold',
      where: ['bo'],
      looks: 'The plants send up a flowering stem before the stalks are ready.',
      why: 'Chilling sets it off: more than about a week below 13°C (55°F), or young plants kept below 10°C.',
      fix: 'Plant out only once nights stay warm, cover young plants with fleece, and grow a bolt-resistant variety.',
      sources: [RHS_CELERY, NEV_CELERY],
    },
    {
      kind: 'mimic',
      label: 'Early and late blight (leaf spots)',
      where: ['sp', 'yo'],
      looks: 'Small yellow spots seen from both sides of the leaf that go papery and tear, with grey fuzz in damp weather (early blight), or similar spots with tiny dark dots in their centres (late blight, celery leaf spot).',
      why: 'Both come in on the seed and live on old leaves, and spread in wet weather and on hands working among wet plants.',
      fix: 'Grow a variety bred to resist leaf spot, water at the soil rather than over the leaves, keep out of the plants while they are wet, and clear the old leaves away at the end of the season.',
      sources: [NEV_CELERY_DISEASE, RHS_CELERY],
    },
    {
      kind: 'mimic',
      label: 'Fusarium yellows',
      where: ['yo', 'st', 'wi'],
      looks: 'The outer leaves yellow, the plant stays stunted and may die.',
      why: 'A soil fungus that stays in the ground almost indefinitely.',
      fix: 'Grow a resistant variety, and move celery to fresh ground, with at least two years of onion or lettuce between.',
      sources: [NEV_CELERY_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Crater rot and pink rot',
      where: ['ro', 'ha'],
      looks: 'Reddish brown sunken patches on the stalks at soil level (crater rot), or stalk patches that turn brown, then soft, slimy and pink, with white mould or small black bodies on them (pink rot).',
      fix: 'Rotate so celery comes back to a bed no sooner than every other year, do not grow it straight after alfalfa or other legume cover crops, and space the plants so the base dries.',
      sources: [NEV_CELERY_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Celery leaf miner',
      where: ['ed', 'sp'],
      looks: 'Pale blotches in the leaves that dry up and leave the foliage looking scorched, with small grubs inside.',
      fix: 'Pinch off mined leaves as soon as they show, and cover the plants with fine mesh from planting.',
      sources: [RHS_CELERY, NEV_CELERY_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Tarnished plant bug',
      where: ['cu', 'ha'],
      looks: 'Sunken marks on the stalks and a damaged heart that looks like blackheart.',
      fix: 'Keep weeds and rough grass mown down near the bed, where the bugs breed, and cover young plants with fine mesh.',
      sources: [NEV_CELERY_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Holes in the stalks and leaves, most after damp nights.',
      fix: 'Go out at dusk to pick them off, keep the edges of the bed clear, and welcome the frogs, birds and ground beetles that eat them.',
      sources: [RHS_CELERY, NEV_CELERY_INSECT],
    },
  ],
  globeartichoke: [
    {
      kind: 'ph',
      label: 'Soil pH or ground out of range',
      where: ['st'],
      looks: 'Small plants and few buds.',
      why: 'Globe artichokes grow best at pH 6.5 to 7.0 on deep, fertile soil that drains well, and do poorly on light soils that hold little water.',
      fix: 'Test the pH and lime as it says, and dig in plenty of well-rotted compost or manure before planting to hold water in light soil and open heavy soil.',
      sources: [NEV_ARTICHOKE],
    },
    {
      kind: 'water',
      label: 'Dry soil and heat',
      where: ['ha', 'st'],
      looks: 'Small buds that go tough, and purple varieties turning bronze.',
      why: 'Artichokes do best in cool weather with steady water.',
      fix: 'Mulch with straw or compost to keep the soil cool and moist, and water steadily in dry spells.',
      sources: [NEV_ARTICHOKE],
    },
    {
      kind: 'mimic',
      label: 'No buds in the first year',
      where: ['st', 'ot'],
      looks: 'Big leafy plants that never form buds.',
      why: 'The plants need a spell of cold, 2 to 10°C (35 to 50°F) for at least ten days, before they form buds.',
      fix: 'Where plants are grown as annuals, plant them out early enough to have that cool spell, or choose a variety bred to bud in its first year.',
      sources: [NEV_ARTICHOKE],
    },
    {
      kind: 'mimic',
      label: 'Buds left too long',
      where: ['ha'],
      looks: 'Buds that splay open and turn bitter and tough.',
      fix: 'Cut the buds while the scales are still tight, starting with the one at the top of the stem.',
      sources: [NEV_ARTICHOKE],
    },
    {
      kind: 'mimic',
      label: 'Frost damage',
      where: ['ed', 'wi'],
      looks: 'Leaves and crowns blackened and collapsed after a hard frost.',
      why: 'Artichokes are not reliably hardy in cold places.',
      fix: 'Mulch the crowns thickly with straw or compost in late autumn, and cover them with fleece in hard frost.',
      sources: [RHS_ARTICHOKE, NEV_ARTICHOKE],
    },
    {
      kind: 'mimic',
      label: 'Grey mould on the buds',
      where: ['sp', 'ha'],
      looks: 'Sunken brown or black patches on the bud scales with grey fuzz on them.',
      fix: 'Space the plants further apart so air moves, and take off and remove affected buds.',
      sources: [NEV_ARTICHOKE_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Verticillium wilt',
      where: ['wi', 'yo', 'st'],
      looks: 'Wilting on one side, yellowing and stunting, with a dark stain inside the lower stem.',
      why: 'The same soil fungus as in strawberry and lettuce, and it stays in the ground.',
      fix: 'Do not follow or rotate artichokes with strawberries or lettuce, and plant new offsets from healthy plants into fresh ground.',
      sources: [NEV_ARTICHOKE_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Aphids',
      where: ['cu', 'ho'],
      looks: 'Clusters of small insects on the undersides of the leaves and on the buds, with sticky leaves below.',
      fix: 'Leave them to ladybirds, hoverflies and lacewings, grow flowers nearby for them, and rub off heavy clusters.',
      sources: [RHS_ARTICHOKE, NEV_ARTICHOKE_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Plant bugs and thrips',
      where: ['cu', 'ha'],
      looks: 'Buds bent like a claw (stink bugs), small holes with dark spots and streaks at the base of the bud (tarnished plant bug), or twisted, curled leaves and deformed scales (thrips).',
      fix: 'Keep rough grass and weeds near the bed mown down, and cover young plants with fine mesh.',
      sources: [NEV_ARTICHOKE_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Holes in young leaves and new shoots in spring.',
      fix: 'Go out at dusk to pick them off, and keep the crowns clear of rotting leaves where they hide.',
      sources: [RHS_ARTICHOKE],
    },
  ],
  okra: [
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['fl', 'st'],
      looks: 'Big, leafy plants that are slow to flower and set few pods.',
      fix: 'Feed with compost rather than fresh manure, and give no extra nitrogen once the plants are growing well.',
      sources: [NEV_OKRA],
    },
    {
      kind: 'ph',
      label: 'Soil pH or drainage out of range',
      where: ['st', 'yo'],
      looks: 'Plants that grow slowly and stay pale.',
      why: 'Okra grows best at pH 6.0 to 6.8 in fertile soil that drains well and is neither waterlogged nor very sandy.',
      fix: 'Test the pH and lime as it says, and dig in plenty of compost to open heavy soil and hold water in sandy soil.',
      sources: [NEV_OKRA],
    },
    {
      kind: 'mimic',
      label: 'Cold',
      where: ['st', 'ot'],
      looks: 'Seed that does not come up and young plants that sit still.',
      why: 'Okra grows best at 24 to 32°C (75 to 90°F) and is killed by frost.',
      fix: 'Sow once the soil is warm, soak the seed for a day first to help it come up, grow it in full sun, and give it a greenhouse where summers are cool.',
      sources: [NEV_OKRA, RHS_OKRA],
    },
    {
      kind: 'mimic',
      label: 'Pods left too long',
      where: ['ha'],
      looks: 'Pods that turn tough and woody.',
      fix: 'Pick every two or three days, while the pods are under about 8 to 10 cm long.',
      sources: [NEV_OKRA],
    },
    {
      kind: 'mimic',
      label: 'Cercospora leaf spot',
      where: ['sp', 'yo'],
      looks: 'Small round tan spots with reddish edges that run together until the leaves drop.',
      fix: 'Space plants so air moves between them, water at the soil, and clear away old plants at the end of the season.',
      sources: [NEV_OKRA_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Fusarium and verticillium wilt',
      where: ['wi', 'yo', 'st'],
      looks: 'Stunted, yellowing plants that wilt on sunny afternoons and recover at night, with brown streaks inside the stem.',
      why: 'Soil fungi that stay in the ground.',
      fix: 'Leave at least four years before growing okra in the same place, grow a mustard green manure or leave the bed fallow between, and solarise the soil under clear plastic in high summer.',
      sources: [NEV_OKRA_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Root knot nematodes',
      where: ['wi', 'st', 'ro'],
      looks: 'Stunted plants that wilt, with knobbly swellings on the roots.',
      fix: 'Rotate okra with sweetcorn, and pull and remove the roots of affected plants rather than leaving them in the bed.',
      sources: [NEV_OKRA_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Yellow vein mosaic virus',
      where: ['yn', 'st', 'ha'],
      looks: 'Leaf veins that turn bright yellow, stunted plants, and yellow, deformed pods.',
      why: 'Carried from plant to plant by whiteflies.',
      fix: 'Pull out and remove plants that show it, grow a resistant variety, and keep whiteflies down.',
      sources: [NEV_OKRA_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Powdery mildew',
      where: ['sp'],
      looks: 'A white, dusty coating on the leaves.',
      fix: 'Space the plants for air, keep the soil evenly moist, and take off the worst leaves.',
      sources: [RHS_OKRA, NEV_OKRA_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Aphids, whitefly and red spider mite',
      where: ['cu', 'ho', 'yo'],
      looks: 'Sticky, curled leaves with small insects under them, tiny white flies that rise when the plant is touched, or finely mottled leaves with webbing under them in hot, dry weather.',
      fix: 'Leave aphids to ladybirds and hoverflies, and under glass damp down the paths to keep the air moist and bring in predators.',
      sources: [RHS_OKRA, NEV_OKRA_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Beetles, bugs and earworms',
      where: ['ho', 'ha'],
      looks: 'Leaves eaten down to a lace of veins (Japanese beetles), or pods bored or bent and marked by feeding.',
      fix: 'Pick beetles off in the cool of the morning, and cover young plants with fine mesh until they flower.',
      sources: [NEV_OKRA_INSECT],
    },
  ],
  sweetpotato: [
    {
      kind: 'short',
      nutrient: 'B',
      label: 'Boron shortage (blister)',
      where: ['ha', 'st'],
      looks: 'Small raised bumps on the skin of the roots, and stunted plants.',
      why: 'Sweet potato needs more boron than most vegetables.',
      fix: 'Confirm it with a soil or leaf test first, since boron is harmful in excess. Keep plenty of compost in the soil, which holds boron where roots can reach it.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['ha', 'st'],
      looks: 'Lush vines and few or small roots.',
      why: 'Too much nitrogen cuts the crop, and manure and compost carry nitrogen too.',
      fix: 'Grow them after a crop that was well fed rather than on fresh manure, and give no extra nitrogen. They need potassium and phosphorus more.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'ph',
      label: 'Soil pH or ground out of range',
      where: ['ha', 'st'],
      looks: 'Rough, misshapen roots, or small ones.',
      why: 'Sweet potatoes grow from pH 4.5 to 7.5, best at 5.8 to 6.2, in a loam that drains well. Heavy clay, or soil very high in organic matter, gives rough, irregular roots.',
      fix: 'Test the pH before liming, since they like it slightly acid. Grow them in raised ridges on heavy soil.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'water',
      label: 'A wet season',
      where: ['ha'],
      looks: 'Roots split lengthways.',
      why: 'Cracking is worse in a wet year.',
      fix: 'Grow them in ridges or raised beds that shed water, and keep the soil open with compost so it drains.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'mimic',
      label: 'Cold soil or frost',
      where: ['st', 'wi'],
      looks: 'Slips that sit still after planting, or vines blackened by frost.',
      why: 'Sweet potatoes need soil at least 18°C (65°F) and no frost.',
      fix: 'Plant slips only after the last frost once the soil has warmed, warm it first under a sheet or cloche, and lift the roots quickly once frost blackens the vines.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'mimic',
      label: 'Planted too close',
      where: ['ha', 'st'],
      looks: 'Roots slow to size up.',
      fix: 'Give each plant room along the row rather than crowding them, since close planting holds back the roots.',
      sources: [NEV_SWEETPOTATO],
    },
    {
      kind: 'mimic',
      label: 'Black rot and stem rot',
      where: ['ha', 'ro', 'yo'],
      looks: 'Firm, dark patches on the skin of the roots (black rot), or sunken brown to black marks on the stem at soil level, with rotting roots and yellow, stunted plants (rhizoctonia).',
      fix: 'Start from healthy certified slips, rotate so sweet potatoes do not come back to the same bed for a few years, keep bindweed and morning glory out, and cure the roots after lifting.',
      sources: [NEV_SWEETPOTATO_DISEASE, NEV_SWEETPOTATO],
    },
    {
      kind: 'mimic',
      label: 'Soft rot in store',
      where: ['ha', 'ro'],
      looks: 'Roots going soft and wet in storage.',
      fix: 'Handle the roots gently, and cure them for four to seven days somewhere warm and humid, about 27 to 30°C, before storing them.',
      sources: [NEV_SWEETPOTATO_DISEASE, NEV_SWEETPOTATO],
    },
    {
      kind: 'mimic',
      label: 'Wireworms',
      where: ['ha', 'ho'],
      looks: 'Small round holes and narrow tunnels in the roots.',
      why: 'Worst on ground that was grass or turf until recently.',
      fix: 'Leave two years between breaking up turf and planting sweet potatoes, and grow other crops there first.',
      sources: [NEV_SWEETPOTATO_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Flea beetles, tortoise beetles and cutworms',
      where: ['ho'],
      looks: 'Leaves peppered with tiny holes or chewed, or young slips cut through at the soil.',
      why: 'The sweet potato flea beetle breeds in bindweed.',
      fix: 'Keep bindweed out of and around the bed, and cover young slips with fine mesh.',
      sources: [NEV_SWEETPOTATO_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Aphids, whitefly and red spider mite',
      where: ['cu', 'yo'],
      looks: 'Sticky leaves with small insects under them, tiny white flies that rise when the vines are touched, or finely mottled leaves with webbing under them.',
      why: 'Aphids carry viruses between plants.',
      fix: 'Leave aphids to ladybirds and hoverflies, and under glass damp down the paths to keep the air moist and bring in predators.',
      sources: [RHS_SWEETPOTATO, NEV_SWEETPOTATO_INSECT],
    },
  ],
  melon: [
    {
      kind: 'ph',
      label: 'Soil pH or ground out of range',
      where: ['st', 'yo'],
      looks: 'Slow, pale vines and poor fruit on cold, heavy or acid ground.',
      why: 'Melons grow best at pH 6.0 to 6.8, in fertile soil high in organic matter that drains very well and warms up quickly in spring.',
      fix: 'Test the pH and lime as it says, dig in plenty of well-rotted compost before planting, and grow melons in a raised bed where the soil is heavy.',
      sources: [NEV_MELON, RHS_MELON],
    },
    {
      kind: 'water',
      label: 'Uneven watering',
      where: ['ha', 'wi'],
      looks: 'Vines that wilt in the heat and fruit that stays small.',
      why: 'Melons need regular water, most of all while the fruit is swelling, and daily watering under cover in hot spells.',
      fix: 'Keep the soil evenly moist but never saturated, mulch around the plants to hold the moisture, and water at the base in the morning without wetting the leaves.',
      sources: [RHS_MELON],
    },
    {
      kind: 'mimic',
      label: 'Cold soil and cold nights',
      where: ['st', 'wi', 'ot'],
      looks: 'Seedlings that stall or die, or young plants that suddenly wilt after several days of cloudy, rainy weather.',
      why: 'Melons do not tolerate chilling. After a few sunless days the soil drops below about 13 to 15°C and the roots cannot take up water, so the leaves wilt as soon as the sun returns.',
      fix: 'Plant out only once nights stay above 12 to 15°C, harden plants off gently, warm the soil for a few weeks first under cloches or a sheet, and grow them under cover where summers are cool.',
      sources: [NEV_MELON, RHS_MELON],
    },
    {
      kind: 'mimic',
      label: 'Poor pollination',
      where: ['ha', 'fl'],
      looks: 'Few or no fruit, or fruit that grows misshapen.',
      why: 'The female flowers need pollen from the male flowers, carried by insects or by hand.',
      fix: 'Grow flowers near the melons to bring in bees, open the greenhouse on warm days, and pollinate by hand under cover, dabbing a male flower into several female flowers on the same day.',
      sources: [M_DEFORMED, RHS_MELON],
    },
    {
      kind: 'mimic',
      label: 'Damping off and seed maggots',
      where: ['ro', 'ot'],
      looks: 'Seed that does not come up, or seedlings that go water-soaked and fall over at the soil, sometimes with cobweb-like growth, or seed eaten by small white maggots.',
      why: 'Worst in cold, wet soil, below about 17°C.',
      fix: 'Sow indoors in warmth, about 18 to 21°C, in fresh seed compost, water from below, and plant out only into warm soil.',
      sources: [M_EMERGENCE, RHS_MELON],
    },
    {
      kind: 'mimic',
      label: 'Phytophthora crown and fruit rot',
      where: ['ro', 'wi', 'ha'],
      looks: 'Dark water-soaked marks on the stems and leaf stalks, the whole plant collapsing, and fruit going soft and covered in white mould.',
      fix: 'Grow melons on raised beds or ridges that drain fast, keep fruit off wet soil on a bed of straw, and do not follow squash, pepper or tomato where it has shown.',
      sources: [M_COLLAPSED, NEV_MELON_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Powdery and downy mildew',
      where: ['sp', 'yo'],
      looks: 'A white to grey powdery felt on the older leaves (powdery mildew), or pale angular patches between the veins with purplish grey fuzz under the leaf that turn brown as if frosted (downy mildew).',
      why: 'Muskmelons are among the most susceptible to downy mildew, and it spreads fast in wet, humid weather.',
      fix: 'Grow a resistant variety, space and train plants so air moves, water at the soil in the morning, and take off the worst leaves.',
      sources: [M_SPOTS, M_DISCOLOURED, NEV_MELON_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Anthracnose, alternaria and gummy stem blight',
      where: ['sp', 'ha', 'wi'],
      looks: 'Dry reddish brown round leaf spots and sunken spots on the fruit (anthracnose), brown spots with rings like a target (alternaria), or tan stem patches that ooze a dark gum, with fruit rotting black from the side on the soil (gummy stem blight).',
      why: 'Cantaloupes are very susceptible to anthracnose, and alternaria is most common on muskmelon.',
      fix: 'Rotate so melons and their relatives come back to a bed only every few years, water at the soil, lift fruit off the ground on straw, and clear away old vines at the end of the season.',
      sources: [M_SPOTS, NEV_MELON_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Bacterial wilt and cucumber beetles',
      where: ['wi', 'ho'],
      looks: 'Leaves that go dull and wilt by day and recover at night, until the whole vine dies, with striped or spotted beetles on the plants and ragged holes in young leaves.',
      why: 'The beetles carry the wilt, and muskmelons are among the crops it strikes most.',
      fix: 'Cover young plants with fine mesh until they flower, then uncover them for the bees, and pull out wilted vines.',
      sources: [M_DISCOLOURED, M_SEEDLING_HOLES, NEV_MELON_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Mosaic viruses',
      where: ['cu', 'yn', 'ha'],
      looks: 'Leaves mottled in yellow and green, wrinkled or curled, and fruit that is blotched or deformed.',
      why: 'Carried from plant to plant by aphids.',
      fix: 'Grow a resistant variety, pull out plants that show it, and leave aphids to ladybirds and hoverflies.',
      sources: [M_DISCOLOURED, NEV_MELON_DISEASE],
    },
    {
      kind: 'mimic',
      label: 'Red spider mite and aphids',
      where: ['yo', 'cu'],
      looks: 'Pale, finely stippled leaves with webbing under them in hot, dry weather, or yellowing leaves with small soft insects under them.',
      fix: 'Under glass, damp down the paths to keep the air moist and bring in predators, and leave aphids to ladybirds and hoverflies.',
      sources: [M_DISCOLOURED, NEV_MELON_INSECT],
    },
    {
      kind: 'mimic',
      label: 'Slugs on the fruit',
      where: ['ho', 'ha'],
      looks: 'Small deep holes in green and ripe fruit, most in cool, damp weather.',
      fix: 'Lift fruit off the soil on a tile or straw, and go out at dusk to pick slugs off.',
      sources: [M_FRUIT_HOLES],
    },
  ],
  rhubarb: [
    {
      kind: 'water',
      label: 'Hot, dry weather',
      where: ['st', 'wi'],
      looks: 'Growth that slows or stops in summer, and thin stalks.',
      why: 'Rhubarb grows best in cool weather and slows down in heat, above about 32°C (90°F).',
      fix: 'Water young plants in every dry spell and established plants in long dry spells, and mulch the crowns with compost each spring to hold the moisture.',
      sources: [RHS_RHUBARB, NEV_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Waterlogged soil and crown rot',
      where: ['ro', 'yo', 'wi'],
      looks: 'Leaves that yellow, wilt and stay small, and a crown going soft and rotten.',
      why: 'Rhubarb likes moist soil that never waterlogs, and crown rot comes in on wet ground.',
      fix: 'Plant in a raised bed or large container on heavy clay, dig in plenty of compost to open the soil, keep the crown tip just above the surface, and start new plants from healthy crowns in fresh ground.',
      sources: [RHS_RHUBARB, NEV_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Picked too soon or too hard',
      where: ['st'],
      looks: 'Stalks that get thinner each year and a crown that weakens.',
      why: 'The leaves feed the crown for this year and next.',
      fix: 'Pick nothing in the first year and only a few stalks in the second, always leave plenty of leaves, and stop picking by early summer.',
      sources: [RHS_RHUBARB, NEV_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Flower stalks',
      where: ['bo'],
      looks: 'Tall, thick flowering stems rising from the crown.',
      fix: 'Cut them off close to the crown as soon as they show, which keeps good stalks coming for longer.',
      sources: [NEV_RHUBARB, RHS_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Overcrowded clump',
      where: ['st'],
      looks: 'A big clump that sends up many thin stalks.',
      fix: 'Lift and divide the crown while it is dormant, replant healthy pieces into soil with fresh compost, and give each 75 to 90 cm of room.',
      sources: [RHS_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Winters too mild',
      where: ['st'],
      looks: 'Weak growth in spring.',
      why: 'Rhubarb needs a dormant spell below about 4°C (40°F) to grow away strongly in spring.',
      fix: 'In a warm climate, choose a variety known to grow there, and give it light shade from the midday sun.',
      sources: [NEV_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Late frost',
      where: ['ed', 'wi'],
      looks: 'Young stalks and leaves blackened and collapsed after a spring frost.',
      fix: 'Do not plant in a frost pocket, cover the new growth with fleece on frosty nights, and choose a late variety for a cold site.',
      sources: [RHS_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Leaf spots',
      where: ['sp'],
      looks: 'Round tan spots with red edges whose centres fall out and leave holes, or larger spots with yellow rims that turn purple or brown.',
      fix: 'Pull off and remove spotted leaves, clear away old leaves in autumn, and give the plants room for air.',
      sources: [NEV_RHUBARB],
    },
    {
      kind: 'mimic',
      label: 'Viruses',
      where: ['yn', 'cu', 'st'],
      looks: 'Leaves mottled, ringed or streaked in yellow, and plants that lose vigour.',
      fix: 'Buy crowns from a supplier who sells them virus-free, and replace weak plants rather than dividing them.',
      sources: [RHS_RHUBARB, RHS_VIRUSES],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Holes in young leaves and stalks in spring.',
      fix: 'Go out at dusk to pick them off, and keep the crowns clear of rotting leaves where they hide.',
      sources: [RHS_RHUBARB, RHS_SLUGS],
    },
  ],
  jerusalemartichoke: [
    {
      kind: 'water',
      label: 'Dry spells',
      where: ['ha'],
      looks: 'Small, very knobbly tubers.',
      fix: 'Water in dry spells in summer so the tubers swell, and mulch with compost in late winter or spring after planting.',
      sources: [RHS_JERUSALEM],
    },
    {
      kind: 'mimic',
      label: 'Waterlogged ground',
      where: ['ro', 'ha'],
      looks: 'Tubers rotting in the soil.',
      fix: 'Plant in ground that does not waterlog, fork in compost to open the soil, or grow them in a large container.',
      sources: [RHS_JERUSALEM],
    },
    {
      kind: 'mimic',
      label: 'Poor soil or shade',
      where: ['st', 'ha'],
      looks: 'Plants that grow but give a small crop.',
      fix: 'Grow them in sun and fork in a bucketful of compost per square metre before planting.',
      sources: [RHS_JERUSALEM],
    },
    {
      kind: 'mimic',
      label: 'Wind rock',
      where: ['wi', 'ha'],
      looks: 'Tall stems that lean, snap or topple, and fewer tubers.',
      why: 'Wind rocks the stems and loosens the tubers in the ground.',
      fix: 'Draw soil up around the stems once they reach about 30 cm, support them with a surround of canes and twine, or cut the stems back to about 1.5 m in late summer.',
      sources: [RHS_JERUSALEM],
    },
    {
      kind: 'mimic',
      label: 'Sclerotinia',
      where: ['ro', 'wi'],
      looks: 'A soft, wet rot at the base of the stems, which may collapse, with fluffy white mould and later black seed-like bodies in it.',
      why: 'The black bodies fall to the soil and stay alive there for several years.',
      fix: 'Pull out and remove affected plants straight away, before the black bodies drop, and grow the crop somewhere fresh next year.',
      sources: [RHS_JERUSALEM, RHS_SCLEROTINIA],
    },
    {
      kind: 'mimic',
      label: 'Spreading where it is not wanted',
      where: ['ot'],
      looks: 'New plants coming up every spring from tubers left in the ground.',
      fix: 'Dig the bed over carefully at harvest and lift every tuber you find, or grow the crop in a patch set aside for it, where it can come back each year.',
      sources: [RHS_JERUSALEM],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Young shoots eaten in spring, and holes in the tubers.',
      fix: 'Go out at dusk to pick them off, and welcome the frogs, birds and ground beetles that eat them.',
      sources: [RHS_JERUSALEM, RHS_SLUGS],
    },
  ],
  kohlrabi: [
    {
      kind: 'ph',
      label: 'Acid soil and club root',
      where: ['wi', 'st', 'ro'],
      looks: 'Plants that wilt in warm weather and stay small, with swollen, distorted roots.',
      why: 'Kohlrabi grows best at pH 6.5 to 6.8. Below 6, the club root fungus does much more harm, and it stays in the soil for many years.',
      fix: 'Test the pH, lime acid soil as the test says, grow kohlrabi in its place in a brassica rotation, and dig in plenty of compost for drainage.',
      sources: [RHS_KOHLRABI, NEV_BRASSICA, RHS_CLUBROOT],
    },
    {
      kind: 'water',
      label: 'Dry soil',
      where: ['ha', 'bo'],
      looks: 'Stems that swell slowly, go woody or run to flower.',
      fix: 'Keep the soil moist all the way through, with a mulch of compost and steady watering in dry spells.',
      sources: [RHS_KOHLRABI],
    },
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'A flowering stem rising before the stem has swollen.',
      why: 'Too cold, too hot or too dry sets it off, and so does a sudden drop in temperature.',
      fix: 'Sow early crops indoors, plant out only above about 10°C after careful hardening off, cover young plants with fleece in a cold snap, and choose a slow-to-bolt variety.',
      sources: [RHS_KOHLRABI, NEV_BRASSICA],
    },
    {
      kind: 'mimic',
      label: 'Left too long',
      where: ['ha'],
      looks: 'Tough, woody swollen stems.',
      fix: 'Pick most varieties once the stem is about 7 to 8 cm across, and grow a storage variety bred to stay tender larger.',
      sources: [NEV_BRASSICA],
    },
    {
      kind: 'mimic',
      label: 'Cabbage root fly',
      where: ['wi', 'ro'],
      looks: 'Young plants that wilt and stall, with small white maggots eating the roots.',
      fix: 'Cover the crop with fine mesh from sowing or planting, or fit a collar round each stem at soil level.',
      sources: [RHS_KOHLRABI, RHS_CABBAGE_ROOT_FLY],
    },
    {
      kind: 'mimic',
      label: 'Caterpillars and pigeons',
      where: ['ho'],
      looks: 'Leaves eaten into holes, sometimes down to the stalks and veins.',
      fix: 'Cover the crop with fine mesh or netting held off the leaves, and pick caterpillars and eggs off by hand.',
      sources: [RHS_KOHLRABI, RHS_CATERPILLARS, RHS_PIGEONS],
    },
    {
      kind: 'mimic',
      label: 'Flea beetles',
      where: ['ho'],
      looks: 'Small round holes peppering the leaves of seedlings.',
      fix: 'Cover seedlings with fine mesh, and keep the soil moist, since the damage is worst in dry spells.',
      sources: [RHS_KOHLRABI, RHS_FLEA_BEETLE],
    },
    {
      kind: 'mimic',
      label: 'Mealy aphid and whitefly',
      where: ['cu', 'yo'],
      looks: 'Grey waxy clusters of insects under curled leaves, or small white flies that rise when the plant is touched.',
      fix: 'Leave them to ladybirds, hoverflies and small wasps, grow flowers nearby for them, and rub off the first clusters.',
      sources: [RHS_KOHLRABI, RHS_MEALY_APHID],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Seedlings eaten off and holes in the leaves.',
      fix: 'Go out at dusk to pick them off, and keep the bed weeded so they have nowhere to hide.',
      sources: [RHS_KOHLRABI, RHS_SLUGS],
    },
  ],
  pakchoi: [
    {
      kind: 'ph',
      label: 'Soil pH out of range',
      where: ['st', 'yo'],
      looks: 'Plants that grow slowly and stay pale.',
      why: 'Brassicas including bok choi grow best at pH 6.5 to 6.8.',
      fix: 'Test the pH and lime as it says, and dig in plenty of compost or well-rotted manure before sowing.',
      sources: [NEV_BRASSICA],
    },
    {
      kind: 'water',
      label: 'Dry soil',
      where: ['bo', 'st'],
      looks: 'Plants that stall and run to flower.',
      fix: 'Keep the soil moist, water in the morning in dry weather, and mulch around full-size plants with compost.',
      sources: [RHS_PAKCHOI],
    },
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'A flowering stem rising before the head has grown.',
      why: 'Pak choi is a cool-season crop, and heat, cold and dry soil all set it off.',
      fix: 'Sow in spring and late summer rather than midsummer, grow summer crops in light shade, choose a bolt-resistant variety, and cover early and late sowings with fleece.',
      sources: [RHS_PAKCHOI, NEV_BRASSICA],
    },
    {
      kind: 'mimic',
      label: 'Flea beetles',
      where: ['ho'],
      looks: 'Small round holes peppering the leaves.',
      why: 'Bok choi has no waxy coat on its leaves, so it suffers more than cabbage.',
      fix: 'Cover the crop with fine mesh from sowing, and keep the soil moist.',
      sources: [NEV_BRASSICA, RHS_PAKCHOI, RHS_FLEA_BEETLE],
    },
    {
      kind: 'mimic',
      label: 'Caterpillars and pigeons',
      where: ['ho'],
      looks: 'Leaves eaten into holes, sometimes down to the stalks and veins.',
      fix: 'Cover the crop with fine mesh or netting held off the leaves, and pick caterpillars off by hand.',
      sources: [RHS_PAKCHOI, RHS_CATERPILLARS, RHS_PIGEONS],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Holes in the juicy leaves and stems, most in damp weather.',
      fix: 'Go out at dusk to pick them off, and weed around the plants so they have nowhere to hide.',
      sources: [RHS_PAKCHOI, RHS_SLUGS],
    },
  ],
  rocket: [
    {
      kind: 'water',
      label: 'Dry soil',
      where: ['bo', 'ot'],
      looks: 'Plants running to flower early, and leaves turning hot and tough.',
      fix: 'Keep the soil moist with steady watering in dry spells, fork compost into light soil to hold water, and weed around the plants.',
      sources: [RHS_ROCKET],
    },
    {
      kind: 'mimic',
      label: 'Bolting in heat',
      where: ['bo'],
      looks: 'Salad rocket sending up flowers and stopping.',
      why: 'Salad rocket flowers quickly in hot weather, and cold spring weather or the shock of transplanting can set it off too.',
      fix: 'Sow little and often, grow midsummer sowings in light shade, move pots into shade in hot spells, and pinch out flower stems.',
      sources: [RHS_ROCKET, NEV_SALAD],
    },
    {
      kind: 'mimic',
      label: 'Crowded plants',
      where: ['bo', 'st'],
      looks: 'Thin, leggy plants that flower early.',
      fix: 'Thin the seedlings to about 15 cm apart and eat the thinnings.',
      sources: [RHS_ROCKET],
    },
    {
      kind: 'mimic',
      label: 'Flea beetles',
      where: ['ho'],
      looks: 'Small round holes peppering the leaves.',
      fix: 'Cover the crop with fine mesh from sowing, and keep the soil moist.',
      sources: [RHS_ROCKET, RHS_FLEA_BEETLE],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Seedlings eaten off and holes in the leaves.',
      fix: 'Sow in pots indoors and plant out once the plants are about 10 cm tall, and go out at dusk to pick slugs off.',
      sources: [RHS_ROCKET, RHS_SLUGS],
    },
  ],
};

export const MORE_VEGETABLE_SIGN_CONFIRM: Record<string, CropConfirm> = {
  sweetcorn: {
    text: 'Confirm with a soil test for pH and the main nutrients before sowing, and lime only as it says. Where the leaves point to a shortage in a growing crop, a leaf test from a lab tells which nutrient it is. Poor pollination, cold soil and the diseases show in no nutrient test.',
    sources: [NEV_CORN],
  },
  asparagus: {
    text: 'Confirm with a soil test the year before planting, since the bed stands for many years, and lime deep as it says. A test every few years after keeps the pH near 7. Crown rot and the beetles show in no soil test.',
    sources: [NEV_ASPARAGUS],
  },
  celery: {
    text: 'Confirm with a soil test for pH, magnesium, calcium and boron before planting, and lime only as it says. Where the leaves or stalks point to a shortage in a growing crop, a leaf test from a lab tells which nutrient it is. Blackheart can come from uneven watering even where the soil holds enough calcium, and the diseases and pests show in no soil test.',
    sources: [NEV_CELERY, NEV_CELERY_DISORDERS],
  },
  globeartichoke: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, since the plants stand for several years, and lime only as it says. Frost, missing buds and the pests show in no soil test.',
    sources: [NEV_ARTICHOKE],
  },
  okra: {
    text: 'Confirm with a soil test for pH and the main nutrients before sowing, and lime only as it says. A leaf test from a lab tells whether a growing crop is short of a nutrient. Root knot nematodes are confirmed by digging up a plant and looking for swellings on the roots, and a soil lab can test for them.',
    sources: [NEV_OKRA, NEV_OKRA_DISEASE],
  },
  sweetpotato: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, and lime only as it says. Where boron is in doubt, a soil or leaf test from a lab shows it. Cold, cracking and the rots show in no soil test.',
    sources: [NEV_SWEETPOTATO],
  },
  melon: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, and lime only as it says. Where the leaves point to a shortage in a growing crop, a leaf test from a lab tells which nutrient it is. Cold soil, poor pollination and the diseases show in no soil test.',
    sources: [NEV_MELON],
  },
  rhubarb: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting, since a crown stands for many years, and lime only as it says. Crown rot, frost and viruses show in no soil test.',
    sources: [NEV_RHUBARB],
  },
  jerusalemartichoke: {
    text: 'Confirm with a soil test for pH and the main nutrients before planting where the crop is small year after year. Waterlogging, wind rock and sclerotinia show in no soil test.',
    sources: [RHS_JERUSALEM],
  },
  kohlrabi: {
    text: 'Confirm with a soil test for pH, calcium and boron before sowing, and lime only as it says. Club root is confirmed by pulling a wilting plant and looking for swollen, distorted roots, and bolting and pests show in no soil test.',
    sources: [NEV_BRASSICA, RHS_CLUBROOT],
  },
  pakchoi: {
    text: 'Confirm with a soil test for pH, calcium and boron before sowing, and lime only as it says. Bolting and the pests show in no soil test.',
    sources: [NEV_BRASSICA],
  },
  rocket: {
    text: 'Confirm with a soil test for pH and the main nutrients where plants stay small in good weather. Bolting, crowding and the pests show in no soil test.',
    sources: [RHS_ROCKET],
  },
};
