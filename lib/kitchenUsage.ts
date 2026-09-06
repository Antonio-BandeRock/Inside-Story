// Making something: what comes out of the kitchen, and what goes back in.
//
// 2026-09-05, asked for directly: "Making the meals requires stock on hand, or
// items to be purchased based on usage and needs and requirements otherwise...
// Anything they make or grow should become part of the Kitchen inventory the
// moment they are harvested or completed."
//
// This is the piece that stops an inventory drifting. Everything before it only
// ever put stock IN (you bought it, grew it, fermented it, typed it), so the
// numbers could only climb while the cupboard emptied.
//
// TWO RULES SHAPE ALL OF IT, and both are about not destroying a record the
// person keeps by hand.
//
// It is never silent. The plan below is computed so it can be SHOWN before
// anything is written: exactly what would be taken, from where, and what is
// short. Drawing an inventory down automatically on a save would be the fastest
// way to make this feature untrustworthy, because the app cannot know whether
// someone actually cooked with their own stock or with something they picked up
// on the way home.
//
// And a shortfall is reported, never invented. If a recipe wants 340 g of
// broccoli and the kitchen holds 200 g, the plan takes 200 and says 140 is
// short. It does not refuse the whole thing, and it does not pretend the
// missing amount was there.
//
// The arithmetic itself is kitchenCoverageFor, reused rather than rewritten: it
// already answers "how much of this do I have, and what would I draw it from"
// for the grocery list, and the question is identical here.
import { kitchenCoverageFor, type KitchenDraw, type KitchenStockEntry } from './groceryList';

export type MakeIngredient = {
  foodId: string | null;
  foodName: string;
  category: string | null;
  quantity: number;
  unit: string;
};

export type MakePlanLine = {
  foodName: string;
  // What the dish asks for, in its own unit.
  needed: number;
  unit: string;
  // How much of it the kitchen can cover, in that same unit. Zero when nothing
  // matched or nothing could be converted.
  covered: number;
  // What would actually be taken, per stock row, each in THAT row's own unit,
  // since that is what its remaining quantity is counted in.
  draws: KitchenDraw[];
  status: 'full' | 'partial' | 'none';
};

export type MakePlan = {
  lines: MakePlanLine[];
  // Every ingredient fully covered. The interesting case is false, which is
  // where the shortfall becomes a shopping list.
  fullyStocked: boolean;
  // Lines with something to take. Nothing to draw down means nothing to
  // confirm, and the action should say so rather than appearing to work.
  drawableCount: number;
};

// The three levels a stock row can be found by, kept identical to the ones
// loadKitchenStock files rows under. Duplicated here would drift; imported
// keeps them one definition.
export type StockLookup = (ingredient: MakeIngredient) => KitchenStockEntry[] | undefined;

export function buildMakePlan(ingredients: MakeIngredient[], lookup: StockLookup): MakePlan {
  const lines: MakePlanLine[] = [];
  // One running tally per stock row across the whole dish. Without it, two
  // ingredients resolving to the same row would each be told they can have all
  // of it, and applying the plan would take more than exists. A soup naming
  // both "Olive Oil" and "Olive Oil (Extra Virgin)" is exactly that case.
  const alreadyClaimed = new Map<string, number>();

  for (const ingredient of ingredients) {
    if (!(ingredient.quantity > 0)) continue;
    const entries = lookup(ingredient) ?? [];
    // Each row offered only what is left of it after earlier lines took theirs.
    const available = entries
      .map((entry) => {
        const claimed = alreadyClaimed.get(`${entry.source}:${entry.id}`) ?? 0;
        return { ...entry, quantity: entry.quantity - claimed };
      })
      .filter((entry) => entry.quantity > 0);

    const coverage = kitchenCoverageFor(ingredient.quantity, ingredient.unit, available);
    for (const draw of coverage.draws) {
      const key = `${draw.source}:${draw.id}`;
      alreadyClaimed.set(key, (alreadyClaimed.get(key) ?? 0) + draw.quantity);
    }

    const covered = coverage.coveredQuantity ?? 0;
    lines.push({
      foodName: ingredient.foodName,
      needed: ingredient.quantity,
      unit: ingredient.unit,
      covered,
      draws: coverage.draws,
      // Compared with a small tolerance rather than exactly: a converted amount
      // (a kilo into grams and back) can land a hair under its own target, and
      // a line reading "partial, 0.0001 short" would be noise.
      status: covered >= ingredient.quantity - 1e-6 ? 'full' : covered > 0 ? 'partial' : 'none',
    });
  }

  return {
    lines,
    fullyStocked: lines.every((line) => line.status === 'full'),
    drawableCount: lines.filter((line) => line.draws.length > 0).length,
  };
}

// What is still needed after the kitchen has given what it can, for putting
// onto a grocery list. Only genuine shortfalls: a fully covered line has
// nothing to buy.
export function shortfallsFrom(plan: MakePlan): { foodName: string; quantity: number; unit: string }[] {
  return plan.lines
    .filter((line) => line.status !== 'full')
    .map((line) => ({
      foodName: line.foodName,
      quantity: Math.max(0, line.needed - line.covered),
      unit: line.unit,
    }));
}
