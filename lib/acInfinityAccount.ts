// Asking AC Infinity's server for an account's controllers (I23,
// 2026-09-28). What the answer means is decided in lib/acInfinityCloud.ts,
// which is pure; this file holds the password and does the two posts.
//
// The password is kept in this device's secure storage (expo-secure-store,
// and on the computer the safeStorage stand-in in lib/desktop/), never in the
// database, so it is in no backup and never travels to the other device in a
// snapshot. The id AC Infinity hands back at sign-in is held in memory for
// the run and asked for again once when the device list is refused.

import * as SecureStore from 'expo-secure-store';

import {
  AC_DEVICES_PATH,
  AC_HOST,
  AC_LOGIN_PATH,
  AC_SIGN_IN_ADVICE,
  AC_UNREACHABLE_ADVICE,
  AC_USER_AGENT,
  answerOf,
  devicesForm,
  formEncode,
  loginForm,
  readControllers,
  userIdOf,
  type AcInfinityRead,
} from './acInfinityCloud';
import { getDesktopBridge, isDesktopApp } from './desktop/bridge';

const FETCH_TIMEOUT_MS = 15_000;

function passwordKey(gatewayId: string): string {
  // SecureStore keys allow letters, digits, '.', '-' and '_' only.
  return `acinfinity_password_${gatewayId.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

export async function hasAcPassword(gatewayId: string): Promise<boolean> {
  try {
    return !!(await SecureStore.getItemAsync(passwordKey(gatewayId)));
  } catch {
    return false;
  }
}

export async function saveAcPassword(gatewayId: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(passwordKey(gatewayId), password);
  signedIn.delete(gatewayId);
}

export async function forgetAcPassword(gatewayId: string): Promise<void> {
  signedIn.delete(gatewayId);
  try {
    await SecureStore.deleteItemAsync(passwordKey(gatewayId));
  } catch {
    // Nothing held here to forget.
  }
}

/** The sign-in id per account, for this run only. */
const signedIn = new Map<string, string>();

async function post(path: string, fields: Record<string, string>, token: string | null): Promise<unknown> {
  const url = `${AC_HOST}${path}`;
  const body = formEncode(fields);
  const headers: Record<string, string> = { 'User-Agent': AC_USER_AGENT };
  if (token) {
    headers.token = token;
    headers.minversion = '3.5';
  }
  let text: string;
  try {
    if (isDesktopApp()) {
      const web = getDesktopBridge().web;
      if (!web?.postForm) throw new Error('This version of the desktop app cannot reach AC Infinity. Install the newest one.');
      const answer = await web.postForm(url, body, headers);
      if (answer.status >= 500) throw new Error(`AC Infinity answered with error ${answer.status}. ${AC_UNREACHABLE_ADVICE}`);
      text = answer.text;
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        if (response.status >= 500) throw new Error(`AC Infinity answered with error ${response.status}. ${AC_UNREACHABLE_ADVICE}`);
        text = await response.text();
      } finally {
        clearTimeout(timer);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/abort|longer than/i.test(message) || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error(`AC Infinity did not answer within ${FETCH_TIMEOUT_MS / 1000} seconds. ${AC_UNREACHABLE_ADVICE}`);
    }
    if (/network request failed|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|ETIMEDOUT|fetch failed|ERR_/i.test(message)) {
      throw new Error(`AC Infinity could not be reached. ${AC_UNREACHABLE_ADVICE}`);
    }
    throw error instanceof Error ? error : new Error(message);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('AC Infinity answered in a way Inside Story does not recognise. It may have changed how it answers, and reading can stop until Inside Story is updated.');
  }
}

async function signIn(gatewayId: string, email: string, password: string): Promise<string> {
  const answer = answerOf(await post(AC_LOGIN_PATH, loginForm(email, password), null));
  if (!answer.ok) throw new Error(`AC Infinity did not sign in: ${answer.reason}. ${AC_SIGN_IN_ADVICE}`);
  const id = userIdOf(answer.data);
  if (!id) throw new Error('AC Infinity signed in but gave nothing to ask for the controllers with. It may have changed how it answers, and reading can stop until Inside Story is updated.');
  signedIn.set(gatewayId, id);
  return id;
}

/** Everything the account's controllers read now. Rejects with a sentence a
 *  person can act on. */
export async function fetchAcInfinity(gatewayId: string, email: string, whereWord: string): Promise<AcInfinityRead> {
  let password: string | null = null;
  try {
    password = await SecureStore.getItemAsync(passwordKey(gatewayId));
  } catch {
    password = null;
  }
  if (!password) throw new Error(`Type the AC Infinity password on this ${whereWord} to read the account here.`);

  let id = signedIn.get(gatewayId) ?? (await signIn(gatewayId, email, password));
  let answer = answerOf(await post(AC_DEVICES_PATH, devicesForm(id), id));
  if (!answer.ok) {
    // The id from an earlier sign-in may have run out: sign in once more.
    signedIn.delete(gatewayId);
    id = await signIn(gatewayId, email, password);
    answer = answerOf(await post(AC_DEVICES_PATH, devicesForm(id), id));
    if (!answer.ok) throw new Error(`AC Infinity did not list the controllers: ${answer.reason}.`);
  }
  const read = readControllers(answer.data);
  if (!read) throw new Error('AC Infinity answered in a way Inside Story does not recognise. It may have changed how it answers, and reading can stop until Inside Story is updated.');
  return read;
}
