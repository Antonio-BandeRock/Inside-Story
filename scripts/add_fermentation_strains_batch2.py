"""
Expands the fermentation_strains reference catalog (see scripts/
add_fermentation_strains.py for the original 7-row build) from 7 real
strains to 18, and adds the searchable fields the Cultures & Probiotics
picker needed to become a real, browsable/searchable catalog rather than a
short fixed pill list. Direct request: "they need to be able to have a full
list of the possible choices for which probiotic to add to the yogurt
culture, and they need to be able to search for the probiotic they need to
use for whatever it is they are trying to accomplish."

Two things this script does:

1. Adds 4 new nullable columns to the existing fermentation_strains table
   (PRAGMA table_info + conditional ALTER TABLE, the same pattern
   scripts/add_interaction_rule_mechanisms.py already established for
   adding a column to an existing reference table):
   - use_cases: a short, comma-separated, plain-language list of what
     someone might actually type when searching ("infant colic", "ibs",
     "immune support"), not just the scientific name. This is the field
     that makes searching by GOAL rather than by strain name possible.
   - evidence_tier: 'strong' | 'moderate' | 'weak', matching this app's own
     standing EvidenceTier vocabulary (lib/digest/types.ts) rather than a
     second, invented scale.
   - citation_source / citation_url: a short attribution plus a real,
     individually-verified page (PubMed or a journal's own page),
     matching lib/digest/types.ts's own DigestCitation shape and its
     standing rule that a citation must be independently checkable, not
     just plausible-sounding.

2. Backfills those 4 new fields on the original 7 rows (reusing the exact
   citations those strains' own dedicated Digest entries in
   lib/digest/fermentedFoods.ts already carry -- zero new research needed
   for those 7, matching this catalog's own founding precedent), and adds
   11 new, real, individually-verified strains covering the most
   commonly-used, best-documented probiotic strains beyond the original 7 --
   the ones a home yogurt-maker is actually likely to be looking for by
   purpose (immune support, IBS, infant colic, oral health, mood/stress,
   weight management, cold prevention), not the exhaustive strain
   literature. Every citation below was independently verified via direct
   fetch of the actual paper's own page (not just trusted from a search
   summary) before being written in here -- title, journal, year, and key
   finding all cross-checked, the same discipline this app's Digest content
   already holds itself to.

Evidence tiering, applied honestly per strain rather than uniformly:
'strong' is reserved for a systematic review/meta-analysis of multiple
RCTs (L. reuteri DSM 17938's infant-colic meta-analysis, B. lactis HN019's
immune-function meta-analysis); 'moderate' is a single real RCT or
placebo-controlled trial; 'weak' is an open, non-blinded, non-placebo-
controlled trial (B. breve M-16V's eczema-prevention study is the one
strain here honestly tiered this way -- a real study with a real control
group, but not blinded, a genuine limitation named directly rather than
smoothed over).

Several new strains were tested in the cited trial as part of a two-strain
combination, not alone (L. helveticus R0052 paired with B. longum R0175;
L. paracasei 8700:2 paired with L. plantarum HEAL9; B. breve M-16V paired
with B. longum BB536) -- each description says so directly rather than
implying the cited result belongs to the single named organism alone,
matching this app's own standing evidence-honesty rule.

Deliberately NOT added this pass, named directly rather than silently
skipped: a dedicated Digest entry (lib/digest/fermentedFoods.ts) for any
of these 11 -- that's real, separate long-form writing work, a genuine
follow-up, not done here. Also not added: Lactococcus lactis (a real,
common mesophilic starter organism for buttermilk/cultured butter/some
kefir starters, but no single well-documented human-health RCT was found
for it specifically, as opposed to its role as a fermentation workhorse --
adding it here without a real citation would have broken this catalog's
own citation discipline). L. acidophilus NCFM and other named sub-strains
of species already in this catalog (L. rhamnosus, L. reuteri, etc. beyond
what's listed here) are a real, further follow-up, not exhaustive.

Safe to re-run: every write is idempotent (conditional ALTER TABLE,
INSERT ... ON CONFLICT DO UPDATE on the primary key).

Usage:
  py scripts/add_fermentation_strains_batch2.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

# (id, scientific_name, common_name, category, description, digest_entry_id,
#  use_cases, evidence_tier, citation_source, citation_url)
FERMENTATION_STRAINS = [
    # --- The original 7, backfilled with use_cases/evidence_tier/citation,
    # reusing the exact citation their own dedicated Digest entry already
    # carries (lib/digest/fermentedFoods.ts) -- scientific_name/common_name/
    # category/description/digest_entry_id are unchanged from the original
    # 2026-08-14 build.
    ("strain_l_acidophilus", "Lactobacillus acidophilus", "L. acidophilus", "Lactobacillus",
     "The most recognized yogurt culture, found in most live-culture yogurt and many commercial "
     "probiotic blends. Produces lactase during fermentation, improving lactose digestion, and has "
     "trial evidence for restoring gut flora after antibiotic use.",
     "fermented-lactobacillus-acidophilus",
     "lactose digestion, gut flora after antibiotics, general gut health, yogurt starter",
     "moderate", "Kim & Gilliland 1983, Journal of Dairy Science", "https://pubmed.ncbi.nlm.nih.gov/6409948/"),
    ("strain_l_plantarum", "Lactobacillus plantarum", "L. plantarum", "Lactobacillus",
     "A hardy, salt-tolerant strain found in sauerkraut, kimchi, and fermented olives rather than "
     "dairy. The Lp299v sub-strain has completed randomized-trial data showing improved iron "
     "absorption and reduced intestinal-inflammation markers in IBS patients.",
     "fermented-lactobacillus-plantarum",
     "ibs, intestinal inflammation, iron absorption, gut barrier, sauerkraut, kimchi, vegetable ferments",
     "moderate", "Ducrotte et al. 2012, World Journal of Gastroenterology (Lp299v IBS trial)",
     "https://pubmed.ncbi.nlm.nih.gov/22912552/"),
    ("strain_bifidobacterium", "Bifidobacterium species", "Bifidobacterium", "Bifidobacterium",
     "Dominant in a healthy infant gut, found in yogurt, kefir, and many probiotic supplements. "
     "B. bifidum specifically has mechanistic evidence for rebuilding occludin, a core tight-junction "
     "protein in the gut barrier.",
     "fermented-bifidobacterium",
     "infant gut health, gut barrier repair, tight junction support, overall gut diversity",
     "moderate", "Hsieh et al. 2015, Physiological Reports", "https://pubmed.ncbi.nlm.nih.gov/25780093/"),
    ("strain_s_thermophilus", "Streptococcus thermophilus", "S. thermophilus", "Streptococcus",
     "One of the two required starter cultures for anything legally labeled yogurt under Codex "
     "Alimentarius standards (alongside L. delbrueckii subsp. bulgaricus), unrelated to the "
     "pathogenic Streptococcus species. Notably efficient at breaking down lactose during "
     "fermentation.",
     "fermented-streptococcus-thermophilus",
     "yogurt starter culture, lactose digestion",
     "moderate", "Frontiers in Nutrition 2022, review of Codex Alimentarius CXS 243-2003",
     "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.902642/full"),
    ("strain_l_bulgaricus", "Lactobacillus delbrueckii subsp. bulgaricus", "L. bulgaricus", "Lactobacillus",
     "The other of the two required Codex Alimentarius starter cultures for yogurt, alongside "
     "S. thermophilus. Ferments milk at a warm, held temperature until it thickens and sours into "
     "yogurt's characteristic set texture.",
     None,
     "yogurt starter culture, yogurt texture and tang",
     "moderate", "Frontiers in Nutrition 2022, review of Codex Alimentarius CXS 243-2003",
     "https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2022.902642/full"),
    ("strain_l_mesenteroides", "Leuconostoc mesenteroides", "L. mesenteroides", "Leuconostoc",
     "Sauerkraut's actual first colonizer, dominating the first few days of vegetable fermentation "
     "and lowering pH enough to make conditions hospitable for the more acid-tolerant Lactobacillus "
     "species that take over later.",
     "fermented-leuconostoc-mesenteroides",
     "sauerkraut fermentation, vegetable fermentation starter",
     "moderate", "Microbiology Spectrum 2022, sauerkraut fermentation microbiome study",
     "https://journals.asm.org/doi/10.1128/spectrum.00168-22"),
    ("strain_s_boulardii", "Saccharomyces boulardii", "S. boulardii", "Yeast",
     "A probiotic yeast, not a bacterium, isolated from lychee and mangosteen fruit. It survives "
     "antibiotic courses that wipe out bacterial strains. Strong RCT evidence and multiple "
     "meta-analyses support it for preventing antibiotic-associated diarrhea and reducing "
     "C. difficile recurrence.",
     "fermented-saccharomyces-boulardii",
     "antibiotic-associated diarrhea, c difficile recurrence, post-antibiotic recovery, travel diarrhea",
     "strong", "McFarland 2010, World Journal of Gastroenterology (meta-analysis)",
     "https://pubmed.ncbi.nlm.nih.gov/20458757/"),

    # --- 11 new strains, 2026-08-27.
    ("strain_l_rhamnosus_gg", "Lactobacillus rhamnosus GG", "L. rhamnosus GG (LGG)", "Lactobacillus",
     "One of the most extensively studied single probiotic strains, first isolated in 1985 and "
     "reused across hundreds of trials since. A randomized, placebo-controlled trial in children "
     "with acute gastroenteritis found fewer repeat episodes of rotavirus diarrhea and a measurable "
     "rise in immune antibody response in the group taking it. Common in commercial yogurt and "
     "supplement blends, and one of the few strains with pediatric trial data behind it.",
     None,
     "immune support, diarrhea, rotavirus, children's gut health, antibiotic-associated diarrhea",
     "moderate", "Sindhu et al. 2014, Clinical Infectious Diseases", "https://pubmed.ncbi.nlm.nih.gov/24501384/"),
    ("strain_l_reuteri", "Lactobacillus reuteri", "L. reuteri (DSM 17938)", "Lactobacillus",
     "Best known for infant colic: a meta-analysis of 6 randomized trials in 423 infants found it "
     "measurably reduced daily crying time and shortened colic episodes within the first two to "
     "three weeks of use, though the advantage narrowed by week four. Also studied for oral health "
     "and gut comfort in adults, though the colic evidence is its strongest data by far.",
     None,
     "infant colic, fussy baby, crying reduction, infant gut health",
     "strong", "Xu et al. 2015, PLOS ONE (meta-analysis, 6 RCTs)",
     "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0141445"),
    ("strain_b_coagulans", "Bacillus coagulans", "B. coagulans (GBI-30, 6086)", "Bacillus",
     "A spore-forming organism, not a Lactobacillus or Bifidobacterium at all, which lets it survive "
     "both stomach acid and the fermentation process itself better than most strains, making it "
     "unusually shelf-stable. A small, placebo-controlled trial in IBS found significant weekly "
     "improvement in abdominal pain and bloating scores over 8 weeks of daily use.",
     None,
     "ibs, bloating, abdominal pain, shelf-stable probiotic, digestive comfort",
     "moderate", "Hun 2009, Postgraduate Medicine", "https://pubmed.ncbi.nlm.nih.gov/19332970/"),
    ("strain_b_lactis", "Bifidobacterium animalis subsp. lactis", "B. lactis (HN019 / BB-12)", "Bifidobacterium",
     "Sold commercially under a few different sub-strain names, most often HN019 and BB-12, both "
     "belonging to this same subspecies and both common in yogurt starter blends and supplement "
     "capsules. A systematic review and meta-analysis of controlled trials in healthy older adults "
     "found the HN019 sub-strain specifically produced a measurable increase in two separate "
     "markers of immune cell activity.",
     None,
     "immune support, older adults, seasonal immunity, digestive regularity, yogurt culture",
     "strong", "Miller et al. 2017, Nutrients (systematic review and meta-analysis)",
     "https://pmc.ncbi.nlm.nih.gov/articles/PMC5372854/"),
    ("strain_b_longum_35624", "Bifidobacterium longum", "B. longum 35624 (formerly B. infantis 35624)", "Bifidobacterium",
     "A specific, well-tracked sub-strain, not the whole species: a randomized, placebo-controlled "
     "trial found it eased IBS symptoms, and the improvement lined up with a normalized ratio "
     "between an anti-inflammatory and a pro-inflammatory immune signal, suggesting an immune "
     "mechanism behind the symptom relief rather than coincidence.",
     None,
     "ibs, bloating, abdominal discomfort, gut inflammation",
     "moderate", "O'Mahony et al. 2005, Gastroenterology", "https://pubmed.ncbi.nlm.nih.gov/15765388/"),
    ("strain_l_casei_shirota", "Lactobacillus casei", "L. casei (Shirota strain)", "Lactobacillus",
     "The strain behind commercial Yakult-style fermented milk drinks, most researched for immune "
     "resilience rather than digestion. A 12-week randomized trial in middle-aged office workers "
     "during winter found daily intake roughly halved the incidence of upper respiratory infections "
     "and shortened how long a cold lasted once caught.",
     None,
     "immune support, cold and flu season, upper respiratory infection, workplace wellness",
     "moderate", "Shida et al. 2017, European Journal of Nutrition",
     "https://pmc.ncbi.nlm.nih.gov/articles/PMC5290054/"),
    ("strain_l_gasseri", "Lactobacillus gasseri", "L. gasseri (SBT2055)", "Lactobacillus",
     "Studied specifically for its effect on stored abdominal fat rather than general gut health. "
     "A 12-week randomized trial in adults with elevated visceral fat found measurable reductions "
     "in visceral fat, BMI, and waist circumference in the group drinking fermented milk containing "
     "this strain, though the benefit faded once they stopped.",
     None,
     "weight management, visceral fat, metabolic health",
     "moderate", "Kadooka et al. 2013, British Journal of Nutrition",
     "https://pubmed.ncbi.nlm.nih.gov/23614897/"),
    ("strain_l_helveticus", "Lactobacillus helveticus", "L. helveticus (R0052)", "Lactobacillus",
     "Tested as a two-strain formulation paired with Bifidobacterium longum R0175, not on its own: "
     "a placebo-controlled trial found 30 days of daily use measurably lowered a marker of "
     "psychological distress in healthy adults, an early entry in the still-developing gut-brain "
     "research this app's Mental Health & Food topic covers more broadly.",
     None,
     "stress, mood, anxiety, gut-brain axis",
     "moderate", "Messaoudi et al. 2011, British Journal of Nutrition",
     "https://pubmed.ncbi.nlm.nih.gov/20974015/"),
    ("strain_l_salivarius", "Lactobacillus salivarius", "L. salivarius (WB21)", "Lactobacillus",
     "Studied for oral health specifically, not gut health. A double-blind, placebo-controlled "
     "crossover trial in people with chronic bad breath found the WB21 sub-strain measurably "
     "reduced the sulfur compounds responsible for oral odor and reduced gum pocket depth compared "
     "with placebo.",
     None,
     "oral health, bad breath, halitosis, gum health",
     "moderate", "Suzuki et al. 2014, Oral Surgery, Oral Medicine, Oral Pathology and Oral Radiology",
     "https://pubmed.ncbi.nlm.nih.gov/24556493/"),
    ("strain_l_paracasei", "Lactobacillus paracasei", "L. paracasei (8700:2)", "Lactobacillus",
     "Tested as a two-strain formulation alongside Lactobacillus plantarum HEAL9, not on its own: "
     "a 12-week randomized, placebo-controlled trial in 272 adults found the combination reduced "
     "the share who caught a common cold over the study period from 67% to 55%.",
     None,
     "immune support, common cold, cold season",
     "moderate", "Berggren et al. 2011, European Journal of Nutrition",
     "https://pubmed.ncbi.nlm.nih.gov/20803023/"),
    ("strain_b_breve", "Bifidobacterium breve", "B. breve (M-16V)", "Bifidobacterium",
     "Studied for early allergy prevention rather than general gut health, tested here alongside "
     "Bifidobacterium longum BB536. An open trial (not blinded or placebo-controlled, a "
     "limitation on how much weight to give it) gave both strains to pregnant women starting a "
     "month before delivery and to their infants for the first 6 months of life, and found a "
     "measurable drop in the risk of infant eczema by 18 months compared with unsupplemented pairs.",
     None,
     "infant eczema, allergy prevention, pregnancy and infant gut health",
     "weak", "Enomoto et al. 2014, Allergology International",
     "https://www.ncbi.nlm.nih.gov/pubmed/25056226"),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    existing_columns = {row[1] for row in cur.execute("PRAGMA table_info(fermentation_strains)").fetchall()}
    for column, ddl_type in (
        ("use_cases", "TEXT"),
        ("evidence_tier", "TEXT"),
        ("citation_source", "TEXT"),
        ("citation_url", "TEXT"),
    ):
        if column not in existing_columns:
            cur.execute(f"ALTER TABLE fermentation_strains ADD COLUMN {column} {ddl_type}")

    cur.executemany(
        """
        INSERT INTO fermentation_strains
            (id, scientific_name, common_name, category, description, digest_entry_id,
             use_cases, evidence_tier, citation_source, citation_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            scientific_name = excluded.scientific_name,
            common_name = excluded.common_name,
            category = excluded.category,
            description = excluded.description,
            digest_entry_id = excluded.digest_entry_id,
            use_cases = excluded.use_cases,
            evidence_tier = excluded.evidence_tier,
            citation_source = excluded.citation_source,
            citation_url = excluded.citation_url
        """,
        FERMENTATION_STRAINS,
    )
    print(f"Upserted {len(FERMENTATION_STRAINS)} fermentation_strains rows (7 backfilled, 11 new).")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
