# Food Tab: Competitive Review

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Cronometer
- [x] MyFitnessPal
- [x] Fig
- [x] Yuka
- [x] Monash University FODMAP
- [x] Samsung Food
- [x] Paprika
- [x] AI photo logger (Cal AI / SnapCalorie)
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

---

## 1. What the Food tab does today

Source: `app/(tabs)/food.tsx` (the `FOOD_LENSES` list and `FOOD_LENS_COPY` text), the components it opens, and `lib/`.

**Twelve builders**, one per kind of dish: Meal, Sides, Salads & Bowls, Smoothies, Fermentation, Beverages, Snacks, Baked Goods, Soups, Sauces, Handhelds, Desserts (`components/*Builder.tsx`). Each picks ingredients from the bundled 22,000-food reference database by category, type, food and prep, with quantity and unit, and asks how it was cooked (cooking method changes retained nutrients). Several carry a rule of their own: raw goitrogen stacking across a whole meal (Meal, Salads, Smoothies), a Fermented, Simmered, Reduced or Chilled/Frozen cook step, an alcohol calculator, and a nudge when no fat or seasoning was logged. Before saving, a full depth report (`components/RecipeDepthReport.tsx`) shows nutrients and condition scores.

**Log or Schedule** (`findMeal`): one place to reach every logged, saved, scheduled or system meal, log it now or earlier, put it on the schedule, swap it for a planned meal, or tick dishes from several meals and open Meal Builder with them combined.

**Scan a Product** (`components/ScanProductView.tsx`, `lib/barcodeLookup.ts`): camera barcode scan (`expo-camera`), Open Food Facts first, USDA FoodData Central branded foods as fallback, never using Open Food Facts' estimated values. On-device OCR of an ingredients list or price tag (`lib/ocr.ts`, `rn-mlkit-ocr`, no photo leaves the phone). Flags what matters for the person's conditions, saves to My Food Products with a price history, offers Buy This and Log This as Eaten.

**My lists**: My Food Products (scanned items and prices), My Recipes (saved and favorite dishes grouped by builder), My Safe Foods (`my_safe_foods`, plus / question / minus per food, feeding Safe Foods on Insights and the meal plan generator), My Whole Foods (what the garden harvest has on hand, drawn down as it is cooked, with Money Not Spent).

**System Recipes** (`components/SystemRecipesView.tsx`, `lib/digest/recipes.ts`, roughly 500 recipes): full recipe, nutrients, and per-condition cautions computed by `scripts/compute_recipe_condition_data.js`. Build This Recipe opens the builder preloaded so it can be changed.

**Around the tab, feeding it or fed by it:** per-condition food scoring for 19 conditions over the reference database (Food Lookup on Insights, `components/FoodLookup.tsx`, D1 to D6 for Hashimoto's), healing-stage reordering for six staged conditions (`lib/foodStageReordering.ts`), allergy and diet-preference filtering (`user_food_allergies`), food trials (`food_trials`, leave-it-out-then-bring-it-back experiments in Signals), a fermentation tracker (`fermentations`, `fermentation_batches`, `fermentation_batch_strains`, `fermentation_harvests`), quick-log (Log Again on Home, log from a barcode, voice through `expo-speech-recognition`, photo of the meal via `lib/mealPhotos.ts` and `meal_photo_drafts`, with no automatic food recognition by design), a Kitchen inventory (`kitchen_items`), a grocery list, `.is` recipe sharing between people (`shared_recipes`), and a six-week meal plan generator in Schedules.

**Planned but not built (CLAUDE.md open next steps):** ingredient rotation for smoothies and salads (item 3), a home brew path for beer, wine and spirits (item 9), batch remake cadence for yogurt and other ferments with a "start your next batch" reminder (item 18), a corpus-wide audit for missing cooking water (item 17), a home for protein and drink powders (items 6, 7), and the "allergen-aware, not allergy-safe" wording (item 26).

**Things noticed while reading:** no recipe import from a web link or a cookbook photo was found anywhere in `lib/` or `components/`. The help text for eleven builders in `FOOD_LENS_COPY` still says "In progress" and "Saving as a reusable favorite isn't wired up yet", while My Recipes says saved and favorite dishes exist, so that help text reads as stale. Barcode scanning shows no processing score (NOVA group) or additive flag from the Open Food Facts record.

---

## 2. Competitors

Chosen for what each does best in 2026: Cronometer (nutrient depth), MyFitnessPal (database size and fast logging), Fig (allergy and diet filtering), Yuka (product scanning), Monash University FODMAP (condition-specific food guidance), Samsung Food (recipes, import and planning), Paprika (recipe keeping), and an AI photo logger (Cal AI or SnapCalorie).

### 2.1 Cronometer

**What it is.** The micronutrient tracker most dietitians point people to. iPhone, Android, web. Free Basic tier tracks 84 nutrients with 7-day reports and ads.

**Pricing** (checked 2026-09-25, https://cronometer.com/gold/index.html): Basic free; Gold $10.99 a month or $59.99 a year (about $5 a month). No lifetime or family plan found. Some reviews quote $49.99 a year, so the annual price may vary by store or promotion.

**What it does well that Inside Story does not yet do**

1. **Recipe import from a web link.** Paste a recipe URL and it builds the recipe with nutrients. Inside Story has no import path; every personal recipe goes through a builder by hand.
2. **Photo logging that suggests ingredients and portions** (AI). Inside Story takes a meal photo but deliberately does not recognise food.
3. **Custom charts of any nutrient against any biometric**, and "Oracle", which answers "which foods are richest in X for the fewest calories".
4. **Repeat items and a macro scheduler** (different targets on different days).
5. **Lab-verified database tagging**: every food shows its source and whether it was lab-analysed, which is part of why people trust it.
6. **Device integrations** (Apple Health, Garmin, Oura, Dexcom and others).

**What Inside Story already does better**

- Per-condition scoring of every food for 19 conditions; Cronometer knows nothing about any condition.
- Condition cautions on recipes, goitrogen stacking across a meal, healing-stage reordering, and food trials that test one food out and back in.
- Food and supplement kept apart per day (the food-first rule); Cronometer mixes them into one total.
- Cooking method changes retained nutrients; Cronometer uses the raw entry unless the person picks a cooked one.
- Nothing leaves the phone. Cronometer is a cloud account.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Recipe import from a link | New "Import a recipe" entry on My Recipes and Log or Schedule; a parser for the schema.org Recipe block most recipe sites publish, then a matcher from ingredient lines ("2 cups chopped kale") to reference foods, landing in the matching builder preloaded the way Build This Recipe already works (`SystemRecipesView.tsx` pattern). New `lib/recipeImport.ts`. | JS only (`fetch`), ships over the air | The phone fetches the page itself, so only the URL is seen by the recipe site. No conflict. | Large (the ingredient matcher is the hard part) |
| "Richest foods for this nutrient" search | Already close: Nutrient Ranking exists on Insights. Link it from each builder's ingredient picker ("show me high-iron options in this category"). | JS | None | Small |
| Nutrient against biometric charts | Trends lenses already read weight, sleep and labs; a band pairing a nutrient's daily food total with one reading, drawn with the existing gap rules. | JS | None | Medium |
| Show the source of every food's numbers | The reference DB already carries its national source; show it as a caption on `FoodLookup.tsx` rows and in builders' ingredient detail. | JS | None | Small |

### 2.2 MyFitnessPal

**What it is.** The largest calorie and macro tracker by user count. iPhone, Android, web. Owns the former Intent meal-planning app, which became the Premium+ Meal Planner.

**Pricing** (checked 2026-09-25, https://www.fitbudd.com/post/myfitnesspal-app-cost and https://nutriscan.app/blog/posts/myfitnesspal-pricing-2026-guide-2ff09c399a; the official blog returned 403): Free $0 with ads; Premium $19.99 a month or $79.99 a year; Premium+ $24.99 a month or $99.99 a year. No lifetime or family plan. The barcode scanner moved behind the paywall, which drew heavy complaints.

**What it does well that Inside Story does not yet do**

1. **Sheer database size**: about 14 million foods, mostly crowd-added branded and restaurant items, so almost anything eaten out can be found by name.
2. **Restaurant meals.** Inside Story has no restaurant path at all; a meal out has to be built from ingredients or skipped.
3. **Meal Scan** (photo recognition) and voice logging in one tap from the diary.
4. **Meal plan to grocery list to delivery** (Instacart sync, US only).
5. **Recipe import from a URL.**
6. **Social habit loop**: streaks, community, a friends' feed. Inside Story has ruled out streaks by design (CLAUDE.md item 29), so this is a gap on purpose.

**What Inside Story already does better**

- Condition scoring, condition cautions, food trials, stages: MyFitnessPal has none.
- A curated, sourced reference database of whole foods rather than a crowd list with many duplicate and wrong entries.
- Barcode scanning plus on-device OCR of the ingredients list at no charge in Inside Story's plans, versus paid-only here.
- Home cooking tools: twelve builders with cooking method, fermentation, garden harvest drawn down as it is cooked. MyFitnessPal treats a recipe as a list of lines.
- Privacy: MyFitnessPal had a 150-million-account breach in 2018 and runs on ads.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| A way to log a restaurant or takeaway meal | Log or Schedule gets "I ate out": name the place and dish, then either pick the closest home recipe as a stand-in (flagged as an estimate) or tick the main ingredients. Stored on `meals` with a new `source` of `restaurant` and an estimate flag, so Pattern Finder can still use it without pretending the nutrient totals are exact. | JS | None if no chain database is fetched. A chain menu database would be a keyed lookup through the planned Worker (item 27). | Medium without a chain database, Large with one |
| Grocery list to delivery | Life > Grocery List already exists. An "Open in store app" share of the list as plain text is Small; a live Instacart link needs a partner key and a server. | JS for the text share | A delivery API would send the list to a company; keep it an explicit share. | Small (share) |

### 2.3 Fig (Food Scanner & Guide)

**What it is.** A barcode scanner built around restrictions rather than calories: pick from over 2,800 diets, allergies and sensitivities (Low FODMAP, low histamine, alpha-gal, AIP and so on) and every product reads as fits or does not, with the offending ingredient named. iPhone and Android.

**Pricing** (checked 2026-09-25, https://apps.apple.com/us/app/fig-food-scanner-recipes/id1564434726): free with a scan limit; Fig+ listed in the US App Store at $5.99 to $7.49 a month and $34.99 to $69.99 a year (several price points, likely by introductory offer). Third-party reviews quote $10 a month or $50 a year. No lifetime plan found. Family use is covered inside Fig+ through "Multiple Figs" profiles.

**What it does well that Inside Story does not yet do**

1. **Ingredient-level verdicts on packaged food**, each with a plain reason ("contains inulin, high FODMAP"), from dietitian-reviewed ingredient ratings. Inside Story's scan flags condition concerns but builds on the nutrient panel and OCR text, without a curated ingredient-to-restriction map of that size.
2. **Several people's restrictions at once.** "Find food that works for everyone" across profiles, which matters to a household cooking one meal.
3. **Store and restaurant browsing**: lists of compliant products at over 100 grocery chains and restaurants, so a person can shop without scanning every box.
4. **Very wide restriction list**, including rare ones (alpha-gal, salicylates, histamine, sulfites), which is the everyday reality for many autoimmune patients.

**What Inside Story already does better**

- Whole-food cooking and nutrient depth; Fig is almost entirely packaged products.
- Personal evidence: food trials and My Safe Foods let a person's own results override the general rule. Fig only knows the published list.
- Condition scoring by nutrient property (oxalate, goitrogens, purines, iodine) rather than ingredient name only.
- Family members' conditions already join the meal plan's scope (`lib/partnerPlanning.ts`), which is Fig's "Multiple Figs" idea applied to cooking.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Ingredient-list verdict with a named reason on every scanned product | `ScanProductView.tsx` already OCRs the list; add an ingredient dictionary (additives, FODMAP ingredients like inulin and chicory root, histamine liberators, gluten grains, soy lecithin, carrageenan and so on) in a new `lib/ingredientFlags.ts` keyed to the 19 conditions and `user_food_allergies`, and show each hit with its reason. Rule Engine steps 1, 2 and 5 all apply. | JS | None: the list is read on the phone | Medium for the matcher, Large for a well-cited dictionary |
| Wider restriction list | `user_food_allergies` and diet preferences gain histamine, salicylate, sulfite, alpha-gal, nightshade and lectin options, each mapped to reference-DB properties where one exists and to the ingredient dictionary where not. Must use the "allergen-aware, not allergy-safe" wording (item 26). | JS | None | Medium |
| One verdict for the whole household | Show, on a scanned product or a recipe, which family members it suits, from `family_members` conditions. | JS | Household data stays on the phone | Small to Medium |

### 2.4 Yuka

**What it is.** The best-known "is this product good for me" scanner, French-born, with tens of millions of users in Europe and North America. Scans food and cosmetics, scores each 0 to 100 (nutrition quality, additives, organic), explains each additive's risk level with sources, and suggests a better-scoring alternative. iPhone and Android. Independent: no ads, no brand money.

**Pricing** (checked 2026-09-25, https://help.yuka.io/l/en/article/hkzw2hkj5w-cost-membership): free version scans without limit. Premium is annual only, a sliding "pay what you choose" rate starting at $10 a year (US), £10, €10, $25 CAD or $20 AUD; every price point gets the same features. No monthly, lifetime or family plan.

**What it does well that Inside Story does not yet do**

1. **A single, instantly readable verdict** (a coloured score and word) on every scanned product, with the reason broken down underneath. Inside Story's scan screen gives condition flags and nutrients, which is richer but slower to read in a supermarket aisle.
2. **Additive explanations**: every E-number or additive rated for risk with its research cited.
3. **"Better option" suggestions**: a similar product that scores higher.
4. **Offline scanning** (Premium) for stores with poor signal. Inside Story's scan needs a connection to Open Food Facts or USDA.

**What Inside Story already does better**

- Condition-aware judgment: Yuka's score is the same for everybody; Inside Story weighs a product against the person's own conditions, allergies and stage.
- Price history per product and Buy This onto the grocery list.
- Logging the product as eaten, so it feeds nutrient totals and Pattern Finder. Yuka is not a food log.
- The steer toward home cooking over packaged food, which Yuka does not attempt.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| One-glance verdict at the top of a scan | `ScanProductView.tsx`: a single line ("Worth a second look for 2 of your conditions: sodium, carrageenan") ahead of the detail, built from what the screen already computes. Must stay an evidence-tiered statement, not a health score standing in for a clinician (the Phase A rule). | JS | None | Small |
| Additives and processing level | Open Food Facts already returns `additives_tags` and `nova_group` in the same response `lib/barcodeLookup.ts` fetches. Read them, map additives to a cited table (new `lib/additives.ts`, drawing on the Food Additives reading category already on Health Literacy), and link each to its reading entry through `routeForDigestEntry`. | JS | None: same request as today | Medium |
| Scan without signal | Cache every scanned product in My Food Products already; for offline first-time scans, queue the barcode and look it up once back online. A full offline Open Food Facts copy is several GB and not realistic. | JS | None | Small (queue) |
| Better option | Suggest a home recipe from System Recipes that replaces the packaged item (for example a jarred sauce leads to a Sauces recipe). This fits the home-cooking rule better than suggesting another brand. | JS | None | Medium |

### 2.5 Monash University FODMAP diet

**What it is.** The research group that invented the low FODMAP diet publishes the reference app for IBS. Foods are lab-tested and rated green, amber or red per serving size, for each FODMAP type separately. A diary records food, symptoms, bowel habits and stress, with a guided three-step reintroduction. iPhone and Android.

**Pricing** (checked 2026-09-25, https://play.google.com/store/apps/details?id=com.monashuniversity.fodmap and https://www.monashfodmap.com/ibs-central/i-have-ibs/get-the-app/): one-time purchase, about $7.99 to $12.99 depending on store and region (around $9 on Google Play in the US), with free updates as foods are tested. No subscription, no family plan.

**What it does well that Inside Story does not yet do**

1. **Serving-size thresholds.** A food is green at one amount and red at a larger one. This is the most useful idea in the category for Inside Story, since many condition cautions (oxalate, goitrogens, purines, histamine) are dose-dependent too.
2. **A structured reintroduction protocol**: one FODMAP group at a time, over three days of increasing amounts, with a washout between. Inside Story's food trials test one food out and back in, but have no stepped dose.
3. **Lab-tested data** from the diet's originators, which gives it unmatched authority for IBS.
4. **Certified product lists** for packaged foods that passed testing.

**What Inside Story already does better**

- 19 conditions rather than one, and several at once.
- Whole-diet nutrition: Monash shows only FODMAP content, not whether the day gave enough iron or fiber.
- Recipes built and scored from any ingredients, where Monash has about 70 fixed recipes.
- Meal planning, grocery list and schedule around the food.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Amount-aware cautions ("fine at half a cup, a caution at two cups") | Rule Engine step 1 and 3: a threshold per serving on the sub-criteria where a dose matters, read by builders when the quantity is entered and by `compute_recipe_condition_data.js`. The live reference DB would need new columns, so this is gated on the two-database rule and the unified database's Phase 5. Also depends on licensing: Monash data itself cannot be copied; published per-serving figures from papers can. | JS, plus a reference data change | None | Large |
| Stepped reintroduction | Extend `food_trials` and `lib/foodExperiment.ts` with a `steps` design: day 1 small, day 2 medium, day 3 large, then a washout, each step with its own symptom read. Keep the one-run limit sentence. | JS | None | Medium |

### 2.6 Samsung Food (formerly Whisk)

**What it is.** A free recipe saver, meal planner and shopping list with a large community recipe library and AI help, tied into Samsung smart appliances. iPhone, Android, web.

**Pricing** (checked 2026-09-25, https://samsungfood.com/food-plus/ and https://www.plantoeat.com/blog/2026/01/samsung-food-review-pros-and-cons/; the support page returned 403): free for saving recipes from the web, meal planning and shopping lists. Food+ is $6.99 a month or $59.99 a year, often free for 3 to 12 months with a Samsung device. No lifetime plan. Household sharing of lists and plans is part of the free app.

**What it does well that Inside Story does not yet do**

1. **Save any recipe from any website in one tap** (a share-sheet target), with ingredients parsed and nutrition estimated.
2. **Scan a recipe from a photo** (a cookbook page or a handwritten card), Food+.
3. **Step-by-step cook mode** with timers and the screen kept on, Food+.
4. **Community recipes and collections**: thousands of recipes to browse by diet, with ratings and notes.
5. **Shared household list and plan, updated live** across each family member's phone.

**What Inside Story already does better**

- Condition cautions and scoring on every recipe; Samsung Food's diet filters are generic (vegan, keto) and reviewers say its plans ignored stated preferences.
- The six-week meal plan generator driven by conditions, stage, safe foods and nutrient rules, rather than taste.
- Batch and ferment tracking, garden harvest drawn down while cooking, and leftovers through the Kitchen inventory, which reviewers name as Samsung Food's weak point.
- Local-first: Samsung Food keeps everything in a Samsung account.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| "Share to Inside Story" from a browser | Register the app as an Android share target for text and links (an intent filter in `app.json`, the same mechanism the `.is` file registration already uses), handing the URL to the recipe importer described under Cronometer. | Native config change, so one EAS rebuild; the importer itself is JS | None | Small for the intent, on top of the Large importer |
| Recipe from a cookbook photo | `lib/ocr.ts` already runs ML Kit text recognition on the phone. Feed a photographed recipe page through it, split into ingredient lines and steps, and hand the lines to the same ingredient matcher. | JS (OCR module already in the build) | None: stays on the phone | Medium, once the matcher exists |
| Cook mode | `RecipeDetailCard.tsx` gains a "Cook this" view: one step at a time, large text, timers spotted in step text, screen kept awake (`expo-keep-awake`, which is a small native module, so check whether it is already in the build before counting on over-the-air). | JS if keep-awake is present, otherwise a rebuild | None | Small to Medium |
| Live shared household list | Already designed: the shopping list is the one area that merges between two people (`lib/peerRelationships.ts`). The gap is that it only runs between linked people through the shared folder. Nothing to add on this tab. | n/a | n/a | n/a |

### 2.7 Paprika Recipe Manager 3

**What it is.** The long-standing favourite for keeping a personal recipe collection: a built-in browser that grabs recipes from any site, pantry, meal planner, aisle-sorted grocery list, scaling, and cook-mode touches (timers found in the text, screen kept on). iPhone, iPad, Android, Mac, Windows, synced through a free Paprika account.

**Pricing** (checked 2026-09-25, https://www.paprikaapp.com/ lists no prices; figures from store listings reported at https://eathealthy365.com/how-much-does-paprika-recipe-manager-cost-to-download/ and deal sites): one-time purchase per platform, about $4.99 on iPhone or Android and about $29.99 on Mac or Windows, with regular half-price sales ($2.99 and $14.99). No subscription, no family plan (one account can be shared). Exact current store prices not confirmed from the official site.

**What it does well that Inside Story does not yet do**

1. **Web capture that works on almost any site**, including ones without structured data, by letting the person highlight the ingredients and steps.
2. **Scaling** a recipe up or down with the ingredient amounts recalculated.
3. **Aisle-sorted, merged grocery list** ("2 onions" plus "1 onion" becomes "3 onions").
4. **Pay once, own it.** The pricing model many cooks prefer.

**What Inside Story already does better**

- Every recipe carries nutrients and condition cautions; Paprika has no nutrition analysis to speak of.
- Recipes come with the app (about 500), where Paprika starts empty.
- Planning is driven by health rules, not by hand only.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Scale a recipe | Builders already hold Servings and Serving Size; add "Make it for N" on `RecipeDetailCard.tsx` and in Build This Recipe that multiplies every ingredient row before loading the builder. | JS | None | Small |
| Sort the grocery list by aisle | Merging same-food lines already exists (`mergeShoppingAmounts` in `lib/groceryList.ts`). Missing is grouping by store section: use the reference DB category (produce, dairy, meat, pantry) as a stand-in for aisles, with the person able to reorder sections to match their store. | JS | None | Small |
| Highlight-to-capture import for sites without structured data | An in-app browser page (`expo-web-browser` cannot read page content, so this needs a WebView, which is a native module and a rebuild) where the person marks ingredients and steps. | Native (WebView), EAS rebuild | None | Large |

### 2.8 Cal AI (AI photo logging; SnapCalorie is the same category)

**What it is.** The fastest-growing app of 2025 and 2026 in food logging: photograph a plate and it estimates calories, protein, carbs and fat. Reported in 2026 to have been acquired by MyFitnessPal. iPhone and Android.

**Pricing** (checked 2026-09-25, https://www.eesel.ai/blog/cal-ai-pricing and https://nutriscan.app/blog/posts/cal-ai-pricing-2026-monthly-yearly-premium-abc6e7b26f): free plan without photo scanning; Premium most often $9.99 a month or $29.99 a year, a family plan reported at $59.99 a year, and a lifetime option reported at $99.99. It uses dynamic pricing, so people see different prices after the onboarding quiz. A 3-day trial requires payment details.

**Trust record, worth knowing** (https://techcrunch.com/2026/04/21/apples-cal-ai-crackdown-signals-its-still-policing-the-app-store/): Apple briefly pulled it in April 2026 for bypassing in-app purchase and deceptive billing, and a March 2026 breach reportedly exposed over 3.2 million records including health tracking data through an unsecured cloud database.

**What it does well that Inside Story does not yet do**

1. **A meal logged in about five seconds.** This speaks directly to CLAUDE.md's named risk number one, logging discipline.
2. **Portion estimation** from the photo (some phones use the depth sensor).

**Why it is weaker than it looks.** Independent testing puts simple foods at roughly 85 to 92 percent accuracy and mixed or restaurant dishes 25 to 50 percent off, usually low. It returns macros, not the ingredient identity that condition scoring needs: it cannot say whether the sauce held garlic or the bowl held raw kale.

**What Inside Story already does better**

- Ingredient-level records, which is what Pattern Finder, food trials and condition scoring run on. A calorie guess is useless for finding that a person reacts to onion.
- Photos never leave the phone. Cal AI's breach shows the cost of the other approach.
- Log Again, favourites and Log or Schedule already make a repeated meal a two-tap log, and most people eat the same twenty or so meals.

**Gaps and what it would take**

| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Photo suggests ingredients, person confirms | Deliberately not built (Open Next Steps item 21) because it needs an off-device vision model. Two routes: (a) an explicit opt-in that sends the photo to a vision model and returns a list of likely ingredients, which the person confirms against reference foods in the Meal builder, never saved unconfirmed; (b) an on-device image labeller (ML Kit image labelling) that only recognises broad items ("banana", "salad") and fills a first guess. Route (b) keeps the privacy stance but is weak on mixed dishes. | (a) JS plus a paid API and a server or Worker; (b) a native module and an EAS rebuild | (a) conflicts with local-first unless it is opt-in, stated plainly, and routed through the Worker with no storage; (b) none | Large either way |
| Faster repeat logging without AI | Suggest the likely meal at the usual time ("It is 12:30; log your usual lunch?") from `meals` history and `usual*Time` on the profile, as a Home line or a notification action. | JS | None | Small to Medium |

---

## 3. Gap synthesis and ranked recommendations

**Where Inside Story is already ahead of every app reviewed:** no competitor scores food against 19 conditions, reorders by healing stage, checks a whole meal for stacked goitrogens, runs a leave-it-out-then-bring-it-back food trial, separates food from supplements, tracks ferments and garden harvest into the kitchen, or keeps all of it on the phone. The closest single-condition rival is Monash (IBS only). The market splits into trackers (Cronometer, MyFitnessPal, Cal AI), scanners (Yuka, Fig) and recipe keepers (Samsung Food, Paprika); Inside Story is the only one that is all three, which is also why its gaps are mostly about **getting food in faster** rather than about depth.

**Ranked by value for the effort** (Small = a day or less, Medium = a few days, Large = a week or more):

1. **Fix the stale builder help text** (Small, JS). Eleven builders' help in `FOOD_LENS_COPY` (`app/(tabs)/food.tsx`) still says "In progress" and that saving as a favourite is not wired up, while My Recipes shows saved favourites. A first-time user reads that as unfinished.
2. **One-glance verdict on a scanned product** (Small, JS, `ScanProductView.tsx`). Yuka's and Fig's whole appeal; Inside Story already has the facts.
3. **Additives and processing level from the same Open Food Facts response** (Medium, JS, `lib/barcodeLookup.ts`, new `lib/additives.ts`, links into Health Literacy's Food Additives reading). No extra network request, no privacy cost.
4. **Scale a recipe and group the grocery list by store section** (Small each, JS, `RecipeDetailCard.tsx`, `lib/groceryList.ts`). Paprika-level basics people expect.
5. **Suggest the usual meal at the usual time** (Small to Medium, JS). Attacks the logging-discipline risk without any AI or privacy cost.
6. **Recipe import from a link, plus Android share target** (Large, JS importer plus one native config change bundled into the next EAS rebuild). Cronometer, MyFitnessPal, Samsung Food and Paprika all have it; it is the most visible missing feature for anyone who cooks from the web. The ingredient-line matcher is reusable for item 8.
7. **Ingredient-list flags for packaged food and a wider restriction list** (histamine, salicylate, sulfite, alpha-gal, nightshade, lectin) (Medium to Large, JS, new `lib/ingredientFlags.ts`, `user_food_allergies`). Fig's core, and highly relevant to autoimmune users. Pair with the "allergen-aware, not allergy-safe" wording (item 26).
8. **Recipe from a cookbook photo** (Medium once item 6 exists, JS, reuses `lib/ocr.ts`).
9. **Stepped reintroduction in food trials** (Medium, JS, `food_trials`, `lib/foodExperiment.ts`). Monash's protocol, generalised to any food.
10. **A restaurant or takeaway path in Log or Schedule** (Medium, JS). Otherwise meals out simply go missing from the record Pattern Finder depends on.
11. **Amount-aware cautions** (Large, reference data change, gated on the two-database rule and the unified database merge). Highest long-term value, slowest to do honestly.
12. **Opt-in photo-to-ingredients suggestion** (Large, privacy decision first). Only if logging data shows people stop logging; route through the planned Worker, opt-in, never saved unconfirmed.

Already on the roadmap and confirmed as gaps no competitor fills well: ingredient rotation (item 3), batch remake cadence for ferments (item 18, none of the recipe apps track leftovers or batches either), and a home brew path (item 9).

---

## 4. Pricing summary

Checked 2026-09-25, US prices. Sources are in each section above.

| App | Free tier | Monthly | Annual | Lifetime / one-time | Family |
|---|---|---|---|---|---|
| Cronometer Gold | Yes (84 nutrients, ads) | $10.99 | $59.99 | None | None |
| MyFitnessPal Premium | Yes (ads, no barcode) | $19.99 | $79.99 | None | None |
| MyFitnessPal Premium+ (meal planner) | | $24.99 | $99.99 | None | None |
| Fig+ | Yes (limited scans) | $5.99 to $10 | $34.99 to $69.99 | None | Profiles included |
| Yuka Premium | Yes (unlimited scans) | None | from $10, pay what you choose | None | None |
| Monash FODMAP | No | None | None | about $8 to $13 once | None |
| Samsung Food+ | Yes (import, plan, list) | $6.99 | $59.99 | None | Sharing is free |
| Paprika 3 | No (desktop demo only) | None | None | about $4.99 mobile, $29.99 desktop, per platform | One account shared |
| Cal AI Premium | Yes (no photo scan) | $9.99 (dynamic) | $29.99 (dynamic) | reported $99.99 | reported $59.99/yr |
| **Inside Story Free** | Builders, Food Lookup without condition scoring | $0 | $0 | | |
| **Inside Story Individual** | | $9.99 | $89.99 | | |
| **Inside Story Partner** (two people) | | $14.99 | $134.99 | | |
| **Inside Story Household seat** | first 2 or 3 free | $1.99 per seat | $17.99 per seat | | |
| **Inside Story Caregiver** | | $4.99 per person | $49.99 per person | | |

**What people in this category are used to paying.** The monthly sticker price clusters at $7 to $11, but almost everyone pays annually, and annual prices cluster at **$30 to $60**. Only MyFitnessPal charges more ($80 to $100) on the strength of its brand. Single-purpose tools (Yuka, Monash, Paprika) are $10 a year or a one-time $5 to $30. Annual discounts are steep: Cronometer and Samsung Food take 50 percent or more off the monthly rate.

**What that means for Inside Story.** $9.99 a month sits in the normal band. **$89.99 a year is above every app here except MyFitnessPal Premium+**, and its annual discount (25 percent) is shallower than the 50 percent people see elsewhere. The case for it has to rest on doing the work of three or four of these apps (tracker, scanner, recipe keeper, condition guide) plus Signals, Trends and Reports, and on the privacy stance, which Cal AI's and MyFitnessPal's breaches make easy to explain. Worth weighing: an annual price nearer $59.99 to $69.99, or a launch price, to meet what this audience already pays for Cronometer. Also note the Free tier leaves out condition scoring, which is the one thing no competitor offers; a small taste of it (for example, one condition, or scoring on scanned products only) may convert better than hiding it.
