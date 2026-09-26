# Trends tab: competitive review

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Competitors: [x] Bearable, [x] Exist, [x] Guava, [x] Welltory, [x] Cronometer, [x] Visible, [x] Daylio, [x] Oura
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What Trends does today

`app/(tabs)/trends.tsx` (about 3,200 lines) holds 24 lenses, chosen through `LensHub`, over a date picker that reaches 90 days back and 90 days forward (a future range reads scheduled meals).

- **Food and body:** Nutrients (percent of target per day, food and supplement shown apart, dashed 100% line), Condition Scores, What You Eat (variety), Symptoms & Flares (severity by date), Eating Window, Weight, Movement (steps from Health Connect plus hand entries), Labs (every result for a test against the midpoint of its reference range), Hydration, Blood Pressure, Doses Over Time, Nights (nocturia beside evening drinks), Reactions & New Foods, Ferments, Planned and Eaten.
- **Life:** Keeping Up (routines, ticks, upkeep, no scoring), Work, Appointments & Care, Grocery Prices, What It Costs, Garden Yield, Growing Conditions.
- **Analysis:** Pattern Finder (foods eaten 6, 12, 24 or 48 hours before a flare, each compared with how often the food turns up in any ordinary window, `lib/patternBasis.ts`; sleep and treatment changes listed beside it, `lib/patternContext.ts`; "Make this a rule"; "Test this" opens a leave-out-then-return experiment, `lib/foodExperiment.ts`). Therapy Response (`lib/therapyResponse.ts`). "Your usual range" on weight, steps, sleep and labs (10th to 90th percentile of earlier readings, `lib/yourUsual.ts`).
- **Charts:** one hand-drawn line chart (`components/TrendLineChart.tsx`, straight segments, tap a point, optional reference line and second series), horizontal bars and weekly rows (`renderWeekRows`, `components/ReadingBandsView.tsx`). Blank periods draw as gaps with a count, never as zero.
- **Data in:** all by hand or from other tabs, plus Android Health Connect (`lib/healthConnect.ts`) which already reads steps, distance, workouts, glucose, sleep, cycle, weight, blood pressure, heart rate, resting heart rate, HRV, blood oxygen and skin temperature. **Only steps, sleep, weight and blood pressure reach a Trends lens**; heart rate, HRV, glucose, cycle, blood oxygen and skin temperature are stored and not charted. There is no Apple HealthKit connection, so an iPhone gets no wearable data at all.
- **Honesty rules built in:** counts name their denominators, n=1 limits are stated, verdict words ("too high", "ideal", "healthy range") are swept out by test scripts, nothing claims a cause.

What it does not do: correlate any tracked thing against any other (only foods against flares), score a daily mood or energy on a scale and chart it, send a weekly or monthly written summary, overlay two series with a shared time axis beyond one secondary line, show a calendar heat map or year-in-pixels view, or read iPhone health data.

## 2. Competitors

Chosen for being strong at one slice of what Trends does: Bearable, Exist, Guava, Welltory, Cronometer, Visible, Daylio, Oura. Sizes: Small = a day or less, Medium = a few days, Large = a week or more. "OTA" means JS only, ships over the air with `eas update`; "rebuild" means a native module and an EAS build.

### 2.1 Bearable (symptom and mood tracker with correlations)

**What it is.** Mood, symptom and habit tracker aimed at chronic illness and mental health. iOS, Android.

**Pricing** (checked 2026-09-25, https://bearable.app/pricing/): Free tier with unlimited tracking, weekly reports, customizable graphs and 30 days of history. Premium $6.99/month or $34.99/year (the pricing page says the annual is often discounted to $18.99). No lifetime or family plan listed. A sponsored "Bearable Heroes" scheme gives Premium to people who cannot afford it. Note: the home page text read as "$34.99/month", which conflicts with the pricing page; the pricing page figure is used here.

**What it does well that Inside Story does not yet do**
1. **Any factor against any outcome.** 30+ reports, including a "Factor Effect" report: caffeine, meditation, sleep quality, a medication, against mood, a migraine, anxiety. Inside Story's Pattern Finder only looks at foods (and food categories and dimensions) before flares.
2. **Daily mood and energy on a scale**, charted every day, so good days exist as data, not only flares.
3. **Weekly and monthly reports** you do not have to go looking for.
4. **Calendar view** of past days for looking something up at an appointment.
5. **Apple Health, Google Fit and Fitbit** feeding HRV, resting heart rate, temperature and so on into the same correlations.

**What Inside Story does better**
- Bearable reports a correlation strength and leaves the reader to trust it; Inside Story names the denominators, compares each food with an ordinary window of the same length (`lib/patternBasis.ts`), lists sleep and treatment changes beside it without calling them the cause, and offers a leave-out-then-return experiment. That is a more honest and more useful path from "maybe" to "tested".
- Food depth: Bearable logs "ate gluten" as a tag; Inside Story knows every ingredient and nutrient of the meal.
- Local-first: Bearable stores data on its servers (it promises not to sell it).

**Gaps and what it would take**
- *Any-factor Pattern Finder.* Generalize `lib/patternFinder.ts` so the candidates can be check-in tags (`lib/checkinTags.ts`), hours of sleep, doses taken or skipped, steps and hydration, not only foods. `lib/patternBasis.ts` already does the "compared with an ordinary window" arithmetic on a list of keyed moments, so each new source is a function that turns its rows into `MealMoment`-shaped moments. Wording must stay "shows up before", never "causes"; add new sentence generators to the `NAMED` list in `scripts/audit_clinical_claims.js`. JS only, OTA. No privacy issue (on-device). **Medium to Large.**
- *Weekly summary.* See the Exist section; one feature covers both.
- *Calendar view.* See Daylio.

### 2.2 Exist (personal analytics across many sources)

**What it is.** Pulls data from 20+ services (Apple Health, Fitbit, Garmin, Strava, Todoist, calendars, RescueTime, Spotify) plus a daily mood rating and custom tags, then finds correlations. iOS, Android, web.

**Pricing** (checked 2026-09-25, https://exist.io/): one plan, $6.99/month or $62.90/year, 30-day free trial. No free tier, lifetime or family plan. Some third-party listings show $6/month or $57/year, and the US App Store $7.99; the web site figure is used here.

**What it does well that Inside Story does not yet do**
1. **Weekly summary email** that gathers the week's averages and the strongest findings, so the person is told rather than having to open a lens.
2. **Averages per weekday and per month** ("you sleep 40 minutes less on Sundays"), a simple and very readable view.
3. **Custom tags with scales** (1 to 9, percentages, durations) that anyone can add, all of which join the correlation pool.
4. **Pearson correlation across every pair of attributes**, ranked by strength.
5. **Experiments** framed as confirming or ruling out a hunch.

**What Inside Story does better**
- Exist's all-pairs correlation over dozens of attributes will always find something that looks strong by chance, and it does not say how many comparisons were made. Inside Story's per-candidate baseline and the "one run" limit on experiments are more careful.
- Food and nutrition: Exist imports calories from other apps only.
- Exist is a cloud service; Inside Story keeps everything on the device.

**Gaps and what it would take**
- *A weekly "Your week" summary.* A pure builder, for example `lib/weeklySummary.ts`, reading what the lens builders already compute (hydration, steps, sleep, doses, meals logged, flares, any new Pattern Finder candidate) and returning a `ReadingView` for `components/ReadingBandsView.tsx`. Shown as a Home card (registered in `lib/visualPreferences.ts` HomeSectionKey) and as a local notification on a chosen day through the existing expo-notifications reminders. Not an email, since that would need a server. Blank weeks say "not logged". Swept with `READING_FORBIDDEN_WORDS` and added to `scripts/test_output_lenses.js`. JS only, OTA. **Medium.**
- *By-weekday averages.* One more band on each lens with a daily figure (sleep, steps, hydration, flares, symptom severity): the average per weekday with the number of days behind each. A pure helper beside `lib/yourUsual.ts`. OTA. **Small.**
- *Scaled custom trackers.* New tables such as `custom_trackers` and `custom_tracker_entries` (name, scale kind), entered in Signals, drawn by `TrendLineChart`, and fed into the generalized Pattern Finder. Fits the open-lists rule. OTA. **Medium.**

### 2.3 Guava (health records, wearables and labs in one timeline)

**What it is.** Personal health record that syncs patient-portal records (US FHIR), wearables and apps, and lets you track symptoms, meds, cycle and food, then shows trends and correlations. Web, iOS, Android, 20+ languages.

**Pricing** (checked 2026-09-25, https://guavahealth.com/plans): Free $0, which already includes portal sync, device sync, tracking, summaries, trends and correlations. Premium $78/year (shown as $8/month billed yearly, "save 19%", which implies roughly $9.99 when billed monthly; the monthly price was not printed). Premium adds automatic insights across all data, unlimited family profile managers, lab detection from uploaded files, an AI visit-prep assistant and photo nutrient detection. A family discount is mentioned without a price.

**What it does well that Inside Story does not yet do**
1. **Labs arrive by themselves**: from the patient portal, or read from an uploaded lab report, charted per marker with the lab's range.
2. **Every wearable metric on a trend line** (heart rate, HRV, glucose, cycle), side by side with symptoms.
3. **Visit preparation**: a summary of what changed since the last appointment.
4. **Family profiles** managed by one person.

**What Inside Story does better**
- Guava's correlations are generic; Inside Story's food-before-flare analysis with baselines, condition-aware nutrient targets, and "your usual range" worded without verdicts go deeper for someone managing diet.
- No cloud account holding medical records.
- Condition staging, garden, costs and daily-living lenses Guava does not attempt.

**Gaps and what it would take**
- *Chart the Health Connect data already stored.* `lib/healthConnect.ts` already reads heart rate, resting heart rate, HRV, glucose, cycle, blood oxygen and skin temperature, and none of it reaches a lens. Add a "Body Signals" lens (or bands inside Movement and Nights) using `TrendLineChart` and `lib/yourUsual.ts`, with glucose shown as readings with their time and never judged. JS only, OTA, because the native module is already in the build. **Small to Medium.** The highest value per effort in this review.
- *Apple Health on iPhone.* Needs a HealthKit module (for example `@kingstinct/react-native-healthkit`) and entitlements in `app.json`, so a **rebuild**, and the reader in `lib/healthSync.ts` would need an iOS twin. On-device, no privacy conflict. **Large.**
- *Lab import from a report.* On-device text recognition needs a native module (rebuild); an off-device reader would conflict with local-first and would need an explicit opt-in. **Large.** A cheaper step: a lab form that takes a whole panel at once. OTA, **Small.**
- *Since your last appointment.* A band on Appointments & Care (`buildCareView` in `lib/trendsMore.ts`) comparing the stretch since the last visit with the stretch before it, per measured series. OTA, **Small to Medium.** The `r-doctor` report in `lib/reportKinds.ts` could carry the same section.

### 2.4 Welltory (heart rate variability and stress analytics)

**What it is.** Reads heart rate variability from a camera measurement or a wearable and turns it into stress, energy and recovery readings, with a "habit impact" view of how logged habits line up with them. iOS, Android.

**Pricing** (checked 2026-09-25, https://welltory.com/plans/): Annual $99/year (about $8.25/month), Lifetime $599 on the web site (a third-party review reports $299.99 in the App Store), 3-day free trial. The monthly plan is described by Welltory's help pages as archived and web-only, though app stores still listed monthly in-app options in July 2026. Free use is limited. No family plan found.

**What it does well that Inside Story does not yet do**
1. **Heart rate variability made readable**, with a morning reading and its history, from Apple Health, Google Fit or Samsung Health.
2. **Habit impact**: which logged activities tend to line up with better or worse readings.
3. **Hundreds of charts** drawn from whatever the phone's health store holds.
4. **Blood pressure reports** for a doctor, with extra derived figures.

**What Inside Story does better**
- Welltory turns HRV into "stress" and "energy" scores and recommendations, which is the kind of score standing in for a clinician that Inside Story's rules forbid. Inside Story's Blood Pressure lens and "your usual range" stay descriptive.
- Food: Welltory has none to speak of.

**Gaps and what it would take**
- *HRV and resting heart rate over time.* Already read by `lib/healthConnect.ts` ("Kept, not interpreted"). Chart them with `TrendLineChart` plus "your usual range", with no stress or energy score invented on top. Part of the Body Signals lens above. OTA, **Small**.
- *Habit impact on a body reading.* Falls out of the any-factor Pattern Finder once body readings can be an outcome as well as flares: "on days after you logged X, your resting heart rate was in its usual range N of M times". Sentences must describe, not explain. OTA, **Medium** on top of the generalization.
- A camera-based HRV reading needs camera frame processing (native, rebuild) and is out of proportion to the value. Not recommended.

### 2.5 Cronometer (nutrition tracking with custom charts)

**What it is.** The most detailed mainstream nutrition tracker (84 nutrients free, up to 95 on Gold), with biometrics and device sync. iOS, Android, web.

**Pricing** (checked 2026-09-25, https://cronometer.com/gold/index.html): Basic free (reports limited to 7 days). Gold $10.99/month or $59.99/year ($4.99/month equivalent). A Pro tier for practitioners exists and was not priced here. No lifetime or family plan listed.

**What it does well that Inside Story does not yet do**
1. **Custom Charts**: pick any nutrient and any biometric (weight, glucose, a lab, a custom biometric) and plot them on one chart over the same dates. This is the feature Cronometer Gold users mention most.
2. **Nutrition Scores** grouping nutrients by what they support (for example bone health or immunity).
3. **Custom biometrics**, any measurement the person names.
4. **Macro Scheduler**, different targets on different days.

**What Inside Story does better**
- Food versus supplement shown apart on every nutrient reading, supplements counted per day from their start and end dates (`lib/supplementWindow.ts`). Cronometer adds supplements into the total.
- Condition-aware targets and the food-before-flare analysis; Cronometer has no symptom side at all.
- Blank days are gaps, not zeros; Cronometer plots unlogged days as low intake unless you hide them.

**Gaps and what it would take**
- *Two series on one chart, from any two lenses.* `TrendLineChart` already takes `secondaryPoints`, so the drawing exists. What is missing is a "Compare" lens where a person picks any two series (a nutrient from `lib/trendAnalysis.ts`, weight, a lab, steps, sleep, symptom severity) and sees them on one date axis, each on its own scale. A caption must say two lines moving together is not one causing the other. OTA, **Medium**.
- *Custom biometrics.* The same new tables as Exist's scaled custom trackers. **Medium**, counted once.

### 2.6 Visible (pacing for energy-limiting illness)

**What it is.** A Polar-made armband plus app for ME/CFS, Long COVID, POTS, fibromyalgia and EDS: a morning HRV check, a daily energy budget ("PacePoints"), live over-exertion alerts, and symptom and medication tracking with reports for a clinician. iOS, Android.

**Pricing** (checked 2026-09-25; https://www.makevisible.com/ lists features but not prices, prices from https://aelivra.co/explore/compare/visible-review and https://help.makevisible.com/en/articles/12995632-visible-buying-guide): app free; Visible Plus membership $19.99/month or $179.88/year ($14.99/month); Band 2.0 is a separate one-off purchase, reported at $79.70. Both are HSA/FSA eligible in the US. A free research version exists for people who cannot pay. Not confirmed on the official page; treat as approximate.

**What it does well that Inside Story does not yet do**
1. **Today's reading before the day starts**: one morning figure, and a clear daily budget built from it.
2. **Live alerts** from a worn sensor.
3. **Designed for the people Inside Story also serves** (several of the 19 conditions overlap with fibromyalgia and POTS-type fatigue), with pacing education built in.

**What Inside Story does better**
- Food, meds timing, labs and conditions in one place; Visible is activity and heart rate only.
- No hardware purchase needed.
- Visible's "budget" is a score the app sets; Inside Story avoids telling someone what their body can afford.

**Gaps and what it would take**
- *A morning check line.* On Home or Trends, one line per morning: last night's sleep, resting heart rate and HRV beside the person's usual range, from Health Connect. No budget, no score, no advice. OTA, **Small** once Body Signals exists.
- *Live over-exertion alerts* need continuous background heart-rate reading, a native background task and a paired sensor. **Large**, a rebuild, and heavy on battery. Not recommended now.
- *Energy check-in.* A 1 to 5 energy rating in Signals, charted on Trends and usable as a Pattern Finder outcome. Serves the pacing audience and the second (daily-living) audience. OTA, **Small to Medium**, and part of the scaled custom trackers work.

### 2.7 Daylio (micro-journal with mood and activity statistics)

**What it is.** A two-tap daily diary: pick a mood and the activities of the day, and the app builds statistics from it. iOS, Android. Tens of millions of installs; the benchmark for low-effort daily logging.

**Pricing** (checked 2026-09-25; features from https://daylio.net/faq/docs/daylio-faq/about/daylio-premium-features/, prices from https://www.choosingtherapy.com/daylio-app-review/ and the App Store listing https://apps.apple.com/app/id1194023242): a free unlimited version; Premium about $4.99/month or $35.99/year with a 7-day trial. App Store listings also show a $59.99 tier, which may be a lifetime or a regional annual price; not confirmed. No family plan. Premium adds advanced stats, PDF export of records, automatic backups (to the person's own Google Drive or iCloud), a PIN lock and unlimited goals.

**What it does well that Inside Story does not yet do**
1. **Year in Pixels**: every day of a year as one coloured square, so a whole year of mood (or anything scaled) is seen at a glance. The best-known chart in the category.
2. **"Often together"**: for a chosen mood, the activities that appeared on the same days, and for an activity, the mood it tends to sit with.
3. **Logging cost of about five seconds**, which is what keeps people logging (Inside Story's named risk number 1).
4. **Monthly and yearly statistics** screens.

**What Inside Story does better**
- Daylio's "often together" is a plain co-occurrence count with no baseline; Inside Story's comparison with an ordinary window is more careful.
- Everything beyond mood: food, meds, labs, garden, money.
- Daylio also backs up to the person's own cloud drive, so the two are close on privacy; Inside Story adds encryption and multi-device merging.

**Gaps and what it would take**
- *A calendar heat map ("year in squares").* A new component, for example `components/CalendarHeatStrip.tsx`, drawn with `react-native-svg` (already used by `TrendLineChart`), one square per day, colour by a daily value, **an unlogged day drawn as an empty outline, never as the lowest colour** (the gap rule). Usable on Symptoms & Flares, Keeping Up, Hydration, Movement, Nights and any custom tracker. Must pass `scripts/audit_bare_text_on_background.js` and read in both themes. OTA, **Medium** for the component, then **Small** per lens.
- *Quick daily check-in.* Signals already has check-in tags (`lib/checkinTags.ts`, which include positive tags such as good energy and slept well). What is missing is a one-tap mood and energy scale that Trends charts. See scaled custom trackers. OTA, **Small to Medium**.

### 2.8 Oura (smart ring with long-term trends)

**What it is.** A ring that measures sleep, heart rate, HRV, temperature and activity, with an app showing daily scores and a Trends view over weeks, months and years, plus cycle insights. iOS, Android.

**Pricing** (checked 2026-09-25, https://ouraring.com/membership and https://support.ouraring.com/hc/en-us/articles/4409086524819-Oura-Membership, figures via https://www.bettervitals.com/learn/oura-ring-price-2026): membership $5.99/month or $69.99/year (EUR 5.99 and 69.99 in the EU), first month included with the ring; Ring 4 from $349 (up to $499 for some finishes). No free tier for insights beyond a basic view. No family plan.

**What it does well that Inside Story does not yet do**
1. **Long-term trend screens** with week, month and year zoom, and a per-metric "your normal" band drawn behind the line.
2. **Temperature trend and cycle insights** (predicted period, temperature shift).
3. **Tags** on a day ("alcohol", "late meal") that show up on the sleep charts, so a person can eyeball the effect.
4. **Integrations** with apps such as Cronometer and Natural Cycles.

**What Inside Story does better**
- Oura's daily Readiness and Sleep scores are scores standing in for judgement, which Inside Story avoids; its "your usual" is the same idea stated plainly.
- Food, symptoms, meds and conditions: Oura has only tags.
- No hardware and no subscription needed to see one's own data.

**Gaps and what it would take**
- *Draw "your usual" as a shaded band behind the line.* `lib/yourUsual.ts` already computes the 10th to 90th percentile; `TrendLineChart` draws a single dashed reference line. Add an optional shaded band (two y values) to `components/TrendLineChart.tsx`. OTA, **Small**.
- *Week, month and year zoom.* The date picker stops at 90 days. Add 6-month and 1-year ranges, with weekly or monthly averages once a range passes about 90 points so the line stays readable (gapped periods still gapped). Check the SQL in `lib/trendAnalysis.ts` for speed on a year. OTA, **Small to Medium**.
- *Cycle alongside everything else.* `lib/healthConnect.ts` already reads menstruation flow; open item 25 in CLAUDE.md is cycle tracking cross-referenced in Pattern Finder. Show cycle days as shaded columns on any Trends chart and as a context line in `lib/patternContext.ts` (beside sleep and treatment changes, never offered as the explanation). OTA if Health Connect is the source, **Medium**. Manual cycle entry would need a small table, still OTA.
- *Day tags on charts.* Check-in tags plotted as markers under the line on any lens. OTA, **Small** after the heat map or custom tracker work.

## 3. Where Inside Story already leads

No app reviewed does all of these, and most do none:
- **Honest pattern finding**: every count names what it counts against, each candidate is compared with an ordinary window of the same length, flares with no meals before them are left out and said so, and nearby sleep and treatment changes are listed without being blamed. Competitors show a correlation number or an "often together" list with no baseline.
- **A path from hunch to test**: "Make this a rule" and the leave-out-then-return experiment. Exist and Bearable have experiments; neither ties one to a food with a return phase.
- **Gaps drawn as gaps**: a blank week says "not logged" and is counted, never plotted as zero. Cronometer and most mood apps plot a missed day as a low day.
- **Food and supplement kept apart** on every nutrient figure, per day, from each supplement's dates.
- **No verdict words or invented scores**: no readiness, stress or energy score, no "healthy range". Welltory and Oura lead with scores.
- **Breadth**: garden yield, growing conditions, costs, grocery prices, keeping up with daily life, work, ferments, planned versus eaten. Nobody else trends a person's whole life beside their health.
- **Local-first**: nothing sits on a company server. Guava, Exist, Bearable, Welltory, Visible and Oura all hold the data in their cloud.

## 4. Ranked recommendations (most value per effort first)

| # | Recommendation | What it touches | Ships | Size |
|---|---|---|---|---|
| 1 | **Body Signals lens**: chart the heart rate, resting heart rate, HRV, glucose, blood oxygen and skin temperature Health Connect already reads, each with "your usual range" and no score | `lib/healthConnect.ts`, `lib/healthSync.ts` read side, new builder in `lib/trendsMore.ts` + `lib/trendsMoreDb.ts`, `TRENDS_LENSES` in `app/(tabs)/trends.tsx`, `scripts/test_output_lenses.js`, the Your Story tour lens list (`TOUR_LENS_LINES`) | OTA | Small to Medium |
| 2 | **"Your usual" as a shaded band** behind every line, not only a sentence | `components/TrendLineChart.tsx`, `lib/yourUsual.ts` | OTA | Small |
| 3 | **Weekly "Your week" summary** as a Home card and a local notification | new `lib/weeklySummary.ts`, `components/ReadingBandsView.tsx`, `lib/homeSections.ts`, `lib/visualPreferences.ts`, the reminders code | OTA | Medium |
| 4 | **Daily energy and mood scale, plus person-named trackers** (custom biometrics), charted on Trends | new tables (e.g. `custom_trackers`, `custom_tracker_entries`), Signals entry form, a Trends lens, open-list pattern from `garden_custom_terms` | OTA | Medium |
| 5 | **Any-factor Pattern Finder**: sleep, check-in tags, doses, steps, hydration and custom trackers as candidates, and body readings or energy as outcomes, all through the existing baseline method | `lib/patternFinder.ts`, `lib/patternBasis.ts`, `lib/patternContext.ts`, `scripts/test_phase_b_patterns.js`, `scripts/audit_clinical_claims.js` | OTA | Medium to Large |
| 6 | **Calendar heat map** ("a year in squares"), blank days as outlines | new `components/CalendarHeatStrip.tsx` using `react-native-svg`, then one band per lens | OTA | Medium |
| 7 | **Compare any two series** on one date axis, with a caption that moving together is not causing | `TrendLineChart` (`secondaryPoints` exists), a new Compare lens | OTA | Medium |
| 8 | **Longer ranges** (6 months, 1 year) with weekly or monthly rollups | date options in `app/(tabs)/trends.tsx`, queries in `lib/trendAnalysis.ts` | OTA | Small to Medium |
| 9 | **By-weekday averages** band where a daily figure exists | helper beside `lib/yourUsual.ts` | OTA | Small |
| 10 | **Cycle days shaded on charts and as Pattern Finder context** (CLAUDE.md open item 25) | `lib/healthConnect.ts` data, `lib/patternContext.ts`, `TrendLineChart` | OTA | Medium |
| 11 | **Since your last appointment** band and report section | `buildCareView` in `lib/trendsMore.ts`, `lib/reportKinds.ts` | OTA | Small to Medium |
| 12 | **Apple Health on iPhone** | new HealthKit module, `app.json` entitlements, iOS twin of `lib/healthSync.ts` | Rebuild | Large |

Items 1, 2, 8 and 9 together are about a week of work and close most of the visible gap with Oura, Welltory and Guava. Items 3 to 6 close the gap with Bearable, Exist and Daylio and also serve the second audience (daily living), which none of those apps' health depth reaches. Item 12 matters because without it an iPhone user gets no wearable data at all; it should be gathered into the next native rebuild rather than forcing one.

Not recommended now: camera-measured HRV (Welltory), live over-exertion alerts from a worn sensor (Visible), lab import by reading a document off the device (conflicts with local-first unless on-device text recognition is added, which is a rebuild), and any daily readiness or stress score (conflicts with the rule against scores standing in for a clinician).

## 5. Pricing summary

Prices in US dollars, checked 2026-09-25. Figures marked "approx." came from a third-party source or conflicted between sources.

| App | Free tier | Monthly | Annual | Lifetime | Family | Hardware |
|---|---|---|---|---|---|---|
| Bearable | Yes (30 days of history, weekly reports) | $6.99 | $34.99 (often $18.99) | No | No | None |
| Exist | No (30-day trial) | $6.99 | $62.90 | No | No | None |
| Guava | Yes (broad, includes trends and correlations) | approx. $9.99 (not printed) | $78 | No | Discount mentioned, not priced | None |
| Welltory | Limited (3-day trial) | Archived, web only | $99 | $599 web (approx. $299.99 App Store) | No | Optional wearable |
| Cronometer | Yes (7-day reports) | $10.99 | $59.99 | No | No | None |
| Visible | App free, basic | approx. $19.99 | approx. $179.88 | No | No | Band approx. $79.70 |
| Daylio | Yes (unlimited basic) | approx. $4.99 | approx. $35.99 | Unconfirmed ($59.99 tier seen) | No | None |
| Oura | Minimal without membership | $5.99 | $69.99 | No | No | Ring $349 to $499 |
| **Inside Story (planned)** | **Yes: Trends is exercise-only on Free** | **Individual $9.99** | **Individual $89.99** | **No** | **Partner $14.99/mo or $134.99/yr for two; Household seats free for the first 2 to 3, then $1.99/mo or $17.99/yr each; Guardian $0 bundled; Caregiver $4.99/mo or $49.99/yr per person** | **None** |

**What people in this category are used to paying.** Single-purpose trackers cluster at $5 to $7 a month and $35 to $70 a year (Bearable, Exist, Daylio, Oura's membership), with annual plans discounted steeply, often 50% or more. Broader health-record or clinical-style apps sit at $8 to $11 a month and $60 to $100 a year (Guava, Cronometer, Welltory). Only hardware-backed chronic-illness tools charge more (Visible near $20 a month). Inside Story's Individual price of $9.99 a month and $89.99 a year sits at the top of the software-only range, which is defensible only because it replaces several of these apps at once (a Cronometer, a Bearable and a Daylio together cost about $130 a year). Two cautions: the annual price is a smaller discount (25%) than the category norm, and Free's Trends being exercise-only is narrower than Bearable, Guava and Daylio, whose free tiers all include some trend or correlation view. A free tier that shows at least a short history of symptoms and one "your usual range" would match what people expect to try before paying. Family plans are rare in this category, so Partner and Household pricing is a point of difference.



