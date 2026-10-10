# What users of the Food competitors complain about

Researched 2026-10-09. Each app lists what its users dislike, what they wish were fixed, changed or added, and what they call useless or clutter. Every point carries its source, the date of the complaint where the source gives one (otherwise the date it was read), and whether it recurs across many users or comes from one person. The last line of each app says what Lifestead must do so the same complaint cannot be made of it.

Recurrence key: **many** (raised across many reviews or posters, or measured as a share of reviews), **several** (two to five people), **one** (a single person, kept because it is specific and checkable).

A caution about sources: several review-analysis sites (Nutrola, Unstar, Kimola, Macaron, justuseapp) are themselves competitors or SEO pages. Their percentages are reported as they claim them, not verified.

Bearable is listed under Food in `apps.json` but its complaints are about symptom logging, so its section is in `signals.md`. Medisafe (from "Cronometer + Medisafe") is in `schedules.md`; Seedtime and YNAB (from "Seedtime + YNAB") are in `garden.md` and `life.md`.

---

## Across the whole category first

Calorie and nutrition trackers, from an analysis of 50,217 store reviews, January 2024 to March 2026 ([Nutrola, 2026-04-04](https://nutrola.app/en/blog/we-analyzed-50000-calorie-tracker-reviews-what-users-actually-complain-about-2026)):

| Complaint | Share of complaints |
|---|---|
| Ads, especially intrusive ones | 27.3% |
| Subscription cost | 25.9% |
| A feature removed or moved behind a paywall | 13.2% |
| Wrong nutrition data | 15.7% |
| Confusing or poor design | 12.4% |
| Syncing with wearables and health apps | 10.9% |
| Foods missing from the database | 9.8% |
| Slow or crashing | 7.9% |
| Support | 6.5% |
| Privacy | 5.1% |

Recipe apps in 2026 share two more: full-screen ads that block the next step while cooking, and recipes that turn out to need a paid tier the listing never mentioned ([Unstar, 2026](https://unstar.app/blog/allrecipes-yummly-nyt-cooking-paprika-mealime-recipe-apps-ranked-2026)). **many**

**What Lifestead must do across the board:** no ads anywhere, ever; nothing that is Free today ever moves to paid (the free/paid board decides once, before launch, and the line only ever moves toward Free); a recipe or feature that needs a paid tier says so before it is opened; every nutrient figure names its source; works offline.

---

## Cronometer (leader: Food Lookup, Nutrients today, meal builders, Past Meals, Cooking Impact)

**Dislikes**
- Foods added to a meal land in a jumbled order instead of at the end; timestamps only reorder entries when a separate setting is on. **several** ([Cronometer forum, Feb 2021 and Jun 2024](https://forums.cronometer.com/discussion/comment/14480))
- Search shows foods the person has never eaten above the ones they eat all the time; no partial matching. **several** (same thread, Feb and Mar 2021)
- Slow: Android startup, a four-second lag typing into search, 20 to 25 seconds to clear a screen, reported over months and years. **several** (same thread, Feb 2021, Aug 2022; [App Unusable Now](https://forums.cronometer.com/discussion/comment/14053))
- Default serving sizes of 100 g instead of a normal portion. **one** (Mar 2021)
- Search results show no calorie figure; recipe ingredients show no per-ingredient figures and cannot be reordered. **one** (May 2021)
- Interface too big for the desktop, lots of scrolling and clicking; missing the old calendar for jumping back to past days. **several** ([pet peeves thread](https://forums.cronometer.com/discussion/comment/14585/))
- The Android app opens on yesterday's diary, and day navigation skips days. **several** (Mar to Apr 2021)
- Phone and desktop out of step, so the day's totals are wrong while eating. **one** (May 2021)
- Apple Health entries stamped at midnight instead of when logged; Samsung Health pulls only workouts, not steps. **one** (May 2021)
- Highest share of design complaints (16.4%) and privacy complaints (9.6%) of the big trackers. **many** ([Nutrola, 2026-04-04](https://nutrola.app/en/blog/we-analyzed-50000-calorie-tracker-reviews-what-users-actually-complain-about-2026))
- The company is seen as deaf to what users ask for and chasing redesigns over fixes. **several** (pet peeves thread)

**Wishes**
- Nutrients the database lacks: boron, inositol, CoQ10, the K vitamins separated, chloride. **one** (May 2021)
- Fractions and kitchen units for ingredients. **one** (May 2021)
- Alphabetical sorting and a search box for custom foods and favourites; a delete option that works. **several** (Mar 2021, Jul 2024)
- An offline mode. **one** (Mar 2021)
- Sync with Paprika recipes. **one** ([forum](https://forums.cronometer.com/discussion/115/sync-with-paprika))

**Useless or clutter**
- Large grey dots on nutrients the person has no target for, "a very BAD user experience" that crowds out the ones they do track. **one** (Jul 2024)
- Ads playing at full volume at night (free tier). **one** (Mar 2021)

**Lifestead must:** add foods in the order they are added unless the person sorts by time; rank search by what this person eats first; open on today; show calories and the person's tracked nutrients in search results; default to a normal portion, not 100 g; accept fractions and kitchen units; hide nutrients with no target unless asked for; stamp health-app entries with the time eaten; stay fast on a phone with a large history (the 1.0.54.2 getFoodNutrients fix is the kind of thing to keep checking); work fully offline.

---

## MyFitnessPal (table: Food Lookup, meal builders, logging, Past Meals, Nutrients today, Energy & Portions)

**Dislikes**
- The barcode scanner moved behind the paywall in 2022 and is still the loudest single complaint in the category; custom macros, meal import and export went the same way. **many** ([Unstar, 2026](https://unstar.app/blog/is-myfitnesspal-premium-worth-it-paywall-app-reviews-2026); [Kimola](https://kimola.com/reports/myfitnesspal-removes-free-barcode-scanner-feature-140890))
- Full-screen video ads in the middle of logging, banners that shift the buttons, junk-food ads inside a nutrition app. The most cited complaint on Reddit. **many** ([Nutrola, Reddit roundup 2026](https://nutrola.app/en/blog/what-do-reddit-users-say-about-myfitnesspal-2026))
- The 2026 redesign added taps to logging, the one job people open it for. **many** (Unstar, 2026)
- Paying subscribers get the same logouts and crashes as free users. **many** (Unstar, 2026)
- 202 of the 300 newest Google Play reviews were 1 to 3 stars (pulled 2026-07-27). Rating fell from 4.1 in 2024 to 3.6 in early 2026. **many**

**Wishes:** the features back that were free for years.

**Useless:** ads; the redesign's extra steps.

**Lifestead must:** keep Scan a Product on Free (it is a safety reader for allergies, P28); never add a tap to logging a meal in a redesign (count taps on Log before and after any change); never move a Free function to paid.

---

## MacroFactor (leader: Food Lookup, logging, Energy & Portions, Weight)

**Dislikes**
- Price, with no free tier at all; the most raised concern on Reddit. **many** ([Nutrola, 2026](https://nutrola.app/en/blog/what-do-reddit-users-say-about-macrofactor-2026); [Macaron](https://macaron.im/playbook/macrofactor-reddit-reviews))
- Common foods missing, so entries have to be made by hand (about 20% of complaints by one count). **many** ([Macaron](https://macaron.im/playbook/macrofactor-reviews))
- Barcode scanner not reliable enough for the price (about 15%). **many** (same)
- Too much structure for someone who wants simple help. **many**
- The watch app feels like an afterthought; no lock-screen widgets to match rivals. **several**

**Wishes:** micronutrients, not only macros: "a nutrition dashboard rather than a macro dashboard." **many**

**Lifestead must:** have a Free tier that is useful by itself; keep micronutrients first-class (already the design); offer a simple view for people who want less (Simple View, item 28); widgets that log in one tap.

---

## Yuka (leader: Scan a Product, Check a Label)

**Dislikes**
- The scoring weights (60% nutrition, 30% additives, 10% organic) are called arbitrary, and the method opaque. **many** ([Glossy](https://www.glossy.co/?p=176629); [Trustpilot](https://ie.trustpilot.com/review/yuka.io))
- "Unscientific fear mongering": one study overruling many. **several** (Trustpilot)
- A good or bad verdict ignores the person's own diet and conditions. **many** (dietitian review, [Mama Knows Nutrition](https://mamaknowsnutrition.com/yuka-app-reviews))
- Good and bad labels can feed disordered eating. **several** (same)
- Ratings inconsistent between similar products; scanning failures; subscription cost; privacy. **several** ([Kimola](https://kimola.com/reports/in-depth-yuka-app-customer-feedback-analysis-report-app-store-us-157894))

**Wishes:** cleaning products; differences by sex.

**Lifestead must:** show the method behind every score with its evidence tier and source; score against the person's conditions, not one universal verdict; never call a food "bad" (the clinical-claims audit already bans verdict words in several modules, and the scan screen should join it); say when a product's data is incomplete.

---

## Fig (leader: For You card, Scan a Product, Condition Scores, Check a Label, Safe Foods, allergy cautions)

Rated 4.7 from about 16,000 reviews, so most users like it ([Fig on Google Play](https://play.google.com/store/apps/details?id=com.fig)). The complaints that matter are about safety.

**Dislikes**
- Shared-line and shared-facility information was wrong on three products found in minutes (cauliflower rice, cheese crisps, tortilla chips): Fig said no cross-contact where the maker confirmed wheat, soy, nuts, eggs or sesame ran on the same line. Labelling of this is voluntary in the US, so a database built from labels cannot know it. **one investigation, three products** ([SnackSafely, 2023-09-15](https://snacksafely.com/2023/09/advisory-dont-use-the-fig-scanner-app-if-the-potential-for-allergen-cross-contact-concerns-you/))
- About a quarter of reviews negative. **many** ([justuseapp](https://justuseapp.com/en/app/1564434726/fig-food-scanner-guide/reviews))

**Lifestead must:** say on every allergy caution that the app reads ingredients and voluntary warnings and cannot know shared lines or facilities, so "no caution shown" never reads as "safe" (open item 26, "allergen-aware, not allergy-safe", is exactly this); offer "check with the maker" as the step for anyone with a severe allergy.

---

## Paprika (leader: Import a Recipe, Meals on the clock; table: lifetime price)

Rated 4.9 from 53,000 reviews; well loved.

**Dislikes**
- Putting a recipe on the meal plan does not put its ingredients on the shopping list; that is a separate step. **several** ([Plan to Eat review](https://plantoeat.com/?p=38013))
- Ticked-off ingredients and highlighted steps are lost on leaving the recipe. **several** (same)
- Ingredients and directions shown on separate screens, hard to cook from. **several** (same)
- Not intuitive; meal planning thin. **several** (same)
- Pantry and grocery list do not talk: adding a recipe's ingredients ignores what is already in stock. **one** ([justuseapp](https://justuseapp.com/en/app/1303222868/paprika-recipe-manager-3/reviews))
- No scanning of cookbook pages; recipes typed by hand. **one** (same)
- No automatic plans, nutrition only basic. **several** ([Macaron](https://macaron.im/playbook/paprika-review))

**Lifestead must:** add a planned meal's ingredients to the shopping list in the same step, less what the Kitchen holds; keep ticked ingredients and the current step when the person leaves and comes back; show ingredients and steps together while cooking; import from a photo of a cookbook page.

---

## AnyList (leader: Grocery List, widgets, sharing)

**Dislikes**
- Clunky, needs a manual; hidden items leave a messy list. **several** ([Trustpilot](https://www.trustpilot.com/review/anylist.com))
- Recipe import from badly formatted sites breaks lines or adds blank ones. **several** ([MacStories](https://www.macstories.net/reviews/saving-recipes-with-the-anylist-extension/))
- Meal planning and recipes feel underbuilt next to the list. **several**
- Issues left unresolved through support. **several** (Trustpilot)

**Lifestead must:** clean an imported recipe's lines (no blank runs, steps split properly) and show what was imported for checking before saving; keep the grocery list readable with crossed-off items moved out of the way.

---

## Samsung Food, formerly Whisk (leader: Import a Recipe, Meals on the clock, delivery)

Roughly 60% negative across 6,187 reviews by one count ([justuseapp](https://justuseapp.com/en/app/1133637674/samsung-food-meal-planner/reviews)).

**Dislikes**
- Importing from Instagram often fails, the reason many downloaded it. **many**
- Shared lists fall out of sync; ticked items come back after shopping, sending people back to the store. **many**
- Edited recipe directions revert to the original after saving. **several**
- "Something went wrong" on opening lists; lists that will not save. **many** ([problems page](https://justuseapp.com/en/app/1133637674/whisk-recipes-grocery-list/problems))
- A health score "steeped in fat phobia and diet culture language." **several**

**Lifestead must:** never bring back a ticked item after a sync (the three-way merge settles this by time; keep a test for it); save edits to imported recipes as the person's own; share from Instagram and other apps (Share to Inside Story, item 31) and say plainly when a link holds no recipe; keep scoring about conditions, never about weight or "good" and "bad" food.

---

## Plan to Eat (leader: Meals on the clock, Meal Plan, Planned and Eaten)

Rated 4.8 from 6,100 reviews; one analysis site reads its review text as mostly negative, a figure that does not square with the rating and should not be relied on ([justuseapp](https://justuseapp.com/en/app/1215348056/plan-to-eat-meal-planner/reviews)). No specific complaints surfaced in this pass. Its praised freezer planning and family planning are what to match.

**Lifestead must:** match its freezer feature (what is frozen, when it was made, plan it in), which open item 18 (batch remake cadence) is close to.

---

## Eat This Much (leader: Meal Plan generator, Planned and Eaten)

**Dislikes**
- Plans hold more food than a person can eat in a day. **many** ([Plan to Eat review](https://www.plantoeat.com/blog/2023/10/eat-this-much-app-review-pros-and-cons/); [r/EatThisMuch](https://lr.us.psf.lt/r/EatThisMuch/comments/10yf417/what_if_i_dont_eat_this_much))
- Too much variety: a week's plan needs a huge shopping list. **many**
- Recipe quality and grocery list accuracy. **several** (r/EatThisMuch new user feedback, Jan 2024)

**Lifestead must:** let the Meal Plan reuse ingredients across the week and show how many distinct items a plan needs before it is accepted; let leftovers fill a later meal; keep portions to what the person says they eat.

---

## Kitchen Stories (leader: ready-made recipes, Learning to cook)

About 45% negative across 31,000 ratings by one count ([justuseapp](https://justuseapp.com/en/app/771068291/kitchen-stories-recipes/reviews)).

**Dislikes**
- Ads covering the recipe so it cannot be read, even after paying the new fee. **many**
- Crashes and freezing. **several**

**Lifestead must:** no ads; keep the screen awake while cooking.

---

## NoWaste (leader: What the Kitchen Holds, food thrown out)

Rated 3.8 from 991 reviews ([justuseapp](https://justuseapp.com/en/app/926211004/nowaste-food-inventory-list/reviews)).

**Dislikes**
- Hours of setup and upkeep; glitchy. **several**
- Users' food lost when the maker moved its database to a new server. **several**
- Barcode scanning seldom finds their food. **several**

**Wishes:** names under the icons. **one**

**Lifestead must:** make stocking the Kitchen fast (from a receipt, from the shopping list as it is ticked off, from a meal that used things up); keep the data on the person's device so no server move can lose it; label icons.

---

## Seasonal Food Guide (leader: Seasonal and local food)

**Dislikes**
- Location and month have to be entered again after every tap; going back drops to the full list. **several** ([justuseapp](https://justuseapp.com/en/app/1235820625/seasonal-food-guide/reviews))
- No calendar showing several months at once. **several**

**Lifestead must:** remember the person's region and the month; show a year view of what is in season.

---

## Brewfather (leader: home brew and fermentation batches)

About two thirds positive ([justuseapp](https://justuseapp.com/en/app/1488585822/brewfather/reviews)). Praised for keeping desktop and phone the same.

**Dislikes**
- The web version crashed repeatedly on a PC. **one**

**Wishes:** an explanation of a hop, yeast or malt on hovering over it. **one**

**Lifestead must:** explain any ingredient in a batch on a tap; keep desktop and phone the same.

---

## Kitchen Calculator apps and Google (leader: conversions in kitchen terms)

Not one app. No complaints gathered; the leader here is searching for a conversion.

---

## Cal AI (also: logging a meal)

**Dislikes**
- Wrong calories and portion sizes from photos. **many** ([Kimola](https://kimola.com/reports/unveil-user-insights-on-cal-ai-calorie-tracker-app-store-us-155190))
- Charged after a free trial, hard to cancel (about 30% by one count). **many** (same)
- Restoring purchases fails; support slow. **several**

**Lifestead must:** never present a photo estimate as a measurement; show what was recognised and let the person correct it; make cancelling as easy as subscribing, and remind before a trial ends.

---

## Open Food Facts (table: Scan a Product)

Free, open source, no ads, praised for that.

**Dislikes**
- Adding a product is slow and confusing; photos come out blurry; nutrients typed one by one. **several** ([Unstar](https://unstar.app/developer/open-food-facts-ios-588798011?country=fr))
- Many products missing. **several**

**Lifestead must:** when a scan finds nothing, let the person read the label with the camera and save it as their own food in one step.

---

## Monash FODMAP (table: For You card, ready-made recipes)

The data is trusted because the people who made the diet wrote it.

**Dislikes**
- Data lost after updates. **many** ([justuseapp](https://justuseapp.com/en/app/586149216/monash-fodmap-diet/reviews))
- Search sometimes does not load, so a missing food and a failure look the same. **several**
- Broken links, including the feedback link; Back does not return to the search results. **several**
- Whether a green food is unlimited or portion-limited is unclear. **several**
- Gaps for some countries. **several**

**Wishes:** a list of foods with no limit at all. **several**

**Lifestead must:** say "nothing found" and "could not search" differently; return to the search and its results on Back; show the portion a food is safe up to, and say plainly when there is no limit.

---

## Spoonful (also: For You card, Scan a Product, Safe Foods)

**Dislikes**
- Wrong information several times; a subscriber cancelled. **one** ([appfollow](https://apps.appfollow.io/ios/spoonful-diet-food-scanner/1481914232?country=us))
- For foods that depend on portion, it sends the person to the Monash app. **one**

**Lifestead must:** answer the portion question itself, from cited data.

---

## Heali (also: Condition Scores, assistant)

No consumer complaints found; the published material is a study (58 enrolled, 25 finished) ([JMIR, 2021](https://jmir.org/2021/3/e24134)). Recheck later.

---

## Mela (also: Import a Recipe)

Very well liked, one-time price.

**Dislikes**
- Sync between Mac and iPhone broke; one person lost most of their recipes setting up iCloud. **several** ([justuseapp](https://justuseapp.com/en/app/1548466041/mela-recipe-manager/reviews))
- So minimal that adding a recipe is unclear. **several**
- Support does not reply. **several**

**Lifestead must:** never lose records in a sync (keep the merge's clash log and the backup before every restore); make adding a recipe the obvious first button.

---

## NYT Cooking (also: Learning to cook)

**Dislikes**
- Recipes that need a paid tier the listing did not mention. **many** ([Unstar, 2026](https://unstar.app/blog/allrecipes-yummly-nyt-cooking-paprika-mealime-recipe-apps-ranked-2026))
- Recipes labelled vegetarian that use chicken stock or parmesan. **several** ([justuseapp](https://justuseapp.com/en/app/911422904/nyt-cooking/reviews))
- Recommendations do not learn what the person likes. **several**

**Lifestead must:** check every diet label against the ingredients (a test over the recipe corpus); say which recipes are paid before opening them.

---

## OurGroceries (also: Grocery List, shared list, household seat)

Rated 4.8 from 63,000 ratings.

**Dislikes**
- The add box moved to the bottom and scrolls away on long lists. **several** ([marlvel](https://marlvel.ai/apps/com-headcode-ourgroceries/reviews))
- Editing an item makes a duplicate, which others in the house cannot tell apart. **several**
- Sharing is all or nothing; no keeping one list private. **several** ([OPCUG review](https://opcug.ca/Reviews/OurGroceries.htm))

**Wishes:** share each list with chosen people; a default list for Alexa. **several**

**Lifestead must:** edit an item in place, never as a copy; let each list be shared or private on its own; keep the add box in reach on a long list.

---

## PantryWise (also: food thrown out)

New, five ratings, no complaints yet. Its money saved per week is what to match.

---

## America's Test Kitchen (also: Learning to cook)

**Dislikes**
- Charged after cancelling inside a free trial; cancelling means a phone line with long waits and dropped calls. **many** ([Deceptive Patterns](https://bunny.deceptive.design/articles/americas-test-kitchen-difficult-to-cancel-free-trial-subscription); [BBB](https://www.bbb.org/us/ma/boston/profile/publishers-periodical/americas-test-kitchen-lp-0021-66446))
- Little improvement over two years; favourites hard to use. **one**

**Lifestead must:** cancel inside the app in the same number of taps as subscribing.

---

## USDA FoodData Central (table: Food Lookup)

A data source, not an app. No complaints gathered.
