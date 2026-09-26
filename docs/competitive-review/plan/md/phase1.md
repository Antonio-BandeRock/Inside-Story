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
