// Where the OneDrive app registration's details live.
//
// One file, so the value someone pastes into a portal and the value this app
// sends are the same value, rather than two that can drift.
//
// WHY THERE IS A REGISTRATION AT ALL. Sharing a meal plan between two phones
// needs somewhere to put it, and the agreed answer is each person's own
// OneDrive rather than a server belonging to this project. Microsoft will not
// let an app touch someone's OneDrive without a registered application id, and
// that registration is something a person creates, not something code can.
//
// WHAT IS DELIBERATELY NOT HERE: a client secret. This is a PUBLIC client. A
// secret shipped inside an app is not a secret, since anyone can read it out of
// the bundle, so the authorization code is protected by PKCE instead: a random
// value generated per sign-in, hashed, and checked by Microsoft against the
// original. expo-crypto provides the randomness and the hash, both already
// installed.

/**
 * The Application (client) ID from the Microsoft Entra app registration.
 *
 * Null until someone registers one. Everything that needs it checks
 * isOneDriveConfigured() first and says plainly that it is not set up, rather
 * than failing somewhere further on with a Microsoft error code nobody can act
 * on.
 */
export const ONEDRIVE_CLIENT_ID: string | null = null;

/**
 * The redirect this app listens on, and the exact string to register.
 *
 * Uses the scheme the app ALREADY registers with the operating system, which is
 * the reason this whole feature needs no native rebuild: hashimotosapp:// is
 * already handled (it is how a tapped connect link reaches app/connect.tsx), so
 * the browser can hand the result back with nothing new compiled in.
 *
 * A path rather than a bare scheme, and no query string. Entra refuses query
 * parameters in a redirect URI for any registration that allows personal
 * Microsoft accounts, which is exactly what OneDrive personal is.
 */
export const ONEDRIVE_REDIRECT_URI = 'hashimotosapp://oauth/onedrive';

/**
 * What this app asks permission to do, and nothing beyond it.
 *
 * Files.ReadWrite.AppFolder is deliberately narrower than Files.ReadWrite. It
 * grants access to ONE folder that Microsoft creates for this app, and to
 * nothing else in the person's OneDrive: not their documents, not their photos,
 * not anything they already had. The folder shows up under Apps in their own
 * OneDrive, so it is visible and deletable by them rather than hidden.
 *
 * offline_access is what allows a refresh token, so signing in happens once
 * rather than every time the app wants to check for an update.
 *
 * Named honestly: if creating a share link turns out to require the broader
 * Files.ReadWrite, that is a real trade to put to the person rather than a
 * scope to quietly widen.
 */
export const ONEDRIVE_SCOPES = ['Files.ReadWrite.AppFolder', 'offline_access'] as const;

/**
 * The common endpoint, which accepts both personal and work or school accounts.
 *
 * Personal is the case that matters here, since that is what an ordinary
 * OneDrive account is, and the registration has to allow it.
 */
export const ONEDRIVE_AUTHORIZE_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
export const ONEDRIVE_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/** Graph, for writing the file and asking for a share link. */
export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export function isOneDriveConfigured(): boolean {
  return typeof ONEDRIVE_CLIENT_ID === 'string' && ONEDRIVE_CLIENT_ID.trim().length > 0;
}

/**
 * What to tell someone when it is not set up.
 *
 * A real explanation rather than a dead button. Somebody looking at this has no
 * way to guess that a Microsoft app registration is the missing piece.
 */
export const ONEDRIVE_NOT_CONFIGURED =
  'Sharing through OneDrive is not switched on in this build yet. It needs an app registration with Microsoft, which is a one-time setup step outside the app.';
