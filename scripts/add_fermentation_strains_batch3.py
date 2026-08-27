"""
Adds real, practical "how do I actually use this" fields to the
fermentation_strains catalog (see scripts/add_fermentation_strains.py and
scripts/add_fermentation_strains_batch2.py for the prior two builds).
Direct report: "there are a bunch of pill selectors with probiotic names
on them as if a person knows right off the bat what each one is good
for, how long it needs to ferment, whether it can be fermented with
other probiotics, and at what temp to ferment it... The user should be
provided with the ability to understand everything they need to in
order to make an informed decision."

batch2 (2026-08-27) already answered "what is this good for" (description,
use_cases) and "how strong is the evidence" (evidence_tier, citation).
This batch answers the 3 remaining practical questions the report named
directly, via 3 new nullable columns:

- ferment_role: 'starter' | 'supplement'. Only S. thermophilus and
  L. bulgaricus are 'starter' -- the two cultures Codex Alimentarius
  requires together for something to legally be called yogurt, the only
  two that actually set warmed milk into yogurt's texture on their own.
  Every other strain here is 'supplement': added alongside those two, or
  stirred into an already-finished batch, never a standalone yogurt-
  setting culture by itself.
- ferment_guidance: the real temperature/duration for the 2 starters
  (confirmed via WebSearch against real yogurt-making sources: roughly
  108-115F/42-46C for 6-12 hours, shorter for milder, longer for
  tangier), and an honest, general note for supplement strains (the
  standard yogurt temperature range is gentle enough that most live
  probiotic strains tolerate it fine; the real risk is milk scalded
  hotter than that before culturing). Two strains get their own,
  strain-specific note instead of the generic one, named directly rather
  than forced into a guidance that doesn't actually apply: L. mesenteroides
  (its own real role, per its own description already in this catalog, is
  starting sauerkraut and vegetable ferments, not dairy -- it has no real
  yogurt-specific fermentation temperature at all) and S. boulardii (a
  yeast, not a bacterium, that doesn't ferment milk into yogurt texture
  and is normally taken as its own capsule, especially during antibiotics).
- time_to_effect: how long the strain's own cited trial actually ran, a
  direct, honest answer to "how long before effects begin" pulled from
  the same citations already verified in batch2 (a trial's own real
  duration, not a guessed number) -- 4 weeks for L. rhamnosus GG, 2-3
  weeks for L. reuteri, 8 weeks for B. coagulans and B. longum 35624,
  3-6 weeks for B. lactis, 12 weeks for L. casei Shirota/L. gasseri/
  L. paracasei, 30 days for L. helveticus, 14 days per phase for
  L. salivarius, prenatal-plus-6-months for B. breve. Left null for the
  6 strains (S. thermophilus, L. bulgaricus, L. mesenteroides, plus the
   3 of the original 7 whose own citation doesn't report a trial duration
  to honestly point to) where forcing a number would mean inventing one
  rather than reporting what the evidence actually says -- each of those
  gets a short honest sentence explaining why instead (see ferment_guidance
  for the starters/L. mesenteroides, and the description/time_to_effect
  text itself for L. acidophilus/L. plantarum/Bifidobacterium species/
  S. boulardii).

Also documents COMBINING_STRAINS_NOTE below -- one shared, catalog-wide
fact ("can these be fermented together"), not per-strain data, so it has
no column of its own. Not read by this script at runtime; kept here as
the source text a future session should copy from if it ever needs
updating, matching the same COMBINING_STRAINS_NOTE constant hand-copied
into components/FermentationBuilder.tsx, the actual, only place it's
shown. Confirmed via direct fetch of a real 2024 randomized, placebo-
controlled trial (Open Forum Infectious Diseases, a real, checkable
page) that combines 7 Lactobacillus species, 5 Bifidobacterium species,
Bacillus coagulans, AND Saccharomyces boulardii in one product -- the
same genera this catalog covers, direct evidence that combining several
of these strains at once is studied, not an invented reassurance.

Safe to re-run: every write is idempotent (conditional ALTER TABLE,
INSERT ... ON CONFLICT DO UPDATE on the primary key).

Usage:
  py scripts/add_fermentation_strains_batch3.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

STARTER_GUIDANCE = (
    "One of the two cultures required together to legally call something yogurt. Combined, they "
    "ferment warmed milk into yogurt at about 108-115F (42-46C) for roughly 6 to 12 hours: shorter "
    "for a milder, sweeter batch, longer for more tang. Neither one reliably sets milk into yogurt "
    "on its own; both need to be present together."
)

SUPPLEMENT_GUIDANCE = (
    "Not a required starter. Added alongside S. thermophilus and L. bulgaricus in the same batch, "
    "or stirred into an already-finished, cooled batch, as an extra probiotic boost. The standard "
    "yogurt fermentation temperature (about 108-115F/42-46C) is gentle enough that most live "
    "probiotic strains tolerate it fine; the risk is milk that's been scalded hotter than that "
    "before culturing, which can kill a live culture outright."
)

# (id, ferment_role, ferment_guidance, time_to_effect)
FERMENT_DATA = [
    ("strain_l_acidophilus", "supplement", SUPPLEMENT_GUIDANCE,
     "Its lactose-digestion effect happens at the time it's eaten, not after building up over days. "
     "No trial-based timeframe was reported for the antibiotic-recovery use specifically."),
    ("strain_l_plantarum", "supplement", SUPPLEMENT_GUIDANCE,
     "The cited trial did not report how many weeks of use it took to see the iron-absorption/"
     "inflammation-marker effect."),
    ("strain_bifidobacterium", "supplement", SUPPLEMENT_GUIDANCE,
     "The cited evidence is mechanistic (how the tight-junction repair might work at the cell "
     "level), not a trial measuring how long it takes a person to feel a difference."),
    ("strain_s_thermophilus", "starter", STARTER_GUIDANCE, None),
    ("strain_l_bulgaricus", "starter", STARTER_GUIDANCE, None),
    ("strain_l_mesenteroides", "supplement",
     "This one's role is starting sauerkraut and other vegetable ferments, not dairy. It isn't "
     "a typical yogurt add-in and has no established yogurt-specific fermentation temperature or "
     "time. Included in this catalog for completeness, not because it's commonly used in a dairy "
     "ferment.",
     None),
    ("strain_s_boulardii", "supplement",
     "A yeast, not a bacterium, so it doesn't ferment milk into yogurt texture the way the strains "
     "above do. Most often taken as a separate capsule, especially during or right after a "
     "course of antibiotics, since antibiotics kill the bacterial strains on this list but not this "
     "yeast. Some people stir it into an already-finished, cooled batch of yogurt instead of taking "
     "a separate capsule.",
     "Most useful started at the same time as an antibiotic course and continued through it, rather "
     "than something that needs weeks to build up an effect first."),
    ("strain_l_rhamnosus_gg", "supplement", SUPPLEMENT_GUIDANCE, "Studied over 4 weeks of daily use in the cited trial."),
    ("strain_l_reuteri", "supplement", SUPPLEMENT_GUIDANCE,
     "Measurable improvement within 2 to 3 weeks in the pooled trials; the advantage was less clear "
     "by week four."),
    ("strain_b_coagulans", "supplement",
     SUPPLEMENT_GUIDANCE + " Its spores make it unusually shelf-stable and heat-tolerant, more "
     "so than most of the other strains on this list.",
     "Studied over 8 weeks of daily use in the cited trial."),
    ("strain_b_lactis", "supplement", SUPPLEMENT_GUIDANCE, "Studied over 3 to 6 weeks of daily use across the pooled trials."),
    ("strain_b_longum_35624", "supplement", SUPPLEMENT_GUIDANCE, "Studied over 8 weeks of daily use in the cited trial."),
    ("strain_l_casei_shirota", "supplement", SUPPLEMENT_GUIDANCE, "Studied over a 12-week period in the cited trial."),
    ("strain_l_gasseri", "supplement", SUPPLEMENT_GUIDANCE,
     "Studied over 12 weeks of daily use; the benefit faded once people stopped."),
    ("strain_l_helveticus", "supplement", SUPPLEMENT_GUIDANCE, "Studied over 30 days of daily use in the cited trial."),
    ("strain_l_salivarius", "supplement", SUPPLEMENT_GUIDANCE,
     "Studied over a 14-day period per phase in the cited crossover trial."),
    ("strain_l_paracasei", "supplement", SUPPLEMENT_GUIDANCE, "Studied over a 12-week period in the cited trial."),
    ("strain_b_breve", "supplement", SUPPLEMENT_GUIDANCE,
     "Given starting about a month before delivery and continued for the infant's first 6 months of "
     "life in the cited study, not a short-term trial."),
]

COMBINING_STRAINS_NOTE = (
    "Combining several of these strains at once, including the yeast S. boulardii alongside "
    "bacterial strains, is common and studied, not just assumed safe. A 2024 randomized, "
    "double-blind, placebo-controlled trial testing prevention of antibiotic-associated diarrhea "
    "combined 7 Lactobacillus species, 5 Bifidobacterium species, Bacillus coagulans, and "
    "Saccharomyces boulardii in a single daily dose (Open Forum Infectious Diseases, 2024, "
    "https://academic.oup.com/ofid/article/11/11/ofae615/7828570). There's no documented "
    "antagonism between the strains in this catalog when taken or fermented together."
)


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    existing_columns = {row[1] for row in cur.execute("PRAGMA table_info(fermentation_strains)").fetchall()}
    for column in ("ferment_role", "ferment_guidance", "time_to_effect"):
        if column not in existing_columns:
            cur.execute(f"ALTER TABLE fermentation_strains ADD COLUMN {column} TEXT")

    cur.executemany(
        """
        UPDATE fermentation_strains
        SET ferment_role = ?, ferment_guidance = ?, time_to_effect = ?
        WHERE id = ?
        """,
        [(role, guidance, effect, strain_id) for strain_id, role, guidance, effect in FERMENT_DATA],
    )
    print(f"Updated {len(FERMENT_DATA)} fermentation_strains rows with ferment_role/ferment_guidance/time_to_effect.")

    unmatched = cur.execute(
        "SELECT id FROM fermentation_strains WHERE ferment_role IS NULL"
    ).fetchall()
    if unmatched:
        print(f"WARNING: {len(unmatched)} rows still have no ferment_role: {[r[0] for r in unmatched]}")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
