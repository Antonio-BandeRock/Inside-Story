// Two native pieces the photo work needs and the installed app does not have
// yet: putting a camera's full-size original in the phone's gallery
// (expo-media-library) and telling Wi-Fi from mobile data (expo-network).
// Both are added in the R1 rebuild (docs/competitive-review/BUILD-PLAN.md).
//
// Neither package is installed in this repo until then, because installing
// one changes the app's runtime fingerprint and would strand every update
// sent over the air to the phones already running this build. So each is
// reached through requireOptionalNativeModule, which hands back null while
// the native side is missing and the module itself once R1 is installed. No
// change here is needed at R1: the same code starts working.
//
// Every call is guarded and never throws. A gallery save that cannot happen
// is reported as not having happened, and PhotoStrip says so once; the photo
// is kept in the app either way. A network that cannot be read counts as
// allowed, since a thumbnail is small and a report-size photo only moves
// when somebody asked for it.

import { requireOptionalNativeModule } from 'expo';
import { isDesktopApp } from './desktop/bridge';

type MediaLibraryNative = {
  requestPermissionsAsync?: (writeOnly: boolean, granular?: string[]) => Promise<{ granted?: boolean; status?: string }>;
  saveToLibraryAsync?: (localUri: string) => Promise<void>;
};

type NetworkNative = {
  getNetworkStateAsync?: () => Promise<{ type?: string; isConnected?: boolean }>;
};

function mediaLibrary(): MediaLibraryNative | null {
  if (isDesktopApp()) return null;
  try {
    return requireOptionalNativeModule<MediaLibraryNative>('ExpoMediaLibrary');
  } catch {
    return null;
  }
}

/** Whether this build of the app can put an original in the gallery. */
export function canSaveOriginalToGallery(): boolean {
  const native = mediaLibrary();
  return !!native?.saveToLibraryAsync;
}

/** Puts the file at `localUri` in the phone's gallery, asking to add photos
 *  the first time. True only when it went in. */
export async function saveOriginalToGallery(localUri: string): Promise<boolean> {
  const native = mediaLibrary();
  if (!native?.saveToLibraryAsync) return false;
  try {
    if (native.requestPermissionsAsync) {
      const permission = await native.requestPermissionsAsync(true, ['photo']);
      const granted = permission.granted ?? permission.status === 'granted';
      if (!granted) return false;
    }
    await native.saveToLibraryAsync(localUri);
    return true;
  } catch {
    return false;
  }
}

export type NetworkKind = 'wifi' | 'mobile' | 'other' | 'unknown';

/** What the phone is connected over right now, or 'unknown' when this
 *  build cannot tell. The desktop app is always on its own network. */
export async function currentNetworkKind(): Promise<NetworkKind> {
  if (isDesktopApp()) return 'wifi';
  try {
    const native = requireOptionalNativeModule<NetworkNative>('ExpoNetwork');
    if (!native?.getNetworkStateAsync) return 'unknown';
    const state = await native.getNetworkStateAsync();
    const type = String(state.type ?? '').toUpperCase();
    if (type === 'WIFI' || type === 'ETHERNET') return 'wifi';
    if (type === 'CELLULAR') return 'mobile';
    return type ? 'other' : 'unknown';
  } catch {
    return 'unknown';
  }
}
