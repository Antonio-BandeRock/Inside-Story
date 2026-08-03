"""
Transforms hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx into a
compact reference SQLite database for the Inside Story app.

Extracts: identity (food_id, source, source_code, name, short_name,
category, botanical classification), the 31 real D1-D6 six-dimension score
columns, and a curated "Phase 1 standard panel" of macro/vitamin/mineral
nutrients (see NUTRIENT_DEFINITIONS/NUTRIENT_COLUMN_ALIASES) resolved via
per-sheet column-name aliases, since the ~750 raw per-source nutrient
columns are inconsistently named across sources and not all of them are
needed by anything currently designed in the app.

Pure standard library (zipfile + xml.etree) -- no openpyxl/pandas available
in this environment. Re-runnable: drop the output file and re-run any time
the source workbook is updated.

Usage:
  py scripts/build_food_reference_db.py <path-to-LIVE.xlsx> assets/data/foods_reference.db
"""

import datetime
import re
import sqlite3
import sys
import zipfile
from xml.etree import ElementTree as ET

from natural_name_reorder import reorder_base_name

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
R_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}

SKIP_SHEETS = {"Botanical_Classification", "ChangeLog"}

# A handful of rows the source project's own category unification put in the
# wrong top-level bucket -- real prepared dishes/soup mixes that ended up in
# Vegetables instead of Mixed (Prepared/Mixed Dishes), where 366 other real
# dishes already correctly live. Checked by hand, not a keyword rule: a
# broader "contains stew/soup/chili" scan produces false positives here
# (e.g. "Peppers, hot chili" is a pepper variety, "Okra (gumbo)" is just
# Canada's alternate name for okra, not the Louisiana dish). Keyed on
# (category_code, base_name) after prep-stripping; extend by hand if more
# turn up rather than widening this into a keyword scan.
CATEGORY_OVERRIDES = {
    # Baobab powder is the dried, ground baobab-fruit pulp sold as a
    # smoothie/superfood supplement powder -- not something eaten or added
    # to a dish as a whole/fresh fruit the way the rest of Fruit is.
    # Same real category (a powder supplement, not a whole-food ingredient)
    # as Psyllium (SupplementPowder, see scripts/add_supplement_powder_
    # category.py), just fruit-derived rather than seed-derived. Found
    # 2026-07-29 while auditing Fruit for non-whole-food products.
    ("Fruit", "Baobab powder"): "SupplementPowder",
    # A raw fiber-supplement powder, not a whole nut/seed food -- the other
    # half of the SupplementPowder move flagged alongside Baobab powder
    # above (see scripts/add_supplement_powder_category.py) but never
    # actually folded into this override list until now.
    ("NutSeed", "Psyllium, uncooked"): "SupplementPowder",
    # Reported directly 2026-08-03: "Konjac... is kind of a cooking
    # ingredient in powder form, which is how it is listed in the
    # Vegetables category" -- confirmed by checking the row directly.
    # "Konjac, fine powder" (Japan_MEXT) is the loose glucomannan powder
    # itself (6g water/100g -- a concentrated dry powder, not a fresh
    # vegetable; real konjac corm runs ~95%+ water), used the same two
    # ways Psyllium already is: a soluble-fiber supplement, or a small-
    # quantity cooking/thickening aid -- the exact profile this category
    # already exists for. Every other Konjac row (block made from corm,
    # block made from powder, freeze-dried, noodles) stays in Veg -- those
    # are real eaten foods (konnyaku blocks, shirataki noodles), not a
    # loose ingredient powder, the same distinction Psyllium's own move
    # already drew against whole nuts/seeds.
    ("Veg", "Konjac, fine powder"): "SupplementPowder",
    # New 'Brewing' category, 2026-08-02, explicitly requested: dry, not-
    # yet-brewed tea/coffee-type products (instant powders, granules,
    # dried/ground tea) don't belong under Bev the same way an already-
    # brewed, ready-to-drink cup does -- you don't drink instant coffee
    # granules, you brew a drink FROM them. Real, ready-to-drink liquid
    # forms ("Coffee, brewed, prepared with tap water", "Tea, brewed,
    # black", any "(infusion)" row, bottled products like NESTEA/SNAPPLE)
    # deliberately stay in Bev -- only checked by hand, not a keyword rule,
    # since several base_names use "powder" for the PREPARED drink too
    # (e.g. "Tea, instant, unsweetened, powder, water added" already has
    # water added and stays put; "Tea, instant, unsweetened, powder" alone
    # does not and moves). All 23 confirmed against the live database
    # before this list was written, one row each (no source duplicates).
    ("Bev", 'Green tea, "Maccha" (finely ground tea)'): "Brewing",
    ("Bev", "Coffee And Cocoa (Mocha) Powder (with whitener and low calorie sweetener)"): "Brewing",
    ("Bev", "Coffee, instant, with sugar, mocha flavour, powder"): "Brewing",
    ("Bev", "Tea, instant, unsweetened, lemon flavour, powder"): "Brewing",
    ("Bev", "Tea, instant, unsweetened, powder"): "Brewing",
    ("Bev", "Tea, instant, unsweetened, powder, decaffeinated"): "Brewing",
    ("Bev", "Tea, lemon, instant powder"): "Brewing",
    ("Bev", "Chicory coffee powder"): "Brewing",
    ("Bev", "Coffee instant powder"): "Brewing",
    ("Bev", "Coffee instant powder decaffeinated"): "Brewing",
    ("Bev", "Coffee mix, with beverage whitener & sugar, dry powder"): "Brewing",
    ("Bev", "Coffee substitute powder"): "Brewing",
    ("Bev", "Coffee substitute, cereal grain beverage, powder"): "Brewing",
    ("Bev", "Coffee, instant coffee, granules"): "Brewing",
    ("Bev", "Coffee, instant with chicory, powder"): "Brewing",
    ("Bev", "Coffee, instant, decaffeinated, powder"): "Brewing",
    ("Bev", "Coffee, instant, dry powder or granules"): "Brewing",
    ("Bev", "Coffee, instant, dry powder or granules, decaffeinated"): "Brewing",
    (
        "Bev",
        "Coffee, instant, French vanilla flavour, with aspartame and acesulfame potassium, fat free, sugar free, low calorie, powder",
    ): "Brewing",
    ("Bev", "Coffee, instant, powder, half the caffeine"): "Brewing",
    ("Bev", "Coffee, instant, regular, powder"): "Brewing",
    ("Bev", "Coffee, instant, with sugar, cappucino flavour, powder"): "Brewing",
    ("Bev", "Coffee, instant, with sugar, French flavour, powder"): "Brewing",
    # Four more found the same day, reported as "no green tea in Brewing":
    # the original pass above only caught rows whose own naming said
    # "instant"/"powder"/"granules" -- it missed Japan_MEXT's own separate
    # naming convention, where a bare "tea" qualifier (not "infusion") means
    # the dry LEAF itself, e.g. "Green tea, Sencha, infusion" (the brewed
    # cup) vs. "Green tea, Sencha, tea" (the dry leaves you'd brew it from)
    # -- confirmed decisively this time using the new `water` nutrient
    # (2026-08-02, see NUTRIENT_DEFINITIONS) rather than eyeballing names
    # alone: every "infusion" row measures 97-99% water; every "tea" row
    # below measures under 7%. "Thé, feuille" (French_Ciqual; "Tea, leaf")
    # was missed the first time for a different reason -- it was never
    # filed under the Tea subcategory at all, sitting in Bev's own "Other"
    # bucket, so the original by-hand review of just the Tea/Coffee
    # subcategories never saw it. Sencha and Gyokuro are both real green
    # teas -- the two rows below are exactly the "green tea" reported
    # missing.
    ("Bev", "Fermented tea, black tea, tea"): "Brewing",
    ("Bev", 'Green tea, "Gyokuro" (high grade tea made from shade-grown leaves), tea'): "Brewing",
    ("Bev", 'Green tea, "Sencha" (common grade tea), tea'): "Brewing",
    ("Bev", "Thé, feuille"): "Brewing",
    # A full re-audit of the ENTIRE database, 2026-08-02, requested after
    # "no green tea" turned up two more real gaps: real coverage was thin
    # (confirmed -- see this file's own CLAUDE.md entry on the actual final
    # count) and cocoa/cacao powder was missing outright. This pass covers
    # every remaining Bev row whose water content (the new nutrient) reads
    # under ~13g/100g -- i.e. genuinely dry, not a prepared drink -- plus a
    # cross-category keyword sweep (tea/coffee/cocoa/chicory/malt) that also
    # caught two herbal teas mis-filed under 'Meat' entirely (see below,
    # moved to Bev not Brewing, since both are already brewed/prepared).
    # Every row here has its OWN unique base_name already (verified before
    # writing this list) -- rows sharing a generic base_name with a real
    # PREPARED sibling (mostly USDA's own "Beverages, coffee"/"Beverages,
    # tea"/"Beverages, Cocoa mix"/etc. groups, where prep state was never
    # parsed into a separate prep_method) went into NAME_CATEGORY_OVERRIDES
    # instead, keyed per-row, so the prepared siblings aren't swept in too.
    #
    # Cocoa/cacao/chocolate/malt drink mixes -- the person's own reported
    # gap ("I also do not see powdered cacau, or powdered cocoa"):
    ("Bev", "Cacao, non sucré, poudre soluble"): "Brewing",                          # France_Ciqual
    ("Bev", "Cocoa powder"): "Brewing",                                              # Australia_AFCD
    ("Bev", "Cocoa, chocolate milk powder"): "Brewing",                              # Japan_MEXT
    ("Bev", "Cocoa, pure powder"): "Brewing",                                        # Japan_MEXT
    ("Bev", "Beverage base, chocolate flavour, added vitamins & minerals (Milo)"): "Brewing",       # Australia_AFCD
    ("Bev", "Beverage base, chocolate flavour, unfortified (Nesquik brand)"): "Brewing",            # Australia_AFCD
    ("Bev", "Beverage base, drinking chocolate, unfortified"): "Brewing",            # Australia_AFCD
    ("Bev", "Beverage mix, carob flavour, powder"): "Brewing",                       # Canada_CNF -- carob is a real cocoa/chocolate substitute, same relationship as chicory:coffee
    ("Bev", "Beverage mix, chocolate flavour, powder"): "Brewing",                   # Canada_CNF
    ("Bev", "Beverage mix, chocolate flavour, powder, no added sugar"): "Brewing",   # Canada_CNF
    ("Bev", "Hot chocolate with marshmallows, powder, mix"): "Brewing",              # Canada_CNF
    ("Bev", "Hot chocolate, cocoa, without sugar, mix, powder"): "Brewing",          # Canada_CNF
    (
        "Bev",
        "Hot chocolate, low calorie, with aspartame, mix, powder, with added calcium and phosphorus, without added sodium or vitamin A",
    ): "Brewing",                                                                    # Canada_CNF
    ("Bev", "Hot chocolate, mix, powder"): "Brewing",                                # Canada_CNF
    ("Bev", "Hot chocolate, rich, mix, powder"): "Brewing",                          # Canada_CNF
    ("Bev", "Hot chocolate, with aspartame, mix, powder"): "Brewing",                # Canada_CNF
    ("Bev", "Malted milk, chocolate flavour, enriched powder"): "Brewing",           # Canada_CNF
    ("Bev", "Malted milk, chocolate flavour, powder"): "Brewing",                    # Canada_CNF
    ("Bev", "Malted milk, natural flavour, enriched powder"): "Brewing",             # Canada_CNF
    ("Bev", "Malted milk, natural flavour, powder"): "Brewing",                      # Canada_CNF
    ("Bev", "Poudre cacaotée ou au chocolat pour boisson, sucrée"): "Brewing",                                    # France_Ciqual
    ("Bev", "Poudre cacaotée ou au chocolat pour boisson, sucrée, enrichie en vitamines"): "Brewing",             # France_Ciqual
    ("Bev", "Poudre cacaotée ou au chocolat sucrée pour boisson, enrichie en vitamines et minéraux"): "Brewing",  # France_Ciqual
    (
        "Bev",
        "Poudre maltée, cacaotée ou au chocolat pour boisson, sucrée, enrichie en vitamines et minéraux",
    ): "Brewing",                                                                    # France_Ciqual
    ("Bev", '"Kobu-cha" (kombu powder for drink)'): "Brewing",                       # Japan_MEXT -- kombu/seaweed powder steeped like tea
    # Pure baking/drinking cocoa powder, found filed under Sweets rather
    # than Bev at all -- same real product as the Bev-sourced "Cocoa
    # powder"/"Cocoa, pure powder" above, just a different national
    # source's own top-level bucket. Excludes cocoa BUTTER/FAT (a
    # completely different product, stays in Fats), cocoa mass (a solid
    # baking/candy intermediate, not something dissolved directly into a
    # drink), and anything already baked into another food (biscuits,
    # wafers) -- those aren't a beverage base themselves.
    ("Sweets", "Beverage powder containing cocoa"): "Brewing",                       # Germany_BLS -- already named "beverage powder" in Sweets
    ("Sweets", "Cocoa powder lightly deoiled"): "Brewing",                           # Germany_BLS
    ("Sweets", "Cocoa powder strongly deoiled"): "Brewing",                          # Germany_BLS
    ("Sweets", "Cocoa, dry powder"): "Brewing",                                      # USDA -- covers both the plain and alkali-processed rows sharing this base_name
    ("Sweets", "Sweets, cocoa, powder, unsweetened"): "Brewing",                     # Canada_CNF
    ("Sweets", "Sweets, cocoa, powder, unsweetened, dutch process"): "Brewing",      # Canada_CNF
    # Coffee/chicory powder, French_Ciqual -- missed the first time since
    # the original pass only reviewed the Tea/Coffee subcategories; these
    # already had their own fully descriptive (non-generic) base_names.
    ("Bev", "Café au lait ou cappuccino au chocolat, poudre soluble"): "Brewing",
    ("Bev", "Café au lait ou cappuccino, poudre soluble"): "Brewing",
    ("Bev", "Café, décaféiné, poudre soluble"): "Brewing",
    ("Bev", "Café, poudre soluble"): "Brewing",
    ("Bev", "Café, moulu"): "Brewing",                                               # "Coffee, ground" -- real ground coffee, not yet brewed
    ("Bev", "Chicorée et café, poudre soluble"): "Brewing",
    ("Bev", "Chicorée, poudre soluble"): "Brewing",
    # Two herbal teas found filed under 'Meat' entirely (a genuine, unrelated
    # source-data miscategorization bug stumbled onto during this sweep) --
    # both already say "brewed" in their own name, so they're a prepared
    # drink, not a Brewing-category dry good; the fix is Meat -> Bev, not
    # Meat -> Brewing. classify_subcategory() picks up the real Tea
    # subcategory automatically once category is corrected, same as every
    # other real Tea row.
    ("Meat", "Tea, tundra"): "Bev",                                                  # USDA, "Tea, tundra, herb and laborador combination (Alaska Native)"
    ("Meat", "Tea, herbal"): "Bev",                                                  # USDA, "Tea, herbal, brewed, Hohoysi (Hopi)"
    # One more real miss, found checking dark/light chocolate specifically
    # (requested 2026-08-02 right after the Brewing re-audit) -- dark/milk
    # chocolate BARS (Sweets, e.g. "Dark chocolate", "Whole milk chocolate
    # with hazelnuts") are correctly candy, not a drink base, and
    # deliberately untouched; chocolate SYRUP (31-79g/100g water -- already
    # a pourable liquid you stir in, not a dry good) is also deliberately
    # untouched. This one row, though, is a genuine dry chocolate drink
    # powder (7.4g/100g water) that the original cocoa/chocolate sweep
    # missed -- its own base_name is fully unique, no prepared sibling risk.
    ("Bev", "Beverages, chocolate powder"): "Brewing",                              # USDA, "Beverages, chocolate powder, no sugar added"
    # One more real miss, found on a final broad sweep for anything with
    # "powder" still left in Bev, 2026-08-02 -- Horlicks is a real malted-
    # milk drink powder, the exact same family as OVALTINE (already moved
    # above). Own unique base_name, no prepared-sibling risk (the "made up
    # with water" variant has a fully distinct base_name of its own and
    # correctly stays in Bev).
    ("Bev", "Horlicks LowFat Instant powder"): "Brewing",                           # UK_CoFID
    # Same "dry, not-yet-prepared base" pattern as Brewing above, checked
    # 2026-08-02 for Soup/Sauces Builder specifically ("check the sauces
    # and soups for anything similar"). Germany_BLS/Japan_MEXT already file
    # their own bouillon cubes/gravy powder/instant roux under 'Herbs' --
    # already reachable in both Soup and Sauces Builder's own category
    # allowlists, so no bug there, just a naming quirk (a bouillon cube
    # isn't literally an herb, but this is the existing precedent, and
    # only 9 rows total doesn't justify a whole new category the way
    # Brewing's 90+ did). These 9 join that same precedent -- found
    # sitting in 'Mixed' instead, which is deliberately excluded from
    # every builder's own allowlist (composite prepared dishes, not a raw
    # ingredient anyone adds -- see constants/foodBuilderCategories.ts),
    # so these were genuinely unreachable in Soup/Sauces Builder before
    # this fix, not just oddly labeled. Each confirmed dry by its own
    # name ("déshydraté" = dehydrated, not "reconstitué"/"prêt à
    # consommer" = prepared; "instant dry mix") -- the real prepared
    # broths/consommés/gravies sharing this same keyword search (e.g.
    # "Bouillon de boeuf, déshydraté RECONSTITUÉ", "Soup, broth, beef,
    # READY-TO-SERVE", every plain consommé) were checked by hand and
    # deliberately left in Mixed, where they belong as finished dishes.
    ("Mixed", "Bouillon de boeuf, déshydraté"): "Herbs",                            # France_Ciqual
    ("Mixed", "Bouillon de volaille, déshydraté"): "Herbs",                         # France_Ciqual
    ("Mixed", "Bouillon de viande et légumes type pot-au-feu, déshydraté"): "Herbs",              # France_Ciqual
    ("Mixed", "Bouillon de viande et légumes type pot-au-feu, dégraissé, déshydraté"): "Herbs",   # France_Ciqual
    ("Mixed", "Bouillon de viande et légumes type pot-au-feu, non dégraissé, déshydraté"): "Herbs", # France_Ciqual
    ("Mixed", "Court-bouillon pour poissons, déshydraté"): "Herbs",                 # France_Ciqual
    ("Mixed", "Soup, broth style, with meat, instant dry mix"): "Herbs",            # Australia_AFCD
    ("Mixed", "Soup, broth style, with meat & noodles, instant dry mix"): "Herbs",  # Australia_AFCD
    ("Mixed", "Gravy powder, dry mix"): "Herbs",                                    # Australia_AFCD
    # Same check extended to the rest of the builders ("check the rest of
    # the builders too"), 2026-08-02. Salad/Smoothie: genuinely nothing
    # found -- no dry dressing-mix packet or smoothie-mix powder exists
    # anywhere in this database (checked ranch/Italian/vinaigrette by name
    # too, not just "dressing mix"); every real salad dressing on file is
    # already a prepared liquid under Fats, correctly reachable already.
    # Side Builder: found real, unreachable dry rice-side-dish mixes sitting
    # in 'Mixed' (RICE-A-RONI and its unbranded equivalents, Spanish rice
    # mix, seasoned/wild rice mixes) -- unlike the pasta-mix-with-meat-
    # flavoring "dinner kit" products sharing this same search (Hamburger-
    # Helper-style "Pasta mix, classic beef"/"...cheeseburger macaroni",
    # boxed mac-and-cheese, frozen lasagna/Salisbury steak/pizza rolls/
    # potstickers), which are genuinely a different, composite whole-meal
    # product, not a side ingredient, and deliberately left in Mixed, same
    # reasoning as the boxed mac-and-cheese kit already excluded earlier.
    # Routed to 'Grain' (already in Side Builder's allowlist) rather than
    # 'Herbs' -- a flavored rice mix is fundamentally a rice/grain product,
    # not a seasoning concentrate the way bouillon/gravy powder are.
    ("Mixed", "RICE-A-RONI Chicken Flavor"): "Grain",                               # USDA
    ("Mixed", "Grains, rice and vermicelli mix, chicken flavour"): "Grain",         # Canada_CNF
    ("Mixed", "Rice and vermicelli mix, beef flavor"): "Grain",                     # USDA
    ("Mixed", "Rice and vermicelli mix, rice pilaf flavor"): "Grain",               # USDA
    ("Mixed", "Rice mix, cheese flavor"): "Grain",                                  # USDA
    ("Mixed", "Rice mix, white and wild"): "Grain",                                 # USDA
    ("Mixed", "Rice, spanish rice mix"): "Grain",                                   # Canada_CNF
    ("Mixed", "Spanish rice mix, dry mix"): "Grain",                                # USDA
    ("Mixed", "Yellow rice with seasoning, dry packet mix"): "Grain",               # USDA
    # Three more instant soup mixes missed on the first Soup/Sauces pass
    # (that search targeted "bouillon/broth/stock/consomme" specifically
    # and didn't catch these) -- found on this broader "any dry/unprepared
    # item still in Mixed" sweep. Join the "Soup, broth style..." pair
    # already moved to Herbs above; the one real sibling this search also
    # caught ("Soup, chicken & noodle, cup of soup, prepared from instant
    # dry mix WITH WATER") already has water added and correctly stays.
    ("Mixed", "Soup, cream variety, instant dry mix"): "Herbs",                     # Australia_AFCD
    ("Mixed", "Soup, vegetable & noodle, instant dry mix"): "Herbs",                # Australia_AFCD
    ("Mixed", "Soup, vegetable, instant dry mix"): "Herbs",                         # Australia_AFCD
    ("Veg", "Acorn stew (Apache)"): "Mixed",
    ("Veg", "Cream of mushroom soup instant powder"): "Mixed",
    ("Veg", "Cream of mushroom soup, made from instant powder and water"): "Mixed",
    ("Veg", "Cream of vegetable soup instant powder"): "Mixed",
    ("Veg", "Cream of vegetable soup, made from instant powder and water"): "Mixed",
    # Real prepared dishes, checked by hand -- "salad" alone is not a safe
    # keyword: "Cornsalad"/"Rocket salad" are real leafy-green vegetable
    # names (Canada's own data literally labels Cornsalad "(lamb's
    # lettuce)"), and French "salade" often just means lettuce, not a
    # dressed dish (confirmed against "Salade verte...sans assaisonnement" =
    # "green salad/lettuce, raw, without seasoning").
    ("Veg", "Coleslaw (cabbage salad), with dressing"): "Mixed",
    ("Veg", "Potato salad, home-prepared"): "Mixed",
    ("Veg", "Potato salad, homemade"): "Mixed",
    ("Veg", "Salade de fruits"): "Mixed",
    ("Veg", "Macédoine ou cocktail ou salade de fruits, au sirop"): "Mixed",
    ("Veg", "Macédoine ou cocktail ou salade de fruits, au sirop (sans précision sur léger ou classique)"): "Mixed",
    ("Veg", "Macédoine ou cocktail ou salade de fruits, au sirop léger"): "Mixed",
    # Actual fungi (mushrooms), not vegetables -- confirmed against the same
    # species/genus already correctly bucketed as "Mushroom" elsewhere in the
    # data: USDA's "Fungi, Cloud ears" gives its own scientific_classification
    # as "Auricularia spp." (a fungus genus) yet sits in Veg, while
    # Japan_MEXT and Canada_CNF both correctly file the identical
    # cloud-ear/wood-ear fungus under Mushroom. "Jew's ear" is the same
    # species under a different common name. Birch boletes (Germany_BLS) are
    # real wild bolete mushrooms, not vegetables.
    ("Veg", "Fungi, Cloud ears"): "Mushroom",
    ("Veg", "Jew's ear, (pepeao)"): "Mushroom",
    ("Veg", "Jew's ear (cloud or wood ear, pepeao)"): "Mushroom",
    ("Veg", "Brown birch bolete"): "Mushroom",
    ("Veg", "Orange birch bolete"): "Mushroom",
    # A prepared curry dish (mushroom-based), not a raw ingredient.
    ("Veg", "Mushroom Dopiaza"): "Mixed",
    # Multi-vegetable combination products -- a mix of distinct vegetable
    # species sold/prepared as one item, same reasoning as the soup/salad
    # dishes above rather than a single vegetable in its own right.
    ("Veg", "Peas and carrots"): "Mixed",
    ("Veg", "Peas and onions"): "Mixed",
    ("Veg", "Succotash, (corn and limas)"): "Mixed",
    ("Veg", "Succotash"): "Mixed",
    ("Veg", "Mixed vegetables peas and carrots"): "Mixed",
    ("Veg", "Mixed vegetables (carrots"): "Mixed",  # source short name truncated at first comma
    ("Veg", "Vegetables, mixed"): "Mixed",
    ("Veg", "Vegetables, broccoli and cauliflower"): "Mixed",
    ("Veg", "Corn with red and green peppers"): "Mixed",
    ("Veg", "Corn with red or green peppers"): "Mixed",
    # Explicitly "mature" (dry, mature-seed) beans are legumes/pulses, not
    # vegetables -- confirmed by comparing against Germany_BLS's own other
    # entries: "Broad bean mature" already correctly sits in Legume while
    # these two sat in Veg, an inconsistency within the same source. (Most
    # other "Bean..." rows in Veg -- snap beans, sprouted beans, immature/
    # fresh pod beans like "Broad bean immature" -- are correctly there:
    # fresh/immature pods and sprouts are conventionally vegetables, only
    # the dry mature seed is a pulse. Checked by hand, not a keyword rule,
    # since "mature" alone is not a safe signal -- see the sprouted-bean
    # rows above, which also say "mature seeds" but are correctly Veg.)
    ("Veg", "Lima bean/butter bean, mature"): "Legume",
    ("Veg", "Soya bean mature"): "Legume",
    # Sprouted seeds/legumes are conventionally treated as vegetables (the
    # same convention already applied consistently to sprouted alfalfa,
    # beans, peas, radish, etc. across every other source) -- Germany_BLS
    # and Australia_AFCD are the inconsistent cases, filing their own
    # sprouted lentils/mung beans/soya beans/alfalfa/generic bean sprouts
    # under Legume while every parallel entry from every other source sits
    # in Veg. Keyed on the post-rename name (see rename_sprout below,
    # applied earlier in the pipeline than this lookup).
    ("Legume", "Lentil Sprouts"): "Veg",
    ("Legume", "Mung Bean Sprouts"): "Veg",
    ("Legume", "Soya Bean Sprouts"): "Veg",
    ("Legume", "Bean Sprouts"): "Veg",
    ("Legume", "Lucerne/Alfalfa Sprouts"): "Veg",

    # Coconut WATER (the liquid found inside a coconut, sold/drunk as its
    # own beverage -- e.g. "Vita Coco") sitting in NutSeed/Fruit alongside
    # the coconut FLESH, instead of Bev where the identical product already
    # correctly lives for other sources (Canada_CNF's "Beverage, coconut
    # water, unsweetened, ready-to-drink", Germany_BLS's "Coconut water
    # (liquid from coconuts)", USDA's "Beverages, Coconut water,
    # ready-to-drink, unsweetened" are all already Bev) -- the same
    # different-product-than-the-whole-food problem as fruit/veg juice,
    # confirmed by that direct cross-source inconsistency rather than
    # guessed at. These three have base_names that don't collide with any
    # other food, so a plain (category, base_name) override is enough; the
    # two Australia_AFCD rows below (where the liquid shares an identical
    # base_name with the coconut flesh) need the separate full-name-keyed
    # NAME_CATEGORY_OVERRIDES instead -- see that dict.
    ("NutSeed", "Nuts, coconut water (liquid from coconut)"): "Bev",       # Canada_CNF
    ("NutSeed", "Nuts, coconut water (liquid from coconuts)"): "Bev",      # USDA
    ("Fruit", "Coconut, coconut water"): "Bev",                            # Japan_MEXT
    # A third Australia_AFCD coconut-water row missed by the NAME_CATEGORY_
    # OVERRIDES pair above -- "Water, coconut, commercial" doesn't collide
    # with the coconut-flesh base_name (its own short_name is already
    # distinct: "Water, coconut"), so a plain (category, base_name) override
    # is enough here, same as the other three rows in this dict. Keyed on
    # the post-natural_name_reorder form ("Coconut Water") since that pass
    # runs before this lookup. Found while spot-checking the 2026-07-29
    # rebuild for stray coconut-water miscategorizations after the reorder
    # pass changed this row's base_name from "Water, coconut".
    ("NutSeed", "Coconut Water"): "Bev",                                   # Australia_AFCD
    # Reported directly by the user, 2026-08-02: a "Butter" heading in the
    # Dairy & Eggs picker sat right above several items that plainly aren't
    # dairy staples at all. Two real miscategorizations confirmed by
    # checking each row directly (not everything under that heading was
    # actually wrong -- see the session's own investigation notes in
    # CLAUDE.md for what turned out to be correctly Dairy after all):
    #   - USDA's own "Beverage, instant breakfast powder" rows are filed
    #     under Dairy while Canada_CNF's identical real product ("Instant
    #     Breakfast Powder") is already correctly under Bev -- the name
    #     itself starts with the word "Beverage."
    ("Dairy", "Beverage, instant breakfast powder"): "Bev",                # USDA
    #   - "Cheese sauce, prepared from recipe" (USDA) and "Homemade Cheese
    #     Sauce" (Canada_CNF) are composite recipes (a roux-based sauce),
    #     not a whole dairy ingredient -- every OTHER cheese-sauce row in
    #     the database (Bechamel-based, gratin toppings, etc.) already
    #     correctly lives in Mixed; these two were the only ones left
    #     behind in Dairy.
    ("Dairy", "Cheese sauce, prepared from recipe"): "Mixed",              # USDA
    ("Dairy", "Homemade Cheese Sauce"): "Mixed",                           # Canada_CNF
    # Found while spot-checking the new food-name-grouping feature's own
    # "Cheese" group against the rebuilt database -- "Macaroni cheese,
    # canned" is a canned pasta dish (UK's own term for mac and cheese),
    # the exact same kind of composite dish as the two rows just above,
    # not a cheese variety.
    ("Dairy", "Macaroni cheese"): "Mixed",                                 # UK_CoFID
    # Reported directly by the user, 2026-08-02, asking whether any beans
    # filed under Vegetables belonged in Legume instead. Checked every
    # "bean"-named row in Veg by hand, not by a keyword scan -- the
    # existing, correct convention there is fresh/immature pods (green
    # beans, snap beans, immature broad/lima/soy beans) and sprouts
    # (mung/kidney/navy/pinto "mature seeds, sprouted" -- sprouting turns a
    # dried seed back into a fresh, water-rich food, confirmed via each
    # one's own real nutrient data: 76-93g water/100g, 20-78 kcal/100g,
    # matching every other sprout already correctly in Veg, not a dried
    # bean). Exactly one row broke that pattern: Germany_BLS's "Lima
    # bean/butter bean, mature" -- its own name says "mature," and its raw
    # nutrient profile (325 kcal, 11.5g water, 20.6g protein per 100g) is
    # unambiguously a dried legume, not a fresh vegetable pod. Legume
    # already carries this same real product from USDA, Japan_MEXT,
    # Canada_CNF, and Australia_AFCD -- Germany_BLS's own version had just
    # never been moved over alongside them.
    ("Veg", "Mature Lima Bean/Butter Bean"): "Legume",                     # Germany_BLS
}

# A tiny number of foods whose base_name collides with a completely
# different product because the source's own short_name field doesn't
# capture the real distinction -- found while investigating the juice
# reclassification below. Australia_AFCD's coconut rows are the case in
# point: "Coconut, fresh, mature fruit, flesh" (the solid meat) and
# "Coconut, fresh, mature, water or juice" (coconut water, a real
# beverage -- the same product already correctly filed under Bev for
# every other source in this database) both curate down to the identical
# base_name "Coconut, mature" today, because Australia_AFCD's short_name
# for both is just "Coconut, mature". A (category, base_name) override
# can't disambiguate two rows that already share the same base_name, so
# this is keyed on the full, still-unique `name` field instead, and
# overrides both the category and the base_name (giving the water/juice
# variant its own distinct identity rather than leaving it merged into
# the flesh's).
NAME_CATEGORY_OVERRIDES = {
    "Coconut, fresh, mature, water or juice": ("Bev", "Coconut water"),
    "Coconut, fresh, young or immature, water or juice": ("Bev", "Coconut water (young/immature)"),

    # Same collision, found while auditing every other Japan_MEXT row that
    # shares a base_name with "Carrot, regular (European type)" -- this
    # source's short_name for canned carrot JUICE is identical to its
    # short_name for the plain raw/boiled/frozen root, so the juice rule in
    # reclassify_category() above never sees the word "juice" for this row
    # at all. Every other source in this database already has "Carrot
    # juice" as its own distinct, correctly-Bev food (Germany_BLS,
    # Canada_CNF, USDA all show up under Bev already after this fix), so
    # this is the same real product filed under the wrong identity, not a
    # new judgment call.
    "Carrot, regular (European type), juice, canned": ("Bev", "Carrot juice"),

    # Japan_MEXT's "Tomatoes, canned products" family: "whole, without
    # salt" (the actual canned tomato pieces) sits alongside four juice
    # variants that all collapse to the same "Tomatoes" base_name their
    # short_name shares with the whole-tomato row. "juice, with/without
    # salt" is plain canned tomato juice; "tomato-based vegetable juice,
    # with/without salt" is the V8-style mixed-vegetable-and-tomato juice
    # drink (Japan_MEXT tabulates it as its own distinct sub-item, not the
    # same product under a different name) -- both are real beverages, not
    # the whole canned tomato they're currently indistinguishable from.
    "Tomatoes, canned products, juice, with salt": ("Bev", "Tomato juice with salt"),
    "Tomatoes, canned products, juice, without salt": ("Bev", "Tomato juice"),
    "Tomatoes, canned products, tomato-based vegetable juice, with salt": ("Bev", "Tomato-based vegetable juice with salt"),
    "Tomatoes, canned products, tomato-based vegetable juice, without salt": ("Bev", "Tomato-based vegetable juice"),

    # Japan_MEXT's own short_name for every "Oranges, Valencia" row --
    # including the whole-fruit "juice sacs, raw" entry (the segments,
    # eaten raw) -- is uniformly just "Oranges, Valencia" with no further
    # qualifier, unlike every other Japan_MEXT "X, N% fruit juice beverage"
    # food (e.g. "Apples, 30 % fruit juice beverage" keeps its full,
    # distinguishing short_name and was already correctly picked up by the
    # ordinary base_name juice rule above). Confirmed by checking every
    # sibling row: these four are genuine bottled/reconstituted juice
    # products, silently sharing an identity with the whole raw fruit
    # because of that one source-side short_name gap.
    "Oranges, Valencia, 30 % fruit juice beverage": ("Bev", "Orange juice beverage, Valencia (30%)"),
    "Oranges, Valencia, 50 % fruit juice beverage": ("Bev", "Orange juice beverage, Valencia (50%)"),
    "Oranges, Valencia, reconstituted fruit juice ": ("Bev", "Orange juice, Valencia (reconstituted)"),
    # Renamed 2026-08-02 (was "Orange juice, Valencia (straight)") -- once
    # this is the only Valencia-orange row kept in the app's own curated
    # Juice allowlist (the "imported from the U.S.A." sibling was dropped
    # as a near-duplicate of the same variety), "(straight)" no longer
    # distinguishes it from anything. This override runs AFTER
    # rename_juice_clean() below and unconditionally wins, so the clean
    # name has to be set here directly rather than in that dict.
    "Oranges, Valencia, straight fruit juice": ("Bev", "Valencia Orange"),

    # USDA's own "Short Display Name" column collapses four genuinely
    # different fluid-dairy products -- light/coffee/table cream (~18-20%
    # fat), light whipping cream (~30-36%), heavy whipping cream (~36-40%),
    # and half-and-half (~10-18%) -- down to the identical short_name
    # "Cream, fluid", losing the real fat-content distinction a Hashimoto's-
    # focused app specifically cares about. Found while researching a
    # "heavy cream" search alias and confirmed by reading the full, still-
    # unique `name` field for each row (not guessed): none of these four are
    # prep-state variants of one food the way "Beef, raw"/"Beef, cooked"
    # are, so this is a genuine identity collision like the coconut/juice
    # ones above, not a judgment call. Renamed to match the equivalent
    # product's own name in another source where one already exists
    # (Canada_CNF's "Cream, table (coffee), 18% M.F." -> "Table Cream
    # (Coffee)"; USDA's own other half-and-half rows -> "Cream, half and
    # half") rather than inventing a fourth naming scheme.
    "Cream, fluid, light (coffee cream or table cream)": ("Dairy", "Table Cream (Coffee)"),
    "Cream, fluid, light whipping": ("Dairy", "Light Whipping Cream"),
    "Cream, fluid, heavy whipping": ("Dairy", "Heavy Whipping Cream"),
    "Cream, fluid, half and half": ("Dairy", "Cream, half and half"),

    # Same "Short Display Name" collapse bug as fluid cream above, found
    # 2026-07-29 while checking a user-reported guava naming question:
    # USDA's and Canada_CNF's own short_name for "Guava, strawberry, raw" is
    # already just "Guava"/"Guavas" -- dropping "strawberry" entirely and
    # silently merging strawberry guava (Psidium cattleyanum -- a smaller,
    # tart, genuinely different fruit) into the same identity as plain
    # "Guava" (Germany_BLS's own truly-unspecified-variety row, and
    # "Common Guava"/"Common Guavas" -- Psidium guajava, a different
    # species). Confirmed by reading the full `name` field, which still
    # says "strawberry" even though short_name/base_name already lost it.
    "Guava, strawberry, raw": ("Fruit", "Strawberry Guava"),
    "Guavas, strawberry, raw": ("Fruit", "Strawberry Guava"),

    # Dry, not-yet-brewed tea/coffee/cocoa products found sharing a generic
    # base_name with a real PREPARED sibling -- 2026-08-02, part of the same
    # full-database Brewing re-audit as CATEGORY_OVERRIDES' own entries
    # above. USDA's own "Beverages, coffee"/"Beverages, tea"/"Beverages,
    # Cocoa mix"/"Beverages, Malted drink mix"/etc. base_names were never
    # split by prep state the way most of this database's own prep_method
    # column is -- e.g. "Beverages, coffee, instant, decaffeinated, powder"
    # (dry) and "Beverages, coffee, instant, decaffeinated, prepared with
    # water" (already brewed) both collapse to the identical base_name
    # "Beverages, coffee". A plain (category, base_name) override in
    # CATEGORY_OVERRIDES can't separate them -- it would sweep the prepared
    # row into Brewing right along with the dry one -- so each dry row is
    # targeted here individually by its own full, still-unique `name`, and
    # given a real distinct base_name instead of the generic shared one
    # (so it doesn't just re-collapse into an ambiguous "Beverages, coffee"
    # label once it's sitting in Brewing on its own). Every row NOT listed
    # here that shares one of these base_names is a real "prepared with
    # water/milk" or "brewed" sibling, confirmed by hand, and deliberately
    # left untouched in Bev.
    "Beverages, coffee, instant, chicory": ("Brewing", "Coffee, instant, chicory"),
    "Beverages, coffee, instant, decaffeinated, powder": ("Brewing", "Coffee, instant, decaffeinated, powder"),
    "Beverages, coffee, instant, regular, half the caffeine": ("Brewing", "Coffee, instant, regular, half the caffeine"),
    "Beverages, coffee, instant, regular, powder": ("Brewing", "Coffee, instant, regular, powder"),
    "Beverages, coffee, instant, with chicory": ("Brewing", "Coffee, instant, with chicory"),
    "Beverages, coffee, instant, with whitener, reduced calorie": ("Brewing", "Coffee, instant, with whitener, reduced calorie"),
    "Beverages, tea, green, instant, decaffeinated, lemon, unsweetened, fortified with vitamin C": (
        "Brewing",
        "Tea, green, instant, decaffeinated, lemon, unsweetened, fortified with vitamin C",
    ),
    "Beverages, tea, instant, decaffeinated, lemon, diet": ("Brewing", "Tea, instant, decaffeinated, lemon, diet"),
    "Beverages, tea, instant, decaffeinated, unsweetened": ("Brewing", "Tea, instant, decaffeinated, unsweetened"),
    "Beverages, tea, instant, lemon, diet": ("Brewing", "Tea, instant, lemon, diet"),
    "Beverages, tea, instant, lemon, unsweetened": ("Brewing", "Tea, instant, lemon, unsweetened"),
    "Beverages, tea, instant, lemon, with added ascorbic acid": ("Brewing", "Tea, instant, lemon, with added ascorbic acid"),
    # Deliberately given the SAME base_name an existing Canada_CNF row in
    # Brewing already uses -- both are genuinely the same real product
    # (plain unsweetened instant tea powder), just measured by two
    # different national sources, exactly the same cross-source sharing
    # every other same-named food in this database already does.
    "Beverages, tea, instant, unsweetened, powder": ("Brewing", "Tea, instant, unsweetened, powder"),
    "Beverages, Cocoa mix, low calorie, powder, with added calcium, phosphorus, aspartame, without added sodium or vitamin A": (
        "Brewing",
        "Cocoa mix, low calorie, powder",
    ),
    "Beverages, Cocoa mix, no sugar added, powder": ("Brewing", "Cocoa mix, no sugar added, powder"),
    "Beverages, Cocoa mix, powder": ("Brewing", "Cocoa mix, powder"),
    "Beverages, coffee and cocoa, instant, decaffeinated, with whitener and low calorie sweetener": (
        "Brewing",
        "Coffee and cocoa, instant, decaffeinated, with whitener",
    ),
    "Beverages, Malted drink mix, natural, powder, dairy based.": ("Brewing", "Malted drink mix, natural, powder, dairy based"),
    "Beverages, malted drink mix, chocolate, powder": ("Brewing", "Malted drink mix, chocolate, powder"),
    "Beverages, OVALTINE, Classic Malt powder": ("Brewing", "OVALTINE, Classic Malt powder"),
    "Beverages, OVALTINE, chocolate malt powder": ("Brewing", "OVALTINE, chocolate malt powder"),
    "Beverages, rich chocolate, powder": ("Brewing", "Rich chocolate, powder"),
    "Beverages, Carob-flavor beverage mix, powder": ("Brewing", "Carob-flavor beverage mix, powder"),
    "Beverages, chocolate-flavor beverage mix for milk, powder, with added nutrients": (
        "Brewing",
        "Chocolate-flavor beverage mix for milk, powder",
    ),
    # Found on the same final "any powder still in Bev" sweep as Horlicks
    # above -- shares base_name "Beverages, Dairy drink mix" (case-collapsed
    # with its own lowercase "dairy drink mix" sibling, which already has
    # "prepared with water and ice" in its own name and correctly stays in
    # Bev) with a real prepared sibling, same risk as the other USDA
    # "Beverages, X" families already handled this way above.
    "Beverages, Dairy drink mix, chocolate, reduced calorie, with low-calorie sweeteners, powder": (
        "Brewing",
        "Dairy drink mix, chocolate, reduced calorie, powder",
    ),
}

# Citrus "juice sacs" are the anatomical juice-filled vesicles that make up
# a citrus segment's flesh -- i.e. the ordinary way citrus is eaten (with a
# spoon or by hand), not a poured beverage. Most Japan_MEXT "juice sacs"
# rows already drop the phrase entirely from their own short_name (e.g.
# "Citrus, "Harumi", juice sacs, raw" -> short_name "Citrus, "Harumi""), so
# they never reach the juice check below in the first place. A handful of
# others keep "juice sacs" as part of their own short_name/base_name and
# need to be hand-excluded so the juice rule doesn't wrongly treat them as
# a beverage. "Satsuma mandarins, juice with juice sacs" is the one
# genuinely ambiguous case (it could plausibly mean "juice, with pulp" --
# a real drinkable product) -- included here anyway as the conservative
# choice: staying in Fruit risks nothing (it's still a real citrus food
# either way), while a wrong move to Bev would misfile an actual
# whole-fruit-adjacent food as a beverage.
JUICE_SAC_EXCLUSIONS = {
    "Oroblanco, juice sacs",
    "Ponkan mandarins, juice sacs",
    "Pummelo, juice sacs",
    "Satsuma mandarins, juice sacs",
    "Satsuma mandarins, juice with juice sacs",
}

# The rest of the dataset already names most bean varieties type-first
# ("Kidney beans", "Lima bean/butter bean"), but USDA/Canada/UK/Australia
# instead store many as "Beans, kidney" / "Bean, red kidney" -- normalize
# those to the same type-first convention. Deliberately skips any base_name
# containing "(" so a parenthetical qualifier never gets torn apart or
# reordered into something wrong (e.g. "Beans, winged (goa beans)"), and
# skips the one clearly non-type entry ("Beans, legumes" is a miscellaneous
# bucket, not itself a bean type).
BEAN_RENAME_EXCLUDE = {
    "Beans, legumes",
}


def _titleize_first_letters(text):
    return " ".join(word[0].upper() + word[1:] if word else word for word in text.split(" "))


def rename_bean_type_first(base_name):
    if not base_name or base_name in BEAN_RENAME_EXCLUDE or "(" in base_name:
        return base_name

    match = re.match(r"^(Beans?), (.+)$", base_name)
    if not match:
        return base_name

    bean_word, type_part = match.group(1), match.group(2).strip()
    if not type_part:
        return base_name

    return f"{_titleize_first_letters(type_part)} {bean_word}"


# Sprouted seeds/beans/legumes eaten as fresh shoots. Normalizes the mix of
# "X seeds, sprouted" / "Sprout, X" / "Bean sprouts, X sprouts" source
# phrasings into a consistent "X Sprouts" naming, hand-verified so real
# unrelated vegetables that happen to contain "sprout" (Brussels sprouts is
# a totally different plant, not a sprouted seed) are never touched.
#
# 2026-07-31: these move OUT of Veg into their own top-level "Sprouts"
# category (see SPROUT_BASE_NAMES / reclassify_category below), and the
# "(Microgreens)" suffix these names used to carry was dropped. Two separate
# reasons, both real:
#   1. The suffix was simply wrong. Every one of these 73 rows is a SPROUT
#      (seed germinated in water, no soil/light, harvested 2-7 days, eaten
#      whole including seed hull and root), not a microgreen (sown in soil
#      under light, harvested 7-21 days, cut above the soil line so only
#      stem and leaves are eaten). The two are routinely conflated in
#      casual use but are genuinely different foods. This database contains
#      zero true microgreens, so nothing is left behind by the rename.
#   2. They earn their own category rather than sitting inside Veg because
#      they play a different role on the plate: a raw garnish/booster
#      scattered on top, not the fiber-and-bulk baseline mature vegetables
#      provide. Filing them alongside mature vegetables invites treating a
#      handful of sprouts as a vegetable serving, which it isn't.
# Raw sprouts also carry a real, separately-documented food-safety profile
# (warm/wet/dark growing conditions, whole-seed consumption) that mature
# vegetables don't -- deliberately NOT asserted anywhere in the app yet,
# pending a proper cited research pass, same discipline as D1-D6.
SPROUT_RENAMES = {
    "Alfalfa seeds, sprouted": "Alfalfa Sprouts",
    "Sprout, alfalfa": "Alfalfa Sprouts",
    "Bean sprouts, alfalfa sprouts": "Alfalfa Sprouts",
    "Lucerne/alfalfa sprouts": "Lucerne/Alfalfa Sprouts",
    "Broccoli, sprouts": "Broccoli Sprouts",
    "Radish seeds, sprouted": "Radish Sprouts",
    "Lentils, sprouted": "Lentil Sprouts",
    "Lentils sprouted": "Lentil Sprouts",
    "Peas, sprouts": "Pea Sprouts",
    "Bean sprouts, black gram sprouts": "Black Gram Sprouts",
    "Bean sprouts, mung bean sprouts": "Mung Bean Sprouts",
    "Bean sprouts, soybean sprouts": "Soybean Sprouts",
    "Beansprouts, mung": "Mung Bean Sprouts",
    "Mung bean sprouts": "Mung Bean Sprouts",
    "Soya bean sprouts": "Soya Bean Sprouts",
    "Sprout, bean": "Bean Sprouts",
    "Water pepper sprouts": "Water Pepper Sprouts",
}

# A handful of sprouted foods share their base_name with that same food's
# dry/mature form, because the source's own pre-cleaned short_name field
# doesn't isolate "sprouted" as its own clause (e.g. "Peas, mature seeds"
# covers both dry peas AND pea sprouts under one base_name; "Kidney Beans"
# covers both dry kidney beans and sprouted kidney beans). Found by hand, a
# full sweep for every base_name with both a Veg "sprouted" row and a
# same-named row in another category -- not a broad keyword rule. Only the
# rows whose *full* name actually contains "sprouted" get redirected;
# everything else under that base_name (the real dry/mature-seed food, or a
# genuinely different fresh/immature form like immature pinto beans) is
# untouched.
SPROUTED_VARIANT_SPLITS = {
    "Peas, mature seeds": "Pea Sprouts",
    "Mung beans, mature seeds": "Mung Bean Sprouts",
    "Soybeans, mature seeds": "Soybean Sprouts",
    "Mung Beans": "Mung Bean Sprouts",
    "Kidney Beans": "Kidney Bean Sprouts",
    "Navy Beans": "Navy Bean Sprouts",
    "Pinto Beans": "Pinto Bean Sprouts",
}


def rename_sprout(base_name, full_name):
    split_target = SPROUTED_VARIANT_SPLITS.get(base_name)
    if split_target and full_name and "sprouted" in full_name.lower():
        return split_target
    return SPROUT_RENAMES.get(base_name, base_name)


# "Sweet Pepper" was, until this fix (2026-08-02), one generic base_name
# covering every color of bell pepper -- real, reported problem: browsing
# the Vegetables list (which just shows base_name strings alphabetically,
# unlike a typed search, aliases never come into play there) never showed
# anything a person would recognize as a bell pepper by color, even though
# every single one of the 18 real USDA rows behind that base_name (verified
# directly against the built database) already names its own color in the
# full `name` field ("Peppers, sweet, red, raw", "..., green, ...", "...,
# yellow, ..."). Confirmed no USDA "Sweet Pepper" row is colorless, and no
# other source uses this base_name at all, so this split has no fallback
# case to worry about. Applied after reorder_base_name() (base_name is
# already its final "Sweet Pepper" form by then) rather than earlier in the
# pipeline, since detecting color needs the untouched full name/prep-state
# text split_prep_method() already consumed.
def rename_sweet_pepper_by_color(base_name, full_name):
    if base_name != "Sweet Pepper" or not full_name:
        return base_name
    lowered = full_name.lower()
    for color in ("red", "green", "yellow", "orange"):
        if re.search(r"\b" + color + r"\b", lowered):
            return f"{color.title()} Bell Pepper"
    return base_name


# "Chicken Egg" family unification, 2026-08-02 -- reported directly by the
# user: "we have a bunch of different eggs in the list but none say Chicken
# Egg." Confirmed against the built database this was never missing data
# (50+ real chicken-egg rows already existed across USDA, Germany_BLS,
# Canada_CNF, Australia_AFCD and Japan_MEXT) but inconsistent, sometimes
# entirely silent, labeling:
#   - USDA's own unqualified "Egg, whole"/"Egg, white"/"Egg, yolk" rows are
#     chicken by USDA's own unstated convention -- every other species in
#     the source data names itself explicitly (Duck/Goose/Turkey/Quail) --
#     but say nothing about species at all once reordered to "Whole Egg"/
#     "White Egg"/"Egg, yolk".
#   - Canada_CNF/Australia_AFCD's own "Egg, chicken, ..." rows and
#     Japan_MEXT's "Eggs, hen, ..." rows (hen = female chicken) DO say
#     chicken already, but reorder_base_name() deliberately only reorders
#     single-comma names (see natural_name_reorder.py) -- every one of
#     these has 2+ commas, so none of them ever got the same "Duck Egg"/
#     "Goose Egg"/"Turkey Egg" treatment their non-chicken counterparts got.
#   - Germany_BLS's own rows already say "Chicken egg ..." but in sentence
#     case, one letter off this app's Title Case convention -- close enough
#     to read as a near-duplicate of whatever the fixed USDA rows end up
#     saying, rather than the exact same entry.
# Bare, no-further-qualifier forms (just "whole"/"white"/"yolk"/"poached")
# are merged onto one shared base_name across all these sources -- the same
# single-family-per-species shape Duck Egg/Goose Egg/Turkey Egg already
# have, differentiated by prep_method/source rather than by base_name text.
# Rows with a genuine extra qualifier beyond that (a specific omelet, a
# frozen/dried processing detail) keep their own comma-clause tail verbatim,
# minimally re-prefixed with "Chicken Egg," -- consistent with this whole
# module's standing rule against guessing a fuller natural-language reorder
# than what's actually known to be safe. "Chicken Egg Roll" (a USDA
# appetizer dish, not literally an egg) is deliberately not in this dict and
# doesn't match either generic prefix below, so it's left untouched.
CHICKEN_EGG_EXACT_RENAMES = {
    "Whole Egg": "Chicken Egg",
    "Whole Egg (Poached)": "Chicken Egg Poached",
    "White Egg": "Chicken Egg White",
    "Egg, yolk": "Chicken Egg Yolk",
    "Egg, chicken, whole": "Chicken Egg",
    "Egg, chicken, white": "Chicken Egg White",
    "Egg, chicken, yolk": "Chicken Egg Yolk",
    "Eggs, hen,  whole": "Chicken Egg",
    "Eggs, hen, whole": "Chicken Egg",
    "Eggs, hen, white": "Chicken Egg White",
    "Eggs, hen, yolk": "Chicken Egg Yolk",
    "Eggs, hen, whole, poached egg": "Chicken Egg Poached",
    "Chicken egg": "Chicken Egg",
    "Chicken egg poached": "Chicken Egg Poached",
    "Chicken egg powder": "Chicken Egg Powder",
    "Chicken egg white": "Chicken Egg White",
    "Chicken egg white, poached": "Chicken Egg White Poached",
    "Chicken egg yolk": "Chicken Egg Yolk",
}


# A second, different kind of information loss found the same day the
# chicken-egg fix above was made, while checking a user-reported list of
# unclear cheese names ("what kind of cheese is cheese, dry white?"):
# split_prep_method()'s strategy 2 used to silently discard a trailing
# comma-clause whenever it didn't match a known cooking/raw/storage term,
# losing "queso seco" from "Cheese, dry white, queso seco" and "cheddar or
# colby" from "Cheese, low-sodium, cheddar or colby". Originally fixed here
# as a narrow, hand-verified rename for just these two rows -- superseded
# and made dead 2026-08-02, the same day, once the SAME mechanism turned
# out to be silently erasing 36 USDA wine varietals and 3 branded beers
# down to "Wine Alcoholic Beverage"/"Beer Alcoholic Beverage" (see
# split_prep_method's own docstring). That's when the root mechanism
# itself got fixed instead of patching a fourth one-off case -- and the
# general fix already produces "Cheese, dry white, queso seco" verbatim as
# base_name, so this dict's lookup key ("Cheese, dry white", the OLD
# truncated intermediate value) no longer occurs anywhere in the pipeline.
# Removed rather than left as unreachable code.


def rename_chicken_egg(base_name):
    exact = CHICKEN_EGG_EXACT_RENAMES.get(base_name)
    if exact:
        return exact
    if base_name.startswith("Egg, chicken,"):
        rest = base_name[len("Egg, chicken,"):].strip()
        return f"Chicken Egg, {rest}"
    if base_name.startswith("Eggs, hen,"):
        rest = base_name[len("Eggs, hen,"):].strip()
        return f"Chicken Egg, {rest}"
    return base_name


# Reported directly by the user, 2026-08-02: "the names of these things are
# so long that I can't tell why they are different at all... Is there
# really no difference between vodka, whiskey, rum, and gin for the proof
# levels?" Confirmed via WebSearch and directly against this database's own
# numbers: at a given proof, USDA's own vodka/rum/"all" 80-proof rows and
# Canada_CNF's own whisky/rum/vodka 40%-ABV rows are EXACT matches (231
# kcal/100g) within each source -- distillation removes virtually
# everything about the base ingredient that would affect calories, so
# proof is what actually distinguishes these, not the grain/plant/brand.
# These two renames give USDA's own clean, real 80/86-proof rows a short
# name matching that reality, instead of the verbose "Alcoholic beverage,
# distilled, X, Y proof" wrapper every row in this whole family shares
# (which is exactly what made them unreadable side by side). The redundant
# near-duplicate entries this creates (Canada_CNF/Germany_BLS/France_Ciqual/
# Japan_MEXT/Australia_AFCD's own separate vodka/gin/rum/whisky rows, all
# measuring the same real thing) are excluded from the app's own Alcohol
# browsing in lib/db.ts instead of altered here -- this file's job is
# keeping the reference data itself correct and complete (useful later, a
# future barcode-scan feature might want exactly this source diversity),
# not deciding what a person should be offered to pick from today.
SPIRIT_CLEAN_RENAMES = {
    "Alcoholic beverage, distilled, vodka, 80 proof": "Vodka, 80 Proof",
    "Alcoholic beverage, distilled, whiskey, 86 proof": "Whiskey, 86 Proof",
}


def rename_spirit_clean(base_name):
    return SPIRIT_CLEAN_RENAMES.get(base_name, base_name)


# Found while the user was reviewing the new Bev > Juice allowlist
# (lib/db.ts's BEV_JUICE_ALLOWED_NAMES) row by row, 2026-08-02, same day:
# two real cross-source near-duplicates that only look like different foods
# because of inconsistent formatting, not because they measure anything
# different.
#   - USDA's own "purple"/"yellow" passion fruit juice rows reorder to
#     "Purple/Yellow Passion-Fruit Juice" (hyphenated) while Canada_CNF's
#     otherwise-identical rows reorder to "Purple/Yellow Passion Fruit
#     Juice" (space) -- purely a hyphen-vs-space difference in how each
#     source itself writes the word, not a real distinction. Hyphen
#     dropped to match the more common styling (also matching this
#     database's own existing "Passion fruit juice"/"Passion fruit, juice,
#     fresh" rows, neither of which hyphenates it either).
#   - USDA's "Pomegranate juice, bottled" and Canada_CNF's "Pomegranate
#     juice, ready-to-drink" are the same real thing (plain pomegranate
#     juice) described two different ways -- neither qualifier states any
#     real difference (everything in this app's Juice list is bottled/
#     drinkable in some form), so both collapse to the plain name.
#   - Three more added 2026-08-02, same day, once the person asked for the
#     Juice list itself trimmed down to one row per real fruit/variety
#     rather than several near-duplicate rows per fruit: Japan_MEXT's own
#     "Citrus, Seminole, juice sacs" / "Citrus, sour oranges, juice, fresh"
#     / "Oranges, navel, juice sacs" -- none of these are Japanese-named
#     fruits (Seminole is a Florida-bred tangelo; sour/bitter orange and
#     navel orange are both globally common terms), just rows this
#     database happens to have only from Japan_MEXT, so each is kept as
#     its own plain, clean-named entry rather than folded into the
#     Japanese-cultivar group. The equivalent Valencia-orange clean-up
#     ("Oranges, Valencia, straight fruit juice" -> "Valencia Orange") had
#     to go directly into NAME_CATEGORY_OVERRIDES above instead of here --
#     that override runs AFTER this dict and unconditionally wins for the
#     handful of rows it covers, so a JUICE_CLEAN_RENAMES entry for it
#     would silently never be reached.
JUICE_CLEAN_RENAMES = {
    "Purple Passion-Fruit Juice": "Purple Passion Fruit Juice",
    "Yellow Passion-Fruit Juice": "Yellow Passion Fruit Juice",
    "Bottled Pomegranate Juice": "Pomegranate Juice",
    "Pomegranate juice, ready-to-drink": "Pomegranate Juice",
    "Citrus, Seminole, juice sacs": "Seminole",
    "Citrus, sour oranges, juice, fresh": "Sour Orange",
    "Oranges, navel, juice sacs": "Navel Orange",
    "Orange juice, Valencia (straight)": "Valencia Orange",
}


def rename_juice_clean(base_name):
    return JUICE_CLEAN_RENAMES.get(base_name, base_name)


# Every base_name rename_sprout() can possibly produce -- i.e. exactly the
# set of foods that belong in the "Sprouts" category, derived from the two
# hand-verified dicts above rather than pattern-matched on the word
# "sprout". A suffix/substring rule would be actively wrong here: "Brussels
# sprout" is a completely different plant (a mature brassica, not a
# germinated seed) and must stay in Veg.
SPROUT_BASE_NAMES = set(SPROUT_RENAMES.values()) | set(SPROUTED_VARIANT_SPLITS.values())


# Plain-language alias fixes -- base_name is technically correct as-is but
# doesn't include the common household term someone would actually search
# for. Applied as a durable rename here (rather than a one-off hand-patch
# directly on assets/data/foods_reference.db) so it survives every future
# rebuild from the source workbook. "Snap Beans" is the real USDA/Vegetables
# name for what most people call "green beans"; confirmed on-device
# (2026-07-27) that searching "green bean" against the shipped database
# returns nothing without this alias.
#
# The block below (2026-07-29) is a scoped Fruit-only pass fixing a
# different, real duplicate-listing bug: the same whole food often appears
# TWICE under two different base_name values purely because different
# national sources spell it differently -- USDA/Japan_MEXT tend to write
# things plural ("Apples", "Blueberries"), while Canada_CNF/Germany_BLS/
# Australia_AFCD tend to write the identical real food singular ("Apple",
# "Blueberry"). Every entry below was hand-verified by reading both sides'
# full `name` field (and scientific_classification where populated) to
# confirm they're the same real food, not two different foods that happen
# to look similar -- this is NOT a blind "strip the trailing s" transform.
# Deliberately NOT applied to mass-plural-only nouns with no natural
# singular (e.g. "Oats", "Grits") -- those never had a colliding singular
# base_name in the data in the first place, so they never became candidates
# here at all. See scripts/fruit_pluralization_REPORT.md for the full
# methodology, the complete verified list with justification, everything
# considered and deliberately left alone, and other collision bugs flagged
# for a human reviewer rather than fixed here.
BASE_NAME_ALIAS_RENAMES = {
    "Snap Beans": "Snap Beans (Green Beans)",

    # --- Fruit: plain plural -> plain singular, same real food/species ---
    # (verified via matching scientific_classification where populated --
    # e.g. Malus domestica for every Apple/Apples row -- and by reading the
    # full `name` field on both sides otherwise.)
    "Apples": "Apple",
    "Apricots": "Apricot",
    "Avocados": "Avocado",
    "Bananas": "Banana",
    "Blackberries": "Blackberry",
    "Blueberries": "Blueberry",
    "Boysenberries": "Boysenberry",
    "Chokecherries": "Chokecherry",
    "Clementines": "Clementine",
    "Cloudberries": "Cloudberry",
    "Crabapples": "Crabapple",
    "Cranberries": "Cranberry",
    "Dates": "Date",
    "Elderberries": "Elderberry",
    "Figs": "Fig",
    "Goji berries": "Goji berry",
    "Gooseberries": "Gooseberry",
    "Grapes": "Grape",
    "Guavas": "Guava",
    "Kumquats": "Kumquat",
    "Lemons": "Lemon",
    "Limes": "Lime",
    "Loganberries": "Loganberry",
    "Longans": "Longan",
    "Loquats": "Loquat",
    "Lychees": "Lychee",
    "Mangoes": "Mango",
    "Mangos": "Mango",
    "Mulberries": "Mulberry",
    "Nectarines": "Nectarine",
    "Oheloberries": "Oheloberry",
    "Olives": "Olive",
    "Oranges": "Orange",
    "Papayas": "Papaya",
    "Peaches": "Peach",
    "Pears": "Pear",
    "Persimmons": "Persimmon",
    "Plums": "Plum",
    "Pomegranates": "Pomegranate",
    "Prickly pears": "Prickly pear",
    "Quinces": "Quince",
    "Raspberries": "Raspberry",
    "Rose-apples": "Rose-apple",
    "Salmonberries": "Salmonberry",
    "Satsuma mandarins": "Satsuma mandarin",
    "Strawberries": "Strawberry",
    "Tamarinds": "Tamarind",

    # --- Fruit: plural + a trailing comma-qualifier that matches exactly
    # on both sides (same variety/prep/state word after the comma) ---
    "Apples, dehydrated (low moisture)": "Apple, dehydrated (low moisture)",
    "Apricots, dehydrated (low moisture)": "Apricot, dehydrated (low moisture)",
    "Blackberries, wild": "Blackberry, wild",
    "Blueberries, wild": "Blueberry, wild",
    "Cherries, sour": "Cherry, sour",
    "Cherries, sweet": "Cherry, sweet",
    "Currants, european black": "Currant, european black",
    "Currants, red and white": "Currant, red and white",
    "Currants, zante": "Currant, zante",
    "Dates, medjool": "Date, medjool",
    # Truncated source short_name missing its closing paren on both sides
    # (a pre-existing upstream data-quality quirk, same pattern already
    # documented elsewhere in this file for other rows -- not something to
    # fix here, just preserved identically on both sides of this merge).
    "Grapes, red or green (European type": "Grape, red or green (European type",
    "Guavas, common": "Guava, common",
    "Melons, cantaloupe": "Melon, cantaloupe",
    "Melons, casaba": "Melon, casaba",
    "Melons, honeydew": "Melon, honeydew",
    "Olives, ripe": "Olive, ripe",
    "Oranges, navel": "Orange, navel",
    "Peaches, yellow": "Peach, yellow",
    "Pears, asian": "Pear, asian",
    "Persimmons, native": "Persimmon, native",
    "Plantains, green": "Plantain, green",
    "Raisins, seeded": "Raisin, seeded",

    # --- Fruit: hand-caught special cases the general plural-stripping
    # patterns above don't reach on their own (a differing hyphen/spacing,
    # or an alternate-name qualifier phrased slightly differently), each
    # individually confirmed same species via scientific_classification. ---
    # USDA's own hyphenated "(low-moisture)" spelling of the same product
    # Canada_CNF spells "(low moisture)" (a space) -- same food, same
    # dehydration process, just a source-side punctuation difference.
    "Apricots, dehydrated (low-moisture)": "Apricot, dehydrated (low moisture)",
    "Peaches, dehydrated (low-moisture)": "Peach, dehydrated (low moisture)",
    "Prunes, dehydrated (low-moisture)": "Prune, dehydrated (low moisture)",
    # Sugar-apple = sweetsop, both real common names for the same species
    # (Annona squamosa) -- USDA's own base_name keeps the "(sweetsop)"
    # synonym as well as the plural "Sugar-apples"; merged directly into
    # Canada_CNF's existing plain singular "Sugar-apple" identity rather
    # than inventing a third, differently-punctuated bucket.
    "Sugar-apples, (sweetsop)": "Sugar-apple",
    # Tangerine = mandarin orange (Citrus reticulata); USDA's own
    # parenthetical says "(mandarin oranges)" where Canada_CNF's equivalent
    # singular entry already says "(mandarin)" -- same alternate-name
    # annotation, just worded slightly differently, so merged into
    # Canada_CNF's existing phrasing rather than the unannotated bare
    # "Tangerine" bucket.
    "Tangerines, (mandarin oranges)": "Tangerine, (mandarin)",

    # --- Bev: intra-source (both USDA) inconsistency, not cross-source --
    # bare "Alcoholic beverages, X" vs the rest of USDA's own "Alcoholic
    # beverage, X" rows, same real category (beer/wine) split across a
    # stray pluralized identity. See scripts/bev_alcohol_mixed_baked_
    # supplement_cleanup_REPORT.md for full verification.
    "Alcoholic beverages, beer": "Alcoholic beverage, beer",
    "Alcoholic beverages, wine": "Alcoholic beverage, wine",

    # --- Mixed ---
    "Lamb chops": "Lamb chop",
    "Meatballs": "Meatball",
    "Pizza rolls": "Pizza roll",
    "Egg rolls, chicken": "Egg roll, chicken",
    "Egg rolls, pork": "Egg roll, pork",
    "Egg rolls, vegetable": "Egg roll, vegetable",

    # --- Baked ---
    "Taco shells": "Taco shell",
    "Bagels, cinnamon-raisin": "Bagel, cinnamon-raisin",
    "Bagels, egg": "Bagel, egg",
    "Bagels, oat bran": "Bagel, oat bran",
    "Crackers, cheese": "Cracker, cheese",
    "Crackers, crispbread": "Cracker, crispbread",
    "Crackers, matzo": "Cracker, matzo",
    "Crackers, melba toast": "Cracker, melba toast",
    "Crackers, milk": "Cracker, milk",
    "Crackers, multigrain": "Cracker, multigrain",
    "Crackers, rusk toast": "Cracker, rusk toast",
    "Crackers, rye": "Cracker, rye",
    "Crackers, standard snack-type": "Cracker, standard snack-type",
    "Crackers, wheat": "Cracker, wheat",
    "Crackers, whole-wheat": "Cracker, whole-wheat",
    "Croissants, apple": "Croissant, apple",
    "Croissants, butter": "Croissant, butter",
    "Croissants, cheese": "Croissant, cheese",
    "Leavening agents, baking powder": "Leavening agent, baking powder",
    "Leavening agents, cream of tartar": "Leavening agent, cream of tartar",
    "Leavening agents, yeast": "Leavening agent, yeast",
    "Muffins, blueberry": "Muffin, blueberry",
    "Muffins, corn": "Muffin, corn",
    "Muffins, plain": "Muffin, plain",
    "Muffins, wheat bran": "Muffin, wheat bran",
    "Pancakes, blueberry": "Pancake, blueberry",
    "Pancakes, buckwheat": "Pancake, buckwheat",
    "Pancakes, buttermilk": "Pancake, buttermilk",
    "Pancakes, plain": "Pancake, plain",
    "Pancakes, whole wheat": "Pancake, whole wheat",
    "Pancakes, whole-wheat": "Pancake, whole-wheat",
    "Popovers, dry mix": "Popover, dry mix",
    "Rolls, dinner": "Roll, dinner",
    "Rolls, french": "Roll, french",
    "Rolls, pumpernickel": "Roll, pumpernickel",
    "Sweet rolls, cheese": "Sweet roll, cheese",
    "Waffles, buttermilk": "Waffle, buttermilk",
    "Waffles, chocolate chip": "Waffle, chocolate chip",
    "Waffles, plain": "Waffle, plain",
    "Waffles, whole wheat": "Waffle, whole wheat",
    # Hand-caught (didn't fall out of the mechanical suffix rules -- found
    # by reading the full base_name list and checking near-miss wording):
    "Biscuits, plain or buttermilk": "Biscuit, plain/buttermilk",
    "Muffins, English": "Muffin, English style",
    "Rolls, hard (includes kaiser)": "Roll (kaiser), hard",
    "Tortillas, ready-to-bake or -fry": "Tortilla, ready-to-bake / fry",
    "Wonton wrappers (includes egg roll wrappers)": "Wonton wrapper (egg roll wrapper)",
    "English muffins, plain": "English muffin, plain (also sourdough)",

    # --- SupplementPowder: no plural/singular candidates found. ---

    # --- Veg: plain plural -> plain singular, whole base_name, no comma
    # clause (verified via matching scientific_classification where
    # populated -- e.g. Daucus carota subsp. sativus for every Carrot/
    # Carrots row -- and by reading the full `name` field on both sides
    # otherwise). ---
    "Artichokes": "Artichoke",
    "Bamboo shoots": "Bamboo shoot",
    "Brussels sprouts": "Brussels sprout",
    "Carrots": "Carrot",
    "Onions": "Onion",
    "Parsnips": "Parsnip",
    "Potato puffs": "Potato puff",
    "Potatoes": "Potato",
    "Radishes": "Radish",
    "Rutabagas": "Rutabaga",
    "Sesbania flowers": "Sesbania flower",
    "Shallots": "Shallot",
    "Tomatillos": "Tomatillo",
    "Tomatoes": "Tomato",
    "Turnips": "Turnip",

    # --- Veg: plural + a trailing comma-qualifier that matches exactly on
    # both sides (same variety/color/prep word after the comma). ---
    "Carrots, baby": "Carrot, baby",
    "Onions, dehydrated flakes": "Onion, dehydrated flakes",
    "Onions, sweet": "Onion, sweet",
    # Case-only difference ("welsh" vs "Welsh") -- same species (Allium
    # fistulosum, confirmed on the USDA plural row); merged into the
    # existing singular entry's own capitalization rather than renaming it.
    "Onions, welsh": "Onion, Welsh",
    "Onions, yellow": "Onion, yellow",
    "Onions, young green": "Onion, young green",
    "Peppers, ancho": "Pepper, ancho",
    "Peppers, chili": "Pepper, chili",
    "Peppers, hot chili": "Pepper, hot chili",
    # Case-only difference ("hungarian" vs "Hungarian"), Capsicum annuum
    # confirmed both sides.
    "Peppers, hungarian": "Pepper, Hungarian",
    "Peppers, jalapeno": "Pepper, jalapeno",
    "Peppers, pasilla": "Pepper, pasilla",
    "Peppers, serrano": "Pepper, serrano",
    "Peppers, sweet": "Pepper, sweet",
    "Potatoes, flesh and skin": "Potato, flesh and skin",
    "Potatoes, new": "Potato, new",
    "Potatoes, red": "Potato, red",
    # Case-only difference ("russet" vs "Russet"), Solanum tuberosum
    # confirmed on the USDA plural row. USDA itself is internally
    # inconsistent about which case it uses across its own two rows
    # ("Potatoes, russet, ..., raw" vs "Potatoes, Russet, ..., baked"), so
    # both source casings need their own alias entry -- a plain dict lookup
    # is case-sensitive even though the foods table's base_name column
    # itself is declared COLLATE NOCASE for SQL comparisons.
    "Potatoes, russet": "Potato, Russet",
    "Potatoes, Russet": "Potato, Russet",
    "Potatoes, white": "Potato, white",
    "Radishes, hawaiian style": "Radish, hawaiian style",
    "Radishes, white icicle": "Radish, white icicle",
    "Sweet potatoes, tuberous root": "Sweet potato, tuberous root",
    "Tomatoes, crushed": "Tomato, crushed",
    "Tomatoes, green": "Tomato, green",
    "Tomatoes, orange": "Tomato, orange",
    "Tomatoes, red": "Tomato, red",
    "Tomatoes, yellow": "Tomato, yellow",
    # Same species both sides (Psophocarpus tetragonolobus) -- USDA's own
    # third row ("with salt") happens to be singular "Winged bean" where its
    # sibling two rows are plural "Winged beans", a same-source internal
    # inconsistency rather than a cross-source one.
    "Winged beans, immature seeds": "Winged bean, immature seeds",

    # --- Veg: hand-caught special cases the general plural-stripping
    # patterns above don't reach on their own (a differing capitalization
    # stacked on top of the plural, or the pre-existing bean-type-first
    # renaming producing a plural form that collides with an already-
    # singular USDA entry). ---
    # Capitalization difference only ("Potato" vs "potato"), same frozen
    # potato-puff product.
    "Sweet Potato puffs": "Sweet potato puff",
    # Capitalization difference only ("Potatoes" vs "potato"), Ipomoea
    # batatas confirmed on the USDA plural row.
    "Sweet Potatoes": "Sweet potato",
    # rename_bean_type_first() above already turns Canada_CNF's "Beans,
    # yardlong, (asparagus bean or cowpea)" into "Yardlong Beans" (plural,
    # title-cased) -- merged into USDA's own pre-existing singular
    # "Yardlong bean" (Vigna unguiculata subsp. sesquipedalis).
    "Yardlong Beans": "Yardlong bean",
}


def apply_base_name_alias(base_name):
    return BASE_NAME_ALIAS_RENAMES.get(base_name, base_name)


# --- Raw nutrient import (Phase 1: the "standard panel") -------------------
#
# The source workbook has ~750 raw per-source nutrient columns per sheet
# beyond the D1-D6 scores, unioned across all 7 national databases into one
# wide header row shared identically by every sheet (verified: US_Veg and
# DE_Veg headers are byte-for-byte identical). Each food's own row only
# populates the columns belonging to its own source; the rest are blank.
#
# Phase 1 imports only a hand-verified "standard panel" -- the nutrients
# that recur across most/all sources under directly comparable names and
# units (confirmed by sampling real populated rows from every source, not
# just reading header text): energy, macros, the common vitamins, and the
# common minerals, plus iodine since it's directly relevant to this app's
# own D1 Iodine scoring dimension. Deliberately excludes the much larger
# deep-detail tiers (individual amino acids, the ~150-200 column fatty-acid
# breakdown by exact chain length, sugar alcohols, organic acids, plant
# sterols, pigments, heavy-metal contaminant columns) -- those are real
# data too, just a much bigger mapping effort with more cross-source
# comparability risk (e.g. "Vitamin D (D2+D3) total" vs "25-hydroxy vitamin
# D3", a different metabolite-level measurement, are NOT interchangeable
# despite both containing "vitamin D"). Nothing about this schema forecloses
# adding those later -- food_nutrients is a normalized (food_id,
# nutrient_code, amount) table, not fixed columns, so a Phase 2 is purely
# additive: new rows in `nutrients`, no migration.
#
# A few nutrients have more than one alias column because the source
# workbook's own column-union process created near-duplicate headers
# (different capitalization/spacing) for the same measurement rather than
# merging them -- confirmed by sampling rows where both aliases are
# populated with the identical value (e.g. Australia_AFCD's avocado row has
# both "Vitamin E  (mg) (mg)" = 1.8 and "Vitamin E (alpha-tocopherol) (MG)"
# = 1.8). Listed in priority order; the first populated one wins.
NUTRIENT_DEFINITIONS = [
    # (code, display_name, unit, group)
    ("energy_kcal", "Energy", "kcal", "macro"),
    # Moisture content -- 2026-08-02, added specifically so hydration can be
    # tracked as a real sum across everything logged in a day (food AND
    # drink alike), not a guess based on which builder/category something
    # came from. Every one of the 7 source sheets already carries this exact
    # "Water (G)" column (confirmed directly against the raw workbook) --
    # it just was never pulled into this "Phase 1 standard panel" before
    # now, the same reason none of the other macros/vitamins/minerals here
    # needed anything more than a plain NUTRIENT_COLUMN_ALIASES entry.
    ("water", "Water", "g", "macro"),
    ("protein", "Protein", "g", "macro"),
    ("fat_total", "Total Fat", "g", "macro"),
    ("carbohydrate", "Carbohydrate", "g", "macro"),
    ("fiber_total", "Fiber", "g", "macro"),
    ("sugars_total", "Total Sugars", "g", "macro"),
    ("fat_saturated", "Saturated Fat", "g", "macro"),
    ("fat_monounsaturated", "Monounsaturated Fat", "g", "macro"),
    ("fat_polyunsaturated", "Polyunsaturated Fat", "g", "macro"),
    ("cholesterol", "Cholesterol", "mg", "macro"),
    ("vitamin_a", "Vitamin A", "µg RAE", "vitamin"),
    ("vitamin_c", "Vitamin C", "mg", "vitamin"),
    ("vitamin_d", "Vitamin D", "µg", "vitamin"),
    ("vitamin_e", "Vitamin E", "mg", "vitamin"),
    ("vitamin_k", "Vitamin K", "µg", "vitamin"),
    ("thiamin_b1", "Thiamin (B1)", "mg", "vitamin"),
    ("riboflavin_b2", "Riboflavin (B2)", "mg", "vitamin"),
    ("niacin_b3", "Niacin (B3)", "mg", "vitamin"),
    ("pantothenic_acid_b5", "Pantothenic Acid (B5)", "mg", "vitamin"),
    ("vitamin_b6", "Vitamin B6", "mg", "vitamin"),
    ("biotin_b7", "Biotin (B7)", "µg", "vitamin"),
    ("folate_b9", "Folate (B9)", "µg", "vitamin"),
    ("vitamin_b12", "Vitamin B12", "µg", "vitamin"),
    # Grouped 'vitamin' even though choline is technically its own
    # essential-nutrient category, not a true vitamin -- matches how
    # NASEM's own 1998 DRI report bundles it alongside the B-vitamins (see
    # its DIETARY_REFERENCE_INTAKES citation below), not a claim that it
    # biochemically is one. Real per-food coverage across all 7 source
    # sheets ("Choline, total (MG)"/"CHOLINE, TOTAL (mg)", both present --
    # confirmed directly against the raw workbook), not just the one
    # synthetic supplement-powder food this was originally scoped to.
    ("choline", "Choline", "mg", "vitamin"),
    # Grouped 'macro' -- same pragmatic "no strict bucket fits" call as
    # water above (caffeine is a bioactive stimulant compound, not a true
    # macronutrient either, but this app's own nutrient_group only has
    # three values to choose from). 2026-08-02, added specifically to
    # ground a real coffee-brewing-method advisory (see lib/
    # coffeeAdvisory.ts) in real per-food data rather than assumption --
    # real column ("Caffeine (MG)") confirmed present in all 7 source
    # sheets, just never imported before now. Deliberately NOT paired with
    # a DIETARY_REFERENCE_INTAKES row below -- NASEM/IOM has never
    # published a formal RDA/AI/UL for caffeine (it isn't an essential
    # nutrient), and this table's own DRI_AGENCY constant is a single
    # shared "NASEM..." attribution applied to every row, so forcing in
    # the FDA's separate general 400mg/day guidance here would misattribute
    # its real source. That guidance is cited properly, by its own real
    # source, in the coffee advisory's own content instead.
    ("caffeine", "Caffeine", "mg", "macro"),
    ("calcium", "Calcium", "mg", "mineral"),
    ("iron", "Iron", "mg", "mineral"),
    ("magnesium", "Magnesium", "mg", "mineral"),
    ("phosphorus", "Phosphorus", "mg", "mineral"),
    ("potassium", "Potassium", "mg", "mineral"),
    ("sodium", "Sodium", "mg", "mineral"),
    ("zinc", "Zinc", "mg", "mineral"),
    ("copper", "Copper", "mg", "mineral"),
    ("manganese", "Manganese", "mg", "mineral"),
    ("selenium", "Selenium", "µg", "mineral"),
    ("iodine", "Iodine", "µg", "mineral"),
]

NUTRIENT_COLUMN_ALIASES = {
    "energy_kcal": ["Energy (KCAL)"],
    "water": ["Water (G)"],
    "protein": ["Protein (G)"],
    "fat_total": ["Total lipid (fat) (G)"],
    "carbohydrate": ["Carbohydrate, by difference (G)"],
    "fiber_total": ["Fiber, total dietary (G)"],
    "sugars_total": ["Sugars, Total (G)"],
    "fat_saturated": ["Fatty acids, total saturated (G)"],
    "fat_monounsaturated": ["Fatty acids, total monounsaturated (G)"],
    "fat_polyunsaturated": ["Fatty acids, total polyunsaturated (G)"],
    "cholesterol": ["Cholesterol (MG)"],
    "vitamin_a": ["Vitamin A, RAE (UG)"],
    "vitamin_c": ["Vitamin C, total ascorbic acid (MG)"],
    "vitamin_d": ["Vitamin D (D2 + D3) (UG)", "VITAMIN D (D2 + D3) (µg)"],
    "vitamin_e": ["Vitamin E (alpha-tocopherol) (MG)", "Vitamin E (mg) (mg)"],
    "vitamin_k": ["Vitamin K (phylloquinone) (UG)", "Vitamin K (µg/100 g)"],
    "thiamin_b1": ["Thiamin (MG)"],
    "riboflavin_b2": ["Riboflavin (MG)"],
    "niacin_b3": ["Niacin (MG)"],
    "pantothenic_acid_b5": ["Pantothenic acid (MG)"],
    "vitamin_b6": ["Vitamin B-6 (MG)"],
    "biotin_b7": ["Biotin (µg)", "Biotin (B7) (ug) (ug)"],
    "folate_b9": ["Folate, total (UG)"],
    "vitamin_b12": ["Vitamin B-12 (UG)"],
    "choline": ["Choline, total (MG)", "CHOLINE, TOTAL (mg)"],
    # Two real mg-unit column variants across the 7 sheets (checked exact
    # cell text directly, not assumed) -- "Caffeine (MG)" and a second,
    # multi-line "Caffeine \n(mg) (mg)" column (normalize_header collapses
    # the newline to "Caffeine (mg) (mg)"), the same doubled-unit-suffix
    # pattern already seen for biotin_b7's own second alias. Deliberately
    # does NOT include "Caffeine (g/100 g)" -- a real column too, but in
    # grams, not milligrams; this table's own aliasing has no per-alias
    # unit conversion, so mixing it in here would silently store gram
    # values as if they were milligrams (a real 1000x error), not just
    # broaden coverage. Rows only measured in that gram column show no
    # caffeine value here rather than a wrong one.
    "caffeine": ["Caffeine (MG)", "Caffeine (mg) (mg)"],
    "calcium": ["Calcium, Ca (MG)"],
    "iron": ["Iron, Fe (MG)"],
    "magnesium": ["Magnesium, Mg (MG)"],
    "phosphorus": ["Phosphorus, P (MG)"],
    "potassium": ["Potassium, K (MG)"],
    "sodium": ["Sodium, Na (MG)"],
    "zinc": ["Zinc, Zn (MG)"],
    "copper": ["Copper, Cu (MG)"],
    "manganese": ["Manganese, Mn (MG)"],
    "selenium": ["Selenium, Se (UG)"],
    "iodine": ["Iodine (µg)"],
}

# --- Physiology knowledge base -----------------------------------------
# Independently researched (not derived from the foods spreadsheet):
# how nutrients/hydration interact with each other, and how their
# deficiency/excess affects body systems. First content slice per user
# direction: electrolytes & bioelectric function (sodium, potassium,
# calcium, magnesium, hydration). Every row below carries a real citation
# gathered and verified via WebSearch/WebFetch, and an honest
# evidence_strength tag rather than a uniform "established" claim.

BODY_SYSTEMS = [
    # (code, display_name, description)
    ("neuromuscular_bioelectric", "Neuromuscular & Bioelectric Function",
     "Resting membrane potential, nerve signal transmission, and muscle contraction/relaxation."),
    ("cardiovascular", "Cardiovascular / Cardiac Rhythm",
     "Heart rhythm and conduction, blood pressure regulation."),
    ("urinary_function", "Urinary & Kidney Function",
     "Water/electrolyte reabsorption and excretion by the kidneys."),
    ("bowel_function", "Bowel / Digestive Function",
     "Intestinal water balance and motility."),
    ("mood_anxiety", "Mood & Anxiety",
     "Emotional regulation and anxiety symptoms."),
    ("sleep", "Sleep",
     "Sleep onset, quality, and duration."),
]

# (nutrient_a, nutrient_b, interaction_type, summary, population_scope, citation)
NUTRIENT_INTERACTIONS = [
    (
        "sodium", "potassium", "cofactor",
        "Sodium and potassium are actively exchanged across every cell membrane by the "
        "Na+/K+-ATPase pump (3 Na+ pumped out, 2 K+ pumped in per cycle), which "
        "establishes the resting membrane potential that all nerve and muscle "
        "signaling depends on. The two minerals cannot be assessed independently of "
        "each other for bioelectric purposes -- it is the ratio/gradient, not either "
        "value alone, that matters.",
        "general",
        "Na+/K+-ATPase mechanism; standard physiology (e.g. Boron & Boulpaep, Medical Physiology).",
    ),
    (
        "magnesium", "sodium", "cofactor",
        "The Na+/K+-ATPase pump requires magnesium bound to ATP (Mg-ATP) as its "
        "obligate cofactor. Magnesium deficiency impairs the pump directly, which can "
        "cause intracellular potassium loss and sodium accumulation independent of "
        "dietary sodium or potassium intake.",
        "general",
        "Ryan MP, 'Magnesium and potassium deficiency,' Kidney Int Suppl. 1987; "
        "PMID 28124894 (magnesium as Na+/K+-ATPase cofactor).",
    ),
    (
        "magnesium", "potassium", "cofactor",
        "Because magnesium is required for the Na+/K+-ATPase pump to hold potassium "
        "inside cells, magnesium deficiency commonly presents as, and can make "
        "refractory to correction, low potassium -- potassium replacement alone often "
        "fails until magnesium is also corrected.",
        "general",
        "PMID 28124894.",
    ),
    (
        "calcium", "magnesium", "regulatory",
        "Calcium and magnesium share the same parathyroid-hormone (PTH) / vitamin D "
        "regulatory loop: low blood calcium triggers PTH release, which raises "
        "calcium and drives production of active vitamin D. Magnesium deficiency "
        "blunts both PTH secretion and the tissue response to it, so a magnesium "
        "deficiency can present clinically as a calcium problem.",
        "general",
        "StatPearls, 'Physiology, Parathyroid Hormone,' NBK499940.",
    ),
    (
        "sodium", "hydration", "regulatory",
        "Blood sodium concentration is the primary signal osmoreceptors use to "
        "trigger (or suppress) ADH/vasopressin release from the pituitary, which "
        "controls how much water the kidneys reabsorb via aquaporin-2 channels. "
        "Sodium and water balance are therefore regulated as a single system, not "
        "independently.",
        "general",
        "Bankir L et al., 'Vasopressin: a novel target for the prevention and "
        "retardation of kidney disease?,' Nat Rev Nephrol; PMID 30252325.",
    ),
]

# (nutrient, status, body_system, effect_summary, evidence_strength, population_scope, citation)
NUTRIENT_SYSTEM_EFFECTS = [
    # --- Sodium ---
    (
        "sodium", "deficiency", "neuromuscular_bioelectric",
        "Low blood sodium (hyponatremia) reduces the resting membrane potential "
        "gradient, which can cause muscle weakness, cramping, confusion, and in "
        "severe cases seizures.",
        "established", "general",
        "Standard clinical physiology; Na+/K+-ATPase mechanism.",
    ),
    (
        "sodium", "excess", "cardiovascular",
        "Chronic high sodium intake is linked to elevated blood pressure and, in "
        "recent research, may also drive Th17 autoimmune-type immune activity.",
        "established", "general",
        "Wu C et al., 'Induction of pathogenic Th17 cells by inducible salt-sensing "
        "kinase SGK1,' Nature 2013.",
    ),
    (
        "sodium", "deficiency", "urinary_function",
        "The kidneys and ADH system respond to low sodium by adjusting water "
        "reabsorption; severe or rapid sodium depletion can overwhelm this "
        "regulation and contribute to dangerously low blood sodium.",
        "established", "general",
        "PMID 30252325.",
    ),
    # --- Potassium ---
    (
        "potassium", "deficiency", "cardiovascular",
        "Low blood potassium (hypokalemia) increases the risk of cardiac "
        "tachyarrhythmias, including torsade de pointes in severe cases, because "
        "resting membrane potential and cardiac repolarization both depend on "
        "normal potassium gradients.",
        "established", "general",
        "Standard clinical cardiology/physiology.",
    ),
    (
        "potassium", "excess", "cardiovascular",
        "High blood potassium (hyperkalemia) can cause bradyarrhythmia and cardiac "
        "conduction block, up to cardiac arrest in severe, untreated cases.",
        "established", "general",
        "Standard clinical cardiology/physiology.",
    ),
    (
        "potassium", "deficiency", "neuromuscular_bioelectric",
        "Potassium deficiency impairs the resting membrane potential the same pump "
        "system relies on, producing muscle weakness and, if severe, paralysis.",
        "established", "general",
        "Na+/K+-ATPase mechanism.",
    ),
    # --- Calcium ---
    (
        "calcium", "deficiency", "neuromuscular_bioelectric",
        "Calcium ions trigger neurotransmitter release at nerve synapses and, via "
        "the troponin-tropomyosin mechanism, initiate muscle fiber contraction. Low "
        "blood calcium classically causes muscle cramping, tingling, and tetany.",
        "established", "general",
        "Standard physiology; voltage-gated calcium channel / "
        "calcium-induced calcium release mechanisms.",
    ),
    (
        "calcium", "deficiency", "cardiovascular",
        "Calcium influx through voltage-gated channels drives the cardiac action "
        "potential plateau phase; significant calcium deficiency can prolong the QT "
        "interval and predispose to arrhythmia.",
        "established", "general",
        "Standard clinical cardiology/physiology.",
    ),
    # --- Magnesium ---
    (
        "magnesium", "deficiency", "cardiovascular",
        "Because magnesium is required for the Na+/K+-ATPase pump, deficiency can "
        "cause intracellular potassium loss and raise the risk of cardiac "
        "arrhythmia even when blood potassium looks normal.",
        "established", "general",
        "PMID 28124894.",
    ),
    (
        "magnesium", "deficiency", "mood_anxiety",
        "Some trials report higher self-reported anxiety symptoms with low "
        "magnesium status and improvement with supplementation, but the evidence "
        "base is small and mixed -- about half of published trials show a "
        "positive effect, and some results come from unpublished/registry data, "
        "so this should be read as a plausible but unproven link, not settled "
        "science.",
        "emerging", "general",
        "Boyle NB et al., 'The Effects of Magnesium Supplementation on Subjective "
        "Anxiety and Stress -- A Systematic Review,' Nutrients 2017; PMC5452159.",
    ),
    (
        "magnesium", "deficiency", "sleep",
        "Small randomized trials suggest magnesium supplementation may modestly "
        "improve sleep quality or continuity, but effect sizes reported are small "
        "(e.g. Cohen's d ~0.2), so magnesium should be considered a minor "
        "contributor to sleep quality rather than a primary lever.",
        "emerging", "general",
        "2025 RCT, PMID 40918053 (n=155); magnesium-L-threonate 2024 objective "
        "sleep-tracking trial.",
    ),
    (
        "magnesium", "excess", "bowel_function",
        "Magnesium salts not fully absorbed in the small intestine (e.g. magnesium "
        "citrate, magnesium oxide) draw water into the bowel by osmosis, which is "
        "the same mechanism used deliberately in over-the-counter osmotic laxatives "
        "-- a real, expected effect of high supplemental magnesium intake, not a "
        "side effect specific to any one product.",
        "established", "general",
        "Standard pharmacology of osmotic laxatives (magnesium citrate/oxide).",
    ),
]


DRI_AGENCY = (
    "National Academies of Sciences, Engineering, and Medicine (NASEM) "
    "Dietary Reference Intakes, as summarized by NIH Office of Dietary "
    "Supplements (ODS) fact sheets"
)

# (nutrient_code, sex, age_min, age_max, value_type, amount, unit,
#  upper_limit, upper_limit_type, citation, notes)
# sex: 'male' | 'female' | 'all'. age_max None = open-ended.
# value_type: 'RDA' (Recommended Dietary Allowance) | 'AI' (Adequate
# Intake, used when evidence isn't sufficient to set a true RDA) | 'CDRR'
# (Chronic Disease Risk Reduction intake -- a recommended ceiling, not a
# deficiency floor; sodium is the only nutrient using this category).
DIETARY_REFERENCE_INTAKES = [
    ("protein", "male", 19, None, "RDA", 56, "g", None, None,
     "NASEM 2005 DRI Macronutrients report.",
     "Based on 0.8 g/kg/day for a reference ~70kg adult; actual individual need scales with real "
     "body weight. Some research suggests older adults may benefit from higher intake "
     "(roughly 1.0-1.2 g/kg/day) to help preserve muscle mass, though that exceeds the official RDA."),
    ("protein", "female", 19, None, "RDA", 46, "g", None, None,
     "NASEM 2005 DRI Macronutrients report.",
     "Based on 0.8 g/kg/day for a reference ~57kg adult; scales with real body weight, same "
     "elderly-intake caveat as the male row."),

    # Total water AI from ALL sources, including food -- not a "drink this
    # many glasses" target layered on top of food. 1 mL of water weighs
    # ~1 g, so this figure is directly comparable to the water nutrient's
    # own gram-based per-food tracking. No UL is set for healthy adults
    # under normal conditions.
    ("water", "female", 19, None, "AI", 2700, "g", None, None, "NASEM 2005 DRI Water/Electrolytes report.", None),
    ("water", "male", 19, None, "AI", 3700, "g", None, None, "NASEM 2005 DRI Water/Electrolytes report.", None),

    ("fiber_total", "male", 19, 50, "AI", 38, "g", None, None, "NASEM 2005 DRI Macronutrients report.", None),
    ("fiber_total", "male", 51, None, "AI", 30, "g", None, None, "NASEM 2005 DRI Macronutrients report.", None),
    ("fiber_total", "female", 19, 50, "AI", 25, "g", None, None, "NASEM 2005 DRI Macronutrients report.", None),
    ("fiber_total", "female", 51, None, "AI", 21, "g", None, None, "NASEM 2005 DRI Macronutrients report.", None),

    ("vitamin_a", "male", 19, None, "RDA", 900, "µg RAE", 3000, "UL", "NASEM 2001 DRI Vitamin A report.",
     "UL applies to preformed vitamin A (retinol) from supplements/animal foods, not provitamin-A carotenoids from plants."),
    ("vitamin_a", "female", 19, None, "RDA", 700, "µg RAE", 3000, "UL", "NASEM 2001 DRI Vitamin A report.",
     "UL applies to preformed vitamin A (retinol) from supplements/animal foods, not provitamin-A carotenoids from plants."),

    ("vitamin_c", "male", 19, None, "RDA", 90, "mg", 2000, "UL", "NASEM 2000 DRI Vitamin C report.", None),
    ("vitamin_c", "female", 19, None, "RDA", 75, "mg", 2000, "UL", "NASEM 2000 DRI Vitamin C report.",
     "Smokers: NASEM advises adding 35 mg/day to either sex's RDA due to increased oxidative turnover from smoking."),

    ("vitamin_d", "all", 19, 70, "RDA", 15, "µg", 100, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),
    ("vitamin_d", "all", 71, None, "RDA", 20, "µg", 100, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),

    ("vitamin_e", "all", 19, None, "RDA", 15, "mg", 1000, "UL", "NASEM 2000 DRI Vitamin E report.",
     "UL applies to supplemental/pharmacological alpha-tocopherol; no UL for vitamin E naturally occurring in food."),

    ("vitamin_k", "male", 19, None, "AI", 120, "µg", None, None, "NASEM 2001 DRI Vitamin K report.", None),
    ("vitamin_k", "female", 19, None, "AI", 90, "µg", None, None, "NASEM 2001 DRI Vitamin K report.", None),

    ("thiamin_b1", "male", 19, None, "RDA", 1.2, "mg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),
    ("thiamin_b1", "female", 19, None, "RDA", 1.1, "mg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),

    ("riboflavin_b2", "male", 19, None, "RDA", 1.3, "mg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),
    ("riboflavin_b2", "female", 19, None, "RDA", 1.1, "mg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),

    ("niacin_b3", "male", 19, None, "RDA", 16, "mg", 35, "UL", "NASEM 1998 DRI B-Vitamins report.",
     "Expressed in niacin equivalents (NE), which include a contribution from dietary tryptophan -- "
     "this app's food data reports niacin directly in mg without an NE conversion, so treat this as an "
     "approximate comparison. UL applies to nicotinic acid/nicotinamide from supplements or fortified "
     "food (flushing risk), not niacin naturally occurring in food."),
    ("niacin_b3", "female", 19, None, "RDA", 14, "mg", 35, "UL", "NASEM 1998 DRI B-Vitamins report.",
     "Expressed in niacin equivalents (NE); see the male row's note. UL applies to nicotinic "
     "acid/nicotinamide from supplements or fortified food (flushing risk), not niacin naturally "
     "occurring in food."),

    ("pantothenic_acid_b5", "all", 19, None, "AI", 5, "mg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),

    ("vitamin_b6", "male", 19, 50, "RDA", 1.3, "mg", 100, "UL", "NASEM 1998 DRI B-Vitamins report.", None),
    ("vitamin_b6", "male", 51, None, "RDA", 1.7, "mg", 100, "UL", "NASEM 1998 DRI B-Vitamins report.", None),
    ("vitamin_b6", "female", 19, 50, "RDA", 1.3, "mg", 100, "UL", "NASEM 1998 DRI B-Vitamins report.", None),
    ("vitamin_b6", "female", 51, None, "RDA", 1.5, "mg", 100, "UL", "NASEM 1998 DRI B-Vitamins report.", None),

    ("biotin_b7", "all", 19, None, "AI", 30, "µg", None, None, "NASEM 1998 DRI B-Vitamins report.", None),

    ("folate_b9", "all", 19, None, "RDA", 400, "µg", 1000, "UL", "NASEM 1998 DRI B-Vitamins report.",
     "Expressed in Dietary Folate Equivalents (DFE), which account for synthetic folic acid being "
     "absorbed more efficiently than natural food folate -- this app's food data doesn't apply a DFE "
     "conversion, so treat this as an approximate comparison. UL applies to folic acid from "
     "supplements/fortified food only, not natural food folate."),

    ("vitamin_b12", "all", 19, None, "RDA", 2.4, "µg", None, None, "NASEM 1998 DRI B-Vitamins report.",
     "NASEM specifically advises adults over 50 meet the RDA mainly through fortified foods or a "
     "supplement, since food-bound B12 absorption commonly declines with age (reduced stomach acid), "
     "while crystalline supplemental B12 isn't affected by that mechanism."),

    # Set as an Adequate Intake (AI), not an RDA -- NASEM concluded there
    # wasn't yet enough evidence to set a full RDA for choline when this
    # report was published.
    ("choline", "female", 19, None, "AI", 425, "mg", 3500, "UL", "NASEM 1998 DRI B-Vitamins report.", None),
    ("choline", "male", 19, None, "AI", 550, "mg", 3500, "UL", "NASEM 1998 DRI B-Vitamins report.", None),

    ("calcium", "male", 19, 50, "RDA", 1000, "mg", 2500, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),
    ("calcium", "male", 51, 70, "RDA", 1000, "mg", 2000, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),
    ("calcium", "male", 71, None, "RDA", 1200, "mg", 2000, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),
    ("calcium", "female", 19, 50, "RDA", 1000, "mg", 2500, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),
    ("calcium", "female", 51, None, "RDA", 1200, "mg", 2000, "UL", "NASEM 2011 DRI Calcium/Vitamin D report.", None),

    ("iron", "male", 19, None, "RDA", 8, "mg", 45, "UL", "NASEM 2001 DRI Trace Elements report.", None),
    ("iron", "female", 19, 50, "RDA", 18, "mg", 45, "UL", "NASEM 2001 DRI Trace Elements report.", None),
    ("iron", "female", 51, None, "RDA", 8, "mg", 45, "UL", "NASEM 2001 DRI Trace Elements report.", None),

    ("magnesium", "male", 19, 30, "RDA", 400, "mg", 350, "UL", "NIH ODS Magnesium Health Professional Fact Sheet.",
     "The 350 mg UL applies only to magnesium from supplements/pharmacological sources, not food -- "
     "excess dietary magnesium from food is excreted by healthy kidneys and isn't known to cause harm. "
     "The supplement UL exists because supplemental magnesium salts can cause diarrhea at high doses "
     "(see supplement_forms and the magnesium/bowel_function row in nutrient_system_effects)."),
    ("magnesium", "male", 31, None, "RDA", 420, "mg", 350, "UL", "NIH ODS Magnesium Health Professional Fact Sheet.", None),
    ("magnesium", "female", 19, 30, "RDA", 310, "mg", 350, "UL", "NIH ODS Magnesium Health Professional Fact Sheet.", None),
    ("magnesium", "female", 31, None, "RDA", 320, "mg", 350, "UL", "NIH ODS Magnesium Health Professional Fact Sheet.", None),

    ("phosphorus", "all", 19, 70, "RDA", 700, "mg", 4000, "UL", "NASEM 1997 DRI report.", None),
    ("phosphorus", "all", 71, None, "RDA", 700, "mg", 3000, "UL", "NASEM 1997 DRI report.", None),

    ("potassium", "male", 19, None, "AI", 3400, "mg", None, None, "NIH ODS Potassium Health Professional Fact Sheet (2019 NASEM update).",
     "No UL set for the general population -- healthy kidneys excrete excess potassium -- but this "
     "does not apply to people with impaired kidney function or those on medications (e.g. certain "
     "blood pressure drugs) that raise blood potassium."),
    ("potassium", "female", 19, None, "AI", 2600, "mg", None, None, "NIH ODS Potassium Health Professional Fact Sheet (2019 NASEM update).",
     "Same kidney-function caveat as the male row."),

    ("sodium", "all", 19, None, "CDRR", 2300, "mg", 2300, "CDRR", "NASEM 2019 DRI Sodium/Potassium report.",
     "Unlike every other row in this table, this figure is a recommended ceiling associated with "
     "reduced chronic disease risk (blood pressure/cardiovascular), not a minimum-adequacy floor -- "
     "there is no established sodium deficiency RDA/AI for the general healthy adult population "
     "beyond roughly 1500 mg/day, a level reliably exceeded by ordinary diets without any effort."),

    ("zinc", "male", 19, None, "RDA", 11, "mg", 40, "UL", "NASEM 2001 DRI Trace Elements report.", None),
    ("zinc", "female", 19, None, "RDA", 8, "mg", 40, "UL", "NASEM 2001 DRI Trace Elements report.", None),

    ("copper", "all", 19, None, "RDA", 0.9, "mg", 10, "UL", "NASEM 2001 DRI Trace Elements report.",
     "Commonly quoted as 900 mcg; expressed here in mg (0.9 mg) to match the unit this app's "
     "food/nutrient data uses for copper."),

    ("manganese", "male", 19, None, "AI", 2.3, "mg", 11, "UL", "NASEM 2001 DRI Trace Elements report.", None),
    ("manganese", "female", 19, None, "AI", 1.8, "mg", 11, "UL", "NASEM 2001 DRI Trace Elements report.", None),

    ("selenium", "all", 19, None, "RDA", 55, "µg", 400, "UL", "NIH ODS Selenium Health Professional Fact Sheet.", None),

    ("iodine", "all", 19, None, "RDA", 150, "µg", 1100, "UL", "NIH ODS Iodine Health Professional Fact Sheet.", None),
]

# (nutrient_code, form_name, absorption_note, gi_tolerance_note, evidence_strength, citation, notes)
SUPPLEMENT_FORMS = [
    ("calcium", "Calcium citrate",
     "Absorbed roughly 22-27% better than calcium carbonate on average, and does not require "
     "stomach acid to dissolve -- absorption holds up even in achlorhydria or with acid-reducing "
     "medication (PPIs/H2 blockers), unlike carbonate.",
     "Can be taken with or without food; generally gentle.",
     "established",
     "Sakhaee K et al., meta-analysis of calcium bioavailability comparing citrate and carbonate "
     "(15 studies, 184 subjects); Recker RR, 'Calcium absorption and achlorhydria,' N Engl J Med. "
     "1985;313(2):70-73, PMID 4000241.",
     None),
    ("calcium", "Calcium carbonate",
     "Highest elemental calcium by weight (~40%) and the cheapest, most common form, but requires "
     "stomach acid to dissolve -- absorption drops sharply in achlorhydria (a condition more common "
     "with age) or with acid-suppressing medication.",
     "Best taken with food, which stimulates stomach acid; more likely than citrate to cause gas or "
     "constipation, especially at higher doses.",
     "established",
     "Recker RR, N Engl J Med. 1985;313(2):70-73, PMID 4000241.",
     None),

    ("magnesium", "Magnesium glycinate / bisglycinate",
     "Chelated to the amino acid glycine; in patients with impaired magnesium absorption, showed "
     "roughly double the absorption of magnesium oxide (23.5% vs 11.8%), partly via a dipeptide "
     "transport pathway.",
     "Among the gentlest common forms on the GI tract; minimal laxative effect.",
     "established",
     "Schuette SA, Lashner BA, Janghorbani M, 'Bioavailability of magnesium diglycinate vs magnesium "
     "oxide in patients with ileal resection,' JPEN J Parenter Enteral Nutr. 1994;18(5):430-435.",
     "A reasonable general-purpose default for someone who wants to correct a magnesium shortfall "
     "without GI side effects."),
    ("magnesium", "Magnesium citrate",
     "Well absorbed, meaningfully better than oxide.",
     "Real, dose-dependent osmotic laxative effect -- draws water into the bowel. Can be a deliberate "
     "choice for someone with concurrent constipation; not ideal for someone prone to loose stools.",
     "established",
     "Standard pharmacology of magnesium citrate as an osmotic laxative.",
     None),
    ("magnesium", "Magnesium oxide",
     "Poorly absorbed (roughly 4%) relative to other common forms -- most of an oxide dose passes "
     "through unabsorbed.",
     "The one magnesium form actually validated in randomized trials for treating chronic "
     "constipation, precisely because so much of the dose stays in the gut and draws in water.",
     "established",
     "European Review for Medical and Pharmacological Sciences, magnesium bioavailability comparison; "
     "2023 AGA/ACG chronic constipation guideline (notes only magnesium oxide has RCT evidence for "
     "constipation).",
     "Cheap and high in elemental magnesium per pill by label, but a poor choice specifically for "
     "correcting a magnesium deficiency -- better suited as an occasional laxative than a repletion strategy."),
    ("magnesium", "Magnesium L-threonate",
     "Marketed on its ability to cross the blood-brain barrier and raise brain magnesium levels more "
     "than other forms in animal studies; human cognitive-benefit evidence is still early.",
     "Generally well tolerated.",
     "emerging",
     "Manufacturer-funded and early independent human trials on cognition; evidence base is smaller "
     "and less mature than for glycinate/citrate/oxide.",
     "More expensive than other forms; not necessary for general magnesium repletion -- only "
     "relevant if the specific (still-unproven-at-scale) cognitive angle is the goal."),

    ("iron", "Iron bisglycinate",
     "Absorption is roughly comparable to ferrous sulfate when matched on elemental iron content -- "
     "not clearly superior despite marketing claims, but not worse either.",
     "Produces meaningfully fewer GI side effects (nausea, constipation, abdominal discomfort) than "
     "ferrous sulfate in head-to-head trials at matched elemental iron doses.",
     "established",
     "Multiple head-to-head randomized trials against ferrous sulfate; comparator baseline for "
     "sulfate's GI burden: Tolkien Z et al., PLoS One. 2015;10(2):e0117383, PMID 25700159.",
     "The most evidence-based form to switch to for someone who can't tolerate ferrous sulfate, "
     "before escalating to IV iron."),
    ("iron", "Ferrous sulfate",
     "The standard, cheapest, most-studied first-line iron supplement form.",
     "Significantly increases GI side effects vs placebo (odds ratio 2.32 in a meta-analysis of 43 "
     "trials, ~6,800 adults) -- nausea, constipation, and abdominal pain are common.",
     "established",
     "Tolkien Z et al., 'Ferrous Sulfate Supplementation Causes Significant Gastrointestinal "
     "Side-Effects in Adults: A Systematic Review and Meta-Analysis,' PLoS One. 2015;10(2):e0117383, "
     "PMID 25700159.",
     "Heme iron from animal food sources absorbs 2-3x better than any non-heme supplement form "
     "regardless of which one is chosen -- see the existing 'Iron (contextual)' D1-D6 sub-criterion, "
     "which cites the same heme/non-heme bioavailability gap (Hurrell & Egli 2010, PMID 20200263)."),

    ("zinc", "Zinc picolinate",
     "One crossover trial found picolinate was the only form of three tested (vs citrate, gluconate) "
     "that significantly raised zinc levels in hair, urine, and red blood cells vs placebo, though "
     "serum zinc didn't differ significantly between forms.",
     "Generally well tolerated.",
     "emerging",
     "Barrie SA et al., 'Comparative absorption of zinc picolinate, zinc citrate and zinc gluconate "
     "in humans,' Agric Food Chem/Nutr Res, 1987 (n=15 crossover trial).",
     "Evidence is real but modest and mixed across outcome measures -- not a settled 'best' form."),
    ("zinc", "Zinc citrate / zinc gluconate",
     "Fractional absorption around 60-61% in a head-to-head crossover trial, meaningfully higher "
     "than zinc oxide (~50%) at matched elemental zinc doses.",
     "Generally well tolerated; a reasonable, inexpensive default choice.",
     "established",
     "Crossover trial comparing 10 mg elemental zinc from citrate, gluconate, and oxide, summarized "
     "in: 'Comparative Absorption and Bioavailability of Various Chemical Forms of Zinc in Humans: A "
     "Narrative Review,' Nutrients. 2024;16(24):4269, PMC11677333.",
     None),
    ("zinc", "Zinc oxide",
     "The most common form in low-cost multivitamins, but measurably lower fractional absorption "
     "(~50%) than citrate or gluconate at matched elemental zinc doses.",
     "Generally well tolerated.",
     "established",
     "PMC11677333 (see zinc citrate/gluconate row).",
     None),

    ("vitamin_d", "Vitamin D3 (cholecalciferol)",
     "More effective than D2 at raising and maintaining serum 25-hydroxyvitamin D, particularly "
     "under non-daily/bolus dosing; the generally preferred supplemental form.",
     "Generally well tolerated.",
     "established",
     "Tripkovic L et al., 'Comparison of vitamin D2 and vitamin D3 supplementation in raising serum "
     "25-hydroxyvitamin D status: a systematic review and meta-analysis,' Am J Clin Nutr. "
     "2012;95(6):1357-1364.",
     None),
    ("vitamin_d", "Vitamin D2 (ergocalciferol)",
     "Roughly comparable to D3 specifically under daily dosing regimens per the same meta-analysis, "
     "though less effective overall and notably weaker than D3 under bolus (large, infrequent) dosing.",
     "Generally well tolerated.",
     "established",
     "Tripkovic L et al., Am J Clin Nutr. 2012;95(6):1357-1364.",
     "Plant/fungal-derived -- the relevant choice for someone avoiding animal-derived D3 (e.g. strict vegans; "
     "vegan D3 from lichen also exists as a third option)."),

    ("vitamin_b12", "Methylcobalamin",
     "The naturally circulating active coenzyme form. Limited comparative human data suggest greater "
     "tissue retention (lower urinary loss) than cyanocobalamin at equivalent doses.",
     "Generally well tolerated.",
     "emerging",
     "Comparative pharmacokinetic studies are limited in number; broader confirmatory research is "
     "still needed before treating this as settled.",
     None),
    ("vitamin_b12", "Cyanocobalamin",
     "The most-studied, most stable, and cheapest form; well-established efficacy for correcting "
     "B12 deficiency and the form used in most food fortification.",
     "Generally well tolerated.",
     "established",
     "Standard clinical/nutritional pharmacology; used as the reference form in most B12 deficiency "
     "treatment trials.",
     "The small cyanide moiety released on conversion is clinically irrelevant at supplement doses."),

    ("folate_b9", "L-methylfolate (5-MTHF)",
     "Already in the metabolically active form -- does not require the MTHFR enzyme to activate it, "
     "which matters for the substantial share of people with reduced MTHFR enzyme activity (a common "
     "genetic variant). Produces higher, faster peak plasma folate than folic acid in head-to-head trials.",
     "Generally well tolerated.",
     "established",
     "PMC10338559 (unmetabolized folic acid comparison); PMC4668025, randomized trial comparing "
     "methyltetrahydrofolate vs folic acid across MTHFR C677T/A1298C genotypes.",
     None),
    ("folate_b9", "Folic acid",
     "The synthetic, most-studied, most-fortified form -- used in the US mandatory folic acid "
     "fortification program specifically because it measurably reduces neural tube defects at the "
     "population level.",
     "Generally well tolerated at RDA-level doses.",
     "established",
     "PMC10338559; conversion efficiency to active folate varies between individuals, partly based "
     "on MTHFR genotype.",
     "At high/chronic intakes (more of a concern with fortified food plus supplements combined), "
     "unmetabolized folic acid can accumulate in blood since conversion capacity is finite -- this "
     "does not happen with 5-MTHF."),

    ("selenium", "Selenomethionine",
     "Better absorbed and retained than sodium selenite -- can be nonspecifically incorporated into "
     "general body proteins in place of methionine, creating a selenium reserve the body can draw on "
     "during low-intake periods.",
     "Generally well tolerated.",
     "established",
     "Comparative human bioavailability trials on selenium speciation (organic vs inorganic forms), "
     "e.g. work summarized in reviews of selenomethionine vs selenite absorption/retention.",
     None),
    ("selenium", "Sodium selenite",
     "Meaningfully lower bioavailability than selenomethionine -- roughly half as much is retained "
     "for the same intake -- but still effective; requires a higher dose for an equivalent effect. "
     "Used more directly for selenoprotein synthesis rather than stored as a body-protein reserve.",
     "Generally well tolerated.",
     "established",
     "Same comparative bioavailability literature as the selenomethionine row.",
     None),

    ("iodine", "Potassium iodide (standardized supplement)",
     "Delivers a predictable, consistent, label-accurate dose.",
     "Generally well tolerated at RDA-level doses.",
     "established",
     "Standard pharmaceutical-grade supplement manufacturing; predictable dosing is the entire point "
     "of using this form over a natural/unstandardized source.",
     "The form generally preferable when supplementation is genuinely needed, since Hashimoto's "
     "makes precise iodine dosing more important than for the general population (see the app's "
     "existing Iodine and Antibody Triggers D1-D6 sub-criterion citations on excess-iodine risk)."),
    ("iodine", "Kelp / seaweed-derived",
     "Iodine content is highly variable by species and harvest, and independent testing has "
     "repeatedly found actual content diverging sharply from label claims.",
     "Depends entirely on actual (often mislabeled) dose; can be far higher than expected.",
     "established",
     "Teas J, Pino S, Critchley A, Braverman LE, 'Variability of iodine content in common commercially "
     "available edible seaweeds,' Thyroid. 2004;14(10):836-841; ConsumerLab.com testing (2017) found "
     "roughly half of tested kelp supplements contained about twice their labeled iodine amount.",
     "A real, documented safety concern specifically for a Hashimoto's population, where iodine "
     "excess is a known trigger risk -- this is not a generic anti-supplement caution, it's "
     "specific to this form's unpredictability."),
]


def populate_dietary_reference_data(cur):
    cur.executemany(
        """
        INSERT INTO dietary_reference_intakes
            (nutrient_code, sex, age_min, age_max, value_type, amount, unit,
             upper_limit, upper_limit_type, source_agency, citation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (code, sex, age_min, age_max, value_type, amount, unit, ul, ul_type, DRI_AGENCY, citation, notes)
            for (code, sex, age_min, age_max, value_type, amount, unit, ul, ul_type, citation, notes)
            in DIETARY_REFERENCE_INTAKES
        ],
    )
    cur.executemany(
        """
        INSERT INTO supplement_forms
            (nutrient_code, form_name, absorption_note, gi_tolerance_note, evidence_strength, citation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        SUPPLEMENT_FORMS,
    )


LAB_TEST_CATEGORIES = [
    ("thyroid_function", "Thyroid Function",
     "The core hormone measurements that show how much thyroid hormone is actually circulating and "
     "how hard the pituitary is working to get it."),
    ("thyroid_autoimmune", "Thyroid Autoimmunity",
     "Antibody tests that detect the immune activity that actually causes Hashimoto's (and, "
     "differently, Graves') -- these are what diagnose autoimmune thyroid disease, as opposed to "
     "just describing its current hormonal effect."),
    ("thyroid_structural", "Thyroid Structure & Cancer Monitoring",
     "Tests relevant to the physical thyroid gland itself, mainly used after thyroid surgery or when "
     "a nodule or structural concern is present."),
    ("nutrient_status", "Nutrient Status",
     "Blood levels of specific vitamins/minerals with a documented, direct role in thyroid hormone "
     "production, conversion, or autoimmune activity -- cheap, easy to justify asking for, and "
     "directly actionable through diet."),
    ("inflammation_metabolic", "Inflammation & Metabolic Health",
     "Broader markers that commonly run alongside autoimmune thyroid disease and are worth tracking "
     "as part of the whole picture."),
]

# (code, display_name, category_code, aliases, what_it_measures,
#  why_it_matters_hashimotos, range_low, range_high, range_unit,
#  range_caveat, is_commonly_ordered, self_advocacy_note,
#  evidence_strength, citation)
LAB_TESTS = [
    ("tsh", "TSH (Thyroid-Stimulating Hormone)", "thyroid_function", "Thyrotropin",
     "The pituitary hormone that signals the thyroid to make more hormone -- it rises when thyroid "
     "hormone is too low and falls when it's too high, so it moves in the opposite direction from "
     "actual thyroid hormone levels.",
     "The single most-ordered thyroid test and usually the first sign of Hashimoto's-driven "
     "hypothyroidism, often rising years before Free T4 drops out of range.",
     0.4, 4.5, "mIU/L",
     "Reference ranges vary by lab/assay (commonly somewhere between 0.4-4.0 and 0.4-5.5 mIU/L); "
     "your own lab's reported range is authoritative, not this figure.",
     1,
     "Some endocrinologists treat toward a narrower 'optimal' window (often cited as roughly "
     "0.5-2.5 mIU/L) once someone is already on treatment, rather than just 'anywhere in range' -- "
     "worth asking your doctor what target they're using and why.",
     "established",
     "American Thyroid Association patient/clinician guidance; standard endocrinology reference "
     "ranges."),
    ("free_t4", "Free T4 (Free Thyroxine)", "thyroid_function", "FT4",
     "The unbound, biologically active fraction of T4, the main hormone the thyroid actually produces.",
     "Confirms whether the thyroid itself is genuinely underproducing, rather than relying on TSH alone.",
     0.8, 1.8, "ng/dL",
     "Reference ranges vary by lab/assay; your own lab's reported range is authoritative, not this figure.",
     1, None,
     "established",
     "Standard endocrinology reference ranges; American Thyroid Association guidance."),
    ("free_t3", "Free T3 (Free Triiodothyronine)", "thyroid_function", "FT3",
     "The unbound, active fraction of T3, the more biologically potent thyroid hormone that T4 "
     "converts into in peripheral tissues.",
     "Someone can have normal TSH/Free T4 but still feel hypothyroid if T4-to-T3 conversion is "
     "impaired (a real, documented phenomenon) -- Free T3 is the test that would actually show that.",
     2.0, 4.4, "pg/mL",
     "Reference ranges vary by lab/assay; your own lab's reported range is authoritative, not this figure.",
     0,
     "Not part of most standard thyroid panels by default -- if you have hypothyroid symptoms with "
     "'normal' TSH and Free T4, this is a reasonable, specific test to ask for.",
     "established",
     "Standard endocrinology reference ranges."),
    ("total_t4", "Total T4 (Total Thyroxine)", "thyroid_function", "TT4",
     "All circulating T4, both protein-bound and free -- largely superseded by Free T4, which isn't "
     "thrown off by changes in binding-protein levels (e.g. from pregnancy, estrogen, liver disease).",
     "Rarely adds information beyond Free T4 in a Hashimoto's workup; useful mainly in specific "
     "situations involving binding-protein abnormalities.",
     5.0, 12.0, "mcg/dL",
     "Reference ranges vary by lab/assay; your own lab's reported range is authoritative, not this figure.",
     0, None,
     "established",
     "Standard endocrinology reference ranges."),
    ("total_t3", "Total T3 (Total Triiodothyronine)", "thyroid_function", "TT3",
     "All circulating T3, both protein-bound and free.",
     "Same binding-protein limitation as Total T4; Free T3 is generally the more informative version "
     "of this test.",
     80, 200, "ng/dL",
     "Reference ranges vary by lab/assay; your own lab's reported range is authoritative, not this figure.",
     0, None,
     "established",
     "Standard endocrinology reference ranges."),
    ("reverse_t3", "Reverse T3 (rT3)", "thyroid_function", "rT3",
     "An inactive mirror-image form of T3 that the body also produces from T4, through a different "
     "conversion pathway than active T3.",
     "Marketed in functional/integrative medicine as revealing a 'reverse T3 dominance' blocking "
     "thyroid hormone action, but this is not a recognized diagnosis in mainstream endocrinology.",
     None, None, "ng/dL",
     "No professional practice guideline recommends this as a routine test; interpretation is "
     "genuinely disputed between conventional and functional medicine.",
     0,
     "The American Thyroid Association's Choosing Wisely guidance lists this as a test to generally "
     "avoid in standard thyroid assessment -- its real, narrow clinical use is distinguishing "
     "non-thyroidal illness from true hypothyroidism in complex/ambiguous cases, not routine "
     "Hashimoto's monitoring. Worth knowing this before paying out of pocket for it.",
     "mechanistic_only",
     "American Thyroid Association Choosing Wisely campaign; Ann Clin Lab Sci. 2020;50(3):383 "
     "committee report on rT3 ordering; ATA 2012/2016 hypothyroidism/hyperthyroidism guidelines "
     "(rT3 not included)."),

    ("tpo_ab", "TPO Antibodies (Thyroid Peroxidase Antibodies)", "thyroid_autoimmune", "Anti-TPO, TPOAb",
     "Antibodies against thyroid peroxidase, an enzyme the thyroid needs to make hormone -- their "
     "presence is direct evidence of autoimmune activity against the thyroid.",
     "This is the actual diagnostic marker for Hashimoto's thyroiditis, not TSH -- TSH just shows the "
     "downstream hormonal effect. Present in the large majority of Hashimoto's cases, though roughly "
     "10-15% of people with Hashimoto's have normal TPO antibodies but elevated TgAb instead, which "
     "is why both are worth testing together.",
     0, 35, "IU/mL",
     "Positivity cutoffs vary by assay; some labs use 35, others different values. Levels above "
     "roughly 100 IU/mL strongly suggest Hashimoto's, but people can have the disease with lower "
     "elevations (35-100 IU/mL) too -- a negative or borderline result doesn't rule it out on its own.",
     0,
     "Frequently NOT included in a standard 'thyroid panel' (which is often just TSH, sometimes Free "
     "T4) -- if you've never had this specifically tested and suspect autoimmune thyroid disease, "
     "this is one of the most important tests to explicitly ask for.",
     "established",
     "MedlinePlus thyroid antibody test reference; standard clinical endocrinology reference ranges."),
    ("tg_ab", "TgAb (Thyroglobulin Antibodies)", "thyroid_autoimmune", "Anti-Tg",
     "Antibodies against thyroglobulin, the protein the thyroid uses as a scaffold to build T4/T3.",
     "Elevated in roughly 60-80% of Hashimoto's cases, and in the 10-15% of people with Hashimoto's "
     "who have normal TPO antibodies, this is often the antibody that's actually elevated -- testing "
     "only TPOAb can miss real cases.",
     0, 20, "IU/mL",
     "Positivity cutoffs vary by assay; your own lab's reported range is authoritative, not this figure.",
     0,
     "Worth requesting alongside TPOAb, not as a substitute for it -- they catch somewhat different "
     "subsets of Hashimoto's cases.",
     "established",
     "MedlinePlus thyroid antibody test reference; standard clinical endocrinology reference ranges."),
    ("tsi_trab", "TSI / TRAb (Thyroid-Stimulating Immunoglobulin / TSH Receptor Antibody)", "thyroid_autoimmune",
     "TSI, TRAb, TSH-R Ab",
     "Antibodies that bind the TSH receptor itself -- TSI specifically activates it (driving Graves' "
     "hyperthyroidism), while TRAb assays measure receptor-binding antibodies more broadly, which can "
     "be stimulating or blocking.",
     "Mainly relevant for distinguishing Graves' disease from Hashimoto's when the clinical picture "
     "is ambiguous, or in the less common case of someone whose antibody profile shifts between the "
     "two over time -- not a routine Hashimoto's monitoring test.",
     0, 0.55, "IU/L",
     "Reference ranges and cutoffs vary meaningfully by assay/manufacturer (TSI vs TRAb are related "
     "but distinct assay types); your own lab's reported range is authoritative, not this figure.",
     0,
     "Only worth asking for if hyperthyroid symptoms appear, or if TSH/Free T4 patterns look atypical "
     "for straightforward Hashimoto's.",
     "established",
     "J Clin Endocrinol Metab. 2025;110(9):e3002; comparative TSI/TRAb assay performance studies."),

    ("thyroglobulin", "Thyroglobulin (Tg)", "thyroid_structural", "Tg",
     "The protein scaffold the thyroid uses to build thyroid hormone, released into the blood in "
     "proportion to how much thyroid tissue is present and active.",
     "Mainly used after thyroid surgery/cancer treatment to check for remaining or recurrent thyroid "
     "tissue, not as a routine Hashimoto's marker -- an intact thyroid gland with Hashimoto's doesn't "
     "have a specifically meaningful Tg target the way TSH or the antibodies do.",
     None, None, "ng/mL",
     "Reference range depends heavily on context (whether the thyroid is intact or removed); your own "
     "lab's reported range and your specific clinical context are authoritative, not this figure.",
     0,
     "This test becomes unreliable in the presence of TgAb (thyroglobulin antibodies), which interfere "
     "with the assay -- current guidance is that any Tg result should be paired with a TgAb test to "
     "know whether the Tg number can even be trusted.",
     "established",
     "Guidance on paired Tg/TgAb testing due to antibody interference in Tg immunoassays; standard "
     "post-thyroidectomy monitoring literature."),

    ("ferritin", "Ferritin", "nutrient_status", None,
     "The body's iron storage protein -- a low level reflects depleted iron stores, often before "
     "anemia itself shows up on a standard blood count.",
     "Iron deficiency measurably reduces thyroid peroxidase enzyme activity (the same enzyme TPO "
     "antibodies attack), so low iron can worsen thyroid hormone production on top of any autoimmune "
     "effect -- and fatigue/hair loss from low ferritin is easy to mistake for undertreated "
     "hypothyroidism itself.",
     15, 150, "ng/mL",
     "Standard lab reference ranges differ by sex (commonly roughly 15-150 ng/mL for women, "
     "15-300 ng/mL for men) and by lab/assay; your own lab's reported range is authoritative. Some "
     "clinicians consider levels under 50 ng/mL suboptimal for symptom relief even when still "
     "'in range.'",
     0,
     "Not part of a standard thyroid panel -- worth asking for specifically, especially if fatigue, "
     "hair loss, or restless legs persist despite thyroid hormone levels looking adequate.",
     "established",
     "Hess SY et al., 'Iron deficiency anemia reduces thyroid peroxidase activity in rats,' J Nutr. "
     "2002;132(7):1951-5, PMID 12097675 (the same citation used for this app's D1-D6 Iron Presence "
     "sub-criterion); standard clinical ferritin reference ranges."),
    ("vitamin_d_test", "Vitamin D (25-Hydroxyvitamin D)", "nutrient_status", "25(OH)D",
     "The main circulating storage form of vitamin D, and the standard way to assess someone's actual "
     "vitamin D status (as opposed to dietary intake alone).",
     "Vitamin D deficiency is associated with autoimmune thyroid disease risk (see this app's D1-D6 "
     "Vitamin D sub-criterion), and deficiency is common generally, especially with limited sun "
     "exposure.",
     30, 100, "ng/mL",
     "Two respected bodies define 'sufficient' differently: the Endocrine Society's 2011 clinical "
     "guideline uses <20 deficient, 20-29 insufficient, >=30 sufficient (with some clinicians citing "
     "40-60 as an 'optimal' range with less consensus behind it); NASEM's population-level dietary "
     "guidance instead centers on a lower bone-health threshold. Your own lab's reported range is "
     "authoritative for that specific assay.",
     0,
     "Frequently not tested by default in a general checkup -- reasonable to ask for directly given "
     "how common deficiency is and its documented autoimmune-thyroid relevance.",
     "established",
     "Endocrine Society 2011 Clinical Practice Guideline on vitamin D; see also this app's D1-D6 "
     "Vitamin D sub-criterion citation (PMC9275446)."),
    ("vitamin_b12_test", "Vitamin B12", "nutrient_status", "Cobalamin",
     "Circulating B12, needed for red blood cell formation and nerve function.",
     "B12 deficiency causes fatigue, brain fog, and neuropathy symptoms that overlap heavily with "
     "undertreated hypothyroidism -- and autoimmune conditions cluster together, so B12-deficiency "
     "conditions like pernicious anemia are more common in people who already have Hashimoto's.",
     200, 900, "pg/mL",
     "Reference ranges vary by lab; many clinicians now treat 'low-normal' results (roughly "
     "200-300 pg/mL) as potentially symptomatic even though they're technically inside the standard "
     "range -- worth discussing with your doctor if you're in that band and still symptomatic.",
     0,
     "Not part of a standard thyroid panel -- worth asking for, especially if you follow a plant-based "
     "diet (B12 is essentially absent from plant foods) or take metformin/acid-reducing medication "
     "(both reduce B12 absorption).",
     "established",
     "Standard clinical B12 reference ranges; NASEM 1998 DRI B-Vitamins report on age-related B12 "
     "absorption decline (see this app's dietary_reference_intakes vitamin_b12 notes)."),
    ("selenium_test", "Selenium (Serum)", "nutrient_status", None,
     "Circulating selenium, a mineral required to make the enzymes that both activate thyroid hormone "
     "(convert T4 to T3) and protect the thyroid gland from the oxidative byproducts of making hormone "
     "in the first place.",
     "A randomized trial found selenium plus zinc supplementation improved thyroid function markers in "
     "overweight/obese hypothyroid women (see this app's D1-D6 Selenium & Zn synergy sub-criterion) "
     "-- but selenium also has a narrow safe range (see this app's dietary_reference_intakes selenium "
     "UL of 400 mcg/day), so knowing your actual level before supplementing matters more than for most "
     "nutrients.",
     70, 150, "mcg/L",
     "Reference ranges vary meaningfully by lab and by regional soil selenium content; your own lab's "
     "reported range is authoritative, not this figure.",
     0,
     "Essentially never included in routine bloodwork -- worth asking for specifically before starting "
     "a selenium supplement, precisely because more isn't automatically better for this one.",
     "established",
     "Mahmoodianfard S et al., J Am Coll Nutr. 2015;34(5):391-399 (same citation as this app's D1-D6 "
     "Selenium & Zn synergy sub-criterion); Mayo Clinic Laboratories serum selenium reference range."),
    ("zinc_test", "Zinc (Serum)", "nutrient_status", None,
     "Circulating zinc -- must be drawn fasting in the morning, since eating measurably lowers serum "
     "zinc through tissue redistribution.",
     "Zinc is required for T4-to-T3 conversion and for making TRH/TSH themselves; deficiency is more "
     "biologically plausible in Hashimoto's given the roughly 7:1-10:1 female:male prevalence pattern "
     "this app's D1-D6 Zinc sub-criterion already documents.",
     60, 120, "mcg/dL",
     "Reference ranges vary by lab; some functional-medicine sources cite a narrower 80-110 mcg/dL as "
     "'optimal' rather than merely in-range, though that narrower band isn't universally standardized. "
     "Result is only meaningful if drawn fasting.",
     0,
     "Not part of routine bloodwork -- ask specifically, and confirm the draw is fasting, since a "
     "non-fasting result can look falsely low.",
     "established",
     "NBK459262 (same citation as this app's D1-D6 Zinc sub-criterion, on the sex-prevalence pattern); "
     "standard clinical serum zinc reference ranges."),
    ("magnesium_test", "Magnesium (Serum, with RBC Magnesium as a better alternative)", "nutrient_status",
     "RBC Magnesium",
     "Standard serum magnesium measures only the roughly 1% of body magnesium that circulates in "
     "blood -- most of the body's magnesium is inside cells and bone, which serum testing doesn't see.",
     "Magnesium is the obligate cofactor for the Na+/K+-ATPase pump this app's nutrient_system_effects "
     "content documents, and for the enzymes involved in vitamin D activation -- but standard serum "
     "testing is well known to miss real deficiency because the body tightly protects blood magnesium "
     "levels at the expense of cellular stores.",
     1.7, 2.2, "mg/dL",
     "This range applies to standard SERUM magnesium only; RBC (red blood cell) magnesium is widely "
     "considered a better reflection of true tissue status but isn't as tightly standardized across "
     "labs, so no single reference figure is given here -- use your own lab's reported range.",
     0,
     "If you ask for a magnesium test, specifically request 'RBC magnesium' rather than accepting a "
     "standard serum magnesium alone -- a normal serum result does not rule out real cellular "
     "magnesium deficiency.",
     "established",
     "Standard clinical serum magnesium reference ranges; Ryan MP, Kidney Int Suppl. 1987 (same "
     "citation as this app's nutrient_interactions magnesium/sodium cofactor row) on magnesium's "
     "Na+/K+-ATPase role."),
    ("urine_iodine", "Urine Iodine (Spot)", "nutrient_status", "UIC",
     "Iodine concentration in a single urine sample -- reflects very recent intake (the last day or "
     "so), not long-term body iodine status.",
     "Both iodine deficiency AND iodine excess are documented Hashimoto's-relevant risks (see this "
     "app's D1-D6 Iodine and Antibody Triggers sub-criteria) -- this is the test that can actually "
     "show which direction, if either, is a real concern for a specific person.",
     100, 199, "mcg/L",
     "The World Health Organization's own guidance is explicit that a single spot urine iodine result "
     "is a population-screening tool with large day-to-day individual variation, and is not validated "
     "for assessing one person's individual iodine status with confidence -- a 24-hour urine "
     "collection is more reliable for an individual, though less convenient.",
     0,
     "If iodine status is a genuine concern (e.g. before starting or stopping an iodine-containing "
     "supplement like kelp), ask specifically whether a spot or 24-hour collection is more appropriate "
     "for your situation -- don't over-interpret a single spot result on its own.",
     "established",
     "WHO urinary iodine concentration population-sufficiency classification (severe/moderate/mild "
     "deficiency, adequate, more-than-adequate, excess bands)."),

    ("hscrp", "hs-CRP (High-Sensitivity C-Reactive Protein)", "inflammation_metabolic", "CRP",
     "A sensitive measure of low-grade systemic inflammation.",
     "Not thyroid-specific, but autoimmune conditions and chronic inflammation commonly travel "
     "together -- useful as one piece of the broader health picture this app is trying to help build, "
     "not a Hashimoto's diagnostic test itself.",
     0, 1.0, "mg/L",
     "The American Heart Association's 3-tier band (under 1.0 lower risk, 1.0-3.0 average, over 3.0 "
     "higher cardiovascular risk) is about cardiovascular risk specifically, not autoimmune disease "
     "activity -- your own lab's reported range is authoritative for how they classify your result.",
     0,
     "Worth tracking over time alongside thyroid markers as part of a full picture, especially since "
     "hypothyroidism itself can affect cardiovascular risk markers.",
     "established",
     "AHA/CDC hs-CRP cardiovascular risk stratification; 2019 ACC/AHA cholesterol guideline hs-CRP "
     "risk-enhancer threshold."),
]


def populate_lab_test_reference_data(cur):
    cur.executemany(
        'INSERT INTO lab_test_categories (code, display_name, description) VALUES (?, ?, ?)',
        LAB_TEST_CATEGORIES,
    )
    cur.executemany(
        """
        INSERT INTO lab_tests
            (code, display_name, category_code, aliases, what_it_measures, why_it_matters_hashimotos,
             typical_range_low, typical_range_high, range_unit, range_caveat, is_commonly_ordered,
             self_advocacy_note, evidence_strength, citation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (code, name, cat, aliases, measures, why, lo, hi, unit, caveat, 1 if commonly else 0, advocacy, evidence, citation)
            for (code, name, cat, aliases, measures, why, lo, hi, unit, caveat, commonly, advocacy, evidence, citation)
            in LAB_TESTS
        ],
    )


# (code, display_name, description, scoring_method, framing_note, citation)
ASSESSMENT_DOMAINS = [
    (
        "hypothyroid_symptoms",
        "Hypothyroid Symptoms",
        "Physical symptoms commonly associated with underactive thyroid function -- fatigue, cold "
        "intolerance, skin/hair changes, constipation, and similar. Adapted for personal symptom-burden "
        "tracking in someone already diagnosed, not as a diagnostic screen (the clinical instruments this "
        "is modeled on were originally designed to help predict whether someone has hypothyroidism at all, "
        "which is a different question).",
        "Each of 13 items is rated 0 (not at all) to 4 (very severe) and summed, then expressed as a "
        "percentage of the maximum possible score (0-100%, where lower is better).",
        "Hashimoto's is very often a slow, non-linear recovery, and early on it's genuinely hard to tell "
        "if anything is working because everything feels like it's happening at once. That's exactly what "
        "retaking this periodically is for -- the day-to-day noise averages out, and a real trend becomes "
        "visible in a way it can't be from memory alone.",
        "Item domains adapted from Zulewski H et al., 'Estimation of tissue hypothyroidism by a new "
        "clinical score,' J Clin Endocrinol Metab. 1997;82(3):771-776, and the hypothyroid/tiredness/"
        "cognitive domains of the ThyPRO thyroid-specific quality-of-life questionnaire (Watt T et al.). "
        "Item wording here is original, not reproduced from either copyrighted instrument.",
    ),
    (
        "digestive_ibs",
        "Digestive / IBS Symptoms",
        "Follows the real, widely-used IBS Symptom Severity Scale (IBS-SSS) structure: pain severity, pain "
        "frequency, bloating, bowel-habit satisfaction, and how much it's interfering with daily life.",
        "5 items, each scored 0-100 (the pain-frequency item is 'days out of the last 10' scaled x10 to "
        "match), summed to a 0-500 total. Published bands: under 75 = remission/minimal, 75-175 = mild, "
        "175-300 = moderate, over 300 = severe.",
        "Gut symptoms are one of the most food-responsive things this app tracks -- small, specific "
        "dietary changes (fiber type, FODMAP load, fermentable carbohydrate content) often move this score "
        "measurably within weeks, faster than thyroid hormone levels themselves typically shift. This is "
        "often where someone sees their first real, undeniable win.",
        "Structure and severity bands from Francis CY, Morris J, Whorwell PJ, 'The irritable bowel "
        "severity scoring system,' Aliment Pharmacol Ther. 1997;11(2):395-402. Item wording here is "
        "original, following the same 5-domain structure and scoring math as the published instrument.",
    ),
    (
        "wellbeing",
        "Overall Wellbeing",
        "Five positively-worded questions about how the last two weeks have actually felt -- cheerfulness, "
        "calm, energy, restorative sleep, and engagement with daily life. Deliberately asks what's going "
        "right, not just what's going wrong.",
        "Each of 5 items is rated 0 (none of the time) to 5 (all of the time) and summed (0-25 raw), then "
        "multiplied by 4 for a 0-100 percentage score where higher is better.",
        "Symptom checklists are useful, but they only ever measure absence of problems, never presence of "
        "actually feeling good -- this domain exists specifically to capture the positive side of "
        "recovery, which is easy to undersell when the rest of tracking is naturally deficit-focused.",
        "Methodology (item domains, 6-point response scale, raw-score-x4 percentage conversion) modeled "
        "on the World Health Organization-Five Well-Being Index (WHO-5, 1998 version). Item wording here "
        "is original, not the licensed WHO-5 text, since WHO-5 is CC BY-NonCommercial-licensed and this "
        "app has a paid tier.",
    ),
]

# (code, domain_code, prompt, response_type, sort_order)
# response_type: 'severity_0_4' (5-point Not at all..Very severe),
# 'vas_0_100_10step' (11-point 0/10/.../100 visual-analog-style scale),
# 'frequency_days_0_10' (0-10 days), 'wellbeing_0_5' (6-point WHO-5-style scale).
ASSESSMENT_ITEMS = [
    ("hypo_fatigue", "hypothyroid_symptoms", "Fatigue or low energy", "severity_0_4", 1),
    ("hypo_cold_intolerance", "hypothyroid_symptoms", "Feeling cold when others around you don't", "severity_0_4", 2),
    ("hypo_dry_skin", "hypothyroid_symptoms", "Dry or itchy skin", "severity_0_4", 3),
    ("hypo_hair_loss", "hypothyroid_symptoms", "Hair thinning or hair loss", "severity_0_4", 4),
    ("hypo_constipation", "hypothyroid_symptoms", "Constipation", "severity_0_4", 5),
    ("hypo_weight_gain", "hypothyroid_symptoms", "Weight gain that's hard to explain", "severity_0_4", 6),
    ("hypo_muscle_aches", "hypothyroid_symptoms", "Muscle aches or weakness", "severity_0_4", 7),
    ("hypo_brain_fog", "hypothyroid_symptoms", "Brain fog or difficulty concentrating", "severity_0_4", 8),
    ("hypo_swelling", "hypothyroid_symptoms", "Puffiness or swelling (face, hands, or feet)", "severity_0_4", 9),
    ("hypo_slowed_movement", "hypothyroid_symptoms", "Feeling physically slowed down or sluggish", "severity_0_4", 10),
    ("hypo_voice_changes", "hypothyroid_symptoms", "Voice hoarseness or a deepened voice", "severity_0_4", 11),
    ("hypo_joint_pain", "hypothyroid_symptoms", "Joint pain or stiffness", "severity_0_4", 12),
    ("hypo_hearing_changes", "hypothyroid_symptoms", "Noticeable changes in hearing", "severity_0_4", 13),

    ("ibs_pain_severity", "digestive_ibs", "How severe has your abdominal pain been?", "vas_0_100_10step", 1),
    ("ibs_pain_frequency", "digestive_ibs", "Over the last 10 days, how many days did you have abdominal pain?", "frequency_days_0_10", 2),
    ("ibs_bloating", "digestive_ibs", "How severe has your bloating or abdominal distension been?", "vas_0_100_10step", 3),
    ("ibs_bowel_satisfaction", "digestive_ibs", "How dissatisfied have you been with your bowel habits?", "vas_0_100_10step", 4),
    ("ibs_life_interference", "digestive_ibs", "How much have digestive symptoms interfered with your daily life?", "vas_0_100_10step", 5),

    ("wellbeing_cheerful", "wellbeing", "I have felt cheerful and in good spirits", "wellbeing_0_5", 1),
    ("wellbeing_calm", "wellbeing", "I have felt calm and relaxed", "wellbeing_0_5", 2),
    ("wellbeing_energetic", "wellbeing", "I have felt active and had good energy", "wellbeing_0_5", 3),
    ("wellbeing_rested", "wellbeing", "I have woken up feeling rested", "wellbeing_0_5", 4),
    ("wellbeing_engaged", "wellbeing", "My daily life has felt full of things that interest me", "wellbeing_0_5", 5),
]


def populate_assessment_content(cur):
    cur.executemany(
        """
        INSERT INTO assessment_domains
            (code, display_name, description, scoring_method, framing_note, citation)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ASSESSMENT_DOMAINS,
    )
    cur.executemany(
        """
        INSERT INTO assessment_items (code, domain_code, prompt, response_type, sort_order)
        VALUES (?, ?, ?, ?, ?)
        """,
        ASSESSMENT_ITEMS,
    )


# (base_name, unit_label, grams_per_unit, citation, notes)
# base_name must match `foods.base_name` EXACTLY -- see the food_unit_weights
# table comment above for why this isn't a keyword/substring match. Several
# base_names are listed per real-world food (e.g. "Chicken egg" vs "Egg,
# whole" vs "Egg, chicken") because different national sources in this
# database name the same plain food differently.
FOOD_UNIT_WEIGHTS = [
    ("Chicken egg", "large egg", 50, "USDA food safety/nutrition reference weight for a large egg, edible portion (no shell).", None),
    ("Egg, whole", "large egg", 50, "USDA food safety/nutrition reference weight for a large egg, edible portion (no shell).", None),
    ("Egg, chicken", "large egg", 50, "USDA food safety/nutrition reference weight for a large egg, edible portion (no shell).", None),
    ("Chicken egg white", "large egg white", 33, "USDA reference: egg white is ~66% of a 50g large egg's edible weight.", None),
    ("Egg, white", "large egg white", 33, "USDA reference: egg white is ~66% of a 50g large egg's edible weight.", None),
    ("Chicken egg yolk", "large egg yolk", 17, "USDA reference: egg yolk is ~34% of a 50g large egg's edible weight.", None),
    ("Egg, yolk", "large egg yolk", 17, "USDA reference: egg yolk is ~34% of a 50g large egg's edible weight.", None),

    ("Banana", "medium banana", 118, "USDA FoodData Central standard reference weight for one medium banana.", None),
    ("Bananas", "medium banana", 118, "USDA FoodData Central standard reference weight for one medium banana.", None),

    ("Apple", "medium apple", 182, "USDA FoodData Central standard reference weight for one medium apple (~6.4 oz).", None),
    ("Apples", "medium apple", 182, "USDA FoodData Central standard reference weight for one medium apple (~6.4 oz).", None),

    ("Pear", "medium pear", 178, "USDA FoodData Central standard reference weight for one medium pear.", None),
    ("Pears", "medium pear", 178, "USDA FoodData Central standard reference weight for one medium pear.", None),

    ("Orange", "medium orange", 154, "USDA FoodData Central standard reference weight for one medium orange, all commercial varieties.", None),
    ("Oranges", "medium orange", 154, "USDA FoodData Central standard reference weight for one medium orange, all commercial varieties.", None),

    ("Avocado", "medium avocado", 150, "USDA FoodData Central standard reference weight for one medium avocado, edible flesh only (no pit/skin).", None),
    ("Avocados", "medium avocado", 150, "USDA FoodData Central standard reference weight for one medium avocado, edible flesh only (no pit/skin).", None),
]


def populate_food_unit_weights(cur):
    cur.executemany(
        """
        INSERT INTO food_unit_weights (base_name, unit_label, grams_per_unit, citation, notes)
        VALUES (?, ?, ?, ?, ?)
        """,
        FOOD_UNIT_WEIGHTS,
    )


def populate_physiology_knowledge(cur):
    cur.executemany(
        "INSERT INTO body_systems (code, display_name, description) VALUES (?, ?, ?)",
        BODY_SYSTEMS,
    )
    cur.executemany(
        """
        INSERT INTO nutrient_interactions
            (nutrient_a, nutrient_b, interaction_type, summary, population_scope, citation)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        NUTRIENT_INTERACTIONS,
    )
    cur.executemany(
        """
        INSERT INTO nutrient_system_effects
            (nutrient, status, body_system, effect_summary, evidence_strength, population_scope, citation)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        NUTRIENT_SYSTEM_EFFECTS,
    )


def normalize_header(text):
    return re.sub(r"\s+", " ", text or "").strip()


def parse_nutrient_amount(raw_value):
    if raw_value is None:
        return None
    text = str(raw_value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


# 2026-08-01 -- the source workbook's sheets used to be split per
# (source, category) -- "USDA_Veg", "USDA_Fruit", etc -- and category_code
# below was always just the CategoryCode half of that sheet name. At some
# point outside this project (the separate nutrition-database project's own
# workbook maintenance), the workbook was restructured into one flat sheet
# per source (confirmed directly: the real sheet names are now just "USDA",
# "UK_CoFID", "Japan_MEXT", "Germany_BLS", "Canada_CNF", "France_Ciqual",
# "Australia_AFCD" -- no category suffix on any of them). That silently
# broke every row's category_code (sheet_name.partition("_") now returns ""
# for USDA and a meaningless country-code fragment like "BLS"/"CNF" for the
# others), which cascaded into reclassify_category always falling through
# to that same empty/meaningless value -- discovered when a Cooking & Prep
# fix surfaced that ~all of USDA's own foods (this app's default,
# usdaOnly=true source) had lost their category entirely.
#
# Fix: derive category_code from each row's own `category` column instead
# (raw_category once stored -- a real per-row food-group description, e.g.
# "Vegetables and Vegetable Products", untouched by the sheet restructuring
# and still present). RAW_CATEGORY_TO_CODE below maps (source, that exact
# text) -> the category code it corresponded to historically. Built
# empirically, not guessed: extracted directly from this project's last
# known-good compiled database (before the workbook restructuring), where
# every (source, raw_category) pair's real, historically-correct category
# was already on record from back when sheet names still carried it.
# Verified this covers 100% of the (source, raw_category) pairs the current
# workbook actually contains (124 of 124) -- the `.get(..., category_code)`
# fallback below only matters if a genuinely new raw_category text shows up
# in some future workbook update.
#
# Known, disclosed imprecision: a small number of raw_category values were
# themselves heterogeneous catch-all buckets even back when sheet names
# still existed (e.g. USDA's "American Indian/Alaska Native Foods" spans
# real Meat/Fish/Veg/Fruit/Mixed rows all under one raw_category label;
# Germany_BLS's "Starches & Potato Products" spans Mushroom/Veg/Grain/Mixed;
# France_Ciqual's "Unknown" spans Baked/Grain/Sweets/Legume) -- for these,
# this mapping uses the single most common historical category as an
# approximation, which is honestly wrong for the minority of rows in that
# bucket that weren't the majority category. Affects roughly 350 of 22,016
# foods (~1.6%), and CATEGORY_OVERRIDES below still corrects any of those
# 350 that happen to already have a hand-verified entry. Revisit with
# keyword-based sub-rules (similar to CATEGORY_OVERRIDES itself) if this
# precision ever matters for a specific food someone hits in practice.
RAW_CATEGORY_TO_CODE = {
    ("Australia_AFCD", "Alcoholic Beverages"): "Alcohol",
    ("Australia_AFCD", "Breads & Bread Products"): "Baked",
    ("Australia_AFCD", "Cheese & Dairy"): "Dairy",
    ("Australia_AFCD", "Cocoa & Chocolate Beverage Bases"): "Bev",
    ("Australia_AFCD", "Confectionery & Preserves"): "Sweets",
    ("Australia_AFCD", "Dairy Alternatives"): "Dairy",
    ("Australia_AFCD", "Eggs"): "Dairy",
    ("Australia_AFCD", "Fats & Oils"): "Fats",
    ("Australia_AFCD", "Fish & Seafood"): "Fish",
    ("Australia_AFCD", "Fruit"): "Fruit",
    ("Australia_AFCD", "Game & Specialty Meats"): "Meat",
    ("Australia_AFCD", "Herbs & Spices"): "Herbs",
    ("Australia_AFCD", "Human Breast Milk"): "Dairy",
    ("Australia_AFCD", "Legume & Soy Products"): "Legume",
    ("Australia_AFCD", "Legumes, Pulses & Starches"): "Veg",
    ("Australia_AFCD", "Meat & Meat Products"): "Meat",
    ("Australia_AFCD", "Nuts, Seeds & Nut/Seed Products"): "NutSeed",
    ("Australia_AFCD", "Protein Supplements"): "Mixed",
    ("Australia_AFCD", "Sauces, Dressings & Condiments"): "Mixed",
    ("Australia_AFCD", "Savoury Biscuits & Crackers"): "Baked",
    ("Australia_AFCD", "Snack/Muesli Bars"): "Mixed",
    ("Australia_AFCD", "Soups"): "Mixed",
    ("Canada_CNF", "Baked Products"): "Baked",
    ("Canada_CNF", "Beef Products"): "Meat",
    ("Canada_CNF", "Beverages"): "Bev",
    ("Canada_CNF", "Breakfast cereals"): "Grain",
    ("Canada_CNF", "Cereals, Grains and Pasta"): "Grain",
    ("Canada_CNF", "Dairy and Egg Products"): "Dairy",
    ("Canada_CNF", "Fats and Oils"): "Fats",
    ("Canada_CNF", "Finfish and Shellfish Products"): "Fish",
    ("Canada_CNF", "Fruits and fruit juices"): "Fruit",
    ("Canada_CNF", "Lamb, Veal and Game"): "Meat",
    ("Canada_CNF", "Legumes and Legume Products"): "Legume",
    ("Canada_CNF", "Mixed Dishes"): "Mixed",
    ("Canada_CNF", "Nuts and Seeds"): "NutSeed",
    ("Canada_CNF", "Pork Products"): "Meat",
    ("Canada_CNF", "Poultry Products"): "Meat",
    ("Canada_CNF", "Sausages and Luncheon meats"): "Meat",
    ("Canada_CNF", "Snacks"): "Grain",
    ("Canada_CNF", "Soups, Sauces and Gravies"): "Mixed",
    ("Canada_CNF", "Spices and Herbs"): "Herbs",
    ("Canada_CNF", "Sweets"): "Sweets",
    ("Canada_CNF", "Vegetables and Vegetable Products"): "Veg",
    ("France_Ciqual", "Cereal Products"): "Grain",
    ("France_Ciqual", "Culinary Aids & Miscellaneous Ingredients"): "Mixed",
    ("France_Ciqual", "Dairy Products & Substitutes"): "Dairy",
    ("France_Ciqual", "Fats"): "Fats",
    ("France_Ciqual", "Fruits, Vegetables, Legumes & Oilseeds"): "Veg",
    ("France_Ciqual", "Ice Creams & Sorbets"): "Sweets",
    ("France_Ciqual", "Meat, Eggs, Fish & Substitutes"): "Meat",
    ("France_Ciqual", "Starters & Prepared Dishes"): "Mixed",
    ("France_Ciqual", "Sugary/Sweet Products"): "Sweets",
    ("France_Ciqual", "Unknown"): "Baked",
    ("France_Ciqual", "Water & Other Beverages"): "Bev",
    ("Germany_BLS", "Alcoholic Beverages & Spirits"): "Alcohol",
    ("Germany_BLS", "Baked Goods & Pastries"): "Baked",
    ("Germany_BLS", "Bread"): "Baked",
    ("Germany_BLS", "Cereals & Grains"): "Grain",
    ("Germany_BLS", "Dairy & Cheese"): "Dairy",
    ("Germany_BLS", "Fish & Seafood"): "Fish",
    ("Germany_BLS", "Fruit"): "Fruit",
    ("Germany_BLS", "Legumes, Nuts, Sprouts & Soy Products"): "NutSeed",
    ("Germany_BLS", "Meat Fats & Trimmings"): "Meat",
    ("Germany_BLS", "Non-Alcoholic Beverages"): "Bev",
    ("Germany_BLS", "Offal, Game & Specialty Meats"): "Meat",
    ("Germany_BLS", "Oils & Fats"): "Fats",
    ("Germany_BLS", "Pasta & Noodles"): "Grain",
    ("Germany_BLS", "Prepared/Cooked Dishes"): "Mixed",
    ("Germany_BLS", "Salt & Seasonings"): "Herbs",
    ("Germany_BLS", "Sausages & Cured Meats"): "Meat",
    ("Germany_BLS", "Soups, Stocks & Consommes"): "Mixed",
    ("Germany_BLS", "Starches & Potato Products"): "Mushroom",
    ("Germany_BLS", "Sugars & Sweeteners"): "Sweets",
    ("Germany_BLS", "Vegetables"): "Veg",
    ("Japan_MEXT", "Algae"): "Algae",
    ("Japan_MEXT", "Beverages"): "Bev",
    ("Japan_MEXT", "Cereals"): "Grain",
    ("Japan_MEXT", "Eggs"): "Dairy",
    ("Japan_MEXT", "Fish & Shellfish"): "Fish",
    ("Japan_MEXT", "Fruits"): "Fruit",
    ("Japan_MEXT", "Meats"): "Meat",
    ("Japan_MEXT", "Milks"): "Dairy",
    ("Japan_MEXT", "Mushrooms"): "Mushroom",
    ("Japan_MEXT", "Nuts & Seeds"): "NutSeed",
    ("Japan_MEXT", "Oils & Fats"): "Fats",
    ("Japan_MEXT", "Potatoes & Starches"): "Veg",
    ("Japan_MEXT", "Prepared Foods"): "Mixed",
    ("Japan_MEXT", "Pulses"): "Legume",
    ("Japan_MEXT", "Seasonings & Spices"): "Herbs",
    ("Japan_MEXT", "Sugars & Sweeteners"): "Sweets",
    ("Japan_MEXT", "Vegetables"): "Veg",
    ("UK_CoFID", "Alcoholic Beverages"): "Alcohol",
    ("UK_CoFID", "Cereals & Cereal Products"): "Grain",
    ("UK_CoFID", "Fats & Oils"): "Fats",
    ("UK_CoFID", "Fish & Fish Products"): "Fish",
    ("UK_CoFID", "Fruit"): "Fruit",
    ("UK_CoFID", "Meat & Meat Products"): "Meat",
    ("UK_CoFID", "Milk & Milk Products"): "Dairy",
    ("UK_CoFID", "Non-Alcoholic Beverages"): "Bev",
    ("UK_CoFID", "Nuts & Seeds"): "NutSeed",
    ("UK_CoFID", "Sugars, Preserves & Confectionery"): "Sweets",
    ("UK_CoFID", "Vegetables"): "Veg",
    ("USDA", "American Indian/Alaska Native Foods"): "Meat",
    ("USDA", "Baked Products"): "Baked",
    ("USDA", "Beef Products"): "Meat",
    ("USDA", "Beverages"): "Bev",
    ("USDA", "Breakfast Cereals"): "Grain",
    ("USDA", "Cereal Grains and Pasta"): "Grain",
    ("USDA", "Dairy and Egg Products"): "Dairy",
    ("USDA", "Fats and Oils"): "Fats",
    ("USDA", "Finfish and Shellfish Products"): "Fish",
    ("USDA", "Fruits and Fruit Juices"): "Fruit",
    ("USDA", "Lamb, Veal, and Game Products"): "Meat",
    ("USDA", "Legumes and Legume Products"): "Legume",
    ("USDA", "Meals, Entrees, and Side Dishes"): "Mixed",
    ("USDA", "Nut and Seed Products"): "NutSeed",
    ("USDA", "Pork Products"): "Meat",
    ("USDA", "Poultry Products"): "Meat",
    ("USDA", "Sausages and Luncheon Meats"): "Meat",
    ("USDA", "Snacks"): "Grain",
    ("USDA", "Soups, Sauces, and Gravies"): "Mixed",
    ("USDA", "Spices and Herbs"): "Herbs",
    ("USDA", "Sweets"): "Sweets",
    ("USDA", "Vegetables and Vegetable Products"): "Veg",
}


def reclassify_category(category_code, base_name):
    override = CATEGORY_OVERRIDES.get((category_code, base_name))
    if override:
        return override

    # Sprouts get their own top-level category rather than sitting inside
    # Veg -- see SPROUT_RENAMES' own comment for the full reasoning. Checked
    # against the exact hand-verified set rename_sprout() produces, never a
    # "contains the word sprout" rule (which would wrongly capture Brussels
    # sprout, a mature brassica).
    if base_name in SPROUT_BASE_NAMES:
        return "Sprouts"

    # Refined flours/starches (potato flour, cornstarch, arrowroot flour...)
    # are processed products, not fresh vegetables -- checked against all 28
    # real Veg rows containing "flour"/"starch" before writing this: none of
    # the false-positive risk seen with the stew/soup words applies here,
    # neither word shows up in a genuine fresh-vegetable name by coincidence.
    # Scoped to Veg specifically so this doesn't also rip flour back out of
    # Baked/Grain, where plenty of it legitimately belongs.
    if category_code == "Veg":
        lowered = base_name.lower()
        if lowered.startswith("starch products"):
            return "Mixed"  # noodles/gel/tapioca made from starch -- a prepared product, not an ingredient
        if "flour" in lowered or "starch" in lowered:
            return "Grain"

    # Fruit/vegetable JUICES are a fundamentally different product from the
    # whole fruit/vegetable they're made from -- no fiber, concentrated
    # sugar, drunk rather than eaten -- so they belong in Bev, which already
    # has a "Juice" subcategory bucket waiting for exactly this (see
    # SUBCATEGORY_RULES below). Scoped to Fruit/Veg only: Meat's own "in its
    # own juice"/"with natural juices" (cooking liquid, a completely
    # different sense of the word) and Mixed's prepared dishes that merely
    # mention lemon/orange juice as one ingredient ("Mayonnaise with lemon
    # juice", "Artichokes boiled (with lemon juice and salt)") were both
    # hand-checked row by row (25 Meat rows, 11 Mixed rows) and contain zero
    # genuine juice-as-product cases -- widening this rule into Meat/Mixed
    # would only add false-positive risk for no real benefit, so it isn't.
    #
    # The remaining false-positive risk within Fruit/Veg itself -- a fruit
    # or vegetable CANNED IN juice as its packing liquid ("Apricot in
    # juice", "Tomato, whole, canned in tomato juice") -- is handled
    # upstream, not here: "in juice" is now in PREP_TERMS (see above), so a
    # canned-in-juice food's base_name is already just the plain
    # fruit/vegetable name (no "juice" substring left at all) by the time
    # it reaches this function, in every one of the 7 sources. The one
    # remaining exception is citrus "juice sacs" (Japan_MEXT), hand-excluded
    # via JUICE_SAC_EXCLUSIONS above.
    if category_code in ("Fruit", "Veg") and base_name not in JUICE_SAC_EXCLUSIONS:
        if re.search(r"\bjuices?\b", base_name, re.IGNORECASE):
            return "Bev"

    # Fruit NECTAR (a thin, often-diluted fruit puree drink -- apple,
    # apricot, mango, guava, etc.) is the same "this is a beverage, not the
    # whole fruit" case as juice above, just a different word for it --
    # found while auditing Fruit for non-whole-food products (2026-07-29).
    # \bnectar\b (not a bare "nectar" substring) specifically so this never
    # matches "Nectarine"/"Nectarines" -- an entirely unrelated whole stone
    # fruit that happens to share the same first six letters. Every real
    # "nectar" row checked by hand (Apple/Apricot/Banana/Black currant/
    # Guanabana/Guava/Mango/Mixed fruit/Orange/Papaya/Passion fruit/Peach/
    # Pear/Sour cherry/Tamarind nectar) is a genuine drink product, zero
    # false positives -- no exclusion list needed the way JUICE_SAC_
    # EXCLUSIONS is for juice's own one edge case.
    if category_code == "Fruit" and re.search(r"\bnectar\b", base_name, re.IGNORECASE):
        return "Bev"

    # Soymilk is a drunk beverage (fortified with vitamins/calcium the same
    # way dairy/almond/rice milk is, no fiber, a milk substitute rather
    # than a preparation of the bean itself) sitting in Legume instead of
    # Bev -- found while auditing "milk"-named foods for the same
    # juice-style mismatch. This is a real, demonstrable internal
    # inconsistency, not a guess: USDA's own "Beverages, almond milk..."
    # and "Beverages, rice milk..." rows are already correctly filed under
    # Bev, while its ~25 SILK/Vitasoy/plain "Soymilk" rows sit in Legume.
    # Scoped narrowly: "soymilk" (one word, no space) only ever appears in
    # genuine drink rows (USDA's own naming convention); Japan_MEXT's two
    # genuine soy-milk-as-beverage rows are matched by exact base_name
    # instead, since that source always writes it as two words and two
    # words also appears inside "Okara" (soy pulp, a solid cooking
    # byproduct) and "Yuba" (the skin that forms on heated soy milk, a
    # solid food eaten on its own) -- both real, distinct solid foods that
    # must NOT move just because their own name explains what they're made
    # from.
    if category_code == "Legume":
        lowered = base_name.lower()
        if "soymilk" in lowered or base_name in ("Soybeans, soy milk", "Soybeans, soy milk based beverage"):
            return "Bev"

    return category_code

# Sub-category browsing bins, keyword-based, scoped per top-level category.
# Organizational only (helps drill-down browsing in the app), not a
# scientific/nutritional classification. Extend this dict with more
# top-level categories as they turn out to need drill-down too -- a
# category with no entry here simply gets no sub-category step in the UI.
#
# Each keyword now requires a real word ending (2026-07-29) -- not
# followed immediately by another letter -- rather than a bare substring
# check. Found while adding Fruit's own rules below: a plain "in" substring
# check for keyword "jam" also matched "Java-Plum (Jambolan)" and "Wax
# jambu" (real whole fruits whose names just happen to start with those
# three letters), which a real person would never call processed. Only the
# TRAILING edge is checked, deliberately not the leading edge too: "sauce"
# needs to keep matching "Applesauce" (no separator at all between "Apple"
# and "sauce"), which a true two-sided word-boundary would break. A
# trailing-only check fixes the "Jambolan"/"jambu" false-positive (the
# next letter after "jam" is "b", so it correctly fails) without losing
# "Applesauce" (nothing follows "sauce" but the end of the string, which
# counts as a boundary either way). This also fixes the same latent risk
# for every existing keyword here (e.g. "tea" as a bare substring would
# also match "instead"/"steak"), not just the new Fruit ones.
SUBCATEGORY_RULES = {
    "Bev": [
        ("Alcoholic", ["alcohol", "beer", "wine", "spirit", "liqueur", "cocktail", "whisky", "whiskey",
                        "vodka", "rum", "gin", "tequila", "champagne", "sake", "ale", "stout", "cider",
                        "brandy", "vermouth", "advocaat", "curacao", "daiquiri", "margarita", "pina colada"]),
        ("Tea", ["tea", "cha"]),
        ("Coffee", ["coffee"]),
        ("Juice", ["juice"]),
        ("Protein & Meal Replacement", ["protein powder", "whey", "meal replacement", "meal supplement",
                                          "slimfast", "ensure"]),
        ("Dairy & Blended", ["milk", "smoothie", "milkshake", "shake", "horchata"]),
        ("Soft Drinks", ["soda", "cola", "soft drink", "carbonated", "tonic", "lemonade"]),
        ("Water", ["water"]),
        ("Sports & Energy Drinks", ["sport", "energy drink", "gatorade", "isotonic", "powerade"]),
    ],
    "Alcohol": [
        ("Beer & Cider", ["beer", "ale", "stout", "lager", "cider"]),
        ("Wine & Champagne", ["wine", "champagne", "vermouth", "sherry", "port"]),
        ("Spirits & Liqueurs", ["spirit", "liqueur", "whisky", "whiskey", "vodka", "rum", "gin",
                                 "tequila", "brandy", "advocaat", "curacao"]),
        ("Cocktails & Mixed", ["cocktail", "daiquiri", "margarita", "pina colada", "sour"]),
    ],
    # Added 2026-07-29, per an explicit user request: applesauce/jam/candied
    # fruit reading as ordinary "Fruit" alongside actual whole apples/
    # berries/etc. was confusing when picking a whole-food ingredient for a
    # recipe. Deliberately narrow, matching only real manufactured/
    # preserved products -- NOT plain dried or frozen (unsweetened) fruit,
    # which the user explicitly confirmed should stay classified as whole
    # food (it's still just the fruit, no added sugar or manufacturing
    # step). Fruit NECTAR/JUICE already moves to Bev entirely (see
    # reclassify_category above) rather than needing a subcategory here.
    # Keyword list built from an actual query of every real Fruit
    # base_name/name containing sauce/compote/jam/sugared/candied/syrup/
    # preserve/jellied/cocktail against the live database, not guessed --
    # spot-checked per row afterward (classify_subcategory runs against the
    # full `name`, not base_name, so the same food's canned-in-syrup row
    # and its raw/dried/water-pack row correctly land in different
    # subcategories even though they share one base_name).
    "Fruit": [
        ("Processed & Preserved", [
            "sauce", "compote", "jam", "sugared", "candied", "syrup",
            "preserved", "preserve", "jellied", "jelly", "cocktail",
        ]),
    ],
    # Added 2026-07-30, mirroring Fruit's own split. Deliberately narrow,
    # matching only real manufactured/preserved products -- NOT plain
    # fresh/raw/dried/frozen (unsweetened, unseasoned) vegetables, and NOT
    # plain canned-in-water-or-brine vegetables either (canned carrots/
    # peas/asparagus/beets stay "whole", the same treatment Fruit already
    # gives canned-in-its-own-juice "Olives, ripe" -- curing/canning for
    # preservation alone doesn't make a food a manufactured product).
    # Keyword list built from an actual query of every real Veg
    # base_name/name containing pickle/relish/sauce/ketchup/catsup/syrup/
    # paste/concentrate/cocktail/spread/powder against the live database,
    # not guessed. "preserve"/"preserved"/"preserving" deliberately left
    # OUT of this list -- a plain substring check would also match "Chinese
    # preserving melon"/"Waxgourd (Chinese preserving melon)" (real raw,
    # whole gourd varieties whose name just describes their traditional
    # use, not that the row itself is preserved), the same class of false
    # positive as Fruit's "jam"/"Jambolan" bug. See
    # scripts/veg_cleanup_REPORT.md for the full candidate-by-candidate
    # reasoning, including why "puree"/"brine" were tried and left out too.
    #
    # "pickle"/"pickled"/"pickles" REMOVED 2026-08-02, reported directly:
    # "Cabbage isn't a processed or preserved food... Eggplant... potato...
    # radish... sweet potato." Investigated rather than assumed -- the
    # actual trigger for Cabbage/Eggplant/Radish was specifically the
    # "pickled" keyword (their own pickled-variant rows), which was always
    # inconsistent with this exact rule's own stated philosophy two
    # paragraphs up: pickling is a brine/vinegar preservation method, the
    # same class as the canning/curing this rule already deliberately
    # leaves alone ("curing/canning for preservation alone doesn't make a
    # food a manufactured product"). Removing it doesn't lose real
    # coverage -- a pickled cabbage/eggplant/radish/kimchi row still
    # exists and is still fully selectable, just correctly alongside its
    # own raw/boiled siblings under "Whole / Fresh Vegetables" with
    # "Pickled" as its own prep_method choice (exactly how canned-in-brine
    # vegetables already work), rather than as a second, confusing
    # same-named entry in a different subcategory bucket.
    "Veg": [
        ("Processed & Preserved", [
            "relish", "sauce", "ketchup",
            "catsup", "syrup", "paste", "concentr", "cocktail", "spread",
            "ajvar", "powder",
        ]),
    ],
}

# Fallback subcategory label for a row that matches none of its category's
# own keyword rules -- "Other" (the plain default below) reads fine for
# Bev/Alcohol, where it's genuinely a small residual bucket, but would be
# actively misleading for Fruit/Veg: almost every real row is whole/fresh
# produce, so labeling that majority "Other" instead of naming what it
# actually is would read backwards. Categories not listed here keep the
# plain "Other" default.
SUBCATEGORY_DEFAULT_LABELS = {
    "Fruit": "Whole / Fresh Fruit",
    "Veg": "Whole / Fresh Vegetables",
}


def classify_subcategory(category_code, name):
    rules = SUBCATEGORY_RULES.get(category_code)
    if not rules or not name:
        return None

    lowered = name.lower()
    for label, keywords in rules:
        # Trailing-edge word check only -- see SUBCATEGORY_RULES' own
        # comment for why a full two-sided word boundary would wrongly
        # exclude "Applesauce" (no separator between "Apple" and "sauce").
        if any(re.search(re.escape(keyword) + r"(?![a-z])", lowered) for keyword in keywords):
            return label

    return SUBCATEGORY_DEFAULT_LABELS.get(category_code, "Other")


# Reported directly by the user, 2026-08-02: "The Beverages category still
# lists alcohol beverages in it... mixed drinks, and various other things."
# Confirmed by direct query: 264 rows across 6 of the 7 sources already
# carry subcategory 'Alcoholic' (via SUBCATEGORY_RULES["Bev"]'s own keyword
# list, just above) but were never actually moved to the dedicated
# "Alcohol" top-level category the way Germany_BLS/UK_CoFID/Australia_AFCD's
# OWN alcohol content already was. USDA in particular has ZERO rows in
# "Alcohol" at all -- its entire wine/beer/spirit/cocktail contribution
# (every one of the 36 wine varietals and 8 beers just fixed for the
# split_prep_method bug, plus daiquiris, pina coladas, whiskey sours,
# coffee liqueurs, hard cider) had been sitting in Bev the whole time.
#
# Reuses the SAME "Alcoholic" keyword match already computed above rather
# than hand-listing every one of the 224 rows that should move -- checked
# directly, it's already correct for all of them. The other 40 are real,
# confirmed false positives from that same keyword list necessarily being a
# broad word-boundary substring match, not real semantic understanding:
#   - ~58 French "Eau minérale..." (mineral water) rows matched "ale" as a
#     substring of "minérale" (French for "mineral," an adjective ending in
#     "-ale") -- the same class of false-cognate collision as the "Matter"/
#     "Fat" bug found earlier this session in the food-name-grouping work.
#   - "Ginger ale"/"root beer" (7 rows across 4 sources) matched "ale"/
#     "beer" literally but are ordinary non-alcoholic sodas.
#   - Every "cocktail"-named but explicitly non-alcoholic juice/mixer
#     (cranberry/vegetable/tomato-clam juice cocktail, canned fruit
#     cocktail, a cocktail mix explicitly labeled non-alcoholic).
#   - Every row whose own name says "non-alcoholic"/"alcohol-free"/"sans
#     alcool" (wine, beer, aperitif, sparkling wine) -- the most ironic
#     case, several matched because "alcohol" is literally a substring of
#     "alcohol-free."
#   - Whiskey/whisky sour MIX products with no whiskey actually in them
#     (the bottled/powder mixer alone) -- Canada_CNF conveniently names its
#     own "...whisky added" variant separately, which DOES move, unlike the
#     plain mix.
#   - "Kale juice, powder" (Japan_MEXT) -- already a known, separately
#     documented stray subcategory mislabel (see this file's own Brewing-
#     category audit comments/CLAUDE.md), unrelated to this fix.
# Every exclusion below was checked by hand against its own full name, not
# assumed from the keyword match alone.
BEV_ALCOHOL_FALSE_POSITIVES = {
    "Cocktail sans alcool (à base de jus de fruits et de sirop)",
    "Carbonated drinks, ginger ale",
    "Carbonated drinks, root beer",
    "Cocktail mix, non-alcoholic, concentrated, frozen",
    "Fruit cocktail (peach, pear, apricot, pineapple, cherry, grape), canned, juice pack, solids and liquid",
    "Juice, cocktail, cranberry, vitamin C added, bottled",
    "Juice, cocktail, cranberry, vitamin C added, frozen concentrate",
    "Juice, cocktail, cranberry, vitamin C added, frozen concentrate, water added",
    "Juice, tomato clam cocktail, canned",
    "Malt beverage, includes non-alcoholic beer (<0.5% alcohol by volume)",
    "Non-alcoholic, wine",
    "Vegetable juice cocktail, canned",
    "Vegetable juice cocktail, canned, low sodium",
    "Alcohol, cocktail, whisky sour mix, bottled",
    "Alcohol, cocktail, whisky sour mix, powder",
    "Aperitif alcohol-free",
    "Fruit mix/fruit cocktail, in juice, canned, drained",
    "Ginger Ale",
    "Sparkling wine alcohol-free",
    "Wine alcohol-free",
    "Kale juice, powder",
    "Ginger ale, dry",
    "Root beer",
    "Beverages, Cocktail mix, non-alcoholic, concentrated, frozen",
    "Beverages, Cranberry juice cocktail",
    "Beverages, Whiskey sour mix, bottled",
    "Beverages, Whiskey sour mix, powder",
    "Beverages, Wine, non-alcoholic",
    "Beverages, carbonated, ginger ale",
    "Beverages, carbonated, root beer",
    "Cranberry juice cocktail, bottled",
    "Cranberry juice cocktail, bottled, low calorie, with calcium, saccharin and corn sweetener",
    "Cranberry juice cocktail, frozen concentrate",
    "Cranberry juice cocktail, frozen concentrate, prepared with water",
    "Malt beverage, includes non-alcoholic beer",
    "Vegetable juice cocktail, low sodium, canned",
    "Whiskey sour mix, bottled, with added potassium and sodium",
}


def reclassify_bev_alcoholic_to_alcohol(effective_category, name):
    if effective_category != "Bev" or not name:
        return effective_category
    if name in BEV_ALCOHOL_FALSE_POSITIVES:
        return effective_category
    # A real miss in the first version of this fix, caught by re-checking
    # the actual rebuilt database rather than trusting the exclusion list
    # was complete: French "minéral(e)"/"minéralisée" (mineral water) rows
    # -- ~88 of them, every "Eau minérale..." bottled-water row plus a
    # handful of flavored mineral-water drinks -- were moving to Alcohol
    # (and landing in "Beer & Cider" once there) purely because "minérale"
    # ends in "-ale," the same French adjective-suffix false match as the
    # "Matter"/"Fat" bug found earlier this session, just newly consequential
    # now that a subcategory match actually drives a category change.
    # Hand-listing 88 individual strings risks missing one the same way the
    # first pass missed all of them -- excluded by the one thing every real
    # mineral-water row reliably shares instead: it's literally described as
    # "minéral(e)" somewhere in its own name, and no genuine alcoholic drink
    # ever is.
    if "minéral" in name.lower():
        return effective_category
    if classify_subcategory("Bev", name) == "Alcoholic":
        return "Alcohol"
    return effective_category


# Reported directly by the user, 2026-08-02, same day, right after the
# category fix above: "in the Beverages category, I still see a Alcoholic
# [subcategory]... Alcoholic shouldn't be listed in beverages at all." A
# real, confirmed gap in the fix above -- it decides whether a row's
# CATEGORY should move to Alcohol, but every row it deliberately keeps in
# Bev (because it isn't really alcoholic) still gets its SUBCATEGORY
# computed by the exact same classify_subcategory("Bev", name) call, which
# still returns "Alcoholic" for the identical keyword-match reason -- the
# category-level fix never touched the subcategory badge those rows
# display. Every one of the 126 rows this affects is a name already
# checked by hand for the category fix above (the mineral-water guard plus
# BEV_ALCOHOL_FALSE_POSITIVES) -- this reuses that same work rather than
# re-deriving it, just supplying each one's own real subcategory instead of
# leaving the wrong one in place.
BEV_ALCOHOL_FALSE_POSITIVE_SUBCATEGORIES = {
    "Cocktail sans alcool (à base de jus de fruits et de sirop)": "Juice",
    "Carbonated drinks, ginger ale": "Soft Drinks",
    "Carbonated drinks, root beer": "Soft Drinks",
    "Cocktail mix, non-alcoholic, concentrated, frozen": "Other",
    "Fruit cocktail (peach, pear, apricot, pineapple, cherry, grape), canned, juice pack, solids and liquid": "Juice",
    "Juice, cocktail, cranberry, vitamin C added, bottled": "Juice",
    "Juice, cocktail, cranberry, vitamin C added, frozen concentrate": "Juice",
    "Juice, cocktail, cranberry, vitamin C added, frozen concentrate, water added": "Juice",
    "Juice, tomato clam cocktail, canned": "Juice",
    "Malt beverage, includes non-alcoholic beer (<0.5% alcohol by volume)": "Other",
    "Non-alcoholic, wine": "Other",
    "Vegetable juice cocktail, canned": "Juice",
    "Vegetable juice cocktail, canned, low sodium": "Juice",
    "Alcohol, cocktail, whisky sour mix, bottled": "Other",
    "Alcohol, cocktail, whisky sour mix, powder": "Other",
    "Aperitif alcohol-free": "Other",
    "Fruit mix/fruit cocktail, in juice, canned, drained": "Juice",
    "Ginger Ale": "Soft Drinks",
    "Sparkling wine alcohol-free": "Other",
    "Wine alcohol-free": "Other",
    "Kale juice, powder": "Juice",
    "Ginger ale, dry": "Soft Drinks",
    "Root beer": "Soft Drinks",
    "Beverages, Cocktail mix, non-alcoholic, concentrated, frozen": "Other",
    "Beverages, Cranberry juice cocktail": "Juice",
    "Beverages, Whiskey sour mix, bottled": "Other",
    "Beverages, Whiskey sour mix, powder": "Other",
    "Beverages, Wine, non-alcoholic": "Other",
    "Beverages, carbonated, ginger ale": "Soft Drinks",
    "Beverages, carbonated, root beer": "Soft Drinks",
    "Cranberry juice cocktail, bottled": "Juice",
    "Cranberry juice cocktail, bottled, low calorie, with calcium, saccharin and corn sweetener": "Juice",
    "Cranberry juice cocktail, frozen concentrate": "Juice",
    "Cranberry juice cocktail, frozen concentrate, prepared with water": "Juice",
    "Malt beverage, includes non-alcoholic beer": "Other",
    "Vegetable juice cocktail, low sodium, canned": "Juice",
    "Whiskey sour mix, bottled, with added potassium and sodium": "Other",
}


def bev_alcoholic_false_positive_subcategory(effective_category, name):
    if effective_category != "Bev" or not name:
        return None
    if "minéral" in name.lower():
        return "Water"
    return BEV_ALCOHOL_FALSE_POSITIVE_SUBCATEGORIES.get(name)


# Reported directly 2026-08-02, same message that got "pickle"/"pickled"
# removed from SUBCATEGORY_RULES["Veg"] above: "potato isn't a processed or
# preserve food" / "neither is... sweet potato." Investigated per base_name
# rather than assumed: Potato's own "sauce" trigger turned out to be one
# specific row ("Potatoes, hash brown, frozen, with butter sauce"), and
# Sweet potato's own "syrup" trigger was "Sweet potato, canned, syrup pack"
# -- both real keyword matches, not a bug in classify_subcategory itself,
# but both share their base_name with a real, already-"Whole / Fresh
# Vegetables"-classified sibling (plain hash-brown Potato, plain canned
# Sweet potato), the exact same "one row's own seasoning/packing variant
# gets confusingly split from its own ordinary vegetable identity" pattern
# already fixed for pickled Cabbage/Eggplant/Radish above -- just triggered
# by "sauce"/"syrup" instead of "pickle" this time. Unlike that fix, this
# one is keyed on base_name (not removing the keywords themselves, which
# are still correctly needed elsewhere -- e.g. Fruit's own genuine
# applesauce/jam/syrup-preserve products have no whole/fresh sibling to
# collide with) so only these two specific, already-confirmed base_names
# are forced back, not every future "sauce"/"syrup" match in Veg.
VEG_SUBCATEGORY_FORCE_WHOLE_FRESH_BASE_NAMES = {"Potato", "Sweet potato"}


def veg_processed_false_positive_subcategory(effective_category, base_name):
    if effective_category != "Veg":
        return None
    if base_name in VEG_SUBCATEGORY_FORCE_WHOLE_FRESH_BASE_NAMES:
        return "Whole / Fresh Vegetables"
    return None


# Real, unambiguous cooking-state words only -- deliberately excludes
# frequent-but-ambiguous trailing words found in the real data (meat, sauce,
# cream, juice, seeds, heart, breast, leg, liver, giblets, oil, bacon,
# dressing, vegetables, marinade, style, mature, lean, mince) since those
# usually carry real food-identity information, not just a cooking state --
# same false-positive risk the source project repeatedly found and fixed
# (e.g. "sweet potato" != "potato"). Longer phrases first so they match
# before their shorter substrings would. Empirically checked against all
# 5,876 real Germany_BLS short_names before finalizing this list.
PREP_TERMS = [
    "fried without fat (pan)",
    "fried without fat (oven)",
    "without fat (pan)",
    "without fat (oven)",
    "in unsalted water",
    "in salted water",
    # Packing-liquid descriptor, not a separate food -- "canned in juice" is
    # how a fruit is packed (vs. syrup/water), not a statement that the
    # product itself is juice. Only Germany_BLS's own short_name field still
    # carries this phrase verbatim (e.g. "Apricot in juice", "Pear in
    # juice") -- every other source (Australia_AFCD, Canada_CNF, UK_CoFID,
    # USDA) already curates its own short_name down to the bare fruit name
    # for the identical packing-liquid concept ("canned in pear juice" ->
    # "Apricot"), confirmed by hand across all 6 Germany_BLS rows this
    # matches plus their sibling rows in every other source. Stripping it
    # here brings Germany_BLS's base_name in line with that same
    # convention and, just as importantly, means these rows no longer
    # contain the word "juice" by the time reclassify_category() below
    # decides what's a genuine juice beverage -- so this single fix also
    # prevents them from being swept into the Fruit->Bev juice rule.
    "in juice",
    "deep-frozen",
    "unprepared",
    "marinated",
    "steamed",
    "roasted",
    "grilled",
    "stewed",
    "boiled",
    "canned",
    "pickled",
    "cooked",
    "baked",
    "fried",
    "dried",
    "cured",
    "frozen",
    "raw",
]

# Same phrases as PREP_TERMS above, reorganized into priority tiers for
# split_prep_method's own short_name-prefix path below (2026-08-01) --
# PREP_TERMS itself is left untouched, still used verbatim by the original
# single-trailing-word fallback path further down, so that already-working
# behavior (Germany_BLS, and the PREP_METHOD_OVERRIDES-matched potato dish
# names) is byte-for-byte unaffected by this fix.
#
# Checked ahead of RAW_TERMS/STORAGE_TERMS when a food's extra descriptor
# text (see split_prep_method's own comment) has more than one real prep
# clause in it -- e.g. "frozen, chopped, cooked, boiled, drained, with
# salt" started frozen, but functionally ended up cooked, which is what
# actually matters for this app's own raw-vs-cooked scoring (e.g. D5
# Goitrogenic Load: cooking, not freezing, is what deactivates goitrogens).
COOKING_TERMS = [
    "fried without fat (pan)",
    "fried without fat (oven)",
    "without fat (pan)",
    "without fat (oven)",
    "in unsalted water",
    "in salted water",
    "steamed",
    "roasted",
    "grilled",
    "stewed",
    "boiled",
    "canned",
    "pickled",
    "cooked",
    "baked",
    "fried",
    "cured",
]
RAW_TERMS = ["raw", "unprepared"]
# Real states, but don't by themselves say whether the food was ultimately
# cooked or eaten raw -- lowest priority, only used when nothing above is
# found in any clause.
STORAGE_TERMS = ["deep-frozen", "frozen", "dried", "marinated", "in juice"]

# Matches a short_name ending in exactly one trailing "(...)" group -- e.g.
# "Broccoli (boiled)" -> base "Broccoli", inner "boiled"; "Apples,
# dehydrated (low moisture) (stewed)" -> base "Apples, dehydrated (low
# moisture)", inner "stewed" (the LAST paren group only; [^()]+ can't cross
# into an earlier one, so an earlier real descriptor like "(low moisture)"
# is correctly left as part of the base name, not mistaken for prep state).
_TRAILING_PAREN_RE = re.compile(r"^(.*?)\s*\(([^()]+)\)\s*$")


def _match_prep_term(text):
    """Whole-word match of `text` against COOKING_TERMS/RAW_TERMS/
    STORAGE_TERMS, in that priority order (see those lists' own comments).
    Returns the matched term (lowercase, as written in those lists) or
    None."""
    lowered = text.lower()
    for tier in (COOKING_TERMS, RAW_TERMS, STORAGE_TERMS):
        for term in tier:
            if re.search(r"\b" + re.escape(term) + r"\b", lowered):
                return term
    return None


# Real, single-ingredient Brassicaceae (cruciferous) vegetable base_names --
# 2026-08-01, added alongside the goitrogen scoring below. Raw cruciferous
# vegetables contain glucosinolates that interfere with thyroid iodine
# uptake; cooking deactivates roughly 90% of that effect (Felker, Bunch &
# Leung, "Concentrations of thiocyanate and goitrin in human plasma...",
# Nutr Rev. 2016;74(4):248-58, PMID 26946249 -- the same citation already
# written into lib/sixDimensionsReference.ts's SUB_CRITERION_SOURCES
# entry for 'Goitrogenic Load', which has sat unused until now because no
# food anywhere in this database ever actually had that score: the source
# workbook's real D1-D6 columns never included it).
#
# Built by querying every real base_name in the built database matching a
# cruciferous keyword root, then hand-reviewing all ~500 raw matches down to
# genuine single-ingredient vegetable identities. Deliberately excludes,
# each confirmed against the real `name`/prep data behind it rather than
# guessed:
#   - Composite dishes (casseroles, stews, gratins, "with X and Y") -- can't
#     attribute one ingredient's raw/cooked state to the whole dish.
#   - Condiment/processed mustard, horseradish, and wasabi products
#     (prepared mustard, mustard seed/powder, horseradish sauce/mousse,
#     wasabi paste) -- a fundamentally different food and serving context
#     from the vegetable itself, confirmed via each one's own `name` field
#     (e.g. "Mustard hot", "Mustard sweet" are the yellow condiment, not a
#     mustard-greens variety).
#   - Fermented/pickled items (sauerkraut, kimchi, and anything whose own
#     `name` says "pickled" even when base_name itself doesn't, e.g.
#     "Radish, hawaiian style" / "Cabbage, japanese style, fresh" both
#     confirmed pickled by checking their real `name` field) -- fermentation
#     alters glucosinolates differently than heat-cooking, so the
#     Raw/Cooked binary doesn't honestly apply; already covered by the
#     existing Fermentability sub-criterion instead.
#   - Mixed-vegetable blends -- can't attribute a single ingredient's state.
#   - Foods whose common name merely contains a cruciferous word but aren't
#     actually Brassicaceae, confirmed via each one's own `name` field:
#     "Prairie Turnips"/"Turnip, Prairie, native" (Pediomelum esculentum, a
#     legume) and "Swamp cabbage (skunk cabbage, water convulvolus)"
#     (Ipomoea aquatica/water spinach, Convolvulaceae).
#   - Non-English (French Ciqual, most Japanese pickled variants) --
#     deferred as a known gap, same as this app's own already-disclosed
#     France_Ciqual prep_method coverage gap (those rows can't reliably get
#     a Raw/Cooked tier anyway).
#
# Every plural/singular/parenthetical variant that's a real distinct
# base_name in this database gets its own entry here, same reason
# FOOD_UNIT_WEIGHTS above lists "Banana" and "Bananas" separately.
GOITROGENIC_BASE_NAMES = {
    # Broccoli
    "Broccoli", "Broccoli Inflorescence", "Broccoli Leaves", "Broccoli Sprouts",
    "Broccoli Stalks", "Broccoli deep-frozen", "Broccoli raab", "Broccoli raab (rapini)",
    "Broccoli, boiled, drained", "Broccoli, flower clusters", "Broccoli, fresh, baked, no added fat",
    "Broccoli, fresh, boiled, drained", "Broccoli, fresh, microwaved", "Broccoli, frozen, chopped",
    "Broccoli, frozen, chopped, boiled, drained", "Broccoli, frozen, spears",
    "Broccoli, frozen, spears, boiled, drained", "Broccoli, green, frozen, boiled",
    "Broccolini, fresh, boiled, drained", "Chinese Broccoli", "Fresh Broccoli", "Fresh Broccolini",
    "Romanesco broccoli",
    # Cauliflower
    "Cauliflower", "Cauliflower Inflorescence", "Cauliflower deep-frozen", "Cauliflower, boiled, drained",
    "Cauliflower, fresh, baked, no added fat", "Cauliflower, fresh, boiled, drained", "Cauliflower, frozen",
    "Cauliflower, frozen, boiled", "Cauliflower, frozen, boiled, drained", "Fresh Cauliflower",
    "Green Cauliflower",
    # Cabbage
    "Bavarian white cabbage", "Cabbage", "Cabbage, Chinese (pe-tsai), boiled, drained",
    "Cabbage, Chinese flowering", "Cabbage, Chinese flowering, boiled, drained",
    "Cabbage, Chinese, boiled, drained", "Cabbage, boiled, drained", "Cabbage, common (danish",
    "Cabbage, common, head", "Cabbage, frozen, boiled", "Cabbage, green ball, head",
    "Cabbage, mustard, boiled, drained", "Cabbage, napa", "Cabbage, red cabbage, head",
    "Cabbage, red, boiled, drained", "Cabbage, savoy, boiled, drained", "Cabbage, white, boiled, drained",
    "Chinese Cabbage", "Chinese Cabbage (Pak-Choi)", "Chinese Cabbage (Pe-Tsai)", "Chinese cabbage, head",
    "Chinese white cabbage", "Common Cabbage", "Non-heading Chinese cabbage, \"Hiroshimana\", leaves",
    "Non-heading Chinese cabbage, \"Osaka-shirona\", leaves", "Non-heading Chinese cabbage, \"Santosai\", leaves",
    "Pointed cabbage", "Red Cabbage", "Red cabbage canned undrained", "Savoy Cabbage",
    "Savoy cabbage canned, drained", "Semi-heading Chinese cabbage, \"Nagasaki-hakusai\", leaves",
    "White Cabbage",
    # Bok choy / pak choi
    "Bok Choy Leaves", "Bok choy", "Bok choy, fried, no added fat", "Bok choy, pak-choi",
    "Bok choy, pak-choi, boiled drained", "Green Bok Choy Leaves", "Pak choi",
    "Pak choi stewed (prepard without fat)",
    # Kale
    "Curly kale", "Curly kale canned, drained", "Curly kale deep-frozen", "Kale", "Kale Leaves",
    "Kale, boiled, drained", "Kale, fried, no added fat", "Kale, frozen", "Kale, frozen, boiled, drained",
    "Kale, scotch", "Kale, scotch, boiled, drained",
    # Brussels sprouts
    "Brussels sprout", "Brussels sprout, fresh, baked, no added fat", "Brussels sprout, fresh, boiled, drained",
    "Brussels sprouts canned, drained", "Brussels sprouts deep-frozen", "Brussels sprouts, boiled, drained",
    "Brussels sprouts, frozen", "Brussels sprouts, frozen, boiled", "Brussels sprouts, frozen, boiled, drained",
    "Brussels sprouts, head", "Fresh Brussels Sprout",
    # Turnip / rutabaga / swede
    "Rutabaga", "Rutabaga (swede)", "Rutabaga (swede), boiled, drained", "Swede", "Swede, peeled, fresh",
    "Swede, peeled, fresh, boiled, drained", "Turnip", "Turnip Leaves",
    "Turnip green, \"Mizukakena\", leaves", "Turnip green, \"Nozawana\", leaves", "Turnip greens",
    "Turnip greens, boiled, drained", "Turnip greens, canned, unsalted", "Turnip greens, frozen",
    "Turnip greens, frozen, boiled, drained", "Turnip tops/greens", "Turnip, \"Sugukina\", leaves",
    "Turnip, \"Sugukina\", root", "Turnip, boiled, drained", "Turnip, frozen", "Turnip, frozen, boiled, drained",
    "Turnip, root, without skin", "Turnip, white, peeled, fresh", "Turnip, white, peeled, fresh, boiled, no added fat",
    # Watercress / arugula / rocket / collards / kohlrabi
    "Watercress", "Arugula", "Fresh Rocket", "Rocket", "Collards", "Collards, boiled, drained",
    "Collards, frozen", "Collards, frozen, boiled, drained", "Kohlrabi", "Kohlrabi canned, drained",
    "Kohlrabi, boiled, drained", "Kohlrabi, enlarged stems", "Kohlrabi, peeled, fresh",
    "Kohlrabi, peeled, fresh, boiled, drained",
    # Mustard greens (leafy vegetable -- NOT the condiment, see exclusions above)
    "Chinese mustard, \"Taisai\", leaves, raw", "Chinese mustard, \"Taisai\", young leaves, raw",
    "Leaf mustard, \"Karashina\", leaves", "Leaf mustard, \"Takana\", leaves", "Mustard Cabbage",
    "Mustard Spinach (Tendergreen)", "Mustard greens", "Mustard greens, boiled, drained",
    "Mustard greens, frozen", "Mustard greens, frozen, boiled, drained",
    "Mustard spinach (tendergreen), boiled, drained", "Spinach mustard, \"Komatsuna\", leaves",
    # Radish (root -- also Brassicaceae, per the citation's own family scope)
    "Radish", "Radish Sprouts", "Radish, oriental (daikon)", "Radish, oriental (daikon), boiled, drained",
    "Radish, red skinned, unpeeled", "Radish, white icicle", "Radish, white skinned, peeled",
    "Radishes, oriental", "Little Radish Root", "Small red radish",
    "Japanese radishes, Daikon, cultivar for leaf use, leaves", "Japanese radishes, Daikon, leaves",
    "Japanese radishes, Daikon, root without skin", "Japanese radishes, Daikon, sprouts",
    # Horseradish / wasabi (root -- also Brassicaceae; eaten in small
    # condiment-like quantities, so the cook/raw advice is technically
    # accurate but less practically significant than for the vegetables
    # above -- flagged honestly here, not omitted).
    "Drumstick (Horseradish-Tree) Leaves", "Drumstick (Horseradish-Tree) Pods",
    "Drumstick (horseradish-tree), leaves, boiled, drained", "Drumstick (horseradish-tree), pods, boiled, drained",
    "Horseradish", "Horseradish (unsalted)", "Horseradish Rhizome", "Japanese horseradish/wasabi root",
    "Wasabi Rhizome", "Wasabi Root", "Wasabi, root, (Japanese horseradish)",
}

# Tier vocabulary matches lib/sixDimensionsReference.ts exactly -- both
# already wired into TIER_DEFINITIONS/RED_TIERS/GREEN_TIERS/
# SUB_CRITERION_SOURCES there, waiting for real data.
GOITROGENIC_RAW_TIER = "Goitrogenic (Raw)"
GOITROGENIC_COOKED_TIER = "Minimal (Cooked)"
# COOKING_TERMS values are lowercase; prep_method itself is stored .title()
# (see split_prep_method below), so compare against the titled form. Not
# simply every COOKING_TERMS entry: "Pickled" and "Cured" are preservation
# methods, not necessarily heat -- fermented/vinegar-pickled vegetables
# alter glucosinolates by a different mechanism than the cited study
# measured (heat deactivating the myrosinase enzyme), so claiming "Minimal
# (Cooked)" for a pickled food would overstate what the citation actually
# supports. Those fall through to "Not Assessed" instead -- an honest gap,
# not a guess.
_COOKED_PREP_METHODS = {term.title() for term in COOKING_TERMS if term not in ("pickled", "cured")}


def goitrogenic_load_tier(base_name, prep_method):
    """Real tier for a matched cruciferous vegetable, or None if this food
    isn't one. Not Assessed (via the None fallthrough at the call site) for
    anything whose prep_method wasn't confidently extracted -- honest gap,
    not a guess, matching this database's existing 'Not Assessed' pattern
    for missing data everywhere else."""
    if base_name not in GOITROGENIC_BASE_NAMES:
        return None
    if prep_method == "Raw":
        return GOITROGENIC_RAW_TIER
    if prep_method in _COOKED_PREP_METHODS:
        return GOITROGENIC_COOKED_TIER
    return "Not Assessed"


# 2026-08-01 -- the source workbook's own D6 Oxalate Level/Load Rank/
# Mineral Binding Risk/Tolerance Note columns used to correctly cover
# thousands of foods (confirmed against this project's last known-good
# compiled database: e.g. Broccoli was "Low", not "Not Assessed"). At some
# point outside this project -- likely the same restructuring event that
# broke category classification (see RAW_CATEGORY_TO_CODE's own comment) --
# roughly 900 foods that used to have a real assessed tier regressed to
# "Not Assessed" in the current workbook. Unlike category, there's no
# reliable fallback COLUMN to re-derive this from (D6 has no equivalent of
# category's own raw_category text) -- this is a real backfill, built from
# scratch, sourced the same way the rest of this app's D1-D6 data is: real,
# cited external references.
#
# Sources (the same two this app already cites for every D6 sub-criterion,
# see SUB_CRITERION_SOURCES in lib/sixDimensionsReference.ts) -- corrected
# 2026-08-01 after a direct check found Broccoli isn't actually in the Wake
# Forest list despite an earlier version of this comment implying every
# food here was cross-checked against both:
#   - Oxalosis and Hyperoxaluria Foundation's 2024 oxalate list, fetched
#     directly both as the PDF (https://ohf.org/wp-content/uploads/2024/02/
#     Oxalate-List-022724.pdf) and, 2026-08-01, as its own live category
#     pages (https://ohf.org/oxalate-food-content-database/ and its
#     vegetables/fruit/grain/protein/dairy/sweets/etc sub-pages -- same
#     underlying numbers as the PDF, confirmed identical, but each page
#     also shows OHF's OWN tier letter per food (L/M/H/VH), which is NOT
#     what OXALATE_LEVEL_BASE_NAMES below is built from -- their letter is
#     based on OHF's own chosen reference serving size per food (varies
#     food to food: 1/4 cup for nuts, 1 medium for fruit, etc), while this
#     app uses the "avg oxalate per 100g" column consistently across every
#     food instead, matching the per-100g convention the rest of this
#     app's D1-D6 data already uses and staying consistent regardless of
#     how much of a food someone actually logs (this app doesn't rescale
#     D6 tiers by quantity). The two bases genuinely disagree for some
#     foods (e.g. Okra: 101mg/100g here is "High" under this app's own
#     threshold below, vs. OHF's own "Moderate" letter for their smaller
#     56g reference serving) -- not an error, a deliberate, disclosed
#     choice of denominator. Every entry below was directly cross-checked
#     against these live pages' own 100g figures; one real fix came out of
#     it -- Sweet Potato was wrongly using the peeled/without-skin value
#     instead of the more standard with-skin one, see that entry's own
#     comment. ~500 foods total across both PDF and pages -- the PRIMARY
#     source for most individual entries below, including Broccoli, since
#     it covers far more real whole foods than Wake Forest's own list does.
#   - Wake Forest University Baptist Medical Center Urology's own oxalate
#     food list (mg oxalate per 100g), fetched directly:
#     https://www.wakehealth.edu/-/media/wakeforest/clinical/files/urology/oxalate-food-list.pdf
#     Only ~130 foods, mostly older USDA-SR-style entries (no broccoli,
#     no almonds, no cauliflower/cabbage/kale among them) -- used here
#     specifically to CROSS-CHECK the smaller subset of foods it does
#     share with OHF, and to calibrate the tier thresholds below, not as a
#     second citation behind every individual entry. Any single food's own
#     entry below is sourced from whichever of the two lists actually
#     contains it -- usually OHF alone, occasionally both, never Wake
#     Forest alone (OHF's broader coverage means nothing here relies on
#     Wake Forest as its only source).
#
# Tiered against thresholds empirically reverse-engineered from this
# project's own last known-good database (cross-referencing real mg/100g
# values against foods that still had a correct, unregressed tier there)
# rather than importing a generic external scheme wholesale: roughly Low
# <20mg/100g, Moderate 20-80mg/100g, High 80-180mg/100g, Very High
# >180mg/100g. Real published oxalate figures vary meaningfully study to
# study (a well-documented limitation of oxalate content data generally,
# not specific to this app) -- this lands foods in the same broad tier the
# app's own prior, correct baseline data already did for every food that
# baseline anchor check could confirm (Potato/Moderate, Celery/Moderate,
# Buckwheat/High, Cashew/High, Walnut/High, Sesame/Very High, Almonds/Very
# High, Spinach/Very High), not a mechanically precise cutoff.
#
# Deliberately scoped to common whole foods only (not every one of the
# hundreds of items either source lists) -- composite dishes, branded
# products, and supplements are out of scope, matching this app's own
# existing "real, hand-verified, bounded" curation discipline (see
# GOITROGENIC_BASE_NAMES's own comment for the same reasoning).
OXALATE_LEVEL_BASE_NAMES = {
    # Very High (>180mg/100g)
    "Spinach": "Very High",
    "Rhubarb": "Very High",
    "Swiss Chard": "Very High",
    "Beet greens": "Very High",
    "Purslane": "Very High",
    "Nuts, almonds": "Very High",
    "Nuts, almond butter": "Very High",
    "Seeds, sesame seeds": "Very High",
    "Seeds, sesame seed kernels": "Very High",
    "Crude Wheat Bran": "Very High",
    "Crude Rice Bran": "Very High",
    "Cocoa, dry powder": "Very High",
    "Dark Chocolate": "Very High",
    # High (80-180mg/100g)
    "Buckwheat": "High",
    "Buckwheat groats": "High",
    "Amaranth grain": "High",
    "Nuts, cashew nuts": "High",
    "Nuts, cashew butter": "High",
    "Nuts, walnuts": "High",
    "Peanuts, all types": "High",
    "Crude Wheat Germ": "High",
    "Okra": "High",
    # Sweet Potato: 126mg/100g baked WITH skin vs. 42mg/100g without --
    # OHF's own vegetables-oxalate page lists both separately (2026-08-01
    # correction, found while cross-checking this whole list directly
    # against https://ohf.org/vegetables-oxalate/ rather than the earlier
    # PDF-only pass). With-skin baked is the more standard, commonly-eaten
    # form, so this uses that higher, more cautious value rather than the
    # peeled/mashed one -- was wrongly "Moderate" (the without-skin value)
    # before this check. Lowercase "potato" -- this app's own real
    # base_name for this food (verified directly against the database,
    # not assumed) -- a capital-P "Sweet Potato" silently matched nothing
    # at all despite looking right, caught by a systematic exact-case
    # check run after the OHF cross-check above, not by inspection.
    "Sweet potato": "High",
    # Moderate (20-80mg/100g)
    "Beets": "Moderate",
    "Eggplant": "Moderate",
    "Celery": "Moderate",
    "Potato": "Moderate",
    "Navy Beans": "Moderate",
    "Black Beans": "Moderate",
    "Pinto Beans": "Moderate",
    "Great Northern Beans": "Moderate",
    "Soybeans": "Moderate",
    "Edamame": "Moderate",
    "Tempeh": "Moderate",
    "Quinoa": "Moderate",
    "Bulgur": "Moderate",
    "Green Kiwifruit": "Moderate",
    "Common Guava": "Moderate",
    "Fig": "Moderate",
    "Pomegranate": "Moderate",
    # Low (<20mg/100g)
    "Broccoli": "Low",
    "Cauliflower": "Low",
    "Cabbage": "Low",
    "Kale": "Low",
    "Brussels sprout": "Low",
    "Kohlrabi": "Low",
    "Onion": "Low",
    "Garlic": "Low",
    "Lettuce, iceberg (includes crisphead types)": "Low",
    "Lettuce, cos or romaine": "Low",
    "Lettuce, green leaf": "Low",
    "Lettuce, red leaf": "Low",
    "Cucumber (with peel)": "Low",
    "Peeled Cucumber": "Low",
    "Tomato": "Low",
    "Squash, summer": "Low",
    "Squash, winter": "Low",
    "Squash, zucchini": "Low",
    # Split into three color-specific base_names 2026-08-02 (see
    # rename_sweet_pepper_by_color's own comment) -- oxalate content doesn't
    # meaningfully differ by bell pepper color per OHF's own data, so all
    # three keep the same "Low" tier the old generic "Sweet Pepper" had.
    "Red Bell Pepper": "Low",
    "Green Bell Pepper": "Low",
    "Yellow Bell Pepper": "Low",
    "Radish": "Low",
    "Turnip": "Low",
    "Turnip greens": "Low",
    "Parsnip": "Low",
    "Asparagus": "Low",
    "Artichokes, (globe or french)": "Low",
    "Leeks (Bulb And Lower Leaf-Portion)": "Low",
    "Snap Beans (Green Beans)": "Low",
    "White Mushrooms": "Low",
    "Brown Mushrooms": "Low",
    "Shiitake Mushrooms": "Low",
    "Kidney Beans": "Low",
    "Chickpeas (garbanzo beans, bengal gram)": "Low",
    "Lentils": "Low",
    "Split Peas": "Low",
    "Tofu": "Low",
    "Millet": "Low",
    "Corn": "Low",
    "Blueberry": "Low",
    "Wild Blueberry": "Low",
    "Strawberry": "Low",
    "Raspberry": "Low",
    "Cantaloupe Melon": "Low",
    "Watermelon": "Low",
    "Date, medjool": "Low",
    "Dates, deglet noor": "Low",
    "Avocado": "Low",
    "Apple": "Low",
    "Banana": "Low",
    "Orange": "Low",
    "Grapefruit": "Low",
    "Grape": "Low",
    "Pear": "Low",
    "Peach": "Low",
    "Plum": "Low",
    "Pineapple": "Low",
    "Mango": "Low",
    "Lemon": "Low",
    "Lime": "Low",
    "Chicken": "Low",
    "Beef": "Low",
    "Pork": "Low",
    "Salmon Fish": "Low",
    "Tuna Fish": "Low",
    "Milk": "Low",
    "Cheddar Cheese": "Low",
    "Yogurt": "Low",
}

# Mechanically derived from Oxalate Level -- matches the dominant real
# pattern already found in this project's own last known-good database
# (>95% of every already-correctly-tiered food followed exactly this
# mapping; see this section's own top comment) rather than a second,
# independent research pass -- Load Rank/Mineral Binding Risk/Tolerance
# Note all describe the same underlying fact as Oxalate Level, just in
# different vocabulary, not a genuinely separate measurement.
OXALATE_LOAD_RANK = {"Low": "Safe", "Moderate": "Moderate", "High": "Use Carefully", "Very High": "High Risk"}
OXALATE_MINERAL_RISK = {"Low": "Low", "Moderate": "Moderate", "High": "High", "Very High": "High"}
# Exact wording matched to this project's own last known-good database,
# not paraphrased -- lib/sixDimensionsReference.ts's tierSeverity() keys
# its own green/yellow/red coloring off these exact opening phrases ("Low
# oxalate", "Moderate oxalate", "Elevated oxalate", "High oxalate"), so
# reusing the identical strings verbatim is what makes this slot into that
# already-correct, unmodified app logic with zero app-code changes.
OXALATE_TOLERANCE_NOTE = {
    "Low": "Low oxalate content (real cited value, see Oxalate Level note) -- no specific mitigation needed.",
    "Moderate": "Moderate oxalate content (real cited value, see Oxalate Level note) -- generally fine in normal portions.",
    "High": "Elevated oxalate load (real cited value, see Oxalate Level note). Discard cooking water where applicable; pair with a calcium source.",
    "Very High": "High oxalate load (real cited value, see Oxalate Level note). Boil and discard the cooking water where applicable; pair with a calcium source at the same meal.",
}


def _is_oxalate_unassessed(tier):
    """True for the workbook's own 'no data' placeholder in any of the 4
    D6 Oxalate sub-criteria -- 'Not Assessed' verbatim for three of them,
    a full explanatory sentence (starting the same way every time) for
    Oxalate Tolerance Note specifically. See lib/sixDimensionsReference.ts's
    own tierSeverity() for the same distinction handled on the app side."""
    if not tier:
        return True
    return tier == "Not Assessed" or tier.startswith("No real, cited oxalate")


def oxalate_backfill_tier(sub_criterion, base_name):
    """Real, cited backfill value for one D6 sub-criterion, or None if
    base_name isn't in the curated list above. Only ever consulted when
    the workbook's own value is the 'Not Assessed' placeholder (see this
    function's call site) -- never overrides a real, already-correct
    workbook value."""
    level = OXALATE_LEVEL_BASE_NAMES.get(base_name)
    if level is None:
        return None
    if sub_criterion == "Oxalate Level":
        return level
    if sub_criterion == "Oxalate Load Rank":
        return OXALATE_LOAD_RANK[level]
    if sub_criterion == "Mineral Binding Risk":
        return OXALATE_MINERAL_RISK[level]
    if sub_criterion == "Oxalate Tolerance Note":
        return OXALATE_TOLERANCE_NOTE[level]
    return None


# USDA appends this exact disclaimer to a small number of rows to mark them
# as eligible for a government commodity-distribution program -- real
# metadata about a purchasing channel, not a distinguishing characteristic
# of the food itself. split_prep_method() below only strips a RECOGNIZED
# prep/cooking term from the end of a name; for the handful of rows where
# the source spreadsheet's own "Short Display Name" column was never
# separately curated (short_name == the full name, verbatim disclaimer
# included), this suffix has nowhere else to go and was leaking straight
# into base_name -- e.g. "Cheese, cheddar (Includes foods for USDA's Food
# Distribution Program)" ending up as its own base_name, "Cheddar Cheese
# (Includes Foods For USDA's Food Distribution Program)", a confusing
# near-duplicate of the already-correct plain "Cheddar Cheese" entry.
# Reported directly by the user, 2026-08-02, who spotted the cheese case;
# confirmed by querying the built database that Wheat Flour/Oats/Peanut
# Butter had the exact same leak. Stripped unconditionally wherever this
# literal boilerplate string appears at the end of a name -- it's never
# itself a real food descriptor, so there's no case where removing it loses
# information the way a blind trailing-clause strip would.
_FOOD_DISTRIBUTION_SUFFIX_RE = re.compile(
    r"\s*\(Includes foods for USDA's Food Distribution Program\)\s*$", re.IGNORECASE
)


def strip_food_distribution_program_suffix(base_name):
    return _FOOD_DISTRIBUTION_SUFFIX_RE.sub("", base_name).strip()


def split_prep_method(name, short_name=None):
    """Extract a food's cooking/prep state from its full name.

    Returns (base_name, prep_method). Three different strategies, tried in
    order:

    1. The current source workbook's own USDA rows often give short_name
       itself a trailing "(prepstate)" parenthetical -- e.g. "Broccoli
       (boiled)" -- a deliberate, reliable convention for exactly this
       when it's present, confirmed 2026-08-01 against 3,370 real USDA
       short_names. Checked directly on short_name via
       _TRAILING_PAREN_RE/_match_prep_term above, ahead of strategy 2
       below, since it's a more direct signal than reconstructing intent
       by diffing against `name` -- and structurally distinct anyway (a
       parenthetical suffix, not a comma-separated one), so the two
       strategies don't actually compete for the same rows.

    2. Most OTHER rows' own "Short Display Name" column is a genuine
       PREFIX of the full `name`, with the cooking/prep descriptor already
       stripped off by whatever curated that column -- e.g. name=
       "Broccoli, cooked, boiled, drained, with salt", short_name=
       "Broccoli". Confirmed empirically 2026-08-01 across USDA/UK_CoFID/
       Japan_MEXT/Canada_CNF/France_Ciqual/Australia_AFCD, all of which
       had near-zero real prep_method extraction under the OLD approach
       (parsing short_name alone) for exactly this reason: the prep info
       was never IN short_name to begin with, only in whatever `name` had
       left over past that shared prefix. That's what this branch mines,
       splitting the leftover text on commas and checking each clause
       against COOKING_TERMS/RAW_TERMS/STORAGE_TERMS in priority order
       (not just the literal last word, since the leftover text is often
       several clauses long and the clause that actually matters for
       scoring isn't always the final one -- see the tier lists' own
       comment).

       When NONE of the leftover clauses match a known term, the leftover
       is kept in `name` rather than discarded -- fixed 2026-08-02 after a
       real, serious case: this branch used to unconditionally collapse to
       bare `short_name` even when nothing matched, silently destroying
       whatever the leftover actually said. Reported as "the alcohol
       brands seem to have been removed"; investigation found that was
       true (3 real branded USDA beers -- BUDWEISER, BUD LIGHT, BUDWEISER
       SELECT -- had all collapsed into one indistinguishable "Beer
       Alcoholic Beverage" alongside 5 OTHER unbranded beer variants with
       no way to tell any of them apart), but the same mechanism was doing
       far more damage than just brand names: all 36 of USDA's real wine
       varietals (Merlot, Cabernet Sauvignon, Chardonnay, Riesling, etc.)
       had collapsed into one "Wine Alcoholic Beverage," and all 8 of its
       distilled-spirit rows (rum/vodka/whiskey at various proofs) had
       collapsed into one "Distilled Alcoholic Beverage" -- exactly the
       kind of information a person needs to pick the right real product,
       silently gone. This was already a known, flagged risk (see this
       file's own git history / CLAUDE.md's Next Steps around this date)
       from two smaller, individually-patched cases found earlier the same
       week (a dropped "queso seco"/"cheddar or colby" cheese variety, a
       Chicken Egg species ambiguity) -- alcohol is what finally showed how
       large the blast radius of leaving this unfixed really was, so the
       mechanism itself got fixed here rather than patching a fourth
       one-off case. This branch's own worst-case fallback now matches
       strategy 3's below (which already falls back to the full,
       untruncated string when it can't confidently extract anything) --
       consistent, and no case where it can lose real information the
       old behavior didn't already risk losing.

    3. Germany_BLS is the one source where short_name already equals the
       full name (nothing separately truncated), so there's no separate
       suffix to mine -- this and any other row matching neither strategy
       above falls through to the ORIGINAL single-trailing-word check this
       function always used, completely unchanged, so that already-correct
       behavior stays exactly as it was.
    """
    if not name and not short_name:
        return name, None

    if short_name:
        paren_match = _TRAILING_PAREN_RE.match(short_name)
        if paren_match:
            candidate_base = paren_match.group(1).strip(" ,")
            term = _match_prep_term(paren_match.group(2))
            if term and candidate_base:
                return candidate_base, term.title()

    if short_name and name and name.lower().startswith(short_name.lower()) and len(name) > len(short_name):
        suffix = name[len(short_name):].lstrip(" ,")
        if suffix:
            clauses = [c.strip().lower() for c in suffix.split(",")]
            # Word-boundary match, not a bare substring check -- same
            # precision the original trailing-word check already had for
            # free (its leading-space requirement ruled out mid-word
            # matches; a bare `in` here wouldn't), just needed spelling
            # out explicitly now that a term can match anywhere inside a
            # clause rather than only at a string's very end.
            for tier in (COOKING_TERMS, RAW_TERMS, STORAGE_TERMS):
                for term in tier:
                    pattern = r"\b" + re.escape(term) + r"\b"
                    if any(re.search(pattern, clause) for clause in clauses):
                        return short_name, term.title()
        # No clause matched a known term -- keep the full name rather than
        # collapsing to bare short_name (see this function's own docstring,
        # strategy 2, for why: silently discarding a real, unrecognized
        # leftover clause is exactly the bug that merged 36 distinct USDA
        # wines and 3 branded beers into one indistinguishable entry each).
        if suffix:
            return name, None
        return short_name, None

    original = short_name or name
    lowered = original.lower()
    for term in PREP_TERMS:
        suffix = " " + term
        if lowered.endswith(suffix) and len(original) > len(suffix):
            base = original[: len(original) - len(suffix)].rstrip(" ,")
            if base:
                return base, term.title()

    return original, None


# Dish-style names that are really a potato (or sweet potato) plus a cooking
# method, not a distinct vegetable -- e.g. "Potato pancakes"/"Potato wedges"/
# "au gratin"/"hash brown"/"mashed"/"O'Brien"/"scalloped" all just describe
# how a potato was prepared. These don't share a trailing suffix, so
# split_prep_method() above (which only strips single trailing words) leaves
# them as their own separate base_name each -- causing duplicate-looking
# "vegetables" in the picker for what's really one food (Potato) with
# different prep methods. Keyed on the base_name split_prep_method() already
# produced, checked by hand against every real Veg row containing these
# words. None of these carry a potato variety (russet/red/white) in the
# name, so they safely collapse into the same variety-less "Potato(es)"
# bucket the plain baked/boiled entries already use for that source.
PREP_METHOD_OVERRIDES = {
    ("Veg", "Potatoes, hash brown"): ("Potatoes", "Hash Browns"),
    ("Veg", "Potato, hashed-brown"): ("Potato", "Hash Browns"),
    ("Veg", "Potato, hashed brown"): ("Potato", "Hash Browns"),
    ("Veg", "Potatoes, mashed"): ("Potatoes", "Mashed"),
    ("Veg", "Potato, mashed"): ("Potato", "Mashed"),
    ("Veg", "Potatoes mashed instant powder"): ("Potatoes", "Mashed (Instant Powder)"),
    ("Veg", "Potatoes, dehydrated mashed potato"): ("Potatoes", "Mashed (Dehydrated)"),
    ("Veg", "Potatoes, au gratin"): ("Potatoes", "Au Gratin"),
    ("Veg", "Potato, au gratin"): ("Potato", "Au Gratin"),
    ("Veg", "Potatoes, scalloped"): ("Potatoes", "Scalloped"),
    ("Veg", "Potato, scalloped"): ("Potato", "Scalloped"),
    ("Veg", "Potatoes, o'brien"): ("Potatoes", "O'Brien"),
    ("Veg", "Potato, O'brien"): ("Potato", "O'Brien"),
    ("Veg", "Potato wedges"): ("Potatoes", "Wedges"),
    ("Veg", "Potato, wedges"): ("Potato", "Wedges"),
    ("Veg", "Potatoes ou Wedges ou Quartiers de pommes de terre épicés"): ("Potatoes", "Wedges"),
    ("Veg", "Potato pancakes"): ("Potatoes", "Pancakes"),
    ("Veg", "Potato pancakes deep-frozen"): ("Potatoes", "Pancakes (Deep-Frozen)"),
    ("Veg", "Potato pancake, homemade"): ("Potato", "Pancakes"),
}


def apply_prep_overrides(category_code, base_name, prep_method):
    override = PREP_METHOD_OVERRIDES.get((category_code, base_name))
    if override:
        return override[0], override[1]
    return base_name, prep_method


def load_shared_strings(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    shared = []
    for si in root.findall("m:si", NS):
        texts = si.findall(".//m:t", NS)
        shared.append("".join(t.text or "" for t in texts))
    return shared


def sheet_name_to_file_map(z):
    wb_root = ET.fromstring(z.read("xl/workbook.xml"))
    sheets_el = wb_root.find("m:sheets", NS)
    rels_root = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {
        rel.get("Id"): rel.get("Target")
        for rel in rels_root.findall("r:Relationship", REL_NS)
    }
    mapping = {}
    for s in sheets_el:
        name = s.get("name")
        rid = s.get(f"{R_NS}id")
        target = rid_to_target[rid]
        mapping[name] = "xl/" + target if not target.startswith("xl/") else target
    return mapping


def cell_value(c, shared):
    t = c.get("t")
    if t == "inlineStr":
        isnode = c.find("m:is", NS)
        if isnode is not None:
            texts = isnode.findall(".//m:t", NS)
            return "".join(x.text or "" for x in texts)
        return None
    v = c.find("m:v", NS)
    if v is None:
        return None
    if t == "s":
        return shared[int(v.text)]
    return v.text


def col_letters_to_index(ref):
    # e.g. "AY123" -> column letters "AY" -> 0-based index
    letters = "".join(ch for ch in ref if ch.isalpha())
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx - 1


def parse_sheet(z, sheet_file, shared):
    root = ET.fromstring(z.read(sheet_file))
    sheet_data = root.find("m:sheetData", NS)
    rows = sheet_data.findall("m:row", NS)
    if not rows:
        return [], []

    def row_to_sparse_list(row):
        cells = row.findall("m:c", NS)
        out = {}
        for c in cells:
            idx = col_letters_to_index(c.get("r"))
            out[idx] = cell_value(c, shared)
        if not out:
            return []
        width = max(out.keys()) + 1
        return [out.get(i) for i in range(width)]

    header = row_to_sparse_list(rows[0])
    data_rows = [row_to_sparse_list(r) for r in rows[1:]]
    return header, data_rows


def build(xlsx_path, db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.executescript(
        """
        PRAGMA journal_mode = OFF;
        DROP TABLE IF EXISTS foods;
        DROP TABLE IF EXISTS food_scores;
        DROP TABLE IF EXISTS sub_criteria;
        CREATE TABLE foods (
            food_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            source_code TEXT,
            name TEXT NOT NULL,
            name_local TEXT,
            short_name TEXT,
            base_name TEXT COLLATE NOCASE,
            prep_method TEXT COLLATE NOCASE,
            category TEXT NOT NULL,
            subcategory TEXT,
            raw_category TEXT,
            scientific_classification TEXT,
            classification_precision TEXT,
            PRIMARY KEY (food_id, source)
        );
        CREATE TABLE sub_criteria (
            id INTEGER PRIMARY KEY,
            dimension TEXT NOT NULL,
            sub_criterion TEXT NOT NULL,
            UNIQUE (dimension, sub_criterion)
        );
        CREATE TABLE food_scores (
            food_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            sub_criterion_id INTEGER NOT NULL,
            tier TEXT NOT NULL
        );
        CREATE INDEX idx_food_scores_food ON food_scores(food_id, source);
        CREATE INDEX idx_food_scores_sub ON food_scores(sub_criterion_id);
        CREATE INDEX idx_foods_category ON foods(category);
        CREATE INDEX idx_foods_subcategory ON foods(category, subcategory);
        CREATE INDEX idx_foods_name ON foods(name);
        CREATE INDEX idx_foods_short_name ON foods(short_name);
        CREATE INDEX idx_foods_base_name ON foods(category, base_name);

        DROP TABLE IF EXISTS nutrients;
        DROP TABLE IF EXISTS food_nutrients;
        CREATE TABLE nutrients (
            code TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            unit TEXT NOT NULL,
            nutrient_group TEXT NOT NULL
        );
        -- Normalized (long/tall) on purpose, not one column per nutrient:
        -- most foods only populate a subset, and this shape means Phase 2
        -- (amino acids, individual fatty acids, etc.) is purely additive
        -- rows in `nutrients` later, never a schema migration.
        --
        -- `source` doubles as the data-provenance signal for the app's own
        -- UI: every value currently imported here comes from one of the 7
        -- national testing bodies (USDA, UK_CoFID, Japan_MEXT, Germany_BLS,
        -- Canada_CNF, France_Ciqual, Australia_AFCD) -- the same trustworthy
        -- tier as everything else in this database. If a future food ever
        -- needs to fall back to manufacturer-declared branded-label data
        -- (no reputable-body data existing at all, e.g. Clover Sprouts),
        -- that should be written with a distinct source value such as
        -- "Branded:Wegmans" so the app can visually flag it as a different,
        -- less rigorous provenance tier rather than mixing it in silently.
        CREATE TABLE food_nutrients (
            food_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            nutrient_code TEXT NOT NULL,
            amount_per_100g REAL NOT NULL,
            PRIMARY KEY (food_id, source, nutrient_code)
        );
        CREATE INDEX idx_food_nutrients_food ON food_nutrients(food_id, source);

        -- Physiology knowledge base: how nutrients (and related substances --
        -- hydration, hormones, gut metabolites -- not every row here is a
        -- per-food nutrient, hence free-text rather than a foreign key into
        -- `nutrients`) interact with each other and affect body systems.
        -- This is NOT derived from the food spreadsheet at all -- it's
        -- independently researched content (see populate_physiology_knowledge
        -- below), stored here because it's still bundled, versioned
        -- reference data, the same as everything else in this database.
        DROP TABLE IF EXISTS body_systems;
        DROP TABLE IF EXISTS nutrient_interactions;
        DROP TABLE IF EXISTS nutrient_system_effects;
        CREATE TABLE body_systems (
            code TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            description TEXT
        );
        -- nutrient <-> nutrient relationships: synergy, antagonism, a
        -- required-cofactor relationship, or competition for absorption.
        CREATE TABLE nutrient_interactions (
            id INTEGER PRIMARY KEY,
            nutrient_a TEXT NOT NULL,
            nutrient_b TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            summary TEXT NOT NULL,
            population_scope TEXT NOT NULL,
            citation TEXT
        );
        CREATE INDEX idx_nutrient_interactions_a ON nutrient_interactions(nutrient_a);
        CREATE INDEX idx_nutrient_interactions_b ON nutrient_interactions(nutrient_b);
        -- one nutrient's deficiency or excess -> its effect on one body
        -- system. evidence_strength is disclosed explicitly (established /
        -- emerging / mechanistic_only) -- the same honesty pattern already
        -- used for the D1-D6 sub-criterion citations, since this content
        -- ranges from settled physiology (the Na+/K+ pump) to small, mixed-
        -- quality trials (magnesium and anxiety).
        CREATE TABLE nutrient_system_effects (
            id INTEGER PRIMARY KEY,
            nutrient TEXT NOT NULL,
            status TEXT NOT NULL,
            body_system TEXT NOT NULL,
            effect_summary TEXT NOT NULL,
            evidence_strength TEXT NOT NULL,
            population_scope TEXT NOT NULL,
            citation TEXT
        );
        CREATE INDEX idx_nutrient_system_effects_nutrient ON nutrient_system_effects(nutrient);
        CREATE INDEX idx_nutrient_system_effects_system ON nutrient_system_effects(body_system);

        -- Dietary Reference Intakes (RDA/AI/CDRR + Tolerable Upper Intake
        -- Level) for nonpregnant, nonlactating adults, by sex and age band.
        -- Source throughout: the National Academies of Sciences,
        -- Engineering, and Medicine (NASEM, formerly the Institute of
        -- Medicine) DRI reports, as summarized by NIH Office of Dietary
        -- Supplements fact sheets. Deliberately excludes macronutrients
        -- (energy, total fat, carbohydrate, sugars, saturated/mono/poly
        -- fat, cholesterol) that NASEM expresses as a %-of-calories AMDR
        -- range rather than a fixed daily amount -- turning that into a
        -- single gram figure here would misrepresent the actual guidance,
        -- and the app's existing D1-D6 sugar/saturated-fat sub-criteria
        -- already carry FDA/UK-FSA-based thresholds for those. Also
        -- excludes pregnancy/lactation values entirely -- a real gap, not
        -- an oversight, flagged as a likely future addition rather than
        -- silently guessed at here.
        DROP TABLE IF EXISTS dietary_reference_intakes;
        DROP TABLE IF EXISTS supplement_forms;
        CREATE TABLE dietary_reference_intakes (
            id INTEGER PRIMARY KEY,
            nutrient_code TEXT NOT NULL,
            sex TEXT NOT NULL,
            age_min INTEGER NOT NULL,
            age_max INTEGER,
            value_type TEXT NOT NULL,
            amount REAL NOT NULL,
            unit TEXT NOT NULL,
            upper_limit REAL,
            upper_limit_type TEXT,
            source_agency TEXT NOT NULL,
            citation TEXT,
            notes TEXT
        );
        CREATE INDEX idx_dri_nutrient_sex_age ON dietary_reference_intakes(nutrient_code, sex, age_min, age_max);

        -- Real, commonly available supplement forms per nutrient, with
        -- their comparative absorption/GI-tolerance profile -- this is the
        -- "best absorption, easiest on the body" teaching layer the user
        -- asked for, deliberately separate from the DRI amounts above
        -- since it answers a different question (which form, not how
        -- much).
        CREATE TABLE supplement_forms (
            id INTEGER PRIMARY KEY,
            nutrient_code TEXT NOT NULL,
            form_name TEXT NOT NULL,
            absorption_note TEXT NOT NULL,
            gi_tolerance_note TEXT,
            evidence_strength TEXT NOT NULL,
            citation TEXT,
            notes TEXT
        );
        CREATE INDEX idx_supplement_forms_nutrient ON supplement_forms(nutrient_code);

        -- Lab-test reference content: what each test measures, why it
        -- matters specifically for Hashimoto's, a typical adult reference
        -- range, and self-advocacy guidance (many of these are not
        -- ordered by default and the person may need to specifically ask
        -- for them). This is deliberately educational, not diagnostic --
        -- every row carries an explicit range_caveat because real
        -- reference ranges vary by lab/assay/sex/age, and the person's own
        -- lab report is always the authoritative range for their result,
        -- never this table.
        DROP TABLE IF EXISTS lab_test_categories;
        DROP TABLE IF EXISTS lab_tests;
        CREATE TABLE lab_test_categories (
            code TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            description TEXT
        );
        CREATE TABLE lab_tests (
            code TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            category_code TEXT NOT NULL,
            aliases TEXT,
            what_it_measures TEXT NOT NULL,
            why_it_matters_hashimotos TEXT NOT NULL,
            typical_range_low REAL,
            typical_range_high REAL,
            range_unit TEXT,
            range_caveat TEXT NOT NULL,
            is_commonly_ordered INTEGER NOT NULL,
            self_advocacy_note TEXT,
            evidence_strength TEXT NOT NULL,
            citation TEXT NOT NULL,
            FOREIGN KEY (category_code) REFERENCES lab_test_categories(code)
        );
        CREATE INDEX idx_lab_tests_category ON lab_tests(category_code);

        -- Structured, periodically-retakeable self-assessment content.
        -- Deliberately original item wording -- ThyPRO (Watt et al.) is a
        -- copyrighted instrument requiring the original author's
        -- permission, and the WHO-5 Well-Being Index is licensed
        -- CC BY-NonCommercial, which sits awkwardly next to this app's
        -- paid tier -- so rather than reproduce either verbatim, these
        -- items are original prompts written to cover the same documented
        -- symptom/wellbeing domains, with the real instrument cited as the
        -- methodology this was modeled on, the same "cite the source,
        -- don't copy the copyrighted text" approach already used for the
        -- D1-D6 rubric. The IBS domain follows the actual published
        -- IBS-SSS scoring structure and bands (Francis et al. 1997) more
        -- closely, since that's the numeric methodology itself, not
        -- copyrighted item wording.
        DROP TABLE IF EXISTS assessment_domains;
        DROP TABLE IF EXISTS assessment_items;
        CREATE TABLE assessment_domains (
            code TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            description TEXT NOT NULL,
            scoring_method TEXT NOT NULL,
            -- Explicit, positive-framed context on why retaking this over
            -- time is the point -- shown alongside results, not just
            -- filed away as metadata.
            framing_note TEXT NOT NULL,
            citation TEXT NOT NULL
        );
        CREATE TABLE assessment_items (
            code TEXT PRIMARY KEY,
            domain_code TEXT NOT NULL,
            prompt TEXT NOT NULL,
            response_type TEXT NOT NULL,
            sort_order INTEGER NOT NULL,
            FOREIGN KEY (domain_code) REFERENCES assessment_domains(code)
        );
        CREATE INDEX idx_assessment_items_domain ON assessment_items(domain_code, sort_order);

        -- "How much does one of these weigh" for foods commonly logged by
        -- count ("4 eggs") rather than weight or volume -- what makes the
        -- app's "each" unit actually convertible to grams for the nutrient
        -- analysis, the same way a density class makes "cup" convertible
        -- for a handful of liquid categories. Matched by EXACT base_name
        -- equality, not a keyword/substring search -- the real base_name
        -- data includes plenty of composite dishes that merely mention an
        -- ingredient ("Bread, egg (Challah)", "Apple-banana sauce"), and a
        -- loose match would silently apply a plain egg's weight to a
        -- pastry. Deliberately narrow (common everyday foods only, not all
        -- 22,016) -- see scripts/build_food_reference_db.py's
        -- FOOD_UNIT_WEIGHTS for exactly which base_names are covered and
        -- why bread/baked goods were left out of this first pass (their
        -- per-slice weight varies too much by type to trust one figure).
        DROP TABLE IF EXISTS food_unit_weights;
        CREATE TABLE food_unit_weights (
            id INTEGER PRIMARY KEY,
            base_name TEXT NOT NULL,
            unit_label TEXT NOT NULL,
            grams_per_unit REAL NOT NULL,
            citation TEXT NOT NULL,
            notes TEXT
        );
        CREATE INDEX idx_food_unit_weights_base_name ON food_unit_weights(base_name);
        """
    )

    cur.executemany(
        "INSERT INTO nutrients (code, display_name, unit, nutrient_group) VALUES (?, ?, ?, ?)",
        NUTRIENT_DEFINITIONS,
    )
    populate_physiology_knowledge(cur)
    populate_dietary_reference_data(cur)
    populate_lab_test_reference_data(cur)
    populate_assessment_content(cur)
    populate_food_unit_weights(cur)
    sub_criterion_ids = {}

    def get_sub_criterion_id(dim, sub):
        key = (dim, sub)
        if key not in sub_criterion_ids:
            cur.execute(
                "INSERT INTO sub_criteria (dimension, sub_criterion) VALUES (?, ?)",
                key,
            )
            sub_criterion_ids[key] = cur.lastrowid
        return sub_criterion_ids[key]

    with zipfile.ZipFile(xlsx_path) as z:
        shared = load_shared_strings(z)
        sheet_files = sheet_name_to_file_map(z)

        foods_rows = []
        score_rows = []
        nutrient_rows = []
        sheet_report = []

        for sheet_name, sheet_file in sheet_files.items():
            if sheet_name in SKIP_SHEETS:
                continue

            # Sheet name convention: "{SOURCE_PREFIX}_{CategoryCode}" -- no
            # longer true for the real current workbook (every sheet is now
            # just the bare source name, see RAW_CATEGORY_TO_CODE's own
            # comment), so category_code from this alone is stale/unreliable
            # now. Kept only as source_prefix's source and as the last-resort
            # fallback below for a raw_category text this build has never
            # seen before.
            source_prefix, _, sheet_category_code = sheet_name.partition("_")

            header, data_rows = parse_sheet(z, sheet_file, shared)
            if not header:
                sheet_report.append((sheet_name, 0))
                continue

            col_index = {name: i for i, name in enumerate(header) if name}
            normalized_col_index = {normalize_header(name): i for i, name in enumerate(header) if name}

            score_cols = []  # (index, dimension, sub_criterion)
            for i, name in enumerate(header):
                if name and len(name) > 2 and name[:2] in ("D1", "D2", "D3", "D4", "D5", "D6") and " | " in name:
                    dim, sub = name.split(" | ", 1)
                    score_cols.append((i, dim.strip(), sub.strip()))

            # nutrient_code -> list of column indices to try, in priority
            # order (this sheet's subset of the aliases that actually
            # exist -- most nutrients resolve to exactly one).
            nutrient_cols = {}
            for code, aliases in NUTRIENT_COLUMN_ALIASES.items():
                indices = [normalized_col_index[a] for a in aliases if a in normalized_col_index]
                if indices:
                    nutrient_cols[code] = indices

            missing_identity = [c for c in ["food_id", "source", "food_name", "category"] if c not in col_index]
            if missing_identity:
                raise RuntimeError(f"{sheet_name}: missing identity columns {missing_identity}")

            count = 0
            for row in data_rows:
                if not row:
                    continue

                def get(colname):
                    idx = col_index.get(colname)
                    if idx is None or idx >= len(row):
                        return None
                    return row[idx]

                food_id_raw = get("food_id")
                name = get("food_name")
                if food_id_raw is None or not name:
                    continue

                try:
                    food_id = int(float(food_id_raw))
                except (TypeError, ValueError):
                    continue

                source = get("source") or source_prefix
                # Real per-row category derivation -- see RAW_CATEGORY_TO_CODE's
                # own comment for why this replaced the old sheet-name-derived
                # value. sheet_category_code only matters as a fallback for a
                # (source, raw_category) pair this build has never seen before.
                row_raw_category = get("category")
                category_code = RAW_CATEGORY_TO_CODE.get((source, row_raw_category), sheet_category_code)
                short_name = get("Short Display Name")
                base_name, prep_method = split_prep_method(name, short_name)
                base_name = strip_food_distribution_program_suffix(base_name)
                base_name, prep_method = apply_prep_overrides(category_code, base_name, prep_method)
                base_name = rename_bean_type_first(base_name)
                base_name = rename_sprout(base_name, name)
                base_name = apply_base_name_alias(base_name)
                # General "Head, clause" -> natural English word order pass
                # (see natural_name_reorder.py/natural_name_reorder_REPORT.md).
                # Deliberately conservative: reorder_base_name() returns the
                # input unchanged for anything not confidently matched, so
                # this is safe to run unconditionally on every row.
                base_name = reorder_base_name(base_name, source=source)["output"]
                base_name = rename_sweet_pepper_by_color(base_name, name)
                base_name = rename_chicken_egg(base_name)
                base_name = rename_spirit_clean(base_name)
                base_name = rename_juice_clean(base_name)
                effective_category = reclassify_category(category_code, base_name)
                # A tiny, hand-verified set of foods whose base_name
                # collides with a different product entirely (see the
                # comment on NAME_CATEGORY_OVERRIDES) -- keyed on the full
                # `name` since base_name can't disambiguate them. Checked
                # after the ordinary base_name-keyed reclassification so it
                # always wins for the handful of rows it applies to.
                name_override = NAME_CATEGORY_OVERRIDES.get(name)
                if name_override:
                    effective_category, base_name = name_override
                effective_category = reclassify_bev_alcoholic_to_alcohol(effective_category, name)
                # Classify against the full name, not short_name -- for
                # branded/composite products short_name is often truncated
                # to something generic (e.g. "Beverages, OCEAN SPRAY"),
                # which hides the actual descriptive words ("Juice Drink")
                # the classifier needs to see.
                foods_rows.append((
                    food_id,
                    source,
                    get("source_code"),
                    name,
                    get("food_name_local"),
                    short_name,
                    base_name,
                    prep_method,
                    effective_category,
                    bev_alcoholic_false_positive_subcategory(effective_category, name)
                    or veg_processed_false_positive_subcategory(effective_category, base_name)
                    or classify_subcategory(effective_category, name),
                    get("category"),
                    get("Scientific Classification"),
                    get("Classification Precision"),
                ))

                # Synthesized, not a real workbook column -- see
                # GOITROGENIC_BASE_NAMES's own comment above for why. Uses
                # the same final base_name (post name_override) as the
                # foods row just appended above, and the same prep_method
                # already computed for it, so this can never disagree with
                # what the app itself displays for this food.
                goitrogenic_tier = goitrogenic_load_tier(base_name, prep_method)
                if goitrogenic_tier:
                    goitrogenic_sub_id = get_sub_criterion_id(
                        "D1 Micronutrient Density & Bioavailability", "Goitrogenic Load"
                    )
                    score_rows.append((food_id, source, goitrogenic_sub_id, goitrogenic_tier))

                for idx, dim, sub in score_cols:
                    if idx >= len(row):
                        continue
                    tier = row[idx]
                    # Real, cited backfill for the D6 Oxalate regression --
                    # see OXALATE_LEVEL_BASE_NAMES's own comment above.
                    # Only ever fires when the workbook's own value is
                    # missing/the "Not Assessed" placeholder, so a food the
                    # workbook still correctly assesses is never touched.
                    if dim.startswith("D6") and _is_oxalate_unassessed(tier):
                        backfill = oxalate_backfill_tier(sub, base_name)
                        if backfill:
                            tier = backfill
                    if tier:
                        sub_id = get_sub_criterion_id(dim, sub)
                        score_rows.append((food_id, source, sub_id, tier))

                for code, indices in nutrient_cols.items():
                    amount = None
                    for idx in indices:
                        if idx < len(row):
                            amount = parse_nutrient_amount(row[idx])
                            if amount is not None:
                                break
                    if amount is not None:
                        nutrient_rows.append((food_id, source, code, amount))

                count += 1
            sheet_report.append((sheet_name, count))

        # Synthetic aged/unaged spirit variants, 2026-08-02 -- not present
        # anywhere in any of the 7 real sources (confirmed by direct query:
        # zero rows for "reposado"/"añejo"/"blanco tequila"/"white rum"/
        # "dark rum" anywhere in the built database, and the only
        # tequila-adjacent row at all is Germany_BLS's single combined
        # "Agave spirit (Mezcal/Tequila)"). Added at the user's own explicit
        # request, after a real discussion about what "branded" alcohol
        # data would actually need to capture: for PLAIN distilled spirits,
        # real nutrition research confirms calories/carbs are driven almost
        # entirely by proof, not brand or aging -- so there was never a
        # need to chase brand-specific vodka/whiskey/tequila data the way
        # there might be for beer. What genuinely differs between an aged
        # and unaged spirit is congener content (esters/aldehydes/tannins
        # picked up from the barrel, not "oxidation" building up "oxides"
        # as literally described, though the underlying instinct -- aging
        # changes the drink in a way that could matter for someone's body
        # -- was directionally right) -- linked in the research to hangover
        # severity, but not something any of these 7 national databases
        # measures or reports as a nutrient. These 5 entries exist so a
        # person can correctly LOG which one they actually drank (serving
        # this app's core purpose of letting someone find their own
        # personal patterns -- see this file's own Assessment/Bio-Compass
        # framing elsewhere in the app), not because their macro/vitamin/
        # mineral numbers differ from the real spirit they're based on --
        # they deliberately don't, since the chemistry doesn't support
        # inventing different numbers here.
        #
        # Each variant's own nutrient and score profile is a straight
        # duplicate of a real, already-processed row's own values (never
        # independently invented) -- tequila variants copy USDA's own
        # generic "distilled, all (gin, rum, vodka, whiskey), 80 proof"
        # (food_id 7304), the best real analog for a neutral 80-proof
        # spirit regardless of base plant material, since distillation
        # removes virtually everything about the source ingredient that
        # would affect calorie content; rum variants copy USDA's own real
        # "distilled, rum, 80 proof" row (food_id 7306) directly. `source`
        # is deliberately "Derived," not "USDA" or any real source name --
        # this is real, cited nutrition science applied to real official
        # numbers, but it was never independently measured or submitted by
        # any of the 7 national agencies, and labeling it as if it were
        # would misrepresent where it came from. food_id starts at 900001,
        # far outside any real workbook's own ID range (confirmed max
        # real food_id is 27980), so there's no collision risk.
        SYNTHETIC_SPIRIT_VARIANTS = [
            ("Tequila, Blanco (Unaged)", 7304, "USDA"),
            ("Tequila, Reposado (Aged 2-12 Months)", 7304, "USDA"),
            ("Tequila, Añejo (Aged 1-3 Years)", 7304, "USDA"),
            ("Rum, Light/White (Unaged or Filtered)", 7306, "USDA"),
            ("Rum, Dark/Aged", 7306, "USDA"),
            # Added 2026-08-02, same day, alongside the Spirits & Liqueurs
            # cleanup: no source has a standalone "Gin, 80 proof" entry the
            # way USDA has for vodka/whiskey (gin only appears bundled in
            # the generic "all" bucket, now hidden as redundant -- see
            # lib/db.ts). Copies the same food_id 7304 template as the
            # tequila variants -- the confirmed real answer to "is gin any
            # different" is no, USDA's own combined bucket already treated
            # it as equivalent to vodka/rum/whiskey at the same proof.
            ("Gin, 80 Proof", 7304, "USDA"),
        ]
        synthetic_food_id = 900001
        for variant_name, template_food_id, template_source in SYNTHETIC_SPIRIT_VARIANTS:
            template_nutrients = [
                row for row in nutrient_rows
                if row[0] == template_food_id and row[1] == template_source
            ]
            template_scores = [
                row for row in score_rows
                if row[0] == template_food_id and row[1] == template_source
            ]
            foods_rows.append((
                synthetic_food_id,
                "Derived",
                None,
                variant_name,
                None,
                variant_name,
                variant_name,
                None,
                "Alcohol",
                "Spirits & Liqueurs",
                None,
                None,
                None,
            ))
            for _, _, code, amount in template_nutrients:
                nutrient_rows.append((synthetic_food_id, "Derived", code, amount))
            for _, _, sub_id, tier in template_scores:
                score_rows.append((synthetic_food_id, "Derived", sub_id, tier))
            synthetic_food_id += 1

        cur.executemany(
            """INSERT OR REPLACE INTO foods
               (food_id, source, source_code, name, name_local, short_name, base_name, prep_method,
                category, subcategory, raw_category, scientific_classification, classification_precision)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            foods_rows,
        )
        cur.executemany(
            """INSERT INTO food_scores (food_id, source, sub_criterion_id, tier)
               VALUES (?, ?, ?, ?)""",
            score_rows,
        )
        cur.executemany(
            """INSERT OR REPLACE INTO food_nutrients (food_id, source, nutrient_code, amount_per_100g)
               VALUES (?, ?, ?, ?)""",
            nutrient_rows,
        )
        conn.commit()
        cur.execute("VACUUM")

        total_foods = cur.execute("SELECT COUNT(*) FROM foods").fetchone()[0]
        total_scores = cur.execute("SELECT COUNT(*) FROM food_scores").fetchone()[0]
        total_nutrients = cur.execute("SELECT COUNT(*) FROM food_nutrients").fetchone()[0]
        distinct_food_id = cur.execute("SELECT COUNT(DISTINCT food_id) FROM foods").fetchone()[0]
        foods_with_nutrients = cur.execute("SELECT COUNT(DISTINCT food_id || '|' || source) FROM food_nutrients").fetchone()[0]

        print(f"Sheets processed: {len(sheet_report)}")
        print(f"Total food rows: {total_foods}")
        print(f"Distinct food_id values: {distinct_food_id}")
        print(f"Total score rows: {total_scores}")
        print(f"Total nutrient value rows: {total_nutrients}")
        print(f"Food/source pairs with at least one nutrient value: {foods_with_nutrients}")
        print("\nPer-sheet row counts:")
        for name, count in sheet_report:
            print(f"  {name}: {count}")

    conn.close()


def write_version_file(version_ts_path):
    # The app compares this against what it last imported on-device and
    # force-reimports whenever it changes -- without this, expo-sqlite's
    # importDatabaseFromAssetAsync silently skips re-copying a file that
    # already exists on the device, so every rebuild after the first
    # install would otherwise never actually reach the phone.
    version = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S")
    with open(version_ts_path, "w") as f:
        f.write("// Auto-generated by scripts/build_food_reference_db.py -- do not edit by hand.\n")
        f.write(f'export const REFERENCE_DB_VERSION = "{version}";\n')
    print(f"\nWrote version {version} to {version_ts_path}")


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        print("Usage: py build_food_reference_db.py <LIVE.xlsx path> <output .db path> [version .ts output path]")
        sys.exit(1)
    build(sys.argv[1], sys.argv[2])
    if len(sys.argv) == 4:
        write_version_file(sys.argv[3])
