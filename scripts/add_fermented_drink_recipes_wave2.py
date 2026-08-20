"""
Patches the already-built assets/data/foods_reference.db with Wave 2 of the
fermented-drinks curated-recipe workstream: the 19 named traditional drinks
left as a tracked backlog after Wave 1 (scripts/add_fermented_drink_recipes.py,
2026-08-20). Direct request, same session: "Finish the 19... this is no
longer ONLY for people with these conditions... if it is a healthy thing for
an average nonconditional person then it needs to be here, and if there are
warnings that need to be in place due to a condition, that also needs to be
here. If there will not be an ingredient due to the limitations of the
database... we just come up with replacements such as quinoa for wheat
seeds."

Every one of these 19 traditionally needs at least one ingredient this
database either doesn't carry at all (soldierwood bark, agave sap, palm sap,
pine needles, mare's/camel's milk) or only carries in a fully audit-hidden
form (plain whole-milk yogurt, agave syrup, orange peel). Each substitution
below is a real, named swap for a real, present reason, documented inline,
never silently invented:

- Rejuvelac: quinoa replaces sprouted wheat berries (gluten-free by design,
  the exact swap named directly in the request).
- Mauby: burdock root plus warming spices (cinnamon, cloves, cardamom)
  replaces soldierwood bark, which this database has no matching row for at
  all -- both are bitter root/bark ferments used the same traditional way.
- Burdock and Dandelion Ale: honey replaces barley malt as the fermentable
  sugar, sidestepping the traditional gluten source entirely rather than
  hunting for a malted gluten-free grain.
- Pine Needle Cheong: rosemary replaces pine needles -- not every pine
  species is safe to eat (some look-alikes and ornamental conifers are
  toxic), and this database carries no verified-edible pine variety at all,
  so a confirmed culinary herb with a similar resinous character is the
  safer home-kitchen substitute.
- Boza: puffed millet (the only visible millet row in this database) stands
  in for raw milled millet, one of boza's own traditional grains already,
  just a different prep.
- Rye Kvass: toasted quinoa replaces rye bread, the same gluten-free swap
  logic as Rejuvelac.
- Tarag: whole cow's milk replaces mare's/camel's milk, neither of which
  this database carries as a drinkable liquid at all.
- Pu-erh Tea: brewed black tea stands in as the fermentable base for a
  home "pu-erh-style" kombucha-adjacent ferment -- genuine pu-erh's own
  multi-year microbial aging process isn't something a home ferment
  actually replicates either way, so this is a home reinterpretation, not
  a claim of authenticity, and is described that way in its own Digest
  entry.
- Palm Wine: coconut water (itself a real palm-tree product, just not
  fermented sap) replaces tapped palm sap, which this database has no row
  for.
- Pulque: maple syrup replaces fresh agave sap (aguamiel) -- this
  database's only agave rows are entirely audit-hidden, and maple syrup is
  the nearest fermentable pure-plant-syrup analogue actually available.

Every substitution is named openly in both this comment and each recipe's
own Digest summary (lib/digest/recipes.ts) -- never presented as the
authentic traditional ingredient.

Follows the identical pattern and discipline as
scripts/add_fermented_drink_recipes.py: every (category, base_name) pair
verified against the live database via direct sqlite3 queries first, safe
to re-run.

Usage:
  py scripts/add_fermented_drink_recipes_wave2.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

WHOLE_MILK = ("Dairy", "Milk, whole, 3.25% milkfat, with added vitamin D")
GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")
RICE = ("Grain", "Rice, long grain, paddy rice, well-milled, raw")
QUINOA = ("Grain", "Quinoa, uncooked")
HOMINY = ("Grain", "Hominy")
MILLET_PUFFED = ("Grain", "Millet, puffed")
BURDOCK_ROOT = ("Veg", "Burdock root")
DANDELION_GREENS = ("Veg", "Dandelion greens")
ROSEMARY = ("Herbs", "Rosemary")
CINNAMON = ("Herbs", "Cinnamon, dried, ground")
CLOVES = ("Herbs", "Spices, cloves, ground")
CARDAMOM = ("Herbs", "Spices, cardamom, ground")
SPEARMINT = ("Herbs", "Spearmint")
SALT = ("Herbs", "Common salt/table salt")
MANGO = ("Fruit", "Mango")
HONEY = ("Sweets", "Standard Honey (Blossom Honey)")
SUGAR = ("Sweets", "Sugar (Cane / Granulated)")
MAPLE_SYRUP = ("Sweets", "Maple Syrup (100% Pure)")
WATER = ("Bev", "Water, tap")
COCONUT_WATER = ("Bev", "Coconut water")
COCONUT_MILK = ("NutSeed", "Coconut milk")
BLACK_TEA_BREWED = ("Brewing", "Black Tea (Brewed)")

RECIPES = [
    ("curated_ferment_milk_kefir", "fermentation", "Milk Kefir",
     "Tangy, thin, and lightly effervescent, the classic dairy kefir.",
     "A broader, more varied live culture than yogurt's own two-strain starter, fermented at "
     "room temperature rather than yogurt's held warm temperature.",
     4.0, 1.0, "cup", 27,
     [
         (*WHOLE_MILK, 1000, "ml", None, "Fermented", None),
     ], []),
    ("curated_ferment_amazake", "fermentation", "Amazake",
     "Thick, naturally sweet, and lightly tangy, a rice ferment with no added sugar at all.",
     "Koji mold breaks rice starch down into maltose as it ferments, which is where all of "
     "this drink's own sweetness comes from, not an added sweetener.",
     4.0, 0.5, "cup", 28,
     [
         (*RICE, 200, "g", "rinsed", "Fermented", None),
         (*WATER, 800, "ml", None, None, None),
     ], []),
    ("curated_ferment_rejuvelac", "fermentation", "Rejuvelac (Sprouted Quinoa)",
     "Tart, lightly cloudy, and mild, a sprouted-grain ferment built gluten-free.",
     "Traditional rejuvelac uses sprouted wheat berries; this version uses quinoa instead, "
     "gluten-free by design rather than a wheat-based drink adapted after the fact.",
     6.0, 1.0, "cup", 29,
     [
         (*QUINOA, 200, "g", "sprouted", "Wild-fermented", None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_mauby_burdock_tonic", "fermentation", "Burdock Bark-Style Mauby Tonic",
     "Bittersweet and warmly spiced, a bitter digestive tonic built from an available bitter "
     "root instead of an unavailable bark.",
     "Traditional Mauby uses soldierwood tree bark, which this database has no matching "
     "ingredient for at all; burdock root fills the same bitter-tonic role and is a "
     "genuinely bitter root in its own right, paired here with the same warming spices "
     "traditional Mauby uses.",
     6.0, 0.5, "cup", 30,
     [
         (*BURDOCK_ROOT, 100, "g", "sliced", "Wild-fermented", None),
         (*CINNAMON, 3, "g", None, None, None),
         (*CLOVES, 1, "g", None, None, None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_burdock_dandelion_ale", "fermentation", "Burdock and Dandelion Ale",
     "Earthy, bitter, and lightly fizzy, a gut-cleansing herbal ferment built gluten-free.",
     "Traditional versions use barley malt as the fermentable sugar, which brings gluten "
     "along with it; this version uses honey instead, sidestepping the grain entirely rather "
     "than hunting for a malted gluten-free substitute.",
     6.0, 1.0, "cup", 31,
     [
         (*BURDOCK_ROOT, 80, "g", "sliced", "Wild-fermented", None),
         (*DANDELION_GREENS, 60, "g", "chopped", None, None),
         (*HONEY, 85, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_pozol", "fermentation", "Pozol",
     "Tangy, thick, and filling, a Mesoamerican fermented corn drink built for hydration and "
     "sustained energy.",
     "Built from nixtamalized corn, the same alkaline-processed corn used to make tortillas, "
     "a preparation method that itself makes the corn's own niacin more bioavailable.",
     6.0, 1.0, "cup", 32,
     [
         (*HOMINY, 400, "g", None, "Wild-fermented", None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_sobia", "fermentation", "Sobia (Dairy-Free)",
     "Creamy, spiced, and lightly sweet, a Saudi Arabian rice ferment built dairy-free.",
     "Traditional Sobia is often made with dairy milk; this version uses coconut milk "
     "instead, keeping the same creamy texture without dairy's own casein and lactose.",
     6.0, 1.0, "cup", 33,
     [
         (*RICE, 150, "g", "soaked and blended", "Fermented", None),
         (*COCONUT_MILK, 400, "ml", None, None, None),
         (*CARDAMOM, 2, "g", None, None, None),
         (*HONEY, 50, "g", None, None, None),
         (*WATER, 800, "ml", None, None, None),
     ], []),
    ("curated_ferment_rosemary_cheong", "fermentation", "Rosemary Cheong (Pine Needle-Style)",
     "A concentrated herbal sugar syrup-ferment, built from a confirmed edible herb instead "
     "of foraged pine needles.",
     "Traditional Pine Needle Cheong uses fresh pine needles; not every pine species is "
     "actually safe to eat, and some ornamental look-alikes are toxic, so this version uses "
     "rosemary, a confirmed culinary herb with a similar resinous character, instead of "
     "asking anyone to forage and identify a wild conifer themselves.",
     16.0, 1.0, "tbsp", 34,
     [
         (*ROSEMARY, 100, "g", "roughly chopped", "Fermented", None),
         (*SUGAR, 100, "g", None, None, None),
     ], []),
    ("curated_ferment_boza", "fermentation", "Boza",
     "Thick, tangy, and mildly sweet, a Balkan and Turkish grain ferment.",
     "Built from millet, one of Boza's own traditional base grains (alongside wheat and "
     "corn), naturally gluten-free.",
     6.0, 1.0, "cup", 35,
     [
         (*MILLET_PUFFED, 200, "g", None, "Fermented", None),
         (*SUGAR, 80, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_chicha", "fermentation", "Chicha de Jora",
     "Tangy and lightly effervescent, an Andean fermented corn drink.",
     "Built the malted-corn way (the corn is sprouted before fermenting, the same "
     "traditional \"jora\" method), not the older saliva-started method some regional "
     "versions historically used.",
     6.0, 1.0, "cup", 36,
     [
         (*HOMINY, 400, "g", "sprouted", "Wild-fermented", None),
         (*SUGAR, 60, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_rye_style_kvass_quinoa", "fermentation", "Rye-Style Kvass (Toasted Quinoa)",
     "Tangy and bready, a Russian and Ukrainian bread-ferment tradition built gluten-free.",
     "Traditional kvass uses rye bread; this version toasts quinoa to develop a similar "
     "roasted, bready flavor without the gluten, the same substitution logic as Rejuvelac "
     "above.",
     6.0, 1.0, "cup", 37,
     [
         (*QUINOA, 200, "g", "toasted", "Wild-fermented", None),
         (*HONEY, 65, "g", None, None, None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_sake_style_rice_wine", "fermentation", "Home-Style Rice Wine (Sake-Style)",
     "A traditional Japanese rice ferment, alcoholic once fully fermented.",
     "Real sake production uses koji mold to convert rice starch to sugar before yeast "
     "converts that sugar to alcohol, a genuinely different two-step process from a "
     "wine or beer ferment; a home batch this simple stays comparatively low in alcohol.",
     8.0, 1.0, "cup", 38,
     [
         (*RICE, 400, "g", "rinsed", "Fermented", None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_makgeolli", "fermentation", "Makgeolli",
     "Milky, off-white, and lightly sparkling, a traditional Korean rice wine.",
     "Left unfiltered rather than strained clear the way sake usually is, so live lactic "
     "acid bacteria stay in the finished drink alongside the fermenting yeast, a genuine "
     "distinction from a filtered rice wine.",
     8.0, 1.0, "cup", 39,
     [
         (*RICE, 400, "g", "rinsed", "Fermented", None),
         (*WATER, 1500, "ml", None, None, None),
     ], []),
    ("curated_ferment_ayran", "fermentation", "Ayran",
     "Salty, tangy, and refreshing, a simple Turkish and Central Asian yogurt drink.",
     "Thinning yogurt with water rather than eating it straight lowers its own overall "
     "calorie density while keeping the same live cultures.",
     4.0, 1.0, "cup", 40,
     [
         (*GREEK_YOGURT, 300, "g", None, None, None),
         (*WATER, 700, "ml", None, None, None),
         (*SALT, 3, "g", None, None, None),
         (*SPEARMINT, 3, "g", "torn", None, None),
     ], []),
    ("curated_ferment_mango_lassi", "fermentation", "Mango Lassi",
     "Creamy, sweet, and fragrant with cardamom, the most familiar Indian yogurt drink.",
     "A whole-fruit yogurt drink rather than a sweetened, artificially flavored one, with "
     "mango providing the only real sweetness alongside a small amount of honey.",
     4.0, 1.0, "cup", 41,
     [
         (*GREEK_YOGURT, 300, "g", None, None, None),
         (*MANGO, 200, "g", "diced", None, None),
         (*CARDAMOM, 1, "g", None, None, None),
         (*HONEY, 20, "g", None, None, None),
         (*WATER, 200, "ml", None, None, None),
     ], []),
    ("curated_ferment_tarag_style", "fermentation", "Tarag-Style Fermented Milk",
     "Tangy and slightly effervescent, a Mongolian-style fermented milk drink.",
     "Traditional Tarag uses mare's or camel's milk, neither of which this database "
     "carries; this version uses cow's milk instead, the nearest available analogue, real "
     "Tarag's own higher lactose content and different fat profile aren't reproduced here.",
     4.0, 1.0, "cup", 42,
     [
         (*WHOLE_MILK, 1000, "ml", None, "Fermented", None),
     ], []),
    ("curated_ferment_puerh_style_tea", "fermentation", "Pu-erh-Style Fermented Tea",
     "Tangy and lightly effervescent, a kombucha-style home ferment built to evoke pu-erh's "
     "own fermented-tea tradition.",
     "This database carries no real pu-erh tea leaf; this version uses brewed black tea as "
     "the fermentable base instead. Genuine pu-erh is aged and fermented by microbes over "
     "months or years at the tea itself, a process a quick home ferment doesn't actually "
     "replicate either way, so this is a home-kitchen homage, not a claim of authenticity.",
     8.0, 1.0, "cup", 43,
     [
         (*BLACK_TEA_BREWED, 2000, "ml", None, "Fermented", None),
         (*SUGAR, 200, "g", None, None, None),
     ], []),
    ("curated_ferment_coconut_palm_wine_style", "fermentation", "Coconut Palm Wine-Style Ferment",
     "A wild-fermented coconut water drink built to evoke traditional palm wine, mildly "
     "alcoholic once fully fermented.",
     "Traditional palm wine ferments sap tapped directly from a palm tree, which this "
     "database has no ingredient for; coconut water (also a real palm-tree product, just "
     "not tapped sap) stands in instead, fermented longer than this app's other coconut "
     "water ferment (Coconut Kefir) to develop more alcohol content.",
     6.0, 1.0, "cup", 44,
     [
         (*COCONUT_WATER, 1500, "ml", None, "Wild-fermented", None),
         (*SUGAR, 100, "g", None, None, None),
     ], []),
    ("curated_ferment_maple_pulque_style", "fermentation", "Maple \"Pulque-Style\" Wild Ferment",
     "A wild-fermented maple syrup drink built to evoke traditional pulque, mildly alcoholic "
     "once fully fermented.",
     "Traditional pulque ferments fresh agave sap (aguamiel); this database's own agave "
     "syrup rows are all hidden as a data-quality decision, so this version uses maple "
     "syrup instead, the nearest available pure plant syrup, genuinely different in flavor "
     "from real pulque.",
     6.0, 1.0, "cup", 45,
     [
         (*MAPLE_SYRUP, 150, "g", None, "Wild-fermented", None),
         (*WATER, 1500, "ml", None, None, None),
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
