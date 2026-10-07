// The vault, the rules with no I/O in them (agreed 2026-10-06, phase 1 built
// 2026-10-07, phase 2 from 2026-10-07). Pure, so scripts/test_vault.js
// checks every decision without a phone.
//
// What it is: the part of a person's records that only a partner may ever
// see, kept closed while the app is open, so a phone left unlocked on the
// counter shows the shopping list and not the labs. It opens with the App
// Lock code or fingerprint, or with a code of its own when App Lock is off,
// and closes when the app is put away.
//
// What goes in it is the person's choice, one category at a time (direct
// instruction, 2026-10-07): "let the user decide what goes into the vault
// and what stays out." Everything HIPAA would treat as health information
// and everything about money is offered pre-ticked, and nothing is in the
// vault until somebody chooses it.
//
// Records, never tools. The vault holds what a person has stored, never the
// means of adding to it: a list of choices (the check-in tags a person made
// up), a template or a setting stays out, so every form works with the vault
// closed and only the history beside it says "in the vault".
//
// How it holds, two ways:
//
//  1. A RECORDS category is refused at the one place every read goes
//     through (attachWriteTracking in lib/databaseActivity.ts). A SELECT that
//     names one of its tables while the vault is closed is refused with
//     VaultClosedError before it reaches the database, the same way
//     SessionReadOnlyError refuses a write. Writing is never refused: a
//     check-in can be added with the vault closed, and it is then behind the
//     vault with the rest.
//
//  2. A LISTED category (medications, conditions, appointments) cannot be
//     refused at the database, because the app's tools read the same rows to
//     keep a person safe: the timing warnings read the medicines, food scoring
//     reads the conditions, the day's reminders read the appointments. Safety
//     is never hidden, by a tier or by the vault (P28). So those reads go on,
//     and the screens that SHOW the list (My Meds, the conditions list, the
//     appointments lens, past doses, a report's sections) ask
//     isCategoryClosed() and draw the band instead. Agreed 2026-10-07 with
//     the cost said out loud: a warning on a food screen still says "a
//     caution for your condition".
//
// A tool that must read a RECORDS table to work (a personal rule raising its
// warning, a family member's conditions joining the meal plan) marks its
// statement with VAULT_TOOL_READ. scripts/audit_vault_readers.js lists every
// file allowed to.
//
// The emergency card is never in the vault, by agreement: it has to be
// readable by whoever is helping.

export type VaultCategory =
  | 'symptoms'
  | 'labs'
  | 'body'
  | 'cycle'
  | 'therapy'
  | 'neuro'
  | 'experiments'
  | 'familyHealth'
  | 'medications'
  | 'conditions'
  | 'appointments'
  | 'medicalBills'
  | 'finances';

/** The order categories are listed in, health first, then money. */
export const VAULT_CATEGORIES: readonly VaultCategory[] = [
  'symptoms',
  'labs',
  'body',
  'cycle',
  'therapy',
  'neuro',
  'experiments',
  'familyHealth',
  'medications',
  'conditions',
  'appointments',
  'medicalBills',
  'finances',
];

/** Refused at the database (records), or hidden where the list is shown (listed). */
export type VaultCategoryKind = 'records' | 'listed';

export const VAULT_CATEGORY_KIND: Record<VaultCategory, VaultCategoryKind> = {
  symptoms: 'records',
  labs: 'records',
  body: 'records',
  cycle: 'records',
  therapy: 'records',
  neuro: 'records',
  experiments: 'records',
  familyHealth: 'records',
  medications: 'listed',
  conditions: 'listed',
  appointments: 'listed',
  medicalBills: 'records',
  finances: 'records',
};

/** Health information or money, which is how setup groups them. */
export const VAULT_CATEGORY_GROUP: Record<VaultCategory, 'health' | 'money'> = {
  symptoms: 'health',
  labs: 'health',
  body: 'health',
  cycle: 'health',
  therapy: 'health',
  neuro: 'health',
  experiments: 'health',
  familyHealth: 'health',
  medications: 'health',
  conditions: 'health',
  appointments: 'health',
  medicalBills: 'money',
  finances: 'money',
};

/**
 * What setup offers pre-ticked: everything HIPAA would treat as health
 * information plus everything about money, which today is every category.
 * Kept as its own list so a category added later can be offered unticked.
 */
export const VAULT_DEFAULT_CATEGORIES: readonly VaultCategory[] = VAULT_CATEGORIES;

/**
 * Every table a category's records live in. For a records category these
 * are refused while the vault is closed; for a listed category they are
 * only counted (for the offer to set the vault up) and never refused.
 * custom_checkin_tags is left out on purpose: it is the list of tags to
 * choose from, a tool, not a record.
 */
export const VAULT_TABLES: Record<VaultCategory, readonly string[]> = {
  symptoms: [
    'wellbeing_checkins',
    'checkin_body_regions',
    'checkin_tags',
    'symptom_assessments',
    'symptom_assessment_responses',
    'bowel_movements',
    'nocturia_nights',
  ],
  labs: ['lab_results', 'own_lab_tests', 'microbiome_tests', 'microbiome_results', 'health_records'],
  body: ['body_measurements'],
  cycle: ['cycle_days'],
  therapy: ['therapy_sessions'],
  neuro: ['user_neuro_profile'],
  experiments: ['personal_rules', 'food_trials', 'food_trial_task_links', 'trial_series', 'trial_series_items', 'trial_steps'],
  familyHealth: ['family_member_conditions'],
  medications: ['treatments'],
  conditions: ['user_conditions', 'user_food_allergies'],
  appointments: [],
  medicalBills: ['finance_medical_bills'],
  finances: [
    'finance_accounts',
    'finance_account_balance_history',
    'finance_entries',
    'finance_recurring',
    'finance_budgets',
    'finance_goals',
    'finance_goal_contributions',
    'finance_goal_costs',
    'finance_networth_snapshots',
    'finance_health_accounts',
    'finance_insurance_plans',
  ],
};

/** What each category is called where a person reads it. */
export const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
  symptoms: 'Symptoms, flares and check-ins',
  labs: 'Labs, home tests, microbiome and health records',
  body: 'Body measurements',
  cycle: 'Cycle',
  therapy: 'Therapy sessions',
  neuro: 'Neurodivergent profile',
  experiments: 'Personal rules and food experiments',
  familyHealth: 'Family health history',
  medications: 'Medications and supplements list',
  conditions: 'Conditions and allergies list',
  appointments: 'Appointments',
  medicalBills: 'Medical bills',
  finances: 'Finances',
};

/** How a category reads inside a sentence, always plural: "Your cycle records are in the vault." */
export const VAULT_CATEGORY_PHRASES: Record<VaultCategory, string> = {
  symptoms: 'symptoms and check-ins',
  labs: 'labs and health records',
  body: 'body measurements',
  cycle: 'cycle records',
  therapy: 'therapy sessions',
  neuro: 'neurodivergent profile notes',
  experiments: 'personal rules and food experiments',
  familyHealth: 'family health records',
  medications: 'medications and supplements',
  conditions: 'conditions and allergies',
  appointments: 'appointments',
  medicalBills: 'medical bills',
  finances: 'money records',
};

/** "Your cycle records are in the vault." or "These are in the vault: labs and health records; cycle records." */
export function vaultClosedWords(categories: readonly VaultCategory[]): string {
  const phrases = categories.map((c) => VAULT_CATEGORY_PHRASES[c]);
  if (phrases.length === 0) return 'These records are in the vault.';
  if (phrases.length === 1) return `Your ${phrases[0]} are in the vault.`;
  return `These are in the vault: ${phrases.join('; ')}.`;
}

/** One line under each category, saying what stays usable. */
export const VAULT_CATEGORY_NOTES: Partial<Record<VaultCategory, string>> = {
  medications: 'Timing warnings and today’s doses keep working. The list and past doses are what close.',
  conditions: 'Food scoring and allergy cautions keep working. The list, and the conditions named in a report, are what close.',
  appointments: 'Reminders keep coming. The appointments list is what closes.',
};

export function isVaultCategory(value: unknown): value is VaultCategory {
  return typeof value === 'string' && (VAULT_CATEGORIES as readonly string[]).includes(value);
}

/** A saved list of categories, cleaned: known names only, each once, in list order. */
export function cleanCategories(values: readonly unknown[]): VaultCategory[] {
  return VAULT_CATEGORIES.filter((category) => values.includes(category));
}

const RECORD_TABLES: readonly string[] = VAULT_CATEGORIES.filter((c) => VAULT_CATEGORY_KIND[c] === 'records').flatMap(
  (c) => VAULT_TABLES[c],
);

/** Every table that is ever refused, whichever categories are chosen. */
export const ALL_VAULT_TABLES: readonly string[] = RECORD_TABLES;

const TABLE_TO_CATEGORY = new Map<string, VaultCategory>();
for (const category of VAULT_CATEGORIES) {
  if (VAULT_CATEGORY_KIND[category] !== 'records') continue;
  for (const table of VAULT_TABLES[category]) TABLE_TO_CATEGORY.set(table, category);
}

const NAMES = new RegExp(`(?:^|[^A-Za-z0-9_])"?(${ALL_VAULT_TABLES.join('|')})"?(?![A-Za-z0-9_])`, 'gi');

/**
 * Put at the start of a statement a tool has to run whatever the vault says:
 * a personal rule raising its warning, a family member's conditions joining
 * the meal plan. Only files listed in scripts/audit_vault_readers.js may use
 * it, each with its reason.
 */
export const VAULT_TOOL_READ = '/* vault:tool */';

/**
 * The statement with string literals and comments blanked, so a vault
 * table's name inside a quoted value ('lab_results' as a word somebody
 * typed) or a comment is not read as the table. A double-quoted name is an
 * identifier in SQLite and is kept.
 */
export function stripLiteralsAndComments(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Whether a statement reads rows: SELECT, or WITH ... SELECT. A PRAGMA, a write or a CREATE is not a read. */
export function isReadStatement(sql: string): boolean {
  return /^\s*(SELECT|WITH)\b/i.test(stripLiteralsAndComments(sql));
}

/** Whether a statement carries the tool mark at its start. */
export function isToolRead(sql: string): boolean {
  return sql.trimStart().startsWith(VAULT_TOOL_READ);
}

/** The vault tables a statement names, in the order they appear, without repeats. */
export function vaultTablesIn(sql: string): string[] {
  const found: string[] = [];
  const text = stripLiteralsAndComments(sql);
  NAMES.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NAMES.exec(text)) !== null) {
    const name = match[1].toLowerCase();
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

/** The records categories a statement would read from, or an empty list when it reads nothing in the vault. */
export function vaultCategoriesRead(sql: string): VaultCategory[] {
  if (!isReadStatement(sql)) return [];
  const categories: VaultCategory[] = [];
  for (const table of vaultTablesIn(sql)) {
    const category = TABLE_TO_CATEGORY.get(table);
    if (category && !categories.includes(category)) categories.push(category);
  }
  return categories;
}

export const VAULT_CLOSED_SENTENCE = 'This is in the vault. Open the vault with your code or fingerprint to see it.';

export class VaultClosedError extends Error {
  readonly categories: VaultCategory[];
  constructor(categories: VaultCategory[]) {
    super(VAULT_CLOSED_SENTENCE);
    this.name = 'VaultClosedError';
    this.categories = categories;
  }
}

/** Whether an error is the vault saying it is closed, however it arrived. */
export function isVaultClosedError(error: unknown): boolean {
  return error instanceof VaultClosedError || (error instanceof Error && error.name === 'VaultClosedError');
}

/**
 * The refusal for a statement, or null when it may run: the vault has to be
 * guarding (chosen categories and a code to open them), closed, and the
 * statement a read naming a table in a chosen records category, without the
 * tool mark.
 */
export function vaultRefusal(
  sql: string,
  guarding: boolean,
  vaultOpen: boolean,
  chosen: readonly VaultCategory[],
): VaultClosedError | null {
  if (!guarding || vaultOpen || chosen.length === 0 || isToolRead(sql)) return null;
  const categories = vaultCategoriesRead(sql).filter((category) => chosen.includes(category));
  return categories.length ? new VaultClosedError(categories) : null;
}

// ---------------------------------------------------------------------------
// The vault's own settings (vault.json beside the lock file)
//
// Kept on this device and never in the database, for two reasons: the rule
// deciding whether a read may run cannot itself be a read, and a choice about
// who may see this phone's records belongs to this phone. Changing it on the
// computer changes the computer.

export type VaultCode = {
  kind: 'digits' | 'phrase';
  kdf: { name: 'scrypt'; N: number; r: number; p: number; salt: string };
  /** A random 32 bytes secretboxed under the code, so the right code opens it. */
  check: string;
  failedTries: number;
  lastFailedAt: number;
};

export type VaultSettings = {
  version: 1;
  /** What is in the vault. Empty means nothing is. */
  categories: VaultCategory[];
  /** The vault's own code, used only while App Lock is off. */
  code: VaultCode | null;
  /** Whether a fingerprint may open it in place of its own code. */
  biometric: boolean;
  /** When the offer to set the vault up was last made, in milliseconds, or 0. */
  offeredAt: number;
  /** The person said Stop Asking. */
  stopOffering: boolean;
  /** The setup question has been asked, whatever was answered. */
  setupAsked: boolean;
};

export const EMPTY_VAULT_SETTINGS: VaultSettings = {
  version: 1,
  categories: [],
  code: null,
  biometric: false,
  offeredAt: 0,
  stopOffering: false,
  setupAsked: false,
};

function cleanCode(value: unknown): VaultCode | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>;
  const kdf = c.kdf as Record<string, unknown> | undefined;
  if (c.kind !== 'digits' && c.kind !== 'phrase') return null;
  if (!kdf || kdf.name !== 'scrypt' || typeof kdf.salt !== 'string') return null;
  if (typeof kdf.N !== 'number' || typeof kdf.r !== 'number' || typeof kdf.p !== 'number') return null;
  if (typeof c.check !== 'string' || !c.check) return null;
  return {
    kind: c.kind,
    kdf: { name: 'scrypt', N: kdf.N, r: kdf.r, p: kdf.p, salt: kdf.salt },
    check: c.check,
    failedTries: typeof c.failedTries === 'number' ? c.failedTries : 0,
    lastFailedAt: typeof c.lastFailedAt === 'number' ? c.lastFailedAt : 0,
  };
}

/**
 * The settings in the file, or null when there is no file or it cannot be
 * read. A phase 1 lock file that said vault on, with no vault file yet, is
 * read by the caller as the phase 1 categories (vaultSettingsFromPhaseOne).
 */
export function parseVaultSettings(text: string | null): VaultSettings | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return null;
  return {
    version: 1,
    categories: cleanCategories(Array.isArray(r.categories) ? r.categories : []),
    code: cleanCode(r.code),
    biometric: r.biometric === true,
    offeredAt: typeof r.offeredAt === 'number' ? r.offeredAt : 0,
    stopOffering: r.stopOffering === true,
    setupAsked: r.setupAsked === true,
  };
}

export function serializeVaultSettings(settings: VaultSettings): string {
  return JSON.stringify(settings);
}

/** The nine categories phase 1 held, for a phone that switched the vault on before phase 2. */
export const PHASE_ONE_CATEGORIES: readonly VaultCategory[] = [
  'symptoms',
  'labs',
  'body',
  'cycle',
  'therapy',
  'neuro',
  'experiments',
  'medicalBills',
  'familyHealth',
];

export function vaultSettingsFromPhaseOne(): VaultSettings {
  return { ...EMPTY_VAULT_SETTINGS, categories: [...PHASE_ONE_CATEGORIES], setupAsked: true };
}

/** What opens the vault right now: the App Lock code, its own code, or nothing yet. */
export type VaultKey = 'app-lock' | 'own-code' | 'none';

export function vaultKey(appLockOn: boolean, settings: VaultSettings): VaultKey {
  if (appLockOn) return 'app-lock';
  return settings.code ? 'own-code' : 'none';
}

/** Whether the vault is closing anything: categories are chosen and something opens it. */
export function vaultGuarding(appLockOn: boolean, settings: VaultSettings): boolean {
  return settings.categories.length > 0 && vaultKey(appLockOn, settings) !== 'none';
}

// ---------------------------------------------------------------------------
// The offer to set the vault up later (direct instruction, 2026-10-07)
//
// "If they choose no security, the app should provide a notification once
// every so often to offer to secure the vault later after they build up some
// data for it." Once there are VAULT_OFFER_AFTER_RECORDS records in the
// categories setup would have pre-ticked, and no oftener than every
// VAULT_OFFER_EVERY_DAYS, until the vault is guarding or the person says
// Stop Asking.

export const VAULT_OFFER_AFTER_RECORDS = 20;
export const VAULT_OFFER_EVERY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldOfferVault(
  settings: VaultSettings,
  appLockOn: boolean,
  recordCount: number,
  now: number,
): boolean {
  if (settings.stopOffering) return false;
  if (vaultGuarding(appLockOn, settings)) return false;
  if (recordCount < VAULT_OFFER_AFTER_RECORDS) return false;
  if (settings.offeredAt > now) return true; // a clock that moved backwards
  return now - settings.offeredAt >= VAULT_OFFER_EVERY_DAYS * DAY_MS;
}

/** The offer is shown, never queued, so it carries an id of its own that no reconcile cancels. */
export const VAULT_OFFER_NOTIFICATION_ID = 'inside-story-vault-offer';

/**
 * The tables counted for the offer: one per kind of record, leaving out the
 * rows that only hang off another row (a check-in's body regions, a test's
 * results), so the number it names is a number of things somebody recorded.
 */
export const VAULT_COUNTED_TABLES: readonly string[] = [
  'wellbeing_checkins',
  'symptom_assessments',
  'bowel_movements',
  'nocturia_nights',
  'lab_results',
  'own_lab_tests',
  'microbiome_tests',
  'health_records',
  'body_measurements',
  'cycle_days',
  'therapy_sessions',
  'personal_rules',
  'food_trials',
  'family_member_conditions',
  'treatments',
  'user_conditions',
  'user_food_allergies',
  'finance_medical_bills',
  'finance_accounts',
  'finance_entries',
  'finance_goals',
  'finance_insurance_plans',
];

/** The offer arrives in the day, never at night or first thing. */
export function vaultOfferHourOk(at: Date): boolean {
  const hour = at.getHours();
  return hour >= 10 && hour < 20;
}

/** The words of the offer, which name how many records and never what they are. */
export function vaultOfferText(recordCount: number): { title: string; body: string } {
  return {
    title: 'Your vault has no code yet',
    body: `You have ${recordCount} health and money records anyone holding this phone can open. Set up the vault to keep them closed until your code or fingerprint opens them.`,
  };
}

/**
 * What the person is told when they put a category in the vault and nothing
 * opens it yet (direct instruction, 2026-10-07: "the app should say directly
 * they don't have the security turned on yet, and would they like to turn it
 * on now?").
 */
export const VAULT_NO_CODE_SENTENCE =
  'Your vault has no code yet, so anything you put in it is still open to anyone holding this phone. Turn it on now?';
