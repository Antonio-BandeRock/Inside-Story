// The lines of the Ghostead trailer, for the voiceover recorder in Profile >
// Developer Tools (components/VoiceoverRecorder.tsx). Each take is saved as
// <id>.m4a, which is the name the trailer page looks for in its voice/
// folder before falling back to a stand-in voice.
//
// The same ids, words and directions live in the Ghostead site's
// public/trailer/script.json, which is the source the scene plays from.
// Change the two together, or a take will be recorded against words the
// scene no longer shows.

export type VoiceoverLine = {
  id: string;
  speaker: 'narrator' | 'ghostead';
  text: string;
  direction: string;
};

export const VOICEOVER_LINES: readonly VoiceoverLine[] = [
  {
    id: "n01",
    speaker: "narrator",
    text: "It started... with a \"free\" app.",
    direction: "Low, slow, a campfire story.",
  },
  {
    id: "n02",
    speaker: "narrator",
    text: "Free. Nothing is free. I KNOW THAT NOW.",
    direction: "Whisper, then suddenly shout the last four words.",
  },
  {
    id: "n03",
    speaker: "narrator",
    text: "Then it knew where you were. Then it knew what you ate. Then it knew... what you'd eat next.",
    direction: "Building, one thing at a time. Lean on \"next\".",
  },
  {
    id: "n04",
    speaker: "narrator",
    text: "All of it... kept on their servers. Far from you. In the dark. Where you can't see it.",
    direction: "Ominous. Drop to almost a whisper at the end.",
  },
  {
    id: "n05",
    speaker: "narrator",
    text: "And then...",
    direction: "A held breath. Let it hang.",
  },
  {
    id: "n06",
    speaker: "narrator",
    text: "...the breach.",
    direction: "Grave. Two words.",
  },
  {
    id: "n07",
    speaker: "narrator",
    text: "It's gone. You hear me? GONE. It's not coming back! There is no \"undo\"! There is no little trash can you can drag it out of!",
    direction: "Unravelling. Shout GONE.",
  },
  {
    id: "n08",
    speaker: "narrator",
    text: "Your blood pressure? Out there. Your password, the one with your dog's name and a 1 on the end? OUT THERE. Every pizza you ordered at 2 a.m. in 2017? Somebody in a basement knows about the pineapple, Dave!",
    direction: "Pacing. Shout OUT THERE. Point at Dave.",
  },
  {
    id: "n09",
    speaker: "narrator",
    text: "They said \"your privacy matters to us.\" IT MATTERED TO THEM. It mattered to them like a wallet matters to a pickpocket!",
    direction: "Betrayed. Shout the middle sentence.",
  },
  {
    id: "n10",
    speaker: "narrator",
    text: "I have changed my password forty-one times. I put tape over my camera. I put tape over the tape. My toaster has an app now. WHY DOES MY TOASTER NEED AN APP?",
    direction: "Listing it all, faster and faster, then full shout at the toaster.",
  },
  {
    id: "n11",
    speaker: "narrator",
    text: "[deep breath]",
    direction: "One long deep breath in, and out. No words.",
  },
  {
    id: "n12",
    speaker: "narrator",
    text: "It knows when I make toast.",
    direction: "Whispering again, haunted.",
  },
  {
    id: "n13",
    speaker: "narrator",
    text: "But one company... built its apps differently.",
    direction: "Slow, building to a movie-trailer reveal.",
  },
  {
    id: "g01",
    speaker: "ghostead",
    text: "Okay. Wow. Somebody get him a blanket and a juice box.",
    direction: "Calm, dry, deeply unimpressed.",
  },
  {
    id: "g02",
    speaker: "ghostead",
    text: "Hi. I'll take it from here.",
    direction: "Friendly, flat, in charge.",
  },
  {
    id: "g03",
    speaker: "ghostead",
    text: "Ghostead. Noun. Ghost: leaving no trace. Homestead: land you live on and keep for yourself. Put them together and you get apps that live with you, and nowhere else. Your records stay on your devices, in your home. Like a houseplant. A houseplant that knows your cholesterol.",
    direction: "Reading a dictionary entry, then deadpan on the houseplant.",
  },
  {
    id: "g04",
    speaker: "ghostead",
    text: "Over here at Ghostead? No account database. No analytics. No \"anonymized\" usage file, which, fun fact, is usually about as anonymous as a name tag.",
    direction: "Ticking things off. Dry on the fun fact.",
  },
  {
    id: "g05",
    speaker: "ghostead",
    text: "We can't lose your data, because we never have it. It's the one breakup we planned ahead for.",
    direction: "Plain, a little proud of the joke.",
  },
  {
    id: "g06",
    speaker: "ghostead",
    text: "Now, could someone break into the Ghostead office? Sure. Go nuts. You'll find source code... and a coffee mug.",
    direction: "Shrugging. Go nuts.",
  },
  {
    id: "g07",
    speaker: "ghostead",
    text: "It's a nice mug. Please don't take the mug.",
    direction: "Suddenly a little vulnerable about the mug.",
  },
  {
    id: "g08",
    speaker: "ghostead",
    text: "And before anybody asks: no, this is not ghosting. Ghosting is leaving people. A ghostead app leaves no trace of the people who use it. Totally different. One of them is a red flag. The other one is us.",
    direction: "Heading off a question. Dry.",
  },
  {
    id: "n14",
    speaker: "narrator",
    text: "...the toaster knows...",
    direction: "From somewhere off screen, faintly.",
  },
  {
    id: "g09",
    speaker: "ghostead",
    text: "Yeah, we're gonna go check on him.",
    direction: "Resigned, kind.",
  },
];

export const SPEAKER_LABEL: Record<VoiceoverLine['speaker'], string> = {
  narrator: 'Narrator',
  ghostead: 'Ghostead',
};
