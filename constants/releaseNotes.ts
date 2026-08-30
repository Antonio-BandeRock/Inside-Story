// What actually changed, per version, in plain language a person reading
// it can act on.
//
// 2026-08-29, direct report after the first successful OTA update ever
// reached a phone: "When the user checks for updates, the app just
// restarts. It doesn't give any warning about what is going to happen, or
// what to do when it starts again, or if an update was applied or if
// there was any update at all... Please make sure the user is aware of
// what will happen, or has happened, and provide a informational thing
// after the update is applied to tell that an update was actually
// applied, and what did that update include for changes."
//
// This file is the "what did that update include" half. The version
// number changing on screen (see constants/version.ts and
// components/VersionLabel.tsx) proved an update landed, but proved
// nothing about WHAT landed, which is the part that actually matters to
// someone using the app rather than building it.
//
// Named honestly rather than faked: this starts at the versions below,
// not at 1.0.0. Writing a plausible-sounding changelog for the ~100
// earlier versions after the fact would mean inventing history, against
// this project's own standing evidence-honesty rule. A version with no
// entry here is handled gracefully at the display end (see
// getReleaseNotesSince), never shown as an empty or invented list.
//
// STANDING MAINTENANCE RULE, the same discipline APP_VERSION itself
// already carries (see constants/version.ts): whenever a version bump
// ships something a person would actually notice, add its entry here in
// the same pass. A purely internal bump (a build-mechanism fix, a test
// publish) correctly gets no entry, and the display end handles that.
export type ReleaseNote = {
  version: string;
  /** YYYY-MM-DD, the date this version actually shipped. */
  date: string;
  /** One plain-language line per change, written for the person using the app. */
  changes: string[];
};

// Newest first. getReleaseNotesSince below relies on this ordering to
// show the most recent change at the top when several versions are
// caught up on at once.
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.31.15',
    date: '2026-08-30',
    changes: [
      "Fixed: setting up a 6-week meal plan also filled Saved Sides, Saved Salads, Saved Soups and the rest with dishes you never built. Scheduling a meal has to keep a real saved copy of each part so it can be rebuilt on the day, and those copies were showing up as your own work. They no longer do, and the ones already there have been cleared out. Anything you built yourself is untouched.",
      "The Digest label on the Home screen now sits at the same height as the corner label on every other tab.",
      "The tab menus no longer open by themselves when you switch tabs. Instead each tab now shows a box at the top telling you which button to tap to pick a tool.",
      "The version number moved to the lower right, centred under the box that tells you where you are.",
    ],
  },
  {
    version: '1.0.31.14',
    date: '2026-08-30',
    changes: [
      "Saying a food the database spells differently now works. \"Green eggs\" found nothing, because the app searched for that exact phrase and gave up. It now tries the whole phrase first, then drops words off the front until something matches, so green eggs finds eggs and mixed vegetables finds vegetables.",
      "\"With\" now separates two foods the same way \"and\" does, so \"ham with mixed vegetables\" is two things rather than one.",
      "The label under the corner menu icon no longer jumps down when you open the menu. It now sits where it always sat when open, whether the menu is open or not.",
    ],
  },
  {
    version: '1.0.31.13',
    date: '2026-08-30',
    changes: [
      "Saying a list of foods now works. \"Scrambled eggs and ham and bacon\" came back as nothing matched, because the app only treated \"and\" as a separator when a number followed it, so the whole sentence was hunted for as one food. It now separates on \"and\" by default, while dishes whose name contains one, like macaroni and cheese, stay together.",
      "It also understands how food was cooked. Scrambled, grilled, roasted, boiled and the rest no longer get in the way of finding the food itself.",
      "Removed the background box behind the word Digest under the Home screen's corner icon. The corner menu label on other tabs is back to how it always looked, which is what it should have been.",
    ],
  },
  {
    version: '1.0.31.12',
    date: '2026-08-30',
    changes: [
      "The version number in the corner has lost its little background box, moved up 5 pixels, and now sits centred under the icon above it rather than off to its left.",
      "The label under the corner menu icon looked like it had a dark patch behind it. It never had one: the drop shadow it used was built for the icon, and at that text size the blur pooled behind the letters instead of sitting under them. It now uses the ordinary shadow.",
    ],
  },
  {
    version: '1.0.31.11',
    date: '2026-08-30',
    changes: [
      "Meals in Find a Meal now open up to show what is in them. Tap one and it expands to list its ingredients and amounts, with a Use this meal button underneath when you are ready to do something with it.",
      "Picking a meal no longer jumps straight to the choices, so you can look at two similar ones and tell them apart before committing to either.",
    ],
  },
  {
    version: '1.0.31.10',
    date: '2026-08-30',
    changes: [
      "The button on Home still said Find a meal you have had, which was the whole thing that was meant to change. It now just says Find a meal.",
      "Meals already on your schedule but not yet eaten now have their own section at the top. Hiding the meal-plan favorites in the last update was right, but it also took away the only way those meals could be found here.",
      "Your meals and System recipes are now two tabs, so a few of your own meals no longer get buried under hundreds of system ones. It opens on your meals.",
    ],
  },
  {
    version: '1.0.31.9',
    date: '2026-08-30',
    changes: [
      "The Find a Meal screen was still showing its old title in the header bar for a moment before correcting itself.",
    ],
  },
  {
    version: '1.0.31.8',
    date: '2026-08-30',
    changes: [
      "Fixed: setting up a 6-week meal plan filled your favorites with 126 meals you never asked to save. Scheduling a meal has always had to keep a hidden copy of its parts so it can be rebuilt on the day, and that copy was showing up as a favorite. It no longer does, and the ones already sitting in your favorites have been cleared out. Anything you saved on purpose is untouched.",
      "Find a Meal is renamed and now covers meals you have not had yet as well. Alongside what you have logged and favorited, every system recipe is there, grouped the same way the Digest groups them: Sides, Salads & Bowls, Soups, Handhelds, and the rest.",
      "Find a Meal is now also on the Food screen, and Ate out or off-plan is now also at the top of the Meals schedule.",
      "The Digest cards on Home are now one card per area you actually have: Basic Health, Earth Matters, Gardening, Recipes, and one for each of your conditions. My Kitchen and My Favorites are not among them, since those are your own saved things and belong on the Food screen. The shelf is shuffled every time you open the app, and each card moves to something else from its own area every 15 minutes.",
    ],
  },
  {
    version: '1.0.31.7',
    date: '2026-08-30',
    changes: [
      "The row of past meals on Home is gone. It guessed at what you might be eating and only ever showed eight, so the meal you actually wanted was often not there at all.",
      "In its place: Find a meal you have had. A plain scrollable list of everything you have logged or favorited, with a search box, so you can find something by any word in its name instead of remembering what you called it.",
      "Pick one and you can log it now, log it earlier today if you are catching up, schedule it for another day, or use it instead of a meal you had planned. Replacing a planned meal logs it at that meal's own time and clears it off your schedule.",
      "Finishing a photo now opens the same searchable list, rather than offering a few guessed names.",
    ],
  },
  {
    version: '1.0.31.6',
    date: '2026-08-30',
    changes: [
      "Say what you ate is now built around the two times you actually need it: a meal out, and a meal you ate instead of the one you had planned. It offers today's planned meals so the one you skipped stops sitting on your schedule waiting, and it can mark a meal as eaten out.",
      "New: photograph a meal now, sort it out later. If you have no time to log something properly, take a picture of it. It waits on your Home screen until you have a minute, then becomes a real logged meal with the photo kept on it, dated to when the photo was taken rather than when you got around to it.",
      "Nothing is read from the picture and nothing is sent anywhere. It is a reminder of what you ate, so you can log it accurately later instead of guessing at the end of the day.",
      "Finish a photo by picking one of your usual meals, or by saying what it was. Either way the photo goes onto the meal.",
    ],
  },
  {
    version: '1.0.31.5',
    date: '2026-08-30',
    changes: [
      "Say what you ate. There is a new microphone button on Home, in the Log Again box: speak a meal and the app works out what you meant, shows you every part of it, and logs it once you say go.",
      "It understands amounts the way people say them. Two eggs and a slice of toast becomes two separate things. One and a half cups of oatmeal is one and a half, not two and a half. Macaroni and cheese stays one food.",
      "Nothing is logged from your voice alone. Every food it matched and every amount it worked out is shown first and can be corrected, and a loose match says so.",
      "If it recognizes the name of a meal you have logged before, it offers to log that one instead, with its real ingredients rather than a rebuilt guess.",
      "When an amount cannot honestly be turned into a weight, it says so rather than guessing. A cup of rice has no weight the app can work out, only drinks, alcohol and fats have a density it can rely on, so it asks for grams instead of inventing a number.",
      "Voice now runs on your phone itself wherever your phone can do that, so the audio never leaves the device. Where it cannot, the screen tells you plainly that your phone's own speech service handled it.",
    ],
  },
  {
    version: '1.0.31.4',
    date: '2026-08-30',
    changes: [
      "Scan a barcode and you can now log it as eaten right there. Until now a finished scan could only be saved for later or priced, which answers whether to buy something but never that you are eating it.",
      "It asks two things and fills both in for you: how much, in grams, and which meal. The meal is guessed from the clock against your own meal times in Profile, and both are yours to change before anything is written.",
      "The amount is in grams and starts at 100 because that is what a barcode nutrition panel reports. Nothing in the lookup gives a serving size, so the app does not invent one.",
      "Undo sits right next to the confirmation. Logging it also files the product under My Processed Foods, the same one entry buying it would have created, not a second copy.",
    ],
  },
  {
    version: '1.0.31.4',
    date: '2026-08-30',
    changes: [
      "Scan a barcode and you can now log it as eaten right there. Until now a finished scan could only be saved for later or priced, which answers whether to buy something but never that you are eating it.",
      "It asks two things and fills both in for you: how much, in grams, and which meal. The meal is guessed from the clock against your own meal times in Profile, and both are yours to change before anything is written.",
      "The amount is in grams and starts at 100 because that is what a barcode nutrition panel reports. Nothing in the lookup gives a serving size, so the app does not invent one.",
      "Undo sits right next to the confirmation. Logging it also files the product under My Processed Foods, the same one entry buying it would have created, not a second copy.",
    ],
  },
  {
    version: '1.0.31.3',
    date: '2026-08-30',
    changes: [
      "New Log Again section on Home. The meals you have already logged show up as tiles, and tapping one logs it again at the current time. Most of what anyone eats is something they have eaten before, and building it from scratch every time was the slowest part of using this app.",
      "It copies the meal exactly as you last saved it, ingredients, portions and notes included, so it counts toward your day the same way the original did. The meal you copied from is left alone.",
      "Tapped the wrong one? Undo appears right there and removes it. The one case where Undo is not offered is a meal that started a food trial, since removing the meal would not put the trial back, and it says so rather than half-undoing it quietly.",
      "You can move it, or turn it off, from Profile > Home Screen like every other section.",
    ],
  },
  {
    version: '1.0.31.2',
    date: '2026-08-30',
    changes: [
      "My Schedules now actually lists what you have scheduled. It was showing \"Nothing saved yet\" no matter what, because it was never wired to look: your meal plan had been scheduling correctly the whole time. It now lists Today's Meals, Scheduled Meals, Supplements, Prescriptions, Appointments, Hydration and Shopping List, with a count of what is still upcoming, and each one opens straight to its lens.",
    ],
  },
  {
    version: '1.0.31.1',
    date: '2026-08-30',
    changes: [
      'New Eating Window lens on Trends. When you keep a meal after the app tells you it falls outside your fasting window, that choice was already being recorded but nothing ever showed it back to you. Now it charts over time, with how many meals it was out of how many scheduled.',
      'It says plainly what it cannot see: only meals scheduled in the app are counted, and meal-plan meals never appear because the generator moves them to fit your window rather than booking them outside it.',
      'With no fasting window set it says so rather than drawing an empty chart, which would have looked like perfect compliance with a rule you never set.',
    ],
  },
  {
    version: '1.0.30.26',
    date: '2026-08-29',
    changes: [
      "New Today's Meals lens on Schedules: everything you have scheduled to eat today, in time order, and tapping one opens its ingredients and steps so you can cook straight from it. Home's meals tile opens this now.",
      'It shows the whole day rather than only what you have already eaten, since you cook a meal before you log it. Planned, eaten and skipped are each labelled.',
      'Fixed steps being dropped from every dish except sides when it was part of a meal. Salads, soups, handhelds and the rest all save their steps and were silently not showing them.',
    ],
  },
  {
    version: '1.0.30.25',
    date: '2026-08-29',
    changes: [
      "An Insights lens now keeps its explanation at the top instead of losing it the moment loading finishes, and you can collapse it with the chevron if you don't want it taking up room. Whatever the lens loaded sits underneath it.",
      'Fixed each dimension being listed twice in Condition Scores for any condition with fewer than three of them (Prostate Health has two). The muted grey repeat underneath was a chart legend doing a job the plain list above it was already doing.',
    ],
  },
  {
    version: '1.0.30.24',
    date: '2026-08-29',
    changes: [
      'A slow Insights lens now says what it is about to show you and what it tells you while it works, instead of just "Loading".',
      'Home\'s "Meals logged today" tile opens Past Meals, where those meals actually are, instead of dropping you on the My Foods menu.',
      "Today's Fuel Gauges say what the percentages are: your whole day's target, from what you have logged so far, so they climb as the day goes on. Nothing is projected.",
      'The gauge colours mean something now. Each ring blends from a cool slate toward green as that nutrient approaches its target, and only turns to a warning colour, naming the nutrient underneath, when intake has genuinely passed a published safe upper limit. Simply going over 100% is not treated as a problem.',
      "The How You're Feeling card now says what it is: the worst flare or food reaction logged in the last two days, kept on the first screen so an ongoing one is visible without going looking for it.",
    ],
  },
  {
    version: '1.0.30.23',
    date: '2026-08-29',
    changes: [
      'No text anywhere in the app sits directly on a tab\'s background photo now. Headings that labelled a box, like "Needs attention today", moved inside the box they describe; empty states, footnotes and loading lines got a background of their own; and outline-only buttons and pills were filled in so their labels are readable.',
      'Insights and Schedules had the most of this and were fully swept, along with every Food builder, Signals, Trends, Digest, Home, Garden, Food and Reports.',
    ],
  },
  {
    version: '1.0.30.22',
    date: '2026-08-29',
    changes: [
      "Home's \"Worth a look\" tile now opens the lens the number actually came from, instead of dropping you on the Insights picker with no idea where to look. Nutrient flags open Nutrients, condition flags open Condition Scores, and when the count is made of both it asks which one you want, naming how many of each.",
    ],
  },
  {
    version: '1.0.30.21',
    date: '2026-08-29',
    changes: [
      "Sharpened the prostate spicy-food entry to what the evidence actually says: capsaicin-containing hot peppers and chili, not spices in general. Cinnamon, turmeric, cumin, black pepper and garlic were all on the same 176-item questionnaire and none were flagged.",
      "Added the foods that survey found soothing, which most summaries leave out: water, herbal non-caffeinated teas, and psyllium.",
    ],
  },
  {
    version: '1.0.30.20',
    date: '2026-08-29',
    changes: [
      "Every condition now has its own Already tested foods list in Profile, not just Hashimoto's and Prostate Health. 84 entries across all 19, each linked to the cited research behind it.",
      "Prostate Health gained spicy food and tea, backed by a validated survey where 47% of men with chronic pelvic pain reported real food sensitivities, plus tomatoes and cruciferous vegetables as foods worth eating more of.",
    ],
  },
  {
    version: '1.0.30.19',
    date: '2026-08-29',
    changes: [
      "Prostate Health now has its own Already tested foods list in Profile, where only Hashimoto's had one before: caffeine, alcohol, evening fluids, choline-rich foods, and selenium or vitamin E supplements. Each links to the cited research behind it.",
    ],
  },
  {
    version: '1.0.30.18',
    date: '2026-08-29',
    changes: [
      'Selected pills and buttons with black text no longer carry a leftover drop shadow. The shadow came from the unselected style underneath, so the dark text now cancels it outright rather than just not adding one.',
      'The symptom check-in now scores and reports only the sections you were actually asked about. Results used to show a thyroid burden score and an IBS severity band to everyone, calculated from questions they never saw.',
      'The new prostate check-in is fully scored, with its published mild/moderate/severe bands and a comparison against your last one.',
    ],
  },
  {
    version: '1.0.30.17',
    date: '2026-08-29',
    changes: [
      'Black text no longer has a drop shadow anywhere in the app. A dark shadow behind dark text has nothing to separate it from, so it only thickened the letters.',
      'Profile pickers now follow your chosen ground color instead of a fixed grey.',
      'The symptom check-in now only asks about conditions you actually track. Someone tracking Prostate Health was being asked five IBS questions and thirteen thyroid ones, and nothing about their own condition.',
      'Added a real check-in for Prostate Health, using the seven-question International Prostate Symptom Score, the standard validated measure for urinary symptoms.',
    ],
  },
  {
    version: '1.0.30.16',
    date: '2026-08-29',
    changes: [
      'Digest search pills no longer have any drop shadow, so the small text stops looking smudged.',
      'Growing Zone moved into its own Garden Details section in Profile, with room for more garden settings later.',
      'Profile > Conditions & Check-In now lets you choose how often to be reminded to check in, from weekly to once a year. Home uses whatever you pick.',
      'The check-in reminder on Home now only appears if you have told the app you have a condition, and stops asking for a first check-in once you have taken one.',
      "Already tested foods gained a third choice, Haven't tested, for a food you have looked at and left open rather than decided on. You can start testing it later from the same row.",
    ],
  },
  {
    version: '1.0.30.15',
    date: '2026-08-29',
    changes: [
      'Fixed a duplicated heading in the Digest. Drilling into something like Basic Health > Essential Nutrients > Body Fat Biology showed the name in the header and again as a smaller heading right underneath it. Any heading that just repeats the header above it is now hidden, at every level and in every category.',
      "Went through every shelf in the Digest and split the ones covering more than one subject into named subsections: soil science, pollinators, the case for a home garden, and the core-science shelves for Hashimoto's, Graves', lupus, celiac, gout, kidney disease, cardiovascular disease, and rheumatoid arthritis, plus Hashimoto's healing stages and metabolism shelves.",
    ],
  },
  {
    version: '1.0.30.14',
    date: '2026-08-29',
    changes: [
      'Emphasized phrases in Digest articles now show in the Digest accent color instead of bold, so emphasis is still visible now that bold is gone everywhere.',
    ],
  },
  {
    version: '1.0.30.13',
    date: '2026-08-29',
    changes: [
      'No bold text anywhere in the app any more. Every size tier is now regular weight, and every explicit bold override was removed, so this is fixed at the source instead of one screen at a time.',
      'Every piece of text in the app now has a drop shadow, for consistency throughout rather than only on screens where it had been added by hand.',
      'The TabHub and LensHub menu labels keep their stronger shadow, the one place that was deliberately made heavier because a normal shadow did not show against that menu background.',
    ],
  },
  {
    version: '1.0.30.12',
    date: '2026-08-29',
    changes: [
      'Fixed the blurred look on Digest search pills and other small labels. They were never bold: a drop shadow tuned for large menu labels (4px blur) was being applied to 11px text, which smeared it enough to read as thick and blurry. Small text now uses the lighter shadow.',
    ],
  },
  {
    version: '1.0.30.11',
    date: '2026-08-29',
    changes: [
      'Removed bold from every remaining place where text was both bold and drop shadowed, across the whole app rather than one screen at a time: 23 styles on Home, Food, the flip cards, and two shared components. Drop shadow now carries the emphasis on its own everywhere.',
    ],
  },
  {
    version: '1.0.30.10',
    date: '2026-08-29',
    changes: [
      'Time errors now name the exact field that is wrong ("AM or PM has not been picked", "the hour reads 25") instead of restating the rules and leaving you to work out which box it means.',
      'If every field is actually valid and it still refuses, it now says so plainly rather than blaming your entry.',
    ],
  },
  {
    version: '1.0.30.9',
    date: '2026-08-29',
    changes: [
      'Fixed setting a meal time to midnight. Entering the hour as 0 or 00 was rejected as invalid, which stopped you before any other check could run.',
      'Time errors now say what to actually enter, including that midnight is 12 AM and noon is 12 PM, instead of only listing a range.',
    ],
  },
  {
    version: '1.0.30.8',
    date: '2026-08-29',
    changes: [
      'Scheduling a meal outside your fasting window is no longer blocked. You now get a choice: pick another time, or "Add Meal Anyway" for a missed meal, feeling unwell, or any other real reason.',
      'A meal added that way is saved and marked "Outside eating window" on your schedule, so your records and trends reflect a meal you actually ate instead of leaving it out.',
      'Rescheduling such a meal back inside your window clears that mark, so it never sticks to a meal it no longer describes.',
    ],
  },
  {
    version: '1.0.30.7',
    date: '2026-08-29',
    changes: [
      'The button in Profile > Meal Plan now breaks onto a second line after "Changes", with both lines centered on the button.',
    ],
  },
  {
    version: '1.0.30.6',
    date: '2026-08-29',
    changes: [
      'Renamed the button in Profile > Meal Plan to "Apply My Meal Timing Changes to Existing Meals", so it says plainly that tapping it updates meals already scheduled to match what you changed in Meal Timing.',
    ],
  },
  {
    version: '1.0.30.5',
    date: '2026-08-29',
    changes: [
      'Moved "Apply These Times to Meals Already Scheduled" to Profile, in the Meal Plan section, directly under "Generate My Meal Plan". This is where it should have been. It is in one place only.',
    ],
  },
  {
    version: '1.0.30.4',
    date: '2026-08-29',
    changes: [
      'Moved "Apply These Times to Meals Already Scheduled" into Profile, in the Meal Timing section, directly under your meal times and fasting window. It was previously in Schedule under the Meal Plan lens, which is not where you set those times and not where the previous update said it would be.',
    ],
  },
  {
    version: '1.0.30.3',
    date: '2026-08-29',
    changes: [
      'Meal plans now also respect your intermittent fasting eating window, not just your usual meal times. A meal whose usual time falls outside your window is moved inside it instead of being scheduled when you would not be eating.',
      'Added a way to correct the times on meals already scheduled. Setting a plan up again never fixed them, because it deliberately leaves days already on your schedule alone. This corrects them in place, keeping the same meals on the same days, and leaves anything you already logged untouched. (See 1.0.30.4: this now lives in Profile, under Meal Timing.)',
    ],
  },
  {
    version: '1.0.30.2',
    date: '2026-08-29',
    changes: [
      'Checking for updates now tells you what is about to happen, and asks first, instead of restarting the app with no warning.',
      'After an update is applied, a summary now shows you what actually changed, so an update is never just a silent restart.',
    ],
  },
  {
    version: '1.0.29.8',
    date: '2026-08-28',
    changes: [
      'Added a Check for Updates button in Profile. The app only looks for a new version on its own when it first opens, so this lets you check without closing and reopening it.',
    ],
  },
  {
    version: '1.0.29.7',
    date: '2026-08-28',
    changes: [
      'Meal plans now schedule each meal at the times set in Profile, instead of always using 8:00am, 12:30pm, and 6:30pm. A plan created before this update keeps its old times until you clear and regenerate it.',
    ],
  },
];

function parseVersion(version: string): number[] {
  return version.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

/**
 * Compares two of this app's own 1.0.DAY.UPDATE version strings.
 * Returns a negative number if `a` is older, positive if newer, 0 if equal.
 * Compares segment by segment as numbers, so 1.0.30.2 correctly reads as
 * newer than 1.0.29.10 (a plain string comparison would get that backwards).
 */
export function compareAppVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart !== rightPart) return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}

/**
 * Every release note the person hasn't seen yet, newest first.
 *
 * Catching up on several versions at once is a real case, not a
 * theoretical one: someone who skips a few updates, or whose phone sat
 * unopened for a week, should see everything that changed in between,
 * not just the newest version's own line.
 *
 * `previousVersion` of null means this device has never recorded a
 * version before, which happens two genuinely different ways: a brand-new
 * install, and an existing install upgrading into the first version that
 * records this at all. There is no reliable way to tell those apart, so
 * this shows just the current version's own notes in both cases: an
 * accurate, useful summary for the upgrade case, and a harmless one-time
 * "here's what's in this version" for a new install, rather than either
 * showing a new user the entire changelog or showing an upgrading user
 * nothing at all.
 */
export function getReleaseNotesSince(
  previousVersion: string | null,
  currentVersion: string,
): ReleaseNote[] {
  return RELEASE_NOTES.filter((note) => {
    // Never show a note for a version newer than what's actually running.
    if (compareAppVersions(note.version, currentVersion) > 0) return false;
    if (previousVersion === null) {
      return compareAppVersions(note.version, currentVersion) === 0;
    }
    return compareAppVersions(note.version, previousVersion) > 0;
  });
}

/**
 * Formats release notes for the plain-string message useInfoAlert takes.
 * One version's notes render as a plain bulleted list; several versions
 * caught up on at once get a version heading each, so it stays clear
 * which change arrived when.
 */
export function formatReleaseNotesMessage(notes: ReleaseNote[]): string {
  if (notes.length === 0) return '';
  const bullets = (note: ReleaseNote) => note.changes.map((change) => `• ${change}`).join('\n\n');
  if (notes.length === 1) return bullets(notes[0]);
  return notes.map((note) => `Version ${note.version}\n\n${bullets(note)}`).join('\n\n\n');
}
