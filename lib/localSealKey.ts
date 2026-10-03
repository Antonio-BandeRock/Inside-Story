// The key behind lib/localSeal.ts: 32 random bytes made once on this device
// and kept in secure store (the Android Keystore on a phone, Windows
// safeStorage on the desktop). It never travels: not in a backup, not in a
// snapshot, not to another person. A device that loses it (a reinstall)
// simply cannot open its old sealed copies, which sync treats as missing
// and costs one whole copy, never a wrong one.
//
// Imported dynamically, the same as lib/deviceIdentity.ts, so nothing
// native is touched at module load.

import { openStoredText, sealText, SEAL_KEY_BYTES, SEAL_NONCE_BYTES } from './localSeal';
import { base64ToBytes, bytesToBase64 } from './partnerCrypto';

const LOCAL_SEAL_KEY = 'inside_story_local_seal_key_v1';

let cached: Promise<Uint8Array> | null = null;

async function loadKey(): Promise<Uint8Array> {
  const SecureStore = await import('expo-secure-store');
  const existing = await SecureStore.getItemAsync(LOCAL_SEAL_KEY);
  if (existing) {
    const bytes = base64ToBytes(existing);
    if (bytes.length === SEAL_KEY_BYTES) return bytes;
  }
  const Crypto = await import('expo-crypto');
  const key = await Crypto.getRandomBytesAsync(SEAL_KEY_BYTES);
  await SecureStore.setItemAsync(LOCAL_SEAL_KEY, bytesToBase64(key));
  return key;
}

export function localSealKey(): Promise<Uint8Array> {
  if (!cached) {
    cached = loadKey().catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

/** Seals text for this device's private storage. */
export async function sealForThisDevice(text: string): Promise<string> {
  const key = await localSealKey();
  const Crypto = await import('expo-crypto');
  const nonce = await Crypto.getRandomBytesAsync(SEAL_NONCE_BYTES);
  return sealText(text, key, nonce);
}

/** Opens what sealForThisDevice wrote, or a plain file from before sealing. */
export async function openFromThisDevice(stored: string): Promise<string | null> {
  let key: Uint8Array | null = null;
  try {
    key = await localSealKey();
  } catch (error) {
    console.error('[localSeal] the key could not be read', error);
  }
  const opened = openStoredText(stored, key);
  return opened.ok ? opened.text : null;
}
