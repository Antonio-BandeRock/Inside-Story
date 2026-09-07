// Signing in to OneDrive, so the app can reach a folder rather than guess at one.
//
// WHY THIS EXISTS AT ALL, AND WHY EVERY CHEAPER ROUTE WAS TRIED FIRST. The
// requirement was stated plainly: be able to CHOOSE a shared cloud folder, with
// the app knowing which one, rather than typing a name and hoping. Three Android
// mechanisms were fired at a real phone to see whether the operating system
// could do it:
//
//   ACTION_OPEN_DOCUMENT_TREE (pick a folder)  OneDrive is not offered.
//   ACTION_CREATE_DOCUMENT   (save a new file) OneDrive is not offered.
//   ACTION_OPEN_DOCUMENT     (open a file)     OneDrive IS offered.
//
// So OneDrive's Android provider hands out single files and nothing else. No
// amount of app code changes that, because the decision belongs to OneDrive's
// own provider. Talking to Microsoft Graph directly is the only remaining way to
// enumerate folders, and it is what this file makes possible.
//
// NO NATIVE REBUILD. Every piece is already compiled into the installed build:
// expo-web-browser opens the sign-in page and catches the redirect, expo-crypto
// does PKCE, expo-secure-store holds the refresh token, and fetch moves the
// bytes. This ships over an ordinary update.
//
// NO CLIENT SECRET. A secret shipped inside an app is not a secret, so this is a
// PUBLIC client and the authorization code is protected by PKCE instead: a
// random value made per sign-in, hashed, and checked by Microsoft against the
// original.

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { ONEDRIVE_CLIENT_ID, ONEDRIVE_REDIRECT_URI, ONEDRIVE_SCOPES } from './oneDriveConfig';

/**
 * The common endpoint rather than the consumers one.
 *
 * A personal Microsoft account and a work or school account both reach a
 * OneDrive, and the folder somebody actually shares with their partner could be
 * on either. Pinning this to consumers would refuse a work account at sign-in
 * with an error naming a tenant, which is not something anybody can act on from
 * inside a meal-planning app.
 */
const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';

const REFRESH_TOKEN_KEY = 'onedrive.refreshToken';

/**
 * The access token is deliberately in memory only, never in secure storage.
 *
 * It lasts about an hour and can be fetched again from the refresh token at any
 * time, so writing it down buys nothing and leaves one more copy of a live
 * credential on the device than the app needs.
 */
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64UrlFromBytes(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const c = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += alphabet[a >> 2];
    out += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b === undefined) break;
    out += alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c === undefined) break;
    out += alphabet[c & 63];
  }
  return out;
}

function base64ToBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isOneDriveConfigured(): boolean {
  return typeof ONEDRIVE_CLIENT_ID === 'string' && ONEDRIVE_CLIENT_ID.length > 0;
}

export async function isSignedIn(): Promise<boolean> {
  if (!isOneDriveConfigured()) return false;
  try {
    return (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)) !== null;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  cachedAccessToken = null;
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing to delete is the same outcome as deleting it.
  }
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function exchange(
  body: Record<string, string>,
): Promise<{ ok: true; accessToken: string } | { ok: false; reason: string }> {
  let response: Response;
  try {
    response = await fetch(AUTHORITY + '/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
  } catch {
    return { ok: false, reason: 'Microsoft could not be reached. Check the connection and try again.' };
  }

  let json: TokenResponse;
  try {
    json = (await response.json()) as TokenResponse;
  } catch {
    return { ok: false, reason: 'Microsoft sent back something this app could not read.' };
  }

  if (!response.ok || !json.access_token) {
    // Passed through rather than flattened. An Entra error names the actual
    // problem (a redirect that was never registered, a scope nobody consented
    // to), and hiding it behind a generic sentence leaves somebody with nothing
    // to fix.
    return {
      ok: false,
      reason: json.error_description ?? json.error ?? 'Microsoft refused the sign-in.',
    };
  }

  if (typeof json.refresh_token === 'string') {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, json.refresh_token);
    } catch {
      // Losing the refresh token costs a second sign-in later, not this one.
    }
  }

  cachedAccessToken = {
    token: json.access_token,
    // A minute of headroom, so a token that expires mid-request is refreshed
    // before it is used rather than after it fails.
    expiresAt: Date.now() + Math.max(0, (json.expires_in ?? 3600) - 60) * 1000,
  };
  return { ok: true, accessToken: json.access_token };
}

/**
 * Opens Microsoft's own sign-in page and completes the exchange.
 *
 * The page is Microsoft's, not this app's, which is the point: no password ever
 * passes through this code, and the person can see in the address bar who they
 * are signing in to.
 */
export async function signIn(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!ONEDRIVE_CLIENT_ID) {
    return { ok: false, reason: 'This build has no OneDrive application id set up.' };
  }

  const verifierBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = base64UrlFromBytes(verifierBytes);
  const challengeBase64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const codeChallenge = base64ToBase64Url(challengeBase64);

  const authorizeUrl =
    AUTHORITY +
    '/authorize?' +
    new URLSearchParams({
      client_id: ONEDRIVE_CLIENT_ID,
      response_type: 'code',
      redirect_uri: ONEDRIVE_REDIRECT_URI,
      response_mode: 'query',
      scope: ONEDRIVE_SCOPES.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      // Forces the account chooser. Without it, somebody already signed in to a
      // work account in the system browser is silently signed in to that account
      // here, which is not necessarily the OneDrive holding the shared folder.
      prompt: 'select_account',
    }).toString();

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(authorizeUrl, ONEDRIVE_REDIRECT_URI);
  } catch {
    return { ok: false, reason: 'The sign-in page could not be opened.' };
  }

  if (result.type !== 'success' || !result.url) {
    return { ok: false, reason: 'Sign-in was closed before it finished.' };
  }

  // The redirect carries either a code or an error. Read both rather than
  // assuming success, since a refused consent comes back through the same URL.
  const query = result.url.includes('?') ? result.url.slice(result.url.indexOf('?') + 1) : '';
  const params = new URLSearchParams(query);
  const error = params.get('error_description') ?? params.get('error');
  if (error) return { ok: false, reason: error };

  const code = params.get('code');
  if (!code) return { ok: false, reason: 'Microsoft did not send back a sign-in code.' };

  const exchanged = await exchange({
    client_id: ONEDRIVE_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: ONEDRIVE_REDIRECT_URI,
    code_verifier: codeVerifier,
  });
  return exchanged.ok ? { ok: true } : { ok: false, reason: exchanged.reason };
}

/**
 * A usable access token, refreshing quietly when the last one has aged out.
 *
 * Returns a reason rather than throwing when nobody is signed in, so every
 * caller has to decide what to say about that rather than letting an exception
 * surface as a stack trace on a screen.
 */
export async function getAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; reason: string }
> {
  if (!ONEDRIVE_CLIENT_ID) {
    return { ok: false, reason: 'This build has no OneDrive application id set up.' };
  }
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return { ok: true, token: cachedAccessToken.token };
  }

  let refreshToken: string | null = null;
  try {
    refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    refreshToken = null;
  }
  if (!refreshToken) {
    return { ok: false, reason: 'Not signed in to OneDrive yet.' };
  }

  const exchanged = await exchange({
    client_id: ONEDRIVE_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: ONEDRIVE_REDIRECT_URI,
    scope: ONEDRIVE_SCOPES.join(' '),
  });
  if (exchanged.ok) return { ok: true, token: exchanged.accessToken };

  // A refresh token Microsoft will no longer honour is worse than none: every
  // later call fails the same way with no path out. Clearing it puts the person
  // back at a plain Sign In button.
  await signOut();
  return { ok: false, reason: 'The OneDrive sign-in expired. Sign in again.' };
}
