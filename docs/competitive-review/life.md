# Life tab: competitive review

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] AnyList (groceries)
- [x] OurGroceries (groceries)
- [x] YNAB (finances)
- [x] Monarch Money (finances)
- [x] Sweepy (upkeep)
- [x] Tiimo (routines, ADHD)
- [x] Routinery (routines)
- [x] Due (reminders)
- [x] Sortly (where things are kept)
- [x] Medisafe (meds)
- [x] Todoist (work, capture)
- [x] Goblin.tools (ADHD support)
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What the Life tab does today

Life (`app/(tabs)/life.tsx`) is one tab with 15 lenses picked from the LensHub menu. Everything is stored on the phone in SQLite and travels between one person's devices through their own OneDrive folder.

| Lens | What it does | Main files and tables |
|---|---|---|
| Grocery List | Builds a list from the meal schedule for 2 to 7 days and N people, works out quantities, check off in the shop, prices per line, ticked items flow into Kitchen. The only area that merges between two partners. | `lib/groceryList.ts`, `lib/groceryDb.ts`, `grocery_lists`, `grocery_list_items`, `lib/peerRelationships.ts` |
| Conditions | Reading for My Conditions, Family (with a roster that can feed the meal plan) and Other Conditions. | `components/ConditionsSection.tsx`, `lib/family.ts` |
| Health Literacy, Earth Matters, Search Reading | The reading corpus once in the Digest tab. | `components/DigestCategoryLens.tsx` |
| Finances | Recurring bills with calendar rules, entries, accounts, net worth, budgets, debt payoff, goals that count money, time and goods separately, and a health-money layer (deductible and out-of-pocket standing, FSA and HSA expiry, medical bills against the EOB). All typed in by hand. | `lib/financeCore.ts`, `financeAccounts.ts`, `financeGoals.ts`, `financeHealth.ts`, `finance_*` tables |
| Work | Benefits (allowances, matches, perks, reset dates) and a weekly check-in on autonomy, competence, relatedness and physical strain, set beside symptoms. No task list. | `lib/workBenefits.ts`, `lib/workMeaning.ts`, `work_benefits`, `work_checkins` |
| Upkeep | Things that recur from when they were last done (boiler service, filters) and documents that expire (passport, licence). | `lib/upkeep.ts`, `upkeep_items`, `upkeep_doings` |
| Emergency | Contacts plus a plain text summary of conditions, meds and allergies to show or share, with a stated warning that it is not a medical alert. | `lib/emergency.ts`, `emergency_contacts`, `emergency_profile` |
| My Meds | Prescriptions, OTC and supplements with doses and start and end dates; their timeline lives on Schedules > Meds. No refill or pills-left count. | `components/MyMedsSection.tsx`, `treatments`, `treatment_nutrients` |
| Kitchen | Food and non-food inventory with remaining quantities, drawn down by meals, fed by ticked grocery lines, garden and ferment harvests; a place column answers "where did I put it". No expiry dates. | `lib/kitchenDb.ts`, `kitchen_items`, `lib/whereIsIt.ts` |
| Movement | Steps from Health Connect beside symptoms, week by week. | `lib/movementMeaning.ts` |
| Routines | One step at a time walk-through, with optional daily reminder; a step can be a Did I Do It check. No per-step timer. | `lib/routines.ts`, `routines`, `routine_steps`, `routine_runs` |
| Did I Do It | One-tap marks that answer "did I take my pill, lock the door" later with the time. | `done_checks`, `done_check_marks` |
| Days Until | Countdown for anything, reminds on the day, keeps counting past it. | `lib/countdown.ts`, `countdowns` |
| Capture inbox (reached from Home) | One field plus microphone, no category asked, sorted later. | `lib/captureNotes.ts`, `capture_notes` |

Dated reminders reach the phone for bills, upkeep and work benefits (`lib/reminderSources.ts`). Trends > Keeping Up reads the routine, upkeep and check records without scoring anybody.

**Not present anywhere (checked in code):** home screen widgets, bank or card import (no CSV, OFX or Plaid), receipt scanning, visual countdown timers on routine steps, refill or pills-left tracking, pantry expiry dates, barcode entry for non-food items, a work or personal task list with due dates and projects, reminders that repeat within the day until marked (upkeep and compost repeat once a day only), AI task breakdown, instant shared lists beyond the partner grocery merge.


## 2. Competitors

Pricing is US dollars as shown to a US visitor on 2026-09-25 unless stated otherwise. App-store prices vary by country.

### 2.1 AnyList (groceries, recipes, meal plan)

**What it is.** The best known shared grocery list for couples and families. iPhone, Android, web, Mac, Apple Watch, browser extensions.

**Pricing.** Free for lists and sharing. AnyList Complete: $9.99/year individual, $14.99/year household. No monthly plan, no lifetime. Source: https://www.anylist.com/complete (checked 2026-09-25). Some third-party reviews quote higher figures; the official page shows these.

**What it does well that Inside Story does not yet do**
- Instant shared list between any number of household members, with changes appearing on the other phone in seconds.
- Paste a recipe web address and it imports ingredients and steps.
- Store assignment, aisle sorting, item photos, location-based reminders ("you are near the shop").
- Apple Watch app, home screen widgets, Siri and Alexa add-to-list.

**What Inside Story already does better**
- The list is worked out from the meal schedule, with quantities per person and per day, and ticked items flow into the Kitchen inventory with remaining amounts. AnyList knows nothing about what is already in the cupboard.
- Every item carries the food's condition scoring and the person's allergies. AnyList has no health layer at all.
- Garden and ferment harvests already count against the list.

**Gaps and what they would take**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Add to the list from outside the lens (a quick-add row on Home, and a capture note that can be sorted to the grocery list) | `lib/captureNotes.ts` gains a `grocery` destination, insert through `lib/groceryDb.ts`, Home card registered in `lib/homeSections.ts` and `lib/visualPreferences.ts` | JS | None | Small |
| Store and aisle grouping | New `store` and `aisle` columns on `grocery_list_items`, an open list per the open-lists rule, sorting in `lib/groceryList.ts` | JS | None | Medium |
| Import a recipe from a web address | Belongs to the Food builders rather than Life: a parser for the schema.org Recipe data most recipe sites publish, fetched on the phone | JS | Only the recipe address goes to the recipe site | Medium |
| Home screen widget showing the list | Android widget library such as `react-native-android-widget` | Native, forces an EAS rebuild | None | Large |
| Faster household sync than the shared-folder merge | Peer merge exists (`lib/peerSyncDevice.ts`); speed is bounded by the OneDrive check interval | JS for a shorter check; instant push needs the content-blind relay CLAUDE.md already describes | The relay must stay content-blind | Medium to Large |

### 2.2 OurGroceries (groceries)

**What it is.** A plain shared grocery list, popular with couples because it syncs instantly and has almost nothing to learn. iPhone, Android, web, Apple Watch, Alexa, Google Assistant.

**Pricing.** Free with ads. Premium removes ads: about $1/month, $6/year, or $20 lifetime, depending on the country. Source: https://www.ourgroceries.com/user-guide (checked 2026-09-25). One 2026 review quotes $5.99 one-time, so the lifetime price differs between stores.

**What it does well that Inside Story does not yet do**
- Scan a barcode to put an item on the list.
- Add by voice assistant ("Alexa, add milk to my grocery list").
- Any number of people on one list, free.

**What Inside Story already does better.** Everything past the list itself: quantities from the meal plan, the inventory, prices, and the health layer.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Barcode scan straight onto the grocery list (and into Kitchen for non-food items) | The scanner already exists for food logging; add "put it on the list" to its result, and let the Kitchen non-food inventory use it | JS (camera already in the build) | Same shape as the external-data rule (1): only the barcode leaves the phone | Small |
| Voice assistant add | An Alexa or Google skill needs a company server | Server | Conflicts with no-server stance | Not recommended |

### 2.3 YNAB, You Need A Budget (finances)

**What it is.** Zero-based budgeting ("give every dollar a job") with a devoted following. iPhone, Android, web.

**Pricing.** $14.99/month or $109/year; 34-day free trial; up to 6 people share one subscription at no extra cost; a free year for college students. Source: https://www.ynab.com/pricing (checked 2026-09-25).

**What it does well that Inside Story does not yet do**
- Bank and card transactions arrive by themselves (direct import in the US, Canada, UK and parts of the EU; file import elsewhere).
- One method taught end to end, with free workshops, so people change what they do rather than only record it.
- Six people on one budget.

**What Inside Story already does better**
- Health money: deductible and out-of-pocket standing, FSA or HSA use-it-or-lose-it dates, medical bills checked against the insurer's statement. YNAB has none of it.
- Goals that count time and goods as well as dollars, never blended into one percentage.
- Money tied to the garden, the groceries and meals in the same app.
- No bank password handed to anyone.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Import a bank export file (CSV, OFX or QFX) | New importer beside `lib/financeDb.ts` mapping rows into `finance_entries`, a duplicate check on date, amount and payee; file chosen with the document picker (and `desktop/files.js` on the PC) | JS | None: the file never leaves the device | Medium |
| Automatic bank connection (Plaid, GoCardless) | Needs a server holding keys and tokens | Server | Direct conflict with local-first: bank data would pass through a company server | Not recommended |
| A zero-based "assign every dollar" view | `finance_budgets` already holds limits; the view would sit in `components/FinanceMoneySection.tsx` | JS | None | Medium |

### 2.4 Monarch Money (finances)

**What it is.** The leading all-accounts money dashboard since Mint closed: net worth, budgets, investments, recurring charges, shared with a partner. iPhone, Android, web.

**Pricing.** Core $14.99/month or $99.99/year; Plus $199/year (annual only, adds forecasting and planning tools); 7-day trial; partner access included. Sources: https://www.monarch.com/pricing and https://getfinny.app/blog/monarch-money-pricing-2026 (checked 2026-09-25; the official page did not show figures to the fetch, so the numbers are from the second source).

**What it does well that Inside Story does not yet do**
- Links every bank, card, loan and investment account and sorts spending into categories by itself, with rules.
- Finds recurring charges and subscriptions from the transactions.
- Transactions reviewed together with a partner.
- Cash-flow forecast charts.

**What Inside Story already does better.** The health-money layer, goals that count time and goods, garden and grocery costs, and privacy (Monarch holds everyone's bank data on its servers).

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Spot repeating charges in imported entries and offer to make them bills | Pure function in `lib/financeCore.ts` over `finance_entries`; accepting creates a `finance_recurring` row. Depends on the file import above | JS | None | Small once import exists |
| Category rules ("payee contains Costco means Groceries") | New `finance_rules` table applied on import | JS | None | Small |
| A receipt photo on an entry | Photo picker already in the build; file under the app's folder, path column on `finance_entries` | JS | None | Small |
| Linked accounts | As YNAB | Server | Conflict | Not recommended |


### 2.5 Sweepy (upkeep, household cleaning)

**What it is.** A cleaning planner that shows each room's dirtiness as a filling bar and builds a daily list sized to the time a person has. iPhone and Android. Over a million households.

**Pricing.** Free tier with limited tasks. Premium $3.99/month or $19.99/year; no lifetime option (a common complaint in reviews). Sources: https://sweepy.com/ and https://onehaus.app/compare/haus-vs-sweepy (checked 2026-09-25; the official page does not list prices).

**What it does well that Inside Story does not yet do**
- A picture of the whole home: each room has a bar that fills as time passes since a task was done, which makes "what needs doing" visible at a glance.
- A daily list sized to available time and energy ("I have 20 minutes today").
- Household members share the chores, with parental approval for children's tasks.
- Room templates, so a new user starts with a full plan rather than a blank screen.

**What Inside Story already does better**
- Upkeep is anchored to when a thing was last done, the same as Sweepy, but also covers documents that expire (passport, licence, insurance), which Sweepy does not.
- Upkeep reminders reach the phone beside bills and work benefits, all from one place.
- Trends > Keeping Up reads the record without points, streaks or a leaderboard. Sweepy's points and family leaderboard are exactly what the standing rule forbids, and for someone with ADHD a leaderboard is often a source of shame. This is a deliberate difference, not a gap.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Group upkeep by room or area, each area showing how many things are coming due (a count and dates, never a "dirtiness" judgement or a score) | An `area` column on `upkeep_items` as an open list (`garden_custom_terms` pattern), grouping in `components/UpkeepSection.tsx`, arithmetic in `lib/upkeep.ts` | JS | None | Small |
| Starter templates ("a kitchen usually has these"), offered, never auto-added | A static list in `lib/upkeep.ts`, a "Start from a list" band in `UpkeepSection.tsx` | JS | None | Small |
| "I have 20 minutes": pick what fits | An optional `minutes` column on `upkeep_items`; a filter that lists due things fitting the time given | JS | None | Small |
| Shared chores with a household member | Add `upkeep` as an area to the allowlist in `lib/peerRelationships.ts` | JS | Opt-in per relationship, fits the existing model | Medium |

### 2.6 Tiimo (visual day planner for ADHD and autism)

**What it is.** A visual planner built for neurodivergent people: the day as coloured blocks with icons, a circular timer that makes time visible, AI that breaks a vague task into steps and estimates how long each takes, mood check-ins. iPhone, iPad, Apple Watch, Android, web. Won Apple's iPhone App of the Year 2025.

**Pricing.** Free tier with core planning, to-do list and focus timer. Pro $12/month or $79.99/year; Family $119.99/year for up to 5 people. Sources: https://lifestack.ai/blog/tiimo-pricing and https://www.tiimoapp.com/product (checked 2026-09-25; the official page showed only a 30% off promotion, not list prices).

**What it does well that Inside Story does not yet do**
- A visual timer that shows time running out as a shrinking shape, on the step being done. Time blindness is the core ADHD problem and this is the most praised feature in the category.
- Home and lock screen widgets and Live Activities, so the current step is visible without opening the app.
- AI breaks "clean the kitchen" into steps with time estimates.
- The whole day laid out as a picture, not a list.
- Calendar sync.

**What Inside Story already does better**
- Routines already show one step at a time, which is the same insight Tiimo is built on, and a step can double as a Did I Do It mark, so "did I take my pill" is answered later without logging twice. Tiimo has nothing like the Did I Do It record.
- The day in Schedules > Today's Meals already interleaves meals and medication doses and says which meal competes with a dose. No planner does this.
- Nothing scores or praises. Tiimo has streaks and rewards.
- Capture inbox, where did I put it, bills, upkeep and documents all live in the same app.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Optional minutes on a routine step, with a visual shrinking timer while walking it | `minutes` column on `routine_steps`; timer drawn with `react-native-svg` (already used for charts) in `components/RoutinesSection.tsx`; a local notification when it ends through the existing notification code | JS | None | Medium |
| Current routine step or next reminder on the home and lock screen | Android widget library, and an ongoing notification for the running routine | Widget: native, rebuild. Ongoing notification: JS through `expo-notifications` | Lock-screen text is visible to anyone holding the phone, so it needs a switch and plain wording | Widget Large; notification Small |
| Break a task into steps | See Goblin.tools below | | | |
| The whole day as a picture (routines, doses, meals, appointments, upkeep due) | A read-only day strip built from what Schedules and Life already hold, shown on Home | JS | None | Medium |

### 2.7 Routinery (step-by-step routines)

**What it is.** A routine player: each routine is a sequence of timed steps played one after another with a countdown, sound and voice guidance. iPhone, Android, Apple Watch.

**Pricing.** Free with limits. Premium quoted at $7.99/month or $39.99/year, with a lifetime plan offered at $71.99 on promotion; regional and promotional prices differ widely (other quotes: $3.99/month, $27.49/year). Source: https://makeheadway.com/blog/routinery/ (checked 2026-09-25). Confirm at checkout.

**What it does well that Inside Story does not yet do**
- Every step has a length, the routine shows a total, and the player counts down each step and says the next one aloud.
- A large library of ready-made routines to copy (morning, bedtime, leaving the house).
- Watch app and widgets to start a routine with one tap.

**What Inside Story already does better**
- Routine steps link to Did I Do It marks and to medication doses; Routinery steps are isolated from anything else in a person's life.
- Routines read into Trends > Keeping Up without streaks. Routinery rewards streaks.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Step lengths and a total for the routine ("about 25 minutes") | Same `minutes` column as under Tiimo; total worked out in `lib/routines.ts` | JS | None | Small (with the Tiimo timer: Medium together) |
| Read the next step aloud | `expo-speech` is already in `package.json`, so a speak call when a step arrives in `RoutinesSection.tsx`, with a switch | JS | None, speech is on the device | Small |
| Starter routines to copy | Static list in `lib/routines.ts`, "Start from one of these" in `RoutinesSection.tsx` | JS | None | Small |


### 2.8 Due (reminders that keep asking)

**What it is.** A fast reminder app whose one idea is auto-snooze: an overdue reminder keeps going off every 1 to 60 minutes until it is marked done or rescheduled. Also quick timers. iPhone, iPad, Mac only; there is no Android or web version.

**Pricing.** $7.99 one-time, with an optional yearly Upgrade Pass for new features. Sources: https://www.dueapp.com/ and https://apps.apple.com/us/app/due-reminders-timers/id390017969 (checked 2026-09-25).

**What it does well that Inside Story does not yet do**
- A reminder that is not dismissed keeps coming back until it is dealt with. For people with ADHD this is the single feature most often named as the reason they keep using it.
- Setting a reminder takes two taps with preset times ("in 1 hour", "tonight").
- Natural language entry ("call dentist tomorrow 9am").

**What Inside Story already does better**
- Reminders know about context: a bill's rule, an upkeep item's last-done date, a work benefit's reset date, and a dose's clash with a meal. Due knows only a time.
- Did I Do It answers the other half of the problem Due cannot: "did I already do it?"
- Runs on Android and Windows. Due does not.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "Keep reminding me until I mark it" on any reminder, with an interval the person picks | `lib/reminderPreferences.ts` for the setting, `lib/reminderSchedule.ts` to schedule the repeats, cancelled when the matching `done_check_marks` row or record appears. `NUDGES_WHILE_OVERDUE` already exists for some kinds, so this extends it to routines, checks and free reminders | JS (`expo-notifications`) | None | Small to Medium |
| Mark done or snooze from the notification itself | Notification action buttons through `expo-notifications` categories, writing the mark when tapped | JS, already in the build | None | Small |
| A plain one-off reminder ("move the laundry in 40 minutes") | New `quick_reminders` table or a destination for a capture note, with preset times | JS | None | Small |
| Natural language dates in capture ("tomorrow 9am") | A small on-device date parser in `lib/captureNotes.ts` (for example `chrono-node`, pure JS) that offers a date when it finds one, never assumes | JS | None, parsed on the device | Small |

### 2.9 Sortly (where things are kept, inventory)

**What it is.** A visual inventory with photos, folders for places (garage, shelf, box), custom fields, QR and barcode labels, and low-stock alerts. It started as a home inventory app and in 2026 is priced for small businesses. iPhone, Android, web.

**Pricing.** Free: 100 items, 1 user. Advanced $49/month, Ultra $149/month, Premium and Enterprise higher; about 20% off paid yearly. Sources: https://help.sortly.com/hc/en-us/articles/360035774271-Sortly-Pricing-Plan-Information and https://www.capterra.com/p/169199/Sortly-Pro/pricing/ (checked 2026-09-25). For a household the free tier is the only realistic option, and 100 items fills quickly.

**What it does well that Inside Story does not yet do**
- A photo on every item and every place, so "the blue box on the top shelf" can be seen, not remembered.
- Print a QR label, stick it on a box, scan it later to see everything inside without opening it.
- Places nest (house > garage > shelf 2 > red bin).
- Low-stock alerts and custom fields such as serial number and purchase price (useful for insurance).

**What Inside Story already does better**
- Where did I put it searches kitchen items, capture notes and the garden in one box, and every answer says how old it is and warns when it is stale. Sortly does not age its answers.
- Food items draw down as meals are logged and ticked grocery lines add to them. Sortly counts only what is typed.
- Free and unlimited.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| A photo on an item or a place | `photo_uri` column on `kitchen_items`; picker already in the build; on desktop the phone-only photo rule in `lib/desktop/phoneOnly.ts` applies | JS | Photos stay on the device; they would make encrypted sync snapshots larger | Small to Medium |
| Nested places (room > shelf > bin) | A `places` table with a parent id, as an open list; `lib/whereIsIt.ts` search walks the path | JS | None | Medium |
| QR labels for boxes | Generate a QR per place with a pure JS generator, print through `expo-print` (in the build), scan with the camera already used for barcodes | JS | The label carries only an id, no contents | Medium |
| Pantry expiry dates ("use by") with a reminder | `use_by` column on `kitchen_items`, a new kind in `lib/reminderSources.ts`, a "use soon" band in `KitchenSection.tsx` | JS | None | Small |

### 2.10 Medisafe (medication reminders) and the phone's own Medical ID

**What it is.** The most downloaded medication reminder: dose alarms, refill reminders, a "Medfriend" who is alerted when a dose is missed, drug interaction warnings, and measurements. iPhone and Android. For emergency information the comparison is the phone's built-in Medical ID (Apple Health) or Emergency information (Android), which is free and readable from a locked screen.

**Pricing.** Since January 2026 the free tier covers only 2 medications. Premium $4.99/month or $39.99/year; Medfriend alerts, custom sounds and themes are Premium. Sources: https://pillo.care/blog/medisafe-not-free-what-to-do and https://apps.apple.com/us/app/medisafe-medication-management/id573916946 (checked 2026-09-25; figures come from app-store listings captured by third parties between April and August 2026). Medical ID: free, built into the phone.

**What it does well that Inside Story does not yet do**
- Refill reminders from a pill count: it knows how many are left and warns before they run out.
- A named person is told when a dose is missed.
- Drug to drug interaction check across everything entered.
- Medical ID is readable by a paramedic from the locked screen; Inside Story's Emergency lens says plainly that it cannot be.

**What Inside Story already does better**
- Doses are timed against meals, with cited food and nutrient interactions (levothyroxine and calcium, iron). Medisafe checks drug against drug, not drug against breakfast.
- Supplements count toward nutrient totals, split food from supplement, per day from start and end dates.
- Emergency summary includes conditions, allergies and healing stage, and can be shared as text or printed.
- No two-medication limit.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Pills on hand and a refill reminder ("about 6 days left") | `quantity_on_hand` and `refill_lead_days` columns on `treatments`, drawn down by taken doses in Schedules > Meds, a `refill` kind in `lib/reminderSources.ts`, shown in `components/MyMedsSection.tsx` | JS | None | Medium |
| Tell a caregiver when a dose is missed | Needs a message to leave the phone: the peer link in `lib/peerRelationships.ts` could carry a missed-dose record once `meds` is marked ready, but only as fast as the shared folder syncs | JS; instant alerts need the content-blind relay | Health data leaving the device: must be opt-in per relationship, and the relay can carry only a wake-up, never the medicine name | Large |
| Help the person put their summary into the phone's Medical ID | A guided screen in `components/EmergencySection.tsx` that shows the text to copy field by field and opens the phone's setting. Writing it directly is not possible from an app | JS | None | Small |
| A printable wallet card | `lib/emergency.ts` already produces plain text; lay it out as a card through `expo-print` | JS | The printed card is the person's choice | Small |

### 2.11 Todoist (tasks for work and life, fast capture)

**What it is.** The best known to-do app: projects, due dates typed in plain words, recurring tasks, labels, priorities, a voice capture feature (Ramble) that turns speech into tasks, widgets, email forwarding into the inbox. Every platform.

**Pricing.** Free (Beginner): 5 projects, reminders, quick add. Pro $7/month or $60/year ($5 a month). Business about $8 to $10 per user per month. Todoist raised prices in December 2025. Sources: https://www.todoist.com/pricing and https://www.usecarly.com/blog/todoist-pricing/ (checked 2026-09-25).

**What it does well that Inside Story does not yet do**
- A task list with due dates, recurrence and projects. Inside Story's Work lens holds benefits and a weekly check-in, but no list of things to do.
- Quick add from anywhere (widget, share sheet, keyboard shortcut) with the date understood from the words.
- Shared projects with other people.

**What Inside Story already does better**
- The capture inbox asks nothing at the moment of capture and sorts later, which suits the second audience better than Todoist's project and date prompts.
- Work strain is set beside symptoms; Todoist has no idea what work costs the body.
- No productivity score. Todoist has Karma points and streaks.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| A to-do destination for capture notes, with an optional date and repeat | New `tasks` table (or reuse `done_checks` with a due date), a band in `components/WorkSection.tsx` and a personal one in Life, reminders through `lib/reminderSources.ts` | JS | None | Medium |
| Share into the app from any other app (a link, a sentence, an email) as a capture note | Android share intent handling; the `.is` intent filters already exist in `app.json`, so a text intent filter is a config change | Native config, forces an EAS rebuild | None | Small plus the rebuild |
| Quick-capture widget | As AnyList | Native, rebuild | None | Large |

### 2.12 Goblin.tools (ADHD helpers)

**What it is.** A set of small helpers for neurodivergent people: Magic ToDo breaks a task into steps (with a "spiciness" slider for how finely), Estimator guesses how long something takes, Judge reads the tone of a message, Formalizer rewrites text in a chosen tone, Compiler turns a brain-dump into a list, Chef writes a recipe from what is on hand. Web, iPhone, Android.

**Pricing.** The website is free, with no ads or paywall, and the owner says it will stay that way. The phone apps carry a small one-time price to cover running costs (about $1 to $2 depending on the store; not confirmed for 2026). An optional Pro subscription at a "low monthly" price adds extras. Source: https://goblin.tools/About (checked 2026-09-25).

**What it does well that Inside Story does not yet do**
- Turns "clean the kitchen" or "do my taxes" into small first steps, which is the hardest part of starting for many people with ADHD.
- Turns a messy brain-dump into a tidy list.
- Tone checking for messages, which many autistic users value.

**What Inside Story already does better**
- Keeps the result: routines, checks and the record of doing them. Goblin.tools remembers nothing.
- Stays on the device. Goblin.tools sends every word to an AI service.

**Gaps**

| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Break a task into steps and save them as a routine | Needs a language model. On-device models on phones are not yet practical in this Expo build; a cloud model conflicts with the no-server stance unless the person explicitly opts in, sees what is sent, and nothing health-related is included | Native (on-device model) or a server call | Conflict unless strictly opt-in, text only, stated boundary (the same shape CLAUDE.md sets for photo food recognition) | Large |
| A non-AI version: step templates for common hard starts (taxes, moving, a doctor's appointment, cleaning a room) that become routines | Static library in `lib/routines.ts`, "Start from one of these" in `RoutinesSection.tsx`, shared with the Routinery gap | JS | None | Small to Medium |
| Turn a capture note into a routine or several checks | Sorting action in the capture inbox that splits lines into `routine_steps` | JS | None | Small |


Note on the Due row above: `NUDGES_WHILE_OVERDUE` in `lib/reminderSchedule.ts` repeats by the DAY and only for `upkeep` and `compost` today. Minute-level repeats for routines, checks and one-off reminders would be a new mechanism beside it, not a one-line change.

## 3. Gap synthesis

Across twelve apps, the same few patterns separate the category leaders from Inside Story's Life tab:

1. **Things that keep asking.** Due's repeat-until-done, Medisafe's refill warning and missed-dose alert, Sweepy's daily list. Inside Story reminds once (upkeep and compost nudge daily). For the second audience, a reminder that fires once and is swiped away is close to no reminder.
2. **Time made visible.** Tiimo and Routinery give every step a length and a shrinking timer. Inside Story's routines already show one step at a time, which is the harder half, but carry no time at all.
3. **Visible without opening the app.** Every leader has home-screen widgets, lock-screen or watch presence. Inside Story has none. This is the only large gap that needs a native module and an EAS rebuild.
4. **Getting data in without typing.** Bank files (YNAB, Monarch), barcodes onto the list (OurGroceries), photos on items (Sortly), share-sheet capture (Todoist), recipe import (AnyList). Inside Story is almost entirely hand-typed in Life.
5. **Starting from something, not a blank screen.** Sweepy's room templates, Routinery's routine library, Goblin.tools' task breakdown. Inside Story's Upkeep and Routines both start empty.
6. **A to-do list.** Nothing in Life holds a plain task with a date. Capture notes can be sorted but have nowhere to land as a task.

What nobody else has, and should be kept rather than traded away: routines, checks, meds, meals and bills in one record; reminders that know context (dose against meal, upkeep against last done); health money (deductible, FSA, EOB); stale-answer warnings on where things are; and a record that never scores, streaks or shames. Four of the twelve competitors (Sweepy, Tiimo, Routinery, Todoist) rely on points, streaks or leaderboards; Inside Story's refusal is a selling point for the audience that has been burned by them.

## 4. Ranked recommendations (most value per effort first)

| Rank | What | Lens and files | JS or native | Size |
|---|---|---|---|---|
| 1 | Notification actions: Done and Snooze buttons on every reminder, writing the Did I Do It mark | `lib/reminderNotifications.ts`, `done_check_marks` | JS | Small |
| 2 | Keep reminding until marked, per reminder, with a chosen interval | `lib/reminderSchedule.ts`, `lib/reminderPreferences.ts` | JS | Small to Medium |
| 3 | Pills on hand and refill reminders | `treatments`, `components/MyMedsSection.tsx`, `lib/reminderSources.ts` | JS | Medium |
| 4 | Minutes on routine steps, a total, a visual timer, and the next step read aloud (`expo-speech` is already installed) | `routine_steps`, `lib/routines.ts`, `components/RoutinesSection.tsx` | JS | Medium |
| 5 | Starter libraries: routines for hard starts, upkeep by room | `lib/routines.ts`, `lib/upkeep.ts` | JS | Small |
| 6 | Use-by dates in Kitchen with a "use soon" band and reminder | `kitchen_items`, `KitchenSection.tsx`, `lib/reminderSources.ts` | JS | Small |
| 7 | Bank file import (CSV, OFX) with duplicate check, category rules, and "these look like bills" | `lib/financeDb.ts`, `finance_entries`, new `finance_rules` | JS | Medium |
| 8 | A task destination for capture notes, with optional date, repeat and reminder; natural-language date offered, never assumed | `lib/captureNotes.ts`, new `tasks`, `WorkSection.tsx` | JS | Medium |
| 9 | Barcode straight onto the grocery list and into non-food Kitchen items | Scanner result action, `lib/groceryDb.ts`, `lib/kitchenDb.ts` | JS | Small |
| 10 | Photos and nested places for where things are kept; QR box labels | `kitchen_items`, new `places`, `lib/whereIsIt.ts`, `expo-print` | JS | Medium |
| 11 | Wallet card print and a guided copy into the phone's Medical ID | `lib/emergency.ts`, `EmergencySection.tsx` | JS | Small |
| 12 | Batch these into one native rebuild: home-screen widgets (next routine step, grocery list, quick capture) and a text share intent into capture | New widget library, `app.json` intent filter | Native, one EAS rebuild | Large |

Items 1 to 11 all ship over the air. Item 12 should be gathered into a single rebuild, per the standing rule. None of these requires a server; automatic bank linking, voice-assistant skills and AI task breakdown do, and are left out on privacy grounds unless the owner decides on a strictly opt-in outside call.

## 5. Pricing summary

| App | Lens it matches | Free tier | Monthly | Yearly | Lifetime or one-time | Family or sharing |
|---|---|---|---|---|---|---|
| AnyList | Grocery List | Yes, lists and sharing | none | $9.99 individual, $14.99 household | none | Household plan |
| OurGroceries | Grocery List | Yes, with ads | about $1 | about $6 | about $20 (varies) | Free sharing |
| YNAB | Finances | 34-day trial only | $14.99 | $109 | none | Up to 6 people included |
| Monarch Money | Finances | 7-day trial only | $14.99 | $99.99 Core, $199 Plus | none | Partner included |
| Sweepy | Upkeep | Yes, limited | $3.99 | $19.99 | none | Household sharing |
| Tiimo | Routines, day planning | Yes | $12 | $79.99 | none | $119.99/yr for 5 |
| Routinery | Routines | Yes, limited | $3.99 to $7.99 | $27.49 to $39.99 | about $72 on promotion | none |
| Due | Reminders | none | none | optional upgrade pass | $7.99 | iPhone and Mac only |
| Sortly | Where things are kept | 100 items, 1 user | $49 and up | about 20% off | none | 2 users at $49 |
| Medisafe | My Meds | 2 medications | $4.99 | $39.99 | none | Medfriend in Premium |
| Todoist | Work, capture | 5 projects | $7 | $60 | none | Business per user |
| Goblin.tools | ADHD helpers | Web free | Pro "low monthly" | | App about $1 to $2 | none |
| Apple Medical ID / Android Emergency info | Emergency | Free, built in | | | | |
| **Inside Story Free** | All lenses, limited reading | $0 | | | | |
| **Inside Story Individual** | Everything | | $9.99 | $89.99 | | Own devices |
| **Inside Story Partner** | Two people | | $14.99 | $134.99 | | Two people |
| **Household seat** | Read access plus checkoffs | First 2 to 3 free | $1.99 per seat | $17.99 per seat | | |
| **Caregiver** | Another adult | | $4.99 per person | $49.99 per person | | Stackable |

**What people in this category are used to paying.** Single-purpose life apps cluster in two bands. List and chore apps are cheap: $6 to $20 a year, often with a lifetime option, and people resent subscriptions there (Sweepy's missing lifetime plan is a common complaint). Planning, money and medication apps sit at $40 to $110 a year, $5 to $15 a month. The ADHD planners (Tiimo) are at the top of that band. Nearly every one offers a free tier or a trial, and household sharing is usually included or cheap.

**What a person would pay to buy these separately (yearly, best price).** One grocery list (AnyList household $14.99), one budget (YNAB $109 or Monarch $99.99), Sweepy $19.99, Tiimo $79.99, Medisafe $39.99, Todoist $60: about **$315 to $325 a year**, before Routinery (about $28 to $40), and with Due ($7.99) and Goblin.tools (about $2) as one-time extras, but Due is iPhone-only. Sortly's paid plans ($470 or more a year) are left out as business pricing. Inside Story Individual at $89.99 a year covers every one of these lenses, plus food, symptoms, garden and reports, for less than YNAB alone. That is the pricing story for the second audience, provided the gaps ranked 1 to 6 are closed so each lens holds up against the single-purpose app a person would otherwise pick.

A caution on the Free tier: CLAUDE.md's Free line is drawn around food and health and does not mention the Life lenses. Since several competitors give their core free (OurGroceries, AnyList lists, Sweepy basics, Tiimo basics, Goblin.tools web), leaving Routines, Did I Do It, capture and the grocery list free would match what this audience expects and supports the open item "a way in that does not require a condition".
