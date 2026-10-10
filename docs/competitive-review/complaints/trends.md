# What users of the Trends competitors complain about

Researched 2026-10-09. Same format as `food.md`: dislikes, wishes (fix, change, add) and useless, each with source, date (the date read where the source gives none) and recurrence, ending with what Lifestead must do so the same complaint cannot be made of it.

Recurrence key: **many** (raised across many reviews or posters, or measured as a share of reviews), **several** (two to five people), **one** (a single person, kept because it is specific and checkable).

The same caution as `food.md` applies: justuseapp, Kimola, Unstar, appfollow, marlvel and appshunter are review-analysis or SEO sites, some of them competitors. Their percentages are reported as they claim them, not verified.

Already covered elsewhere: Apple Fitness, Oura and Strava in `schedules.md`. "Google Fit and Apple Fitness" is a composite; Google Fit has its own short section here. "Ecowitt" and "Ecowitt (WS View Plus)" are one maker's two apps, in one section. AC Infinity was removed from Lifestead in 1.0.55.40 because its interface is not published; it stays a competitor for growing conditions, and no dated user complaints about its app were found on this pass. Out of Milk and Libra returned no dated complaints either; left for a later pass.

---

## Across the whole category first

1. **The record shrinks unless somebody pays.** Strong limits history on Free, Stardust holds cycle history past six months behind a subscription, Gardenize cut Free to one photo per record and put export behind Premium ("held hostage"). **many**
2. **A count the person did not set** (Streaks' 24 habits, Habitify's 3 on Free), so a life that holds more than the app planned for does not fit. **many**
3. **Billing traps around fasting and weight loss**: Fastic's "0 €" order button that became a €99 annual contract, taken to court by a German consumer agency; Zero charging three times; trials that cannot be dismissed. **many**
4. **The number is wrong and the app still states it** (Sleep Cycle reading noise as sleep, Pillow saying a waking night was slept through, Pedometer++ wiping a day's steps, Welltory's HRV felt "way off"). **many**
5. **A service closed and the data's home went with it** (Google Fit's interfaces ended 2025-06-30; Weather Underground broke the personal station community that built it). **several**

**What Lifestead must do across the board:** history is never cut by tier or by age, and export is never paid (Free keeps every record it holds); lists have no count limit; no fasting or weight-loss framing and no "0" price that turns into a charge; every figure drawn from a device says which device and when, a gap stays a gap (the cross-app push's rule 2), and a person can correct or set aside a reading the device got wrong; readings come through Health Connect and Apple Health, never one company's private service.

---

## Happy Scale (leader: weight trend)

justuseapp reads 64.5% of reviews as positive. Predictions and sync need a subscription ($1.99 a month, or $39.99 for life).

**Liked** (the bar to meet): a smoothed trend that "takes the sting out of plateaus" and shows that one higher weigh-in does not change the direction. **many** ([justuseapp](https://justuseapp.com/en/app/532430574/happy-scale/reviews), read 2026-10-09)

**Dislikes**
- The parts people come for (predictions, sync) are paid. **several** (same)

**Lifestead must:** Trends > weight shows a smoothed trend beside the readings with "your usual range" (already built, `lib/yourUsual.ts`), carries no goal-date prediction framed as weight loss, and offers a one-time price on the free/paid board alongside the subscription.

## Hevy (leader: strength training log)

justuseapp reads 66.7% as negative, while the praise is for the interface and the social side.

**Dislikes**
- An exercise changed mid-workout cannot be saved back into the routine. **several** ([justuseapp](https://justuseapp.com/en/app/1458862350/hevy-gym-trainingstagebuch/reviews), read 2026-10-09)
- Sync with wearables fails, and there is no native Apple Watch app. **several** (same)
- The rest timer is awkward to set up, and exercise variants are missing so they have to be added by hand. **several** (same)

**Lifestead must:** a workout changed on the day offers "update the routine too"; any exercise can be added and named (open lists).

## Strong (strength training log)

Free with limited history; Pro $4.99 a month or $29.99 a year.

**Dislikes**
- Pro is not worth the money; missing machines and exercises from well-equipped gyms. **several** ([Unstar](https://unstar.app/blog/strava-strong-fitbod-nike-run-club-peloton-apple-fitness-workout-apps-ranked-2026), read 2026-10-09)
- No progress on the experience for a long time. **several** ([unitQ](https://unitq.com/unitq-scorecards/strongworkouttracker))
- Free history is limited. **many** (same)

**Lifestead must:** the across-the-board rule on history; equipment comes from Grow Setup's pattern of add-your-own.

## Sleep Cycle (leader: sleep tracking by sound and motion)

**Dislikes**
- Features locked behind a mandatory subscription with a short trial. **many** ([Kimola](https://kimola.com/reports/unlock-insights-sleep-cycle-app-user-feedback-report-app-store-us-154008), read 2026-10-09)
- Noise recorded as sleep. **many** (same)
- Constant prompts to upgrade. **many** (same)
- An update broke the alarm; across phone sleep apps the commonest complaint is a smart alarm that did not fire, fired silently or fired late. **many** ([Unstar](https://unstar.app/blog/sleep-cycle-pillow-sleepscore-oura-calm-sleep-tracking-apps-ranked-2026))
- A 2011 MacRumors thread called the tracking fake. **one** ([MacRumors](https://forums.macrumors.com/threads/sleep-cycle-app-is-fake.1136552/))

**Lifestead must:** sleep comes from what the person enters or what a device wrote to Health Connect or Apple Health, labelled as such; Lifestead offers no sleep-stage figure of its own; any alarm-like reminder follows `schedules.md` (it fires, it re-asks, it is never silent).

## Pillow (sleep tracking on Apple Watch)

**Dislikes**
- Missed waking periods and reported a broken night as slept through, so deep sleep figures are doubted. **several** ([Kimola](https://kimola.com/reports/explore-in-depth-insights-on-pillow-sleep-tracker-reviews-app-store-us-148025), read 2026-10-09)
- "Not enough data" when the Watch data was fine; naps and sleep before midnight not tracked. **several** (same)
- The alarm went off 35 minutes early. **one** ([justuseapp](https://justuseapp.com/en/app/878691772/pillow-sleep-tracker/problems))

**Lifestead must:** take naps and any sleep window, whatever the clock says; a person's own note on a night ("I was awake from 3") stands beside the device's figure and wins in Pattern Finder's context.

## Welltory (HRV and stress)

**Dislikes**
- Auto-renewal without notice; billed annually after buying lifetime. **several** ([Trustpilot](https://www.trustpilot.com/review/welltory.com?page=2), read 2026-10-09)
- Persistent upselling of lifetime to people already paying annually. **several** ([Kimola](https://kimola.com/reports/unlock-insights-into-welltory-app-user-feedback-google-play-en-us-151952))
- Readings felt "way off" and disagreed with the Apple Watch. **several** (same)
- Support emails unanswered; the contact form leads to an FAQ. **several** (Trustpilot)

**Lifestead must:** one upsell, never repeated to a payer; a reading from two devices shows both rather than one verdict; a way to reach a person is in the app.

## Zero (leader: fasting timer)

**Dislikes**
- The timer itself sits behind an annual subscription. **many** ([Unstar](https://unstar.app/blog/zero-simple-fastic-life-fasting-bodyfast-intermittent-fasting-apps-ranked-2026), read 2026-10-09)
- Charged three times with no access and no support. **one** (same)
- A pop-up for a trial that could not be dismissed. **several** (same)
- Weight-loss content that contradicts itself; generic AI coaching. **several** (same)
- Wish: a one-time purchase. **several** (same)

**Lifestead must:** an eating window, if it is offered, is a plain Schedules timer on Free with no weight-loss promise and the evidence tier said; every pop-up has a way out that does not buy.

## Simple (fasting and weight loss)

**Dislikes**
- Cancelling is hard and charges continue after trying to cancel; refunds refused. **many** ([Kimola, Trustpilot analysis](https://kimola.com/reports/discover-what-users-really-think-about-simple-life-app-trustpilot-en-us-146550), read 2026-10-09)

**Lifestead must:** cancel in one step inside the app, and say the date the last charge happened.

## Fastic (fasting and weight loss)

**Dislikes**
- The Baden-Württemberg consumer centre took it to court: a "free" offer conditional on logging two meals a day for 14 days sent a €99 annual invoice to anyone who missed, behind a button reading "0 €". **many** ([heise, 2025](https://www.heise.de/en/news/Weight-loss-app-Fastic-could-also-unknowingly-slim-down-your-wallet-10509156.html))
- Charges continued after cancelling through Google Play because they were billed to a card outside the store. **several** (same)

**Lifestead must:** no offer is ever conditional on logging, and every charge goes through the store the app came from.

## Streaks (habit tracker)

justuseapp reads 66.4% of reviews as negative.

**Dislikes**
- A hard limit of 24 habits, from people who use it daily. **many** ([Unstar](https://unstar.app/blog/streaks-habitica-way-of-life-strides-habit-tracking-apps-ranked-2026), read 2026-10-09)
- Watch complications blank until the app is opened. **several** (same)
- Editing needs gestures nobody can find: "completely unintuitive". **several** (same)

**Useless:** the streak itself, for anyone who missed a day; Lifestead has no streaks by rule.

**Lifestead must:** Routines and Did I Do It have no count limit; every action is a visible button, never only a gesture.

## Habitify (habit tracker)

justuseapp reads 76.1% of reviews as negative.

**Dislikes**
- Three habits on Free, then pay; the single commonest complaint. **many** ([justuseapp](https://justuseapp.com/en/app/1111447047/habitify-habit-tracker/reviews), read 2026-10-09)
- Widgets that do not update; iOS to Mac sync breaking without warning. **several** ([habi.app](https://habi.app/insights/habitify-alternatives/))
- Rising cost. **several** (same)

**Lifestead must:** Free carries the daily-living tools without a count (the always-Free list already names The one next thing and Simple View); sync failures are never silent (the 1.0.42.30 rule).

## Stardust (period tracker)

justuseapp reads 76.8% as negative against a 4.6 store rating.

**Dislikes**
- Assumes a 28-day cycle rather than the person's own history, so it fails irregular cycles. **many** ([justuseapp](https://justuseapp.com/en/app/1495829322/stardust-period-tracker/reviews), read 2026-10-09)
- History beyond six months is paid. **many** ([Unstar](https://unstar.app/blog/flo-clue-stardust-apple-health-period-tracking-apps-ranked-2026))
- Symptom logging is shallow. **several** (same)
- Stuck on a loading screen. **several** (justuseapp)

**Lifestead must:** cycle tracking (open item 25) predicts from the person's own cycles, says when there are too few to predict, never assumes 28 days, and keeps every cycle on Free.

## Pedometer++ (step counter)

**Dislikes**
- Updates wiped recorded steps or reset days to zero. **many** ([unitQ](https://unitq.com/unitq-scorecards/pedometer), read 2026-10-09)
- Counts differ from a friend's device. **several** (same)

**Lifestead must:** a step count once read is kept as read, never rewritten by an update, and the source is named.

## Google Fit

**Dislikes**
- Google ended its developer interfaces on 2025-06-30 in favour of Health Connect, with no replacement for Goals; "classic google, it gets rid of the only really good app"; a four-year user unsure where their data would go. **many** ([9to5Google, 2024-05-04](https://9to5google.com/2024/05/04/google-fit-api-shutdown/))

**Lifestead must:** keeps a copy of everything it reads, so a source closing removes nothing already recorded.

## Ecowitt and WS View Plus (leader: home weather station)

Ecowitt 2.45 from 38 US ratings; WS View Plus 2.43 from 7.

**Dislikes**
- Setup would not take Wi-Fi details, leaving the station useless. **several** ([worldsapps](https://worldsapps.com/reviews-ecowitt), read 2026-10-09)
- "Not a very user friendly tool for the general user." **several** ([worldsapps](https://worldsapps.com/reviews-wsview-plus))

**Liked:** Ecowitt's charts. **several** (same)

**Lifestead must:** Garden > Growing Conditions already reads Ecowitt's published local interface; its charts have to be as clear as Ecowitt's own and say each figure in plain words.

## Weather Underground (personal station network)

**Dislikes**
- IBM's changes broke the personal-station community that built the brand. **many** ([Unstar](https://unstar.app/blog/weather-apps-ranked-by-user-complaints-2026), read 2026-10-09)
- "Subscribed, still getting ads." **several** (same)
- After ten years of sending, a replacement station's data was never received, with no support. **one** ([Trustpilot](https://ie.trustpilot.com/review/www.wunderground.com?page=2))

**Lifestead must:** readings stay on the person's device and in their own folder; nothing depends on a network that can stop accepting them.

## Gardenize (garden journal)

4.26 from 267 iOS ratings; 3.7 from 1,200 on Google Play.

**Dislikes**
- An update cut Free to one photo per record and put export behind Premium; data "held hostage". **many** ([marlvel](https://marlvel.ai/apps/gardenize-plant-care-gardening), read 2026-10-09)
- A bug blocked buying Premium; pages in the wrong language. **several** (same)

**Lifestead must:** no photo limit per record and export always Free; nothing already allowed on Free is ever taken away by an update.

## Planter (garden planner)

justuseapp reads 59.2% as negative.

**Dislikes**
- No label for multiple varieties of one plant, so it is "not usable for more advanced gardeners". **several** ([justuseapp](https://justuseapp.com/en/app/1542642210/planter-garden-planner/reviews), read 2026-10-09)
- Notes are paid. **several** (same)

**Wishes**
- Add: planting schedules with automatic reminders and easier planting dates. **several** (same)

**Lifestead must:** a planting carries its variety; notes are Free; planting dates raise Days Until counters.

## Seedtime (garden planner)

TrustScore 4.8 from about 2,200 reviews.

**Dislikes**
- A steep learning curve, and restrictive about adding plants such as mint. **one** ([Trustpilot](https://ca.trustpilot.com/review/seedtime.us), read 2026-10-09)

**Lifestead must:** any plant can be added (open lists).

## GrowVeg (garden planner)

Mostly praise on its own testimonial page, which is the maker's.

**Wishes**
- Add: a record of seed progress from purchase to harvest. **one** ([GrowVeg](https://www.growveg.com.au/garden-planner-reviews.aspx), read 2026-10-09)

**Lifestead must:** a seed packet, its sowing, planting and harvest connected as one record (saving seed is second gap review item).

## Basket (grocery price comparison)

justuseapp reads 66.6% as negative.

**Dislikes**
- Prices differ between city and rural stores, so comparisons cannot be trusted. **several** ([justuseapp](https://justuseapp.com/en/app/1060139875/basket-grocery-shopping/reviews), read 2026-10-09)
- The cheapest store is not shown beside the item; each item has to be opened. **several** (same)
- Seems designed mainly to collect data. **several** (same)
- Does not take a shopping list and find the cheapest place for it, which is what people downloaded it for. **several** (same)

**Lifestead must:** prices come from what the person recorded paying, at which store, and the list shows the lowest recorded price beside each item; no data leaves the device.

## Toggl (time tracking)

4.7 from 2,585 Capterra reviews.

**Dislikes**
- Useful features (locked timesheets, scheduled reports) only at higher tiers, and price rises felt too much. **several** ([Capterra](https://www.capterra.com/p/247745/Toggl/reviews/?page=19), read 2026-10-09)

**Lifestead must:** Work's time record is the person's own and every report on it is available on the tier the free/paid board sets, not split across business tiers.
