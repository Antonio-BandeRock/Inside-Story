# Competitive review: the Insights tab

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Cronometer
- [x] ZOE
- [x] Levels
- [x] Fig
- [x] Yuka
- [x] Drugs.com (Medication Guide app)
- [x] Medisafe
- [x] Heali
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What the Insights tab does today

Insights is `app/(tabs)/insights.tsx` (about 4,900 lines) with 19 lenses behind the LensHub. Everything is computed on the phone from the bundled reference database (`assets/data/foods_reference.db`, about 22,000 foods from 7 national sources) and the person's own records. Nothing is sent to a server except a barcode number, which goes to Open Food Facts then USDA (`lib/barcodeLookup.ts`, used by Food and Grocery, not by Insights directly).

**Nutrition analysis**
- **Nutrients**: today's (or one meal's, one side's, one item's) intake against daily targets, with a drill-down from Whole Day to Meal to Side to Food. Each row splits what came from food and what came from supplements, and the supplement half respects each supplement's start and end dates (`lib/supplementWindow.ts`). Adjustable personal targets for protein, fiber and sodium.
- **Condition Scores**: one section per condition in Profile, each using that condition's scoring dimensions (`sub_criteria`, `food_scores`, `sub_criterion_condition_relevance`). The "6 Dimensions" name appears only for Hashimoto's.
- **Cooking & Prep** and **Cooking Impact**: cited effects of preparation on what a food delivers (raw vs cooked cruciferous, soaked legumes) and how much of a nutrient survives each cooking method, with mechanism-based estimates labelled as such.
- **Hydration**: total water from food and drink against a target.
- **Energy & Portions**: Mifflin-St Jeor calories times activity, protein by body weight.

**Finding foods**
- **Food Lookup**: category, type, food, full nutrient panel per 100 g, plus a "For You" card scored against the person's conditions, allergies and diet preference.
- **Nutrient Ranking**: pick a nutrient, see foods ranked richest first, with a serving-size option.
- **Safe Foods**: foods with no flagged concern across every tracked condition at once, minus allergy and diet conflicts.
- **Healing Stage**: foods matching the staged healing guide for the six staged conditions (Hashimoto's, IBS, Celiac, IBD, CKD, Gout), advisory and reordering only, never hiding anything.

**Safety and timing**
- **Today's Advisories**: the cited alcohol, coffee, fruit juice (and raw meat) advisories checked across the whole day.
- **My Meds & Interactions**: a read-only view of Life > My Meds plus every triggered interaction warning from `lib/interactionRules.ts`: a curated, cited set of food, supplement and prescription timing rules (levothyroxine with calcium or iron, mineral competition, fat-soluble vitamins, biotin and thyroid assays, plus about 17 reference-only rules for Graves', psoriasis, gout, CVD and others). Each warning says whether it was checked against dose times ("confirmed") or only against the fact that both are taken ("unverified"), and has a "why" mechanism note.
- **Personal rule builder**: the person's own rules or their doctor's instructions, linked to a food or a treatment, labelled separately from the cited rules. Pattern Finder on Trends can turn a candidate into a rule (1.0.50.4).
- **Labs**: most recent result per test, with the person's own lab reference range.

**Daily reading lenses (1.0.52.7, `lib/insightsMore.ts`)**: Your Day, Signals Today, Before Your Appointment, Money This Month, What the Kitchen Holds, From the Garden. These read other tabs' records and never write.

**Planned but not built (from CLAUDE.md)**: condition-aware contextual reminders that shift a dose window after a calcium-rich meal (partly present as dose-meal timing on Schedules); a "For You" card inside the Food builders' embedded lookups; Today's Advisories audited against the interaction rules; automatic food recognition from photos (deliberately not built, needs an off-device model); the external data program (recalls, supplement and OTC barcodes, through a Cloudflare Worker); a weekly check-in retuning targets (Meal Engine item 23); menstrual cycle cross-reference (item 25); "allergen-aware, not allergy-safe" wording (item 26).

**Integrations present**: Android Health Connect reads steps, weight, sleep, heart rate, blood pressure, blood glucose, exercise, nutrition and hydration (`lib/healthConnect.ts`). Glucose is read but no Insights lens builds on it.

**What Insights does not have at all**: a full drug-to-drug interaction database, any continuous glucose monitor view, any AI or chat explanation, a packaged-product score (additives, processing level) inside Insights, a dietitian or human coach, a cloud account.

## 2. Competitors

### 2.1 Cronometer

**What it is.** The best-known micronutrient tracker (Android, iPhone, web). Built on curated lab databases (NCCDB, USDA) rather than crowd entries, which is why dietitians recommend it.

**Pricing** (checked 2026-09-25; Cronometer's own pricing page returned 404, so figures are from two 2026 reviews that agree):
- Basic: free, with ads, up to 84 nutrients, barcode scanner, 7-day reports.
- Gold: $10.99/month or $59.99/year ($4.99/month billed yearly).
- Pro (for clinicians with clients): about $39.99/month.
- No lifetime plan, no family plan.
- Sources: https://nutriscan.app/blog/posts/cronometer-pricing-2026-basic-vs-gold-vs-pro-b28e621201 , https://ai-health-apps.com/reviews/cronometer-review/ , https://support.cronometer.com/hc/en-us/articles/44190048649364-Dexcom

**What it does well that Inside Story does not yet do**
1. **Nutrient Oracle inside the diary.** When a nutrient is short today, it suggests foods that close that gap. Inside Story has Nutrient Ranking, but it is a separate lens you have to think to open; the Nutrients table does not say "you are 40% short on selenium, these three foods you already eat would close it."
2. **Calcium Absorption Score.** Estimates how much of the day's calcium the body can use, discounting for phytate and oxalate in the same meals. Inside Story already holds oxalate data and oxalate/calcium pairing rules, but the Nutrients row reports calcium as a plain total.
3. **Macro Scheduler.** Different targets on different days (training days, fasting days).
4. **Custom Charts**: any nutrient charted against any biometric (glucose, weight, a symptom). Inside Story's Pattern Finder is stronger on symptoms but there is no free-form "chart X against Y."
5. **CGM import (Dexcom)** with a glucose line drawn under the meals.
6. **AI photo and voice logging** (Gold).
7. **Imports from Apple Health, Garmin, Fitbit, Oura, and more**; Inside Story reads Android Health Connect only.

**What Inside Story already does better**
- Food versus supplement split on every nutrient, with each supplement counted only across its own start and end dates. Cronometer lumps supplements into the diary total.
- Condition scoring for 19 conditions, Safe Foods across several conditions at once, and Healing Stage guidance. Cronometer has no condition layer.
- Cooking Impact and Cooking & Prep (how much of a nutrient survives each cooking method). Cronometer does not model cooking losses beyond picking a "cooked" database row.
- Cited food, supplement and prescription timing rules with a "why." Cronometer does not check interactions.
- Local-first: no account, no server copy of the diary.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "Close this gap" suggestions under a short nutrient row | Nutrients lens in `app/(tabs)/insights.tsx`; reuse the Nutrient Ranking query in `lib/db.ts`, filtered through the Safe Foods scoring so it never suggests a food flagged for the person's conditions or allergies; prefer foods already in their meal history | JS, over the air | None | Small to Medium |
| Calcium (and iron, zinc) absorption estimate | New pure module (for example `lib/absorptionEstimate.ts`) reading oxalate and phytate columns already in `foods_reference.db`; shown as a second figure on the calcium row, labelled as an estimate with its evidence tier | JS | None | Medium (needs cited absorption coefficients; must be labelled an estimate) |
| Different targets by weekday | Personal nutrient targets table (the 1.0.x adjustable targets for protein, fiber, sodium) gains a weekday column; Nutrients reads the target for that day | JS plus a small schema addition | None | Small |
| Chart any nutrient against any reading | A Trends lens more than an Insights one; `lib/trendsMore.ts` builder over existing daily nutrient totals and Health Connect readings. Must keep the "tends to follow, never causes" wording | JS | None | Medium |
| Glucose under meals | See Levels below | | | |
| Photo logging | Deliberately not built (needs an off-device vision model). If ever built: opt-in, stated boundary, image sent to a model and discarded | JS plus a server or paid API | Conflicts with no-server stance unless opt-in | Large |

### 2.2 ZOE

**What it is.** A UK/US personalised-nutrition app from the team behind the PREDICT studies (Tim Spector). Relaunched in September 2025 as a cheaper app-first product: a food scanner and food scores, a "Daily 30" plant-variety goal, a Processed Food Risk Scale, and an optional at-home gut microbiome stool test that personalises the scores. Android and iPhone.

**Pricing** (checked 2026-09-25; varies by country and ZOE runs frequent promotions):
- Free app: food photo and barcode scoring, basic scores.
- ZOE Plus (US): $15.99/month or $99.99/year.
- Gut test kit (US): about $399 list, often $359 to $379 on promotion. UK kit about £149 after the 2025 relaunch; UK membership around £34/month with the test bundled.
- No lifetime or family plan found.
- Sources: https://healthrx.com/brands-zoe/pricing-analysis , https://zoe.com/en-us/app , https://home-cooks.co.uk/pages/review-zoe

**What it does well that Inside Story does not yet do**
1. **One simple 0 to 100 food score** anyone understands at a glance, on a photo or a barcode, with "swap this for that" suggestions. Inside Story's condition scores are richer but spread across dimensions and conditions.
2. **Plant diversity count ("Daily 30", 30 different plants a week)**, which directly serves gut and microbiome healing. Inside Story states gut healing as an explicit goal, and Trends > What You Eat counts different foods, but nothing counts distinct plants per week or shows it on Insights.
3. **Processed Food Risk Scale** for packaged products (additives, emulsifiers, processing).
4. **Microbiome test** that feeds back into personal food scores.
5. Very polished teaching content (podcast, short explainers) wrapped around the scores.

**What Inside Story already does better**
- Scores for 19 named conditions and several at once; ZOE scores for general metabolic and gut health only.
- Nutrient targets with food versus supplement split; ZOE deliberately avoids counting nutrients.
- Medication and supplement timing rules; ZOE has none.
- Honest evidence tiers. ZOE's personalisation claims rest largely on its own company-run studies.
- Local-first; ZOE holds stool test results and diaries on its servers.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Weekly distinct-plant count | Pure function in `lib/eatingVariety.ts` (it already keys distinct foods), using reference categories to decide what is a plant (vegetables, fruit, legumes, whole grains, nuts, seeds, herbs, spices); a band on Insights > Nutrients or Your Day, and a line on Trends > What You Eat. Must say "counted" not "good" (forbidden-words sweep) and draw an unlogged week as a gap | JS | None | Small |
| One summary score per food for the person | Food Lookup "For You" card: a single headline derived from the existing condition scores (worst flag wins, with the detail one tap away). Risk: a single number hides evidence tiers, so the headline should be a word ("fits all your conditions", "one caution") rather than a number | JS | None | Small to Medium |
| Processing level for packaged items | Ingredient-word flags already exist (`lib/scannedProductFlags.ts` matches a scanned label against the cited Food Additives entries and per-condition concerns). Missing: a processing level. `lib/barcodeLookup.ts` already receives Open Food Facts' record, which carries a NOVA group; store it on the scanned product and show it in `components/FoodProductDetailView.tsx` and on Food Lookup for `MyProcessedFoods` rows | JS | Barcode already leaves the phone; no new data sent | Small to Medium |
| Microbiome test integration | Out of scope for a local-first app without a lab partner; at most, let a person type in results from a test they bought as a lab record | JS | Keeping it as a typed-in record avoids any server | Medium, low priority |

### 2.3 Levels

**What it is.** A metabolic-health app built around a continuous glucose monitor (CGM, now the over-the-counter Dexcom Stelo). It draws glucose under each logged meal, scores meals by the glucose rise they caused, and in 2025 to 2026 added AI photo logging, uploaded bloodwork with AI summaries, and "adaptive programs." US only for sensors. Android and iPhone.

**Pricing** (checked 2026-09-25 on Levels' own support page):
- Membership: $15/month or $80/year (app, AI food logging, AI insights, bloodwork uploads).
- Sensors extra: Stelo two-pack $99 one-time, or $89 per shipment on subscription (about a month of wear).
- Lab panels $99 (28+ markers) or $399 (100+ markers); a nutritionist session $250.
- Legacy Core $399/year and Complete $1,329/year are being phased out. No free tier found beyond the app store listing, no family plan.
- Source: https://support.levels.com/article/720-levels-pricing-and-plans ; comparison https://healthrx.com/brands-levels/pricing-analysis

**What it does well that Inside Story does not yet do**
1. **Glucose drawn under each meal**, with a per-meal response ("this breakfast raised you 45 mg/dL and took 2 hours to settle"). Inside Story reads blood glucose from Health Connect (`lib/healthConnect.ts`, key `glucose`) but no lens uses it.
2. **Meal-level experiments**: eat the same meal two ways (with a walk after, with protein first) and compare the curves.
3. **Upload a lab PDF and get the values pulled out.** Inside Story's Labs lens is typed in by hand.
4. **AI plain-language explanation** of what a reading means for you.

**What Inside Story already does better**
- Covers the whole person and 19 conditions rather than one number. For most of the tracked conditions (thyroid, IBD, psoriasis, gout) glucose is only a side signal.
- Does not need a $90+ monthly sensor habit to be useful.
- Never claims a cause from one person's data; Levels' meal scores read as verdicts.
- Leave-it-out-then-bring-it-back experiments already exist (`lib/foodExperiment.ts`) for symptoms; the same mechanism could compare glucose.
- Local-first; Levels stores every reading on its servers.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Glucose around each meal | Health Connect already reads `BloodGlucose` (native module already in the build, so no rebuild). New pure module (for example `lib/mealGlucose.ts`) that takes readings in a window around each meal time from `getDayMealAndDoseTimeline` and reports peak rise and time back to the pre-meal level; a band on Insights > Signals Today (which already sets readings on the meal clock) and a Trends lens for the history. Words: "rose by", never "spiked because of" | JS only | Readings stay on the phone | Medium |
| Glucose as a measure in food experiments | Add `glucose` as a `measure` option in `lib/foodExperiment.ts` and the `food_trials` table | JS plus a column value | None | Small once the above exists |
| Lab report import | Parse a PDF or a photo of a lab report into `lab_results`. Photo text reading already exists (`lib/ocr.ts`); matching test names to the app's lab test codes is the work. Must show every extracted value for confirmation before saving | JS only: `lib/ocr.ts` already uses on-device ML Kit (`rn-mlkit-ocr`), so no rebuild | On-device keeps it private | Medium to Large |
| iPhone glucose | HealthKit is not wired; needs a native module and an EAS rebuild | Native | None | Medium, bundle with other rebuild-gated work |

### 2.4 Fig

**What it is.** A food scanner and grocery search app for people with restrictions (celiac, low FODMAP, low histamine, alpha-gal, allergies and 2,800+ combinations). You set up a "Fig" profile, then scan or search a product and it says whether it fits, ingredient by ingredient, including ingredients that are uncertain ("may be derived from wheat"). Its ingredient database is reviewed by dietitians. Also restaurant guides and recipes. Android and iPhone.

**Pricing** (checked 2026-09-25; from the App Store in-app purchase list and third-party summaries, not from a Fig pricing page, which does not publish one):
- Free: grocery search and a few scans a month.
- Fig+: $5.99/month or $59.99/year; a $34.99 option is also listed (likely a shorter term or discounted year).
- Family: "Multiple Figs" (profiles for each household member) is part of Fig+, not a separate plan.
- Sources: https://apps.apple.com/us/app/fig-food-scanner-discovery/id1564434726 , https://foodisgood.com/ , https://www.oliveapp.com/blogs/fig-app-reviews

**What it does well that Inside Story does not yet do**
1. **Ingredient-by-ingredient verdict for a restricted diet**, with a middle "uncertain" status for ingredients whose source is unknown (natural flavors, dextrose). Inside Story's `lib/scannedProductFlags.ts` flags named additives and condition-concern words, but does not walk every ingredient against a diet such as low FODMAP or low histamine, and has no "uncertain" class.
2. **Several people's restrictions checked at once** ("Multiple Figs"): scan once, see whether it works for you and your child.
3. **Grocery-store product search** by store (50+ US chains).
4. **Restaurant guides** for eating out.
5. Very fast, single-screen yes/no result.

**What Inside Story already does better**
- Whole foods and home cooking with full nutrient panels; Fig does not track nutrients at all.
- Condition scoring grounded in cited research rather than only diet rules; timing rules for medications.
- Safe Foods across several conditions, Healing Stage lists.
- Family members' conditions already exist (`family_members`, `lib/family.ts`) and join the Meal Plan's scope, which is the foundation for a multi-person check.
- Local profile; Fig keeps the profile on its servers.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Every ingredient checked against the person's diet and allergies, with an "uncertain" class | Extend `lib/scannedProductFlags.ts` with per-diet ingredient lists (low FODMAP, low histamine, gluten-free, AIP) and an uncertain list (natural flavors, "spices", dextrose, modified starch). Wording must follow item 26: "allergen-aware, not allergy-safe" | JS | None | Medium (the lists need citing) |
| Check a product for a family member too | Scan result in `components/ScanProductView.tsx` gains one line per family member whose include switch is on, reusing `lib/family.ts` conditions and the same flag function | JS | Family roster is local | Small |
| Food Lookup "for whom" switch | Food Lookup's For You card takes a person picker (me, or a family member), reusing Safe Foods scoring | JS | None | Small to Medium |
| Store and restaurant guides | Conflicts with "home cooking over commercial products"; not recommended | | | |

### 2.5 Yuka

**What it is.** A French product scanner with 80+ million users. Scan a food or cosmetic barcode and get a 0 to 100 score with a color, based on the Nutri-Score (60%), additives (30%) and organic status (10%). Each additive gets a risk level with the studies behind it, and poorly scored products come with better-scored alternatives. Independent: no ads, no paid placement. Android and iPhone.

**Pricing** (checked 2026-09-25):
- Free: unlimited scanning and scores.
- Premium: pay-what-you-want yearly, starting at $10/year (US), £10, €10, CA$25, AU$20; features are the same whatever you pay. Adds product search without scanning, offline mode, and diet alerts (vegan, gluten-free, lactose-free, palm oil, soy, sulfites, pork).
- No monthly, lifetime or family plan.
- Sources: https://help.yuka.io/l/en/article/hkzw2hkj5w-cost-membership , https://help.yuka.io/l/en/article/dop80j54bb-paid-version-features

**What it does well that Inside Story does not yet do**
1. **Alternatives.** A poor score comes with a list of similar products that score better. Inside Story flags but never offers a swap.
2. **Offline scanning** of a large product database. Inside Story's scan needs the network (Open Food Facts, then USDA).
3. **Additive risk levels, one per additive**, each with its sources, instantly on the scan screen. Inside Story has the cited additive content (Food Additives reading entries) and matches it on scan, which is comparable depth but less visible.
4. **Search a product by name** without having it in hand (Premium).
5. Brand trust built on independence and a pay-what-you-want model.

**What Inside Story already does better**
- Home cooking and whole foods; Yuka is only about packaged products.
- Per-condition relevance: the same additive can matter for one condition and not another. Yuka scores everyone identically.
- Nutrient targets, supplements, timing rules, stages: Yuka has none of them.
- Evidence tiers shown honestly; Yuka's additive ratings have been criticised (and litigated in France) for overstating risk.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "Closer to whole food" alternatives after a scan | Given the home-cooking rule, the better alternative is usually a recipe or a whole food, not another product: from `components/ScanProductView.tsx`, offer the person's saved recipes or reference foods in the same category that score clean for their conditions (Safe Foods scoring) | JS | None | Medium |
| Offline scanning | Would need an on-device product table (Open Food Facts is tens of GB; a country subset is still large). Better fit: external data program item 27 (the Worker plus edge cache) for speed, and a local cache of every product already scanned (the `MyProcessedFoods` rows already act as one) | JS | Keyed lookup through the Worker, per the three-privacy-shapes rule | Large, low priority |
| Additive result more visible | Move the `scannedProductFlags` result to the top of the scan result as a one-line summary with a count by severity | JS | None | Small |

### 2.6 Drugs.com Medication Guide (with Medscape as the clinician-side comparison)

**What it is.** The most-used free consumer drug reference and interaction checker. The app and website cover about 24,000 prescription drugs, OTC products and natural products, and check drug-to-drug, drug-to-food, drug-to-alcohol and drug-to-supplement interactions, each graded Major, Moderate or Minor with a consumer and a professional explanation. Also a saved "My Med List" that re-checks automatically, pill identifier, FDA alerts and recalls, side effects, and dose reminders. Medscape (free, for clinicians) offers a similar checker with professional-level detail. Android, iPhone, web.

**Pricing** (checked 2026-09-25):
- Free with ads. An ad-free option exists as an in-app purchase, but the App Store page did not list its price and I could not confirm it; treat it as a small fee (a few dollars) rather than a subscription product.
- Medscape: free with registration.
- No family plan.
- Sources: https://apps.apple.com/us/app/drugs-com-medication-guide/id599471042 , https://www.drugs.com/drug_interactions.html , https://reference.medscape.com/drug-interactionchecker

**What it does well that Inside Story does not yet do**
1. **Breadth.** Any pair of 24,000 products, drug to drug included. Inside Story's `interaction_rules` is a hand-curated, cited set of tens of rules focused on food and supplement timing; two prescriptions against each other are not checked at all.
2. **Severity grading** on a recognised three-level scale (Major, Moderate, Minor). Inside Story has two levels (caution, note).
3. **FDA alerts and recalls** tied to the saved medication list.
4. **Pill identifier** by imprint, color and shape.
5. Two explanations per interaction, one for the patient and one for the clinician.

**What Inside Story already does better**
- **Timing, not just existence.** Drugs.com says levothyroxine and calcium interact; Inside Story checks the person's actual dose times against what they actually ate (`lib/doseMealTiming.ts`, `lib/interactionRules.ts` "confirmed" versus "unverified"), which no general checker does.
- Food-level detail: which foods in today's log carry enough calcium or iron to matter (`MEAL_AMOUNT_THAT_MATTERS`), rather than a generic "avoid dairy."
- Personal and doctor's rules, labelled separately.
- Nothing about the medication list leaves the phone; Drugs.com's saved list is tied to an account.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Drug-to-drug checking | Licensing a commercial database (First Databank, Medi-Span, DrugBank) is expensive and usually needs a server. The free route is the US National Library of Medicine's RxNorm for names; NLM retired its free interaction API in January 2024, so there is no free, citable drug-drug source to bundle. Honest option: a "Check this list on Drugs.com" button from My Meds & Interactions that opens the checker in the browser with nothing sent by the app itself, plus a line saying the app's rules cover food and supplement timing only | JS | Opening a browser page sends nothing from the app | Small (link) versus Large and costly (licensed data) |
| Three-level severity | Add a `major` value to `interaction_rules.severity` and the `InteractionWarning` type in `lib/interactionRules.ts`; regrade the existing rules against their citations | JS plus a change to the LIVE `foods_reference.db` (confirm with the owner before any edit) | None | Small to Medium |
| Recalls tied to My Meds and scanned foods | Already planned as external data program item 27 (recalls first); the Worker pre-fetches FDA recall feeds as a whole bundle, and the phone matches names locally so the med list never leaves the phone | JS plus the Worker | Matches the "download the whole bundle" privacy shape | Medium |
| Pill identifier | Needs a licensed image and imprint database; not a fit | | | Large, not recommended |
| Patient and clinician explanations | The `mechanism` field is already the "why"; a clinician line could ride in the Doctor report (`lib/reportKinds.ts`) rather than on screen | JS | None | Small |

Rule reminder for all of these: timing advice is allowed, but no sentence may tell the person to stop, start, skip or change a dose (`scripts/audit_clinical_claims.js` must stay at 0).

### 2.7 Medisafe

**What it is.** The most-downloaded medication reminder app. It schedules doses, asks you to mark each one taken or skipped, alerts a "Medfriend" (family member or caregiver) when a dose is missed, keeps refill counts, and checks the saved medication list for drug interactions. Much of it overlaps Schedules > Meds and Life > My Meds; it is here for its interaction alerts and its caregiver loop. Android and iPhone.

**Pricing** (checked 2026-09-25, from 2026 comparison articles; Medisafe does not publish a pricing page):
- Free: capped at 2 medications since January 2026.
- Premium: $4.99/month or $39.99/year; interaction warnings, multi-profile family management and unlimited medications are Premium.
- No lifetime plan. Family is multiple profiles inside one Premium account.
- Sources: https://pillo.care/blog/medisafe-not-free-what-to-do , https://carezano.com/software/medisafe , https://medisafe.com/medisafe-launches-feature-to-alert-users-of-potentially-harmful-drug-interactions

**What it does well that Inside Story does not yet do**
1. **Interaction alert at the moment a medication is added**, graded by severity, before the person ever looks for it. Inside Story's My Meds & Interactions lens shows warnings when opened; adding a supplement already reports what food supplies, but a new interaction is not raised at the moment of adding.
2. **Medfriend**: a missed dose notifies someone else. Inside Story's person-to-person sync (`lib/peerRelationships.ts`) marks `meds` as `ready: false`, so nothing about medication crosses between people yet.
3. **Adherence history** as a percentage and a shareable report.
4. **Refill tracking** by pill count.

**What Inside Story already does better**
- Food-aware timing (a dose checked against the meals around it) rather than a clock alarm; Medisafe does not know what you ate.
- Supplements treated as nutrient sources, with the food versus supplement split.
- No account and no server copy of the medication list; Medisafe's model depends on its cloud and on pharma partnerships.
- The "never tell anyone to change a medication" rule is enforced by a check script.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Interaction check at the moment of adding | Life > My Meds save handler calls `evaluateInteractionRules` for the new treatment only and shows any new warning in the same sheet that already reports food supply | JS | None | Small |
| Caregiver or partner notified of a missed dose | Needs the `meds` area in `lib/peerRelationships.ts` made ready and a caregiver link, both open items; the notification itself would be a local notification on the other person's phone after a merge, so no content-carrying push | JS on top of existing sync | Must stay opt-in per relationship (allowlist) | Large |
| Adherence summary | A Trends or Reports item, not Insights; must avoid percentages and praise per the Keeping Up rules, so "taken on 24 of the 28 days a dose was due, 4 not marked" | JS | None | Small |

### 2.8 Heali

**What it is.** The closest direct competitor in concept: an AI nutrition app for people managing one or more medical conditions (it claims 200+ conditions and 80+ therapeutic diets, including autoimmune and gastrointestinal ones), with plans said to be reviewed by registered dietitians. Features: product barcode scan, a photo "menu scan" that rates each dish on a restaurant menu for you, recipe search across a million recipes, grocery ordering, and an AI chat coach. Android and iPhone. Small user base (78 App Store ratings, last update October 2025), so it is the concept rather than the market share that makes it worth watching.

**Pricing** (checked 2026-09-25 on the App Store listing):
- Free app with limits.
- Heali Plus: $15.00 (monthly) or $75.00 (yearly).
- No lifetime or family plan listed.
- Sources: https://apps.apple.com/us/app/heali-diet-nutrition/id1492658143 , https://techcrunch.com/2023/11/09/heali-app-personalized-nutrition-food-as-medicine , https://www.heali.com/

**What it does well that Inside Story does not yet do**
1. **Several conditions combined into one verdict** on any product, recipe or menu item, stated in one line. Inside Story does this for whole foods (Safe Foods, For You) but not for a combined verdict on a whole recipe from the web or a menu.
2. **Menu scan**: photograph a restaurant menu and each dish is rated for your conditions.
3. **Plain-language AI chat**: "can I eat miso with Hashimoto's and IBS?" answered in context.
4. **Recipe discovery at scale** filtered to your conditions.

**What Inside Story already does better**
- Evidence tiering on every claim; Heali's AI answers carry no visible evidence grade.
- Nutrient totals with the food versus supplement split, cooking losses, timing rules, healing stages, labs: Heali has none of these in depth.
- Personal pattern discovery (Pattern Finder, food experiments) rather than generic diet rules.
- No data collection for marketing; Heali's App Store privacy label lists contact data used for tracking.

**What it would take to close each gap**
| Gap | Where it goes | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Combined verdict for a whole recipe | Recipe condition data already exists (`scripts/compute_recipe_condition_data.js`, `lib/digest/recipes.ts`); expose the same computation for a person's own saved recipe on Food Lookup or in the builder's pre-save report, as one line across all the person's conditions | JS | None | Small to Medium |
| Menu scan | On-device OCR exists (`lib/ocr.ts`, ML Kit); matching free-text dish names to reference foods is weak without a language model. A limited version (find ingredient words in the menu text and run them through `scannedProductFlags`-style condition matching) is possible on-device | JS | On-device keeps it private | Medium for the limited version; Large with a model |
| AI chat | Needs an off-device language model, so an explicit opt-in with a stated boundary, as CLAUDE.md already requires for photo recognition. It would have to answer only from the app's cited reading corpus and show the evidence tier, or it breaks the evidence rule | JS plus a paid API or server | Conflicts with local-first unless opt-in and content-limited | Large |

## 3. Gap synthesis and ranked recommendations

Where Inside Story already leads on this tab: condition-aware scoring across 19 conditions at once, the food versus supplement split, dose timing checked against actual meals, cooking losses, healing stages, and honest evidence tiers, all without an account or a server. No app reviewed does more than two of those.

Where the market is ahead: telling the person what to eat next to close a gap, simple one-line verdicts, glucose under meals, drug-to-drug breadth, and AI help (photo logging, chat). The last one conflicts with the local-first stance and should stay opt-in if built at all.

Ranked by value for the effort, most first. All are JS only and ship over the air unless noted.

1. **"Close this gap" foods under each short nutrient row** (Cronometer's Nutrient Oracle). Nutrients lens plus the Nutrient Ranking query, filtered through Safe Foods scoring and preferring foods the person already eats. Serves the core purpose (food first, supplements for the gap) directly. Small to Medium.
2. **Interaction check at the moment a medication or supplement is added** (Medisafe). Call `evaluateInteractionRules` from the My Meds save path. Small.
3. **Weekly distinct-plant count** (ZOE's Daily 30). `lib/eatingVariety.ts` plus a band on Insights and Trends > What You Eat. Serves the stated gut-healing goal. Small.
4. **Glucose around meals from Health Connect** (Levels, Cronometer). Readings are already imported; new `lib/mealGlucose.ts`, a band on Signals Today, `glucose` as a food-experiment measure. No new sensor subscription needed for someone who already wears one. Medium.
5. **One-line combined verdict** on Food Lookup, a scanned product and a saved recipe, across every tracked condition, allergy and diet, and optionally for a family member too (Fig, Heali, ZOE). A word, not a number, with the detail one tap away. Small to Medium.
6. **Ingredient-by-ingredient diet check with an "uncertain" class** on scanned products (Fig), in `lib/scannedProductFlags.ts`, worded "allergen-aware, not allergy-safe." Medium.
7. **Calcium, iron and zinc absorption estimate** using the oxalate and phytate data already in the reference database (Cronometer's Calcium Absorption Score), labelled as an estimate with its tier. Medium. This is a natural extension of the oxalate/calcium pairing rules and a Rule Engine item, so run the eight-point checklist.
8. **Three-level severity and an honest "drug-to-drug is not covered" line with a link out** (Drugs.com). Severity change touches the LIVE `foods_reference.db`, so confirm with the owner first. Small to Medium.
9. **Lab report import by photo** using the on-device ML Kit OCR already in `lib/ocr.ts`, every value confirmed before saving (Levels). Medium to Large.
10. **Recalls matched against My Meds and scanned products**, already queued as external data item 27. Medium plus the $5/month Worker.

Not recommended for this tab: store and restaurant product guides (against the home-cooking rule), pill identifier (licensed data), microbiome test integration (needs a lab partner), and a general AI chat unless it is opt-in and answers only from the cited reading corpus with tiers shown.

## 4. Pricing summary

| App | Free tier | Monthly | Annual | Lifetime | Family |
|---|---|---|---|---|---|
| Cronometer | Yes, with ads, 84 nutrients | $10.99 | $59.99 | No | No (Pro for clinicians about $39.99/mo) |
| ZOE (US) | Yes, scanner and basic scores | $15.99 | $99.99 | No | No; gut test kit about $359 to $399 extra |
| Levels | No meaningful free tier | $15 | $80 | No | No; sensors about $89 to $99 a month extra |
| Fig | Yes, a few scans a month | $5.99 | $59.99 | No | Several profiles inside Fig+ |
| Yuka | Yes, unlimited scans | None | From $10 (pay what you want) | No | No |
| Drugs.com | Yes, with ads | Ad-free price not confirmed | Not confirmed | Not confirmed | No |
| Medisafe | Yes, 2 medications | $4.99 | $39.99 | No | Several profiles inside Premium |
| Heali | Yes, limited | $15.00 | $75.00 | No | No |
| **Inside Story (planned)** | Yes: Food Lookup without condition scoring | **$9.99** Individual | **$89.99** Individual | No | Partner $14.99/mo or $134.99/yr for two; Household seats $1.99/mo after 2 or 3 free; Guardian free with Individual; Caregiver $4.99/mo per person |

**What people in this category are used to paying.** Single-purpose tools sit low: a product scanner $10 to $60 a year, a medication reminder about $40 a year, an interaction checker free. Full nutrition trackers cluster at $60 to $100 a year (Cronometer $59.99, Heali $75, Levels $80 for the app alone, ZOE $99.99). Anything tied to a test or a sensor jumps to hundreds a year. Inside Story's $89.99 a year sits at the upper end of plain trackers, which is defensible because it replaces several of these apps at once (a tracker, a scanner, a medication reminder, a condition guide) and adds household and caregiver tiers none of them offer. Monthly $9.99 is under Cronometer's $10.99 and ZOE's $15.99. The risk is the free tier: Yuka, Cronometer and Drugs.com give their core away, and Inside Story's Free tier withholds condition scoring, which is its main differentiator, so a first-time visitor may not see why to pay. A small taste of condition scoring (for example one condition, or Food Lookup's For You card on a limited number of foods) would match what people expect from a free tier.

Sources for all pricing are listed in each app's section above.
