# Progress, made from the person's records (C17 design document)

Written 2026-09-26 for plan item C17. The owner asked for this before anything is built: "We need to determine what progress actually looks like and in how many ways the app can track it so we can lay out the way each tab screen receives additions and changes." The word is **progress**. Once this document is agreed, `lib/achievementCriteria.ts` is filled from section 5, and the drawing on each tab screen is built from section 4.

The earlier design conversation (2026-09-24) is in `docs/CLAUDE-ARCHIVE-2026-09-14.md` under "The reward design for the freed tab screens". Everything it settled still holds, and is repeated in section 1 so this document stands alone.

---

## 1. What progress is, and what it is not

**Progress is made out of the person's records. It is never awarded for them.** A piece of progress exists because a record exists: a food eaten, a crop grown, a routine run, a week in which something was written down. It is not a prize handed over for behaviour.

That one decision rules out the familiar shapes, each for a stated reason:

| Ruled out | Why |
|---|---|
| Streaks | A streak breaks, which is a loss state, and a broken streak is the documented reason people give up on health apps. |
| Levels, points, scores | A score of a person. The Keeping Up rules forbid scoring anybody. |
| Percentages and "N of M" | A finish line somebody is behind. |
| Praise ("well done", "keep it up") | `scripts/test_keeping_up.js` bans praise as squarely as blame. |
| Notifications about progress | The moment progress asks for attention it becomes the app begging for data. |
| Animation | The animated sky came out on 2026-08-17 for battery drain; this sits behind nine tabs. |
| Comparison with anybody else, leaderboards | Never. |
| Anything that shrinks through a gap | A gap is a gap, never a zero, and never a loss. |

What is left is the shape that clears every rule without trying: **progress accumulates, stays, and simply stops growing when nothing is recorded.**

### Five constraints to build against

1. **Static.** Composed when a tab comes into view, never animated, never redrawn on a timer.
2. **Findable whatever the background is.** In the owner's words, "the achievements continue to build themselves so if the user decides to look, they can." So the picture sits over the tab's background, and one page shows everything regardless of background (section 6).
3. **Elapsed time earns part of it.** Somebody who records lightly for a year should see a year of progress. Otherwise more logging quietly becomes a better person, which is scoring in a costume.
4. **Nothing regresses through a gap.** Not recording pauses growth and never reverses it.
5. **Day one does not look broken.** Every canvas starts as an early season, not an empty frame.

### Signals, the one tab with a trap

Signals must never grow with how sick somebody is. **Progress on Signals counts that a check-in happened, never what was in it.** No count of flares, symptoms or bad days appears anywhere in progress, in any form.

---

## 2. Settling the open question: distinct things, or repetitions?

The 2026-09-24 conversation left one question open: does progress count **different things** (how many different foods) or **repetitions** (how many times food was logged)?

**Answer proposed here: variety and time, and repetition counts only as time.**

- **Variety** counts each different thing once, the first time it is recorded. Eating a thirtieth different whole food adds a piece; eating the same apple for the hundredth time does not. Variety is the gut-healing goal itself (microbiome diversity follows dietary diversity), so on Food the picture of progress is a picture of the thing the app exists to help with.
- **Repetition becomes time, capped at one per week.** A week in which a routine was run, a check-in was made or a meal was logged counts once, however many records it holds. Fifty meals in one week and one meal in one week both mark that week. Nothing counts weeks **in a row**, so a missed week costs nothing.

Why this and not raw repetition: raw counts reward grinding, which turns the app into a chore to be fed, and would let a person who logs obsessively out-progress a person who logs honestly. Capping repetition at a week keeps the steady light user and the heavy user on the same footing, and it is the only form of repetition that satisfies constraint 3.

Why this and not variety alone: Life is the tab the second audience lives on, and its whole value is repetition (a routine run every morning, upkeep done every month). Variety alone would give that person almost nothing. Weeks kept is how their progress shows.

---

## 3. Every way the app can track progress

Five kinds. Every source in section 4 is one of them. All five are read from tables that already exist for other reasons, so nothing new has to be recorded to answer any of them.

| Kind | What it counts | Stays? | Example sentence |
|---|---|---|---|
| **1. Firsts** | A named thing that happened for the first time. | Yes, once it has happened, even if the record is later removed, because it did happen. | "Kept a medicine's label with the medicine." |
| **2. Variety** | Each different thing, once. | Mirrors the records. | "Whole foods you have eaten: kohlrabi, leeks, sauerkraut..." |
| **3. Weeks kept** | Weeks with at least one record of a kind, and how long since the first. | Mirrors the records. | "Check-ins in 23 weeks since March." |
| **4. Ready to answer** | What an analysis needs before it can say something, and how close the records are. | Moves forward as records arrive. | "Your usual range shows once there are 8 earlier readings. There are 5 so far." |
| **5. Kept alive** | A living thing the person looks after, recorded as a relationship over time. | Mirrors the records. | "The sourdough starter, fed since June." |

Notes on each:

- **Firsts** are the only badges allowed: a named fact that stays, never a rank. The 30 criteria already in `lib/achievementCriteria.ts` are written this way and are the precedent. They are stored in `achievement_criteria_progress` with the date first met, which is also what lets a first survive the removal of its record.
- **Variety, weeks kept and kept alive mirror the records.** If a person deletes a record, the piece it made goes with it, because progress is made of records and this one no longer exists. This is the person's act, not the app taking anything back, and it matches Your Story, where an item reopens when its record goes. Constraint 4 is about gaps, and a gap never removes anything.
- **Weeks kept uses the local-day rule.** Any timestamp stored as UTC ISO text goes through `dayOf` in `lib/keepingUpDb.ts` before it is assigned to a week, or an evening record west of Greenwich lands in the wrong week.
- **Ready to answer is the motivator.** Decoration buys a novelty bump and nothing more. What keeps somebody recording is knowing how close the app is to telling them something true about their body. Every sentence of this kind states what an analysis needs, never anything about the person. The machinery already exists (`MIN_USUAL_READINGS = 8` in `lib/yourUsual.ts`, `MIN_PATTERN_OCCURRENCES = 2` in `lib/patternBasis.ts`, `MIN_CYCLES_FOR_AVERAGE = 2` in `lib/cycle.ts`, `WEEKDAY_MIN_READINGS = 14` in `lib/periodAverages.ts`, `MIN_DAYS_FOR_MEASURED_CHANGE = 30` in `lib/financeAccounts.ts`, `MIN_MONTHS_FOR_ESTIMATE_CHECK = 3` in `lib/financeIncome.ts`, and others). Section 4 lists which one each tab reads. A ready-to-answer sentence **reads the same constant the analysis reads**, never a copy of the number, so the two can never disagree.
- **Kept alive** follows the living-with-nature rule: "What a person keeps alive is recorded as a relationship over time, not an output to maximise." A planting, a ferment, a compost pile, and later a hive, show for how long they have been looked after, never how much they produced.

---

## 4. Tab by tab: what each screen receives

Each tab gets: the **picture** drawn on its screen (made of its records, in the tab's colour from `constants/tabs.ts`), its **sources** by kind, and its **ready-to-answer** lines. No numbers and no words are ever drawn on the background itself (the no-text-on-background rule applies), so every sentence below lives on the progress page (section 6) or on the lens it is about.

### Food

- **Picture:** a pantry whose shelves fill with one jar per different whole food ever eaten, a jar's colour from the food's group. The strongest of the nine, because the picture is dietary variety.
- **Firsts:** each of the 12 builders used (desserts is missing from the registry today), a favourite saved, a product scanned, a recipe imported (`recipe_imports`), a recipe shared, a ferment started, a ferment harvested, a system recipe cooked.
- **Variety:** different whole foods eaten (from `meal_items` and each builder's ingredient table resolved to the reference database), different recipes cooked, different ferment strains (`fermentation_batch_strains`).
- **Weeks kept:** weeks with a meal logged.
- **Kept alive:** each ferment batch and starter, for how long it has been going (`fermentation_batches`).
- **Ready to answer:** none on Food itself; its records feed Insights and Trends.

### Garden

- **Picture:** plants from the plantings recorded, at the stage each has reached; fruit from harvests; a Past Area's plants drawn faintly, never erased. A compost heap that grows with compost events.
- **Firsts:** first area, first planting, first harvest (in the registry), first reading, first compost pile, first gift from another garden (`harvest_shares_received`), first harvest given away (`harvest_dispositions`).
- **Variety:** different crops grown (`garden_plantings`), different crops harvested.
- **Weeks kept:** weeks with any garden record.
- **Kept alive:** each area and each planting, for how long it has been tended; each compost pile, from first addition to finished.
- **Ready to answer:** Trends > Garden Yield and Growing Conditions need a full season in an area before a season can be set beside another. Stated as "A second season in the north bed lets this season be set beside the last."

### Life

- **Picture:** a room that furnishes itself: a shelf for each routine run, a hook for each upkeep job done, a calendar on the wall for counters that landed, a drawer for captures sorted. The metaphor restates the promise to the second audience: this is the outside place holding the details.
- **Firsts:** first medicine written down, first label kept (`medicine_labels`), emergency card filled, first emergency contact, first routine run, first upkeep job done, first Days Until counter reached, first kitchen place recorded, first grocery list finished, first family member added, first work check-in, first bill or income recorded, first budget, first savings goal, first goal contribution.
- **Variety:** different routines run, different upkeep jobs done, different kinds of movement.
- **Weeks kept:** weeks with a routine run (`routine_runs`), weeks with a Did I Do It mark (`done_check_marks`), weeks with upkeep done (`upkeep_doings`), weeks with a work check-in. **This is where weeks kept matters most**, since Life's value is repetition.
- **Kept alive:** none.
- **Ready to answer:** Finances (an account's measured change after 30 days of balances; an income estimate after 3 months); Work (Trends > Work after a few check-ins).

### Signals

- **Picture:** a night sky with one star per day a check-in was made, placed by the date. **Stars for check-ins, never for what was in them.** A long gap is dark sky, not a missing star.
- **Firsts:** first check-in, first symptom assessment (in the registry), first tracker named, first new food tried, first food experiment finished, first therapy session, first period day recorded.
- **Variety:** different new foods tried (`food_trials`), different trackers named. **Never different symptoms.**
- **Weeks kept:** weeks with a check-in, weeks with a tracker entry.
- **Kept alive:** none.
- **Ready to answer:** the most important tab for this kind.
  - Pattern Finder: flares need meals logged before them, and a candidate needs `MIN_PATTERN_OCCURRENCES` before it is shown. "Pattern Finder can say something about a food once it has turned up before at least 2 flares."
  - Cycle: "The average cycle shows once 2 cycles are recorded."
  - A food experiment: its before, without and back periods, each stated in days.
  - Blood pressure and trackers: "Your usual range shows once there are 8 earlier readings."

### Schedules

- **Picture:** a day arc, sunrise to night, where meals and doses actually placed leave a mark at their hour, building up across days into a pattern of the person's day.
- **Firsts:** first meal logged, first dose marked taken (both in the registry), first meal plan set up, first appointment kept, first hydration logged, first exercise planned.
- **Variety:** different recipes on the meal plan that were then eaten.
- **Weeks kept:** weeks with a dose marked, weeks with a meal placed.
- **Ready to answer:** Trends > Doses and Planned vs Eaten need a few weeks to show anything worth reading.

### Insights

- **Picture:** a lens that sharpens: facets added for each kind of analysis that now has enough to answer. It reads the ready-to-answer state of the whole app, not a count of anything.
- **Firsts:** first personal rule (in the registry), first healing stage declared (in the registry), first lab result (in the registry), first food added to Safe Foods, first rule made from a Pattern Finder candidate.
- **Variety:** different foods looked up is Tier 2 (it needs a usage table, section 7) and is left out for now.
- **Ready to answer:** nutrient targets need a whole day logged; Today's Advisories needs meals and meds on the same day.

### Trends

- **Picture:** a timeline that lengthens: the span of time the person's records cover, drawn as distance. Trends reads rather than records, so its progress is **how far back the story now reaches**, which is pure elapsed time and the fairest measure in the app.
- **Firsts:** none (nothing is recorded on Trends).
- **Weeks kept:** the span from the first record anywhere to today, and the weeks inside it with any record.
- **Ready to answer:** each of its lenses, listed with what it needs (for example "Weight: your usual range after 8 readings", "Weekday pattern after 14 readings", "Therapy Response: a before, during and after").

### Reports

- **Picture:** none. Reports makes documents on demand and holds no record of having done so; a picture here would need a usage table (section 7). Its progress lives on the progress page as ready-to-answer lines: which reports now have something in every section.
- **Ready to answer:** each report kind (`lib/reportKinds.ts`) lists the sections it carries, and says which are still empty.

### Home

- **Picture:** none. Home has no separate background (the shared canvas is mounted once in `app/(tabs)/_layout.tsx`), and Your Story already lives there.
- **Firsts** (the registry has none for Home today): first wellbeing check-in on the Home card, first capture note, first Today I Want To pick (`today_picks`), first Where Is It answer.
- **Weeks kept:** weeks with a capture note.

---

## 5. The registry after this document

`lib/achievementCriteria.ts` has 30 firsts today, lopsided: Food 17, Schedules 6, Insights 5, Signals 1, Garden 1, and none for Home, Life, Trends or Reports.

Filling it from section 4 adds roughly 40 firsts and brings every recording tab to at least five. Life gains the most (around 15), which closes the sharpest gap, since Life is the second audience's tab. Every new first stays **Tier 1**: an `existsQuery` against a table that already exists.

Variety, weeks kept, kept alive and ready to answer are **not** registry entries, since they are not yes-or-no facts. They go in a new pure module beside the registry (working name `lib/progress.ts`), with its reads in `lib/progressDb.ts` and a test script `scripts/test_progress.js`. That script runs every builder on sample rows and on nothing, and sweeps every sentence against the Keeping Up forbidden words plus these: streak, level, points, score, percent, "in a row", unlock, earned, reward, "well done", "great job", behind, "on track", failed, missed.

Two small corrections to the existing registry, found while writing this:

- The Dessert builder is missing from the builder firsts, so "Used every Food builder" can be met without it.
- `connection_paired` and `recipe_shared` are tagged to Food; pairing belongs with Life (the people in a person's life), and is moved there.

---

## 6. How a tab screen receives additions and changes

1. **On the tab's screen.** When a tab comes into view, its picture is composed once from its records and drawn over the background, in the tab's colour. No animation, no redraw while the tab is open, no text, no numbers. A new record shows the next time the tab comes into view, without announcement.
2. **Which backgrounds show it.** On by default over the built-in Photo and Generic backgrounds; off by default over a photo the person added, since they chose that photo to be looked at. Low Stimulation turns it off with everything else. A switch per tab in Profile beside the background choice.
3. **One page for all of it: Your Progress.** Reached from Profile and from Your Story, and from a long press on any tab's empty screen. One fold band per tab, in the tab's colour, each holding that tab's firsts (with the date each happened), variety (the names, not a count, with a count only where a list would be too long to read), weeks kept, kept alive, and ready to answer. This page is where every word of progress lives, which keeps the no-text-on-background rule intact.
4. **Since you last looked.** The top of Your Progress lists what was added since the page was last opened, as a plain list of things ("Kohlrabi joined the pantry", "First harvest from the north bed"). No praise, no exclamation, no count of how many.
5. **Ready to answer, where it is needed.** Each ready-to-answer line also appears on the lens it is about (Pattern Finder, a Trends lens, the cycle band), at the place its answer will appear, the way `YourStoryMissingLine` already does for empty states.
6. **Nothing is ever pushed.** No notification, no badge on a tab, no pop-up on opening the app.

---

## 7. Left for later (Tier 2)

Anything that needs a record of the app being used rather than a record of life: every lens opened, every report made, foods looked up, reading opened. It needs a local usage table and is Phase 7 of the 2026-08-21 plan. Nothing above depends on it.

---

## 8. What the owner decides before building

1. **Variety plus time, with repetition capped at one per week** (section 2). Proposed; it settles the open question from 2026-09-24.
2. **A deleted record takes its piece with it, but a first stays** (section 3). Proposed; it matches how Your Story already behaves.
3. **The pictures in section 4**: the pantry, the garden, the room, the night sky, the day arc, the sharpening lens and the lengthening timeline. Any can be swapped, since the sources underneath stay the same.
4. **Default on over the built-in backgrounds, off over a photo the person added** (section 6).

Once these are agreed, the build order is:

1. Fill the registry (section 5, one OTA).
2. `lib/progress.ts` and the Your Progress page (one OTA).
3. The ready-to-answer lines on their lenses (one OTA).
4. The tab pictures, one tab at a time, starting with Food and Life.
