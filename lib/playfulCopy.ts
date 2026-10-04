// Playful wording, 2026-10-03. Direct request after the Ghostead trailer went
// up on ghostead.com: "How can we inject this kind of playfulness into the
// app, too?", then "On by default ... If the user tells the app from the start
// they have a neurodivergent mind, we can offer to be more direct, without the
// playful stuff."
//
// Every line that can be playful lives here, in two versions, and a screen
// asks for it by key. That is what makes the switch in Profile honest: turning
// it off gives every one of these back in its plain form, and nothing playful
// is written anywhere else for an audit to miss.
//
// The limits the owner approved, which scripts/audit_playful_copy.js checks:
//   1. Playful about the app, the technology and the data industry, never
//      about the person.
//   2. Never on a screen about symptoms, flares, labs, medications, the
//      emergency card, condition reading, Pattern Finder or an advisory, and
//      never in grief, family history or the Diary.
//   3. No praise and no scoring.
//   4. The plain fact comes first and the joke after it, so a person who
//      stops reading halfway has still been told everything.
//   5. Every playful line has a plain twin. A twin of null means the plain
//      version shows nothing at all in that place (a hidden touch, or an
//      aside that only exists to be playful).
//
// Pure: no React and no database, so node can load it. The switch reaches it
// through setPlayfulWordingEnabled, which lib/visualPreferences.ts calls
// every time the preference is loaded or changed.

export type PlayfulLine = {
  /** What shows with Playful wording off. null shows nothing in its place. */
  plain: string | null;
  /** What shows with Playful wording on, which is the default. */
  playful: string;
};

const NO_RESET_PLAIN_BACKUP =
  "This encrypts your backup so only someone who has this password can ever read it: not a text editor, not an AI tool, nothing. Choose something you'll remember; there's no way to reset it later.";

const NO_RESET_PLAIN_SYNC_TAIL = ' Choose something you will remember; there is no way to reset it later.';

const SYNC_EMPTY_PLAIN =
  'Once your other device saves something while automatic sync is on, or somebody you share with does, what came over shows up here.';

const WHERE_EMPTY_PLAIN =
  'Nothing has a place written down yet. Add one to a kitchen item, or throw a note into Capture and sort it to Where it is.';

const CAMERA_TAIL = 'The camera lives on your phone. Your computer is jealous, but it is coping.';

export const PLAYFUL_COPY = {
  // ---------------------------------------------------------------- about
  aboutLede: {
    plain:
      'Inside Story is made by Ghostead. Ghostead apps keep your records on your devices and nowhere else: no account database, no analytics, no usage file. Nothing about you is collected.',
    playful:
      'Inside Story is made by Ghostead. Ghostead apps keep your records on your devices and nowhere else: no account database, no analytics, no "anonymized" usage file, which is usually about as anonymous as a name tag.',
  },
  aboutBreakIn: {
    plain: 'If anybody broke into the Ghostead office, there would be nothing of yours there to find.',
    playful:
      'Could someone break into the Ghostead office? Sure. Go nuts. They would find source code and a coffee mug. It is a nice mug. Please don\'t take the mug.',
  },
  aboutNotGhosting: {
    plain: null,
    playful:
      'And no, this is not ghosting. Ghosting is leaving people. A ghostead app leaves no trace of the people who use it. One of them is a red flag. The other one is us.',
  },
  aboutTrailerLink: {
    plain: 'Read about Ghostead',
    playful: 'Watch the trailer (it is words, read in your head, very loudly)',
  },

  // -------------------------------------------------------------- privacy
  backupNoReset: {
    plain: NO_RESET_PLAIN_BACKUP,
    playful:
      NO_RESET_PLAIN_BACKUP +
      " We can't reset it, because we never had it. We checked. Twice. It's just the mug in here.",
  },
  syncNoResetTail: {
    plain: NO_RESET_PLAIN_SYNC_TAIL,
    playful:
      NO_RESET_PLAIN_SYNC_TAIL +
      " We can't reset it, because we never had it. We checked. Twice. It's just the mug in here.",
  },
  appLockLocked: {
    plain: null,
    playful: "Locked. Even we can't get in. Especially we can't get in.",
  },
  appLockNoReset: {
    plain:
      'If both the passcode and the recovery key are lost, your records cannot be opened by anybody, and that includes the people who make the app. There is no reset.',
    playful:
      "If both the passcode and the recovery key are lost, your records cannot be opened by anybody, and that includes the people who make the app. There is no reset. Locked means locked. Even we can't get in. Especially we can't get in.",
  },
  syncActivityEmpty: {
    plain: SYNC_EMPTY_PLAIN,
    playful: "Nothing has moved between your devices. They're getting along fine. " + SYNC_EMPTY_PLAIN,
  },

  // --------------------------------------------------------- empty states
  gardenEmpty: {
    plain: "No garden areas yet. Add one below to start tracking what you're growing.",
    playful: "No garden areas yet. Even the tomatoes are waiting. Add one below to start tracking what you're growing.",
  },
  whereIsItEmpty: {
    plain: WHERE_EMPTY_PLAIN,
    playful:
      "Nothing has a place written down yet, so you haven't lost anything yet. Statistically, this won't last. Add a place to a kitchen item, or throw a note into Capture and sort it to Where it is.",
  },
  daysUntilNoneCompactLead: {
    plain: 'No counters running.',
    playful: 'No counters running. Suspiciously calm.',
  },
  daysUntilNoneLead: {
    plain: null,
    playful: 'Nothing to count down to yet. Suspiciously calm.',
  },

  // ------------------------------------------------- the desktop's limits
  phoneOnlyCamera: { plain: null, playful: CAMERA_TAIL },
  phoneOnlyVoice: {
    plain: null,
    playful: 'The listening happens on your phone. Your computer is a good listener in every way but this one.',
  },
  phoneOnlyHealthConnect: {
    plain: null,
    playful: 'Your computer has never taken a step in its life. It is not going to start now.',
  },
  phoneOnlyWifiSync: {
    plain: null,
    playful: "Your computer wasn't invited. It says it's fine. It's fine.",
  },
  phoneOnlyCalendar: {
    plain: null,
    playful: 'Your phone keeps its calendar to itself. Fair enough, really.',
  },
  phoneOnlyLightMeter: {
    plain: null,
    playful: 'Your computer has never seen the sun. Be gentle with it.',
  },

  // ----------------------------------------------- when something fails
  folderUnreachableTail: {
    plain: null,
    playful: 'Everything you recorded is safe on this device. The folder just is not answering the door right now.',
  },

  // ------------------------------------------------------ hidden touches
  versionMug: {
    plain: null,
    playful: "Please don't take the mug.",
  },
  tellClaudeSaved: {
    plain: 'Written down.',
    playful: 'Written down for the developer. Nobody else. Not even the toaster.',
  },

  // ---------------------------------------- the offer to turn it all off
  plainWordingOffer: {
    plain: 'The app is using plain, direct wording.',
    playful:
      'Some empty screens and notices in this app carry a light joke after the facts. Would you rather it kept to plain, direct wording?',
  },
} satisfies Record<string, PlayfulLine>;

export type PlayfulKey = keyof typeof PLAYFUL_COPY;

let playfulEnabled = true;

/** Called by lib/visualPreferences.ts whenever the preference loads or changes. */
export function setPlayfulWordingEnabled(enabled: boolean): void {
  playfulEnabled = enabled;
}

export function isPlayfulWordingEnabled(): boolean {
  return playfulEnabled;
}

/** The line for this key in whichever wording is switched on. */
export function wording(key: PlayfulKey, playful: boolean = playfulEnabled): string | null {
  const line: PlayfulLine = PLAYFUL_COPY[key];
  return playful ? line.playful : line.plain;
}

/** For a joke that follows a plain sentence: the sentence alone, or the sentence and the joke. */
export function withPlayfulTail(
  plainText: string,
  key: PlayfulKey,
  separator = '\n\n',
  playful: boolean = playfulEnabled,
): string {
  const tail = wording(key, playful);
  return tail ? plainText + separator + tail : plainText;
}
