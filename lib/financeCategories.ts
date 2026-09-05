// The vocabulary Finances speaks in: what a bill can be, what income can
// be, and how often either repeats.
//
// Added 2026-09-05, the first real area inside the Life tab. Direct
// request: "Finances is much larger than just tracking a few numbers.
// Match life against finances in a logical way, setup for the average
// person and the average things they would have for bills and charges."
//
// This is app-level UI vocabulary, not researched or cited reference
// content, so it lives as a plain TS constant rather than a bundled
// database table, the same reasoning lib/checkinTags.ts and
// lib/therapyTypes.ts already carry for their own picklists.
//
// The category list is deliberately the ordinary shape of an ordinary
// household rather than an accountant's chart of accounts. Someone should
// be able to open this, see the thing they pay for, and pick it without
// deciding which abstraction it belongs to. Two groups (Health, Food) are
// finer-grained than the rest on purpose: those are the two this app
// already knows real things about, and they are where its own data can
// meet a person's money.

export type FinanceDirection = 'income' | 'expense';

// How often something repeats, and where in the month or week it lands,
// both live in lib/financeSchedule.ts as a single DueRule. They used to be
// a FinanceCadence here plus a due_day on the row, which is the same fact
// written twice and could not express "the 2nd Tuesday" or "every 3
// weeks" at all. See that file's header for why it replaced this.

// --- Categories -------------------------------------------------------------

export type FinanceCategoryGroup =
  | 'home'
  | 'utilities'
  | 'health'
  | 'food'
  | 'transport'
  | 'debt'
  | 'everyday'
  | 'setAside'
  | 'other';

export const CATEGORY_GROUP_LABELS: Record<FinanceCategoryGroup, string> = {
  home: 'Home',
  utilities: 'Utilities',
  health: 'Health',
  food: 'Food',
  transport: 'Getting Around',
  debt: 'Money Owed',
  everyday: 'Everyday',
  setAside: 'Set Aside',
  other: 'Other',
};

export type FinanceCategoryDefinition = {
  code: string;
  label: string;
  group: FinanceCategoryGroup;
  // True where this app already collects real, dated money of this kind
  // somewhere else. Shown in the UI so the person understands why a figure
  // they never typed is appearing, and so nobody double-enters what is
  // already being counted. See lib/financeDb.ts's own rollup for what is
  // actually read, and note that nothing is copied into the finance tables
  // to make this work.
  alreadyTracked?: 'groceries' | 'therapies';
};

export const FINANCE_EXPENSE_CATEGORIES: FinanceCategoryDefinition[] = [
  // Home
  { code: 'housing', label: 'Rent or mortgage', group: 'home' },
  { code: 'property_tax', label: 'Property tax', group: 'home' },
  { code: 'home_insurance', label: 'Home or renters insurance', group: 'home' },
  { code: 'household', label: 'Household supplies & repairs', group: 'home' },

  // Utilities
  { code: 'electricity', label: 'Electricity', group: 'utilities' },
  { code: 'gas_heating', label: 'Gas or heating', group: 'utilities' },
  { code: 'water_sewer', label: 'Water, sewer & trash', group: 'utilities' },
  { code: 'internet', label: 'Internet', group: 'utilities' },
  { code: 'phone', label: 'Phone', group: 'utilities' },

  // Health -- finer-grained than the rest, because this is the app's own
  // subject and because these are the costs someone managing a condition
  // actually watches month to month.
  { code: 'health_insurance', label: 'Health insurance', group: 'health' },
  { code: 'medical_care', label: 'Doctor & dental visits', group: 'health' },
  { code: 'prescriptions', label: 'Prescriptions', group: 'health' },
  { code: 'supplements', label: 'Supplements', group: 'health' },
  { code: 'therapies', label: 'Hands-on therapies', group: 'health', alreadyTracked: 'therapies' },

  // Food
  { code: 'groceries', label: 'Groceries', group: 'food', alreadyTracked: 'groceries' },
  { code: 'dining_out', label: 'Eating out & takeaway', group: 'food' },
  { code: 'garden_supplies', label: 'Garden & growing supplies', group: 'food' },

  // Getting Around
  { code: 'car_payment', label: 'Car payment', group: 'transport' },
  { code: 'fuel', label: 'Fuel or charging', group: 'transport' },
  { code: 'car_insurance', label: 'Car insurance', group: 'transport' },
  { code: 'car_upkeep', label: 'Maintenance & registration', group: 'transport' },
  { code: 'transit', label: 'Transit, rides & parking', group: 'transport' },

  // Money Owed
  { code: 'credit_cards', label: 'Credit card payments', group: 'debt' },
  { code: 'student_loans', label: 'Student loans', group: 'debt' },
  { code: 'other_loans', label: 'Other loans', group: 'debt' },

  // Everyday
  { code: 'subscriptions', label: 'Subscriptions & memberships', group: 'everyday' },
  { code: 'personal_care', label: 'Personal care', group: 'everyday' },
  { code: 'clothing', label: 'Clothing', group: 'everyday' },
  { code: 'pets', label: 'Pets', group: 'everyday' },
  { code: 'childcare', label: 'Childcare & school', group: 'everyday' },
  { code: 'entertainment', label: 'Entertainment & outings', group: 'everyday' },
  { code: 'gifts_giving', label: 'Gifts & giving', group: 'everyday' },

  // Set Aside -- money leaving the account that is not actually spent.
  // Kept as its own group rather than mixed in with bills so the Overview
  // can say what was saved without calling it an expense.
  { code: 'savings', label: 'Savings', group: 'setAside' },
  { code: 'retirement', label: 'Retirement', group: 'setAside' },
  { code: 'emergency_fund', label: 'Emergency fund', group: 'setAside' },

  { code: 'other_expense', label: 'Something else', group: 'other' },
];

export const FINANCE_INCOME_CATEGORIES: FinanceCategoryDefinition[] = [
  { code: 'wages', label: 'Job or wages', group: 'other' },
  { code: 'self_employment', label: 'Self-employment', group: 'other' },
  { code: 'benefits', label: 'Disability, SSI or other benefits', group: 'other' },
  { code: 'pension', label: 'Pension or retirement income', group: 'other' },
  { code: 'support', label: 'Child support or alimony', group: 'other' },
  { code: 'investment', label: 'Investment or rental income', group: 'other' },
  { code: 'other_income', label: 'Something else', group: 'other' },
];

// The two groups whose money leaving the account is not spending. Used by
// the Overview so "set aside" is reported separately from what was
// consumed, which is the difference between a tight month and a good one.
export const SET_ASIDE_GROUP: FinanceCategoryGroup = 'setAside';

const ALL_CATEGORIES = [...FINANCE_EXPENSE_CATEGORIES, ...FINANCE_INCOME_CATEGORIES];

export function financeCategoriesFor(direction: FinanceDirection): FinanceCategoryDefinition[] {
  return direction === 'income' ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES;
}

export function getFinanceCategory(code: string): FinanceCategoryDefinition | undefined {
  return ALL_CATEGORIES.find((entry) => entry.code === code);
}

export function financeCategoryLabel(code: string): string {
  return getFinanceCategory(code)?.label ?? code;
}

export function financeCategoryGroup(code: string): FinanceCategoryGroup {
  return getFinanceCategory(code)?.group ?? 'other';
}

// Expense categories arranged by group, in the declared order, for a
// picker that should read the way a person's own life is arranged rather
// than alphabetically.
export function expenseCategoriesByGroup(): {
  group: FinanceCategoryGroup;
  label: string;
  categories: FinanceCategoryDefinition[];
}[] {
  const groups: FinanceCategoryGroup[] = ['home', 'utilities', 'health', 'food', 'transport', 'debt', 'everyday', 'setAside', 'other'];
  return groups
    .map((group) => ({
      group,
      label: CATEGORY_GROUP_LABELS[group],
      categories: FINANCE_EXPENSE_CATEGORIES.filter((entry) => entry.group === group),
    }))
    .filter((entry) => entry.categories.length > 0);
}
