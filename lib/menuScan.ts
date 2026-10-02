// Read a Menu (G27, 2026-10-02): a photo of a restaurant menu read on the
// phone (lib/ocr.ts, the same on-device ML Kit read a scanned label
// uses), split into dishes, and each dish's words run through the same
// ingredient check a label gets (checkIngredients, lib/ingredientFlags.ts).
//
// Limited by design, and the words say so. A menu names a few of what goes
// into a dish and leaves out the oil, the stock, the marinade and whatever
// the kitchen thickens a sauce with, so a dish with nothing matched is
// "nothing on your lists in what the menu says", never safe, and the
// caption ends with asking the kitchen. Only reasons that touch what the
// person set (tone 'yours') are shown; an additive is not on a menu.
// Reading a menu with a model rather than word lists is Z3.
//
// Pure, with one import, so scripts/test_menu_scan.js checks it without
// a phone.
import { checkIngredients, type IngredientCheckSettings, type IngredientReason } from './ingredientFlags';

export type MenuDish = {
  /** The first line of the dish as the menu prints it, price taken off. */
  title: string;
  /** The lines under it, joined. */
  description: string;
};

export type CheckedDish = MenuDish & {
  /** One per list, in the order checkIngredients sorts them. */
  reasons: IngredientReason[];
};

// A price at the end of a line: "12", "12.50", "$12", "12,50 €", "MX$180".
const TRAILING_PRICE = /\s*(?:[A-Z]{0,3}[$€£¥]\s*)?\d{1,4}(?:[.,]\d{2})?\s*(?:[$€£¥]|eur|usd|mxn|pesos?)?\s*$/i;
const ONLY_PRICE = /^\s*(?:[A-Z]{0,3}[$€£¥]\s*)?\d{1,4}(?:[.,]\d{2})?\s*(?:[$€£¥]|eur|usd|mxn|pesos?)?\s*$/i;
// Lines that are about the menu rather than a dish.
const NOT_A_DISH =
  /\b(menu|gratuity|service charge|tax(es)? included|prices? (in|include)|please (inform|ask|let)|consuming raw|allerg(y|ies|en) (information|notice)|vegetarian option|wi-?fi|open daily|www\.|https?:|@)\b/i;

function letters(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length;
}

function isHeading(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  return words.length <= 3 && line === line.toUpperCase() && /\p{L}/u.test(line);
}

/**
 * The menu split into dishes. A blank line starts a new dish, and so does
 * the line after one that ends in a price. A short line in capitals
 * standing alone ("STARTERS") is a section heading and is left out.
 */
export function splitMenu(menuText: string): MenuDish[] {
  const lines = menuText.replace(/\r\n?/g, '\n').split('\n').map((line) => line.replace(/\s+/g, ' ').trim());
  const blocks: string[][] = [];
  let current: string[] = [];
  const close = () => {
    if (current.length > 0) blocks.push(current);
    current = [];
  };
  for (const line of lines) {
    if (line.length === 0) {
      close();
      continue;
    }
    if (ONLY_PRICE.test(line)) {
      close();
      continue;
    }
    const priced = TRAILING_PRICE.test(line) && letters(line) > 0;
    const text = priced ? line.replace(TRAILING_PRICE, '').replace(/[.\s…·-]+$/u, '').trim() : line;
    if (text) current.push(text);
    if (priced) close();
  }
  close();

  const dishes: MenuDish[] = [];
  for (const block of blocks) {
    const kept = block.filter((line) => letters(line) >= 3 && !NOT_A_DISH.test(line));
    if (kept.length === 0) continue;
    if (kept.length === 1 && isHeading(kept[0])) continue;
    // A heading over the first dish of its section, printed with no blank line.
    const start = kept.length > 1 && isHeading(kept[0]) && !isHeading(kept[1]) ? 1 : 0;
    const [title, ...rest] = kept.slice(start);
    dishes.push({ title, description: rest.join(' ') });
  }
  return dishes;
}

// Dish words a label never uses: on a menu each usually means wheat flour,
// unless the menu names another grain ("rice noodles", "corn tortillas").
// Checked only for someone who has set gluten, the way the label's gluten
// check is, and worded as "usually", since a kitchen can make any of them
// without wheat.
const WHEAT_DISH_WORDS = [
  'bread', 'breaded', 'crouton', 'croutons', 'pasta', 'spaghetti', 'linguine', 'fettuccine', 'penne', 'ravioli',
  'lasagna', 'lasagne', 'gnocchi', 'noodle', 'noodles', 'ramen', 'udon', 'dumpling', 'dumplings', 'tempura',
  'battered', 'batter', 'pastry', 'pie', 'crust', 'pizza', 'naan', 'pita', 'flatbread', 'bun', 'brioche',
  'croissant', 'tortilla', 'tortillas', 'wrap', 'empanada', 'empanadas', 'gravy', 'roux', 'cake', 'pancake',
  'pancakes', 'waffle', 'waffles', 'crepe', 'crepes', 'biscuit', 'biscuits', 'sandwich', 'burger', 'beer',
];
const NOT_WHEAT_BEFORE =
  /\b(rice|corn|maize|gluten[- ]free|gf|glass|cellophane|sweet potato|potato|cassava|tapioca|lettuce|cauliflower|zucchini|courgette|chickpea|lentil|bean)\s*$/i;
const GLUTEN_ALLERGY = /\b(wheat|gluten)\b/i;

function holdsGluten(settings: IngredientCheckSettings): boolean {
  return (
    settings.dietTags.includes('Gluten-Free') ||
    settings.conditions.includes('celiac') ||
    settings.allergies.some((name) => GLUTEN_ALLERGY.test(name))
  );
}

/** The first wheat dish word in the text with no other grain named before it. */
export function findWheatDishWord(text: string): string | null {
  for (const word of WHEAT_DISH_WORDS) {
    const pattern = new RegExp(`(^|[^\\p{L}])(${word})(?![\\p{L}])`, 'giu');
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(0, (match.index ?? 0) + match[1].length);
      if (!NOT_WHEAT_BEFORE.test(before)) return match[2];
    }
  }
  return null;
}

/** Each dish with the reasons its words touch what the person set. */
export function checkMenu(menuText: string, settings: IngredientCheckSettings): CheckedDish[] {
  return splitMenu(menuText).map((dish) => {
    const words = dish.description ? `${dish.title}, ${dish.description}` : dish.title;
    const seen = new Set<string>();
    const reasons: IngredientReason[] = [];
    for (const row of checkIngredients(words, settings)) {
      for (const reason of row.reasons) {
        if (reason.tone !== 'yours') continue;
        const key = `${reason.kind}|${reason.label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        reasons.push(reason);
      }
    }
    if (holdsGluten(settings) && !reasons.some((reason) => reason.kind === 'gluten')) {
      const dishWord = findWheatDishWord(words);
      if (dishWord) {
        reasons.push({
          kind: 'gluten',
          label: 'Usually made with wheat',
          matched: dishWord,
          why: 'On a menu this word usually means wheat flour, unless the kitchen makes it another way. Worth asking.',
          tone: 'yours',
        });
      }
    }
    return { ...dish, reasons };
  });
}

// ---------------------------------------------------------------------------
// Words

export const MENU_BAND_TITLE = 'Read a Menu';

export const MENU_INTRO =
  'Photograph a menu, or type or paste what it says, and each dish is checked for words that touch what you set in Profile: allergies, conditions, eating style and food restrictions.';

export const MENU_TEXT_HINT = 'A blank line between dishes helps. Change anything the photo read wrongly, and the check runs again.';

export const MENU_NO_DISHES_LINE = 'Nothing here reads as a dish yet. Put each dish on a line of its own, with a blank line between them.';

export const MENU_NOTHING_SET_LINE =
  'Nothing is set in Profile to check against: no allergies, conditions, eating style or food restrictions. Set any of them and each dish is read for them.';

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/** The line above the dishes. */
export function describeMenuCheck(dishes: CheckedDish[]): string {
  if (dishes.length === 0) return MENU_NO_DISHES_LINE;
  const touched = dishes.filter((dish) => dish.reasons.length > 0).length;
  const lead = `${countWord(dishes.length)} ${dishes.length === 1 ? 'dish' : 'dishes'} read.`;
  if (touched === 0) return `${lead} None of them names anything on your lists, in the words the menu uses.`;
  const rest = dishes.length - touched;
  const touchedPart = `${countWord(touched)} ${touched === 1 ? 'names' : 'name'} something on your lists`;
  if (rest === 0) return `${lead} ${touchedPart}.`;
  return `${lead} ${touchedPart}, and ${countWord(rest).toLowerCase()} ${rest === 1 ? 'names' : 'name'} nothing on them.`;
}

/** Under a dish with no reasons. Never "safe": a menu leaves most of a dish unsaid. */
export const MENU_DISH_CLEAR_LINE = 'Nothing on your lists in what the menu says.';

/** One line per reason on a dish: "A gluten grain: noodles". */
export function describeMenuReason(reason: IngredientReason): string {
  return `${reason.label}: ${reason.matched}`;
}

export const MENU_CAPTION =
  'Limited, and allergen-aware rather than allergy-safe. A menu names a few of what goes into a dish and leaves out the oil, the stock, the marinade and whatever thickens a sauce, and the photo can misread a word. Anything you react to is a question for the kitchen before you order.';
