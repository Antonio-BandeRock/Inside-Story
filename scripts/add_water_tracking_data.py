"""
Adds hydration/water-tracking data directly to the already-built
assets/data/foods_reference.db, as a supplemental patch rather than through
scripts/build_food_reference_db.py -- that script rebuilds the whole
database from hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx,
which lives in the separate nutrition-database project track and is not
present in this app's environment. This patch only touches an existing
compiled .db file, so it needs no spreadsheet.

IMPORTANT / FOLLOW-UP NEEDED: if the main spreadsheet-driven build is ever
re-run to regenerate foods_reference.db from scratch, everything this
script adds will be silently wiped (a fresh rebuild starts from the
spreadsheet, not from the previously-patched .db). At that point, either
re-run this script again afterward, or -- better -- fold this same water
data into build_food_reference_db.py / the master spreadsheet itself so it
survives a real rebuild. Flagging this explicitly rather than leaving it
as a silent trap.

What this adds:
1. A new 'water' nutrient (grams per 100g, same convention as every other
   nutrient here) -- USDA and the other national sources already measure
   and report this for virtually every food (it's one of the standard
   proximate values, right alongside protein/fat/carbohydrate); it was
   simply never imported into this app's nutrients/food_nutrients tables.
2. A 'water' = 100g/100g value on real, already-existing "Water, ..." food
   rows (USDA's "Water, bottled, generic" matters most, since the Meals
   builder's food search defaults to USDA-only) -- no new food rows were
   invented; these entries already existed in the database, they just
   never had a water value because the nutrient itself didn't exist yet.
3. Real, standard USDA FoodData Central "Water" proximate values for a
   deliberately small, hand-verified starter set of common staple foods
   (not an attempt at full 22,016-food coverage) -- each matched to a
   specific, verified USDA food_id/name, not a blind base_name-wide
   update, since raw vs. cooked water content differs substantially for
   several of these (e.g. rice, chicken, eggs) and guessing wrong would be
   a real accuracy bug.
4. A real DRI row for total water (NASEM/IOM Dietary Reference Intakes for
   Water, Potassium, Sodium, Chloride, and Sulfate, 2005): 2.7 L/day women,
   3.7 L/day men, ages 19+, Adequate Intake, from ALL sources including
   food -- not a "drink this many glasses" number, the real cited AI is
   already inclusive of food-derived water.

Safe to re-run: every insert is idempotent (INSERT OR IGNORE / ON CONFLICT
UPDATE / an existence check before the DRI rows), so running this twice
doesn't duplicate anything.

Usage:
  py scripts/add_water_tracking_data.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

# food_id, source, name -> water grams per 100g. Every row here was looked
# up by its exact USDA name (not base_name alone) to avoid attaching a raw
# food's water content to a cooked variant or vice versa.
WATER_VALUES = [
    (254, "USDA", "Watermelon, raw", 91.45),
    (898, "USDA", "Cucumber, with peel, raw", 95.23),
    (1736, "USDA", "Lettuce, cos or romaine, raw", 95.63),
    (2946, "USDA", "Tomatoes, red, ripe, raw, year round average", 94.52),
    (282, "USDA", "Apples, raw, fuji, with skin (Includes foods for USDA's Food Distribution Program)", 85.56),
    (1586, "USDA", "Oranges, raw, all commercial varieties", 86.75),
    (251, "USDA", "Strawberries, raw", 90.95),
    (6433, "USDA", "Bananas, raw", 74.91),
    (951, "USDA", "Spinach, raw", 91.4),
    (2868, "USDA", "Broccoli, raw", 89.3),
    (2882, "USDA", "Carrots, raw", 88.29),
    (2477, "USDA", "Celery, raw", 95.43),
    (3754, "USDA", "Milk, whole, 3.25% milkfat, with added vitamin D", 88.13),
    (3773, "USDA", "Yogurt, plain, whole milk", 87.90),
    (1424, "USDA", "Rice, white, long-grain, regular, cooked, unenriched, with salt", 68.44),
    (5913, "USDA", "Egg, whole, cooked, hard-boiled", 74.62),
    (6394, "USDA", "Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt", 84.59),
    (972, "USDA", "Sweet potato, cooked, baked in skin, flesh, without salt", 76.09),
    (7657, "USDA", "Fish, salmon, Atlantic, farmed, cooked, dry heat", 63.43),
    (6246, "USDA", "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", 60.21),
    # Real, already-existing "plain water" food rows -- water = 100g/100g
    # for all of them regardless of tap/bottled/municipal.
    (6647, "USDA", "Water, bottled, generic", 100.0),
    (6146, "USDA", "Water, bottled, non-carbonated, NAYA", 100.0),
    (19565, "Canada_CNF", "Water, municipal", 100.0),
    (26509, "Australia_AFCD", "Water, bottled, still", 100.0),
    (26511, "Australia_AFCD", "Water, tap", 100.0),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        "INSERT OR IGNORE INTO nutrients (code, display_name, unit, nutrient_group) VALUES (?, ?, ?, ?)",
        ("water", "Water", "g", "macro"),
    )

    verified = 0
    for food_id, source, expected_name, water_g in WATER_VALUES:
        row = cur.execute(
            "SELECT name FROM foods WHERE food_id = ? AND source = ?", (food_id, source)
        ).fetchone()
        if not row or row[0] != expected_name:
            print(f"SKIPPED (name mismatch, DB may have changed): food_id={food_id} source={source} expected={expected_name!r} actual={row[0] if row else None!r}")
            continue
        cur.execute(
            """
            INSERT INTO food_nutrients (food_id, source, nutrient_code, amount_per_100g)
            VALUES (?, ?, 'water', ?)
            ON CONFLICT(food_id, source, nutrient_code) DO UPDATE SET amount_per_100g = excluded.amount_per_100g
            """,
            (food_id, source, water_g),
        )
        verified += 1

    existing_dri = cur.execute(
        "SELECT COUNT(*) FROM dietary_reference_intakes WHERE nutrient_code = 'water'"
    ).fetchone()[0]

    if existing_dri == 0:
        water_dri_note = (
            'Total water AI from ALL sources, including food -- not a "drink this many glasses" target on top of '
            "food. 1 mL of water weighs ~1 g, so this figure is directly comparable to food-derived water tracked "
            "in grams. No UL is set for healthy adults under normal conditions."
        )
        for sex, amount in [("female", 2700.0), ("male", 3700.0)]:
            cur.execute(
                """
                INSERT INTO dietary_reference_intakes
                  (nutrient_code, sex, age_min, age_max, value_type, amount, unit, upper_limit, upper_limit_type, source_agency, citation, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "water", sex, 19, None, "AI", amount, "g", None, None,
                    "NASEM (Institute of Medicine)",
                    "Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate (2005)",
                    water_dri_note,
                ),
            )
        print("Added water DRI (AI) rows.")
    else:
        print(f"Water DRI rows already present ({existing_dri}) -- skipped.")

    conn.commit()
    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/add_water_tracking_data.py, which patches the compiled .db directly) --\n'
        '// do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )

    print(f"Verified and updated water content for {verified}/{len(WATER_VALUES)} foods.")
    print("Added 'water' nutrient definition.")
    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
