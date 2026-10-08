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
