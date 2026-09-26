// Your Story as an interview, 1.0.52.5. Direct instruction, 2026-09-25:
// "The app requires them to input their conditions, their neurodivergences
// or not, their interest on where THEY want to start using the app, and with
// a focus on providing the app with the things it needs such as their
// prescriptions, supplements, where they are with their condition(s), if
// they need to follow any certain eating style, or if they are interested in
// following one, explaining each style of eating for them to make an
// informed decision. and the app needs to tell them about what each tab is
// meant to do for them. Configure this sort of like the app answering
// interview questions. I don't want it to focus immediately on one little
// aspect of the whole tab, I want it to tell the user what they can do with
// all of the Life tab or all of the Food tab, etc."
//
// Two halves:
//   the questions  asked one at a time, in the order the app needs the
//                  answers. A question is answered by its record (a
//                  condition chosen, a stage set, a medicine listed) or, for
//                  an answer that leaves no record anywhere else ("none of
//                  these", "not sure yet", the tab to start from), by a row
//                  in your_story_answers. Nothing here stores "done".
//   the tour       what each of the nine tabs is for as a whole, its lenses
//                  in named groups, and a few ways to get started, the tab
//                  chosen to start from first.
//
// The rules Your Story keeps hold here too: no numbering, no percentage, no
// praise or blame, nothing claimed about a cause, and no eating style
// described as treating anything.
//
// Pure, imports nothing at runtime but lib/yourStory.ts, and covered by
// scripts/test_your_story.js.
import {
  ITEM_BY_KEY,
  beatListSentence,
  itemApplies,
  type BeatKey,
  type StoryDestination,
  type YourStoryItemKey,
  type YourStoryView,
} from './yourStory';
import type { GuideRecordKey, GuideRecords } from './yourStoryGuides';

// THE QUESTIONS.

export type InterviewKind =
  | 'conditions'
  | 'neuro'
  | 'beats'
  | 'startTab'
  | 'meds'
  | 'stage'
  | 'eatingStyle'
  | 'allergies'
  | 'aboutYou'
  | 'backup';

export type InterviewQuestionDef = {
  kind: InterviewKind;
  question: string;
  // Why the app asks, shown under the question.
  why: string;
  // Asked only when one of these parts of life is chosen, or a condition
  // is; empty means everybody.
  beats: BeatKey[];
};

export const INTERVIEW_QUESTIONS: InterviewQuestionDef[] = [
  {
    kind: 'conditions',
    question: 'Do you live with any of these conditions?',
    why: 'Each one changes what the app says about a food, which reading comes first, and what the meal plans leave out. Choose as many as apply, or none.',
    beats: [],
  },
  {
    kind: 'neuro',
    question: 'Is autism, ADHD or dyslexia part of your life?',
    why: 'Inside Story can hold the details of your day so they stop taking up room in your head, with a quieter Home, a place to drop a thought and reminders that come before a thing. None of it changes a food score.',
    beats: [],
  },
  {
    kind: 'beats',
    question: 'What parts of your life do you want Inside Story to follow?',
    why: 'The rest of these questions, and the guides after them, only ask about the parts you choose. Nothing in the app is hidden by what you leave out.',
    beats: [],
  },
  {
    kind: 'startTab',
    question: 'Where would you like to start?',
    why: 'Every tab can be used without the others. Choose the one closest to why you opened the app, and it comes first below.',
    beats: [],
  },
  {
    kind: 'meds',
    question: 'Do you take any medicines or supplements?',
    why: 'Timing advice, the dose schedule, the nutrients a supplement adds and your doctor report all start from this list. Prescriptions, over-the-counter medicines and supplements all go in the same place.',
    beats: ['health', 'food'],
  },
  {
    kind: 'stage',
    question: 'Where are you with {condition}?',
    why: 'Foods that suit where you are come first, and anything worth a second look is marked. Nothing is hidden or blocked, and you can change this whenever things change.',
    beats: [],
  },
  {
    kind: 'eatingStyle',
    question: 'Do you follow a way of eating, or want to try one?',
    why: 'Meal plans and recipe suggestions keep to the styles you choose. Read about any of them first; choosing one can be undone at any time.',
    beats: ['health', 'food'],
  },
  {
    kind: 'allergies',
    question: 'Do you have any food allergies?',
    why: 'Food lookups and meal plans mark anything that contains a listed allergen. The marking depends on how foods are labelled, so it helps you check and is never a promise a food is safe.',
    beats: ['health', 'food'],
  },
  {
    kind: 'aboutYou',
    question: 'When were you born, and what is your sex?',
    why: 'Recommended amounts of most nutrients differ by age and sex. Without them the app uses general adult figures, which may not fit you.',
    beats: ['health', 'food'],
  },
  {
    kind: 'backup',
    question: 'Where should a copy of your records be kept?',
    why: 'Everything you record lives on this device and nobody else holds a copy. A backup to a cloud folder you control is the only way back if the phone is lost or reset.',
    beats: [],
  },
];

export const QUESTION_BY_KIND: Record<InterviewKind, InterviewQuestionDef> = Object.fromEntries(
  INTERVIEW_QUESTIONS.map((def) => [def.kind, def]),
) as Record<InterviewKind, InterviewQuestionDef>;

// The labels on the answers that leave no record anywhere else.
export const NONE_OF_THESE_LABEL = 'None of these';
export const DONE_LABEL = 'Done';
export const NOT_SURE_LABEL = 'Not sure yet';
export const NO_ALLERGIES_LABEL = 'No food allergies';
export const NO_STYLE_LABEL = 'None for now';
export const ALL_TABS_LABEL = 'Show me all of them';
export const NOT_NOW_LABEL = 'Not now';
export const TAKE_NOTHING_LABEL = 'I take nothing';
export const ADD_MEDS_LABEL = 'Add them in My Meds';
export const LEAVE_OUT_LABEL = 'Leave these out';
export const SET_UP_BACKUP_LABEL = 'Set it up in Profile';
export const PLAN_THIS_WAY_LABEL = 'Plan meals this way';
export const READ_MORE_LABEL = 'Read more';
export const CHANGE_LABEL = 'Change';
export const NEURO_PROFILE_NOTE =
  'Listing one changes no food score. The settings it can turn on are in Profile, each switched on or off separately.';
export const OPEN_PROFILE_LABEL = 'Open Profile';

export const INTERVIEW_HEADING = 'A few questions first';
export const INTERVIEW_LEAD =
  'Inside Story works better the more it knows about you. Answer what applies, one at a time; every answer can be changed later.';
export const INTERVIEW_ANSWERED_HEADING = 'What you told Inside Story';
export const INTERVIEW_FINISHED_LINE = 'Every question has an answer. Tap Change on any of them if something is different now.';
export const NEXT_QUESTION_LABEL = 'Next question:';

// The allergens most food labels are required to name, the same list
// Profile offers.
export const COMMON_ALLERGENS = ['Eggs', 'Fish', 'Milk', 'Peanuts', 'Sesame', 'Shellfish', 'Soybeans', 'Tree Nuts', 'Wheat'];

// EATING STYLES. The tags are RECIPE_DIET_TAGS; each line is short on
// purpose, and the full reading is the entry named in readId.

export type EatingStyle = { tag: string; line: string; readId: string };

export const EATING_STYLES: EatingStyle[] = [
  {
    tag: 'Omnivore',
    line: 'Everything is on the table, animal and plant. The work is in the balance and the variety rather than in what is left out.',
    readId: 'diet-omnivore',
  },
  {
    tag: 'Mediterranean',
    line: 'Vegetables, beans, whole grains, fish and olive oil at the centre, with little red meat or sugar. One of the most studied ways of eating.',
    readId: 'diet-mediterranean',
  },
  {
    tag: 'Plant-Based/Flexitarian',
    line: 'Mostly plants, with meat, fish, eggs or dairy now and then rather than at every meal.',
    readId: 'diet-plant-based-flexitarian',
  },
  {
    tag: 'Vegetarian',
    line: 'No meat or fish, while eggs and dairy stay in. Protein, iron and B12 take a little more planning, which the app watches for you.',
    readId: 'diet-vegetarian',
  },
  {
    tag: 'Vegan',
    line: 'No animal foods at all. B12 has to come from a supplement or a fortified food, and the app keeps an eye on iron, zinc, iodine and omega-3.',
    readId: 'diet-vegan',
  },
  {
    tag: 'Gluten-Free',
    line: 'No wheat, barley or rye. Required with celiac disease; some people with other conditions choose it to see how they feel without gluten.',
    readId: 'diet-gluten-free',
  },
  {
    tag: 'Dairy-Free',
    line: 'No milk, cheese, yogurt or butter from animals. Calcium and vitamin D then come from other foods, which the app points out.',
    readId: 'diet-dairy-free',
  },
  {
    tag: 'Paleo',
    line: 'Meat, fish, eggs, vegetables, fruit, nuts and seeds, leaving out grains, beans, dairy and processed foods.',
    readId: 'diet-paleo',
  },
  {
    tag: 'AIP',
    line: 'The Autoimmune Protocol: paleo with eggs, nuts, seeds, nightshades and a few more left out for a while, then brought back one at a time to see how each one sits with you. Meant as a short phase rather than a way of eating for good.',
    readId: 'diet-aip',
  },
  {
    tag: 'High-Protein',
    line: 'Protein at every meal, from whatever sources you eat. Often chosen for muscle, fullness or recovery.',
    readId: 'diet-high-protein',
  },
];

// THE TOUR: WHAT EACH TAB IS FOR.

export type TourPath = '/' | '/life' | '/schedule' | '/log' | '/food' | '/garden' | '/insights' | '/trends' | '/reports';

export type TourLensGroup = {
  title: string;
  line: string;
  // Lens keys on that tab, named through TOUR_LENS_NAMES.
  lenses: string[];
};

export type TourStepDef = {
  doThis: string;
  // Ticked when this Your Story item is done, or when this record exists.
  item?: YourStoryItemKey;
  record?: GuideRecordKey;
  // Where Go there leads; an item's own destination when left out.
  destination?: StoryDestination;
  // Offered only for these parts of life; an item's own list when left out.
  beats?: BeatKey[];
};

export type TourTabDef = {
  path: TourPath;
  title: string;
  question: string;
  answer: string;
  groups: TourLensGroup[];
  steps: TourStepDef[];
  open: StoryDestination;
};

const route = (pathname: string, params?: Record<string, string>): StoryDestination => ({ kind: 'route', pathname, params });
const lens = (pathname: string, param: string) => (key: string) => route(pathname, { [param]: key });
const scheduleLens = lens('/schedule', 'openScheduleLens');
const signalsLens = lens('/log', 'openSignalsLens');
const foodLens = lens('/food', 'openFoodLens');
const gardenLens = lens('/garden', 'openGardenLens');
const insightsLens = lens('/insights', 'openInsightsLens');
const profile = route('/profile');

// What each lens is called on screen, checked by the test against the tab
// screens.
export const TOUR_LENS_NAMES: Record<string, Record<string, string>> = {
  '/life': {
    myMeds: 'My Meds',
    emergency: 'Emergency',
    conditions: 'Conditions',
    routines: 'Routines',
    didIDoIt: 'Did I Do It',
    daysUntil: 'Days Until',
    upkeep: 'Upkeep',
    kitchen: 'Kitchen',
    groceryList: 'Grocery List',
    finances: 'Finances',
    work: 'Work',
    movement: 'Movement',
    healthLiteracy: 'Health Literacy',
    earthMatters: 'Earth Matters',
    searchReading: 'Search Reading',
  },
  '/schedule': {
    meals: 'Meals',
    todaysMeals: "Today's Meals",
    pastMeals: 'Past Meals',
    dailyMealPlan: 'Meal Plan',
    hydration: 'Hydration',
    meds: 'Meds',
    appointments: 'Appointments',
    upkeep: 'Upkeep',
    exercise: 'Exercise',
  },
  '/log': {
    flares: 'Flares',
    foodReactions: 'Food Reactions',
    newFoods: 'New Foods',
    exercise: 'Exercise',
    bloodPressure: 'Blood Pressure',
    nocturia: 'Nocturia',
    therapies: 'Hands-On Therapies',
    generalNote: 'General Note',
  },
  '/food': {
    findMeal: 'Log or Schedule',
    scanProduct: 'Scan a Product',
    mealBuilder: 'Meal',
    sideBuilder: 'Sides',
    saladBuilder: 'Salads & Bowls',
    smoothieBuilder: 'Smoothies',
    soupBuilder: 'Soups',
    snackBuilder: 'Snacks',
    beverageBuilder: 'Beverages',
    bakedGoodsBuilder: 'Baked Goods',
    saucesBuilder: 'Sauces',
    handheldsBuilder: 'Handhelds',
    dessertBuilder: 'Desserts',
    fermentationBuilder: 'Fermentation',
    systemRecipes: 'System Recipes',
  },
  '/garden': {
    myZone: 'My Zone',
    plotsAndPlantings: 'Plots & Plantings',
    upcomingTasks: 'Upcoming Tasks',
    daysUntil: 'Days Until',
    compost: 'Compost',
    growingConditions: 'Growing Conditions',
    harvestLog: 'Harvest Log',
    growingCosts: 'Growing Costs',
    horticulture: 'Horticulture',
  },
  '/insights': {
    nutrients: 'Nutrients',
    sixDs: 'Condition Scores',
    hydration: 'Hydration',
    advisories: "Today's Advisories",
    portions: 'Energy & Portions',
    foodLookup: 'Food Lookup',
    nutrientRanking: 'Nutrient Ranking',
    cookingImpact: 'Cooking Impact',
    prep: 'Cooking & Prep',
    safeFoods: 'Safe Foods',
    healingStage: 'Healing Stage',
    labs: 'Labs',
    myMeds: 'My Meds & Interactions',
  },
  '/trends': {
    nutrients: 'Nutrients',
    sixDs: 'Condition Scores',
    variety: 'What You Eat',
    eatingWindow: 'Eating Window',
    groceries: 'Grocery Prices',
    symptoms: 'Symptoms & Flares',
    weight: 'Weight',
    movement: 'Movement',
    labs: 'Labs',
    therapyResponse: 'Therapy Response',
    keepingUp: 'Keeping Up',
    cost: 'What It Costs',
    harvest: 'Garden Yield',
    conditions: 'Growing Conditions',
    patterns: 'Pattern Finder',
  },
};

export const TOUR_TABS: TourTabDef[] = [
  {
    path: '/',
    title: 'Home',
    question: 'What is Home for?',
    answer:
      'The page Inside Story opens on. It gathers today from every other tab: the check-in, what is coming up, what you noted down, and a way into anything else in one tap. You choose which cards it shows and in what order.',
    groups: [
      { title: 'Today', line: 'The date and weather, how you feel, and the meals and doses coming up.', lenses: [] },
      {
        title: 'Out of your head',
        line: 'Capture for a thought the moment you have it, Where Is It for anything you put away, and your routines, marks and counters.',
        lenses: [],
      },
      { title: 'Something to read', line: 'A short piece of reading chosen for the conditions and interests you gave.', lenses: [] },
    ],
    steps: [
      { doThis: 'Say how you feel today on the check-in card.', item: 'checkin' },
      { doThis: 'Drop a thought into Capture the next time one comes to you.', item: 'capture' },
      { doThis: 'Choose which cards Home shows, in Profile under Home.', destination: profile },
    ],
    open: route('/'),
  },
  {
    path: '/life',
    title: 'Life',
    question: 'What is Life for?',
    answer:
      'Everything about running your life that you would otherwise have to remember: what you take, the house, money, work, the people you look after, and reading about your conditions and your health. Things are written down once here, and the other tabs read them.',
    groups: [
      {
        title: 'Your health, written down once',
        line: 'What you take, what somebody helping you in a hurry would need to know, and reading on each condition you follow.',
        lenses: ['myMeds', 'emergency', 'conditions'],
      },
      {
        title: 'Daily living',
        line: 'Routines walked through a part at a time, a place to mark that you did a thing, counters to a date, house upkeep, what is in your kitchen and where, and the grocery list.',
        lenses: ['routines', 'didIDoIt', 'daysUntil', 'upkeep', 'kitchen', 'groceryList'],
      },
      {
        title: 'Money and work',
        line: 'Bills, spending, medical costs and insurance, and how work is going week to week.',
        lenses: ['finances', 'work'],
      },
      { title: 'Movement', line: 'The kinds of movement you do and the plans you keep.', lenses: ['movement'] },
      {
        title: 'Reading',
        line: 'Plain explanations of nutrients, additives and the food system, every claim cited, with one search over all of it.',
        lenses: ['healthLiteracy', 'earthMatters', 'searchReading'],
      },
    ],
    steps: [
      { doThis: 'List your medicines and supplements in My Meds.', item: 'meds' },
      { doThis: 'Fill in the emergency card.', item: 'emergency' },
      { doThis: 'Write down one routine you go through most days.', item: 'routine' },
      { doThis: 'Add the bills that come every month.', item: 'bills' },
      { doThis: 'Add one thing around the house that needs doing now and then.', item: 'upkeep' },
    ],
    open: route('/life'),
  },
  {
    path: '/schedule',
    title: 'Schedules',
    question: 'What is Schedules for?',
    answer:
      'Your days on a clock. Meals, drinks, doses, appointments, upkeep and exercise each get a time, and reminders come to you so the times do not have to stay in your head. A thing is set up on the tab it belongs to and gets its time here.',
    groups: [
      {
        title: 'Eating',
        line: 'Log or plan a meal, see today with meals and doses in the order they come, look back over past meals, and build a meal plan up to six weeks ahead.',
        lenses: ['meals', 'todaysMeals', 'pastMeals', 'dailyMealPlan'],
      },
      {
        title: 'Taking care',
        line: 'Each dose at its time with what it should be kept apart from, drinks through the day, and appointments alongside your calendar.',
        lenses: ['meds', 'hydration', 'appointments'],
      },
      { title: 'Around the house and body', line: 'When upkeep is due and when you plan to move.', lenses: ['upkeep', 'exercise'] },
    ],
    steps: [
      { doThis: 'Log a meal you ate today.', item: 'meal' },
      { doThis: 'Give each medicine a time.', record: 'doseTimes', destination: scheduleLens('meds'), beats: ['health'] },
      { doThis: 'Log a glass of water.', item: 'water' },
      { doThis: 'Add your next appointment.', record: 'appointment', destination: scheduleLens('appointments'), beats: ['health'] },
      { doThis: 'Try a meal plan for the week ahead.', record: 'mealPlan', destination: scheduleLens('dailyMealPlan'), beats: ['food'] },
    ],
    open: route('/schedule'),
  },
  {
    path: '/log',
    title: 'Signals',
    question: 'What is Signals for?',
    answer:
      'How you feel, written down as it happens. Flares, reactions to a meal, new foods tried, exercise, blood pressure and hands-on therapies each have a place. This is what Insights, Trends and Reports set everything else beside.',
    groups: [
      { title: 'How you feel', line: 'A flare, how you felt after a meal, and a new food tried for the first time.', lenses: ['flares', 'foodReactions', 'newFoods'] },
      { title: 'Your body', line: 'Movement, blood pressure readings and waking at night to pass water.', lenses: ['exercise', 'bloodPressure', 'nocturia'] },
      { title: 'What you tried', line: 'Massage, physiotherapy and the like, and a note about anything else.', lenses: ['therapies', 'generalNote'] },
    ],
    steps: [
      { doThis: 'Say how you feel today.', item: 'checkin' },
      { doThis: 'Log a flare when one comes, with how bad it was.', record: 'flare', destination: signalsLens('flares'), beats: ['health'] },
      { doThis: 'Note how you felt after a meal.', record: 'foodReaction', destination: signalsLens('foodReactions'), beats: ['health', 'food'] },
      { doThis: 'Log some movement.', item: 'exercise' },
    ],
    open: route('/log'),
  },
  {
    path: '/food',
    title: 'Food',
    question: 'What is Food for?',
    answer:
      'Everything about what you eat. Look up any food and see what it means for your conditions, scan a packaged product, build a meal, a soup or a smoothie once so logging it later takes one tap, follow a ferment from start to jar, and cook from recipes already checked against the conditions you follow.',
    groups: [
      { title: 'Find and check', line: 'Log a meal you have built, or scan a barcode to see what is in a product.', lenses: ['findMeal', 'scanProduct'] },
      {
        title: 'Build once, log in a tap',
        line: 'A builder for each kind of dish, each one showing what the ingredients mean for you before you save.',
        lenses: [
          'mealBuilder',
          'sideBuilder',
          'saladBuilder',
          'smoothieBuilder',
          'soupBuilder',
          'snackBuilder',
          'beverageBuilder',
          'bakedGoodsBuilder',
          'saucesBuilder',
          'handheldsBuilder',
          'dessertBuilder',
        ],
      },
      { title: 'Ferment', line: 'Yogurt, sauerkraut, kombucha and the rest, with each batch followed from start to finish.', lenses: ['fermentationBuilder'] },
      { title: 'Recipes', line: 'Hundreds of home-cooked recipes, filtered to your conditions and eating style.', lenses: ['systemRecipes'] },
    ],
    steps: [
      { doThis: 'Build the meal you eat most often.', record: 'savedRecipe', destination: foodLens('mealBuilder') },
      { doThis: 'Scan something packaged from your cupboard.', record: 'scannedProduct', destination: foodLens('scanProduct') },
      { doThis: 'Look through System Recipes for something to cook this week.', destination: foodLens('systemRecipes') },
      { doThis: 'Start a ferment, if you make any.', record: 'fermentation', destination: foodLens('fermentationBuilder') },
    ],
    open: route('/food'),
  },
  {
    path: '/garden',
    title: 'Garden',
    question: 'What is Garden for?',
    answer:
      'What you grow, from the first seed to the kitchen: your areas and what is planted in them, tasks and counters, compost, the conditions each area grows in, what it cost, what came back as harvest, and reading on how to grow it.',
    groups: [
      { title: 'Planning', line: 'Your growing zone, your areas and what is in them, what needs doing, and counters to a date.', lenses: ['myZone', 'plotsAndPlantings', 'upcomingTasks', 'daysUntil'] },
      { title: 'Growing', line: 'Compost piles, and readings of soil, water, light and weather in each area.', lenses: ['compost', 'growingConditions'] },
      { title: 'What it gives and costs', line: 'Every harvest and where it went, and every cost including the electricity an indoor grow uses.', lenses: ['harvestLog', 'growingCosts'] },
      { title: 'Reading', line: 'How to grow, soil life, and the plants themselves.', lenses: ['horticulture'] },
    ],
    steps: [
      { doThis: 'Add the place you grow.', item: 'gardenArea' },
      { doThis: 'Record what is planted there.', item: 'planting' },
      { doThis: 'Log a harvest when one comes.', item: 'harvest' },
      { doThis: 'Record what the garden cost you.', record: 'gardenCost', destination: gardenLens('growingCosts'), beats: ['garden'] },
    ],
    open: route('/garden'),
  },
  {
    path: '/insights',
    title: 'Insights',
    question: 'What is Insights for?',
    answer:
      'What your records mean right now. What a food or nutrient means for each condition you follow, whether each nutrient came from food or from a supplement, how cooking changes a food, which foods suit the stage you are at, your labs, and how your medicines and foods interact. Today it reads your meals, medicines, supplements and labs.',
    groups: [
      {
        title: 'What you ate today',
        line: 'Nutrients against your targets, condition scores, drinks, advisories for the day, and energy and portions.',
        lenses: ['nutrients', 'sixDs', 'hydration', 'advisories', 'portions'],
      },
      {
        title: 'Any food',
        line: 'Look up a food, rank foods by a nutrient, see what cooking does to it, and keep a list of the foods that sit well with you.',
        lenses: ['foodLookup', 'nutrientRanking', 'cookingImpact', 'prep', 'safeFoods'],
      },
      { title: 'Your health', line: 'Foods for the stage you are at, lab results, and your medicines beside your foods.', lenses: ['healingStage', 'labs', 'myMeds'] },
    ],
    steps: [
      { doThis: 'Log a meal, so Nutrients has something to read.', item: 'meal' },
      { doThis: 'Look up a food you eat often.', destination: insightsLens('foodLookup') },
      { doThis: 'Enter a recent lab result.', record: 'labs', destination: insightsLens('labs'), beats: ['health'] },
      { doThis: 'Start your list of foods that sit well with you.', record: 'safeFoods', destination: insightsLens('safeFoods'), beats: ['health', 'food'] },
    ],
    open: route('/insights'),
  },
  {
    path: '/trends',
    title: 'Trends',
    question: 'What is Trends for?',
    answer:
      'Your weeks and months drawn out, for everything you record: what you eat and the nutrients in it, how you felt, weight, movement, labs, grocery prices, keeping up with routines and upkeep, garden yield and conditions, spending, and Pattern Finder, which looks for what tends to come before a flare. A week with nothing logged shows as a gap, never as a zero.',
    groups: [
      { title: 'Eating', line: 'Nutrients, condition scores, variety, the hours you eat in, and grocery prices.', lenses: ['nutrients', 'sixDs', 'variety', 'eatingWindow', 'groceries'] },
      { title: 'Your body', line: 'Symptoms and flares, weight, movement, labs, and how you responded to a therapy.', lenses: ['symptoms', 'weight', 'movement', 'labs', 'therapyResponse'] },
      { title: 'Daily living', line: 'Keeping up with routines, marks and upkeep, and what everything costs.', lenses: ['keepingUp', 'cost'] },
      { title: 'Garden', line: 'What the garden grew, and the conditions it grew in.', lenses: ['harvest', 'conditions'] },
      { title: 'Looking for patterns', line: 'Foods that tend to come before a flare, each set beside how often they turn up anyway.', lenses: ['patterns'] },
    ],
    steps: [
      { doThis: 'Log meals on a few days, and Nutrients and What You Eat fill in.', item: 'trends' },
      { doThis: 'Log movement on a few days.', item: 'movementTrend' },
      { doThis: 'Mark routines and upkeep as you do them.', item: 'keepingUp' },
      { doThis: 'Record spending over a couple of months.', item: 'whatItCosts' },
      { doThis: 'Log flares alongside your meals, so Pattern Finder has something to compare.', item: 'patterns' },
    ],
    open: route('/trends'),
  },
  {
    path: '/reports',
    title: 'Reports',
    question: 'What is Reports for?',
    answer:
      'One document to take to an appointment: your conditions, medicines, nutrients, symptoms, movement, sleep, weight, blood pressure, labs and notes over the last week, month or three months, with each figure saying where it came from. It is made on this device and shared as a PDF only when you choose.',
    groups: [{ title: 'Overview', line: 'Choose 7, 30 or 90 days, read it on screen, and save or share it as a PDF.', lenses: [] }],
    steps: [{ doThis: 'Make a report a few days before your next appointment.', item: 'report' }],
    open: route('/reports', { openReportDays: '30' }),
  },
];

export const TOUR_HEADING = 'What each tab is for';
export const TOUR_LEAD =
  'Nine tabs, each one a part of the app. Tap one to see everything it holds, then a few ways to get started with it.';
export const TOUR_START_LABEL = 'You chose to start here';
export const TOUR_GETTING_STARTED = 'Getting started';
export const TOUR_OPEN_LABEL = (title: string) => `Open ${title}`;

const LENS_PARAMS: Partial<Record<TourPath, string>> = {
  '/life': 'openLifeLens',
  '/schedule': 'openScheduleLens',
  '/log': 'openSignalsLens',
  '/food': 'openFoodLens',
  '/garden': 'openGardenLens',
  '/insights': 'openInsightsLens',
  '/trends': 'openTrendsLens',
};

// Where a lens named in the tour opens.
export function lensDestination(path: TourPath, key: string): StoryDestination {
  const param = LENS_PARAMS[path];
  return param ? route(path, { [param]: key }) : route(path);
}

export function lensName(path: TourPath, key: string): string {
  return TOUR_LENS_NAMES[path]?.[key] ?? key;
}

// THE FACTS THE QUESTIONS ARE ANSWERED BY.

export type InterviewAnswer = { on: string; answer: string | null };

export type InterviewFacts = {
  story: YourStoryView;
  // Every condition that can be chosen, in the order Profile lists them.
  conditionChoices: string[];
  conditions: string[];
  conditionNames: Record<string, string>;
  // The chosen conditions with a staging model, in the order chosen.
  stagedConditions: { code: string; label: string; stageLabels: Record<string, string> }[];
  stages: Record<string, string>;
  neuro: string[];
  neuroLabels: Record<string, string>;
  diets: string[];
  allergies: string[];
  answers: Record<string, InterviewAnswer>;
  records: GuideRecords;
};

export type InterviewQuestionView = {
  // The kind, or stage:<code> for a stage question.
  key: string;
  def: InterviewQuestionDef;
  question: string;
  // For a stage question.
  condition: { code: string; label: string } | null;
  answered: boolean;
  // What the answer is, in a few words; null until answered.
  summary: string | null;
};

export type TourStepView = {
  def: TourStepDef;
  done: boolean;
  destination: StoryDestination;
};

export type TourTabView = {
  def: TourTabDef;
  chosen: boolean;
  steps: TourStepView[];
};

export type InterviewView = {
  questions: InterviewQuestionView[];
  next: InterviewQuestionView | null;
  finished: boolean;
  // The tab chosen to start from, or null for all of them or no answer.
  startPath: TourPath | null;
  tour: TourTabView[];
  // What the questions were answered from, for the screen to show choices.
  facts: InterviewFacts;
};

export const START_ALL = 'all';

export function isTourPath(value: string | null | undefined): value is TourPath {
  return !!value && TOUR_TABS.some((tab) => tab.path === value);
}

function listSentence(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function questionApplies(def: InterviewQuestionDef, facts: InterviewFacts): boolean {
  if (def.beats.length === 0) return true;
  const beats = facts.story.beats;
  // Before the parts of life are chosen, every question stays in the list.
  if (beats.length === 0) return true;
  return def.beats.some((beat) => beats.includes(beat)) || facts.conditions.length > 0;
}

function itemSettled(facts: InterviewFacts, key: YourStoryItemKey): 'done' | 'setAside' | null {
  const state = facts.story.allItems[key]?.state;
  if (state === 'done') return 'done';
  if (state === 'setAside') return 'setAside';
  return null;
}

function tabTitle(path: string | null | undefined): string | null {
  return TOUR_TABS.find((tab) => tab.path === path)?.title ?? null;
}

function viewQuestion(def: InterviewQuestionDef, facts: InterviewFacts): InterviewQuestionView {
  const answer = facts.answers[def.kind] ?? null;
  const base = { key: def.kind as string, def, question: def.question, condition: null };
  switch (def.kind) {
    case 'conditions': {
      const names = facts.conditions.map((code) => facts.conditionNames[code] ?? code);
      if (names.length > 0) return { ...base, answered: true, summary: listSentence(names) };
      return { ...base, answered: !!answer, summary: answer ? `${NONE_OF_THESE_LABEL}.` : null };
    }
    case 'neuro': {
      const names = facts.neuro.map((key) => facts.neuroLabels[key] ?? key);
      if (names.length > 0) return { ...base, answered: true, summary: listSentence(names) };
      return { ...base, answered: !!answer, summary: answer ? `${NONE_OF_THESE_LABEL}.` : null };
    }
    case 'beats':
      return facts.story.beats.length > 0
        ? { ...base, answered: true, summary: beatListSentence(facts.story.beats) }
        : { ...base, answered: false, summary: null };
    case 'startTab': {
      if (!answer) return { ...base, answered: false, summary: null };
      const title = tabTitle(answer.answer);
      return { ...base, answered: true, summary: title ?? 'Every tab, in order.' };
    }
    case 'meds': {
      const settled = itemSettled(facts, 'meds');
      if (settled === 'done') return { ...base, answered: true, summary: 'On record in My Meds.' };
      if (settled === 'setAside') return { ...base, answered: true, summary: 'You take nothing for now.' };
      return { ...base, answered: false, summary: null };
    }
    case 'eatingStyle':
      if (facts.diets.length > 0) return { ...base, answered: true, summary: listSentence(facts.diets) };
      return { ...base, answered: !!answer, summary: answer ? `${NO_STYLE_LABEL}.` : null };
    case 'allergies':
      if (facts.allergies.length > 0) return { ...base, answered: true, summary: listSentence(facts.allergies) };
      return { ...base, answered: !!answer, summary: answer ? 'None.' : null };
    case 'aboutYou': {
      const settled = itemSettled(facts, 'aboutYou');
      if (settled === 'done') return { ...base, answered: true, summary: 'On record in Profile.' };
      if (settled === 'setAside') return { ...base, answered: true, summary: 'Left out for now.' };
      return { ...base, answered: false, summary: null };
    }
    case 'backup': {
      if (itemSettled(facts, 'backup') === 'done') return { ...base, answered: true, summary: 'Backed up.' };
      return { ...base, answered: !!answer, summary: answer ? 'Not yet.' : null };
    }
    case 'stage':
      // Stage questions are built one per condition in buildInterview.
      return { ...base, answered: true, summary: null };
  }
}

function stageQuestions(facts: InterviewFacts): InterviewQuestionView[] {
  const def = QUESTION_BY_KIND.stage;
  return facts.stagedConditions.map((condition) => {
    const key = `stage:${condition.code}`;
    const stage = facts.stages[condition.code];
    const answer = facts.answers[key];
    const summary = stage ? condition.stageLabels[stage] ?? stage : answer ? `${NOT_SURE_LABEL}.` : null;
    return {
      key,
      def,
      question: def.question.replace('{condition}', condition.label),
      condition: { code: condition.code, label: condition.label },
      answered: !!stage || !!answer,
      summary,
    };
  });
}

function stepApplies(step: TourStepDef, beats: readonly BeatKey[]): boolean {
  if (beats.length === 0) return true;
  if (step.beats) return step.beats.some((beat) => beats.includes(beat));
  if (step.item) return itemApplies(ITEM_BY_KEY[step.item], beats);
  return true;
}

// The tour in the order worth reading: the tab chosen to start from, then
// the rest in the order TOUR_TABS lists them.
export function buildTour(facts: InterviewFacts, startPath: TourPath | null): TourTabView[] {
  const beats = facts.story.beats;
  const views = TOUR_TABS.map((def) => ({
    def,
    chosen: def.path === startPath,
    steps: def.steps
      .filter((step) => stepApplies(step, beats))
      .map((step) => {
        const item = step.item ? facts.story.allItems[step.item] : null;
        const done = item ? item.state === 'done' : step.record ? !!facts.records[step.record] : false;
        const destination = step.destination ?? (step.item ? ITEM_BY_KEY[step.item].destination : def.open);
        return { def: step, done, destination };
      }),
  }));
  const chosen = views.filter((view) => view.chosen);
  return [...chosen, ...views.filter((view) => !view.chosen)];
}

export function buildInterview(facts: InterviewFacts): InterviewView {
  const questions: InterviewQuestionView[] = [];
  for (const def of INTERVIEW_QUESTIONS) {
    if (def.kind === 'stage') {
      questions.push(...stageQuestions(facts));
      continue;
    }
    if (!questionApplies(def, facts)) continue;
    questions.push(viewQuestion(def, facts));
  }
  const next = questions.find((question) => !question.answered) ?? null;
  const start = facts.answers.startTab?.answer ?? null;
  const startPath = isTourPath(start) ? start : null;
  return { questions, next, finished: next === null, startPath, tour: buildTour(facts, startPath), facts };
}

// The one line the folded Home card shows while questions are open.
export function interviewLine(view: InterviewView): string | null {
  return view.next ? `${NEXT_QUESTION_LABEL} ${view.next.question}` : null;
}
