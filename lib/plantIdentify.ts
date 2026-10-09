// What plant is this (I24, 2026-09-29): Lifestead names no plant itself.
// It opens a free identification app the person already trusts, Pl@ntNet or
// Google Lens, and records on the planting which app named it and how sure
// that app said it was.
//
// Why not Pl@ntNet's API inside the app: its free quota is 500
// identifications a day for one account per business, shared by every
// person using the app, and past that it is paid (from EUR 1,000 a year).
// The owner's rule is that nothing the app does may cost a subscription or
// a charge, so the free apps do the naming and the app keeps the record.
// Both apps are free to the person, with no account needed for Pl@ntNet.
//
// Pure: the links, the percent reading and the sentences. Opening a link is
// the component's job (components/WhatPlantIsThis.tsx), checked by
// scripts/test_plant_identify.js.

export type IdentifyServiceId = 'plantnet' | 'lens';

export type IdentifyService = {
  id: IdentifyServiceId;
  name: string;
  /** Opens the app's store page on Android, which reads Open once installed. */
  androidStore: string;
  /** The same page over https, for a phone with no store app. */
  androidWeb: string;
  ios: string;
  /** On a computer, the service's own web page, where a photo can be uploaded. */
  web: string;
  /** One line under the button. */
  note: string;
};

export const IDENTIFY_SERVICES: IdentifyService[] = [
  {
    id: 'plantnet',
    name: 'Pl@ntNet',
    androidStore: 'market://details?id=org.plantnet',
    androidWeb: 'https://play.google.com/store/apps/details?id=org.plantnet',
    ios: 'https://apps.apple.com/app/plantnet/id600547573',
    web: 'https://identify.plantnet.org/',
    note: 'Free, with no account needed, and run by French public research institutes; people who use it review each other’s matches. It lists several likely plants, each with how sure it is.',
  },
  {
    id: 'lens',
    name: 'Google Lens',
    androidStore: 'market://details?id=com.google.ar.lens',
    androidWeb: 'https://play.google.com/store/apps/details?id=com.google.ar.lens',
    ios: 'https://apps.apple.com/app/google/id284815942',
    web: 'https://lens.google.com/',
    note: 'Free and quick, and good at common garden and house plants. It gives no percentage, so compare its pictures with the plant.',
  },
];

export function identifyService(id: string | null | undefined): IdentifyService | null {
  return IDENTIFY_SERVICES.find((service) => service.id === id) ?? null;
}

export type IdentifyPlatform = 'android' | 'ios' | 'computer';

/** The links to try in order: the store app first on Android, then the page. */
export function identifyLinks(service: IdentifyService, platform: IdentifyPlatform): string[] {
  if (platform === 'android') return [service.androidStore, service.androidWeb];
  if (platform === 'ios') return [service.ios];
  return [service.web];
}

export const IDENTIFY_INTRO =
  'Lifestead does not name plants itself. Open one of these free apps, photograph a leaf and a flower or fruit if it has one, then come back and search for the name it gives below.';

export const IDENTIFY_COMPUTER_INTRO =
  'Lifestead does not name plants itself. Open one of these free sites, upload a photo of a leaf and a flower or fruit if it has one, then come back and search for the name it gives below.';

/** Said every time, since a wrong name on a wild plant can poison someone. */
export const IDENTIFY_CAUTION =
  'An app’s name for a plant is a likely match, not a certainty. Never eat a plant, or give it to a child or an animal, on an app’s word alone; check it with a field guide or someone who knows the plant.';

export type SureReading = { status: 'empty' } | { status: 'percent'; percent: number } | { status: 'invalid' };

/** "87", "87%" or "0.87" as a whole percent from 1 to 100. */
export function readSurePercent(text: string): SureReading {
  const trimmed = text.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { status: 'empty' };
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return { status: 'invalid' };
  const percent = value < 1 ? Math.round(value * 100) : Math.round(value);
  if (percent < 1 || percent > 100) return { status: 'invalid' };
  return { status: 'percent', percent };
}

export const SURE_RANGE_LINE = 'Type how sure it said as a percent from 1 to 100, or leave it empty.';

/** The caption under a planting named by one of the apps. */
export function identifiedLine(identifiedWith: string | null, sure: number | null): string | null {
  const service = identifyService(identifiedWith);
  if (!service) return null;
  return sure === null
    ? `Named with ${service.name}.`
    : `Named with ${service.name}, which said it was ${sure}% sure.`;
}
