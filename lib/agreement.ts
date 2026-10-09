// The first-launch agreement (X2, 2026-09-29). Before anything else, one
// screen says in plain words what Inside Story is and is not, and the
// person agrees once. The wording lives here, with the number of the
// wording it is: change a point and raise AGREEMENT_VERSION, and everyone
// who agreed to an earlier wording is asked again. What was agreed to is
// one app_meta row (lib/agreementDb.ts) holding the wording number, the
// moment, and the app version it happened in.
//
// Shown by components/FirstLaunchAgreement.tsx over the whole app, and
// readable again from Profile through app/agreement.tsx. Nothing here
// imports React or the database, so scripts/test_agreement.js checks it.

export const AGREEMENT_VERSION = 1;
export const AGREEMENT_META_KEY = 'agreement_accepted';

export const AGREEMENT_TITLE = 'Before you start';

export const AGREEMENT_INTRO =
  'Inside Story keeps your records and offers general information about food, health and daily living. Please read these points once before going on.';

export type AgreementPoint = { heading: string; body: string };

export const AGREEMENT_POINTS: readonly AgreementPoint[] = [
  {
    heading: 'It is not medical advice',
    body: 'The app offers general information and keeps what you have recorded yourself. It does not know your medical history the way your doctor does.',
  },
  {
    heading: 'It does not diagnose anything',
    body: 'A pattern the app points out is something to look into and talk over with your doctor, never a finding about your body. The app sees only what was logged, and a pattern in one person’s records can be chance.',
  },
  {
    heading: 'It does not replace your doctor or pharmacist',
    body: 'Check with your doctor before making any medical decision. Do not start, stop or change a medicine or its dose because of something in this app; that is a decision for you and your prescriber.',
  },
  {
    heading: 'Allergen-aware, never allergy-safe',
    body: 'The app can flag ingredients you have told it about, and it can miss one. A label, a recipe or a food’s data can be wrong or can change. If you have an allergy, read every label and ask when eating out.',
  },
  {
    heading: 'In an emergency, call for help',
    body: 'Call your local emergency number. Nobody watches what is entered in this app, and it cannot call anyone for you.',
  },
  {
    heading: 'Your records stay yours',
    body: 'What you record stays on your device and in a cloud folder you choose. No company server holds your health records.',
  },
];

export const AGREEMENT_BUTTON = 'I understand and agree';

export const AGREEMENT_FOOTNOTE = 'You can read this again any time from Profile, under What This App Is and Is Not.';

// The terms of use and privacy policy on lifestead.ghostead.com (X3, published
// 1.0.56.23 from docs/app-links/public/terms and /privacy; moved from
// insidestoryapp.com 2026-10-09, which now redirects here). Working drafts
// awaiting a lawyer's review before store release; the pages say so.
export const LEGAL_PAGES_LIVE = true;
export const TERMS_URL = 'https://lifestead.ghostead.com/terms/';
export const PRIVACY_URL = 'https://lifestead.ghostead.com/privacy/';

export type AgreementRecord = {
  /** Which wording was agreed to. */
  version: number;
  /** ISO timestamp of the tap. */
  agreedAt: string;
  /** The app version it happened in. */
  appVersion: string;
};

export function parseAgreement(value: string | null | undefined): AgreementRecord | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const { version, agreedAt, appVersion } = parsed as Record<string, unknown>;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
    if (typeof agreedAt !== 'string' || Number.isNaN(Date.parse(agreedAt))) return null;
    return { version, agreedAt, appVersion: typeof appVersion === 'string' ? appVersion : '' };
  } catch {
    return null;
  }
}

/** True when the person has agreed to the wording shown now. */
export function isAgreementCurrent(record: AgreementRecord | null, current: number = AGREEMENT_VERSION): boolean {
  return record !== null && record.version >= current;
}

/** Why the screen is up: a first time, or a wording that changed since. */
export function agreementReason(record: AgreementRecord | null, current: number = AGREEMENT_VERSION): 'first' | 'changed' | null {
  if (isAgreementCurrent(record, current)) return null;
  return record ? 'changed' : 'first';
}

export const AGREEMENT_CHANGED_LINE = 'The wording below has changed since you last agreed to it, so it is shown again.';

/** "Agreed on 29 September 2026, in version 1.0.56.22." */
export function agreedLine(record: AgreementRecord | null): string {
  if (!record) return 'Not agreed to on this device yet.';
  const when = new Date(record.agreedAt);
  const day = when.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  return record.appVersion ? `Agreed on ${day}, in version ${record.appVersion}.` : `Agreed on ${day}.`;
}
