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
- **Ships by:** Explicit opt-in only · **Size:** L · **Tabs:** Garden
- **Answers:** AC Infinity · **Theme:** Garden
- **How:** Only through an undocumented cloud API; opt-in, stated, fragile.

### I25. What is wrong with this plant
- **Ships by:** Explicit opt-in only · **Size:** L · **Tabs:** Garden
- **Answers:** PictureThis · **Theme:** Garden
- **How:** A paid diagnosis service or a vision model, opt-in per use. Cost decision.

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
