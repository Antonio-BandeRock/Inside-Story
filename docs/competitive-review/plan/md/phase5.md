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

### Q73. The Caregiver tier
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** All
- **Answers:** CareClinic, Medisafe, Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Free to download for the caregiver; the person cared for pays, and their first caregiver comes with their Individual plan. Linked by an invitation sent from the app; writing for another adult with consent or attestation, every change logged where both read it, missed doses told on time, and never usable as a cheaper Partner (Q89). Q74 to Q90 carry the rest, each built to beat the caregiver leader for that function.

### Q74. A free caregiver download, paid for by the person cared for
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** All
- **Answers:** Medisafe (Medfriend), Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The caregiver installs free and is linked only by an invitation sent from the cared-for person’s app and accepted, signed by both device keys; the first caregiver comes with the cared-for person’s Individual plan, further caregivers are priced under P27, and a person with no device of their own can have their plan bought for them by a relative, still as their plan.

### Q75. Each person cared for kept apart
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** All
- **Answers:** Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Each person cared for is a separate sealed record on the caregiver’s device, never one database with a person column, so nothing of one person can show on another’s screen, reach another’s report or travel in another’s sync; every screen names whose record is open, and switching is one tap.

### Q76. The caregiver’s day across everyone
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Home,Schedules
- **Answers:** Caring Village, Jointly · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** One view of today’s doses, appointments, meals and tasks for every person cared for, each line in that person’s name and colour, read from each separate record without mixing them, with the caregiver’s own day beside it.

### Q77. Doses marked on someone’s behalf
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules,Life
- **Answers:** Medisafe · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The caregiver marks a dose taken, skipped or refused for the person, stamped with who marked it, beside the person’s own marks; refill counts and the interaction-rule timing warnings apply as they do for the person. Medfriend can only watch.

### Q78. Consent area by area, attestation where there is no capacity
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Profile,Life
- **Answers:** Caring Village, CareClinic · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The person cared for chooses area by area what the caregiver reads and what they write, and can change or end it at any time; where the person cannot consent, the caregiver attests to their authority in plain words, and the app never judges capacity.

### Q79. The care circle and tasks people claim
- **Ships by:** Over the air (JS) · **Size:** L · **Tabs:** Life,Schedules
- **Answers:** Lotsa Helping Hands, ianacare · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Family, friends and paid aides invited into one person’s circle at the access each needs; rides, meals, visits and errands posted and claimed, and nobody in the circle sees health records they were not given.

### Q80. Updates to the people who ask
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** CaringBridge · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The caregiver writes an update once and sends it to chosen people through the circle or the share sheet; nothing goes out that the caregiver did not write, and no record travels with it unless picked.

### Q81. Documents for each person cared for
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Power of attorney, advance directive, insurance cards, medication lists and discharge papers kept per person, sealed on the device and inside the vault, with an expiry date raising a reminder.

### Q82. An emergency card for each person cared for
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Apple Medical ID, Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Each person’s conditions, meds, allergies, contacts and directives on one card the caregiver opens offline in two taps, never behind a paywall (P28).

### Q83. Appointments: questions before, what was said after
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Schedules,Reports
- **Answers:** CareClinic · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Questions gathered for a visit from the records since the last one, what the clinician said written down after, and a report for that clinician from that one person’s record.

### Q84. What the caregiver noticed, kept apart from what the person said
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Signals
- **Answers:** CareClinic · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Symptoms, mood, sleep and behaviour a caregiver observes are marked as observed, so Pattern Finder and every report keep them apart from the person’s own account; this matters most for memory loss and for a person who cannot say.

### Q85. Handover between caregivers
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Life
- **Answers:** Jointly, Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** What happened since the last person was there (doses, meals, notes, anything changed) on one page the next caregiver opens, read from the change log (P31).

### Q86. Care costs for each person cared for
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life
- **Answers:** (nobody) · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** Costs, who paid and insurance claims per person, on Finances and never mixed into the caregiver’s own money, so splitting costs among family is arithmetic rather than argument.

### Q87. The caregiver’s life too
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** Life,Home
- **Answers:** ianacare · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The caregiver’s sleep, appointments, breaks and support kept as their record, with respite and local help on the reading; no score, no burnout rating, nothing that says they are failing.

### Q88. When care ends
- **Ships by:** Over the air (JS) · **Size:** S · **Tabs:** Profile
- **Answers:** (nobody) · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** When the link ends or the person dies, the records go where the person said they should (P32, and “If something happens to me”), the caregiver keeps their notes and costs, and nothing is deleted unasked.

### Q89. A caregiver link can never stand in for Partner
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** All
- **Answers:** (your question) · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** The link runs one way, onto the cared-for person’s record and only the areas they consented to; nothing of the caregiver’s record travels back; meals and shopping are not shared both ways as Partner shares them; and the link gives the caregiver no paid features for their own records, which stay on whatever plan the caregiver has. Two people who set up caregiver links each way are paying two Individual plans, more than Partner, and the app says Partner costs less and shares more. Enforced in the allowlist (lib/peerRelationships.ts) and the entitlement gate (P27), never by trusting what the link is called.

### Q90. A paid user becoming a caregiver for their family
- **Ships by:** Over the air (JS) · **Size:** M · **Tabs:** All
- **Answers:** Caring Village · **Theme:** Beating the leader, function by function (2026-10-07)
- **How:** A person already on Individual or Partner becomes a caregiver for a parent or anyone in their extended family at no cost to themselves; the family member pays for the link through a plan of their own, which a relative may buy for them. The caregiver’s own records keep their full paid features beside each person they care for, kept apart (Q75).
