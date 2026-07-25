"""
Adds a new 'interaction_rules' table to the already-built
assets/data/foods_reference.db, as a supplemental patch rather than
through scripts/build_food_reference_db.py -- same pattern as
scripts/add_water_tracking_data.py and
scripts/add_supplement_powder_category.py (see those for why patching the
compiled .db directly, rather than the spreadsheet-driven rebuild, is the
right approach in this environment).

IMPORTANT / FOLLOW-UP NEEDED: if the main spreadsheet-driven build is ever
re-run to regenerate foods_reference.db from scratch, this table will be
silently wiped. At that point, either re-run this script again afterward,
or fold interaction_rules into build_food_reference_db.py itself.

Why a new table, not nutrient_interactions/nutrient_system_effects:
those two existing reference tables (see build_food_reference_db.py) are
general nutrient-to-nutrient and nutrient-to-body-system physiology
education (e.g. the sodium/potassium Na+/K+-ATPase pump) -- confirmed by
direct query not to contain anything about scheduling/timing conflicts.
interaction_rules is a different kind of content: rules meant to be
actively evaluated against a real person's own active supplements and
schedule (see lib/interactionRules.ts), not just displayed as reference
text.

checkable=1 rules are ones the app can actually evaluate today, given what
it tracks (active supplement ingredients, active prescriptions, scheduled
dose times, logged food, and now upcoming appointments). The two
levothyroxine rules were originally checkable=0 when this table was first
built, back when the app didn't track prescriptions at all (Prescriptions
was still a placeholder lens on the Schedule tab, then still called
"Medications"). Now that prescriptions are a real, trackable treatment_type
alongside supplements (see createPrescriptionTreatment in lib/db.ts), those
two rules are checkable=1 too -- subject_a_kind='prescription' rules are
matched by name (case-insensitive substring against the prescription's own
name field), not by nutrient_code the way subject_a_kind='nutrient' rules
are, since a prescription has no documented per-ingredient nutrient content
the way a supplement does. The biotin rule was checkable=0 for the same
reason it depended on data this app didn't track yet -- not a medication
this time, but an upcoming LAB DRAW. Now that Appointments is a real,
trackable lens (appointment_type='lab_draw' specifically), that rule is
checkable=1 too, as a new rule_type ('appointment_caution') evaluated
differently from the other two kinds: it fires when biotin is active AND a
lab_draw appointment falls within lookahead_days, rather than checking a
same-day timing gap.

The 9 rules:
1. calcium_iron_timing (checkable) -- calcium/iron competitive mineral
   absorption. NIH ODS Iron Health Professional Fact Sheet notes calcium
   can interfere with iron absorption and that some people take the two at
   different times of day; that fact sheet does not itself specify an
   exact number of hours, so the 2-hour gap used here to actually evaluate
   this rule is this app's own operationalization of "different times of
   day," flagged as such rather than presented as an NIH-stated figure.
2. calcium_zinc_timing (checkable) -- calcium/zinc competitive mineral
   absorption, same 2-hour operationalized gap. NIH ODS Zinc Health
   Professional Fact Sheet.
3-6. vitamin_a/d/e/k_dietary_fat (checkable) -- each fat-soluble vitamin
   needs some dietary fat present for absorption (bile-mediated micelle
   formation). One row per vitamin since each is cited to that vitamin's
   own NIH ODS fact sheet individually rather than one combined citation.
7-8. levothyroxine_calcium_timing / levothyroxine_iron_timing
   (checkable, subject_a_kind='prescription') -- FDA-approved levothyroxine
   sodium prescribing information (Drug Interactions section) instructs
   separating levothyroxine dosing from calcium carbonate and from
   iron/ferrous sulfate supplements by at least 4 hours -- an exact,
   labeled figure, unlike rules 1-2 above.
9. biotin_thyroid_lab_interference (checkable, rule_type='appointment_caution',
   lookahead_days=14) -- fires when biotin is tracked and a 'lab_draw'
   appointment falls within the next 14 days. FDA Safety Communication,
   "The FDA warns that biotin,
   found in many dietary supplements, could seriously interfere with lab
   test results" (November 28, 2017), which specifically calls out
   interference with thyroid hormone (and other) lab assays.

Safe to re-run: every write is idempotent (INSERT OR REPLACE on the
primary key), so running this twice doesn't duplicate anything.

Usage:
  py scripts/add_interaction_rules.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

# (id, rule_type, checkable, subject_a_kind, subject_a, subject_b_kind, subject_b,
#  min_separation_hours, lookahead_days, severity, title, guidance, citation)
RULES = [
    (
        "calcium_iron_timing", "timing_separation", 1,
        "nutrient", "calcium", "nutrient", "iron", 2.0, None, "caution",
        "Calcium and iron compete for absorption",
        "Calcium can reduce how much iron your body absorbs when the two are taken close together. If you take "
        "supplements containing both, spacing them apart in the day (rather than in the same dose) means each is "
        "more likely to be absorbed as intended.",
        "NIH Office of Dietary Supplements, Iron Health Professional Fact Sheet (notes calcium's inhibitory effect "
        "on iron absorption and that some sources recommend taking calcium and iron supplements at different times "
        "of day). The 2-hour figure used to evaluate this rule is this app's own operationalized interpretation of "
        "'different times of day' -- the fact sheet itself does not state an exact number of hours.",
    ),
    (
        "calcium_zinc_timing", "timing_separation", 1,
        "nutrient", "calcium", "nutrient", "zinc", 2.0, None, "caution",
        "Calcium and zinc compete for absorption",
        "High-dose calcium supplements can reduce zinc absorption when taken together. If you take supplements "
        "containing both, spacing them apart in the day means each is more likely to be absorbed as intended.",
        "NIH Office of Dietary Supplements, Zinc Health Professional Fact Sheet (notes supplemental calcium's "
        "potential to inhibit zinc absorption). As with the calcium/iron rule above, the 2-hour gap used to "
        "evaluate this rule is this app's own operationalization, not an exact figure stated in the fact sheet.",
    ),
    (
        "vitamin_a_dietary_fat", "dietary_cofactor", 1,
        "nutrient", "vitamin_a", "nutrient", "fat_total", None, None, "note",
        "Vitamin A needs dietary fat to absorb",
        "Vitamin A is fat-soluble -- your body needs some dietary fat present in the same meal to absorb it well. "
        "Taking it on a very low-fat day may mean less of it is actually absorbed, regardless of the dose.",
        "NIH Office of Dietary Supplements, Vitamin A and Carotenoids Health Professional Fact Sheet.",
    ),
    (
        "vitamin_d_dietary_fat", "dietary_cofactor", 1,
        "nutrient", "vitamin_d", "nutrient", "fat_total", None, None, "note",
        "Vitamin D needs dietary fat to absorb",
        "Vitamin D is fat-soluble -- your body needs some dietary fat present in the same meal to absorb it well. "
        "Taking it on a very low-fat day may mean less of it is actually absorbed, regardless of the dose.",
        "NIH Office of Dietary Supplements, Vitamin D Health Professional Fact Sheet.",
    ),
    (
        "vitamin_e_dietary_fat", "dietary_cofactor", 1,
        "nutrient", "vitamin_e", "nutrient", "fat_total", None, None, "note",
        "Vitamin E needs dietary fat to absorb",
        "Vitamin E is fat-soluble -- your body needs some dietary fat present in the same meal to absorb it well. "
        "Taking it on a very low-fat day may mean less of it is actually absorbed, regardless of the dose.",
        "NIH Office of Dietary Supplements, Vitamin E Health Professional Fact Sheet.",
    ),
    (
        "vitamin_k_dietary_fat", "dietary_cofactor", 1,
        "nutrient", "vitamin_k", "nutrient", "fat_total", None, None, "note",
        "Vitamin K needs dietary fat to absorb",
        "Vitamin K is fat-soluble -- your body needs some dietary fat present in the same meal to absorb it well. "
        "Taking it on a very low-fat day may mean less of it is actually absorbed, regardless of the dose.",
        "NIH Office of Dietary Supplements, Vitamin K Health Professional Fact Sheet.",
    ),
    (
        "levothyroxine_calcium_timing", "timing_separation", 1,
        "prescription", "levothyroxine", "nutrient", "calcium", 4.0, None, "caution",
        "Levothyroxine and calcium need real separation",
        "Calcium carbonate and other calcium supplements can significantly reduce how much levothyroxine your body "
        "absorbs if taken too close together. If you track both, this app checks your scheduled dose times for "
        "adequate separation.",
        "FDA-approved levothyroxine sodium prescribing information (Drug Interactions section; e.g. Synthroid "
        "Prescribing Information), which instructs separating levothyroxine dosing from calcium carbonate by at "
        "least 4 hours.",
    ),
    (
        "levothyroxine_iron_timing", "timing_separation", 1,
        "prescription", "levothyroxine", "nutrient", "iron", 4.0, None, "caution",
        "Levothyroxine and iron need real separation",
        "Iron supplements (e.g. ferrous sulfate) can significantly reduce how much levothyroxine your body absorbs "
        "if taken too close together. If you track both, this app checks your scheduled dose times for adequate "
        "separation.",
        "FDA-approved levothyroxine sodium prescribing information (Drug Interactions section; e.g. Synthroid "
        "Prescribing Information), which instructs separating levothyroxine dosing from iron supplements by at "
        "least 4 hours.",
    ),
    (
        "biotin_thyroid_lab_interference", "appointment_caution", 1,
        "nutrient", "biotin_b7", "appointment_type", "lab_draw", None, 14, "caution",
        "Biotin can distort an upcoming thyroid lab",
        "High-dose biotin supplements can interfere with common thyroid blood tests (e.g. TSH, free T4), producing "
        "falsely abnormal results in either direction. You have a lab appointment coming up and are tracking "
        "biotin -- tell your doctor or the lab you take it, and ask whether you should pause it beforehand.",
        "FDA Safety Communication, 'The FDA warns that biotin, found in many dietary supplements, could seriously "
        "interfere with lab test results' (November 28, 2017), which specifically identifies thyroid hormone "
        "assays among the test types biotin can distort. The 14-day lookahead used to surface this warning is this "
        "app's own operationalized choice, not a figure stated in the FDA communication itself, which recommends "
        "talking to your doctor rather than a specific pause duration.",
    ),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS interaction_rules (
            id TEXT PRIMARY KEY,
            rule_type TEXT NOT NULL,
            checkable INTEGER NOT NULL,
            subject_a_kind TEXT NOT NULL,
            subject_a TEXT NOT NULL,
            subject_b_kind TEXT,
            subject_b TEXT,
            min_separation_hours REAL,
            lookahead_days INTEGER,
            severity TEXT NOT NULL,
            title TEXT NOT NULL,
            guidance TEXT NOT NULL,
            citation TEXT NOT NULL
        )
        """
    )

    existing_columns = {row[1] for row in cur.execute("PRAGMA table_info(interaction_rules)").fetchall()}
    if "lookahead_days" not in existing_columns:
        cur.execute("ALTER TABLE interaction_rules ADD COLUMN lookahead_days INTEGER")

    cur.executemany(
        """
        INSERT INTO interaction_rules
            (id, rule_type, checkable, subject_a_kind, subject_a, subject_b_kind, subject_b,
             min_separation_hours, lookahead_days, severity, title, guidance, citation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            rule_type = excluded.rule_type,
            checkable = excluded.checkable,
            subject_a_kind = excluded.subject_a_kind,
            subject_a = excluded.subject_a,
            subject_b_kind = excluded.subject_b_kind,
            subject_b = excluded.subject_b,
            min_separation_hours = excluded.min_separation_hours,
            lookahead_days = excluded.lookahead_days,
            severity = excluded.severity,
            title = excluded.title,
            guidance = excluded.guidance,
            citation = excluded.citation
        """,
        RULES,
    )
    print(f"Upserted {len(RULES)} interaction_rules rows.")

    conn.commit()
    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/add_interaction_rules.py, which patches the compiled .db directly) --\n'
        '// do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )
    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
