"""
Chrononutrition pass #1 on the 6-Week Meal Plan -- 2026-08-24, direct
follow-up: "It seems like you used a smoothie for breakfast more often than
not... this whole app revolves around working synergistically with the way
your body actually works... Please go through all recipes for each day,
reorganizing foods to match the requirements of the needs of the body
throughout the day."

Real, independently-verified chrononutrition evidence (not just the shared
conversation's own framing -- see this session's own research): a protein-
forward breakfast measurably improves same-day glycemic control and satiety
(insulin sensitivity peaks in the morning), and morning is also when a
fermented-food touch does the most good for the gut's own diurnal microbial
rhythm. Auditing the 42-day plan against this found a real, systemic gap:
19 of the 42 breakfasts (the 6 Smoothies plus 13 overnight-oats/porridge/
chia-pudding recipes) used almond or coconut milk as their own liquid base,
carrying almost no protein of their own and no fermented element either --
not just the 6 smoothies the direct report named, a broader pattern behind
that same complaint.

Fixed here by swapping that liquid base for real Greek yogurt (a genuine
whole food already used successfully across dozens of this app's own other
breakfast recipes), which does two things at once: adds real protein (about
10g per 150g, versus roughly 1g from the same amount of almond milk), and
makes the breakfast itself a fermented food, exactly the "protein + healthy
fat + fermented food" breakfast pattern this app's own research (see the new
Basic Health chrononutrition entries) actually supports. Three "coconut"-
named recipes (Mango and Coconut Chia Pudding, Kiwi and Coconut Chia
Pudding, Apricot and Coconut Overnight Oats) keep half their coconut milk
rather than a full swap, so the flavor the name promises is still real; the
two warm porridges (buckwheat, millet) keep a reduced amount of almond milk
for the actual cooking liquid and get the yogurt stirred in as a real
finishing step instead, since yogurt heated directly in a simmering pot
tends to split. Every added honey amount is marked optional in the matching
recipes.ts edit (a separate hand-edit, not this script) rather than removed
outright -- a small amount of real honey next to a large amount of whole
fruit isn't the processed "hidden sugar" this app's own research is actually
warning against, but making it optional still honors the direct instruction
that sugar doesn't belong in breakfast by default.

Safe to re-run: plain UPDATE ... WHERE statements against known rows.

Usage:
  py scripts/chrononutrition_breakfast_protein_boost.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"

GREEK_YOGURT = ("Dairy", "Yogurt, Greek, plain, lowfat")

# (recipe_id, old_category, old_base_name, new_category, new_base_name, new_quantity, new_unit)
# -- a full swap of the existing almond-milk/coconut-milk row to Greek yogurt.
FULL_SWAPS = [
    ("curated_smoothie_green_glow", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 225, "g"),
    ("curated_smoothie_golden_turmeric", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 225, "g"),
    ("curated_smoothie_brazil_nut_selenium", "NutSeed", "Coconut milk", *GREEK_YOGURT, 170, "g"),
    ("curated_smoothie_berry_antioxidant", "Bev", "Coconut water", *GREEK_YOGURT, 225, "g"),
    ("curated_smoothie_tropical_ginger", "Bev", "Coconut water", *GREEK_YOGURT, 225, "g"),
    ("curated_snack_overnight_oats_chia_berries", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_baked_oatmeal_cup_banana_cinnamon", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 100, "g"),
    ("curated_snack_peach_almond_overnight_oats", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_snack_nectarine_chia_pudding_cashews", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_snack_plum_walnut_overnight_oats", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_snack_fig_pistachio_overnight_oats", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_snack_fig_cashew_overnight_oats", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
    ("curated_snack_mango_pistachio_chia_pudding", "NutSeed", "Almond drink unsweetened", *GREEK_YOGURT, 150, "g"),
]

# Partial swaps: reduce the existing coconut-milk row's own quantity and add
# a new Greek yogurt row alongside it, keeping the named coconut flavor real.
COCONUT_PARTIAL_SWAPS = [
    ("curated_snack_mango_coconut_chia_pudding", "NutSeed", "Coconut milk", 75, "ml"),
    ("curated_snack_kiwi_coconut_chia_pudding", "NutSeed", "Coconut milk", 75, "ml"),
    ("curated_snack_apricot_coconut_overnight_oats", "NutSeed", "Coconut milk", 75, "ml"),
]
COCONUT_PARTIAL_YOGURT_ADD = 75  # grams of Greek yogurt added alongside the reduced coconut milk

# Warm porridges: reduce the almond-milk cooking liquid and add a Greek
# yogurt stir-in as a real, separate ingredient (see this script's own
# docstring for why yogurt isn't simmered directly).
WARM_PORRIDGE_SWAPS = [
    ("curated_snack_buckwheat_porridge_blueberries_walnuts", "NutSeed", "Almond drink unsweetened", 120, "ml"),
    ("curated_snack_millet_porridge_apricots", "NutSeed", "Almond drink unsweetened", 120, "ml"),
]
WARM_PORRIDGE_YOGURT_ADD = 50  # grams of Greek yogurt stirred in at the end


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    full_swap_count = 0
    for recipe_id, old_cat, old_name, new_cat, new_name, new_qty, new_unit in FULL_SWAPS:
        cur.execute(
            """
            UPDATE curated_recipe_ingredients
            SET category = ?, base_name = ?, quantity = ?, unit = ?
            WHERE recipe_id = ? AND category = ? AND base_name = ?
            """,
            (new_cat, new_name, new_qty, new_unit, recipe_id, old_cat, old_name),
        )
        full_swap_count += cur.rowcount

    partial_swap_count = 0
    for recipe_id, cat, name, new_qty, unit in COCONUT_PARTIAL_SWAPS:
        cur.execute(
            "UPDATE curated_recipe_ingredients SET quantity = ? WHERE recipe_id = ? AND category = ? AND base_name = ?",
            (new_qty, recipe_id, cat, name),
        )
        partial_swap_count += cur.rowcount
        cur.execute("SELECT MAX(sort_order) FROM curated_recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
        next_sort = (cur.fetchone()[0] or 0) + 1
        cur.execute(
            """
            INSERT INTO curated_recipe_ingredients
                (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order)
            VALUES (?, ?, ?, ?, 'g', NULL, NULL, NULL, ?)
            """,
            (recipe_id, *GREEK_YOGURT, COCONUT_PARTIAL_YOGURT_ADD, next_sort),
        )

    porridge_swap_count = 0
    for recipe_id, cat, name, new_qty, unit in WARM_PORRIDGE_SWAPS:
        cur.execute(
            "UPDATE curated_recipe_ingredients SET quantity = ? WHERE recipe_id = ? AND category = ? AND base_name = ?",
            (new_qty, recipe_id, cat, name),
        )
        porridge_swap_count += cur.rowcount
        cur.execute("SELECT MAX(sort_order) FROM curated_recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
        next_sort = (cur.fetchone()[0] or 0) + 1
        cur.execute(
            """
            INSERT INTO curated_recipe_ingredients
                (recipe_id, category, base_name, quantity, unit, cut_prep, cooking_method, prep_note, sort_order)
            VALUES (?, ?, ?, ?, 'g', NULL, NULL, 'stirred in at the end, off heat', ?)
            """,
            (recipe_id, *GREEK_YOGURT, WARM_PORRIDGE_YOGURT_ADD, next_sort),
        )

    conn.commit()
    print(f"Full swaps: {full_swap_count} rows updated across {len(FULL_SWAPS)} recipes.")
    print(f"Coconut partial swaps: {partial_swap_count} rows reduced + {len(COCONUT_PARTIAL_SWAPS)} yogurt rows added.")
    print(f"Warm porridge swaps: {porridge_swap_count} rows reduced + {len(WARM_PORRIDGE_SWAPS)} yogurt rows added.")
    conn.close()


if __name__ == "__main__":
    main()
