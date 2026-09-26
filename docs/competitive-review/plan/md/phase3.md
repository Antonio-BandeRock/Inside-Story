### A2. Tapering doses
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** CareClinic · **Theme:** Medication logistics
- **How:** A taper step list on treatments (amount per date range), read by the series generator and the dose reminder text. Prednisone tapers in RA, IBD and lupus flares. Needs A1.

### A4. Injection site rotation
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** MyTherapy · **Theme:** Medication logistics
- **How:** dose_sites table, a body-site picker on the dose row, next-site suggestion from pure lib/injectionSites.ts with a test script.

### A7. Travel: keep home time or shift to local
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** A per-treatment switch read by lib/reminderSchedule.ts when the phone's time zone changes.

### A16. Caregiver or partner sees a missed dose
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life,Schedules,Insights
- **Answers:** Medisafe, CareClinic · **Theme:** Medication logistics
- **How:** Turn on meds, schedule and symptoms for the onTheirBehalf holding in lib/peerRelationships.ts, merge rules in lib/peerMerge.ts, the consent and attestation steps from the Caregiver tier, then a local notification on the other phone after a merge. Timely delivery needs the relay (M1).

### B5. Shrinking ring timer on a routine step
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Tiimo · **Theme:** The day as one picture
- **How:** Drawn with react-native-svg, with an alert when it ends.

### C8. Sorting help for a brain dump
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Home
- **Answers:** Tiimo · **Theme:** Capture, reminders and the second audience
- **How:** Rule-based suggestions (dates, buy, call, place words) in lib/captureNotes.ts. On the phone only.

### C9. Plan by sentence
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Life
- **Answers:** Structured · **Theme:** Capture, reminders and the second audience
- **How:** A rule parser for times and verbs behind the existing voice screen.

### C10. A to-do list with dates and repeats
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Todoist · **Theme:** Capture, reminders and the second audience
- **How:** A tasks table (or done_checks with a due date), a band on Work and a personal one on Life, reminders through lib/reminderSources.ts, repeats through A1.

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
- **How:** Exercise, steps, therapy sessions and overload tags against the person's typical day. Never a limit set by the app.

### E3. Trends > Cycle
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Clue · **Theme:** Cycle
- **How:** Symptoms by cycle day, a builder in lib/trendsMore.ts.

### E4. Cycle shading on any chart
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends
- **Answers:** Oura · **Theme:** Cycle
- **How:** Shaded columns behind TrendLineChart.

### F2. Body readings as outcomes
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Trends
- **Answers:** Welltory · **Theme:** Patterns and Trends
- **How:** "On days after X, resting heart rate was in its usual range N of M times." Needs F1.

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

### I26. A symptom guide in Horticulture
- **Ships by:** Reading content · **Size:** M · **Tabs:** Garden
- **Answers:** PictureThis · **Theme:** Garden
- **How:** "Yellow lower leaves on tomatoes: what it can be", cited, nothing leaves the phone.

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
- **How:** upkeep in the peer allowlist.

### J10. Places inside places
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** A places table with a parent, as an open list; Where did I put it walks the path.

### J11. QR labels for boxes
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** Pure JS QR, printed through expo-print, scanned with the camera already there. The label carries an id only.

### K4. Visit prep questions
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Reports,Insights
- **Answers:** Guava · **Theme:** Reports
- **How:** visit_questions tied to an appointment, reorder and tick off, in the person's words.
