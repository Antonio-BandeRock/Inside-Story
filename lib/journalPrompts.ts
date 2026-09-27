// Journal prompts, D14 of the competitive build plan (Phase 2, 2026-09-26).
// A short list above the note in Signals > General Note, for a day when a
// blank box is the hard part. Tapping one puts the question into the note
// as its own line, and whatever the person writes under it is theirs. The
// questions ask what happened and what somebody noticed; none of them asks
// whether a day was good, and none suggests what a day ought to have held.
//
// Pure, so scripts/test_journal_prompts.js can check it without a phone.

export const JOURNAL_PROMPTS: string[] = [
  'What took the most out of you today?',
  'What went easier than you expected?',
  'Was anything different from a usual day?',
  'What did your body tell you today?',
  'What would you like to remember about today?',
  'What is on your mind for tomorrow?',
];

// The note with a prompt added: the prompt alone when the note is empty,
// otherwise on a new line under what is there. A prompt already in the note
// is not added twice.
export function withPrompt(note: string, prompt: string): string {
  const trimmed = note.replace(/\s+$/, '');
  if (trimmed.length === 0) return `${prompt}\n`;
  if (trimmed.split('\n').some((line) => line.trim() === prompt)) return note;
  return `${trimmed}\n\n${prompt}\n`;
}
