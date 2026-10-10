# What users of the Schedules competitors complain about

Researched 2026-10-09. Same format as `food.md`: each app lists what its users dislike, what they wish were fixed, changed or added, and what they call useless or clutter, with source, date (the date read where the source gives none) and recurrence. The last line of each app says what Lifestead must do so the same complaint cannot be made of it.

Recurrence key: **many** (raised across many reviews or posters, or measured as a share of reviews), **several** (two to five people), **one** (a single person, kept because it is specific and checkable).

The same caution as `food.md` applies: justuseapp, Kimola, Unstar, appfollow, marlvel and saner.ai are review-analysis or SEO sites, some of them competitors. Their percentages are reported as they claim them, not verified.

"Phone calendar" and "Apple Health and Google Health" in `apps.json` are composites of apps listed here by name, so they have no section of their own: see Apple Calendar, Google Calendar and Apple Health Medications.

---

## Across the whole category first

Four complaints run through nearly every app below:

1. **A reminder that does not fire, or fires once and never again.** Medication apps above all, where a missed nag is a missed dose. **many**
2. **Something that was free moving behind a paywall**, sometimes in one country before the rest (Medisafe outside the US, Strava's Year in Sport, Todoist's natural-language input). **many**
3. **Sync between devices or with a watch losing entries or showing different things.** **many**
4. **No way to put right something done earlier**: a dose taken but not marked, a chore done yesterday, a rest day. The apps treat the day as closed. **several, across many apps**

**What Lifestead must do across the board:** a reminder about a medicine keeps asking until it is answered and is always Free (P28); every answer works from the notification itself, locked or not; any record can be marked for an earlier time, with that time kept; nothing Free today moves to paid; one person's devices show the same records.

---

## Medisafe (leader: My Meds dose timeline, med reminders)

**Dislikes**
- From 1 January, basic reminders for more than a couple of medicines moved behind the subscription for people outside the US; long-time users felt held hostage. **many** ([Trustpilot](https://uk.trustpilot.com/review/medisafe.com), read 2026-10-09)
- Editing or removing a reminder is hard to find and fiddly. **several** ([justuseapp](https://justuseapp.com/en/app/573916946/medisafe-medication-management/reviews), read 2026-10-09)
- Sync between a person's devices is weak. **several** (same)

**Wishes**
- Add: adherence and side-effect reports to take to a doctor. **several** ([Medical News Today](https://www.medicalnewstoday.com/articles/pill-reminder/), read 2026-10-09)

**Lifestead must:** keep every dose reminder Free in every country; edit or remove a dose from the dose itself in one step; report what was taken, skipped and late, with side effects beside it, in the doctor report.

## MyTherapy (leader on Android: med reminders)

**Dislikes**
- Reminders that do not fire, or stop firing after an app or phone update. **many** ([justuseapp](https://justuseapp.com/en/app/662170995/mytherapy-medication-reminder/reviews), read 2026-10-09)
- Swiping the notification away marks the dose as not taken. **several** (same)
- A dose cannot be marked taken from the lock screen. **several** (same)

**Lifestead must:** check after every update that scheduled reminders still exist and re-arm them; never read a swipe as an answer (a swiped reminder stays unanswered); answer from the lock screen, which App Lock already seals for the next unlock (1.0.62.3).

## Apple Health Medications (leader on iPhone: med reminders)

**Dislikes**
- Without tapping "remind me in 10 minutes", no second reminder ever comes, so one missed banner is a missed dose. **many** ([Apple Community 255955677](https://discussions.apple.com/thread/255955677), 2024)
- Since iOS 18, medicines vanish or the screen shows blank. **several** ([Apple Community 255873812](https://discussions.apple.com/thread/255873812), 2024)
- "All Taken" pressed on the notification does not register. **several** (same threads)
- One person reports a hospital stay after a run of missed doses nobody noticed. **one** ([TidBITS forum](https://talk.tidbits.com/t/an-apple-a-day-ios-16-medications-feature-provides-alerts-logging-and-peace-of-mind/20168?page=2))

**Wishes**
- Add: an end date for a short course such as antibiotics. **several** (TidBITS, same)
- Add: export of the log. **several** (same)
- Add: an alert when several doses in a row have been missed. **one** (same)

**Lifestead must:** re-ask on its own until answered; confirm on screen what a notification answer recorded; let a medicine end on a date or after a number of doses; export the log in an open format; say plainly on the Meds lens when a run of doses has gone unanswered, without telling anybody what to do about the medicine (`audit_clinical_claims.js`).

## CareClinic (leader: dose timeline, symptom and med log together)

**Dislikes**
- Billed when the trial ended, hard to cancel, support hard to reach. **several** ([PissedConsumer](https://www.pissedconsumer.com/careclinic/RT-F.html), read 2026-10-09)
- Entering everything by hand takes too long. **several** ([appfollow, 4.2 from 2,299 ratings](https://apps.appfollow.io/ios/symptom-tracker-careclinic/1455648231?country=us))

**Lifestead must:** cancel inside the app as easily as subscribing, with the date billing starts shown before the trial begins; every entry a pick from recents, favourites or voice rather than a blank form.

## Structured (leader: Today's Meals as a day timeline)

**Dislikes**
- iCloud sync loses or duplicates tasks; the company built its own Structured Cloud to work round it. **many** ([saner.ai review](https://blog.saner.ai/structured-review/), read 2026-10-09)
- Android and web versions lag the iPhone. **several** ([Kimola, Google Play](https://kimola.com/reports/exclusive-insight-structured-daily-planner-feedback-analysis-google-play-en-146981))

**Wishes**
- Add: a week and a month view, not only the day. **several** (saner.ai)
- Change: time slots that can be set to any length. **several** (Kimola)

**Lifestead must:** one person's devices merge record by record (built, 1.0.42.28 onward); Android, iPhone and desktop are the same code; Today's Meals gains a week view.

## Tiimo (leader: visual day for the daily-living audience)

92% positive by justuseapp's reading. Pro is $7.99 a month or $79.99 a year ([lifestack](https://lifestack.ai/blog/tiimo-pricing)).

**Dislikes**
- Bugs out of keeping with the price. **several** ([justuseapp](https://justuseapp.com/en/app/1480220328/tiimo-visual-daily-planner/reviews), read 2026-10-09)
- Notifications nobody asked for. **several** (same)

**Wishes**
- Change: focus-timer breaks that can be set to any length. **several** (same)
- Add: fuller watch support. **several** (same)

**Lifestead must:** every reminder kind can be turned off by itself; any timer it offers takes any length; nothing nags that the person did not set up.

## Todoist (leader: to-dos, Did I Do It)

**Dislikes**
- Natural-language dates ("every second Tuesday") moved behind the paid plan. **many** ([Unstar, 2026](https://unstar.app/de/blog/productivity-app-reviews-what-power-users-complain-about-2026))
- A redesign that moved familiar things. **several** (same)
- Weak calendar integration. **several** (same)

**Lifestead must:** typing or saying a date in plain words is Free; a redesign never moves a button somebody uses daily without a note where it went.

## Google Calendar (leader: Appointments, device calendar)

**Dislikes**
- Sync delays, time-zone bugs, third-party accounts breaking. **many** ([Unstar, calendars ranked 2026](https://unstar.app/blog/fantastical-google-apple-outlook-notion-calendar-apps-ranked-2026))
- An AI upsell in the way. **several** (same)

**Wishes**
- Add: more colours; managing calendars inside the app; easier dragging of events; richer event descriptions. **several** ([Kimola, Google Play](https://kimola.com/reports/unlock-google-calendar-insights-a-comprehensive-user-feedback-report-google-play-en-us-145082))

**Lifestead must:** store every appointment with its time zone; an appointment carries notes, what to bring and what to ask, which no general calendar holds; no upsell inside a working screen.

## Apple Calendar (also: Appointments)

**Dislikes**
- An event reminder that never arrived, and the person was late. **several** (Unstar, same)
- Few features past the basics; weak natural-language entry. **many** (same)

**Wishes**
- Bring back "Show All Notes", removed in iOS 18, to read notes without risking an edit. **one** ([Apple Community](https://discussions-kr-prz.apple.com/thread/255768960))

**Lifestead must:** an appointment opened to read is not in edit mode until Edit is pressed.

## Due (also: reminders that keep asking)

94% positive by justuseapp's reading, and loved by people with ADHD for nagging until done.

**Dislikes**
- What "repeat daily" does after a missed day is unclear. **several** ([justuseapp](https://justuseapp.com/en/app/390017969/due-reminders-timers/reviews))
- Thin documentation; developers do not answer. **several** ([Mac Power Users forum](https://talk.macpowerusers.com/t/due-app-persistent-and-noisy/7191))

**Lifestead must:** match Due's persistence (this is the bar for a reminder that matters); say in words what happens to a repeating thing after a missed day.

## Routinery (also: Routines)

Rated 4.7, yet justuseapp reads its written reviews as 79.5% negative.

**Dislikes**
- Bugs; overpriced next to one-time-purchase routine apps. **many** ([justuseapp](https://justuseapp.com/en/app/1450486923/routinery-ritual-routine/reviews))

**Lifestead must:** Routines stay on Free (the daily-living audience's way in must not cost money).

## Sweepy (leader: Upkeep)

**Dislikes**
- A chore done yesterday but not ticked cannot be marked for yesterday. **several** ([justuseapp](https://justuseapp.com/en/app/1498897320/sweepy-home-cleaning-schedule/reviews))
- Unclear what happens to the data. **several** (same)

**Lifestead must:** mark upkeep done on any past day (`upkeep_doings.done_on` is already a plain date); the privacy line is one sentence: nothing leaves the device.

## Tody (also: Upkeep)

4.83 from 31,353 ratings.

**Dislikes**
- No landscape layout on a tablet. **several** ([marlvel](https://marlvel.ai/apps/tody/reviews), read 2026-10-09)
- Tody decides the order of tasks in a room and it cannot be changed. **several** ([justuseapp](https://justuseapp.com/en/app/595339588/tody/reviews))

**Lifestead must:** the person can reorder upkeep within an area; desktop and wide screens already lay out wide.

## Waterllama (leader: Hydration)

**Dislikes**
- Weight-loss challenges read as encouraging disordered eating. **several** ([justuseapp](https://justuseapp.com/en/app/1454778585/water-tracker-waterllama/reviews))
- Paying for cosmetic characters. **several** ([Kimola](https://kimola.com/reports/transform-hydration-habits-with-waterllama-feedback-insights-app-store-us-154082))
- A buggy watch app. **several** (same)

**Lifestead must:** no weight-loss framing anywhere near Hydration; nothing cosmetic for sale.

## WaterMinder (also: Hydration)

justuseapp reads its reviews as 70.3% negative.

**Dislikes**
- Overtaken by ads, turning a five-second log into a chore. **many** ([Kimola](https://kimola.com/reports/unlock-insights-waterminderr-app-user-feedback-report-app-store-us-148033))
- About $30 a year for a water tracker. **several** ([justuseapp](https://justuseapp.com/en/app/653031147/waterminder/reviews))
- Watch and phone logs disagree. **several** (same)

**Lifestead must:** logging a drink is one tap, Free, with no ads.

## Fitbod (leader: Exercise)

4.8 from about 260,000 ratings.

**Dislikes**
- Workouts that feel random, repeat, or set weights dangerously heavy. **several** ([Dr Muscle on Reddit threads](https://dr-muscle.com/fitbod-review-reddit/), a competitor)
- Slow support; few advanced variations. **several** ([Kimola](https://kimola.com/reports/comprehensive-fitbod-feedback-analysis-report-available-now-app-store-us-141682))

**Lifestead must:** any suggested load says what it was worked out from, and never rises without a logged session behind it; a flare day lowers the plan rather than ignoring it.

## Apple Fitness (also: Exercise, Movement)

**Dislikes**
- No rest days: the rings nag on a sick day and a streak dies for resting. **many** ([Android Authority](https://www.androidauthority.com/fitbit-apple-fitness-rest-days-3163136), [Tom's Guide](https://www.tomsguide.com/opinion/4-ways-the-apple-watch-could-step-up-on-fitness))
- Ring-closing turns into anxiety: walks at 11:30 at night to close a ring. **many** ([Fortune, 2025-01-24](https://www.fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications))

**Lifestead must:** no streaks and no rings (already the rule, item 29); a flare or rest day is a record of its own, never a failure.

## Oura (also: sleep and readiness inputs)

**Dislikes**
- A subscription on top of a ring costing hundreds; without it only three basic scores show. **many** ([ChannelNews](https://channelnews.com.au/oura-quietly-files-for-ipo-as-users-revolt-over-subscription-costs-battery-failures-and-product-complaints/), 2026)
- A redesign people dislike; naps logged wrongly, stress tracking disappearing, Android crashes on activity. **many** ([Kimola](https://kimola.com/reports/unlock-insights-oura-app-feedback-analysis-report-app-store-us-154501))

**Lifestead must:** read a ring's data through Health Connect or Apple Health at no extra charge; correct a wrongly logged nap or sleep by hand.

## Strava (also: Exercise)

**Dislikes**
- Free features moved behind the paid plan over years: segment leaderboards, then Year in Sport in 2025. **many** ([Cycling Weekly](https://www.cyclingweekly.com/news/latest-news/tell-us-what-is-your-reaction-to-strava-removing-features-for-free-users-456213/amp), [Singletracks](https://www.singletracks.com/mtb-news/strava-makes-segment-leaderboards-other-features-exclusive-to-subscribers/))
- Integrations cut that did not serve the subscription. **several** ([the5krunner, 2026-02-13](https://the5krunner.com/2026/02/13/strava-facebook-login-ending-2026/))

**Lifestead must:** a person's look back over their own year is never paid; Free never shrinks.

## Mealime (also: Meal Plan)

63.3% positive by justuseapp's reading of about 53,000 reviews.

**Dislikes**
- Recipes take 5 to 15 minutes longer than stated. **several** ([ExpertBeacon](https://expertbeacon.com/mealime-review/))
- Not enough variety. **several** ([justuseapp](https://justuseapp.com/en/app/1079999103/mealime-meal-plans-recipes/reviews))

**Lifestead must:** recipe times include prep; the Meal Plan rotates through the whole corpus for the person's conditions before repeating.

## Apple Health hydration (also: Hydration)

No complaint specific to Apple Health's water logging turned up; people complain about the apps that write into it (Waterllama, WaterMinder above). **Lifestead must:** write drinks into Apple Health and Health Connect so a person's other apps see them.
