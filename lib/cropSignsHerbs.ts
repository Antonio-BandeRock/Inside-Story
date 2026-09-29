// What is wrong with a plant, crop by crop: the herbs (I26, 2026-09-29).
// Basil came in batch 2; parsley, coriander, mint, rosemary, thyme,
// oregano, sage, dill, chives, tarragon, lemon balm and lemongrass in
// batch 5. Gathered by lib/cropSigns.ts, which explains the rules
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

// The herbs of batch 5.
const rhsHerb = (slug: string, name: string): GuideSource => ({
  label: `RHS: How to grow ${name}`,
  url: `https://www.rhs.org.uk/herbs/${slug}/grow-your-own`,
});
const rhsPage = (path: string, title: string): GuideSource => ({
  label: `RHS: ${title}`,
  url: `https://www.rhs.org.uk/${path}`,
});
const usu = (slug: string, name: string): GuideSource => ({
  label: `Utah State University: ${name} in the garden`,
  url: `https://extension.usu.edu/yardandgarden/research/${slug}`,
});
const illinois = (slug: string, name: string): GuideSource => ({
  label: `University of Illinois Extension: ${name}`,
  url: `https://extension.illinois.edu/herbs/${slug}`,
});
const ncsu = (slug: string, name: string): GuideSource => ({
  label: `NC State Extension Gardener Plant Toolbox: ${name}`,
  url: `https://plants.ces.ncsu.edu/plants/${slug}/`,
});

const EGRO_HERB_PH = egro('E806', 'Managing substrate pH and fertility of containerized herbs');
const EGRO_ROSEMARY_BORON = egro('2024-13-39', "It's complicated: rosemary boron problems");
const EGRO_ROSEMARY_IRON = egro('2024-13-40', "It's obviously an iron problem, but why?");
const EGRO_ROSEMARY_MILDEW = egro('E902', 'Powdery mildew on rosemary');

const RHS_PARSLEY = rhsHerb('parsley', 'parsley');
const RHS_CORIANDER = rhsHerb('coriander', 'coriander');
const RHS_MINT = rhsHerb('mint', 'mint');
const RHS_ROSEMARY = rhsHerb('rosemary', 'rosemary');
const RHS_THYME = rhsHerb('thyme', 'thyme');
const RHS_OREGANO = rhsHerb('oregano', 'oregano');
const RHS_SAGE = rhsHerb('sage', 'sage');
const RHS_DILL = rhsHerb('dill', 'dill');
const RHS_CHIVES = rhsHerb('chives', 'chives');
const RHS_TARRAGON = rhsHerb('tarragon', 'tarragon');
const RHS_LEMON_BALM = rhsHerb('lemon-balm', 'lemon balm');
const RHS_LEMONGRASS = rhsHerb('lemongrass', 'lemongrass');

const RHS_APHIDS = rhsPage('biodiversity/aphids', 'Aphids');
const RHS_SLUGS = rhsPage('biodiversity/slugs-and-snails', 'Slugs and snails');
const RHS_CARROT_FLY = rhsPage('biodiversity/carrot-fly', 'Carrot fly');
const RHS_CELERY_LEAF_MINER = rhsPage('biodiversity/celery-leaf-mining-fly', 'Celery leaf mining fly');
const RHS_MINT_RUST = rhsPage('disease/mint-rust', 'Mint rust');
const RHS_MINT_MOTH = rhsPage('biodiversity/mint-moth', 'Mint moth');
const RHS_BLUE_MINT_BEETLE = rhsPage('biodiversity/blue-mint-beetle', 'Blue mint beetle');
const RHS_LEAFHOPPERS = rhsPage('biodiversity/sage-and-ligurian-leafhoppers', 'Sage and Ligurian leafhoppers');
const RHS_ROSEMARY_BEETLE = rhsPage('biodiversity/rosemary-beetle', 'Rosemary beetle');
const RHS_SCALE = rhsPage('biodiversity/scale-insects', 'Scale insects');
const RHS_FROST = rhsPage('prevention-protection/frost-damage', 'Frost damage');
const RHS_CAPSID = rhsPage('biodiversity/capsid-bugs', 'Capsid bugs');
const RHS_POWDERY_MILDEW = rhsPage('disease/powdery-mildews', 'Powdery mildews');
const RHS_RUSTS = rhsPage('disease/rust-diseases', 'Rust diseases');
const RHS_LEEK_RUST = rhsPage('disease/leek-rust', 'Leek rust');
const RHS_WHITEFLY = rhsPage('biodiversity/glasshouse-whitefly', 'Glasshouse whitefly');

const USU_MINT = usu('mint-in-the-garden', 'Mint');
const USU_CILANTRO = usu('cilantro-coriander-in-the-garden', 'Cilantro and coriander');
const USU_DILL = usu('dill-in-the-garden', 'Dill');
const USU_CHIVES = usu('chives-in-the-garden', 'Chives');

const ILLINOIS_PARSLEY = illinois('parsley', 'Parsley');
const ILLINOIS_ROSEMARY = illinois('rosemary', 'Rosemary');
const ILLINOIS_THYME = illinois('thyme', 'Thyme');
const ILLINOIS_OREGANO = illinois('oregano', 'Oregano');
const ILLINOIS_SAGE = illinois('sage', 'Sage');
const ILLINOIS_LEMON_BALM = illinois('lemon-balm', 'Lemon balm');

const NCSU_PARSLEY = ncsu('petroselinum-crispum', 'Parsley');
const NCSU_OREGANO = ncsu('origanum-vulgare', 'Oregano');
const NCSU_TARRAGON = ncsu('artemisia-dracunculus', 'Tarragon');
const NCSU_LEMON_BALM = ncsu('melissa-officinalis', 'Lemon balm');
const NCSU_SPEARMINT = ncsu('mentha-spicata', 'Spearmint');

const UF_LEMONGRASS: GuideSource = {
  label: 'UF/IFAS Extension Nassau County: Fact sheet, lemongrass',
  url: 'https://blogs.ifas.ufl.edu/nassauco/2017/05/28/fact-sheet-lemongrass/',
};
const UC_LEMONGRASS: GuideSource = {
  label: 'UC Master Gardeners of Santa Clara County: Lemongrass',
  url: 'https://ucanr.edu/site/uc-master-gardeners-santa-clara-county/lemongrass',
};
const HAWAII_LEMONGRASS_RUST: GuideSource = {
  label: 'University of Hawaii CTAHR: Rust of lemongrass',
  url: 'https://www.ctahr.hawaii.edu/oc/freepubs/pdf/PD-57.pdf',
};
const GO_LEMONGRASS: GuideSource = {
  label: 'Garden Organic: How to grow lemongrass',
  url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-lemongrass',
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
  parsley: [
    {
      kind: 'water',
      label: 'Drying out in a pot',
      where: ['wi', 'st'],
      looks: 'Parsley in a container flags in hot spells and grows slowly, because a pot dries out much faster than a bed.',
      why: 'Parsley wants soil that stays moist but never waterlogged.',
      fix: 'Grow it in fertile soil with plenty of compost worked in, mulch the surface, water pots often in warm weather and move them into light shade during hot spells.',
      sources: [RHS_PARSLEY],
    },
    {
      kind: 'ph',
      label: 'Potting mix out of range',
      where: ['st', 'yo', 'yn'],
      looks: 'Potted parsley grows poorly and can show a shortage even when it is fed, once the mix has drifted too acid or too alkaline.',
      why: 'The e-GRO alert found potted herbs grow best at about pH 5.8 to 6.2, and that outside that range growth suffers and nutrient troubles follow.',
      fix: 'Test the mix. Repot tired plants into fresh compost-rich mix, and water with rainwater where tap water is hard.',
      sources: [EGRO_HERB_PH],
    },
    {
      kind: 'mimic',
      label: 'Old outer leaves yellowing',
      where: ['yo'],
      looks: 'A few of the oldest, lowest leaves turn yellow while the rest of the plant stays green and keeps growing.',
      fix: 'Snip the yellow leaves off at the base and keep picking from the outside, which keeps new leaves coming from the centre.',
      sources: [RHS_PARSLEY],
    },
    {
      kind: 'mimic',
      label: 'Going to seed in the second year',
      where: ['bo', 'ot'],
      looks: 'In its second spring parsley sends up a tall flowering stem and the leaves stop tasting good.',
      why: 'Parsley is a biennial. It makes leaves in its first year and flowers in its second.',
      fix: 'Sow fresh parsley each spring, and a second sowing in summer for leaves through the winter. Leave a few plants to flower for the hoverflies and bees that visit them.',
      sources: [RHS_PARSLEY],
    },
    {
      kind: 'mimic',
      label: 'Carrot fly',
      where: ['ro'],
      looks: 'Rusty brown tunnels in the tap root, left by small cream maggots.',
      why: 'Parsley is related to carrots and shares their pests. The flies find crops by scent, most of all when seedlings are thinned.',
      fix: 'Sow thinly so there is little thinning, cover the crop with fine insect mesh from sowing, and grow parsley somewhere carrots and celery have not been for a while.',
      sources: [RHS_CARROT_FLY, RHS_PARSLEY],
    },
    {
      kind: 'mimic',
      label: 'Celery leaf miner',
      where: ['sp', 'ho'],
      looks: 'Pale green blotches in the leaves that turn brown and papery, so the plant looks scorched, from late spring into autumn.',
      why: 'The larvae of a small fly tunnel inside the leaves of celery, parsnip, parsley and lovage.',
      fix: 'Pinch off affected leaves as soon as they show and bury them, and keep fine mesh over the crop and move it each year.',
      sources: [RHS_CELERY_LEAF_MINER],
    },
    {
      kind: 'mimic',
      label: 'Swallowtail caterpillars',
      where: ['ho'],
      looks: 'Green caterpillars banded in black eat the leaves back to bare stalks.',
      why: 'They are the young of the black swallowtail butterfly, which lays its eggs on parsley and its relatives.',
      fix: 'Grow a few extra plants and move the caterpillars onto those rather than killing them. They become butterflies.',
      sources: [NCSU_PARSLEY],
    },
    {
      kind: 'mimic',
      label: 'Slugs',
      where: ['ho'],
      looks: 'Ragged holes in the leaves and seedlings grazed off, with slime trails in damp weather.',
      fix: 'Protect young plants on damp nights, pick slugs off by torchlight, and give frogs, beetles and birds places to live near the bed.',
      sources: [RHS_SLUGS, RHS_PARSLEY],
    },
    {
      kind: 'mimic',
      label: 'Slow to come up',
      where: ['ot'],
      looks: 'Parsley seed can take weeks to germinate, so a sown row looks as if it has failed.',
      fix: 'Soak the seed in water overnight before sowing, keep the soil moist while waiting, and mark the row so it is not dug over.',
      sources: [ILLINOIS_PARSLEY],
    },
  ],
  coriander: [
    {
      kind: 'mimic',
      label: 'Bolting in heat or dry soil',
      where: ['bo'],
      looks: 'Coriander stops making leaves and runs up to flower within a few weeks, the leaves turning fine and feathery.',
      why: 'Heat, dry soil and root disturbance all push it to flower. In a pot, a warm window or a heat source does the same.',
      fix: 'Sow early, sow closely, mulch to keep the soil cool, water in dry spells, sow where it will grow rather than transplanting, keep pots away from heat, and choose a slow-bolting variety for leaves.',
      sources: [RHS_CORIANDER, USU_CILANTRO],
    },
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much nitrogen',
      where: ['ot'],
      looks: 'Plenty of leaf that tastes weak.',
      why: 'Utah State warns that too much nitrogen makes coriander less flavourful.',
      fix: 'Work compost into the bed before sowing and leave it at that. A rich bed needs nothing more.',
      sources: [USU_CILANTRO],
    },
    {
      kind: 'water',
      label: 'Soggy soil and damp air',
      where: ['ro', 'wi', 'st'],
      looks: 'Plants sit still, flop or rot at the base in soil that stays wet or in humid, still air.',
      why: 'Coriander dislikes soggy soil and does not do well in damp or humid conditions.',
      fix: 'Grow it in free-draining soil or mix, water regularly only while it establishes and then only as needed, and give it an open spot where air moves.',
      sources: [RHS_CORIANDER, USU_CILANTRO],
    },
    {
      kind: 'mimic',
      label: 'Pale on a windowsill',
      where: ['yn', 'yo', 'st'],
      looks: 'Coriander grown indoors comes up pale, thin and leaning towards the glass.',
      why: 'Low light, not a shortage.',
      fix: 'Give it the brightest window there is, or a grow light in winter, and sow a fresh pot every few weeks.',
      sources: [RHS_CORIANDER],
    },
    {
      kind: 'ph',
      label: 'Potting mix out of range',
      where: ['st', 'yo'],
      looks: 'Potted coriander grows poorly once the mix drifts too acid or too alkaline.',
      why: 'The e-GRO alert photographed coriander grown across a range of pH and found potted herbs grow best at about pH 5.8 to 6.2.',
      fix: 'Test the mix, and sow into fresh compost-rich mix rather than reusing old mix season after season.',
      sources: [EGRO_HERB_PH],
    },
    {
      kind: 'mimic',
      label: 'Aster yellows',
      where: ['ot', 'st'],
      looks: 'The flowers turn yellow, the plant grows tall and spindly, and it sets no seed.',
      why: 'A disease carried from plant to plant by leafhoppers. It is not a shortage and feeding does not help.',
      fix: 'Pull affected plants, keep the weeds around the bed down where leafhoppers shelter, and sow again.',
      sources: [USU_CILANTRO],
    },
    {
      kind: 'mimic',
      label: 'Damping off',
      where: ['wi', 'ro'],
      looks: 'Seedlings collapse and die, and young plants yellow.',
      fix: 'Sow in a different spot each year and into free-draining soil, and do not overwater seedlings.',
      sources: [USU_CILANTRO],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Seedlings grazed to stumps overnight, worst in damp weather.',
      fix: 'Protect seedlings on damp nights, pick slugs off by torchlight, and give frogs, beetles and birds places to live near the bed.',
      sources: [RHS_CORIANDER, RHS_SLUGS],
    },
  ],
  mint: [
    {
      kind: 'excess',
      nutrient: 'N',
      label: 'Too much feed and water',
      where: ['sp', 'ot'],
      looks: 'Soft, lush mint with less scent, and rust soon after.',
      why: 'Utah State found overwatering and overfeeding promote rust and lower the oil that gives mint its flavour.',
      fix: 'Feed mint lightly with compost and nothing richer, water at the base, and keep it moist rather than soaked.',
      sources: [USU_MINT],
    },
    {
      kind: 'mimic',
      label: 'Mint rust',
      where: ['sp', 'cu'],
      looks: 'Small pale raised spots that turn orange and then brown or black on the undersides of the leaves, and pale, twisted shoots in spring.',
      why: 'A rust fungus that also infects marjoram. Its black resting spores stay in the soil and carry it to next year.',
      fix: 'Dig up and remove affected plants with their runners before the black spores form, and start again in a new place from clean pieces. Runners can be cleaned by holding them in water at 44°C for 10 minutes. Water in the morning at the base.',
      sources: [RHS_MINT_RUST, USU_MINT, NCSU_SPEARMINT],
    },
    {
      kind: 'mimic',
      label: 'Verticillium wilt',
      where: ['yo', 'ed', 'cu', 'wi'],
      looks: 'Leaves yellow from the edges inwards, curl up and die.',
      why: 'A soil fungus that blocks the water vessels, and overfeeding makes it worse.',
      fix: 'Remove affected plants and plant fresh mint in a new spot, go easy on feeding, and do not follow it with tomatoes, potatoes or strawberries.',
      sources: [USU_MINT],
    },
    {
      kind: 'mimic',
      label: 'Anthracnose',
      where: ['sp'],
      looks: 'Small water-soaked spots on the leaves and stems.',
      fix: 'Remove affected plants, cut healthy mint to the ground in autumn, and move the bed every few years.',
      sources: [USU_MINT],
    },
    {
      kind: 'mimic',
      label: 'A crowded pot',
      where: ['st', 'ot'],
      looks: 'Mint in a pot grows weaker each year and a dead patch opens in the centre.',
      why: 'The runners fill the pot and the old centre dies out.',
      fix: 'Every few years in spring, knock it out, throw away the dead centre, and replant a few young pieces from the edge in fresh compost-rich mix. Keep it evenly moist.',
      sources: [RHS_MINT],
    },
    {
      kind: 'mimic',
      label: 'Scorch on variegated mint',
      where: ['ed'],
      looks: 'Pineapple mint and other variegated kinds brown at the edges in full sun.',
      fix: 'Grow variegated mint in part shade, out of the strongest afternoon sun.',
      sources: [USU_MINT],
    },
    {
      kind: 'mimic',
      label: 'Mint moth',
      where: ['ho', 'cu'],
      looks: 'Damaged shoot tips and curled leaves held together with fine webbing, with small black droppings.',
      why: 'The caterpillars of a small purple and gold moth feed on mint, marjoram and lemon balm.',
      fix: 'Tolerate light damage, pick the caterpillars off by hand, and cut back shoots that are badly hit so fresh ones come.',
      sources: [RHS_MINT_MOTH],
    },
    {
      kind: 'mimic',
      label: 'Blue mint beetle',
      where: ['ho'],
      looks: 'Shiny metallic blue beetles and their dark larvae eating holes in the leaves.',
      why: 'This beetle is found only on mint.',
      fix: 'Pick the beetles and larvae off by hand. A healthy plant soon regrows.',
      sources: [RHS_BLUE_MINT_BEETLE, RHS_MINT],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects. They have little effect on growth and the leaves are safe to eat.',
      fix: 'No action needed. Pick off the worst leaves if they bother you.',
      sources: [RHS_LEAFHOPPERS, RHS_MINT],
    },
    {
      kind: 'mimic',
      label: 'Aphids',
      where: ['cu', 'yo', 'st'],
      looks: 'Green or black soft-bodied insects on the leaves, which curl, yellow or stay small.',
      fix: 'Knock them off with a strong jet of water and leave the ladybirds, lacewings and hoverflies that eat them.',
      sources: [USU_MINT],
    },
    {
      kind: 'mimic',
      label: 'Flowering',
      where: ['bo', 'ot'],
      looks: 'Spikes of flowers at the tips, and leaves that taste milder.',
      why: 'Once mint flowers, the oil in its leaves falls.',
      fix: 'Pinch out the flower buds, or cut the whole plant back to about 2.5 cm (an inch) two or three times a summer. Leave one patch to flower for the bees.',
      sources: [USU_MINT],
    },
  ],
  rosemary: [
    {
      kind: 'short',
      nutrient: 'Fe',
      label: 'Iron shortage',
      where: ['yn'],
      looks: 'The newest leaves yellow between the veins while the older leaves stay green.',
      why: 'In the e-GRO case the rosemary sat in mix kept soaked by a dripping tap, with lime on the surface that the water carried in and made the mix more alkaline. Both keep iron out of reach.',
      fix: 'Let the mix dry between waterings, make sure the pot drains, and do not lime rosemary unless a pH test shows the soil is acid. Repot a waterlogged plant into a gritty, compost-rich mix.',
      sources: [EGRO_ROSEMARY_IRON],
    },
    {
      kind: 'mimic',
      label: 'Looks like a boron shortage',
      where: ['st', 'cu'],
      looks: 'New leaves stubby, clubbed and brittle enough to crunch, and side shoots that stall as small buds after the plant is trimmed.',
      why: 'Boron travels with the water a plant draws up. In soaked mix the roots take up little water, so the tips go short of boron even when there is plenty in the mix.',
      fix: 'Water a trimmed plant less while it regrows, since it is using less, and keep it in gritty mix that drains. The e-GRO authors found no way to turn badly affected plants around.',
      sources: [EGRO_ROSEMARY_BORON],
    },
    {
      kind: 'water',
      label: 'Wet roots in winter',
      where: ['ro', 'wi', 'yo'],
      looks: 'The plant yellows, wilts and dies back, and the roots are brown and soft.',
      why: 'Rosemary hates wet roots, most of all in cold, wet winter compost.',
      fix: 'On heavy soil grow it in a raised bed, or in a pot with drainage holes and grit mixed into the compost, and move pots out of the winter rain.',
      sources: [RHS_ROSEMARY],
    },
    {
      kind: 'water',
      label: 'Drying out indoors',
      where: ['ed', 'st'],
      looks: 'Brown leaf tips and dieback on rosemary brought in for the winter.',
      why: 'Indoor air dries it quickly. Watering more is not the answer, since that rots the roots.',
      fix: 'Keep it cool and in the sunniest window, and stand the pot on a saucer of wet pebbles to raise the humidity around it.',
      sources: [ILLINOIS_ROSEMARY],
    },
    {
      kind: 'mimic',
      label: 'Frost and cold wind',
      where: ['ed', 'sp'],
      looks: 'Pale brown patches on young growth, or evergreen leaves scorched brown after a hard frost.',
      why: 'Established rosemary survives down to about -8°C, but harsh frost and cold winds damage it, and roots in a pot can freeze.',
      fix: 'Plant in a sheltered, sunny spot, cover plants with fleece or hessian in a hard frost, and move pots against a wall or indoors.',
      sources: [RHS_ROSEMARY, RHS_FROST],
    },
    {
      kind: 'mimic',
      label: 'Powdery mildew',
      where: ['sp', 'yo', 'pu'],
      looks: 'White powdery patches on the leaves and shoot tips. Before the powder shows it can cause yellow or purple patches that look like a shortage, and badly hit leaves brown, shrivel and drop.',
      why: 'Warm days, cool nights and humid air favour it, though wet leaves hold it back.',
      fix: 'Give rosemary sun and space for air to move, and cut out affected tips.',
      sources: [EGRO_ROSEMARY_MILDEW],
    },
    {
      kind: 'mimic',
      label: 'Rosemary beetle',
      where: ['ho'],
      looks: 'Metallic purple and green striped beetles, and their grey-white larvae, eating the leaves.',
      why: 'A beetle of rosemary, lavender, sage and thyme that seldom harms a healthy plant.',
      fix: 'Tolerate it, or shake the plant over a sheet and pick the beetles off. Birds, frogs and ground beetles eat them.',
      sources: [RHS_ROSEMARY_BEETLE],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects with little effect on growth. The leaves are safe to eat.',
      fix: 'No action needed, since the mottling does not harm the plant or the leaves you pick.',
      sources: [RHS_LEAFHOPPERS],
    },
    {
      kind: 'mimic',
      label: 'Scale insects',
      where: ['ho', 'sp'],
      looks: 'Small shell-like bumps on the stems and under the leaves, with sticky honeydew and black sooty mould.',
      fix: 'Tolerate light numbers and rub the scales off by hand where they build up.',
      sources: [RHS_SCALE, RHS_ROSEMARY],
    },
    {
      kind: 'mimic',
      label: 'Bare, woody base',
      where: ['st'],
      looks: 'Long leggy stems that are bare at the bottom, with leaves only at the tips.',
      why: 'Unpruned rosemary grows this way, and it does not regrow from old wood.',
      fix: 'Trim after flowering every year, never into bare wood, and replace an old leggy plant with a cutting.',
      sources: [RHS_ROSEMARY],
    },
  ],
  thyme: [
    {
      kind: 'water',
      label: 'Wet soil in winter',
      where: ['ro', 'wi', 'yo'],
      looks: 'Thyme browns and dies back over winter, from the roots and from where the foliage lies on damp soil.',
      why: 'Thyme roots rot in damp soil, especially in winter, and poorly drained soil shortens its life.',
      fix: 'Grow it in free-draining soil with grit worked in, spread gravel under the foliage, cover it with a cloche in a wet winter, and move pots to shelter. Keep taller neighbours and fallen leaves off it.',
      sources: [RHS_THYME, ILLINOIS_THYME],
    },
    {
      kind: 'mimic',
      label: 'Woody plants opening in the middle',
      where: ['st'],
      looks: 'After a few years the plant turns woody and straggly, with a bare centre.',
      why: 'Thyme ages this way, and pruning hard into old wood can kill it.',
      fix: 'Trim lightly after flowering each year, and every few years start new plants from cuttings or by layering a stem into the soil.',
      sources: [RHS_THYME, ILLINOIS_THYME],
    },
    {
      kind: 'mimic',
      label: 'Rosemary beetle',
      where: ['ho'],
      looks: 'Metallic purple and green striped beetles and their grey-white larvae eating the leaves.',
      fix: 'Tolerate it, or pick the beetles off by hand. Birds, frogs and ground beetles eat them.',
      sources: [RHS_ROSEMARY_BEETLE, RHS_THYME],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects with little effect on growth. The leaves are safe to eat.',
      fix: 'No action needed, since the mottling does not harm the plant or the leaves you pick.',
      sources: [RHS_LEAFHOPPERS, RHS_THYME],
    },
    {
      kind: 'mimic',
      label: 'Slugs',
      where: ['ho'],
      looks: 'Young shoots eaten away, most of all in damp weather.',
      fix: 'Keep gravel under the plant, pick slugs off by torchlight, and give frogs, beetles and birds places to live near the bed.',
      sources: [RHS_THYME, RHS_SLUGS],
    },
  ],
  oregano: [
    {
      kind: 'water',
      label: 'Waterlogged in winter',
      where: ['ro', 'wi'],
      looks: 'The plant wilts and dies back, with rotting roots, after a wet winter or in heavy soil.',
      why: 'Oregano grows in fairly poor, free-draining soil and its roots rot in wet, poorly drained ground.',
      fix: 'Plant it in free-draining soil or a raised bed with grit, do not feed it in the ground, and move pots out of the winter rain.',
      sources: [RHS_OREGANO, NCSU_OREGANO],
    },
    {
      kind: 'mimic',
      label: 'An ornamental or seed-grown plant',
      where: ['ot'],
      looks: 'The leaves have little flavour even though the plant grows well.',
      why: 'Some oreganos are bred for their flowers rather than flavour, and oregano grown from seed often does not come true.',
      fix: 'Buy Greek oregano from the herb section, grown from cuttings of a well-flavoured plant, and smell a leaf before buying.',
      sources: [RHS_OREGANO, ILLINOIS_OREGANO],
    },
    {
      kind: 'mimic',
      label: 'Running to flower',
      where: ['bo', 'ot'],
      looks: 'The plant flowers, growth slows or stops, and the leaves lose flavour.',
      fix: 'Pick just before the flowers open, taking the stem tips and leaving four to six pairs of leaves so side shoots come. Trim in late spring and cut back faded flower stems.',
      sources: [ILLINOIS_OREGANO, RHS_OREGANO],
    },
    {
      kind: 'mimic',
      label: 'Mint rust',
      where: ['sp', 'cu'],
      looks: 'Orange then brown or black pustules on the undersides of the leaves, and distorted shoots.',
      why: 'The mint rust fungus also infects marjoram and oregano.',
      fix: 'Remove affected plants with their roots, start again in a new spot from a clean plant, and keep it away from rusty mint.',
      sources: [RHS_MINT_RUST, RHS_OREGANO],
    },
    {
      kind: 'mimic',
      label: 'Mint moth',
      where: ['ho', 'cu'],
      looks: 'Damaged shoot tips and curled leaves held together with fine webbing, with small black droppings.',
      fix: 'Tolerate light damage, pick the caterpillars off, and cut back badly hit shoots.',
      sources: [RHS_MINT_MOTH, RHS_OREGANO],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects with little effect on growth. The leaves are safe to eat.',
      fix: 'No action needed, since the mottling does not harm the plant or the leaves you pick.',
      sources: [RHS_LEAFHOPPERS, RHS_OREGANO],
    },
  ],
  sage: [
    {
      kind: 'water',
      label: 'Wet soil in winter',
      where: ['ro', 'wi', 'yo'],
      looks: 'Sage yellows, wilts and dies after a wet winter, rotting from the roots.',
      why: 'Winter rain rots its roots, so it lasts as a perennial only in soil that drains very well.',
      fix: 'Plant in full sun in free-draining soil, never where water stands, and do not feed it in the ground.',
      sources: [RHS_SAGE, ILLINOIS_SAGE],
    },
    {
      kind: 'ph',
      label: 'Potting mix out of range',
      where: ['st'],
      looks: 'Potted sage grows poorly once the mix has drifted out of range or been over or under fed.',
      why: 'The e-GRO alert found potted herbs grow best at about pH 5.8 to 6.2, and photographed sage grown across a range of feeding to show that both too little and too much hold it back.',
      fix: 'Test the mix, repot into fresh gritty mix with some compost, and feed lightly.',
      sources: [EGRO_HERB_PH],
    },
    {
      kind: 'mimic',
      label: 'Leggy and bare in the middle',
      where: ['st'],
      looks: 'Woody, sprawling stems with a bare centre after six or seven years.',
      why: 'Sage ages this way, sooner when it is not pruned, and cutting hard into bare wood can kill it.',
      fix: 'Prune lightly every spring, never into bare wood, and replace old plants with rooted summer cuttings.',
      sources: [RHS_SAGE, ILLINOIS_SAGE],
    },
    {
      kind: 'mimic',
      label: 'Powdery mildew',
      where: ['sp'],
      looks: 'White powdery patches on the leaves.',
      fix: 'Give sage full sun and room for air to move, water the soil in dry spells rather than the leaves, and pick off affected leaves.',
      sources: [RHS_POWDERY_MILDEW, RHS_SAGE],
    },
    {
      kind: 'mimic',
      label: 'Capsid bugs',
      where: ['ho'],
      looks: 'Many small holes with brown edges in the leaves near the shoot tips.',
      fix: 'No control needed. Pick off the worst leaves.',
      sources: [RHS_CAPSID, RHS_SAGE],
    },
    {
      kind: 'mimic',
      label: 'Rosemary beetle',
      where: ['ho'],
      looks: 'Metallic purple and green striped beetles and their larvae eating the leaves.',
      fix: 'Tolerate it or pick the beetles off by hand.',
      sources: [RHS_ROSEMARY_BEETLE, RHS_SAGE],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects with little effect on growth. The leaves are safe to eat.',
      fix: 'No action needed, since the mottling does not harm the plant or the leaves you pick.',
      sources: [RHS_LEAFHOPPERS, RHS_SAGE],
    },
  ],
  dill: [
    {
      kind: 'mimic',
      label: 'Bolting',
      where: ['bo'],
      looks: 'Dill runs up to flower quickly and makes few leaves.',
      why: 'Heat, dry soil and crowded seedlings all push it to flower.',
      fix: 'Water in dry spells, thin seedlings so they are not crowded, sow a little at a time through the summer, and grow a slow-bolting variety such as Tetra for leaves.',
      sources: [RHS_DILL, USU_DILL],
    },
    {
      kind: 'mimic',
      label: 'Moved too late',
      where: ['wi', 'st', 'bo'],
      looks: 'Transplanted dill wilts, sits still and soon bolts.',
      why: 'Dill dislikes root disturbance once its tap root has formed.',
      fix: 'Sow it where it is to grow, or move modules within about four weeks of sowing.',
      sources: [RHS_DILL],
    },
    {
      kind: 'water',
      label: 'Cold, soggy soil',
      where: ['st', 'ro'],
      looks: 'Seedlings sit still or rot in cold, wet ground.',
      why: 'Dill wants a warm, sheltered spot in free-draining soil. Sown indoors it needs at least 15°C.',
      fix: 'Wait for the soil to warm before sowing outside, and grow it in free-draining ground with compost worked in.',
      sources: [RHS_DILL],
    },
    {
      kind: 'water',
      label: 'Powdery mildew after overwatering',
      where: ['sp'],
      looks: 'White powdery patches on the feathery leaves.',
      why: 'Utah State found dill that is overwatered gets powdery mildew. Once established it needs only one or two waterings a week.',
      fix: 'Water less often and at the base, and give plants room for air to move.',
      sources: [USU_DILL],
    },
    {
      kind: 'ph',
      label: 'Soil out of range',
      where: ['st', 'yo'],
      looks: 'Dill grows poorly in soil or mix that is too acid or too alkaline.',
      why: 'Utah State gives pH 5.5 to 6.5 for dill, and the e-GRO alert pH 5.8 to 6.2 for herbs in pots.',
      fix: 'Test the soil and correct it slowly, with compost in any case and lime only if the test calls for it.',
      sources: [USU_DILL, EGRO_HERB_PH],
    },
    {
      kind: 'mimic',
      label: 'Aphids',
      where: ['cu', 'ho'],
      looks: 'Colonies of aphids on the stems and flower heads as dill flowers and sets seed.',
      fix: 'Leave them for the ladybirds, lacewings and hoverflies dill draws in, or knock them off with a jet of water.',
      sources: [USU_DILL, RHS_APHIDS],
    },
    {
      kind: 'mimic',
      label: 'Swallowtail caterpillars',
      where: ['ho'],
      looks: 'Bright green caterpillars striped in black eating the leaves.',
      why: 'They are the young of swallowtail butterflies.',
      fix: 'Leave them if you can spare the plant, or move them to a few plants grown for them.',
      sources: [USU_DILL],
    },
    {
      kind: 'mimic',
      label: 'Slugs and snails',
      where: ['ho'],
      looks: 'Seedlings grazed away overnight in damp weather.',
      fix: 'Protect seedlings on damp nights and give frogs, beetles and birds places to live near the bed.',
      sources: [RHS_DILL, RHS_SLUGS],
    },
  ],
  chives: [
    {
      kind: 'water',
      label: 'Dry soil',
      where: ['st', 'wi'],
      looks: 'Chives survive a dry spell but grow slowly and give little to cut.',
      why: 'They crop best in soil kept evenly moist.',
      fix: 'Water thoroughly in dry weather, keep pots evenly moist, and mulch with well-rotted organic matter in late winter.',
      sources: [USU_CHIVES, RHS_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Congested clumps',
      where: ['st'],
      looks: 'Old clumps grow thin, grassy leaves and crop less each year.',
      fix: 'Lift and divide the clumps every two to four years and replant the pieces in soil refreshed with compost.',
      sources: [RHS_CHIVES, USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Low winter light indoors',
      where: ['st', 'yo'],
      looks: 'Chives potted up for the winter grow slowly and weakly.',
      fix: 'Give them the brightest window there is, and water and feed them regularly while they grow.',
      sources: [USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Rust',
      where: ['sp'],
      looks: 'Bright orange pustules on the leaves.',
      why: 'The leek rust fungus. It is worse on soil rich in nitrogen and low in potassium, and on crowded plants.',
      fix: 'Space and divide clumps so air moves, feed with compost rather than rich nitrogen, and cut the whole clump down so clean leaves regrow.',
      sources: [RHS_LEEK_RUST, RHS_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Downy mildew',
      where: ['sp', 'yo'],
      looks: 'Leaves turn light tan to brown, with a greyish violet fur on them in damp weather.',
      fix: 'Space and divide plants so the leaves dry quickly, and water the soil rather than the leaves.',
      sources: [USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Thrips',
      where: ['sp', 'cu'],
      looks: 'Leaves turn silvery grey, twist and die back.',
      fix: 'Cut off and remove badly hit leaves, keep the clump watered, and leave the predatory insects that eat thrips.',
      sources: [USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Root maggots',
      where: ['ro', 'wi'],
      looks: 'White maggots eating the roots and bulbs, and plants that wilt.',
      fix: 'Remove affected plants and replant healthy divisions in a new spot.',
      sources: [USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Pink root',
      where: ['ro', 'st'],
      looks: 'Roots turn pink and then die, and the clump crops poorly.',
      why: 'A soil fungus of the onion family.',
      fix: 'Replant clean divisions somewhere no onions, leeks or chives have grown for several years.',
      sources: [USU_CHIVES],
    },
    {
      kind: 'mimic',
      label: 'Flowering',
      where: ['bo'],
      looks: 'Round purple flowers on stiff stalks, which are tough to eat.',
      fix: 'Enjoy the flowers or cut them off, then cut the whole clump down to about 5 cm after flowering for fresh leaves.',
      sources: [USU_CHIVES, RHS_CHIVES],
    },
  ],
  tarragon: [
    {
      kind: 'water',
      label: 'Wet and cold in winter',
      where: ['ro', 'wi'],
      looks: 'French tarragon rots at the crown and roots and does not come back in spring.',
      why: 'It struggles with cold and wet together, and rots in moist, poorly drained soil.',
      fix: 'Grow it in free-draining soil or a pot that can go under cover in winter, or cover it with a cloche, and water sparingly.',
      sources: [RHS_TARRAGON, NCSU_TARRAGON],
    },
    {
      kind: 'mimic',
      label: 'Russian tarragon sold as French',
      where: ['ot'],
      looks: 'The plant grows strongly but the leaves taste grassy and mild.',
      why: 'French tarragon rarely sets seed, so plants raised from seed are the tougher Russian kind, which has less flavour.',
      fix: 'Buy French tarragon as a plant grown from a cutting or division, and smell a leaf before buying. It should smell of aniseed.',
      sources: [RHS_TARRAGON, NCSU_TARRAGON],
    },
    {
      kind: 'mimic',
      label: 'An old plant fading',
      where: ['st'],
      looks: 'The clump grows smaller and weaker after a few years.',
      why: 'French tarragon is a short-lived perennial.',
      fix: 'Lift and divide it every few years in spring and replant the healthiest pieces in fresh soil.',
      sources: [RHS_TARRAGON],
    },
    {
      kind: 'mimic',
      label: 'Rust',
      where: ['sp', 'yo'],
      looks: 'Pale spots that become orange or brown pustules, mostly on the undersides of the leaves. A heavy attack weakens the plant.',
      fix: 'Pick off affected leaves early, give the plant space for air, and cut it back to clean growth.',
      sources: [RHS_RUSTS, RHS_TARRAGON],
    },
    {
      kind: 'mimic',
      label: 'Powdery mildew',
      where: ['sp'],
      looks: 'White powdery patches on the leaves.',
      fix: 'Grow it in sun with space for air, and cut back affected stems.',
      sources: [RHS_POWDERY_MILDEW, RHS_TARRAGON],
    },
  ],
  lemonbalm: [
    {
      kind: 'water',
      label: 'Cold, soggy winter soil',
      where: ['ro', 'wi'],
      looks: 'The clump rots and fails to come back after a wet winter.',
      why: 'Cold, soggy conditions in winter rot its roots.',
      fix: 'Grow it in soil that is moist but drains, and lift pots out of standing water in winter.',
      sources: [RHS_LEMON_BALM, ILLINOIS_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Seedlings everywhere',
      where: ['ot'],
      looks: 'Lemon balm seedlings come up all over the garden.',
      why: 'It spreads by setting plenty of seed rather than by runners.',
      fix: 'Cut it down after flowering and before seed forms, or grow a variety that sets no seed such as Compacta.',
      sources: [RHS_LEMON_BALM, ILLINOIS_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Straggly after flowering',
      where: ['st', 'bo'],
      looks: 'The plant sprawls and looks tired once it has flowered.',
      fix: 'Cut it down to the base after flowering and fresh leaves soon follow. Divide clumps every few years.',
      sources: [RHS_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Weak scent in dried leaves',
      where: ['ot'],
      looks: 'Dried lemon balm has much less lemon flavour than fresh.',
      fix: 'Use it fresh, pick before it flowers, and freeze leaves for winter rather than drying them.',
      sources: [RHS_LEMON_BALM, ILLINOIS_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Powdery mildew',
      where: ['sp'],
      looks: 'White powdery patches on the leaves, most often late in the season.',
      fix: 'Cut back affected stems and fresh, clean shoots follow. Give the clump space for air.',
      sources: [RHS_LEMON_BALM, RHS_POWDERY_MILDEW, NCSU_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Leafhoppers',
      where: ['sp'],
      looks: 'Coarse pale mottling on the upper surface of the leaves.',
      why: 'Small sap-feeding insects with little effect on growth. The leaves are safe to eat.',
      fix: 'Cut back affected stems for fresh shoots if it bothers you.',
      sources: [RHS_LEAFHOPPERS, RHS_LEMON_BALM],
    },
    {
      kind: 'mimic',
      label: 'Mint moth',
      where: ['ho', 'cu'],
      looks: 'Damaged shoot tips and curled leaves held together with fine webbing, with small black droppings.',
      fix: 'Pick the caterpillars off and cut back badly hit shoots.',
      sources: [RHS_MINT_MOTH],
    },
  ],
  lemongrass: [
    {
      kind: 'mimic',
      label: 'Cold',
      where: ['yo', 'ro', 'st'],
      looks: 'The leaves brown and die back, growth stops, and the base can rot once nights turn cold.',
      why: 'Lemongrass is a tender tropical grass. It needs at least 13°C to thrive and is damaged by frost.',
      fix: 'Grow it in a pot and bring it indoors before nights fall below 7°C, into a bright spot that stays above that. An unheated greenhouse may be too cold.',
      sources: [RHS_LEMONGRASS, GO_LEMONGRASS, UC_LEMONGRASS],
    },
    {
      kind: 'mimic',
      label: 'Low light over winter',
      where: ['st'],
      looks: 'Lemongrass indoors grows slowly and makes few new stalks.',
      why: 'Low winter light slows it, not a shortage. It picks up once it goes back outside.',
      fix: 'Give it the brightest window there is and water sparingly until spring.',
      sources: [RHS_LEMONGRASS, UF_LEMONGRASS],
    },
    {
      kind: 'water',
      label: 'Root rot',
      where: ['ro', 'wi'],
      looks: 'The clump yellows and wilts in soil that stays wet, and the roots rot.',
      fix: 'Grow it in rich, well-drained soil, avoid waterlogged ground, and water less in winter.',
      sources: [UC_LEMONGRASS, UF_LEMONGRASS, RHS_LEMONGRASS],
    },
    {
      kind: 'mimic',
      label: 'Lemongrass rust',
      where: ['sp', 'yo'],
      looks: 'Tiny light yellow spots that grow into brown spots and stripes along the veins on both sides of the leaf, and many brown, dying leaves.',
      why: 'A rust fungus spread by wind and splashing water in warm, wet, humid weather. The leaves are still safe to eat.',
      fix: 'Cut out and remove diseased leaves rather than using them as mulch, keep weeds down so air moves, water at the base, and give it good drainage and room for air.',
      sources: [HAWAII_LEMONGRASS_RUST, RHS_LEMONGRASS],
    },
    {
      kind: 'mimic',
      label: 'Spider mites indoors',
      where: ['sp'],
      looks: 'Tiny yellow or white speckling on the leaves of lemongrass kept indoors.',
      fix: 'Check under the leaves often while it is indoors, rinse them with water, and put the plant back outside once nights are warm.',
      sources: [UF_LEMONGRASS],
    },
    {
      kind: 'mimic',
      label: 'Whitefly under glass',
      where: ['ho'],
      looks: 'Clouds of tiny white insects rise when the plant is disturbed, with sticky honeydew and black sooty mould.',
      fix: 'Hang yellow sticky cards, ventilate, and put the plant outside for the summer.',
      sources: [RHS_WHITEFLY, RHS_LEMONGRASS],
    },
    {
      kind: 'mimic',
      label: 'Snails',
      where: ['ho'],
      looks: 'Leaves and young shoots eaten, with slime trails.',
      why: 'The oils in lemongrass protect it from most pests, but not snails.',
      fix: 'Pick snails off by torchlight and give frogs, beetles and birds places to live nearby.',
      sources: [GO_LEMONGRASS],
    },
  ],
};

export const HERB_SIGN_CONFIRM: Record<string, CropConfirm> = {
  basil: {
    text: 'Confirm with a leaf test from a lab, beside a pH test of the soil or mix. The e-GRO alerts say a magnesium shortage and a trace nutrient shortage look alike on basil, and that too much of a trace nutrient can only be told apart by a leaf test. Cold, low light, mildew and wilt show in no nutrient test.',
    sources: [EGRO_BASIL_MG_OR_MICRO, EGRO_BASIL_MICRO_EXCESS],
  },
  parsley: {
    text: 'In the ground, a soil test shows the pH and what the bed holds. In a pot, a pH test of the mix is the first thing to check, since potted herbs show different signs of the same trouble and cannot be read by eye alone. Most parsley trouble is dry pots, carrot fly or leaf miner, which no test shows.',
    sources: [EGRO_HERB_PH, RHS_PARSLEY],
  },
  coriander: {
    text: 'A pH test of the mix is the first check for coriander in a pot, and a soil test for coriander in a bed. Bolting, low light and damp air cause most of its trouble, and no test shows those.',
    sources: [EGRO_HERB_PH, USU_CILANTRO],
  },
  mint: {
    text: 'Utah State advises working out what mint needs from a soil test rather than feeding by habit, since too much feed brings rust and weakens the flavour.',
    sources: [USU_MINT],
  },
  rosemary: {
    text: 'Test the pH of the mix before adding anything, since the e-GRO cases that looked like iron and boron shortages were caused by soaked mix and lime, not by too little of either. A leaf test is hard on a plant that has stopped growing, because there are too few new leaves to send.',
    sources: [EGRO_ROSEMARY_IRON, EGRO_ROSEMARY_BORON, EGRO_HERB_PH],
  },
  thyme: {
    text: 'A soil test shows the pH, but thyme grows in poor soil and seldom goes short. Nearly all its trouble is wet soil in winter or an old, woody plant, which no test shows.',
    sources: [RHS_THYME, ILLINOIS_THYME],
  },
  oregano: {
    text: 'A soil test shows the pH, but oregano grows best in fairly poor soil and seldom goes short. Wet roots, the wrong variety and flowering explain most of its trouble, and no test shows those.',
    sources: [RHS_OREGANO, NCSU_OREGANO],
  },
  sage: {
    text: 'A pH test of the mix is the first check for sage in a pot, since the e-GRO alert found both too little and too much feed hold it back. In the ground, most trouble is wet winter soil or an old plant, which no test shows.',
    sources: [EGRO_HERB_PH, RHS_SAGE],
  },
  dill: {
    text: 'Utah State advises a soil test before feeding dill and gives pH 5.5 to 6.5 as its range. In a pot, test the pH of the mix.',
    sources: [USU_DILL, EGRO_HERB_PH],
  },
  chives: {
    text: 'Utah State advises working out what chives need from a soil test. Crowded clumps, dry soil and the onion family pests explain most of their trouble, and no test shows those.',
    sources: [USU_CHIVES],
  },
  tarragon: {
    text: 'A soil test shows the pH and drainage is the thing to check, since wet, cold soil and plants raised from seed explain most tarragon trouble, and no test shows those.',
    sources: [RHS_TARRAGON, NCSU_TARRAGON],
  },
  lemonbalm: {
    text: 'A soil test shows the pH, but lemon balm grows in most soils. Wet winter soil, mildew and tired plants after flowering explain most of its trouble, and no test shows those.',
    sources: [RHS_LEMON_BALM, ILLINOIS_LEMON_BALM],
  },
  lemongrass: {
    text: 'A pH test of the mix shows whether the pot has drifted, but cold, low winter light and wet roots explain nearly all lemongrass trouble, and no test shows those.',
    sources: [RHS_LEMONGRASS, UC_LEMONGRASS],
  },
};
