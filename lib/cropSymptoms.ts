// A symptom guide in Horticulture (I26, 2026-09-29): start from what the
// plant is doing, "yellow lower leaves", "spots on the leaves", "flowers
// falling", and read what it can be, for one crop or for any.
//
// Nothing here is new advice. It joins three things already in the app:
// the three problems each crop is known for (lib/cropProblems.ts), the
// nutrient shortages and where they show (PLANT_NUTRIENTS), and the things
// that look like a shortage and are not (NUTRIENT_LOOK_ALIKES). This file
// adds only the index between them: which symptoms each crop problem shows
// as, tagged by hand from its `looks` text, and which shortages and
// look-alikes go with each symptom. Every page it points to is one those
// three files already cite, plus the RHS deficiencies page and a PubMed
// search for the symptom itself.
//
// Answers what PictureThis sells as a subscription, with nothing leaving
// the phone. Every list is the likeliest causes, never a diagnosis.
//
// Pure: no React and no database, so scripts/test_crop_symptoms.js can
// check that every crop problem is tagged, every tag is known, and each
// shortage listed under a symptom says it shows that way.

import { CROP_PROBLEMS, type CropProblem } from './cropProblems';
import { GO_PESTICIDES, RHS_DEFICIENCIES, pubmedSearchUrl, type GuideSource, type PlantNutrientKey } from './plantNutrients';

export type SymptomKey = 'yo' | 'yn' | 'pu' | 'sp' | 'ed' | 'cu' | 'wi' | 'ro' | 'ha' | 'fl' | 'bo' | 'st' | 'ho' | 'ot';

export type Symptom = {
  key: SymptomKey;
  /** The picker label, as a person would say it. */
  label: string;
  /** Lower-case, fits "What ... can be". */
  phrase: string;
  /** What it most often is, in two or three sentences. */
  about: string;
  nutrients: PlantNutrientKey[];
  /** Headings in NUTRIENT_LOOK_ALIKES. */
  lookAlikes: string[];
  pubmedTerms: string;
};

export const SYMPTOMS: Symptom[] = [
  {
    key: 'yo',
    label: 'Yellow older, lower leaves',
    phrase: 'yellow lower leaves',
    about:
      'Yellowing that starts at the bottom of the plant is a nutrient the plant can move, drawn out of the old leaves to feed the new: nitrogen most often, then magnesium and potassium. Before any of those, check the soil a finger deep, since too dry and too wet both do this, and one or two old leaves yellowing on a healthy plant is only age.',
    nutrients: ['N', 'Mg', 'K', 'Mo'],
    lookAlikes: ['Old leaves doing what old leaves do', 'Too dry or too wet', 'Cold', 'Damaged roots'],
    pubmedTerms: 'chlorosis older leaves nutrient deficiency vegetable crops',
  },
  {
    key: 'yn',
    label: 'Pale or yellow new leaves',
    phrase: 'pale or yellow new leaves',
    about:
      'Yellowing that starts at the top is a nutrient the plant cannot move, most often iron or manganese locked away in a soil too alkaline, or sulphur. Veins staying sharply green on a yellow young leaf points to iron. Weedkiller drift and a virus can look much the same.',
    nutrients: ['Fe', 'Mn', 'S', 'Zn'],
    lookAlikes: ['Too dry or too wet', 'Weedkiller drift', 'Virus'],
    pubmedTerms: 'interveinal chlorosis young leaves iron deficiency high pH soil',
  },
  {
    key: 'pu',
    label: 'Purple or red leaves',
    phrase: 'purple or red leaves',
    about:
      'Purple on seedlings in a cold spring is usually the cold, and greens up as the soil warms. Where it lasts, phosphorus shortage tints the older leaves and undersides, and magnesium and potassium shortage can turn yellow patches purple or reddish brown.',
    nutrients: ['P', 'Mg', 'K'],
    lookAlikes: ['Cold', 'Too dry or too wet'],
    pubmedTerms: 'anthocyanin purple leaves phosphorus deficiency low temperature seedlings',
  },
  {
    key: 'sp',
    label: 'Spots, patches, mildew or rust on the leaves',
    phrase: 'spots, patches, mildew or rust on the leaves',
    about:
      'Most spots are a fungus or a bacterium, which the crop problems below name for each crop, and most are made worse by wet leaves, crowding and still air. A white powder is mildew, orange pustules are rust, and a mosaic of light and dark green points to a virus. A nutrient can speckle a leaf too.',
    nutrients: ['Mn', 'Mg'],
    lookAlikes: ['Virus', 'Too much feed'],
    pubmedTerms: 'leaf spot disease diagnosis vegetable crops cultural control',
  },
  {
    key: 'ed',
    label: 'Brown, scorched leaf edges or tips',
    phrase: 'brown leaf edges and tips',
    about:
      'Crisp brown edges on older leaves are the classic look of potassium shortage, and on the inner leaves of lettuce and cabbage they are tipburn, a calcium problem that comes from uneven watering far more often than from the soil. In pots, salt from heavy feeding does the same.',
    nutrients: ['K', 'Ca'],
    lookAlikes: ['Too much feed', 'Too dry or too wet'],
    pubmedTerms: 'leaf margin necrosis potassium deficiency tipburn calcium',
  },
  {
    key: 'cu',
    label: 'Curled, twisted or narrow new leaves',
    phrase: 'curled, twisted or narrow new leaves',
    about:
      'New growth that twists, cups or narrows to straps is weedkiller drift more often than anything else, including from manure out of treated fields. Aphids and leaf miners curl leaves as well. Where neither fits, zinc, boron, copper and molybdenum shortages all distort new growth.',
    nutrients: ['Zn', 'B', 'Cu', 'Mo'],
    lookAlikes: ['Weedkiller drift', 'Virus'],
    pubmedTerms: 'leaf distortion herbicide injury micronutrient deficiency diagnosis',
  },
  {
    key: 'wi',
    label: 'Wilting or collapsing',
    phrase: 'wilting or collapse',
    about:
      'A plant that wilts in dry soil wants water. One that wilts in wet soil has roots that have stopped working, from waterlogging, a root rot or something eating them, and more water makes it worse. Wilting that does not recover by evening is the one to worry about.',
    nutrients: ['Cu'],
    lookAlikes: ['Too dry or too wet', 'Damaged roots'],
    pubmedTerms: 'plant wilting root rot waterlogging diagnosis',
  },
  {
    key: 'ro',
    label: 'Rot, cracks or damage at the stem, base or roots',
    phrase: 'rot or cracks at the stem, base or roots',
    about:
      'Rot at the base is nearly always water sitting where it should drain, or soil piled against the stem. Cracked stems and hollow or brown hearts in roots are the classic look of boron shortage, and root crops fork and split when the soil is stony, fresh-manured or watered unevenly.',
    nutrients: ['B', 'Ca'],
    lookAlikes: ['Too dry or too wet', 'Damaged roots'],
    pubmedTerms: 'stem rot root crop disorders boron deficiency hollow stem',
  },
  {
    key: 'ha',
    label: 'Something wrong with the fruit, pods, heads or roots you eat',
    phrase: 'trouble with the fruit, heads or roots you eat',
    about:
      'Most faults in the part you eat come from water rather than the soil: blossom-end rot, bitter pit and splitting all follow uneven watering, since calcium only travels with the water. Uneven ripening can be potassium or heat, and hollow or brown hearts can be boron.',
    nutrients: ['Ca', 'K', 'B'],
    lookAlikes: ['Too dry or too wet'],
    pubmedTerms: 'fruit physiological disorders blossom end rot calcium irrigation',
  },
  {
    key: 'fl',
    label: 'Flowers falling, or flowers with no fruit',
    phrase: 'flowers falling or no fruit setting',
    about:
      'Flowers drop when nights are too hot or too cold, when the plant is too dry, or when nothing pollinates them. Some crops need a second plant, or a male and a female. Too much nitrogen gives leaves instead of flowers, and potassium shortage gives few flowers and small fruit.',
    nutrients: ['K'],
    lookAlikes: ['Too dry or too wet', 'Cold'],
    pubmedTerms: 'flower abortion fruit set temperature pollination vegetable crops',
  },
  {
    key: 'bo',
    label: 'Running to flower early (bolting)',
    phrase: 'running to flower early',
    about:
      'Bolting is the plant deciding to set seed, triggered by lengthening days, heat, a cold spell after sowing, or dry roots. No nutrient causes it. Sowing at the right time of year, a bolt-resistant variety and steady water are what stop it.',
    nutrients: [],
    lookAlikes: ['Too dry or too wet', 'Cold'],
    pubmedTerms: 'bolting premature flowering vernalization day length leafy vegetables',
  },
  {
    key: 'st',
    label: 'Small, slow, thin or leggy growth',
    phrase: 'small, slow or leggy growth',
    about:
      'Long, pale, floppy seedlings are reaching for light. Small, slow plants in good light are most often cold soil, poor roots or a soil short of nitrogen or phosphorus, and a plant crowded by its neighbours stays small whatever it is fed.',
    nutrients: ['N', 'P', 'Zn'],
    lookAlikes: ['Cold', 'Damaged roots', 'Too dry or too wet', 'Too much feed'],
    pubmedTerms: 'stunted growth nitrogen phosphorus deficiency soil temperature vegetable seedlings',
  },
  {
    key: 'ho',
    label: 'Holes, insects or something eating it',
    phrase: 'holes, insects or something eating it',
    about:
      'Holes and chewed edges are something eating: caterpillars, slugs, beetles or birds. Sticky leaves and ants point to aphids, scale or mealybugs. A garden with flowers, cover and no sprays keeps the ladybirds, hoverflies and birds that eat most of them, and a net or a barrier does the rest.',
    nutrients: [],
    lookAlikes: [],
    pubmedTerms: 'natural enemies conservation biological control vegetable garden pests',
  },
  {
    key: 'ot',
    label: 'Flavour, spreading, or seed not coming up',
    phrase: 'flavour, spreading or seed not coming up',
    about:
      'Weak flavour usually comes from too much water, too much feed or too little sun rather than a shortage. Seed that never comes up is old seed, cold soil or soil that dried out. The crop problems below cover what each crop is known for.',
    nutrients: [],
    lookAlikes: [],
    pubmedTerms: 'herb essential oil content fertilization irrigation light',
  },
];

// Which symptoms each crop problem shows as, by crop key then problem
// label. Tagged by hand from each problem's `looks` text: pests as
// something eating it, rot at the base or roots as rot and wilting, fruit
// faults as trouble with what you eat, flower drop as flowers, leggy or
// thin as small and slow, flavour and spreading as something else.
// Labels must match lib/cropProblems.ts exactly; the test checks every one.
export const CROP_PROBLEM_SYMPTOMS: Record<string, Record<string, SymptomKey[]>> = {
  tomato: {
    'Blossom-end rot': ['ha'],
    'Blotchy ripening': ['ha'],
    'Yellow bands on the lower leaves': ['yo', 'pu'],
  },
  pepper: {
    'Sunken patches on the fruit': ['ha'],
    'Flowers falling without fruit': ['fl'],
    'Pale seedlings stuck in their pots': ['yo', 'st'],
  },
  aubergine: {
    'Mottled older leaves under glass': ['yo', 'sp'],
    'Flowers that never set': ['fl'],
    'Small, dull fruit': ['ha', 'ed'],
  },
  potato: {
    'Common scab': ['ha'],
    'Hollow heart': ['ha'],
    'Bronzed middle leaves': ['yo', 'pu'],
  },
  lettuce: {
    'Tipburn on the heart leaves': ['ed'],
    'Bolting': ['bo'],
    'Pale, slow lettuces': ['yo', 'st'],
  },
  spinach: {
    'Bolting in spring': ['bo'],
    'Speckled pale leaves on limy soil': ['yn', 'sp'],
    'Downy mildew': ['sp'],
  },
  chard: {
    'Cracked stalks': ['ro'],
    'Leaf spot': ['sp'],
    'Small leaves late in the season': ['st', 'yn'],
  },
  kale: {
    'Clubroot': ['ro', 'wi', 'st'],
    'Whitefly and cabbage aphid': ['ho'],
    'Purple and yellow lower leaves': ['yo', 'pu'],
  },
  cabbage: {
    'Split heads': ['ha'],
    'Strappy young leaves': ['cu'],
    'Cabbage white caterpillars': ['ho'],
  },
  broccoli: {
    'Hollow, split stems': ['ro'],
    'Heads flowering early': ['bo', 'ha'],
    'Flea beetle': ['ho'],
  },
  cauliflower: {
    'Whiptail on young plants': ['cu'],
    'Browning curds': ['ha'],
    'Small button curds': ['ha', 'st'],
  },
  brussels: {
    'Loose, blown sprouts': ['ha'],
    'Mealy cabbage aphid': ['ho'],
    'Yellow lower leaves in autumn': ['yo'],
  },
  kohlrabi: {
    'Woody, split stems': ['ha'],
    'Brown flesh inside': ['ha'],
    'Cabbage root fly': ['ho', 'wi', 'ro'],
  },
  pakchoi: {
    'Bolting': ['bo'],
    'Brown edges inside the head': ['ed'],
    'Slugs and flea beetles': ['ho'],
  },
  rocket: {
    'Flea beetle holes': ['ho'],
    'Hot, bolting leaves': ['bo', 'ot'],
    'Yellow leaves after cutting': ['yn', 'st'],
  },
  carrot: {
    'Cavity spot': ['ha', 'ro'],
    'Forked and hairy roots': ['ha', 'ro'],
    'Carrot fly': ['ho', 'ro'],
  },
  beetroot: {
    'Heart rot': ['ha', 'ro', 'cu'],
    'Speckled yellow leaves': ['sp'],
    'Woody roots': ['ha', 'ro'],
  },
  radish: {
    'Split roots': ['ha', 'ro'],
    'All leaf and no root': ['ha', 'ro'],
    'Pithy, fiery radishes': ['ha', 'ot'],
  },
  turnip: {
    'Brown heart': ['ha', 'ro'],
    'Clubroot on turnips': ['ro', 'wi', 'st'],
    'Woody, bitter roots': ['ha', 'ot'],
  },
  parsnip: {
    'Canker': ['ha', 'ro'],
    'Seed that never comes up': ['ot'],
    'Forked roots': ['ha', 'ro'],
  },
  onion: {
    'White rot': ['ro', 'yo', 'wi'],
    'Bolting': ['bo'],
    'Soft necks that rot in store': ['ha', 'ro'],
  },
  shallot: {
    'Downy mildew on shallots': ['sp'],
    'Sets pulled out by birds': ['ho'],
    'Small clusters of bulbs': ['ha', 'ro'],
  },
  garlic: {
    'Garlic rust': ['sp'],
    'One round bulb instead of cloves': ['ha', 'ro'],
    'Cloves rotting over winter': ['ro', 'ot'],
  },
  leek: {
    'Leek rust': ['sp'],
    'Leek moth and allium leaf miner': ['ho'],
    'Pencil-thin leeks': ['st', 'ha'],
  },
  peas: {
    'Marsh spot': ['ha'],
    'Few root nodules': ['st', 'ro'],
    'Powdery mildew on late peas': ['sp'],
  },
  greenbeans: {
    'Halo blight': ['sp'],
    'Flowers but no pods': ['fl'],
    'Pale speckled leaves on chalky soil': ['yn', 'sp'],
  },
  runnerbeans: {
    'Flowers falling without setting pods': ['fl'],
    'Blackfly on the tips': ['ho'],
    'Stringy, tough pods': ['ha'],
  },
  broadbeans: {
    'Chocolate spot': ['sp'],
    'Blackfly on broad beans': ['ho'],
    'Bean weevil notches': ['ho'],
  },
  cucumber: {
    'Bitter fruit': ['ha', 'ot'],
    'Red spider mite under glass': ['ho', 'sp'],
    'Fruit that yellows and withers young': ['ha', 'fl'],
  },
  courgette: {
    'Powdery mildew on courgettes': ['sp'],
    'Small fruit rotting from the tip': ['ha', 'fl'],
    'Plants stalling after planting out': ['st', 'yo'],
  },
  squash: {
    'Squash that will not ripen': ['ha'],
    'Squash rotting in store': ['ha'],
    'Squash vine borer': ['ho', 'wi'],
  },
  sweetcorn: {
    'Yellow V on the lower leaves': ['yo'],
    'Purple seedlings': ['pu'],
    'Gappy cobs': ['ha'],
  },
  celery: {
    'Cracked stems': ['ro'],
    'Blackheart': ['ro', 'yn'],
    'Celery leaf miner': ['ho', 'sp'],
  },
  asparagus: {
    'Asparagus beetle': ['ho'],
    'Thin, spindly spears': ['st'],
    'Crowns rotting in wet soil': ['ro'],
  },
  rhubarb: {
    'Crown rot': ['ro'],
    'Flower stalks': ['bo'],
    'Thin, pale stalks': ['st'],
  },
  globeartichoke: {
    'Crowns lost over winter': ['ro', 'wi'],
    'Black bean aphid on the heads': ['ho'],
    'Small, tough heads': ['ha', 'st'],
  },
  jerusalemartichoke: {
    'Plants spreading across the bed': ['ot'],
    'Stems blown over': ['ro', 'ha'],
    'Knobbly, small tubers': ['ha'],
  },
  basil: {
    'Basil downy mildew': ['sp'],
    'Seedlings collapsing': ['wi'],
    'Pale basil in a pot': ['yn', 'st'],
  },
  parsley: {
    'Slow germination': ['ot'],
    'Carrot fly on parsley': ['ho', 'ro'],
    'Going to seed in its second year': ['bo'],
  },
  coriander: {
    'Bolting in summer': ['bo'],
    'Transplant shock': ['wi', 'bo'],
    'Soft rot at the base': ['ro', 'wi'],
  },
  mint: {
    'Mint rust': ['sp', 'cu'],
    'Mint spreading everywhere': ['ot'],
    'Woody, tired mint': ['st', 'yn'],
  },
  rosemary: {
    'Root rot in wet soil': ['ro', 'wi'],
    'Rosemary beetle': ['ho'],
    'Woody, bare stems': ['st'],
  },
  thyme: {
    'Thyme dying back after a wet winter': ['ro', 'wi'],
    'Woody plants opening in the middle': ['st'],
    'Leggy thyme with little scent': ['st', 'ot'],
  },
  oregano: {
    'Oregano rotting in wet soil': ['ro', 'wi'],
    'Mild, flavourless leaves': ['ot'],
    'Oregano running to flower': ['bo'],
  },
  sage: {
    'Sage rotting at the base': ['ro', 'wi'],
    'Powdery mildew on sage': ['sp'],
    'Leggy sage with bare stems': ['st'],
  },
  dill: {
    'Dill bolting fast': ['bo'],
    'Aphids on dill': ['ho'],
    'Dill crossing with fennel': ['ot'],
  },
  chives: {
    'Rust on chives': ['sp'],
    'Congested, grassy clumps': ['st', 'fl'],
    'Pale chives in a pot': ['yn', 'wi'],
  },
  tarragon: {
    'Tarragon lost in a wet winter': ['ro', 'wi'],
    'Tarragon with no flavour': ['ot'],
    'Rust on tarragon': ['sp'],
  },
  lemonbalm: {
    'Lemon balm seeding everywhere': ['ot'],
    'Powdery mildew on lemon balm': ['sp'],
    'Weak lemon scent': ['ot'],
  },
  strawberry: {
    'Grey mould on the berries': ['ha'],
    'Tipburn on new strawberry leaves': ['ed'],
    'Tired plants with small berries': ['ha', 'st'],
  },
  raspberry: {
    'Yellow leaves on chalky soil': ['yn'],
    'Raspberry beetle grubs': ['ho', 'ha'],
    'Cane blight and root rot': ['wi', 'ro'],
  },
  blackberry: {
    'Cane spot and purple blotch': ['sp', 'ro'],
    'Red berry mite': ['ho', 'ha'],
    'Weak new canes': ['st'],
  },
  blueberry: {
    'Yellow leaves in ordinary soil': ['yn'],
    'Birds taking the crop': ['ho'],
    'Few berries on one bush': ['fl'],
  },
  gooseberry: {
    'Gooseberry sawfly': ['ho'],
    'American gooseberry mildew': ['sp', 'ha'],
    'Scorched leaf edges': ['ed'],
  },
  blackcurrant: {
    'Big bud mite': ['ho'],
    'Short new shoots': ['st'],
    'Currant blossom falling': ['fl'],
  },
  redcurrant: {
    'Currant blister aphid': ['ho', 'cu', 'pu'],
    'Brown leaf margins on redcurrants': ['ed'],
    'Birds stripping the strings': ['ho'],
  },
  apple: {
    'Bitter pit': ['ha'],
    'Apple scab': ['sp', 'ha'],
    'Codling moth': ['ho', 'ha'],
  },
  pear: {
    'Blossom wither and corky fruit': ['fl', 'ha'],
    'Pear rust': ['sp'],
    'Pear midge': ['ho', 'ha'],
  },
  plum: {
    'Silver leaf': ['sp', 'wi'],
    'Plum moth': ['ho', 'ha'],
    'Branches breaking under the crop': ['ro'],
  },
  cherry: {
    'Bacterial canker': ['sp', 'ro', 'wi'],
    'Birds taking the cherries': ['ho'],
    'Brown rot': ['ha'],
  },
  apricot: {
    'Frost-killed blossom': ['fl'],
    'Bacterial canker on apricot': ['ro', 'sp', 'wi'],
    'Branches dying back': ['wi', 'ro'],
  },
  fig: {
    'Root-knot nematodes on fig': ['ro', 'st'],
    'Figs dropping before ripening': ['ha', 'fl'],
    'Winter damage': ['wi', 'ha'],
  },
  grape: {
    'Powdery mildew on the vine': ['sp', 'ha'],
    'Grey mould in tight bunches': ['ha'],
    'Red and yellow bands between the veins': ['yo', 'pu'],
  },
  kiwi: {
    'Female vines with no fruit': ['fl'],
    'Young shoots killed by late frost': ['wi'],
    'Vine all leaf and little fruit': ['fl'],
  },
  melon: {
    'Cracked and hollow melons': ['ha'],
    'Flowers but no melons': ['fl'],
    'Collar rot at the base': ['ro', 'wi'],
  },
  citrus: {
    'Yellow V at the leaf base': ['yo'],
    'Little leaf and mottling': ['yn', 'cu', 'st'],
    'Scale insects and sooty mould': ['ho', 'sp'],
  },
  lemon: {
    'A potted lemon dropping its leaves in winter': ['ot', 'wi'],
    'Citrus leaf miner': ['ho', 'cu'],
    'A pale lemon tree in a pot': ['yo', 'st'],
  },
  lime: {
    'Young limes dropping': ['fl', 'ha'],
    'Yellow new leaves on limy ground': ['yn'],
    'Cold damage on a lime': ['ed', 'wi'],
  },
  mango: {
    'Anthracnose on flowers and fruit': ['fl', 'ha', 'sp'],
    'A mango tree that will not flower': ['fl'],
    'Jelly seed and soft nose': ['ha'],
  },
  banana: {
    'Scorched, yellowing banana leaf edges': ['ed', 'yo'],
    'Banana weevil borer': ['ho', 'wi', 'ro'],
    'Small, stunted banana bunches': ['ha', 'st'],
  },
  papaya: {
    'Lumpy, bumpy papayas': ['ha'],
    'Papaya root rot in wet ground': ['ro', 'wi', 'yo'],
    'A papaya that never fruits': ['fl'],
  },
  avocado: {
    'Avocado root rot': ['ro', 'wi', 'yn'],
    'Salt-burnt avocado leaf tips': ['ed'],
    'An avocado full of flowers but few fruit': ['fl'],
  },
  pineapple: {
    'Pineapple heart rot': ['ro', 'ha'],
    'Mealybug wilt': ['ho', 'wi', 'cu'],
    'Yellow-streaked pineapple leaves on limy soil': ['yn'],
  },
  guava: {
    'Guava fruit fly': ['ho', 'ha'],
    'Guava anthracnose': ['ha', 'sp'],
    'Small, bronzed guava leaves': ['pu', 'cu', 'st'],
  },
  pomegranate: {
    'Split pomegranates': ['ha'],
    'Pomegranate heart rot': ['ha'],
    'A pomegranate that flowers but drops its fruit': ['fl'],
  },
  lychee: {
    'A lychee that will not flower': ['fl'],
    'Lychee erinose mite': ['ho', 'cu', 'sp'],
    'Split lychees': ['ha'],
  },
  longan: {
    'A longan that crops only every other year': ['fl', 'ot'],
    'Longan witches broom': ['cu', 'fl'],
    'Small, poorly filled longans': ['ha'],
  },
  loquat: {
    'Loquat fire blight': ['wi', 'fl'],
    'Purple spot and sunburn': ['ha'],
    'Small, tart loquats': ['ha', 'ot'],
  },
  sapodilla: {
    'Sapodilla fruit dropping young': ['fl', 'ha'],
    'Sapodilla scale insects': ['ho', 'sp'],
    'Sapodilla picked hard that never softens': ['ha'],
  },
  sugarapple: {
    'Sugar apple seed borer': ['ho', 'ha'],
    'Sugar apple flowers that do not set': ['fl', 'ha'],
    'Sugar apple fruit that split and rot': ['ha'],
  },
  jackfruit: {
    'Jackfruit rot': ['ha', 'fl'],
    'Jackfruit fruit fly': ['ho', 'ha'],
    'Waterlogged jackfruit roots': ['ro', 'wi', 'yo'],
  },
  passionfruit: {
    'Passionfruit woodiness virus': ['sp', 'cu', 'ha'],
    'Passionfruit collar rot': ['ro', 'wi'],
    'Flowers but no passionfruit': ['fl'],
  },
  sweetpotato: {
    'Cracked sweet potatoes': ['ha'],
    'Sweet potato weevil': ['ho', 'ha'],
    'All vine and no sweet potatoes': ['ha', 'ro'],
  },
  okra: {
    'Root-knot nematodes on okra': ['ro', 'st', 'wi'],
    'Tough, stringy okra pods': ['ha'],
    'Okra aphids and ants': ['ho', 'cu'],
  },
  cassava: {
    'Cassava mosaic disease': ['sp', 'cu', 'st'],
    'Cassava root rot in wet soil': ['ro', 'wi'],
    'Cassava roots that turn bitter or stringy': ['ha', 'ot'],
  },
  chayote: {
    'Chayote rotting before sprouting': ['ot', 'ro'],
    'Chayote powdery mildew': ['sp'],
    'A chayote vine with no fruit': ['fl'],
  },
  malanga: {
    'Malanga root rot': ['ro', 'wi'],
    'Malanga leaf blight': ['sp'],
    'Small malanga corms': ['ha', 'ro'],
  },
  roselle: {
    'Roselle that will not flower': ['fl'],
    'Root-knot nematodes on roselle': ['ro', 'st', 'wi'],
    'Roselle mealybugs and ants': ['ho'],
  },
  malabarspinach: {
    'Malabar spinach leaf spot': ['sp'],
    'Malabar spinach bolting and bitterness': ['bo', 'ot'],
    'Malabar spinach sulking in cool weather': ['st', 'yo'],
  },
  pigeonpea: {
    'Pale pigeon pea with few root nodules': ['yo', 'st', 'ro'],
    'Pod borers in pigeon peas': ['ho', 'ha'],
    'Pigeon pea wilt': ['wi'],
  },
  lemongrass: {
    'Pale, yellowing lemongrass': ['yo', 'st'],
    'Lemongrass rust': ['sp'],
    'Lemongrass dying back in winter': ['wi', 'ro'],
  },
};

export function findSymptom(key: SymptomKey): Symptom | undefined {
  return SYMPTOMS.find((symptom) => symptom.key === key);
}

/** The problems a crop is known for that show as this symptom. */
export function cropProblemsFor(cropKey: string, symptom: SymptomKey): CropProblem[] {
  const tags = CROP_PROBLEM_SYMPTOMS[cropKey] ?? {};
  return (CROP_PROBLEMS[cropKey] ?? []).filter((problem) => (tags[problem.label] ?? []).includes(symptom));
}

/** Crop keys with at least one known problem showing as this symptom. */
export function cropsWithSymptom(symptom: SymptomKey): string[] {
  return Object.keys(CROP_PROBLEM_SYMPTOMS).filter((cropKey) => cropProblemsFor(cropKey, symptom).length > 0);
}

export function symptomSources(symptom: Symptom): GuideSource[] {
  const research: GuideSource = { label: 'PubMed: the research', url: pubmedSearchUrl(symptom.pubmedTerms) };
  return symptom.key === 'ho' ? [GO_PESTICIDES, research] : [RHS_DEFICIENCIES, research];
}

/** "What yellow lower leaves on tomato can be", or on any crop. */
export function symptomHeading(symptom: Symptom, cropName: string | null): string {
  return cropName ? `What ${symptom.phrase} on ${cropName.toLowerCase()} can be` : `What ${symptom.phrase} can be`;
}

export const SYMPTOM_GUIDE_INTRO =
  'Start from what the plant is doing. Pick what you see, and a crop if you know it, and this lists what it most often is: the problems that crop is known for, the soil shortages that show that way, and the things that look like a shortage and are not. Nothing leaves the phone.';

export const SYMPTOM_GUIDE_CAUTION =
  'These are the likeliest causes, not a diagnosis. Check the soil a finger deep before anything else, and test it before adding anything to it.';

export const SYMPTOM_NO_CROP_LINE = 'Pick a crop to see the problems it is known for that show this way.';
