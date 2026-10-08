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
