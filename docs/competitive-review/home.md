# Competitive Review: Home tab (plus Profile, onboarding, sync)

Checked 2026-09-25. Read-only review; no app code was changed.

## Progress
- [x] App inventory
- [x] Bearable
- [x] Tiimo
- [x] Structured
- [x] Finch
- [x] Todoist
- [x] Apple Health / Google Health (formerly Fitbit) summary
- [x] Cronometer dashboard
- [x] Noom onboarding
- [x] Gap synthesis
- [x] Pricing summary

## 1. What Home does today (verified in code, 2026-09-25)

Home (`app/(tabs)/index.tsx`, about 4,500 lines) is a dashboard of quick-access cards, each one a window into another tab. `lib/homeSections.ts` maps every card to the tab it belongs to, and Home groups cards into fold bands named and coloured after that tab. A few rows stand on their own at the top level because they belong to no tab.

Top-level rows (no tab):
- **Capture inbox** (`app/capture.tsx`): throw a thought down in two seconds, sort it later.
- **Where did I put it** (`app/where-is-it.tsx`): one search over kitchen locations, capture notes filed as places, and plantings still growing, each with its age.
- **Your Story** (`lib/yourStory*.ts`, `components/YourStory*.tsx`, `app/your-story.tsx`): the guided way through the app, told as the person's newspaper. It opens as a one-question-at-a-time interview (conditions, autism/ADHD/dyslexia, parts of life to follow, where to start, meds, healing stage, eating style, allergies, birth date and sex, backup location), then a tour of every tab ("what you can count on it for", every lens, "the fastest way in"), then per-part-of-life step lists where an item is done when its record exists. Cannot be turned off.
- **Shared-folder setup nudge** for backup and sync.

Grouped cards (by tab): the Today card (greeting, date, rotating affirmation, and a sky grid: moon phase, sunrise and sunset, high/low, humidity, UV, air quality, pollen); Low Stimulation switch; quick-log (Log Again) and barcode scan; Grocery List; free-form Days Until counters; Make a Report; Garden tasks, garden Days Until, Log Harvest; Your Day (scheduled meals) and Today's Reminders (doses and more); Symptom Check-In, How You're Feeling, Log a Flare, Blood Pressure, Exercise; Meals Logged Today; Worth a Look; Today's Fuel Gauges (nutrients, split food versus supplement); Week Trend, Variety This Week, Keeping Up, Garden Yield; Something to Read flip cards; Routines; Did I Do It.

Customization: every card can be shown or hidden, folded, and reordered from Profile (`lib/visualPreferences.ts`), with a long-press rearrange on Home; tab backgrounds can be a built-in picture, Off, or the person's own photo. Declaring autism, ADHD or dyslexia in Profile (`lib/neuroProfile.ts`) turns on existing settings (quieter Home, capture, lead-time reminders) without touching food scoring.

Profile and sync: encrypted backup to the person's own OneDrive folder, automatic three-way-merge sync between one person's phone and Windows desktop through that folder (`lib/snapshotSync.ts`, `lib/snapshotMerge.ts`), a Sync Activity log, and the shopping list merging between partners (`lib/peerRelationships.ts`). Health Connect on Android reads steps and writes hydration and nutrition (`lib/healthConnect.ts`); there is no Apple HealthKit link yet.

Not present (checked): no home-screen widgets, no lock-screen or app-icon quick actions, no Apple Health link, no Google Drive or iCloud option, no streaks or points by design, no account or cloud server. Planned but unbuilt (from CLAUDE.md): "Simple View plus one clear next thing on Home", a way in that does not require a condition, what grows on the freed tab screens (made of records, never awarded), left/right-handed layout, the i18n work, and the Free tier line.

## 2. Competitors

### 2.1 Bearable (symptom, mood and health tracker)

**What it is.** A symptom, mood, medication and habit tracker built for chronic illness and mental health, with a correlation engine that shows what tends to go with better or worse days. iOS and Android.

**Pricing** (checked 2026-09-25, https://bearable.app/pricing and https://www.choosingtherapy.com/bearable-app-review/): Free tier covers most logging and weekly summaries. Premium $6.99/month or $34.99/year (often discounted to $18.99/year), 7-day free trial. No lifetime and no family plan listed. A sponsorship program ("Bearable Heroes") gives Premium to people who cannot pay. US prices; other regions not confirmed.

**What it does well that Inside Story does not yet do**
1. **A single "rate today" daily entry card** that sits on Home and captures mood, energy, sleep and symptoms in one flow of taps, with a pleasing end screen. Inside Story splits this across Symptom Check-In, How You're Feeling, Log a Flare and Blood Pressure cards.
2. **Apple Health and Fitbit import** of HRV, resting heart rate, temperature, weight, blood pressure and steps. Inside Story reads only steps from Health Connect and has no iPhone path.
3. **A visible "your weekly report is ready" moment on Home**, even on the free tier.
4. **A pay-what-you-can sponsorship route**, which matters for a chronically ill audience with reduced income.

**What Inside Story already does better**
- Bearable has no food scoring, no nutrient accounting, no meal planning, no garden, no budget, no reading library, no staged healing model. Its "food" is a tag you tick.
- Inside Story keeps everything on the device and in the person's own OneDrive; Bearable is account-based with its own cloud.
- Pattern Finder states its denominators and its baseline (`lib/patternBasis.ts`), which Bearable's correlation bars do not.
- Your Story's interview and tour are deeper than Bearable's setup, which mostly picks which factors to track.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| One-flow daily check-in from Home | A new Home section key in `lib/visualPreferences.ts` and `lib/homeSections.ts` (group `/log`) that steps through the existing check-in, feeling and flare forms (`app/assessment.tsx`) as one sequence, ending on a summary | JS only, over the air | None | Medium |
| More Health Connect reads (weight, sleep, heart rate, blood pressure) | `lib/healthConnect.ts`, `lib/healthSync.ts`, plus Health Connect permissions in `app.json` | Permissions change needs an EAS rebuild | Stays on device; fine | Medium |
| Apple HealthKit | A HealthKit library (for example `react-native-health` or `@kingstinct/react-native-healthkit`) behind the same interface as `lib/healthConnect.ts`; the iPhone build | Native, EAS rebuild | Stays on device; fine | Large |
| "Your week is ready" card | New Home section reading the existing Trends builders (`lib/trendsMore.ts`) once a week | JS only | None | Small |
| Sponsorship or hardship price | Store billing setup when billing is built; no code today | n/a | None | Small once billing exists |

### 2.2 Tiimo (visual day planner, built with ADHD and autistic people)

**What it is.** A visual planner that shows the day as a coloured timeline of icons, with routines broken into steps, a visual countdown timer, and an AI helper that turns messy notes into tasks. Co-designed with neurodivergent users; Apple Design Award winner. iOS, iPad, Mac, Apple Watch, Android and a web planner.

**Pricing** (checked 2026-09-25, https://lifestack.ai/blog/tiimo-pricing and https://www.tiimoapp.com/faq): Free tier is basic visual planning only (no web planner, no AI, no focus timer). Pro $7.99/month or $79.99/year; 7-day trial only with the yearly plan. Family plan $119.99/year for up to 5 people. No lifetime option found. US prices.

**What it does well that Inside Story does not yet do**
1. **The day as one visual timeline** with icons and colours, and "now" marked on it. Inside Story's Home has Your Day (meals) and Today's Reminders (doses and more) as separate cards; Schedules > Today's Meals interleaves meals and doses but not routines, upkeep or appointments.
2. **Home-screen and lock-screen widgets** showing the current task and a running timer. Inside Story has no widget at all.
3. **A visual countdown timer** attached to a task or routine step (a shrinking circle), which is a large part of why ADHD users stay. Routines (`lib/routines.ts`) walk one step at a time but carry no time budget or timer.
4. **AI turning a messy brain-dump into tasks.** Inside Story's Capture holds the thought but the person sorts it by hand.
5. **Family plan pricing for five people**, which Inside Story plans (Household tier) but has not built.

**What Inside Story already does better**
- Tiimo knows nothing about food, medicines, symptoms, conditions, garden, or money. Its reminders are clock reminders; Inside Story's dose reminders read the meals around them (`lib/doseMealTiming.ts`).
- "Did I Do It" and "Where did I put it" answer the two questions Tiimo users ask in forums and Tiimo does not cover: did I already take it, and where is it.
- Inside Story works with no account and no cloud, which suits people wary of handing a daily log to a company.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Whole-day timeline on Home (meals, doses, routines, upkeep, appointments, Days Until, in clock order, "now" line) | Extend `getDayMealAndDoseTimeline` in `lib/db.ts` with routine, upkeep and appointment rows; new Home section key (or grow the existing `yourDay` card); read-only like Today's Meals | JS only | None | Medium |
| Android home-screen widget (next thing, next dose, one-tap Capture) | `react-native-android-widget` or an Expo config plugin in `plugins/`, with the widget reading a small summary the app writes to shared storage | Native, EAS rebuild | Widget text can be seen on a locked phone; needs a "hide health details on widgets" switch in Profile | Large |
| iPhone widget and Live Activity for a running routine | WidgetKit extension through a config plugin (for example `@bacons/apple-targets`) | Native, EAS rebuild, and needs the iPhone build path | Same lock-screen caution | Large |
| Visual timer on a routine step | Optional minutes on `RoutineStep` (`lib/routines.ts`, `app/routine.tsx`), a shrinking ring drawn with `react-native-svg` (already installed), plus an `expo-notifications` alert when it ends | JS only | None | Small to Medium |
| Help sorting a Capture brain-dump | Rule-based suggestions (dates, "buy", "call", place words) in `lib/captureNotes.ts`; an on-device language model would be native and large | JS for rules | Must stay on device; no cloud AI without an explicit opt-in | Medium for rules |

### 2.3 Structured (timeline day planner)

**What it is.** A day planner that puts tasks, events and routines on one vertical timeline, with an Inbox for unscheduled items, calendar import, recurring tasks, an "energy monitor" that shows how heavy a day is, widgets, and an AI helper that builds a plan from a typed or spoken sentence. iPhone, iPad, Mac, Apple Watch, Android and web.

**Pricing** (checked 2026-09-25, https://help.structured.app/en/articles/324674 and https://www.tiltaken.com/articles/structured-app-lifetime-price): Free tier covers the timeline and basic tasks. Pro $6.99/month, $29.99/year, or **$99.99 once for lifetime** (US). 3-day free trial. Pro prices vary by region (purchasing-power pricing); Apple Family Sharing can share a purchase. One purchase covers every platform.

**What it does well that Inside Story does not yet do**
1. **An Inbox that turns into the timeline.** An unscheduled task drags onto the day when there is room. Inside Story's Capture inbox sorts thoughts into places and categories but cannot turn one into a timed item on a day.
2. **Calendar events drawn inside the same day view**, so a doctor's appointment and a dose sit together. Inside Story reads and writes the device calendar for appointments (`lib/deviceCalendar.ts`) but Home does not show other calendar events.
3. **"How full is today" at a glance**: the energy monitor adds up what is planned so someone recovering or in a flare can see an overbooked day before it starts.
4. **A lifetime price.** Chronic-illness users often prefer one payment; this is a strong market signal.
5. **Plan by sentence**: "take levo at 7, walk at 9, groceries after lunch" becomes three timed items.

**What Inside Story already does better**
- Structured has no idea what a medicine or a meal is; it cannot say that a dose sits too close to a calcium-rich breakfast. Inside Story can.
- Structured syncs through its own cloud account; Inside Story's three-way merge through the person's own OneDrive keeps both devices' changes and logs any clash.
- Did I Do It, Days Until, Where did I put it and Routines that double as check marks are outside Structured's scope.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Capture item to a timed item on a day ("Put this on a day") | An action on a capture note in `app/capture.tsx` and `lib/captureNotes.ts` that writes an upkeep item, a dated reminder, or a Days Until counter (`lib/countdown.ts`) | JS only | None | Small to Medium |
| Device calendar events shown in the Home day view | Read-only read through `lib/deviceCalendar.ts` into the whole-day timeline proposed under Tiimo | JS only (expo-calendar already installed) | Stays on device; ask permission with a clear sentence | Small once the timeline exists |
| "How full is today" line | A pure function counting scheduled meals, doses, routines, appointments and upkeep for the day, one sentence on Home, no score and no judgement words (fits the Keeping Up rule set in `scripts/test_keeping_up.js`) | JS only | None | Small |
| Lifetime purchase option | A pricing decision for the tier table when store billing is built | n/a | None | Decision, not build |
| Plan by sentence | Rule-based parser for times and verbs (voice already exists through `expo-speech-recognition` and `app/voice-log.tsx`) | JS only for rules | Must stay on device | Medium |

### 2.4 Finch (self-care pet)

**What it is.** A self-care app where small daily goals, check-ins, breathing and journaling "grow" a pet bird that goes on adventures. Very popular with people with ADHD, anxiety, depression and burnout, because it feels gentle rather than clinical. iOS and Android.

**Pricing** (checked 2026-09-25, https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown and https://habitbox.app/blog/finch-app-review; the official page https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing refused the fetch): Free tier includes all the wellbeing features, no ads. Finch Plus about $9.99/month or $69.99/year in the US, and it is mostly cosmetic. **Prices differ between Android and iOS and by region**; some reviews report an iOS yearly rate far lower (about $14.99). No lifetime found. Could not confirm the exact current figure on each store.

**What it does well that Inside Story does not yet do**
1. **A reason to open the app that is not a chore.** The pet makes the daily return feel like care, not homework. Inside Story has deliberately ruled out streaks, points and levels, and has an approved but unbuilt design for "what grows on the freed tab screens", made of the person's own records.
2. **Tiny, pick-a-few daily goals** set in the morning ("drink a glass of water", "step outside"), each one worth the same.
3. **A warm, gentle voice at the moments of return**, including after a gap, without guilt.
4. **Nearly everything useful is free**, which built a very large audience and word of mouth.

**What Inside Story already does better**
- Finch holds almost no information: no medicines, meals, symptoms linked to foods, reports for a doctor, or "where did I put it".
- Inside Story's "nothing regresses, a gap is a gap and never a zero" rule is kinder than Finch's pet energy that depends on daily effort.
- Inside Story does not need an account; Finch does (for sync).

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Something that grows on Home from the person's records (for example a garden or a bookshelf that fills from distinct foods tried, routines finished, harvests logged), static, no animation | Home section plus `lib/achievementCriteria.ts` (the registry, which today has nothing for Home, Trends, Reports or Life), drawn with `react-native-svg` or `@shopify/react-native-skia` (both installed). The open decision (distinct things versus repetitions) has to be settled first | JS only | None | Large |
| Pick-a-few goals for today | A "today I want to" list on Home backed by Did I Do It checks (`done_check_marks`) so nothing new is stored; wording goes through the Keeping Up forbidden-words sweep | JS only | None | Small to Medium |
| Welcome-back line after a gap | One sentence on the Today card when the last record is days old, pointing to one easy action; no blame words | JS only | None | Small |

### 2.5 Todoist (task list and quick capture)

**What it is.** The best-known task manager. Its strength for this review is capture: a Quick Add bar that understands plain English ("call pharmacy every other Tuesday at 10am"), Ramble (speak a messy list and it becomes separate tasks), a share target so anything in another app can become a task, an Android quick-settings tile, and widgets. Today and Upcoming views are the home screen. iOS, Android, Windows, Mac, web, watch.

**Pricing** (checked 2026-09-25, https://www.usecarly.com/blog/todoist-pricing/ and https://www.todoist.com/help/articles/todoist-business-plan-pricing-update-dF5in65YM): Free ("Beginner", 5 projects, no reminders). Pro $5/month billed yearly ($60/year) or $7 month to month. Business $8 per person per month yearly or $10 monthly. Prices rose in December 2025. No lifetime, no family plan (shared projects work on Free and Pro).

**What it does well that Inside Story does not yet do**
1. **Capture from anywhere**: the Android share sheet, a quick-settings tile, a widget, a watch. Inside Story's Capture is only reachable by opening the app. `app.json` registers only VIEW intents (links and `.is` files), not SEND, so text shared from another app cannot land in Capture.
2. **Plain-language dates**: "every 3 weeks", "the last Friday of the month". Inside Story's upkeep and reminders are set with pickers.
3. **Today and Upcoming as one list** across everything, with overdue at the top. Home has several separate cards instead.
4. **Automatic backups on Pro and a web app**, which Inside Story matches differently (OneDrive backup, desktop app) but has no web app.

**What Inside Story already does better**
- Todoist is a list and nothing else: no health records, no food, no medicine timing, no findings.
- Inside Story's Did I Do It records the moment something was done and can be looked up later; Todoist completion history is thin and aimed at productivity stats.
- Everything is on the device; Todoist is cloud-only.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Share into Capture from any app | A SEND `text/plain` (and `image/*`) intent filter in `app.json`, plus a share-intent library or small config plugin in `plugins/`, routed to `app/capture.tsx` | Native, EAS rebuild | Fine, data stays on device | Medium |
| Android quick-settings tile and app-icon long-press shortcuts (Capture, Did I take it, Where is it) | `expo-quick-actions` (app-icon shortcuts) and a config plugin for a tile | Native, EAS rebuild | None | Small to Medium (gather into the next rebuild) |
| Plain-language dates in Capture and Upkeep | A small date parser (for example `chrono-node`, pure JS) in `lib/captureNotes.ts` and the Upkeep form | JS only | None | Small to Medium |
| One "Today" list on Home across doses, meals, routines, upkeep, Days Until, overdue first | Same whole-day timeline as the Tiimo gap; overdue upkeep from Life > Upkeep | JS only | None | Medium |

### 2.6 Apple Health (Summary tab) and Google Health (the renamed Fitbit app)

**What they are.** The two platform health dashboards. Apple Health's Summary has a Pinned list the person reorders, automatic Highlights ("you slept 40 minutes more than usual"), and Trends that only appear when the phone detects a lasting change, plus Medications with reminders and interaction warnings, and a Medical ID shown on the lock screen. On 2026-05-19 Google renamed the Fitbit app to **Google Health**: a four-tab layout, a "Today" view, and a Gemini-powered Google Health Coach.

**Pricing** (checked 2026-09-25): Apple Health is free with an iPhone (https://support.apple.com/guide/iphone/view-your-health-data-iphe3d379c32/ios). Google Health app is free; **Google Health Premium $9.99/month or $99.99/year** adds the Gemini coach, adaptive plans and clinical record summaries (https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/, https://store.google.com/product/google_health_premium?hl=en-US). Premium is also bundled with some Google One AI plans; regional availability of the coach was not confirmed.

**What they do well that Inside Story does not yet do**
1. **Highlights and Trends that only speak when something changed.** Home shows the same cards every day; it has Worth a Look, but no "this is different from your usual" line even though `lib/yourUsual.ts` already works out the usual range for weight, steps, sleep and labs.
2. **Pinned list reordered by drag, straight on the dashboard.** Inside Story has this (long-press rearrange), so this is parity.
3. **A lock-screen emergency card** (Medical ID). Inside Story has an Emergency lens on Life and an emergency card, but it is not reachable from a locked phone.
4. **Automatic data from the watch and phone sensors**: sleep, heart rate, cycle, walking steadiness, with no typing.
5. **A conversational coach** (Google) that answers "why am I tired this week" over all the data.

**What Inside Story already does better**
- Neither dashboard understands food at the level of a condition, an ingredient's effect, or a healing stage; neither has a reading library, garden, budget, capture or "where did I put it".
- Apple Health's Trends never say what they counted against; Inside Story's rules (denominators, "your usual range", never a cause) are stricter and more honest.
- Google's coach sends health data to Google's cloud; Inside Story does not send anything anywhere.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "Different from your usual" line on Home, silent otherwise | New Home section in the Trends group, reading `lib/yourUsual.ts` and the existing Trends builders; wording checked by `scripts/audit_clinical_claims.js` and the forbidden-words sweeps (never "too low", never a cause) | JS only | None | Small to Medium |
| Lock-screen emergency information | Android cannot place app content on the lock screen except by notification or widget; a persistent, opt-in notification with the emergency card summary, or a lock-screen widget on iPhone | Notification is JS (`expo-notifications` installed); widget is native | Anyone holding the phone can read it: opt-in only, choose which lines show | Small (notification) |
| Sleep, heart rate, weight read automatically | Same as the Bearable Health Connect row; Apple side needs HealthKit | Native, EAS rebuild | Stays on device | Medium (Android), Large (iPhone) |
| A question box over the person's own records ("what did I eat before my last three flares") | Would need an on-device model or a cloud AI. A cloud call breaks the local-first stance unless it is an explicit, opt-in, per-question send. A rule-based "ask" that routes to existing lenses (Pattern Finder, Trends) is possible in JS | JS for routing; native or cloud for a model | Conflict for any cloud model | Large |

### 2.7 Cronometer (nutrition tracker dashboard)

**What it is.** The most detailed consumer nutrient tracker (80+ nutrients from lab-quality sources). Its Dashboard shows energy in and out, macro rings, a row of chosen "highlighted" nutrients as bars toward target, Nutrition Scores grouped by theme (bone health, immune support and so on), and fasting status. Pairs with Cronometer Pro, a paid portal where dietitians see clients' diaries. iOS, Android, web.

**Pricing** (checked 2026-09-25, https://www.garagegymreviews.com/cronometer-review and https://nutriscan.app/blog/posts/cronometer-pricing-2026-basic-vs-gold-vs-pro-b28e621201): Basic is free with ads and full micronutrients. Gold about $59.99/year (about $4.99/month) or about $10.99 month to month; sources disagree (some list $8.99/month), so treat the monthly figure as unconfirmed. Frequent first-year discounts on the web. No lifetime or family plan found. Pro (practitioner) is priced separately.

**What it does well that Inside Story does not yet do**
1. **The person picks which nutrients sit on the dashboard.** Inside Story's Today's Fuel Gauges choose for the person; the split into food versus supplement is a lead Cronometer does not have, but the pick-your-own row is missing.
2. **Nutrition Scores by theme**, which turn 80 bars into a handful of readable groups. Inside Story has the data for this (it scores foods per condition) but Home does not group today's intake by body system.
3. **Fasting timer on the dashboard** for people doing time-restricted eating.
4. **A practitioner portal** so a dietitian sees the diary live. Inside Story makes PDF reports per reader instead, which fits its privacy model.
5. **Widgets** for today's energy and macros on iOS and Android (not confirmed in the sources above, so verify before relying on it).

**What Inside Story already does better**
- Cronometer never says whether a nutrient came from food or a pill; Inside Story does in four places and works it out per day from supplement start and end dates.
- Cronometer has no condition scoring, healing stages, dose-and-meal timing, Pattern Finder with honest baselines, or any of the daily-living tools.
- Inside Story's per-reader PDF reports need no account for the doctor; Cronometer's sharing needs the practitioner to pay for Pro.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Choose which nutrients show on Today's Fuel Gauges | A stored list of nutrient keys (an `app_meta` row, which travels between the person's devices) and a picker using `PopoverSelect`, read by the `fuelGauges` section in `app/(tabs)/index.tsx` | JS only | None | Small |
| Today grouped by body system or by the person's conditions | A pure grouping over the existing nutrient totals, keyed to the conditions in the person's Profile, shown as a fold inside Fuel Gauges; must say what is counted, never "too low" | JS only | None | Medium |
| Fasting window line on Home | Derive "last meal logged at" and "hours since" from existing meal records; optional target window stored in Profile | JS only | None | Small |
| Widget for today's gauges | Same widget work as under Tiimo | Native, EAS rebuild | Lock-screen caution | Large (shared with other widgets) |

### 2.8 Noom (onboarding and daily lessons)

**What it is.** A weight program built on behaviour psychology. Included here for its onboarding, which is the most studied in the category: a long quiz (often 60 to 90 screens) broken up by "reflection" screens that play the answers back ("People who say this usually find mornings hardest"), a projected chart of where the person could be by a date, and a daily Home made of 5 to 10 minute lessons plus a short checklist. Also sells GLP-1 medication programs. iOS, Android, web.

**Pricing** (checked 2026-09-25, https://www.noom.com/blog/how-much-does-noom-cost/ and https://nutriscan.app/blog/posts/noom-med-pricing-2026-glp1-program-cost-cae274c166): Noom Weight about $70 month to month, $169 for a 4-month plan (about $42/month), about $209/year (about $17.42/month); 14-day free trial after the quiz. GLP-1 programs roughly $179 to $299 a month with medication. Discount codes are constant, so list prices are rarely what people pay. No family plan found.

**What it does well that Inside Story does not yet do**
1. **Playing the answers back as a promise.** After the quiz Noom shows a page that says, in the person's own terms, what the program will do for them. Your Story's interview records answers and then tours the tabs; it does not yet end on one page that says "because you told us X, here is what Inside Story will now do for you" (for example: "Your levothyroxine reminders will check your breakfast", "Your meal plan now leaves out gluten").
2. **One short lesson a day, in order**, so learning is paced. Inside Story has a large reading library and Something to Read flip cards on Home, but no sequenced "today's read" tied to the person's conditions and stage.
3. **A tiny daily checklist on Home** (weigh in, log breakfast, read today's lesson), which gives someone a clear first thing. This is the same idea as the CLAUDE.md item "Simple View plus one clear next thing on Home", still unbuilt.
4. **Onboarding on the web before install**, which lets a person see the value before downloading.

**What Inside Story already does better**
- Noom's projected-weight chart and colour-coded foods are the kind of claim Inside Story's rules forbid; Inside Story's evidence tiering and "never a cause" rules are a trust advantage with a chronically ill audience.
- Noom costs several times more and is cloud-based; Inside Story's planned $9.99 Individual tier is far below it.
- Noom asks almost nothing about autoimmune conditions, medicines or allergies; Your Story's interview asks all of these and also asks which parts of life to follow.

**What each gap would take**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "What this means for you" page at the end of the interview | A pure builder in `lib/yourStoryInterview.ts` mapping each answer to the features it switched on (conditions to scoring and advisories, meds to dose timing, style to meal plan, neuro profile to settings), rendered by `components/YourStoryInterview.tsx` before `components/YourStoryTour.tsx`; wording through the clinical-claims audit | JS only | None | Small to Medium |
| One read a day, sequenced for the person | A pure picker over `ALL_DIGEST_ENTRIES` filtered by the person's conditions and healing stage (`lib/conditionStages.ts`), remembered in a small table so it moves forward; shown as the first Something to Read card | JS only | None | Medium |
| "One clear next thing" on Home | Read `view.allItems` from Your Story (`lib/yourStory.ts`) and show the first item not yet done at the top of Home, one line, one button; also the start of Simple View | JS only | None | Small |
| Try-before-install web page | A page on the Cloudflare Worker `inside-story-site` (`docs/app-links`) describing the app by audience; nothing collected | JS/static, no app change | None if nothing is collected | Small |

## 3. Gap synthesis: ranked recommendations (most value per effort first)

Rebuild-gated items (native modules) are marked; gather them into one EAS rebuild, as CLAUDE.md asks.

1. **One clear next thing at the top of Home** (Noom, Finch, Todoist). Read the first undone Your Story item (`lib/yourStory.ts`, `view.allItems`) and show it as one line and one button. JS only, Small. It is also the first piece of the unbuilt "Simple View plus one clear next thing" for the second audience.
2. **"What this means for you" page at the end of the interview** (Noom). Turns ten answers into a list of what the app now does differently. JS only, Small to Medium, in `lib/yourStoryInterview.ts` and `components/YourStoryInterview.tsx`.
3. **"Different from your usual" line on Home that stays quiet otherwise** (Apple Health Highlights and Trends). Built on `lib/yourUsual.ts`, checked by `scripts/audit_clinical_claims.js`. JS only, Small to Medium.
4. **The whole day on one timeline on Home** (Tiimo, Structured, Todoist Today): meals, doses, routines, upkeep, appointments, device calendar events and Days Until, in clock order with a "now" line. Extend `getDayMealAndDoseTimeline` in `lib/db.ts`; read-only like Schedules > Today's Meals. JS only, Medium. Highest value for the ADHD and autism audience.
5. **Choose which nutrients show on Today's Fuel Gauges** (Cronometer). JS only, Small.
6. **Visual timer on routine steps** (Tiimo). `lib/routines.ts`, `app/routine.tsx`, `react-native-svg`. JS only, Small to Medium.
7. **One-flow daily check-in** (Bearable): symptoms, feeling, sleep and flare as one guided sequence from Home, reusing `app/assessment.tsx`. JS only, Medium.
8. **Capture from outside the app** (Todoist): Android share sheet into Capture, app-icon shortcuts (`expo-quick-actions`), quick-settings tile. **Native, EAS rebuild**, Medium. Put in the same rebuild as items 9 and 10.
9. **More Health Connect reads** (Bearable, Google Health): sleep, weight, heart rate, blood pressure into `lib/healthConnect.ts`. **Permissions change, EAS rebuild**, Medium.
10. **Android home-screen widget** (Tiimo, Structured, Todoist, Cronometer): next thing, next dose, one-tap Capture, with a Profile switch that hides health details on the widget. **Native, EAS rebuild**, Large. The single most common feature every competitor here has and Inside Story lacks.
11. **Something that grows on Home made of the person's records** (Finch). Already designed, blocked on the distinct-versus-repetitions decision and on filling `lib/achievementCriteria.ts` for Home, Trends, Reports and Life. JS only, Large.
12. **Apple HealthKit and iPhone widgets** once the iPhone build is a priority. Native, Large.

Deliberately not recommended: streaks, points, projected weight charts, colour verdicts on foods, and any cloud AI coach. Each breaks a standing rule (no praise or blame, evidence tiering, never a cause, local-first). A cloud question box could only come as an explicit, opt-in, per-question send, and even then is a product decision for the owner, not a gap to close.

Pricing moves worth considering (decisions, not builds): a **lifetime option** (Structured sells one at $99.99, and chronically ill buyers like one payment), a **hardship or sponsored seat** (Bearable), and keeping the **useful core free** the way Finch and Bearable do, since that is how both grew.

## 4. Pricing table (US prices, checked 2026-09-25)

| App | Free tier | Monthly | Yearly | Lifetime | Family / household |
|---|---|---|---|---|---|
| **Inside Story (planned)** | Yes: builders, Food Lookup, Meals/Hydration/Exercise, Health Literacy reading | Individual $9.99 | Individual $89.99 | None planned | Partner $14.99/mo or $134.99/yr for two; Household seats free for first 2 to 3 then $1.99/mo or $17.99/yr each; Guardian free with Individual or Partner; Caregiver $4.99/mo or $49.99/yr per person |
| Bearable | Yes, most features | $6.99 | $34.99 (often $18.99) | No | No; sponsorship for those who cannot pay |
| Tiimo | Basic visual planning only | $7.99 | $79.99 | No | $119.99/yr for up to 5 |
| Structured | Yes, timeline and basic tasks | $6.99 | $29.99 | $99.99 | Apple Family Sharing may apply; region-based prices |
| Finch | Yes, all wellbeing features | about $9.99 | about $69.99 (differs by platform and region, unconfirmed) | No | No |
| Todoist | Yes, 5 projects, no reminders | $7 | $60 | No | Business $8 to $10 per person per month |
| Apple Health | Free with iPhone | n/a | n/a | n/a | n/a |
| Google Health (Fitbit) | Free app | Premium $9.99 | Premium $99.99 | No | Bundled with some Google One AI plans |
| Cronometer | Yes, with ads, full micronutrients | about $10.99 (reports vary, $8.99 to $10.99) | about $59.99 | No | No; Pro practitioner portal separate |
| Noom Weight | No (14-day trial) | about $70 | about $209 | No | No; GLP-1 programs $179 to $299/mo |

**What people in this category are used to paying.** Single-purpose trackers and planners (Bearable, Structured, Todoist, Cronometer) sit at $30 to $80 a year, with monthly prices of $5 to $11. Broader health platforms with a coach (Google Health Premium) sit at $99.99 a year. Coached programs (Noom) run $200 a year and up. Inside Story's Individual price of $9.99 a month is at the top of the tracker range, but its $89.99 year is below Google Health Premium while covering food, medicine timing, symptoms, daily living, garden and money in one app, which several of these apps together would cost well over $200 a year to approximate. Two market habits are worth noting: nearly every app here has a generous free tier, and yearly plans are priced at 35 to 60 percent of twelve months, so the yearly price is the one most buyers compare.
