"""
Patches the already-built assets/data/foods_reference.db with explicit
time-frame wording on every assessment_items.prompt -- same approach as
scripts/add_my_meds_reference_data.py (patching the compiled .db directly,
not a full spreadsheet-driven rebuild, since this touches a small,
self-contained content table with no dependency on the source xlsx at
all).

2026-08-08, direct request: the check-in questions "need to be tracked, but
they need to be all related to in the past however many days or stated to
be when the user is asked to answer them because they don't get a frame of
reference per question otherwise." Checked the real, live prompt text
before writing anything (not assumed): of the 23 items, only ONE
(ibs_pain_frequency) already stated an explicit period ("Over the last 10
days..."); the other 22 had none at all -- a bare symptom name
("Fatigue or low energy") or a bare present-perfect statement ("I have felt
cheerful and in good spirits") with no day count anywhere in the item
itself, relying only on that domain's own description text (shown once,
above the whole list) to imply a period -- exactly the "no frame of
reference per question" gap named directly.

No item among the current 23 needed the OTHER allowed framing ("stated to
be when the user is asked to answer them," i.e. "right now") -- every one
of these three domains is modeled on a real published instrument
(Zulewski/ThyPRO-style symptom burden, the IBS Symptom Severity Scale,
WHO-5) and all three are genuinely PERIOD/recall instruments by design, not
momentary snapshots, so a real day count is the honest, correct framing for
every one of them, not a default reached for out of convenience.

Periods chosen, each traceable to something already true about this app or
the domain's own real methodology, not invented freely:
  - hypothyroid_symptoms: "the past 30 days" -- matches the new automatic
    check-in cadence (every 30 days, see index.tsx's own assessment-due
    banner), so the period being asked about now actually matches how
    often the question gets asked again.
  - digestive_ibs: "the last 10 days" -- the real IBS-SSS instrument's own
    standard recall window; ibs_pain_frequency already used this exact
    phrase, the other 4 items in this domain just hadn't been given it.
  - wellbeing: "the past two weeks" -- WHO-5's own real, standard recall
    window; the DOMAIN description already said this ("how the last two
    weeks have actually felt"), just never repeated per item.

Safe to re-run: every write is a plain UPDATE keyed on the item's own
`code` (already a stable, unique primary key), so running this twice just
overwrites the same rows with the same text.

Usage:
  py scripts/patch_assessment_item_timeframes.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

# (code, new prompt)
NEW_PROMPTS = [
    ("hypo_fatigue", "Over the past 30 days, how much has fatigue or low energy bothered you?"),
    ("hypo_cold_intolerance", "Over the past 30 days, how much has feeling cold when others around you don't bothered you?"),
    ("hypo_dry_skin", "Over the past 30 days, how much has dry or itchy skin bothered you?"),
    ("hypo_hair_loss", "Over the past 30 days, how much has hair thinning or hair loss bothered you?"),
    ("hypo_constipation", "Over the past 30 days, how much has constipation bothered you?"),
    ("hypo_weight_gain", "Over the past 30 days, how much has unexplained weight gain bothered you?"),
    ("hypo_muscle_aches", "Over the past 30 days, how much have muscle aches or weakness bothered you?"),
    ("hypo_brain_fog", "Over the past 30 days, how much has brain fog or difficulty concentrating bothered you?"),
    ("hypo_swelling", "Over the past 30 days, how much has puffiness or swelling (face, hands, or feet) bothered you?"),
    ("hypo_slowed_movement", "Over the past 30 days, how much has feeling physically slowed down or sluggish bothered you?"),
    ("hypo_voice_changes", "Over the past 30 days, how much has voice hoarseness or a deepened voice bothered you?"),
    ("hypo_joint_pain", "Over the past 30 days, how much has joint pain or stiffness bothered you?"),
    ("hypo_hearing_changes", "Over the past 30 days, how much have you noticed changes in your hearing?"),

    ("ibs_pain_severity", "Over the last 10 days, how severe has your abdominal pain been?"),
    ("ibs_pain_frequency", "Over the last 10 days, how many days did you have abdominal pain?"),
    ("ibs_bloating", "Over the last 10 days, how severe has your bloating or abdominal distension been?"),
    ("ibs_bowel_satisfaction", "Over the last 10 days, how dissatisfied have you been with your bowel habits?"),
    ("ibs_life_interference", "Over the last 10 days, how much have digestive symptoms interfered with your daily life?"),

    ("wellbeing_cheerful", "Over the past two weeks, I have felt cheerful and in good spirits"),
    ("wellbeing_calm", "Over the past two weeks, I have felt calm and relaxed"),
    ("wellbeing_energetic", "Over the past two weeks, I have felt active and had good energy"),
    ("wellbeing_rested", "Over the past two weeks, I have woken up feeling rested"),
    ("wellbeing_engaged", "Over the past two weeks, my daily life has felt full of things that interest me"),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.executemany("UPDATE assessment_items SET prompt = ? WHERE code = ?", [(prompt, code) for code, prompt in NEW_PROMPTS])
    print(f"Updated {cur.rowcount if cur.rowcount >= 0 else len(NEW_PROMPTS)} assessment_items prompts "
          f"(requested {len(NEW_PROMPTS)}).")

    # Verify every code actually matched a real row -- a typo'd code here
    # would silently UPDATE zero rows rather than error.
    codes = [code for code, _ in NEW_PROMPTS]
    placeholders = ", ".join("?" for _ in codes)
    found = {row[0] for row in cur.execute(f"SELECT code FROM assessment_items WHERE code IN ({placeholders})", codes)}
    missing = set(codes) - found
    if missing:
        raise SystemExit(f"ERROR: these assessment_items codes don't exist in the database: {sorted(missing)}")

    conn.commit()
    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/patch_assessment_item_timeframes.py, which patches the compiled .db\n'
        '// directly) -- do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )
    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
