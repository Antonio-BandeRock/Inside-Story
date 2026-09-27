// Starter lists to copy, C13 of the competitive build plan (Phase 2,
// 2026-09-26). Ready-made routines for the hard starts (the taxes, a move, a
// doctor visit, one room) and upkeep for a kitchen and a bathroom. They are
// offered and never added by themselves: nothing here is written anywhere
// until the person picks one, and what gets written is an ordinary routine or
// upkeep item they can change or remove like any other. Pure data, so
// scripts/test_starter_lists.js can read it without a phone.

import type { BuiltInOccasion } from './routines';

export type StarterRoutine = {
  key: string;
  name: string;
  occasion: BuiltInOccasion;
  /** One line under the name in the picker. */
  about: string;
  steps: string[];
};

export type StarterUpkeep = {
  key: string;
  name: string;
  /** Months between doings, a working figure the person can change. */
  intervalMonths: number;
  notes: string | null;
};

export type StarterUpkeepGroup = {
  key: string;
  label: string;
  items: StarterUpkeep[];
};

export const STARTER_ROUTINES: StarterRoutine[] = [
  {
    key: 'taxes',
    name: 'Doing the taxes',
    occasion: 'other',
    about: 'The paperwork in the order it is needed.',
    steps: [
      "Find last year's return",
      'Gather the income statements from work, banks and pensions',
      'Gather receipts for anything that can be claimed',
      'Note what changed this year: a move, a job, a birth, a death',
      'Fill it in, or take the pile to whoever does it',
      'Read it over once before it goes',
      'Send it and keep a copy with the receipts',
    ],
  },
  {
    key: 'moving',
    name: 'Moving house',
    occasion: 'other',
    about: 'The parts of a move that are easy to forget until after.',
    steps: [
      'Book the day and whoever is helping',
      'Arrange for post to follow you',
      'Give the new address to the bank, doctor, pharmacy, insurance and work',
      'Arrange the power, water and internet at both ends',
      'Pack one room at a time and write the room on each box',
      'Pack a first-night box: medicines, chargers, toiletries, sheets',
      'Take the meter readings on the day',
      'Hand back the keys',
    ],
  },
  {
    key: 'doctorVisit',
    name: 'Before a doctor visit',
    occasion: 'other',
    about: 'So the questions get asked while you are in the room.',
    steps: [
      'Write down what you want to ask, most important first',
      'Note what has changed since the last visit, and roughly when',
      'Bring the list of medicines and supplements, with doses',
      'Bring recent lab results, or a report from Reports',
      'Check the time, the address and anything you were told to bring',
      'Afterwards, write down what was said and any new dates',
    ],
  },
  {
    key: 'oneRoom',
    name: 'One room, top to bottom',
    occasion: 'other',
    about: 'Cleaning a room in an order that does not undo itself.',
    steps: [
      'Put a bag down for rubbish',
      'Put anything that lives elsewhere into one basket',
      'Clear the surfaces',
      'Dust from the top down',
      'Wipe the surfaces',
      'Floors last',
      'Take the bag out and empty the basket where things go',
    ],
  },
  {
    key: 'morningStart',
    name: 'Getting going in the morning',
    occasion: 'morning',
    about: 'A short start to change to fit.',
    steps: ['A glass of water', 'Morning medicines', 'Get dressed', 'Breakfast', "Look at today's list"],
  },
  {
    key: 'leaving',
    name: 'Leaving the house',
    occasion: 'leaving',
    about: 'The check at the door.',
    steps: [
      'Keys, phone, wallet',
      "Any medicines for while you're out",
      'Water bottle',
      'Cooker off, windows shut',
      'Lock the door',
    ],
  },
  {
    key: 'windDown',
    name: 'Winding down',
    occasion: 'bedtime',
    about: 'Setting up tomorrow before sleep.',
    steps: [
      'Phone on charge',
      "Set out tomorrow's things",
      'Evening medicines',
      'Water by the bed',
      'Lights off',
    ],
  },
];

export const STARTER_UPKEEP: StarterUpkeepGroup[] = [
  {
    key: 'kitchen',
    label: 'Kitchen',
    items: [
      { key: 'fridgeClean', name: 'Clear out and wipe the fridge', intervalMonths: 1, notes: 'Check the dates while it is empty.' },
      { key: 'dishwasherFilter', name: 'Clean the dishwasher filter', intervalMonths: 1, notes: null },
      { key: 'microwave', name: 'Clean the microwave', intervalMonths: 1, notes: null },
      { key: 'kettle', name: 'Descale the kettle', intervalMonths: 3, notes: 'Sooner where the water is hard.' },
      { key: 'hoodFilter', name: 'Degrease the cooker hood filter', intervalMonths: 3, notes: null },
      { key: 'oven', name: 'Clean the oven', intervalMonths: 3, notes: null },
      { key: 'waterFilter', name: 'Change the water filter', intervalMonths: 6, notes: 'Or as often as the maker says.' },
      { key: 'fridgeCoils', name: 'Vacuum the fridge coils', intervalMonths: 12, notes: 'Unplug it first.' },
    ],
  },
  {
    key: 'bathroom',
    label: 'Bathroom',
    items: [
      { key: 'showerCurtain', name: 'Wash the shower curtain or clean the screen', intervalMonths: 1, notes: null },
      { key: 'bathMat', name: 'Wash the bath mat', intervalMonths: 1, notes: null },
      { key: 'showerHead', name: 'Descale the shower head', intervalMonths: 3, notes: null },
      { key: 'drains', name: 'Clear the drains', intervalMonths: 3, notes: null },
      { key: 'toothbrush', name: 'New toothbrush or brush heads', intervalMonths: 3, notes: null },
      { key: 'extractorFan', name: 'Clean the extractor fan', intervalMonths: 6, notes: 'Power off at the switch first.' },
      { key: 'seals', name: 'Check the seals and grout', intervalMonths: 12, notes: 'Look for gaps and black spots round the bath and shower.' },
    ],
  },
];

/** The starter upkeep items not already on the person's list, matched by
 *  name without regard to case, so copying twice does not make two. */
export function upkeepAlreadyHeld(name: string, heldNames: string[]): boolean {
  const wanted = name.trim().toLowerCase();
  return heldNames.some((held) => held.trim().toLowerCase() === wanted);
}

/** A routine name that does not clash with one the person already has:
 *  "Moving house", then "Moving house 2", and so on. */
export function freeRoutineName(name: string, heldNames: string[]): string {
  const held = new Set(heldNames.map((n) => n.trim().toLowerCase()));
  if (!held.has(name.trim().toLowerCase())) return name;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${name} ${n}`;
    if (!held.has(candidate.toLowerCase())) return candidate;
  }
  return name;
}
