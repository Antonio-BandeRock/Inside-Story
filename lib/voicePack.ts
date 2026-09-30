// The offline speech pack, and asking for it (2026-09-29).
//
// useVoiceDictation already prefers recognition on the phone whenever the
// language pack is installed, and falls back to the phone's speech service,
// which sends the audio off the device, when it is not. This module decides
// when to offer the pack instead of falling back quietly, and holds every
// sentence of that offer, so the reasons are said the same way at the
// microphone and on Profile. No React Native in here, so
// scripts/test_voice_pack.js can check it without a phone.
//
// Android only: Android 13 and later can start the download from inside the
// app (androidTriggerOfflineModelDownload). An iPhone has no such call, and
// its behaviour is unchanged.

export const VOICE_PACK_META_KEY = 'voice_pack_prompt';

// The first Android version whose recognizer can download a pack on request.
export const VOICE_PACK_MIN_ANDROID = 33;

export type VoicePackSituation = {
  platform: string;
  osVersion: number;
  supportsOnDevice: boolean;
  installed: boolean;
};

export function canDownloadVoicePack(s: Pick<VoicePackSituation, 'platform' | 'osVersion' | 'supportsOnDevice'>): boolean {
  return s.platform === 'android' && s.osVersion >= VOICE_PACK_MIN_ANDROID && s.supportsOnDevice;
}

// Offered at the microphone once per app run at most, and never again once
// the person has said Don't Ask Again (Profile can undo that).
export function shouldOfferVoicePack(s: VoicePackSituation & { neverAsk: boolean; askedThisRun: boolean }): boolean {
  return canDownloadVoicePack(s) && !s.installed && !s.neverAsk && !s.askedThisRun;
}

export function parseVoicePackMeta(value: string | null | undefined): { neverAsk: boolean } {
  if (!value) return { neverAsk: false };
  try {
    const parsed = JSON.parse(value) as { neverAsk?: unknown };
    return { neverAsk: parsed?.neverAsk === true };
  } catch {
    return { neverAsk: false };
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  fi: 'Finnish',
  nb: 'Norwegian',
  no: 'Norwegian',
  sv: 'Swedish',
  ja: 'Japanese',
};

export function languageName(lang: string): string {
  const base = lang.toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_NAMES[base] ?? lang;
}

// Who hears the audio when the pack is missing, named from the recognizer's
// package so a Samsung phone is not told it is Google.
export function speechServiceName(packageName: string | null | undefined): string {
  const p = (packageName ?? '').toLowerCase();
  if (p.includes('google')) return "Google's speech service";
  if (p.includes('samsung')) return "Samsung's speech service";
  return "the phone's speech service";
}

export function normalizeLocale(lang: string): string {
  return lang.toLowerCase().replace('_', '-');
}

export function isLocaleInstalled(installed: readonly string[] | null | undefined, lang: string): boolean {
  const want = normalizeLocale(lang);
  return (installed ?? []).some((l) => normalizeLocale(l) === want);
}

export type VoicePackPrompt = {
  title: string;
  body: string;
  download: string;
  notNow: string;
  never: string;
};

export function voicePackPrompt(lang: string, service: string): VoicePackPrompt {
  const language = languageName(lang);
  return {
    title: 'Keep What You Say on This Phone',
    body:
      `This phone can turn speech into text by itself once its ${language} speech pack is downloaded. ` +
      `It does not have one yet, so what you say would go to ${service} to be turned into text, ` +
      `and from then on that company's privacy terms apply to it.\n\n` +
      'Inside Story keeps everything you record on your device, and there is no Inside Story server holding any of it. ' +
      'What you say into a microphone here is often about your health: a meal, a symptom, a medicine. ' +
      'With the speech pack, those words never leave the phone, and the microphone works with no connection at all.\n\n' +
      'The pack is a one-time download to the phone. Not Now uses the speech service this time and asks again the next time you open the app.',
    download: 'Download It',
    notNow: 'Not Now',
    never: "Don't Ask Again",
  };
}

export type VoicePackDownloadStatus = 'download_success' | 'opened_dialog' | 'download_scheduled' | 'failed';

// What happens after Download It. 'on-device' starts listening on the phone
// straight away; 'ask' puts the follow-up question below; 'wait' does not
// start listening, because the phone's own download screen is showing.
export function afterVoicePackDownload(status: VoicePackDownloadStatus): 'on-device' | 'ask' | 'wait' {
  if (status === 'download_success') return 'on-device';
  if (status === 'opened_dialog') return 'wait';
  return 'ask';
}

export function voicePackFollowUp(status: 'download_scheduled' | 'failed', service: string): { title: string; body: string; useService: string; wait: string } {
  if (status === 'download_scheduled') {
    return {
      title: 'The Speech Pack Is on Its Way',
      body:
        'The phone will finish the download when it can, usually once it is on Wi-Fi. ' +
        'After that, every microphone in the app uses it without asking. ' +
        `Until then you can use ${service} this time, or wait.`,
      useService: 'Use It This Time',
      wait: 'Wait',
    };
  }
  return {
    title: 'The Download Did Not Start',
    body:
      'The phone did not start the speech pack download. You can try again from Profile, under Speech on This Phone, ' +
      "or download the language in the phone's speech recognition settings. " +
      `You can use ${service} this time, or wait.`,
    useService: 'Use It This Time',
    wait: 'Wait',
  };
}

// Profile's line about where speech is turned into text on this phone.
export function voicePackStatusLine(s: VoicePackSituation & { neverAsk: boolean }, lang: string, service: string): string {
  const language = languageName(lang);
  if (s.installed && s.supportsOnDevice) {
    return `The ${language} speech pack is on this phone, so what you say into a microphone here is turned into text on the phone and never leaves it.`;
  }
  if (!canDownloadVoicePack(s)) {
    return `This phone cannot turn speech into text by itself, so what you say into a microphone here goes to ${service} to be recognized.`;
  }
  const asking = s.neverAsk
    ? ' You asked not to be reminded at the microphone.'
    : ' The microphone offers the download the first time it would send audio out.';
  return `The ${language} speech pack is not on this phone yet, so what you say into a microphone here goes to ${service} to be recognized. With the pack, it stays on the phone.${asking}`;
}

export const VOICE_PACK_CARD_LEAD =
  'Inside Story keeps your records on your device. The one thing that can leave it is what you say into a microphone, when the phone has no speech pack to recognize it by itself.';
