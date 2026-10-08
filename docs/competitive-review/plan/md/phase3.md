### A2. Tapering doses
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** CareClinic · **Theme:** Medication logistics
- **How:** A taper step list on treatments (amount per date range), read by the series generator and the dose reminder text. Prednisone tapers in RA, IBD and lupus flares. Needs A1. Built 1.0.57.1: steps entered on Life > My Meds as a first day plus amount and days per step (treatment_taper_steps, lib/taper.ts); reminders, Home, Schedules > Meds and Today's Meals show the day's amount with (step N of M); new reminder times preset to stop on the taper's last day; the med's own dose applies outside the taper.

### A4. Injection site rotation
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** MyTherapy · **Theme:** Medication logistics
- **How:** dose_sites table, a body-site picker on the dose row, next-site suggestion from pure lib/injectionSites.ts with a test script. Built 1.0.57.2: treatment_injection and dose_sites, a site picker on Taken in Schedules > Meds, Next site on each dose row, and the switch, history and rotation in My Meds; which meds are shots is decided from the med by lib/injectionSites.ts (about 55 injectables tied to their conditions), scripts/test_injection_sites.js.

### A7. Travel: keep home time or shift to local
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** A per-treatment switch read by lib/reminderSchedule.ts when the phone's time zone changes. Built 1.0.57.3: a per-med Move to local time or Keep home time switch in My Meds, a home zone taken from the phone and changeable, an Away from home band and home-time captions on Schedules > Meds, reminders moved onto the local clock at sync (lib/travelTime.ts, treatment_time_mode).

### A16. Caregiver or partner sees a missed dose
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life,Schedules,Insights
- **Answers:** Medisafe, CareClinic · **Theme:** Medication logistics
- **How:** Turn on meds, schedule and symptoms for the onTheirBehalf holding in lib/peerRelationships.ts, merge rules in lib/peerMerge.ts, the consent and attestation steps from the Caregiver tier, then a local notification on the other phone after a merge. Timely delivery needs the relay (M1). Built 1.0.57.4: a partner link carries a "When a dose is not marked" permission, asked for with a yes or an attestation on the phone whose doses they are; the watching phone gets a "Doses you watch" band on Schedules > Meds and a local alert two hours after an unmarked dose, as soon as a sync brings it. Caregiver and child links and recording on someone's behalf remain open.

### B5. Shrinking ring timer on a routine step
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Tiimo · **Theme:** The day as one picture
- **How:** Drawn with react-native-svg, with an alert when it ends. Built 1.0.57.5: off unless turned on (Profile > Routine Timer, or on the step screen), pause and start again, counts on quietly past the time, the signal a separate switch also off, nothing recorded.

### C8. Sorting help for a brain dump
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Home
- **Answers:** Tiimo · **Theme:** Capture, reminders and the second audience
- **How:** Rule-based suggestions (dates, buy, call, place words) in lib/captureNotes.ts. On the phone only. Built 1.0.57.6: waiting capture notes suggest one or two places with the reason, from past sorting, records and sentence shape; one tap files; 100% right when it spoke on 168 labelled notes and 26/26 on 42 held out (lib/captureSuggest.ts).

### C9. Plan by sentence
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Life
- **Answers:** Structured · **Theme:** Capture, reminders and the second audience
- **How:** A rule parser for times and verbs behind the existing voice screen. Built 1.0.57.7: lib/planSentence.ts reads a sentence into what, when, repeat and end, with the kind and its reason; PlanSentencePanel on Capture shows each part beside its words and saves only on a named button; vague repeats, slash dates and bare months are said and left alone; held-out 19 of 20.

### C10. A to-do list with dates and repeats
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Todoist · **Theme:** Capture, reminders and the second audience
- **How:** A tasks table (or done_checks with a due date), a band on Work and a personal one on Life, reminders through lib/reminderSources.ts, repeats through A1. Built 1.0.57.8: Life > To-Do lens and a To-Do pill on Work, typed as a sentence through C9, one past its day stays open and is never late, repeats through A1, one reminder on the day.

### C17. Progress, made from the person's records
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Home,all tabs
- **Answers:** Finch · **Theme:** Capture, reminders and the second audience
- **How:** Decided 2026-09-26: the word is progress. First a design document: what progress looks like, every way the app can track it, and how each tab screen receives additions and changes. Then the registry (lib/achievementCriteria.ts) is filled from it. Made of records, never awarded; no streaks, levels, points, percentages, praise or animation; nothing regresses; elapsed time counts. Design document written 2026-09-26 (docs/progress-design.md): five kinds (firsts, variety, weeks kept, ready to answer, kept alive), variety plus time with repetition counted once per week, a picture per tab and one Your Progress page; four owner decisions in its section 8 before building. Built 919dc367 and 1.0.57.10: Your Progress page, tab pictures, ready-to-answer lines, long press on a tab's empty screen opens it; four decisions confirmed 2026-09-30.

### C20. One read a day, in order for the person
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Home
- **Answers:** Noom · **Theme:** Capture, reminders and the second audience
- **How:** A picker over the reading corpus by condition and healing stage, remembered so it moves forward, shown as the first Something to Read card.

### C22. Ask a question of your records
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home
- **Answers:** Apple Health · **Theme:** Capture, reminders and the second audience
- **How:** Rule-based routing to Pattern Finder, Trends and search. A model behind it is item Z3.

### D8. One-flow daily check-in
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home
- **Answers:** Bearable · **Theme:** Check-ins and signals
- **How:** Check-in, feeling and flare forms stepped through as one sequence ending on a summary.

### D10. Bowel log with the Bristol scale
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals,Trends
- **Answers:** Cara Care · **Theme:** Check-ins and signals
- **How:** bowel_movements (append-only, local-day rule), pictured types 1 to 7, urgency, blood, pain; a Trends band; a Pattern Finder outcome.

### D11. Body map
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals,Trends
- **Answers:** Guava · **Theme:** Check-ins and signals
- **How:** A tappable SVG outline front and back, checkin_body_regions, and a Trends band of regions.

### D12. Photos of a symptom over time
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Signals
- **Answers:** Guava, Cara Care, Bearable · **Theme:** Check-ins and signals
- **How:** checkin_photos through X1; kept out of anything that travels between people unless named in the allowlist.

### D13. Standard questionnaires
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** CareClinic · **Theme:** Check-ins and signals
- **How:** PHQ-9 and GAD-7 (free to use), fatigue and pain scales after a licence check each, in the assessment framework, shown as each scale's published bands with talk-to-your-clinician wording. Clinical-claims audit.

### D16. Pacing view as a record
- **Ships by:** Over the air (JS) · **Size:** M-L · **Tabs:** Trends,Home
- **Answers:** Visible · **Theme:** Check-ins and signals
- **How:** Shipped OTA in 1.0.57.24: Trends > Pacing reads steps, exercise minutes, therapy sessions and overload or crash tags against the person's typical day (bigger days beside the rest on whether a tag came within two days), and Home's Pacing Today card sets today so far beside it. Never a limit set by the app.

### E3. Trends > Cycle
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Clue · **Theme:** Cycle
- **How:** Shipped OTA in 1.0.57.25: Trends > Cycle numbers every day from the period start before it (60-day reach, spotting starts nothing) and lines up flares by cycle day, each check-in tag by week of the cycle, and mood, energy and stress by week, every count against the days checked in, a cycle day with no check-in a gap. Read over at least six months whatever range is picked; fewer than three cycles says chance can explain a difference. Built as a pure lib/cycleTrends.ts (the pacing.ts precedent) rather than in lib/trendsMore.ts, covered by scripts/test_cycle_trends.js and audit_clinical_claims NAMED.

### E4. Cycle shading on any chart
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends
- **Answers:** Oura · **Theme:** Cycle
- **How:** Shipped OTA in 1.0.57.26: a Shade period days switch on every Trends lens with a line chart (nutrients, Six Dimensions, variety, trackers, symptoms, eating window, weight, movement, groceries, labs) draws the period days logged in Signals > Cycle as pale columns behind the line, with a caption saying they sit side by side and say nothing about what changed what. Only logged days, never a predicted period; spotting alone is not shaded. Off by default, saved as a display setting (trendsCycleShading). Pure lib/cycleShading.ts, handed to TrendLineChart through CycleShadingContext so the food price chart never shades; scripts/test_cycle_shading.js.

### F2. Body readings as outcomes
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends
- **Answers:** Welltory · **Theme:** Patterns and Trends
- **How:** "On days after X, resting heart rate was in its usual range N of M times." Needs F1. Shipped OTA in 1.0.57.27: Pattern Finder offers Body readings as outcomes (resting heart rate, average heart rate, HRV, blood oxygen, glucose, skin temperature; above or below your usual range drawn from the days with a reading, and a day with no reading is left out, never counted as inside). Every candidate gains an after line saying what was read in the window after each day it was eaten or recorded. Pure lib/bodyOutcome.ts; scripts/test_body_outcome.js.

### F5. Experiments beyond food
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** Bearable, Exist · **Theme:** Patterns and Trends
- **How:** subject_kind on food_trials: a bedtime, a supplement, a walk.

### F6. An elimination series
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** Cara Care · **Theme:** Patterns and Trends
- **How:** Queues the next trial when one ends; keeps the one-run limit sentence.

### F7. Stepped reintroduction
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** Monash FODMAP · **Theme:** Patterns and Trends
- **How:** Small, medium, large, then a washout, each step read on its own.

### F8. Glucose as an experiment measure
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** Levels · **Theme:** Patterns and Trends
- **How:** After F10.

### F10. Glucose around each meal
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Insights,Trends
- **Answers:** Levels, Cronometer · **Theme:** Patterns and Trends
- **How:** Pure lib/mealGlucose.ts: rise and time back to the pre-meal level, on Signals Today and a Trends history. "Rose by", never "spiked because of".

### F15. A year in squares
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends,Signals
- **Answers:** Daylio · **Theme:** Patterns and Trends
- **How:** components/CalendarHeatStrip.tsx; an unlogged day is an empty outline, never the lowest colour. Then a small add per lens.

### F16. Compare any two series
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends,Food,Insights
- **Answers:** Cronometer · **Theme:** Patterns and Trends
- **How:** Nutrient, weight, lab, steps, sleep, symptom severity on one date axis, each on its own scale, with a caption that moving together is not causing.

### F18. Tags as marks under a chart
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends
- **Answers:** Oura · **Theme:** Patterns and Trends
- **How:** After F15 or D2.

### F20. Tags against the next night's sleep and heart rate
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Oura · **Theme:** Patterns and Trends
- **How:** With counts and the usual range.

### G2. Recipe from a cookbook photo
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** Samsung Food · **Theme:** Food, scanning and Insights
- **How:** ML Kit OCR is already in the build; the lines go to G1's matcher.

### G9. Log a restaurant or takeaway meal
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** MyFitnessPal · **Theme:** Food, scanning and Insights
- **How:** source restaurant with an estimate flag; a stand-in recipe or ticked ingredients. A chain menu database is Z7.

### G13. Calcium, iron and zinc absorption estimate
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Insights
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** Oxalate and phytate already in the DB; cited coefficients; labelled an estimate with its tier.

### G18. Every ingredient checked, with a named reason
- **Ships by:** Over the air (JS) · **Size:** M-L · **Tabs:** Food,Insights
- **Answers:** Fig · **Theme:** Food, scanning and Insights
- **How:** lib/ingredientFlags.ts: additives, FODMAP ingredients, histamine liberators, gluten grains, per-diet lists and an uncertain class. Allergen-aware wording (item 26). Citations are the work.

### G19. More restrictions to choose
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food,Profile
- **Answers:** Fig · **Theme:** Food, scanning and Insights
- **How:** Histamine, salicylate, sulfite, alpha-gal, nightshade, lectin, each mapped to DB properties or G18.

### G22. A home recipe or whole food in place of a packaged one
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food,Insights
- **Answers:** Yuka · **Theme:** Food, scanning and Insights
- **How:** From the scan result, recipes and reference foods in the same category that score clean.

### G23. Amount-aware cautions
- **Ships by:** Live database, needs owner yes · **Size:** L · **Tabs:** Food
- **Answers:** Monash FODMAP · **Theme:** Food, scanning and Insights
- **How:** Decided 2026-09-26: fructose, glucose and lactose from USDA FoodData Central (public domain, giving excess fructose and lactose), fructans, GOS and polyols from published measurement papers (Muir 2007 and 2009, Biesiekierski 2011, Yao 2014) entered by hand with citations, per-serving cutoffs from Varney et al. 2017 once verified. Monash, Edamam, Spoonacular and the unlicensed GitHub lists are not used. Needs new columns, so waits on the unified database's Phase 5.

### G27. Menu scan, limited
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** Heali · **Theme:** Food, scanning and Insights
- **How:** OCR finds ingredient words and runs condition matching. A model version is Z3.

### G28. Labs without typing
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Insights,Signals,Reports
- **Answers:** Levels, Guava, Guava Reports · **Theme:** Food, scanning and Insights
- **How:** A photo of the sheet through the ML Kit OCR already in the build (no rebuild), a pasted table or CSV, and a whole-panel form; every value confirmed before saving.

### G30. Microbiome test as a typed record
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** ZOE · **Theme:** Food, scanning and Insights
- **How:** A lab-style record for a test the person bought.

### G32. Today grouped by body system or by condition
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** A fold inside Fuel Gauges; says what is counted, never "too low".

### G36. Hydration per drink and a goal that moves
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Waterllama · **Theme:** Food, scanning and Insights
- **How:** A cited hydration index per drink (Rule Engine steps 1 to 3), activity from Health Connect now, heat once F22 exists.

### G37. Optional calorie and macro band in the generator
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Food, scanning and Insights
- **How:** Offered, never default; careful for IBD and celiac where under-eating is the risk.

### G38. A budget ceiling from the person's recorded prices
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Food, scanning and Insights
- **How:** Only where prices exist; never guessed.

### H3. Leftovers and batch cooking
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Meal planning
- **How:** "Makes N, eat again at" links later slots to the same meal; ties to open item 18.

### H6. Save a week and reuse it
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Plan to Eat · **Theme:** Meal planning
- **How:** saved_plans by day offset.

### H9. Shared household meal calendar
- **Ships by:** Over the air (JS) · **Size:** M-L · **Tabs:** Schedules
- **Answers:** Plan to Eat · **Theme:** Meal planning
- **How:** The schedule area for meals only in the peer allowlist.

### H11. Build the Exercise lens
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** CareClinic · **Theme:** Meal planning
- **How:** Uses A1 repeats and Health Connect workouts.

### I1. Care cadence per crop
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Planta · **Theme:** Garden
- **How:** A cited lib/cropCare.ts offering a repeating task series.

### I5. Sowing calendar and expected dates
- **Ships by:** Over the air (JS) · **Size:** M-L · **Tabs:** Garden
- **Answers:** Seedtime, From Seed to Spoon · **Theme:** Garden
- **How:** A cited lib/sowingWindows.ts (weeks from frost, days to sprout and to harvest) filling expected dates and two Days Until counters.

### I7. Companion planting
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Seedtime · **Theme:** Garden
- **How:** lib/companionPairs.ts with evidence tiers; a caption, never a block.

### I8. Bed layout drawn to scale
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Garden
- **Answers:** Seedtime, GrowVeg · **Theme:** Garden
- **How:** Width and length on areas, grid position on plantings, an SVG editor.

### I9. Seed inventory
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Seedtime · **Theme:** Garden
- **How:** garden_seeds with packet date; a planting draws down a packet.

### I11. Pests and beneficial insects
- **Ships by:** Reading content · **Size:** M · **Tabs:** Garden
- **Answers:** GrowVeg · **Theme:** Garden
- **How:** A Horticulture subgroup, following the reading pattern rules.

### I13. Photos on plantings, areas, harvests and piles
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Gardenize · **Theme:** Garden
- **How:** garden_photos through X1.

### I16. What to grow for my conditions
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** From Seed to Spoon · **Theme:** Garden
- **How:** Crops for the person's climate ranked by the condition scoring Food Lookup already uses.

### I20. Read an Ecowitt gateway on the home network
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Ecowitt · **Theme:** Garden
- **How:** Polling by IP (zeroconf and cleartext LAN already in the build) while the app is open.

### I26. What is wrong with a plant, crop by crop
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** PictureThis · **Theme:** Garden
- **How:** What Is Wrong With a Plant, the first band on Garden > Horticulture, starts from the crop, since each crop shows trouble differently (reworked 2026-09-29 by direct instruction; the 1.0.56.4 version read a symptom the same way for every crop and was removed). Pick the crop, then what you see or Show every sign, and it lists that crop's signs grouped as too little of a nutrient, too much of one, watering, soil pH, and diseases that look like a shortage, each citing a page about that crop, then its known problems that show that way and how to confirm it with a soil test and a leaf test. A sign no source for that crop describes is left out rather than borrowed. Built in batches, best documented first: batch 1 is tomato, hops and cannabis (hops and cannabis added as crop guides; cannabis as a crop only, kept on the adult side). lib/cropSigns.ts, scripts/test_crop_signs.js. Nothing leaves the phone; always the likeliest causes, never a diagnosis. Batch 2 (1.0.56.7) adds carrot, beetroot, parsnip, radish, cabbage, broccoli, cauliflower, Brussels sprouts, kale, turnip, cucumber, lettuce, potato, green beans, runner beans, peas, broad beans, spinach, chard and basil, split by kind into lib/cropSignsVegetables.ts and lib/cropSignsHerbs.ts. Batch 3 (1.0.56.7) adds onion, shallot, garlic, leek, courgette, squash and pumpkin, pepper and aubergine (lib/cropSignsAlliums.ts, lib/cropSignsCucurbits.ts, lib/cropSignsSolanums.ts). Batch 4 (1.0.56.8) adds sweetcorn, asparagus, celery, globe artichoke, okra, sweet potato, melon, rhubarb, Jerusalem artichoke, kohlrabi, pak choi and rocket (lib/cropSignsMoreVegetables.ts), 43 crops in all. Batch 5 (1.0.56.9) adds parsley, coriander, mint, rosemary, thyme, oregano, sage, dill, chives, tarragon, lemon balm and lemongrass (lib/cropSignsHerbs.ts), and brings in peach, dry beans, chickpea, lentil, soybean, peanut, ginger, turmeric, collards, mustard greens, Florence fennel, tomatillo and cowpea as full guides with their signs (lib/cropSignsNewCrops.ts), 68 crops in all. Still open for a later batch: olive, sunflower, quinoa, wheat, oats, cranberry, quince, persimmon and nuts as full guides, signs for the fruit that already has guides, and the tropicals. Built 1.0.56.4, reworked 1.0.56.6, batches 2 and 3 1.0.56.7, batch 4 1.0.56.8; later batches open.

### J1. Import a bank export
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** YNAB, Monarch · **Theme:** Money, upkeep and places
- **How:** CSV, OFX or QFX into finance_entries with a duplicate check; the file never leaves the device.

### J5. Give every dollar a job
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** YNAB · **Theme:** Money, upkeep and places
- **How:** A view over finance_budgets.

### J8. Shared chores
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Sweepy · **Theme:** Money, upkeep and places
- **How:** upkeep in the peer allowlist. Built 1.0.56.11: chores left for anyone, taken, or given to yourself, family or a connection; Share with the household sends one through a chores area in lib/peerRelationships.ts, only household = 1 rows crossing through a per-table where.

### J10. Places inside places
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** A places table with a parent, as an open list; Where did I put it walks the path.

### J11. QR labels for boxes
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** Pure JS QR, printed through expo-print, scanned with the camera already there. The label carries an id only.

### K4. Visit prep: questions and one page for the appointment
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Reports,Insights,Schedules
- **Answers:** Guava · **Theme:** Reports
- **How:** visit_questions tied to an appointment, reorder and tick off, in the person's words. Widened 2026-10-06: Capture notes and P25's pharmacist questions can be sent here; what changed since the last visit (meds, supplements, labs, conditions, K1's window); one printed page and PDF per appointment with room for answers; answers recorded after against each question. Notion: https://app.notion.com/p/3f153652f27281aba8e2fdd40d683fb3

### P1. The first week, for someone with no condition and no patience
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Home,Profile
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Design day one, day two and day seven for someone who came to run their day and tracks no condition, before more areas are added: C18 (one clear next thing), Simple View, a first screen the second audience recognises, the interview offering "I'm here for my day, not a condition", and a short list of what the app does by itself versus what it needs. Ahead of new areas, by recommendation. Notion: https://app.notion.com/p/3f153652f2728187b6c8c529c4fee8b0

### P4. One front door for things to remember or do
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** Home,Life,Signals
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Capture as the single way in, offering where a thing belongs (C8 already suggests), then a decision on whether Did I Do It, Routines, Upkeep, To-Do and Days Until stay separate or become views of one record with a kind. Decided before Projects or Things I'm Waiting On are built. Not a removal by default. Notion: https://app.notion.com/p/3f153652f272817abba5c3a1dc1a23c3

### P6. Everything I've recorded, out in open formats
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Profile
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** One export: every table as CSV plus JSON, photos in folders, and an HTML index readable with nothing installed, saved to a folder the person picks, health records separable. App Lock asks again first. Phone and desktop. The first concrete piece of A Life's Inside Story. Notion: https://app.notion.com/p/3f153652f27281e6ba0ad6d8c1adb595

### P9. Accessibility past text size
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** An audit for accessibilityLabel on pressables and icons (TalkBack, VoiceOver), a check that colour is never the only signal, and a Quieter view (plain backgrounds, less texture, reduced motion) that applies instantly for the autism audience. One screen-reader user in the beta (P2). Notion: https://app.notion.com/p/3f153652f272812db2ffe729fe54e3c9

### P10. What your records showed this month
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Insights,Trends
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** A monthly page from a quiet notification and Home: what was recorded, what changed, what tends to follow what (never a cause), finished experiments, things now known, garden and money in a line each. Clinical-claims rules apply, no praise or scores, gaps drawn as gaps. Check first what Insights already holds. Notion: https://app.notion.com/p/3f153652f2728140a574e001b1c5930a

### P12. Sharing between two people past the shopping list
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Food,Schedules,Life
- **Answers:** AnyList, Paprika · **Theme:** Brainstorm review 2026-10-06
- **How:** Extend the allowlist in lib/peerRelationships.ts area by area (meal plan, schedule) with a per-category choice screen (meals and shopping shared by default; symptoms, labs and notes private; medications chosen at setup), carried by the relay (M1). Household read-only seats follow. The Partner tier's main reason to pay. Notion: https://app.notion.com/p/3f153652f272811db0d1ecb5862b72c0

### P15. Conversions: the kitchen
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Food
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Measures by country, a cup of this food in grams from the reference database's density, oven temperatures and gas marks, recipe scaling to measurable amounts, pan sizes, dry to cooked grains and pulses, fresh to dried herbs and yeast, egg sizes by country, butter, sweetener swaps, gelatine and agar. Notion: https://app.notion.com/p/3f153652f272817e8aadd08135114698

### P16. Conversions: food safety, fermenting and preserving
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Food
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Safe inside temperatures, brine and salt by percentage (linked from the Fermentation builder), kombucha and kefir ratios, boiling point and canning times at altitude, safe storage times, canning headspace and jar sizes, each with its source. Notion: https://app.notion.com/p/3f153652f2728113ab3ce31f4950413a

### P17. Conversions: food labels and supplement labels
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Insights
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Salt and sodium, kcal and kJ, per 100 g against per serving, vitamin D, A, E and folate units (IU, mcg RAE, mg, mcg DFE) with why they depend on the form, elemental mineral in a salt (magnesium in citrate, iron in ferrous sulfate). Never suggests a dose. Notion: https://app.notion.com/p/3f153652f2728182837edc5e8687eb18

### P18. Conversions: lab results across countries
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Signals,Trends
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Glucose, HbA1c, lipids, creatinine, urea, uric acid, vitamin D, B12, ferritin, folate, calcium, free T4 and T3 between conventional and SI units, factor and why shown, never in or out of range, saved into labs so Trends draws one line wherever the test was done. Add to audit_clinical_claims NAMED. Notion: https://app.notion.com/p/3f153652f27281cbbb31f26b091b54a4

### P19. Conversions: the body and everyday health
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Height and weight including stones, body temperature with no verdict, drinks toward hydration, a standard drink by country (reuses lib/alcoholCalculator.ts), dose times across time zones beside A7, distance and pace. Notion: https://app.notion.com/p/3f153652f2728184876fd564ee68882b

### P20. Conversions: garden, soil, water and bees
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Garden
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Area, compost and mulch volume for a bed into litres and bags, rainwater caught from a roof, watering by area, spacing to plant count, seeds per gram, KNF and compost-tea dilutions, bee syrup by weight and volume, germination and frost temperatures. Notion: https://app.notion.com/p/3f153652f27281688607df46a2c6dcfb

### P21. Conversions: money and the home
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Price per unit across pack sizes (reading recorded prices), currency at a dated rate the person enters, what an appliance costs to run, fuel economy in L/100 km and US and UK mpg, gas against electric cooking, paper sizes. Notion: https://app.notion.com/p/3f153652f27281c89a55e76103309686

### P22. The kitchen goes down when a meal is saved
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food,Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Saving a meal offers to take what it used off Life > Kitchen, the way offerGardenUse does for the garden; only matching units are taken off and the rest said so; running low goes to the grocery list in one tap. Builds on H1 and H2. Notion: https://app.notion.com/p/3f153652f272814f94a7f6deb88695fe

### P23. What can I make with what I have
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** SuperCook, Paprika · **Theme:** Brainstorm review 2026-10-06
- **How:** Recipes ranked by how much of them the kitchen and garden hold now, filtered by conditions, allergies and diet, each showing what is missing. H1 does this inside the generator; this lets a person ask. Notion: https://app.notion.com/p/3f153652f27281eb836ecee0c38b2148

### P24. What is in season where I live
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden,Food
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** One calendar by region and hemisphere of what is in season to eat and what to sow, kitchen and garden reading the same months, local and native first, region chosen by the person, sourced per region. Notion: https://app.notion.com/p/3f153652f27281afbd0deba11a5f6af2

### P25. Questions for the pharmacist when a med is added
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** On adding a med or supplement, offer questions built from what the app knows (timing rules from A8, other meds on the list, the person's conditions), saved to visit questions (K4) or shared as text. Questions only, nothing about the dose. Notion: https://app.notion.com/p/3f153652f27281f983f5f33f2db82d33

### P26. An evening wind-down for the second audience
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** An optional prompt at a time the person sets: tomorrow's first things, anything to put in Capture, and a wind-down routine from Routines. Done or not, never scored. Notion: https://app.notion.com/p/3f153652f27281e28a54dcd52f85778a

### P29. Sealed visit share: a doctor opens it in a browser with a code
- **Ships by:** Cloudflare Worker · **Size:** L · **Tabs:** Reports,Schedules
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** The person picks what goes in (usually K4's visit page); the doctor opens a link on insidestoryapp.com with a code and it decrypts on their screen, the Worker never seeing the contents. Expires after the appointment by default and can be withdrawn sooner, saying plainly it cannot reach a copy the doctor saved; offers a PDF for the portal or chart. No install or account for the doctor. Notion: https://app.notion.com/p/3f153652f27281e590c9fe4cad6ce01b

### Q1. Reach at least Cronometer's 84 nutrients
- **Ships by:** Live database, needs owner yes · **Size:** L · **Tabs:** Food,Insights,Trends
- **Answers:** Cronometer · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Cronometer tracks 84 against our 40. Add from USDA FoodData Central, which already publishes them: omega-3 ALA, EPA and DHA, omega-6, trans fat, the nine essential amino acids, chromium, molybdenum, fluoride, starch, beta-carotene, lutein and the rest. Ingest and map them in the unified database, carry them across in Phase 5, and only then reach the live file through the swap; never by hand on foods_reference.db. Every Insights and Trends nutrient band reads them with no further change once the code list grows.

### Q4. A recipe library past 1,500 without a paid feed
- **Ships by:** Reading content · **Size:** L · **Tabs:** Food
- **Answers:** Samsung Food, Kitchen Stories · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Grow from 496 by cited sets per condition and per season, and by people: a checked recipe shared as a .is file goes into the receiver's library already scored. A recipe API is a per-call charge and AI generation sends data away, so neither is the route.

### Q6. Home brew that beats Brewfather
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Food
- **Answers:** Brewfather · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Built on the Fermentation builder (batches, strains, yield already done): gravity, ABV, a temperature and gravity log charted free, the iSpindel's published HTTP feed into the batch, stock and cost from Finances, and what no brewing app has: alcohol, histamine and sulfites read against the person's conditions and the next dose.

### Q7. Cooking technique taught through meals the person can eat
- **Ships by:** Reading content · **Size:** M · **Tabs:** Food
- **Answers:** Kitchen Stories, America's Test Kitchen · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The 30 techniques the 496 recipes actually use, each as illustrated steps inside cook mode with a link out to a free video, ordered by what the person's planned meals need next.

### Q8. Thrown out, with a reason, a cost and a compost heap
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food,Garden,Life
- **Answers:** NoWaste · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Mark a kitchen item thrown out from where it sits, with a reason and the price paid, and send it to a heap in Garden. Monthly money and weight, never a score.

### Q9. Seasonal food for every country in scope, joined to the garden
- **Ships by:** Reading content · **Size:** M · **Tabs:** Food,Garden
- **Answers:** Seasonal Food Guide · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Match the Seasonal Food Guide's US data from the same public sources (USDA, state extension), add the other countries the app is built for, and join it to the person's harvest and meal plan.

### Q13. Injection sites picked on a drawn body, with site reactions
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules,Signals
- **Answers:** MyTherapy, CareClinic · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A front and back body outline to pick the site by touch, a site reaction (redness, swelling, a lump) recorded on the dose, and Pattern Finder reading reactions by site.

### Q14. Travel noticed when the zone changes
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** When the phone changes time zone, ask once per med whether to keep home time or shift, offer a stepped shift over a few days for a dose whose timing matters, and move the meal timing checks with it.

### Q16. Upkeep by place, by who, and fitted to the day
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Schedules
- **Answers:** Sweepy, Tody · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Optional rooms or places to group upkeep, who does it, and on a day the check-in reads low the lighter items offered first. No points and no leaderboard.

### Q17. A workout plan that answers to the body
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules,Life
- **Answers:** Fitbod · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Offer the gentler alternative when the check-in reads low or a flare is open, and step a strength workout up from its logged sets, so the plan progresses and also holds back.

### Q19. Cycle shared with a partner by choice
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** Clue Connect · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A relationship in lib/peerRelationships.ts that names period days and predicted dates only, symptoms only if ticked one by one, turned off from either side.

### Q21. A home blood-pressure week
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals,Reports
- **Answers:** SmartBP, Qardio · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A guided seven days of two readings a minute apart morning and evening, the first day set aside as clinic guidance asks, the average and the count of readings carried into the doctor report.

### Q22. Calm for each condition, and where to go further
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals,Life
- **Answers:** Nerva, Calm · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Scripts for flare nights, pain and waiting for results written per condition, the trial-backed programmes (gut-directed hypnotherapy, CBT for IBS) named with how to reach them in the condition reading, and the person’s own recordings played once R1 carries expo-audio.

### Q23. A three-day bladder diary
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals,Reports
- **Answers:** Bladder Journal, U-Night · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** An optional mode for the clinical three days: each void with volume and urgency, leaks, fluid in drawn from what is already logged, the night share worked out, and a page in the doctor report.

### Q26. What each lab marker means
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Insights,Life
- **Answers:** HealthMatters.io, Carrot Care · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A plain entry for every common marker in the lab list: what it measures, what moves it up or down (food, supplements, medicines, timing of the draw), which of the 19 conditions watch it, with an evidence tier and source, opened on tap from any result. Never a verdict on the person’s number.

### Q27. Energy use measured, not guessed
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Insights,Trends
- **Answers:** MacroFactor · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Once several weeks of meals and weight exist, work out energy use from intake against the weight trend, say how many weeks and how many logged days it rests on, show it beside the formula figure, and leave any weight goal to the person.

### Q29. Sun as a vitamin D source
- **Ships by:** Cloudflare Worker · **Size:** M · **Tabs:** Insights,Signals
- **Answers:** dminder · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Skin type and time outdoors as a third vitamin D source beside food and supplements, the UV index from a coarsened opt-in location through the Worker bundle, a burn warning, and the vitamin D lab read beside all three. Second gap review item.

### Q33. Personal bests and volume in Workouts
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends,Signals
- **Answers:** Hevy, Strong · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Best weight and reps per exercise, volume per muscle group by week and an estimated one-rep max, with a mark where a flare or a crash interrupted the run; never a target pushed.

### Q34. Growing conditions on a crop’s own timeline
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends,Garden
- **Answers:** Ecowitt · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Each planting’s grow drawn with the readings from its area across the same weeks, a stretch that ran cold, hot or dry marked in words beside the yield.

### Q38. Varieties and sowing windows for every crop
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Seedtime, Planter · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A variety list per crop with days to maturity to pick from (typed varieties still allowed and kept), and sowing, transplant and harvest windows from the frost dates for all 91 crops with guides rather than 45, per variety where maturity differs.

### Q39. The hive log
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Garden
- **Answers:** BeePlus, Apiary Book, HiveTracks · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Colonies as Garden areas of kind hive: queens (source, marked, date), inspections (brood, temper, stores, queen seen), mite counts and treatments with method and dates, feeding, harvests as yield, swarms, splits and losses kept as history, equipment through Grow Setup, costs through Growing Costs, native and stingless bee boxes as their own kinds. Nothing scores a colony.

### Q40. Reading on bees and keeping them
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Garden,Life
- **Answers:** Apiary Book, BBKA · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Horticulture reading on every kind of bee (honey, bumble, solitary, stingless, native), and every part of keeping them, bee-centred and conventional practice side by side, each described fairly, with evidence tiers; where untreated varroa kills colonies it says so.

### Q41. Preserving the harvest
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden,Food,Life
- **Answers:** Ball Canning, Preserve It · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** From a harvest: can, dry, freeze or ferment, with processing times only from published tested sources (USDA, NCHFP) and their citation, jars kept in Kitchen with a date, drawn down by meals, salt and sugar read against the 19 conditions.

### Q42. Saving seed from what was grown
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** Seed Savers Exchange · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Mark a planting kept for seed: isolation distance and population size per crop from published guides, harvest and drying dates, germination test, and the saved seed lands in the Seeds lens with the planting it came from.

### Q47. To-Do projects
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Todoist, Things · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Projects that hold to-dos, sub-steps under a to-do, a waiting-on state with who and since when, labels and a filter by label, a project finished kept as history; no points, no streaks, no overdue count shown in red.

### Q48. Insurance claims and appeal deadlines
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Reports
- **Answers:** Sheer Health · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Each claim beside its bill and explanation of benefits (scanned), its state, a denial with the appeal deadline counted down through Days Until, the appeal letter laid out from the person’s own visit, lab and med records for them to edit and send; the insurer is never linked and no company reads the claim.

### Q49. Things I am waiting on
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Home
- **Answers:** Things, Todoist · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A list of what is owed to the person: lab results, referrals, refunds, repairs, replies; who it is from, since when, a nudge after the days they choose, and lab results and referrals offered from the records when they arrive.

### Q50. Working life and a resume
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life
- **Answers:** Kickresume, Job Accommodation Network · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Work, education, credentials, skills and accommodations asked for, given and up for review, as records; a resume made from them as .docx, read back with differences offered one at a time; an existing resume imported; health never on it unless the person puts it there.

### Q51. Ready for a trip
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Schedules
- **Answers:** TripIt, Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Dates away: meds counted for the days plus spare, doses moved across time zones (A7, Q14), food for the conditions at the destination, a letter for carried medicines, the emergency card in the local language, upkeep and the garden paused or handed over.

### Q52. Ready for a power cut or disaster
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** FEMA app, Red Cross Emergency · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A go-bag and a supply list built from My Meds and Kitchen and kept current, medicines that need cold with how long they keep, the fridge after an outage with published safe times, contacts on paper; alerts handed to the official apps.

### Q60. Ready for tomorrow
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Schedules
- **Answers:** Structured · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** One evening view over tomorrow’s records (meals, doses, appointments, upkeep, routines), with prep lead time on recipes raising an evening-before task.

### Q61. Break a task into small steps on the phone
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Home
- **Answers:** Goblin.tools, Tiimo · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Steps from starter patterns and the person’s own routines, worked out on the phone with no model; text goes to a model only with an opt-in each time, if ever.

### Q62. Google Drive and iCloud Drive as the shared folder
- **Ships by:** Android rebuild R1 · **Size:** M · **Tabs:** All
- **Answers:** Obsidian Sync, Day One · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The same snapshot sync and backup through Google Drive and iCloud Drive as through OneDrive, the person’s own storage, no company server.

### Q63. A shared recipe readable without the app
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** All
- **Answers:** Paprika · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A received .is recipe also carries a plain page anyone can read, signed content unchanged, so a person without the app still gets the recipe.

### Q64. Reports saved to a remembered folder
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Obsidian · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Save to a folder chosen once and remembered, beside the share sheet, in PDF and open formats.
