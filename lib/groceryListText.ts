// The grocery list written out as plain text (G8, 2026-09-27), for sending to
// somebody who does not have the app: a text message, WhatsApp, an email.
// Somebody with the app already has the list itself through the partner
// share, so this is only ever the words.
//
// What is left to pick up is what is sent. A line already checked off was
// bought, and a shopper handed it again would buy it twice. The lines keep
// the order they have on screen, aisle by aisle when the store is laid out.
//
// Pure: no database and no React, so scripts/test_grocery_list_text.js
// checks it directly.

import { formatMergedAmounts } from './groceryList';

export type TextListLine = {
  foodName: string;
  quantity: number;
  unit: string;
  extraAmounts: { quantity: number; unit: string }[];
  approxAmount: string | null;
  note: string | null;
  checked: boolean;
};

export type TextListSection = { title: string; items: TextListLine[] };

function lineText(item: TextListLine): string {
  const amount = item.quantity > 0 ? formatMergedAmounts({ primary: { quantity: item.quantity, unit: item.unit }, extras: item.extraAmounts }) : '';
  const parts = [item.foodName.trim()];
  if (amount) parts[0] += `: ${amount}`;
  if (item.approxAmount) parts.push(`(${item.approxAmount})`);
  let line = `- ${parts.join(' ')}`;
  if (item.note?.trim()) line += `. ${item.note.trim()}`;
  return line;
}

/** How many lines are still to pick up, for the button's caption. */
export function linesLeftToBuy(sections: TextListSection[]): number {
  return sections.reduce((sum, section) => sum + section.items.filter((item) => !item.checked).length, 0);
}

/**
 * The list as a message. The heading is the list's name, with the store
 * when one is chosen; each section with something left in it follows under
 * its aisle or category name. Answers null when everything is checked off,
 * since there is nothing to send.
 */
export function groceryListAsText(listName: string, storeName: string | null, sections: TextListSection[]): string | null {
  const blocks: string[] = [];
  for (const section of sections) {
    const left = section.items.filter((item) => !item.checked);
    if (left.length === 0) continue;
    blocks.push([section.title.trim() || 'Other', ...left.map(lineText)].join('\n'));
  }
  if (blocks.length === 0) return null;
  const store = storeName?.trim();
  const heading = store ? `${listName.trim()}, at ${store}` : listName.trim();
  return [heading, ...blocks].join('\n\n');
}

/** Said when every line is checked off and there is nothing to send. */
export const NOTHING_LEFT_TO_SEND = 'Everything on this list is checked off, so there is nothing left to send.';

/** A file name for the list on a computer, from the list's name. */
export function groceryListFileName(listName: string): string {
  const base = listName.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Grocery list';
  return `${base}.txt`;
}
