"""
Adds a new 'mechanism' column to the already-built interaction_rules table
in assets/data/foods_reference.db, and backfills it for a first batch of
rows -- same supplemental-patch pattern as add_interaction_rules.py and
add_my_meds_reference_data.py.

Direct request, 2026-08-23: "there are other interactions that might also
require an AI response like about the reason why it says they shouldn't
take certain medications or supplements with something or around
something." Scoped down to a specific choice the same conversation: a
generic (no personal data involved), pre-written explanation rather than
a live AI call at request time -- see components/WhyExplainer.tsx's own
header comment for the full reasoning. This script is the content half
of that decision; lib/db.ts, lib/interactionRules.ts, and the two screens
that render interaction warnings (Insights' My Meds view, and four
lenses on Schedule) already thread this field through and show it behind
a tappable "Why?" wherever it is set.

Every mechanism below traces to the same citation already stored on that
row (see add_interaction_rules.py and add_my_meds_reference_data.py for
where each one came from), except levothyroxine_calcium_timing and
biotin_thyroid_lab_interference, where the existing citation names the
regulatory finding but not the underlying biology, independently verified
via WebSearch before writing (chelation/insoluble-complex formation for
the first, streptavidin-biotin assay competition for the second).

Not exhaustive: this is a first batch covering the classic food/
supplement/prescription timing and absorption cluster, the same 13 or so
rules a person is most likely to actually ask "why" about, out of 44
total rows in the table. The remaining rows (mostly age-threshold and
concurrent-use cautions added across later condition build-outs) are a
real, scoped-out follow-up, not forgotten.

Safe to re-run: every write is an UPDATE keyed on id, so running this
twice doesn't change anything the second time.

Usage:
  py scripts/add_interaction_rule_mechanisms.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

# (id, mechanism)
MECHANISMS = [
    (
        "calcium_iron_timing",
        "Calcium and iron are absorbed in the small intestine through some of the same transport pathways. "
        "When both are present in the gut at the same time in meaningful amounts, calcium competes with iron "
        "for that shared absorption route, so less iron gets through. Spacing the two apart gives each one its "
        "own turn at the same pathway instead of crowding it at once.",
    ),
    (
        "calcium_zinc_timing",
        "Calcium and zinc share part of the same absorption pathway in the small intestine, and a large "
        "calcium dose can crowd zinc out of it. The effect is strongest with high-dose calcium supplements "
        "rather than the calcium naturally found in food. Spacing the two apart in the day lets each one "
        "absorb on its own instead of competing for the same route at once.",
    ),
    (
        "vitamin_a_dietary_fat",
        "Vitamin A is fat-soluble, which means your body packages it into tiny fat-carrying particles called "
        "micelles before it can cross into the bloodstream, a process that depends on bile released in "
        "response to dietary fat. Take it on a meal with little or no fat and there is less fat available to "
        "build those particles, so less of the vitamin actually gets absorbed, regardless of the dose "
        "swallowed.",
    ),
    (
        "vitamin_d_dietary_fat",
        "Vitamin D is fat-soluble, which means your body packages it into tiny fat-carrying particles called "
        "micelles before it can cross into the bloodstream, a process that depends on bile released in "
        "response to dietary fat. Take it on a meal with little or no fat and there is less fat available to "
        "build those particles, so less of the vitamin actually gets absorbed, regardless of the dose "
        "swallowed.",
    ),
    (
        "vitamin_e_dietary_fat",
        "Vitamin E is fat-soluble, which means your body packages it into tiny fat-carrying particles called "
        "micelles before it can cross into the bloodstream, a process that depends on bile released in "
        "response to dietary fat. Take it on a meal with little or no fat and there is less fat available to "
        "build those particles, so less of the vitamin actually gets absorbed, regardless of the dose "
        "swallowed.",
    ),
    (
        "vitamin_k_dietary_fat",
        "Vitamin K is fat-soluble, which means your body packages it into tiny fat-carrying particles called "
        "micelles before it can cross into the bloodstream, a process that depends on bile released in "
        "response to dietary fat. Take it on a meal with little or no fat and there is less fat available to "
        "build those particles, so less of the vitamin actually gets absorbed, regardless of the dose "
        "swallowed.",
    ),
    (
        "levothyroxine_calcium_timing",
        "Calcium binds directly to levothyroxine in the stomach and intestine, forming an insoluble complex "
        "too large to cross into the bloodstream. That bound levothyroxine passes through the gut unabsorbed "
        "instead of doing its job, a documented effect that can cut absorption by 20 to 25 percent when the "
        "two are taken together. Separating the doses by several hours lets the levothyroxine clear the "
        "stomach before calcium arrives to bind it.",
    ),
    (
        "levothyroxine_iron_timing",
        "Iron binds directly to levothyroxine in the gut in much the same way calcium does, forming a complex "
        "the intestine cannot absorb. The levothyroxine bound up this way passes through unused rather than "
        "reaching the bloodstream. Separating the two doses by several hours avoids the two ever meeting in "
        "the gut at a high enough concentration to bind.",
    ),
    (
        "levothyroxine_magnesium_timing",
        "Magnesium can bind to levothyroxine in the gut in a similar way calcium and iron do, though a 2025 "
        "clinical trial found the effect itself is smaller and depends on the specific magnesium form. "
        "Magnesium aspartate measurably reduced absorption in that trial, while magnesium citrate showed a "
        "smaller effect that did not reach statistical significance. The same several-hour separation used "
        "for calcium and iron is the standard precaution here too, since the underlying mechanism is the same "
        "kind of binding.",
    ),
    (
        "biotin_thyroid_lab_interference",
        "Most thyroid blood tests use a lab technique that relies on the strong bond between biotin and a "
        "protein called streptavidin to hold the test components in place. High-dose biotin supplements flood "
        "the bloodstream with extra biotin that competes for those same binding sites, throwing off the test "
        "before it measures your actual thyroid hormone level. Depending on which specific test is used, this "
        "can push a TSH result falsely low or a T4/T3 result falsely high, in either case a number that does "
        "not reflect what is actually happening in your body.",
    ),
    (
        "metformin_levothyroxine_tsh_interpretation",
        "Metformin appears to lower TSH specifically in people already on levothyroxine, most likely by "
        "making the pituitary gland more sensitive to the thyroid hormone already circulating, rather than by "
        "changing how much thyroid hormone is actually in the blood. Researchers have proposed more than one "
        "specific pathway for this and have not settled on a single confirmed mechanism, but the pattern "
        "itself, a lower TSH without a corresponding change in free T4, is well documented across multiple "
        "studies.",
    ),
    (
        "vitamin_k2_warfarin_consistency",
        "Warfarin works by blocking an enzyme your liver needs to activate several clotting factors, a "
        "process that itself depends on vitamin K. More vitamin K available in the body means more raw "
        "material for that enzyme system to work with, which can partly counteract warfarin's own effect and "
        "make blood clot more readily than the prescribed dose intends. This is why the guidance is about "
        "keeping vitamin K intake steady from day to day rather than avoiding it. A sudden change in either "
        "direction changes how well the warfarin dose already prescribed actually works.",
    ),
    (
        "aspirin_ibuprofen_timing",
        "Aspirin's antiplatelet effect works by permanently disabling an enzyme called COX-1 inside platelets, "
        "a one-time modification that lasts for the platelet's whole lifespan. Ibuprofen can occupy that same "
        "enzyme's binding site temporarily, and if it gets there first, it can block aspirin from reaching and "
        "permanently disabling the enzyme at all. Taking aspirin well before ibuprofen, or several hours "
        "after, avoids the two competing for the same binding site at the same time.",
    ),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    existing_columns = {row[1] for row in cur.execute("PRAGMA table_info(interaction_rules)").fetchall()}
    if "mechanism" not in existing_columns:
        cur.execute("ALTER TABLE interaction_rules ADD COLUMN mechanism TEXT")

    updated = 0
    unmatched = []
    for rule_id, mechanism in MECHANISMS:
        cur.execute("UPDATE interaction_rules SET mechanism = ? WHERE id = ?", (mechanism, rule_id))
        if cur.rowcount == 1:
            updated += 1
        else:
            unmatched.append(rule_id)
    print(f"Updated mechanism on {updated} of {len(MECHANISMS)} interaction_rules rows.")
    if unmatched:
        print(f"WARNING: no matching row found for: {unmatched}")

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM interaction_rules WHERE mechanism IS NULL")
    remaining = cur.fetchone()[0]
    print(f"{remaining} interaction_rules rows still have no mechanism yet (a scoped, not-yet-done follow-up).")

    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/add_interaction_rule_mechanisms.py, which patches the compiled .db directly) --\n'
        '// do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )
    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
