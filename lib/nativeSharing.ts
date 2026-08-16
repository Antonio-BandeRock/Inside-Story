// A real, small wrapper around expo-sharing -- the actual, correct way to
// attach a local file to the OS share sheet on Android, added 2026-08-16
// after directly confirming, in react-native's own real source
// (node_modules/react-native/Libraries/Share/Share.js), that React
// Native's CORE Share module silently discards its own `url` field
// entirely on Android before it ever reaches native code -- `url` only
// ever works on iOS; on Android, Share.share() only ever passes
// `title`/`message` through to the native module, full stop.
//
// Every one of this app's own real "share a local file" features
// (recipe/favorite/meal sharing via the .is mechanism, and this device's
// own whole-database backup export) had been silently sharing NOTHING but
// their own plain-text message on Android since the day each shipped --
// confirmed directly by a real on-device report: exporting a backup
// produced a .txt file containing only the message text, no real backup
// data at all, because the actual file attachment was thrown away before
// it ever reached the native share intent.
//
// expo-sharing's own real shareAsync(url, options) has no message/text
// field at all (confirmed against its own type declarations, not the
// separate, unused web-only shim) -- it can only ever share the file
// itself, nothing alongside it. That's why every real caller of this
// module still calls React Native's own Share.share({message}) FIRST for
// whatever human-readable text it needs (that half already works
// correctly on Android, since `message` was never the broken field), then
// calls shareFileIfAvailable() below as a real, separate, second step for
// the actual file attachment -- two real native actions, not one combined
// one, since Android genuinely has no single mechanism this app can reach
// that does both at once.
import * as Sharing from 'expo-sharing';

export interface ShareFileOptions {
  mimeType?: string;
  dialogTitle?: string;
}

// Returns true if a real file share was actually offered to the person
// (not necessarily completed -- neither expo-sharing nor Android's own
// share flow reliably reports back whether someone finished picking a
// destination), false if file sharing genuinely isn't available on this
// device/build at all (a real, if rare, possibility -- some Android
// builds and most simulators don't support it) or if it failed for any
// other reason. A real caller should treat `false` as "still worth
// telling the person exactly where the file lives locally," not a hard
// error.
export async function shareFileIfAvailable(uri: string, options?: ShareFileOptions): Promise<boolean> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;
    await Sharing.shareAsync(uri, options);
    return true;
  } catch (error) {
    console.error('[nativeSharing] Failed to share a real local file', error);
    return false;
  }
}
