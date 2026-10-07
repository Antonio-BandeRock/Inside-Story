// The vault, the rules with no I/O in them (agreed 2026-10-06, phase 1 built
// 2026-10-07). Pure, so scripts/test_vault.js checks every decision without
// a phone.
//
// What it is: the part of a person's records that only a partner may ever
// see, kept closed while the app is open, so a phone left unlocked on the
// counter shows the shopping list and not the labs. It opens with the App
// Lock code or fingerprint and closes when the app is put away.
//
// How it holds: not by encrypting rows a second time, since the whole file
// is already encrypted by App Lock, but at the one place every read goes
// through (attachWriteTracking in lib/databaseActivity.ts). A SELECT that
// names a vault table while the vault is closed is refused with
// VaultClosedError before it reaches the database, the same way
// SessionReadOnlyError refuses a write. Writing is not refused: a check-in
// can be added with the vault closed, the way a capture is sealed over the
// lock screen, and it is then behind the vault with the rest.
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
  | 'medicalBills'
  | 'familyHealth';

/** Every table in the vault, by the category a partner can be shown one at a time. */
export const VAULT_TABLES: Record<VaultCategory, readonly string[]> = {
  symptoms: [
    'wellbeing_checkins',
    'checkin_body_regions',
    'checkin_tags',
    'custom_checkin_tags',
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
  medicalBills: ['finance_medical_bills'],
  familyHealth: ['family_member_conditions'],
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
  medicalBills: 'Medical bills',
  familyHealth: 'Family health history',
};

export const ALL_VAULT_TABLES: readonly string[] = Object.values(VAULT_TABLES).flat();

const TABLE_TO_CATEGORY = new Map<string, VaultCategory>();
for (const [category, tables] of Object.entries(VAULT_TABLES) as [VaultCategory, readonly string[]][]) {
  for (const table of tables) TABLE_TO_CATEGORY.set(table, category);
}

const NAMES = new RegExp(`(?:^|[^A-Za-z0-9_])"?(${ALL_VAULT_TABLES.join('|')})"?(?![A-Za-z0-9_])`, 'gi');

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

/** The categories a statement would read from, or an empty list when it reads nothing in the vault. */
export function vaultCategoriesRead(sql: string): VaultCategory[] {
  if (!isReadStatement(sql)) return [];
  const categories: VaultCategory[] = [];
  for (const table of vaultTablesIn(sql)) {
    const category = TABLE_TO_CATEGORY.get(table);
    if (category && !categories.includes(category)) categories.push(category);
  }
  return categories;
}

export const VAULT_CLOSED_SENTENCE = 'This is in the vault. Open the vault with your App Lock code or fingerprint to see it.';

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
 * The refusal for a statement, or null when it may run: the vault has to
 * be switched on, closed, and the statement a read naming one of its tables.
 */
export function vaultRefusal(sql: string, vaultOn: boolean, vaultOpen: boolean): VaultClosedError | null {
  if (!vaultOn || vaultOpen) return null;
  const categories = vaultCategoriesRead(sql);
  return categories.length ? new VaultClosedError(categories) : null;
}
