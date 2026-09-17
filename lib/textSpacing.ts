// How much room the lines of text get, and how much room the letters of a
// word get. Two settings, two separate mechanisms, one file.
//
// 2026-09-17. Part of the autism, ADHD and dyslexia work (lib/neuroProfile.ts):
// dyslexia is the one of the three that asks for something about the text
// itself rather than about reminders.
//
// WHAT THIS IS NOT. It is not text size. Text size already works in this
// app and always has: React Native's Text scales with the phone's own
// accessibility font-size setting by default, this app never turns that
// off, and the one place it is capped is a popup with a fixed card size
// (LABEL_MAX_FONT_SCALE in components/LensHub.tsx, tested on a Galaxy A54
// on 2026-07-27). So somebody who needs bigger text already has bigger
// text, everywhere, including here. What they may not have is any idea
// that it works, which is a discoverability job, not an engineering one.
//
// Line spacing is the part the phone setting does NOT touch. Turn the font
// size up on a phone and the lines get taller along with it, so the ratio
// of gap to letter stays exactly where it was. For somebody who loses their
// place between lines, the ratio is the thing that was wrong.
//
// THE NUMBERS. 1.5 is not a taste call. WCAG 2.1 success criterion 1.4.12
// (Text Spacing) sets line height at 1.5 times the font size as the level
// content has to survive being set to, which makes it the one figure here
// with a standard behind it rather than a preference. "Roomier" at 1.8 goes
// past that for anybody who wants more; nothing above it, because past
// roughly 2 the lines stop reading as a paragraph and start reading as a
// list, which trades one problem for another.
//
// A MULTIPLIER, NOT A PIXEL COUNT. Every value here is a ratio against the
// text's own size, so one setting is correct for a 10px eyebrow and a 20px
// screen title at the same time, and it stays correct when the phone's font
// scale moves underneath it.
//
// PURE. No database, no React, no colours, no runtime imports, so
// scripts/test_textSpacing.js can run it in plain node.

export type LineSpacingKey = 'normal' | 'roomy' | 'roomier';

export const DEFAULT_LINE_SPACING: LineSpacingKey = 'normal';

export const ALL_LINE_SPACING_KEYS: LineSpacingKey[] = ['normal', 'roomy', 'roomier'];

export const LINE_SPACING_LABELS: Record<LineSpacingKey, string> = {
  normal: 'Normal',
  roomy: 'Roomy',
  roomier: 'Roomier',
};

// null means "leave the font alone", which is not the same as 1. A font
// picks its own line height, usually a little over 1.2, and matching that
// by hand would be guessing at a number the font already knows.
export const LINE_SPACING_RATIOS: Record<LineSpacingKey, number | null> = {
  normal: null,
  roomy: 1.5,
  roomier: 1.8,
};

export const LINE_SPACING_CAPTIONS: Record<LineSpacingKey, string> = {
  normal: 'Whatever the text was already doing.',
  roomy: 'Half a line of air between each one. This is the spacing the accessibility standard asks for.',
  roomier: 'More again, for when the lines still run together.',
};

export function isLineSpacingKey(value: string): value is LineSpacingKey {
  return (ALL_LINE_SPACING_KEYS as string[]).includes(value);
}

// Anything stored by an older version, or by a hand-edited file, comes back
// as the default rather than as a key nothing knows how to render.
export function normalizeLineSpacing(value: string | null | undefined): LineSpacingKey {
  if (typeof value === 'string' && isLineSpacingKey(value)) return value;
  return DEFAULT_LINE_SPACING;
}

// The lineHeight to put on a piece of text of this size, or null to leave
// it be.
//
// Rounded to a whole pixel because a fractional line height lands
// differently on the two platforms and the difference shows up as text
// sitting a hair off centre inside a fixed-height row.
//
// A size that is missing, zero, negative or not a number gets null. A Text
// with no fontSize of its own inherits one, and this file cannot see what
// it inherited, so guessing would be worse than leaving it alone.
export function lineHeightFor(
  fontSize: number | null | undefined,
  spacing: LineSpacingKey,
): number | null {
  const ratio = LINE_SPACING_RATIOS[spacing] ?? null;
  if (ratio === null) return null;
  if (typeof fontSize !== 'number' || !Number.isFinite(fontSize) || fontSize <= 0) return null;
  return Math.round(fontSize * ratio);
}

// What the setting is currently doing, for the line under the picker.
export function describeLineSpacing(spacing: LineSpacingKey): string {
  return LINE_SPACING_CAPTIONS[spacing];
}

// The pointer at the phone's own setting, which is the other half of this
// and the half that is already built. Worded per platform because the two
// keep it in different places and under different names, and "look in
// accessibility somewhere" is not help.
export const TEXT_SIZE_HEADING = 'Text size';

export const TEXT_SIZE_EXPLANATION =
  'Text size is set by your phone, not by this app, and this app follows it everywhere. Turn it up there and everything here comes up with it.';

// Takes a plain string rather than the three names, because Platform.OS on
// this project also answers 'windows' and 'macos': both of those run the
// web target as an installed PWA, so the browser answer is the right one
// for them, and anything unrecognized lands there too rather than on a
// screen with no pointer at all.
export function textSizeWhereToLook(platform: string): string {
  if (platform === 'ios') {
    return 'On an iPhone: Settings, then Accessibility, then Display & Text Size, then Larger Text.';
  }
  if (platform === 'android') {
    return 'On an Android phone: Settings, then Display, then Font size. Some phones put it under Accessibility instead.';
  }
  return 'In a browser: zoom the page, or raise the default font size in the browser settings.';
}

// ---------------------------------------------------------------------
// LETTER SPACING. The space between the letters of a word, which is a
// different thing from the space between lines above and has its own,
// better evidence behind it.
//
// Zorzi and colleagues (PNAS 2012) doubled the space between letters for
// dyslexic children of around ten and had them read with no training, no
// practice and no warning: reading was roughly 10% faster with about half
// as many errors, replicated across two languages. The explanation is
// crowding, where recognising a letter is degraded by how close its
// neighbours sit, which is more pronounced in dyslexia. That is a
// randomized result about the text rather than about the reader, which
// makes it one of the few accessibility settings in this app with a trial
// behind it rather than a preference.
//
// THE NUMBERS. 0.12 is the figure in WCAG 2.1 success criterion 1.4.12,
// the same criterion that gives line spacing its 1.5, so the two Wide
// steps are the same standard read twice rather than two separate taste
// calls. "Wider" at 0.18 goes past it. Nothing above that, because the
// gap between letters starts competing with the gap between words and the
// eye loses where one word ends.
//
// A FRACTION OF THE FONT, NOT A PIXEL COUNT, for the same reason the line
// ratios are: one setting has to be right for a 10px eyebrow and a 20px
// screen title at once, and stay right when the phone font scale moves
// underneath it. React Native wants letterSpacing in points, so the
// multiplication happens here rather than in the style.
//
// AND IT ADDS. constants/typography.ts already sets letterSpacing 0.4 on
// the eyebrow tier to make a 10px structural label read as a label. That
// is deliberate and stays, so this is handed the existing value as `base`
// and adds to it rather than replacing it. The eyebrow tier would
// otherwise come out TIGHTER than it is now at the Wide setting on small
// text, which is the opposite of what the setting says it does.
export type LetterSpacingKey = 'normal' | 'wide' | 'wider';

export const DEFAULT_LETTER_SPACING: LetterSpacingKey = 'normal';

export const ALL_LETTER_SPACING_KEYS: LetterSpacingKey[] = ['normal', 'wide', 'wider'];

export const LETTER_SPACING_LABELS: Record<LetterSpacingKey, string> = {
  normal: 'Normal',
  wide: 'Wide',
  wider: 'Wider',
};

// null means "leave the style alone", which for the eyebrow tier means
// keeping its own 0.4 and for every other tier means setting nothing at
// all. Not the same as 0, which would flatten the eyebrow.
export const LETTER_SPACING_RATIOS: Record<LetterSpacingKey, number | null> = {
  normal: null,
  wide: 0.12,
  wider: 0.18,
};

export const LETTER_SPACING_CAPTIONS: Record<LetterSpacingKey, string> = {
  normal: 'Whatever the text was already doing.',
  wide: 'The letters of a word move apart. This is the spacing the accessibility standard asks for, and the one with a randomized trial behind it.',
  wider: 'More again, for when the letters still crowd each other.',
};

export function isLetterSpacingKey(value: string): value is LetterSpacingKey {
  return (ALL_LETTER_SPACING_KEYS as string[]).includes(value);
}

// Same contract as normalizeLineSpacing above: anything stored by a later
// version, or by a hand-edited file, comes back as the default rather
// than as a key nothing knows how to render.
export function normalizeLetterSpacing(value: string | null | undefined): LetterSpacingKey {
  if (typeof value === 'string' && isLetterSpacingKey(value)) return value;
  return DEFAULT_LETTER_SPACING;
}

// The letterSpacing to put on a piece of text of this size, or null to
// leave it be.
//
// `base` is whatever the style already asked for, so the eyebrow tier
// keeps its 0.4 and gains the setting on top of it. Anything that is not
// a usable number counts as 0 rather than poisoning the result with NaN.
//
// Rounded to one decimal rather than to a whole point, which line height
// is: a whole-point round would take 14px text from 1.68 to 2, a jump of
// nearly a fifth, and letterSpacing is not sitting inside a fixed-height
// row where a fraction shows up as text off centre.
export function letterSpacingFor(
  fontSize: number | null | undefined,
  spacing: LetterSpacingKey,
  base: number = 0,
): number | null {
  const ratio = LETTER_SPACING_RATIOS[spacing] ?? null;
  if (ratio === null) return null;
  if (typeof fontSize !== 'number' || !Number.isFinite(fontSize) || fontSize <= 0) return null;
  const from = typeof base === 'number' && Number.isFinite(base) ? base : 0;
  return Math.round((from + fontSize * ratio) * 10) / 10;
}

// What the setting is currently doing, for the line under the picker.
export function describeLetterSpacing(spacing: LetterSpacingKey): string {
  return LETTER_SPACING_CAPTIONS[spacing];
}
