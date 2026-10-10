// Which tier this device is using, P27 (2026-10-09). For now the only way
// to change it is the Free / Paid switch in Profile > Developer Tools, so
// the owner can walk the app as somebody on Free would see it. Store
// billing feeds the same value later, and nothing that reads it changes.
//
// Kept the way lib/navigationHand.ts keeps the hand: a plain file in the
// document folder, read synchronously so a paid lens never draws for a
// moment before its wall, and never carried through sync, since it is a
// view this device is set to and not a record. Missing or unreadable reads
// as 'paid', which is how the app behaved before the switch existed.
//
// What is paid is decided in one place, lib/paidFeatures.ts.
import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';
import type { Tier } from './paidFeatures';

const TIER_FILE_NAME = 'developer_tier.txt';

function tierFile(): File {
  return new File(Paths.document, TIER_FILE_NAME);
}

function readTier(): Tier {
  try {
    const file = tierFile();
    if (file.exists) return file.textSync().trim() === 'free' ? 'free' : 'paid';
  } catch {
    // Falls back to the default below.
  }
  return 'paid';
}

let current: Tier | null = null;
const listeners = new Set<() => void>();

export function getTier(): Tier {
  if (current === null) current = readTier();
  return current;
}

export function setTier(tier: Tier): void {
  if (getTier() === tier) return;
  current = tier;
  try {
    tierFile().write(tier);
  } catch {
    // Holds for this run; the next launch falls back to the default.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The tier, redrawing whatever calls it when the switch is flipped. */
export function useTier(): Tier {
  return useSyncExternalStore(subscribe, getTier, getTier);
}
