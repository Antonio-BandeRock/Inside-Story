# Garden tab: competitive review

Checked 2026-09-25. Read-only review; nothing in the app was changed.

## Progress

- [x] App inventory
- [x] Planta
- [x] Seedtime
- [x] GrowVeg / Almanac Garden Planner
- [x] Gardenize
- [x] From Seed to Spoon
- [x] Ecowitt (soil and weather sensors; replaces GrowDiaries, which is a cannabis grow community with no published price)
- [x] AC Infinity app (sensor controllers)
- [x] PictureThis (with Pl@ntNet as the free alternative)
- [x] Planter (square-foot planner)
- [x] Gap synthesis and ranked recommendations
- [x] Pricing summary

## 1. What the Garden tab does today

Source: `app/(tabs)/garden.tsx` and the `lib/` and `components/` modules it pulls in. Nine lenses:

| Lens | What it does | Where it lives |
|---|---|---|
| My Zone | USDA hardiness zone from a country plus postal code, anywhere on Earth (official USDA data for US ZIPs, otherwise a Nominatim geocode plus Open-Meteo historical minimum temperatures), and cited crop guidance for that climate band | `lib/gardenZoneLookup.ts`, `lib/gardenZones.ts` |
| Plots & Plantings | Garden areas (outdoor, indoor, greenhouse) with space type, sun or lights, size, zone; plantings tied to a scored reference food, with a variety note, planted date, expected harvest window and a status (Growing, Harvested, Failed, Pulled out). Past Areas keep history readable. Each area has a Grow Setup (lights, containers, hydroponics, fans, meters, anything named) with purchase and running cost and monthly power draw | `garden_plots`, `garden_plantings`, `garden_equipment`, `lib/growSetup*.ts`, `components/GrowSetupSection.tsx`, `lib/gardenAreaLifecycle.ts` |
| Days Until | Countdown counters per area or per planting (germination, transplant, first harvest), a reminder on the day, kept as a record once done | `garden_countdowns`, `lib/countdown.ts` |
| Harvest Log | What was picked and how much; anything not yet used becomes a "From Your Harvest" ingredient in every Food builder with full nutrition and condition scoring. Surplus can be sold, traded or given, and gifts from other gardens are recorded | `garden_harvests`, `harvest_uses`, `harvest_dispositions`, `harvest_shares_received`, `lib/harvestTrade*.ts`, `lib/harvestYield*.ts` |
| Upcoming Tasks | Dated garden chores, stored as schedule items | `garden_task_links`, `schedule_items` |
| Compost | One band per pile, bin or worm bin; greens and browns in, turns, watering, temperature, squeeze test, finished compost out to a plot; reads back what the pile needs | `compost_piles`, `compost_events`, `lib/compost.ts`, `components/CompostLens.tsx` |
| Growing Conditions | Hand-entered readings (soil moisture, temperature, pH, EC, rain, water given, anything named), unit families converted only where they mean the same thing, monthly summaries. A `source` column of `hand` or `device` is ready for sensors | `garden_readings`, `lib/growingConditions*.ts`, `components/GrowingConditionsLens.tsx` |
| Growing Costs | Every growing cost is also a budget entry on Life > Finances; costs by area or combined cost groups set against what the garden gave back; Electricity band compares bills from before the grow with bills since, per day | `garden_cost_*`, `electricity_bills`, `lib/gardenMoney*.ts`, `components/GrowingCostsLens.tsx`, `components/ElectricityBand.tsx` |
| Horticulture | Cited reading: the hardiness zone map, crop guidance for four climate bands, containers, pollinators and soil | `lib/digest/homeGardening.ts`, `components/DigestCategoryLens.tsx` |

Around the tab: Trends > Garden Yield and Trends > Growing Conditions read these records back over time; saving a meal offers to take what it used off the garden's remaining harvest (`offerGardenUse`); a garden report exists in Reports (`lib/reportKinds.ts`).

**What is not there** (confirmed by searching the code): no visual bed layout or map, no planting calendar keyed to frost dates (no frost-date data anywhere outside reading content), no companion planting rules, no succession planting, no crop rotation warnings, no plant identification or disease diagnosis by photo, no photos on a planting or area, no weather forecast in the garden (Home has a sky card from `lib/homeSky.ts`), no watering reminders driven by plant needs or weather, no seed inventory, no sensors connected.

**Planned, not built** (CLAUDE.md, "Growing conditions as a record"): stage 1 DIY sensors on the home network (zeroconf, static server already compiled in), stage 2 cameras over RTSP or ONVIF (native module, rebuild), stage 3 commercial cloud accounts over OAuth. Only stage 0, the hand-entered record, is approved and built.

## 2. Competitors

### 2.1 Planta (plant care assistant)

**What it is.** A care-schedule app, strongest on houseplants but covering vegetables and herbs. Android, iPhone. Plant ID by photo, a light meter using the phone camera, care reminders (water, fertilize, mist, repot) adjusted to the plant, the pot, the room light and local weather, and "Dr. Planta" photo diagnosis of sick plants.

**Pricing.** Free tier limited (basic reminders). Premium $35.99 a year; alternative billing seen as $7.99 a month or $17.99 for three months. No lifetime. Sources: [Growli price survey, App Store listings read 27 to 28 July 2026](https://www.getgrowli.app/blog/plant-app-prices-2026); [Alibaba Gardening review](https://gardening.alibaba.com/plant-care/planta-app). Checked 2026-09-25. Regional prices differ (UK is set separately).

**What it does well that Inside Story does not.**
1. *Care reminders computed from the plant, not typed by hand.* Inside Story's Upcoming Tasks and Days Until are dates the person sets. Planta works out "water in 3 days" from species, pot size and light.
2. *Plant ID and diagnosis by photo.* Inside Story has no camera use on Garden at all.
3. *Light meter.* Uses the camera to estimate light at a spot. Inside Story asks the person to describe sun or lights.
4. *Weather-aware skipping.* Rain pushes the next outdoor watering.

**What Inside Story already does better.** Planta stops at the plant. It has no harvest log, no idea what a harvest weighs or what it is worth, no link from a picked tomato to a meal or a nutrient, no costs, no electricity, no compost, and no condition-aware reading. Planta also keeps your plants in its cloud account; Inside Story keeps them on the device.

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Suggested care cadence per crop (water every N days by crop and space) | A cited per-crop table in a new `lib/cropCare.ts`, read by `components/GrowSetupSection.tsx`'s area and by the Upcoming Tasks lens to offer a repeating `garden_task_links` series; the reminder goes through the existing dated-reminder kinds | JS, over the air | None, all local | Medium |
| Rain skips a watering | Read the forecast the Home sky card already fetches (`lib/homeSky.ts`, Open-Meteo, coarse location) and add a line to the task: "rain of 8 mm forecast, you may not need this" | JS | Uses the coarsened location Home already has; opt-in stays as is | Small |
| Photo diagnosis and ID | See PictureThis below; needs an outside vision service | JS if a web service, native if on-device | Conflict: a photo leaving the phone | Large |
| Light meter | `expo-sensors` LightSensor (Android only; already in package.json) on the area form, saved as a `garden_readings` row of kind light | JS, since `expo-sensors` and `expo-camera` are already compiled into the app; no rebuild | None | Small to Medium |

### 2.2 Seedtime (garden planner and calendar)

**What it is.** A US-built vegetable garden planner: web, Android and iPhone. Its core is a planting calendar worked out from the person's last and first frost dates (when to start seeds indoors, transplant, direct sow, harvest), plus a drag-and-drop bed layout ("Garden Blocks"), companion planting, a task list, a journal, an AI planning assistant, and on the higher plan seed inventory, harvest tracking and weather.

**Pricing.** Free forever: 1 calendar, 1 layout of up to 8 rectangular beds, 10 AI credits a month, companion planting, unlimited tasks and journal. Basic: $7 a month billed yearly ($84 a year) or $10 month to month; adds custom varieties, perennials, weather. Top plan: $14 a month billed yearly ($168 a year) or $20 month to month; unlimited calendars and layouts, inventory, harvest tracking and analytics, full weather. 7-day trial, 30-day money back. No lifetime seen. Source: [seedtime.us/pages/pricing](https://seedtime.us/pages/pricing), checked 2026-09-25. Frost dates are worldwide per the page.

**What it does well that Inside Story does not.**
1. *Frost-date planting calendar.* This is the feature gardeners open the app for. Inside Story knows the hardiness zone (average winter low) but not the last spring frost or first autumn frost, which is what timing actually hangs on.
2. *Visual bed layout.* Draw beds, drop crops into squares, see spacing.
3. *Companion planting hints* when two crops sit side by side.
4. *Succession sowing*: a crop can be scheduled in waves every two or three weeks.
5. *Seed inventory* on the paid plan.

**What Inside Story already does better.** Seedtime's harvest tracking counts pounds. Inside Story turns a harvest into a scored ingredient, follows it into meals and nutrients, and sets it against what growing it cost, including the electricity bill. Seedtime has nothing on indoor grows, equipment, compost chemistry, or readings. Inside Story's cited Horticulture reading and hardiness zone lookup work anywhere on Earth without an account. Seedtime is also priced high at the top ($168 a year) for one topic.

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Last and first frost dates | Extend `lib/gardenZoneLookup.ts`: it already pulls Open-Meteo historical daily minimums for the location; the same series gives the median date of the last 0 °C night in spring and the first in autumn. Store beside the zone in `app_meta` and show on My Zone | JS | Same coarsened postal-code lookup already used for the zone; no new data leaves the phone | Small to Medium |
| Planting calendar from frost dates | A new cited table of weeks-before or after last frost per crop, keyed to the same reference food ids `garden_plantings.food_id` uses (a new `lib/sowingWindows.ts`), shown on My Zone as "this month: start peppers indoors" and offered when adding a planting to prefill `expected_harvest_start`/`_end` and a Days Until counter | JS | None | Medium to Large (the crop table is the work; it needs citations like everything else) |
| Succession sowing | A "repeat every N days, K times" option in the Add Planting form in `app/(tabs)/garden.tsx` that writes several `garden_plantings` rows and their counters | JS | None | Small |
| Companion planting | A cited pair table (`lib/companionPairs.ts`) read when a planting is added to an area that already holds another crop; a caption, never a block. This is a Rule Engine item (point 4 style), and the evidence for most companion claims is thin, so it must carry evidence tiers | JS | None | Medium |
| Visual bed layout | A grid editor using `react-native-svg` (already installed); needs `grid_x`, `grid_y`, `span` columns on `garden_plantings` and a width and length on `garden_plots` (today size is free text in `size_description`) | JS, no rebuild | None | Large |
| Seed inventory | Could live in Life > Kitchen's location model or as a new `garden_seeds` table with packet date and germination viability; a planting draws down a packet | JS | None | Medium |

### 2.3 GrowVeg Garden Planner (also sold as the Old Farmer's Almanac Garden Planner)

**What it is.** The longest-running garden layout planner (since 2008), from Growing Interactive in the UK. The same engine is licensed to the Old Farmer's Almanac (gardenplanner.almanac.com) and several seed companies. Runs in a browser on desktop and mobile, with a tablet app. Draw the garden to scale, drop crops in with correct spacing (including square-foot mode), and it produces a planting chart for each crop from the frost dates of the nearest of about 5,000 weather stations. Colour-coded crop rotation warns when a crop family goes where the same family grew recently. Companion-planting filter, succession planting, emailed sow and plant reminders, a garden journal, and pest and beneficial-insect guides.

**Pricing.** 7-day free trial, no card needed. Then $35 a year auto-renewing, or $50 for one year and $85 for two years paid once (US/Canada version, USD). Almanac version is priced the same way on its own site. No free tier beyond the trial; annual billing only. Source: [growveg.com/subscribeinfo.aspx](https://www.growveg.com/subscribeinfo.aspx) and [gardenplanner.almanac.com/subscribeinfo.aspx](https://gardenplanner.almanac.com/subscribeinfo.aspx), checked 2026-09-25. A third-party review in April 2026 quoted $29 a year, so treat $29 to $35 as the range.

**What it does well that Inside Story does not.**
1. *Crop rotation memory.* Because every season's plan is kept, it warns "brassicas grew here last year." Inside Story keeps every planting forever (Past Areas, statuses) but never reads that history back as a rotation warning.
2. *Scale layout with spacing* and a square-foot mode.
3. *Frost-date planting chart per crop* from local station data.
4. *Emailed seasonal reminders* ("sow carrots outdoors this week").
5. *Pest and beneficial-insect identification guides*, regional.

**What Inside Story already does better.** GrowVeg is a planner: it barely touches what happens after planting. No harvest weights, no cost or electricity, no compost, no indoor grow equipment, no readings, no meals. Inside Story's history of what grew where, with statuses and harvests, is the richer record; it just is not read back yet.

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Crop rotation warning | Needs a crop family per reference food (nightshade, brassica, legume, allium, cucurbit, umbellifer, other). A small lookup keyed on `food_id` (a new `lib/cropFamilies.ts`, or a column in `foods_reference.db` only after asking which database, per the CLAUDE.md warning). When adding a planting, read earlier `garden_plantings` in the same `plot_id` from the last two or three years and show a caption. Never blocks | JS | None | Small to Medium |
| Pest and beneficial insect reading | A new subgroup in the Horticulture lens (`lib/digest/homeGardening.ts`), following the Digest pattern rules (subgroups past about 12 entries) | JS | None | Medium (writing and citations) |
| Seasonal "this week" nudges | Once frost dates and sowing windows exist (see Seedtime), a monthly dated reminder through the existing reminder kinds, with a Profile switch | JS | None | Small, after the calendar exists |
| Layout and frost chart | Same as Seedtime above | | | |

### 2.4 Gardenize (photo garden journal)

**What it is.** A Swedish garden journal: Android, iPhone, and a web app for paying users. Each plant and each area builds a photo diary with notes and tagged events (watered, pruned, fed), a calendar of to-dos with care reminders, care tips by hardiness zone, a plant database, and plant ID by photo (iOS first).

**Pricing.** Free: unlimited plants, areas and events, the planner, zone care tips. Plus: $8.99 for one month, $6.66 a month for three months (about $20), $3.74 a month for twelve months (about $44.88 a year), each with 14 days free. Third-party roundups in 2026 quote $24.99 a year and a $99.99 lifetime, which is not on the official page today, so the lifetime may be App Store only or discontinued. Sources: [gardenize.com/subscriptions](https://gardenize.com/subscriptions/) (official), [Leaftide 2026 roundup](https://leaftide.com/compare/best-gardening-apps/). Checked 2026-09-25.

**What it does well that Inside Story does not.**
1. *Photos on everything.* A dated picture on each plant and area is the heart of the app and the simplest way to see a season. Inside Story has no photo on a planting, an area, a harvest, or a compost pile.
2. *Event log per plant* with quick tags. Inside Story logs events on compost piles (turned, watered, temperature) but not on a planting.
3. *Export* of the whole garden.

**What Inside Story already does better.** Gardenize's free tier is generous but it records, it does not add up: no weights, no costs, no electricity, no meals, no readings, no compost chemistry. Inside Story's encrypted backup and phone-to-desktop sync covers the same ground as Gardenize's web access without a company cloud.

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Photos on plantings, areas, harvests and piles | A `garden_photos` table (owner kind, owner id, file path, taken_on, caption), `expo-image-picker` and `expo-image-manipulator` (both already installed) to take and shrink the picture, stored under the app's document folder. Needs thought for sync: snapshot sync carries the database, not files, so photos would need their own copy step into the Backups folder, and the desktop app shows a picked `file://` photo as phone-only today (`lib/desktop/phoneOnly.ts`) | JS for capture and display; the sync of image files is the larger piece | None, all local; photos must never go into the plaintext sync record | Medium on phone, Large with sync to desktop |
| Per-planting event log (watered, fed, pruned, pest seen, thinned) | Mirror `compost_events` as `garden_planting_events`, append-only, with an open list of event kinds in `garden_custom_terms` (the Open Lists rule). Feeds Trends > Garden Yield ("fed three times, yield up") only as tends-to-follow wording | JS | None | Small to Medium |
| Export | The Reports tab already has a garden report (`lib/reportKinds.ts`); a CSV of plantings and harvests is a small add | JS | None | Small |

### 2.5 From Seed to Spoon (garden planner with a health angle)

**What it is.** A US family-built vegetable garden app from Park Seed's partner, on Android, iPhone and web (app.seedtospoon.net). Planting dates for 150+ foods from GPS location (US; adjustable frost dates elsewhere), estimated sprout and harvest dates, a visual layout with companion-planting alerts, per-plant photo and note journal, pest and beneficial-insect guides, "Growbot" AI chat with photo diagnosis, seed-packet scanning for custom plants, weekly livestreams, recipes, and a "Growing for Health" feature linking plants to 25+ common health concerns.

**Pricing.** Free tier with limits. Premium $4.99 a month, $24.99 for six months, or $46.99 a year, 7-day trial; yearly subscribers get free shipping on Park Seed orders. No lifetime seen. Source: [App Store listing](https://apps.apple.com/us/app/seed-to-spoon-garden-planner/id1312538762) via search summary, [seedtospoon.net/app](https://www.seedtospoon.net/app/). Checked 2026-09-25.

**What it does well that Inside Story does not.**
1. *GPS planting dates with sprout and harvest estimates* filled in automatically when a plant is added. Inside Story's `expected_harvest_start` and `_end` are typed by the person.
2. *Seed-packet scanning* to add a variety.
3. *AI chat and photo diagnosis.*
4. *Companion alerts inside the layout.*

**Where it is closest to Inside Story, and where Inside Story is ahead.** This is the only competitor found that ties the garden to health at all. Its "Growing for Health" is a list of plants said to help with a concern. Inside Story goes further and more honestly: a harvested food becomes an ingredient scored against the person's actual conditions, flows into meals and nutrient totals, and every claim carries an evidence tier. Seed to Spoon has no costs, no electricity, no indoor equipment, no readings, no compost, and its health list has none of the evidence tiering this app requires. Worth watching, because it shows the market will pay for "grow for your health."

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Auto-filled sprout and harvest dates | The sowing-window table proposed under Seedtime, plus days-to-germinate and days-to-maturity per crop; the Add Planting form fills `expected_harvest_start`/`_end` and offers two Days Until counters | JS | None | Medium (shares the crop table) |
| "What to grow for my conditions" | A band on My Zone or Plots & Plantings that ranks the crops suited to the person's climate band by the same condition scoring Food Lookup and Safe Foods already use (`food_scores`, `sub_criterion_condition_relevance`). This is Inside Story's strongest possible answer to Seed to Spoon and it reuses scoring that exists | JS | None | Medium |
| Seed-packet scan | Barcode scanning is already in the app for Food; a seed barcode rarely resolves to a variety in any open database, so a photo of the packet plus a typed variety is more honest | JS (camera already compiled in) | Barcode lookups go through the planned Worker (item 27 in CLAUDE.md) | Small for photo, Large for a lookup |

### 2.6 AC Infinity app with UIS controllers (indoor grow sensors and control)

**What it is.** The dominant consumer indoor-grow controller brand in the US. A controller box (Controller 69 Pro and up) plugs into AC Infinity fans, lights, humidifiers, heaters and pumps, with a climate probe (temperature, humidity, VPD) and optional soil, water, CO2, light and hydro (pH, EC, TDS) sensors. The free AC Infinity app (Android, iPhone) connects over Bluetooth or WiFi: live dashboard, history graphs, alerts, schedules, and rules such as "run the exhaust when humidity passes 65%."

**Pricing.** The app is free; the cost is hardware. Controller 69 Pro (4 ports) $89.99; 69 Pro+ (8 ports) $99.00; Outlet AI (4 outlets) $69.99; AI Climate Sensor $19.99; AI Soil Sensor $21.99; AI Water Sensor $29.99; AI CO2 + Light Sensor $49.99; AI Hydro Sensor (pH, EC, TDS) $149.00. A realistic starter setup with soil and climate probes runs about $130 to $200 before any fans or lights. Source: [acinfinity.com/controllers](https://acinfinity.com/controllers/), checked 2026-09-25. Data goes through AC Infinity's cloud when on WiFi.

**What it does well that Inside Story does not.**
1. *Readings arrive by themselves*, every few minutes, with graphs and alerts. Inside Story's Growing Conditions is hand entry only (stage 0).
2. *VPD* (vapor pressure deficit), worked out from temperature and humidity, is the figure indoor growers steer by.
3. *Control*: it switches equipment. Inside Story records equipment but never controls it, and should not try.

**What Inside Story already does better.** AC Infinity knows the tent's air, not what came out of it. No harvest, no yield, no costs, and no electricity figure even though it controls every powered device. Inside Story's Grow Setup already works out each device's monthly draw from wattage and hours and prices it against the recorded bill, and the Electricity band compares bills from before and after the grow. That is a question AC Infinity owners ask on forums and the app cannot answer.

**What it would take to close each gap.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| VPD from readings already entered | A derived figure in `lib/growingConditions.ts` when a temperature and a humidity reading share an area and a time; shown on Growing Conditions and Trends > Growing Conditions, with the same no-verdict wording rule ("too low", "ideal" are banned by `scripts/test_growing_conditions.js`) | JS | None | Small |
| Import AC Infinity history | The app exports CSV of a controller's history (to be confirmed on device). An "Import readings from a file" button on Growing Conditions, using the desktop and phone file pickers already in the app, writing `garden_readings` rows with `source = 'device'` | JS | None; the file is the person's | Small to Medium |
| Live AC Infinity readings | Only through AC Infinity's unofficial cloud API (used by the Home Assistant integration). That is stage 3 (cloud account, OAuth or password) and relies on an undocumented API that can break | JS, but fragile | Conflict: the person's grow data passes through a third-party cloud the app would be logging into; must be opt-in and stated | Large, and not recommended first |

### 2.7 Ecowitt (soil moisture and weather sensors with a local network API)

**What it is.** A low-cost wireless sensor family: soil moisture (WH51), soil temperature, leaf wetness, rain, full weather stations, all reporting to a small WiFi gateway (GW1100, GW1200, GW2000). Free apps (WSView Plus, Ecowitt app) on Android and iPhone, free graphs and history download at ecowitt.net. What matters for Inside Story: the gateways publish readings on the home network (a local HTTP endpoint for live data) and can push to "your own customized server," so no cloud account is needed.

**Pricing.** Apps and ecowitt.net are free. WH51 soil moisture sensor $17.99, or $65.99 for four; the gateway is sold separately (GW1100 and GW1200 are commonly about $30 to $40, not confirmed on the official shop today). A gateway plus two soil sensors is roughly $70 to $80. Source: [shop.ecowitt.com/products/wh51](https://shop.ecowitt.com/products/wh51), [Happy Hydro GW1200 listing](https://happyhydro.com/products/ecowitt-gw1200-wifigateway), checked 2026-09-25.

**What it does well that Inside Story does not.** Automatic, continuous readings for soil moisture and weather at a price a home gardener will pay, with no hub and no required account.

**What Inside Story already does better.** Ecowitt shows numbers. It does not know what is planted where, what the harvest was, or what the watering cost. Inside Story's record (`garden_readings` with `plot_name`, unit families, monthly rain totals, lowest and highest) is the place those numbers would mean something.

**Why this is the right first sensor for stage 1.** CLAUDE.md's stage 1 is "DIY LAN sensors over the zeroconf and static-server code already compiled in." Ecowitt is the cheapest commercial product that fits that shape exactly: it is on the home network, it needs no cloud, and it needs no soldering, which widens stage 1 from hobbyists with an ESP32 to anyone who can plug in a gateway.

**What it would take.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Read an Ecowitt gateway on the home network | A new `lib/sensors/ecowittLocal.ts` that polls the gateway's local live-data endpoint by IP (found by `react-native-zeroconf`, already installed, or typed in), maps each channel to a `measurement_kind` and a garden area, and appends `garden_readings` rows with `source = 'device'` (the column exists, so no migration). Polls only while the app is open, since background work is throttled; the reading history on the gateway covers gaps poorly, so say so in the lens | JS only, no rebuild: `plugins/withCleartextLan.js` already allows plain `http://` to the home network (added for Wi-Fi sync), and `react-native-zeroconf` is already compiled in | None; stays on the home network | Medium |
| Receive pushes from the gateway ("customized server") | The installed static server serves files; receiving a POST needs a small HTTP listener, likely a native module | Native, rebuild | None | Medium to Large; polling is enough to start |
| Weather from the station instead of Open-Meteo | Rain from a station feeds the Rain total Growing Conditions already sums | JS, same as above | None | Small once the above exists |

### 2.8 PictureThis (plant ID and diagnosis), with Pl@ntNet as the free alternative

**What it is.** The best-known plant identification app: point the camera at a plant, leaf or flower and it names it; point it at a sick leaf and it names the likely disease or pest with a treatment plan; plus care reminders and an expert chat. Android and iPhone. Pl@ntNet is the free, non-profit, research-backed alternative (French research institutes), identification only, and it offers a public API.

**Pricing.** PictureThis: 7-day trial, then Pro $39.99 a year (UK £34.99), $9.99 a month, a lifetime around $79.99 reported by reviewers, Family plan $49.99 a year. Deep discounts (40 to 50%) run in spring. Pl@ntNet: free, no in-app purchases. Sources: [Growli price survey, July 2026](https://www.getgrowli.app/blog/plant-app-prices-2026), [identifythis.app review 2026](https://identifythis.app/picture-this-app-review). Checked 2026-09-25. Monthly and lifetime figures are from reviewers, not the store listing.

**What it does well that Inside Story does not.** Answers "what is this?" and "what is wrong with this leaf?" in seconds from a photo. For a food garden, the diagnosis half (blight, powdery mildew, aphids, blossom end rot) is the valuable part.

**What Inside Story already does better.** PictureThis knows plants in the abstract; it has no garden, no harvest, no costs, no food link. The two do not overlap much beyond the photo.

**What it would take.**
| Gap | Where it would go | Native or JS | Privacy | Size |
|---|---|---|---|---|
| Identify or diagnose from a photo | A "What is this?" button on a planting that sends a shrunk photo to an identification service. Pl@ntNet's API (free tier, key required) through the planned `inside-story-site` Worker so the key is not in the app and only the photo leaves, never who sent it. Diagnosis needs a paid service (for example Kindwise plant.health) or a vision model | JS (camera and image picker already installed) | Conflict: a photo leaves the phone. Acceptable only as an explicit opt-in per use with a stated boundary, the same line CLAUDE.md drew for photo food recognition (item 21) | Medium for ID, Large for diagnosis |
| Offline alternative | A reading-based symptom guide in Horticulture: "yellow lower leaves on tomatoes: what it can be," cited, no photo leaves the phone | JS | None | Medium (writing) |

### 2.9 Planter (square-foot garden planner)

**What it is.** A simple, well-liked planner for beginners: Android, iPhone and web. Square-foot grid beds, companion and "combative" plant flags as you place crops, a growing calendar from frost dates, 80+ fruits and vegetables with hundreds of varieties, custom plants, a seed box, notes and events.

**Pricing.** Free: one garden, growing calendar, custom plants and varieties, seed box. Premium $24.99 a year (unlimited gardens, no ads, notes and events, web app). Lifetime $99.99. Source: [planter.garden/pricing](https://planter.garden/pricing/) via search summary, checked 2026-09-25.

**What it does well that Inside Story does not.** A layout a beginner can use in five minutes, with companion flags right on the grid, and a seed box (seed inventory) in the free tier.

**What Inside Story already does better.** Same as the other planners: nothing after planting is counted. Planter is the proof that a square grid, not a free drawing canvas, is enough for most home food gardens, which shrinks the layout job for Inside Story.

**What it would take.** A square-foot grid is the smaller version of the layout item under Seedtime: `garden_plots` gets a width and length in squares, `garden_plantings` gets a square position and span, drawn with `react-native-svg`. JS only. No privacy issue. Medium rather than Large if it stays a grid. The seed box is the `garden_seeds` item under Seedtime.

## 3. Gap synthesis

**Where Inside Story stands.** Every competitor here covers one slice: planners (Seedtime, GrowVeg, Planter, Seed to Spoon) own the time before planting; care and ID apps (Planta, PictureThis, Gardenize) own the plant itself; sensor makers (AC Infinity, Ecowitt) own the air and soil. None of them follows the food out of the garden. Inside Story is the only one that records harvest by weight, carries it into meals and nutrients scored against the person's conditions, sets it against every cost including the electricity bill, tracks compost, and keeps it all on the device. That end of the chain is the moat, and no competitor is near it. From Seed to Spoon is the only one with a health angle at all, and it is a plant list without evidence tiers.

**Where it is behind.** The front of the season. A gardener opening Inside Story in February gets nothing that tells them when to sow what, where to put it, or what grew there last year, and that is the moment most people choose a garden app. It also has no photos, which every journal-type competitor treats as the heart of the record.

### Ranked recommendations (most value per effort first)

| Rank | Recommendation | Where | Native or JS | Size | Why this rank |
|---|---|---|---|---|---|
| 1 | **Last and first frost dates** on My Zone, from the Open-Meteo series `lib/gardenZoneLookup.ts` already downloads | `lib/gardenZoneLookup.ts`, My Zone lens, `app_meta` | JS | Small to Medium | Unlocks ranks 2, 3 and 6; no new data leaves the phone; every planner treats this as the foundation |
| 2 | **Crop rotation caption** from the planting history already kept | New `lib/cropFamilies.ts`; Add Planting form reads earlier `garden_plantings` for the `plot_id` | JS | Small to Medium | Uses a record Inside Story already has and competitors charge for; needs no outside data |
| 3 | **Sowing calendar and auto-filled harvest window**: cited weeks-from-frost, days to germinate, days to maturity per crop; prefills `expected_harvest_start`/`_end` and offers Days Until counters; a "this month" band on My Zone | New `lib/sowingWindows.ts` keyed on reference `food_id`; Plots & Plantings; My Zone; dated reminders | JS | Medium to Large (the cited crop table is the work) | The single most asked-for garden app feature; turns Days Until from typed-in to suggested |
| 4 | **"What to grow for my conditions"**: crops suited to the zone, ranked by the condition scoring Food Lookup already uses | My Zone or Plots & Plantings; `food_scores`, `sub_criterion_condition_relevance` | JS | Medium | Inside Story's answer to Seed to Spoon's "Growing for Health," with honest evidence tiers; nobody else can do it |
| 5 | **Photos and a per-planting event log** (watered, fed, pest seen) | New `garden_photos` and `garden_planting_events` (mirroring `compost_events`); `expo-image-picker` already installed | JS; photo sync to the desktop is the heavier part | Medium (Large with desktop sync) | Table stakes for a journal; the event log also feeds Garden Yield as tends-to-follow context |
| 6 | **Ecowitt on the home network (stage 1)**: poll the gateway, write `garden_readings` with `source = 'device'` | New `lib/sensors/ecowittLocal.ts`; Growing Conditions lens | JS, no rebuild (cleartext LAN and zeroconf already in) | Medium | Cheapest (about $70 to $80) route to automatic readings; no cloud, no soldering, no hub; fits the approved stage plan |
| 7 | **VPD and file import of sensor history** (AC Infinity and others export CSV) | `lib/growingConditions.ts`; an import button on Growing Conditions | JS | Small each | Serves the indoor grower now without any sensor integration |
| 8 | **Succession sowing** (repeat a planting every N days, K times) | Add Planting form in `app/(tabs)/garden.tsx` | JS | Small | Cheap once rank 3 exists |
| 9 | **Square-foot grid layout** with companion captions | `garden_plots` width and length, `garden_plantings` position, `react-native-svg`; new `lib/companionPairs.ts` with evidence tiers | JS | Medium (grid) to Large (free drawing) | Visible and expected, but costly; Planter shows a grid is enough; companion claims are mostly weak evidence and must say so |
| 10 | **Watering suggestions and rain skips** | New `lib/cropCare.ts`; forecast from `lib/homeSky.ts` | JS | Small to Medium | Nice, but reminders about plants are Planta's home ground |
| 11 | **Photo ID and diagnosis**, opt-in per use, through the Worker | Planting screen; `inside-story-site` Worker; Pl@ntNet API | JS | Medium to Large | Useful, but a photo leaving the phone cuts against the privacy stance; a cited symptom guide in Horticulture is the offline half |
| 12 | Seed inventory | New `garden_seeds` | JS | Medium | Low urgency |

Nothing in the top nine needs an EAS rebuild: the camera, image picker, image manipulator, sensors, SVG, zeroconf and the cleartext-LAN plugin are all already compiled into the app.

## 4. Pricing summary

All prices USD, checked 2026-09-25 from the sources named in each section. Store prices vary by country.

| App | Free tier | Monthly | Annual | Lifetime | Hardware |
|---|---|---|---|---|---|
| Planta | Limited reminders | $7.99 | $35.99 | None | None |
| Seedtime | Yes (1 calendar, 1 small layout) | $10 (Basic), $20 (top) | $84 (Basic), $168 (top) | None | None |
| GrowVeg / Almanac Garden Planner | 7-day trial only | None | $29 to $35 auto-renew; $50 one year, $85 two years | None | None |
| Gardenize | Yes, generous | $8.99 | about $44.88 (official); $24.99 reported by roundups | $99.99 reported, not on official page | None |
| From Seed to Spoon | Yes, limited | $4.99 | $46.99 ($24.99 for six months) | None | None |
| AC Infinity | App free | None | None | None | Controller $69.99 to $99; sensors $19.99 to $149 |
| Ecowitt | App and web free | None | None | None | Soil sensor $17.99; gateway about $30 to $40 (not confirmed) |
| PictureThis | Trial only | $9.99 | $39.99 (Family $49.99) | about $79.99 reported | None |
| Pl@ntNet | Everything free | None | None | None | None |
| Planter | Yes (1 garden) | None | $24.99 | $99.99 | None |
| **Inside Story Free** (planned) | Garden's place in Free is not stated in CLAUDE.md's tier table | $0 | $0 | | |
| **Inside Story Individual** | | $9.99 | $89.99 | None planned | Optional, stage 1 sensors |
| **Inside Story Partner** | | $14.99 for two | $134.99 for two | | |
| Household seat / Caregiver | | $1.99 per seat / $4.99 per person | $17.99 / $49.99 | | |

**What people in this category are used to paying.** A single-purpose garden app runs $25 to $47 a year, with $35 to $40 the common middle (Planta, GrowVeg, PictureThis, Seed to Spoon). Seedtime's top plan at $168 a year is the outlier. Lifetimes at $80 to $100 are common (Planter, PictureThis, Gardenize) and gardeners like them because the use is seasonal. Almost everyone offers a usable free tier or a 7 to 14 day trial. Sensor makers give the app away and earn on hardware.

**What this means for Inside Story.** At $89.99 a year Individual costs more than any one garden app, and a gardener comparing on the garden alone will notice. The argument is that Individual replaces two or three of them plus the food, health and budget apps, and that its garden record continues into meals and money where none of them go. Two points to decide deliberately rather than by default: (1) the Free tier table in CLAUDE.md lists builders, Food Lookup, some Schedules and Health Literacy reading but does not say whether Garden is in Free; since every planner competitor has a free garden tier, a free Garden (areas, plantings, harvest log, My Zone) is a strong way in for the second audience that does not require a condition; (2) seasonal users are used to lifetimes, which Inside Story does not plan.

