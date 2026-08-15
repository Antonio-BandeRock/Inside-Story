"""
Patches the already-built assets/data/foods_reference.db with a real, new
fermentation-strain reference layer -- Phase 1 of the curated-recipe-library
expansion, direct request: "generate a mocked up 1 week schedule...
fermentations of drinks and of foods like yogurts using specific bacteria
and probiotics." Confirmed directly (via AskUserQuestion) that real
strain-level tracking should be built now, not just described in prose.

Two new reference tables, patching the compiled .db directly -- same
approach as scripts/add_my_meds_reference_data.py; see that script's own
docstring for why this is the right move in this environment.

1. `fermentation_strains` -- a real, small strain catalog, seeded with
   exactly 7 rows. Every one is reused directly from already-published,
   already-cited in-app content: the 6 dedicated strain-profile entries in
   lib/digest/fermentedFoods.ts (L. acidophilus, L. plantarum,
   Bifidobacterium species, S. thermophilus, L. mesenteroides,
   S. boulardii), plus L. delbrueckii subsp. bulgaricus (already named and
   Codex Alimentarius-cited in lib/digest/fermentationMethods.ts's own
   yogurt-definition entry, with no dedicated Digest entry of its own).
   Zero new research was done to populate this table -- every description
   below is a compressed, faithful restatement of text this app already
   published and already independently verified.

2. `curated_recipe_strains` -- a real (recipe_id, strain_id) link table, a
   genuine same-file FK against both curated_recipes and fermentation_strains
   (both live in this same reference database, unlike the local-app-side
   fermentation_batch_strains table -- see lib/db.ts's own
   initializeDatabase() for that one, added separately since it links to a
   real user's own local fermentations row, which has no place in bundled
   reference content). Left empty by this script -- populated once Phase 2's
   own new curated fermentation recipes exist to reference it.

Deliberately NOT added this pass, named directly rather than silently
skipped: L. reuteri, L. gasseri, B. coagulans, L. rhamnosus, L. salivarius --
named in this app's own history (a standalone 2026-08-05 strain-guide
Artifact) but never folded into in-app Digest content, and not
independently re-verified this pass. A real, separate follow-up.

Deliberately does NOT touch lib/referenceDbVersion.ts -- that file's own
real, accumulated history (every prior bump appends a new dated comment
block by hand rather than the file being wholesale regenerated) is edited
directly once, covering both this script's changes and Phase 2's curated
recipes together, not bumped separately per script run.

Safe to re-run: every write is idempotent (CREATE TABLE IF NOT EXISTS,
INSERT ... ON CONFLICT DO UPDATE on the primary key).

Usage:
  py scripts/add_fermentation_strains.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# (id, scientific_name, common_name, category, description, digest_entry_id)
FERMENTATION_STRAINS = [
    ("strain_l_acidophilus", "Lactobacillus acidophilus", "L. acidophilus", "Lactobacillus",
     "The most recognized yogurt culture, found in most live-culture yogurt and many commercial "
     "probiotic blends. Produces lactase during fermentation, improving lactose digestion, and has "
     "real trial evidence for restoring gut flora after antibiotic use.",
     "fermented-lactobacillus-acidophilus"),
    ("strain_l_plantarum", "Lactobacillus plantarum", "L. plantarum", "Lactobacillus",
     "A hardy, salt-tolerant strain found in sauerkraut, kimchi, and fermented olives rather than "
     "dairy. The Lp299v sub-strain has completed randomized-trial data showing improved iron "
     "absorption and reduced intestinal-inflammation markers in IBS patients.",
     "fermented-lactobacillus-plantarum"),
    ("strain_bifidobacterium", "Bifidobacterium species", "Bifidobacterium", "Bifidobacterium",
     "Dominant in a healthy infant gut, found in yogurt, kefir, and many probiotic supplements. "
     "B. bifidum specifically has mechanistic evidence for rebuilding occludin, a core tight-junction "
     "protein in the gut barrier.",
     "fermented-bifidobacterium"),
    ("strain_s_thermophilus", "Streptococcus thermophilus", "S. thermophilus", "Streptococcus",
     "One of the two required starter cultures for anything legally labeled yogurt under Codex "
     "Alimentarius standards (alongside L. delbrueckii subsp. bulgaricus), unrelated to the "
     "pathogenic Streptococcus species. Notably efficient at breaking down lactose during "
     "fermentation.",
     "fermented-streptococcus-thermophilus"),
    ("strain_l_bulgaricus", "Lactobacillus delbrueckii subsp. bulgaricus", "L. bulgaricus", "Lactobacillus",
     "The other of the two required Codex Alimentarius starter cultures for yogurt, alongside "
     "S. thermophilus -- ferments milk at a warm, held temperature until it thickens and sours into "
     "yogurt's characteristic set texture.",
     None),
    ("strain_l_mesenteroides", "Leuconostoc mesenteroides", "L. mesenteroides", "Leuconostoc",
     "Sauerkraut's actual first colonizer, dominating the first few days of vegetable fermentation "
     "and lowering pH enough to make conditions hospitable for the more acid-tolerant Lactobacillus "
     "species that take over later.",
     "fermented-leuconostoc-mesenteroides"),
    ("strain_s_boulardii", "Saccharomyces boulardii", "S. boulardii", "Yeast",
     "A probiotic yeast, not a bacterium, isolated from lychee and mangosteen fruit -- survives "
     "antibiotic courses that wipe out bacterial strains. Strong RCT evidence and multiple "
     "meta-analyses support it for preventing antibiotic-associated diarrhea and reducing "
     "C. difficile recurrence.",
     "fermented-saccharomyces-boulardii"),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS fermentation_strains (
            id TEXT PRIMARY KEY,
            scientific_name TEXT NOT NULL,
            common_name TEXT,
            category TEXT,
            description TEXT NOT NULL,
            digest_entry_id TEXT
        )
        """
    )
    cur.executemany(
        """
        INSERT INTO fermentation_strains
            (id, scientific_name, common_name, category, description, digest_entry_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            scientific_name = excluded.scientific_name,
            common_name = excluded.common_name,
            category = excluded.category,
            description = excluded.description,
            digest_entry_id = excluded.digest_entry_id
        """,
        FERMENTATION_STRAINS,
    )
    print(f"Upserted {len(FERMENTATION_STRAINS)} fermentation_strains rows.")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS curated_recipe_strains (
            recipe_id TEXT NOT NULL,
            strain_id TEXT NOT NULL,
            PRIMARY KEY (recipe_id, strain_id),
            FOREIGN KEY (recipe_id) REFERENCES curated_recipes(id),
            FOREIGN KEY (strain_id) REFERENCES fermentation_strains(id)
        )
        """
    )
    print("Ensured curated_recipe_strains table exists (populated by Phase 2's own fermentation recipes).")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
