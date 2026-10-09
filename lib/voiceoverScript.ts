// The Ghostead trailer scripts, for the voiceover recorder in Profile >
// Developer Tools (components/VoiceoverRecorder.tsx). Each take is saved as
// <id>.m4a, which is the name the trailer page looks for in its voice/
// folder before falling back to a stand-in voice.
//
// 2026-10-06: one script became nine (the tightened main cut, two more long
// pieces and six short spots, drafted on the Trailer Script Drafts page).
// Every id carries its script's prefix, so the takes of all nine can sit in
// one folder without two lines sharing a file name. Sound effects, silences
// and stage business are not lines, since nobody records them; where a line
// carries stage business it is folded into the direction instead.
//
// The Ghostead site's public/trailer/script.json still plays the old cut,
// whose ids were n01 to g09. When a scene is rebuilt for one of these
// scripts, its cues take these ids, words and directions.

export type VoiceoverSpeaker = 'paranoiac' | 'realist';

export type VoiceoverLine = {
  id: string;
  speaker: VoiceoverSpeaker;
  text: string;
  direction: string;
};

export type VoiceoverScript = {
  key: string;
  title: string;
  length: 'long' | 'short';
  lines: readonly VoiceoverLine[];
};

const P: VoiceoverSpeaker = 'paranoiac';
const R: VoiceoverSpeaker = 'realist';

export const VOICEOVER_SCRIPTS: readonly VoiceoverScript[] = [
  {
    key: 'breach',
    title: 'The Breach (main cut)',
    length: 'long',
    lines: [
      { id: 'breach-01', speaker: P, text: 'It started... with a "free" app.', direction: 'Gravelly and unblinking, like reading from a journal. Low and slow, a campfire story.' },
      { id: 'breach-02', speaker: P, text: 'Nothing is free. I KNOW THAT NOW.', direction: 'Hoarse whisper on the first three words, then suddenly shout the rest.' },
      { id: 'breach-03', speaker: P, text: 'Then it knew where you were. Then it knew what you ate. Then it knew... what you\'d eat next.', direction: 'Clipped journal pacing, building one thing at a time. Lean on "next".' },
      { id: 'breach-04', speaker: P, text: 'All of it, on their servers. Far from you. In the dark.', direction: 'Ominous and certain. Drop toward a whisper on "In the dark".' },
      { id: 'breach-05', speaker: P, text: '...the breach.', direction: 'Comes after the thunder. Grave, two words, flat as a verdict.' },
      { id: 'breach-06', speaker: P, text: 'It\'s GONE. There is no "undo"! There is no little trash can you can drag it out of!', direction: 'He has just stood up. Coming apart. Shout GONE.' },
      { id: 'breach-07', speaker: P, text: 'Your password, the one with your dog\'s name and a 1 on the end? OUT THERE.', direction: 'Leaning in, almost confiding, then shout OUT THERE.' },
      { id: 'breach-08', speaker: P, text: 'They said "your privacy matters to us." IT MATTERED TO THEM. Like a wallet matters to a pickpocket!', direction: 'Betrayed, voice cracking. Shout the middle sentence.' },
      { id: 'breach-09', speaker: P, text: 'I put tape over my camera. I put tape over the tape. My toaster has an app now. WHY DOES MY TOASTER NEED AN APP?', direction: 'Listing it all, faster and faster, then full shout at the toaster.' },
      { id: 'breach-10', speaker: P, text: 'It knows when I make toast.', direction: 'Sitting back down. A haunted whisper.' },
      { id: 'breach-11', speaker: R, text: 'Okay. Wow. Somebody get him a blanket and a juice box.', direction: 'Right after the record scratch. Deadpan, unimpressed, refusing to match his energy.' },
      { id: 'breach-12', speaker: R, text: 'Hi. I\'ll take it from here.', direction: 'Friendly and completely relaxed, straight to the viewer.' },
      { id: 'breach-13', speaker: R, text: 'Ghostead. Ghost: leaves no trace. Homestead: the place you live and keep. Our apps keep your records on your devices, in your home. Like a houseplant. A houseplant that knows your cholesterol.', direction: 'Casual, like explaining something obvious. Small pause before the houseplant.' },
      { id: 'breach-14', speaker: R, text: 'No account database. No analytics. We can\'t lose your data, because we never have it.', direction: 'Matter of fact, a little pleased with himself on the last part.' },
      { id: 'breach-15', speaker: R, text: 'Could someone break into our office? Sure. You\'ll find source code... and a mug.', direction: 'A shrug in the voice. Let "and a mug" land.' },
      { id: 'breach-16', speaker: R, text: 'It\'s a nice mug. Please don\'t take the mug.', direction: 'After a beat. Suddenly tender, a little pleading.' },
      { id: 'breach-17', speaker: P, text: '...the toaster knows...', direction: 'Faint, from the doorway behind him.' },
      { id: 'breach-18', speaker: R, text: 'Yeah, we\'re gonna go check on him.', direction: 'Resigned and kind. A sigh with a smile in it.' },
    ],
  },
  {
    key: 'heist',
    title: 'The Heist',
    length: 'long',
    lines: [
      { id: 'heist-01', speaker: P, text: 'They say they keep nothing. Nobody keeps nothing.', direction: 'Night-vision goggles on, crouched outside. A tight, certain whisper.' },
      { id: 'heist-02', speaker: P, text: 'Tonight... I find the servers.', direction: 'Whisper, savouring it.' },
      { id: 'heist-03', speaker: P, text: 'I\'m in. Laser grid. Of course.', direction: 'Whisper, a little out of breath from the rope. Grim, he expected this.' },
      { id: 'heist-04', speaker: P, text: '...It\'s a cat toy. They have a cat.', direction: 'The dot is a toy. Deflated, then suspicious.' },
      { id: 'heist-05', speaker: P, text: 'The cat knows.', direction: 'After the meow. Dead serious whisper.' },
      { id: 'heist-06', speaker: P, text: 'The desk. The drawer. Where they keep the bodies... of DATA.', direction: 'Whisper, building, and hiss DATA.' },
      { id: 'heist-07', speaker: P, text: 'Source code. A houseplant. No customer files. No database. No little spreadsheet of my toast.', direction: 'Going through the drawer. A beat after "Source code" and after "A houseplant", then rising disbelief.' },
      { id: 'heist-08', speaker: P, text: 'WHERE ARE YOU HIDING IT?', direction: 'Full shout at the empty office.' },
      { id: 'heist-09', speaker: P, text: '...They don\'t have it.', direction: 'After a long silence. Quiet, stunned whisper.' },
      { id: 'heist-10', speaker: P, text: 'Then I\'m taking the mug.', direction: 'Picking up the NICE mug. Petty and decisive.' },
      { id: 'heist-11', speaker: R, text: 'Morning.', direction: 'Walking in with the birds singing. Cheerful, before he notices.' },
      { id: 'heist-12', speaker: R, text: '...Okay.', direction: 'After a long beat staring at the empty spot on the desk. Very flat.' },
      { id: 'heist-13', speaker: R, text: 'He can have the code. The code doesn\'t know anything about you.', direction: 'To the viewer, very calm.' },
      { id: 'heist-14', speaker: R, text: 'The plant\'s fine. The cat\'s fine. Nobody\'s records were in here, because nobody\'s records are ever in here.', direction: 'Still calm, ticking it off.' },
      { id: 'heist-15', speaker: R, text: 'But that was a nice mug.', direction: 'Voice cracking, barely.' },
      { id: 'heist-16', speaker: P, text: 'It\'s a nice mug.', direction: 'Back at the fire, wrapped in a blanket, sipping from it. Content whisper.' },
    ],
  },
  {
    key: 'will',
    title: 'What You Leave Behind',
    length: 'long',
    lines: [
      { id: 'will-01', speaker: P, text: 'I\'ve been writing my will.', direction: 'Quiet, holding a folded sheet of paper. No ranting in this one.' },
      { id: 'will-02', speaker: P, text: 'To my sister, I leave the good flashlight.', direction: 'Reading it out, completely sincere.' },
      { id: 'will-03', speaker: P, text: 'To the data brokers... I leave everything. Apparently. They already have it.', direction: 'Bitter and tired, a beat before the last sentence.' },
      { id: 'will-04', speaker: P, text: 'My searches. My steps. Every night I was awake at 3 a.m. Forty years of me, spread across a thousand servers.', direction: 'Slow, listing what was taken.' },
      { id: 'will-05', speaker: P, text: 'And none of it is the part that mattered.', direction: 'Whisper.' },
      { id: 'will-06', speaker: P, text: 'Nobody out there knows I taught my nephew to whistle. Or what my mother\'s kitchen smelled like on a Sunday.', direction: 'Softening. The closest he gets to smiling.' },
      { id: 'will-07', speaker: R, text: 'Hey.', direction: 'Sitting down beside him and handing him a mug. Gentle.' },
      { id: 'will-08', speaker: R, text: 'That\'s the part worth keeping. And it should be yours. Not theirs.', direction: 'Warm, still unhurried. No joke in it.' },
      { id: 'will-09', speaker: R, text: 'Ghostead apps keep what you record with you, on your devices. Your words, in your home.', direction: 'Plain and kind.' },
      { id: 'will-10', speaker: R, text: 'And someday, if you want, you choose who it goes to. Nobody else.', direction: 'Quiet. (Undecided: if passing a story on is not built when this is shown, record "And yours to keep." as a second take.)' },
      { id: 'will-11', speaker: P, text: '...Not the toaster?', direction: 'After a beat. Small and hopeful.' },
      { id: 'will-12', speaker: R, text: 'Not the toaster.', direction: 'A flat half-smile you can hear.' },
    ],
  },
  {
    key: 'cookies',
    title: 'Accept All Cookies',
    length: 'short',
    lines: [
      { id: 'cookies-01', speaker: P, text: 'Accept all cookies. Accept. All. Cookies. Do you know how many times I\'ve pressed that?', direction: 'Spitting each word of the second "Accept. All. Cookies."' },
      { id: 'cookies-02', speaker: P, text: 'Nine thousand, four hundred and twelve.', direction: 'Haunted whisper. He has counted.' },
      { id: 'cookies-03', speaker: P, text: 'They aren\'t even cookies! I checked! NO CHOCOLATE CHIPS!', direction: 'Building, then full shout.' },
      { id: 'cookies-04', speaker: R, text: 'Our apps don\'t have a cookie banner. There\'s nothing to accept.', direction: 'After the record scratch. Deadpan.' },
      { id: 'cookies-05', speaker: R, text: 'He\'s going to need an actual cookie.', direction: 'After a beat, aside, a little sympathetic.' },
    ],
  },
  {
    key: 'terms',
    title: 'The Terms of Service',
    length: 'short',
    lines: [
      { id: 'terms-01', speaker: P, text: 'The terms of service. Forty thousand words. Longer than Hamlet. Less happy ending.', direction: 'Holding a stack of paper as tall as he is. Grim and weary.' },
      { id: 'terms-02', speaker: P, text: 'I\'m on page four. Page four says they can change page three.', direction: 'Rising disbelief.' },
      { id: 'terms-03', speaker: P, text: 'ANY TIME THEY WANT.', direction: 'Full shout.' },
      { id: 'terms-04', speaker: R, text: 'Ours is short. We don\'t take your data, so there isn\'t much to explain.', direction: 'After the record scratch. Easy and casual.' },
      { id: 'terms-05', speaker: R, text: 'Page one. The end.', direction: 'After a beat. Bone dry.' },
    ],
  },
  {
    key: 'partners',
    title: 'Trusted Partners',
    length: 'short',
    lines: [
      { id: 'partners-01', speaker: P, text: '"We may share your information with trusted partners."', direction: 'Reading it aloud slowly, like an accusation.' },
      { id: 'partners-02', speaker: P, text: 'WHO ARE THE PARTNERS? Who trusts them? Did anybody ask ME if I trust them?', direction: 'Shout the first question, then rant, hitting ME.' },
      { id: 'partners-03', speaker: P, text: 'I don\'t trust the partners.', direction: 'Whisper.' },
      { id: 'partners-04', speaker: R, text: 'We have no partners.', direction: 'After the record scratch. Deadpan.' },
      { id: 'partners-05', speaker: R, text: 'We barely have an office.', direction: 'After a beat, then a sip from the mug you can hear.' },
    ],
  },
  {
    key: '3am',
    title: '3 A.M. (Lifestead)',
    length: 'short',
    lines: [
      { id: '3am-01', speaker: P, text: 'My watch knows my heart rate. My scale knows my weight. My sleep app knows I was awake at 3 a.m.', direction: 'Listing, tighter on each one.' },
      { id: '3am-02', speaker: P, text: 'WHO ELSE KNOWS I WAS AWAKE AT 3 A.M.?', direction: 'Full shout.' },
      { id: '3am-03', speaker: R, text: 'Lifestead keeps your health records on your phone. Not on our servers. We don\'t have servers for that.', direction: 'After the record scratch. Calm and clear.' },
      { id: '3am-04', speaker: R, text: 'You were awake at 3 a.m. That one stays between you and the ceiling.', direction: 'After a beat. Dry, with a little warmth.' },
    ],
  },
  {
    key: 'ghosting',
    title: 'Ghosting',
    length: 'short',
    lines: [
      { id: 'ghosting-01', speaker: P, text: 'Ghostead. GHOST. They\'re going to ghost you! They\'ll leave you on read!', direction: 'Reading the name with suspicion, then shout from GHOST on.' },
      { id: 'ghosting-02', speaker: R, text: 'Ghosting is leaving people. A Ghostead app leaves no trace of the people who use it.', direction: 'After the record scratch. Patient, explaining it once.' },
      { id: 'ghosting-03', speaker: R, text: 'One of them is a red flag. The other one is us.', direction: 'After a beat. Pleased with himself.' },
    ],
  },
  {
    key: 'fridge',
    title: 'The Fridge',
    length: 'short',
    lines: [
      { id: 'fridge-01', speaker: P, text: 'The toaster has an app. Fine. But the fridge... the fridge counts the eggs.', direction: 'Weary on "Fine", then dread.' },
      { id: 'fridge-02', speaker: P, text: 'Why does it need to know about the eggs?', direction: 'Whisper.' },
      { id: 'fridge-03', speaker: P, text: 'IT\'S LISTENING.', direction: 'After the fridge beeps. Full shout.' },
      { id: 'fridge-04', speaker: R, text: 'That fridge isn\'t ours.', direction: 'After the record scratch. Flat.' },
      { id: 'fridge-05', speaker: R, text: 'It does sound like it knows about the eggs.', direction: 'After a beat. Conceding the point.' },
    ],
  },
];

export const VOICEOVER_LINES: readonly VoiceoverLine[] = VOICEOVER_SCRIPTS.flatMap((script) => script.lines);

export const SPEAKER_LABEL: Record<VoiceoverSpeaker, string> = {
  paranoiac: 'The Paranoiac',
  realist: 'The Realist',
};
