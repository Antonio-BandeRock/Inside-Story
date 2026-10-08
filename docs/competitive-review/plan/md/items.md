## Phase 0. Decisions only the owner can make (5 items)

### P2. A small beta outside the house
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** none
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Five to ten people (two with one of the 19 conditions, two with ADHD, a gardener, a caregiver) for two to four weeks on the Play internal testing track, then a conversation with each. Plus a private, opt-in usage summary the person sends themselves, nothing leaving the phone otherwise. The first named risk says to test logging before building around it. Notion: https://app.notion.com/p/3f153652f2728129b607eae81a0a7b7d

### P3. Redraw the tier table and plan how tiers are checked
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** One pass over every tab and lens, Free or paid, under the 2026-10-06 rule (Free stays a little useful, paying brings big wins); the Free row predates Life, Garden, Your Story, App Lock, Interests and Learn and leaves the second audience nowhere. Then one module that answers "is this available", read by every gated screen, built early even if it says yes to everything until launch. Notion: https://app.notion.com/p/3f153652f27281e6a3a8f3af4407fc21

### P5. If something happens to me: keeping a life's records reachable
- **Ships by:** Owner decision first · **Size:** M · **Tabs:** Life,Profile
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** No forgot-password flow, encrypted backups and App Lock mean a family loses everything on death or incapacity. Design, while the person is well: a recovery key handed to a named person in advance (printed, or sealed to their key through Connections), a sealed letter, and plainly what that person can open. No company server. Build follows in phase 3. Notion: https://app.notion.com/p/3f153652f2728137b703ec99f422084f

### P14. Conversions, a lens of tools people actually need
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Index and rules for P15 to P21: every answer shows the arithmetic and why the measures differ; never across kinds unless the thing supplies the link (a food's density, a substance's molar mass), unknown said as unknown; offline, nothing sent; health conversions never interpret or suggest a dose; answers can be saved into a record; a Convert button beside number fields elsewhere. Decided 2026-10-06: a lens on Life. Notion: https://app.notion.com/p/3f153652f27281d599c9e908f66f60a7

### P28. Safety is never behind a paywall
- **Ships by:** Owner decision first · **Size:** S · **Tabs:** all
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Confirmed 2026-10-06 by direct instruction ("Confirm P28 as written"), and the CLAUDE.md tier table changed with it: the emergency card, med and supplement timing warnings from the interaction rules, allergy cautions and the clinical-claims protections are on every tier including Free. The current tier table puts the rules engine on paid only. Free useful on its own; paying adds depth, people and time saved. The vault (agreed the same day) keeps these outside it as well. Notion: https://app.notion.com/p/3f153652f27281928fe4f7fbfb9ac019

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

## Phase 2. Quick wins over the air (134 items)

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

## Phase 3. Larger builds over the air (112 items)

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

## Phase 4. The Android rebuild (R1) (22 items)

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
- **How:** Pacer and spoken scripts shipped OTA in 1.0.57.22 (Signals > Calm). Recordings come in OTA since 1.0.57.23: kept in the Recordings folder in the shared folder, played in the app on the computer and opened in another app on the phone. Left for R1: expo-audio so the phone plays them in the app, and expo-keep-awake so the pacer can keep the screen on. No music or recordings ship with the app.

### G3. Mark up any web page as a recipe
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Paprika · **Theme:** Food, scanning and Insights
- **How:** react-native-webview, for sites with no structured data.

### G24. Photo gives a first guess at ingredients, on the phone
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Cal AI · **Theme:** Food, scanning and Insights
- **How:** DROPPED 2026-10-02 by direct instruction: ML Kit's built-in labeller has no ingredient labels (only Food, Fruit, Vegetable, Meal and about fifteen dishes), so it would say Food for almost every plate. Rely on the cloud version, Z1.

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

### P30. A child's records handed over at adulthood
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Profile,Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Handover age follows the country; both told ahead what changes; on the day the young person holds their records and decides what the parent still sees. Before then, categories teenagers have a legal right to keep private (reproductive and sexual health, mental health) can be marked private to the child, following the country's rules. Nothing deleted at handover. Notion: https://app.notion.com/p/3f153652f2728104bc20fc99bae8737e

### P31. A caregiver's changes are logged where both people can read them
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Every record a caregiver adds, changes or removes is written to an append-only log (what, when, by whom) readable by both, on the sync_change_log pattern. Notion: https://app.notion.com/p/3f153652f27281f49d0cc31ce4fbf59c

### P32. When a shared relationship ends
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Profile
- **Answers:** (your question) · **Theme:** Brainstorm review 2026-10-06
- **How:** Partner, household, guardian or caregiver link ended by either person: syncing stops, each keeps their records in full, shared records are copied to both sides, the connection's keys are retired, the other is told it ended and never why. Ties to If something happens to me. Notion: https://app.notion.com/p/3f153652f2728189bd50e76926d4d5e6

### Q43. Foraging
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden,Food
- **Answers:** Seek, PictureThis · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Finds recorded with place (kept private, coarsened if shared), season and what was taken, identification handed to Seek or iNaturalist, and a plain line on every find that no app makes a wild plant or mushroom safe to eat.

### Q44. A nature journal
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Garden,Life
- **Answers:** iNaturalist, Merlin · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** What was seen or heard, where and when, a photo, kept private; a one-tap export in the iNaturalist observation format when the person wants it to count for science; pollinators seen on the garden tied to the area.

### Q45. Animals
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Garden,Life
- **Answers:** 11pets, Farmbrite · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Pets and small livestock as records: feed, care, vet visits and vaccinations as reminders, costs, eggs and milk as yield, manure into the compost record; recorded as a relationship over time, nothing scored for output.

### Q53. Water at home
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Upkeep
- **Answers:** EWG Tap Water Database · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The utility report or a home test recorded by hand, the filter as Upkeep, and what matters for the person’s conditions (iodine, fluoride, nitrate, lead) with evidence tiers; any lookup of the utility by a coarsened place only (item 27).

### Q54. Home and health
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Signals
- **Answers:** Airthings, Awair · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Air quality, damp, mould, radon and allergens recorded by hand or from a sensor with a published interface, beside symptoms in Pattern Finder as context, never offered as the cause.

### Q55. Family health history and the tree
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life,Reports
- **Answers:** FamilySearch, Ancestry · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Both sides, any condition with age at onset, people who have died, unknown as an answer with no weight; GEDCOM in and out; the history a doctor asks for in the doctor report; never a risk figure, off the between-people allowlist by default.

### Q56. Children’s records under the Guardian tier
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life,All
- **Answers:** Baby Connect, Huckleberry · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A child’s conditions, meds, food, growth, school and appointments kept by the parent, the child’s own access opened at the parent’s pace, handed over at adulthood (P30).

### Q57. If something happens to me
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life
- **Answers:** Everplans, Trustworthy · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** After P5 decides how: what the people chosen need (care instructions, meds, accounts, wishes, where things are), sealed to each of them, released by a check-in they agreed to, with no company holding it.

## Phase 5. The Worker and the relay (7 items)

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

### Q58. A life’s Inside Story, first edition
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** All
- **Answers:** StoryWorth · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Years of the person’s own records gathered and laid out in their words, chosen piece by piece, others named shown before inclusion, as a printed book or PDF plus an open-format archive readable with nothing installed.

## Phase 6. The iPhone build (R2) (2 items)

### L1. Apple Health on iPhone
- **Ships by:** iPhone build R2 · **Size:** L · **Tabs:** Home,Trends,Signals,Insights
- **Answers:** Bearable, Guava, Welltory, Oura, Levels, Apple Health · **Theme:** Phones, widgets and devices
- **How:** A HealthKit module behind the lib/healthConnect.ts interface, so every reader stays the same.

### L3. iPhone widgets and Live Activity
- **Ships by:** iPhone build R2 · **Size:** L · **Tabs:** Home,Life
- **Answers:** Tiimo, Medisafe · **Theme:** Phones, widgets and devices
- **How:** WidgetKit through a config plugin, same content and switch.

## Phase 7. Opt-in, server and ruled-out items (24 items)

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
- **Ships by:** Owner decision first · **Size:** L · **Tabs:** Life
- **Answers:** YNAB, Monarch · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** Ruled out 2026-10-07 by direct instruction ("J1 only"). Plaid and Belvo need a company server holding a secret and charge the app per account or per call; GoCardless Bank Account Data closed on 2023-12-18; SimpleFIN Bridge (the person pays about $15 a year, the phone fetches directly) was the one route that fit, and it reaches US and Canadian banks only. J1, importing a bank export file, is the route: every country, no cost, nothing leaves the device.

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

### P33. Into the clinic's records system directly, much later
- **Ships by:** Needs a company server · **Size:** L · **Tabs:** Reports
- **Answers:** (your question) · **Theme:** Asked of you: these meet a standing rule or need a company server
- **How:** SMART on FHIR with Epic, Oracle Health and others: vendor certification per system, likely a server holding health data, and a HIPAA business associate agreement in the US, each meeting the no-company-server rule. P29 covers the need without it. Notion: https://app.notion.com/p/3f153652f2728159927ce6fe1f2e6c06

