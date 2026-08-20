# Inside Story: Autoimmune Food & Health App (Project Brief)

> **STOP AND READ FIRST: this project has TWO separate SQLite databases. Before touching either one, especially for any bulk edit or translation work, confirm which one is meant.**
> 1. `assets/data/foods_reference.db` is the LIVE database the shipped app reads from. Any edit here goes live immediately and forces a slow re-import on the user's own phone.
> 2. `unified-database/unified_foods.sqlite` is the separate, newer successor project (see its own section below). Not wired into the app at all.
>
> A session once spent hours hand-translating the LIVE database while the user believed the *unified* one was being worked on, costing roughly 8 hours in one day. Whenever the user says "the new database," "the other database," "the 2nd database," or asks for translation or bulk-edit work without naming a file, **stop and ask which one** before proceeding.

---

## How this document works

This file is the standing brief a new session reads automatically: current status, product direction, architecture decisions, and standing rules. It is deliberately kept small so it fits comfortably in context.

**The full history lives elsewhere and is not auto-loaded:**

- **`docs/CLAUDE-ARCHIVE.md`** holds the complete, unmodified 2.05M-char original of this file: the dated build journal from 2026-07-18 through 2026-08-19, plus the long-form reasoning behind every decision summarized here. Read or grep it when you need the history behind a specific decision. It is not loaded into context automatically.
- **[Inside Story Notion hub](https://app.notion.com/p/3a853652f2728144bde2d78ead5227ea)** has day-by-day decisions and an explicit built-vs-planned reconciliation. New findings get written up there first.
- **[App Development Log](https://app.notion.com/p/3a853652f27281ccb21aeaa9bec8c2ae)** has the full reasoning per change.
- **`unified-database/README.md`** is the authoritative, dated history for that track (1,700+ lines, newest entry at top).

**Keep this file lean.** When a session finishes work, update the Status snapshot below in place and put the long-form account in the Notion log. Do not append to this file. That append-only habit is what grew the original to 2.05M characters and stopped Claude Code from responding at all.

## Status snapshot (2026-08-20)

The app is under active development and substantially built. Current state:

**Shipped and working:** eleven Food builders (Meal, Side, Salad, Smoothie, Fermentation, Beverage, Snack, Baked Goods, Soup, Sauces, Handhelds), each saving a standalone record from raw reference-database ingredients, with favoriting throughout. Insights with its full lens set (Food Lookup, Nutrient Ranking, Safe Foods, Labs, My Meds & Interactions, Today's Advisories, Hydration, Healing Stage Food Finder). Trends (Nutrients, 6 Dimensions, Symptoms & Flares, Weight, Labs, Pattern Finder). Reports generating a plain-text on-device report with Share. Schedules across Meals, Hydration, Supplements, Prescriptions, Doctor Appointments, and Exercise. Bio-Compass. Purple Digest as a full 8th tab with a search bar, category trees, TL;DR boxes, reading-time estimates, and cross-condition tags. Healing Stages (advisory and reordering) across 6 staged conditions. Barcode and product scanning with OCR and price tracking. Local password-encrypted backup and restore. Device-to-device pairing and signed recipe sharing (Ed25519, Connections roster, `.is` file type).

**Most recent work (2026-08-20):** Both waves of the fermented-drinks workstream, direct request built from two shared Google AI Mode conversations about homemade fermented drinks for gut health, joint pain, and sleep. Every claim independently fact-checked via WebSearch before being written in, not carried over from the source conversations as-is: several got downgraded (casein-thyroid "molecular mimicry" is a practitioner hypothesis, not consensus; resveratrol-Akkermansia is mostly animal-study evidence so far), and one citation caught mid-build was outright fabricated (a guessed PMC id for hibiscus/blood pressure resolved to an unrelated paper) and replaced after independently re-checking every citation added. **Wave 1** (22 recipes: the 10-variant Wild-Fermented Fruit/Flower Tonic family plus 12 named traditional drinks) shipped first. **Wave 2**, direct follow-up request ("finish the 19... this is no longer ONLY for people with these conditions... if there will not be an ingredient due to the limitations of the database... we just come up with replacements"), added the remaining 19 named drinks from the source conversations: Milk Kefir, Amazake, Rejuvelac (quinoa replacing wheat, the exact substitution named in the request), a Burdock Bark-Style Mauby Tonic (burdock root replacing unavailable soldierwood bark), Burdock and Dandelion Ale (honey replacing barley malt, sidestepping gluten), Pozol, Sobia (dairy-free, coconut milk), a Rosemary Cheong replacing pine needles (a real edibility/toxicity safety substitution, not just an availability one), Boza, Chicha de Jora, a quinoa-based Rye-Style Kvass, Sake-style and Makgeolli rice wines (alcoholic, cross-linked to the existing alcohol advisory), Ayran, Mango Lassi, a Tarag-style cow's-milk ferment (mare's/camel's milk unavailable), a Pu-erh-style black-tea kombucha ferment (true pu-erh leaf unavailable), and Coconut Palm Wine-style and Maple "Pulque-style" wild ferments (palm/agave sap unavailable). Every substitution is named openly in its own recipe summary, never presented as the authentic traditional ingredient. **45 total curated Fermentation Builder recipes now live** in `assets/data/foods_reference.db` (`scripts/add_fermented_drink_recipes.py` + `_wave2.py`, every ingredient re-verified resolvable and not audit-hidden), each with a full Digest `RecipeCard` (`lib/digest/recipes.ts`) and a "Build This Recipe" link into Fermentation Builder, written for a general reader with genuine condition-specific cautions layered in (dairy/casein, alcohol content, corn cross-reactivity, glycemic load, diuretic effect, bitter-tonic gallbladder caution) rather than gated behind any one condition. Two Basic Health entries (`lib/digest/fermentationMethods.ts`) cover the wild-ferment tepache-style method and the dairy-free/gluten-free survey of traditional drinks. A Fermentation Tracker + "My Fermented Drinks" harvest-inventory data layer shipped in `lib/db.ts` (`fermentation_batches`/`fermentation_task_links`/`fermentation_harvests`, `startFermentationBatch`/`advanceFermentationBatch`/`recordFermentationHarvest`/`recordFermentationHarvestUsage`/`markFermentationHarvestFinished`), mirroring Garden's own harvest/task-link precedent; real stir/burp/taste-test reminder series generate through the existing `insertScheduleSeries` machinery. **The Tracker's own UI shipped the same session**: a new screen (`app/fermentation-tracker.tsx`, registered in `app/_layout.tsx`) reached via a new "Track" action button on food-items.tsx's own "Saved Fermentations" list (alongside the existing Edit/Delete) — Start Tracking a picked saved fermentation, a linear stage flow (Primary Ferment → Carbonating → Refrigerated → Record Harvest, matching the reminder cadence already built), and a "My Fermented Drinks" section mirroring Garden's own Harvest Log (Log a Glass / Mark Gone actions, full history shown, not just what's left). `listFermentationBatches`/`getFermentationBatch` widened to JOIN `fermentations` for the batch's own name, avoiding an N+1 lookup in the screen. `npx tsc --noEmit` and `npx eslint` both clean on every touched file. **Not yet built:** the 19-condition "which fermented drinks help this condition" crosslink entries, and on-device confirmation of any of this (recipes, Tracker, or harvest flow).

**Also recent (2026-08-19/20):** the app's ground color moved from a fixed Deep Navy to a real Profile-area picker (`constants/colors.ts`'s `GROUND_THEMES`) across five options (Navy, Teal, Purple, Charcoal, Burgundy), Deep Teal now the shipped default. Picking a theme reloads the app automatically (`expo-updates`) rather than requiring a manual restart, after the first version's async approach turned out too late in expo-router's startup order to reach anything but the header; the real fix reads the saved theme synchronously at `colors.ts`'s own module-load time (`getGroundThemeSync()`, expo-sqlite's sync API), before any other file's own `colors` import can resolve. Ocean Deep is now the default shared background (was the wildflower photo). The app icon and the in-app TabHub button seed artwork were both redesigned (rounder, avocado-pit-like, a fuller vivid-green vine-curling sprout) and padding-corrected against real device screenshots; Digest's search fields now embed the mic inside the field itself, on whichever side `constants/floatingButton.ts`'s existing `NAVIGATION_HAND` flag favors. Full narrative and every bug hit along the way (a SQLite connection leak, Samsung's own icon-cache quirk) are logged in the Notion Project Tracker, dated 2026-08-19/20.

**Also recent (2026-08-18):** the personal-rule-builder half of the interaction rules engine. This added a local-only `personal_rules` table, matching folded into `evaluateInteractionRules()`, an add/view/pause/delete UI on My Meds & Interactions, and a "YOUR OWN NOTES" section in generated reports. A related bug in the cited-rules half was fixed the same day: reference-only rules were showing all 17 rows unconditionally instead of gating on whether the subject applies. Both are **not yet exercised on-device.**

**Ongoing, multi-session:** the Purple Digest "volumetric depth push," bringing all 18 non-Hashimoto's conditions to the same ~176-entry depth Hashimoto's has. Tracked in the live Depth Tracker artifact and committed in small, individually-verified batches.

## What this app is

**Inside Story** was chosen after ruling out Aurelia, Chrysalis, Monarch, Second Nature, Food Sense, FoodFlex, and Backstory, each of which had a real collision. It is a genuine English idiom, not an invented word.

**Never describe this as a Hashimoto's app, or even only an autoimmune-conditions app.** The creator's own framing: "everything has an inside story… This app started to help with Hashimoto's, then decided to help with 18 other conditions, then has grown from there to include basically everything in life revolving around a person." Describe it as an everything-about-a-person's-life app that started with, and runs deepest on, food and autoimmune health. Garden, budget, family, soil microbiome, and the body are all in scope.

**Scope, stated directly:** "this is no longer just focused on Hashimoto's, it is focused on all 19 both individually and if a person has multiple of them combined." Every one of the 18 non-Hashimoto's conditions is a standing target for the same depth, not a lesser tier. Combined-condition (polyautoimmunity) management is its own named scope item, not yet built as a first-class destination.

### The core purpose (read before any scope trade-off)

Help someone with an autoimmune condition relearn how and what to eat, and understand, personally and for their own body, how food affects them. Meal building, shopping lists, and scheduling are scaffolding that make daily use sustainable enough to generate that understanding. They are not the point. **When in doubt about priority, favor whatever helps someone discover and act on their own personal food-effect patterns over convenience features.**

Gut and microbiome healing is an explicit goal, not a side effect. The app is meant to actively help repair gut health, not just avoid trigger foods.

The user's own reframing: people are overwhelmed and confused about food and can't put the pieces together themselves. The app's job is to remove that cognitive burden entirely, doing the correlation and discovery work *for* the person so daily eating becomes following clear, pre-solved rules. The complexity lives inside the app; what the person experiences is ease. **This makes discovery and trend-finding something the app does on the user's behalf, not a task handed to them.**

### International scope

Not US-centric. Three distinct components:

1. **Cited international and regional epidemiological data per condition:** how prevalence and severity vary by country or region, for all 19 conditions, with cited corroborating explanation (genetics, diet, environment, latitude, screening practices). One "Global Perspective" entry per condition, in progress.
2. **i18n architecture, decided but not built.** Languages: all common English variants (US, UK, AU), Spanish (Latin American and Spain), German, French, Finnish, Norwegian, Swedish, Japanese. **Chinese and Italian were removed 2026-08-10 by direct instruction.** No i18n library is wired in: no `expo-localization`, no `react-i18next`, no string extraction has been done. This is substantial engineering work, deliberately not half-started.
3. **Country-specific reference data.** The 22,022-food database already draws on 7 national sources (US, Canada, UK, Germany, Australia, France, Japan). Real gaps: no Spanish-speaking country's data, and no Nordic source yet.

## Standing rules

These are behavior-changing and apply to every session:

- **The Digest owns full content; the tool areas own data.** Direct instruction, 2026-08-18: "Think of the Digest as being where we pass along full read knowledge and the rest of the areas are for collecting data, manipulating it, and reporting it in meaningful ways." Tool-area screens use compact rows (one line of primary text, one muted caption); full descriptions open on tap via `showInfoAlert()`, never sitting permanently on screen. Data-entry forms are the exception and stay as `formCard`s.
- **Never frame Hashimoto's as more central than the other 18 tracked conditions** (memory key `feedback_no_hashimotos_primacy_framing`).
- **Home cooking over commercial and branded products.** Don't expand branded or commercial reference entries. The intended path for a store-bought item is the barcode scan, not a generic "commercial" or "préemballée" entry.
- **Writing style in app content, and in this document:** avoid the filler words "real," "genuine," and "genuinely." **No dashes used in place of ordinary punctuation:** no em dashes, no en dashes, and no " -- " double-hyphen pattern. Rewrite with a colon, a comma, parentheses, or a second sentence instead. Hyphens in ordinary compound words (self-declared, on-device, read-write) are fine. Run a field-scoped self-check for both the filler words and the dashes before calling content work done.
- **Evidence tiering is non-negotiable.** Every claim carries an honest evidence tier. A personal hypothesis must never be presented as verified medical fact, including in any doctor-facing report. Functional-medicine root-cause staging is not mainstream endocrinology consensus, and the app must not imply otherwise.
- **Verification before "done":** `npx tsc --noEmit` clean across the project, `npx eslint` clean on every touched file, and `git diff --stat` reviewed. On-device confirmation is a separate step and should be stated honestly as pending when it hasn't happened.
- **Metro staleness:** check whether the dev server is serving stale code before re-guessing the code (memory key `feedback_metro_staleness`). Note the 2026-08-02 counter-case: staleness can also live inside React itself, for example `useRef(fn).current` freezing a callback at first render so Fast Refresh silently ignores every later edit.
- **Do not hand-translate remaining untranslated France_Ciqual, Norway, or Sweden rows in `foods_reference.db`.** The unified database already has them fully translated via a tested pipeline, and the owner's call is to hold until Phase 5 (merge) and Phase 7 (swap) below are done. Roughly 1,400 France_Ciqual rows already translated by hand stay live in the meantime.

## Technology stack (decided)

- **React Native on Expo**, chosen over Flutter for its broader third-party ecosystem (OneDrive, Google Drive, push notifications, store billing, encrypted local storage), which matters for a solo builder.
- **Why Expo:** dev hardware is a Windows PC plus an Android phone, no Mac (a daughter's iPhone is available for occasional testing). Expo Go runs the app live on the phone with no native build step, and EAS Build compiles installable and iOS builds in the cloud, so a Mac is never required.
- **Builder's background:** 30 years as an IT Manager, some scripting, no prior mobile development, and a strong track record learning new technical domains. Building this personally with step-by-step direction and code-level help from Claude Code in VS Code.
- **Platform scope:** Android, iPhone, Windows, Mac. Desktop runs on Expo's web target configured as an installable PWA. Windows ships through PWABuilder to MSIX to the Microsoft Store (no platform fee); Mac is a browser-installed PWA, deliberately avoiding Apple's $99/year Developer Program and notarization.
- **Config plugins:** `plugins/withAutofillDisabled.js` and `plugins/withWindowBackground.js` are the established pattern for native config changes Expo has no first-class field for.

## App navigation structure

Hub-and-spoke, replacing the original four-tab plan as of 2026-07-22: a central popup-menu button (`TabHub`) instead of a persistent bottom tab bar, plus left/right swipe between tabs (`SwipeableTabScreen`). Screens with internal sub-tabs (Insights, Schedules) get a secondary hub (`LensHub`). **`constants/tabs.ts` is the single source of truth for the tab list.**

Tabs: **Home**, **Food**, **Insights**, **Schedules**, **Trends**, **Bio-Compass**, **Reports**, **Purple Digest**.

Schedule sub-domains: Meals, Hydration (including supplements and electrolytes in water), Supplements, **Prescriptions** (renamed from "Medications" by explicit decision), Doctor Appointments (with device calendar integration), and Exercise.

## Architecture decisions

*Cloud backup, sync, encryption, and household sharing are decided but **not implemented**. All app code so far is local-only and single-device. The local encrypted backup/restore and device-to-device recipe sharing that shipped in August are different, narrower features and did not become this.*

**Local-first, no company server holding health data.** The authoritative database lives on the primary account holder's device. There is no backend storing anyone's health data. This is a deliberate trust stance, not just a technical choice.

**Encrypted backup to the user's own cloud drive** (their OneDrive or Google Drive, their storage), serving as disaster recovery, multi-device sync, and household-sharing transport. Encryption is protected by a master password or a locally-generated recovery key shown once at setup. The app never holds the key, so there is intentionally **no "forgot password" flow.**

**Multi-device sync model:** the encrypted cloud snapshot is the current state, not just a backup. A device pulls it, decrypts locally, works fully offline against it, and pushes an updated snapshot back. Three layered safety mechanisms prevent concurrent edits:

1. *Locking.* The first device to pull holds exclusive control, recorded in cloud metadata. Control persists until the app closes, the screen locks, or an inactivity timer fires.
2. *Active takeover.* A second device sends a **visible, tap-required** push to the controlling device, deliberately not a silent push, which iOS and Android throttle unreliably. If unanswered in 1 to 2 minutes, the requester is offered "take control anyway," shown exactly how stale the other device's last save was.
3. *Stale-lock expiration.* A hard 30-minute maximum lease, so an unreachable device can never permanently lock someone out.

Underneath all three: last-write-wins plus a visible activity log. Deliberately not a CRDT system, a choice validated by AnkiWeb's own mature sync falling back to one-way overwrite when changes can't merge.

**Household sharing, two access tiers** reading from a shared cloud folder:

- *Free viewer companion.* Reads periodic snapshots from a natively-shared cloud folder, modeled on Anki shared decks (one-way periodic reimport, no live subscription). Sees meal schedule, shopping list, and trend reports. One narrow write exception: **checking off shopping-list items** and marking scheduled tasks done. These are idempotent, single-field, low-conflict actions sent back as a small delta file, needing no merge logic.
- *Paid interactive companion.* Read-write access to a shared "household domain" (meal plan, shopping list, schedule) but **never** the primary's personal health domain (symptoms, labs, supplements, scoring history), which stays unreachable by any companion account.

Cross-provider sharing (OneDrive on one end, Google Drive on the other) does **not** require matching providers. The sync mechanism that makes that work is deliberately deferred to its own design pass.

**Sharing between people: the `.is` format.** `.is` is intended as the one general-purpose file format for anything shareable: recipes and favorites (built), plus future gardening, exercise, and other non-health content. A person's health domain stays outside it, since that's the tier model's job. Build the payload shape generically from day one (an envelope type per content kind), not recipe-specific.

The standing security target, in the owner's words: "for data to be shared between two people who have the app, one of them had to send an invitation from the app to the other and the other had to accept it for their encrypted link to be associated to each other. If that encryption code is wrong from the person when you receive the data then it isn't accepted. Only the app knows what that code is between the two." Alongside that, a standing **Connections roster** so a repeat share doesn't need re-pairing, and OS-level `.is` file registration so tapping a received file from WhatsApp, email, or a file manager opens this app directly.

**Ordered prerequisite list for the security work** (given directly 2026-08-15, so it survives across sessions):

1. **Pick a cryptography library.** `expo-crypto` only does hashing and secure random bytes. The well-precedented choice is NaCl-based (`react-native-libsodium` or `tweetnacl-js`) for Ed25519 signing, X25519 exchange, and XSalsa20-Poly1305. Make this an explicit decision, since it affects bundle size and whether a native rebuild is needed.
2. **Per-device identity.** A keypair generated once on first use, private key in `expo-secure-store` (Android Keystore, iOS Keychain), never plain SQLite or AsyncStorage. Buildable and testable standalone.
3. **Local Connections table.** Name, other person's public key, pairing date. Testable with seeded data.
4. **The invitation and pairing exchange**, the biggest and most novel piece. Two devices with no server need an out-of-band public-key swap with explicit accept on both sides. A QR code deserves direct consideration: it's the pattern Signal and WhatsApp use for device linking, and Expo already bundles camera and barcode scanning.
5. **Sign (and optionally encrypt) the existing envelope shape.** `ShareEnvelope`, `encodeEnvelope`, and `decodeShareEnvelope` in `lib/sharing.ts` already define the payload. Add signature verification against the stored public key, rejecting outright on mismatch.
6. **`.is` OS-level file-type registration, deliberately last.** Android intent-filter and iOS document-type changes in `app.json` via a config plugin, plus a native rebuild. It's only a different delivery mechanism for the same signed envelope, so doing it first would burn a rebuild cycle on a payload shape that may still change.
7. **Extend beyond recipes** to gardening, exercise, and so on. Mechanical once 1 through 6 exist.

None of this is started. It should be designed and built *together with* real tier-separation work, not as a separate phase beforehand.

**Reminders and scheduling: contextual from day one, not clock-based.** "Take your levothyroxine" should account for what's actually been logged, since a calcium-rich food earlier pushes the safe window later. Two mechanisms: fully local on-device scheduled notifications for anything self-contained, and a minimal **content-blind** push relay (APNs/FCM) purely for cross-device wake-up signals, never carrying health content. Background execution is throttled on both mobile OSes, so instant recomputation is only guaranteed in the foreground. Design around that. Reminders should show their own freshness ("based on food logged as of 7:45am"), because a confidently-wrong contextual reminder is worse than an honestly-uninformed static one.

**Interaction rules engine, two kinds, kept visually distinct:**

- *Built-in cited rules.* Prescription, supplement, and food timing interactions (levothyroxine with calcium or iron, biotin interfering with thyroid assays), authored with the same citation discipline as the nutrition database. Should ship as a versioned data file updatable independently of app releases.
- *Personal rule builder* (built 2026-08-18). The person's own discovered pattern or their doctor's specific instruction, always labeled distinctly.
- *Synergy to build toward.* The trend engine surfacing candidate personal rules from observed patterns: "you've logged fatigue within a day of high-goitrogen meals four times this month, want to turn that into a rule?" The Pattern Finder to rule shortcut is the natural next step and was explicitly deferred out of the 2026-08-18 build.

**Late and retroactive logging** must be low-friction: guided quick-select (what did you eat, pick from favorites or recents, when did it happen, smart time picker), never a blank form. Every late entry immediately shows its consequence (recalculated schedule impact), turning logging into a teaching moment. Scheduled reminders double as catch-up checkpoints.

**Reporting.** Doctor, nutritionist, trainer, and self reports are different views over the same timestamped, taggable log data, with every entry timestamped and taggable from the start so reporting is a query rather than a rebuild. Reports generate entirely on-device (PDF export, no server rendering), consistent with the privacy model. A laid-out PDF export (needing `expo-print` and `expo-sharing`) is deferred.

## Monetization tiers

Five priced tiers plus one bundled role, decided 2026-08-08. Full reasoning and feature matrix in the [Household & Monetization Tiers artifact](https://claude.ai/code/artifact/e153d351-52c7-4df5-a4c1-e134ff86c085).

| Tier | Price | Scope |
|---|---|---|
| **Free** | $0 | All eleven builders; Insights limited to Food Lookup (no condition scoring); Schedule limited to Meals, Hydration, and Exercise; Trends exercise-only; no Signals, Reports, or rules engine. Purple Digest is replaced by **"Food Basics,"** a differently-iconed tab with only the general-knowledge categories (proposed: Food Additives, Food Industry & History, Nutrient Interactions, Mitochondria & Metabolism, Complementary Therapies, Glossary). It re-brands in place on upgrade rather than being a second feature. |
| **Individual** | $9.99/mo, $89.99/yr | The 1.0x base unit. Everything Free lacks: full condition scoring, full rules engine, Trends, Reports, full Schedule, complete Purple Digest, and sync across the person's own devices. |
| **Partner** | $14.99/mo, $134.99/yr for both (~1.5x) | Two people, each with full Individual access to their own data, plus granular opt-in per-category visibility into each other's. Meals and shopping are shared by default; symptoms, labs, and notes are private by default; medications are an explicit choice at setup. Symmetric, and not an extension of the household model. |
| **Household / Family** | Free for first 2-3 seats, then $1.99/mo, $17.99/yr per seat (~0.2x) | Read access to shared meal plan, shopping list, and Trends summary, with one narrow write exception (shopping-list checkoffs, marking tasks done) and no visibility into the subscriber's personal health domain. |
| **Guardian** | $0, bundled with Individual or Partner, per child | A parent's own minor children only. Full condition tracking enabled per category by the parent, who retains full read/write, while the child's own access is granularly configured at the parent's pace. Legally simpler than Caregiver. |
| **Caregiver** | $4.99/mo, $49.99/yr per cared-for person (~0.55x) | Write access to another adult's meals, medications, symptoms, and schedule on their behalf. **Not** for a parent's minor children. Requires the cared-for person's consent when they have capacity; otherwise a plain attestation step, deliberately deferring the legal guardianship question rather than arbitrating it in-product. Works even when the cared-for person has no device. Stackable. |

**Addons, later:** sleep tracking, exercise tracking, and lab result trending.

## Healing-journey stages

Decided 2026-07-31. Both halves (self-declaration with advisory, and reordering) shipped 2026-08-09 across 6 staged conditions: Hashimoto's, IBS, Celiac, IBD, Chronic Kidney Disease, and Gout. That is the full list of citable staged-food candidates across the 19.

Implementation: `lib/healingStage.ts`, `lib/healingStageAdvisory.ts`, `lib/conditionStages.ts`, `lib/conditionStageAdvisory.ts`, `lib/foodStageReordering.ts`, plus per-condition advisory modules, wired into all direct-ingredient Food builders, Profile, and `components/FoodLookup.tsx`.

**Framework:** the 5-stage healing and regression model (distinct from disease-progression staging), associated with Dr. Izabella Wentz: 1. Triage, 2. Digging, 3. Gut Repair, 4. Rebalancing, 5. Maintenance. Self-declared at setup, then adjusted over time by the existing Assessment. The app *suggests* a stage change and never silently reclassifies.

**What stage does: advisory and reordering only, never gating.** Stage-appropriate foods surface first, and anything questionable gets a color-coded flag linked to an explanation. Nothing is ever hidden or blocked.

**Evidence honesty.** Of the supplied sources, exactly one claim carries strong trial-level evidence: selenium reducing TPO antibodies, backed by a meta-analysis of 21 RCTs. Everything else is practitioner framework, case report, or survey data. The thiamine claim is a **3-patient case report**, not the "landmark clinical pilot trial" it was described as; gluten, dairy, and soy trigger rankings come from one practitioner's self-reported audience survey; and the staging framework itself is its own author explaining it. That is fine to build on **provided the app labels it honestly.** The full source table with per-claim tiers is in the archive.

**Practical scoping:** only stages 2 and 3 meaningfully drive *food* decisions. Stages 1, 4, and 5 are about hormone dosing, nutrient correction, adaptogens, sleep, and labs. Five stages are right for education, but builder rules will key off fewer distinctions.

## The Unified Whole-Foods Database

`unified-database/` is a separate SQLite database (`unified_foods.sqlite`, ~115MB) and Node.js pipeline started 2026-08-10, built to become a richer, fully-auditable successor to `assets/data/foods_reference.db`. **Not merged, not wired to the app in any way.** `lib/db.ts` never reads from it and no screen touches it, so it is safe to iterate on indefinitely with zero risk to the live app.

**Why:** the current reference DB is the output of a one-time ad hoc Python filter script whose reasoning was never captured as testable rules. The unified pipeline rebuilds it reproducibly, discarding nothing (every original record survives in `raw_foods.raw_json`), classifying by a versioned unit-tested rule engine, matching across sources by species, Latin-name, and LanguaL evidence rather than fuzzy name guessing, and reviewing human-in-the-loop via a published audit tool.

**Architecture:** `sources` (9 registered) feeds `raw_foods`, which feeds `raw_food_nutrients` and `whole_food_classifications` (with a `reviewed` flag protecting human overrides from automated re-runs), which feed `food_match_groups` and `food_match_members`. One script per pipeline stage lives in `pipeline/`, each with a DB-backed test suite (391 passing). One adapter per source lives in `sources/`, so adding source #10 means registering it plus writing one adapter.

**Status (this drifts, so verify via `sqlite3.exe unified_foods.sqlite` rather than trusting these numbers):** all 9 sources ingested, classified, and matched. 32,707 raw records, of which 16,661 are classified whole-food, 13,093 are not, and 2,953 are unresolved. 14,521 match groups. The audit tool is live at https://claude.ai/code/artifact/51c33d40-cbd9-4468-90b0-e1e460fd5b1d, and review has started (242 classification decisions applied) but is nowhere near complete.

**Phases:** 1 (schema and pipeline) and 2 (ingestion) are done. **3 and 4 (human review) have tooling done but review barely started, and this is the standing next step.** 5 (merge the app's curated D1-D6 and condition scores, aliases, and interaction rules onto the new master rather than re-deriving them), 6 (automated integrity verification), and 7 (the atomic reversible swap, gated on `REFERENCE_DB_VERSION`) are not started. Nothing here is urgent or blocking.

**If picking this up fresh:** read `unified-database/README.md` in full first.

## Related projects

**The nutrition database** (`hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx` and `whole_foods_database_v5.sqlite` at `C:\Users\TonyR\OneDrive\Desktop\AppProject`) holds 22,016 foods across 7 national sources with the 6-dimension scoring rubric (D1 through D6). It already ships inside the app as bundled reference data via `scripts/build_food_reference_db.py`, verified with zero data loss. These are two different tracks with different cadences: the reference DB is re-imported when the source workbook changes, never hand-edited in this repo.

**The companion book** teaches the same Six Food-Friendliness Dimensions in prose, centered on the author's wife's health journey. Detail is in the [Companion Book page](https://app.notion.com/p/3a853652f27281358526f3ef3f7f92c0). **The Purple Digest content and standalone research artifacts do double duty as source material for this book:** "All of the documentation will also be used in my book that will be referencing the app." Treat the research track with the same weight as feature work, written in a form (real citations, honest evidence tiering, plain language) that transfers directly into manuscript writing.

## Named, unresolved risks (product, not engineering)

1. **Logging discipline and retention.** The single biggest risk to the whole vision is whether a person will log consistently enough, over weeks and months, for contextual reminders and trend correlation to mean anything. Most health-tracking apps fail here, not on missing features. Worth testing this assumption cheaply before building the full data model around it.
2. **Signal quality.** Whether symptom and food correlation-finding on noisy, confounded, n=1 personal data surfaces real patterns versus things that merely look like patterns. Must be handled honestly in-product, showing confidence and never asserting causation.

## Open next steps

Audited 2026-08-18 against the Status history and the live codebase. These are the items confirmed genuinely open:

1. **Pattern Finder to personal rule shortcut**, the one piece explicitly deferred from the 2026-08-18 rules-engine build. Small, self-contained, and it closes the "loop between passive tracking and actionable personal knowledge" the architecture section names. The most natural next thing, but **confirm with the person before starting** rather than assuming it.
2. **On-device walkthrough of the personal rules feature.** Add a food-linked rule and confirm it surfaces once a matching food is logged; add a treatment-linked rule and confirm it tracks that treatment's active state; pause, resume, and delete from the management list; generate a Report and confirm the new section reads correctly. Also confirm "Worth knowing (reference only)" now shows nothing for someone tracking no relevant treatments.
3. **Ingredient-rotation feature:** permanent vs. rotating ingredients in smoothies and salads, schedule-aware for accurate shopping-list generation. Unbuilt since its original 2026-07-23 research, with no schema yet.
4. **Cloud sync, multi-device, and the Partner/Household/Guardian/Caregiver tier model**, still architecture-only. The local encrypted backup and restore (2026-08-16) and device-to-device recipe sharing (2026-08-15/16) are different, narrower features and did not become this.
5. **Left/right-handed layout switching** for the hub button and its menu, deferred "toward the end of the project" during the 2026-07-22 navigation redesign, and untouched.
6. **A home category for protein and meal-replacement powders.** Confirmed they don't belong in `Brewing & Infusions` alongside tea, coffee, and cocoa. Currently under `Bev > Protein & Meal Replacement` (17 rows) plus a few in `Mixed`. No decision yet on whether to expand `SupplementPowder` or add a category.
7. **The same open question for juice, lemonade, and fruit-drink powders.** 7 dry powders currently sit under `Bev > Soft Drinks` and `Bev > Other`, kept out of `Brewing` for the same reason. Could plausibly share whatever category resolves item 6.
8. **Sticky group headers spot-check** on the larger, messier categories (Fish, Mixed, Baked; Veg has 322 headers, Mixed 303, Meat 291). Confirmed working on Dairy & Eggs 2026-08-02 via the hand-rolled `onViewableItemsChanged` overlay, but Dairy's header count doesn't guarantee the big ones behave identically.
9. **A "home brew" ingredient-based path for beer, wine, and spirits**, named 2026-08-02: "home made beers and wines and even vodka could be a fermentation that could be created from whole foods." Distinct from barcode scanning, which covers *packaged* alcohol, and closer to how Fermentation Builder already works. No design work done.
10. **The synthetic "Choline Bitartrate (Supplement Powder)" food row**, proposed by `scripts/add_supplement_powder_category.py` but deliberately not added. A small separate call whenever it's wanted.
11. **The unified database's Phase 3 and 4 human review**, the standing next step on that track (see its section above).
12. **Fermented Drinks workstream: the 19-condition crosslinks**, the one remaining piece from the workstream started 2026-08-20 (see Status snapshot above — both recipe waves, 45 total, plus the Tracker UI and My Fermented Drinks, are done). One new "Fermented Drinks & Foods for [Condition]" Digest entry per tracked condition (all 19), cross-linked both directions with the Basic Health/Recipes content, naming which of the 45 recipes genuinely help each condition and why, plus condition-specific cautions.
