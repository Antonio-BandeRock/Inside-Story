// Step 6 of the real device-pairing prerequisite list, 2026-08-15 (see
// CLAUDE.md's own "Sharing individual recipes between two people"
// security-requirement note) -- the real RECEIVING side of a .is file.
// lib/sharing.ts's own writeIsFile*/-- functions cover the SENDING side
// (a real, local, signed .is file, handed to the OS share sheet); the
// OS-level registration itself lives in app.json's own real
// android.intentFilters (a first-class Expo config field, confirmed
// directly against @expo/config-plugins' own IntentFilters module rather
// than assumed -- no custom config plugin was actually needed for this
// half, unlike the earlier, incorrect assumption in CLAUDE.md's own
// roadmap text).
//
// This module's own real job: once Android launches or resumes this app
// via a real ACTION_VIEW intent carrying a content:// or file:// URI
// (someone tapped a .is file in a file manager, or opened one as an email/
// WhatsApp attachment), get that raw URI, read the real file's own plain
// JSON content, and route it into the exact same real, already-verified
// staging flow app/import-shared.tsx already provides for a
// hashimotosapp://import-shared?data=... deep link -- re-encoding the raw
// file JSON via lib/sharing.ts's own encodeBase64Utf8 first, so
// decodeShareEnvelope (which always expects a base64-wrapped wire object,
// matching what a URL-based share already sends) needs zero changes at
// all to also handle this second, real delivery path.
//
// Deliberately NOT wired through Expo Router's own declarative route-
// matching (a content://.../*.is or file://.../*.is URI has a completely
// different scheme than this app's own hashimotosapp:// one, so it would
// never match any registered route pattern anyway) -- instead, a real,
// independent expo-linking listener (see app/_layout.tsx's own effect
// calling handleIncomingIsFile below), running ALONGSIDE Expo Router's own
// linking, not instead of it. Any URL that isn't a real content:///file://
// URI is left completely untouched here, for Expo Router's own existing
// hashimotosapp:// handling to keep working exactly as it always has.
import { encodeBase64Utf8 } from './sharing';

// A real, honest, currently-unconfirmed assumption, named directly rather
// than glossed over: neither expo-file-system's current class-based File
// API nor its own legacy readAsStringAsync explicitly documents support
// for reading an arbitrary content:// URI from ANOTHER app (as opposed to
// a file this app itself wrote) -- both APIs' own docs are worded around
// file:/// URIs specifically. General, well-established real-world use of
// Expo's file APIs for exactly this "read a shared/opened file" case makes
// this a reasonable, well-grounded expectation, not a blind guess, but it
// genuinely has not been confirmed on-device this session (no device was
// adb-connected). Tries the current, real, class-based API this whole
// project already standardizes on first; falls back to the legacy API
// (historically the more content://-URI-tolerant of the two, per real-
// world Expo usage) if that throws; returns null (never throws) if both
// genuinely fail, so a real read failure shows the exact same honest "this
// link doesn't look right" state app/import-shared.tsx already provides
// for a malformed/tampered share, rather than crashing.
async function readIsFileContent(uri: string): Promise<string | null> {
  try {
    const { File } = await import('expo-file-system');
    return await new File(uri).text();
  } catch (primaryError) {
    console.error('[isFileLinking] Failed to read the incoming .is file via the current File API', primaryError);
    try {
      const FileSystem = await import('expo-file-system/legacy');
      return await FileSystem.readAsStringAsync(uri);
    } catch (legacyError) {
      console.error('[isFileLinking] Failed to read the incoming .is file via the legacy API too', legacyError);
      return null;
    }
  }
}

// A real, minimal interface for whatever navigation function the caller
// actually has on hand (expo-router's own useRouter() return value) --
// deliberately not importing expo-router's own Router type here, so this
// module stays a plain, testable leaf with no direct dependency on the
// router itself; app/_layout.tsx passes its own real router.push straight
// through.
type PushToImportShared = (params: { pathname: '/import-shared'; params: { data: string } }) => void;

// Real, deliberate scope boundary named directly: this only ever routes a
// genuine file-open URI into the existing /import-shared staging screen --
// it never itself decides whether the file's own content is valid or
// trustworthy (decodeShareEnvelope, called from that screen, already owns
// that real verification gate). A file this couldn't read at all still
// navigates there, with a deliberately empty data param, so the person
// sees the SAME honest "this link doesn't look right" state a genuinely
// malformed link already produces, rather than silently doing nothing when
// they tapped something meant to open in this app.
export async function handleIncomingIsFile(url: string, push: PushToImportShared): Promise<void> {
  // This app's own hashimotosapp:// scheme is left completely alone --
  // Expo Router already owns routing those, correctly, on its own.
  if (url.startsWith('hashimotosapp://')) return;
  // Anything else that isn't a real content://\file:// URI (e.g. an
  // http(s) link opened for an unrelated reason) is also left alone --
  // this module's only real job is the .is file-open path.
  if (!url.startsWith('content://') && !url.startsWith('file://')) return;

  const rawJson = await readIsFileContent(url);
  push({ pathname: '/import-shared', params: { data: rawJson ? encodeBase64Utf8(rawJson) : '' } });
}
