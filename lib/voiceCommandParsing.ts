// A real, deterministic spoken-command parser for dictated text, built
// 2026-08-16 alongside the whole voice-input feature (see
// hooks/useVoiceDictation.ts and components/VoiceInputButton.tsx). This
// exists because neither Android's SpeechRecognizer nor iOS's
// SFSpeechRecognizer hand back structured commands on their own -- both
// just transcribe the literal words spoken, so a person saying "flour
// comma new paragraph sugar" gets back the plain text "flour comma new
// paragraph sugar," not "flour,\n\nsugar." This module is what turns the
// first into the second: a real, stateless, testable function scanning a
// finished transcript for a known set of spoken phrases and substituting
// each one for the real character/formatting it names, so a person can
// speak an ingredient list or a set of recipe steps and get real
// structure out of it, matching the direct request this was built for
// ("cues built in for making a bulleted list and next paragraph, and that
// sort of thing, so they can speak what they need to be able to build
// their recipe").
//
// Deliberately scoped to a real, focused set of commands rather than an
// open-ended grammar -- every phrase here was picked because it's either
// the exact language named in the original request (bulleted list, next
// paragraph) or genuinely common, low-ambiguity dictation vocabulary
// (period, comma, question mark) a person building a real recipe note
// would actually reach for. Not attempted: smart auto-capitalization
// after a sentence-ending command, since that needs real cross-sentence
// state this app's own text fields don't currently track, and would be
// guessing at intent a plain search-and-replace shouldn't guess at.

export type VoiceCommandParseResult = {
  text: string;
  // True once any bulleted-list command has fired anywhere in this pass --
  // the caller (see appendDictatedText below) uses this only to decide
  // whether a fresh line should already start with a bullet marker; the
  // parser itself is otherwise fully stateless from one call to the next.
  endsInsideBulletedList: boolean;
};

// Longest-phrase-first, case-insensitive, matched as whole words (never a
// substring inside an unrelated word) -- e.g. "period" only replaces the
// standalone word "period," never the "period" inside "periodic." Order
// matters here: a phrase must be listed before any shorter phrase that's
// also a real prefix of it (e.g. "new bullet point" before "new bullet"),
// or the shorter one would always win the match first.
const COMMAND_PHRASES: { phrase: string; kind: 'paragraph' | 'line' | 'bulletStart' | 'bulletItem' | 'bulletEnd' | 'punctuation'; symbol?: string }[] = [
  { phrase: 'new paragraph', kind: 'paragraph' },
  { phrase: 'next paragraph', kind: 'paragraph' },
  { phrase: 'start a bulleted list', kind: 'bulletStart' },
  { phrase: 'start bulleted list', kind: 'bulletStart' },
  { phrase: 'begin a bulleted list', kind: 'bulletStart' },
  { phrase: 'begin bulleted list', kind: 'bulletStart' },
  { phrase: 'bulleted list', kind: 'bulletStart' },
  { phrase: 'new bullet point', kind: 'bulletItem' },
  { phrase: 'next bullet point', kind: 'bulletItem' },
  { phrase: 'new bullet', kind: 'bulletItem' },
  { phrase: 'next bullet', kind: 'bulletItem' },
  { phrase: 'bullet point', kind: 'bulletItem' },
  { phrase: 'end bulleted list', kind: 'bulletEnd' },
  { phrase: 'end the bulleted list', kind: 'bulletEnd' },
  { phrase: 'stop bulleted list', kind: 'bulletEnd' },
  { phrase: 'end list', kind: 'bulletEnd' },
  { phrase: 'stop list', kind: 'bulletEnd' },
  { phrase: 'new line', kind: 'line' },
  { phrase: 'next line', kind: 'line' },
  { phrase: 'full stop', kind: 'punctuation', symbol: '.' },
  { phrase: 'period', kind: 'punctuation', symbol: '.' },
  { phrase: 'comma', kind: 'punctuation', symbol: ',' },
  { phrase: 'question mark', kind: 'punctuation', symbol: '?' },
  { phrase: 'exclamation point', kind: 'punctuation', symbol: '!' },
  { phrase: 'exclamation mark', kind: 'punctuation', symbol: '!' },
  { phrase: 'colon', kind: 'punctuation', symbol: ':' },
  { phrase: 'semicolon', kind: 'punctuation', symbol: ';' },
];

// Sorted once, longest word-count first, so the greedy matcher below
// always prefers the more specific phrase over a shorter prefix of it.
const SORTED_COMMANDS = [...COMMAND_PHRASES].sort(
  (a, b) => b.phrase.split(' ').length - a.phrase.split(' ').length,
);

const BULLET_MARKER = '• '; // "• "

/**
 * Parses one finished dictation transcript, replacing every recognized
 * spoken command with the real text/formatting it names. Plain words that
 * don't match any known command pass through unchanged, in the casing the
 * recognizer returned them in.
 */
export function parseVoiceCommands(rawTranscript: string): VoiceCommandParseResult {
  const words = rawTranscript.trim().split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return { text: '', endsInsideBulletedList: false };
  }

  const lowerWords = words.map((word) => word.toLowerCase().replace(/[.,!?;:]+$/, ''));
  const segments: string[] = [];
  let insideBulletedList = false;
  let i = 0;

  while (i < words.length) {
    let matched: (typeof SORTED_COMMANDS)[number] | null = null;
    let matchedWordCount = 0;
    for (const command of SORTED_COMMANDS) {
      const phraseWords = command.phrase.split(' ');
      if (i + phraseWords.length > lowerWords.length) continue;
      const candidate = lowerWords.slice(i, i + phraseWords.length).join(' ');
      if (candidate === command.phrase) {
        matched = command;
        matchedWordCount = phraseWords.length;
        break;
      }
    }

    if (matched) {
      switch (matched.kind) {
        case 'paragraph':
          segments.push('\n\n');
          insideBulletedList = false;
          break;
        case 'line':
          segments.push('\n');
          break;
        case 'bulletStart':
          segments.push(segments.length > 0 ? `\n${BULLET_MARKER}` : BULLET_MARKER);
          insideBulletedList = true;
          break;
        case 'bulletItem':
          segments.push(`\n${BULLET_MARKER}`);
          insideBulletedList = true;
          break;
        case 'bulletEnd':
          segments.push('\n');
          insideBulletedList = false;
          break;
        case 'punctuation':
          // Attaches directly to whatever was just said, with no space
          // before it -- "flour comma" should read "flour," not "flour ,".
          if (segments.length > 0) {
            segments[segments.length - 1] = segments[segments.length - 1].replace(/\s+$/, '');
          }
          segments.push(`${matched.symbol} `);
          break;
      }
      i += matchedWordCount;
      continue;
    }

    // An ordinary spoken word: append it, with a leading space unless
    // this is genuinely the start of the whole transcript, or the
    // previous segment already ends in its own whitespace/newline (a
    // paragraph break, a bullet marker, or a punctuation mark's own
    // trailing space all already provide real separation, so adding a
    // second leading space here would double it up -- checking the
    // ACTUAL last character, rather than a separately-tracked "am I at
    // a line start" flag, is what a real test case caught this on:
    // tracking a second, parallel boolean by hand at every branch above
    // drifted out of sync with what was really being pushed).
    const previousSegment = segments[segments.length - 1];
    const needsLeadingSpace = segments.length > 0 && !/\s$/.test(previousSegment ?? '');
    segments.push(needsLeadingSpace ? ` ${words[i]}` : words[i]);
    i += 1;
  }

  return {
    text: segments.join('').replace(/[ \t]+\n/g, '\n').trimEnd(),
    endsInsideBulletedList: insideBulletedList,
  };
}

/**
 * Combines a freshly-dictated (and already command-parsed) chunk of text
 * with whatever a note field already contains, adding a real separator
 * between the two only when one is genuinely needed -- so tapping the mic
 * a second time to add another sentence doesn't run the new words
 * straight into the end of the old ones with nothing between them, but
 * also doesn't add a redundant blank line after something that already
 * ended in one (a "new paragraph" command, for instance).
 */
export function appendDictatedText(existingText: string, parsed: VoiceCommandParseResult): string {
  const trimmedExisting = existingText.replace(/\s+$/, '');
  if (trimmedExisting.length === 0) return parsed.text;
  if (parsed.text.length === 0) return existingText;
  // When the freshly-parsed text already opens with its own newline (a
  // "new paragraph"/"new line"/bullet command spoken first), that
  // newline IS the real separator -- adding a second one here would
  // double it up (a real bug an actual test case caught: "Step one." +
  // "\n\nstep two" produced three newlines, not two, when this used to
  // always add its own on top).
  const startsWithOwnBreak = /^\n/.test(parsed.text);
  const separator = startsWithOwnBreak ? '' : ' ';
  return `${trimmedExisting}${separator}${parsed.text}`;
}
