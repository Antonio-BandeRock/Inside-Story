// Turning something the Pattern Finder noticed into one of the person's
// own saved rules. Asked for on 2026-09-23, and the last piece deliberately
// left out of the 2026-08-18 rules-engine build, where the architecture
// note named it directly: "you've logged fatigue within a day of
// high-goitrogen meals four times this month, want to turn that into a
// rule?"
//
// WHAT THIS CLOSES. Trends > Pattern Finder counts what was logged in the
// hours before each flare and lists whatever recurs. Until now the trail
// stopped there: the person read the count and had to carry it in their
// head, or retype it by hand on Insights > My Meds. The app was doing the
// correlation work and then handing the result back as homework, which is
// the opposite of the standing purpose (the complexity lives inside the
// app; what the person experiences is ease).
//
// THE APP SUGGESTS, THE PERSON DECIDES. Same standing rule the healing
// stages already follow. Nothing here saves anything: it proposes wording
// the person edits before it becomes theirs, and the wording it proposes
// is the COUNT FROM THEIR DATA and nothing more. It does not say a food
// caused anything, does not tell them to avoid it, and does not decide
// anything on their behalf. A pattern is a reason to look, and the lens
// itself already says so above the list.
//
// WHY THE PROPOSED TEXT IS ONLY THE FINDING. Writing "avoid broccoli" into
// the box would be the app making a call it has no evidence for, from a
// count on noisy n=1 data with every confound still in it. So the proposal
// states what was counted, in the person's voice, and the form asks them
// what they want to do about it. What they add is theirs, saved with
// source 'self' and labelled as something they noticed everywhere it shows.
//
// WHAT CAN AND CANNOT BE CHECKED AFTERWARDS, SAID OUT LOUD. The rules
// engine matches a food-linked rule by looking for the person's keyword in
// the names of what they logged that day (lib/interactionRules.ts), so a
// rule about a specific food genuinely surfaces on the days it is relevant
// and stays quiet otherwise. A scoring factor and a food category have
// nothing in that engine to match against, so a rule made from one of
// those is saved unlinked and shows every day until it is paused. That is
// a worse rule, and the person is told which one they are about to get
// BEFORE they save it rather than discovering it as clutter a week later.
// Extending the engine to check a sub-criterion directly is the obvious
// next step and is named in interactionRules.ts as a cheap future addition;
// this module is written so that day changes one function.

export type PatternRuleProposal = {
  /** Pre-filled wording, editable before it is saved. */
  description: string;
  linkType: 'none' | 'food';
  linkValue: string | null;
  linkLabel: string | null;
  /** What happens after saving, in words, shown above the form. */
  checkNote: string;
};

// What was counted (lib/patternOutcome.ts). Flares and reactions unless
// Pattern Finder was asked about low mood, low energy or high stress days.
export type RuleCountWords = { owner: 'my' | 'the'; logged: string; loggedMany: string };

const FLARE_COUNT_WORDS: RuleCountWords = {
  owner: 'my',
  logged: 'logged flare or reaction',
  loggedMany: 'logged flares or reactions',
};

function flareCount(occurrences: number, total: number, words: RuleCountWords = FLARE_COUNT_WORDS): string {
  return `${occurrences} of ${words.owner} ${total} ${total === 1 ? words.logged : words.loggedMany}`;
}

// A reference-database name carries its preparation after a comma
// ("Broccoli, cooked, boiled, drained"), and the rules engine matches a
// keyword as a substring of whatever the person logged. Matching on the
// whole string would almost never fire, so the keyword is the part before
// the first comma, which is the food itself. Used only when the food's
// identity row cannot be read; the caller passes baseName when it can.
export function keywordFromFoodName(foodName: string): string {
  const [head] = foodName.split(',');
  return (head ?? foodName).trim();
}

export function proposeFoodPatternRule(input: {
  foodName: string;
  /** The food's base name, which is what a logged meal is named after. */
  keyword: string;
  occurrenceCount: number;
  totalSymptomInstances: number;
  words?: RuleCountWords;
}): PatternRuleProposal {
  const keyword = input.keyword.trim() || keywordFromFoodName(input.foodName);
  return {
    description: `${input.foodName} was in what I ate before ${flareCount(
      input.occurrenceCount,
      input.totalSymptomInstances,
      input.words,
    )}.`,
    linkType: 'food',
    linkValue: keyword,
    linkLabel: keyword,
    checkNote: `Saved with the word "${keyword}" attached, this shows up under Insights > My Meds on any day you log something with that word in its name, and stays quiet the rest of the time.`,
  };
}

export function proposeDimensionPatternRule(input: {
  subCriterion: string;
  tier: string;
  conditionName: string;
  occurrenceCount: number;
  totalSymptomInstances: number;
  words?: RuleCountWords;
}): PatternRuleProposal {
  return {
    description: `${input.subCriterion} (${input.tier}) showed up in what I ate before ${flareCount(
      input.occurrenceCount,
      input.totalSymptomInstances,
      input.words,
    )}. It matters for ${input.conditionName}.`,
    linkType: 'none',
    linkValue: null,
    linkLabel: null,
    checkNote: UNLINKED_NOTE,
  };
}

export function proposeCategoryPatternRule(input: {
  category: string;
  occurrenceCount: number;
  totalSymptomInstances: number;
  words?: RuleCountWords;
}): PatternRuleProposal {
  return {
    description: `Something from ${input.category} was in what I ate before ${flareCount(
      input.occurrenceCount,
      input.totalSymptomInstances,
      input.words,
    )}.`,
    linkType: 'none',
    linkValue: null,
    linkLabel: null,
    checkNote: UNLINKED_NOTE,
  };
}

const UNLINKED_NOTE =
  'There is nothing in a day of logged meals for the app to match this against, so it shows up under Insights > My Meds every day until you pause it there. A rule about one specific food can be checked; this one is a standing note to yourself.';
