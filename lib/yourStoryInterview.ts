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

// 1.0.52.6, direct instruction, 2026-09-25: "We need to describe Life. What
// does the Life tab actually do for you? How does it help you take control of
// your Life? What things can the user rely on it to be and do for them?
// That's where I'm going with this for each tab, and then for each function
// or lens in each tab." So a tab says what it does for you as a whole
// (`answer`), what you can count on it for (`relyOn`), and every lens says in
// one line what it does (TOUR_LENS_LINES). "When you get into one of the tab
// guides our job is to lead them to the fastest route for making use of it,
// explaining what should be done first", so `steps` are in the order that
// makes the tab useful soonest, and each says why it comes where it does.
export type TourLensGroup = {
  title: string;
  // Said under the title when the lenses alone do not say it; a group of
  // Home cards, which are not lenses, always has one.
  line?: string;
  // Lens keys on that tab, named through TOUR_LENS_NAMES and described
  // through TOUR_LENS_LINES.
  lenses: string[];
};

export type TourStepDef = {
  doThis: string;
  // Why this comes where it does in the order.
  why: string;
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
  // What the whole tab does for you.
  answer: string;
  // What you can count on it for, a line each.
  relyOn: string[];
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

// What each lens does for you, one line each, shown under its name.
export const TOUR_LENS_LINES: Record<string, Record<string, string>> = {
  '/life': {
    myMeds: 'Every prescription, over-the-counter medicine and supplement you take, written once. Schedules, Insights, the emergency card and Reports all read this list.',
    emergency: 'The card somebody helping you in a hurry would need: conditions, medicines, allergies and who to call.',
    conditions: 'Cited reading on each condition you live with, the ones in your family, and any you are curious about.',
    finances: 'Bills and income, spending, medical bills and insurance, accounts and goals, and what is coming up next.',
    work: 'How work is going week to week, so a hard stretch can be read beside everything else.',
    upkeep: 'Jobs around the house and car that come round every so often, each with when it was last done and when it is due.',
    kitchen: 'What is in your kitchen and where it is kept, so the grocery list and Where Is It can answer for you.',
    groceryList: 'One shopping list, filled from your meal plan and anything you add, and shared with a partner if you choose.',
    routines: 'A routine walked through a part at a time, so nothing in the middle gets missed.',
    didIDoIt: 'One tap to mark that you did a thing, so later you know rather than wonder.',
    daysUntil: 'A counter to any date: a renewal, a trip, a refill, a birthday.',
    movement: 'The kinds of movement you do and the plans you keep, and steps and sleep from your phone if you connect it.',
    healthLiteracy: 'Plain explanations of nutrients, additives, the food industry and how the body uses food, every claim cited, with a glossary.',
    earthMatters: 'Reading on soil, water, farming and the food system beyond your plate.',
    searchReading: 'One search over every piece of reading in the app.',
  },
  '/schedule': {
    meals: 'Log a meal you ate, or put one on a day ahead.',
    todaysMeals: 'Today in clock order, meals and doses together, each dose saying which meal it is kept apart from and by how long.',
    pastMeals: 'Every meal you have logged, to look back over or eat again.',
    dailyMealPlan: 'A meal plan up to six weeks ahead, from recipes that suit your conditions and eating style.',
    meds: 'Each medicine and supplement at its time, with a reminder and what it is kept apart from.',
    hydration: 'Drinks through the day, with reminders if you want them.',
    appointments: 'Appointments, alongside the calendar on your phone.',
    upkeep: 'When each job from Life > Upkeep is next due.',
    exercise: 'When you plan to move, from the plans kept in Life > Movement.',
  },
  '/log': {
    flares: 'When a flare started, how bad it was, and which symptoms came with it.',
    foodReactions: 'A food or drink that did not sit well, starting from the food rather than the symptom.',
    newFoods: 'A food tried for the first time, and how it went, including a food left out and brought back to see how it sits.',
    exercise: 'Movement you did, for how long and how hard.',
    bloodPressure: 'Blood pressure and pulse readings, with the time of day.',
    nocturia: 'Nights you woke to pass water, and how many times.',
    therapies: 'Massage, physiotherapy, acupuncture and other hands-on sessions, and how you felt after.',
    generalNote: 'Anything else about your day worth writing down.',
  },
  '/food': {
    findMeal: 'Find a dish you have built and log it, or put it on a day ahead.',
    scanProduct: 'Scan a barcode to see what is in a packaged product and what it means for you.',
    mealBuilder: 'A whole meal, built from its ingredients.',
    sideBuilder: 'A side dish to go with a meal.',
    saladBuilder: 'A salad or a grain bowl.',
    smoothieBuilder: 'A smoothie, with what each ingredient adds.',
    soupBuilder: 'A soup, a stew or a broth.',
    snackBuilder: 'Something to eat between meals.',
    beverageBuilder: 'Tea, coffee, juice and other drinks.',
    bakedGoodsBuilder: 'Bread, muffins and other baking.',
    saucesBuilder: 'Sauces, dressings and dips.',
    handheldsBuilder: 'Sandwiches, wraps and tacos.',
    dessertBuilder: 'Something sweet to finish.',
    fermentationBuilder: 'Yogurt, sauerkraut, kombucha and the rest, each batch followed from the first day to the jar and drawn down as you use it.',
    systemRecipes: 'Hundreds of home-cooked recipes, sorted to your conditions and eating style.',
  },
  '/garden': {
    myZone: 'Your growing zone, looked up from where you live, with crop guidance for that climate.',
    plotsAndPlantings: 'Each place you grow and what is in it, from a raised bed to an indoor tent, with the equipment each one runs on.',
    upcomingTasks: 'What needs doing in the garden next.',
    daysUntil: 'Counters to a garden date, like germination, transplanting or the first harvest.',
    compost: 'Compost piles, what went in, and where the finished compost went.',
    growingConditions: 'Readings of soil, water, light and weather in each area.',
    harvestLog: 'Every harvest, how much, and where it went.',
    growingCosts: 'Every cost of growing, including the electricity an indoor grow uses.',
    horticulture: 'Reading on how to grow, soil life and the plants themselves.',
  },
  '/insights': {
    nutrients: 'Each nutrient against your target for the day, and the foods and supplements it came from.',
    sixDs: 'What the food you ate means for each condition you follow, factor by factor, with the citations.',
    hydration: 'What you drank today against your target.',
    advisories: 'Anything in today\'s meals and doses worth a look, from timing to amounts.',
    portions: 'Energy for the day, and how your portions add up.',
    foodLookup: 'Any food, and what it means for each condition you follow.',
    nutrientRanking: 'Foods ranked by one nutrient, to find the richest sources.',
    cookingImpact: 'What boiling, steaming or roasting does to the nutrients in a food.',
    prep: 'Ways of preparing a food that can make it sit better, like soaking or sprouting.',
    safeFoods: 'Your list of foods that sit well with you, and the ones that do not.',
    healingStage: 'Foods sorted for the stage you said you are at, for each condition that has stages.',
    labs: 'Your lab results with their dates, to read beside everything else.',
    myMeds: 'Your medicines and supplements beside your foods, with the timing that keeps them apart and rules of your making.',
  },
  '/trends': {
    nutrients: 'Each nutrient week by week, with food and supplements shown apart.',
    sixDs: 'What your meals meant for each condition, over time.',
    variety: 'How many different foods you eat, week by week.',
    eatingWindow: 'The hours of the day you eat in.',
    groceries: 'What the foods you buy have cost over time.',
    symptoms: 'Flares and symptoms over time, and how bad they were.',
    weight: 'Weight over time, beside the range your readings usually fall in.',
    movement: 'Movement, steps and sleep, week by week.',
    labs: 'Each lab result over time.',
    therapyResponse: 'How you felt before, during and after a therapy you tried.',
    keepingUp: 'Routines, marks and upkeep over time, with nothing scored.',
    cost: 'What life costs by the month, from what you recorded.',
    harvest: 'What the garden grew, by crop and by season.',
    conditions: 'Garden readings over time, area by area.',
    patterns: 'Foods that tend to come before a flare, each set beside how often they turn up anyway.',
  },
};

export const TOUR_TABS: TourTabDef[] = [
  {
    path: '/',
    title: 'Home',
    question: 'What is Home for?',
    answer:
      'Home is today, gathered from every other tab. It shows what is coming up, what you noted down and how you said you feel, with a way into anything else in one tap, so you can open the app, see the day, and put it down again. You choose which cards it shows and in what order.',
    relyOn: [
      'To show today without you going to look for it: meals, doses, appointments and whatever is due.',
      'To take a thought the moment you have it, with Capture, and keep it until you deal with it.',
      'To answer where you put something, with Where Is It.',
      'To bring Your Story back whenever you want to find your way again.',
    ],
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
      {
        doThis: 'Say how you feel today on the check-in card.',
        why: 'It is one tap, and every day of it gives Trends and Pattern Finder something to set the rest beside.',
        item: 'checkin',
      },
      {
        doThis: 'Put the next thought that comes to you into Capture.',
        why: 'Once you trust it to hold things, there is less to carry in your head.',
        item: 'capture',
      },
      {
        doThis: 'Choose which cards Home shows, in Profile under Home.',
        why: 'Home works best showing only what you use, so hide the rest.',
        destination: profile,
      },
    ],
    open: route('/'),
  },
  {
    path: '/life',
    title: 'Life',
    question: 'What is Life for?',
    answer:
      'Life holds the running of your life, so it can stop running around in your head. What you take and what a helper in an emergency needs to know; bills, spending and insurance; work; the house, the kitchen and the grocery list; the people you look after; routines, the things you mean to do and the dates you are counting to; how you move; and reading on your conditions and your health. Each thing is written down once, here, and the rest of the app reads it from here: Schedules gives it a time, Home brings it to you on the day, and Trends and Reports show how it has gone.',
    relyOn: [
      'To remember for you: what you take, what is due, where things are kept, and what you already did today.',
      'To have the answer ready when it is needed in a hurry, from the emergency card to the bill due this week.',
      'To keep what you know about your conditions in one place you can read, rather than scattered across the web.',
      'To carry one entry everywhere it is needed, so nothing is typed twice.',
    ],
    groups: [
      { title: 'Your health, written down once', lenses: ['myMeds', 'emergency', 'conditions'] },
      { title: 'Money and work', lenses: ['finances', 'work'] },
      { title: 'The house and the kitchen', lenses: ['upkeep', 'kitchen', 'groceryList'] },
      { title: 'Keeping track of your days', lenses: ['routines', 'didIDoIt', 'daysUntil'] },
      { title: 'Your body', lenses: ['movement'] },
      { title: 'Reading', lenses: ['healthLiteracy', 'earthMatters', 'searchReading'] },
    ],
    steps: [
      {
        doThis: 'List what you take in My Meds.',
        why: 'More of the app reads this list than any other: dose times in Schedules, interactions in Insights, the emergency card and every report.',
        item: 'meds',
      },
      {
        doThis: 'Fill in the emergency card.',
        why: 'Your medicines are already on it from the list above, so it takes a minute, and it is the one thing to have ready before it is needed.',
        item: 'emergency',
      },
      {
        doThis: 'Add the bills that come every month.',
        why: 'From then on Finances tells you what is due next, and you no longer have to keep track of it.',
        item: 'bills',
      },
      {
        doThis: 'Add one job around the house that comes round now and then.',
        why: 'Upkeep then says when it is due, and Schedules and Home bring it to you on the day.',
        item: 'upkeep',
      },
      {
        doThis: 'Write down one routine you go through most days.',
        why: 'Walked through a part at a time, it takes the remembering out of it, and Did I Do It answers whether you did.',
        item: 'routine',
      },
    ],
    open: route('/life'),
  },
  {
    path: '/schedule',
    title: 'Schedules',
    question: 'What is Schedules for?',
    answer:
      'Schedules is your day on a clock. Meals, doses, drinks, appointments, house jobs and exercise each get a time, and a reminder comes when it is time, so the times do not have to live in your head. It also knows what goes with what: a dose that is kept apart from a meal says which meal and by how long. A thing is set up where it belongs, on Life or Food, and gets its time here.',
    relyOn: [
      'To remind you at the time you chose, for each dose, meal, drink and appointment.',
      'To lay today out in order, meals and doses together, so the whole day is in one glance.',
      'To plan meals up to six weeks ahead, and turn the plan into a grocery list.',
      'To keep the record of what you ate, for Insights, Trends and Reports to read.',
    ],
    groups: [
      { title: 'Eating', lenses: ['meals', 'todaysMeals', 'pastMeals', 'dailyMealPlan'] },
      { title: 'Taking care', lenses: ['meds', 'hydration', 'appointments'] },
      { title: 'Around the house and body', lenses: ['upkeep', 'exercise'] },
    ],
    steps: [
      {
        doThis: 'Give each medicine a time.',
        why: 'This is what turns the list in My Meds into reminders, and lets Today set each dose beside your meals.',
        record: 'doseTimes',
        destination: scheduleLens('meds'),
        beats: ['health'],
      },
      {
        doThis: 'Log what you ate today.',
        why: 'One logged meal is enough for Insights to show the nutrients and condition scores for the day.',
        item: 'meal',
      },
      {
        doThis: 'Log a glass of water.',
        why: 'Hydration then counts the day, and reminders can follow if you want them.',
        item: 'water',
      },
      {
        doThis: 'Add your next appointment.',
        why: 'It comes to Home on the day, and there is time to make a report for it.',
        record: 'appointment',
        destination: scheduleLens('appointments'),
        beats: ['health'],
      },
      {
        doThis: 'Try a meal plan for the week ahead.',
        why: 'It fills the week and the grocery list in one go, so what to eat is already decided.',
        record: 'mealPlan',
        destination: scheduleLens('dailyMealPlan'),
        beats: ['food'],
      },
    ],
    open: route('/schedule'),
  },
  {
    path: '/log',
    title: 'Signals',
    question: 'What is Signals for?',
    answer:
      'Signals is where your body gets its say. A flare, how a meal sat with you, a new food tried, blood pressure, a night broken by trips to the bathroom, a massage or a physio session: each goes down when it happens, in a few taps. By themselves these are notes. Set beside your meals, medicines and days in Insights, Trends and Reports, they are how you start to see what tends to go with what for your body.',
    relyOn: [
      'To take a note in the moment, before the detail is forgotten.',
      'To hold the dates and how bad it was, so you are not trying to remember at the next appointment.',
      'To give Pattern Finder what it needs to look for foods that tend to come before a flare.',
    ],
    groups: [
      { title: 'How you feel', lenses: ['flares', 'foodReactions', 'newFoods'] },
      { title: 'Your body', lenses: ['exercise', 'bloodPressure', 'nocturia'] },
      { title: 'What you tried', lenses: ['therapies', 'generalNote'] },
    ],
    steps: [
      {
        doThis: 'Say how you feel today.',
        why: 'It takes one tap, so it is the easiest record to keep daily, and every day of it gives the rest something to compare against.',
        item: 'checkin',
      },
      {
        doThis: 'Log a flare when one comes, with how bad it was.',
        why: 'The date and how bad it was are what Pattern Finder and your reports need most.',
        record: 'flare',
        destination: signalsLens('flares'),
        beats: ['health'],
      },
      {
        doThis: 'Note how a meal sat with you.',
        why: 'Starting from the food, it builds up the list of what suits you.',
        record: 'foodReaction',
        destination: signalsLens('foodReactions'),
        beats: ['health', 'food'],
      },
      {
        doThis: 'Log some movement.',
        why: 'Trends can then show movement beside how you feel.',
        item: 'exercise',
      },
    ],
    open: route('/log'),
  },
  {
    path: '/food',
    title: 'Food',
    question: 'What is Food for?',
    answer:
      'Food is where you learn what food means for your body, and make eating well simple to keep up. Scan a packaged product and see what it means for each condition you follow. Build the dishes you eat often once, with the builder showing what the ingredients mean for you before you save, so logging one later takes a single tap. Cook from recipes already checked against your conditions and eating style, and follow a ferment from the first day to the jar.',
    relyOn: [
      'To tell you what a food means for your conditions before you eat it, not after.',
      'To remember your usual dishes, so logging one is a tap rather than a form.',
      'To offer recipes that already suit your conditions and eating style.',
    ],
    groups: [
      { title: 'Log and check', lenses: ['findMeal', 'scanProduct'] },
      {
        title: 'Build once, log in a tap',
        line: 'Each builder shows what the ingredients mean for you before you save.',
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
      { title: 'Ferment', lenses: ['fermentationBuilder'] },
      { title: 'Recipes', lenses: ['systemRecipes'] },
    ],
    steps: [
      {
        doThis: 'Build the meal you eat most often.',
        why: 'It is the one you will log most, so building it once saves the most taps, and the builder shows what it means for you on the way.',
        record: 'savedRecipe',
        destination: foodLens('mealBuilder'),
      },
      {
        doThis: 'Look through System Recipes for something to cook this week.',
        why: 'Everything there already suits your conditions and eating style, so it is the quickest way to something new.',
        destination: foodLens('systemRecipes'),
      },
      {
        doThis: 'Scan something packaged from your cupboard.',
        why: 'You find out what the things you already buy mean for you.',
        record: 'scannedProduct',
        destination: foodLens('scanProduct'),
      },
      {
        doThis: 'Start a ferment, if you make any.',
        why: 'Each batch is followed from the first day, and drawn down as you eat it.',
        record: 'fermentation',
        destination: foodLens('fermentationBuilder'),
      },
    ],
    open: route('/food'),
  },
  {
    path: '/garden',
    title: 'Garden',
    question: 'What is Garden for?',
    answer:
      'Garden follows what you grow from the first seed to the kitchen. Each area knows what is planted in it, what needs doing and when, the conditions it grows in, what it cost and what came back as harvest. A harvest comes off what you have on hand when a meal uses it, so the garden and the kitchen keep one count, and Trends shows what it all adds up to over a season.',
    relyOn: [
      'To remember what is planted where, and since when.',
      'To say what needs doing next, and count down to a date like transplanting or the first harvest.',
      'To keep a straight account of what the garden costs and what it gives back.',
    ],
    groups: [
      { title: 'Planning', lenses: ['myZone', 'plotsAndPlantings', 'upcomingTasks', 'daysUntil'] },
      { title: 'Growing', lenses: ['compost', 'growingConditions'] },
      { title: 'What it gives and costs', lenses: ['harvestLog', 'growingCosts'] },
      { title: 'Reading', lenses: ['horticulture'] },
    ],
    steps: [
      {
        doThis: 'Add the place you grow.',
        why: 'Everything else in Garden is kept under an area.',
        item: 'gardenArea',
      },
      {
        doThis: 'Record what is planted there.',
        why: 'Tasks, counters and harvests all start from a planting.',
        item: 'planting',
      },
      {
        doThis: 'Record what the garden has cost you so far.',
        why: 'Starting early means the season adds up to the whole amount.',
        record: 'gardenCost',
        destination: gardenLens('growingCosts'),
        beats: ['garden'],
      },
      {
        doThis: 'Log a harvest when one comes.',
        why: 'Trends can then show what the garden gave, and what it saved you at the shop.',
        item: 'harvest',
      },
    ],
    open: route('/garden'),
  },
  {
    path: '/insights',
    title: 'Insights',
    question: 'What is Insights for?',
    answer:
      'Insights tells you what your records mean today. It reads the meals you logged, the medicines and supplements you take and your labs, and answers: which nutrients you reached and whether food or a supplement got you there, what the day\'s food means for each condition you follow, which foods suit the stage you are at, and how your medicines and foods get along. It also looks up any food, so you can check before you eat rather than after.',
    relyOn: [
      'To do the arithmetic for every nutrient, condition and meal, so you never add anything up.',
      'To say whether a target was reached by food or by a supplement.',
      'To point out a medicine and a food that are best kept apart, with the reason and the source.',
    ],
    groups: [
      { title: 'What you ate today', lenses: ['nutrients', 'sixDs', 'hydration', 'advisories', 'portions'] },
      { title: 'Any food', lenses: ['foodLookup', 'nutrientRanking', 'cookingImpact', 'prep', 'safeFoods'] },
      { title: 'Your health', lenses: ['healingStage', 'labs', 'myMeds'] },
    ],
    steps: [
      {
        doThis: 'Look up a food you eat often.',
        why: 'Food Lookup works with nothing entered at all, so it is useful from the first minute.',
        destination: insightsLens('foodLookup'),
      },
      {
        doThis: 'Log a meal.',
        why: 'Nutrients, Condition Scores and the day\'s advisories all read your meals, so one meal is what fills them in.',
        item: 'meal',
      },
      {
        doThis: 'Start your list of foods that sit well with you.',
        why: 'It grows as you go, and becomes the short list to cook from on a bad day.',
        record: 'safeFoods',
        destination: insightsLens('safeFoods'),
        beats: ['health', 'food'],
      },
      {
        doThis: 'Enter a recent lab result.',
        why: 'Labs, Trends and Reports can then show it beside everything else.',
        record: 'labs',
        destination: insightsLens('labs'),
        beats: ['health'],
      },
    ],
    open: route('/insights'),
  },
  {
    path: '/trends',
    title: 'Trends',
    question: 'What is Trends for?',
    answer:
      'Trends shows how things have gone over weeks and months, for everything you record: what you eat and the nutrients in it, how you felt, weight, movement, labs, keeping up with routines and upkeep, what things cost, and what the garden grew. A slow change you would never notice day to day shows up here, and Pattern Finder looks for foods that tend to come before a flare. Nothing is entered on Trends; it reads the other tabs, and a week with nothing logged shows as a gap, never as a zero.',
    relyOn: [
      'To notice slow changes across weeks you would not remember.',
      'To count fairly: a week you did not log is a gap, not a bad week.',
      'To say what it is comparing against, and never to say one thing made another happen.',
    ],
    groups: [
      { title: 'Eating', lenses: ['nutrients', 'sixDs', 'variety', 'eatingWindow', 'groceries'] },
      { title: 'Your body', lenses: ['symptoms', 'weight', 'movement', 'labs', 'therapyResponse'] },
      { title: 'Daily living', lenses: ['keepingUp', 'cost'] },
      { title: 'Garden', lenses: ['harvest', 'conditions'] },
      { title: 'Looking for patterns', lenses: ['patterns'] },
    ],
    steps: [
      {
        doThis: 'Log meals on a few days.',
        why: 'Meals fill more of Trends than anything else: Nutrients, Condition Scores, What You Eat and Eating Window.',
        item: 'trends',
      },
      {
        doThis: 'Log flares alongside your meals.',
        why: 'Pattern Finder needs both before it has anything to compare.',
        item: 'patterns',
      },
      {
        doThis: 'Log movement on a few days.',
        why: 'Movement then draws week by week, beside how you felt.',
        item: 'movementTrend',
      },
      {
        doThis: 'Mark routines and upkeep as you do them.',
        why: 'Keeping Up then shows how the weeks have gone, with nothing scored.',
        item: 'keepingUp',
      },
      {
        doThis: 'Record spending over a couple of months.',
        why: 'What It Costs needs more than one month before there is anything to set side by side.',
        item: 'whatItCosts',
      },
    ],
    open: route('/trends'),
  },
  {
    path: '/reports',
    title: 'Reports',
    question: 'What is Reports for?',
    answer:
      'Reports turns your records into one document to take to an appointment, so you walk in with the facts rather than trying to remember them. It covers your conditions, medicines, nutrients, symptoms, movement, sleep, weight, blood pressure, labs and notes over the last week, month or three months, each figure saying where it came from. It is made on this device and shared as a PDF only when you choose.',
    relyOn: [
      'To remember the weeks between appointments for you.',
      'To say where every figure came from, so nothing in it is a guess.',
      'To stay on this device until you decide to share it.',
    ],
    groups: [{ title: 'Overview', line: 'Choose 7, 30 or 90 days, read it on screen, and save or share it as a PDF.', lenses: [] }],
    steps: [
      {
        doThis: 'Make a report a few days before your next appointment.',
        why: 'A few days early leaves time to read it through and add anything missing.',
        item: 'report',
      },
    ],
    open: route('/reports', { openReportDays: '30' }),
  },
];

export const TOUR_HEADING = 'What each tab is for';
export const TOUR_LEAD =
  'Nine tabs, each looking after a part of your life. Tap one to see what it does for you, what each part of it is for, and the fastest way to make it useful.';
export const TOUR_START_LABEL = 'You chose to start here';
export const TOUR_RELY_HEADING = 'What you can count on it for';
export const TOUR_GETTING_STARTED = 'The fastest way in';
export const TOUR_GETTING_STARTED_LEAD = 'In this order, since each one makes the next more useful. Anything already done is ticked.';
export const TOUR_FIRST_LABEL = 'Start with this';
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

// One line saying what a lens does for you.
export function lensLine(path: TourPath, key: string): string | null {
  return TOUR_LENS_LINES[path]?.[key] ?? null;
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
