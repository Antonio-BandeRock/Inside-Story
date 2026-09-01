"""Adds food_purchase_forms to the live reference database.

2026-09-01. The grocery list reports what the recipes consume, which is a
gram figure for most ingredients, because that is how curated recipe
amounts are written (1,714 of 2,320 ingredient rows are in grams). "340 g
of broccoli" is not how anyone shops. This table says how a store actually
sells each thing, so the list can lead with a shoppable form.

Deliberately NOT invented: no gram-per-unit weight is written here unless
it is genuinely established and citable. The existing food_unit_weights
table already carries 17 such weights, each with its own citation, and the
grocery list reads that table for conversions rather than a second copy
here. What this table adds is the FORM, which is a fact about how groceries
are sold rather than a nutrition claim, and it is the part that makes a
list shoppable on its own: "340 g, sold by the head" is already far more
usable than "340 g", and needs no number nobody verified.

Three forms only, plus a noun:
  count   the amount is best expressed as a number of discrete units
          (2 avocados, 1 head, 3 ears)
  weight  buy it by weight, which is what the gram figure already says
  volume  buy it by liquid volume

sold_as is always set and is the short phrase the list shows.

Idempotent: safe to re-run. Follows the same conditional-create pattern as
scripts/add_interaction_rule_mechanisms.py.
"""

import sqlite3
import os

DB = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data', 'foods_reference.db')

# (form, unit singular, unit plural, sold_as)
COUNT = lambda noun, plural, sold: ('count', noun, plural, sold)
WEIGHT = lambda sold: ('weight', '', '', sold)
VOLUME = lambda sold: ('volume', '', '', sold)

# A produce item sold loose and counted, where the noun IS the food itself.
def SELF(sold='loose, by the piece'):
    return ('count', '', '', sold)

FORMS = {}

def put(category, names, spec):
    for name in names:
        FORMS[(category, name)] = spec

# --- Veg --------------------------------------------------------------------
put('Veg', ['Broccoli', 'Cauliflower', 'Cabbage', 'Lettuce, green leaf', 'Bok choy'],
    COUNT('head', 'heads', 'by the head'))
put('Veg', ['Arugula', 'Asparagus', 'Chicory greens', 'Collards', 'Kale', 'Spinach',
            'Swiss Chard', 'Coriander (cilantro)', 'Coriander (cilantro) leaves', 'Radish', 'Beets', 'Beetroot'],
    COUNT('bunch', 'bunches', 'by the bunch, or bagged'))
put('Veg', ['Garlic'], COUNT('bulb', 'bulbs', 'by the bulb (about 10 cloves)'))
put('Veg', ['Corn, sweet, yellow'], COUNT('ear', 'ears', 'by the ear'))
put('Veg', ['Celery'], COUNT('head', 'heads', 'by the head, sometimes called a bunch'))
put('Veg', ['Fennel Bulb'], COUNT('bulb', 'bulbs', 'by the bulb'))
put('Veg', ['Leek'], COUNT('leek', 'leeks', 'loose or in twos'))
put('Veg', ['Onion', 'Potato', 'Sweet potato', 'Cucumber', 'Eggplant', 'Tomato', 'Turnip',
            'Kohlrabi', 'Parsnip', 'Carrot', 'Red Bell Pepper', 'Yellow Bell Pepper',
            'Squash, winter, butternut', 'Squash, zucchini', 'Zucchini, green skin, fresh, unpeeled',
            'Artichoke'],
    SELF())
put('Veg', ['Brussels sprout', 'Okra', 'Snap Beans (Green Beans)', 'Fresh Snow Pea',
            'Pea, green, fresh', 'Edamame', 'Mushroom, common, fresh',
            'Mushroom, portabella (portobello)', 'Chicory roots'],
    WEIGHT('by weight, loose or in a punnet'))
put('Veg', ['Ginger, peeled, fresh'], WEIGHT('by weight, as a whole root'))
put('Veg', ['Hearts of palm'], COUNT('jar', 'jars', 'in a jar or can'))

# --- Fruit ------------------------------------------------------------------
put('Fruit', ['Apple', 'Apricot', 'Avocado', 'Banana', 'Clementine', 'Fig', 'Grapefruit',
              'Kiwi fruit', 'Lemon', 'Lime', 'Mango', 'Nectarine', 'Orange', 'Papaya',
              'Peach', 'Pear', 'Plum', 'Pineapple'],
    SELF())
put('Fruit', ['Cantaloupe Melon', 'Watermelon'], COUNT('melon', 'melons', 'whole, or cut by weight'))
put('Fruit', ['Blackberry', 'Blueberry', 'Raspberry', 'Strawberry', 'Grape', 'Sour Cherry',
              'Cranberry', 'Elderberry'],
    WEIGHT('by weight, in a punnet or bag'))
put('Fruit', ['Date', 'Raisins, dark, seedless'], WEIGHT('by weight, in a bag or tub'))

# --- Herbs, spices and vinegars ---------------------------------------------
put('Herbs', ['Basil', 'Oregano', 'Rosemary', 'Fresh Thyme', 'Fresh Dill Weed', 'Spearmint',
              'Spices, spearmint, fresh', 'Parsley Spices', 'Ginger root'],
    COUNT('bunch', 'bunches', 'fresh, by the bunch or packet'))
put('Herbs', ['Cinnamon, dried, ground', 'Spices, cinnamon, ground', 'Cumin (cummin) seed, dried, ground',
              'Curry powder', 'Paprika', 'Pepper, black, ground', 'Turmeric, dried, ground',
              'Spices, cardamom, ground', 'Spices, cloves, ground', 'Spices, nutmeg, ground',
              'Spices, mustard seed, yellow', 'Common salt/table salt'],
    COUNT('jar', 'jars', 'dried, in a jar (one lasts many recipes)'))
put('Herbs', ['Balsamic vinegar', 'Vinegar, balsamic', 'Vinegar, cider', 'Vinegar, rice vinegar',
              'Vanilla extract'],
    VOLUME('in a bottle (one lasts many recipes)'))
put('Herbs', ['Mustard, prepared, yellow', 'Dressing, mayonnaise, whole egg type'],
    COUNT('jar', 'jars', 'in a jar or squeeze bottle'))
put('Herbs', ['Chicken bouillon/stock/soup (stock cubes, powder)'],
    COUNT('pack', 'packs', 'as cubes or powder, in a pack'))

# --- Meat and fish ----------------------------------------------------------
put('Meat', ['Beef Top Sirloin (Raw)', 'Chicken Breast (without skin)',
             'Chicken, broiler, breast, skinless, boneless, meat',
             'Chicken, broiler, thigh, meat without skin', 'Ground Turkey (Raw)',
             'Lamb Chop (Raw)', 'Lamb Fillet (Raw)', 'Pork Chop (Raw)',
             'Pork Fillet / Tenderloin (Raw)', 'Pork Loin (Raw)', 'Turkey Breast (Raw)',
             'Turkey Thigh (Raw)'],
    WEIGHT('by weight, at the counter or pre-packed'))
put('Meat', ['Cod Fish', 'Halibut Fish (Raw)', 'Mackerel Fish', 'Salmon Fillet (Raw)',
             'Sole fillet', 'Trout Fish', 'Tuna Fish', 'Sardine Fish'],
    WEIGHT('by weight, as fillets'))
put('Meat', ['Crab Crustaceans', 'Mussel Mollusks', 'Scallop Mollusks', 'Shrimp Crustaceans'],
    WEIGHT('by weight, fresh or frozen'))

# --- Grains, flours and dry goods -------------------------------------------
put('Grain', ['Buckwheat', 'Bulgur', 'Cornmeal, whole-grain, yellow', 'Couscous (durum wheat)',
              'Grains, amaranth', 'Grains, rice, brown, long-grain, dry', 'Grains, rice, wild, dry',
              'Hominy', 'Millet', 'Millet, puffed', 'Oats', 'Quinoa', 'Quinoa, uncooked',
              'Rice, long grain, paddy rice, well-milled, raw', 'Sorghum grain', 'Spelt Grains',
              'Tapioca, pearl, dry'],
    WEIGHT('dry, by weight, in a bag or box'))
put('Grain', ['Meat substitute containing gluten (seitan)'],
    COUNT('pack', 'packs', 'in a pack, chilled'))

# --- Nuts, seeds and plant milks --------------------------------------------
put('NutSeed', ['Almonds', 'Brazil nut', 'Cashew nut', 'Chia seeds', 'Flax seeds', 'Flaxseed Seeds',
                'Hemp seeds', 'Pine nut', 'Pistachio nut', 'Pumpkin seed', 'Sesame seed', 'Walnut',
                'Chickpea flour'],
    WEIGHT('by weight, in a bag'))
put('NutSeed', ['Nuts, almond butter, plain'], COUNT('jar', 'jars', 'in a jar'))
put('NutSeed', ['Almond drink unsweetened'], VOLUME('in a carton'))
put('NutSeed', ['Coconut milk'], VOLUME('in a can or carton'))

# --- Legumes ----------------------------------------------------------------
put('Legume', ['Black Beans', 'Chickpeas (garbanzo beans, bengal gram)', 'Kidney Beans',
               'Lentils', 'Lima beans, large', 'Pinto Beans', 'White Beans'],
    COUNT('can', 'cans', 'in a can, or dried by weight'))
put('Legume', ['Tofu', 'MORI-NU, Tofu, silken, firm', 'Tempeh'],
    COUNT('block', 'blocks', 'by the block, chilled'))
put('Legume', ['Soybeans, soy milk, regular'], VOLUME('in a carton'))
put('Legume', ['Soy sauce made from soy and wheat (shoyu)'], VOLUME('in a bottle'))

# --- Dairy and eggs ---------------------------------------------------------
put('Dairy', ['Chicken Egg (Raw)'], COUNT('egg', 'eggs', 'by the half dozen or dozen'))
put('Dairy', ['Milk, whole, 3.25% milkfat, with added vitamin D', 'Buttermilk'],
    VOLUME('in a carton or bottle'))
put('Dairy', ['Cheddar', 'Feta', 'Parmesan'], WEIGHT('by weight, as a block or piece'))
put('Dairy', ['Cottage Cheese', 'Yogurt, Greek, plain, lowfat'], COUNT('tub', 'tubs', 'in a tub'))

# --- Drinks -----------------------------------------------------------------
put('Bev', ['Coconut water'], VOLUME('in a carton or bottle'))
put('Bev', ['Lemon Juice', 'Limes, juice, fresh'], VOLUME('bottled, or squeezed from fresh fruit'))
put('Bev', ['Lime'], SELF())
put('Bev', ['Pomegranate'], SELF())
put('Bev', ['Tea, hibiscus'], COUNT('pack', 'packs', 'loose or in bags, in a pack'))

# --- Sweeteners -------------------------------------------------------------
put('Sweets', ['Maple Syrup (100% Pure)', 'Maple syrup', 'Blackstrap Molasses (Pure)'],
    VOLUME('in a bottle'))
put('Sweets', ['Standard Honey (Blossom Honey)', 'Honeydew honey (Forest Honey)'],
    COUNT('jar', 'jars', 'in a jar'))
put('Sweets', ['Sugar (Cane / Granulated)'], WEIGHT('by weight, in a bag'))

# --- Pantry staples ---------------------------------------------------------
put('PantryStaples', ['Whole-Grain Wheat Flour', 'Wheat flour, white, tortilla mix, enriched'],
    WEIGHT('by weight, in a bag'))
put('PantryStaples', ["Baker's yeast", 'Baking powder'],
    COUNT('pack', 'packs', 'in a small pack or tin'))
put('PantryStaples', ['Vegetable stock'], VOLUME('in a carton, or as cubes'))

# --- The rest ---------------------------------------------------------------
put('Mushroom', ['Mushrooms, king oyster mushrooms'], WEIGHT('by weight, loose or in a punnet'))
put('Mushroom', ['Yeast flakes/nutritional yeast'], COUNT('tub', 'tubs', 'as flakes, in a tub'))
put('Fats', ['Olive Oil (Extra Virgin)'], VOLUME('in a bottle (one lasts many recipes)'))
put('Fats', ['Butter, plain, salted'], WEIGHT('by weight, in a block or tub'))
put('Brewing', ['Black Tea (Brewed)', 'Green Tea (Brewed)'],
    COUNT('pack', 'packs', 'as leaves or bags, in a pack'))
put('Baked', ['Bröd fullkorn vete råg fibrer ca 6%'], COUNT('loaf', 'loaves', 'by the loaf'))
put('Baked', ['Tortilla, wraps/burrito, hvetemel'], COUNT('pack', 'packs', 'in a pack'))
put('SaucesCondiments', ['Tahini'], COUNT('jar', 'jars', 'in a jar'))


def main():
    conn = sqlite3.connect(os.path.abspath(DB))
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS food_purchase_forms (
            category TEXT NOT NULL,
            base_name TEXT NOT NULL,
            form TEXT NOT NULL,
            unit_label TEXT NOT NULL DEFAULT '',
            unit_label_plural TEXT NOT NULL DEFAULT '',
            sold_as TEXT NOT NULL,
            grams_per_unit REAL,
            citation TEXT,
            PRIMARY KEY (category, base_name)
        )
    """)

    # Every ingredient the 300 curated recipes actually use, so a shopping
    # list built from any of them can speak in shop terms. Water, tap is
    # deliberately absent: it never reaches a list at all.
    cur.execute("SELECT DISTINCT category, base_name FROM curated_recipe_ingredients")
    used = {(row[0], row[1]) for row in cur.fetchall()}
    used.discard(('Bev', 'Water, tap'))

    missing = sorted(used - set(FORMS.keys()))
    extra = sorted(set(FORMS.keys()) - used)

    written = 0
    for (category, base_name), (form, unit, plural, sold_as) in sorted(FORMS.items()):
        if (category, base_name) not in used:
            continue
        cur.execute(
            """INSERT INTO food_purchase_forms
                 (category, base_name, form, unit_label, unit_label_plural, sold_as, grams_per_unit, citation)
               VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
               ON CONFLICT(category, base_name) DO UPDATE SET
                 form=excluded.form, unit_label=excluded.unit_label,
                 unit_label_plural=excluded.unit_label_plural, sold_as=excluded.sold_as""",
            (category, base_name, form, unit, plural, sold_as),
        )
        written += 1

    conn.commit()
    total = cur.execute("SELECT COUNT(*) FROM food_purchase_forms").fetchone()[0]
    conn.close()

    print(f"ingredients used by curated recipes (excluding tap water): {len(used)}")
    print(f"rows written: {written}")
    print(f"rows in table: {total}")
    if missing:
        print(f"\nNOT COVERED ({len(missing)}):")
        for category, base_name in missing:
            print(f"  {category} | {base_name}")
    if extra:
        print(f"\nDefined but unused by any recipe ({len(extra)}):")
        for category, base_name in extra:
            print(f"  {category} | {base_name}")


if __name__ == '__main__':
    main()


def add_egg_unit_weight():
    """The curated recipes call it 'Chicken Egg (Raw)'; food_unit_weights was
    written with 'Chicken egg', 'Egg, whole' and 'Egg, chicken'. Same food,
    same 50 g, same citation, one spelling short. Added rather than left as a
    near-miss, because an egg is the most countable thing on any list and
    "about 3 eggs" is exactly what this feature is for.

    Deliberately a new row carrying the existing citation verbatim rather than
    a new claim: nothing here is being asserted that the table did not already
    assert about the same food.
    """
    conn = sqlite3.connect(os.path.abspath(DB))
    cur = conn.cursor()
    existing = cur.execute(
        "SELECT citation FROM food_unit_weights WHERE base_name = 'Chicken egg'"
    ).fetchone()
    if existing is None:
        print("skipped: no 'Chicken egg' row to copy a citation from")
        conn.close()
        return
    already = cur.execute(
        "SELECT 1 FROM food_unit_weights WHERE base_name = 'Chicken Egg (Raw)'"
    ).fetchone()
    if already:
        print("egg unit weight already present")
    else:
        cur.execute(
            "INSERT INTO food_unit_weights (base_name, unit_label, grams_per_unit, citation) VALUES (?, ?, ?, ?)",
            ('Chicken Egg (Raw)', 'large egg', 50.0, existing[0]),
        )
        conn.commit()
        print("added 'Chicken Egg (Raw)' unit weight, 50 g")
    conn.close()


add_egg_unit_weight()
