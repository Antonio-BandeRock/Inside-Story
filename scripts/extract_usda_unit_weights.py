"""Pulls candidate "one whole item" weights out of USDA SR Legacy.

2026-09-01. The grocery list can only say "about 2 avocados" for a food with
a weight per item to divide by, and food_unit_weights covered six foods. This
finds real, sourced candidates for the rest.

The source is USDA FoodData Central's SR Legacy release, already on disk from
the original database build (ClaudeWork/FoodData_Central_sr_legacy_food_csv).
Its food_portion table is exactly this: a portion description ("1 medium",
"1 head, medium") and the gram weight of it.

The join is by name, and it is exact rather than fuzzy. This app's reference
database keeps USDA rows under their original description ("Broccoli, raw"),
which is the same string food.csv carries, so a match is a match rather than a
guess. Anything that does not match exactly is reported and left alone.

One nuance worth stating, because it decides whether the arithmetic is right:
these portion weights are EDIBLE portion, matching the food row the nutrients
come from. A recipe asking for 240 g of avocado means 240 g of avocado flesh,
so dividing by the flesh weight of one fruit is the correct sum. Dividing by
the weight of a whole unpeeled avocado would undercount how many to buy.

This writes nothing. It prints candidates for review, so the actual weights
are chosen deliberately rather than by whatever the first regex matched.

Run: py scripts/extract_usda_unit_weights.py
"""

import csv
import os
import re
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, '..', 'assets', 'data', 'foods_reference.db')
USDA = os.environ.get('USDA_DIR')

if not USDA or not os.path.isdir(USDA):
    print('Set USDA_DIR to the folder holding food.csv and food_portion.csv')
    sys.exit(1)

# Portion descriptions that mean "one of the things you pick up in a shop".
# Deliberately a list of whole-item words rather than anything cup- or
# spoon-shaped: a cup of chopped broccoli is a measurement, not a purchase.
WHOLE_ITEM = re.compile(
    r'\b(medium|large|small|whole|head|bunch|bulb|ear|fruit|clove|root|stalk|spear|each|piece|tuber|leaf)\b',
    re.I,
)
# Things that look whole but are not a unit of purchase.
NOT_A_PURCHASE = re.compile(r'\b(cup|tbsp|tsp|teaspoon|tablespoon|slice|cubes|chopped|sliced|halves|pieces|nlea|package|container|can|jar|bottle|serving)\b', re.I)


def load_usda():
    descriptions = {}
    with open(os.path.join(USDA, 'food.csv'), newline='', encoding='utf-8-sig') as handle:
        for row in csv.DictReader(handle):
            descriptions.setdefault(row['description'].strip().lower(), row['fdc_id'])

    units = {}
    with open(os.path.join(USDA, 'measure_unit.csv'), newline='', encoding='utf-8-sig') as handle:
        for row in csv.DictReader(handle):
            units[row['id']] = row['name']

    portions = {}
    with open(os.path.join(USDA, 'food_portion.csv'), newline='', encoding='utf-8-sig') as handle:
        for row in csv.DictReader(handle):
            unit = units.get(row['measure_unit_id'], '')
            label = ' '.join(
                part for part in [row.get('portion_description', ''), unit if unit != 'undetermined' else '', row.get('modifier', '')] if part
            ).strip()
            try:
                grams = float(row['gram_weight'])
                amount = float(row['amount']) if row['amount'] else 1.0
            except ValueError:
                continue
            portions.setdefault(row['fdc_id'], []).append((amount, label, grams))
    return descriptions, portions


def main():
    descriptions, portions = load_usda()
    conn = sqlite3.connect(os.path.abspath(DB))
    cur = conn.cursor()

    # Only the foods a shopping list would ever want a count for, and only
    # those without a weight already.
    rows = cur.execute(
        """
        SELECT pf.category, pf.base_name, pf.unit_label, pf.sold_as
        FROM food_purchase_forms pf
        LEFT JOIN food_unit_weights fuw ON fuw.base_name = pf.base_name
        WHERE pf.form = 'count' AND fuw.base_name IS NULL
        ORDER BY pf.category, pf.base_name
        """
    ).fetchall()

    found = 0
    for category, base_name, unit_label, sold_as in rows:
        names = cur.execute(
            "SELECT DISTINCT name FROM foods WHERE source='USDA' AND category=? AND base_name=? AND hidden=0",
            (category, base_name),
        ).fetchall()
        candidates = []
        for (name,) in names:
            fdc_id = descriptions.get(name.strip().lower())
            if not fdc_id:
                continue
            for amount, label, grams in portions.get(fdc_id, []):
                if amount != 1.0:
                    continue
                if not WHOLE_ITEM.search(label) or NOT_A_PURCHASE.search(label):
                    continue
                candidates.append((name, label, grams))
        if candidates:
            found += 1
            print(f'\n{category} | {base_name}   (sold {sold_as}, unit "{unit_label}")')
            for name, label, grams in sorted(candidates, key=lambda c: c[2]):
                print(f'    {grams:7.1f} g   {label:44s}  <- {name}')

    print(f'\n{found} of {len(rows)} count-form foods have at least one whole-item portion in SR Legacy.')
    conn.close()


if __name__ == '__main__':
    main()
