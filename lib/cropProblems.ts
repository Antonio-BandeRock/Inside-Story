// Three problems each crop is known for, and how to put each one right by
// feeding the soil rather than the plant.
//
// 2026-09-26, two direct statements the same day. Asked whether the
// deficiencies in the crop guides were specific to each crop (most were
// a shared line reused across a dozen crops), the answer was "Yes, make
// them specific to each crop. Give each crop the same level of depth,
// with resources where to go for more help online." And, in the same
// message: "we are trying to promote not using chemicals to grow their
// crops and instead make live soil through composting and other methods
// such as Korean Natural Farming, with chemical be persuaded against."
//
// So every crop carries exactly three problems, each one characteristic
// of that crop (apple bitter pit, carrot cavity spot, celery blackheart,
// citrus magnesium in a V), none of them a sentence copied from another
// crop, which scripts/test_crop_guides.js checks. Each problem says what
// it looks like, why it happens, and the fix, which always starts from
// the soil: compost, mulch, watering, cover crops, comfrey and nettle
// feeds, and Korean Natural Farming inputs. `insteadOf` names the bag,
// bottle or spray somebody might reach for and says truthfully why to
// skip it; it never mocks anyone for using one. Korean Natural Farming is
// offered as something growers use, never as proven, since the evidence
// behind it is mostly practitioner experience (see LIVING_SOIL_GUIDE in
// lib/plantNutrients.ts, which the crop guide opens beside these).
//
// Some problems are not nutrients at all (clubroot, blight, a split
// fruit). They stay, because a grower looking at a sick plant does not
// know yet which kind of problem it is, and naming the likeliest three
// for that crop is the useful thing.
//
// CROP_ORGANIC_SOURCES is the second half of equal depth: the organic
// growing page for the crop from Garden Organic or the California Rare
// Fruit Growers, or a university page on the crop where neither has one,
// every link checked by scripts/test_crop_guides.js --links.

import type { GuideSource, PlantNutrientKey } from './plantNutrients';

export type CropProblem = {
  // The nutrient behind it, when there is one, so the row can open that
  // nutrient's whole account.
  nutrient?: PlantNutrientKey;
  label: string;
  looks: string;
  why: string;
  // Starts from the soil. Never a bag or a bottle.
  fix: string;
  // The tempting chemical and truthfully why to skip it.
  insteadOf?: string;
};

export const CROP_PROBLEMS: Record<string, CropProblem[]> = {
  // ---------------------------------------------------------------- Vegetables
  tomato: [
    {
      nutrient: 'Ca',
      label: 'Blossom-end rot',
      looks: 'A leathery black patch spreads across the base of green and ripening fruit, usually on the first trusses of summer.',
      why: 'Calcium reaches a fruit only in the water the plant draws up, so a dry spell or a pot left to dry out cuts it off even in soil full of calcium.',
      fix: 'Water deeply every few days rather than a splash each evening, mulch with compost or straw so the soil stays evenly moist, and grow in beds or large pots that do not dry out by afternoon. Korean Natural Farming growers spray eggshell calcium (WCA) on young trusses.',
      insteadOf: 'Calcium sprays sold for blossom-end rot add salt and fast nitrogen and leave the watering unchanged, so the next truss rots too.',
    },
    {
      nutrient: 'K',
      label: 'Blotchy ripening',
      looks: 'Ripe tomatoes stay hard, with green or yellow patches on the shoulders that never colour, and the flesh inside is white and tough.',
      why: 'Short of potassium while the fruit swells, made worse by fruit cooking in strong sun and by rich nitrogen feeding.',
      fix: 'Water on comfrey liquid every week or two once fruit sets, keep some leaf over the trusses for shade, and in Korean Natural Farming ferment ripe fruit or banana peel into fermented fruit juice (FFJ) as the fruiting feed.',
      insteadOf: 'Bottled tomato feeds are potash salts that build up in pots and scorch leaf edges; a comfrey plant beside the greenhouse gives the same potassium every year for nothing.',
    },
    {
      nutrient: 'Mg',
      label: 'Yellow bands on the lower leaves',
      looks: 'Yellow opens between the veins of the lower leaves from midsummer while the veins stay green, turning purple-brown as the crop gets heavier.',
      why: 'A plant carrying a heavy crop pulls magnesium out of its old leaves, and potash feeding locks more of it away.',
      fix: 'Ease off potash, mulch with compost, and on acid soil work dolomitic lime in the winter before next year. Once the fruit above them has set, the oldest leaves can come off.',
      insteadOf: 'Epsom salt sprays green the leaf for a while and leave the potash that crowded the magnesium out still in the soil.',
    },
  ],
  pepper: [
    {
      nutrient: 'Ca',
      label: 'Sunken patches on the fruit',
      looks: 'A pale, papery or sunken patch on the side or base of a pepper, often going black with mould, worst on big bell kinds.',
      why: 'Large peppers grow fast in hot weather and need a steady flow of water to carry calcium into them; a pot that dries even once can mark a whole flush.',
      fix: 'Grow in pots of at least 10 litres filled with compost-rich soil, mulch the surface, and water whenever the top 2 cm feels dry. Pick the first fruits green to take the load off the plant in a heatwave.',
      insteadOf: 'Calcium nitrate drenches push leaf at the cost of fruit and do nothing for the dry spell that caused the patch.',
    },
    {
      label: 'Flowers falling without fruit',
      looks: 'Flowers open and drop off with their stalk, leaving a green plant with no peppers on it.',
      why: 'Nights below about 15°C or days above about 32°C, dry roots, and too much nitrogen, which pushes leaf over fruit.',
      fix: 'Mulch with compost to keep roots cool and moist, feed with comfrey rather than anything rich in nitrogen, and give light shade cloth in the hottest weeks. Plant out only once nights are warm.',
      insteadOf: 'Hormone fruit-setting sprays force fruit onto a stressed plant without fixing the heat, the cold or the dry roots behind it.',
    },
    {
      nutrient: 'N',
      label: 'Pale seedlings stuck in their pots',
      looks: 'Young pepper plants stop at a few pale yellow-green leaves, the lowest turning yellow and dropping, while they wait to be planted out.',
      why: 'Peppers sit in small pots for weeks in spring and use up what the compost held long before it is warm enough to plant them.',
      fix: 'Pot on into a mix of compost and garden soil before the roots circle, and water on nettle liquid or fish amino acid (FAA) at about 1 to 1,000 every week or two until they grow again.',
      insteadOf: 'A blue soluble feed greens them fast in a pot with little life in it, then leaves salts that burn the next set of roots.',
    },
  ],
  aubergine: [
    {
      nutrient: 'Mg',
      label: 'Mottled older leaves under glass',
      looks: 'The large lower leaves mottle yellow between the veins, then brown patches spread from the middle of the leaf outward.',
      why: 'Aubergines under glass are watered and fed heavily for months, which washes magnesium out of pots and grow bags and crowds it with potash.',
      fix: 'Grow in beds or deep pots of compost and garden soil rather than bags of peat-free compost alone, and top-dress with fresh compost in midsummer. Diluted seawater at about 1 to 30, once or twice a summer, is a Korean Natural Farming source of magnesium.',
      insteadOf: 'Epsom salts and high-potash feeds together are a common routine that makes the plant need both again next week.',
    },
    {
      label: 'Flowers that never set',
      looks: 'Violet flowers open, look healthy, then wither and fall without a fruit forming.',
      why: 'The pollen needs warmth and movement; a still greenhouse, dry air and nights under about 15°C stop it.',
      fix: 'Tap the flower trusses on warm mornings, damp down the greenhouse floor in hot weather, and plant flowers such as borage nearby to bring in bumblebees, which shake the pollen free.',
      insteadOf: 'Fruit-setting hormone sprays skip pollination and give seedless, often misshapen fruit.',
    },
    {
      nutrient: 'K',
      label: 'Small, dull fruit',
      looks: 'Fruit stays small and loses its gloss early, and the edges of the older leaves brown and curl.',
      why: 'Each plant carrying four or five large fruits needs a good supply of potassium through late summer, which a small pot runs out of.',
      fix: 'Limit each plant to five or six fruits, feed with comfrey liquid every ten days from first fruit, and mulch the pot with chopped comfrey leaves that release potassium as they rot.',
      insteadOf: 'Tomato feed from a bottle does the same job as comfrey in the short run and leaves salts in the pot that the next crop pays for.',
    },
  ],
  potato: [
    {
      label: 'Common scab',
      looks: 'Rough, corky patches on the skin of the tubers, which peel away to sound flesh underneath.',
      why: 'A soil bacterium that thrives in dry, alkaline, sandy soil, and worse after the bed has been limed.',
      fix: 'Keep the soil moist while tubers form, dig in plenty of compost or grass clippings along the trench, and never lime the bed before potatoes. Scab-resistant kinds help on light soil.',
      insteadOf: 'There is no spray for scab; soil treatments sold for it acidify the soil fast and harm the life that competes with the bacterium.',
    },
    {
      label: 'Hollow heart',
      looks: 'A star-shaped or lens-shaped hollow in the middle of large tubers, sometimes brown at the edges, with nothing wrong on the outside.',
      why: 'Tubers growing in spurts: a dry spell then a flood of water or a burst of nitrogen makes them swell faster than the middle can fill.',
      fix: 'Water evenly once the flowers show, mulch the ridges with straw or grass clippings, and space the seed potatoes closer so fewer grow oversized. Feed with compost in the trench rather than manure at the surface.',
      insteadOf: 'A top dressing of nitrogen fertiliser mid-season is one of the commonest causes of hollow heart.',
    },
    {
      nutrient: 'Mg',
      label: 'Bronzed middle leaves',
      looks: 'The leaflets on the middle of the stems yellow between the veins, then turn bronze and brittle, while the top growth stays green.',
      why: 'Potatoes on acid, sandy soil given heavy potash take up the potash in place of magnesium.',
      fix: 'Grow potatoes after a green manure such as vetch or rye, add compost along the trench, and on acid soil lime the bed a year ahead, after the potatoes have been lifted rather than before they go in.',
      insteadOf: 'Magnesium sprays on potato leaves treat one season and leave the balance in the soil as it was.',
    },
  ],
  lettuce: [
    {
      nutrient: 'Ca',
      label: 'Tipburn on the heart leaves',
      looks: 'The edges of the inner leaves, inside the head, turn brown and papery; the outside of the lettuce can look perfect.',
      why: 'Inner leaves lose little water, so little calcium reaches them, and a hot, fast-growing spell makes it worse.',
      fix: 'Water evenly in the evening so the plant can push water into the heart overnight, shade in hot spells, and choose loose-leaf and cos kinds in summer, which have less closed heart. Compost in the bed holds moisture steady.',
      insteadOf: 'Calcium sprays land on the outer leaves, which were never short; the inner ones only get calcium through the roots.',
    },
    {
      label: 'Bolting',
      looks: 'The lettuce stretches upward into a tall stem, the leaves turn bitter and white sap leaks when a leaf is snapped.',
      why: 'Long days and heat over about 24°C tell the plant to flower, and a dry root speeds it up.',
      fix: 'Sow small amounts every two to three weeks, grow summer crops in light shade from taller plants, and keep the soil mulched and moist. Slow-bolting kinds help.',
    },
    {
      nutrient: 'N',
      label: 'Pale, slow lettuces',
      looks: 'Young lettuces stay small and light green, the outer leaves turning yellow before a head forms.',
      why: 'Lettuce grows fast and has a short, shallow root, so a cold soil in spring or a bed with little organic matter leaves it hungry.',
      fix: 'Sow into beds topped with 2 to 5 cm of compost, and water on nettle liquid or fermented plant juice (FPJ) made from young nettle or comfrey tips while they grow.',
      insteadOf: 'Nitrogen-heavy feeds give soft, watery lettuces that aphids find first and that store badly.',
    },
  ],
  spinach: [
    {
      label: 'Bolting in spring',
      looks: 'Plants run up a flower stalk after a few pickings, with narrow pointed leaves at the top.',
      why: 'Spinach flowers once days pass about 14 hours, and dry soil or a check in growth brings it forward.',
      fix: 'Sow in early spring and again in late summer, keep beds covered with compost and mulch so they never dry out, and grow it among taller crops for afternoon shade.',
    },
    {
      nutrient: 'Mn',
      label: 'Speckled pale leaves on limy soil',
      looks: 'The young leaves go pale between the veins with small grey or brown speckles, and growth slows.',
      why: 'Spinach needs more manganese than most leaf crops, and an over-limed or chalky soil locks it away.',
      fix: 'Stop liming the bed, mulch with leafmould and compost every year, which slowly lowers the pH at the surface where spinach feeds, water with rainwater rather than hard tap water, and use seaweed as a mulch or liquid, since it carries traces of manganese.',
      insteadOf: 'A manganese spray greens the leaves for a few weeks while the limed soil keeps locking it up.',
    },
    {
      label: 'Downy mildew',
      looks: 'Yellow patches on top of the leaves with grey-purple fur underneath, spreading fast in cool, damp weather.',
      why: 'A water mould that thrives on leaves that stay wet, and on crowded plants in still air.',
      fix: 'Thin plants to 15 cm so air moves, water the soil and not the leaves, and grow resistant kinds. Compost and a steady feed of lactic acid bacteria (LAB) in the soil support the microbes that compete with it.',
      insteadOf: 'Fungicide sprays on a leaf crop you eat within days leave residues and kill the leaf-surface microbes that hold mildew back.',
    },
  ],
  chard: [
    {
      nutrient: 'B',
      label: 'Cracked stalks',
      looks: 'The stalks crack across or split along their length, often turning brown in the cracks.',
      why: 'Chard is a beet and needs more boron than most leaf crops, and light sandy soil after a wet winter holds very little.',
      fix: 'Add compost and seaweed each year and keep the bed moist so roots can take up what the soil holds. Where a soil test confirms a shortage, borax at a few grams across several square metres.',
      insteadOf: 'Trace-element tonics added on a hunch can push boron past what chard can take, and the damage lasts seasons.',
    },
    {
      label: 'Leaf spot',
      looks: 'Round spots with a pale grey middle and a purple rim on the older leaves, which then yellow.',
      why: 'A fungus (Cercospora) that lives on old beet and chard leaves and spreads in warm, wet weather.',
      fix: 'Pick off spotted leaves and compost them in a hot heap, rotate beets and chard to a new bed each year, and space plants for air. Lactic acid bacteria (LAB) diluted on the leaves are a Korean Natural Farming habit some growers use.',
      insteadOf: 'Fungicide sprays on a leaf you pick every week leave residues in the kitchen and do nothing about the old leaves carrying the spores.',
    },
    {
      nutrient: 'N',
      label: 'Small leaves late in the season',
      looks: 'After months of picking, new leaves come small and light green and the stalks thin.',
      why: 'Chard is cut and comes again for a year or more, and each picking takes nitrogen out of the bed.',
      fix: 'Pick the outer leaves and always leave five or six in the centre, side-dress with compost in midsummer, water on nettle liquid or fish amino acid (FAA) at about 1 to 1,000 after a heavy picking, and keep a mulch over the bed so the roots stay moist.',
      insteadOf: 'A granular nitrogen top dressing gives a flush of soft leaves and leaves the soil poorer for the winter.',
    },
  ],
  kale: [
    {
      label: 'Clubroot',
      looks: 'Plants wilt on warm afternoons and recover at night; lifted, the roots are swollen into knobbly clubs.',
      why: 'A soil organism that attacks the cabbage family, lives for 20 years in soil, and thrives in acid, wet ground.',
      fix: 'Keep the bed near pH 7 with lime a few months before planting, improve drainage with compost, raise transplants in pots so they go out with a strong root, and grow resistant kinds. Never bring in soil or plants from a garden that has it.',
      insteadOf: 'No garden treatment clears clubroot from soil; a product sold to kill soil organisms kills everything else there too.',
    },
    {
      label: 'Whitefly and cabbage aphid',
      looks: 'Clouds of tiny white flies lift off when a plant is brushed, or grey waxy aphids pack the young shoots.',
      why: 'Both favour soft growth from rich nitrogen, and plants grown with no flowers nearby to bring in predators.',
      fix: 'Feed with compost rather than nitrogen, grow flowers such as calendula and yarrow nearby for hoverflies and ladybirds, and hose aphids off. Fine netting keeps both off in summer.',
      insteadOf: 'Insecticide sprays kill the hoverfly larvae and parasitic wasps that were eating the aphids, and the aphids come back first.',
    },
    {
      nutrient: 'Mg',
      label: 'Purple and yellow lower leaves',
      looks: 'The lowest leaves marble yellow and purple between the veins through autumn while the top stays blue-green.',
      why: 'Kale stands for months on the same patch and draws magnesium out of the old leaves to feed the new ones on acid, sandy soil.',
      fix: 'Mulch with compost around the stems in autumn, grow kale after a legume green manure next time, and on acid soil work in dolomitic lime the winter before. Pull off the yellow lower leaves and compost them, since the plant has already moved what it can out of them.',
      insteadOf: 'Magnesium salts watered on in autumn wash through before winter.',
    },
  ],
  cabbage: [
    {
      label: 'Split heads',
      looks: 'A firm cabbage head cracks open across the top, often overnight after rain, and the split soon browns or rots.',
      why: 'A mature head keeps taking up water; heavy rain after a dry spell makes the inside grow faster than the outer leaves can stretch.',
      fix: 'Water evenly and mulch deep so rain arrives in soil that was already moist. Cut heads once firm, or twist the plant a quarter turn to break some roots and slow it down.',
    },
    {
      nutrient: 'Mo',
      label: 'Strappy young leaves',
      looks: 'New leaves in the middle of a young cabbage grow as thin straps with ragged edges and no head forms.',
      why: 'Whiptail: acid soil below about pH 5.5 locks up molybdenum, which cabbages need to turn nitrogen into leaf, so the new leaves never form a blade.',
      fix: 'Lime an acid bed to about pH 6.5 the winter before cabbages, add compost to hold the pH steady, and check again before adding anything else.',
      insteadOf: 'A molybdenum tonic treats the plant and leaves the acid soil that caused it; lime fixes both, and helps against clubroot too.',
    },
    {
      label: 'Cabbage white caterpillars',
      looks: 'Leaves eaten into holes down to the veins, green caterpillars and dark droppings in the heart.',
      why: 'Butterflies lay on cabbages from spring to autumn, and a lush, overfed plant draws them.',
      fix: 'Cover with fine netting held off the leaves, check undersides for yellow egg clusters and rub them off, and grow nasturtiums nearby as a decoy. Wasps and birds take many caterpillars when left unsprayed.',
      insteadOf: 'Insecticides kill the parasitic wasps that already lay in the caterpillars, and a netted bed needs no spray at all.',
    },
  ],
  broccoli: [
    {
      nutrient: 'B',
      label: 'Hollow, split stems',
      looks: 'The main stem is hollow when cut, often with brown walls inside, and the head may be small or discoloured.',
      why: 'Boron is short on light soil, and a fast-growing broccoli in a wet summer grows its stem faster than it can fill.',
      fix: 'Add compost and a scatter of seaweed each year, avoid over-feeding with nitrogen, and plant closer so heads stay moderate. Borax only after a soil test.',
      insteadOf: 'A trace-element mix used without a test can overshoot boron, which damages the next crop in that bed.',
    },
    {
      label: 'Heads flowering early',
      looks: 'Small heads form early and open into yellow flowers within days, before they have grown.',
      why: 'A check in growth tells broccoli to flower: seedlings held too long in pots, a dry spell, or a run of hot days while the head forms.',
      fix: 'Plant out young, before roots fill the pot, keep the bed moist under mulch, and sow for cool weather. Pick side shoots often after the main head.',
    },
    {
      label: 'Flea beetle',
      looks: 'Young leaves peppered with tiny round holes, and small black beetles that jump when touched.',
      why: 'Flea beetles thrive in dry, warm spring weather and feed hardest on seedlings under stress, which grow too slowly to outpace the damage.',
      fix: 'Keep seedbeds moist, since the beetles dislike damp soil, cover young plants with fine insect mesh from sowing, and get them growing fast in compost-rich soil so they outgrow the damage within a few weeks.',
      insteadOf: 'Soil and seed insecticides for flea beetle persist and harm ground beetles, which eat beetle larvae.',
    },
  ],
  cauliflower: [
    {
      nutrient: 'Mo',
      label: 'Whiptail on young plants',
      looks: 'The youngest leaves come out as narrow ribbons with little blade, and the curd never forms or stays button-sized.',
      why: 'Cauliflower is the crop most sensitive to molybdenum shortage, which comes from acid soil.',
      fix: 'Test the pH the autumn before, lime to about 6.5 if it is lower, and dig in compost to hold the pH steady. Raise seedlings in a compost that is not acid, and plant them out before they are held back in the pot.',
      insteadOf: 'A molybdenum drench on the seedlings leaves the bed as acid as before, and clubroot likes the same acid soil.',
    },
    {
      nutrient: 'B',
      label: 'Browning curds',
      looks: 'Brown, water-soaked patches on the curd, with a hollow or brown core in the stem below.',
      why: 'Boron shortage on light soil, especially in a dry spell when the roots cannot take up what the soil holds.',
      fix: 'Water deeply and evenly while curds form, mulch with compost, and add seaweed to the bed. Where a test confirms a shortage, borax in a measured, tiny amount.',
      insteadOf: 'Adding boron twice, once in a feed and once on its own, is how gardens end up with too much.',
    },
    {
      label: 'Small button curds',
      looks: 'Tiny cauliflower curds, no bigger than a coin, form early on plants that never grew large leaves.',
      why: 'Cauliflower needs to grow without a check: plants left in pots, dry soil, or a cold spell make them curd too soon.',
      fix: 'Plant out at five or six leaves, into firm soil rich in compost, and water in dry spells. Fold leaves over the curd once it forms to keep it white.',
    },
  ],
  brussels: [
    {
      label: 'Loose, blown sprouts',
      looks: 'Brussels sprouts open into loose, leafy rosettes instead of tight, firm buttons along the stem.',
      why: 'Loose, freshly dug soil, rich nitrogen feeding and wind rocking the tall stems all stop the sprouts from forming tight heads.',
      fix: 'Plant into firm soil that has not been dug over, heel the plants in, stake in windy gardens, and feed with compost rather than anything rich in nitrogen.',
      insteadOf: 'Nitrogen fertiliser gives big leaves and open sprouts; this crop wants a firm, steady soil.',
    },
    {
      label: 'Mealy cabbage aphid',
      looks: 'Grey, waxy clusters of aphids between the sprouts, which cannot be washed out in the kitchen.',
      why: 'Aphids build up on plants standing through late summer, and faster on soft, overfed growth.',
      fix: 'Rub or hose off early colonies on the underside of the leaves, grow flowers nearby for ladybirds, hoverflies and lacewings, feed with compost rather than nitrogen, and cover young plants with fine mesh in early summer.',
      insteadOf: 'Insecticide sprays on a plant that stands for months kill the predators first and the aphids return with nothing eating them.',
    },
    {
      nutrient: 'Mg',
      label: 'Yellow lower leaves in autumn',
      looks: 'The large lower leaves yellow between the veins and drop as sprouts start to form.',
      why: 'The plant moves magnesium from its old leaves to its sprouts, faster on acid, sandy soil.',
      fix: 'Pull the yellow leaves and compost them, mulch around the stems with compost, and grow the crop after a green manure next time. On acid, sandy soil, dolomitic lime worked in the winter before adds magnesium slowly.',
    },
  ],
  kohlrabi: [
    {
      label: 'Woody, split stems',
      looks: 'The swollen kohlrabi stem cracks open, and when cut the flesh is stringy, fibrous and woody.',
      why: 'Kohlrabi left in the ground past its best, or grown in dry soil and then watered heavily, splits and toughens.',
      fix: 'Pick at tennis-ball size, water evenly so the soil never dries out and then floods, and keep a compost mulch over the bed. Sow small batches every three or four weeks so each one is picked young.',
    },
    {
      nutrient: 'B',
      label: 'Brown flesh inside',
      looks: 'The flesh of the swollen kohlrabi stem shows brown, grey or glassy patches when it is cut open.',
      why: 'Boron shortage, mostly on light, sandy or alkaline soil in a dry spell, when the roots cannot take up what little boron there is.',
      fix: 'Keep the soil evenly moist through summer, add compost and seaweed to the bed each year, and grow kohlrabi in spring and autumn rather than high summer. Use borax only after a soil test confirms a shortage.',
      insteadOf: 'Boron added without a test can reach a level that harms the next crops.',
    },
    {
      label: 'Cabbage root fly',
      looks: 'Young plants wilt and turn blue-grey; the roots below are tunnelled by white maggots.',
      why: 'The fly lays at the base of young cabbage-family plants in spring and early summer.',
      fix: 'Fit a collar of card or felt tight around each stem at planting, cover the bed with fine mesh until early summer, and keep a mulch over the soil so ground beetles and rove beetles, which eat the eggs, thrive.',
      insteadOf: 'Soil insecticides for root fly are persistent and kill the ground beetles that eat the eggs.',
    },
  ],
  pakchoi: [
    {
      label: 'Bolting',
      looks: 'The pak choi plant stretches up into a flower stalk within weeks of sowing, before a head forms.',
      why: 'Pak choi flowers in response to long days and cold nights in spring, or to any dry spell.',
      fix: 'Sow from midsummer onward for autumn crops, when days are shortening, keep the soil moist under a compost mulch, and grow slow-bolting kinds. Pick the whole plant young in spring sowings before it can run up.',
    },
    {
      nutrient: 'Ca',
      label: 'Brown edges inside the head',
      looks: 'The young inner leaves brown at the edges while the outer leaves look healthy.',
      why: 'Fast growth in heat with too little water flowing into the heart, so the calcium the plant needs never reaches the young inner leaves.',
      fix: 'Water evenly and in the evening, give light shade in hot spells, keep compost and mulch over the bed so the soil stays moist, and grow pak choi in the cooler months when it grows at a steadier pace.',
      insteadOf: 'Calcium sprays land on the outer leaves and never reach the heart where the trouble is.',
    },
    {
      label: 'Slugs and flea beetles',
      looks: 'Ragged holes in the leaves and slime trails, or pinholes peppering the young leaves.',
      why: 'Pak choi grows soft, fast leaves close to the soil, which slugs reach at night in damp weather and flea beetles attack in dry spells.',
      fix: 'Grow under fine mesh, pick slugs off after dark with a torch, and let frogs, birds and ground beetles do the rest by leaving them cover nearby. A beer trap works on a small bed.',
      insteadOf: 'Slug pellets poison the birds, hedgehogs and beetles that eat slugs, and the slugs return first.',
    },
  ],
  rocket: [
    {
      label: 'Flea beetle holes',
      looks: 'Small round holes all over the leaves, making them look shot with a pin.',
      why: 'Rocket is a member of the cabbage family, and flea beetles attack it hardest in warm, dry spells when the leaves grow slowly.',
      fix: 'Sow in spring and autumn rather than midsummer, keep the soil moist under a thin compost mulch, since the beetles dislike damp ground, and cover rows with fine mesh straight after sowing.',
      insteadOf: 'An insecticide on a salad leaf picked within days leaves residues and kills the beetles that eat flea beetle larvae.',
    },
    {
      label: 'Hot, bolting leaves',
      looks: 'Leaves turn very peppery and thin and the plant runs to white flowers.',
      why: 'Heat, long days and dry soil tell rocket to flower, and the leaves grow thin and very hot as it does.',
      fix: 'Sow little and often in partial shade in summer, keep the bed mulched with compost and watered, and pick leaves young. The white flowers are edible and feed hoverflies, whose larvae eat aphids.',
    },
    {
      nutrient: 'N',
      label: 'Yellow leaves after cutting',
      looks: 'After a few cuts the new rocket leaves come back small, thin and yellow-green, and regrowth slows.',
      why: 'Each cut takes nitrogen out of a shallow-rooted plant growing in a small space, and a bed with little compost runs short fast.',
      fix: 'Sow into beds topped with compost, and after each cut water on diluted nettle liquid or fermented plant juice (FPJ) at about 1 to 500. Resow every few weeks rather than cutting one row for months.',
    },
  ],
  carrot: [
    {
      nutrient: 'Ca',
      label: 'Cavity spot',
      looks: 'Small sunken, grey or brown oval pits across the roots, which crack as the carrot grows.',
      why: 'A soil fungus that thrives in waterlogged, compacted soil, worse where calcium is short.',
      fix: 'Grow in loose, well-drained soil with compost, rotate carrots each year, and lift them as soon as they are big enough. On an acid soil, lime the bed a year ahead.',
      insteadOf: 'Soil fungicide drenches kill the fungi that compete with the one causing the pits.',
    },
    {
      label: 'Forked and hairy roots',
      looks: 'Roots split into two or three legs, or come up covered in fine side roots.',
      why: 'Stones, compacted soil, and fresh manure or rich compost dug in just before sowing.',
      fix: 'Sow into soil that was manured for a previous crop, not this one, and into well-rotted compost spread on top rather than dug in. Grow short kinds in heavy soil.',
      insteadOf: 'Nitrogen fertiliser worked into the row causes the same hairy roots fresh manure does.',
    },
    {
      label: 'Carrot fly',
      looks: 'Rusty brown tunnels in the roots, and plants with reddish leaves that wilt in sun.',
      why: 'A small fly that finds carrots by smell, flying low, laying near the plants in late spring and late summer.',
      fix: 'Cover with fine mesh or put a 60 cm barrier around the bed, sow thinly so there is little thinning to release the scent, thin in the evening, and grow onions or leeks alongside to mask the smell.',
      insteadOf: 'Soil insecticides linger in root crops and kill the ground beetles and rove beetles that eat carrot fly eggs.',
    },
  ],
  beetroot: [
    {
      nutrient: 'B',
      label: 'Heart rot',
      looks: 'Black or brown patches inside the root, often a ring, while the outside looks sound; the young leaves may be twisted.',
      why: 'Beet needs more boron than most crops; light, alkaline or dry soil holds too little of it.',
      fix: 'Add compost and seaweed each year and water in dry spells so the roots can take up boron. Where a soil test confirms a shortage, borax at a measured rate of a few grams per square metre, once.',
      insteadOf: 'A general trace-element mix added every year can push boron too high for the crops that follow.',
    },
    {
      nutrient: 'Mn',
      label: 'Speckled yellow leaves',
      looks: 'Leaves yellow between the veins with red-brown speckles, and the leaf edges curl up.',
      why: 'Beetroot and chard need more manganese than most crops, and a limed or chalky soil locks it up so the roots cannot reach it.',
      fix: 'Stop liming the bed, mulch with leafmould and compost every year so the pH at the surface settles, water with rainwater where you can, and add seaweed as a mulch or liquid for its traces of manganese.',
      insteadOf: 'A manganese spray greens the leaves while the limed soil keeps locking it up.',
    },
    {
      label: 'Woody roots',
      looks: 'Large beetroots with pale rings of tough, fibrous flesh that stay hard even after long cooking.',
      why: 'Beetroot grown slowly in dry soil, or left in the ground months past its best, lays down woody rings as it swells.',
      fix: 'Keep the soil moist under a compost mulch, water in dry spells, and pull at golf-ball to tennis-ball size. Sow small batches every three or four weeks through the season so there are always young roots.',
    },
  ],
  radish: [
    {
      label: 'Split roots',
      looks: 'Radishes crack open down their length, sometimes right through, a day or two after rain.',
      why: 'Radish swells in three or four weeks, and a dry spell followed by a soaking makes the flesh grow faster than the skin can stretch. Radishes left in the ground past size split too.',
      fix: 'Water a little every day or two rather than a soak once a week, keep a thin layer of sieved compost over the row so the top never crusts, and pull them within a few days of reaching size. Sow a short row every ten days rather than one long one.',
    },
    {
      label: 'All leaf and no root',
      looks: 'A row of lush, dark radish leaves over roots that never swell past the thickness of a pencil.',
      why: 'Too much nitrogen from fresh manure, too much shade, or seed sown so thickly that the roots have no room to swell.',
      fix: 'Sow thinly in full sun into a bed that was fed for the crop before, thin to 3 cm apart as soon as they come up, and never manure a radish row.',
      insteadOf: 'A nitrogen feed makes this worse; a radish in soil that has had compost needs nothing else at all.',
    },
    {
      label: 'Pithy, fiery radishes',
      looks: 'Radish roots are spongy or hollow when cut, and so hot they are hard to eat raw.',
      why: 'Heat, dry soil and slow growth. Radish is a cool-season crop that turns woody and hot when it grows slowly through a warm spell.',
      fix: 'Sow in spring and early autumn, grow summer sowings in the shade of peas or sweetcorn, and keep the soil mulched and moist. In a hot climate, sow in the coolest months only.',
    },
  ],
  turnip: [
    {
      nutrient: 'B',
      label: 'Brown heart',
      looks: 'The flesh at the centre of the turnip is brown or grey and watery when cut, though the outside looks sound.',
      why: 'Boron shortage, mostly on light, alkaline soils after a dry summer, when the roots cannot draw up the little boron there is.',
      fix: 'Add compost and seaweed to the bed each year, water through dry weeks so the soil stays evenly moist, and sow for autumn rather than high summer. Use borax only if a soil test shows it is short.',
      insteadOf: 'Adding boron routinely risks damaging the next crop in the bed.',
    },
    {
      label: 'Clubroot on turnips',
      looks: 'Turnip roots swollen into lumps and clubs, and plants that wilt on hot afternoons and recover at night.',
      why: 'The same soil organism that attacks cabbages; turnips grown in the same bed as brassicas carry it.',
      fix: 'Rotate the cabbage family over at least four years, lime acid soil to near pH 7, add compost to improve drainage, and pull and bin infected roots rather than composting them, since the spores last for years.',
      insteadOf: 'Nothing sold for the garden clears clubroot; a rotation and lime do.',
    },
    {
      label: 'Woody, bitter roots',
      looks: 'Turnip roots are stringy and fibrous, hot and bitter, and stay tough even after cooking.',
      why: 'Turnips grown slowly through heat and dry soil, or left in the ground long after they reached size, turn woody and bitter.',
      fix: 'Sow for cool weather in spring and late summer, water well so the roots grow without a check, mulch with compost, and pull young at golf-ball to tennis-ball size. Sow small batches every few weeks.',
    },
  ],
  parsnip: [
    {
      label: 'Canker',
      looks: 'Orange-brown or black rough patches of rot on the shoulder of the parsnip, spreading down the root.',
      why: 'A soil fungus that gets in where the root is damaged, worse in acid soil and with fresh manure.',
      fix: 'Sow later in spring so the roots stay smaller, earth up soil over the shoulders, grow canker-resistant kinds, and rotate to a new bed each year. Add compost the year before rather than fresh manure.',
      insteadOf: 'Fungicide dressings do not work on canker; the fix is timing and rotation.',
    },
    {
      label: 'Seed that never comes up',
      looks: 'Weeks after sowing, only a few scattered parsnip seedlings have come up along the row.',
      why: 'Parsnip seed loses viability within a year, and dry or cold soil stops what remains.',
      fix: 'Buy fresh seed each year, sow once the soil has warmed in mid spring, and keep the drill moist under a thin layer of sieved compost. Sow radish in the same row to mark it and break the crust.',
    },
    {
      label: 'Forked roots',
      looks: 'Parsnips come up with two, three or more legs, twisted around each other and hard to peel.',
      why: 'The growing tip of the root is split by stones, hard lumps of soil, or pockets of manure dug in before sowing.',
      fix: 'Sow into deep, stone-free soil fed the year before, and keep compost on top as a mulch rather than dug under. On stony or heavy ground, make a hole with a bar, fill it with sieved compost and sow into that.',
    },
  ],
  onion: [
    {
      label: 'White rot',
      looks: 'Yellowing leaves that collapse; lifted, the base of the bulb is covered in fluffy white mould.',
      why: 'A soil fungus (Stromatinia cepivora) that forms tiny black resting bodies which live in the soil for 15 years or more.',
      fix: 'Never bring in soil, onion sets or leek plants from a garden that has it, rotate onions over at least four years, pull and bin affected plants with the soil around them, and grow onions elsewhere if it appears.',
      insteadOf: 'There is no garden fungicide for white rot; a clean rotation is the defence.',
    },
    {
      label: 'Bolting',
      looks: 'A thick, hollow flower stalk grows from the centre of the onion bulb, which then will not store.',
      why: 'A cold spell after planting, or sets planted too early into cold soil, tells the onion it has had a winter and should flower.',
      fix: 'Plant sets once the soil has warmed in spring, use heat-treated sets, which bolt less, and sow seed rather than sets where bolting is a problem. Cut off any flower stalk and eat those onions first.',
    },
    {
      label: 'Soft necks that rot in store',
      looks: 'Onions with a thick, soft neck that never dries, which rot from the neck down in storage.',
      why: 'Too much nitrogen late in the season keeps the onion growing leaf when it should be ripening, so the neck never closes.',
      fix: 'Feed with compost before planting and nothing after midsummer, let the tops fall over naturally rather than bending them, and dry the bulbs in sun or an airy shed for two weeks before storing.',
      insteadOf: 'A nitrogen feed late in summer delays bulbing and spoils storage.',
    },
  ],
  shallot: [
    {
      label: 'Downy mildew on shallots',
      looks: 'Pale, oval patches on the leaves with a grey-violet fur in damp weather, then the tops fold over and die back weeks early.',
      why: 'A water mould that spreads on leaves that stay wet in cool, humid weather, and carries over in infected bulbs kept for replanting.',
      fix: 'Plant 20 cm apart so air moves, weed often, water the soil rather than the leaves, and move shallots to a new bed each year. Save only sound, firm bulbs for replanting, and burn or hot-compost any that show the fur.',
      insteadOf: 'Fungicide sprays kill the leaf-surface microbes that compete with the mould and are no use once the fur shows.',
    },
    {
      label: 'Sets pulled out by birds',
      looks: 'Sets lie on the surface a day or two after planting, scattered along the row.',
      why: 'Blackbirds and crows tug at the papery tips, and a set with no roots yet comes straight out.',
      fix: 'Snip off the loose papery tip before planting, push each set in so only its point shows, and cover with fleece or netting for the first two weeks until the roots grip. Replant any that come up.',
    },
    {
      nutrient: 'N',
      label: 'Small clusters of bulbs',
      looks: 'Each set splits into only two or three small bulbs instead of eight to twelve.',
      why: 'Thin, hungry soil, crowding, or a dry spring while the clusters form all mean each set divides into fewer, smaller bulbs.',
      fix: 'Plant into a bed topped with compost the autumn before, 20 cm apart, and water through a dry spring. A weekly watering of nettle liquid from March until the leaves start to yellow helps on poor soil.',
      insteadOf: 'A nitrogen feed after midsummer gives soft necks that rot in storage.',
    },
  ],
  garlic: [
    {
      label: 'Garlic rust',
      looks: 'Bright orange pustules on the leaves from late spring, which yellow and die early, leaving small bulbs.',
      why: 'A fungus that spreads in humid weather and is worse on crowded, soft growth pushed by rich nitrogen feeding.',
      fix: 'Space cloves 15 cm apart, feed with compost at planting and nothing rich later, and rotate so garlic, leeks and onions are not in the same bed two years running. Lift as soon as the leaves are a third brown, since the bulbs keep well even when rust has marked the leaves.',
      insteadOf: 'Fungicides do little once rust has spread and kill the microbes on the leaf that hold it back.',
    },
    {
      label: 'One round bulb instead of cloves',
      looks: 'At lifting, each garlic plant has made one round bulb with no cloves inside when it is cut.',
      why: 'Garlic needs several weeks below about 10°C to split into cloves. Cloves planted in late spring, or in a warm winter, never get that cold.',
      fix: 'Plant in autumn, from October to early December in the north, or chill the cloves in a refrigerator for six weeks before planting where winters are mild. Replant the round bulbs next autumn and they will split.',
    },
    {
      label: 'Cloves rotting over winter',
      looks: 'Gaps in the row in spring, and soft, brown cloves where plants should be.',
      why: 'Heavy, waterlogged soil sits around the cloves for months, and white rot or basal rot gets in.',
      fix: 'Plant on a ridge or a raised bed on heavy ground, work compost and grit into the row, and plant only firm, healthy cloves. On very wet soil, start cloves in pots in a cold frame and plant out in March.',
    },
  ],
  leek: [
    {
      label: 'Leek rust',
      looks: 'Orange pustules along the leaves in late summer and autumn, the leaves yellowing.',
      why: 'A fungus favoured by humid, mild autumns and by crowded, overfed plants, spread on the wind from leek to leek.',
      fix: 'Plant 15 cm apart in rows 30 cm apart, feed with compost at planting rather than nitrogen later, and grow resistant kinds. Leeks usually grow through it in winter, so strip off the outer leaves and eat them as normal.',
      insteadOf: 'A fungicide on a crop that stands for six months leaves residues and rarely stops rust in a mild autumn.',
    },
    {
      label: 'Leek moth and allium leaf miner',
      looks: 'White, papery patches and tunnels along the leaves, and small caterpillars or brown pupae inside the shaft.',
      why: 'Both insects lay on leeks through the season; leaf miner arrives in spring and autumn and has spread widely.',
      fix: 'Cover with fine mesh from planting, especially in March to May and September to November, and trim off damaged leaves. Birds and wasps take many when the garden is left unsprayed.',
      insteadOf: 'Insecticides kill the birds and parasitic wasps that eat the larvae, and a mesh cover works without them.',
    },
    {
      nutrient: 'N',
      label: 'Pencil-thin leeks',
      looks: 'By autumn the leeks are still no thicker than a pencil, with short, pale white shanks.',
      why: 'Leeks transplanted late or into thin soil, with a dry summer holding them back, never get the months of growth they need.',
      fix: 'Plant out in June at pencil thickness into holes 15 cm deep in a bed topped with compost, water each hole in rather than filling it with soil, and water through dry spells. Nettle or comfrey liquid every two weeks through July and August.',
    },
  ],
  peas: [
    {
      nutrient: 'Mn',
      label: 'Marsh spot',
      looks: 'The peas look fine in the pod, but each one has a brown or black hollow in its middle when split.',
      why: 'Manganese shortage at the time the seed fills, from soil that has been limed too heavily or is naturally alkaline.',
      fix: 'Stop liming the pea bed, mulch with leafmould and compost, and let the soil drift back toward pH 6.5. A seaweed mulch carries small amounts of manganese.',
      insteadOf: 'A manganese spray at flowering covers one crop while the over-limed soil keeps locking it away for the next.',
    },
    {
      nutrient: 'Mo',
      label: 'Few root nodules',
      looks: 'Pale, slow plants; lifted, the roots carry only a few nodules, and those are white or green inside rather than pink.',
      why: 'The rhizobium bacteria that fix nitrogen in pea roots need molybdenum and a soil near neutral; acid soil starves both.',
      fix: 'Lime an acid bed to about pH 6.5 the winter before, add compost, and grow peas where peas or beans grew in the past few years, since the right bacteria stay in the soil. Leave the roots in the ground after the crop so the nodules feed the next one.',
      insteadOf: 'A nitrogen feed on peas tells the plant to stop making nodules, so it depends on the bag from then on.',
    },
    {
      label: 'Powdery mildew on late peas',
      looks: 'A white dusting spreads over leaves and pods from July, and the plants dry out and stop cropping.',
      why: 'Dry roots with humid air, and peas sown late so they flower in the heat of summer, when the mildew fungus spreads fastest.',
      fix: 'Sow early in spring and again in early summer with a resistant kind, water the soil deeply in dry spells, and mulch with compost. Diluted milk (one part to nine of water) on the leaves is a home remedy some growers trust.',
      insteadOf: 'Fungicide sprays on a crop picked every few days kill the leaf-surface microbes that compete with mildew and leave residues on the pods.',
    },
  ],
  greenbeans: [
    {
      label: 'Halo blight',
      looks: 'Small water-soaked spots on the leaves, each ringed by a pale yellow halo, and greasy patches on the pods.',
      why: 'A bacterium carried inside the seed and splashed from plant to plant by rain and overhead watering, worst in cool, wet summers.',
      fix: 'Buy clean seed from a trusted source or save seed only from healthy plants, water at the base, and pull and hot-compost affected plants. Rotate beans to a new bed each year.',
      insteadOf: 'Copper sprays build up in soil and harm earthworms, and they do little once the bacterium is in the seed.',
    },
    {
      label: 'Flowers but no pods',
      looks: 'Plenty of flowers on the bush beans that fall off without setting a pod, week after week.',
      why: 'Hot, dry weather over about 30°C, dry roots, or too much nitrogen all make beans drop their flowers.',
      fix: 'Water deeply once the flowers show, mulch with compost or straw, and never feed beans with anything rich in nitrogen. Sow a second batch to flower in cooler weeks.',
    },
    {
      nutrient: 'Mn',
      label: 'Pale speckled leaves on chalky soil',
      looks: 'Young bean leaves pale between green veins, with tiny brown speckles, and the plants slow down.',
      why: 'French beans are sensitive to manganese shortage on alkaline or over-limed soil.',
      fix: 'Grow beans away from a bed that was just limed, mulch with leafmould, and add compost every year so the soil life keeps manganese in a form roots can take up.',
      insteadOf: 'A trace-element spray treats the leaves and leaves the alkaline soil as it was.',
    },
  ],
  runnerbeans: [
    {
      label: 'Flowers falling without setting pods',
      looks: 'Red or white flowers open and drop off, and few pods form, often in midsummer.',
      why: 'Dry roots, hot nights, and too few bees. Runner beans need a pollinator to trip each flower.',
      fix: 'Dig a trench the autumn before and fill it with kitchen scraps and compost to hold moisture, water deeply twice a week once the flowers open, and mulch. Grow sweet peas up the same poles to bring in bees.',
      insteadOf: 'Misting the flowers helps less than people hope; the trench of compost under the roots is what holds the set.',
    },
    {
      label: 'Blackfly on the tips',
      looks: 'Dense black aphids on the growing tips and flower stalks of the climbing beans.',
      why: 'Blackfly build up on soft growth in early summer, before the ladybirds and hoverflies that eat them have built up in number.',
      fix: 'Pinch out infested tips and compost them, hose off the rest, and grow calendula and yarrow at the foot of the poles for ladybirds and hoverflies. Ants farming the aphids can be kept off with a band of grease on each pole.',
      insteadOf: 'An insecticide spray kills the ladybird larvae that would have cleared them within two weeks.',
    },
    {
      label: 'Stringy, tough pods',
      looks: 'Runner bean pods grow long, lumpy and tough, with a thick string down each side.',
      why: 'Pods left to grow too big turn stringy, and plants short of water toughen their pods faster.',
      fix: 'Pick every two or three days while the pods snap cleanly, and keep the soil moist. Stringless kinds help. Leaving pods to ripen tells the plant to stop flowering.',
    },
  ],
  broadbeans: [
    {
      label: 'Chocolate spot',
      looks: 'Small chocolate-brown spots on the leaves and stems, which join into dark patches in a wet spring.',
      why: 'A fungus favoured by damp, still air and by plants weak from wet or hungry soil.',
      fix: 'Sow autumn beans 20 cm apart in a well-drained bed, add compost to improve drainage, and avoid too much nitrogen. Burn or hot-compost badly marked plants at the end of the crop.',
      insteadOf: 'Fungicide sprays in a wet spring are washed off by the next shower; spacing and drainage are the defence.',
    },
    {
      label: 'Blackfly on broad beans',
      looks: 'Black aphids crowd the top few centimetres of each stem from late spring.',
      why: 'The aphids move onto broad beans as the tips grow soft, just as the first pods set.',
      fix: 'Pinch out the top 8 cm once the lowest pods set, which removes the aphids with the tips, and eat the tips as greens. Autumn sowings are usually past their soft stage before blackfly arrive.',
      insteadOf: 'Sprays kill the ladybirds and hoverflies arriving to feed on the aphids.',
    },
    {
      label: 'Bean weevil notches',
      looks: 'Neat U-shaped notches bitten out around the leaf edges of young broad bean plants.',
      why: 'Pea and bean weevils feed on the leaf edges in spring; the larvae feed on the root nodules below.',
      fix: 'Grow on steadily in compost-rich soil so the plants outgrow it, and cover young plants with fleece in a dry spring. Strong plants take no lasting harm.',
    },
  ],
  cucumber: [
    {
      label: 'Bitter fruit',
      looks: 'Cucumbers look normal but taste bitter, most of all at the stalk end and just under the skin.',
      why: 'The plant makes more of its bitter compound under stress: dry roots, big swings between day and night temperature, and, in older greenhouse kinds, pollinated fruit.',
      fix: 'Water every day or two in hot weather, mulch the roots with compost, shade the glass in high summer, and keep the greenhouse door open by day. Grow modern all-female kinds under cover and pinch off any male flowers on older ones.',
    },
    {
      label: 'Red spider mite under glass',
      looks: 'Fine pale mottling on the leaves, then fine webbing and tiny mites on the undersides.',
      why: 'Hot, dry greenhouse air is where these mites breed fastest, and a generation takes little more than a week in summer heat.',
      fix: 'Damp down the greenhouse floor twice a day in summer, mist the leaves, and bring in the predatory mite Phytoseiulus as soon as mottling shows.',
      insteadOf: 'Mites build resistance to sprays within a few generations, and the sprays kill the predators that control them.',
    },
    {
      nutrient: 'N',
      label: 'Fruit that yellows and withers young',
      looks: 'Small cucumbers yellow and shrivel from the tip before they grow, while new ones keep forming.',
      why: 'A plant carrying more fruit than its roots can feed, often in a small pot or grow bag, or one left dry for a day in hot weather.',
      fix: 'Pick often and young, allow one fruit per leaf joint, grow in a bed or a pot of at least 20 litres of compost and garden soil, and water on comfrey or nettle liquid every week once the first fruit forms.',
      insteadOf: 'Bottled feeds in a grow bag build up salts in a small root space and scorch the roots that are already struggling.',
    },
  ],
  courgette: [
    {
      label: 'Powdery mildew on courgettes',
      looks: 'White patches on the big leaves from midsummer, spreading until the leaves go grey and brittle.',
      why: 'Dry roots with humid air; courgettes are among the plants most prone to it, and almost every plant shows some by late summer.',
      fix: 'Water the roots deeply, mulch with compost, and cut off the worst leaves. Diluted milk sprayed on the leaves once a week is a home remedy some growers trust; plant a second batch in early summer to take over.',
      insteadOf: 'A fungicide on a crop picked every day or two leaves residue on the fruit you eat.',
    },
    {
      label: 'Small fruit rotting from the tip',
      looks: 'Young courgettes go soft and brown from the flower end, stop growing and fall off at finger length.',
      why: 'The flower was not pollinated, which is common in cold, wet spells early in summer when few bees fly and the first flowers are mostly female.',
      fix: 'On a dry morning, pick a male flower (thin stalk, no baby fruit), strip its petals and press it into the open female flower. Grow borage, calendula and phacelia nearby to bring in bees. It usually clears up as the weather warms.',
    },
    {
      nutrient: 'N',
      label: 'Plants stalling after planting out',
      looks: 'Courgette plants sit small and yellow-green for weeks after planting out, the lower leaves yellowing first.',
      why: 'Cold soil slows the roots of a plant that has to grow huge in a few weeks, and a bed with little organic matter cannot keep up.',
      fix: 'Plant out only after the last frost into a pocket a spade deep filled with compost or well-rotted manure, water in with nettle liquid or fish amino acid (FAA), and cover with fleece on cold nights. A thick mulch of compost keeps the roots warm and fed.',
      insteadOf: 'A soluble feed into cold soil mostly washes past the roots before they are awake to use it.',
    },
  ],
  squash: [
    {
      label: 'Squash that will not ripen',
      looks: 'By the first frost the pumpkins and winter squash are still green, with soft skins and pale flesh.',
      why: 'A plant carrying too many fruits for the length of the summer, planted out late, or growing all leaf from a rich bed.',
      fix: 'Plant out as soon as frosts end into a mound of compost, keep three or four fruits per plant, and pinch out the vine tips once they have set. In autumn, cut away leaves shading the fruit and turn each one to face the sun.',
    },
    {
      label: 'Squash rotting in store',
      looks: 'Stored winter squash go soft and mouldy at the stalk end or on the patch where they sat on the ground.',
      why: 'Squash cut unripe, bruised, cut without a stalk, or put away without curing let rot organisms in through the soft skin.',
      fix: 'Slip straw or a tile under each fruit as it ripens, cut only once the skin resists a thumbnail, leave 5 cm of stalk, and cure in the sun or a warm room for ten days before storing somewhere dry at 10 to 15°C. Use any with a damaged stalk first.',
    },
    {
      label: 'Squash vine borer',
      looks: 'A plant wilts suddenly at midday; at the base of the stem there is a hole and frass like sawdust.',
      why: 'A moth larva that tunnels into the stems of squash and pumpkins in North America.',
      fix: 'Cover young plants with mesh until they flower, heap soil over leaf joints so the vine roots again, and slit the stem to remove the larva. Grow butternut types, which resist it.',
      insteadOf: 'Insecticides must reach the inside of the stem and kill the bees that pollinate the flowers.',
    },
  ],
  sweetcorn: [
    {
      nutrient: 'N',
      label: 'Yellow V on the lower leaves',
      looks: 'The older sweetcorn leaves yellow in a V shape from the tip back along the midrib.',
      why: 'Sweetcorn is a hungry grass and pulls nitrogen from its old leaves when the soil is thin.',
      fix: 'Grow after beans or a legume green manure, plant into a bed topped with compost, and water on nettle liquid or fish amino acid (FAA) once a week until the tassels show.',
      insteadOf: 'A granular nitrogen top dressing is quick but leaves the soil poorer and washes into water.',
    },
    {
      nutrient: 'P',
      label: 'Purple seedlings',
      looks: 'Young sweetcorn plants turn purple-red along the leaf edges and undersides in a cold spring.',
      why: 'Cold soil slows the roots, which cannot take up phosphorus fast enough even when the soil holds plenty of it.',
      fix: 'Wait until the soil reaches about 12°C before sowing, and start in pots under cover. Compost and mycorrhizal fungi help roots reach phosphorus. It fades as the soil warms.',
      insteadOf: 'Adding phosphate to a cold soil rarely helps; it is the cold, not a shortage.',
    },
    {
      label: 'Gappy cobs',
      looks: 'Husked cobs are patchy, with rows of missing or shrivelled kernels, often worst at the tip.',
      why: 'Each kernel needs a grain of pollen blown from a tassel onto the silk that leads to it. Corn in a single long row loses most of its pollen to the wind, and dry roots at tasselling make it worse.',
      fix: 'Plant in a block at least four plants by four, 35 to 45 cm apart, and water deeply when the tassels show. On a still day, tap the tassels over the silks. The Three Sisters way, beans and squash among the corn, keeps the soil moist and fed at that stage.',
    },
  ],
  celery: [
    {
      nutrient: 'B',
      label: 'Cracked stems',
      looks: 'Brown cracks run across the stalks, which snap brittle, and the leaflets may show brown mottled edges.',
      why: 'Celery needs a steady supply of boron, and light, sandy or recently limed soil holds little of it, worse in a dry spell.',
      fix: 'Add compost and a scatter of seaweed each year, keep the bed moist with a thick mulch, and hold off liming. Borax at a few grams across several square metres only after a soil test shows a shortage.',
      insteadOf: 'Boron added to a bed that was not short can harm the next crops for years, since the gap between enough and too much is narrow.',
    },
    {
      nutrient: 'Ca',
      label: 'Blackheart',
      looks: 'The youngest leaves in the centre of the plant turn brown, then black and slimy, while the outer stalks look healthy.',
      why: 'Too little water reaching the heart in hot, dry weather carries too little calcium with it, and rich nitrogen feeding speeds the growth that runs short.',
      fix: 'Celery grew wild in marshes: keep the soil constantly moist with compost dug in deep and a thick mulch on top, water every day in hot spells, and feed with compost rather than anything rich in nitrogen.',
      insteadOf: 'Calcium sprays land on the outer stalks; the heart only gets calcium through water from the roots.',
    },
    {
      label: 'Celery leaf miner',
      looks: 'Pale then brown blisters spread across the leaflets, each holding a small white maggot, and the stalks grow bitter.',
      why: 'A small fly lays in the leaves from spring, and its larvae tunnel between the leaf surfaces.',
      fix: 'Pinch out blistered leaflets as soon as they show and squash the maggot inside, cover young plants with fine mesh, and keep the plants growing steadily so they outgrow the damage.',
      insteadOf: 'Sprays barely reach a larva sealed inside the leaf, and they kill the parasitic wasps that do.',
    },
  ],
  asparagus: [
    {
      label: 'Asparagus beetle',
      looks: 'Small beetles with cream and black checked backs, and grey grubs stripping the ferns bare from late spring.',
      why: 'The beetle overwinters in debris near the bed and lays on the spears and ferns; stripped ferns mean a weaker crown next year.',
      fix: 'Pick beetles and grubs off by hand each morning, clear old ferns in autumn and compost them hot, and grow tomatoes, basil or French marigolds nearby, which many growers report the beetle avoids. Birds and ladybirds eat the grubs.',
      insteadOf: 'Spraying ferns kills the ladybirds and parasitic wasps that keep the beetle down, and residues on a perennial bed linger.',
    },
    {
      label: 'Thin, spindly spears',
      looks: 'Each spring the spears come thinner than a pencil and fewer than before.',
      why: 'A crown cut too hard or too long the year before, or cut before its third year, has too little stored in its roots.',
      fix: 'Stop cutting by midsummer so the ferns can feed the crown, leave a new bed uncut for two years, and spread 5 cm of compost or well-rotted manure over the bed each autumn once the ferns are cut down.',
      insteadOf: 'Salt was once spread on asparagus beds to kill weeds; it harms soil life and the crowns in the long run.',
    },
    {
      label: 'Crowns rotting in wet soil',
      looks: 'Gaps where crowns failed to come up, and crowns that are soft and brown when dug.',
      why: 'Asparagus lives twenty years in one place and will not stand waterlogged soil, where root rots get in.',
      fix: 'Plant on a raised bed or ridge on heavy land, work in compost and grit, and never plant into a bed that held asparagus before. Keep the bed weeded by hand and mulched.',
    },
  ],
  rhubarb: [
    {
      label: 'Crown rot',
      looks: 'The buds in the middle of the crown rot, stalks are thin and few, and the crown is soft and brown when cut.',
      why: 'A bacterium or fungus that gets into crowns sitting in wet, heavy ground, often in old, crowded plants.',
      fix: 'Dig out and burn any rotten crown, plant new divisions in well-drained ground with compost, and keep the crown just at the surface. Lift and divide healthy plants every five to ten years.',
    },
    {
      label: 'Flower stalks',
      looks: 'Thick stalks topped with large cream flower heads rise from the crown in late spring.',
      why: 'Stress from a dry spell or cold, or an old crown ready to be divided, tells the rhubarb to put its energy into seed.',
      fix: 'Cut flower stalks off at the base as soon as they appear, water in dry weather, and mulch with compost or manure each winter. Lift and divide crowns more than five years old in winter.',
    },
    {
      nutrient: 'N',
      label: 'Thin, pale stalks',
      looks: 'Few rhubarb stalks come up, thin and more green than red, under small leaves.',
      why: 'Rhubarb is a hungry plant in one spot for years, and an unfed crown or one picked too hard runs short.',
      fix: 'Spread a thick layer of compost or well-rotted manure around, not over, the crown each winter, stop pulling by midsummer, and never take more than half the stalks at once.',
      insteadOf: 'A spring nitrogen feed gives a burst of soft stalks and leaves the crown weaker the year after.',
    },
  ],
  globeartichoke: [
    {
      label: 'Crowns lost over winter',
      looks: 'In spring a globe artichoke crown fails to shoot, and the roots are soft and dark when lifted.',
      why: 'The plant comes from the dry Mediterranean and rots when its crown sits in cold, wet soil through winter.',
      fix: 'Plant in a sunny, well-drained spot with compost and grit worked in, mulch the crowns with 15 cm of straw or bracken in late autumn and pull it back in spring, and take rooted offsets each spring to replace plants older than four years.',
    },
    {
      label: 'Black bean aphid on the heads',
      looks: 'Black aphids pack the flower stems and work down between the scales of the heads.',
      why: 'Aphids build up on the soft summer growth before the predators that eat them arrive in numbers.',
      fix: 'Hose them off each morning, rub colonies off the stems, and grow calendula, fennel and yarrow nearby to bring in hoverflies and ladybirds. Soak picked heads in salted water for half an hour before cooking.',
      insteadOf: 'Sprays on a head you eat leave residues deep between the scales, and kill the ladybirds that were on their way.',
    },
    {
      nutrient: 'N',
      label: 'Small, tough heads',
      looks: 'The heads stay small, the scales open early and the base is tough and stringy.',
      why: 'A plant short of water and food while the heads form, or heads left on the plant a few days too long.',
      fix: 'Spread a thick mulch of compost or well-rotted manure around each plant every spring, water deeply in dry spells, and cut the top head while its scales are still tight, then the side heads as they follow.',
    },
  ],
  jerusalemartichoke: [
    {
      label: 'Plants spreading across the bed',
      looks: 'Shoots come up all over the bed and into the paths the spring after harvest.',
      why: 'Every scrap of tuber left in the ground grows into a new plant, so a patch spreads each year it is dug.',
      fix: 'Give it a separate corner away from the vegetable beds, fork over carefully at harvest and take every tuber, and replant only the number of plants you want. Pigs and chickens clear an old patch well.',
      insteadOf: 'Weedkiller on the shoots poisons a bed you may want back for food and rarely reaches every tuber.',
    },
    {
      label: 'Stems blown over',
      looks: 'The tall stems lean, snap or rock loose in late summer gales, and the tubers stay small.',
      why: 'The stems grow up to 3 m, and wind rocking them loosens the roots just as the tubers swell.',
      fix: 'Earth up the stems to 15 cm when they reach 30 cm tall, plant on the side of the plot where they will not shade other crops so they shelter the rest from wind, and cut the tops back to 1.5 m in midsummer.',
    },
    {
      label: 'Knobbly, small tubers',
      looks: 'The Jerusalem artichoke tubers are small, knobbly and very hard to peel.',
      why: 'Crowding in the same patch year after year, and planting the knobbliest tubers because the best ones were eaten.',
      fix: 'Replant only the largest, smoothest tubers each spring, 30 cm apart, into ground fed with compost. Smooth kinds such as Fuseau make cooking easier.',
    },
  ],
  basil: [
    {
      label: 'Basil downy mildew',
      looks: 'Leaves yellow between the veins and grow a grey-purple fur on the underside, then blacken.',
      why: 'A water mould spread in humid, warm weather and on leaves wet overnight; it arrived in many countries in the last twenty years.',
      fix: 'Water the pot or soil in the morning and never the leaves, space plants for air, and pick often so plants stay open. Grow resistant kinds, and pull and bin affected plants.',
      insteadOf: 'Fungicides on a leaf picked for the table leave residues, and once the fur shows none of them saves the plant.',
    },
    {
      label: 'Seedlings collapsing',
      looks: 'Basil seedlings fall over at soil level, with a thin, dark, pinched stem.',
      why: 'Damping off: soil fungi that attack seedlings in cold, wet compost, spreading fast across a crowded tray.',
      fix: 'Sow into fresh compost in warmth above 18°C, water from below rather than over the seedlings, thin them early so air moves between them, and give them bright light so the stems stay short and firm.',
      insteadOf: 'Copper dips for seedlings add metal to compost and harm the microbes that protect roots.',
    },
    {
      nutrient: 'N',
      label: 'Pale basil in a pot',
      looks: 'The leaves on a potted basil turn pale and small after a few weeks of picking.',
      why: 'A small pot runs out of nitrogen quickly under a plant picked every day, and every watering washes a little more out.',
      fix: 'Pot on into a larger pot with fresh compost, and water on diluted nettle liquid or fish amino acid (FAA) every two weeks. Pinch the tips rather than stripping leaves.',
    },
  ],
  parsley: [
    {
      label: 'Slow germination',
      looks: 'Weeks after sowing, only a few parsley seedlings have come up in the row.',
      why: 'Parsley seed carries a compound that slows germination, and cold, dry soil slows it more.',
      fix: 'Soak seed overnight, sow into warm soil in late spring, and keep the row moist with a covering of sieved compost. Sow in pots for an early start.',
    },
    {
      label: 'Carrot fly on parsley',
      looks: 'Parsley leaves turn red and yellow and wilt in sun; the roots have rusty brown tunnels.',
      why: 'Parsley is a carrot relative and attracts the same low-flying fly, which lays its eggs at the base of the plants.',
      fix: 'Grow under fine mesh, or in pots and troughs raised at least 60 cm off the ground where the fly rarely reaches, and sow among onions or chives to mask the scent.',
      insteadOf: 'Soil insecticides linger and kill the ground beetles that eat the fly eggs.',
    },
    {
      label: 'Going to seed in its second year',
      looks: 'In its second spring, the plant grows a tall flower stalk and the leaves turn bitter.',
      why: 'Parsley is a biennial: it grows leaf in its first year and flowers in its second, when the leaves turn tough and bitter.',
      fix: 'Sow a new batch each summer so there is always a young plant coming on, and pull the old plant once it runs up. Leave some flowers for hoverflies and to self-seed.',
    },
  ],
  coriander: [
    {
      label: 'Bolting in summer',
      looks: 'Coriander plants run up to flower within weeks, and the leaves turn fine and feathery.',
      why: 'Heat, long days and dry roots all make coriander flower quickly, since it is a cool-season plant.',
      fix: 'Sow little and often in spring and autumn, in partial shade, into moist soil with compost. Grow slow-bolting kinds. Save seed from bolted plants as the spice.',
    },
    {
      label: 'Transplant shock',
      looks: 'Transplanted coriander seedlings flop and stall, and many bolt at once instead of growing on.',
      why: 'Coriander has a taproot that does not like disturbance, and a damaged root makes the plant flower early.',
      fix: 'Sow direct where it will grow, or in deep modules or paper pots planted out whole before the roots reach the bottom. Water well after planting and keep the soil moist under compost.',
    },
    {
      label: 'Soft rot at the base',
      looks: 'Coriander plants yellow and collapse at soil level in wet weather, the stems soft and brown.',
      why: 'Crowded plants in wet, heavy soil, where soil fungi and bacteria get in at the base of soft stems.',
      fix: 'Thin seedlings to 5 cm apart, grow in well-drained soil with compost, water in the morning so the base dries by evening, and pull and compost collapsed plants at once.',
    },
  ],
  mint: [
    {
      label: 'Mint rust',
      looks: 'Swollen, twisted shoots in spring with orange pustules, then brown spots under the leaves through summer.',
      why: 'A fungus that lives in the roots and runners, so it comes back every year in the same patch.',
      fix: 'Cut the patch to the ground in autumn and burn or bin the stems, lift and wash clean runners from healthy plants and start a new patch elsewhere in fresh compost, and grow mint in a pot or bottomless bucket to keep it apart.',
      insteadOf: 'A fungicide cannot reach the rust in the roots and leaves residues on a herb picked for tea.',
    },
    {
      label: 'Mint spreading everywhere',
      looks: 'Runners come up metres from where the mint was planted, through paths and other beds.',
      why: 'Mint spreads by underground runners that can travel a metre in a season and takes over rich, moist soil.',
      fix: 'Grow it in a pot, or in a bucket with its base cut out sunk into the ground with a lip above the soil. Lift and replant every two or three years.',
    },
    {
      nutrient: 'N',
      label: 'Woody, tired mint',
      looks: 'The centre of the clump goes bare and woody, and the leaves are small and pale.',
      why: 'An old mint clump uses up the soil in its pot or corner, and the centre dies back while the runners move outward.',
      fix: 'Lift in spring, replant young pieces from the edge of the clump into fresh compost, and top-dress each spring with compost. Water on nettle liquid once or twice in summer after a hard cut.',
    },
  ],
  rosemary: [
    {
      label: 'Root rot in wet soil',
      looks: 'The whole bush turns grey-brown from the base up and dies, often after a wet winter.',
      why: 'Rosemary grows on dry Mediterranean hillsides and its roots rot in soil that stays wet.',
      fix: 'Plant in sharply drained soil with grit, on a slope or in a raised bed, or in a pot of gritty compost with drainage holes raised on feet. Never stand it in a saucer.',
    },
    {
      label: 'Rosemary beetle',
      looks: 'Metallic green and purple striped beetles and grey grubs on the shoots, eating the leaves.',
      why: 'An insect that arrived in many gardens recently and feeds on rosemary, lavender, sage and thyme.',
      fix: 'Spread a sheet under the bush and shake it; the beetles drop and can be picked up. Do this weekly from late summer to spring, when adults and grubs feed, and check lavender, sage and thyme nearby.',
      insteadOf: 'Insecticides on a flowering shrub kill the bees that visit the flowers.',
    },
    {
      label: 'Woody, bare stems',
      looks: 'Long, bare woody rosemary stems with tufts of leaves only at the tips.',
      why: 'Rosemary never trimmed grows leggy, and it rarely regrows when cut back hard into old, leafless wood.',
      fix: 'Trim lightly after flowering each year, taking off the soft growth but never cutting into bare wood, and replace plants older than about ten years with cuttings taken in summer.',
    },
  ],
  thyme: [
    {
      label: 'Thyme dying back after a wet winter',
      looks: 'Whole patches of a thyme plant go brown and brittle in late winter, starting where the stems touch wet soil.',
      why: 'Thyme grows wild on dry, stony slopes, and its fine roots and low stems rot when they sit in cold, wet ground for weeks.',
      fix: 'Plant in gritty, free-draining soil, between paving stones, on a wall top or in a raised bed. Mulch around the crown with gravel rather than compost so the stems stay dry, and feed the bed lightly: thyme on lean soil has the strongest flavour.',
    },
    {
      label: 'Woody plants opening in the middle',
      looks: 'After three or four years the plant splits open in the centre, leaving bare woody stems with leaves only around the edge.',
      why: 'Thyme is a short-lived shrub, and one left unclipped grows long and woody and cannot break new shoots from old wood.',
      fix: 'Clip lightly all over straight after flowering to keep it bushy, never into bare wood, and take soft cuttings in early summer every few years so a young plant is ready to replace the old one.',
    },
    {
      label: 'Leggy thyme with little scent',
      looks: 'Stems stretch thin toward the light, with few leaves spaced far apart and little smell when brushed.',
      why: 'Thyme needs at least six hours of direct sun; in shade or on a rich, well-watered bed it grows soft and loses its oils.',
      fix: 'Move it to the sunniest, driest spot in the garden, or a pot on a south-facing sill, stop feeding it, and water only when the pot is dry right through.',
      insteadOf: 'A feed to perk it up gives more soft growth and even less flavour.',
    },
  ],
  oregano: [
    {
      label: 'Oregano rotting in wet soil',
      looks: 'The low mat of oregano yellows and rots at the centre through a wet winter, with gaps opening in spring.',
      why: 'Oregano and marjoram come from dry Mediterranean hillsides, and the crown rots where water sits around it.',
      fix: 'Plant in well-drained soil with grit worked in, or in a raised bed or pot, and cut the old flowering stems back to the new growth at the base in autumn so the crown dries between rains.',
    },
    {
      label: 'Mild, flavourless leaves',
      looks: 'Oregano leaves are large, soft and green but taste of very little when crushed.',
      why: 'Oregano grown in rich soil, in shade, or from seed of a mild kind makes little of its aromatic oil.',
      fix: 'Grow in full sun on lean soil and stop feeding, or buy a named Greek oregano plant (Origanum vulgare subsp. hirtum). Pick just before flowering, when the oil peaks, and dry the stems in bunches.',
    },
    {
      label: 'Oregano running to flower',
      looks: 'By midsummer the plant is all tall flower stalks with few leaves below.',
      why: 'Oregano flowers from midsummer and puts its strength into flowers when left uncut.',
      fix: 'Cut half the clump back in early summer for leaves, and leave the other half to flower, since oregano flowers are among the best for bees and butterflies in the whole garden.',
    },
  ],
  sage: [
    {
      label: 'Sage rotting at the base',
      looks: 'Branches wilt and die from the base, and the bark at soil level is black and soft.',
      why: 'Sage comes from dry, stony hillsides and cannot stand wet, heavy soil, above all in winter.',
      fix: 'Grow in free-draining soil with grit, raise the bed on clay, and keep compost and mulch pulled back from the stems. Replace plants every four or five years with cuttings.',
    },
    {
      label: 'Powdery mildew on sage',
      looks: 'A white, felty dusting spreads over the grey-green sage leaves in late summer.',
      why: 'Crowded, still air around the plant and roots that went dry in a hot spell, which is when the mildew fungus spreads fastest.',
      fix: 'Space sage plants 60 cm apart, prune after flowering to open the bush to air, water deeply at the roots in a long dry spell, and cut off the worst stems and bin them.',
      insteadOf: 'A fungicide on a leaf you cook with leaves residues, and pruning for air does the job without one.',
    },
    {
      label: 'Leggy sage with bare stems',
      looks: 'Long, leggy sage branches splay open, with leaves only at the tips and bare wood below.',
      why: 'Sage becomes woody and open unless it is trimmed every year, and old plants rarely regrow from bare wood.',
      fix: 'Cut back by a third in spring once new growth shows and again after flowering, never into bare wood. Layer a low branch into the soil to root a new plant.',
    },
  ],
  dill: [
    {
      label: 'Dill bolting fast',
      looks: 'Dill runs up to flower within weeks of sowing, with few feathery leaves.',
      why: 'Long days, heat, dry soil and the disturbance of transplanting all make dill flower early.',
      fix: 'Sow direct where it will grow, since it hates being moved, a short row every three weeks from spring. Keep the soil moist under a thin compost mulch, and let some plants flower: the umbels feed hoverflies and parasitic wasps.',
    },
    {
      label: 'Aphids on dill',
      looks: 'Green or black aphids crowd the stems and the flat flower heads of the dill.',
      why: 'Soft dill growth in early summer draws aphids, and the flowers then draw the predators.',
      fix: 'Leave them a few days, since ladybirds and hoverflies arrive fast on dill and breed there. Hose off heavy colonies and cut the worst stems. Dill grown this way feeds predators for the whole garden.',
      insteadOf: 'Spraying dill kills the very predators it was drawing in for the rest of the garden.',
    },
    {
      label: 'Dill crossing with fennel',
      looks: 'Self-sown dill seedlings with a strange, muddled flavour that is neither dill nor fennel.',
      why: 'Dill and fennel are close relatives and cross-pollinate when they flower in the same garden at the same time.',
      fix: 'Grow them at opposite ends of the garden, or cut one of them before it flowers. Buy fresh seed if you want true dill, and save seed only from dill grown well away from fennel.',
    },
  ],
  chives: [
    {
      label: 'Rust on chives',
      looks: 'Orange spots and streaks along the hollow chive leaves in late summer, the tips yellowing.',
      why: 'The same rust fungus that attacks leeks and garlic, favoured by humid weather and crowded clumps.',
      fix: 'Cut the whole clump down to 5 cm and compost the leaves hot; the new growth usually comes back clean. Divide crowded clumps so air moves, and grow chives away from the leek bed.',
      insteadOf: 'A fungicide on a herb snipped straight into the kitchen leaves residue, and cutting back clears it without one.',
    },
    {
      label: 'Congested, grassy clumps',
      looks: 'After a few years the clump is dense, the leaves thin as grass and the flowers few.',
      why: 'Chives multiply into a tight mass of small bulbs that compete with each other for room and food.',
      fix: 'Lift the clump in spring or autumn every three years, pull it apart into pieces of six to ten bulbs, and replant them 20 cm apart into soil freshened with compost. Water them in with diluted nettle liquid.',
    },
    {
      nutrient: 'N',
      label: 'Pale chives in a pot',
      looks: 'Chives on a windowsill turn pale yellow-green and flop after a few cuts.',
      why: 'A small pot runs out of food and a cut clump has to regrow every leaf from the bulb.',
      fix: 'Pot into a larger pot of compost and garden soil, cut only half the clump at a time, and give the pot a summer outdoors to recover. A monthly watering of fish amino acid (FAA) at about 1 to 1,000 helps.',
    },
  ],
  tarragon: [
    {
      label: 'Tarragon lost in a wet winter',
      looks: 'French tarragon fails to reappear in spring, and the roots are soft when dug.',
      why: 'French tarragon does not set seed, grows only from root divisions, and rots in cold, wet soil.',
      fix: 'Plant in free-draining soil with grit, cover the crown with a dry mulch of straw in winter, or grow in a pot moved under cover. Divide and replant every three years to keep it vigorous.',
    },
    {
      label: 'Tarragon with no flavour',
      looks: 'A tall, coarse tarragon plant with leaves that taste of little or nothing.',
      why: 'It is Russian tarragon, which grows from seed and lacks the aniseed flavour of French tarragon.',
      fix: 'Buy French tarragon as a plant, taste a leaf before buying, and grow it in sun on lean soil. Seed sold as tarragon is almost always Russian.',
    },
    {
      label: 'Rust on tarragon',
      looks: 'Tiny orange-brown spots under the tarragon leaves in summer, with leaves yellowing and falling.',
      why: 'A rust fungus favoured by humid air and by crowded, overfed plants, which returns each year on the same clump.',
      fix: 'Cut the plant to the ground, bin the stems rather than composting them, and let it regrow clean. Move it to a sunnier, airier spot with leaner soil, and divide old clumps every three years.',
      insteadOf: 'A fungicide on a culinary herb leaves residues, and cutting down clears it.',
    },
  ],
  lemonbalm: [
    {
      label: 'Lemon balm seeding everywhere',
      looks: 'Hundreds of lemon balm seedlings come up across nearby beds and paths the year after flowering.',
      why: 'Lemon balm sets plenty of seed that germinates readily, and seedlings come up in every bare patch nearby.',
      fix: 'Cut the plant back hard just as flowering starts, which also brings a fresh flush of leaves for tea. Pull seedlings while small, or pot them up to give away.',
    },
    {
      label: 'Powdery mildew on lemon balm',
      looks: 'A white powder spreads over the lemon balm leaves in late summer, which yellow and drop.',
      why: 'Dry roots and crowded, still air, above all on old clumps late in the season when growth slows.',
      fix: 'Cut back to 10 cm in midsummer so new growth comes clean, water deeply in dry spells, thin crowded clumps, and mulch with compost to hold moisture at the roots.',
      insteadOf: 'Fungicides on a tea herb leave residues in the cup.',
    },
    {
      label: 'Weak lemon scent',
      looks: 'The lemon balm leaves smell weak and grassy rather than of lemon when crushed.',
      why: 'Old woody growth and too much shade; the scent is strongest in young leaves grown in sun.',
      fix: 'Cut the plant back hard twice a summer to force young leaves, and grow it in sun or light shade on soil with a little compost rather than a rich feed.',
    },
  ],
  strawberry: [
    {
      label: 'Grey mould on the berries',
      looks: 'Ripening strawberries go soft and brown and grow a fluffy grey fur, spreading to the berries touching them.',
      why: 'Botrytis, a fungus that thrives in wet weather on fruit lying on damp soil or packed among dense leaves.',
      fix: 'Tuck clean straw under the plants as the fruit swells, space them 40 cm apart, water the soil in the morning, pick every day or two, and remove any mouldy berry at once. Clear old leaves after fruiting.',
      insteadOf: 'Fungicides sprayed at flowering land on fruit you pick a few weeks later, and straw under the berries does most of the job.',
    },
    {
      nutrient: 'Ca',
      label: 'Tipburn on new strawberry leaves',
      looks: 'The tips of the young, unfolding leaves in the crown turn brown and crisp, and the berries stay small and soft.',
      why: 'Too little water reaching the growing crown in a hot, fast-growing spell, which carries too little calcium into the new leaves.',
      fix: 'Water deeply and evenly, above all in hot weeks and in pots, and mulch the bed with compost under the straw. Eggshell calcium (WCA) sprayed on the crowns is used by Korean Natural Farming growers.',
      insteadOf: 'A calcium spray on the old leaves never reaches the crown, which only gets calcium through the water it draws up.',
    },
    {
      label: 'Tired plants with small berries',
      looks: 'After three or four years the plants crop less, with small, misshapen berries.',
      why: 'Old strawberry plants build up virus and root disease, and the bed runs down after three or four years of cropping.',
      fix: 'Root the strongest runners from healthy plants into pots each summer, start a new bed in a fresh spot every three or four years with compost dug in, and compost the old plants hot.',
    },
  ],
  raspberry: [
    {
      nutrient: 'Fe',
      label: 'Yellow leaves on chalky soil',
      looks: 'The young raspberry leaves turn yellow between green veins, the whole cane pales, and the crop falls away.',
      why: 'Raspberries want slightly acid soil; on chalk or limy ground the iron is there but locked away from the roots.',
      fix: 'Mulch every spring with 5 cm of leafmould, pine needles, composted bark or well-rotted manure, water with rainwater rather than hard tap water, and never lime the row. On very alkaline ground, grow in raised beds of acid compost.',
      insteadOf: 'Iron sequestrene greens the leaves for a season while the lime keeps locking the iron away.',
    },
    {
      label: 'Raspberry beetle grubs',
      looks: 'Ripe berries with a small white grub inside and a dry, brown patch near the stalk.',
      why: 'The beetle lays its eggs in the flowers in early summer, and the grub eats into the fruit as it ripens.',
      fix: 'Fork the soil lightly around the canes in winter so birds can find the pupae, and grow autumn-fruiting kinds, which ripen after the beetle is done.',
      insteadOf: 'Spraying at flowering kills the bees working the raspberry flowers.',
    },
    {
      label: 'Cane blight and root rot',
      looks: 'Canes wilt and die in summer, the bark splitting at the base, or plants dying out patch by patch.',
      why: 'Fungi and water moulds attack the canes and roots in wet, heavy ground, and raspberries are among the fruits least tolerant of it.',
      fix: 'Plant on a raised ridge in heavy soil, mulch with compost, cut out dead canes at the base and bin them, and never replant raspberries where they died. Buy certified plants for a new bed.',
    },
  ],
  blackberry: [
    {
      label: 'Cane spot and purple blotch',
      looks: 'Purple spots and grey-centred blotches on the blackberry canes and leaves, and canes dying back.',
      why: 'Fungi that spread in wet weather on crowded, old canes left unpruned, splashing from cane to cane.',
      fix: 'Cut out old fruited canes at the base after harvest, tie in the new ones spaced out on wires so air moves, bin the prunings, and mulch with compost each spring.',
      insteadOf: 'Fungicides on fruiting canes leave residue on the berries you pick.',
    },
    {
      label: 'Red berry mite',
      looks: 'Part of each blackberry stays hard, sour and red while the rest of the berry ripens black.',
      why: 'Tiny mites that overwinter in the buds feed on the berries and stop the parts they feed on from ripening.',
      fix: 'Cut out old fruited canes in autumn and bin or burn them, pick off affected berries, and let predatory mites thrive by leaving the brambles unsprayed so they keep the pest down.',
    },
    {
      nutrient: 'N',
      label: 'Weak new canes',
      looks: 'New blackberry canes come up short and thin, with small leaves, and few of them.',
      why: 'Blackberries are hungry, deep-rooted and in the same place for many years, and a crown left unfed runs short of nitrogen.',
      fix: 'Spread compost or well-rotted manure around the crown each spring, mulch with straw or wood chips to keep the soil moist, and water on nettle liquid in late spring when the new canes grow.',
    },
  ],
  blueberry: [
    {
      nutrient: 'Fe',
      label: 'Yellow leaves in ordinary soil',
      looks: 'The new blueberry leaves turn yellow with green veins, then red-bronze, and the bush barely grows.',
      why: 'Blueberries need acid soil, pH 4.5 to 5.5. In ordinary garden soil or with hard tap water they cannot take up iron even when the soil holds plenty.',
      fix: 'Grow in a raised bed or large pot of acid compost mixed with composted bark and pine needles, mulch every spring with pine needles or leafmould, and water with rainwater only. Never add lime, mushroom compost or wood ash.',
      insteadOf: 'Sulphur and iron products bought to acidify ordinary soil wear off within a season; a bed built acid from the start stays acid.',
    },
    {
      label: 'Birds taking the crop',
      looks: 'Blueberries vanish from the bush the day they turn blue, and the stalks are left bare.',
      why: 'Blackbirds, thrushes and other birds love blueberries and find them the moment they colour.',
      fix: 'Net the bushes or grow them in a fruit cage before the berries colour, pegging the net to the ground so birds cannot get under, and pick every two days in season.',
    },
    {
      label: 'Few berries on one bush',
      looks: 'A single blueberry bush flowers well every spring but sets only a few berries.',
      why: 'Most blueberries crop far better when a second kind flowers at the same time nearby.',
      fix: 'Plant two or three different kinds that flower together, and grow early flowers nearby for bumblebees, which are the best pollinators of blueberry.',
    },
  ],
  gooseberry: [
    {
      label: 'Gooseberry sawfly',
      looks: 'Bushes stripped of leaves from the middle outward in a few days, with green caterpillars spotted black.',
      why: 'The sawfly lays inside the bush from spring, and its larvae work outward, several broods a year.',
      fix: 'Check the centre of the bush each week from April, pick the larvae off by hand, prune for an open goblet shape so they are easy to see, and let birds work the bush.',
      insteadOf: 'Sprays on a fruiting bush kill the birds and wasps that eat the larvae, and residues linger on the fruit.',
    },
    {
      label: 'American gooseberry mildew',
      looks: 'A white powder on the young shoots and fruit, turning to a brown felt on the berries.',
      why: 'A fungus favoured by crowded bushes, still air and soft, overfed growth, which spreads from the shoot tips to the fruit.',
      fix: 'Prune for an open centre, cut out affected tips in summer and bin them, feed with compost rather than nitrogen, and grow resistant kinds such as Invicta.',
      insteadOf: 'Fungicides treat this one year while the crowded bush brings it back.',
    },
    {
      nutrient: 'K',
      label: 'Scorched leaf edges',
      looks: 'Gooseberry leaf edges turn brown and crisp in summer, and the berries stay small.',
      why: 'Gooseberries need plenty of potassium, and light, sandy soil runs short, above all in a dry summer.',
      fix: 'Mulch with compost and chopped comfrey leaves each spring, water on comfrey liquid in early summer while the berries swell, and add a little wood ash from untreated wood.',
    },
  ],
  blackcurrant: [
    {
      label: 'Big bud mite',
      looks: 'Some blackcurrant buds swell into round, fat buds in winter that never open in spring.',
      why: 'Tiny mites live inside the buds by the thousand and carry reversion virus, which slowly stops the bush cropping.',
      fix: 'Pick off and burn swollen buds in winter, and replace badly affected bushes with new, certified plants in a different spot. Mite-resistant kinds such as Ben Hope are worth growing.',
    },
    {
      nutrient: 'N',
      label: 'Short new shoots',
      looks: 'The new shoots on a blackcurrant grow only a few centimetres, and the crop falls away.',
      why: 'Blackcurrants fruit best on young wood and need plenty of nitrogen to grow it each year.',
      fix: 'Mulch thickly each spring with compost or well-rotted manure, and cut a third of the oldest stems to the base each winter so the bush keeps growing new wood.',
      insteadOf: 'A nitrogen fertiliser gives soft growth prone to mildew; manure gives steady growth.',
    },
    {
      label: 'Currant blossom falling',
      looks: 'Blackcurrant flowers fall in spring and few currants form on the strings.',
      why: 'Frost while the bush is in flower, or too few bees flying in cold, windy weather at flowering.',
      fix: 'Plant late-flowering kinds, cover with fleece on frosty nights while in flower, grow flowers nearby for bees, and plant in a sheltered spot out of cold winds.',
    },
  ],
  redcurrant: [
    {
      label: 'Currant blister aphid',
      looks: 'Red or yellow blisters puff up on the leaves in early summer, with pale aphids underneath.',
      why: 'The aphid feeds under the leaf and the leaf swells above it. It leaves for other plants by midsummer.',
      fix: 'Leave it: the crop is rarely harmed and the aphids go by July. Grow flowers nearby for ladybirds and hoverflies, and pinch out the worst-blistered tips if they bother you.',
      insteadOf: 'Spraying for blisters that will not harm the crop kills the ladybirds that come for the aphids.',
    },
    {
      nutrient: 'K',
      label: 'Brown leaf margins on redcurrants',
      looks: 'The leaf edges of red and white currants turn brown and scorched in summer, and the strings of fruit are short.',
      why: 'Redcurrants need more potassium than blackcurrants, and light, sandy soil runs short while the fruit swells.',
      fix: 'Mulch each spring with compost and chopped comfrey, water on comfrey liquid while the fruit swells, and add a little wood ash from untreated wood around the bush.',
      insteadOf: 'Sulphate of potash in a bag feeds one season and leaves the soil no richer in life.',
    },
    {
      label: 'Birds stripping the strings',
      looks: 'Whole strings of redcurrants disappear from the bush as soon as they colour.',
      why: 'Birds take the bright fruit the moment it colours, often stripping a bush in a day or two.',
      fix: 'Grow in a fruit cage or net before the fruit colours, and train redcurrants as cordons against a fence or wall so they are easy to cover and pick.',
    },
  ],
  apple: [
    {
      nutrient: 'Ca',
      label: 'Bitter pit',
      looks: 'Small sunken brown spots on the skin, with brown, bitter flesh underneath, often showing in store.',
      why: 'Calcium reaches the fruit only in water from the roots; a dry summer, a light crop of big fruits and heavy pruning or feeding make it worse.',
      fix: 'Water young and dwarf trees deeply in dry spells, mulch the root area with compost, avoid feeding or hard pruning that pushes leaf, and thin fruit to one per cluster. Eggshell calcium (WCA) sprays are a Korean Natural Farming practice some orchardists use.',
      insteadOf: 'Calcium sprays are an orchard routine that treats the symptom and leaves the watering and feeding that cause it.',
    },
    {
      label: 'Apple scab',
      looks: 'Olive-brown blotches on the leaves and dark, corky scabs on the fruit, which may crack.',
      why: 'A fungus that overwinters on fallen leaves and spreads to new leaves and fruit in wet springs.',
      fix: 'Rake up and compost fallen leaves in autumn or mow them into the grass so worms pull them down, prune for an open centre, and grow resistant kinds such as Discovery or Sunset.',
      insteadOf: 'Scab fungicides take many sprays each spring and residues reach the fruit; clearing leaves breaks the cycle.',
    },
    {
      label: 'Codling moth',
      looks: 'A hole in the apple with brown frass, and a caterpillar tunnel to the core.',
      why: 'The moth lays its eggs on and near the fruitlets in early summer, and the caterpillar bores in to the core.',
      fix: 'Hang pheromone traps in May, tie cardboard bands around the trunk in July to trap larvae looking for a place to spend winter, and let blue tits and earwigs work.',
      insteadOf: 'Insecticides kill the birds and earwigs that eat the caterpillars.',
    },
  ],
  pear: [
    {
      nutrient: 'B',
      label: 'Blossom wither and corky fruit',
      looks: 'Blossom dies without setting, and fruit that does set is misshapen with hard, brown, corky patches in the flesh.',
      why: 'Pears need boron more than most fruit trees, and light or alkaline soil holds little.',
      fix: 'Mulch with compost each spring, water young trees deeply in dry summers, and add seaweed. Borax only after a soil or leaf test confirms a shortage.',
      insteadOf: 'Borax added without a test can reach a level that harms the tree, since the gap between enough and too much is narrow.',
    },
    {
      label: 'Pear rust',
      looks: 'Bright orange spots on the upper side of pear leaves in summer, with brown swellings underneath.',
      why: 'A fungus that spends half its life on juniper nearby, blowing between the two, so it returns every year.',
      fix: 'Pick off affected leaves early, compost them hot or bin them, and keep the tree vigorous with compost. Remove nearby junipers if possible. A strong tree crops through it.',
    },
    {
      label: 'Pear midge',
      looks: 'Fruitlets swell, blacken and drop in early summer, full of small orange maggots.',
      why: 'A midge lays in the flower buds in spring, and the maggots feed inside the fruitlets before dropping to the soil.',
      fix: 'Pick and destroy blackened fruitlets before they fall, and lightly fork the soil under the tree in summer so birds find the larvae. Keep chickens under the tree if you can.',
    },
  ],
  plum: [
    {
      label: 'Silver leaf',
      looks: 'Leaves on one branch take on a silvery sheen, and the wood inside is stained brown.',
      why: 'A fungus that enters through pruning cuts and broken branches made in autumn and winter.',
      fix: 'Prune plums only in summer, June to August, when wounds heal fast. Cut out silvered branches 15 cm into clean, unstained wood and burn them, and keep the tree strong with a compost mulch each spring.',
      insteadOf: 'Wound paints once sold for pruning cuts trap moisture and do not stop silver leaf.',
    },
    {
      label: 'Plum moth',
      looks: 'A pink caterpillar inside ripe plums near the stone, with brown frass and a sticky patch around it.',
      why: 'A moth lays on young plums in early summer, and the caterpillar feeds inside the ripening fruit.',
      fix: 'Hang pheromone traps in May to catch the males, pick up fallen fruit, and let birds and ground beetles work, since the caterpillars go into the soil and bark to pupate.',
      insteadOf: 'Insecticides kill the bees that pollinate plums.',
    },
    {
      label: 'Branches breaking under the crop',
      looks: 'Plum branches snap or split in late summer under a heavy load of ripening fruit.',
      why: 'Plums set heavy crops in a good year, and the wood is brittle, so an unthinned branch tears.',
      fix: 'Thin fruit to 5 to 8 cm apart in June, after the natural drop, and prop heavy branches with a forked stake. Cut back a torn branch to clean wood in summer.',
    },
  ],
  cherry: [
    {
      label: 'Bacterial canker',
      looks: 'Sunken patches on the bark that ooze amber gum, and leaves with small brown spots that fall out leaving shot holes.',
      why: 'A bacterium that gets in through wounds and leaf scars in autumn and winter, spread by rain.',
      fix: 'Prune cherries only in summer when wounds seal quickly, cut out cankered branches well into clean wood and bin the prunings, and keep the tree growing well with compost and a deep mulch.',
      insteadOf: 'Copper sprays build up in the soil and harm earthworms, and pruning at the right time does most of the job.',
    },
    {
      label: 'Birds taking the cherries',
      looks: 'Ripe cherries eaten on the tree before they are picked, leaving stalks and stones behind.',
      why: 'Blackbirds and starlings love cherries and can strip a tree within a few days of the fruit colouring.',
      fix: 'Grow cherries on a dwarfing rootstock such as Gisela 5 so the tree stays small enough to cover, and net it before the fruit colours, pegging the net down at the base.',
    },
    {
      label: 'Brown rot',
      looks: 'Cherries rot brown with rings of cream spots, then shrivel and stay hanging on the tree.',
      why: 'A fungus that gets in through fruit damaged by birds, insects or splitting, and lives on in the mummified fruit.',
      fix: 'Remove rotten fruit and mummies promptly, both on the tree and on the ground, and bin them. Thin crowded fruit, and net against birds, which open the wounds.',
    },
  ],
  apricot: [
    {
      label: 'Frost-killed blossom',
      looks: 'Apricot blossom opens in late winter, then browns overnight and no fruit sets.',
      why: 'Apricots flower earlier than almost any other fruit tree, often before the last frosts.',
      fix: 'Grow against a sunny wall, cover with fleece on frosty nights while in flower, and hand-pollinate with a soft brush on mild days when few bees fly.',
    },
    {
      label: 'Bacterial canker on apricot',
      looks: 'Gummy, sunken patches on the apricot bark, and whole branches dying back in spring.',
      why: 'A bacterium that enters through pruning cuts and damage in the cold, wet months.',
      fix: 'Prune apricots only in summer, when wounds heal fast, cut out affected wood into clean bark and bin the prunings, and keep the tree strong with compost and mulch.',
      insteadOf: 'Copper sprays build up in the soil and harm earthworms, and summer pruning does much of the work.',
    },
    {
      label: 'Branches dying back',
      looks: 'Whole apricot branches suddenly wilt and die in summer, the leaves hanging brown.',
      why: 'Dieback from fungi and canker that get into wood damaged by frost, splitting or winter pruning.',
      fix: 'Cut back to healthy wood in summer and bin the prunings, water deeply and mulch with compost in dry spells, and train the tree on a warm wall where the wood ripens well.',
    },
  ],
  fig: [
    {
      label: 'Root-knot nematodes on fig',
      looks: 'The fig tree weakens, leaves yellow early, and the roots are covered in small swellings.',
      why: 'Microscopic worms in warm, sandy soil that feed inside the roots, and figs are one of their favourite hosts.',
      fix: 'Mulch thickly with compost and leaves, which feeds the soil fungi and predatory nematodes that eat them, water deeply, and plant marigolds nearby.',
      insteadOf: 'Soil fumigants sold for nematodes kill everything living in the soil, including what kept the nematodes down.',
    },
    {
      label: 'Figs dropping before ripening',
      looks: 'Small green figs fall off the tree before they ripen, often in midsummer.',
      why: 'Dry roots in summer, or a tree putting its energy into leaf from rich soil, drops its young figs.',
      fix: 'Water deeply through summer, mulch with compost to hold the moisture, feed with nothing richer than compost, and restrict the roots in a large pot or a bed lined with slabs so the tree fruits rather than grows.',
    },
    {
      label: 'Winter damage',
      looks: 'Young fig shoots and the small figs on them die back and blacken in winter.',
      why: 'Figs are hardy once mature, but young growth and the tiny figs that carry next summer crop are tender.',
      fix: 'Grow against a sunny wall, cover with fleece in hard frost, and in a cold area grow the fig in a large pot you can move into a shed or garage over winter.',
    },
  ],
  grape: [
    {
      label: 'Powdery mildew on the vine',
      looks: 'A white-grey powder on the leaves, shoots and young grapes, and berries that split open and dry.',
      why: 'A fungus that thrives in warm, dry days with humid nights, above all in a crowded canopy under glass or against a sheltered wall.',
      fix: 'Prune hard in winter and pinch out side shoots in summer so air and light reach every bunch, strip the leaves shading the bunches once the berries set, keep the greenhouse ventilated, and water the roots deeply in a drought. Grow resistant kinds outdoors.',
      insteadOf: 'Vineyards spray every ten days through summer; a garden vine pruned for an open canopy rarely needs it, and every spray lands on fruit you eat.',
    },
    {
      label: 'Grey mould in tight bunches',
      looks: 'Grapes deep in the bunch go soft and brown and grow a grey fur that spreads through the whole bunch.',
      why: 'Botrytis, a fungus that gets in through split or crushed berries in damp weather, worst in tight bunches where air cannot reach.',
      fix: 'Thin each dessert-grape bunch with narrow scissors when the berries are pea-sized, taking out about a third, and cut away any mouldy berry at once. Allow one bunch per shoot and keep the canopy open.',
    },
    {
      nutrient: 'Mg',
      label: 'Red and yellow bands between the veins',
      looks: 'Older vine leaves turn yellow, or red on red grapes, between green veins, from midsummer.',
      why: 'A vine carrying a heavy crop moves magnesium out of its old leaves, above all on acid, sandy soil or after potash feeding.',
      fix: 'Mulch the root area with compost each spring, thin the crop to what the vine can ripen, and on acid soil work in dolomitic lime in winter. Diluted seawater at about 1 to 30 once a summer is a Korean Natural Farming source.',
      insteadOf: 'Magnesium salts sprayed on the leaves colour them up for a while and leave the soil unchanged.',
    },
  ],
  kiwi: [
    {
      label: 'Female vines with no fruit',
      looks: 'Kiwi vines flower well for years but never set fruit, whatever the weather.',
      why: 'Most kiwis have male and female plants, and a female needs a male flowering at the same time nearby.',
      fix: 'Plant one male for every six to eight females, of kinds that flower together, or grow a self-fertile kind such as Jenny. Bring in bees with early flowers.',
    },
    {
      label: 'Young shoots killed by late frost',
      looks: 'New shoots and flower buds blacken and collapse after a cold night in spring.',
      why: 'Kiwi vines are hardy in winter but break bud early, and the new growth dies at a light frost.',
      fix: 'Plant against a warm wall away from frost pockets, and cover with fleece on cold spring nights. Hardy kiwi (Actinidia arguta) buds a little later.',
    },
    {
      label: 'Vine all leaf and little fruit',
      looks: 'A huge tangle of long, leafy kiwi shoots, and very little fruit on the vine.',
      why: 'Kiwi fruits on short shoots from the previous year, and rich soil plus no summer pruning pushes endless leaf.',
      fix: 'Train on a strong wire or pergola, pinch out new shoots to five leaves past the last flower in summer, and feed with compost rather than anything rich in nitrogen.',
      insteadOf: 'A nitrogen feed on a leafy vine gives yet more leaf.',
    },
  ],
  melon: [
    {
      nutrient: 'B',
      label: 'Cracked and hollow melons',
      looks: 'Melons crack across the skin as they ripen, or show a hollow, brown middle.',
      why: 'Melons need boron, and a dry spell followed by heavy watering splits the skin as the flesh swells faster than it can stretch.',
      fix: 'Water evenly and keep a compost mulch over the roots, cut back watering as fruit ripens, and add seaweed to the bed. Use borax only after a soil test.',
      insteadOf: 'A trace-element mix added on a hunch can push boron too high.',
    },
    {
      label: 'Flowers but no melons',
      looks: 'Plenty of yellow flowers on the melon vine all summer, but none of them set and swell into fruit.',
      why: 'Melons need insect pollination of female flowers, and a closed greenhouse keeps bees out.',
      fix: 'Open the greenhouse on warm days, and hand-pollinate: press a male flower into each female flower (with a tiny melon behind it) on the same morning, three or four at once so they swell together.',
    },
    {
      label: 'Collar rot at the base',
      looks: 'The stem at soil level turns soft and brown and the whole plant collapses.',
      why: 'A fungus that attacks melon stems kept wet at soil level, above all in a cool, damp greenhouse.',
      fix: 'Plant on a small mound so water runs off the stem, water around the plant rather than at the base, and surround the stem with a collar of gravel.',
    },
  ],
  citrus: [
    {
      nutrient: 'Mg',
      label: 'Yellow V at the leaf base',
      looks: 'Older citrus leaves turn yellow from the tip and edges, leaving a green wedge pointing up from the base.',
      why: 'A heavy crop of oranges moves magnesium out of the older leaves, above all on sandy soil in heavy rain.',
      fix: 'Mulch the root zone with compost and leaves, keep the crop to what the tree can carry, and on acid soil work in dolomitic lime. Diluted seawater at about 1 to 30 is a Korean Natural Farming source.',
      insteadOf: 'Magnesium salts sprayed on the leaves give a green-up that washes off in the next rains.',
    },
    {
      nutrient: 'Zn',
      label: 'Little leaf and mottling',
      looks: 'New leaves come small, narrow and upright, with yellow patches between green veins.',
      why: 'Zinc is locked away in alkaline soil and short in sandy soil with little organic matter.',
      fix: 'Mulch thickly with compost and manure, which holds zinc in a form roots can use, and encourage mycorrhizal fungi by never leaving the soil bare.',
      insteadOf: 'Zinc sprays green the new leaves for one flush while the soil stays short.',
    },
    {
      label: 'Scale insects and sooty mould',
      looks: 'Brown or white bumps on twigs and leaves, sticky honeydew, and black mould.',
      why: 'Scale insects feed on sap, and ants farm them for honeydew and protect them from predators.',
      fix: 'Band the trunk with grease or sticky tape so ants cannot climb, and let ladybirds and parasitic wasps reach the scales. Wipe with soapy water on small trees.',
      insteadOf: 'Broad-spectrum sprays kill the parasitic wasps that keep scale down, and outbreaks follow.',
    },
  ],
  lemon: [
    {
      label: 'A potted lemon dropping its leaves in winter',
      looks: 'A lemon brought indoors for winter sheds a shower of healthy-looking green leaves within weeks.',
      why: 'The move from bright outdoor light to a dim, heated room, with roots that stay cold and wet in the pot, makes the tree drop leaves it can no longer feed.',
      fix: 'Keep it in the brightest room you have, ideally cool at 10 to 15°C rather than warm, water only when the top 3 cm of the pot is dry, and stand the pot on feet so it drains. Stand it outside again once nights stay above 10°C.',
    },
    {
      label: 'Citrus leaf miner',
      looks: 'Silvery, winding trails under the skin of young lemon leaves, which curl and twist as they grow.',
      why: 'The larva of a tiny moth tunnels inside new leaves, mostly in the flushes of growth in summer and autumn.',
      fix: 'Pinch off the worst-damaged tips, and prune in late winter so the main flush of new growth comes in spring before the moth is about. Older leaves are never attacked, and a healthy tree grows through it.',
      insteadOf: 'Sprays barely reach a larva sealed inside the leaf, and kill the parasitic wasps that do.',
    },
    {
      nutrient: 'N',
      label: 'A pale lemon tree in a pot',
      looks: 'The whole tree turns pale yellow-green from the older leaves up, and the fruit stays small.',
      why: 'A lemon in a pot, flowering and fruiting most of the year, uses up the nitrogen in its compost within a season.',
      fix: 'Scrape off the top 5 cm of compost each spring and replace it with fresh compost and a little well-rotted manure, and water on fish amino acid (FAA) at about 1 to 1,000 every two weeks through spring and summer. Repot every two or three years.',
      insteadOf: 'Bottled citrus feeds work, but they build salts in the pot that brown the leaf tips; compost and a flush of rainwater avoid it.',
    },
  ],
  lime: [
    {
      label: 'Young limes dropping',
      looks: 'Young limes fall off at marble size in large numbers, weeks after flowering.',
      why: 'Every citrus sheds some young fruit, but dry roots, a heatwave or a cold spell make a lime drop far more than it would.',
      fix: 'Water deeply once a week through flowering and fruit set, mulch the root zone with compost and leaves out to the edge of the canopy, and shelter the tree from hot, dry wind. Some drop is normal and the tree sheds what it cannot carry.',
    },
    {
      nutrient: 'Fe',
      label: 'Yellow new leaves on limy ground',
      looks: 'The newest lime leaves open yellow with a fine net of green veins, while the old leaves stay dark.',
      why: 'On alkaline or limestone soil, or with hard water, the iron is there but locked away from the roots.',
      fix: 'Mulch thickly with compost, leaves and wood chips, which slowly acidify the soil at the surface where the feeding roots are, water with rainwater where you can, and never lime near the tree.',
      insteadOf: 'Iron products bought for the purpose green one flush of leaves while the alkaline soil stays as it was.',
    },
    {
      label: 'Cold damage on a lime',
      looks: 'After a cold night the leaves go dull and brown at the edges, and young shoots blacken.',
      why: 'Limes are the most cold-tender of the common citrus and are hurt below about 2°C.',
      fix: 'Plant against a warm wall in the warmest part of the garden or grow in a pot moved under cover in winter, and cover with fleece on nights forecast near freezing. Wait until spring to cut out dead wood.',
    },
  ],
  mango: [
    {
      label: 'Anthracnose on flowers and fruit',
      looks: 'Black spots on the flowers, which drop, and sunken black patches on ripening fruit.',
      why: 'A fungus spread by rain in warm, humid weather, above all when the tree flowers in a wet spell.',
      fix: 'Prune after harvest to open the canopy, rake up and hot-compost fallen leaves and fruit, and grow kinds that resist it. Pick fruit mature-green and ripen indoors.',
      insteadOf: 'Copper sprays on a tree every season build up in the soil and harm earthworms and soil fungi.',
    },
    {
      label: 'A mango tree that will not flower',
      looks: 'A mango tree grows leaves in flush after flush every year but no flowers.',
      why: 'Mangoes need a cool or dry spell to flower, and too much nitrogen or watering in winter keeps them growing leaf.',
      fix: 'Stop watering and feeding for two months before the usual flowering time, prune just after harvest so new shoots mature before the cool season, and feed only with compost after harvest.',
      insteadOf: 'Nitrogen fertiliser keeps the tree in leaf and delays flowering.',
    },
    {
      nutrient: 'Ca',
      label: 'Jelly seed and soft nose',
      looks: 'Mangoes that look ripe outside have soft, watery, jelly-like flesh around the seed or a soft patch at the tip.',
      why: 'An internal breakdown linked to low calcium in the fruit, worst on sandy soil, in large, fast-growing fruit and on trees fed heavily with nitrogen.',
      fix: 'Mulch the root zone with compost and leaves out past the canopy edge, water evenly while the fruit swells, feed only with compost, and pick at the mature-green stage rather than leaving fruit to ripen fully on the tree. Some kinds suffer far less than others.',
      insteadOf: 'Calcium sprays reach the leaves more than the fruit and do nothing about the heavy feeding behind it.',
    },
  ],
  banana: [
    {
      nutrient: 'K',
      label: 'Scorched, yellowing banana leaf edges',
      looks: 'The older banana leaves turn orange-yellow from the edges inward, then brown and fold down at the midrib, and the bunches come out thin.',
      why: 'Bananas take up more potassium than any other nutrient, and a plant cropping on sandy soil or soil low in organic matter runs short within a season or two.',
      fix: 'Chop every spent stem and old leaf and lay it back around the mat as mulch, since the trash is full of potassium, spread compost and a little wood ash from untreated wood, and water on comfrey liquid or fermented banana-peel juice (FFJ) at about 1 to 500 through the growing season.',
      insteadOf: 'Muriate of potash, the usual plantation feed, adds chloride that builds up in the soil, while the chopped stems already hold most of the potassium the plant needs.',
    },
    {
      label: 'Banana weevil borer',
      looks: 'Plants yellow and wilt, bunches stay small, and whole plants topple in wind; the base of the stem and the corm are riddled with dark tunnels.',
      why: 'The larva of a black beetle that tunnels into the corm, spread from mat to mat in infested suckers and bred in rotting stems left lying about.',
      fix: 'Plant only clean suckers with the outer layers pared away, cut spent stems off at ground level after harvest and split them lengthwise to dry out, keep the mat free of rotting trash near the base, and lay split-stem traps on the ground to collect beetles every few days.',
      insteadOf: 'Soil insecticides for borers persist in the ground and kill the ants, beetles and other ground predators that eat the eggs.',
    },
    {
      label: 'Small, stunted banana bunches',
      looks: 'The bunch comes out small with few hands and short, thin fingers, and it takes months longer to fill than it should.',
      why: 'Too many suckers competing on one mat, dry spells while the bunch forms, and cold snaps below about 14°C all cut the bunch the plant can make.',
      fix: 'Keep one mother plant, one follower and one young sucker per mat and cut the rest out at ground level, water deeply and often through the warm months, and mulch thickly with compost, chopped stems and leaves out to a metre from the mat.',
    },
  ],
  papaya: [
    {
      nutrient: 'B',
      label: 'Lumpy, bumpy papayas',
      looks: 'Papayas grow lumpy and misshapen, often oozing a white latex from the bumps, with few seeds inside and patches that never ripen.',
      why: 'Boron shortage, common on sandy, leached and alkaline soils, which stops the flowers setting evenly and leaves parts of the fruit undeveloped.',
      fix: 'Mulch with compost and seaweed each season, keep the soil evenly moist so the roots can take up what boron there is, and add a small, measured amount of borax only after a soil or leaf test confirms a shortage.',
      insteadOf: 'A trace-element mix added every year on a hunch can push boron too far; papayas are hurt by too much as well as too little.',
    },
    {
      label: 'Papaya root rot in wet ground',
      looks: 'The lower leaves yellow and drop, the plant wilts in the heat, and the stem base goes soft, dark and sunken before the plant falls over.',
      why: 'A water mould (Phytophthora or Pythium) that kills papayas in soil that stays wet, sometimes after a single day of standing water.',
      fix: 'Plant on a mound 30 to 50 cm high in well-drained soil mixed with compost, never let water pool around the stem, keep mulch a hand width from the trunk, and replace trees every three or four years before they weaken.',
      insteadOf: 'Fungicide drenches cannot save a papaya standing in wet ground; the mound and the drainage are what keep it alive.',
    },
    {
      label: 'A papaya that never fruits',
      looks: 'A tall, healthy papaya flowers for months but never sets fruit, and the flowers hang in long sprays on thin stalks.',
      why: 'Many papayas grown from seed are male and carry only long-stalked male flowers, and a female tree needs a male nearby to set fruit with seed.',
      fix: 'Plant three or four seedlings in each spot and thin out most of the males once they flower, keeping one male for every ten or so females, or grow a kind with bisexual flowers, such as the Solo types, that sets fruit on its own.',
    },
  ],
  avocado: [
    {
      label: 'Avocado root rot',
      looks: 'Small, pale leaves, dieback of branch tips, and a canopy thinning year by year; the fine feeder roots are black, brittle and dead.',
      why: 'A water mould (Phytophthora cinnamomi) that kills avocado roots in soil that is poorly drained, compacted or overwatered.',
      fix: 'Plant on a mound in well-drained soil, keep a mulch of coarse wood chips 15 cm deep out past the canopy edge, which feeds the soil microbes that suppress the rot, add gypsum on heavy soil, and water only when the soil is dry a few centimetres down.',
      insteadOf: 'Phosphonate injections treat the tree year after year; a deep wood-chip mulch and good drainage change the soil the rot lives in.',
    },
    {
      label: 'Salt-burnt avocado leaf tips',
      looks: 'The tips and edges of avocado leaves turn brown in a clean line, and the burn spreads inward through the dry season.',
      why: 'Avocados are among the most salt-sensitive fruit trees, and salts build up from hard irrigation water, manure used fresh, and soluble fertiliser.',
      fix: 'Water deeply and less often rather than lightly every day, so salts are washed below the roots, use rainwater where you can, and feed only with well-rotted compost and mulch rather than anything salty.',
      insteadOf: 'Soluble fertilisers add exactly the salts that burn the leaves, and more feed on a burnt tree makes it worse.',
    },
    {
      label: 'An avocado full of flowers but few fruit',
      looks: 'The avocado tree is covered in flowers every spring but sets only a handful of fruit, and many of those drop at marble size.',
      why: 'Avocado flowers open as female one day and male the next, on a schedule set by the tree type, and a lone tree of one type often sets poorly.',
      fix: 'Grow an A type and a B type tree near each other, for example Hass with Fuerte or Bacon, plant flowers that bloom at the same time to bring in bees and flies, and water evenly while the young fruit sets.',
    },
  ],
  pineapple: [
    {
      label: 'Pineapple heart rot',
      looks: 'The central leaves of the pineapple turn pale, pull out easily with a tug, and the base of the rosette is soft and smells bad.',
      why: 'Water moulds attack pineapples in wet, poorly drained soil, above all young plants set too deep or in heavy clay.',
      fix: 'Plant on raised beds in sandy, well-drained soil with compost, let the tops or suckers dry for several days before planting, set them shallow, and never water into the heart once the soil is moist.',
    },
    {
      label: 'Mealybug wilt',
      looks: 'Pineapple leaves redden, curl down at the tips and wilt, and white, cottony mealybugs cluster at the leaf bases and roots.',
      why: 'Mealybugs spread a virus as they feed, and ants farm them for their honeydew, carrying them from plant to plant and driving off predators.',
      fix: 'Keep ants off with sticky bands on stakes around the bed, plant only clean tops or suckers, pull and hot-compost wilted plants, and let ladybirds, lacewings and parasitic wasps do the work.',
      insteadOf: 'Insecticides kill the ladybirds and wasps that keep mealybugs down, and the ants simply bring the mealybugs back.',
    },
    {
      nutrient: 'Fe',
      label: 'Yellow-streaked pineapple leaves on limy soil',
      looks: 'The young pineapple leaves come out pale yellow with green streaks along their length, and the plant grows slowly.',
      why: 'Pineapples need acid soil, around pH 4.5 to 5.5, and on limy or alkaline soil the iron is present but locked away from the roots.',
      fix: 'Grow in raised beds of acid, sandy soil with compost, mulch with pine needles, leaves and wood chips, water with rainwater where you can, and never lime the bed. A potted plant can go in ericaceous compost.',
      insteadOf: 'Iron products bought for the purpose green one set of leaves while the limy soil stays as it was.',
    },
  ],
  guava: [
    {
      label: 'Guava fruit fly',
      looks: 'Ripe guavas are soft and rotten inside, full of white maggots, with small puncture marks and brown patches on the skin.',
      why: 'Fruit flies lay eggs under the skin of ripening guavas, and fallen fruit left lying lets the next generation breed.',
      fix: 'Pick fruit just before it is fully ripe, collect every fallen fruit daily and drown or seal it in a bag in the sun before composting, and bag the fruit in paper or mesh when it is still green and hard.',
      insteadOf: 'Cover sprays for fruit fly land on fruit you eat and kill the parasitic wasps that attack the maggots.',
    },
    {
      label: 'Guava anthracnose',
      looks: 'Sunken, dark brown to black spots on the guava fruit that spread and turn the fruit mummified, and brown dieback on young shoot tips.',
      why: 'A fungus spread by rain splash in warm, wet weather, living on in mummified fruit and dead twigs left on the tree.',
      fix: 'Prune after harvest to open the canopy to air and sun, remove mummified fruit and dead twigs, rake up and hot-compost fallen fruit, and keep a compost mulch over the soil so spores are not splashed up from bare ground.',
      insteadOf: 'Copper sprays built up over years harm earthworms and soil fungi, and an open canopy does much of the job.',
    },
    {
      nutrient: 'Zn',
      label: 'Small, bronzed guava leaves',
      looks: 'New guava leaves come small and bunched, with a bronze or purple tinge and yellow between the veins, and fruit stays small.',
      why: 'Guavas are sensitive to zinc shortage, which is common on alkaline, sandy and heavily limed soils low in organic matter.',
      fix: 'Mulch thickly with compost and well-rotted manure out to the edge of the canopy each year, which holds zinc where roots can use it, grow a living ground cover under the tree, and avoid lime near it.',
      insteadOf: 'Zinc sprays green one flush of leaves while the soil stays short.',
    },
  ],
  pomegranate: [
    {
      label: 'Split pomegranates',
      looks: 'Pomegranates crack open on the tree as they near ripeness, showing the seeds, which then sour, rot or are eaten by birds and wasps.',
      why: 'The skin hardens as the fruit ripens, and a heavy watering or rain after a dry spell swells the seeds faster than the skin can stretch.',
      fix: 'Water deeply and evenly through late summer rather than letting the soil dry out and then soaking it, keep a thick compost and leaf mulch over the root zone to hold moisture steady, and pick fruit as soon as it sounds metallic when tapped, before autumn rains.',
    },
    {
      label: 'Pomegranate heart rot',
      looks: 'Pomegranates look sound outside but are grey-black and rotten inside, sometimes with a slight darkening at the crown end.',
      why: 'A fungus (Alternaria) gets in through the open crown at flowering in wet weather and rots the fruit from the inside as it ripens.',
      fix: 'Grow in a sunny, airy spot, prune to keep the bush open so flowers dry fast after rain, pick up and hot-compost fallen and rotten fruit, and grow kinds that ripen before the autumn rains in a wet climate.',
      insteadOf: 'Sprays at flowering barely reach inside the crown where the fungus enters, and every spray lands on the flowers bees visit.',
    },
    {
      label: 'A pomegranate that flowers but drops its fruit',
      looks: 'The pomegranate bush is covered in red flowers, but most fall without setting fruit, and the few fruits that set drop while small.',
      why: 'Pomegranates carry both bell-shaped male flowers that always drop and vase-shaped fertile ones; dry roots, poor pollination and overfeeding make the fertile ones drop too.',
      fix: 'Water deeply through flowering and fruit set, bring in bees with flowering herbs nearby or hand-pollinate with a soft brush, feed only with compost, and be patient with young bushes, which crop well only from the third or fourth year.',
      insteadOf: 'A nitrogen feed on a flowering bush gives leaf and more flower drop.',
    },
  ],
  lychee: [
    {
      label: 'A lychee that will not flower',
      looks: 'A lychee tree grows flush after flush of red-bronze new leaves every year but produces no flowers.',
      why: 'Lychees need a spell of cool, dry weather, below about 15°C for several weeks, to flower, and a late flush of leaves or winter watering and feeding stops them.',
      fix: 'Prune right after harvest so the new shoots mature well before winter, stop watering and feeding from late autumn until the flower buds show, and feed only with compost after harvest. In a warm, wet winter some years will be poor whatever you do.',
      insteadOf: 'Nitrogen fertiliser in autumn pushes a late flush of leaves and takes away that year of flowering.',
    },
    {
      label: 'Lychee erinose mite',
      looks: 'Brown, felt-like patches on the undersides of lychee leaves, which blister above, curl and distort, and new shoots stay stunted.',
      why: 'A microscopic mite that feeds inside the leaf hairs, spread on wind, bees and new trees from infested nurseries.',
      fix: 'Buy clean trees, cut out and burn or bin affected shoots as soon as the felt appears, prune to keep the canopy open, and keep the tree strong with compost and mulch. Predatory mites keep it down where they are not sprayed.',
      insteadOf: 'Sulphur and miticide sprays kill the predatory mites that keep it in check.',
    },
    {
      label: 'Split lychees',
      looks: 'Lychee fruit crack open on the tree as they ripen, then sour and draw fruit flies and wasps.',
      why: 'Dry roots while the skin forms, followed by rain or heavy watering as the flesh swells, splits the skin.',
      fix: 'Water evenly from fruit set through harvest rather than letting the soil dry out, mulch deeply with compost and leaves out to the canopy edge to steady the moisture, and pick promptly when the fruit colours.',
    },
  ],
  longan: [
    {
      label: 'A longan that crops only every other year',
      looks: 'A longan tree carries a huge crop one year and almost nothing the next, and the pattern keeps repeating.',
      why: 'A heavy crop uses up the stored reserves the tree needs to flower the next year, and cool or wet winters make it worse.',
      fix: 'Thin the panicles in a heavy year so the tree carries only what it can, prune right after harvest to bring on one even flush of new growth, water through fruiting, and feed with compost and mulch after harvest so it can rebuild.',
    },
    {
      label: 'Longan witches broom',
      looks: 'Bunches of small, distorted leaves at the shoot tips, and deformed flower clusters that set no fruit.',
      why: 'A disease spread by sap-sucking insects and by grafting from infected trees, common where longans are grown closely.',
      fix: 'Buy grafted trees from a clean source, cut out and burn or bin every broom as soon as you see it, and keep the tree strong with compost, mulch and even watering. Encourage lacewings and small wasps with flowering plants nearby.',
      insteadOf: 'Insecticide sprays kill the predators of the insects that spread it and do nothing about the brooms already there.',
    },
    {
      nutrient: 'K',
      label: 'Small, poorly filled longans',
      looks: 'Longan fruit stay small with thin, watery flesh, and the older leaves brown at the edges while the crop ripens.',
      why: 'A heavy crop draws potassium out of the older leaves, above all on sandy soil with little organic matter.',
      fix: 'Mulch with compost, chopped prunings and banana leaves or stems each season, add wood ash from untreated wood, water on comfrey liquid while the fruit fills, and thin heavy crops so each panicle ripens well.',
      insteadOf: 'Soluble potash salts leach through sandy soil after the next rain.',
    },
  ],
  loquat: [
    {
      label: 'Loquat fire blight',
      looks: 'Loquat flowers and young shoots wilt, blacken and bend over like a shepherd crook, with a sticky ooze in warm, damp weather.',
      why: 'A bacterial disease that enters through the flowers, spread by bees, rain and pruning tools, worst on soft, fast growth.',
      fix: 'Cut out affected shoots in dry weather at least 30 cm into clean wood, cleaning the blade between cuts, bin or burn the prunings rather than composting them, and avoid rich feeding that pushes soft growth. Feed only with compost.',
      insteadOf: 'Antibiotic and copper sprays used on blight build resistance and copper in the soil.',
    },
    {
      label: 'Purple spot and sunburn',
      looks: 'Loquat fruit show purple or brown patches on the side facing the sun, sometimes sunken and dry.',
      why: 'Loquats ripen in late winter and spring, and strong sun on the fruit with dry roots scalds the skin.',
      fix: 'Keep the leaves around each bunch rather than stripping them, water deeply and evenly as the fruit ripens, and mulch with compost and leaves. Thinning each cluster to four or five fruit gives bigger, better fruit.',
    },
    {
      label: 'Small, tart loquats',
      looks: 'Loquat fruit are small, mostly seed, and sour even when fully coloured.',
      why: 'A loquat left unthinned sets far more fruit than it can fill, and seedling trees often carry small, sour fruit.',
      fix: 'Thin each cluster to four or five fruit when they are pea-sized, water through fruit fill, mulch with compost, and grow a named grafted kind if the seedling fruit disappoints.',
    },
  ],
  sapodilla: [
    {
      label: 'Sapodilla fruit dropping young',
      looks: 'Small, hard sapodilla fruit fall in large numbers weeks after flowering.',
      why: 'Dry spells and poor pollination at flowering, and young trees that set more than they can carry.',
      fix: 'Water deeply through flowering and fruit set, mulch thickly with compost and leaves out past the canopy edge, bring in pollinators with flowers nearby, and accept some drop on a young tree.',
    },
    {
      label: 'Sapodilla scale insects',
      looks: 'Brown or white bumps on the twigs and leaves of the sapodilla, sticky honeydew, and black sooty mould on the leaves.',
      why: 'Scale insects feed on the sap, and ants farm them for honeydew and drive off the ladybirds and wasps that eat them.',
      fix: 'Band the trunk with grease or sticky tape so ants cannot climb, prune low branches that touch the ground or other plants, and let ladybirds and parasitic wasps reach the scales. Wipe off heavy clusters on small trees with soapy water.',
      insteadOf: 'Broad-spectrum sprays kill the parasitic wasps that control scale, and outbreaks come back worse.',
    },
    {
      label: 'Sapodilla picked hard that never softens',
      looks: 'Sapodillas picked from the tree stay hard, gritty and full of sticky latex, and never ripen.',
      why: 'Sapodillas ripen off the tree, but only once they are mature, and there is no colour change to show when that is.',
      fix: 'Scratch the skin gently with a fingernail: a mature fruit shows yellow-brown under the scurf and no green, and little latex runs. Pick those and ripen them indoors at room temperature for several days.',
    },
  ],
  sugarapple: [
    {
      label: 'Sugar apple seed borer',
      looks: 'Sugar apple fruit have small holes, dark patches and rotten, darkened pulp around seeds that have been hollowed out.',
      why: 'A small wasp lays eggs in the young fruit, and the larvae feed on the seeds, letting rot in.',
      fix: 'Bag each young fruit in paper or mesh soon after it sets, pick up and destroy fallen and infested fruit daily, and hot-compost only fruit that has been sealed in a bag in the sun first.',
      insteadOf: 'Sprays on the fruit reach a larva inside the seed poorly and land on fruit eaten raw.',
    },
    {
      label: 'Sugar apple flowers that do not set',
      looks: 'Sugar apple trees flower well but set few fruit, and those that set are lopsided.',
      why: 'The flowers are female first and male later, the pollinating beetles are few in many gardens, and dry air dries the stigma.',
      fix: 'Hand-pollinate: collect pollen from flowers in their male stage in the afternoon with a small brush, and brush it into flowers in their female stage the next morning. Water through flowering and mulch with compost.',
    },
    {
      label: 'Sugar apple fruit that split and rot',
      looks: 'Sugar apple fruit split open between the segments as they ripen, then rot and draw fruit flies.',
      why: 'Heavy rain or watering after a dry spell swells the pulp faster than the skin can stretch.',
      fix: 'Water evenly from fruit set to harvest, mulch deeply with compost and leaves to hold the soil moisture steady, and pick fruit as soon as the segments begin to separate and show cream between them, then ripen indoors.',
    },
  ],
  jackfruit: [
    {
      label: 'Jackfruit rot',
      looks: 'Young jackfruit turn soft and black from the tip or stalk end and fall, and male flower spikes blacken.',
      why: 'A fungus (Rhizopus) that thrives in wet, humid weather and spreads from rotting fruit and flower spikes on and under the tree.',
      fix: 'Prune to open the canopy to air and sun, pick off and remove rotting fruit and flower spikes, rake up and hot-compost fallen ones, and thin the fruit so they do not touch each other.',
      insteadOf: 'Fungicide sprays in wet weather are washed off and land on the flowers bees and flies pollinate.',
    },
    {
      label: 'Jackfruit fruit fly',
      looks: 'Jackfruit bulbs are soft and rotten with maggots inside, under small punctures in the rind.',
      why: 'Fruit flies lay eggs through the rind as the fruit ripens, worst when fallen fruit is left to breed the next generation.',
      fix: 'Bag young fruit in sacks or mesh while they are still small, collect fallen fruit daily and seal it in a bag in the sun before composting, and pick promptly at maturity.',
      insteadOf: 'Cover sprays for fruit fly land on the fruit and kill the wasps that parasitise the maggots.',
    },
    {
      label: 'Waterlogged jackfruit roots',
      looks: 'A jackfruit tree yellows, drops leaves and dies back from the top after a wet season.',
      why: 'Jackfruit roots cannot stand waterlogging, and a few days of standing water in heavy soil kills them.',
      fix: 'Plant on a mound or raised ground in well-drained soil with compost, keep mulch away from the trunk, never let water pool around it, and dig a drain on heavy ground before planting.',
    },
  ],
  passionfruit: [
    {
      label: 'Passionfruit woodiness virus',
      looks: 'Passionfruit leaves are mottled and puckered, and the fruit are small, misshapen, with a thick, hard rind and little pulp.',
      why: 'A virus spread by aphids from nearby infected vines and weeds, and in cuttings taken from infected plants.',
      fix: 'Buy clean, grafted vines, pull and remove infected vines rather than nursing them, keep weeds of the bean and pea family away, and grow flowers nearby that bring in the hoverflies and ladybirds that eat aphids. Replace vines every four or five years.',
      insteadOf: 'Insecticides act too slowly to stop an aphid passing on a virus in one bite, and kill the predators that keep aphids down.',
    },
    {
      label: 'Passionfruit collar rot',
      looks: 'The passionfruit vine wilts suddenly and dies, and the bark at the base of the stem is dark, cracked and rotten.',
      why: 'A soil fungus that attacks vines in wet, poorly drained soil and gets in through damage at the stem base.',
      fix: 'Plant on a mound in well-drained soil with compost, keep mulch and grass away from the stem, never damage the base with a mower or trimmer, and plant grafted vines with the graft well above the soil.',
    },
    {
      label: 'Flowers but no passionfruit',
      looks: 'The passionfruit vine flowers well but few fruit set, and many small fruit shrivel and drop.',
      why: 'Passionfruit flowers open for one day and need a large bee to pollinate them; rain, cold or too few bees on that day means no fruit.',
      fix: 'Hand-pollinate with a soft brush around midday, grow bee flowers nearby, water deeply through flowering, and feed only with compost and mulch.',
      insteadOf: 'Nitrogen feed on a vine that will not set gives leaf and fewer flowers.',
    },
  ],
  sweetpotato: [
    {
      nutrient: 'B',
      label: 'Cracked sweet potatoes',
      looks: 'Sweet potato roots come up with deep cracks along their length, or with a rough, corky skin and brown spots in the flesh.',
      why: 'Sweet potatoes need a steady supply of boron, and uneven watering, above all a soaking after a dry spell, splits the roots as they swell.',
      fix: 'Water evenly through summer, keep a mulch of compost and straw over the ridges to hold moisture, add seaweed or seaweed meal to the bed each year, and use borax only after a soil test shows a shortage.',
      insteadOf: 'A boron product added on a guess can reach toxic levels quickly, and sweet potatoes show the harm.',
    },
    {
      label: 'Sweet potato weevil',
      looks: 'Sweet potato roots are riddled with tunnels, taste bitter, and smell bad, and the stems at soil level are hollowed.',
      why: 'A small ant-like beetle whose larvae tunnel through the roots and stems, reaching them through soil cracks.',
      fix: 'Plant only clean slips, hill up the soil and keep it moist so it does not crack, harvest promptly, remove every scrap of crop after harvest, and rotate to a new bed each year.',
      insteadOf: 'Soil insecticides linger in the ground and in roots eaten whole.',
    },
    {
      label: 'All vine and no sweet potatoes',
      looks: 'Sweet potato vines grow long and lush but at harvest there are few roots, all thin and stringy.',
      why: 'Too much nitrogen from rich manure or feeding, a short or cool season, or shade.',
      fix: 'Grow in full sun in loose, well-drained soil with moderate compost and no fresh manure, lift the vines now and then so they do not root at every node, and let them grow for at least four months of warm weather.',
      insteadOf: 'Nitrogen feeds give vine at the expense of roots.',
    },
  ],
  okra: [
    {
      label: 'Root-knot nematodes on okra',
      looks: 'Okra plants stunt, yellow and wilt in the afternoon heat, and the roots are covered in round swellings.',
      why: 'Microscopic worms that live in warm, sandy soil and feed inside the roots, building up in beds planted with okra and other hosts year after year.',
      fix: 'Rotate okra to a new bed each year, dig in plenty of compost, which feeds the fungi and predatory nematodes that eat them, grow a cover crop of French marigolds or sunn hemp before okra, and pull and bin infested roots rather than composting them.',
      insteadOf: 'Soil fumigants for nematodes kill everything living in the soil, including the organisms that kept the nematodes down.',
    },
    {
      label: 'Tough, stringy okra pods',
      looks: 'Okra pods grow long and fibrous, too tough to cut or chew, and the plant stops flowering.',
      why: 'Okra pods grow fast in heat and turn woody within a day or two of the ideal size.',
      fix: 'Pick every pod at 5 to 10 cm long, every day or two in hot weather, and keep picking so the plant keeps flowering. Wear gloves, since the spines on stems and pods irritate skin.',
    },
    {
      label: 'Okra aphids and ants',
      looks: 'Clusters of green or black aphids on the undersides of okra leaves and on young pods, sticky honeydew and ants running up the stems.',
      why: 'Aphids build up on soft growth from rich feeding, and ants protect them from predators.',
      fix: 'Hose off heavy colonies, grow dill, coriander and other small flowers nearby to bring in hoverflies, lacewings and ladybirds, keep ants off the plants, and avoid rich nitrogen feeding.',
      insteadOf: 'Insecticides kill the predators first and aphids return faster than they do.',
    },
  ],
  cassava: [
    {
      label: 'Cassava mosaic disease',
      looks: 'Cassava leaves show yellow and green mosaic patches, are twisted and small, and the plant stays stunted with small roots.',
      why: 'A virus spread by whiteflies and, above all, by planting cuttings from infected plants.',
      fix: 'Take cuttings only from healthy plants that show no mosaic, pull and remove infected plants early, grow resistant kinds where the disease is common, and keep the soil rich with compost so plants grow strongly.',
      insteadOf: 'Spraying whiteflies does not stop a virus already in the cuttings, and kills the predators of whiteflies.',
    },
    {
      label: 'Cassava root rot in wet soil',
      looks: 'Cassava roots are soft, rotten and smell bad at harvest, and the plant wilts and drops leaves.',
      why: 'Root rot fungi thrive in waterlogged, heavy soil, and roots left in the ground too long start to rot.',
      fix: 'Plant on mounds or ridges in well-drained soil, dig in compost, never plant where water stands, and harvest roots between 8 and 18 months rather than leaving them for years.',
    },
    {
      label: 'Cassava roots that turn bitter or stringy',
      looks: 'Cassava roots taste bitter or are woody and fibrous at harvest, and hard to peel.',
      why: 'Drought and poor soil raise the cyanide compounds in the roots, and old roots turn woody.',
      fix: 'Water in long dry spells, mulch with compost and leaves, harvest at 8 to 12 months, and always peel, soak and cook cassava thoroughly, since raw cassava is toxic.',
    },
  ],
  chayote: [
    {
      label: 'Chayote rotting before sprouting',
      looks: 'A whole chayote planted in the ground turns soft and rots instead of sprouting.',
      why: 'The fruit is planted into cold, wet soil before it has sprouted, or buried too deep.',
      fix: 'Let the chayote sprout indoors on a sunny windowsill first, then plant it on its side with the sprouting end just showing, in warm, well-drained soil with compost, and water lightly until it grows.',
    },
    {
      label: 'Chayote powdery mildew',
      looks: 'White, powdery patches spread over chayote leaves in late summer, which yellow and dry, and fruit set slows.',
      why: 'A fungus of the squash family favoured by dry roots, humid nights and crowded vines on a shaded trellis.',
      fix: 'Train the vine over a strong, open trellis in full sun, thin crowded shoots, water deeply at the roots, keep a compost mulch, and spray diluted milk at about 1 to 9 on the leaves at the first spots.',
      insteadOf: 'Sulphur sprays burn leaves in heat and kill beneficial mites.',
    },
    {
      label: 'A chayote vine with no fruit',
      looks: 'The chayote vine grows huge but produces no fruit until autumn, or none at all.',
      why: 'Chayotes flower only when days shorten in late summer, and need bees to carry pollen from male to female flowers.',
      fix: 'Be patient until the days shorten, grow bee flowers nearby, and plant two vines for better pollination. Feed only with compost, since rich feeding gives more vine and no sooner fruit.',
    },
  ],
  malanga: [
    {
      label: 'Malanga root rot',
      looks: 'Malanga plants yellow, wilt, and the corms are soft and rotten at harvest.',
      why: 'Root rot fungi thrive in waterlogged soil, and corms planted when damaged or cut let rot in from the start.',
      fix: 'Plant healthy, whole corms in raised beds of well-drained soil with plenty of compost, keep the soil moist but never standing wet, and rotate to a new bed each year.',
    },
    {
      label: 'Malanga leaf blight',
      looks: 'Purple-brown spots on malanga leaves that ooze and spread, killing leaves quickly in wet weather.',
      why: 'A water mould that thrives in warm, humid, wet weather and spreads by rain splash from leaf to leaf.',
      fix: 'Space plants for air to move, water at the soil rather than over the leaves, cut off and bin infected leaves at once, keep a mulch over the soil, and grow resistant kinds.',
    },
    {
      nutrient: 'K',
      label: 'Small malanga corms',
      looks: 'Malanga corms are small at harvest, and the older leaves brown at the edges.',
      why: 'Malanga needs plenty of potassium to fill its corms, and sandy soil with little organic matter runs short.',
      fix: 'Mulch with compost, chopped banana stems and leaves, water on comfrey liquid while the corms fill, and add a little wood ash from untreated wood.',
    },
  ],
  roselle: [
    {
      label: 'Roselle that will not flower',
      looks: 'Roselle plants grow tall and leafy through summer but form no flowers or calyces before the first cold nights.',
      why: 'Roselle flowers only as the days shorten below about 12 hours, so in a short, cool season the plant runs out of warm weather before it can crop.',
      fix: 'Start seed indoors six to eight weeks before the last frost, plant out in the warmest, sunniest spot you have, feed only with moderate compost rather than rich manure, and in a short season grow it in a large pot you can move under cover in autumn.',
      insteadOf: 'A nitrogen feed makes a taller, leafier plant that flowers no sooner.',
    },
    {
      label: 'Root-knot nematodes on roselle',
      looks: 'Roselle plants are stunted, yellow and wilt in the heat, and the roots are swollen with knots.',
      why: 'Roselle is a hibiscus and a favourite host of root-knot nematodes in warm, sandy soil, and they build up where hibiscus, okra or tomatoes grew the year before.',
      fix: 'Rotate roselle away from okra, tomatoes and other hosts, dig in plenty of compost to feed the fungi and predatory nematodes that eat them, grow French marigolds or sunn hemp in the bed the season before, and bin infested roots rather than composting them.',
      insteadOf: 'Soil fumigants kill the whole soil community, including what kept the nematodes in check.',
    },
    {
      label: 'Roselle mealybugs and ants',
      looks: 'White, cottony clusters in the leaf joints and on the calyces of roselle, sticky honeydew, and ants running up the stems.',
      why: 'Mealybugs feed on the sap of the hibiscus family, and ants farm them and carry them from plant to plant.',
      fix: 'Keep ants off with a sticky band around each stem or stake, hose off or wipe off clusters, grow small-flowered plants nearby for ladybirds and lacewings, and pick calyces promptly so mealybugs do not settle in them.',
      insteadOf: 'Insecticide sprays land on calyces you make into tea and kill the ladybirds that eat the mealybugs.',
    },
  ],
  malabarspinach: [
    {
      label: 'Malabar spinach leaf spot',
      looks: 'Round spots with red-brown edges and grey or tan centres on Malabar spinach leaves, which yellow and drop in wet spells.',
      why: 'A fungus (Cercospora) spread by water splash in warm, humid weather, worst on crowded vines with wet leaves.',
      fix: 'Grow on a tall, open trellis in full sun, water at the soil rather than over the leaves, pick off spotted leaves, keep a compost mulch so spores are not splashed up from bare soil, and pick often so the vine stays open.',
      insteadOf: 'Fungicides on a crop picked for its leaves every few days would land straight on the next meal.',
    },
    {
      label: 'Malabar spinach bolting and bitterness',
      looks: 'Malabar spinach flowers early, the leaves turn small, tough and bitter, and the vine sets dark purple berries.',
      why: 'The vine flowers once days shorten, and dry roots and poor soil bring it on sooner.',
      fix: 'Pinch out flower spikes as they form, water deeply through hot spells, mulch with compost to keep the soil moist, and harvest young shoot tips often so it keeps making soft new growth.',
    },
    {
      label: 'Malabar spinach sulking in cool weather',
      looks: 'Malabar spinach seedlings sit for weeks without growing, pale and small, and the older leaves drop.',
      why: 'Malabar spinach is a tropical vine that needs warm soil above about 20°C and stops growing in cool weather.',
      fix: 'Sow indoors and plant out only after nights stay above 15°C, grow against a warm, sunny wall, and cover with fleece in a cold spell. Soaking the seed overnight speeds its slow germination.',
    },
  ],
  pigeonpea: [
    {
      nutrient: 'Mo',
      label: 'Pale pigeon pea with few root nodules',
      looks: 'Pigeon pea plants are pale yellow-green and slow despite rich-looking soil, and pulled roots show few or no pink nodules.',
      why: 'The bacteria in the root nodules that turn air into nitrogen need molybdenum, which is locked away in strongly acid soil, and some soils lack the right bacteria.',
      fix: 'Raise very acid soil toward pH 6 with wood ash or garden lime and compost, add seaweed, and dust the seed with a pigeon pea inoculant (cowpea group) before sowing where it has not grown before.',
      insteadOf: 'Nitrogen fertiliser on a legume makes it stop forming nodules, so it no longer feeds the soil for the crop that follows.',
    },
    {
      label: 'Pod borers in pigeon peas',
      looks: 'Pigeon pea pods have round holes, and the seeds inside are eaten out, often with green or brown caterpillars inside.',
      why: 'Moth caterpillars (Helicoverpa and pod borers) lay on the flowers and young pods, worst in dry weather.',
      fix: 'Hand-pick caterpillars in the evening, shake the plants over a cloth, grow flowers nearby to bring in the parasitic wasps and birds that eat them, and harvest pods promptly.',
      insteadOf: 'Insecticides kill the parasitic wasps that control the caterpillars, and outbreaks come back.',
    },
    {
      label: 'Pigeon pea wilt',
      looks: 'Pigeon peas wilt and die suddenly, one plant at a time, and the stem shows a brown streak inside when split.',
      why: 'A soil fungus (Fusarium) that builds up where pigeon peas grow year after year in the same spot.',
      fix: 'Rotate to a new spot every two or three years, grow resistant kinds, dig in compost to feed the soil life that competes with the fungus, and pull and bin wilted plants.',
    },
  ],
  lemongrass: [
    {
      nutrient: 'N',
      label: 'Pale, yellowing lemongrass',
      looks: 'Lemongrass clumps turn pale yellow-green, the leaves are thin, and the stalks stay narrow.',
      why: 'Lemongrass is a grass that uses a lot of nitrogen, and a clump in a pot or poor soil runs short.',
      fix: 'Topdress with compost and well-rotted manure each spring, water on fish amino acid (FAA) at about 1 to 1,000 every few weeks in summer, and divide old clumps.',
      insteadOf: 'A soluble nitrogen feed greens it for a few weeks and then washes through.',
    },
    {
      label: 'Lemongrass rust',
      looks: 'Small, rusty orange-brown pustules on lemongrass leaves, which turn brown and dry from the tips.',
      why: 'A rust fungus that spreads in humid weather on crowded, old clumps where air cannot move.',
      fix: 'Cut the clump back hard to 15 cm, remove and bin the leaves, divide and replant the healthiest outer pieces, and water at the base rather than over the leaves.',
    },
    {
      label: 'Lemongrass dying back in winter',
      looks: 'Lemongrass leaves brown and die back in cold weather, and the base of the clump rots.',
      why: 'Lemongrass is a tropical grass that cannot take frost, and cold, wet soil rots its base in winter.',
      fix: 'Grow in a pot and bring it indoors before the first frost, or lift and pot a few stalks, and keep it on the dry side in a bright room until spring.',
    },
  ],
};

// Where to read more about growing each crop without chemicals: Garden
// Organic's growing guide for the crop where it has one, the California
// Rare Fruit Growers' fruit facts for warm-climate fruit, and a named
// extension or RHS page where neither covers it. Citrus, lemon, lime,
// longan and sugar apple have none here because their two UF/IFAS pages
// already cover them. cropSources in cropGuides.ts adds the living-soil
// guide for the crop group and two PubMed searches after these, and every
// link is checked by scripts/test_crop_guides.js --links.
export const CROP_ORGANIC_SOURCES: Record<string, GuideSource[]> = {
  tomato: [
    { label: 'Garden Organic: Growing tomatoes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/tomatoes' },
  ],
  pepper: [
    { label: 'Garden Organic: Growing peppers and chillies organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/38-Pepper.pdf?dm=1726651509' },
  ],
  aubergine: [
    { label: 'Garden Organic: Growing aubergines organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-aubergine' },
  ],
  potato: [
    { label: 'Garden Organic: Growing potatoes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-potatoes' },
  ],
  lettuce: [
    { label: 'Garden Organic: Growing lettuce organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-lettuce' },
  ],
  spinach: [
    { label: 'Garden Organic: Growing spinach organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/spinach' },
  ],
  chard: [
    { label: 'Garden Organic: Growing chard organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-chard' },
  ],
  kale: [
    { label: 'Garden Organic: Growing kale organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-kale' },
  ],
  cabbage: [
    { label: 'Garden Organic: Growing cabbages organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/cabbage-summer-autumn' },
  ],
  broccoli: [
    { label: 'Garden Organic: Growing broccoli and calabrese organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-calabrese' },
  ],
  cauliflower: [
    { label: 'Garden Organic: Growing cauliflowers organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-cauliflower' },
  ],
  brussels: [
    { label: 'Garden Organic: Growing brussels sprouts organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-brussels-sprouts' },
  ],
  kohlrabi: [
    { label: 'Garden Organic: Growing kohlrabi organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-kohl-rabi' },
  ],
  pakchoi: [
    { label: 'Garden Organic: Growing pak choi organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-oriental-salad' },
  ],
  rocket: [
    { label: 'Garden Organic: Growing rocket organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/42-Rocket.pdf?dm=1726651510' },
  ],
  carrot: [
    { label: 'Garden Organic: Growing carrots organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-carrot' },
  ],
  beetroot: [
    { label: 'Garden Organic: Growing beetroot organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-a-beetroot' },
  ],
  radish: [
    { label: 'Garden Organic: Growing radishes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/how-to-grow-vegetables-and-herbs/how-to-grow-radish' },
  ],
  turnip: [
    { label: 'Garden Organic: Growing turnips organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/56-Turnip.pdf?dm=1726651512' },
  ],
  parsnip: [
    { label: 'Garden Organic: Growing parsnips organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-parsnip' },
  ],
  onion: [
    { label: 'Garden Organic: Growing onions organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/onion' },
  ],
  shallot: [
    { label: 'Garden Organic: Growing shallots organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/49-Shallot.pdf?dm=1726651511' },
  ],
  garlic: [
    { label: 'Garden Organic: Growing garlic organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/garlic' },
  ],
  leek: [
    { label: 'Garden Organic: Growing leeks organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-leek' },
  ],
  peas: [
    { label: 'Garden Organic: Growing peas organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-peas' },
  ],
  greenbeans: [
    { label: 'Garden Organic: Growing green beans organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-french-bean' },
  ],
  runnerbeans: [
    { label: 'Garden Organic: Growing runner beans organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/11-Bean-Runner.pdf?dm=1726651502' },
  ],
  broadbeans: [
    { label: 'Garden Organic: Growing broad beans organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-broad-bean' },
  ],
  cucumber: [
    { label: 'Garden Organic: Growing cucumbers organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-cucumber' },
  ],
  courgette: [
    { label: 'Garden Organic: Growing courgettes organically', url: 'https://www.gardenorganic.org.uk/courgette-marrow' },
  ],
  squash: [
    { label: 'Garden Organic: Growing winter squash and pumpkins organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/pumpkins-and-squashes' },
  ],
  sweetcorn: [
    { label: 'Garden Organic: Growing sweetcorn organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/52-Sweetcorn.pdf?dm=1726651512' },
  ],
  celery: [
    { label: 'Garden Organic: Growing celery organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-celery' },
  ],
  asparagus: [
    { label: 'Garden Organic: Growing asparagus organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-asparagus' },
  ],
  rhubarb: [
    { label: 'Garden Organic: Growing rhubarb organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-rhubarb' },
  ],
  globeartichoke: [
    { label: 'Garden Organic: Growing globe artichokes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-globe-artichoke' },
  ],
  jerusalemartichoke: [
    { label: 'Garden Organic: Growing jerusalem artichokes organically', url: 'https://garden-organic.files.svdcdn.com/production/documents/5-Artichoke-Jerusalem.pdf?dm=1726651511' },
  ],
  basil: [
    { label: 'Garden Organic: Growing basil organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-basil' },
  ],
  parsley: [
    { label: 'Garden Organic: Growing parsley organically', url: 'https://www.gardenorganic.org.uk/parsley' },
  ],
  coriander: [
    { label: 'Garden Organic: Growing coriander organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-coriander' },
  ],
  mint: [
    { label: 'Garden Organic: Growing mint organically', url: 'https://www.gardenorganic.org.uk/mint' },
  ],
  rosemary: [
    { label: 'Garden Organic: Growing rosemary organically', url: 'https://www.gardenorganic.org.uk/rosemary' },
  ],
  thyme: [
    { label: 'Garden Organic: Growing thyme organically', url: 'https://www.gardenorganic.org.uk/thyme' },
  ],
  oregano: [
    { label: 'Garden Organic: Growing oregano and marjoram organically', url: 'https://www.gardenorganic.org.uk/marjoram' },
  ],
  sage: [
    { label: 'Garden Organic: Growing sage organically', url: 'https://www.gardenorganic.org.uk/sage' },
  ],
  dill: [
    { label: 'Garden Organic: Growing dill organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-dill' },
  ],
  chives: [
    { label: 'Garden Organic: Growing chives organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-chives' },
  ],
  tarragon: [
    { label: 'Garden Organic: Growing tarragon organically', url: 'https://www.gardenorganic.org.uk/tarragon' },
  ],
  lemonbalm: [
    { label: 'Garden Organic: Growing lemon balm organically', url: 'https://www.gardenorganic.org.uk/lemon-balm' },
  ],
  strawberry: [
    { label: 'Garden Organic: Growing strawberries organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/strawberry' },
  ],
  raspberry: [
    { label: 'Garden Organic: Growing raspberries organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/raspberry' },
  ],
  blackberry: [
    { label: 'Garden Organic: Growing blackberries organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-blackberry' },
  ],
  blueberry: [
    { label: 'Garden Organic: Growing blueberries organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/blueberry' },
  ],
  gooseberry: [
    { label: 'Garden Organic: Growing gooseberries organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/gooseberry' },
  ],
  blackcurrant: [
    { label: 'Garden Organic: Growing blackcurrants organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/blackcurrant' },
  ],
  redcurrant: [
    { label: 'Garden Organic: Growing redcurrants and whitecurrants organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-redcurrants_whitecurrants' },
  ],
  apple: [
    { label: 'Garden Organic: Growing apples organically', url: 'https://www.gardenorganic.org.uk/how-to-grow-apples' },
  ],
  pear: [
    { label: 'Garden Organic: Growing pears organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-pears' },
  ],
  plum: [
    { label: 'Garden Organic: Growing plums organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-grapes/plum' },
    { label: 'RHS: Silver leaf', url: 'https://www.rhs.org.uk/disease/silver-leaf' },
  ],
  cherry: [
    { label: 'RHS: Bacterial canker', url: 'https://www.rhs.org.uk/disease/bacterial-canker' },
    { label: 'RHS: Brown rot', url: 'https://www.rhs.org.uk/disease/brown-rot' },
  ],
  apricot: [
    { label: 'California Rare Fruit Growers: Apricots', url: 'https://crfg.org/homepage/library/fruitfacts/apricot-low-chill/' },
    { label: 'RHS: Bacterial canker', url: 'https://www.rhs.org.uk/disease/bacterial-canker' },
  ],
  fig: [
    { label: 'California Rare Fruit Growers: Figs', url: 'https://crfg.org/homepage/library/fruitfacts/fig/' },
  ],
  grape: [
    { label: 'Garden Organic: Growing grapes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-grapes' },
  ],
  kiwi: [
    { label: 'California Rare Fruit Growers: Kiwifruit', url: 'https://crfg.org/homepage/library/fruitfacts/kiwi/' },
  ],
  melon: [
    { label: 'Garden Organic: Growing melons organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/fruit-guides/how-to-grow-melon' },
  ],
  citrus: [],
  lemon: [],
  lime: [],
  mango: [
    { label: 'California Rare Fruit Growers: Mangoes', url: 'https://crfg.org/homepage/library/fruitfacts/mango/' },
  ],
  banana: [
    { label: 'California Rare Fruit Growers: Bananas and Plantains', url: 'https://crfg.org/homepage/library/fruitfacts/banana/' },
  ],
  papaya: [
    { label: 'California Rare Fruit Growers: Papayas', url: 'https://crfg.org/homepage/library/fruitfacts/papaya/' },
  ],
  avocado: [
    { label: 'California Rare Fruit Growers: Avocados', url: 'https://crfg.org/homepage/library/fruitfacts/avocado/' },
  ],
  pineapple: [
    { label: 'California Rare Fruit Growers: Pineapples', url: 'https://crfg.org/homepage/library/fruitfacts/pineapple/' },
  ],
  guava: [
    { label: 'California Rare Fruit Growers: Guavas', url: 'https://crfg.org/homepage/library/fruitfacts/guava-tropical/' },
  ],
  pomegranate: [
    { label: 'California Rare Fruit Growers: Pomegranates', url: 'https://crfg.org/homepage/library/fruitfacts/pomegranate/' },
  ],
  lychee: [
    { label: 'California Rare Fruit Growers: Lychees', url: 'https://crfg.org/homepage/library/fruitfacts/lychee/' },
  ],
  longan: [],
  loquat: [
    { label: 'California Rare Fruit Growers: Loquats', url: 'https://crfg.org/homepage/library/fruitfacts/loquat/' },
  ],
  sapodilla: [
    { label: 'California Rare Fruit Growers: Sapodillas', url: 'https://crfg.org/homepage/library/fruitfacts/sapodilla/' },
  ],
  sugarapple: [],
  jackfruit: [
    { label: 'California Rare Fruit Growers: Jackfruit', url: 'https://crfg.org/homepage/library/fruitfacts/jackfruit/' },
  ],
  passionfruit: [
    { label: 'California Rare Fruit Growers: Passion Fruit', url: 'https://crfg.org/homepage/library/fruitfacts/passion-fruit/' },
  ],
  sweetpotato: [
    { label: 'Garden Organic: Growing sweet potatoes organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/sweet-potato' },
  ],
  okra: [
    { label: 'Garden Organic: Growing okra organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-okra' },
  ],
  cassava: [
    { label: 'University of Arkansas: Cassava', url: 'https://www.uaex.uada.edu/yard-garden/resource-library/plant-week/cassava-10-12-07.aspx' },
  ],
  chayote: [
    { label: 'Garden Organic: Growing chayote organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-chayote' },
  ],
  malanga: [
    { label: 'Garden Organic: Growing malanga and taro organically', url: 'https://www.gardenorganic.org.uk/taro' },
  ],
  roselle: [
    { label: 'UC Master Gardeners: Hibiscus roselle', url: 'https://ucanr.edu/blog/under-solano-sun/article/hibiscus-roselle' },
  ],
  malabarspinach: [
    { label: 'UF/IFAS: Malabar spinach', url: 'https://edis.ifas.ufl.edu/publication/HS1371' },
    { label: 'University of Wisconsin: Malabar spinach', url: 'https://hort.extension.wisc.edu/articles/malabar-spinach-basella-alba/' },
  ],
  pigeonpea: [
    { label: 'University of Hawaii CTAHR: Pigeon pea as green manure', url: 'https://www.ctahr.hawaii.edu/oc/freepubs/pdf/GreenManureCrops/pigeonpea.pdf' },
    { label: 'University of Hawaii CTAHR: Pigeon pea', url: 'https://cms.ctahr.hawaii.edu/soap/Resources/Sustainable-and-Organic-Topics/Pigeonpea' },
  ],
  lemongrass: [
    { label: 'Garden Organic: Growing lemongrass organically', url: 'https://www.gardenorganic.org.uk/expert-advice/how-to-grow/growing-guides/vegetables-herbs-guides/how-to-grow-lemongrass' },
  ],
};
