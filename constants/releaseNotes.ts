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
    version: '1.0.35.1',
    date: '2026-09-09',
    changes: [
      'Backup now offers your shared folder first. Once a folder is set up, Back Up to OneDrive is the button at the top of Backup & Restore, and the older route that hands the file to your phone and asks where to put it is below it as Save a Copy Somewhere Else. Restore is ordered the same way.',
    ],
  },
  {
    version: '1.0.34.62',
    date: '2026-09-07',
    changes: [
      'The 19 How This App Helps entries in the Digest were describing the app as it stood a month ago. They now say twelve builders rather than eleven, and name what has been built since: the full report before you save anything you built yourself, Meals You Can Eat, six more Trends lenses, the grocery list, and what a condition actually costs.',
    ],
  },
  {
    version: '1.0.34.61',
    date: '2026-09-07',
    changes: [
      'Fixed a meal plan that could fail outright with a technical error about a released object. Generating one asks the database about all 411 recipes, and it was asking for every one of them at the same moment. It now works through them steadily instead, and if a query does fail once, it tries again rather than giving up on the whole plan.',
    ],
  },
  {
    version: '1.0.34.60',
    date: '2026-09-07',
    changes: [
      'You can now pick your OneDrive folder inside the app: sign in to Microsoft, browse either your own folders or ones somebody shared with you, and choose one. No typing a name and hoping.',
      'One shared folder holds everything the app keeps in OneDrive. The app makes a Mailbox folder inside it for anything you and a partner send each other, and a Backups folder for your backups.',
      'Backup & Restore now shows exactly where your backups go, the whole path, and can write one straight to OneDrive or restore the newest one back.',
      'Home asks you to set the folder up the first time you open the app, and stops asking once it exists.',
    ],
  },
  {
    version: '1.0.34.52',
    date: '2026-09-07',
    changes: [
      'Pairing is no longer blocked until you type a folder name. That check proved nothing: the app cannot see the folder, cannot confirm it exists and cannot confirm it was shared.',
    ],
  },
  {
    version: '1.0.34.51',
    date: '2026-09-07',
    changes: [
      'The shared folder card is now two numbered steps, and says plainly that there is nothing to select. Open OneDrive sitting above a text box made it look like the button would fill the box in. It does not: you make the folder there, then come back and type its name.',
    ],
  },
  {
    version: '1.0.34.50',
    date: '2026-09-07',
    changes: [
      'Your shared folder is now set up before you pair with anyone, not after. It is its own card at the top of Connections, with Open OneDrive and a place to say what you called the folder.',
      'Pairing stays switched off until you have named it. A partner link with nowhere to put anything is not much of a link.',
      'The folder name now travels in the code you show someone, so both phones know where to look without either of you explaining it.',
      'If the two of you named different folders, the app says so on their row. Nothing would reach either of you and nothing else would have told you.',
      'One folder covers every partner, and later every child. You only do this once.',
    ],
  },
  {
    version: '1.0.34.49',
    date: '2026-09-07',
    changes: [
      'Setting up a mailbox is now three numbered steps on the partner, and step one has an Open OneDrive button rather than an instruction with no way to act on it.',
      'The app still cannot make the shared folder for you, and still says so. What it can do now is take you there in one tap.',
    ],
  },
  {
    version: '1.0.34.48',
    date: '2026-09-07',
    changes: [
      'A real mailbox. Link a file once on each side and Send Now and Check Theirs Now go straight to it, with nothing to navigate.',
      'Setting it up: in OneDrive or Drive, make a folder and share it with your partner. Send once through your share sheet into that folder, then tap Link What I Send and pick it. Do the same with Link What They Send once theirs arrives.',
      'The app cannot make that shared folder for you. No app can put a folder into storage that belongs to somebody else, so that first step is yours and the app now says so instead of leaving you to find out.',
      'Unlink at any time and it goes back to picking a file by hand.',
    ],
  },
  {
    version: '1.0.34.47',
    date: '2026-09-07',
    changes: [
      'Pick a Folder is gone. It could never reach OneDrive, or any cloud app, because Android only offers those there if they support choosing a whole folder. It only ever showed folders on the phone itself, which a partner cannot see.',
      'There is one way to share now, and it does reach OneDrive: Send Mine to Them on their row, and Get What They Sent to open one.',
    ],
  },
  {
    version: '1.0.34.46',
    date: '2026-09-07',
    changes: [
      'OneDrive does work for sharing with a partner, and the app now says how. Send it there from your share sheet, then on the other phone tap Get What They Sent and choose OneDrive under Browse files in other apps.',
      'A folder in OneDrive that you both have is all you need. No account setup in this app and no sign-in.',
      'Picking a folder still only offers folders on the phone itself. That is Android: it only lists cloud apps there if they support choosing a whole folder, and OneDrive does not. Getting a file is a different picker and does list it.',
    ],
  },
  {
    version: '1.0.34.45',
    date: '2026-09-07',
    changes: [
      'You can now change what a partner is allowed to see, on their row in Connections. Until now those were fixed when you paired and the only way to change them was to unpair and start over, even though the pairing screen said otherwise.',
      'This is what was stopping conditions crossing: sharing conditions was switched off, so showing your code again sent everything except them. Tick Conditions on their row, then show each other your codes.',
      'The buttons on a partner row now wrap onto a second line instead of pushing Remove off the edge of the screen.',
    ],
  },
  {
    version: '1.0.34.44',
    date: '2026-09-07',
    changes: [
      'Show My Code Again is now on every partner, not only ones you paired with before this app could encrypt. Showing each other your codes is how your conditions cross, and it was hidden once you both had keys.',
      'Scan each other whenever your conditions change. A meal plan you generate is then built around both of you.',
      'The note on a partner used to say nothing moved between your phones. That was out of date: conditions do cross. It now says so, and still says the plan itself does not yet.',
    ],
  },
  {
    version: '1.0.34.43',
    date: '2026-09-07',
    changes: [
      'Send Mine to Them now offers every app in your share sheet, WhatsApp and OneDrive included. It was using a file type some apps filter out of the list.',
      'It also sends a short message alongside the file now, saying how to open it, the same way sharing a recipe already does.',
    ],
  },
  {
    version: '1.0.34.42',
    date: '2026-09-06',
    changes: [
      'Sharing with a partner now works by sending them a file, through whatever you already use to send each other things. No account anywhere and no sign-in.',
      'On a partner in your list, tap Send Mine to Them. On their phone, Get What They Sent, then pick the file. Only the person you sent it to can open it.',
      'The shared folder option is still there for storage apps that allow it, but it is no longer the main way. Most cloud apps on Android, OneDrive among them, do not let an app pick a folder at all.',
      'Once a partner sends theirs, a meal plan you generate is built around both of you.',
    ],
  },
  {
    version: '1.0.34.41',
    date: '2026-09-06',
    changes: [
      'Sharing with a partner now works through a folder you pick yourself, on Connections. Anything both phones can see will do: a folder inside OneDrive, Google Drive or Dropbox, or an SD card.',
      'No account to create and no sign-in. Whatever already syncs that folder carries what you share, so the app never asks either of you for a password.',
      'Everything written there is encrypted for one person only, so a folder the whole household can see still gives nothing away.',
      'Send Mine Now writes your conditions across; Check for Theirs reads what your partner sent. Once theirs arrives, a generated meal plan is built around both of you.',
      'Carrying the generated plan itself across is the next piece. The app says so on the card rather than leaving you to wonder.',
    ],
  },
  {
    version: '1.0.34.40',
    date: '2026-09-06',
    changes: [
      'Groundwork for sharing a meal plan through your own cloud storage: the message one phone sends the other is built and tested.',
      'It only ever carries which conditions you track and which recipes are planned, and only the parts you chose to share. Turning a share off means that part is not put in the message at all.',
      'If the two phones are on different versions of the food database, the plan is left out rather than shown, because the same recipe number can mean a different dish. The conditions still come through, and the app says what happened.',
      'Nothing is sent anywhere yet. Connecting it to OneDrive or Google Drive is the next step.',
    ],
  },
  {
    version: '1.0.34.39',
    date: '2026-09-06',
    changes: [
      'A generated meal plan is now built around BOTH of you when you have a partner who shares which conditions they track. Every day is checked against the whole combined list rather than only yours.',
      'The plan says who it was built for, every time. If it could only be built around you, it says which piece is missing rather than staying quiet about it.',
      'Turning off what you share stops it being used immediately, even though the app still remembers it.',
      'Still no sending between phones. The two of you each generate locally; carrying a plan across is the next piece.',
    ],
  },
  {
    version: '1.0.34.38',
    date: '2026-09-06',
    changes: [
      'Pairing now also exchanges the key that lets one phone send something only the other can read. This is what will keep a shared meal plan private once it travels through your own cloud storage rather than being handed over in person.',
      'Anyone you paired with before today has no such key. Their entry in Connections says so, with a button to show your code once more, which fills it in. Nothing else about the connection changes and you do not need to disconnect.',
      'Nothing is sent anywhere yet. This is groundwork.',
    ],
  },
  {
    version: '1.0.34.37',
    date: '2026-09-06',
    changes: [
      'A connection now reads down one column, with Rename, Stop Sharing and Remove underneath instead of squeezed into a second column beside the text.',
      'Corrected what a partner link says it does. It was worded as though meals and lists already move between the two phones. They do not: pairing is finished, but nothing yet carries a plan from one phone to the other, and the app now says so on the partner itself.',
      'What you allow each other is still recorded, and is what the sharing will use once it exists.',
    ],
  },
  {
    version: '1.0.34.36',
    date: '2026-09-06',
    changes: [
      'Connecting two phones now works by scanning a code, in person. One of you shows a code on screen, the other reads it with the camera. Nothing to tap, nothing to type, nothing to paste.',
      'In Profile then Connections: Pair With a Partner, Pair for Sharing Recipes, or Scan Their Code.',
      'The old ways of sending an invite are gone, because none of them arrived. A link was not tappable in a messaging app, and a file failed to open before this app was ever reached. Offering something that does not work is worse than not offering it.',
      'The catch, said plainly: you both need to be in the same room. Pairing with someone far away needs work that is not built yet.',
    ],
  },
  {
    version: '1.0.34.35',
    date: '2026-09-06',
    changes: [
      'Inviting someone no longer attaches a file. It was asking you to pick the person twice, once for the message and again for the file, and that second send was the part already shown not to work.',
      'The invite is now one message with the code in it, sent once.',
    ],
  },
  {
    version: '1.0.34.34',
    date: '2026-09-06',
    changes: [
      'New: I Was Sent an Invite, in Profile then Connections. Paste the code from someone\u2019s message and it opens the accept screen. This is now the way to connect two phones.',
      'Why: sending an invite as a link did not work, because messaging apps only make ordinary web links tappable. Sending it as a file did not work either, because tapping it in WhatsApp failed before this app was ever reached. Text always arrives, so the invite message now leads with a code you can copy.',
      'Pasting the whole message is fine. It will find the code inside it, and it tells you plainly if what you pasted is not an invite rather than failing quietly.',
      'The link is still in the message underneath, in case you are sending through something that does make it tappable.',
    ],
  },
  {
    version: '1.0.34.33',
    date: '2026-09-06',
    changes: [
      'Fixes connection and partner invites arriving as text that does nothing when tapped. They were sent as a link in the app\u2019s own private format, and messaging apps only make ordinary web links tappable, so it landed as dead text on the other phone.',
      'Invites now go as an attached file, the same way sharing a recipe already worked. Open the file on the other phone and it opens straight into the app, on the right screen.',
      'That applies to all three: inviting someone for recipes, inviting a partner, and sending your link back to finish a connection.',
      'The link is still included in the message underneath, in case you are sending through something that does make it tappable.',
    ],
  },
  {
    version: '1.0.34.32',
    date: '2026-09-06',
    changes: [
      'If the app ever fails to set itself up again, it now says so and gives you a Check for Updates button, instead of opening to an empty Home with nothing working and no way to reach Profile. That is what happened yesterday, and the only reason it was recoverable is that the app happens to fetch updates on its own at launch.',
      'The screen shows the real error and the version number, so a report can say something specific rather than that it is broken, and it offers to open the app anyway in case something you need still works.',
      'Nothing you have recorded is affected by any of this. The failure was in building the database structure, never in the data itself.',
    ],
  },
  {
    version: '1.0.34.31',
    date: '2026-09-06',
    changes: [
      'Fixes the Home screen sitting on Loading today and never finishing. Yesterday partner links added an index to the connections table that referred to a column which only gets added when an existing phone upgrades, so on any phone that already had the app the database could not finish setting itself up and nothing after that point loaded. A brand new install was unaffected, which is why it was not caught before it went out.',
    ],
  },
  {
    version: '1.0.34.30',
    date: '2026-09-06',
    changes: [
      'New: partner links. You can connect with a partner on their own copy of Inside Story, and plan meals around both of you at once. This is the first connection in the app that does anything beyond sending a single recipe.',
      'One dinner, two sets of conditions. A meal is left out only if it is one to avoid for someone; if it is merely worth a closer look for one of you, it stays on the plan and each of you is told what it means for you. Planning only what is perfect for both would empty the menu, and a shared dinner where one person leaves something out is a normal evening rather than a failure.',
      'What you share is your choice and is set before the link is sent. Meals and shopping lists start on. Which conditions you track starts OFF and has to be turned on deliberately, because a list of your diagnoses is not the same kind of thing as what is for dinner.',
      'Your symptoms, labs, healing stage, weight and notes are not shared by this and cannot be. Only the names of the conditions you track ever cross, and only if you switch that on.',
      'For a partner link you now have to compare the four-group device code with each other before accepting. It is optional for sending a recipe and required here, because this link keeps carrying information rather than handing over one dish.',
      'The app never claims a link works both ways until the other phone has actually said so. Until then it tells you plainly that they have not confirmed yet, rather than looking finished while nothing you send can land.',
      'A partner can be set back to recipes-only at any time, which stops the sharing and removes the condition list they had shared with you.',
    ],
  },
  {
    version: '1.0.34.29',
    date: '2026-09-05',
    changes: [
      'New: Emergency, on the Life tab. What someone else needs to know when you cannot tell them. It opens by saying plainly that nobody is going to find it in an emergency: it is on your phone, behind a lock, in an app, and a paramedic will not open it. It is a record to show someone, read out, or hand over, and it is not a replacement for a bracelet, a card in your wallet, or the medical ID screen your phone already has.',
      'Drug allergies now have somewhere to live. Until now this app only ever recorded FOOD allergies, and a penicillin allergy is not a food allergy. It is the first thing on the card and the first thing on the screen, because it is the one most likely to change what someone does in the next ten minutes.',
      'Most of the card is already filled in. Your conditions, everything you are currently taking with its dose, your food allergies and your name are read from where they already live rather than asked for twice, so changing a medication in My Meds changes the card with it.',
      'Somewhere to put who to call, which the app has never had anywhere for. One person can be marked to try first, and choosing that moves it off whoever had it, since a card naming two people to try first has not answered the question.',
      'It tells you how old it is. A card listing a medication you stopped six months ago is worse than no card, so the date you last confirmed it goes onto the card itself. Confirming is a separate act from editing a field, so changing your hospital does not quietly declare an old medication list current.',
      'Nothing you left empty is printed as a blank. A line reading none recorded gets read as no allergies by anyone scanning it in a hurry, so an empty field is simply left off the card entirely.',
      'For an advance directive it holds only where the document is kept, never what it says, since nothing written in an app carries any legal weight on its own.',
    ],
  },
  {
    version: '1.0.34.27',
    date: '2026-09-05',
    changes: [
      'New: Upkeep, on the Life tab. Anything with a date that bites you when you forget it. A boiler service, a water filter, a registration, a passport, a warranty.',
      'A service is counted from when you last did it, not from a fixed month. A boiler serviced in March is next due the following March, and recording that you did something today moves the next date. That is the one thing here that works differently from your bills, where rent arrives on the 1st whether or not you did anything.',
      'Things that run out are handled as their own kind of thing, since a passport has one date and then it is over. You say whether it renews, so the app never suggests renewing a warranty that has finished; that stays on the list as a record rather than as a task.',
      'What is overdue leads, then what is due in the next 45 days, then everything by area. Anything missing the piece it needs to be put on a calendar is listed as needing setup rather than quietly dropped.',
      'Costs are never guessed. Anything with no cost recorded is counted separately, and the figure for what is coming says so and calls itself a floor.',
      'And it never says something is required. Whether a vehicle has to be inspected, or how long a licence lasts, depends on where you live, so the app holds what you told it.',
    ],
  },
  {
    version: '1.0.34.26',
    date: '2026-09-05',
    changes: [
      'Pattern Finder now looks at work alongside food. A new "Work, week by week" section in Trends compares the weeks you rated work worse than your own average against the weeks you rated it better, and shows how many flares or reactions fell in each.',
      'It is a comparison between weeks rather than a 48-hour window, because a weekly answer covers the flare and six other days. Calling that an antecedent of a Tuesday evening would be wrong however good it looked.',
      'The split uses your own average rather than a fixed number, so it works whether you rate everything a 2 or everything a 5. A week landing exactly on your average goes in neither group, and the app says how many did.',
      'It refuses rather than guessing: under six answered weeks, when your answers never vary, when one side has fewer than two weeks, or when there were no flares to compare against. Each says which piece is missing.',
      'More flares in the EASIER weeks is reported just as plainly as the reverse, since that is worth noticing too.',
      'And it says out loud what it is not: four things compared across a handful of weeks makes one of them looking meaningful by luck likely rather than surprising, so this is a prompt to notice, never evidence that work caused anything.',
    ],
  },
  {
    version: '1.0.34.25',
    date: '2026-09-05',
    changes: [
      'New: Work, on the Life tab. Two things at once, because both are value that arrives through a job and neither is your pay.',
      'Worth Asking is a set of questions to put to whoever runs your benefits, covering health cover, money set aside before tax, time and what protects it, money you may be turning down, and food. It names no scheme and no law, because what exists depends entirely on where you live and who you work for. The app will not tell you what you are entitled to.',
      'What I Get holds the answers. An allowance runs down and resets, and whatever is left usually goes with it, so the app warns you before that happens, the same as it already does for a health account that forfeits.',
      'A matched contribution is a different thing and nothing expires: paying in below the point where matching stops turns down money every month. That is reported as a share of your pay, never as an amount, because this app does not know what you earn and is not going to ask.',
      'Something with no number attached, like a fridge at work or a nurse line, is recorded without being given a progress bar it has no business having.',
      'How It Feels asks four questions a week. Three are the basic psychological needs of Self-Determination Theory, a long-standing framework rather than anything invented here. The fourth is what work took out of you physically, which is this app own question and the one most likely to line up with how you have been feeling.',
      'There is no score and nothing is compared against anyone else. Work strain does have a measured link to inflammation, and a large study also found no link between it and the onset of one of the conditions tracked here, so saying what your answers mean about your health would go past what anyone knows.',
    ],
  },
  {
    version: '1.0.34.24',
    date: '2026-09-05',
    changes: [
      'The app no longer explains how donated produce is treated for tax, because that is not its job and it was written about one country when this app is built for several.',
      'What stays is the record: who got it, when, and whether they gave you a receipt. What it counts for depends on where you live and on your own situation, and that question goes to someone who does tax.',
      'Volunteering your time is not money and is not a trade, so it is deliberately not in Finances. Put the session on your Schedule as an appointment. If you want to hold yourself to an amount, a Goal already takes a cost in hours, so "volunteer 50 hours this year" works without pretending an hour has a price.',
    ],
  },
  {
    version: '1.0.34.23',
    date: '2026-09-05',
    changes: [
      'Giving produce away now records who got it: someone you know, or a food bank or charity. For an organisation you can note whether they gave you a receipt.',
      'It is not a separate kind of thing from giving it away, because what happened is the same either way. Only who received it differs, and that is the part worth keeping.',
      'The record is what the app keeps: what went where, when, and whether you have a receipt. Whether any of it counts for anything on a tax return depends on where you live and on your own situation, so that question is left to someone who does tax.',
      'Money you give is already tracked under Gifts and giving. It is reported alongside the produce but never added to it, because there is no honest way to turn vegetables into dollars.',
    ],
  },
  {
    version: '1.0.34.22',
    date: '2026-09-05',
    changes: [
      'A harvest that is more than you can eat can now be sold, traded, or given away, from the item itself in Kitchen.',
      'A trade needs no money anywhere. Say what came back and it goes straight into your kitchen inventory, marked as traded for rather than bought, so you can see how a jar of honey got there.',
      'Whatever went out comes off your harvest the same way cooking with it would, so the inventory stays honest either way.',
      'A trade is not priced, with one narrow exception: if you have recorded paying for that food before, in the same unit, the app says what you did not have to spend, at the price you actually paid and on the day you paid it. It is money you kept, never money you earned, and it stays out of your income.',
      'Where no price was ever recorded, or the unit is different, it says so and counts the goods rather than converting. A per-package price says nothing about a kilo.',
      'What you gave away is never valued. Nobody knows what their own potatoes were worth.',
      'Selling writes a real income entry, so surplus reaches your income figures instead of sitting in its own corner.',
    ],
  },
  {
    version: '1.0.34.21',
    date: '2026-09-05',
    changes: [
      'Income that varies is now tracked properly. Several income sources were always possible, but each held one fixed amount, so solar credits, harvest sales and side work could only ever be a number that is wrong every month.',
      'Mark an income as varying and the amount you enter becomes a starting guess. Tag what actually arrives and the app works out what it really brings in, then tells you how far off the guess was.',
      'The average counts months that brought in nothing, on purpose. Harvest sales that stop for the winter really do earn nothing then, and leaving those months out would turn an honest year-round figure into a flattering summer one.',
      'A new "Where your money comes from" view shows each stream and its share. If one is most of it, the app says so, because several streams are only worth having if none of them is nearly all of it.',
      'Two new income kinds this app is in an unusual position to track: energy sold back to the grid, and produce or goods you sold.',
      'An income stream can point at the goal that created it, which makes "has it paid for itself yet" answerable from two measured numbers rather than a projection. It refuses to quote a rate from one or two payouts, and flags anything under a year, because solar in July is not solar in January.',
    ],
  },
  {
    version: '1.0.34.20',
    date: '2026-09-05',
    changes: [
      'Spending can now be tagged to a goal, so a purchase made for one counts toward it without being entered twice.',
      'It attaches to a specific cost on the goal, not the goal as a whole, because a goal can have several money costs and only the cost line has an amount that means anything.',
      'Only money costs appear in that list. A dollar amount cannot advance something measured in hours, and offering it would put a number into a unit it does not belong to.',
      'Setting money aside counts the same way, since that is already an expense here. Income is not offered: earmarking money you have not spent is a different idea, and this app does not move money.',
      'Each cost now says how much came from tagged spending and how much you recorded by hand. If both, it says plainly that some of it may be the same money counted twice, because the app cannot tell one $200 from another.',
    ],
  },
  {
    version: '1.0.34.19',
    date: '2026-09-05',
    changes: [
      'New: Goals, in Finances. A goal is something you want plus what it will actually take, and that cost does not have to be money.',
      'A goal can carry several costs at once, of different kinds: money, hours of work, or things you provide yourself. Rebuilding a bed costs lumber and a weekend. A year of preserves costs jars, produce and time.',
      'Each cost is tracked in its own unit, and they are never added together into one percentage. Half the money and half the hours is not half done, it is half funded and half worked. Money finished with the work not started is not halfway either.',
      'So what you are told is how many costs are met and which one is furthest behind, by share rather than by amount. That is the figure that says whether the thing in your way is money or a weekend.',
      'With a date on the goal, each cost says what it means per month in its own unit. Without one it says a date is missing rather than inventing a figure.',
      'Every goal asks why it matters. It is what you read on the day the effort stops feeling worth it.',
      'A goal you stop chasing can be set aside rather than deleted, and it stops asking for anything each month while keeping everything you put in.',
    ],
  },
  {
    version: '1.0.34.18',
    date: '2026-09-05',
    changes: [
      'The awareness ribbon is drawn in a lighter purple everywhere it appears, so it reads clearly against the grey menus and the cards rather than sinking into them.',
      'It was being drawn in the Digest’s fill colour, which is the right shade behind dark text on a button and too dark for a shape you are meant to see. Measured against both backgrounds it sat under the contrast floor this app holds itself to; it now clears it on both.',
    ],
  },
  {
    version: '1.0.34.17',
    date: '2026-09-05',
    changes: [
      "Any saved dish now tells you whether you can make it, as soon as you open it. Either you have everything, or it names what you are short and by how much.",
      "One tap puts what you are missing onto your grocery list, each line noting which dish it was for.",
      "Those lines remember which food they are, so what you buy matches back against the recipe next time instead of relying on the name.",
    ],
  },
  {
    version: '1.0.34.16',
    date: '2026-09-05',
    changes: [
      "New: I Made This, on any saved dish. What it used comes out of your kitchen and the batch goes in, so the inventory keeps itself up rather than only ever climbing.",
      "It shows you exactly what it is about to take before it takes anything, and does nothing until you say yes. Saving a recipe is not the same as cooking it, and the app cannot tell whether you used your own stock or something you picked up on the way home.",
      "If you only had part of what a recipe wanted, it takes what was there and says what was short rather than pretending the rest existed.",
      "Two ingredients that resolve to the same jar can no longer each be given all of it.",
    ],
  },
  {
    version: '1.0.34.15',
    date: '2026-09-05',
    changes: [
      "New: a Household inventory beside the food one, in Kitchen. Cleaning, paper, laundry, personal care, first aid, pets and the rest, kept apart from food because none of it has nutrients or a score.",
      "Nothing is typed but the amount. Household items are picked from a list of 63 everyday things; food is picked from the 212 the app already knows how to buy, so what you add always matches what a recipe asks for.",
      "Anything from either inventory goes onto the grocery list in one tap, and a non-food line says so on the list.",
    ],
  },
  {
    version: '1.0.34.14',
    date: '2026-09-05',
    changes: [
      "Groundwork, with nothing to see yet. Your grocery list and your kitchen now remember WHICH food each line is, not just what it is called.",
      "That matters for what comes next: a recipe drawing on what you have, and being told what you are short of, both come down to knowing that the broccoli in a recipe and the broccoli in your kitchen are the same food. On names alone that fails quietly.",
      "It also puts back the link to the nutrition data behind each food, which a grocery line had been dropping.",
    ],
  },
  {
    version: '1.0.34.13',
    date: '2026-09-05',
    changes: [
      "New: Kitchen, on the Life tab. Everything you have on hand in one place, from the garden, from what you have fermented, from what you have bought, and from anything you add yourself.",
      "Ticking something off a grocery list now puts it in your kitchen. Entering the real size in the price panel corrects it, so a 750ml bottle is recorded as 750ml rather than as whatever the recipe asked for.",
      "Each item can have some marked used, be marked all gone, or be added straight back onto your grocery list when it runs low.",
      "Every item says how long it has been there, on purpose: nothing takes an amount down as you cook, so an inventory is only as right as you keep it, and an amount the app cannot check should tell you how old it is.",
    ],
  },
  {
    version: '1.0.34.12',
    date: '2026-09-05',
    changes: [
      "Insights goes back to the softer pink. The brighter one separated better on paper but read as too bright on a real screen.",
    ],
  },
  {
    version: '1.0.34.11',
    date: '2026-09-05',
    changes: [
      "From The Digest wears the real awareness ribbon in Home's lens menu now, instead of the plain ribbon glyph that reads as a race rosette.",
    ],
  },
  {
    version: '1.0.34.10',
    date: '2026-09-05',
    changes: [
      "Home's lens menu is ordered the way the main menu is: what you put in, then what it tells you, then the wider world.",
      "Each icon now wears the colour of the tab it takes you to, so you can see where something goes before reading it. Grouped by tab, the menu reads as blocks of colour.",
      "From The Digest now scrolls to the Digest cards on Home instead of leaving for the Digest tab. It is the one item there whose card is the thing itself rather than a shortcut to somewhere else.",
    ],
  },
  {
    version: '1.0.34.9',
    date: '2026-09-05',
    changes: [
      "The tab's name no longer sits in the top left of every lens menu. The corner button, the header and the page box all say it already.",
      "Home's lens menu is three columns wide now, matching every other tab, and a name too long for one line wraps onto two rather than being cut off.",
      "The Digest ribbon is a little shorter in the TabHub menu, so it stops standing taller than the icons around it. Everywhere else it is unchanged.",
    ],
  },
  {
    version: '1.0.34.8',
    date: '2026-09-05',
    changes: [
      "Home has its own corner menu now, instead of a shortcut to The Digest. It lists whichever Home sections you have turned on, in the order you put them, and picking one goes straight to the thing it is a view of. You can use the card on Home or the menu, whichever you reach first.",
      "Insights is a rose now rather than the orchid it briefly had. Trends keeps its blue.",
      "Garden and Digest swapped places in the menu, so Garden's green and Life's green are no longer side by side.",
      "The line around the TabHub menu follows the ground colour picked in Profile, the same as the circle inside it.",
    ],
  },
  {
    version: '1.0.34.7',
    date: '2026-09-05',
    changes: [
      "The TabHub menu is reordered. Home, Profile and Info sit across the top row now, and the ten tabs below read in groups of three: what you do daily, what it tells you, and the wider world.",
      "Signals and Trends swapped. Signals is where you log how you feel and Trends is the patterns drawn from it, so the output had been sitting ahead of its own input.",
      "Swiping between tabs and the dots under the header both follow the new order, and Home now has a dot of its own.",
      "The circle marking the tab you are on follows the ground colour picked in Profile, instead of always being the same teal whichever theme was chosen.",
      "Insights and Life traded colours. Insights was a mint green sitting right beside Food's green and hard to tell apart from it.",
      "A little more room under the bottom row of the menu, so it matches the space above the top row.",
    ],
  },
  {
    version: '1.0.34.6',
    date: '2026-09-05',
    changes: [
      'Bills and spending can now say which account they come out of, which nothing in Finances did before. Money went out and no account was any different for it.',
      'Optional, always. A bill you know about is worth recording before you have set up a single account.',
      'What it buys: an account can tell you when more is due out of it than is in it. Rent due on the 1st against $340 in checking is the warning worth having.',
      'Nothing is deducted automatically, and that is deliberate. The app only sees what you record, never the coffee or the bank fee, so a balance it worked out for you would be confidently wrong within a month and impossible to tell apart from a real one. What you typed stays what you typed, and what your records say has happened since is shown next to it.',
      'A difference between the two is not an error. It is a measure of how much of your spending never got written down.',
      'A card or loan payment can say which debt it pays down, and the app now spots the same payment being counted twice: once as a bill, once as that debt’s minimum payment. It says so and changes nothing, because which one to keep is your call.',
    ],
  },
  {
    version: '1.0.34.5',
    date: '2026-09-05',
    changes: [
      'Accounts now handle interest, and which accounts get asked for a rate has changed.',
      'A savings account can hold its APY, because that rate is printed on the statement. Investments, retirement and property are no longer offered a rate field at all: those move with the market, and a long-run average return is a description of the past rather than a rate anything is growing at.',
      'Every debt now shows what it costs each month just to sit there. A $4,200 card at 24.99% is about $87 a month before you pay anything off it. Net worth totals that up, because it is a bill in every sense except that nobody sends it to you.',
      'Investments and retirement report what actually happened instead: update a balance now and then and the app measures the change across your own history, rather than applying an assumed rate.',
      'When you update a balance you can record what you paid in or took out. It is optional, and it decides whether the figure can be called a return at all, since a balance that went up looks exactly like money you added.',
      'Nothing grows a stored balance on its own. What you typed on a date stays what you typed; anything computed is shown beside it and marked as computed.',
    ],
  },
  {
    version: '1.0.34.4',
    date: '2026-09-05',
    changes: [
      'New in Finances: an Accounts section, covering the ordinary budgeting ground the first version skipped.',
      'What you own and what you owe become one net worth figure. Balances are typed in rather than pulled from a bank, and a point is recorded whenever you change one, so the line only moves when something real did.',
      'Two orders for paying off debt, side by side. Highest rate first is cheaper and usually finishes sooner, and you are told by how much of each. Smallest balance first is reported by the month its first debt is gone, so it can be weighed rather than just felt. Neither is picked for you.',
      'A debt with no interest rate or minimum payment recorded is named and left out rather than treated as interest-free.',
      'Monthly limits per category, in Spending. What repeating bills already commit is shown beside what you have spent rather than added into it, and a limit your bills alone already exceed says so, because that one cannot be met by spending less.',
      'Bills that arrive once or twice a year now show what they would cost set aside monthly, in Coming Up. Those are the ones that wreck a month, precisely because they sit outside the monthly rhythm.',
    ],
  },
  {
    version: '1.0.34.3',
    date: '2026-09-05',
    changes: [
      'New in Finances: a Health section, and it is the part no ordinary budgeting app can do.',
      'Where you stand against your deductible and out-of-pocket maximum, with the plan year starting whenever yours actually starts. Starting partway through the year is handled: enter what you had already met and the bars start where you really are.',
      'HSA and FSA, with the difference that costs money. FSA funds are forfeited after your deadline and you get told before that happens. HSA funds roll over forever, so nothing warns you about them.',
      'Medical bills checked against the Explanation of Benefits: what your plan allowed, minus what insurance paid, is what you owe. What the provider billed is deliberately not part of that, because the gap above allowed is written off, and treating it as owed is the most common way people overpay.',
      'What each condition has cost you this year, pulled together from bills, repeating costs, one-offs and hands-on therapy sessions you have tagged. Anything untagged is shown on its own rather than divided between conditions, because splitting it would turn one honest figure into several invented ones.',
    ],
  },
  {
    version: '1.0.34.2',
    date: '2026-09-05',
    changes: [
      'Bills can now be due when they are actually due. On a date, on the second Tuesday of the month, every Friday, or every 2, 3 or 4 weeks.',
      'Setting one up shows you what it worked out, in words, plus the next date it lands on, before you save.',
      'Fixed: a yearly or quarterly bill with only a day of the month was showing up as due every single month, because nothing told it which month it belonged to. It now asks, and a bill that cannot be placed yet is listed under "Needs a due date" instead of quietly vanishing from Coming Up.',
      'Every 4 weeks is counted as 13 payments a year, not 12. It is not the same as monthly, and treating it as monthly hides a whole extra payment every year.',
      'Bills you already entered are kept. Anything that could be read exactly was carried over; anything that never had enough detail to place on a calendar still counts toward your monthly totals and is listed as needing a date.',
    ],
  },
  {
    version: '1.0.34.1',
    date: '2026-09-05',
    changes: [
      'Life has its first area: Finances. Four sections behind one lens — Overview, Bills & Income, Spending, and Coming Up.',
      'Bills & Income is what is supposed to happen each month; Spending is what actually did. Overview puts them side by side, because whether they match is the real question.',
      'Groceries you priced in the shop and therapy sessions you costed are counted automatically. They are read from where they already live rather than copied, so fixing a grocery price fixes it everywhere. Do not enter them twice.',
      'Weekly bills are counted at 4.33 a month, not 4, and every-two-weeks at 26 payments a year rather than 24. Those are the real numbers, and using the round ones is how a budget quietly runs short by a month a year.',
      'A bill due on the 31st lands on the last day of shorter months instead of being skipped.',
      'Where the garden or a ferment covered a grocery line, that is reported as lines you did not have to buy, not as a dollar saving. What that produce would have cost is not something this app knows, and it will not invent it.',
      'No bank connection, by choice. Everything stays on your phone.',
    ],
  },
  {
    version: '1.0.33.4',
    date: '2026-09-04',
    changes: [
      'New tab: Life, the tenth. Open it from the navigation button like any other tab, or swipe to it from Garden. Its mark is the infinity symbol and its color is a light orchid.',
      'Life is where the parts of your life that are not food, not a symptom, and not a lab result will live. It is deliberately empty right now: the tab is finished and working, and what goes inside it has not been decided yet.',
      'There are no placeholder features on it and no buttons that do nothing. When something appears there it will be because it was built.',
      'A side effect worth having: the navigation menu now comes out even at four full rows, instead of leaving two icons alone on the last one.',
    ],
  },
  {
    version: '1.0.33.3',
    date: '2026-09-04',
    changes: [
      'Profile is reordered, and the cards are now grouped under six headings: About You, Your Health, How You Eat, Growing Your Own, How the App Looks, and Device & Account.',
      'Conditions & Check-In moves near the top, since it is the setting that changes the most elsewhere in the app: condition scoring, which meals read as safe, what the Digest pins, and what Trends looks for.',
      'The four food cards now sit together as one run instead of being split apart by other settings.',
      'Garden Details moves down out of second place. It was near the top because it was built early, not because it belonged there.',
      'Nothing was renamed and no setting changed. Everything you had set is exactly where you left it, just further up or down the page.',
    ],
  },
  {
    version: '1.0.33.2',
    date: '2026-09-04',
    changes: [
      'The Digest now covers hands-on therapies for all 19 tracked conditions, not just six. Fourteen new entries across Cardiovascular Disease, Celiac, Chronic Kidney Disease, Fatty Liver Disease, Gout, Graves’, IBD, Lupus, PCOS, Psoriasis, Sjögren’s, and both types of diabetes.',
      'Several of them report that a therapy did not work, because that is what the trials found. The largest study anywhere in this area randomized 1,000 women with PCOS and acupuncture made no difference to live births. A 2007 chiropractic blood pressure result that is still quoted in clinics failed to replicate in 2016, in a study run at a chiropractic college.',
      'Where nothing has been tested, the entry says so rather than filling the gap. Celiac disease has no controlled trial of any of these therapies at all.',
      'Practical additions: massage over a recent insulin injection site speeds absorption, so plan where the day’s injections go before a session. Neuropathy changes what is safe below the knee. Prostate cancer that has spread to bone changes how a therapist should work.',
    ],
  },
  {
    version: '1.0.33.1',
    date: '2026-09-04',
    changes: [
      'New: Hands-On Therapies, under Schedules. Log a chiropractic adjustment, an acupuncture session, a massage, or a physical therapy visit, with the date, who did it, what they worked on, how long it took, and what it cost.',
      'New: Therapy Response, under Trends. Compares your check-ins in the days after each session against your check-ins on days away from any session, and tells you how many days the difference held. It says nothing until there are at least three sessions and enough check-ins to compare, rather than showing a percentage worked out from one good afternoon.',
      'New in The Digest: Hands-On & Complementary Therapies, under Basic Health. Nine entries on what the research actually shows for chiropractic care, acupuncture, and deep tissue massage, including the places it shows nothing, plus what to tell a practitioner before a session.',
      'New in The Digest: six entries under Prostate Health on the sacral nerve route to the bladder, why an adjustment has never been tested against urinary symptoms, and the hands-on and needling approaches that do have trial evidence.',
      'New in The Digest: entries on these therapies for Migraine, IBS, Rheumatoid Arthritis, and Multiple Sclerosis, each reporting whatever the trials found, including where acupuncture did not beat a sham comparison.',
    ],
  },
  {
    version: '1.0.32.18',
    date: '2026-09-03',
    changes: [
      "New: Use What I Have, on any grocery line your garden or a ferment already covers. Until now the list would tell you what you had and still only offer to buy it.",
      "Taking it draws that harvest down by what you used, so what is left stays accurate, and the line is marked as taken from your kitchen rather than bought. It carries no price, so it never reaches your running total or your price history.",
      "If a harvest covers only part of a line, it takes what there is, reduces the line to what you still need, and leaves it on the list to buy.",
      "Where two harvests of the same food exist, the older one is used up first.",
    ],
  },
  {
    version: '1.0.32.17',
    date: '2026-09-03',
    changes: [
      "Developer Tools is now reachable in this build. It was there all along but only ever showed in a dev build, so on your phone it has been invisible since the app moved to standalone builds. That is why the 90-day test data seeder could never be reached.",
      "New: Seed Kitchen Sources, which creates a garden with harvests, a fermentation with a harvest, and a completed shopping trip from three days ago. It draws its foods from your current grocery list, so the kitchen inventory has something to actually match against.",
      "One of the seeded harvests covers its grocery line outright and the rest fall short, so both readings can be seen in one pass.",
      "While any test data is loaded, Home says so. Clear removes everything seeded, by either tool, and nothing else.",
    ],
  },
  {
    version: '1.0.32.16',
    date: '2026-09-03',
    changes: [
      "New: the app now says what the main button at the bottom of the screen is for. Opening it for the first time dims the screen, leaves that button lit, and explains that everything in the app is behind it.",
      "After that, a small pointer sits above the button until it has been tapped once, then goes away for good. So anyone who skipped past the welcome still has something telling them where to go.",
      "Prompted by watching someone open the app for the first time: the button has no outline and no label by design, which looks clean and gives a newcomer nothing to go on.",
      "Profile > Appearance & Navigation has a Show the Welcome Again button, for handing the app to someone new.",
    ],
  },
  {
    version: '1.0.32.15',
    date: '2026-09-03',
    changes: [
      "Fixed, properly this time: olive oil now offers a price per fluid ounce rather than per pound. The last two updates each fixed a real part of this and neither reached the line you were actually looking at.",
      "The cause: your list was built before the app started recording how a thing is sold, so that line had nothing stored at all, and a line with nothing stored falls back to offering a weight. The repair in the last update only covered lists where the value was recorded wrongly, not lists where it was never recorded.",
      "Opening your grocery list now fills that in from the food reference for every line missing it, once, without touching a tick, price or note. Anything you added by hand in a shop is left alone.",
    ],
  },
  {
    version: '1.0.32.14',
    date: '2026-09-03',
    changes: [
      "Fixed: the grocery list and the brand comparison ignored your Imperial setting and offered metric units, unless you had tapped that setting in Profile at least once. If you had never touched it, Profile read Imperial off your phone's region while the grocery list assumed metric, so you were offered a price per kg.",
      "Every other screen in the app already did this correctly. These two were the exception, and both are now fixed, with a check that stops it happening again.",
      "Reported directly, and both halves of that report were right: the unit was wrong for a liquid, and it was the wrong system as well.",
    ],
  },
  {
    version: '1.0.32.13',
    date: '2026-09-03',
    changes: [
      "Fixed: a grocery list built before this update was offering a price per kilo for things sold by volume, so olive oil could be priced per kg rather than per litre. Reported directly, and the list was right to look wrong.",
      "The cause was the column mix-up fixed in the last update, which stopped new lists being written wrong but left the lists you already had still carrying it. Opening your grocery list now corrects those lines in place, once, without touching a single tick, price or note you have entered.",
      "You do not need to press Refresh or rebuild anything. Open the list and olive oil will offer per litre.",
    ],
  },
  {
    version: '1.0.32.12',
    date: '2026-09-03',
    changes: [
      "New: your grocery list now knows what you already have at home, so you stop buying a second one of something sitting in the kitchen.",
      "Anything picked from the garden or poured off a fermentation shows on the line with how much of it is left, because the app tracks that as it gets used. If a harvest covers the whole line, it says so; if it covers part of it, it says how much you still need.",
      "Anything you bought in the last week shows as a reminder to check rather than an amount. The app knows you bought it and has no way to know how much is left, so it asks you to look instead of guessing a number and sending you home without it.",
      "Fixed: a freshly built list was showing \"count\" or \"weight\" where it should have said \"about 2 stalks\", and was losing the sold-by information that decides which price units a line offers. Refreshing a list had always worked correctly, which is why this went unnoticed. Both are now built the same way and cannot drift apart again.",
    ],
  },
  {
    version: '1.0.32.11',
    date: '2026-09-01',
    changes: [
      "New: Compare Brands, on every grocery list item. Put in what two or more of them cost and how big each one is, and it works out the price per litre or per kilo for each and marks the best value, with how much dearer the others are.",
      "It exists because a bigger bottle is not reliably the cheaper one, and that is a sum most people get wrong standing in an aisle. A $12 litre is dearer per litre than a $5 half-litre.",
      "Prices can be said or photographed off the shelf label there too, the same as on the list itself.",
      "Opened from a list item, it comes back with the winner's price and size already on your list, so a comparison ends with the list being right rather than a number to remember.",
    ],
  },
  {
    version: '1.0.32.10',
    date: '2026-09-01',
    changes: [
      "You can mark a price as a sale price. Tick it while you are pricing the item, and it shows on the line as on sale.",
      "Grocery Prices in Trends now plots a sale in its own colour and says how many of the points were offers. Without that, one half-price week reads as the thing getting cheaper rather than as a sale.",
      "Anything sold by volume or weight now asks how much was in it, so a bottle priced for all of it can still be compared. A 750 ml bottle at $15.90 works out to $21.20 per litre, and it says so under the price while you type.",
      "Quoted per litre and per kilo rather than per millilitre and per gram, because two cents a millilitre is not a number anyone can compare two bottles with. Imperial is quoted per fluid ounce and per ounce.",
    ],
  },
  {
    version: '1.0.32.9',
    date: '2026-09-01',
    changes: [
      "The price panel no longer asks whether you mean pounds or kilos. It uses whichever you already set in Profile, and offers only that one.",
      "It also stopped offering a price per pound on things nobody sells by weight. Olive oil is priced for the bottle or per litre now, not per pound.",
      "You can say the price instead of typing it. \"Three ninety nine\", \"four fifty\", or \"ninety nine cents\" all work.",
      "You can photograph the shelf label and let the app read the price off it. Whatever it reads is put in the box for you to check, never saved on its own, and a label reading SALE 2/$5.00 is read as five dollars rather than two.",
    ],
  },
  {
    version: '1.0.32.8',
    date: '2026-09-01',
    changes: [
      "The grocery list now tells you how many to pick up for 29 more foods. About 2 stalks of broccoli, about 3 cloves of garlic, about 2 onions, about 1 bunch of spinach, about 6 spears of asparagus.",
      "Every weight comes from USDA's published portion data and is stored with the exact food and portion it came from, so nothing here is a guess. Where the wording differs from what you might expect, it is because it matches the source: broccoli is counted in stalks rather than heads.",
      "Four foods were looked at and deliberately left without a count, because the only figures published for them are for the wrong thing: sun-dried tomatoes, baby zucchini, fried tofu, and a single 2 g rocket leaf.",
      "This update reloads the food database, so the first launch after it will take longer than usual. Only once.",
    ],
  },
  {
    version: '1.0.32.7',
    date: '2026-09-01',
    changes: [
      "Fixed: a list built for more than one person showed no count at all, so it said \"loose, by the piece\" without saying how many. It now works the count out from the full amount, so 480 g of avocado reads as about 3 avocados.",
      "The arrow on the right of each item works now. It opened nothing before, which is why there seemed to be no way to price or remove anything.",
      "Ticking something off now opens the price entry straight away, while you are standing there with it. Being asked at the end of the trip was no use. Ignore it and carry on if you would rather; the tick is saved either way.",
      "If something is priced differently from what the app expected, say so on that same panel: for all of it, each, per pound or per kilo.",
      "Remove From List is on the same panel, and now reads as a removal rather than an ordinary button.",
    ],
  },
  {
    version: '1.0.32.6',
    date: '2026-09-01',
    changes: [
      "You can delete a grocery list now. It asks first, and it tells you exactly what goes with it: the list cannot be recovered, any prices recorded on it go too and disappear from Grocery Prices in Trends, and if the list was already finished it is the only record of that shopping trip.",
      "Dishes you saved before the Cook Prep fix have been corrected. An ingredient marked Boiled but counted as raw is now counted as boiled, across every saved side, salad, soup and the rest. The app tells you once, on opening, how many were corrected.",
      "Meals you have already logged are left exactly as they are. Correcting those would rewrite days you have already seen and acted on, which is not something to do without asking.",
    ],
  },
  {
    version: '1.0.32.5',
    date: '2026-09-01',
    changes: [
      "Added Refresh to the grocery list. A list stores its lines when you build it, which is what stops it rewriting itself while you are shopping, but it also meant a list made before the recent fixes kept the old wording and the duplicates forever. Refresh rebuilds it from your schedule as it stands now.",
      "Refreshing keeps your ticks and prices wherever the line still matches, and keeps anything you added by hand untouched. It tells you how many lines had to start fresh, which happens when a name changed, rather than quietly losing a tick you had already made.",
    ],
  },
  {
    version: '1.0.32.4',
    date: '2026-09-01',
    changes: [
      "The grocery list now says how each thing is actually sold. Broccoli by the head, garlic by the bulb, salmon by weight, olive oil in a bottle, beans in a can. Covers every ingredient the recipe library uses.",
      "Where the amount can honestly be turned into a number of things to pick up, it says so: about 2 avocados, about 3 eggs. Only for foods with a properly sourced weight per item, so it is never a guess.",
      "This update reloads the food database, so the first launch after it will take longer than usual. Only once.",
    ],
  },
  {
    version: '1.0.32.3',
    date: '2026-09-01',
    changes: [
      "Fixed a real problem with nutrition numbers: how you said you were going to cook an ingredient had no effect on the nutrients counted for it. Every builder asked about preparation twice, once in the ingredient search and once as Cook Prep, and only the first answer reached the data. Pick broccoli raw, set it to Boiled, and you got raw broccoli's numbers on a boiled dish.",
      "The Cook Prep you choose now decides which version of the food gets counted. Boiled means the boiled version, raw means the raw one. This changes nutrients, condition scores and everything built on them, in all eleven Food builders.",
      "Where the food database has no cooked version of something, the report now says so plainly instead of leaving two answers quietly disagreeing.",
    ],
  },
  {
    version: '1.0.32.2',
    date: '2026-09-01',
    changes: [
      "The grocery list now names what you actually buy. It was listing prep versions like \"Broccoli (boiled)\", which no store sells. Preparation belongs to the recipe, so the list shows the raw ingredient.",
      "Fixed: a food needed by more than one meal was listed more than once, because a raw version and a cooked version counted as two different foods. Everything for one food is now added together into a single line covering all the days you are shopping for.",
      "Amounts measured different ways are added together properly. Ounces fold into grams, cups into millilitres. A weight and a volume of the same food are shown side by side rather than being wrongly added, since converting between them needs a density the app does not have for most foods.",
      "Tap water no longer appears on the list. It stays in the recipes, where it counts toward your daily water, but there is no reason to shop for it.",
      "Each line now says which meals need it, and the top of the list names every meal it was built to cover.",
    ],
  },
  {
    version: '1.0.32.1',
    date: '2026-09-01',
    changes: [
      "New: a Grocery List, on the Home screen. Say how many days you are shopping for and how many people are eating, and it works out how much of every ingredient your scheduled meals need, then writes it down as a list you can take into a store.",
      "The list stays put. It does not rebuild itself while you are shopping, so what you read in the aisle is what you read when you left the house.",
      "Check things off as they go in the cart, and record what each one cost, either as a package price or per pound or kilo. A running total adds up as you go, and says plainly when a per-weight price is still waiting on a weight rather than guessing at one.",
      "Scan a barcode from inside the list to add a product and its price, or to attach one to something already on the list.",
      "Anything you remember in the aisle can be added by hand, and it groups together at the end rather than getting lost among the scheduled ingredients.",
      "New Trends lens, Grocery Prices: pick a food and see what it has cost over time, and how often you have actually bought it. Built entirely from prices you entered yourself.",
      "Schedule's own Shopping List now has a button to turn what it is showing into a real grocery list.",
    ],
  },
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
