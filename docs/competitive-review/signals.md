# Signals tab: competitive review

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Bearable
- [x] Visible
- [x] Cara Care
- [x] mySymptoms
- [x] Flaredown
- [x] CareClinic
- [x] Guava
- [x] Clue
- [x] Welltory
- [x] Oura
- [x] Gap synthesis
- [x] Pricing summary

## 1. What Signals does today

The tab file is `app/(tabs)/log.tsx` (the route is still `/log`; the tab is titled Signals). It has eight lenses:

| Lens | What it records | Where it is stored |
|---|---|---|
| Flares | Start date and time, severity on a four-step scale (Mild, Moderate, Severe, Very severe), symptom tags, notes | `wellbeing_checkins` (type `flare`) plus `checkin_tags` |
| Food Reactions | Same form, starting from a named food | `wellbeing_checkins` (type `reaction`) |
| New Foods | Food trials with a watch window, marked cleared or flagged; since 2026-09-24 also "leave it out, then bring it back" experiments with 7 to 28 days out, a chosen measure, and a before/without/back comparison that always ends with its one-run limit | `food_trials`, `lib/foodExperiment.ts`, reminders via `food_trial_task_links` |
| Exercise | What and how long | `exercise_logs` |
| Blood Pressure | Systolic, diastolic, pulse | `body_measurements` |
| Hands-On Therapies | Chiropractic, acupuncture, massage, pelvic floor PT and so on: who, what, how long, cost | `therapy_sessions`, read by Trends > Therapy Response |
| General Note | Anything else | `wellbeing_checkins` |
| Nocturia | Night-time bathroom trips and first-wake time | `nocturia_nights`, read by Trends > Nights |

Related pieces that live elsewhere but feed or belong with Signals:

- **Home "how are you today" check-in**: one tap on any of 43 tags across 9 categories (digestive, energy, mood and stress, sleep, skin, pain, cognitive, appetite, sensory and regulation), positive tags included (`lib/checkinTags.ts`, `app/(tabs)/index.tsx`).
- **Symptom Assessment** (`app/assessment.tsx`, `symptom_assessments`): scored questionnaires per domain (hypothyroid, IBS, prostate, wellbeing) that drive the healing-stage suggestion.
- **Labs**: entered on Insights > Labs, charted on Trends > Labs (`lab_results`, with lab range and "your usual range").
- **Health Connect import** (`lib/healthConnect.ts`, Android only): steps, distance, workouts, blood glucose, sleep, menstruation flow, weight, blood pressure, heart rate, resting heart rate, HRV, blood oxygen, skin temperature. Kept, not interpreted.
- **Pattern Finder** on Trends reads flares against meals with named denominators and a baseline (`lib/patternBasis.ts`), and lists sleep and treatment changes beside the foods without calling them the cause.
- **Voice log and capture** (`app/voice-log.tsx`, `app/capture.tsx`).

Planned but not built (from CLAUDE.md): menstrual cycle tracking cross-referenced in Pattern Finder (item 25; flow days already import from Health Connect but nothing reads them), "Get Back on Track" (22), weekly retuning check-in (23), ADHD and autism as selectable profiles, and regulation and sensory tags becoming a band inside a Symptoms & Flares lens.

What Signals does NOT have today: no daily numeric sliders (mood 1 to 10, energy 1 to 10), no symptom photos, no bowel movement / stool form log, no pacing or energy-budget view, no custom symptom names beyond the fixed tag list, no reminders to check in at set times, no home-screen widget or notification quick-log, no Apple Health import on iPhone, no weather or pollen context, no medical-record import.

## 2. Competitors

### 2.1 Bearable (the closest direct rival to Signals)

**What it is.** A general symptom, mood and habit tracker built by people with chronic illness. iPhone and Android. Very popular with chronic illness, ADHD and mental health communities, which overlaps both Inside Story audiences.

**Pricing** (checked 2026-09-25, https://bearable.app/pricing/ and https://bearable.app/blog/pricing-and-principles/): Free tier covers most tracking with unlimited custom items and weekly reports. Premium is $6.99/month or $34.99/year, the annual price often discounted to about $18.99. No lifetime purchase (they say they are exploring one and give some away in monthly draws). No family plan. A sponsorship scheme ("Bearable Heroes") gives Premium to people who cannot afford it. Regional pricing not confirmed.

**What it does well that Inside Story does not yet do**
1. **Logging is a single scrolling daily form** with mood and energy as 1 to 5 or 1 to 10 scales, then taps on symptoms with a per-symptom severity, then factors (anything the person names). A full day takes well under a minute.
2. **Every item is the person's own.** Symptoms, factors and categories are all user-created. Signals' tag list is fixed at 43.
3. **Correlation reports across everything**: any factor against any symptom, with "on days you did X, symptom Y averaged Z" charts. Inside Story's Pattern Finder only reads flares against foods.
4. **Custom experiments** (Premium): pick a change, pick the outcome, compare before and after. Inside Story has this only for foods.
5. **Bowel movement log** with a stool scale, a first-class tracker in a chronic illness app.
6. **Reminders to check in** at times the person sets, several a day.
7. **Apple Health, Google Fit and Fitbit import.**

**What Inside Story already does better**
- The food side is incomparably deeper: Bearable's "nutrition" is a tag like "ate sugar", while Inside Story knows the food and its nutrients, scores and the 19 conditions.
- Pattern Finder names its denominators and compares against an ordinary-stretch baseline (`lib/patternBasis.ts`); Bearable's correlation charts do neither and can read as cause.
- Food experiments with a before, without and back period, and a stated one-run limit.
- Hands-On Therapies with Therapy Response, nocturia, blood pressure, labs with ranges, the healing-stage assessment.
- Local-first. Bearable stores data on its servers (encrypted, and it promises never to sell it).

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Daily 1 to 5 mood and energy scales beside the Home tag check-in | Add `mood` and `energy` integer columns (or a small `daily_scales` table) to `wellbeing_checkins`; extend the Home feeling check-in in `app/(tabs)/index.tsx`; read in Trends > Symptoms and Pattern Finder | JS only (OTA) | None | Small |
| Person's own symptom tags | New open list on the `garden_custom_terms` precedent (or a `checkin_custom_tags` table); `lib/checkinTags.ts` merges built-in and custom through `sortByLabel`; removal retires rather than deletes, per the open-lists rule | JS only | None | Small to Medium |
| Per-symptom severity rather than one severity for the whole flare | Add `severity` to `checkin_tags`; update `CheckinForm` in `app/(tabs)/log.tsx` | JS only | None | Small |
| Correlation of any factor (sleep hours, steps, therapy, a custom factor) against symptoms, not only foods | Extend `lib/patternBasis.ts` and `lib/patternContext.ts` to compare symptom days against factor days, keeping denominators and the "tends to follow" ceiling | JS only | None | Medium |
| Experiments beyond food (bed time, a supplement, a walk) | Generalise `food_trials` design to a `subject_kind` column; `lib/foodExperiment.ts` already has no food-specific arithmetic | JS only | None | Medium |
| Check-in reminders | A new reminder kind in `lib/reminderSources.ts` / `lib/reminderSchedule.ts`, with a Profile switch in `lib/reminderPreferences.ts` | JS only (expo-notifications is already built in) | None | Small |

### 2.2 Visible (pacing for energy-limiting illness)

**What it is.** A pacing app for Long Covid, ME/CFS, POTS, fibromyalgia and EDS. iPhone and Android. The free app does a morning check-in (resting heart rate and HRV taken through the phone camera, plus a few symptom sliders) and turns it into a daily "Stability Score". The paid membership adds a Polar-made armband that measures heart rate all day and turns it into "PacePoints", a daily energy budget, with a buzz when the wearer is overdoing it.

**Pricing** (checked 2026-09-25): free app with morning and evening check-ins, Stability Score, trends and export (https://www.elarahealth.org/pacing-app-vergleich). Membership reported at about $19.99/month or $179.88/year, plus the Visible Band 2.0 at $99.99 list, often about $80 (third-party source https://wellfr.com/how-much-does-the-visible-arm-band-cost-a-breakdown-of-device-and-subscription-fees; UK reported at £11/month billed yearly). Official page https://www.makevisible.com/ does not print the price, so treat these as unconfirmed. Membership sold in the US and UK only. No family plan.

**What it does well that Inside Story does not yet do**
1. **One-minute morning check-in with a single daily figure** that says how much room the person has today. Inside Story has no morning ritual and no single "today" reading.
2. **Pacing and energy budgeting**: the whole product is about not overspending energy, which matters for fatigue across Hashimoto's, lupus, MS, fibromyalgia, and for the second audience's overload.
3. **Live wearable feedback** (the armband buzzes before a crash).
4. **Heart rate and HRV from the phone camera**, no wearable needed.
5. Validated questionnaire (FUNCAP) for function over time.

**What Inside Story already does better**
- Food, meds, labs, therapies, nocturia and the rest; Visible is heart rate and a handful of symptoms.
- Inside Story already imports resting heart rate and HRV from any watch through Health Connect, at no extra hardware cost.
- No subscription hardware lock-in, and data stays on the phone.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| A morning check-in ritual (sleep last night, energy now, one or two symptoms) that opens with a notification | New reminder kind in `lib/reminderSources.ts`; a compact form reusing `CheckinForm` pieces, landing on Home; stores to `wellbeing_checkins` with a new `checkin_type` 'morning' | JS only | None | Small |
| Showing resting heart rate and HRV beside that morning entry, compared with "your usual range" | Read Health Connect rows already imported (`lib/healthSync.ts`), band them with `lib/yourUsual.ts`; must say "your usual", never "you are low today" | JS only | None | Small |
| An energy budget / pacing view | A Trends or Home band that adds up exercise, steps, therapy sessions and logged overload tags against the person's own typical day. Must be framed as a record, never as a limit set by the app, since the app does not diagnose | JS only | None | Medium to Large |
| Camera-based heart rate | Needs a native camera frame-processing module and careful validation | Native (EAS rebuild) | None (on-device) | Large, not recommended |
| Live over-exertion buzz from a wearable | Needs continuous Bluetooth heart-rate streaming in the background | Native, battery heavy | None | Large, not recommended |

### 2.3 Cara Care (gut-focused diary and therapy program, owned by Bayer since 2025)

**What it is.** A food and symptom diary for IBS, IBD, reflux and functional dyspepsia, with structured programs: low-FODMAP elimination and reintroduction, gut-directed hypnotherapy audio, dietitian content. In Germany it is a prescribable digital health app paid by insurers. iPhone and Android.

**Pricing** (checked 2026-09-25): varies by country and has been reported inconsistently. One 2026 review gives a limited free tier and $19.99/month for full access (https://mouthtogut.com/news/best-food-diary-apps-ibs-food-sensitivities-2026); another gives $8 to $10/month (https://triggerbites.com/blog/best-food-diary-apps-2026). An insurer and employer version is unlocked by access code. No lifetime or family plan found. Could not confirm from Cara Care's own store listing.

**What it does well that Inside Story does not yet do**
1. **Stool log with the Bristol stool scale**, pictured, one tap. Bowel habit is the core signal for IBS, IBD and celiac, three of Inside Story's 19 conditions, and Signals has nowhere to put it except a tag or a note.
2. **Guided elimination and reintroduction program** with a day-by-day plan and prompts, rather than a single trial set up by hand.
3. **"Best days vs worst days"** view: which foods showed up on the person's best and worst symptom days.
4. **Gut-directed hypnotherapy audio**, which has trial evidence in IBS.
5. **Dietitian and gastroenterologist-built content inside the flow**, and a clinician-facing companion app.

**What Inside Story already does better**
- Covers 19 conditions instead of the gut alone, plus meds, labs, therapies and the rest of life.
- A far larger food database with nutrients and per-condition scoring; Cara Care leans on FODMAP only.
- The food experiment design (before, without, back) and the honest one-run limit.
- No account, no server, no insurer in the loop.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Bowel movement log with the Bristol scale (type 1 to 7, urgency, blood, pain), drawn as pictures | New lens "Digestion" or "Bowel" in `app/(tabs)/log.tsx`; new table `bowel_movements` (append-only, logged_at local-day rule); Trends band; Pattern Finder reads it as another outcome alongside flares. Image assets only | JS only | None | Medium |
| Guided elimination program (several foods, one at a time, with a calendar) | Build on `food_trials` and `lib/foodExperiment.ts`: a "series" that queues the next trial when one ends, reusing `food_trial_task_links` reminders. Must keep EXPERIMENT_LIMIT wording | JS only | None | Medium |
| Best days vs worst days | A Trends > Symptoms band: the foods eaten on the person's lowest-symptom days next to the highest, with counts. Wording must be "showed up on", never "caused" | JS only | None | Small to Medium |
| Gut-directed hypnotherapy or relaxation audio | Licensed audio content plus a player screen | Native: no audio module (`expo-audio` or `expo-av`) is in `package.json` today, so one EAS rebuild | None | Medium (content licensing is the hard part) |

### 2.4 mySymptoms Food Diary (the long-running food-and-symptom diary)

**What it is.** One of the oldest food and symptom diaries (since 2010), widely recommended by dietitians for IBS and food intolerance work. iPhone and Android. Logs food and drink, medications, bowel movements, energy, sleep, stress, exercise and outcomes the person names, then analyses which foods and ingredients tend to come before each symptom, over what time gap.

**Pricing** (checked 2026-09-25, https://www.mysymptoms.net/question/prices/ and store search results): logging is free with ads. Premium is a subscription for the analysis: $9.99 for 1 month, $39.99 for 6 months, $49.99 for 12 months, with a 7-day trial. No lifetime (older one-time purchases were discontinued) and no family plan found. Store prices may vary by country.

**What it does well that Inside Story does not yet do**
1. **Time-gap analysis per suspect**: for each symptom it shows which foods and ingredients most often came before it, and within what window (for example 2 to 6 hours, or the next day). Inside Story's Pattern Finder uses fixed preceding windows rather than showing the typical delay per food.
2. **Bowel movements, energy, sleep and stress as separate quick entries on one timeline** with the food, so the day reads as one strip.
3. **A PDF diary export and a secure share link for a dietitian**, used routinely in clinics.
4. **Speed**: a recent-items list and a one-tap repeat for common entries.

**What Inside Story already does better**
- Pattern Finder states what it counts against, compares to an ordinary-stretch baseline and never names a cause; mySymptoms labels foods as "suspects", which leans toward a verdict.
- Measured nutrient data and per-condition scoring behind every food.
- Experiments that test a suspect on purpose rather than only watching.
- Reports already export as a PDF on-device (`expo-print`), without a cloud share link.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Show the typical delay between a food and the flares that follow it | Add a delay distribution to the Pattern Finder candidate in `lib/patternBasis.ts` (median hours from the meal to the flare, with the count behind it); display on Trends > Patterns. Wording: "when this came before a flare, it was usually 4 to 8 hours before" | JS only | None | Small to Medium |
| One combined day strip (meals, doses, check-ins, flares, bowel, sleep) | `app/timeline.tsx` already exists; extend it to pull `wellbeing_checkins`, `nocturia_nights` and the Health Connect sleep rows so Signals entries sit between the meals | JS only | None | Small to Medium |
| A food-and-symptom diary PDF aimed at a dietitian | Already partly there: `lib/reportKinds.ts` has a nutritionist report. Add a day-by-day diary section to it | JS only | None | Small |
| Stress as its own quick entry | Covered by the mood and energy scale recommendation under Bearable; add a stress scale beside them | JS only | None | Small |

### 2.5 Flaredown (free, community-built flare tracker)

**What it is.** A free tracker built by patients for any chronic illness, used heavily by autoimmune communities. Web, iPhone and Android (the mobile apps wrap the web app). Tracks conditions, symptoms, treatments, foods, tags and a daily "how was today", and records local weather automatically. Its anonymised data set is public for research, which is its main distinguishing trait. Development is slow and it is run by the founder without funding, so treat long-term upkeep as uncertain.

**Pricing** (checked 2026-09-25, https://flaredown.com/): free, "free forever", no paid tier, no ads. Funded by donations.

**What it does well that Inside Story does not yet do**
1. **Weather logged automatically** every day (temperature, humidity, pressure, precipitation) and available beside symptoms. Barometric pressure is a commonly reported flare context for arthritis, migraine and fibromyalgia, three of the 19 conditions.
2. **A daily check-in built around the person's own list** of conditions, symptoms and treatments, each rated 0 to 4, so every day produces the same shape of record and is easy to compare.
3. **Community comparisons**: what other people with the same condition report tracking and taking.

**What Inside Story already does better**
- Everything to do with food, nutrients, meds timing, labs and the rest of life.
- Stays on the phone; Flaredown's anonymised data is pooled and published, which some people will not want.
- Honest pattern wording; Flaredown leaves interpretation to the person.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Daily weather beside symptoms | Already accepted scope as item 27 in CLAUDE.md (External data program: weather is in the first pair to build). A `daily_weather` table filled once a day from the `inside-story-site` Worker using a coarsened location (city or rounded coordinate, opt-in). Pattern Finder lists pressure drops beside flares as context, never as the cause, on the `lib/patternContext.ts` precedent | JS only, but `expo-location` is not in `package.json`, so automatic location needs one rebuild; a typed-in city avoids that | Location must be coarsened and opt-in, as item 27 already requires | Medium |
| A same-shaped daily record (person's chosen symptoms rated each day, including "none today") | A "My daily list" setting that pins chosen tags to the Home check-in with a 0 to 4 rating each; zeros are stored, which also fixes the missing "good days" baseline for Pattern Finder | JS only | None | Small to Medium |
| Community comparisons | Would need a server holding pooled data | JS, plus a server | Conflicts with the no-server stance; not recommended | Large, skip |

### 2.6 CareClinic (all-in-one care plan and tracker)

**What it is.** A general self-care tracker: medications and supplements with reminders, symptoms on a 1 to 10 scale, mood, nutrition, hydration, journaling with prompts, health questionnaires, measurements, periods, and printable reports. Web, iPhone and Android, with an offline mode. Integrates with Apple Health and Google Fit. Also sold to clinics.

**Pricing** (checked 2026-09-25): Premium $9.99/month or $59.99/year (https://bearable.app/bearable-vs-careclinic-which-one-should-you-choose/ and https://sourceforge.net/software/product/CareClinic/); one listing gives a cheaper $5.99/month or $39.99/year tier, and a professional plan from $49.99/month. The official pricing page returned "not found", so these are unconfirmed. Free tier is narrow: three preset symptoms, no customising, no back-dating. No lifetime found; family and caregiver plans not confirmed.

**What it does well that Inside Story does not yet do**
1. **Validated health scales and questionnaires** (for example depression, anxiety and pain scales) filled in inside the app and charted over time. Inside Story has its own assessment domains but not the standard scales a clinician recognises by name.
2. **Guided journaling prompts** alongside symptoms.
3. **Symptom severity on a 1 to 10 scale with a timestamp per symptom**, finer than Signals' four steps.
4. **One app across web, phone and offline**, which Inside Story now also has through the desktop app.

**What Inside Story already does better**
- The whole food side, the interaction rules, meds timing against meals, labs with ranges, therapies, nocturia.
- A free tier that is not crippled: Signals is not in Inside Story's Free tier at all, but what Free does include is not capped at three items.
- Local-first; CareClinic holds data on its servers.
- Honest evidence tiering and pattern wording.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Standard questionnaires (PHQ-9, GAD-7, a fatigue scale such as FSS or FACIT-F, a pain interference scale) | New domains in the existing assessment framework (`app/assessment.tsx`, `symptom_assessments`, `symptom_assessment_responses`). Licensing must be checked per scale (PHQ-9 and GAD-7 are free to use; some fatigue and pain scales are not). Results shown as the scale's own published bands, with "talk to your clinician" wording, and never as a diagnosis, which `scripts/audit_clinical_claims.js` would check | JS only | None | Medium |
| Finer symptom severity | Change `SEVERITY_OPTIONS` in `app/(tabs)/log.tsx` to 0 to 10, or keep four named steps and add an optional number. Older rows (1 to 4) would need a mapping for Trends | JS only | None | Small |
| Journal prompts | A small prompt list shown above General Note; optional | JS only | None | Small |

### 2.7 Guava Health (records, wearables and symptoms in one place)

**What it is.** A health tracker aimed at people with chronic and complex conditions that pulls US medical records from patient portals (MyChart, Cerner and others, 50,000+ providers), reads uploaded PDFs, images and scans with AI, and puts them beside symptoms, mood, medications, cycle and wearable data. iPhone, iPad, Mac, Vision Pro and Android.

**Pricing** (checked 2026-09-25, https://apps.apple.com/us/app/guava-health-tracker/id1622255863): free, with an optional paid "Guava Plus" subscription. The store page and searches did not show the price; could not confirm. No lifetime or family plan found.

**What it does well that Inside Story does not yet do**
1. **Body heat map for symptoms**: tap where it hurts on a body outline; the map fills in over time. Much faster and clearer than tags for pain, joint and skin conditions (rheumatoid arthritis, psoriasis, lupus, fibromyalgia).
2. **Lab results arrive by themselves** from the patient portal instead of being typed in.
3. **Doctor visit prep**: a summary built for one appointment.
4. **Wide wearable list**: Apple Health, Garmin, Fitbit, Oura, Dexcom and more.
5. **Medication supply count and refill alerts.**
6. **Cycle tracking with predictions.**

**What Inside Story already does better**
- No AI reading records on a company's server, and no portal login shared with a third party.
- Food and nutrient depth, the interaction rules, and Pattern Finder's honest counting.
- Reports per reader (doctor, nutritionist, trainer, caregiver) are already built in `lib/reportKinds.ts`, which covers most of "doctor visit prep".

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Body map for where a symptom is | A tappable body outline component (SVG, front and back, about 30 regions) in the flare and reaction forms in `app/(tabs)/log.tsx`; a `checkin_body_regions` table (checkin_id, region); a Trends band showing which regions come up most. `react-native-svg` is already in `package.json` | JS only | None | Medium |
| Lab import without typing | Two local routes: (a) a photo of the lab sheet read on the phone (needs on-device text recognition, a native module and rebuild), or (b) a pasted table or CSV parsed in JS. Portal (FHIR) import needs an OAuth sign-in per health system and a registered app, which is Large. All should land in `lab_results` for the person to confirm before saving | (b) JS only; (a) native | Portal import sends credentials to the health system only, no Inside Story server needed, but it is a large compliance job | (b) Small, (a) Medium, portal Large |
| Pill supply count and refill alert | Belongs to Life > My Meds and Schedules > Meds rather than Signals: a `supply_count` on `treatments`, decremented by marked doses, and a dated reminder kind `refill` in `lib/reminderSources.ts` | JS only | None | Small to Medium |
| Cycle tracking | See Clue below | | | |

### 2.8 Clue (menstrual cycle tracking)

**What it is.** A science-led period and cycle tracker based in Berlin, run under EU data law. iPhone and Android. Tracks bleeding, pain, mood, energy, sleep, digestion, skin, discharge and many more tags per day, predicts periods and PMS, and has modes for perimenopause, pregnancy and birth control. Clue Connect lets a partner see predictions.

**Pricing** (checked 2026-09-25, https://support.helloclue.com/hc/en-us/articles/115005215266-How-much-does-Clue-Plus-cost and https://thevibecheck.app/blog/relationship-advice/clue-subscription-price-guide): free core tracking; Clue Plus $9.99/month or $39.99/year in the US; UK £24.99/year; price set by app store region. No lifetime. Partner sharing through Clue Connect, no family billing.

**Why it is here.** Cycle tracking cross-referenced in Pattern Finder is open item 25 in CLAUDE.md. Many of the 19 conditions change across the cycle (migraine, IBS, lupus, rheumatoid arthritis, thyroid symptoms, endometriosis-related pain), and Health Connect flow days are already imported (`lib/healthConnect.ts`, key `cycle`) but nothing reads them.

**What it does well that Inside Story does not yet do**
1. **Cycle day on every day of the record**, so any symptom can be seen by cycle phase.
2. **Predictions** of the next period and PMS days.
3. **Perimenopause mode**, a large and under-served group that overlaps heavily with autoimmune onset in women.
4. **Partner view** of the predictions.

**What Inside Story already does better**
- Clue's symptom list is cycle-shaped; Inside Story ties symptoms to foods, meds, labs and therapies.
- No account needed and no server; Clue holds data in the cloud (well protected under EU law, but still a server).

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Log period days by hand (flow level, spotting), not only through Health Connect | New Signals lens "Cycle" in `app/(tabs)/log.tsx`; table `cycle_days` (date, flow, source hand/device) on the `garden_readings` source precedent so imported and hand entries share one table; iPhone users have no Health Connect so the hand route is the only route there | JS only | Highly sensitive in some US states; local-first is a strength here and worth saying in-product. Must be kept out of any peer sharing unless named in `lib/peerRelationships.ts` | Small to Medium |
| Cycle phase shown beside flares in Pattern Finder | `lib/patternContext.ts` lists cycle day or phase next to the flares, the same way it lists sleep and treatment changes, never as the cause | JS only | None | Small |
| A Trends lens "Cycle": symptoms by cycle day | A builder in `lib/trendsMore.ts` handing a `ReadingView` to `components/ReadingBandsView.tsx`, covered by `scripts/test_output_lenses.js` | JS only | None | Small to Medium |
| Period prediction | Simple average cycle length from the person's own history; must say it is an average of their past cycles, not a medical prediction, and never be used for contraception | JS only | None | Small |
| Perimenopause framing | Tags (hot flushes, night sweats) added to `lib/checkinTags.ts`, and a Health Literacy entry | JS only | None | Small |

### 2.9 Welltory (heart rate variability, stress and energy)

**What it is.** An app that turns heart rate variability (from the phone camera or a wearable) into daily Stress, Energy and Health scores, with an automatic lifestyle diary and reports on how sleep, activity and habits line up with those scores. iPhone and Android, connects with 1,000+ devices and apps through Apple Health, Health Connect, Garmin, Oura and others.

**Pricing** (checked 2026-09-25, https://welltory.com/plans/ and https://aelivra.co/explore/compare/welltory-review): free with 3 days of Premium; the free tier deletes data older than 30 days. Premium about $15/month, or $99/year (about $8.25/month), or a lifetime purchase of about $300. No family plan found. Store prices vary by region.

**What it does well that Inside Story does not yet do**
1. **Turns wearable numbers into a daily reading** a person can glance at. Inside Story imports HRV and resting heart rate and deliberately does not interpret them ("kept, not interpreted").
2. **Automatic diary**: sleep, steps and workouts filled in without the person lifting a finger, so the record has no gaps on busy days.
3. **Habit analytics**: "on days after you slept under 6 hours your stress score was higher", across any habit.

**What Inside Story already does better**
- Welltory's scores are proprietary composites whose meaning is not published; Inside Story's rule against scores standing in for a clinician (Phase A rules) is the more honest position.
- Food, symptoms, meds and conditions, which Welltory barely touches.
- Keeps full history for free users of the tiers that include it; Welltory deletes free history after 30 days.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Show imported resting heart rate, HRV and skin temperature against the person's own usual range | Trends band using `lib/yourUsual.ts` (already used for weight, steps, sleep and labs). No composite score, no "you are stressed" | JS only | None | Small |
| Automatic filling of the day from Health Connect (sleep, steps, workouts) so Signals shows them without typing | Already imported by `lib/healthSync.ts`; surface them on the Home check-in and the day timeline (`app/timeline.tsx`) | JS only | None | Small |
| Habit analytics against symptoms | Same work as the "any factor against symptoms" row under Bearable | JS only | None | Medium |
| A composite "readiness" score | Would break the Phase A rule that a score never stands in for a clinician and would be unvalidated. Not recommended | | | Skip |

### 2.10 Oura (smart ring with tags and early-strain alerts)

**What it is.** A smart ring plus app measuring sleep, heart rate, HRV, skin temperature, respiratory rate and activity. Relevant to Signals for three features: **Tags** (the person tags a day or a moment, such as "alcohol", "sick", "period", "late meal", and the app shows how sleep and readiness differed), **Symptom Radar** (flags when overnight temperature, breathing rate and heart rate drift from the person's own baseline, an early sign of illness), and **cycle insights** from temperature. iPhone and Android.

**Pricing** (checked 2026-09-25, https://support.ouraring.com/hc/en-us/articles/4409086524819-Oura-Membership and https://www.bettervitals.com/learn/oura-ring-price-2026): ring from $349 (Silver or Black) to $499 (Gold or Ceramic), often discounted; membership $5.99/month or $69.99/year (same figures in euros in the EU), required for most features. No lifetime membership. No family plan for membership.

**What it does well that Inside Story does not yet do**
1. **Baseline-drift notice**: "your temperature and resting heart rate have been above your usual for two nights." A person with an autoimmune condition often feels a flare coming days ahead; this gives it a number.
2. **Tag effect on the body's measured data**: how nights after a tagged day differed from untagged nights.
3. **Zero-effort data**: nothing to log for the body metrics.

**What Inside Story already does better**
- Inside Story is free of hardware; it reads whatever watch or ring the person already owns through Health Connect (Oura writes to Health Connect).
- Symptoms, food, meds and conditions are first-class; Oura's tags are a side feature.
- No subscription needed to see one's own data.

**Gaps and what closing them would take**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| A quiet "outside your usual range for N nights" line for resting heart rate, HRV, skin temperature and breathing rate | Health Connect already imports all but respiratory rate; add `RespiratoryRate` to the record list in `lib/healthConnect.ts` (a new permission: JS config, but a new Health Connect permission in `app.json` means one rebuild). Build the line with `lib/yourUsual.ts`; wording must describe the reading and never predict a flare or illness (`scripts/audit_clinical_claims.js` applies) | JS for the existing metrics; rebuild only if respiratory rate is added | None | Small (existing metrics), Medium with the new permission |
| Flare and check-in tags compared with the next night's measured sleep and heart rate | Trends band pairing `wellbeing_checkins` tags with the next night's Health Connect rows, with counts and "your usual" | JS only | None | Small to Medium |

## 3. Gaps that cut across several competitors

Three gaps showed up in nearly every app and are not tied to one competitor:

| Gap | Seen in | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|---|
| **No Apple Health import on iPhone.** Health Connect is Android only, so an iPhone user gets no sleep, steps, heart rate or cycle data at all | Bearable, CareClinic, Guava, Welltory, Oura | A HealthKit module (`react-native-health` or `@kingstinct/react-native-healthkit`) behind the same interface as `lib/healthConnect.ts`, so `lib/healthSync.ts` and every Trends reader stay unchanged; iOS entitlement in `app.json` | Native, one EAS rebuild (iPhone build only) | None, on-device | Medium to Large |
| **No quick way in without opening the app**: no home-screen widget, no action button on a notification ("Log a flare", "How are you?") | Bearable, Visible, Clue, Welltory | Notification actions first: expo-notifications (already built in) supports category buttons, so a daily check-in reminder can carry one-tap answers. A home-screen widget needs a native widget module | Notification actions: JS, though iOS categories are worth testing on a build; widget: native rebuild | None | Actions Small to Medium; widget Large |
| **Symptom photos** (a rash, swelling, a stool, a skin patch over time) | Guava, Cara Care, Bearable (attachments) | `expo-image-picker` is already in `package.json`, so a photo button on the flare and reaction forms in `app/(tabs)/log.tsx`, stored under the app's document folder with a `checkin_photos` table; kept out of anything that travels between people unless named in `lib/peerRelationships.ts`; the encrypted sync snapshot size must be checked, since photos would bloat it | JS only | Photos are health data; keep them inside the encrypted snapshot or out of sync altogether | Small to Medium |

## 4. Ranked recommendations (most value for the effort first)

1. **Daily mood, energy and stress scales plus "none today" zeros on the Home check-in** (Bearable, Flaredown, CareClinic). Three columns or one small table and a form change, JS only, Small. It gives Pattern Finder the good days it currently cannot see and makes Signals a daily habit rather than only a flare log.
2. **Check-in reminders, with one-tap answers on the notification** (Bearable, Visible). New reminder kind in `lib/reminderSources.ts`; JS, Small. Speaks straight to CLAUDE.md's biggest named risk, logging discipline.
3. **Bowel movement lens with the Bristol scale** (Cara Care, mySymptoms, Bearable). JS, Medium. IBS, IBD and celiac are three of the 19 conditions and have no place for their main signal today.
4. **Cycle lens, and cycle phase beside flares in Pattern Finder** (Clue, Oura). Closes open item 25; flow data already arrives from Health Connect. JS, Small to Medium.
5. **The person's own symptom tags, with per-symptom severity** (Bearable, Flaredown, CareClinic). JS, Small to Medium. Follows the app's own open-lists rule, which the fixed 43-tag list currently breaks.
6. **Body map for where a symptom is** (Guava). `react-native-svg` is already present. JS, Medium. Strong for rheumatoid arthritis, psoriasis, lupus, fibromyalgia and migraine.
7. **Typical delay per food in Pattern Finder, and "foods on best days vs worst days"** (mySymptoms, Cara Care). JS, Small to Medium each, and both fit the honest-counting rules already written.
8. **Any factor against symptoms, and experiments beyond food** (Bearable, Welltory). Generalise `lib/patternBasis.ts` and `food_trials`. JS, Medium.
9. **Wearable readings against "your usual range", with a quiet drift line** (Oura, Welltory, Visible). Data already imported. JS, Small, provided the wording never predicts.
10. **Symptom photos** (Guava, Cara Care). JS, Small to Medium, with a sync-size check.
11. **Weather beside flares** (Flaredown). Already accepted scope in item 27; Medium, and a rebuild only if automatic location is wanted.
12. **Standard questionnaires (PHQ-9, GAD-7, a fatigue scale)** in the existing assessment screen (CareClinic). JS, Medium; check licensing per scale.
13. **Apple Health on iPhone** (nearly every app reviewed). Native, Medium to Large. It ranks lower only because of the rebuild; gather it into the next native rebuild with anything else rebuild-gated (widget, audio, location, respiratory rate permission).

Not recommended: community data pooling (Flaredown), composite readiness or stress scores (Welltory, Visible), live over-exertion buzzing and camera heart rate (Visible). Each needs a server, conflicts with the rule that a score never stands in for a clinician, or costs a large native build for little gain over the wearable data already imported.

Where Inside Story is already ahead of every app reviewed: the food experiment with before, without and back periods and its stated one-run limit; a Pattern Finder that names its denominators and compares against ordinary stretches; hands-on therapy sessions with Therapy Response; nocturia; labs with the lab's range and "your usual range"; and all of it with no account and no company server.

## 5. Pricing summary

US dollars, checked 2026-09-25. "Unconfirmed" means taken from third-party reviews because the official page did not show a price.

| App | Free tier | Monthly | Annual | Lifetime | Family or partner | Hardware |
|---|---|---|---|---|---|---|
| Bearable | Most tracking, weekly reports | $6.99 | $34.99 (often $18.99) | No | No | None |
| Visible | Morning check-in, Stability Score, export | about $19.99 (unconfirmed) | about $179.88 (unconfirmed) | No | No | Band about $80 to $100 |
| Cara Care | Limited diary | $8 to $19.99 (reports disagree; varies by country) | Not confirmed | No | No; insurer-paid in Germany | None |
| mySymptoms | Logging with ads | $9.99 | $49.99 ($39.99 for 6 months) | No | No | None |
| Flaredown | Everything | Free | Free | Free | n/a | None |
| CareClinic | 3 preset symptoms only | $9.99 (unconfirmed; one listing $5.99) | $59.99 (unconfirmed; one listing $39.99) | No | Not confirmed | None |
| Guava | Most features | Guava Plus, price not confirmed | Not confirmed | No | No | None |
| Clue | Core cycle tracking | $9.99 | $39.99 | No | Partner view (Clue Connect), no family billing | None |
| Welltory | 3 days of Premium, history deleted after 30 days | about $15 | $99 | about $300 | No | Optional wearable |
| Oura | Little without membership | $5.99 | $69.99 | No | No | Ring $349 to $499 |
| **Inside Story (planned)** | Free tier has **no Signals** at all | Individual $9.99 | Individual $89.99 | None planned | Partner $14.99/mo or $134.99/yr for two; Household seats $1.99/mo after 2 to 3 free; Guardian free with Individual or Partner; Caregiver $4.99/mo per person | None |

**What people in this category are used to paying.** Single-purpose symptom trackers sit between $35 and $60 a year (Bearable, mySymptoms, Clue, CareClinic), and several are free or nearly free for what a casual user needs (Flaredown, Bearable's free tier, Guava's free tier). Hardware-led products (Visible, Oura, Welltory Premium) charge $70 to $180 a year on top of a device. Inside Story's $89.99 a year is above the pure trackers and below the hardware products. It is defensible because it replaces several of these apps at once (food and nutrients, meds and interactions, symptoms, and a life organiser), but judged on Signals alone it would look expensive.

**One pricing point worth a decision.** Every symptom tracker reviewed lets people log symptoms for free, and reviewers treat a narrow free tier as a mark against an app (CareClinic's three-symptom limit is criticised by name in Bearable's comparison). Inside Story's Free tier includes no Signals at all. Letting Free users log flares and the daily check-in, while keeping Pattern Finder, experiments and reports paid, would match the market and would feed the logging habit that the paid analysis depends on. This is a monetization decision for the owner, not a build item.
