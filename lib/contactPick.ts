// Picking a person from the phone's contacts to fill a form (O1, rebuild
// R1, 2026-10-02): an emergency contact, a pharmacy, a prescriber. The
// phone's own picker opens, the person taps one contact, and its name and
// one number land in the form's boxes, where they can be changed before
// saving. Only that one contact is read; nothing else in the address book is
// looked at, kept or sent anywhere, and nothing is ever written back to it.
//
// Android asks for permission to read contacts the first time. A refusal
// leaves the boxes as they were and says the numbers can still be typed.
// Phone only: the desktop has no address book to open.
import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import { isDesktopApp } from './desktop/bridge';

export type PickedContact = { name: string; phone: string };
export type PickOutcome =
  | { kind: 'picked'; contact: PickedContact }
  | { kind: 'cancelled' }
  | { kind: 'problem'; reason: string };

export const CAN_PICK_CONTACTS = Platform.OS !== 'web' && !isDesktopApp();

type NumberLike = { number?: string | null; label?: string | null; isPrimary?: boolean | null };

// The number most likely to reach the person: one marked primary, then a
// mobile, then whichever comes first. Pure, so scripts/test_contact_pick.js
// checks it.
export function choosePhone(numbers: readonly NumberLike[] | null | undefined): string {
  const usable = (numbers ?? []).filter((n) => (n.number ?? '').trim().length > 0);
  if (usable.length === 0) return '';
  const primary = usable.find((n) => n.isPrimary);
  if (primary) return primary.number!.trim();
  const mobile = usable.find((n) => /mobile|cell|móvil|movil|handy|portable|携帯/i.test(n.label ?? ''));
  return (mobile ?? usable[0]).number!.trim();
}

export async function pickContact(): Promise<PickOutcome> {
  if (!CAN_PICK_CONTACTS) return { kind: 'problem', reason: 'Contacts can be picked on the phone. Type the name and number here instead.' };
  try {
    if (Platform.OS === 'android') {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) {
        return {
          kind: 'problem',
          reason: 'Lifestead was not allowed to read contacts, so nothing was filled in. The name and number can still be typed, or the permission turned on in the phone settings.',
        };
      }
    }
    const contact = await Contacts.presentContactPickerAsync();
    if (!contact) return { kind: 'cancelled' };
    const name = (contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ')).trim();
    return { kind: 'picked', contact: { name, phone: choosePhone(contact.phoneNumbers) } };
  } catch (error) {
    return { kind: 'problem', reason: error instanceof Error ? error.message : String(error) };
  }
}
