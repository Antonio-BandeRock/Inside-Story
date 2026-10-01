## Phase 0. Decisions only the owner can make (0 items)


## Phase 1. Foundations (10 items)

### A1. Weekly, weekday and every-N-days repeats
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules,Life,Signals
- **Answers:** CareClinic, Structured, Todoist · **Theme:** Medication logistics
- **How:** Extend RepeatType in lib/db.ts with weekly (chosen weekdays) and every_n_days; update the 60-day series generator, RepeatPicker in app/(tabs)/schedule.tsx and lib/reminderSchedule.ts. One piece of work serves meds (weekly methotrexate, biologics every 2 or 4 weeks, monthly vitamin D, B12), meals, appointments, upkeep and Exercise.

### B1. One Today timeline
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Schedules,Life,Signals
- **Answers:** Tiimo, Todoist, Structured, mySymptoms · **Theme:** The day as one picture
- **How:** Pure lib/dayTimeline.ts extending getDayMealAndDoseTimeline with routines, upkeep due, appointments, dated reminders, Days Until, check-ins, flares and sleep, overdue first, a "now" line. A Home card and a Schedules lens, read-only; app/timeline.tsx reads the same builder.

### C1. Buttons on the notification itself
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules,Signals,Life,Home
- **Answers:** Due, Waterllama, Medisafe, Oura, Bearable · **Theme:** Capture, reminders and the second audience
- **How:** expo-notifications categories beside the existing Snooze: Taken, Done, + glass, Log a flare, How are you. Needs an iPhone check once R2 exists.

### D1. Mood, energy and stress on a 1 to 5 scale
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Signals,Trends
- **Answers:** Bearable, Visible, Daylio, Tiimo, mySymptoms · **Theme:** Check-ins and signals
- **How:** Columns on wellbeing_checkins (or daily_scales), on the Home feeling check-in, charted on Trends, usable as a Pattern Finder outcome.

### D2. Trackers the person names
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals,Trends
- **Answers:** Exist, Cronometer, Bearable · **Theme:** Check-ins and signals
- **How:** custom_trackers and custom_tracker_entries (scale, count, duration, measurement), an open list, charted and fed to F1.

### F1. Pattern Finder for any factor
- **Ships by:** Over the air (JS) · **Size:** M-L · **Tabs:** Trends,Signals
- **Answers:** Bearable, Exist, Welltory · **Theme:** Patterns and Trends
- **How:** Candidates from check-in tags, sleep, doses taken or skipped, steps, hydration, weather, cycle and D2 trackers, each turned into moments lib/patternBasis.ts already compares. "Shows up before", never "causes"; new generators added to NAMED in audit_clinical_claims.js.

### F9. Body Signals lens
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Guava, Welltory, Oura, Bearable · **Theme:** Patterns and Trends
- **How:** Heart rate, resting heart rate, HRV, glucose, blood oxygen and skin temperature, which Health Connect already reads and the app already has permission for. No rebuild. Your usual range, no score.

### G1. Import a recipe from a web link
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Food
- **Answers:** Cronometer, Plan to Eat, AnyList, Samsung Food, Paprika · **Theme:** Food, scanning and Insights
- **How:** lib/recipeImport.ts reads the schema.org Recipe block, then an ingredient matcher maps each line to reference foods, unmatched lines shown to pick, and the recipe runs through the same scoring before it can appear anywhere.

### K3. Charts in the PDF
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Reports
- **Answers:** Bearable, Visible, CareClinic · **Theme:** Reports
- **How:** Inline SVG from lib/reportCharts.ts; gaps as gaps, bars or dots.

### X1. One photo layer
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** all
- **Answers:** Gardenize, Sortly, Monarch, Guava, Medisafe · **Theme:** Shared foundations
- **How:** A media table (owner kind, owner id, file, taken_on), shrink on save, stored under the app folder, copied into the Backups folder and restored beside the encrypted snapshot, never in the plaintext record, shown on desktop from the synced copy. Serves A5, D12, I13, J4, J9.

## Phase 2. Quick wins over the air (110 items)

### A3. Pills on hand and refill reminder
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Schedules,Signals,Insights
- **Answers:** Medisafe, MyTherapy, CareClinic, Guava · **Theme:** Medication logistics
- **How:** supply_on_hand, supply_unit and refill_lead_days on treatments, drawn down when a dose is marked taken on Meds, a refill kind in lib/reminderSources.ts, "about 6 days left" in MyMedsSection.tsx.

### A5. Photo of each pill
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** A photo field on treatments through the shared photo layer (X1), so two white tablets can be told apart.

### A6. Pharmacy and prescriber contact with tap to call
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** MyTherapy · **Theme:** Medication logistics
- **How:** Two optional contacts on treatments, or a link to a Life > Emergency contact; Linking opens the dialer. Picks from phone contacts once O1 ships in R1.

### A8. Interaction check the moment a med is added
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** The My Meds save handler runs evaluateInteractionRules for the new treatment and shows any new warning in the sheet that already reports food supply.

### A9. A third severity level, major
- **Ships by:** Live database, needs owner yes · **Size:** S-M · **Tabs:** Insights
- **Answers:** Drugs.com · **Theme:** Medication logistics
- **How:** Shipped 2026-09-26 (1.0.53.35): major, caution and note on every cited interaction rule in the live foods_reference.db, ten rules regraded to major against their citations (a label contraindication, a boxed warning, or a dose cut the label names), a tappable level on every rule card in My Meds, Schedules and Insights, major first, and the level in the report (lib/ruleSeverity.ts, components/RuleSeverityTag.tsx, scripts/test_rule_severity.js).

### A10. Drug-to-drug check through Drugs.com
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Insights
- **Answers:** Drugs.com, Medisafe · **Theme:** Medication logistics
- **How:** A "Check this list on Drugs.com" button that opens the checker in the browser (the app sends nothing), plus one line saying the app's rules cover food and supplement timing.

### A11. Scan your medicine, see its label
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Drugs.com, Medisafe · **Theme:** Medication logistics
- **How:** Reshaped 2026-09-26 by direct instruction, and shipped the same day (1.0.53.36): the drug-to-drug rule library was dropped for liability. The person scans the NDC barcode on a box or bottle (UPC-A or GS1 DataMatrix), types the code, or searches by name, and the manufacturer's FDA label is shown word for word from openFDA, dated, with its version, maker and a DailyMed link, and a note that a pharmacist can check medicines together. Every screen says what was sent (only the code or the name) and when it was retrieved; a search that finds nothing says so and never shows something else in its place, and nothing opens until the person picks. A label can be kept with a med in My Meds and checked for a newer version (app/medicine-label.tsx, lib/medicineLabel.ts, lib/medicineLabelLookup.ts, lib/medicineLabelDb.ts, scripts/test_medicine_label.js). The app never interprets a label. A lawyer review is advised before store release.

### A11b. The label sentence behind each drug rule
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Insights
- **Answers:** Drugs.com · **Theme:** Medication logistics
- **How:** Each of the 44 curated interaction rules that names a prescription drug carries the exact sentence from that drug's FDA label it rests on, with the label's set id and version, shown on the rule card and opening the label screen from A11. Follow-up to A11, not started.

### A11c. Make my own rule from a label sentence
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Schedules
- **Answers:** (your question) · **Theme:** Medication logistics
- **How:** On a label opened through A11, the person picks a sentence and the app opens the personal rule builder with that sentence filled in word for word, the label named with its set id, version and date, and the linked med chosen. The person decides the timing and whether to keep it; the rule is labelled as theirs, never as the app's. Nothing is suggested or reworded by the app. Added 2026-09-26 after the liability discussion.

### A12. Doses taken, said in words
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends,Reports
- **Answers:** Medisafe, MyTherapy · **Theme:** Medication logistics
- **How:** "Taken on 24 of the 28 days a dose was due, 4 not marked" on Trends and in the doctor report. No percentage, no praise.

### A13. A clinician line on each interaction
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Drugs.com · **Theme:** Medication logistics
- **How:** The mechanism field rides in the doctor report in clinician wording.

### A17. Put the summary into the phone's Medical ID
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** A guided screen in EmergencySection.tsx showing each field to copy and opening the phone setting. An app cannot write it directly.

### A18. Printable wallet card
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Medisafe · **Theme:** Medication logistics
- **How:** lib/emergency.ts text laid out as a card through expo-print.

### A19. Emergency details on the lock screen
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Life
- **Answers:** Apple Health · **Theme:** Medication logistics
- **How:** An opt-in ongoing notification with the lines the person picks. The widget version rides in R1 and R2.

### B2. Phone calendar events on the timeline
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home,Schedules
- **Answers:** Structured · **Theme:** The day as one picture
- **How:** Read today's and tomorrow's events live through lib/deviceCalendar.ts without copying them in. The desktop says phone only.

### B3. "Next in 25 minutes" and a running countdown
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home,Life
- **Answers:** Tiimo · **Theme:** The day as one picture
- **How:** A line on the timeline, plus an ongoing notification with a chronometer for the current routine or item.

### B4. Minutes on routine steps and scheduled items
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Schedules
- **Answers:** Tiimo, Routinery · **Theme:** The day as one picture
- **How:** Optional minutes, a routine total ("about 25 minutes"), and whether the day's timed items fit.

### B6. Read the next step aloud
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Routinery · **Theme:** The day as one picture
- **How:** expo-speech is already in the build; a switch per routine.

### B7. "How full is today"
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home
- **Answers:** Structured · **Theme:** The day as one picture
- **How:** One sentence counting the day's meals, doses, routines, appointments and upkeep. Keeping Up wording rules.

### B8. Move what is left to tomorrow
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules,Life
- **Answers:** Structured · **Theme:** The day as one picture
- **How:** Non-meal items move; a meal gets a new occurrence and the old one stays Skipped, so the record stays honest.

### B9. Sleep, steps and workouts filled in from Health Connect
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Signals
- **Answers:** Welltory · **Theme:** The day as one picture
- **How:** Rows lib/healthSync.ts already imports shown on the Home check-in and the timeline.

### C2. Keep reminding me until I mark it
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Due · **Theme:** Capture, reminders and the second audience
- **How:** An interval per reminder, repeats scheduled in lib/reminderSchedule.ts, cancelled when the mark or record appears. Extends NUDGES_WHILE_OVERDUE to routines, checks and free reminders.

### C3. A plain one-off reminder
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Home
- **Answers:** Due · **Theme:** Capture, reminders and the second audience
- **How:** "Move the laundry in 40 minutes": quick_reminders or a capture destination, preset times.

### C4. Plain-language dates
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Home
- **Answers:** Todoist, Due · **Theme:** Capture, reminders and the second audience
- **How:** chrono-node (pure JS, ships over the air) in lib/captureNotes.ts and the Upkeep form; offers a date, never assumes one.

### C5. Put a capture note on a day
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Home
- **Answers:** Structured · **Theme:** Capture, reminders and the second audience
- **How:** Turns a note into an upkeep item, a dated reminder or a Days Until counter.

### C6. Capture note to the grocery list, and a Home quick-add
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Home
- **Answers:** AnyList · **Theme:** Capture, reminders and the second audience
- **How:** A grocery destination in lib/captureNotes.ts and a Home row registered in lib/homeSections.ts.

### C7. Capture note to a routine or several checks
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Goblin.tools · **Theme:** Capture, reminders and the second audience
- **How:** Split a note's lines into routine_steps or Did I Do It checks.

### C13. Starter lists to copy
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Routinery, Goblin.tools, Sweepy · **Theme:** Capture, reminders and the second audience
- **How:** Routines and hard starts (taxes, moving, a doctor visit, a room) and upkeep for a kitchen or bathroom; offered, never auto-added.

### C15. Pick a few things for today
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home
- **Answers:** Finch · **Theme:** Capture, reminders and the second audience
- **How:** A "today I want to" list backed by Did I Do It marks; Keeping Up forbidden-words sweep.

### C16. Welcome-back line after a gap
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home
- **Answers:** Finch · **Theme:** Capture, reminders and the second audience
- **How:** One sentence and one easy action when the last record is days old. No blame.

### C18. One clear next thing on Home
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home
- **Answers:** Noom · **Theme:** Capture, reminders and the second audience
- **How:** The first Your Story item not done, one line, one button. The start of Simple View.

### C19. "What this means for you" after the interview
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home
- **Answers:** Noom · **Theme:** Capture, reminders and the second audience
- **How:** Each answer mapped to what it switched on, shown before the tour.

### D3. The person's own symptom tags
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Signals
- **Answers:** Bearable · **Theme:** Check-ins and signals
- **How:** An open list merged into lib/checkinTags.ts through sortByLabel; removal retires.

### D4. Severity per symptom
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** Bearable · **Theme:** Check-ins and signals
- **How:** severity on checkin_tags.

### D5. Finer severity
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** CareClinic · **Theme:** Check-ins and signals
- **How:** An optional 0 to 10 beside the four named steps, with a mapping for older rows on Trends.

### D6. My daily list, "none today" included
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home,Signals
- **Answers:** Flaredown · **Theme:** Check-ins and signals
- **How:** Chosen tags pinned to the Home check-in, rated 0 to 4. Zeros are stored, which gives Pattern Finder its good days.

### D7. Morning check-in
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Signals
- **Answers:** Visible · **Theme:** Check-ins and signals
- **How:** A reminder, a compact form, last night's sleep and resting heart rate and HRV beside the usual range. No budget, no score.

### D9. Check-in reminders
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** Bearable, Tiimo · **Theme:** Check-ins and signals
- **How:** A reminder kind with a Profile switch and a time of day.

### D14. Journal prompts
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** CareClinic · **Theme:** Check-ins and signals
- **How:** A short prompt list above General Note.

### E1. Log period days by hand
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Signals
- **Answers:** Clue, Guava, Oura · **Theme:** Cycle
- **How:** cycle_days with source hand or device, so Health Connect and hand entries share one table. The only route on iPhone until R2. Never travels unless named in the allowlist.

### E2. Cycle day beside flares
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends
- **Answers:** Clue, Oura · **Theme:** Cycle
- **How:** A context line in lib/patternContext.ts, never the explanation. Open item 25.

### E5. Next period from the person's average
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals
- **Answers:** Clue · **Theme:** Cycle
- **How:** Said as an average of past cycles, never for contraception.

### E6. Perimenopause
- **Ships by:** Reading content · **Size:** S · **Tabs:** Signals,Life
- **Answers:** Clue · **Theme:** Cycle
- **How:** Tags (hot flushes, night sweats) and a Health Literacy entry.

### F3. Typical delay from food to flare
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** mySymptoms · **Theme:** Patterns and Trends
- **How:** Median hours with the count behind it on each candidate.

### F4. Best days beside worst days
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Cara Care · **Theme:** Patterns and Trends
- **How:** Foods on the lowest-symptom days next to the highest, with counts.

### F11. Your usual as a shaded band
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends
- **Answers:** Oura · **Theme:** Patterns and Trends
- **How:** Two y values on TrendLineChart.

### F12. Outside your usual range, and silent otherwise
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home,Trends
- **Answers:** Oura, Apple Health · **Theme:** Patterns and Trends
- **How:** A Home line and a Trends line for nights or days outside the usual range. Describes, never predicts.

### F13. Your week
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Trends
- **Answers:** Exist, Bearable · **Theme:** Patterns and Trends
- **How:** Pure lib/weeklySummary.ts, a Home card and a local notification on a chosen day. Blank weeks say not logged.

### F14. Averages by weekday and by month
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends
- **Answers:** Exist, Daylio · **Theme:** Patterns and Trends
- **How:** A helper beside lib/yourUsual.ts, with the number of days behind each.

### F17. Six months and a year
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends
- **Answers:** Oura, Daylio · **Theme:** Patterns and Trends
- **How:** Weekly or monthly averages past about 90 points, gaps kept; check the SQL speed on a year.

### F19. Since your last appointment
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends,Reports
- **Answers:** Guava · **Theme:** Patterns and Trends
- **How:** A band on Appointments and Care and a section in the doctor report.

### F21. Different targets on different weekdays
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Insights
- **Answers:** Cronometer · **Theme:** Patterns and Trends
- **How:** A weekday column on personal nutrient targets.

### G4. Cook mode with step timers
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food,Schedules
- **Answers:** Samsung Food, Paprika · **Theme:** Food, scanning and Insights
- **How:** One step at a time, big text, "Start 20 min timer" from pure lib/stepTimers.ts. Keeping the screen awake needs expo-keep-awake in R1.

### G5. Scale a recipe and household servings
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food,Schedules
- **Answers:** Paprika, Eat This Much · **Theme:** Food, scanning and Insights
- **How:** "Make it for N" before loading the builder; a serving count on a scheduled meal multiplies the grocery lines.

### G6. Grocery list by store section
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Paprika, AnyList · **Theme:** Food, scanning and Insights
- **How:** Reference category as the aisle, stores and aisles as an open list the person orders.

### G7. Scan a barcode onto the grocery list
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Food
- **Answers:** OurGroceries · **Theme:** Food, scanning and Insights
- **How:** From the scan result, and for non-food Kitchen items.

### G8. Send the list as text to someone without the app
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** MyFitnessPal, Eat This Much · **Theme:** Food, scanning and Insights
- **How:** The share sheet on a phone, Save As on a computer. Only lines still to pick up. A delivery API is item Z6.

### G10. Richest foods for a nutrient from inside a builder
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Food,Insights
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** Nutrient Ranking linked from the ingredient picker.

### G11. Where each food's numbers come from
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Food
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** The national source as a caption.

### G12. Foods that would close a short nutrient
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Insights
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** Nutrient Ranking filtered through Safe Foods scoring, preferring foods already in the person's history.

### G14. Distinct plants this week
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Insights,Trends
- **Answers:** ZOE · **Theme:** Food, scanning and Insights
- **How:** lib/eatingVariety.ts, "counted" not "good", a blank week a gap.

### G15. One word for each food, for this person
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food
- **Answers:** ZOE · **Theme:** Food, scanning and Insights
- **How:** "Fits all your conditions" or "one caution", never a number; detail one tap away.

### G16. Processing level and additives from a scan
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food,Insights
- **Answers:** Yuka, ZOE · **Theme:** Food, scanning and Insights
- **How:** Open Food Facts already returns nova_group and additives_tags; store, show, and link each additive to its reading entry.

### G17. One line at the top of a scan
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Food
- **Answers:** Yuka · **Theme:** Food, scanning and Insights
- **How:** "Worth a second look for 2 of your conditions: sodium, carrageenan", counted by severity.

### G20. Who in the household it suits
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food,Insights
- **Answers:** Fig · **Theme:** Food, scanning and Insights
- **How:** A line per family member on a scan or recipe, and a "for whom" switch on Food Lookup.

### G21. Scan with no signal
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Food
- **Answers:** Yuka · **Theme:** Food, scanning and Insights
- **How:** Queue the barcode and look it up once back online.

### G23b. FODMAP ingredients named on a scanned label
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Food
- **Answers:** Monash FODMAP · **Theme:** Food, scanning and Insights
- **How:** Shipped 2026-09-26: for someone tracking IBS or IBD, the scan report names label ingredients that are known FODMAP sources, by group, presence only and never an amount (lib/fodmapLabel.ts, scripts/test_fodmap_label.js).

### G25. "Log your usual lunch?"
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Home,Food
- **Answers:** Cal AI · **Theme:** Food, scanning and Insights
- **How:** From meal history and usual times, as a Home line or a notification button.

### G26. One line across all conditions for a person's own recipe
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Food
- **Answers:** Heali · **Theme:** Food, scanning and Insights
- **How:** The recipe condition computation exposed for saved recipes.

### G31. Choose which nutrients the gauges show
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** A PopoverSelect list stored in app_meta.

### G33. Hours since the last meal
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Home
- **Answers:** Cronometer · **Theme:** Food, scanning and Insights
- **How:** An optional window stored in Profile.

### G34. One tap for a glass
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Waterllama · **Theme:** Food, scanning and Insights
- **How:** Quick buttons on Hydration and a caffeine line for the day.

### G35. Hydration reminders stop at the target
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Waterllama · **Theme:** Food, scanning and Insights
- **How:** Skip the rest of the day's reminders once the total is reached.

### H1. The generator prefers what the kitchen holds
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Meal planning
- **How:** A score bonus for recipes kitchenCoverageFor mostly covers.

### H2. Use-by dates
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life,Schedules
- **Answers:** Paprika, Sortly · **Theme:** Meal planning
- **How:** use_by on kitchen_items, a reminder kind, a "use soon" band, and a generator bonus.

### H4. Swap one meal
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Meal planning
- **How:** Reruns one slot against what the day still needs.

### H5. Move a meal to another day
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Plan to Eat · **Theme:** Meal planning
- **How:** A day picker on one occurrence.

### H7. Notes on the calendar
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Plan to Eat · **Theme:** Meal planning
- **How:** An item_type of note in the week strip.

### H8. Month view
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Paprika · **Theme:** Meal planning
- **How:** A month grid from the same dot data.

### H10. This week's plan as a notification
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** Eat This Much · **Theme:** Meal planning
- **How:** In place of an email, which would need a server.

### I2. Rain forecast on a watering task
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** Planta · **Theme:** Garden
- **How:** From the forecast Home already fetches.

### I3. Light meter
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Garden
- **Answers:** Planta · **Theme:** Garden
- **How:** expo-sensors LightSensor, already in the build, saved as a reading. Android only.

### I4. Last and first frost dates
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Garden
- **Answers:** Seedtime · **Theme:** Garden
- **How:** From the Open-Meteo history the zone lookup already pulls.

### I6. Succession sowing
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** Seedtime · **Theme:** Garden
- **How:** "Every N days, K times" writes several plantings and counters.

### I10. Crop rotation note
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Garden
- **Answers:** GrowVeg · **Theme:** Garden
- **How:** lib/cropFamilies.ts keyed on food_id (not a live DB column), read against the same area's last three years.

### I12. This month in the garden
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** GrowVeg · **Theme:** Garden
- **How:** A monthly reminder once I4 and I5 exist, with a Profile switch.

### I14. What was done to each planting
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Garden
- **Answers:** Gardenize · **Theme:** Garden
- **How:** garden_planting_events, append-only, event kinds an open list.

### I15. Garden CSV
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden,Reports
- **Answers:** Gardenize · **Theme:** Garden
- **How:** Plantings and harvests.

### I17. Seed packet photo and typed variety
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** From Seed to Spoon · **Theme:** Garden
- **How:** A barcode lookup would be a Worker job (Z8).

### I18. VPD from temperature and humidity readings
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden,Trends
- **Answers:** AC Infinity · **Theme:** Garden
- **How:** Derived in lib/growingConditions.ts; no verdict words.

### I19. Import a controller's history file
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Garden
- **Answers:** AC Infinity · **Theme:** Garden
- **How:** garden_readings with source device.

### I21. Rain from the station
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** Ecowitt · **Theme:** Garden
- **How:** Feeds the Rain total. After I20.

### J2. Spot repeating charges
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Monarch · **Theme:** Money, upkeep and places
- **How:** Offer to make them bills. After J1.

### J3. Category rules
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Monarch · **Theme:** Money, upkeep and places
- **How:** finance_rules applied on import.

### J4. Receipt photo on an entry
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Monarch · **Theme:** Money, upkeep and places
- **How:** Through X1. Built 1.0.56.10: a Photos row under every entry on Life > Finances; removing an entry with photos asks first and removes them with it.

### J6. Upkeep by room or area
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Sweepy · **Theme:** Money, upkeep and places
- **How:** An open list with counts and dates, never a score. Built 1.0.56.11: places on every item from an open alphabetical list (upkeep_places), removal moves what is in use first, Life > Upkeep grouped by place with a count and dates, and daily, weekly and fortnightly repeats.

### J7. "I have 20 minutes"
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Sweepy · **Theme:** Money, upkeep and places
- **How:** Optional minutes on upkeep and a filter. Built 1.0.56.11: How long it takes on every item and an I Have Some Time band, soonest first, with items that have no minutes counted rather than guessed at, and ones somebody else is doing counted apart.

### J9. Photo on an item or a place
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** Through X1.

### J12. Check the shared folder more often
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** AnyList · **Theme:** Money, upkeep and places
- **How:** Run the between-people mailbox exchange by itself through the existing allowlist: at startup, on return to the app, about every 30 seconds and about 15 seconds after a change, keeping the manual Send and Receive buttons. Instant delivery needs M1 and is not part of this. Built 1.0.56.12: components/PeerMailboxWatcher.tsx checks at startup, on return, on focus and every 30 seconds and sends 15 seconds after a change, through sendViaOneDrive and receiveViaOneDrive; a send goes only when its payload changed (onlyWhenChanged), and an unreachable folder is said once a run.

### K1. Six months, a year, any range, since the last visit
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Guava, Bearable, Visible · **Theme:** Reports
- **How:** buildReport already takes any number of days. Built 1.0.56.13: 6 months, 1 year and Since last visit pills on Reports (lib/reportRange.ts, calendar months back; since the day after the last visit that happened, same lastVisit rule as F19; pill only when there is one), checked by scripts/test_report_range.js.

### K2. At a glance front page
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** Guava · **Theme:** Reports
- **How:** Top symptoms by days, doses as words, latest weight and blood pressure, labs outside the lab's printed range. Built 1.0.56.14: At a glance section opens the Overview, Doctor and Caregiver reports (lib/reportGlance.ts).

### K5. CSV export
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Bearable, mySymptoms, Gardenize · **Theme:** Reports
- **How:** Table sections through lib/nativeSharing.ts. Built 1.0.56.15: Save as a Spreadsheet on every report, each table on its own or the whole report in one file (lib/reportCsv.ts).

### K6. What I have noticed
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** mySymptoms · **Theme:** Reports
- **How:** Pattern Finder candidates with denominators and experiment results, each a hypothesis from one person's records. Built 1.0.56.16: What I have noticed and Food experiments sections in the Overview, Doctor and Nutritionist reports, every candidate a hypothesis with its counts (lib/reportNoticed.ts).

### K7. Report history
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Guava · **Theme:** Reports
- **How:** What was made, when and for whom. Built 1.0.56.17: report_history, Report history band with Make it again, who it was for, Remove.

### K8. Heart rate and HRV in reports
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Visible · **Theme:** Reports
- **How:** Health Connect already reads both with permission; no rebuild. Built 1.0.56.18: resting heart rate and HRV table against the usual range in Overview, Doctor and Trainer reports (lib/reportHeart.ts).

### K9. Day-by-day food and symptom diary
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** mySymptoms · **Theme:** Reports
- **How:** A section in the nutritionist report. Built 1.0.56.19: day-by-day food and symptom diary table in the Nutritionist report, empty runs as one row (lib/reportDiary.ts).

### K10. Choose the sections
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** Cronometer · **Theme:** Reports
- **How:** Tick which sections a report carries. Built 1.0.56.20: Sections in this report on the Reports tab, a tick box per section, unticked ones never gathered, choice kept per report, count of left-out sections in the preface and Report history.

### K11. Print from the phone
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Cronometer · **Theme:** Reports
- **How:** expo-print printAsync. Built 1.0.56.21: Print button beside Share as PDF (system print dialog, no share step), printed copies in Report history; desktop Share as PDF fixed through desktop/print.js.

### X2. A first-launch agreement screen
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** all
- **Answers:** (your question) · **Theme:** Shared foundations
- **How:** Before anything else on a first launch, one screen says in plain words what the app is and is not: general information and the person's own records, not medical advice, not a diagnosis, not a substitute for a doctor or pharmacist, allergen-aware and never allergy-safe, and a reminder to check with a doctor before making medical decisions (which Apple asks of health apps). The person agrees before going on; the date and the version of the wording they agreed to are kept, and a changed wording asks again. Links to the terms of use and privacy policy (X3). Readable again any time from Profile. Added 2026-09-26. Built 1.0.56.22: first-launch screen with six points, agreement kept by wording version in app_meta, asked again when the wording changes, readable from Profile; legal links wait for X3.

### X3. Terms of use and privacy policy
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** all
- **Answers:** (your question) · **Theme:** Shared foundations
- **How:** Two plain-language pages on insidestoryapp.com (the Worker inside-story-site, docs/app-links), linked from X2, Profile and the store listings, and required by both stores. The privacy policy says what the local-first design means: health records stay on the device and the person's own cloud folder, no company server holds them, and exactly what the few lookups send (a barcode, a medicine code or name). Covers the FTC health breach rule, GDPR and Mexico's data protection law in outline. Written as drafts for a lawyer to review before store release, never presented as legal advice. Added 2026-09-26. Built 1.0.56.23: terms and privacy pages live on insidestoryapp.com, linked from the agreement, Profile and the home page; contact and governing law left for the legal review.

## Phase 3. Larger builds over the air (63 items)

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

### K4. Visit prep questions
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Reports,Insights
- **Answers:** Guava · **Theme:** Reports
- **How:** visit_questions tied to an appointment, reorder and tick off, in the person's words.

## Phase 4. The Android rebuild (R1) (11 items)

### C11. Share into Inside Story from any app
- **Ships by:** Android rebuild R1 · **Size:** M · **Tabs:** Life,Home,Food
- **Answers:** Todoist, Samsung Food, Plan to Eat · **Theme:** Capture, reminders and the second audience
- **How:** A SEND intent filter for text, links and images. A link to a recipe goes to the importer (G1); anything else lands in Capture.

### C12. App icon shortcuts and a quick settings tile
- **Ships by:** Android rebuild R1 · **Size:** S-M · **Tabs:** Home
- **Answers:** Todoist · **Theme:** Capture, reminders and the second audience
- **How:** expo-quick-actions plus a tile config plugin: Capture, Did I take it, Where is it.

### D15. Relaxation and gut-directed audio
- **Ships by:** Android rebuild R1 · **Size:** M · **Tabs:** Signals
- **Answers:** Cara Care · **Theme:** Check-ins and signals
- **How:** Pacer and spoken scripts shipped OTA in 1.0.57.22 (Signals > Calm). Left for R1: expo-audio, a document picker and expo-keep-awake, so the person can play recordings they already have in the Recordings You Have band, and the pacer can keep the screen on. No music or recordings ship with the app.

### G3. Mark up any web page as a recipe
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Paprika · **Theme:** Food, scanning and Insights
- **How:** react-native-webview, for sites with no structured data.

### G24. Photo gives a first guess at ingredients, on the phone
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Cal AI · **Theme:** Food, scanning and Insights
- **How:** ML Kit image labelling: broad items only, confirmed by the person, never saved unconfirmed. The cloud version is Z1.

### I22. Receive the gateway's pushes
- **Ships by:** Android rebuild R1 · **Size:** M-L · **Tabs:** Garden
- **Answers:** Ecowitt · **Theme:** Garden
- **How:** A small HTTP listener native module. Polling covers it until then.

### L2. Android home screen widgets
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Home,Life,Schedules
- **Answers:** Tiimo, AnyList, Todoist, Waterllama, Medisafe, Cronometer · **Theme:** Phones, widgets and devices
- **How:** react-native-android-widget: next thing, next dose, Capture, grocery list, Fuel Gauges, current routine step, one-tap glass. A "hide health details on widgets" switch, since a locked phone shows them.

### L4. Breathing rate and body temperature
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** Trends,Signals
- **Answers:** Oura · **Theme:** Phones, widgets and devices
- **How:** Two more Health Connect permissions.

### L5. Camera originals to the gallery, and Wi-Fi only photos
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** all
- **Answers:** (your question) · **Theme:** Phones, widgets and devices
- **How:** expo-media-library saves the full camera picture, with its details, to the phone's gallery while the app keeps its two small sizes (X1, 1.0.53.7). expo-network tells Wi-Fi from mobile data, so "Send and fetch shared photos on Wi-Fi only" holds on the phone; until then lib/photoNative.ts reports unknown and photos go either way.

### O1. Phone contacts inside the app
- **Ships by:** Android rebuild R1 · **Size:** S-M · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** expo-contacts: pick a contact for Emergency, a prescriber, a pharmacy, the family roster or a caregiver invite. Read on the phone, nothing copied out.

### O2. Text or call from inside the app
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** expo-sms opens the phone's texting app with the message filled in; calling already works through Linking.

## Phase 5. The Worker and the relay (6 items)

### A14. Recalls matched to My Meds and scanned foods
- **Ships by:** Cloudflare Worker · **Size:** M · **Tabs:** Insights,Life,Food
- **Answers:** Drugs.com · **Theme:** Medication logistics
- **How:** External data item 27: the Worker pre-fetches FDA recall feeds as one bundle and the phone matches names locally, so the med list never leaves it.

### C21. Try-before-install page
- **Ships by:** Cloudflare Worker · **Size:** S · **Tabs:** none
- **Answers:** Noom · **Theme:** Capture, reminders and the second audience
- **How:** A page on inside-story-site describing the app by audience. Collects nothing.

### F22. Weather beside symptoms
- **Ships by:** Cloudflare Worker · **Size:** M · **Tabs:** Signals,Trends
- **Answers:** Flaredown · **Theme:** Patterns and Trends
- **How:** daily_weather from the Worker bundle with a coarsened location (item 27), listed beside flares in lib/patternContext.ts. A typed city ships over the air; automatic location needs expo-location in R1.

### I24. What plant is this
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden
- **Answers:** PictureThis, Planta · **Theme:** Garden
- **How:** Reshaped 2026-09-29 by direct instruction: nothing in the app may cost a subscription or a charge, and the Pl@ntNet API is free only to 500 identifications a day for one account shared by every user, then paid. So the app names no plant itself. What Plant Is This, above the food search on Add a Planting, opens the free Pl@ntNet or Google Lens app on a phone (their websites on a computer), the person searches for the name it gave, and the planting records which app named it and how sure Pl@ntNet said it was. Every time it says an app’s name is a likely match and never to eat a plant on an app’s word alone. Built 1.0.56.2.

### O3. Messages between Inside Story users
- **Ships by:** Relay (Worker plus push) · **Size:** L · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** End to end encrypted with the keys in lib/deviceIdentity.ts and the connections roster; the relay (M1) carries sealed bytes it cannot read. Caregiver, partner and family notes, a missed-dose alert, a shared list change.

### M1. Content-blind push relay
- **Ships by:** Relay (Worker plus push) · **Size:** L · **Tabs:** all
- **Answers:** Medisafe, AnyList, CareClinic · **Theme:** Servers and relay
- **How:** The Worker plus FCM, carrying a wake-up and sealed bytes only. Unlocks A16 on time, J12 instantly, and O3. Remote push setup rides in R1.

## Phase 6. The iPhone build (R2) (2 items)

### L1. Apple Health on iPhone
- **Ships by:** iPhone build R2 · **Size:** L · **Tabs:** Home,Trends,Signals,Insights
- **Answers:** Bearable, Guava, Welltory, Oura, Levels, Apple Health · **Theme:** Phones, widgets and devices
- **How:** A HealthKit module behind the lib/healthConnect.ts interface, so every reader stays the same.

### L3. iPhone widgets and Live Activity
- **Ships by:** iPhone build R2 · **Size:** L · **Tabs:** Home,Life
- **Answers:** Tiimo, Medisafe · **Theme:** Phones, widgets and devices
- **How:** WidgetKit through a config plugin, same content and switch.

## Phase 7. Opt-in, server and ruled-out items (23 items)

### A15. Pill identifier
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Life
- **Answers:** Drugs.com · **Theme:** Medication logistics
- **How:** Needs a licensed imprint and image database. Listed so nothing is dropped; a cost decision.

### C14. AI breaks a task into steps
- **Ships by:** Explicit opt-in only · **Size:** L · **Tabs:** Life
- **Answers:** Goblin.tools, Tiimo · **Theme:** Capture, reminders and the second audience
- **How:** Needs a language model off the phone: explicit opt-in per use, text only, no health content, through the Worker.

### G29. Portal records (FHIR)
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Signals,Reports
- **Answers:** Guava, Apple Health · **Theme:** Food, scanning and Insights
- **How:** US only, an app registration per health system, or Health Connect medical records. A decision on scope first.

### I23. Live AC Infinity readings
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Garden
- **Answers:** AC Infinity · **Theme:** Garden
- **How:** Ruled out 2026-09-28 by direct instruction. Built as an opt-in in 1.0.55.39 through the unpublished server AC Infinity's phone app uses, then removed entirely in 1.0.55.40: the app is sold, and a paid app reading another company's service needs that company's permission (App Store guideline 5.2.2 says so outright), so a device joins only when its maker offers a free, published way in, the way Ecowitt does with its gateways. What stays is Import Readings from a File (I19), which reads the history file a person saves from the AC Infinity app. Revisit only if AC Infinity publishes an API or grants permission in writing.

### I25. What is wrong with this plant
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden
- **Answers:** PictureThis · **Theme:** Garden
- **How:** Reshaped 2026-09-29 by direct instruction: nothing in the app may cost a subscription or a charge, so no paid diagnosis service and no vision model. What Is Wrong With It, under each planting, lists the three problems that crop is known for, asks where the trouble shows first and lists the shortages and look-alikes that show there, all from the crop guides and the plant nutrient reading, each put right from the soil. When nothing matches it opens the free Google Lens app and names the people who answer gardening questions for free. Any row can be written down on the planting as a Something wrong seen entry. Always the likeliest causes, never a diagnosis. Built 1.0.56.3.

### O4. Capture from other apps' notifications
- **Ships by:** Explicit opt-in only · **Size:** M · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** A notification listener. Google Play treats it as sensitive, Android 15 hides its setting for sideloaded apps; opt-in only.

### O5. Inside Story as the default texting app
- **Ships by:** Owner decision first · **Size:** XL · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** Android only, Play policy likely refuses it, the person loses RCS, and it cannot exist on iPhone or desktop. Ruled out by the owner on 2026-09-26; kept on the list only as the record of that decision. O1, O2, C11 and O3 are the route instead.

### Z1. Photo sent to a vision model for ingredients
- **Ships by:** Explicit opt-in only · **Size:** L · **Tabs:** Food,Insights
- **Answers:** Cal AI, Cronometer · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Open item 21. Opt-in each time, through the Worker, nothing stored, the person confirms every line.

### Z2. A readiness, stress or energy score
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** Trends,Signals
- **Answers:** Welltory, Oura · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Breaks the Phase A rule that a score never stands in for a clinician. Only if you change that rule.

### Z3. AI chat and a model behind "ask your records"
- **Ships by:** Explicit opt-in only · **Size:** L · **Tabs:** Home,Insights
- **Answers:** Heali, Apple Health · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Opt-in, answering only from the cited reading corpus with its evidence tier shown.

### Z4. Streaks, challenges and characters
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** Schedules,Signals
- **Answers:** MyTherapy, Waterllama · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Ruled out by the Keeping Up rules. Listed because the competitors lead with them.

### Z5. How others with my condition are doing
- **Ships by:** Needs a company server · **Size:** L · **Tabs:** Signals
- **Answers:** Flaredown · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Needs a server holding pooled health data.

### Z6. Grocery delivery (Instacart, AmazonFresh)
- **Ships by:** Needs a company server · **Size:** M · **Tabs:** Life
- **Answers:** MyFitnessPal, Eat This Much · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** A partner key and a server; the list goes to a company. G8 covers most of it.

### Z7. Chain restaurant menus
- **Ships by:** Cloudflare Worker · **Size:** L · **Tabs:** Food
- **Answers:** MyFitnessPal · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** A keyed lookup through the Worker. Licensing the data is the cost.

### Z8. Seed packet barcode to variety
- **Ships by:** Cloudflare Worker · **Size:** L · **Tabs:** Garden
- **Answers:** From Seed to Spoon · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** A keyed lookup; open data rarely resolves seeds.

### Z9. Add by Alexa or Google Assistant
- **Ships by:** Needs a company server · **Size:** S · **Tabs:** Life
- **Answers:** OurGroceries · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** A skill needs a company server.

### Z10. Linked bank accounts
- **Ships by:** Needs a company server · **Size:** L · **Tabs:** Life
- **Answers:** YNAB, Monarch · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Plaid or GoCardless tokens held on a server. J1 covers most of it.

### Z11. A clinician dashboard or live link
- **Ships by:** Needs a company server · **Size:** L · **Tabs:** Reports,Schedules
- **Answers:** Guava, mySymptoms, Healthie, CareClinic · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Health data on a server. The PDF and CSV cover the visit.

### Z12. Store and restaurant guides
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** Food,Insights
- **Answers:** Fig · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Pulls against home cooking over commercial products.

### Z13. Heart rate from the camera
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Signals
- **Answers:** Visible, Welltory · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Frame processing and validation; out of proportion.

### Z14. A buzz from a worn sensor when overdoing it
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Signals
- **Answers:** Visible · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Continuous background Bluetooth; heavy on battery.

### Z15. A lifetime price and a hardship price
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** none
- **Answers:** Structured, MyTherapy, Paprika, Welltory, Bearable · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Store billing decisions for the tier table.

### Z16. Scanning fully offline
- **Ships by:** Cloudflare Worker · **Size:** L · **Tabs:** Food,Insights
- **Answers:** Yuka · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** A country subset of Open Food Facts is still large; the Worker cache plus G21 covers most of it.

