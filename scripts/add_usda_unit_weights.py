"""Adds sourced per-item weights so a grocery list can say how many to buy.

2026-09-01, from a direct report: "People don't know what 240 g of avocado
is... Is it 1 avocado, 1 large avocado, or?" The list could only answer that
for six foods, because food_unit_weights covered six.

Every weight here comes from USDA FoodData Central's SR Legacy release, whose
food_portion table gives a portion description and its gram weight. The
candidates were pulled by scripts/extract_usda_unit_weights.py, joining this
app's reference database to USDA by exact food description, and then chosen by
hand rather than by whichever regex matched first. That review mattered: the
only tomato portion in the whole release is a 2 g piece of SUN-DRIED tomato,
and the only zucchini one is a BABY zucchini at 11 g. Taking those
automatically would have told someone to buy 120 tomatoes.

Three rules shaped every pick:

  1. The raw row wins where there is one, since that is the state a thing is
     bought in.
  2. Medium wins over small and large, since a medium is what "one of them"
     means to anyone shopping.
  3. USDA's own word becomes the unit label. Broccoli is a "stalk" and not a
     "head" here, because that is what the source says and a citation should
     name the thing it is citing.

These weights are EDIBLE portion, matching the food rows the nutrients come
from. A recipe asking for 240 g of avocado means 240 g of flesh, so dividing
by the flesh weight of one fruit is the correct sum.

Idempotent. Run: py scripts/add_usda_unit_weights.py
"""

import os
import sqlite3

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'data', 'foods_reference.db')

SR_LEGACY = 'USDA FoodData Central, SR Legacy'

# base_name, unit singular, unit plural, grams, USDA food description, USDA portion label
PICKS = [
    # --- Fruit ---
    ('Cantaloupe Melon', 'melon', 'melons', 552.0, 'Melons, cantaloupe, raw', 'melon, medium (about 5" dia)'),
    ('Clementine', 'clementine', 'clementines', 74.0, 'Clementines, raw', 'fruit'),
    ('Fig', 'fig', 'figs', 50.0, 'Figs, raw', 'medium (2-1/4" dia)'),
    ('Lemon', 'lemon', 'lemons', 58.0, 'Lemons, raw, without peel', 'fruit (2-1/8" dia)'),
    ('Lime', 'lime', 'limes', 67.0, 'Limes, raw', 'fruit (2" dia)'),
    ('Mango', 'mango', 'mangos', 336.0, 'Mangos, raw', 'fruit without refuse'),
    ('Nectarine', 'nectarine', 'nectarines', 142.0, 'Nectarines, raw', 'medium (2-1/2" dia)'),
    # Small rather than medium only because SR Legacy has no medium papaya, and
    # small is the safer of the two it does have: its large is 781 g, and
    # rounding someone UP to an extra papaya is kinder than short.
    ('Papaya', 'papaya', 'papayas', 157.0, 'Papayas, raw', 'fruit, small'),
    ('Pineapple', 'pineapple', 'pineapples', 905.0, 'Pineapple, raw, all varieties', 'fruit'),
    ('Plum', 'plum', 'plums', 66.0, 'Plums, raw', 'fruit (2-1/8" dia)'),

    # --- Veg ---
    # Sold by the bunch, counted in spears, which is how a recipe asks for it.
    ('Asparagus', 'spear', 'spears', 16.0, 'Asparagus, raw', 'spear, medium (5-1/4" to 7" long)'),
    ('Broccoli', 'stalk', 'stalks', 151.0, 'Broccoli, raw', 'stalk'),
    ('Cabbage', 'head', 'heads', 908.0, 'Cabbage, raw', 'head, medium (about 5-3/4" dia)'),
    ('Carrot', 'carrot', 'carrots', 61.0, 'Carrots, raw', 'medium'),
    ('Cauliflower', 'head', 'heads', 588.0, 'Cauliflower, raw', 'head medium (5-6" dia.)'),
    ('Celery', 'stalk', 'stalks', 40.0, 'Celery, raw', 'stalk, medium (7-1/2" - 8" long)'),
    ('Fennel Bulb', 'bulb', 'bulbs', 234.0, 'Fennel, bulb, raw', 'bulb'),
    # Counted in cloves rather than bulbs: a recipe asks for cloves, and "about
    # 3 cloves" is the number someone needs while the bulb is what they buy.
    ('Garlic', 'clove', 'cloves', 3.0, 'Garlic, raw', 'clove'),
    ('Hearts of palm', 'piece', 'pieces', 33.0, 'Hearts of palm, canned', 'piece'),
    ('Lettuce, green leaf', 'head', 'heads', 360.0, 'Lettuce, green leaf, raw', 'head'),
    ('Onion', 'onion', 'onions', 110.0, 'Onions, raw', 'medium (2-1/2" dia)'),
    # Flesh and skin, since that is what gets bought and weighed in a shop.
    ('Potato', 'potato', 'potatoes', 173.0, 'Potatoes, baked, flesh and skin, without salt', 'potato medium (2-1/4" to 3-1/4" dia)'),
    ('Radish', 'radish', 'radishes', 4.5, 'Radishes, raw', 'medium (3/4" to 1" dia)'),
    ('Red Bell Pepper', 'pepper', 'peppers', 119.0, 'Peppers, sweet, red, raw', 'medium (approx 2-3/4" long, 2-1/2 dia.)'),
    ('Spinach', 'bunch', 'bunches', 340.0, 'Spinach, raw', 'bunch'),
    ('Sweet potato', 'sweet potato', 'sweet potatoes', 114.0, 'Sweet potato, cooked, baked in skin, flesh, without salt', 'medium (2" dia, 5" long, raw)'),
    ('Swiss Chard', 'leaf', 'leaves', 48.0, 'Chard, swiss, raw', 'leaf'),
    ('Turnip', 'turnip', 'turnips', 122.0, 'Turnips, raw', 'medium'),
    # Large only, because SR Legacy carries no medium yellow pepper.
    ('Yellow Bell Pepper', 'pepper', 'peppers', 186.0, 'Peppers, sweet, yellow, raw', 'pepper, large (3-3/4" long, 3" dia)'),
]

# Reviewed and deliberately left without a weight, so the reasoning survives
# rather than looking like an oversight:
#   Arugula      only a 2 g leaf, and "about 75 leaves" helps nobody
#   Tomato       the only portions in the release are SUN-DRIED pieces
#   Squash, zucchini   the only portions are BABY zucchini
#   Tofu         the only portions are fried and dried-frozen pieces
REVIEWED_NO_WEIGHT = ['Arugula', 'Tomato', 'Squash, zucchini', 'Tofu']


def main():
    conn = sqlite3.connect(os.path.abspath(DB))
    cur = conn.cursor()

    added = 0
    updated_labels = 0
    for base_name, unit, plural, grams, usda_food, usda_portion in PICKS:
        citation = (
            f"{SR_LEGACY}: \"{usda_food}\", portion \"{usda_portion}\" = {grams:g} g. "
            "Edible portion, matching the food row this app reads nutrients from."
        )
        existing = cur.execute(
            'SELECT id FROM food_unit_weights WHERE base_name = ?', (base_name,)
        ).fetchone()
        if existing:
            cur.execute(
                'UPDATE food_unit_weights SET unit_label = ?, grams_per_unit = ?, citation = ? WHERE id = ?',
                (usda_portion, grams, citation, existing[0]),
            )
        else:
            cur.execute(
                'INSERT INTO food_unit_weights (base_name, unit_label, grams_per_unit, citation) VALUES (?, ?, ?, ?)',
                (base_name, usda_portion, grams, citation),
            )
            added += 1

        # The label shown on a list uses USDA's own word, so what is displayed
        # and what is cited never drift apart.
        cur.execute(
            'UPDATE food_purchase_forms SET unit_label = ?, unit_label_plural = ? WHERE base_name = ?',
            (unit, plural, base_name),
        )
        updated_labels += cur.rowcount

    conn.commit()

    countable = cur.execute(
        """SELECT COUNT(*) FROM food_purchase_forms pf
           JOIN food_unit_weights fuw ON fuw.base_name = pf.base_name"""
    ).fetchone()[0]
    total = cur.execute('SELECT COUNT(*) FROM food_purchase_forms').fetchone()[0]
    conn.close()

    print(f'weights added: {added}')
    print(f'purchase-form labels aligned to the source wording: {updated_labels}')
    print(f'ingredients that can now show a count: {countable} of {total}')
    print(f'reviewed and deliberately left without one: {", ".join(REVIEWED_NO_WEIGHT)}')


if __name__ == '__main__':
    main()
