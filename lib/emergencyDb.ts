// Reading and writing the emergency card.
//
// Added 2026-09-05. Same split every other module here follows: schema in
// lib/db.ts, the assembly and every honesty rule in lib/emergency.ts with no
// database so they can be tested without one, and the reading and writing here.
//
// THE PART WORTH READING BEFORE CHANGING ANYTHING.
//
// gatherFromApp() READS what the app already holds rather than asking for it a
// second time. Conditions, active medications with doses, food allergies and the
// person's name are all already recorded elsewhere, and a card that made someone
// retype them would go stale the moment either copy changed. That is the same
// reasoning the Finances area used for grocery prices: read where they already
// live and copy nothing.
//
// The one thing it does NOT read is drug allergies, because there was nothing to
// read. Checked directly: user_food_allergies is the only allergy table in this
// app. A food allergy is not a drug allergy and must never stand in for one.

import {
  getDatabase,
  getUserConditions,
  getUserProfile,
  listAllConditions,
  listFoodAllergies,
} from './db';
import type { EmergencyContact, EmergencyFromApp, EmergencyProfile } from './emergency';

const PROFILE_ID = 'self';

// --- Contacts ---------------------------------------------------------------

export async function listEmergencyContacts(): Promise<EmergencyContact[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    relationship: string | null;
    phone: string;
    is_primary: number;
    notes: string | null;
  }>(
    // Primary first, then by name, so the list on screen reads in the order
    // someone would actually work down it.
    `
      SELECT id, name, relationship, phone, is_primary, notes
      FROM emergency_contacts
      ORDER BY is_primary DESC, name
    `,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    primary: Boolean(row.is_primary),
    notes: row.notes,
  }));
}

export async function upsertEmergencyContact(input: {
  id?: string;
  name: string;
  relationship?: string | null;
  phone: string;
  primary?: boolean;
  notes?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? `ec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const isPrimary = input.primary ? 1 : 0;

  if (input.id) {
    await db.runAsync(
      `
        UPDATE emergency_contacts
        SET name = ?, relationship = ?, phone = ?, is_primary = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      input.name.trim(),
      input.relationship?.trim() || null,
      input.phone.trim(),
      isPrimary,
      input.notes?.trim() || null,
      now,
      input.id,
    );
  } else {
    await db.runAsync(
      `
        INSERT INTO emergency_contacts (id, name, relationship, phone, is_primary, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      id,
      input.name.trim(),
      input.relationship?.trim() || null,
      input.phone.trim(),
      isPrimary,
      input.notes?.trim() || null,
      now,
      now,
    );
  }

  // Exactly one row can be primary, cleared here rather than by a constraint.
  // Two contacts both marked "try first" is not a harmless inconsistency: it is
  // the card failing to answer the one question it exists to answer.
  if (isPrimary === 1) {
    await db.runAsync(
      'UPDATE emergency_contacts SET is_primary = 0, updated_at = ? WHERE id != ?',
      now,
      id,
    );
  }
  return id;
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM emergency_contacts WHERE id = ?', id);
}

// --- The profile ------------------------------------------------------------

const EMPTY_PROFILE: EmergencyProfile = {
  drugAllergies: null,
  bloodType: null,
  devices: null,
  doctorName: null,
  doctorPhone: null,
  preferredHospital: null,
  language: null,
  directiveLocation: null,
  otherNotes: null,
  confirmedAt: null,
};

export async function getEmergencyProfile(): Promise<EmergencyProfile> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    drug_allergies: string | null;
    blood_type: string | null;
    devices: string | null;
    doctor_name: string | null;
    doctor_phone: string | null;
    preferred_hospital: string | null;
    language: string | null;
    directive_location: string | null;
    other_notes: string | null;
    confirmed_at: string | null;
  }>(
    `
      SELECT drug_allergies, blood_type, devices, doctor_name, doctor_phone,
             preferred_hospital, language, directive_location, other_notes, confirmed_at
      FROM emergency_profile
      WHERE id = ?
    `,
    PROFILE_ID,
  );
  // No row is the ordinary state for anyone who has not opened this yet, and it
  // returns empty rather than throwing, matching the "absence is the default"
  // contract every other preference table in this app already holds.
  if (!row) return { ...EMPTY_PROFILE };
  return {
    drugAllergies: row.drug_allergies,
    bloodType: row.blood_type,
    devices: row.devices,
    doctorName: row.doctor_name,
    doctorPhone: row.doctor_phone,
    preferredHospital: row.preferred_hospital,
    language: row.language,
    directiveLocation: row.directive_location,
    otherNotes: row.other_notes,
    confirmedAt: row.confirmed_at,
  };
}

/**
 * Saves the card's fields.
 *
 * Deliberately does NOT touch confirmed_at. Editing a field is not the same act
 * as going through the whole card and saying it is still right, and conflating
 * them would let a one-word change to a hospital name silently declare a
 * six-month-old medication list current.
 */
export async function saveEmergencyProfile(input: Partial<Omit<EmergencyProfile, 'confirmedAt'>>): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const current = await getEmergencyProfile();
  const merged = { ...current, ...input };
  const clean = (value: string | null | undefined) => value?.trim() || null;

  await db.runAsync(
    `
      INSERT INTO emergency_profile (
        id, drug_allergies, blood_type, devices, doctor_name, doctor_phone,
        preferred_hospital, language, directive_location, other_notes, confirmed_at,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        drug_allergies = excluded.drug_allergies,
        blood_type = excluded.blood_type,
        devices = excluded.devices,
        doctor_name = excluded.doctor_name,
        doctor_phone = excluded.doctor_phone,
        preferred_hospital = excluded.preferred_hospital,
        language = excluded.language,
        directive_location = excluded.directive_location,
        other_notes = excluded.other_notes,
        updated_at = excluded.updated_at
    `,
    PROFILE_ID,
    clean(merged.drugAllergies),
    clean(merged.bloodType),
    clean(merged.devices),
    clean(merged.doctorName),
    clean(merged.doctorPhone),
    clean(merged.preferredHospital),
    clean(merged.language),
    clean(merged.directiveLocation),
    clean(merged.otherNotes),
    current.confirmedAt,
    now,
    now,
  );
}

/**
 * Records that the person has been through the whole card and it is still right.
 *
 * Its own function rather than a field on the save, because it is a separate act
 * with a separate meaning, and it is the only thing that makes the card's own
 * freshness line trustworthy.
 */
export async function confirmEmergencyProfile(): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  // Upserts, so someone who has recorded nothing but wants to confirm the
  // conditions and medications already pulled from the app can still do it.
  await db.runAsync(
    `
      INSERT INTO emergency_profile (id, confirmed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET confirmed_at = excluded.confirmed_at, updated_at = excluded.updated_at
    `,
    PROFILE_ID,
    now,
    now,
    now,
  );
  return now;
}

// --- What the app already knows ---------------------------------------------

/**
 * Assembles the parts already recorded elsewhere in the app.
 *
 * Read, never copied. A condition removed in Profile disappears from the card on
 * the next read rather than lingering as a stale duplicate, which is the whole
 * reason none of this is stored again here.
 */
export async function gatherFromApp(): Promise<EmergencyFromApp> {
  const db = await getDatabase();
  const [profile, conditionCodes, allConditions, foodAllergies] = await Promise.all([
    getUserProfile(),
    getUserConditions(),
    listAllConditions(),
    listFoodAllergies(),
  ]);

  // Everything currently being taken, whatever kind it is. A card that listed
  // prescriptions and left out a supplement would be worse than useless to
  // anyone checking for an interaction, since several supplements interact with
  // exactly the drugs a hospital reaches for.
  const meds = await db.getAllAsync<{
    name: string;
    dose_amount: number | null;
    dose_unit: string | null;
    frequency: string | null;
  }>(
    `
      SELECT name, dose_amount, dose_unit, frequency
      FROM treatments
      WHERE active = 1
      ORDER BY treatment_type, name
    `,
  );

  const displayName = [profile.firstName, profile.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return {
    displayName: displayName || null,
    conditions: conditionCodes
      .map((code) => allConditions.find((entry) => entry.code === code)?.name ?? code)
      .sort((a, b) => a.localeCompare(b)),
    medications: meds.map((row) => {
      // A dose with no unit is not a dose, so it is left off rather than
      // printed as a bare number somebody might read as milligrams.
      const dose = row.dose_amount != null && row.dose_unit
        ? `${row.dose_amount} ${row.dose_unit}${row.frequency ? `, ${row.frequency}` : ''}`
        : row.frequency || null;
      return { name: row.name, dose };
    }),
    foodAllergies,
  };
}
