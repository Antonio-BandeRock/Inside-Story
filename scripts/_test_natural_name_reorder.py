"""
Standalone test/report driver for natural_name_reorder.py. Reads directly
from the read-only assets/data/foods_reference.db, runs every distinct
comma-containing base_name (across all 7 sources) through
reorder_base_name(), and prints/saves aggregate stats + samples.

Does NOT modify the database. Not part of the build pipeline.
"""
import collections
import sqlite3
import sys

sys.path.insert(0, "scripts")
from natural_name_reorder import reorder_base_name

DB_PATH = "assets/data/foods_reference.db"
SOURCES = ["USDA", "UK_CoFID", "Japan_MEXT", "Germany_BLS", "Canada_CNF",
           "France_Ciqual", "Australia_AFCD"]


def main():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    overall_action_counts = collections.Counter()
    per_source_action_counts = collections.defaultdict(collections.Counter)
    examples_by_action = collections.defaultdict(list)
    all_rows = []

    for source in SOURCES:
        cur.execute(
            "SELECT DISTINCT base_name FROM foods WHERE source = ? AND base_name LIKE '%,%' ORDER BY base_name",
            (source,),
        )
        names = [r[0] for r in cur.fetchall()]
        for name in names:
            r = reorder_base_name(name, source=source)
            overall_action_counts[r["action"]] += 1
            per_source_action_counts[source][r["action"]] += 1
            all_rows.append((source, r))
            if len(examples_by_action[r["action"]]) < 400:
                examples_by_action[r["action"]].append((source, r["input"], r["output"], r["reason"]))

    total = sum(overall_action_counts.values())
    print(f"TOTAL distinct comma-containing base_names across all 7 sources: {total}\n")
    print("=== Overall action breakdown ===")
    for action, count in overall_action_counts.most_common():
        pct = 100.0 * count / total
        print(f"  {action:24s} {count:5d}  ({pct:5.1f}%)")

    print("\n=== Per-source breakdown ===")
    for source in SOURCES:
        counts = per_source_action_counts[source]
        src_total = sum(counts.values())
        print(f"\n{source} (total {src_total}):")
        for action, count in counts.most_common():
            print(f"    {action:24s} {count:5d}")

    changed_total = sum(c for a, c in overall_action_counts.items()
                         if a in ("flip", "join", "parenthetical", "replace"))
    print(f"\n=== Coverage summary ===")
    print(f"Transformed (flip/join/parenthetical/replace): {changed_total} ({100.0*changed_total/total:.1f}%)")
    print(f"Left unchanged (all skip_* + not_applicable): {total - changed_total} ({100.0*(total-changed_total)/total:.1f}%)")

    # Dump full examples per action to files for manual review.
    import os
    outdir = "scripts/_reorder_samples"
    os.makedirs(outdir, exist_ok=True)
    for action, examples in examples_by_action.items():
        with open(os.path.join(outdir, f"{action}.txt"), "w", encoding="utf-8") as f:
            for source, inp, out, reason in examples:
                f.write(f"[{source}] {inp!r} -> {out!r}   ({reason})\n")

    # Also dump ALL flip/join/parenthetical transformations (not just first 400) for full review
    with open(os.path.join(outdir, "ALL_transformed.txt"), "w", encoding="utf-8") as f:
        for source, r in all_rows:
            if r["action"] in ("flip", "join", "parenthetical", "replace"):
                f.write(f"[{source}] {r['input']} -> {r['output']}\n")

    with open(os.path.join(outdir, "ALL_skipped.txt"), "w", encoding="utf-8") as f:
        for source, r in all_rows:
            if r["action"] not in ("flip", "join", "parenthetical", "replace"):
                f.write(f"[{source}] {r['action']:20s} {r['input']}\n")

    print(f"\nWrote per-action samples + full ALL_transformed.txt / ALL_skipped.txt to {outdir}/")


if __name__ == "__main__":
    main()
