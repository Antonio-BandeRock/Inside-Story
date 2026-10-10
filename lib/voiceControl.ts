// Plain words into one thing to do, for Voice Control (1.0.66.11).
//
// Direct instruction, 2026-10-10: "I do mean they can do everything in the
// app by voice command using plain words, and not just some things." So the
// sentence shapes are few and the names are whatever is on screen: a tab, a
// lens, the words on a button, the label or hint in a text box. What is on
// screen comes from lib/voiceControlRegistry.ts; this file only decides, and
// is pure so scripts/test_voice_control.js checks it in plain node.
//
// It never guesses between two things with the same claim on a name: two
// matches come back as a choice for the person to pick. A sentence that
// names nothing on screen comes back as notFound with the name it heard.

export type VoiceTarget = { id: string; name: string };

export type VoiceScreen = {
  tabs: VoiceTarget[];
  lenses: VoiceTarget[];
  controls: VoiceTarget[];
  fields: VoiceTarget[];
};

export type VoiceCommand =
  | { kind: 'help' }
  | { kind: 'back' }
  | { kind: 'scroll'; move: 'up' | 'down' | 'top' | 'bottom' }
  | { kind: 'tab'; id: string }
  | { kind: 'lens'; id: string }
  | { kind: 'press'; ids: string[] }
  | { kind: 'type'; text: string; fieldIds: string[] }
  | { kind: 'notFound'; heard: string };

export const VOICE_EXAMPLES = [
  'Go to Garden',
  'Open Horticulture',
  'Press Save',
  'Type milk in Search',
  'Scroll down',
  'Go back',
];

function tidy(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[.!?,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// What a name is compared as: lower case, no punctuation or symbols, no
// leading "the" or "my", and no trailing word that only says what kind of
// thing it is ("the Save button", "the Garden tab").
export function voiceKey(text: string): string {
  return tidy(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/'/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|my|a|an)\s+/, '')
    .replace(/\s+(button|tab|lens|page|screen|box|field|link|option|menu)$/, '')
    .trim();
}

// 3 for the whole name, 2 for the start of it, 1 for every word said being
// somewhere in it, 0 for none.
function score(said: string, name: string): number {
  const a = voiceKey(said);
  const b = voiceKey(name);
  if (!a || !b) return 0;
  if (a === b) return 3;
  if (b.startsWith(`${a} `)) return 2;
  const words = b.split(' ');
  return a.split(' ').every((word) => words.includes(word)) ? 1 : 0;
}

// Every target with the best score, or none.
export function bestMatches(said: string, targets: VoiceTarget[]): VoiceTarget[] {
  let best = 0;
  let found: VoiceTarget[] = [];
  for (const target of targets) {
    const s = score(said, target.name);
    if (s === 0 || s < best) continue;
    if (s > best) {
      best = s;
      found = [];
    }
    found.push(target);
  }
  return found;
}

function bestScore(said: string, targets: VoiceTarget[]): number {
  return targets.reduce((most, target) => Math.max(most, score(said, target.name)), 0);
}

const GO = /^(?:please\s+)?(?:go to|go into|open up|open|show me|show|take me to|switch to|navigate to|bring up)\s+(.+)$/i;
const PRESS = /^(?:please\s+)?(?:press|tap|click|click on|tap on|hit|select|choose|pick|push)\s+(.+)$/i;
const TYPE = /^(?:please\s+)?(?:type|write|enter|put|fill in|add)\s+(.+?)\s+(?:in|into|in to|on)\s+(?:the\s+)?(.+?)$/i;
const TYPE_BARE = /^(?:please\s+)?(?:type|write|enter)\s+(.+)$/i;
const SEARCH = /^(?:please\s+)?(?:search for|search|look up|find)\s+(.+)$/i;

export function resolveVoiceCommand(spoken: string, screen: VoiceScreen): VoiceCommand {
  const said = tidy(spoken);
  const key = voiceKey(said);
  if (!key) return { kind: 'notFound', heard: '' };

  if (/^(help|what can i say|what do i say|commands)$/.test(key)) return { kind: 'help' };
  if (/^(go back|back|previous screen|go to the previous screen)$/.test(key)) return { kind: 'back' };

  const scroll = /^(?:scroll|page|move|go)\s+(up|down|to the top|to the bottom|top|bottom)$/.exec(key);
  if (scroll) {
    const word = scroll[1].replace('to the ', '') as 'up' | 'down' | 'top' | 'bottom';
    return { kind: 'scroll', move: word };
  }

  // "Type milk in search": the box is named last, so the last "in" splits
  // the sentence, and "type one in ten in the notes" types "one in ten".
  const typed = TYPE.exec(said);
  if (typed) {
    const whole = said.replace(/^(?:please\s+)?(?:type|write|enter|put|fill in|add)\s+/i, '');
    const split = /^(.+)\s+(?:in|into|in to|on)\s+(?:the\s+)?(.+?)$/i.exec(whole);
    const text = split ? split[1] : typed[1];
    const boxName = split ? split[2] : typed[2];
    const fieldMatches = bestMatches(boxName, screen.fields);
    if (fieldMatches.length) return { kind: 'type', text, fieldIds: fieldMatches.map((f) => f.id) };
    if (!/^(add|put)\b/i.test(said)) return { kind: 'notFound', heard: boxName };
    // "Add milk to the list" is not about a box; it falls through to press.
  }

  const searched = SEARCH.exec(said);
  if (searched) {
    const searchBoxes = screen.fields.filter((f) => /\b(search|find|look up)\b/i.test(f.name));
    if (searchBoxes.length) return { kind: 'type', text: searched[1], fieldIds: searchBoxes.map((f) => f.id) };
  }

  const bare = TYPE_BARE.exec(said);
  if (bare && !typed) return { kind: 'type', text: bare[1], fieldIds: screen.fields.map((f) => f.id) };

  const go = GO.exec(said);
  if (go) {
    const where = go[1];
    const place = goTo(where, screen);
    if (place) return place;
    const pressed = bestMatches(where, screen.controls);
    if (pressed.length) return { kind: 'press', ids: pressed.map((c) => c.id) };
    return { kind: 'notFound', heard: where };
  }

  const press = PRESS.exec(said);
  if (press) {
    const pressed = bestMatches(press[1], screen.controls);
    if (pressed.length) return { kind: 'press', ids: pressed.map((c) => c.id) };
    const place = goTo(press[1], screen);
    if (place) return place;
    return { kind: 'notFound', heard: press[1] };
  }

  // A name said on its own: a button on this screen first, since that is
  // what is in front of the person, unless a tab or lens has the whole name
  // and the button only part of it.
  const controlScore = bestScore(said, screen.controls);
  const placeScore = Math.max(bestScore(said, screen.tabs), bestScore(said, screen.lenses));
  if (controlScore > 0 && controlScore >= placeScore) {
    return { kind: 'press', ids: bestMatches(said, screen.controls).map((c) => c.id) };
  }
  const place = goTo(said, screen);
  if (place) return place;
  return { kind: 'notFound', heard: said };
}

// A lens on this tab before a tab, since "open Meds" on Schedules means the
// lens there; a tab only when no lens has as good a claim.
function goTo(where: string, screen: VoiceScreen): VoiceCommand | null {
  const lensScore = bestScore(where, screen.lenses);
  const tabScore = bestScore(where, screen.tabs);
  if (lensScore === 0 && tabScore === 0) return null;
  if (lensScore >= tabScore) {
    const lenses = bestMatches(where, screen.lenses);
    if (lenses.length === 1) return { kind: 'lens', id: lenses[0].id };
  }
  const tabs = bestMatches(where, screen.tabs);
  if (tabs.length === 1 && tabScore > 0) return { kind: 'tab', id: tabs[0].id };
  return null;
}

// What Voice Control shows when a sentence named nothing on screen.
export function describeNotFound(heard: string): string {
  if (!heard) return 'Nothing was heard. Tap the microphone and say a command.';
  return `Nothing on this screen is called “${heard}”. Say the words on the button, the name of a tab or lens, or “help”.`;
}
