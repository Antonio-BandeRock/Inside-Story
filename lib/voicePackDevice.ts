// The phone side of lib/voicePack.ts: asks the recognizer what it has,
// remembers Don't Ask Again in app_meta (device-local, listed in
// DEVICE_LOCAL_META_KEYS, since it describes this phone's recognizer),
// and puts the offer in front of the person at the microphone.
import { Alert, Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { getDatabase } from './db';
import {
  VOICE_PACK_META_KEY,
  afterVoicePackDownload,
  findInstalledLocale,
  parseVoicePackMeta,
  shouldOfferVoicePack,
  speechServiceName,
  voicePackFollowUp,
  voicePackPrompt,
  type VoicePackDownloadStatus,
  type VoicePackSituation,
} from './voicePack';

// Once per app run: Not Now means not again until the app is opened again.
let askedThisRun = false;

export async function getVoicePackNeverAsk(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', VOICE_PACK_META_KEY);
  return parseVoicePackMeta(row?.value).neverAsk;
}

export async function setVoicePackNeverAsk(neverAsk: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    VOICE_PACK_META_KEY,
    JSON.stringify({ neverAsk }),
    new Date().toISOString(),
  );
}

export function currentSpeechServiceName(): string {
  try {
    return speechServiceName(ExpoSpeechRecognitionModule.getDefaultRecognitionService().packageName);
  } catch {
    return speechServiceName(null);
  }
}

// Null when the phone could not say what it has: unknown is never read as
// missing, so nobody is offered a download they may not need.
export async function getVoicePackSituation(lang: string): Promise<VoicePackSituation | null> {
  const osVersion = typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version) || 0;
  let supportsOnDevice = false;
  let installed = false;
  try {
    supportsOnDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    if (supportsOnDevice) {
      const locales = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      installed = findInstalledLocale(locales.installedLocales, lang) !== null;
    }
  } catch (error) {
    console.warn('[voicePack] Could not ask the recognizer what it has', error);
    return null;
  }
  return { platform: Platform.OS, osVersion, supportsOnDevice, installed };
}

export async function downloadVoicePack(lang: string): Promise<VoicePackDownloadStatus> {
  try {
    const result = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: lang });
    return result.status;
  } catch (error) {
    console.warn('[voicePack] The download did not start', error);
    return 'failed';
  }
}

function ask<T>(title: string, body: string, buttons: { text: string; value: T; style?: 'cancel' | 'default' }[], dismissed: T): Promise<T> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      body,
      buttons.map((b) => ({ text: b.text, style: b.style, onPress: () => resolve(b.value) })),
      { cancelable: true, onDismiss: () => resolve(dismissed) },
    );
  });
}

/**
 * Called by useVoiceDictation when the pack is missing, just before it would
 * fall back to the speech service. Returns how to go on: listen on the phone,
 * listen through the service, or not start listening at all.
 */
export async function offerVoicePack(lang: string, situation: VoicePackSituation): Promise<'on-device' | 'network' | 'cancel'> {
  let neverAsk = false;
  try {
    neverAsk = await getVoicePackNeverAsk();
  } catch {
    neverAsk = false;
  }
  if (!shouldOfferVoicePack({ ...situation, neverAsk, askedThisRun })) return 'network';
  askedThisRun = true;

  const service = currentSpeechServiceName();
  const text = voicePackPrompt(lang, service);
  const choice = await ask(
    text.title,
    text.body,
    [
      { text: text.never, value: 'never' as const },
      { text: text.notNow, value: 'notNow' as const, style: 'cancel' },
      { text: text.download, value: 'download' as const },
    ],
    'cancel' as const,
  );
  if (choice === 'cancel') return 'cancel';
  if (choice === 'notNow') return 'network';
  if (choice === 'never') {
    await setVoicePackNeverAsk(true).catch(() => undefined);
    return 'network';
  }

  const status = await downloadVoicePack(lang);
  const next = afterVoicePackDownload(status);
  if (next === 'on-device') return 'on-device';
  if (next === 'wait') return 'cancel';
  const follow = voicePackFollowUp(status === 'download_scheduled' ? 'download_scheduled' : 'failed', service);
  return ask(
    follow.title,
    follow.body,
    [
      { text: follow.wait, value: 'cancel' as const, style: 'cancel' },
      { text: follow.useService, value: 'network' as const },
    ],
    'cancel' as const,
  );
}
