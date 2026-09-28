// One tap for a glass (G34 of the competitive build plan, 2026-09-27).
// Hydration gets a row of buttons that log a drink at this minute with
// nothing to fill in, and a line saying how much caffeine the day's logged
// drinks and food add up to.
//
// Each button logs an ordinary beverage meal with one ingredient tied to a
// row of the reference food data, so the water in it reaches today's water
// total and the caffeine in it reaches the caffeine line through the same
// nutrient arithmetic every other meal goes through. Nothing here is a
// second count kept on the side.
//
// Water is logged against bottled water rather than a tap-water row: this
// app asks for filtered water everywhere it calls for water, and bottled
// water is the nearest row in the food data to a glass from a filter.
//
// The caffeine line states an amount and where it came from. It never
// calls a day's caffeine too much or fine, since what suits one person does
// not suit the next and a prescriber or a condition may set it.
//
// Pure, with no React and no database, so scripts/test_quick_drinks.js
// checks it without a phone.

export type QuickDrink = {
  key: string;
  /** The button: "Glass of water". */
  label: string;
  /** The size on the button: "250 ml". */
  sizeLabel: string;
  /** "<food_id>|<source>" in the reference food data. */
  foodId: string;
  /** The name the logged ingredient carries. */
  foodName: string;
  milliliters: number;
};

export const QUICK_DRINKS: readonly QuickDrink[] = [
  { key: 'water-glass', label: 'Glass of water', sizeLabel: '250 ml', foodId: '6647|USDA', foodName: 'Water, filtered or bottled', milliliters: 250 },
  { key: 'water-bottle', label: 'Bottle of water', sizeLabel: '500 ml', foodId: '6647|USDA', foodName: 'Water, filtered or bottled', milliliters: 500 },
  { key: 'coffee', label: 'Cup of coffee', sizeLabel: '240 ml', foodId: '4379|USDA', foodName: 'Coffee, brewed', milliliters: 240 },
  { key: 'decaf', label: 'Cup of decaf', sizeLabel: '240 ml', foodId: '4378|USDA', foodName: 'Coffee, brewed, decaffeinated', milliliters: 240 },
  { key: 'black-tea', label: 'Cup of black tea', sizeLabel: '240 ml', foodId: '5716|USDA', foodName: 'Tea, black, brewed', milliliters: 240 },
  { key: 'green-tea', label: 'Cup of green tea', sizeLabel: '240 ml', foodId: '4406|USDA', foodName: 'Tea, green, brewed', milliliters: 240 },
];

export const QUICK_DRINKS_CAPTION = 'One tap logs it now as a drink. Anything else goes through Schedule a drink or the Food tab.';

export type QuickDrinkMealInput = {
  name: string;
  mealType: 'beverage';
  eatenAt: string;
  isImmediate: true;
  ingredients: {
    foodId: string;
    foodName: string;
    category: string;
    quantity: number;
    unit: string;
    dishServings: number;
    yourSharePercent: number;
  }[];
};

function localStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The meal a tap logs. The category is the reference data's own 'Bev',
 * which is what lets a volume in ml become grams for the nutrient totals.
 */
export function quickDrinkMeal(drink: QuickDrink, now: Date): QuickDrinkMealInput {
  return {
    name: drink.label,
    mealType: 'beverage',
    eatenAt: localStamp(now),
    isImmediate: true,
    ingredients: [
      {
        foodId: drink.foodId,
        foodName: drink.foodName,
        category: 'Bev',
        quantity: drink.milliliters,
        unit: 'ml',
        dishServings: 1,
        yourSharePercent: 100,
      },
    ],
  };
}

function clock(date: Date): string {
  const hours = date.getHours();
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

/** The line under the buttons after a tap: "Logged a glass of water at 3:40 PM." */
export function loggedLine(drink: QuickDrink, at: Date): string {
  return `Logged a ${drink.label.charAt(0).toLowerCase()}${drink.label.slice(1)} at ${clock(at)}.`;
}

/**
 * Today's caffeine, from the day's food totals (milligrams, the unit the
 * reference data holds caffeine in). Null when nothing logged today carries
 * a caffeine figure at all, which is said differently from a figure of 0.
 */
export function caffeineToday(foodTotals: Record<string, number> | undefined | null): number | null {
  if (!foodTotals || !(('caffeine') in foodTotals)) return null;
  const value = foodTotals.caffeine;
  return Number.isFinite(value) ? Math.max(0, value) : null;
}

export function caffeineLine(milligrams: number | null): string {
  if (milligrams == null) return 'Caffeine today: nothing logged today carries a caffeine figure.';
  const rounded = Math.round(milligrams);
  if (rounded === 0) return 'Caffeine today: 0 mg in what you have logged.';
  return `Caffeine today: ${rounded} mg in what you have logged.`;
}

export const CAFFEINE_CAPTION =
  'Worked out from the food data for each drink and food logged today. Brew strength and cup size vary, so a cup can hold more or less than this, and anything typed in without a match in the food data is not counted.';
