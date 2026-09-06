// What someone else needs to know when you cannot tell them.
//
// Built 2026-09-05. Life's fifth area, and the second half of the answer to
// what else Life should hold.
//
// THE MOST IMPORTANT THING IN THIS FILE IS A WARNING, NOT A FEATURE.
//
// An app on a locked phone is NOT reachable by a paramedic. Nobody is going to
// find this. If someone comes away believing this replaces a bracelet, a wallet
// card, or the medical ID screen a phone already has, they are worse off than before
// they started, because they will have stopped carrying the thing that does
// work.
//
// So that is said first, plainly, on the screen and not in a footnote, and
// NOT_A_MEDICAL_ALERT below is the wording. This is a record to show someone,
// read out, or hand over. It is useful for a spouse, a neighbour, an intake
// desk, a new doctor. It is not an alert system.
//
// WHAT WAS ALREADY HERE, AND THE ONE THING THAT WAS NOT.
//
// The app already holds tracked conditions, active medications with doses, food
// allergies, and healing stage. None of it is reachable by anyone but the
// person, which is the gap this closes: it assembles what exists rather than
// asking for it twice.
//
// Checked rather than assumed, and it turned up the field that matters most:
// the app tracks FOOD allergies and has no concept of a DRUG allergy at all.
// A penicillin allergy is not a food allergy, and on an emergency card it is
// arguably the single highest-stakes line there is. That gap is closed here.
//
// TWO RULES THIS FILE HOLDS.
//
// 1. Nothing is inferred, ever. Drug allergies especially are exactly what the
//    person typed, because this is text a clinician may act on within minutes.
//    No autocomplete from a food allergy, no guessing from a medication.
//
// 2. Staleness is stated. A card listing a medication stopped six months ago is
//    worse than no card, so every reading carries how long since it was last
//    confirmed, and says plainly when that is too long ago to trust. Same rule
//    the kitchen inventory already holds about an amount nothing decrements.

export const NOT_A_MEDICAL_ALERT =
  'Read this first: nobody is going to find this in an emergency. It is on your phone, behind a lock, in an app. A paramedic will not open it. This is a record to show someone, read out, or hand over, and it is useful for that. It is not a substitute for a bracelet, a card in your wallet, or the medical ID screen your phone already has, and if it replaces one of those you are worse off than before.';

export const DIRECTIVE_NOTE =
  'Only where the document is, never what it says. A wish recorded in an app is not a legal document and nothing here carries any weight on its own. What helps is someone being able to find the real one quickly.';

// --- The parts ---------------------------------------------------------------

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string | null;
  phone: string;
  /** The one to try first. Exactly one is primary, enforced on write. */
  primary: boolean;
  notes: string | null;
};

export type EmergencyProfile = {
  /** Exactly what was typed. Never inferred from anything. */
  drugAllergies: string | null;
  bloodType: string | null;
  /** Pacemaker, pump, port, stent. Matters for imaging and for defibrillation. */
  devices: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
  preferredHospital: string | null;
  /** What you can actually be spoken to in, which matters a great deal if you
   *  are not in your first language where you live. */
  language: string | null;
  /** That a directive exists and where it is. Never its contents. */
  directiveLocation: string | null;
  otherNotes: string | null;
  /** When the person last said all of this was still right. */
  confirmedAt: string | null;
};

/** Pulled from what the app already holds, rather than asked for again. */
export type EmergencyFromApp = {
  displayName: string | null;
  conditions: string[];
  medications: { name: string; dose: string | null }[];
  foodAllergies: string[];
};

// --- Freshness --------------------------------------------------------------

/** Beyond a quarter, a medication list is worth re-reading before anyone acts
 *  on it. A stated judgment call, not a derived figure. */
export const CONFIRM_WITHIN_DAYS = 90;

export type Freshness = {
  confirmedAt: string | null;
  daysSince: number | null;
  stale: boolean;
  neverConfirmed: boolean;
};

export function freshness(confirmedAt: string | null, today: string): Freshness {
  if (!confirmedAt) return { confirmedAt: null, daysSince: null, stale: true, neverConfirmed: true };
  const a = Date.parse(`${confirmedAt.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { confirmedAt, daysSince: null, stale: true, neverConfirmed: false };
  }
  const daysSince = Math.round((b - a) / 86400000);
  return { confirmedAt, daysSince, stale: daysSince > CONFIRM_WITHIN_DAYS, neverConfirmed: false };
}

export function describeFreshness(value: Freshness): string {
  if (value.neverConfirmed) {
    return 'Never confirmed. Until you have been through it once and said it is right, treat everything here as unchecked.';
  }
  if (value.daysSince == null) return 'The date this was confirmed cannot be read, so treat it as unchecked.';
  if (value.daysSince <= 0) return 'Confirmed today.';
  if (!value.stale) {
    return `Confirmed ${value.daysSince} ${value.daysSince === 1 ? 'day' : 'days'} ago.`;
  }
  const months = Math.round(value.daysSince / 30);
  return `Last confirmed about ${months} ${months === 1 ? 'month' : 'months'} ago. Medications change, so go through it before anyone relies on it.`;
}

// --- What is missing, ranked by how much it actually matters -----------------
//
// Ordered deliberately rather than alphabetically or by field order. A
// checklist that treats every gap as equally urgent teaches someone to ignore
// it, and one of these is genuinely close to worthless in a hospital.

export type EssentialGap = {
  code: string;
  label: string;
  why: string;
};

export const ESSENTIALS_IN_ORDER: { code: string; label: string; why: string }[] = [
  {
    code: 'drugAllergies',
    label: 'Drug allergies',
    why: 'The one thing here most likely to change what someone does in the next ten minutes. Nothing else in this app records it, since food allergies are a different thing.',
  },
  {
    code: 'contact',
    label: 'Someone to call',
    why: 'One name and one number. Everything else on this list is easier once there is a person who can answer questions.',
  },
  {
    code: 'medications',
    label: 'Current medications',
    why: 'Already here from My Meds, so this only shows as missing if nothing is recorded as active.',
  },
  {
    code: 'conditions',
    label: 'Conditions',
    why: 'Already here from your Profile, for the same reason.',
  },
  {
    code: 'devices',
    label: 'Implants or devices',
    why: 'A pacemaker, a pump, a port. Changes what scans are safe and what someone does before shocking a heart.',
  },
  {
    code: 'language',
    label: 'Language',
    why: 'What you can be spoken to in. Matters more than most people expect if you live somewhere your first language is not the local one.',
  },
  {
    code: 'doctor',
    label: 'Your doctor',
    why: 'Someone who already knows your history and can be phoned for it.',
  },
  {
    code: 'directive',
    label: 'Where an advance directive is',
    why: 'Only if you have one. Where it is, never what it says.',
  },
  {
    code: 'bloodType',
    label: 'Blood type',
    why: 'Worth having, and the least useful thing on this list: a hospital types and crossmatches your blood itself rather than taking the word of an app. Do not put off the rest of this for it.',
  },
];

export function missingEssentials(input: {
  profile: EmergencyProfile;
  fromApp: EmergencyFromApp;
  contactCount: number;
}): EssentialGap[] {
  const { profile, fromApp, contactCount } = input;
  const present: Record<string, boolean> = {
    drugAllergies: !!profile.drugAllergies?.trim(),
    contact: contactCount > 0,
    medications: fromApp.medications.length > 0,
    conditions: fromApp.conditions.length > 0,
    devices: !!profile.devices?.trim(),
    language: !!profile.language?.trim(),
    doctor: !!profile.doctorName?.trim() || !!profile.doctorPhone?.trim(),
    directive: !!profile.directiveLocation?.trim(),
    bloodType: !!profile.bloodType?.trim(),
  };
  return ESSENTIALS_IN_ORDER.filter((entry) => !present[entry.code]);
}

export function describeMissing(gaps: EssentialGap[]): string {
  if (gaps.length === 0) {
    return 'Everything on the list has something in it. Whether it is still right is a different question, which is what confirming it is for.';
  }
  const first = gaps[0];
  const rest = gaps.length - 1;
  return rest > 0
    ? `${first.label} is the gap worth closing first. ${rest} other ${rest === 1 ? 'thing is' : 'things are'} empty too.`
    : `${first.label} is the only thing still empty.`;
}

// --- The card itself, as text someone can be shown or handed ----------------

/**
 * Plain text, deliberately. It can be read off a screen, shared, or copied into
 * a message, and it survives being pasted anywhere.
 *
 * Empty fields are left OUT rather than printed as blanks. A card reading
 * "Drug allergies: none recorded" is dangerous in a way "no line at all" is
 * not: the first reads as "no allergies" to someone scanning it in a hurry,
 * which is a claim this app is in no position to make.
 */
export function buildEmergencyCard(input: {
  profile: EmergencyProfile;
  fromApp: EmergencyFromApp;
  contacts: EmergencyContact[];
  today: string;
}): string {
  const { profile, fromApp, contacts, today } = input;
  const lines: string[] = [];

  lines.push('IN AN EMERGENCY');
  if (fromApp.displayName) lines.push(fromApp.displayName);
  lines.push('');

  if (profile.drugAllergies?.trim()) {
    // First, and in caps, because it is the line most likely to change what
    // someone does immediately.
    lines.push(`DRUG ALLERGIES: ${profile.drugAllergies.trim()}`);
    lines.push('');
  }

  if (contacts.length > 0) {
    lines.push('CALL');
    const ordered = [...contacts].sort((a, b) => Number(b.primary) - Number(a.primary));
    for (const contact of ordered) {
      const who = contact.relationship?.trim() ? `${contact.name} (${contact.relationship.trim()})` : contact.name;
      lines.push(`- ${who}: ${contact.phone}${contact.primary ? ' (try first)' : ''}`);
    }
    lines.push('');
  }

  if (fromApp.conditions.length > 0) {
    lines.push('CONDITIONS');
    for (const condition of fromApp.conditions) lines.push(`- ${condition}`);
    lines.push('');
  }

  if (fromApp.medications.length > 0) {
    lines.push('TAKING NOW');
    for (const med of fromApp.medications) {
      lines.push(`- ${med.name}${med.dose ? ` (${med.dose})` : ''}`);
    }
    lines.push('');
  }

  if (profile.devices?.trim()) {
    lines.push(`IMPLANTS OR DEVICES: ${profile.devices.trim()}`);
    lines.push('');
  }
  if (fromApp.foodAllergies.length > 0) {
    lines.push(`FOOD ALLERGIES: ${fromApp.foodAllergies.join(', ')}`);
    lines.push('');
  }
  if (profile.bloodType?.trim()) lines.push(`Blood type: ${profile.bloodType.trim()}`);
  if (profile.language?.trim()) lines.push(`Speaks: ${profile.language.trim()}`);
  if (profile.doctorName?.trim() || profile.doctorPhone?.trim()) {
    const parts = [profile.doctorName?.trim(), profile.doctorPhone?.trim()].filter(Boolean);
    lines.push(`Doctor: ${parts.join(', ')}`);
  }
  if (profile.preferredHospital?.trim()) lines.push(`Hospital: ${profile.preferredHospital.trim()}`);
  if (profile.directiveLocation?.trim()) {
    lines.push(`Advance directive is kept: ${profile.directiveLocation.trim()}`);
  }
  if (profile.otherNotes?.trim()) {
    lines.push('');
    lines.push(profile.otherNotes.trim());
  }

  const fresh = freshness(profile.confirmedAt, today);
  lines.push('');
  // The provenance line goes on the card itself rather than only on the screen,
  // because the card is the thing that gets handed over, and whoever reads it
  // needs to know how old it is without asking.
  lines.push(
    fresh.neverConfirmed
      ? 'This has never been confirmed as up to date. Check it before relying on it.'
      : `Confirmed by the person on ${fresh.confirmedAt}. Printed ${today}.`,
  );

  return lines.join('\n');
}
