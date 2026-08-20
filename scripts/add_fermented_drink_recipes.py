"""
Patches the already-built assets/data/foods_reference.db with a real, first
wave of 22 new curated Fermentation Builder recipes -- fermented/wild-
fermented DRINKS, direct request 2026-08-20 from two shared Google AI Mode
conversations about homemade fermented drinks for gut health, joint pain,
and sleep, corroborated independently (see the approved plan for the
per-claim evidence-tiering that grounds every citation these recipes' own
Digest entries carry -- this script only seeds the real, buildable
ingredient list; the health framing lives in lib/digest/recipes.ts).

Follows the exact same pattern and discipline as
scripts/add_curated_recipes_batch2.py: every (category, base_name) pair
below was independently verified against the live, bundled reference
database via direct sqlite3 queries before being written in here. Safe to
re-run (INSERT ... ON CONFLICT(id) DO UPDATE for curated_recipes,
delete-then-insert for its ingredient/strain rows).

Strain links deliberately follow the same honesty precedent
add_curated_recipes_batch2.py already set with kombucha: a WILD ferment
(fruit-skin yeast, kefir grains, a SCOBY-like culture) doesn't get a
strain_id from fermentation_strains' own 7-organism catalog unless that
specific organism is genuinely the documented dominant one at the stage
this recipe describes. Only the two short vegetable lacto-ferments here
(Beet Kvass, Kanji) link strain_l_mesenteroides, matching the same
early-fermentation-dominance science already cited in
lib/digest/fermentedFoods.ts's own sauerkraut-succession entry. Every wild-
yeast drink (the tonic family, Ginger Bug, Tepache, Jun, both kefirs)
stays unlinked, same as kombucha's own SCOBY.

This is Wave 1 of a larger, explicitly tracked backlog (see CLAUDE.md's
Status snapshot) -- roughly 19 more named traditional fermented drinks from
the same source conversations (Milk Kefir, Amazake, Rejuvelac, Mauby,
Calpis, Burdock & Dandelion Ale, Pozol, Sobia, Pine Needle Cheong, Boza,
Chicha, rye Kvass, Sake, Makgeolli, Ayran, Lassi, Tarag, Pu-erh Tea, Palm
Wine, Pulque) are queued for a later wave, several needing either a real
gluten-free grain substitution decision or an honest acknowledgment that
this database has no resolvable ingredient for them (palm sap, agave sap,
soldierwood bark, pine needles, mare's milk -- all independently confirmed
absent via direct query before writing this comment).

Usage:
  py scripts/add_fermented_drink_recipes.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# Real, confirmed (category, base_name) shorthand, verified directly against
# the live database before use here.
GINGER = ("Herbs", "Ginger root")
TURMERIC = ("Herbs", "Turmeric, dried, ground")
BLACK_PEPPER = ("Herbs", "Pepper, black, ground")
HONEY = ("Sweets", "Standard Honey (Blossom Honey)")
MOLASSES = ("Sweets", "Blackstrap Molasses (Pure)")
CIDER_VINEGAR = ("Herbs", "Vinegar, cider")
WATER = ("Bev", "Water, tap")
SALT = ("Herbs", "Common salt/table salt")
BEETROOT = ("Veg", "Beetroot")
CARROT = ("Veg", "Carrot")
MUSTARD_SEED = ("Herbs", "Spices, mustard seed, yellow")
GARLIC = ("Veg", "Garlic")
LEMON = ("Fruit", "Lemon")
LIME = ("Bev", "Lime")
BLUEBERRY = ("Fruit", "Blueberry")
SOUR_CHERRY = ("Fruit", "Sour Cherry")
POMEGRANATE = ("Bev", "Pomegranate")  # this database's own Fruit|Pomegranate rows are all audit-hidden; Bev|Pomegranate (pomegranate juice/arils) is the real, visible equivalent
CRANBERRY = ("Fruit", "Cranberry")
RED_GRAPE = ("Fruit", "Grape")
BLACKBERRY = ("Fruit", "Blackberry")
RASPBERRY = ("Fruit", "Raspberry")
ELDERBERRY = ("Fruit", "Elderberry")
APPLE = ("Fruit", "Apple")
PEAR = ("Fruit", "Pear")
HIBISCUS_TEA = ("Bev", "Tea, hibiscus")
BLACK_TEA_BREWED = ("Brewing", "Black Tea (Brewed)")
GREEN_TEA_BREWED = ("Brewing", "Green Tea (Brewed)")
PINEAPPLE = ("Fruit", "Pineapple")
COCONUT_WATER = ("Bev", "Coconut water")
SUGAR = ("Sweets", "Sugar (Cane / Granulated)")

RECIPES = [
    # ------------------------------------------------------------------
    # Wild-Fermented Fruit/Flower Tonic family -- one shared method (raw
    # ginger/turmeric skins seed wild yeast + lactic acid bacteria onto
    # fruit that can't reliably carry its own, matching the tepache-style
    # technique the source conversation converged on), 8 fruit/flower
    # variations. Every one maps to Fermentation Builder's Fruit/Veg
    # ingredient category.
    # ------------------------------------------------------------------
    ("curated_ferment_tonic_tart_cherry_ginger_turmeric", "fermentation",
     "Wild-Fermented Tart Cherry, Ginger & Turmeric Tonic",
     "Tart, earthy, and lightly fizzy.",
     "Tart cherry's own melatonin and anthocyanins, paired with fermentation-softened ginger "
     "and turmeric, black pepper included for turmeric's own documented curcumin-absorption boost.",
     4.0, 0.5, "cup", 5,
     [
         (*SOUR_CHERRY, 300, "g", "pitted, lightly crushed", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_blueberry_ginger_turmeric", "fermentation",
     "Wild-Fermented Blueberry, Ginger & Turmeric Tonic",
     "Deep purple, tangy, and lightly fizzy.",
     "Fermentation breaks down blueberry's own cell walls, making its anthocyanin antioxidants "
     "more bioavailable than eating the fruit raw.",
     4.0, 0.5, "cup", 6,
     [
         (*BLUEBERRY, 300, "g", "lightly crushed", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_pomegranate_ginger_turmeric", "fermentation",
     "Wild-Fermented Pomegranate, Ginger & Turmeric Tonic",
     "Tart, ruby-colored, and dry rather than sweet.",
     "Pomegranate's own ellagitannins are what certain gut bacteria convert into Urolithin A, "
     "a compound with real human trial data on mitochondrial and muscle health -- worth knowing "
     "honestly: those trials dosed purified Urolithin A directly, and not everyone's own gut "
     "bacteria can make it from a fermented drink alone.",
     4.0, 0.5, "cup", 7,
     [
         (*POMEGRANATE, 300, "ml", "unsweetened, pure juice, or fresh arils pulsed and strained", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 50, "g", None, None, None),
         (*WATER, 650, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_cranberry_ginger_turmeric", "fermentation",
     "Wild-Fermented Cranberry, Ginger & Turmeric Tonic",
     "Sharply tart, ruby-red, and lightly fizzy.",
     "Cranberry's own A-type proanthocyanidins are well-documented for blocking bacteria from "
     "sticking to the urinary tract wall, a distinct mechanism from most other berries here.",
     4.0, 0.5, "cup", 8,
     [
         (*CRANBERRY, 250, "g", "pulsed to break the skins", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 85, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_red_grape_ginger_turmeric", "fermentation",
     "Wild-Fermented Red Grape, Ginger & Turmeric Tonic",
     "Wine-adjacent, fruity, and highly carbonated.",
     "Red grape skins carry resveratrol, an antioxidant with early evidence (mostly animal "
     "studies so far) for supporting Akkermansia muciniphila, a bacterium linked to a healthy "
     "gut lining.",
     4.0, 0.5, "cup", 9,
     [
         (*RED_GRAPE, 300, "g", "halved", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 50, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_hibiscus_ginger_turmeric", "fermentation",
     "Wild-Fermented Hibiscus, Ginger & Turmeric Tonic",
     "Cranberry-tart, deep red, and floral.",
     "Dried hibiscus carries an antioxidant profile that rivals berries, with separate human "
     "trial evidence for modestly lowering blood pressure.",
     4.0, 0.5, "cup", 10,
     [
         (*HIBISCUS_TEA, 900, "ml", "steeped and cooled", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 65, "g", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_blackberry_raspberry_ginger_turmeric", "fermentation",
     "Wild-Fermented Blackberry & Raspberry, Ginger & Turmeric Tonic",
     "Deep berry flavor, jammy, and lightly fizzy.",
     "Blackberries and raspberries carry more ellagic acid and prebiotic fiber than most "
     "other berries here, feeding beneficial bifidobacteria in the large intestine directly.",
     4.0, 0.5, "cup", 11,
     [
         (*BLACKBERRY, 150, "g", "lightly crushed", "Wild-fermented", None),
         (*RASPBERRY, 150, "g", "lightly crushed", None, None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_elderberry_ginger_turmeric", "fermentation",
     "Wild-Fermented Elderberry, Ginger & Turmeric Tonic",
     "Deep purple, tart, and warmly spiced.",
     "Elderberry has its own separately documented antiviral-supportive research; unlike most "
     "fruit here, raw elderberries aren't safe eaten whole, so fermenting (not just steeping) "
     "them is the traditional preparation, not an optional step.",
     4.0, 0.5, "cup", 12,
     [
         (*ELDERBERRY, 250, "g", "stems removed, lightly crushed", "Wild-fermented", None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*TURMERIC, 10, "g", None, None, None),
         (*HONEY, 75, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
         (*BLACK_PEPPER, 0.5, "g", None, None, None),
     ], []),
    ("curated_ferment_tonic_apple_pear", "fermentation",
     "Wild-Fermented Apple & Pear Tonic",
     "Crisp, mildly sweet, and lightly fizzy, closest to a homemade sparkling cider.",
     "Unpeeled apple and pear carry pectin, a prebiotic fiber that feeds beneficial gut "
     "bacteria as it ferments down.",
     4.0, 0.5, "cup", 13,
     [
         (*APPLE, 200, "g", "grated, unpeeled", "Wild-fermented", None),
         (*PEAR, 200, "g", "grated, unpeeled", None, None),
         (*GINGER, 15, "g", "unpeeled, sliced", None, None),
         (*HONEY, 50, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
     ], []),
    ("curated_ferment_tonic_lemon_lime", "fermentation",
     "Wild-Fermented Lemon-Lime Probiotic Soda",
     "Bright, sharply citrusy, and highly carbonated.",
     "The same wild-ferment method, minus the anthocyanin-rich fruit -- this one leans on "
     "vitamin C and citrus's own digestive-bitter compounds instead.",
     4.0, 0.5, "cup", 14,
     [
         (*LEMON, 150, "g", "sliced, unpeeled", "Wild-fermented", None),
         (*LIME, 100, "g", "sliced, unpeeled", None, None),
         (*GINGER, 20, "g", "unpeeled, sliced", None, None),
         (*HONEY, 75, "g", None, None, None),
         (*WATER, 950, "ml", None, None, None),
     ], []),

    # ------------------------------------------------------------------
    # Named traditional fermented drinks from the source conversations --
    # each independently verified as dairy-free, gluten-free, and buildable
    # from real ingredients in this database.
    # ------------------------------------------------------------------
    ("curated_ferment_beet_kvass", "fermentation", "Beet Kvass",
     "Earthy, tangy, and deeply savory rather than sweet.",
     "A short, salt-brine lacto-ferment: low in sugar by design, with the same nitric-oxide-"
     "supportive polyphenols raw beets are already known for.",
     6.0, 0.5, "cup", 15,
     [
         (*BEETROOT, 500, "g", "peeled, chopped"," Wild-fermented", None),
         (*WATER, 1500, "ml", None, None, None),
         (*SALT, 20, "g", None, None, None),
     ], ["strain_l_mesenteroides"]),
    ("curated_ferment_kanji", "fermentation", "Kanji (Fermented Carrot & Mustard Seed)",
     "Sharp, tangy, and lightly spiced.",
     "A traditional Indian lacto-ferment; this app's own reference database has no purple "
     "carrot variety, so this uses ordinary carrot, still a real lactic-acid-bacteria-rich "
     "ferment, just a different color than the original.",
     6.0, 0.5, "cup", 16,
     [
         (*CARROT, 500, "g", "peeled, sliced into batons", "Wild-fermented", None),
         (*MUSTARD_SEED, 10, "g", "lightly crushed", None, None),
         (*WATER, 1500, "ml", None, None, None),
         (*SALT, 20, "g", None, None, None),
     ], ["strain_l_mesenteroides"]),
    ("curated_ferment_water_kefir", "fermentation", "Water Kefir",
     "Mild, lightly tangy, and naturally carbonated.",
     "Water kefir grains are their own distinct multi-species culture, not simply "
     "\"kombucha without tea\" -- a milder, faster ferment than kombucha, often ready in "
     "24 to 48 hours.",
     4.0, 1.0, "cup", 17,
     [
         (*SUGAR, 60, "g", None, "Fermented", None),
         (*WATER, 1000, "ml", None, None, None),
         (*LEMON, 30, "g", "sliced", None, None),
     ], []),
    ("curated_ferment_coconut_kefir", "fermentation", "Coconut Kefir",
     "Mild, tangy, and naturally a little sweet.",
     "The same kefir-grain culture as milk kefir, minus dairy's own casein protein -- coconut "
     "also contributes lauric acid, with separate documented antimicrobial properties.",
     4.0, 1.0, "cup", 18,
     [
         (*COCONUT_WATER, 1000, "ml", None, "Fermented", None),
     ], []),
    ("curated_ferment_ginger_bug_soda", "fermentation", "Ginger Bug Soda",
     "Spicy, warming, and naturally carbonated.",
     "A ginger bug is a self-sustaining wild-yeast starter culture, fed daily with fresh "
     "ginger and sugar -- once active, it's the same starter this app's other wild-ferment "
     "recipes can use instead of relying on a fruit's own skin yeast.",
     4.0, 1.0, "cup", 19,
     [
         (*GINGER, 60, "g", "grated, unpeeled", "Fermented", None),
         (*SUGAR, 60, "g", None, None, None),
         (*WATER, 1000, "ml", None, None, None),
     ], []),
    ("curated_ferment_ginger_beer_traditional", "fermentation", "Traditional Fermented Ginger Beer",
     "Sharply spicy, warming, and highly carbonated.",
     "Built from an active ginger bug (above) rather than commercial ginger ale's own "
     "artificial carbonation -- real fermentation is what produces the fizz here.",
     4.0, 1.0, "cup", 20,
     [
         (*GINGER, 80, "g", "grated, unpeeled", "Fermented", None),
         (*LEMON, 60, "g", "juiced", None, None),
         (*SUGAR, 100, "g", None, None, None),
         (*WATER, 1000, "ml", None, None, None),
     ], []),
    ("curated_ferment_turmeric_drink", "fermentation", "Fermented Turmeric Drink",
     "Earthy, warming, and lightly tangy.",
     "The same curcumin-and-piperine bioavailability boost as this app's own Golden Milk "
     "recipe, in a dairy-free, fermented form instead.",
     4.0, 1.0, "cup", 21,
     [
         (*TURMERIC, 30, "g", "grated, unpeeled", "Fermented", None),
         (*GINGER, 20, "g", "grated, unpeeled", None, None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 1000, "ml", None, None, None),
         (*BLACK_PEPPER, 1, "g", None, None, None),
     ], []),
    ("curated_ferment_tepache", "fermentation", "Tepache",
     "Sweet, tangy, and lightly spiced with cinnamon.",
     "A Mexican wild-ferment built on pineapple's own rind, which carries an unusually heavy "
     "wild-yeast load compared to most other fruit skins.",
     6.0, 1.0, "cup", 22,
     [
         (*PINEAPPLE, 600, "g", "rind and core, roughly chopped", "Wild-fermented", None),
         (*MOLASSES, 100, "g", None, None, None),
         (*WATER, 2000, "ml", None, None, None),
     ], []),
    ("curated_ferment_shrub", "fermentation", "Shrub (Colonial Drinking Vinegar)",
     "Sharply tart, sweet-and-sour, and refreshing over ice.",
     "An acetic-acid-forward tonic (fruit, vinegar, and sugar macerated together) that "
     "predates refrigeration -- the acetic acid itself supports stomach-acid production, "
     "useful for the nutrient-absorption issues common in hypothyroidism.",
     8.0, 0.25, "cup", 23,
     [
         (*BLACKBERRY, 250, "g", "crushed", "Macerated", None),
         (*CIDER_VINEGAR, 250, "ml", None, None, None),
         (*SUGAR, 200, "g", None, None, None),
     ], []),
    ("curated_ferment_switchel", "fermentation", "Switchel",
     "Tangy, gingery, and lightly sweet.",
     "A colonial-era \"haymaker's punch\": ginger, vinegar, and a mineral-rich sweetener in "
     "water -- traditionally a quick mixed tonic rather than a long culture, closer to a "
     "shrub than a deep ferment, though it develops more character the longer it sits.",
     6.0, 1.0, "cup", 24,
     [
         (*GINGER, 30, "g", "grated, unpeeled", None, None),
         (*CIDER_VINEGAR, 60, "ml", None, None, None),
         (*MOLASSES, 60, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_jun_tea", "fermentation", "Jun Tea",
     "Lighter and more floral than kombucha, with a honeyed finish.",
     "Jun's own culture ferments green tea and raw honey specifically (not black tea and "
     "cane sugar the way kombucha does) -- a genuinely different culture, not a kombucha "
     "variant.",
     8.0, 1.0, "cup", 25,
     [
         (*GREEN_TEA_BREWED, 2000, "ml", None, "Fermented", None),
         (*HONEY, 200, "g", None, None, None),
     ], []),
    ("curated_ferment_garlic_honey_tonic", "fermentation", "Fermented Garlic Honey Tonic",
     "Pungent, sweet-hot, and syrupy.",
     "Raw honey's own low water content is naturally antimicrobial, which is why this "
     "ferments slowly and unpredictably compared to a water-based drink -- garlic's own "
     "moisture is what actually feeds the process, small bubbles over several weeks rather "
     "than the rapid fizz of a wild-fermented fruit tonic.",
     16.0, 1.0, "tbsp", 26,
     [
         (*GARLIC, 150, "g", "peeled, whole cloves", "Fermented", None),
         (*HONEY, 350, "g", None, None, None),
     ], []),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for recipe_id, builder_type, name, flavor_profile, health_benefit, servings, serving_size_amount, \
            serving_size_unit, sort_order, ingredients, strain_ids in RECIPES:
        cur.execute(
            """
            INSERT INTO curated_recipes
                (id, builder_type, name, flavor_profile, health_benefit, servings,
                 serving_size_amount, serving_size_unit, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                builder_type = excluded.builder_type,
                name = excluded.name,
                flavor_profile = excluded.flavor_profile,
                health_benefit = excluded.health_benefit,
                servings = excluded.servings,
                serving_size_amount = excluded.serving_size_amount,
                serving_size_unit = excluded.serving_size_unit,
                sort_order = excluded.sort_order
            """,
            (recipe_id, builder_type, name, flavor_profile, health_benefit, servings,
             serving_size_amount, serving_size_unit, sort_order),
        )

        cur.execute("DELETE FROM curated_recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
        for i, (category, base_name, quantity, unit, cut_prep, cooking_method, prep_note) in enumerate(ingredients):
            cur.execute(
                """
                INSERT INTO curated_recipe_ingredients
                    (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, i),
            )

        cur.execute("DELETE FROM curated_recipe_strains WHERE recipe_id = ?", (recipe_id,))
        for strain_id in strain_ids:
            cur.execute(
                "INSERT INTO curated_recipe_strains (recipe_id, strain_id) VALUES (?, ?)",
                (recipe_id, strain_id),
            )

    conn.commit()

    total_ingredients = sum(len(r[9]) for r in RECIPES)
    total_strain_links = sum(len(r[10]) for r in RECIPES)
    print(f"Upserted {len(RECIPES)} curated_recipes rows, {total_ingredients} curated_recipe_ingredients rows, "
          f"{total_strain_links} curated_recipe_strains rows.")

    conn.close()


if __name__ == "__main__":
    main()
