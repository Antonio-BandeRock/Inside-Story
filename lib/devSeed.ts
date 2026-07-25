// Seeds one realistic full day (breakfast/lunch/dinner, real USDA foods,
// portions sized to land in a normal, comfortably-covered-but-not-excessive
// range against common adult RDAs -- checked by hand against actual
// per-100g values before writing this, not guessed) -- built purely to
// have real data to look at while designing the Today's 6 Dimensions / Today's
// Nutrients flyouts. This is a throwaway dev tool, not a feature: delete
// this file and its call site once real usage data exists.
import { createMeal, type MealIngredientInput } from './db';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(hour)}:${pad(minute)}`;
}

type SeedItem = Pick<MealIngredientInput, 'foodId' | 'foodName' | 'category' | 'quantity' | 'unit'>;

// Stamps the shared side-level fields (group key, name, cooking method,
// single-person-serving math) onto every item in the side -- the same
// denormalized-onto-every-row pattern the real builder already uses.
function side(groupKey: string, sideName: string, cookingMethod: string, items: SeedItem[]): MealIngredientInput[] {
  return items.map((item) => ({
    ...item,
    dishName: groupKey,
    sideName,
    cookingMethod,
    dishServings: 1,
    yourSharePercent: 100,
  }));
}

export async function seedTestDay(): Promise<void> {
  await createMeal({
    name: 'Scrambled eggs with spinach + Oatmeal with blueberries and walnuts + Greek yogurt',
    mealType: 'breakfast',
    eatenAt: todayAt(8, 0),
    isImmediate: false,
    ingredients: [
      ...side('bf_eggs', 'Scrambled eggs with spinach', 'Sauteed', [
        { foodId: '4676|USDA', foodName: 'Egg, whole', category: 'Dairy', quantity: 2, unit: 'each' },
        { foodId: '951|USDA', foodName: 'Spinach', category: 'Veg', quantity: 30, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
      ]),
      ...side('bf_oatmeal', 'Oatmeal with blueberries and walnuts', 'Boiled', [
        { foodId: '4150|USDA', foodName: 'Cereals, oats', category: 'Grain', quantity: 40, unit: 'g' },
        { foodId: '668|USDA', foodName: 'Blueberries', category: 'Fruit', quantity: 75, unit: 'g' },
        { foodId: '2675|USDA', foodName: 'Nuts, walnuts', category: 'NutSeed', quantity: 10, unit: 'g' },
      ]),
      ...side('bf_yogurt', 'Greek yogurt', 'Raw / No Cooking', [
        { foodId: '3353|USDA', foodName: 'Yogurt, Greek', category: 'Dairy', quantity: 170, unit: 'g' },
      ]),
    ],
  });

  await createMeal({
    name: 'Grilled chicken breast + Brown rice with broccoli and carrots + Romaine and chickpea salad',
    mealType: 'lunch',
    eatenAt: todayAt(12, 30),
    isImmediate: false,
    ingredients: [
      ...side('ln_chicken', 'Grilled chicken breast', 'Grilled', [
        { foodId: '4023|USDA', foodName: 'Chicken, broiler or fryers', category: 'Meat', quantity: 150, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
        { foodId: '1719|USDA', foodName: 'Garlic', category: 'Veg', quantity: 3, unit: 'g' },
      ]),
      ...side('ln_rice', 'Brown rice with broccoli and carrots', 'Steamed', [
        { foodId: '1364|USDA', foodName: 'Rice, brown', category: 'Grain', quantity: 150, unit: 'g' },
        { foodId: '2868|USDA', foodName: 'Broccoli', category: 'Veg', quantity: 80, unit: 'g' },
        { foodId: '1007|USDA', foodName: 'Carrots', category: 'Veg', quantity: 60, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
      ]),
      ...side('ln_salad', 'Romaine and chickpea salad', 'Raw / No Cooking', [
        { foodId: '1736|USDA', foodName: 'Lettuce, cos or romaine', category: 'Veg', quantity: 60, unit: 'g' },
        { foodId: '6245|USDA', foodName: 'Chickpeas', category: 'Legume', quantity: 80, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
      ]),
    ],
  });

  await createMeal({
    name: 'Baked salmon + Roasted sweet potato + Steamed green beans + Avocado',
    mealType: 'dinner',
    eatenAt: todayAt(18, 30),
    isImmediate: false,
    ingredients: [
      ...side('dn_salmon', 'Baked salmon', 'Baked', [
        { foodId: '4490|USDA', foodName: 'Fish, salmon', category: 'Fish', quantity: 150, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
        { foodId: '1719|USDA', foodName: 'Garlic', category: 'Veg', quantity: 3, unit: 'g' },
      ]),
      ...side('dn_potato', 'Roasted sweet potato', 'Roasted', [
        { foodId: '971|USDA', foodName: 'Sweet potato', category: 'Veg', quantity: 150, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
      ]),
      ...side('dn_beans', 'Steamed green beans', 'Steamed', [
        { foodId: '991|USDA', foodName: 'Snap Beans', category: 'Veg', quantity: 100, unit: 'g' },
        { foodId: '3902|USDA', foodName: 'Oil, olive', category: 'Fats', quantity: 5, unit: 'g' },
      ]),
      ...side('dn_avocado', 'Avocado', 'Raw / No Cooking', [
        { foodId: '4194|USDA', foodName: 'Avocados', category: 'Fruit', quantity: 1, unit: 'each' },
      ]),
    ],
  });
}
