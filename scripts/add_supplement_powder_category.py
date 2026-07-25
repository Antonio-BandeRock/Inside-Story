"""
Adds a new 'SupplementPowder' food category ("Supplement Powders &
Liquids" in the app's UI) directly to the already-built
assets/data/foods_reference.db, as a supplemental patch rather than
through scripts/build_food_reference_db.py -- that script rebuilds the
whole database from hashimotos_foods_combined_scored_and_nutrients_LIVE.xlsx,
which lives in the separate nutrition-database project track and is not
present in this app's environment. This patch only touches an existing
compiled .db file, so it needs no spreadsheet. Same pattern as
scripts/add_water_tracking_data.py.

IMPORTANT / FOLLOW-UP NEEDED: if the main spreadsheet-driven build is ever
re-run to regenerate foods_reference.db from scratch, everything this
script adds/changes will be silently wiped or reverted. At that point,
either re-run this script again afterward, or fold the same changes into
build_food_reference_db.py / the master spreadsheet itself.

What this does:
1. Recategorizes the existing "Psyllium, uncooked" food row (Australia_AFCD,
   food_id 26683) from 'NutSeed' to 'SupplementPowder' -- this is a real
   food that already existed in the database with full nutrient data and
   6 Ds scoring; only its category changes, so that data carries over
   untouched. Not a new food row.
2. Adds a new 'choline' nutrient (mg, per 100g -- same convention as every
   other nutrient here). Choline was not previously tracked at all in this
   app. Grouped as 'vitamin' here even though it's technically classified
   as its own essential-nutrient category, not a true vitamin -- this
   matches how NASEM's own 1998 DRI report bundles it alongside the
   B-vitamins (see citation below), not a claim that it biochemically is one.
3. Adds real DRI (Adequate Intake) rows for choline, sex-specific, from
   NASEM (Institute of Medicine), Dietary Reference Intakes for Thiamin,
   Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic Acid,
   Biotin, and Choline (1998): 550 mg/day (men 19+), 425 mg/day (women
   19+), upper limit 3500 mg/day (all adults).
4. Adds one new food row: "Choline Bitartrate (Supplement Powder)" under
   the new category. Choline bitartrate -- not pure choline, which is an
   unstable liquid -- is the stable salt form actually sold as a raw powder
   supplement ingredient. Its choline content (41.1 g per 100 g, i.e.
   41,100 mg/100g) is a computed molecular-weight ratio (choline cation
   ~104.17 g/mol / choline bitartrate ~253.26 g/mol), not an empirical lab
   assay -- flagged as such in this food's own data rather than presented
   as a measured figure. Modeled as 100% pure bitartrate powder (no
   fillers); a specific commercial product's actual concentration may
   differ and should be checked against its own label.

Source for this food is 'Custom' (it isn't part of any of the app's 7
national food databases) -- the Meals builder's ingredient search normally
defaults to USDA-only, but the SupplementPowder category is coded to
always search every source regardless of that checkbox (see
getUnitOptionsForCategory / usdaOnlyForSearch in app/(tabs)/index.tsx), so
this is still found by default.

Safe to re-run: every write here is idempotent (existence checks / ON
CONFLICT UPDATE), so running this twice doesn't duplicate or corrupt
anything.

Usage:
  py scripts/add_supplement_powder_category.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

SUPPLEMENT_POWDER_CATEGORY = "SupplementPowder"

CHOLINE_BITARTRATE_FOOD_ID = 900001
# 104.17 / 253.26 = 0.41133... -> 41.1 g choline per 100 g of pure
# bitartrate powder. Computed from standard atomic weights, not measured.
CHOLINE_MG_PER_100G_BITARTRATE = 41100.0


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Recategorize the existing psyllium husk row.
    row = cur.execute(
        "SELECT name, category FROM foods WHERE food_id = 26683 AND source = 'Australia_AFCD'"
    ).fetchone()
    if row and row[0] == "Psyllium, uncooked":
        if row[1] != SUPPLEMENT_POWDER_CATEGORY:
            cur.execute(
                "UPDATE foods SET category = ? WHERE food_id = 26683 AND source = 'Australia_AFCD'",
                (SUPPLEMENT_POWDER_CATEGORY,),
            )
            print("Recategorized 'Psyllium, uncooked' -> SupplementPowder.")
        else:
            print("'Psyllium, uncooked' already recategorized -- skipped.")
    else:
        print(f"SKIPPED psyllium recategorization (row changed or missing): {row!r}")

    # 2. Add the 'choline' nutrient definition.
    cur.execute(
        "INSERT OR IGNORE INTO nutrients (code, display_name, unit, nutrient_group) VALUES (?, ?, ?, ?)",
        ("choline", "Choline", "mg", "vitamin"),
    )

    # 3. Add choline DRI (AI) rows, if not already present.
    existing_dri = cur.execute(
        "SELECT COUNT(*) FROM dietary_reference_intakes WHERE nutrient_code = 'choline'"
    ).fetchone()[0]

    if existing_dri == 0:
        choline_note = (
            "Set as an Adequate Intake (AI), not an RDA -- NASEM concluded there wasn't yet enough evidence "
            "to set a full RDA for choline when this report was published."
        )
        for sex, amount in [("female", 425.0), ("male", 550.0)]:
            cur.execute(
                """
                INSERT INTO dietary_reference_intakes
                  (nutrient_code, sex, age_min, age_max, value_type, amount, unit, upper_limit, upper_limit_type, source_agency, citation, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "choline", sex, 19, None, "AI", amount, "mg", 3500.0, "UL",
                    "NASEM (Institute of Medicine)",
                    "Dietary Reference Intakes for Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, "
                    "Pantothenic Acid, Biotin, and Choline (1998)",
                    choline_note,
                ),
            )
        print("Added choline DRI (AI) rows.")
    else:
        print(f"Choline DRI rows already present ({existing_dri}) -- skipped.")

    # 4. Add the Choline Bitartrate Powder food row.
    existing_food = cur.execute(
        "SELECT name FROM foods WHERE food_id = ? AND source = 'Custom'",
        (CHOLINE_BITARTRATE_FOOD_ID,),
    ).fetchone()

    if not existing_food:
        cur.execute(
            """
            INSERT INTO foods (food_id, source, name, base_name, category)
            VALUES (?, 'Custom', ?, ?, ?)
            """,
            (
                CHOLINE_BITARTRATE_FOOD_ID,
                "Choline Bitartrate (Supplement Powder)",
                "Choline Bitartrate (Supplement Powder)",
                SUPPLEMENT_POWDER_CATEGORY,
            ),
        )
        print("Added 'Choline Bitartrate (Supplement Powder)' food row.")
    else:
        print("'Choline Bitartrate (Supplement Powder)' food row already present -- skipped.")

    cur.execute(
        """
        INSERT INTO food_nutrients (food_id, source, nutrient_code, amount_per_100g)
        VALUES (?, 'Custom', 'choline', ?)
        ON CONFLICT(food_id, source, nutrient_code) DO UPDATE SET amount_per_100g = excluded.amount_per_100g
        """,
        (CHOLINE_BITARTRATE_FOOD_ID, CHOLINE_MG_PER_100G_BITARTRATE),
    )

    conn.commit()
    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/add_supplement_powder_category.py, which patches the compiled .db\n'
        '// directly) -- do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )

    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
