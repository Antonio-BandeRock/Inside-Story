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

### P7. A last-checked date on every reading entry
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Garden
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** A checkedOn field on DigestEntry shown quietly on each entry, and a script listing entries past a set age for rechecking in batches. Matters more once Learn decks are built from the corpus. Notion: https://app.notion.com/p/3f153652f27281b5980ccee7d551d9e5

### P8. A convention for new text, so translation is not a rewrite
- **Ships by:** Reading content · **Size:** S · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Whole sentences, never glued fragments; counts through one plural helper; dates and numbers through one formatter. A small audit script on new files, then a decision on when the i18n library goes in. Notion: https://app.notion.com/p/3f153652f272818cbcd9fc22df82a27f

### P11. Bring CLAUDE.md in line with what is built
- **Ships by:** Reading content · **Size:** S · **Tabs:** none
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Platform scope still says the desktop is a PWA through PWABuilder (it is Electron); the Architecture intro says sync is not implemented (it is); nine tabs will be ten; the Free row is out of date (P3). Archive first, since the file is at the 100 KB limit. Notion: https://app.notion.com/p/3f153652f27281b1ac2fd6ecc12df8f2

### P13. The right measures for where the person lives, everywhere
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Today lib/measurement.ts picks only metric or imperial by region, and lib/unitConversion.ts has one cup and one pint (US). Add a measures profile from the region, changeable in Profile: US 237 ml, metric 250 ml and Japanese 200 ml cups, the Australian 20 ml tablespoon, UK pints and gallons, stones, gas marks and fan ovens, kJ or kcal and salt or sodium on labels, lab units (P18), date, decimal and clock formats. Stored in one base unit underneath so a change never alters a record. Notion: https://app.notion.com/p/3f153652f272816fba7de26c85f22d8e

### P27. One entitlement gate every feature checks
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Tiers are not decided yet, so build the mechanism now: one table maps features to tiers and every screen asks one function. Deciding or changing tiers becomes an edit to the table. A gated feature names the tier that includes it through explainNotYet; Developer Tools can switch tiers; store billing feeds it later. Notion: https://app.notion.com/p/3f153652f272812e8721f0bee87e8dc0

### Q2. Any ingredient or additive of your own to avoid
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** Fig · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Fig names 2,800+ restrictions. A free-text avoid list (an ingredient, an additive, an E number, a family such as "anything with carrageenan") matched by the same ingredient reader the scan and the recipe import use, so every lookup, scan, imported recipe and builder flags it with the person's own words as the reason.

### Q3. Import measured against the 50 most visited recipe sites
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food
- **Answers:** Paprika · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Keep a dated list of the 50 most visited recipe sites and blogs in scripts/, run lib/recipeImport.ts against one page from each in a test, record which import cleanly, and fix every miss. Publish the rate in the plan so it can be compared with Paprika's.

### Q5. Fewer taps to log than MacroFactor
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Food,Home
- **Answers:** MacroFactor · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Count taps for the tasks MacroFactor publishes (one food, a recipe, yesterday's breakfast again, a usual lunch) in a script that walks the screens, write the counts down, then cut ours below theirs: one tap to repeat a recent meal from Home, "same as yesterday", and recents ranked by time of day. Photo recognition stays with Z1, opt-in only.

### Q10. A screen reader audit
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** All
- **Answers:** Every leader · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Text already scales uncapped. Walk every tab with TalkBack and the desktop's narrator, give every icon button an accessibilityLabel, and add a script that fails on a Pressable with no label, so accessibility is a measured win rather than a "not checked" against every leader.

### Q11. Dose reminders that read the meals around them
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules
- **Answers:** Apple Health Medications, MyTherapy, Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The reminder body reads doseMealTiming when it is scheduled and again when a meal is logged: a calcium-rich breakfast logged at 7:40 turns the 8:00 levothyroxine reminder into one naming the breakfast and the later window, with the time the reading was made ("based on food logged as of 7:45"). Falls back to the plain reminder when nothing is logged.

### Q12. Days left that follow the real schedule
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Schedules
- **Answers:** MyTherapy, Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Supply runs down by the dose timeline itself (taper steps, every-other-week, weekly, monthly) rather than a daily average, and the refill ask lands on the Today timeline far enough ahead to call the pharmacy, with the pharmacy one tap away (A6).

### Q15. A visual day
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules,Home
- **Answers:** Tiimo, Structured · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The Today timeline drawn as blocks sized by their minutes, each in its tab colour with its lens icon, the current block counting down, readable at a glance without reading a list; the list stays one tap away.

### Q18. Logging on Free, reading on paid
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Signals,All
- **Answers:** Bearable, Flaredown, SmartBP, Clue · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27: the daily check-in, flares, food reactions, the bowel log, blood pressure, period days and the person’s own trackers are kept on Free with no limit, and Pattern Finder, experiments, Trends beyond a short window and Reports stay paid. Bearable gives unlimited logging away; a record nobody can start for free never reaches the paid reading.

### Q20. Exertion and how it landed
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Signals,Trends
- **Answers:** Visible · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** An effort rating on each exercise or activity log, and a next-morning question after a bigger day (better, same, worse, crashed), both read by Trends > Pacing beside the crash tags.

### Q24. The Diary
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Signals,Life
- **Answers:** Day One, Journey · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The Diary from the 2026-09-26 gap review, absorbing General Note: entries with photos and voice, prompts, on this day, its own lock, private until chosen, and the words a life’s Inside Story is later made from.

### Q25. A taste of Insights on Free
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Insights,Food
- **Answers:** Cronometer, Yuka, Fig · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27 and Q18: today’s nutrients with the food and supplement split, scanning a label, and one condition scored (or the For You card on a few foods a day) on Free, with gap foods, absorption, history, every condition and the household reading paid. Cronometer, Yuka and Fig all give their first look away.

### Q28. What can I make from what is here
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Insights,Food
- **Answers:** KitchenPal, SuperCook · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Recipes ranked by how much of each the kitchen already holds, items nearest their use-by first, filtered by the person’s conditions, allergies and diet, with what is missing sent to the grocery list in one tap.

### Q30. A recent window of Trends on Free
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Trends,All
- **Answers:** Bearable, Hevy, Cronometer, Guava, Clue · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27, Q18 and Q25: the last 30 days of every Trends lens on Free, Keeping Up in full on Free for the daily-living audience, and one Pattern Finder candidate a month shown with its basis; six months, a year, Compare Two, experiments and the full finder paid. Bearable shows 30 days free, Hevy three months, Cronometer seven days.

### Q31. A smoothed weight trend
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Trends
- **Answers:** Happy Scale, MacroFactor · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A moving average drawn through weigh-ins on Trends > Weight, the number of weigh-ins it rests on said under it, gaps kept, and no goal or projection unless the person sets one.

### Q32. Nights without a wearable
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Trends,Signals
- **Answers:** Sleep Cycle · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Bedtime and waking from a tap on the evening and morning check-in (or the alarm time where the phone gives it), a how-rested question, and Trends > Nights drawing those when no watch is connected, said as typed rather than measured.

### Q35. An accessibility pass on charts and lists
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** All
- **Answers:** Streaks, Google Fit · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** TalkBack labels on every chart, button and fold band, a one-sentence text summary under each chart, contrast checked in both themes, and a script that fails on an unlabelled pressable.

### Q36. One report on Free
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Reports,All
- **Answers:** Bearable, Guava · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27 and Q30: the doctor one-pager for the last 30 days on Free, so the first visit is where a person sees what the app is for; every other report, longer ranges, the PDF layout choices and the sealed share paid. Bearable keeps its PDF behind Premium; Guava gives visit prep on its free plan.

### Q37. Garden on Free
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Garden,All
- **Answers:** Seedtime, Planter, Gardenize · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27: the leading garden apps all give a free core (Seedtime frost dates and timeline, Gardenize diary, Planter grid). Proposed: zone and frost dates, one area, plantings, harvests and the crop guides on Free; several areas, grow setup, electricity, growing conditions, the hive log and reports paid.

### Q46. The second audience’s Life lenses on Free
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Life,All
- **Answers:** Tiimo, Sweepy, AnyList, Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Decide with P27: the leaders for daily living all give a free core (Tiimo routines, Sweepy chores, AnyList lists, Medisafe two meds, Google Fit steps). Proposed on Free: Grocery List, Routines, Did I Do It, Days Until, Upkeep, Movement and the med list with every warning, so someone who came for help running their day needs no condition and no payment to start; depth, sync, history and reports paid.

### Q59. Simple View
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home
- **Answers:** Tiimo, Structured · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** One switch that turns Home into one clear next thing from the person’s own schedules, routines and reminders, with the rest one tap away; nothing scored, nothing counted against them.

### U5. A review request at most once, never during setup
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** All
- **Answers:** Goblin.tools · **Theme:** What competitors' users complain about (2026-10-09)
- **How:** One ask after the person has used the app for a while, never in setup or onboarding, never repeated after a No. Source: complaints/home.md.

### U6. Ask for the one photo, never the library
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** All
- **Answers:** Pl@ntNet · **Theme:** What competitors' users complain about (2026-10-09)
- **How:** Every photo pick goes through the system picker for the photos chosen; nothing asks for access to all photos. Check the X1 photo layer against it. Source: complaints/garden.md.

### U7. A care reminder counts from when it was done
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Garden,Life
- **Answers:** Planta · **Theme:** What competitors' users complain about (2026-10-09)
- **How:** Watering, feeding and upkeep reminders reset from the last time the thing was recorded as done, not from when it was due, and say which they counted from. Source: complaints/garden.md.

### U11. A full cloud drive is said plainly
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Profile
- **Answers:** Google One · **Theme:** What competitors' users complain about (2026-10-09)
- **How:** When the person's drive cannot take a backup or sync copy because it is full, the app says so in words, names the folder, and keeps working on the device with nothing lost. Source: complaints/across.md.
