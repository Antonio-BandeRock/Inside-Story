# Competitive review: the Schedules tab

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Medisafe
- [x] MyTherapy
- [x] CareClinic
- [x] Eat This Much
- [x] Plan to Eat
- [x] Paprika Recipe Manager 3 (replaces Mealime, which shuts down 2026-10-21)
- [x] Waterllama
- [x] Tiimo
- [x] Structured
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What the Schedules tab does today

Source: `app/(tabs)/schedule.tsx` (about 4,960 lines), lens list at the `LENSES` constant.

| Lens | What it does now |
|---|---|
| Meals | Week strip with a dot on any day that has something scheduled; schedule a meal from a template or favorite; repeat daily (forever, N times, until a date); "Log now" turns a plan into a logged meal; "Rotate" swaps a rotating ingredient per day; Planned / Logged / Skipped states; usual meal times prefill; a fasting window blocks scheduling outside it; per-occurrence push to the phone calendar. |
| Today's Meals | The day in clock order, meals and doses interleaved, each dose saying which meal competes with it and how far apart (`lib/doseMealTiming.ts`, `getDayMealAndDoseTimeline` in `lib/db.ts`). Ingredients and steps for cooking. Read-only. |
| Past Meals | A scheduled meal counts as eaten once its date passes; adjust any part (more, less, none); protects food trials that depended on it. |
| Meal Plan | Generator, 1 day up to 6 weeks (`lib/dailyMealPlan.ts`), picked from recipes safe for every selected condition and diet preference at once; rotation memory so recipes do not repeat until all are used; carb ceilings (No Carbs, Low Carb, Any); breakfast rules (no smoothie, no added sweetener); green/yellow/red rating; RDA comparison for a generated day; can include a partner's or family member's conditions. |
| Hydration | Filtered view over beverage meals with a running water total against a combined food-and-drink target; writes hydration to Health Connect when allowed. |
| Meds | One dose timeline for prescriptions, OTC and supplements (defined in Life > My Meds); mark taken or skipped; interaction checks (calcium, iron, zinc timing, fat-soluble vitamins, levothyroxine against calcium or iron, potassium with blood pressure drugs, metformin and TSH) under "Things to check"; per-dose notification. |
| Appointments | Doctor, lab, nutritionist, trainer, other; one-hour-before notification; import from and push to the phone calendar (`lib/deviceCalendar.ts`, `expo-calendar`). No repeating appointments yet. |
| Upkeep | Reads Life > Upkeep items with dates: overdue, soon, later; mark done computes the next due date. |
| Exercise | Placeholder only ("Not built yet"). Health Connect already reads workouts and steps (`lib/healthConnect.ts`) but nothing schedules exercise. |

Cross-cutting reminder system: `lib/reminderNotifications.ts`, `lib/reminderSchedule.ts`, `lib/reminderSources.ts`, `lib/reminderPreferences.ts` (kinds: dose, appointment, meal, hydration, garden, routine, bill, upkeep, benefit, countdown, compost, reminder), quiet hours that hold reminders rather than drop them (doses and appointments never held), a 15-minute Snooze button on the notification (`lib/quietHours.ts`), "nudge until done", and a freshness line on every notification ("Based on your schedule as of ..."). The grocery list is generated from upcoming scheduled meals (`getUpcomingShoppingList`, `app/grocery-list.tsx`, now reached from Life).

What is decided but not built (from CLAUDE.md):
- Contextual dose reminders that move a levothyroxine window when a calcium-rich food has been logged (today the reminder fires at a fixed time; the interaction check is shown in the app, not used to move the alarm).
- Content-blind push relay for cross-device wake-ups.
- Ingredient-rotation feature (open item 3) and batch-remake cadence for ferments (item 18).
- Caregiver role (the `caregiver` connection role exists in `lib/partners.ts`, but meds, schedule and symptoms are `ready: false` in `lib/peerRelationships.ts`, so nothing crosses).

What is missing entirely, found by searching the code:
- No pill count, supply level or refill reminder. The `treatments` table has no quantity-on-hand column.
- No missed-dose alert to another person.
- No home-screen widget.
- No exercise scheduling.
- No repeating appointments, and meals repeat only daily (no "every Monday and Thursday").

## 2. Competitors

Size key: Small = a day or less, Medium = a few days, Large = a week or more. "JS only" ships over the air with `eas update`; "native" forces an EAS rebuild and a reinstall on both phones.

### 2.1 Medisafe (medication reminders)

**What it is.** The best-known pill reminder app. iPhone, Android, Apple Watch, lock screen widget.

**Pricing.** Free tier capped at two medications since January 2026. Premium $4.99 a month or $39.99 a year in the US (the App Store lists a range of $2.99 to $9.99 monthly and $27.99 to $39.99 yearly, so it varies by region and offer). No lifetime, no separate family plan; unlimited Medfriends is part of Premium. Sources: [App Store listing](https://apps.apple.com/us/app/id573916946), [Pillo comparison of the 2026 change](https://pillo.care/blog/pillo-vs-medisafe-comparison). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Refill reminders.** Tracks how many pills are left and warns before you run out.
2. **Medfriend.** A family member or caregiver gets an alert on their own phone when a dose is missed.
3. **Drug to drug interaction checker** across any prescription (US, English only), using a commercial drug database.
4. **Lock screen widget and Apple Watch app** for marking a dose taken without opening the app.
5. **Pill images** so a person can tell two white tablets apart.
6. **Time zone handling for travel** (keep home time or shift to local time).

**What Inside Story already does better.**
- Food against medication timing. Medisafe checks drug against drug; Inside Story's Today's Meals reads each dose against the meals around it (levothyroxine against a calcium-rich breakfast), which no pill app does.
- Supplements carry their nutrients, which feed the day's nutrient totals and the food-first split. Medisafe treats a supplement as just another pill.
- Quiet hours that hold a reminder until morning rather than dropping it, with doses exempt; a freshness line on every notification.
- No account, no server; Medisafe needs an account and stores the medication list in its cloud.

**What each gap would take.**
- *Refill reminders.* Add `supply_on_hand`, `supply_unit`, `refill_lead_days` columns to `treatments` (migration in `lib/db.ts`), a field in `components/MyMedsSection.tsx`, decrement when a dose is marked taken on the Meds lens, and a new dated reminder source in `lib/reminderSources.ts` (the `DatedReminderKind` pattern already used for bills and upkeep). JS only. No privacy conflict. **Small to Medium.**
- *Missed dose alert to a caregiver.* The `caregiver` role exists in `lib/partners.ts` but `meds` is `ready: false` in `lib/peerRelationships.ts`. The transport is the shared-folder merge, which is checked every half minute only while the app is open, so a timely alert on the other person's phone would need the content-blind push relay CLAUDE.md describes (a small server that carries a wake-up and no health content). Native only if push is added (`expo-notifications` remote push needs FCM setup and a rebuild). Privacy: acceptable only through the planned content-blind relay. **Large.**
- *Drug to drug interactions.* The `interaction_rules` table and `lib/interactionRules.ts` already hold cited rules; expanding to all prescriptions would need a licensed drug database (RxNorm is free, interaction data mostly is not since the NLM interaction API was retired). A bundled subset is JS plus data. **Large**, and a scope question more than a coding one.
- *Widget and watch.* Android home-screen widgets need a native module (for example `react-native-android-widget`) and a rebuild; the desktop gets nothing. **Medium**, native.
- *Pill image.* A photo field on `treatments` using the existing picker. JS only. **Small.**
- *Travel time zones.* Dose times are stored as local clock times; a "keep home time" switch in `lib/reminderSchedule.ts`. JS only. **Medium.**

### 2.2 MyTherapy (medication reminders plus a health diary)

**What it is.** A German-made pill reminder with symptom, mood and measurement logging. iPhone, Android, Apple Watch. Widely recommended as the strongest free option.

**Pricing.** Core features free, with ads. Ad-free subscription and "MyTherapy Plus" priced differently by store and region: the US App Store shows an ad-free subscription at $9.99 (a $0.99 trial), and a lifetime Plus at $49.99; some listings in 2026 quote $4.99 a month or $39.99 a year. Treat the exact recurring price as unconfirmed; the lifetime $49.99 is confirmed on the store page. No family plan. Sources: [App Store listing](https://apps.apple.com/us/app/id662170995), [mytherapyapp.com](https://www.mytherapyapp.com/). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Low supply alerts, free.** Enter the pack size and it warns when the pack runs low.
2. **Injection site rotation** for injected treatments (relevant to biologics used in RA, psoriasis, Crohn's, MS, which are among the 19 conditions).
3. **Streaks and a daily adherence view.** (Inside Story has ruled out streaks on purpose; see below.)
4. **Doctor and pharmacy contact cards** kept beside the meds.
5. **Lifetime purchase option**, which many older users prefer over a subscription.

**What Inside Story already does better.**
- Symptoms, meals, labs and meds live in one record, so Pattern Finder and Trends can look across them. MyTherapy's diary sits beside the reminders but does not relate a symptom to food.
- Interaction timing between food, supplements and prescriptions. MyTherapy has none.
- Deliberately no streaks and no praise or blame (a design decision in CLAUDE.md), which suits people who find streaks punishing.

**What each gap would take.**
- *Low supply alerts.* Same change as Medisafe's refill reminder above. **Small to Medium**, JS only.
- *Injection site rotation.* A `dose_sites` table (dose id, site, date), a body-site picker on the Meds lens dose row, and a "next site" suggestion from the last few rows. Pure logic in a new `lib/injectionSites.ts` so a test script can cover it. JS only. **Medium.**
- *Pharmacy and prescriber contact.* Two optional fields (or a link to a contact in Life > Emergency, which already stores contacts) on `treatments`, shown in `MyMedsSection.tsx`, with a tap-to-call. JS only (`Linking` is built in). **Small.**
- *Lifetime price.* A business decision, not code; noted in the pricing section.

### 2.3 CareClinic (chronic illness tracker with meds, care team and appointments)

**What it is.** A Canadian all-in-one self-care app aimed at chronic conditions: meds, symptoms, body map, vitals, diet, activity, appointments, care team. iPhone, Android, web dashboard, Apple Watch, Fitbit.

**Pricing.** Free core logging. Premium about $5.99 a month or $39.99 a year per third-party listings; the US App Store shows a spread of "passes" from $5.99 to $59.99 (including a $59.99 "Full Access"), which suggests monthly, yearly and lifetime-style options with regional and promotional variation. Exact plan names could not be matched to durations. No explicit family plan, but caregivers and dependents can be invited. Sources: [App Store listing](https://apps.apple.com/us/app/tracker-reminder-careclinic/id1455648231), [Capterra](https://www.capterra.com/p/181945/CareClinic/). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Tapering doses.** A dose that steps down over weeks (prednisone is the common case in RA, IBD, lupus flares) is entered once as a schedule.
2. **Invite a caregiver or dependent** into the same record, with remote monitoring.
3. **Web dashboard** for the care team view.
4. **Refill reminders** alongside pill reminders.
5. **Standard questionnaires** (PHQ-9, GAD-7) scheduled as check-ins.

**What Inside Story already does better.**
- Meal planning filtered for every selected condition at once, interleaved with doses. CareClinic logs nutrition but does not plan meals.
- Food and supplement against prescription timing on the day's own meals.
- Local-first with no account; CareClinic stores the care record in its cloud to make the care team view work.
- A desktop app (Electron) that works offline against the same data.

**What each gap would take.**
- *Tapering and non-daily dose schedules.* This is the most important finding on this tab. `RepeatConfig` in `lib/db.ts` is daily only ("weekly/custom-day recurrence is deliberately out of scope for this pass"), and `treatments.frequency` is free text. Several of the 19 conditions routinely use non-daily dosing: weekly methotrexate (RA, psoriasis), biologic injections every 1, 2 or 4 weeks, weekly or monthly vitamin D, B12 injections, and prednisone tapers. Work: extend `RepeatType` to `weekly` (chosen weekdays) and `every_n_days`, plus a `taper` step list (dose amount per date range) on the treatment; update the series generator that tops up about 60 days ahead (around `lib/db.ts` line 15447 onward), the `RepeatPicker` in `app/(tabs)/schedule.tsx`, and `lib/reminderSchedule.ts`. The same weekday repeat serves meals, appointments and the unbuilt Exercise lens. JS only. No privacy issue. **Medium** for weekly and every N days, **Medium** again for tapers.
- *Caregiver in the same record.* Same as Medisafe's Medfriend: `lib/peerRelationships.ts` has `meds`, `schedule` and `symptoms` at `ready: false`. Turning them on for the `onTheirBehalf` holding is mostly allowlist and merge-rule work (`lib/peerMerge.ts`), which is JS only; timeliness is limited to the half-minute folder check while the app is open. **Large** (the consent and tier rules in CLAUDE.md's Caregiver tier must be built with it).
- *Scheduled questionnaires.* A check-in kind in `lib/reminderSources.ts` that opens a Signals form. Standard scales carry licensing and clinical-claim questions (see the "never diagnose" rule and `scripts/audit_clinical_claims.js`). JS only. **Medium.**
- *Web dashboard.* Conflicts with the no-server stance; the desktop app plus the PDF reports already cover "show the doctor". Not recommended.

### 2.4 Eat This Much (automatic meal planner)

**What it is.** Generates a full day or week of meals to hit calorie and macro targets, then produces a grocery list. iPhone, Android, web.

**Pricing.** Free tier plans one day at a time. Premium in the US App Store: $8.99 a month, yearly options from $47.99 to $84.99 (promotions vary); the company's own help pages quote $5 a month billed yearly or $9 month to month. No lifetime. No family plan as such (a household can scale servings). Sources: [App Store listing](https://apps.apple.com/us/app/eat-this-much-meal-planner/id981637806), [Eat This Much help: subscriptions](https://eatthismuch.groovehq.com/knowledge_base/categories/subscription-management/topics). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Calorie and macro targets drive the plan.** Each day is solved to a calorie number and a protein, carb, fat split, with per-meal targets.
2. **Budget ceiling** per day (as low as about $10).
3. **Virtual pantry.** Planning prefers what is already in the kitchen, and the grocery list subtracts it.
4. **Leftovers and batch cooking.** Cook once, eat the same dish at two or three later meals, and the plan fills those slots automatically.
5. **Swap one meal** and the rest of the day rebalances.
6. **Grocery delivery** to Instacart and AmazonFresh (US and Canada).
7. **Weekly plan by email** each week without opening the app.

**What Inside Story already does better.**
- Condition safety for every selected condition at once, with a green, yellow, red rating, healing stage and diet preference, and a partner's or family member's conditions in the same plan. Eat This Much knows diets (keto, paleo, vegan) but not conditions.
- Rotation memory across up to six weeks so variety is built in, which serves the gut-healing goal.
- Full RDA comparison per day, and food-first against supplements.
- Doses on the same timeline as meals.

**What each gap would take.**
- *Calorie and macro targets.* The generator in `lib/dailyMealPlan.ts` already applies carb ceilings and the adjustable protein, fiber and sodium targets (item 16 in CLAUDE.md). Extending the scoring to prefer a calorie band and a macro split is JS only. Must be framed with care, since the app is not a weight-loss tool and some of the 19 conditions (IBD, celiac) involve under-eating; offer it as optional. **Medium.**
- *Use what is in the kitchen.* Half built already: the grocery list subtracts Kitchen stock (`kitchenCoverageFor` in `lib/groceryList.ts`, `kitchen_items` table with `quantity_remaining`, which garden harvests and ferments also feed), and cooking draws stock down with a preview (`lib/kitchenUsage.ts`). What is missing is the planning side: `lib/dailyMealPlan.ts` never looks at the kitchen, so it cannot prefer a recipe that uses the spinach that has to go this week. Add a small score bonus for recipes that `kitchenCoverageFor` says are mostly covered. JS only. **Small to Medium.**
- *Leftovers.* A "makes N servings, eat again at" option when scheduling from the Meal Plan: create extra `schedule_items` rows linked to the same meal, and have the generator skip those slots. JS only. **Medium.** Ties directly to open item 18 (batch cadence for ferments).
- *Swap one meal and rebalance.* The generator already picks per slot; a "swap" on a pick that reruns only that slot against the day's remaining budget. JS only. **Small to Medium.**
- *Budget ceiling.* Only possible where prices are recorded; Trends > What It Costs already refuses to guess a price, so this would work only from the person's own recorded prices. **Medium**, low priority.
- *Grocery delivery.* Instacart's developer platform would send the list off the device to a third party, which is a privacy choice the person would have to make each time. A plain "share list as text" (already possible through the system share sheet) covers most of the value. Not recommended beyond sharing.

### 2.5 Plan to Eat (recipe collector plus planning calendar)

**What it is.** Collect recipes from any website with a browser clipper, drag them onto a calendar, get a grocery list. Web, iPhone, Android.

**Pricing.** $5.95 a month or $49 a year, 14-day free trial with no card. No free tier, no lifetime. One account is shared by the household on as many devices as it likes, so the price covers a family. Source: [plantoeat.com](https://www.plantoeat.com/), checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Import a recipe from any web page** with one click, including ones found on blogs.
2. **Drag and drop on a calendar** to move a meal to another day.
3. **Save a whole week or month as a reusable plan** and drop it onto a future week.
4. **Notes on the calendar** for non-food events ("late meeting, something quick").
5. **Shared household calendar** included in the one price.

**What Inside Story already does better.**
- Plan to Eat does not know what is safe for anybody. Every recipe is equal. Inside Story's generator only picks from recipes safe for all selected conditions and diets, and scores each ingredient.
- Kitchen stock and garden harvests subtract from the grocery list.
- Past meals count automatically, feeding Trends and Pattern Finder.

**What each gap would take.**
- *Import a recipe from a web link.* Most recipe sites publish a schema.org "Recipe" block in the page. A new `lib/recipeImport.ts` that fetches the page, reads that block, then maps each ingredient line to the reference database through the existing food lookup, with every unmatched line shown for the person to pick. Imported recipes need to run through the same scoring as hand-built ones before they can appear under Meals You Can Eat or in the generator. JS only (`fetch` is built in; the share sheet can hand a URL to the app through the intent filters already in `app.json`, though adding a new "share a link to Inside Story" target needs a rebuild). Privacy: the phone fetches a public page directly, nothing personal leaves it. Note the standing rule favoring home cooking; web recipes fit that. **Large** because of ingredient matching.
- *Move a meal to another day.* A "Move to" day picker on a scheduled meal row in `MealsLens` (updates `schedule_items.scheduled_for` for one occurrence). Drag and drop across a week strip is possible with the existing gesture handler but a picker is simpler and more accessible. JS only. **Small.**
- *Save and reuse a week.* A `saved_plans` table holding meal ids by day offset, "Save this week as a plan" and "Use a saved plan starting on..." on the Meals lens. JS only. **Medium.**
- *Calendar notes.* A `schedule_items` row with `item_type` of `note`, shown in the week strip. JS only. **Small.**
- *Shared household calendar.* The architecture exists (peer merge through a shared folder, shopping list already merges between two people). Adding the `schedule` area for meals only to `lib/peerRelationships.ts` is the next step. JS only. **Medium to Large.**

### 2.6 Paprika Recipe Manager 3 (one-time purchase recipe, pantry and planner)

**What it is.** Long-standing recipe manager with a meal calendar, grocery list and pantry. iPhone, iPad, Android, Mac, Windows. Chosen in place of Mealime, which [announced in its store listings](https://mealthinker.com/blog/mealime-alternative) that it shuts down on October 21, 2026.

**Pricing.** One-time purchase per platform: about $4.99 on iPhone and Android, $29.99 on Mac and Windows (prices vary by country and sales). Free cloud sync between devices. No subscription, no family plan (everyone signs in to the same sync account). Paprika 4 is announced with family member accounts. Sources: [paprikaapp.com Windows page](https://www.paprikaapp.com/windows/), [Google Play](https://play.google.com/store/apps/details?id=com.hindsightlabs.paprika.android.v3&hl=en_US&gl=US). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Pantry with expiry dates**, and a grocery list aisle order.
2. **Cooking mode**: screen stays awake, tap to cross off steps, **timers detected from the recipe text** ("simmer 20 minutes" becomes a tap-to-start timer).
3. **Scale a recipe** to any number of servings and convert units.
4. **Pay once.** Long-time users cite this as the reason they stay.
5. **Monthly calendar view** in addition to day and week.

**What Inside Story already does better.**
- Condition-aware planning and scoring, doses on the same day, nutrients per day, Past Meals feeding Trends. Paprika has no health layer at all.
- Kitchen stock is drawn down when you cook, with a preview; Paprika's pantry is a manual list.

**What each gap would take.**
- *Timers in cooking steps.* Today's Meals already shows steps. Parse durations out of step text in a pure `lib/stepTimers.ts`, render a "Start 20 min timer" chip, and schedule a local notification through the existing `expo-notifications` setup (`lib/reminderNotifications.ts`). Keeping the screen awake while cooking needs `expo-keep-awake`, which is not in `package.json` today, so that half waits for the next native rebuild; the timers themselves are JS only. **Small to Medium.**
- *Expiry dates in the kitchen.* Add `use_by` to `kitchen_items`, a field in the Kitchen lens, and a dated reminder kind in `lib/reminderSources.ts` ("spinach, use by Thursday"). Feeds the generator bonus described under Eat This Much. JS only. **Small to Medium.**
- *Scale servings.* The generator plans per person; a household serving count on the scheduled meal that multiplies the grocery list lines. Partly present through partner planning. JS only. **Medium.**
- *Month view.* A month grid alternative to the week strip in `MealsLens`, reading the same dot data. JS only. **Small.**

### 2.7 Waterllama (water tracker)

**What it is.** A playful water tracker with characters, challenges and widgets. iPhone and Apple Watch first; an Android version was not confirmed.

**Pricing.** Free core tracking. The US App Store lists "Full Access" from $0.99 a month, an annual option, and one-time (lifetime) purchases between $8.99 and $19.99. The exact annual price was not shown. No family plan. Sources: [App Store listing](https://apps.apple.com/us/app/water-tracker-waterllama/id1454778585), [healthcare.toolsinfo.com](https://healthcare.toolsinfo.com/tool/waterllama). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **One tap to log a drink** from a widget, the lock screen, the Control Center or the watch, without opening the app.
2. **Hydration factor per drink**: coffee and tea count at less than 100 percent, milk and broth differently, across 150 drinks, and caffeine is totalled.
3. **Goal that adjusts for weight, activity and hot weather.**
4. **Smart reminders** spread through waking hours.
5. **Streaks, challenges and characters** (deliberately not wanted in Inside Story).

**What Inside Story already does better.**
- Counts water from food as well as drinks, against the age and sex based target from the nutrient analysis, which is the honest total. Waterllama counts only what is tapped in.
- A drink is a full beverage record with ingredients and nutrients, so a smoothie counts toward vitamins as well as water.
- Writes hydration to Health Connect on Android.
- Coffee timing against levothyroxine (`lib/coffeeAdvisory.ts`) is surfaced; Waterllama only counts caffeine.

**What each gap would take.**
- *One tap to log water.* Today adding a drink on the Hydration lens opens a form (source, time, am or pm). Inside the app: a row of quick buttons ("Glass 250 ml", "Bottle 500 ml", the person's usual drink) at the top of `HydrationLens` in `app/(tabs)/schedule.tsx` that write a beverage meal at the current time. JS only. **Small.** Outside the app: a "+ glass" action button on the hydration reminder itself, the same mechanism as the existing Snooze button in `lib/reminderNotifications.ts`, is JS only and **Small**; an Android home-screen widget is native and **Medium**.
- *Hydration factor and caffeine total.* Caffeine is already imported from barcodes (`lib/barcodeLookup.ts`) and the reference database carries water per food. A caffeine line for the day on the Hydration lens is JS only and **Small**. A per-drink hydration factor would be a new scored property, and by the Rule Engine discipline in CLAUDE.md it needs a cited basis (the Beverage Hydration Index studies exist) before it goes in. **Medium.**
- *Goal that moves with heat and activity.* Steps and workouts already arrive from Health Connect (`lib/healthConnect.ts`). Weather would be a location lookup, which the external data program (CLAUDE.md item 27) says must go through the Worker with a coarsened location, opt-in. Activity adjustment alone is JS only, **Small to Medium**; weather waits on item 27.
- *Reminders that stop when the goal is met.* `lib/reminderSchedule.ts` already builds each day's reminders; skip the remaining hydration reminders once the day's total reaches target. JS only. **Small.**

### 2.8 Tiimo (visual day planner for ADHD and autism)

**What it is.** A visual day planner built for neurodivergent people: the day as a color and icon timeline, a circular countdown for the current activity, routines as checklists, and an AI helper that breaks a task into steps. iPhone, iPad, Android, web, Apple Watch. Apple's iPhone App of the Year at the 2025 App Store Awards.

**Pricing.** Free tier on mobile. Pro $7.99 a month or $79.99 a year; a family plan at $119.99 a year for up to five people. The web planner and AI features are Pro only. The official site does not show prices, so these come from a third-party summary; treat them as likely rather than confirmed. Sources: [tiimoapp.com](https://www.tiimoapp.com/), [Lifestack pricing summary](https://lifestack.ai/blog/tiimo-pricing). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.** This matters because CLAUDE.md names the second audience (ADHD, autism, anyone carrying too much) as having as strong a claim on the app as the health one.
1. **The whole day on one visual timeline**: appointments, meals, meds, chores and routines together, with icons and colors, and "now" marked.
2. **A visible countdown for the current activity** (a shrinking circle), plus Live Activities and widgets so it shows on the lock screen.
3. **Time estimates** on tasks, and the day shows whether it fits.
4. **Break a task into steps** with AI help.
5. **Mood and energy check-ins** tied to the day.
6. **Calendar sync** so outside events land on the timeline.

**What Inside Story already does better.**
- Routines walk one step at a time and write the "did I do it" mark at the step (`lib/routines.ts`), so "did I take my pill" can be looked up later without a second record. Tiimo ticks a checklist but keeps no lookup-able record of each act.
- Days Until counters, Upkeep, bills, garden and meds all generate reminders through one system with quiet hours that never hold a dose.
- The health layer: doses read against meals, and the food and symptom record behind it.
- No account, and no AI sending your tasks to a server.

**What each gap would take.**
- *The whole day on one timeline.* This is the largest single gap on the tab for the second audience. Today's Meals already interleaves meals and doses by clock (`getDayMealAndDoseTimeline` in `lib/db.ts`). Extending the same timeline to appointments, routines with a time, upkeep due today, dated reminders from `lib/reminderSources.ts`, and phone calendar events (`lib/deviceCalendar.ts` already reads the calendar for import) would make one "Today" lens: a pure builder in a new `lib/dayTimeline.ts` so a test script can cover it, rendered on Schedules and offered as a Home card through `lib/homeSections.ts`. It stays read-only, the rule Today's Meals already follows. JS only. No privacy issue (all local). **Medium.**
- *Countdown for the current thing.* A "now" marker and "next in 25 minutes" line on that timeline is JS only and **Small**. A lock-screen countdown as an Android ongoing notification with a chronometer is possible through `expo-notifications`, JS only, **Small to Medium**; a true widget or an iPhone Live Activity is native, **Large**.
- *Time estimates.* An optional minutes field on routine steps and scheduled items, summed on the timeline. JS only. **Small to Medium.**
- *AI task breakdown.* Would send the task text to a model server, which conflicts with the local-first stance unless it is an explicit opt-in with a stated boundary, the same line CLAUDE.md drew for photo food recognition. Not recommended now.
- *Mood and energy check-ins.* Signals already has sensory and regulation check-in tags (1.0.39.3). A time-of-day check-in reminder kind is JS only. **Small.**

### 2.9 Structured (timeline day planner)

**What it is.** A day planner that lays tasks, calendar events and reminders on one vertical timeline, with "Replan" to push unfinished items forward. iPhone, iPad, Mac, Android, web, Apple Watch.

**Pricing.** Almost everything free, no ads, no data sold. Pro in the US: $6.99 a month, $49.99 a year, or $99.99 lifetime per the company's 2026 figure; older lifetime prices of $29.99 and $64.99 still circulate and regional prices differ (some regions show $32.99). No family plan. Sources: [Structured help: What is Structured Pro](https://help.structured.app/en/articles/324674), [TilTaken on the lifetime price](https://www.tiltaken.com/articles/structured-app-lifetime-price). Checked 2026-09-25.

**What it does well that Inside Story does not yet do.**
1. **Calendar import** that keeps outside calendar events on the timeline automatically, not one at a time.
2. **Replan**: everything not done today moves to tomorrow in one tap.
3. **Inbox** for tasks with no time yet, dropped onto the day later.
4. **Recurring tasks** on any pattern (weekdays, every N days, monthly).
5. **Energy level** per task, to put hard things at a good time of day.

**What Inside Story already does better.**
- The capture inbox exists (Life, reaching Home) along with the "where did I put it" search; Structured has no record of places.
- Skipped and planned meals are kept as a record rather than moved or dropped; Past Meals turns plans into data automatically.
- Health reminders are smarter (freshness line, quiet hours that never hold a dose).

**What each gap would take.**
- *Automatic calendar import.* `lib/deviceCalendar.ts` imports one event at a time into Appointments. Reading today's and tomorrow's events straight from the phone calendar onto the proposed day timeline, without copying them into the database, is JS only (`expo-calendar` is already installed and permissioned). The desktop has no phone calendar and would say so through `lib/desktop/phoneOnly.ts`. **Small to Medium.**
- *Replan.* For meals, Inside Story deliberately keeps a missed plan as "Planned" rather than moving it, which serves the record. A "move what is left of today to tomorrow" for non-meal items (upkeep, timed capture notes) is JS only and **Small**; for meals it should create a new occurrence and keep the old one as Skipped, so the record stays honest.
- *Any-pattern recurrence.* The same `RepeatConfig` extension described under CareClinic; one piece of work serves meals, meds, appointments and exercise.

## 3. Gap synthesis and ranked recommendations

### Where Inside Story already leads

No app reviewed puts meals, doses and supplements on one clock and checks each dose against the food around it. No meal planner reviewed plans for health conditions, let alone several at once or across two people. No pill app reviewed knows what a supplement contains. Every competitor that shares data between people does it through its own server; Inside Story does it without one. Those are the things to protect while closing the gaps below.

### Where it falls short

The gaps cluster into four groups: **medication logistics** (supply, refills, non-daily and tapering doses, caregiver alerts), **the day as one picture** (a single timeline for everything, outside calendar events, a visible "what now"), **low-effort logging** (one-tap water, actions on the notification, widgets), and **meal planning conveniences** (use what is in the kitchen, leftovers, move a meal, save a week, web recipe import).

### Ranked: most value per effort first

| Rank | Recommendation | Where it goes | Build | Size |
|---|---|---|---|---|
| 1 | **Weekly, every-N-days and chosen-weekday repeats, then tapers.** Weekly methotrexate, biologic injections every 2 or 4 weeks, weekly vitamin D and prednisone tapers are routine for several of the 19 conditions, and today the app can only repeat daily. One change serves meals, meds, appointments and a future Exercise lens. | `RepeatType`/`RepeatConfig` in `lib/db.ts`, the series top-up generator, `RepeatPicker` in `app/(tabs)/schedule.tsx`, `lib/reminderSchedule.ts`; taper steps on `treatments` via `components/MyMedsSection.tsx` | JS only | Medium (repeats), Medium (tapers) |
| 2 | **Supply on hand and refill reminders.** Every pill app has it, Medisafe charges for it, MyTherapy gives it free. | New columns on `treatments`, field in `MyMedsSection.tsx`, decrement on "taken" in the Meds lens, a `refill` kind in `lib/reminderSources.ts` and `lib/reminderPreferences.ts` | JS only | Small to Medium |
| 3 | **One "Today" timeline for everything**: meals, doses, appointments, routines with a time, upkeep due, dated reminders and phone calendar events, with a "now" marker and "next in N minutes". This is the single biggest step for the second audience, and it is mostly assembling records the app already holds. | New pure `lib/dayTimeline.ts` building on `getDayMealAndDoseTimeline`; reads `lib/deviceCalendar.ts`; a Schedules lens plus a Home card registered in `lib/homeSections.ts` and `lib/visualPreferences.ts` | JS only | Medium |
| 4 | **One-tap logging from the notification and inside the app.** "Taken" on a dose reminder, "+ glass" on a hydration reminder, quick glass buttons on the Hydration lens, and hydration reminders that stop once the target is met. | `ensureCategory` in `lib/reminderNotifications.ts` (today its only button is Snooze, which opens the app; a button that records without opening the app would need a background handler, so start with buttons that open the app and record on arrival), `HydrationLens`, `lib/reminderSchedule.ts` | JS only | Small |
| 5 | **Contextual dose reminders**, already decided in CLAUDE.md: when a calcium-rich breakfast has been logged, the levothyroxine reminder says so and suggests the later window. This is the feature no competitor can copy quickly, because it rests on the food database and the interaction rules. | `lib/doseMealTiming.ts` result fed into the dose reminder body in `lib/reminderNotifications.ts`, recomputed on foreground and on every meal save; must pass `scripts/audit_clinical_claims.js` (timing advice only, never "skip the dose") | JS only | Medium |
| 6 | **Meal Plan uses what is in the kitchen**, and **leftovers** (cook once, schedule the rest). The grocery list already subtracts Kitchen stock; the generator does not. | `lib/dailyMealPlan.ts` score bonus via `kitchenCoverageFor` in `lib/groceryList.ts`; leftover occurrences as extra `schedule_items` rows | JS only | Small to Medium, then Medium |
| 7 | **Move a meal to another day, month view, calendar notes, save and reuse a week.** Small conveniences every planner has. | `MealsLens` in `app/(tabs)/schedule.tsx`; a `saved_plans` table | JS only | Small each; Medium for saved plans |
| 8 | **Cooking timers from recipe steps** on Today's Meals, plus use-by dates on kitchen items with a reminder. | New pure `lib/stepTimers.ts`; `use_by` on `kitchen_items`; a dated reminder kind | JS only (keep-awake needs `expo-keep-awake` and a rebuild) | Small to Medium |
| 9 | **Build the Exercise lens.** It is the one lens still marked "Not built yet", while Health Connect already reads workouts and steps. Scheduled workouts on the timeline, with the same repeat patterns from rank 1, and a completed session from Health Connect marking the plan done. | `ComingSoonLens` replacement in `app/(tabs)/schedule.tsx`, a `schedule_items` `item_type` of `exercise`, `lib/healthConnect.ts` | JS only | Medium |
| 10 | **Injection site rotation, pill photo, pharmacy and prescriber contact** on a med. | `MyMedsSection.tsx`, a small `dose_sites` table, `lib/injectionSites.ts` | JS only | Small to Medium |
| 11 | **Caregiver alert when a dose is missed** (Medisafe Medfriend). High value for the Caregiver tier, but it needs the meds area turned on in `lib/peerRelationships.ts` and, for timely alerts, the content-blind push relay CLAUDE.md describes. | `lib/peerRelationships.ts`, `lib/peerMerge.ts`, push relay (Worker plus FCM) | Native (remote push) plus a small server | Large |
| 12 | **Home-screen widget** for today's next dose, next meal and "+ glass". | New native module | Native, rebuild | Medium |
| 13 | **Import a recipe from a web link.** Valuable, but ingredient matching to the reference database is the hard part. | New `lib/recipeImport.ts`, the existing food lookup and scoring | JS only (a new share target needs a rebuild) | Large |

Not recommended: grocery delivery hand-off (sends the list to a third party; plain share already covers it), AI task breakdown (sends text to a server), a web care-team dashboard (needs a server), streaks and challenges (ruled out by the design decisions in CLAUDE.md).

Rebuild note: ranks 1 to 10 all ship over the air. If a native rebuild is scheduled for any other reason, gather `expo-keep-awake` (rank 8) and a widget module (rank 12) into it, per the standing rule to batch rebuild-gated work.

## 4. Pricing summary

All prices US dollars, checked 2026-09-25 from the sources given in each section. Store prices vary by region and promotion.

| App | Free tier | Monthly | Yearly | Lifetime / one-time | Family or shared |
|---|---|---|---|---|---|
| Medisafe | Yes, 2 meds only since Jan 2026 | $4.99 | $39.99 | None | Medfriends included in Premium |
| MyTherapy | Yes, most features, with ads | Unconfirmed (listings show $4.99) | Unconfirmed (listings show $39.99) | $49.99 (Plus) | None |
| CareClinic | Yes, core logging | ~$5.99 | ~$39.99 | Store shows passes up to $59.99 | Invite caregivers and dependents |
| Eat This Much | Yes, one day at a time | $8.99 (app) / $9 (web) | $47.99 to $84.99 (about $5 a month) | None | None |
| Plan to Eat | No (14-day trial) | $5.95 | $49 | None | One account for the household |
| Paprika 3 | No | None | None | $4.99 phone, $29.99 Mac or Windows, per platform | Shared sync account |
| Waterllama | Yes | From $0.99 | Available, price not shown | $8.99 to $19.99 | None |
| Tiimo | Yes, mobile only | $7.99 (third-party figure) | $79.99 (third-party figure) | None | $119.99 a year for up to 5 |
| Structured | Yes, almost everything | $6.99 | $49.99 | $99.99 | None |
| **Inside Story, Free (planned)** | Meals, Hydration and Exercise lenses only | $0 | $0 | None | Household seats below |
| **Inside Story, Individual (planned)** | | $9.99 | $89.99 | None | |
| **Inside Story, Partner (planned)** | | $14.99 for two | $134.99 for two | None | Two full accounts |
| **Inside Story, Household seat (planned)** | First 2 to 3 seats free | $1.99 a seat | $17.99 a seat | None | Read access to plan, list, Trends |
| **Inside Story, Caregiver (planned)** | | $4.99 per person cared for | $49.99 | None | Write access on their behalf |

**What people in this category are used to paying.** Single-purpose apps in this space cluster tightly: **about $5 to $8 a month, or $40 to $80 a year**, with $39.99 to $49.99 a year the most common yearly price. Water trackers and recipe managers sit lower and often sell a one-time unlock ($5 to $30). Lifetime options are common (MyTherapy, Structured, Paprika, Waterllama) and older users in particular look for them. Only Tiimo sells a family plan outright.

Inside Story's Individual price ($9.99 a month, $89.99 a year) is above every single app here. It is defensible only because it replaces several of them: someone using Medisafe plus Eat This Much plus Tiimo would pay about $21 a month or about $170 a year. The Schedules tab has to make that bundle visible. Two things would help: the Free tier currently includes Meals, Hydration and Exercise but not Meds, while MyTherapy gives unlimited med reminders free and Medisafe's move to a two-med cap in January 2026 drew complaints, so leaving basic dose reminders (without the interaction checks) in the Free tier would match what the market now expects. And a lifetime option, even priced high, is worth considering for the Individual tier given how often competitors offer one.
