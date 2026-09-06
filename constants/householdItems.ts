// Everyday non-food things a household runs out of.
//
// 2026-09-05, asked for directly: "A manual kitchen entry can be selected from
// premade everyday lists of items any household might need. We want this to be
// as free from manual writing something as we can."
//
// The food side needs no list of its own, and deliberately does not have one
// here: food_purchase_forms in the reference database is already the canonical
// set of purchasable foods, 212 of them with a category, a base name and how
// each is sold. Writing a second food list beside it would be inventing data
// that already exists, and the two would drift.
//
// Non-food had nothing, so this is it. Everything below is a consumable, the
// kind of thing that runs out and goes back on a list. Durable goods (a kettle,
// a mop handle) are deliberately absent: an inventory of things you own is a
// different feature from an inventory of things you use up, and mixing them
// would make "how much is left" meaningless for half the rows.
//
// Medicines are absent too, and that is not an oversight. Prescriptions and
// supplements are already tracked in Schedule, with real interaction rules
// behind them; a second, dumber copy here would be the more dangerous of the
// two records. Plasters and antiseptic are supplies, not doses, so they stay.
//
// `unit` is the one a person would actually say out loud for that thing, since
// the point is to reduce typing to a number.

export type HouseholdItem = {
  name: string;
  unit: string;
};

export type HouseholdGroup = {
  key: string;
  label: string;
  items: HouseholdItem[];
};

export const HOUSEHOLD_GROUPS: HouseholdGroup[] = [
  {
    key: 'cleaning',
    label: 'Cleaning',
    items: [
      { name: 'Dish soap', unit: 'bottles' },
      { name: 'Dishwasher tablets', unit: 'tablets' },
      { name: 'All-purpose cleaner', unit: 'bottles' },
      { name: 'Bathroom cleaner', unit: 'bottles' },
      { name: 'Glass cleaner', unit: 'bottles' },
      { name: 'Floor cleaner', unit: 'bottles' },
      { name: 'Bleach', unit: 'bottles' },
      { name: 'Sponges', unit: 'sponges' },
      { name: 'Scouring pads', unit: 'pads' },
      { name: 'Cleaning cloths', unit: 'cloths' },
      { name: 'Rubber gloves', unit: 'pairs' },
      { name: 'Bin liners', unit: 'liners' },
    ],
  },
  {
    key: 'paper',
    label: 'Paper & Wraps',
    items: [
      { name: 'Toilet paper', unit: 'rolls' },
      { name: 'Paper towels', unit: 'rolls' },
      { name: 'Facial tissues', unit: 'boxes' },
      { name: 'Napkins', unit: 'packs' },
      { name: 'Aluminium foil', unit: 'rolls' },
      { name: 'Cling film', unit: 'rolls' },
      { name: 'Parchment paper', unit: 'rolls' },
      { name: 'Freezer bags', unit: 'bags' },
      { name: 'Sandwich bags', unit: 'bags' },
      { name: 'Food storage containers', unit: 'containers' },
    ],
  },
  {
    key: 'laundry',
    label: 'Laundry',
    items: [
      { name: 'Laundry detergent', unit: 'bottles' },
      { name: 'Fabric softener', unit: 'bottles' },
      { name: 'Stain remover', unit: 'bottles' },
      { name: 'Dryer sheets', unit: 'sheets' },
      { name: 'Clothes pegs', unit: 'pegs' },
    ],
  },
  {
    key: 'personal',
    label: 'Personal Care',
    items: [
      { name: 'Toothpaste', unit: 'tubes' },
      { name: 'Toothbrush', unit: 'brushes' },
      { name: 'Dental floss', unit: 'packs' },
      { name: 'Mouthwash', unit: 'bottles' },
      { name: 'Shampoo', unit: 'bottles' },
      { name: 'Conditioner', unit: 'bottles' },
      { name: 'Body wash', unit: 'bottles' },
      { name: 'Bar soap', unit: 'bars' },
      { name: 'Hand soap', unit: 'bottles' },
      { name: 'Deodorant', unit: 'sticks' },
      { name: 'Razor blades', unit: 'blades' },
      { name: 'Shaving cream', unit: 'cans' },
      { name: 'Moisturiser', unit: 'bottles' },
      { name: 'Sunscreen', unit: 'bottles' },
      { name: 'Lip balm', unit: 'sticks' },
      { name: 'Cotton buds', unit: 'packs' },
      { name: 'Tissues, pocket', unit: 'packs' },
    ],
  },
  {
    key: 'firstaid',
    label: 'First Aid',
    items: [
      // Supplies rather than doses. Anything taken is tracked in Schedule,
      // where the interaction rules live.
      { name: 'Plasters', unit: 'plasters' },
      { name: 'Bandages', unit: 'bandages' },
      { name: 'Antiseptic wipes', unit: 'wipes' },
      { name: 'Antiseptic cream', unit: 'tubes' },
      { name: 'Medical tape', unit: 'rolls' },
      { name: 'Gauze pads', unit: 'pads' },
    ],
  },
  {
    key: 'household',
    label: 'Around the House',
    items: [
      { name: 'Batteries', unit: 'batteries' },
      { name: 'Light bulbs', unit: 'bulbs' },
      { name: 'Matches', unit: 'boxes' },
      { name: 'Candles', unit: 'candles' },
      { name: 'Water filter cartridges', unit: 'cartridges' },
      { name: 'Coffee filters', unit: 'filters' },
      { name: 'Air freshener', unit: 'bottles' },
      { name: 'Insect spray', unit: 'cans' },
    ],
  },
  {
    key: 'pets',
    label: 'Pets',
    items: [
      // Pet food is food, but not food this app scores or counts toward
      // anyone's nutrients, so it belongs on the non-food side.
      { name: 'Dry pet food', unit: 'kg' },
      { name: 'Wet pet food', unit: 'tins' },
      { name: 'Pet treats', unit: 'packs' },
      { name: 'Cat litter', unit: 'kg' },
      { name: 'Poop bags', unit: 'bags' },
    ],
  },
];

export const HOUSEHOLD_ITEM_COUNT = HOUSEHOLD_GROUPS.reduce((total, group) => total + group.items.length, 0);

// Everything flat, for searching across groups without the caller needing to
// know how they are grouped.
export const ALL_HOUSEHOLD_ITEMS: (HouseholdItem & { group: string })[] = HOUSEHOLD_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);
