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
  // The trailer button is two lines, 2026-10-03: the title, then the aside
  // under it in smaller type.
  aboutTrailerTitle: {
    plain: 'Read about Ghostead',
    playful: 'Watch the trailer',
  },
  aboutTrailerAside: {
    plain: null,
    playful: '(it is words, read in your head, very loudly)',
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
      ' Both devices will ask you for it. Neither one will remind you what it was.',
  },
  appLockLocked: {
    plain: null,
    playful: "Locked. Even we can't get in. Especially we can't get in.",
  },
  appLockNoReset: {
    plain:
      'If both the passcode and the recovery key are lost, your records cannot be opened by anybody, and that includes the people who make the app. There is no reset.',
    playful:
      "If both the passcode and the recovery key are lost, your records cannot be opened by anybody, and that includes the people who make the app. There is no reset. A back door for us would be a back door for anyone, so there isn't one.",
  },
  syncActivityEmpty: {
    plain: SYNC_EMPTY_PLAIN,
    playful: "Nothing has moved between your devices. They're getting along fine. " + SYNC_EMPTY_PLAIN,
  },

  // --------------------------------------------------------- empty states
  gardenEmpty: {
    plain: "No garden areas yet. Add one below to start tracking what you're growing.",
    playful: "No garden areas yet. The soil is in no hurry. Add one below to start tracking what you're growing.",
  },
  whereIsItEmpty: {
    plain: WHERE_EMPTY_PLAIN,
    playful:
      WHERE_EMPTY_PLAIN + ' The best moment to add one is right after putting something away, while you still know.',
  },
  daysUntilNoneCompactLead: {
    plain: 'No counters running.',
    playful: 'No counters running. The calendar is quiet.',
  },
  daysUntilNoneLead: {
    plain: null,
    playful: 'Nothing to count down to yet. Add a date and this starts doing arithmetic.',
  },

  // ------------------------------------------------- the desktop's limits
  phoneOnlyCamera: {
    plain: null,
    playful: 'A webcam pointed at a plate has never gone well, so this one stays with the phone.',
  },
  phoneOnlyVoice: {
    plain: null,
    playful: 'The speech recognition this uses is built into the phone, and the computer was not issued one.',
  },
  phoneOnlyHealthConnect: {
    plain: null,
    playful: 'Computers rarely leave the desk, so there would be very little to count.',
  },
  phoneOnlyWifiSync: {
    plain: null,
    playful: 'It is a conversation between two phones in one room, and the computer has the sense to stay out of it.',
  },
  phoneOnlyCalendar: {
    plain: null,
    playful: 'The calendar belongs to the phone, and the phone is not lending it out.',
  },
  phoneOnlyLightMeter: {
    plain: null,
    playful: 'The light sensor is on the phone. Holding a laptop up to a tomato plant is not advised.',
  },

  // ----------------------------------------------- when something fails
  folderUnreachableTail: {
    plain: null,
    playful: 'Everything you recorded is safe on this device. It will knock again later.',
  },

  // ------------------------------------------------------ hidden touches
  // The mug on the corner version number is an icon with no words, so it is
  // not here: components/VersionLabel.tsx shows it only while this is on.
  tellClaudeSaved: {
    plain: 'Written down.',
    playful: 'Written down for the developer, and for nobody else.',
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
