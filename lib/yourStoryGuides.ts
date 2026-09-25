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
// serves it. Each entry says what to do and where, what it does for you, and
// often what it feeds next.
//
// 1.0.51.8, the same day. Asked whether the guides led anybody to a result
// in the fewest moves, the honest answer was no: they followed the app's
// layout, so a reading lens sat between two setup steps and a chart that
// needs weeks of records sat beside a switch that takes a second. Every
// entry now carries WHEN it belongs (GuideWhen), and a guide reads in five
// groups: what to set up first, what to do every day, what to do when
// something happens, what fills in once there are weeks of records, and
// what is there when somebody wants more. Each guide opens with its first
// result and what it takes to get there. A step two guides share is written
// out once, in the first guide shown, and pointed to from the rest. The Home
// card points only into a first or everyday step, never into depth.
//
// The same request asked for the guides to be written two ways: "The first
// way is for the person who is not autistic or adhd, and the more detailed
// version is for people who are autistic and/or adhd." The choice is a
// plain one, Short or Step by step, asked on the page and changeable any
// time, and never tied to a diagnosis, since whether ADHD and autism become
// selectable profiles is a decision still deferred. Step by step adds, per
// step: how often and how long (cadenceLine, takes), how to get there from
// anywhere in the app (navigationLine, generated from the destination so it
// cannot drift from where the Go there button goes), and the taps once
// there (taps). A tap quotes a button only where the label was read out of
// the screen's source; otherwise it describes the action in plain words.
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
// calls it, and "Step by step" only as the name of the choice.
//
// Every destination is a tab and lens key that exists, and every lens name
// the navigation line quotes is one the tab screen shows; the test checks
// both against the tab screens.

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

// Where a step belongs in the order that leads to a result soonest.
export type GuideWhen = 'start' | 'daily' | 'whenItHappens' | 'onceThereIsData' | 'more';

export const GUIDE_WHEN_ORDER: GuideWhen[] = ['start', 'daily', 'whenItHappens', 'onceThereIsData', 'more'];

export const GUIDE_WHEN_HEADINGS: Record<GuideWhen, string> = {
  start: 'Start here',
  daily: 'Every day',
  whenItHappens: 'When it happens',
  onceThereIsData: 'Once there are a few weeks of records',
  more: 'When you want more',
};

// How often, said once per group so no step has to say it for itself.
const WHEN_CADENCE: Record<GuideWhen, string> = {
  start: 'Once',
  daily: 'Every day',
  whenItHappens: 'Only when it happens',
  onceThereIsData: 'Now and then, once there is something to show',
  more: 'Whenever you like',
};

export type GuideEntry = {
  key: string;
  when: GuideWhen;
  // What to do, and where.
  doThis: string;
  // What it does for you.
  forYou: string;
  // What it feeds next, when something later in the guide draws on it.
  leadsTo?: string;
  // How long it takes, for Step by step.
  takes?: string;
  // What to tap once there, for Step by step.
  taps?: string[];
  destination: StoryDestination;
  item?: YourStoryItemKey;
  record?: GuideRecordKey;
};

export type GuideDef = {
  key: GuideKey;
  name: string;
  title: string;
  opening: string;
  // What you get first, and what it takes to get it.
  firstResult: string;
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

type More = { when: GuideWhen; leadsTo?: string; takes?: string; taps?: string[] };

// An entry that IS a Your Story item takes its destination from the item,
// so the two always go to the same place.
function fromItem(key: YourStoryItemKey, doThis: string, forYou: string, more: More): GuideEntry {
  return { key: `item:${key}`, item: key, doThis, forYou, destination: ITEM_BY_KEY[key].destination, ...more };
}

export const GUIDES: GuideDef[] = [
  {
    key: 'basics',
    name: 'The Basics',
    title: 'The Basics',
    opening:
      'However you use Inside Story, a few pieces sit under every part of it. Everything you record stays on your device unless you choose to send it somewhere, so keeping a copy safe comes first. After that it is a matter of getting things out of your head and into a place you can find them again.',
    firstResult:
      'What you get first: in about five minutes, a copy of everything kept somewhere safe, and one place to put down any thought so you can stop holding onto it.',
    entries: [
      fromItem(
        'beats',
        'Choose the parts of your life you want Inside Story to follow.',
        'Your Story shows a guide like this one for each part you choose, and the Home card follows along. Nothing anywhere in the app is hidden by what you leave out.',
        {
          when: 'start',
          takes: 'About a minute',
          taps: [
            'Tap Choose, just below.',
            'Tap each part of life you want followed. You can choose as many as you like.',
            'Tap Close when you have them all.',
          ],
        },
      ),
      fromItem(
        'backup',
        'Save a backup, or turn on automatic saving to a shared folder, in Profile under Backup & Restore.',
        'Your records live on this device and nowhere else. A backup is the way back if the phone is lost or reset, and it is encrypted with a password only you know, so there is no way to recover a forgotten one.',
        {
          when: 'start',
          leadsTo: 'Automatic saving is also what keeps a second device up to date.',
          takes: 'A few minutes',
          taps: [
            'Tap Backup & Restore to open it.',
            'Tap Back Up to OneDrive. If you do not use OneDrive, tap Save a Copy Somewhere Else instead.',
            'Make up a password when it asks, and write it down somewhere safe. Nobody can open the backup without it, you included.',
          ],
        },
      ),
      fromItem(
        'capture',
        'Write down anything on your mind in Capture, from Home.',
        'A thought written down no longer needs holding onto. Sort it later into a reminder, a place something is kept, or nothing at all.',
        {
          when: 'daily',
          takes: 'A few seconds',
          taps: [
            'Type the thought into the box at the top, the way you would say it.',
            'Save it. There is nothing else to fill in, and sorting it can wait.',
          ],
        },
      ),
      {
        key: 'whereIsIt',
        when: 'whenItHappens',
        doThis: 'Look something up in Where Is It, from Home.',
        forYou: 'One search across the kitchen, your notes about where things are, and what is growing in the garden. Every answer says how old it is, so an answer from months ago says so.',
        takes: 'A few seconds',
        taps: ['Type what you are looking for.', 'Each answer says where it was put and how long ago that was.'],
        destination: route('/where-is-it'),
      },
      fromItem(
        'secondDevice',
        'Open Inside Story on a computer or a second phone and turn on automatic saving there, with the same password and the same folder.',
        'The two devices merge what each one recorded, record by record, so work done on either is kept. The computer version gives you a bigger screen for longer jobs like planning meals or reading.',
        {
          when: 'more',
          takes: 'About ten minutes',
          taps: [
            'On the other device, install Inside Story and open it.',
            'Go to Profile there, open Backup & Restore, and turn on automatic saving with the same password and the same folder as this device.',
          ],
        },
      ),
      {
        key: 'connection',
        record: 'connection',
        when: 'more',
        doThis: 'If you share a household, pair with that person in Profile under Connections.',
        forYou: 'Pairing makes a private, encrypted link between your two apps. Today the grocery list is what the two of you share, and a recipe can be sent from one to the other. Health records stay with each person.',
        takes: 'A few minutes, with the other person beside you',
        taps: [
          'Tap Pair With a Partner.',
          'On their phone, they open the same screen and tap Scan Their Code, then point it at the code on yours.',
        ],
        destination: route('/connections'),
      },
      {
        key: 'searchReading',
        when: 'more',
        doThis: 'Search everything there is to read, in Life under Search Reading.',
        forYou: 'Every article in the app in one search: conditions, nutrition, food history, the environment and gardening. A result opens where it lives.',
        taps: ['Type a word or two into the search box.', 'Tap a result to read it.'],
        destination: lifeLens('searchReading'),
      },
      {
        key: 'healthLiteracy',
        when: 'more',
        doThis: 'Browse Health Literacy, in Life.',
        forYou: 'Plain explanations of nutrients, additives, how the body uses food, and a glossary for the words that come up everywhere else.',
        taps: ['Tap a heading to open it, then tap an article to read it.'],
        destination: lifeLens('healthLiteracy'),
      },
      {
        key: 'earthMatters',
        when: 'more',
        doThis: 'Browse Earth Matters, in Life.',
        forYou: 'Where food comes from, what farming and packaging do to it, and how to weigh claims on a label.',
        taps: ['Tap a heading to open it, then tap an article to read it.'],
        destination: lifeLens('earthMatters'),
      },
    ],
  },
  {
    key: 'health',
    name: 'Health',
    title: 'If your health matters to you',
    opening:
      'Here is how Inside Story works for your health. It starts with who you are, what you have and what you take. Then, day by day, you note how you feel and what you eat. Over weeks the app lines that up against what you ate, slept and did, and shows what tends to come before a better or a worse day. It shows patterns worth watching and never decides what caused something, and anything medical stays between you and your doctor.',
    firstResult:
      'What you get first: about ten minutes of setup gives you every dose on one timeline of the day, with reminders and what to take it with or keep it apart from. A minute a day after that, noting how you feel and what you ate, is what lets Pattern Finder show anything in a few weeks.',
    entries: [
      fromItem(
        'aboutYou',
        'Add your birth date and sex in Profile.',
        'Recommended amounts of most nutrients differ by age and sex, so every nutrient figure in the app is measured against the right one.',
        {
          when: 'start',
          takes: 'Under a minute',
          taps: ['Tap Personal Info to open it.', 'Fill in Birth date and Sex.'],
        },
      ),
      fromItem(
        'conditions',
        'Choose any of the 19 conditions this app follows, in Profile.',
        'Every food lookup, recipe and meal plan then says what matters for your conditions, and the reading for them comes first.',
        {
          when: 'start',
          leadsTo: 'Your conditions decide what the stage question below asks and what the reading shows.',
          takes: 'About a minute',
          taps: ['Tap Conditions & Check-In to open it.', 'Under Your conditions, tap each one you have.'],
        },
      ),
      {
        key: 'conditionStage',
        record: 'conditionStage',
        when: 'start',
        doThis: 'If one of your conditions has stages, say which one you are at, in Profile.',
        forYou: 'Six of the conditions have stages. Foods suited to your stage come first in lookups and in the builders, and anything to be careful with is marked. Nothing is ever hidden or blocked.',
        leadsTo: 'Insights, under Healing Stage, lists the foods for that stage.',
        takes: 'About a minute',
        taps: [
          'Tap Conditions & Check-In to open it.',
          'Find the stage question under your condition, and choose the answer that fits you now. It can be changed any time.',
        ],
        destination: profile,
      },
      fromItem(
        'meds',
        'Add the medicines and supplements you take, in Life under My Meds.',
        'This list is where timing advice, the dose schedule, the emergency card and your doctor report all start. A supplement added here also counts toward your nutrients.',
        {
          when: 'start',
          takes: 'About a minute for each one',
          taps: [
            'Tap + Prescription, + OTC drug or + Supplement, whichever it is.',
            'Fill in its name and dose, and save it.',
            'Do the same for each thing you take.',
          ],
        },
      ),
      {
        key: 'doseTimes',
        record: 'doseTimes',
        when: 'start',
        doThis: 'Give each medicine and supplement its times, in Schedules under Meds.',
        forYou: 'One timeline of the day with every dose on it and reminders at the times you set. Each dose says what to take it with or keep it apart from.',
        leadsTo: 'Schedules, under Today\'s Meals, then shows your doses and meals together on one clock, with how far apart they are.',
        takes: 'About a minute for each one',
        taps: [
          'Find the medicine or supplement in the list.',
          'Tap + Add a reminder time under it, and choose the time you take it.',
          'Do the same for each one.',
        ],
        destination: scheduleLens('meds'),
      },
      fromItem(
        'emergency',
        'Fill in the emergency card, in Life under Emergency.',
        'Allergies to medicines, contacts, your doctor and anything else somebody helping you would need, in one place, ready in a hurry.',
        {
          when: 'start',
          takes: 'About five minutes',
          taps: [
            'Fill in each part the card asks for.',
            'Tap Add someone for each person to call.',
            'Tap Save.',
          ],
        },
      ),
      fromItem(
        'checkin',
        'Note how you feel today, on the check-in card on Home.',
        'A few taps a day. How you felt is the other half of every pattern: without it, meals and sleep have nothing to be compared with.',
        {
          when: 'daily',
          takes: 'Under a minute',
          taps: ['Tap Log how you feel today.', 'Answer the few questions and save.'],
        },
      ),
      fromItem(
        'meal',
        'Log what you eat, in Schedules under Meals.',
        'Every meal is added up into the nutrients for the day and kept, so the times you felt worse can be lined up against what came before them.',
        {
          when: 'daily',
          leadsTo: 'Meals logged before a flare are what Pattern Finder reads.',
          takes: 'About a minute a meal',
          taps: [
            'Tap + Schedule a meal, then choose what you ate and the time.',
            'When it shows in the day\'s list, tap Log now.',
          ],
        },
      ),
      fromItem(
        'water',
        'Log what you drink, in Schedules under Hydration.',
        'Some timing advice for medicines depends on water, and how much you drink sits beside how you felt.',
        {
          when: 'daily',
          takes: 'A few seconds a drink',
          taps: ['Tap + Schedule a drink, choose what and how much, and save it.'],
        },
      ),
      {
        key: 'flare',
        record: 'flare',
        when: 'whenItHappens',
        doThis: 'Log a flare when one comes, in Signals under Flares.',
        forYou: 'When it started and how bad it was, which is what Pattern Finder reads beside your meals.',
        takes: 'About a minute',
        taps: ['Tap + Log a flare.', 'Say when it started and how bad it is, and save.'],
        destination: signalsLens('flares'),
      },
      {
        key: 'foodReaction',
        record: 'foodReaction',
        when: 'whenItHappens',
        doThis: 'Log a reaction to something you ate, in Signals under Food Reactions.',
        forYou: 'Tied to the meal it followed, so the food is on record next to what happened.',
        takes: 'About a minute',
        taps: ['Tap + Log a food reaction.', 'Choose the meal it followed, say what happened, and save.'],
        destination: signalsLens('foodReactions'),
      },
      {
        key: 'appointment',
        record: 'appointment',
        when: 'whenItHappens',
        doThis: 'Add your next appointment, in Schedules under Appointments.',
        forYou: 'A reminder before it, and it can go onto your phone\'s calendar too.',
        leadsTo: 'Before you go, Reports can make a document of what you have logged since the last one.',
        takes: 'About a minute',
        taps: [
          'Tap + Schedule an appointment.',
          'Fill in who it is with and when, then tap Schedule appointment.',
          'Tap Add to calendar if you want it on your phone\'s calendar too.',
        ],
        destination: scheduleLens('appointments'),
      },
      fromItem(
        'report',
        'Make a report to take to your next appointment, on Reports.',
        'One document with what you have logged, laid out for a clinician, every section saying where its figures came from. Save it as a PDF or share it.',
        {
          when: 'whenItHappens',
          takes: 'A minute',
          taps: ['Look it over on the screen.', 'Tap Share as PDF and choose where it goes.'],
        },
      ),
      {
        key: 'labs',
        record: 'labs',
        when: 'whenItHappens',
        doThis: 'Enter lab results when you get them, in Insights under Labs.',
        forYou: 'Each result is kept with the range your lab printed, and Trends draws each test over time.',
        takes: 'A minute or two for each result',
        taps: ['Tap + Log a Result.', 'Fill in the test, the number and the range printed on the report, and save.'],
        destination: insightsLens('labs'),
      },
      {
        key: 'bloodPressure',
        record: 'bloodPressure',
        when: 'whenItHappens',
        doThis: 'Log blood pressure readings, if you take them, in Signals under Blood Pressure.',
        forYou: 'Readings kept by time of day, shown on Trends beside everything else.',
        takes: 'Under a minute',
        taps: ['Tap + Log a blood pressure reading.', 'Fill in the two numbers and save.'],
        destination: signalsLens('bloodPressure'),
      },
      {
        key: 'weight',
        record: 'weight',
        when: 'whenItHappens',
        doThis: 'Log your weight in Profile, if you track it.',
        forYou: 'Trends, under Weight, draws it across the weeks with your usual range beside it, which says what your readings have been and never what they ought to be.',
        takes: 'Under a minute',
        taps: ['Tap Personal Info to open it.', 'Fill in Weight.'],
        destination: profile,
      },
      {
        key: 'therapy',
        record: 'therapy',
        when: 'whenItHappens',
        doThis: 'Log a hands-on therapy session, such as massage or physiotherapy, in Signals under Hands-On Therapies.',
        forYou: 'Trends, under Therapy Response, lines up how you felt in the days around each session.',
        takes: 'About a minute',
        taps: ['Tap + Log a session.', 'Say what kind it was and when, and save.'],
        destination: signalsLens('therapies'),
      },
      fromItem(
        'trends',
        'Trends fills in once meals are logged on seven different days.',
        'Your nutrients across the days you logged, with food and supplement shown apart, beside your symptoms and your labs.',
        { when: 'onceThereIsData', taps: ['Scroll through the days you logged. A day with nothing logged shows as a gap.'] },
      ),
      {
        key: 'symptomsTrend',
        when: 'onceThereIsData',
        doThis: 'Look over your symptoms and flares across the weeks, in Trends under Symptoms & Flares.',
        forYou: 'How often, how bad, and what was logged around them. A week with nothing logged shows as a gap rather than a good week.',
        taps: ['Tap a heading to open it.'],
        destination: trendsLens('symptoms'),
      },
      fromItem(
        'patterns',
        'Pattern Finder, on Trends, fills in once a couple of flares have meals logged before them.',
        'It lists what was eaten in the hours before the times you felt worse, how often that food turns up on any ordinary day, and what else was going on, like short sleep or a change in medicine.',
        {
          when: 'onceThereIsData',
          leadsTo: 'A food it lists can be tested with the experiment below.',
          taps: ['Read down the list. Each food says how many times it came before a flare, and how often it turns up anyway.'],
        },
      ),
      {
        key: 'experiment',
        record: 'experiment',
        when: 'onceThereIsData',
        doThis: 'Test a food by leaving it out and bringing it back, from Test this in Pattern Finder or in Signals under New Foods.',
        forYou: 'The app compares how you felt before, while it was out, and once it was back, and says plainly what one run can and cannot show.',
        takes: 'A few weeks, a minute a day',
        taps: ['Tap + Start a new food trial and choose the food.', 'Keep noting how you feel each day while it runs.'],
        destination: signalsLens('newFoods'),
      },
      {
        key: 'conditionsReading',
        when: 'more',
        doThis: 'Read about your conditions in Life, under Conditions.',
        forYou: 'Each condition you chose opens with what research says about it, grouped by topic, with how strong the evidence is. Conditions in your family sit in a separate list beside yours.',
        taps: ['Tap a condition to open it, then a topic, then an article.'],
        destination: lifeLens('conditions'),
      },
      {
        key: 'stageFoods',
        when: 'more',
        doThis: 'See the foods for your stage in Insights, under Healing Stage.',
        forYou: 'A list to shop and cook from, in the order that suits the stage you chose.',
        taps: ['Read down the list. Tap a food for more about it.'],
        destination: insightsLens('healingStage'),
      },
      {
        key: 'interactions',
        when: 'more',
        doThis: 'Look at how what you take fits together, in Insights under My Meds & Interactions.',
        forYou: 'Timing cautions between your medicines, supplements and foods, each with where it comes from. Timing is all it covers: what you take and how much is for your prescriber.',
        taps: ['Read down the cautions. Tap one to see where it comes from.'],
        destination: insightsLens('myMeds'),
      },
      {
        key: 'personalRule',
        record: 'personalRule',
        when: 'more',
        doThis: 'Add a rule you made, such as something your doctor told you, in Insights under My Meds & Interactions.',
        forYou: 'It shows up whenever it applies, labelled as yours rather than the app\'s, and appears in your report.',
        takes: 'A minute or two',
        taps: ['Tap + Add a Rule of Your Own.', 'Say what it applies to and what it says, and save.'],
        destination: insightsLens('myMeds'),
      },
      {
        key: 'assessment',
        record: 'assessment',
        when: 'more',
        doThis: 'Take the symptom assessment now and then, from the Symptom Check-In card on Home.',
        forYou: 'A fuller look than a daily check-in. For a condition with stages, the app may suggest a different stage from it, and only ever suggests.',
        takes: 'About ten minutes, every month or so',
        taps: ['Answer each question as it comes. Your answers are kept to compare with next time.'],
        destination: route('/assessment'),
      },
    ],
  },
  {
    key: 'food',
    name: 'Food',
    title: 'If food matters to you',
    opening:
      'Here is how Inside Story works for food. You tell it what you avoid and how you eat, then log what you eat as you go. The app works out what is in every meal for you and checks each ingredient against your conditions and allergies. Over time it shows what your days add up to, where your nutrients come from, and which foods tend to come before a better or worse day. The goal is to get what you need from food, with a supplement only for what food cannot supply.',
    firstResult:
      'What you get first: a few minutes in Profile, then your first meal logged, and you can see what that day adds up to in every nutrient. After a week of meals, Trends shows where your nutrients come from and what is missing.',
    entries: [
      fromItem(
        'aboutYou',
        'Add your birth date and sex in Profile.',
        'How much of each nutrient a person needs depends on age and sex, so the totals for each day are measured against the right amounts.',
        {
          when: 'start',
          takes: 'Under a minute',
          taps: ['Tap Personal Info to open it.', 'Fill in Birth date and Sex.'],
        },
      ),
      fromItem(
        'allergies',
        'List any food allergies in Profile.',
        'Lookups, recipes and meal plans mark what contains a listed allergen. The marking depends on how foods are labelled, so it helps you check and is never a promise that a food is safe.',
        {
          when: 'start',
          takes: 'About a minute',
          taps: ['Tap Conditions & Check-In to open it.', 'Under Food allergies, add each one.'],
        },
      ),
      fromItem(
        'eatingStyle',
        'Choose an eating style in Profile, if you follow one.',
        'Meal plans and recipe suggestions keep to it, whether that is vegetarian, paleo, Mediterranean or another.',
        {
          when: 'start',
          takes: 'Under a minute',
          taps: ['Tap Diet Preferences to open it.', 'Choose the way you eat.'],
        },
      ),
      fromItem(
        'meal',
        'Log what you eat, in Schedules under Meals, or from Log or Schedule in Food.',
        'Every meal logged is added up into the day\'s nutrients, and kept to line up later against how you felt.',
        {
          when: 'daily',
          leadsTo: 'Seven days of meals fill in Trends, and meals before a flare feed Pattern Finder.',
          takes: 'About a minute a meal',
          taps: [
            'Tap + Schedule a meal, then choose what you ate and the time.',
            'When it shows in the day\'s list, tap Log now.',
          ],
        },
      ),
      fromItem(
        'water',
        'Log what you drink, in Schedules under Hydration.',
        'Water counts toward the day as much as food does, and some timing advice depends on it.',
        {
          when: 'daily',
          takes: 'A few seconds a drink',
          taps: ['Tap + Schedule a drink, choose what and how much, and save it.'],
        },
      ),
      {
        key: 'todaysNutrients',
        when: 'daily',
        doThis: 'See what today adds up to, in Insights under Nutrients.',
        forYou: 'Each nutrient against what you need, saying how much came from food and how much from a supplement.',
        takes: 'A glance',
        taps: ['Read down the list. The ones still short for the day are the ones to eat toward.'],
        destination: insightsLens('nutrients'),
      },
      {
        key: 'voiceLog',
        when: 'whenItHappens',
        doThis: 'If typing a meal is a bother, say it instead with Say What You Ate, from Home.',
        forYou: 'You speak the meal, see what the app made of it, fix anything it got wrong, and log it.',
        takes: 'Under a minute',
        taps: ['Say what you ate, the way you would tell somebody.', 'Check what it heard, fix anything wrong, and log it.'],
        destination: route('/voice-log'),
      },
      {
        key: 'scannedProduct',
        record: 'scannedProduct',
        when: 'whenItHappens',
        doThis: 'Scan the barcode of anything packaged, in Food under Scan a Product.',
        forYou: 'The label comes in with its ingredients and nutrients, and the product can be logged like any other food.',
        takes: 'Under a minute',
        taps: ['Point the camera at the barcode.', 'When the label comes in, tap Log This as Eaten.'],
        destination: foodLens('scanProduct'),
      },
      {
        key: 'foodLookup',
        when: 'whenItHappens',
        doThis: 'Look up any food in Insights, under Food Lookup.',
        forYou: 'What is in it, and what it means for the conditions you chose, with the reasons spelled out.',
        takes: 'A few seconds',
        taps: ['Type the food\'s name.', 'Tap it in the list to see what is in it.'],
        destination: insightsLens('foodLookup'),
      },
      {
        key: 'safeFoods',
        record: 'safeFoods',
        when: 'whenItHappens',
        doThis: 'Mark foods that agree with you, and ones that do not, in Insights under Safe Foods.',
        forYou: 'A list of what you know about your body, kept apart from what the app says in general, and shown wherever those foods come up.',
        takes: 'A few seconds a food',
        taps: ['Find the food, and mark whether it agrees with you.'],
        destination: insightsLens('safeFoods'),
      },
      {
        key: 'nutrientTargets',
        record: 'nutrientTargets',
        when: 'whenItHappens',
        doThis: 'If your doctor or dietitian gave you a daily amount of protein, fiber or sodium, set it in Profile.',
        forYou: 'The day\'s gauges then measure against your figure instead of the general one.',
        takes: 'Under a minute',
        taps: ['Tap Nutrient Targets to open it.', 'Fill in the amount you were given.'],
        destination: profile,
      },
      fromItem(
        'trends',
        'Trends fills in once meals are logged on seven different days.',
        'Nutrients and variety across the days you logged, with food and supplement shown apart. A day with nothing logged shows as a gap, never as a day of eating nothing.',
        { when: 'onceThereIsData', taps: ['Tap a nutrient to see it across the days.'] },
      ),
      {
        key: 'whatYouEat',
        when: 'onceThereIsData',
        doThis: 'Look at what you eat over the weeks, in Trends under What You Eat.',
        forYou: 'How many different foods and food groups you ate each week, since variety is one of the things that helps the gut most.',
        taps: ['Tap a heading to open it.'],
        destination: trendsLens('variety'),
      },
      {
        key: 'eatingWindow',
        when: 'onceThereIsData',
        doThis: 'See when in the day you eat, in Trends under Eating Window.',
        forYou: 'The first and last meal of each day, drawn across the weeks.',
        taps: ['Read across the weeks.'],
        destination: trendsLens('eatingWindow'),
      },
      {
        key: 'systemRecipes',
        when: 'more',
        doThis: 'Browse the recipes in Food, under System Recipes.',
        forYou: 'Hundreds of home-cooked dishes, each with what it means for your conditions. Any of them can be opened in a builder and changed.',
        taps: ['Tap a heading to open it, then a recipe to see it.'],
        destination: foodLens('systemRecipes'),
      },
      {
        key: 'savedRecipe',
        record: 'savedRecipe',
        when: 'more',
        doThis: 'Build a dish from ingredients in Food, with the Meal builder or the ones for soups, salads, smoothies, sauces, baked goods and more.',
        forYou: 'Each ingredient is checked as you add it, and the whole dish gets a full report before you save it. A saved dish can be logged again with one tap.',
        takes: 'Five minutes or so',
        taps: ['Tap + Add Ingredient for each thing that goes in.', 'Give the dish a name and save it.'],
        destination: foodLens('mealBuilder'),
      },
      {
        key: 'mealPlan',
        record: 'mealPlan',
        when: 'more',
        doThis: 'Plan meals ahead, up to six weeks, in Schedules under Meal Plan.',
        forYou: 'A plan built around your conditions, allergies and eating style, rotating foods for variety, and put on your schedule with one tap.',
        leadsTo: 'The grocery list below is made from it.',
        takes: 'A few minutes',
        taps: ['Look over the days it suggests.', 'Tap Add to schedule on the ones you want.'],
        destination: scheduleLens('dailyMealPlan'),
      },
      {
        key: 'groceryList',
        record: 'groceryList',
        when: 'more',
        doThis: 'Make a grocery list from the meals you have planned, in Life under Grocery List.',
        forYou: 'Everything the planned days need, grouped for the shop. Record what you paid, and any item can compare two sizes or brands by price per kilo or litre. Shared with a partner when you pair.',
        takes: 'A minute',
        taps: ['Tap Build a Grocery List.', 'Tick things off as they go in the cart.'],
        destination: lifeLens('groceryList'),
      },
      {
        key: 'groceryPrices',
        when: 'more',
        doThis: 'Follow what food costs you, in Trends under Grocery Prices.',
        forYou: 'The prices you recorded on your lists, over time.',
        taps: ['Read across the months.'],
        destination: trendsLens('groceries'),
      },
      {
        key: 'fermentation',
        record: 'fermentation',
        when: 'more',
        doThis: 'If you ferment at home, build a ferment in Food under Fermentation and start a batch.',
        forYou: 'The batch is tracked from start to jar, and what is left is drawn down as you use it.',
        takes: 'Five minutes or so',
        taps: ['Tap + Add Ingredient for each thing that goes in.', 'Tap Start Tracking a Batch.'],
        destination: foodLens('fermentationBuilder'),
      },
    ],
  },
  {
    key: 'movement',
    name: 'Movement',
    title: 'If movement matters to you',
    opening:
      'Here is how Inside Story works for movement. Log what you do, or let your phone count your steps, and the app lays it out across the weeks beside how you felt. It counts what happened and never sets you a target.',
    firstResult:
      'What you get first: a walk logged in under a minute. Connect your phone\'s health store once and steps come in by themselves, and after a week Trends lays your movement beside how you felt.',
    entries: [
      {
        key: 'healthConnect',
        record: 'healthConnect',
        when: 'start',
        doThis: 'Connect your phone\'s health store, in Life under Movement, if another app or a watch counts your steps or sleep.',
        forYou: 'Steps and sleep come in by themselves, each one a separate choice. Steps reach Trends and Pattern Finder.',
        takes: 'A couple of minutes',
        taps: ['Turn on steps, sleep, or both.', 'Say yes when the phone asks whether Inside Story may read them.'],
        destination: lifeLens('movement'),
      },
      fromItem(
        'exercise',
        'Log some movement from Home. A walk counts.',
        'What you did and for how long, kept beside the check-ins that follow it.',
        {
          when: 'daily',
          leadsTo: 'Seven days of it fill in Trends.',
          takes: 'Under a minute',
          taps: ['Tap Log exercise.', 'Choose what you did and for how long, and save.'],
        },
      ),
      {
        key: 'signalsExercise',
        when: 'whenItHappens',
        doThis: 'Log movement with more detail, in Signals under Exercise.',
        forYou: 'The kind of exercise, how hard, and how you felt after.',
        takes: 'About a minute',
        taps: ['Tap + Log exercise.', 'Fill in what you did, how hard, and how you felt, and save.'],
        destination: signalsLens('exercise'),
      },
      fromItem(
        'movementTrend',
        'Trends shows your movement once it is logged on seven different days.',
        'Movement across the weeks, beside how you felt on the same days.',
        { when: 'onceThereIsData', taps: ['Read across the weeks.'] },
      ),
      {
        key: 'scheduleExercise',
        when: 'more',
        doThis: 'Plan movement ahead, in Schedules under Exercise.',
        forYou: 'A reminder when it is due, and one tap to mark it done.',
        takes: 'About a minute',
        taps: ['Add what you plan to do and when.', 'On the day, tap Done today.'],
        destination: scheduleLens('exercise'),
      },
    ],
  },
  {
    key: 'home',
    name: 'Home',
    title: 'If keeping the house running matters to you',
    opening:
      'Here is how Inside Story works for the house. Anything that comes round now and then gets written down once and reminds you when it is due. Anything you might wonder about later, like whether the door is locked or where the spare keys went, gets one tap or one line when it happens, so the answer is waiting when you need it.',
    firstResult:
      'What you get first: one thing like locking the door set up in a minute, and from then on one tap each time answers "did I?" with the time. One upkeep job written down once reminds you every time it comes round.',
    entries: [
      fromItem(
        'didIDoIt',
        'Add something you tend to wonder whether you did, like locking the door, in Life under Did I Do It.',
        'One tap when you do it, and later the answer is there, with the time.',
        {
          when: 'start',
          takes: 'Under a minute',
          taps: ['Tap + Add something to check.', 'Name it, like Front door locked, and save.'],
        },
      ),
      fromItem(
        'upkeep',
        'Add one thing that needs doing now and then, like changing a filter, in Life under Upkeep.',
        'It comes round on the schedule you set and says so when it is due, so it can be out of your head until then.',
        {
          when: 'start',
          leadsTo: 'Each one shows in Schedules under Upkeep, and marking it done feeds Keeping Up on Trends.',
          takes: 'About a minute for each',
          taps: ['Tap + Add something.', 'Say what it is and how often it comes round, then tap Add it.'],
        },
      ),
      {
        key: 'doneMark',
        record: 'doneMark',
        when: 'daily',
        doThis: 'Tap it each time you do it, in Life under Did I Do It.',
        forYou: 'The time is kept, so the question has an answer.',
        takes: 'One tap',
        taps: ['Tap the thing you just did.'],
        destination: lifeLens('didIDoIt'),
      },
      {
        key: 'upkeepDone',
        record: 'upkeepDone',
        when: 'whenItHappens',
        doThis: 'Mark upkeep done when you do it, in Schedules under Upkeep.',
        forYou: 'The next due date moves on from the day you did it, and the history is kept.',
        takes: 'One tap',
        taps: ['Tap Done today on the job you did.'],
        destination: scheduleLens('upkeep'),
      },
      {
        key: 'whereIsIt',
        when: 'whenItHappens',
        doThis: 'Ask Where Is It, from Home, the next time something goes missing.',
        forYou: 'One search across the kitchen, your notes and the garden, each answer with its age.',
        takes: 'A few seconds',
        taps: ['Type what you are looking for.'],
        destination: route('/where-is-it'),
      },
      fromItem(
        'daysUntil',
        'Count down to something coming up, like a delivery or a visit, in Life under Days Until.',
        'The days left, with a reminder on the day it lands.',
        {
          when: 'whenItHappens',
          takes: 'Under a minute',
          taps: ['Tap + Add a Days Until Counter.', 'Name it, choose the date, and tap Start Counting.'],
        },
      ),
      fromItem(
        'keepingUp',
        'Keeping Up on Trends fills in once something is marked on seven different days.',
        'Upkeep kept, things marked done and routines run, across the weeks. It counts what happened and scores nobody.',
        { when: 'onceThereIsData', taps: ['Read across the weeks.'] },
      ),
      fromItem(
        'kitchen',
        'Note where things in the kitchen are kept, in Life under Kitchen.',
        'What you have on hand and where it is, drawn down as meals use it.',
        {
          when: 'more',
          leadsTo: 'Where Is It searches these.',
          takes: 'A minute for each thing',
          taps: ['Tap Add Something.', 'Name it, say where it is kept, and save.'],
        },
      ),
    ],
  },
  {
    key: 'garden',
    name: 'Garden',
    title: 'If your garden matters to you',
    opening:
      'Here is how Inside Story works for a garden, whether it is a field, a raised bed or a pot on a windowsill, indoors or out. Everything hangs off a garden area: what grows there, what it needs, what it cost and what it gave back. What you harvest can go straight into your meals.',
    firstResult:
      'What you get first: one garden area and one planting, about five minutes, and the planting carries its dates so jobs, counters and harvests follow from it. Everything else in the garden hangs off those two.',
    entries: [
      fromItem(
        'gardenArea',
        'Add a garden area in Garden, under Plots & Plantings.',
        'An outdoor area asks about the sun, an indoor one about its lights, and a greenhouse about both.',
        {
          when: 'start',
          leadsTo: 'Everything below is recorded under an area.',
          takes: 'A couple of minutes',
          taps: ['Tap + Add a Garden Area.', 'Name it, say whether it is outdoors, indoors or a greenhouse, and save.'],
        },
      ),
      fromItem(
        'planting',
        'Record something growing in the area, in Garden under Plots & Plantings.',
        'A planting carries its dates, so tasks, counters and harvests follow from it.',
        {
          when: 'start',
          takes: 'A couple of minutes',
          taps: ['Open the area.', 'Tap + Add a Planting, say what it is and when it went in, and save.'],
        },
      ),
      {
        key: 'myZone',
        when: 'start',
        doThis: 'Find your growing zone in Garden, under My Zone.',
        forYou: 'Your frost dates and what can go in the ground when.',
        takes: 'A minute',
        taps: ['Fill in where you are, and read what it says.'],
        destination: gardenLens('myZone'),
      },
      {
        key: 'gardenTask',
        record: 'gardenTask',
        when: 'daily',
        doThis: 'Add garden jobs in Garden, under Upcoming Tasks, and do them as they come due.',
        forYou: 'Watering, feeding and planting out, each with a reminder.',
        takes: 'A minute to add one',
        taps: ['Add the job and when it is due.', 'Mark it done when you do it.'],
        destination: gardenLens('upcomingTasks'),
      },
      fromItem(
        'harvest',
        'Log a harvest when one comes, in Garden under Harvest Log.',
        'What each area grew, by weight or by count.',
        {
          when: 'whenItHappens',
          leadsTo: 'Garden Yield on Trends draws from these.',
          takes: 'Under a minute',
          taps: ['Tap + Add a Harvest.', 'Choose the planting, say how much, and save.'],
        },
      ),
      {
        key: 'harvestUse',
        record: 'harvestUse',
        when: 'whenItHappens',
        doThis: 'When a meal uses something from the garden, say yes when the app offers to take it off what you have.',
        forYou: 'What is left on hand stays right, and the meal carries where its food came from.',
        takes: 'One tap',
        taps: ['After saving a meal, answer yes when it asks about the garden.'],
        destination: scheduleLens('meals'),
      },
      {
        key: 'harvestGift',
        record: 'harvestGift',
        when: 'whenItHappens',
        doThis: 'Record produce somebody gave you from their garden, in Garden under Harvest Log.',
        forYou: 'Kept apart from what you grew, and added to your kitchen.',
        takes: 'Under a minute',
        taps: ['Add it as a gift, with who it came from and how much.'],
        destination: gardenLens('harvestLog'),
      },
      {
        key: 'gardenCountdown',
        record: 'gardenCountdown',
        when: 'whenItHappens',
        doThis: 'Count the days to something, like first harvest, in Garden under Days Until.',
        forYou: 'A counter tied to the area or the planting, with a reminder on the day.',
        takes: 'Under a minute',
        taps: ['Tap + Add a Days Until Counter.', 'Choose the area, name it, pick the date, and tap Start Counting.'],
        destination: gardenLens('daysUntil'),
      },
      {
        key: 'gardenReading',
        record: 'gardenReading',
        when: 'whenItHappens',
        doThis: 'Record readings like soil moisture, temperature or rain, in Garden under Growing Conditions.',
        forYou: 'The figures, by area, kept as a record you can look back through.',
        leadsTo: 'Trends, under Growing Conditions, draws them by month.',
        takes: 'Under a minute',
        taps: ['Tap + Record a Reading.', 'Choose the area, what you measured and the figure, and save.'],
        destination: gardenLens('growingConditions'),
      },
      {
        key: 'gardenCost',
        record: 'gardenCost',
        when: 'whenItHappens',
        doThis: 'Record what the garden costs, in Garden under Growing Costs.',
        forYou: 'Seeds, soil, tools and the rest, kept per area or per group of areas.',
        takes: 'Under a minute',
        taps: ['Tap + Add a Cost.', 'Choose the area, what it was and what it cost, and save.'],
        destination: gardenLens('growingCosts'),
      },
      {
        key: 'gardenYield',
        when: 'onceThereIsData',
        doThis: 'See what the garden gave, in Trends under Garden Yield.',
        forYou: 'Harvests by month and by crop, and what they saved you where you have recorded prices for the same food.',
        taps: ['Read across the months.'],
        destination: trendsLens('harvest'),
      },
      {
        key: 'conditionsTrend',
        when: 'onceThereIsData',
        doThis: 'See your readings over the months, in Trends under Growing Conditions.',
        forYou: 'Rain and water given are added up, and everything else is shown with its lowest and highest.',
        taps: ['Read across the months.'],
        destination: trendsLens('conditions'),
      },
      {
        key: 'gardenSetup',
        record: 'gardenSetup',
        when: 'more',
        doThis: 'Record what an area runs on in its Grow Setup: lights, containers, fans, a hydroponic system, meters, whatever it uses.',
        forYou: 'What each piece cost, what it costs to keep running, and which pieces are no longer in use.',
        takes: 'A minute for each piece',
        taps: ['Open the area.', 'Tap + Add to the Setup for each piece.'],
        destination: gardenLens('plotsAndPlantings'),
      },
      {
        key: 'electricity',
        record: 'electricity',
        when: 'more',
        doThis: 'If you grow under lights, add your electricity bills in Garden under Growing Costs, starting with one from before the grow.',
        forYou: 'Each bill after it is compared per day with the one before, so you can see what the lights add.',
        takes: 'A minute for each bill',
        taps: ['Find the Electricity heading.', 'Tap + Add a Bill, starting with one from before the grow.'],
        destination: gardenLens('growingCosts'),
      },
      {
        key: 'compost',
        record: 'compost',
        when: 'more',
        doThis: 'Start a compost pile in Garden, under Compost.',
        forYou: 'When it was turned, what went in, and which area it feeds.',
        takes: 'A minute',
        taps: ['Tap + Start a Pile.', 'Name it, and say which area it feeds.'],
        destination: gardenLens('compost'),
      },
      {
        key: 'horticulture',
        when: 'more',
        doThis: 'Read about growing in Garden, under Horticulture.',
        forYou: 'Soil, composting, companion planting and growing food, written for home gardeners.',
        taps: ['Tap a heading to open it, then tap an article to read it.'],
        destination: gardenLens('horticulture'),
      },
    ],
  },
  {
    key: 'money',
    name: 'Money',
    title: 'If money matters to you',
    opening:
      'Here is how Inside Story works for money. Bills that come round on their own get written down once, and spending gets recorded against the day it happened. The app only ever counts what you entered, and never guesses at a month you did not.',
    firstResult:
      'What you get first: your monthly bills written down once, a few minutes each, and from then on each one shows before it comes due. Spending recorded as it happens shows by month once two months have some.',
    entries: [
      fromItem(
        'bills',
        'Add a bill that comes every month, in Life under Finances, then Bills & Income.',
        'It shows when it is coming up, so it is not a surprise.',
        {
          when: 'start',
          takes: 'A couple of minutes for each',
          taps: ['Tap Bills & Income.', 'Tap + Add a bill, fill in what and when, and save.'],
        },
      ),
      fromItem(
        'spending',
        'Record something you spent, in Life under Finances, then Spending.',
        'Spending by day and by kind.',
        {
          when: 'daily',
          leadsTo: 'What It Costs on Trends draws from these.',
          takes: 'Under a minute',
          taps: ['Tap Spending.', 'Tap + Record something, fill in what and how much, and save.'],
        },
      ),
      {
        key: 'medicalBill',
        record: 'medicalBill',
        when: 'whenItHappens',
        doThis: 'Record a medical bill in Life under Finances, then Health.',
        forYou: 'What was billed, what insurance paid and what you still owe, counted toward the plan\'s limits.',
        takes: 'A couple of minutes',
        taps: ['Tap Health.', 'Tap + Add a bill and fill it in from the statement.'],
        destination: lifeLens('finances'),
      },
      fromItem(
        'whatItCosts',
        'What It Costs on Trends compares one month with another once two months have spending recorded.',
        'Spending by month, including what the garden and your health cost, from what you recorded against a day.',
        { when: 'onceThereIsData', taps: ['Read across the months.'] },
      ),
      {
        key: 'insurancePlan',
        record: 'insurancePlan',
        when: 'more',
        doThis: 'Add your health insurance plan, in Life under Finances, then Health.',
        forYou: 'How much of the deductible and the out-of-pocket limit is met so far this year.',
        takes: 'A few minutes',
        taps: ['Tap Health.', 'Tap Add my plan and fill it in from your plan papers.'],
        destination: lifeLens('finances'),
      },
      {
        key: 'accounts',
        record: 'accounts',
        when: 'more',
        doThis: 'Add your accounts and what they hold or owe, in Life under Finances, then Accounts.',
        forYou: 'Balances in one place, with their history as you update them.',
        takes: 'A minute for each',
        taps: ['Tap Accounts.', 'Tap + Add an account and fill in its balance.'],
        destination: lifeLens('finances'),
      },
      {
        key: 'goals',
        record: 'goals',
        when: 'more',
        doThis: 'Set something you are saving for, in Life under Finances, then Goals.',
        forYou: 'What it costs, what is put toward it, and the date you are aiming for.',
        takes: 'A minute',
        taps: ['Tap Goals.', 'Tap + Add a goal, say what it is, what it costs and when, and save.'],
        destination: lifeLens('finances'),
      },
    ],
  },
  {
    key: 'routines',
    name: 'Routines',
    title: 'If routines matter to you',
    opening:
      'Here is how Inside Story works for the shape of your days. Anything that needs remembering gets written down once, so it stops taking up room in your head. Routines hold their parts in order and keep your place. The app can remind you before a thing rather than at it, and counts what happened without ever scoring you.',
    firstResult:
      'What you get first: one routine, like getting ready in the morning, written down in about five minutes. From then on Walk it shows one part at a time and keeps your place if you stop.',
    entries: [
      fromItem(
        'routine',
        'Set up a routine, such as getting ready in the morning, in Life under Routines.',
        'The routine holds its parts in order so you do not have to.',
        {
          when: 'start',
          takes: 'About five minutes',
          taps: [
            'Tap + Add a routine and give it a name.',
            'Tap + Add a step for each part, in the order you do them.',
          ],
        },
      ),
      {
        key: 'reminders',
        when: 'start',
        doThis: 'Choose which reminders you get and set quiet hours, in Profile under Reminders.',
        forYou: 'Reminders for meals, water, doses and dated things, only the ones you want, and none during the hours you keep quiet.',
        takes: 'A couple of minutes',
        taps: ['Tap Reminders to open it.', 'Turn on the ones you want.', 'Tap Quiet hours, then set From and Until.'],
        destination: profile,
      },
      fromItem(
        'neuro',
        'If autism, ADHD or dyslexia is part of your life, add it in Profile.',
        'It switches on settings like a quieter Home and reminders that come ahead of time. It never changes what the app says about food.',
        {
          when: 'start',
          takes: 'Under a minute',
          taps: ['Tap Conditions & Check-In to open it.', 'Choose any that are part of your life.'],
        },
      ),
      {
        key: 'routineRun',
        record: 'routineRun',
        when: 'daily',
        doThis: 'Walk through the routine, in Life under Routines.',
        forYou: 'One part on the screen at a time, and if you stop partway it remembers where.',
        takes: 'As long as the routine takes',
        taps: ['Tap Walk it on the routine.', 'Move on to each part as you finish the one before it.'],
        destination: lifeLens('routines'),
      },
      fromItem(
        'capture',
        'Write down whatever comes to mind in Capture, from Home.',
        'Out of your head and into one inbox, to sort now, later or never.',
        {
          when: 'daily',
          takes: 'A few seconds',
          taps: ['Type the thought into the box at the top, and save it.'],
        },
      ),
      fromItem(
        'didIDoIt',
        'Add something you tend to wonder whether you did, in Life under Did I Do It.',
        'One tap when you do it, and the answer is there later.',
        {
          when: 'daily',
          takes: 'Under a minute to add, one tap each time',
          taps: ['Tap + Add something to check, name it, and save.', 'Tap it each time you do it.'],
        },
      ),
      fromItem(
        'daysUntil',
        'Count down to something coming up, in Life under Days Until.',
        'A date you are waiting for, in days, with a reminder on the day it lands.',
        {
          when: 'whenItHappens',
          takes: 'Under a minute',
          taps: ['Tap + Add a Days Until Counter.', 'Name it, choose the date, and tap Start Counting.'],
        },
      ),
      fromItem(
        'keepingUp',
        'Keeping Up on Trends fills in once something is marked on seven different days.',
        'Routines run and things marked done, across the weeks. It counts what happened and scores nobody.',
        { when: 'onceThereIsData', taps: ['Read across the weeks.'] },
      ),
    ],
  },
  {
    key: 'work',
    name: 'Work',
    title: 'If work matters to you',
    opening:
      'Here is how Inside Story works for work. It keeps track of two things your job gives you besides pay: the benefits it makes available, which are easy to leave unclaimed, and how the work itself has been going, a week at a time.',
    firstResult:
      'What you get first: one benefit written down in a couple of minutes, with how much there is and when it resets, so it does not run out unnoticed. A minute at the end of each week keeps how work has been going.',
    entries: [
      fromItem(
        'workBenefits',
        'Add a benefit your work offers, in Life under Work.',
        'Amounts, what is used, and when it resets, so nothing runs out unnoticed. Worth Asking holds questions to take to your employer.',
        {
          when: 'start',
          takes: 'A couple of minutes for each',
          taps: ['Tap + Add something you get.', 'Say what it is, how much, and when it resets, and save.'],
        },
      ),
      fromItem(
        'workCheckin',
        'Note how the week went, in Life under Work.',
        'A week at a time, so how work has been going is there to look back on.',
        {
          when: 'daily',
          takes: 'A minute, once a week',
          taps: ['Answer the few questions about the week.', 'Tap Save this week.'],
        },
      ),
      fromItem(
        'daysUntil',
        'Count down to a deadline or a day off, in Life under Days Until.',
        'The days left, with a reminder on the day.',
        {
          when: 'whenItHappens',
          takes: 'Under a minute',
          taps: ['Tap + Add a Days Until Counter.', 'Name it, choose the date, and tap Start Counting.'],
        },
      ),
    ],
  },
  {
    key: 'family',
    name: 'Family',
    title: 'If your family matters to you',
    opening:
      'Here is how Inside Story works for the people you look after. Each person you add can have their conditions noted, and anyone included in the meal plan shapes what gets planned, so the food suits everybody at the table.',
    firstResult:
      'What you get first: one family member added with their conditions, a few minutes, and the next meal plan suits them as well as you.',
    entries: [
      fromItem(
        'familyMember',
        'Add someone in your family, in Life under Conditions.',
        'They get a separate list there, apart from yours.',
        {
          when: 'start',
          takes: 'A minute',
          taps: ['Tap + Add a family member.', 'Give their name and save.'],
        },
      ),
      fromItem(
        'familyConditions',
        'Note any conditions they have, in Life under Conditions.',
        'The reading for their conditions sits in their list.',
        {
          when: 'start',
          takes: 'A minute',
          taps: ['Open their entry.', 'Choose each condition they have.'],
        },
      ),
      {
        key: 'familyInMealPlan',
        record: 'familyInMealPlan',
        when: 'start',
        doThis: 'Include them in the meal plan, with the switch beside their name in Life under Conditions.',
        forYou: 'The meal plan then accounts for their conditions as well as yours.',
        leadsTo: 'Schedules, under Meal Plan, uses it next time you plan.',
        takes: 'One tap',
        taps: ['Turn on Plan meals around their conditions.'],
        destination: lifeLens('conditions'),
      },
      fromItem(
        'daysUntil',
        'Count down to a birthday, a visit or the start of school, in Life under Days Until.',
        'The days left, with a reminder on the day it lands.',
        {
          when: 'whenItHappens',
          takes: 'Under a minute',
          taps: ['Tap + Add a Days Until Counter.', 'Name it, choose the date, and tap Start Counting.'],
        },
      ),
      {
        key: 'connectionFamily',
        record: 'connection',
        when: 'more',
        doThis: 'If a partner uses Inside Story too, pair with them in Profile under Connections.',
        forYou: 'The grocery list is shared between you, and recipes can be sent across. Health records stay with each person.',
        takes: 'A few minutes, with them beside you',
        taps: [
          'Tap Pair With a Partner.',
          'On their phone, they open the same screen and tap Scan Their Code, then point it at the code on yours.',
        ],
        destination: route('/connections'),
      },
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

// HOW TO GET THERE, FOR STEP BY STEP.

const HUB = 'Tap the round button at the bottom of the screen';

export const TAB_NAMES: Record<string, string> = {
  '/life': 'Life',
  '/schedule': 'Schedules',
  '/trends': 'Trends',
  '/garden': 'Garden',
  '/insights': 'Insights',
  '/food': 'Food',
  '/log': 'Signals',
  '/reports': 'Reports',
  '/profile': 'Profile',
};

// What each lens is called on screen, which the test checks against the tab
// screens so a renamed lens cannot leave a guide pointing at an old name.
export const LENS_NAMES: Record<string, Record<string, string>> = {
  '/life': {
    groceryList: 'Grocery List',
    conditions: 'Conditions',
    healthLiteracy: 'Health Literacy',
    earthMatters: 'Earth Matters',
    searchReading: 'Search Reading',
    finances: 'Finances',
    work: 'Work',
    upkeep: 'Upkeep',
    emergency: 'Emergency',
    myMeds: 'My Meds',
    kitchen: 'Kitchen',
    movement: 'Movement',
    routines: 'Routines',
    didIDoIt: 'Did I Do It',
    daysUntil: 'Days Until',
  },
  '/schedule': {
    meals: 'Meals',
    hydration: 'Hydration',
    meds: 'Meds',
    appointments: 'Appointments',
    upkeep: 'Upkeep',
    exercise: 'Exercise',
    dailyMealPlan: 'Meal Plan',
  },
  '/trends': {
    nutrients: 'Nutrients',
    variety: 'What You Eat',
    symptoms: 'Symptoms & Flares',
    eatingWindow: 'Eating Window',
    movement: 'Movement',
    groceries: 'Grocery Prices',
    keepingUp: 'Keeping Up',
    harvest: 'Garden Yield',
    conditions: 'Growing Conditions',
    cost: 'What It Costs',
    patterns: 'Pattern Finder',
  },
  '/garden': {
    myZone: 'My Zone',
    plotsAndPlantings: 'Plots & Plantings',
    daysUntil: 'Days Until',
    harvestLog: 'Harvest Log',
    upcomingTasks: 'Upcoming Tasks',
    compost: 'Compost',
    growingConditions: 'Growing Conditions',
    growingCosts: 'Growing Costs',
    horticulture: 'Horticulture',
  },
  '/insights': {
    nutrients: 'Nutrients',
    foodLookup: 'Food Lookup',
    safeFoods: 'Safe Foods',
    healingStage: 'Healing Stage',
    labs: 'Labs',
    myMeds: 'My Meds & Interactions',
  },
  '/food': {
    scanProduct: 'Scan a Product',
    mealBuilder: 'Meal',
    fermentationBuilder: 'Fermentation',
    systemRecipes: 'System Recipes',
  },
  '/log': {
    flares: 'Flares',
    foodReactions: 'Food Reactions',
    newFoods: 'New Foods',
    exercise: 'Exercise',
    bloodPressure: 'Blood Pressure',
    therapies: 'Hands-On Therapies',
  },
};

// Lenses reached from the small bookmarks button rather than the corner one.
const MY_ITEMS_LENSES: Record<string, string[]> = { '/food': ['systemRecipes'] };

// Screens opened from a band on Home: the band's name and its button.
const FROM_HOME: Record<string, [string, string]> = {
  '/capture': ['Capture', 'Type it'],
  '/where-is-it': ['Where Is It', 'Look something up'],
  '/voice-log': ['Say What You Ate', 'Say it'],
  '/assessment': ['Symptom Check-In', 'the button on it'],
};

const GO_HOME = `${HUB} and choose Home.`;

// How to reach a destination from anywhere in the app, built from the
// destination itself so it always matches where Go there goes.
export function navigationLine(destination: StoryDestination): string | null {
  if (destination.kind === 'beats') return null;
  if (destination.kind === 'home') return `${GO_HOME} The check-in card is near the top.`;
  if (destination.kind === 'quickLog') return `${GO_HOME} The button is near the top.`;
  const { pathname, params } = destination;
  if (pathname === '/connections') return `${HUB} and choose Profile. Tap Connections to open it, then tap Manage Connections.`;
  const home = FROM_HOME[pathname];
  if (home) {
    const [band, button] = home;
    const tap = button.startsWith('the ') ? `tap ${button}` : `tap ${button}`;
    return `${GO_HOME} Find ${band} and ${tap}.`;
  }
  const tab = TAB_NAMES[pathname];
  if (!tab) return null;
  const lens = params ? Object.values(params)[0] : undefined;
  const lensName = lens ? LENS_NAMES[pathname]?.[lens] : undefined;
  if (!lens || !lensName) return `${HUB} and choose ${tab}.`;
  if (MY_ITEMS_LENSES[pathname]?.includes(lens)) {
    return `${HUB} and choose ${tab}. Then tap the small bookmarks button just to the left of it, and choose ${lensName}.`;
  }
  return `${HUB} and choose ${tab}. Then tap the button in the bottom-left corner and choose ${lensName}.`;
}

// How often and how long, in one line.
export function cadenceLine(entry: GuideEntry): string {
  const cadence = WHEN_CADENCE[entry.when];
  return entry.takes ? `${cadence}. ${entry.takes}.` : `${cadence}.`;
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
  // The guide shown earlier that writes this step out in full, when this
  // guide only points to it.
  sharedWith: GuideKey | null;
};

export type GuideGroupView = {
  when: GuideWhen;
  heading: string;
  entries: GuideEntryView[];
};

export type GuideView = {
  def: GuideDef;
  entries: GuideEntryView[];
  groups: GuideGroupView[];
};

export type GuideRecords = Partial<Record<GuideRecordKey, string | null>>;

function stateOfItem(state: ItemState): GuideEntryState {
  if (state === 'done') return 'done';
  if (state === 'setAside') return 'setAside';
  return 'open';
}

// Two entries are the same step when they share an item, a record, or a key.
function sameStepKey(entry: GuideEntry): string {
  if (entry.item) return `item:${entry.item}`;
  if (entry.record) return `record:${entry.record}`;
  return `key:${entry.key}`;
}

// The Basics first, then one guide per part of life chosen, in the order
// the parts are listed on the Front Page.
export function guidesFor(beats: readonly BeatKey[]): GuideDef[] {
  return [GUIDE_BY_KEY.basics, ...ALL_BEATS.filter((beat) => beats.includes(beat)).map((beat) => GUIDE_BY_KEY[beat])];
}

export function guideName(key: GuideKey): string {
  return key === 'basics' ? 'The Basics' : `the ${BEAT_LABELS[key]} guide`;
}

// Short: a step written out in an earlier guide is pointed to.
export function sharedLine(key: GuideKey): string {
  return `Written out in ${guideName(key)}.`;
}

// Step by step: the step is written out again, and says where else it is.
export function alsoInLine(key: GuideKey): string {
  return `This is also in ${guideName(key)}.`;
}

export function buildGuides(facts: YourStoryFacts, records: GuideRecords): GuideView[] {
  const firstSeen = new Map<string, GuideKey>();
  return guidesFor(facts.beats).map((def) => {
    const entries = def.entries.map((entry): GuideEntryView => {
      const stepKey = sameStepKey(entry);
      const earlier = firstSeen.get(stepKey);
      if (!earlier) firstSeen.set(stepKey, def.key);
      const sharedWith = earlier && earlier !== def.key ? earlier : null;
      if (entry.item) {
        const item = evaluateItem(ITEM_BY_KEY[entry.item], facts);
        return { entry, state: stateOfItem(item.state), dateline: item.dateline, note: item.note, sharedWith };
      }
      if (entry.record) {
        const on = records[entry.record] ?? null;
        return { entry, state: on ? 'done' : 'open', dateline: on ? `Since ${storyDate(on)}` : null, note: null, sharedWith };
      }
      return { entry, state: 'reading', dateline: null, note: null, sharedWith };
    });
    const groups = GUIDE_WHEN_ORDER.map((when) => ({
      when,
      heading: GUIDE_WHEN_HEADINGS[when],
      entries: entries.filter((view) => view.entry.when === when),
    })).filter((group) => group.entries.length > 0);
    // Entries read in group order, so the step-by-step walk and the list agree.
    return { def, entries: groups.flatMap((group) => group.entries), groups };
  });
}

// A step the Home card may point into: something to set up first or to do
// every day, still open, and written out in this guide.
function isNearStep(view: GuideEntryView): boolean {
  return view.state === 'open' && !view.sharedWith && (view.entry.when === 'start' || view.entry.when === 'daily');
}

// The guide the Home card points into: the one writing out the next thing
// Your Story asks for, when that is a first or everyday step, or failing
// that the first guide with such a step still open. Never a step that is
// only more depth.
export function currentGuideKey(view: YourStoryView, guides: GuideView[]): GuideKey | null {
  const next = view.nextItem?.def.key;
  if (next) {
    const holding = guides.find((guide) => guide.entries.some((entry) => entry.entry.item === next && isNearStep(entry)));
    if (holding) return holding.def.key;
  }
  const open = guides.find((guide) => guide.entries.some(isNearStep));
  return open?.def.key ?? null;
}

// Where the step-by-step walk starts: the first near step still open, then
// any open step, then the top.
export function firstStepIndex(guide: GuideView): number {
  const near = guide.entries.findIndex(isNearStep);
  if (near >= 0) return near;
  const open = guide.entries.findIndex((entry) => entry.state === 'open' && !entry.sharedWith);
  return open >= 0 ? open : 0;
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
  'One guide for each part of your life you chose, plus The Basics. Each one starts with what to set up first and what to do every day, then what to do when something happens, and what fills in once there are a few weeks of records. Every line takes you straight there.';
export const READ_LABEL = 'Have a look';

// THE TWO WAYS OF WRITING.

export type GuideStyle = 'short' | 'steps';

export const GUIDE_STYLE_QUESTION = 'How would you like these written?';
export const GUIDE_STYLE_LABELS: Record<GuideStyle, string> = { short: 'Short', steps: 'Step by step' };
export const GUIDE_STYLE_CAPTIONS: Record<GuideStyle, string> = {
  short: 'Each thing in a line or two, grouped by when it matters.',
  steps: 'One thing at a time, with how long it takes, how to get there, and every tap once you are there.',
};
export const GUIDE_STYLE_CHANGE_LINE = 'This can be changed here any time.';
export const STEP_NEXT_LABEL = 'Next';
export const STEP_BACK_LABEL = 'Back';
export const SHOW_ALL_LABEL = 'Show the whole list';
export const SHOW_ONE_LABEL = 'One at a time';
export const HOW_TO_GET_THERE = 'How to get there';
export const ONCE_THERE = 'Once you are there';

export function isGuideStyle(value: string | null | undefined): value is GuideStyle {
  return value === 'short' || value === 'steps';
}

// Only an item that applies to the chosen parts of life can be the next
// thing, so this is here for the test: every Your Story item that applies
// has a place in at least one guide the person sees.
export function itemsWithoutAGuide(beats: readonly BeatKey[]): YourStoryItemKey[] {
  const shown = new Set(guidesFor(beats).flatMap((guide) => guide.entries.map((entry) => entry.item).filter(Boolean)));
  return (Object.keys(ITEM_BY_KEY) as YourStoryItemKey[]).filter(
    (key) => itemApplies(ITEM_BY_KEY[key], beats) && !shown.has(key),
  );
}
