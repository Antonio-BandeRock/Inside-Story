// Texting a number and copying a line, both added with rebuild R1 (O2 and
// the Medical ID copy, 2026-10-02).
//
// A text opens the phone's own messaging app with the number, and any words
// given, already filled in. Nothing is sent until the person presses send
// there, and the app never learns whether they did. Where the phone has no
// messaging app (a tablet, the computer) the answer says so instead of
// pretending a message went.
//
// Copying puts the line on the clipboard: expo-clipboard on the phone, the
// browser's clipboard in the desktop window. Both packages carry a web half,
// so the desktop build needs no stand-in for either.
import * as Clipboard from 'expo-clipboard';
import * as SMS from 'expo-sms';
import { dialable } from './medSupply';

export type TextOutcome = { ok: true } | { ok: false; reason: string };

export async function canTextFromHere(): Promise<boolean> {
  try {
    return await SMS.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function textNumber(phone: string | null | undefined, body = ''): Promise<TextOutcome> {
  const number = dialable(phone);
  if (!number) return { ok: false, reason: 'That number has no digits to text.' };
  if (!(await canTextFromHere())) {
    return { ok: false, reason: `This device has no messaging app to open. The number is ${phone}.` };
  }
  try {
    await SMS.sendSMSAsync([number], body);
    return { ok: true };
  } catch {
    return { ok: false, reason: `The messaging app could not be opened. The number is ${phone}.` };
  }
}

export async function copyLine(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
}
