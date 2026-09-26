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

### A10. Drug-to-drug check through Drugs.com
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life,Insights
- **Answers:** Drugs.com, Medisafe · **Theme:** Medication logistics
- **How:** A "Check this list on Drugs.com" button that opens the checker in the browser (the app sends nothing), plus one line saying the app's rules cover food and supplement timing.

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

### G8. Send the list to a store app as text
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** MyFitnessPal, Eat This Much · **Theme:** Food, scanning and Insights
- **How:** The share sheet. A delivery API is item Z6.

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
- **How:** Through X1.

### J6. Upkeep by room or area
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Sweepy · **Theme:** Money, upkeep and places
- **How:** An open list with counts and dates, never a score.

### J7. "I have 20 minutes"
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Sweepy · **Theme:** Money, upkeep and places
- **How:** Optional minutes on upkeep and a filter.

### J9. Photo on an item or a place
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Life
- **Answers:** Sortly · **Theme:** Money, upkeep and places
- **How:** Through X1.

### J12. Check the shared folder more often
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** AnyList · **Theme:** Money, upkeep and places
- **How:** A shorter check interval. Instant needs M1.

### K1. Six months, a year, any range, since the last visit
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Guava, Bearable, Visible · **Theme:** Reports
- **How:** buildReport already takes any number of days.

### K2. At a glance front page
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** Guava · **Theme:** Reports
- **How:** Top symptoms by days, doses as words, latest weight and blood pressure, labs outside the lab's printed range.

### K5. CSV export
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Bearable, mySymptoms, Gardenize · **Theme:** Reports
- **How:** Table sections through lib/nativeSharing.ts.

### K6. What I have noticed
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** mySymptoms · **Theme:** Reports
- **How:** Pattern Finder candidates with denominators and experiment results, each a hypothesis from one person's records.

### K7. Report history
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Guava · **Theme:** Reports
- **How:** What was made, when and for whom.

### K8. Heart rate and HRV in reports
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Visible · **Theme:** Reports
- **How:** Health Connect already reads both with permission; no rebuild.

### K9. Day-by-day food and symptom diary
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** mySymptoms · **Theme:** Reports
- **How:** A section in the nutritionist report.

### K10. Choose the sections
- **Ships by:** Over the air (JS) · **Size:** S-M · **Tabs:** Reports
- **Answers:** Cronometer · **Theme:** Reports
- **How:** Tick which sections a report carries.

### K11. Print from the phone
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Reports
- **Answers:** Cronometer · **Theme:** Reports
- **How:** expo-print printAsync.
