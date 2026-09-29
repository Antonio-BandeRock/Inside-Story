// The symptoms a person picks from in Horticulture's What Is Wrong With a
// Plant band, and which of them each crop problem shows as.
//
// The first version (I26, 2026-09-29) also read each symptom the same way
// for every crop: a list of shortages and look-alikes per symptom. That was
// removed the same day by direct statement: "what every plant presents or
// does when it is high or low on any specific nutrient or is being over or
// under watered doesn't always follow the same path ... Is there any way
// to separate it by the crop being grown and retain complete accuracy?"
// What a symptom means now comes only from lib/cropSigns.ts, crop by crop.
// Do not add a cross-crop reading of a symptom back here.
//
// This file keeps the picker list and the hand-made tags saying which
// symptoms each of the three known problems per crop (lib/cropProblems.ts)
// shows as. Pure: no React and no database, checked by
// scripts/test_crop_symptoms.js.

export type SymptomKey = 'yo' | 'yn' | 'pu' | 'sp' | 'ed' | 'cu' | 'wi' | 'ro' | 'ha' | 'fl' | 'bo' | 'st' | 'ho' | 'ot';

export type Symptom = {
  key: SymptomKey;
  /** The picker label, as a person would say it. */
  label: string;
  /** Lower-case, fits "What ... on tomato can be". */
  phrase: string;
};

export const SYMPTOMS: Symptom[] = [
  {
    key: 'yo',
    label: 'Yellow older, lower leaves',
    phrase: 'yellow lower leaves',
  },
  {
    key: 'yn',
    label: 'Pale or yellow new leaves',
    phrase: 'pale or yellow new leaves',
  },
  {
    key: 'pu',
    label: 'Purple or red leaves',
    phrase: 'purple or red leaves',
  },
  {
    key: 'sp',
    label: 'Spots, patches, mildew or rust on the leaves',
    phrase: 'spots, patches, mildew or rust on the leaves',
  },
  {
    key: 'ed',
    label: 'Brown, scorched leaf edges or tips',
    phrase: 'brown leaf edges and tips',
  },
  {
    key: 'cu',
    label: 'Curled, twisted or narrow new leaves',
    phrase: 'curled, twisted or narrow new leaves',
  },
  {
    key: 'wi',
    label: 'Wilting or collapsing',
    phrase: 'wilting or collapse',
  },
  {
    key: 'ro',
    label: 'Rot, cracks or damage at the stem, base or roots',
    phrase: 'rot or cracks at the stem, base or roots',
  },
  {
    key: 'ha',
    label: 'Something wrong with the fruit, pods, heads or roots you eat',
    phrase: 'trouble with the fruit, heads or roots you eat',
  },
  {
    key: 'fl',
    label: 'Flowers falling, or flowers with no fruit',
    phrase: 'flowers falling or no fruit setting',
  },
  {
    key: 'bo',
    label: 'Running to flower early (bolting)',
    phrase: 'running to flower early',
  },
  {
    key: 'st',
    label: 'Small, slow, thin or leggy growth',
    phrase: 'small, slow or leggy growth',
  },
  {
    key: 'ho',
    label: 'Holes, insects or something eating it',
    phrase: 'holes, insects or something eating it',
  },
  {
    key: 'ot',
    label: 'Flavour, spreading, or seed not coming up',
    phrase: 'flavour, spreading or seed not coming up',
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
  hops: {
    'Hop downy mildew': ['cu', 'st', 'sp', 'ha'],
    'Hop Verticillium wilt': ['yo', 'wi'],
    'Small, crinkled hop leaves on limy soil': ['cu', 'yn', 'st'],
  },
  cannabis: {
    'Cannabis leaf edges scorched rusty brown': ['ed', 'cu'],
    'Cannabis lower leaves yellowing in cool nights': ['yo', 'sp', 'cu'],
    'Cannabis powdery mildew': ['sp'],
  },
  peach: {
    'Peach leaf curl': ['cu', 'pu', 'sp'],
    'Peach leaves yellowing on limy soil': ['yn'],
    'Brown rot and mummified peaches': ['ha'],
  },
  drybeans: {
    'White mould on dry beans': ['ro', 'wi', 'ha'],
    'Dry bean root rot in wet, crusted soil': ['yo', 'st', 'ro'],
    'Dry beans all leaf and few pods': ['fl'],
  },
  chickpea: {
    'Ascochyta blight on chickpeas': ['sp'],
    'Chickpeas failing in wet, cold soil': ['yo', 'st', 'ro'],
    'Chickpea leaves small and bunched on limy soil': ['yn', 'st'],
  },
  lentil: {
    'Lentil root rot in waterlogged soil': ['yo', 'pu', 'st', 'ro'],
    'Lentil anthracnose and blight': ['sp'],
    'Pale lentils short of sulphur': ['yn'],
  },
  soybean: {
    'Pale soya plants with no nodules': ['yo', 'st'],
    'Yellow young soya leaves on limy soil': ['yn', 'st'],
    'Soya seed and seedlings eaten': ['ho', 'ot'],
  },
  peanut: {
    'Empty peanut pods short of calcium': ['ha'],
    'Yellow peanuts in a new bed': ['yo', 'st'],
    'Peanut southern blight and leaf spot': ['sp', 'wi'],
  },
  ginger: {
    'Ginger rhizome rotting in wet soil': ['ro', 'wi'],
    'Ginger leaf tips browning in the sun': ['ed', 'st'],
    'Store ginger that never sprouts': ['ot'],
  },
  turmeric: {
    'Turmeric rhizome rotting': ['ro', 'wi'],
    'Turmeric leaves yellowing in too much sun': ['yn'],
    'Turmeric cut short by cold': ['st'],
  },
  collards: {
    'Black rot on collards': ['ed', 'wi'],
    'Collards bolting after a cold spell': ['bo'],
    'Caterpillars on collards': ['ho'],
  },
  mustardgreens: {
    'Flea beetle holes in mustard greens': ['ho'],
    'Mustard greens bolting and turning bitter': ['bo'],
    'Yellow new mustard leaves short of sulphur': ['yn', 'st'],
  },
  fennel: {
    'Florence fennel bolting before it bulbs': ['bo'],
    'Split fennel bulbs': ['ha'],
    'Small, flat fennel bulbs': ['ha', 'st'],
  },
  tomatillo: {
    'Empty tomatillo husks': ['fl', 'ha'],
    'Tomatillos all leaf and no fruit': ['fl'],
    'Tomatillo root rot and virus': ['cu', 'wi', 'ro'],
  },
  cowpea: {
    'Cowpea fusarium wilt': ['yo', 'wi'],
    'Cowpeas all vine and few peas': ['fl'],
    'Cowpeas failing in cool soil': ['st', 'ro'],
  },
};

export function findSymptom(key: SymptomKey): Symptom | undefined {
  return SYMPTOMS.find((symptom) => symptom.key === key);
}
