// Getting the emergency record out of the app, to the three places that can
// be reached when the phone is locked (A17, A18 and A19, Phase 2).
//
// lib/emergency.ts says it first and plainly: nobody opens an app on a
// locked phone. So this file does not make the app reachable; it puts the
// same lines somewhere that is.
//
// 1. The phone's Medical ID screen (A17). The app cannot write to it, on
//    Android or on an iPhone; only the person can. So each line is laid out
//    under the name of the field it goes in, ready to copy across.
// 2. A card for the wallet (A18), printed at bank-card width. Nothing is cut
//    to fit: a long list makes the card longer, never shorter, since a
//    medication missing from a card reads as one not being taken.
// 3. A lock-screen notice (A19), off until the person turns it on, holding
//    only the lines they pick. Whoever picks up the phone can read it, and
//    the screen says so before it is turned on.
//
// The same two rules as lib/emergency.ts hold: nothing is inferred, and an
// empty field is left out rather than printed as "none".
//
// Pure, no imports beyond types, so scripts/test_emergency_outside.js checks
// every line without a phone.

import type { EmergencyContact, EmergencyFromApp, EmergencyProfile } from './emergency';

export type EmergencyInput = {
  profile: EmergencyProfile;
  fromApp: EmergencyFromApp;
  contacts: EmergencyContact[];
  today: string;
};

function clean(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function orderedContacts(contacts: EmergencyContact[]): EmergencyContact[] {
  return [...contacts].sort((a, b) => Number(b.primary) - Number(a.primary));
}

function contactLine(contact: EmergencyContact): string {
  const who = clean(contact.relationship) ? `${contact.name} (${clean(contact.relationship)})` : contact.name;
  return `${who}: ${contact.phone}`;
}

function medicationLines(fromApp: EmergencyFromApp): string[] {
  return fromApp.medications.map((med) => (med.dose ? `${med.name} (${med.dose})` : med.name));
}

// --- 1. The phone's Medical ID ----------------------------------------------

export type MedicalIdEntry = {
  /** The field's name on the phone's screen. */
  field: string;
  value: string;
};

export type MedicalIdPlatform = 'android' | 'ios' | 'other';

/** Where the screen is, in the words the phone itself uses. */
export function medicalIdWhere(platform: MedicalIdPlatform): string {
  if (platform === 'ios') {
    return 'On an iPhone it is in the Health app: tap your picture, then Medical ID, then Edit. Turn on Show When Locked so it can be read from the lock screen.';
  }
  if (platform === 'android') {
    return 'On most Android phones it is in Settings > Safety and emergency > Medical information. Some makers put it under Settings > About phone > Emergency information, or in the Emergency Information app. Turn on showing it from the lock screen where the phone offers that.';
  }
  return 'It is on the phone, not here: on an iPhone in the Health app under Medical ID, and on most Android phones in Settings > Safety and emergency > Medical information.';
}

/**
 * The record laid out under the phone's field names. Drug and food
 * allergies share one field there, so both go in it, drug allergies first
 * and each labelled, since the phone gives no other way to tell them apart.
 */
export function medicalIdEntries(input: EmergencyInput): MedicalIdEntry[] {
  const { profile, fromApp, contacts } = input;
  const out: MedicalIdEntry[] = [];
  if (fromApp.displayName) out.push({ field: 'Name', value: fromApp.displayName });

  const allergies = [
    clean(profile.drugAllergies) ? `Drugs: ${clean(profile.drugAllergies)}` : '',
    fromApp.foodAllergies.length > 0 ? `Foods: ${fromApp.foodAllergies.join(', ')}` : '',
  ].filter(Boolean);
  if (allergies.length > 0) out.push({ field: 'Allergies and reactions', value: allergies.join('\n') });

  if (fromApp.conditions.length > 0) out.push({ field: 'Medical conditions', value: fromApp.conditions.join(', ') });
  const meds = medicationLines(fromApp);
  if (meds.length > 0) out.push({ field: 'Medications', value: meds.join(', ') });
  if (clean(profile.bloodType)) out.push({ field: 'Blood type', value: clean(profile.bloodType) });

  const notes = [
    clean(profile.devices) ? `Implants or devices: ${clean(profile.devices)}` : '',
    clean(profile.language) ? `Speaks: ${clean(profile.language)}` : '',
    clean(profile.doctorName) || clean(profile.doctorPhone)
      ? `Doctor: ${[clean(profile.doctorName), clean(profile.doctorPhone)].filter(Boolean).join(', ')}`
      : '',
    clean(profile.preferredHospital) ? `Hospital: ${clean(profile.preferredHospital)}` : '',
    clean(profile.directiveLocation) ? `Advance directive is kept: ${clean(profile.directiveLocation)}` : '',
    clean(profile.otherNotes),
  ].filter(Boolean);
  if (notes.length > 0) out.push({ field: 'Medical notes', value: notes.join('\n') });

  if (contacts.length > 0) {
    out.push({ field: 'Emergency contacts', value: orderedContacts(contacts).map(contactLine).join('\n') });
  }
  return out;
}

// --- 2. The wallet card -------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function block(heading: string, lines: string[]): string {
  if (lines.length === 0) return '';
  return `<div class="b"><div class="h">${escapeHtml(heading)}</div>${lines
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')}</div>`;
}

/**
 * A card at bank-card width (85.6 mm), front and back side by side with a
 * fold line between, printed on an ordinary page and cut out. The front
 * holds what changes what someone does in the first minute: drug
 * allergies and who to call. The back holds the rest and how old it is.
 */
export function buildWalletCardHtml(input: EmergencyInput): string {
  const { profile, fromApp, contacts, today } = input;
  const front = [
    `<div class="title">IN AN EMERGENCY</div>`,
    fromApp.displayName ? `<div class="name">${escapeHtml(fromApp.displayName)}</div>` : '',
    clean(profile.drugAllergies)
      ? `<div class="b alert"><div class="h">DRUG ALLERGIES</div><div>${escapeHtml(clean(profile.drugAllergies))}</div></div>`
      : '',
    block(
      'CALL',
      orderedContacts(contacts).map((c) => `${contactLine(c)}${c.primary ? ' (try first)' : ''}`),
    ),
  ].join('');

  const other = [
    clean(profile.bloodType) ? `Blood type: ${clean(profile.bloodType)}` : '',
    clean(profile.language) ? `Speaks: ${clean(profile.language)}` : '',
    clean(profile.doctorName) || clean(profile.doctorPhone)
      ? `Doctor: ${[clean(profile.doctorName), clean(profile.doctorPhone)].filter(Boolean).join(', ')}`
      : '',
    clean(profile.preferredHospital) ? `Hospital: ${clean(profile.preferredHospital)}` : '',
    clean(profile.directiveLocation) ? `Advance directive is kept: ${clean(profile.directiveLocation)}` : '',
  ].filter(Boolean);

  const confirmed = profile.confirmedAt
    ? `Confirmed by the person on ${profile.confirmedAt.slice(0, 10)}. Printed ${today}.`
    : `Printed ${today}. Never confirmed as up to date; check it before relying on it.`;

  const back = [
    block('CONDITIONS', fromApp.conditions),
    block('TAKING NOW', medicationLines(fromApp)),
    clean(profile.devices) ? block('IMPLANTS OR DEVICES', [clean(profile.devices)]) : '',
    fromApp.foodAllergies.length > 0 ? block('FOOD ALLERGIES', [fromApp.foodAllergies.join(', ')]) : '',
    block('ALSO', other),
    `<div class="stamp">${escapeHtml(confirmed)}</div>`,
  ].join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Emergency card</title><style>
@page { margin: 12mm; }
body { font-family: Helvetica, Arial, sans-serif; color: #111; margin: 0; }
.how { font-size: 9pt; color: #444; margin: 0 0 6mm 0; max-width: 175mm; }
.pair { display: flex; gap: 0; align-items: stretch; }
.card { width: 85.6mm; min-height: 54mm; box-sizing: border-box; padding: 3mm; border: 0.3mm dashed #777; font-size: 7pt; line-height: 1.25; }
.card + .card { border-left: 0.3mm dotted #777; }
.title { font-weight: 700; font-size: 9pt; letter-spacing: 0.3pt; }
.name { font-size: 8.5pt; margin-bottom: 1.5mm; }
.b { margin-top: 1.5mm; }
.h { font-weight: 700; font-size: 6.5pt; letter-spacing: 0.3pt; }
.alert { border: 0.4mm solid #111; padding: 1mm; }
.stamp { margin-top: 2mm; font-size: 6pt; color: #444; }
</style></head><body>
<p class="how">Cut along the dashed line and fold on the dotted one, so the front and back sit back to back. A long list makes the card longer rather than leaving anything off; fold the extra under if it does not fit the wallet. Print a new one whenever a medication changes.</p>
<div class="pair"><div class="card">${front}</div><div class="card">${back}</div></div>
</body></html>`;
}

// --- 3. The lock-screen notice -----------------------------------------------

export type LockScreenPart = 'drugAllergies' | 'contact' | 'conditions' | 'medications' | 'bloodType' | 'devices';

export const LOCK_SCREEN_PARTS: { key: LockScreenPart; label: string }[] = [
  { key: 'drugAllergies', label: 'Drug allergies' },
  { key: 'contact', label: 'Who to call first' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'medications', label: 'Medications' },
  { key: 'bloodType', label: 'Blood type' },
  { key: 'devices', label: 'Implants or devices' },
];

export const LOCK_SCREEN_WARNING =
  'Anyone who picks up your phone can read this without unlocking it, strangers included. Pick only what you are content for anyone to see. ' +
  'It stays until you turn it off here. A restart of the phone clears it until the app is next opened, and a phone set to hide notification content on the lock screen will hide it too.';

/** The notice's title and lines, or null when nothing picked has anything in it. */
export function lockScreenNotice(parts: LockScreenPart[], input: EmergencyInput): { title: string; body: string } | null {
  const { profile, fromApp, contacts } = input;
  const lines: string[] = [];
  for (const { key } of LOCK_SCREEN_PARTS) {
    if (!parts.includes(key)) continue;
    if (key === 'drugAllergies' && clean(profile.drugAllergies)) lines.push(`DRUG ALLERGIES: ${clean(profile.drugAllergies)}`);
    if (key === 'contact' && contacts.length > 0) lines.push(`Call ${contactLine(orderedContacts(contacts)[0])}`);
    if (key === 'conditions' && fromApp.conditions.length > 0) lines.push(`Conditions: ${fromApp.conditions.join(', ')}`);
    if (key === 'medications' && fromApp.medications.length > 0) lines.push(`Takes: ${medicationLines(fromApp).join(', ')}`);
    if (key === 'bloodType' && clean(profile.bloodType)) lines.push(`Blood type: ${clean(profile.bloodType)}`);
    if (key === 'devices' && clean(profile.devices)) lines.push(`Implants or devices: ${clean(profile.devices)}`);
  }
  if (lines.length === 0) return null;
  const title = fromApp.displayName ? `In an emergency: ${fromApp.displayName}` : 'In an emergency';
  return { title, body: lines.join('\n') };
}

export function parseLockScreenParts(raw: string | null | undefined): LockScreenPart[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    const known = new Set(LOCK_SCREEN_PARTS.map((p) => p.key));
    return Array.isArray(value) ? value.filter((v): v is LockScreenPart => known.has(v)) : [];
  } catch {
    return [];
  }
}
