// Your Story guides, 2026-09-24. Direct report, after the first version of
// Your Story listed a few one-line items per section: "It doesn't really
// provide anything like If your interested in, then the way this app works
// for you is... and it then goes on to give you different step by step
// instructions for working with the app, and what each thing will do for
// them." Asked how, the answers were: ordered with no numbers, everything
// for that part of life start to finish, and the full guides on the Your
// Story page with the Home card pointing into the one you are in.
//
// So there is one guide per part of life, plus The Basics that every part
// shares. Each guide opens with how the app works for somebody who cares
// about that part of life, then walks through every piece of the app that
// serves it, in the order they build on one another. Each entry says what to
// do and where, what it does for you, and often what it feeds next.
//
// An entry is ticked the same way a Your Story item is: when its record
// exists. It either IS a Your Story item (item), and is evaluated exactly as
// the item is, so the two can never disagree; or it names a record the
// database layer looks for (record); or it is reading or looking, which has
// no record and never carries a tick.
//
// The writing rules of lib/yourStory.ts hold here too, and
// scripts/test_your_story.js sweeps every sentence below. "Healing Stage"
// appears only as the name of the Insights lens, which is what the screen
// calls it.
//
// Every destination is a tab and lens key that exists; the test checks each
// one against the lens lists in the tab screens.

import { ALL_BEATS, BEAT_LABELS, ITEM_BY_KEY, evaluateItem, itemApplies, storyDate } from './yourStory';
import type { BeatKey, ItemState, StoryDestination, YourStoryFacts, YourStoryItemKey, YourStoryView } from './yourStory';

export type GuideKey = 'basics' | BeatKey;

export type GuideRecordKey =
  | 'connection'
  | 'conditionStage'
  | 'doseTimes'
  | 'personalRule'
  | 'appointment'
  | 'flare'
  | 'foodReaction'
  | 'labs'
  | 'bloodPressure'
  | 'weight'
  | 'therapy'
  | 'assessment'
  | 'experiment'
  | 'nutrientTargets'
  | 'safeFoods'
  | 'savedRecipe'
  | 'scannedProduct'
  | 'mealPlan'
  | 'groceryList'
  | 'fermentation'
  | 'healthConnect'
  | 'routineRun'
  | 'upkeepDone'
  | 'doneMark'
  | 'gardenSetup'
  | 'gardenTask'
  | 'gardenCountdown'
  | 'gardenReading'
  | 'compost'
  | 'gardenCost'
  | 'electricity'
  | 'harvestUse'
  | 'harvestGift'
  | 'accounts'
  | 'goals'
  | 'medicalBill'
  | 'insurancePlan'
  | 'familyInMealPlan';

export type GuideEntry = {
  key: string;
  // What to do, and where.
  doThis: string;
  // What it does for you.
  forYou: string;
  // What it feeds next, when something later in the guide draws on it.
  leadsTo?: string;
  destination: StoryDestination;
  item?: YourStoryItemKey;
  record?: GuideRecordKey;
};

export type GuideDef = {
  key: GuideKey;
  name: string;
  title: string;
  opening: string;
  entries: GuideEntry[];
};

const route = (pathname: string, params?: Record<string, string>): StoryDestination => ({ kind: 'route', pathname, params });
const lifeLens = (lens: string) => route('/life', { openLifeLens: lens });
const scheduleLens = (lens: string) => route('/schedule', { openScheduleLens: lens });
const trendsLens = (lens: string) => route('/trends', { openTrendsLens: lens });
const gardenLens = (lens: string) => route('/garden', { openGardenLens: lens });
const insightsLens = (lens: string) => route('/insights', { openInsightsLens: lens });
const foodLens = (lens: string) => route('/food', { openFoodLens: lens });
const signalsLens = (lens: string) => route('/log', { openSignalsLens: lens });
const profile = route('/profile');

// An entry that IS a Your Story item takes its destination from the item,
// so the two always go to the same place.
function fromItem(key: YourStoryItemKey, doThis: string, forYou: string, leadsTo?: string): GuideEntry {
  return { key: `item:${key}`, item: key, doThis, forYou, leadsTo, destination: ITEM_BY_KEY[key].destination };
}

export const GUIDES: GuideDef[] = [
  {
    key: 'basics',
    name: 'The Basics',
    title: 'The Basics',
    opening:
      'However you use Inside Story, a few pieces sit under every part of it. Everything you record stays on your device unless you choose to send it somewhere, so keeping a copy safe comes first. After that it is a matter of getting things out of your head and into a place you can find them again.',
    entries: [
      fromItem(
        'beats',
        'Choose the parts of your life you want Inside Story to follow.',
        'Your Story shows a guide like this one for each part you choose, and the Home card follows along. Nothing anywhere in the app is hidden by what you leave out.',
      ),
      fromItem(
        'backup',
        'Save a backup, or turn on automatic saving to a shared folder, in Profile under Backup & Restore.',
        'Your records live on this device and nowhere else. A backup is the way back if the phone is lost or reset, and it is encrypted with a password only you know, so there is no way to recover a forgotten one.',
        'Automatic saving is also what keeps a second device up to date.',
      ),
      fromItem(
        'secondDevice',
        'Open Inside Story on a computer or a second phone and turn on automatic saving there, with the same password and the same folder.',
        'The two devices merge what each one recorded, record by record, so work done on either is kept. The computer version gives you a bigger screen for longer jobs like planning meals or reading.',
      ),
      fromItem(
        'capture',
        'Write down anything on your mind in Capture, from Home.',
        'A thought written down no longer needs holding onto. Sort it later into a reminder, a place something is kept, or nothing at all.',
      ),
      {
        key: 'whereIsIt',
        doThis: 'Look something up in Where Did I Put It, from Home.',
        forYou: 'One search across the kitchen, your notes about where things are, and what is growing in the garden. Every answer says how old it is, so an answer from months ago says so.',
        destination: route('/where-is-it'),
      },
      {
        key: 'searchReading',
        doThis: 'Search everything there is to read, in Life under Search Reading.',
        forYou: 'Every article in the app in one search: conditions, nutrition, food history, the environment and gardening. A result opens where it lives.',
        destination: lifeLens('searchReading'),
      },
      {
        key: 'healthLiteracy',
        doThis: 'Browse Health Literacy, in Life.',
        forYou: 'Plain explanations of nutrients, additives, how the body uses food, and a glossary for the words that come up everywhere else.',
        destination: lifeLens('healthLiteracy'),
      },
      {
        key: 'earthMatters',
        doThis: 'Browse Earth Matters, in Life.',
        forYou: 'Where food comes from, what farming and packaging do to it, and how to weigh claims on a label.',
        destination: lifeLens('earthMatters'),
      },
      {
        key: 'connection',
        record: 'connection',
        doThis: 'If you share a household, pair with that person in Profile under Connections.',
        forYou: 'Pairing makes a private, encrypted link between your two apps. Today the grocery list is what the two of you share, and a recipe can be sent from one to the other. Health records stay with each person.',
        destination: route('/connections'),
      },
    ],
  },
  {
    key: 'health',
    name: 'Health',
    title: 'If your health matters to you',
    opening:
      'Here is how Inside Story works for your health. It starts with who you are, what you have and what you take. Then, day by day, you note how you feel and anything that flares. Over weeks the app lines that up against what you ate, slept and did, and shows what tends to come before a better or a worse day. It shows patterns worth watching and never decides what caused something, and anything medical stays between you and your doctor.',
    entries: [
      fromItem(
        'aboutYou',
        'Add your birth date and sex in Profile.',
        'Recommended amounts of most nutrients differ by age and sex, so every nutrient figure in the app is measured against the right one.',
      ),
      fromItem(
        'conditions',
        'Choose any of the 19 conditions this app follows, in Profile.',
        'Every food lookup, recipe and meal plan then says what matters for your conditions, and the reading for them comes first.',
        'Your conditions decide what the stage question below asks and what the reading shows.',
      ),
      {
        key: 'conditionsReading',
        doThis: 'Read about your conditions in Life, under Conditions.',
        forYou: 'Each condition you chose opens with what research says about it, grouped by topic, with how strong the evidence is. Conditions in your family sit in a separate list beside yours.',
        destination: lifeLens('conditions'),
      },
      {
        key: 'conditionStage',
        record: 'conditionStage',
        doThis: 'If one of your conditions has stages, say which one you are at, in Profile.',
        forYou: 'Six of the conditions have stages. Foods suited to your stage come first in lookups and in the builders, and anything to be careful with is marked. Nothing is ever hidden or blocked.',
        leadsTo: 'Insights, under Healing Stage, lists the foods for that stage.',
        destination: profile,
      },
      {
        key: 'stageFoods',
        doThis: 'See the foods for your stage in Insights, under Healing Stage.',
        forYou: 'A list to shop and cook from, in the order that suits the stage you chose.',
        destination: insightsLens('healingStage'),
      },
      fromItem(
        'meds',
        'Add the medicines and supplements you take, in Life under My Meds.',
        'This list is where timing advice, the dose schedule, the emergency card and your doctor report all start. A supplement added here also counts toward your nutrients.',
      ),
      {
        key: 'doseTimes',
        record: 'doseTimes',
        doThis: 'Give each medicine and supplement its times, in Schedules under Meds.',
        forYou: 'One timeline of the day with every dose on it and reminders at the times you set. Each dose says what to take it with or keep it apart from.',
        leadsTo: 'Schedules, under Today\'s Meals, then shows your doses and meals together on one clock, with how far apart they are.',
        destination: scheduleLens('meds'),
      },
      {
        key: 'interactions',
        doThis: 'Look at how what you take fits together, in Insights under My Meds & Interactions.',
        forYou: 'Timing cautions between your medicines, supplements and foods, each with where it comes from. Timing is all it covers: what you take and how much is for your prescriber.',
        destination: insightsLens('myMeds'),
      },
      {
        key: 'personalRule',
        record: 'personalRule',
        doThis: 'Add a rule you made, such as something your doctor told you, in the same place.',
        forYou: 'It shows up whenever it applies, labelled as yours rather than the app\'s, and appears in your report.',
        destination: insightsLens('myMeds'),
      },
      fromItem(
        'emergency',
        'Fill in the emergency card, in Life under Emergency.',
        'Allergies to medicines, contacts, your doctor and anything else somebody helping you would need, in one place, ready in a hurry.',
      ),
      {
        key: 'appointment',
        record: 'appointment',
        doThis: 'Add your next appointment, in Schedules under Appointments.',
        forYou: 'A reminder before it, and it can go onto your phone\'s calendar too.',
        leadsTo: 'Before you go, Reports can make a document of what you have logged since the last one.',
        destination: scheduleLens('appointments'),
      },
      fromItem(
        'meal',
        'Log what you eat, in Schedules under Meals.',
        'Every meal is added up into the nutrients for the day and kept, so the times you felt worse can be lined up against what came before them.',
        'Meals logged before a flare are what Pattern Finder reads.',
      ),
      fromItem(
        'water',
        'Log what you drink, in Schedules under Hydration.',
        'Some timing advice for medicines depends on water, and how much you drink sits beside how you felt.',
      ),
      fromItem(
        'checkin',
        'Note how you feel today, on the check-in card on Home.',
        'A few taps a day. How you felt is the other half of every pattern: without it, meals and sleep have nothing to be compared with.',
      ),
      {
        key: 'flare',
        record: 'flare',
        doThis: 'Log a flare when one comes, in Signals under Flares.',
        forYou: 'When it started and how bad it was, which is what Pattern Finder reads beside your meals.',
        destination: signalsLens('flares'),
      },
      {
        key: 'foodReaction',
        record: 'foodReaction',
        doThis: 'Log a reaction to something you ate, in Signals under Food Reactions.',
        forYou: 'Tied to the meal it followed, so the food is on record next to what happened.',
        destination: signalsLens('foodReactions'),
      },
      {
        key: 'labs',
        record: 'labs',
        doThis: 'Enter lab results when you get them, in Insights under Labs.',
        forYou: 'Each result is kept with the range your lab printed, and Trends draws each test over time.',
        destination: insightsLens('labs'),
      },
      {
        key: 'bloodPressure',
        record: 'bloodPressure',
        doThis: 'Log blood pressure readings, if you take them, in Signals under Blood Pressure.',
        forYou: 'Readings kept by time of day, shown on Trends beside everything else.',
        destination: signalsLens('bloodPressure'),
      },
      {
        key: 'weight',
        record: 'weight',
        doThis: 'Log your weight in Profile, if you track it.',
        forYou: 'Trends, under Weight, draws it across the weeks with your usual range beside it, which says what your readings have been and never what they ought to be.',
        destination: profile,
      },
      {
        key: 'therapy',
        record: 'therapy',
        doThis: 'Log a hands-on therapy session, such as massage or physiotherapy, in Signals under Hands-On Therapies.',
        forYou: 'Trends, under Therapy Response, lines up how you felt in the days around each session.',
        destination: signalsLens('therapies'),
      },
      {
        key: 'assessment',
        record: 'assessment',
        doThis: 'Take the symptom assessment now and then.',
        forYou: 'A fuller look than a daily check-in. For a condition with stages, the app may suggest a different stage from it, and only ever suggests.',
        destination: route('/assessment'),
      },
      fromItem(
        'patterns',
        'Pattern Finder, on Trends, fills in once a couple of flares have meals logged before them.',
        'It lists what was eaten in the hours before the times you felt worse, how often that food turns up on any ordinary day, and what else was going on, like short sleep or a change in medicine.',
        'A food it lists can be tested with the experiment below.',
      ),
      {
        key: 'experiment',
        record: 'experiment',
        doThis: 'Test a food by leaving it out and bringing it back, from Test this in Pattern Finder or in Signals under New Foods.',
        forYou: 'The app compares how you felt before, while it was out, and once it was back, and says plainly what one run can and cannot show.',
        destination: signalsLens('newFoods'),
      },
      fromItem(
        'trends',
        'Trends fills in once meals are logged on seven different days.',
        'Your nutrients across the days you logged, with food and supplement shown apart, beside your symptoms and your labs.',
      ),
      {
        key: 'symptomsTrend',
        doThis: 'Look over your symptoms and flares across the weeks, in Trends under Symptoms & Flares.',
        forYou: 'How often, how bad, and what was logged around them. A week with nothing logged shows as a gap rather than a good week.',
        destination: trendsLens('symptoms'),
      },
      fromItem(
        'report',
        'Make a report to take to your next appointment, on Reports.',
        'One document with what you have logged, laid out for a clinician, every section saying where its figures came from. Save it as a PDF or share it.',
      ),
    ],
  },
  {
    key: 'food',
    name: 'Food',
    title: 'If food matters to you',
    opening:
      'Here is how Inside Story works for food. You tell it what you avoid and how you eat, then log what you eat as you go. The app works out what is in every meal for you and checks each ingredient against your conditions and allergies. Over time it shows what your days add up to, where your nutrients come from, and which foods tend to come before a better or worse day. The goal is to get what you need from food, with a supplement only for what food cannot supply.',
    entries: [
      fromItem(
        'aboutYou',
        'Add your birth date and sex in Profile.',
        'How much of each nutrient a person needs depends on age and sex, so the totals for each day are measured against the right amounts.',
      ),
      fromItem(
        'allergies',
        'List any food allergies in Profile.',
        'Lookups, recipes and meal plans mark what contains a listed allergen. The marking depends on how foods are labelled, so it helps you check and is never a promise that a food is safe.',
      ),
      fromItem(
        'eatingStyle',
        'Choose an eating style in Profile, if you follow one.',
        'Meal plans and recipe suggestions keep to it, whether that is vegetarian, paleo, Mediterranean or another.',
      ),
      {
        key: 'nutrientTargets',
        record: 'nutrientTargets',
        doThis: 'If your doctor or dietitian gave you a daily amount of protein, fiber or sodium, set it in Profile.',
        forYou: 'The day\'s gauges then measure against your figure instead of the general one.',
        destination: profile,
      },
      {
        key: 'foodLookup',
        doThis: 'Look up any food in Insights, under Food Lookup.',
        forYou: 'What is in it, and what it means for the conditions you chose, with the reasons spelled out.',
        destination: insightsLens('foodLookup'),
      },
      {
        key: 'safeFoods',
        record: 'safeFoods',
        doThis: 'Mark foods that agree with you, and ones that do not, in Insights under Safe Foods.',
        forYou: 'A list of what you know about your body, kept apart from what the app says in general, and shown wherever those foods come up.',
        destination: insightsLens('safeFoods'),
      },
      {
        key: 'systemRecipes',
        doThis: 'Browse the recipes in Food, under System Recipes.',
        forYou: 'Hundreds of home-cooked dishes, each with what it means for your conditions. Any of them can be opened in a builder and changed.',
        destination: foodLens('systemRecipes'),
      },
      {
        key: 'savedRecipe',
        record: 'savedRecipe',
        doThis: 'Build a dish from ingredients in Food, with the Meal builder or the ones for soups, salads, smoothies, sauces, baked goods and more.',
        forYou: 'Each ingredient is checked as you add it, and the whole dish gets a full report before you save it. A saved dish can be logged again with one tap.',
        destination: foodLens('mealBuilder'),
      },
      fromItem(
        'meal',
        'Log what you eat, in Schedules under Meals, or from Log or Schedule in Food.',
        'Every meal logged is added up into the day\'s nutrients, and kept to line up later against how you felt.',
        'Seven days of meals fill in Trends, and meals before a flare feed Pattern Finder.',
      ),
      {
        key: 'voiceLog',
        doThis: 'If typing a meal is a bother, say it instead with Say What You Ate.',
        forYou: 'You speak the meal, see what the app made of it, fix anything it got wrong, and log it.',
        destination: route('/voice-log'),
      },
      {
        key: 'scannedProduct',
        record: 'scannedProduct',
        doThis: 'Scan the barcode of anything packaged, in Food under Scan a Product.',
        forYou: 'The label comes in with its ingredients and nutrients, and the product can be logged like any other food.',
        destination: foodLens('scanProduct'),
      },
      fromItem(
        'water',
        'Log what you drink, in Schedules under Hydration.',
        'Water counts toward the day as much as food does, and some timing advice depends on it.',
      ),
      {
        key: 'todaysNutrients',
        doThis: 'See what today adds up to, in Insights under Nutrients.',
        forYou: 'Each nutrient against what you need, saying how much came from food and how much from a supplement.',
        destination: insightsLens('nutrients'),
      },
      {
        key: 'mealPlan',
        record: 'mealPlan',
        doThis: 'Plan meals ahead, up to six weeks, in Schedules under Meal Plan.',
        forYou: 'A plan built around your conditions, allergies and eating style, rotating foods for variety, and put on your schedule with one tap.',
        leadsTo: 'The grocery list below is made from it.',
        destination: scheduleLens('dailyMealPlan'),
      },
      {
        key: 'groceryList',
        record: 'groceryList',
        doThis: 'Make a grocery list from the meals you have planned, in Life under Grocery List.',
        forYou: 'Everything the planned days need, grouped for the shop. Record what you paid, and any item can compare two sizes or brands by price per kilo or litre. Shared with a partner when you pair.',
        destination: lifeLens('groceryList'),
      },
      {
        key: 'fermentation',
        record: 'fermentation',
        doThis: 'If you ferment at home, build a ferment in Food under Fermentation and start a batch.',
        forYou: 'The batch is tracked from start to jar, and what is left is drawn down as you use it.',
        destination: foodLens('fermentationBuilder'),
      },
      fromItem(
        'trends',
        'Trends fills in once meals are logged on seven different days.',
        'Nutrients and variety across the days you logged, with food and supplement shown apart. A day with nothing logged shows as a gap, never as a day of eating nothing.',
      ),
      {
        key: 'whatYouEat',
        doThis: 'Look at what you eat over the weeks, in Trends under What You Eat.',
        forYou: 'How many different foods and food groups you ate each week, since variety is one of the things that helps the gut most.',
        destination: trendsLens('variety'),
      },
      {
        key: 'eatingWindow',
        doThis: 'See when in the day you eat, in Trends under Eating Window.',
        forYou: 'The first and last meal of each day, drawn across the weeks.',
        destination: trendsLens('eatingWindow'),
      },
      {
        key: 'groceryPrices',
        doThis: 'Follow what food costs you, in Trends under Grocery Prices.',
        forYou: 'The prices you recorded on your lists, over time.',
        destination: trendsLens('groceries'),
      },
    ],
  },
  {
    key: 'movement',
    name: 'Movement',
    title: 'If movement matters to you',
    opening:
      'Here is how Inside Story works for movement. Log what you do, or let your phone count your steps, and the app lays it out across the weeks beside how you felt. It counts what happened and never sets you a target.',
    entries: [
      fromItem(
        'exercise',
        'Log some movement from Home. A walk counts.',
        'What you did and for how long, kept beside the check-ins that follow it.',
        'Seven days of it fill in Trends.',
      ),
      {
        key: 'signalsExercise',
        doThis: 'Log movement with more detail, in Signals under Exercise.',
        forYou: 'The kind of exercise, how hard, and how you felt after.',
        destination: signalsLens('exercise'),
      },
      {
        key: 'scheduleExercise',
        doThis: 'Plan movement ahead, in Schedules under Exercise.',
        forYou: 'A reminder when it is due, and one tap to mark it done.',
        destination: scheduleLens('exercise'),
      },
      {
        key: 'healthConnect',
        record: 'healthConnect',
        doThis: 'Connect your phone\'s health store, in Life under Movement, if another app or a watch counts your steps or sleep.',
        forYou: 'Steps and sleep come in by themselves, each one a separate choice. Steps reach Trends and Pattern Finder.',
        destination: lifeLens('movement'),
      },
      fromItem(
        'movementTrend',
        'Trends shows your movement once it is logged on seven different days.',
        'Movement across the weeks, beside how you felt on the same days.',
      ),
    ],
  },
  {
    key: 'home',
    name: 'Home',
    title: 'If keeping the house running matters to you',
    opening:
      'Here is how Inside Story works for the house. Anything that comes round now and then gets written down once and reminds you when it is due. Anything you might wonder about later, like whether the door is locked or where the spare keys went, gets one tap or one line when it happens, so the answer is waiting when you need it.',
    entries: [
      fromItem(
        'upkeep',
        'Add one thing that needs doing now and then, like changing a filter, in Life under Upkeep.',
        'It comes round on the schedule you set and says so when it is due, so it can be out of your head until then.',
        'Each one shows in Schedules under Upkeep, and marking it done feeds Keeping Up on Trends.',
      ),
      {
        key: 'upkeepDone',
        record: 'upkeepDone',
        doThis: 'Mark upkeep done when you do it, in Schedules under Upkeep.',
        forYou: 'The next due date moves on from the day you did it, and the history is kept.',
        destination: scheduleLens('upkeep'),
      },
      fromItem(
        'didIDoIt',
        'Add something you tend to wonder whether you did, like locking the door, in Life under Did I Do It.',
        'One tap when you do it, and later the answer is there, with the time.',
      ),
      {
        key: 'doneMark',
        record: 'doneMark',
        doThis: 'Tap it each time you do it.',
        forYou: 'The time is kept, so the question has an answer.',
        destination: lifeLens('didIDoIt'),
      },
      fromItem(
        'kitchen',
        'Note where things in the kitchen are kept, in Life under Kitchen.',
        'What you have on hand and where it is, drawn down as meals use it.',
        'Where Did I Put It searches these.',
      ),
      {
        key: 'whereIsItHome',
        doThis: 'Ask Where Did I Put It, from Home, the next time something goes missing.',
        forYou: 'One search across the kitchen, your notes and the garden, each answer with its age.',
        destination: route('/where-is-it'),
      },
      fromItem(
        'daysUntil',
        'Count down to something coming up, like a delivery or a visit, in Life under Days Until.',
        'The days left, with a reminder on the day it lands.',
      ),
      fromItem(
        'keepingUp',
        'Keeping Up on Trends fills in once something is marked on seven different days.',
        'Upkeep kept, things marked done and routines run, across the weeks. It counts what happened and scores nobody.',
      ),
    ],
  },
  {
    key: 'garden',
    name: 'Garden',
    title: 'If your garden matters to you',
    opening:
      'Here is how Inside Story works for a garden, whether it is a field, a raised bed or a pot on a windowsill, indoors or out. Everything hangs off a garden area: what grows there, what it needs, what it cost and what it gave back. What you harvest can go straight into your meals.',
    entries: [
      {
        key: 'myZone',
        doThis: 'Find your growing zone in Garden, under My Zone.',
        forYou: 'Your frost dates and what can go in the ground when.',
        destination: gardenLens('myZone'),
      },
      fromItem(
        'gardenArea',
        'Add a garden area in Garden, under Plots & Plantings.',
        'An outdoor area asks about the sun, an indoor one about its lights, and a greenhouse about both.',
        'Everything below is recorded under an area.',
      ),
      {
        key: 'gardenSetup',
        record: 'gardenSetup',
        doThis: 'Record what the area runs on in its Grow Setup: lights, containers, fans, a hydroponic system, meters, whatever it uses.',
        forYou: 'What each piece cost, what it costs to keep running, and which pieces are no longer in use.',
        destination: gardenLens('plotsAndPlantings'),
      },
      fromItem(
        'planting',
        'Record something growing in the area.',
        'A planting carries its dates, so tasks, counters and harvests follow from it.',
      ),
      {
        key: 'gardenTask',
        record: 'gardenTask',
        doThis: 'Add garden jobs in Garden, under Upcoming Tasks.',
        forYou: 'Watering, feeding and planting out, each with a reminder.',
        destination: gardenLens('upcomingTasks'),
      },
      {
        key: 'gardenCountdown',
        record: 'gardenCountdown',
        doThis: 'Count the days to something, like first harvest, in Garden under Days Until.',
        forYou: 'A counter tied to the area or the planting, with a reminder on the day.',
        destination: gardenLens('daysUntil'),
      },
      {
        key: 'gardenReading',
        record: 'gardenReading',
        doThis: 'Record readings like soil moisture, temperature or rain, in Garden under Growing Conditions.',
        forYou: 'The figures, by area, kept as a record you can look back through.',
        leadsTo: 'Trends, under Growing Conditions, draws them by month.',
        destination: gardenLens('growingConditions'),
      },
      {
        key: 'compost',
        record: 'compost',
        doThis: 'Start a compost pile in Garden, under Compost.',
        forYou: 'When it was turned, what went in, and which area it feeds.',
        destination: gardenLens('compost'),
      },
      {
        key: 'gardenCost',
        record: 'gardenCost',
        doThis: 'Record what the garden costs, in Garden under Growing Costs.',
        forYou: 'Seeds, soil, tools and the rest, kept per area or per group of areas.',
        destination: gardenLens('growingCosts'),
      },
      {
        key: 'electricity',
        record: 'electricity',
        doThis: 'If you grow under lights, add your electricity bills in Growing Costs, starting with one from before the grow.',
        forYou: 'Each bill after it is compared per day with the one before, so you can see what the lights add.',
        destination: gardenLens('growingCosts'),
      },
      fromItem(
        'harvest',
        'Log a harvest when one comes, in Garden under Harvest Log.',
        'What each area grew, by weight or by count.',
        'Garden Yield on Trends draws from these.',
      ),
      {
        key: 'harvestUse',
        record: 'harvestUse',
        doThis: 'When a meal uses something from the garden, say yes when the app offers to take it off what you have.',
        forYou: 'What is left on hand stays right, and the meal carries where its food came from.',
        destination: scheduleLens('meals'),
      },
      {
        key: 'harvestGift',
        record: 'harvestGift',
        doThis: 'Record produce somebody gave you from their garden, in the Harvest Log.',
        forYou: 'Kept apart from what you grew, and added to your kitchen.',
        destination: gardenLens('harvestLog'),
      },
      {
        key: 'horticulture',
        doThis: 'Read about growing in Garden, under Horticulture.',
        forYou: 'Soil, composting, companion planting and growing food, written for home gardeners.',
        destination: gardenLens('horticulture'),
      },
      {
        key: 'gardenYield',
        doThis: 'See what the garden gave, in Trends under Garden Yield.',
        forYou: 'Harvests by month and by crop, and what they saved you where you have recorded prices for the same food.',
        destination: trendsLens('harvest'),
      },
      {
        key: 'conditionsTrend',
        doThis: 'See your readings over the months, in Trends under Growing Conditions.',
        forYou: 'Rain and water given are added up, and everything else is shown with its lowest and highest.',
        destination: trendsLens('conditions'),
      },
    ],
  },
  {
    key: 'money',
    name: 'Money',
    title: 'If money matters to you',
    opening:
      'Here is how Inside Story works for money. Bills that come round on their own get written down once, and spending gets recorded against the day it happened. The app only ever counts what you entered, and never guesses at a month you did not.',
    entries: [
      fromItem(
        'bills',
        'Add a bill that comes every month, in Life under Finances, then Bills & Income.',
        'It shows when it is coming up, so it is not a surprise.',
      ),
      fromItem(
        'spending',
        'Record something you spent, in Finances under Spending.',
        'Spending by day and by kind.',
        'What It Costs on Trends draws from these.',
      ),
      {
        key: 'accounts',
        record: 'accounts',
        doThis: 'Add your accounts and what they hold or owe, in Finances under Accounts.',
        forYou: 'Balances in one place, with their history as you update them.',
        destination: lifeLens('finances'),
      },
      {
        key: 'goals',
        record: 'goals',
        doThis: 'Set something you are saving for, in Finances under Goals.',
        forYou: 'What it costs, what is put toward it, and the date you are aiming for.',
        destination: lifeLens('finances'),
      },
      {
        key: 'insurancePlan',
        record: 'insurancePlan',
        doThis: 'Add your health insurance plan, in Finances under Health.',
        forYou: 'How much of the deductible and the out-of-pocket limit is met so far this year.',
        destination: lifeLens('finances'),
      },
      {
        key: 'medicalBill',
        record: 'medicalBill',
        doThis: 'Record a medical bill in the same place.',
        forYou: 'What was billed, what insurance paid and what you still owe, counted toward the plan\'s limits.',
        destination: lifeLens('finances'),
      },
      fromItem(
        'whatItCosts',
        'What It Costs on Trends compares one month with another once two months have spending recorded.',
        'Spending by month, including what the garden and your health cost, from what you recorded against a day.',
      ),
    ],
  },
  {
    key: 'routines',
    name: 'Routines',
    title: 'If routines matter to you',
    opening:
      'Here is how Inside Story works for the shape of your days. Anything that needs remembering gets written down once, so it stops taking up room in your head. Routines hold their parts in order and keep your place. The app can remind you before a thing rather than at it, and counts what happened without ever scoring you.',
    entries: [
      fromItem(
        'neuro',
        'If autism, ADHD or dyslexia is part of your life, add it in Profile.',
        'It switches on settings like a quieter Home and reminders that come ahead of time. It never changes what the app says about food.',
      ),
      {
        key: 'reminders',
        doThis: 'Choose which reminders you get and set quiet hours, in Profile under Reminders.',
        forYou: 'Reminders for meals, water, doses and dated things, only the ones you want, and none during the hours you keep quiet.',
        destination: profile,
      },
      fromItem(
        'routine',
        'Set up a routine, such as getting ready in the morning, in Life under Routines.',
        'The routine holds its parts in order so you do not have to.',
      ),
      {
        key: 'routineRun',
        record: 'routineRun',
        doThis: 'Walk through the routine from its Start button.',
        forYou: 'One part on the screen at a time, and if you stop partway it remembers where.',
        destination: lifeLens('routines'),
      },
      fromItem(
        'didIDoIt',
        'Add something you tend to wonder whether you did, in Life under Did I Do It.',
        'One tap when you do it, and the answer is there later.',
      ),
      fromItem(
        'daysUntil',
        'Count down to something coming up, in Life under Days Until.',
        'A date you are waiting for, in days, with a reminder on the day it lands.',
      ),
      fromItem(
        'capture',
        'Write down whatever comes to mind in Capture, from Home.',
        'Out of your head and into one inbox, to sort now, later or never.',
      ),
      fromItem(
        'keepingUp',
        'Keeping Up on Trends fills in once something is marked on seven different days.',
        'Routines run and things marked done, across the weeks. It counts what happened and scores nobody.',
      ),
    ],
  },
  {
    key: 'work',
    name: 'Work',
    title: 'If work matters to you',
    opening:
      'Here is how Inside Story works for work. It keeps track of two things your job gives you besides pay: the benefits it makes available, which are easy to leave unclaimed, and how the work itself has been going, a week at a time.',
    entries: [
      fromItem(
        'workBenefits',
        'Add a benefit your work offers, in Life under Work.',
        'Amounts, what is used, and when it resets, so nothing runs out unnoticed. Worth Asking holds questions to take to your employer.',
      ),
      fromItem(
        'workCheckin',
        'Note how the week went, in Life under Work.',
        'A week at a time, so how work has been going is there to look back on.',
      ),
      fromItem(
        'daysUntil',
        'Count down to a deadline or a day off, in Life under Days Until.',
        'The days left, with a reminder on the day.',
      ),
    ],
  },
  {
    key: 'family',
    name: 'Family',
    title: 'If your family matters to you',
    opening:
      'Here is how Inside Story works for the people you look after. Each person you add can have their conditions noted, and anyone included in the meal plan shapes what gets planned, so the food suits everybody at the table.',
    entries: [
      fromItem(
        'familyMember',
        'Add someone in your family, in Life under Conditions.',
        'They get a separate list there, apart from yours.',
      ),
      fromItem(
        'familyConditions',
        'Note any conditions they have.',
        'The reading for their conditions sits in their list.',
      ),
      {
        key: 'familyInMealPlan',
        record: 'familyInMealPlan',
        doThis: 'Include them in the meal plan, with the switch beside their name.',
        forYou: 'The meal plan then accounts for their conditions as well as yours.',
        leadsTo: 'Schedules, under Meal Plan, uses it next time you plan.',
        destination: lifeLens('conditions'),
      },
      {
        key: 'connectionFamily',
        record: 'connection',
        doThis: 'If a partner uses Inside Story too, pair with them in Profile under Connections.',
        forYou: 'The grocery list is shared between you, and recipes can be sent across. Health records stay with each person.',
        destination: route('/connections'),
      },
      fromItem(
        'daysUntil',
        'Count down to a birthday, a visit or the start of school, in Life under Days Until.',
        'The days left, with a reminder on the day it lands.',
      ),
    ],
  },
];

export const GUIDE_BY_KEY: Record<GuideKey, GuideDef> = Object.fromEntries(GUIDES.map((guide) => [guide.key, guide])) as Record<
  GuideKey,
  GuideDef
>;

export function isGuideKey(value: string | null | undefined): value is GuideKey {
  return !!value && GUIDES.some((guide) => guide.key === value);
}

// WHAT THE PAGE SHOWS.

// done, open, and set aside mirror a Your Story item; reading has no record
// and is never ticked.
export type GuideEntryState = 'done' | 'open' | 'setAside' | 'reading';

export type GuideEntryView = {
  entry: GuideEntry;
  state: GuideEntryState;
  dateline: string | null;
  // A waiting item's count, or a set-aside or reopened item's note.
  note: string | null;
};

export type GuideView = {
  def: GuideDef;
  entries: GuideEntryView[];
};

export type GuideRecords = Partial<Record<GuideRecordKey, string | null>>;

function stateOfItem(state: ItemState): GuideEntryState {
  if (state === 'done') return 'done';
  if (state === 'setAside') return 'setAside';
  return 'open';
}

// The Basics first, then one guide per part of life chosen, in the order
// the parts are listed on the Front Page.
export function guidesFor(beats: readonly BeatKey[]): GuideDef[] {
  return [GUIDE_BY_KEY.basics, ...ALL_BEATS.filter((beat) => beats.includes(beat)).map((beat) => GUIDE_BY_KEY[beat])];
}

export function buildGuides(facts: YourStoryFacts, records: GuideRecords): GuideView[] {
  return guidesFor(facts.beats).map((def) => ({
    def,
    entries: def.entries.map((entry): GuideEntryView => {
      if (entry.item) {
        const item = evaluateItem(ITEM_BY_KEY[entry.item], facts);
        return { entry, state: stateOfItem(item.state), dateline: item.dateline, note: item.note };
      }
      if (entry.record) {
        const on = records[entry.record] ?? null;
        return { entry, state: on ? 'done' : 'open', dateline: on ? `Since ${storyDate(on)}` : null, note: null };
      }
      return { entry, state: 'reading', dateline: null, note: null };
    }),
  }));
}

// The guide the Home card points into: the one holding the next thing Your
// Story asks for, or failing that the first guide with something still
// open. The Basics only when the next thing belongs to no part of life.
export function currentGuideKey(view: YourStoryView, guides: GuideView[]): GuideKey | null {
  const next = view.nextItem?.def.key;
  if (next) {
    const beatGuides = guides.filter((guide) => guide.def.key !== 'basics');
    const holding = beatGuides.find((guide) => guide.entries.some((entry) => entry.entry.item === next));
    if (holding) return holding.def.key;
    if (guides.some((guide) => guide.entries.some((entry) => entry.entry.item === next))) return 'basics';
  }
  const open = guides.find((guide) => guide.entries.some((entry) => entry.state === 'open'));
  return open?.def.key ?? null;
}

export function openGuideLabel(key: GuideKey): string {
  return key === 'basics' ? 'Open The Basics' : `Open the ${BEAT_LABELS[key]} guide`;
}

export function guideCardLine(key: GuideKey): string {
  return key === 'basics'
    ? 'This is part of The Basics, which walks through everything every part of the app shares.'
    : `This is part of the ${BEAT_LABELS[key]} guide, which walks through everything Inside Story does for ${BEAT_LABELS[key].toLowerCase()}.`;
}

export const GUIDES_HEADING = 'How Inside Story works for you';
export const GUIDES_LEAD =
  'One guide for each part of your life you chose, plus The Basics. Each one runs in order, from the first thing to set up to what your records show over time, and every line takes you straight there.';
export const READ_LABEL = 'Have a look';

// Only an item that applies to the chosen parts of life can be the next
// thing, so this is here for the test: every Your Story item that applies
// has a place in at least one guide the person sees.
export function itemsWithoutAGuide(beats: readonly BeatKey[]): YourStoryItemKey[] {
  const shown = new Set(guidesFor(beats).flatMap((guide) => guide.entries.map((entry) => entry.item).filter(Boolean)));
  return (Object.keys(ITEM_BY_KEY) as YourStoryItemKey[]).filter(
    (key) => itemApplies(ITEM_BY_KEY[key], beats) && !shown.has(key),
  );
}
