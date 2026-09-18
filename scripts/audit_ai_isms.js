/* global __dirname */
// AI-isms: the tics that make writing read as machine-written, and the
// standing check that keeps them out of this app.
//
// 2026-09-18, direct instruction, after reading a Digest entry titled
// "Autism, ADHD and Dyslexia Are Here for Two Honest Reasons, and Neither
// of Them Is Treatment" whose summary opened "This app covers autism, ADHD
// and dyslexia for two reasons, and it is worth naming both plainly before
// anything else in this topic is read":
//
//   "The part that says 'and it is worth naming both plainly before
//   anything else in this topic is read' is 100% AI crap that is NOT
//   needed ever to be said, ever. The two things they need to know are
//   stated right after that. HUmans do not talk this way. They just say
//   'This app covers autism, ADHD and Dyslexia for two reasons. The first,
//   is nutritional: ...'  I do not want any AI-isms popping up in this app
//   anywhere ever, and I need you to stop putting these things into it at
//   all."
//
// This file is the machine half of that. The rules already written down in
// CLAUDE.md (no em dashes, no "real"/"genuine"/"genuinely", no redundant
// "own") were rules a person had to remember, and they kept not being
// remembered. A rule that is checked by a script is a different kind of
// rule.
//
// WHAT COUNTS AS A HIT. Every pattern below is a thing that, in this app's
// customer-facing writing, is either (a) commentary about the writing
// rather than the writing, (b) a rhetorical shape that announces itself,
// or (c) a word nobody says out loud. Each carries a fix note saying what
// to do about it, because "flagged" without "so do this" just moves the
// problem.
//
// WHAT IS DELIBERATELY NOT A HIT. Ordinary prose that happens to contain a
// flagged word in a different sense, quoted material from a cited source
// (a trial's own title keeps its wording), and code comments explaining
// mechanism to a future reader. Comments are scanned separately and
// reported at a lower tier, because a comment is not something anybody
// using this app will ever see.
//
// USAGE
//   node scripts/audit_ai_isms.js              the full tally
//   node scripts/audit_ai_isms.js --list       every hit, with file:line
//   node scripts/audit_ai_isms.js --comments   include comment-tier hits
//   node scripts/audit_ai_isms.js <path...>    only these files
//   node scripts/audit_ai_isms.js --json       machine-readable, for the agent
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Directories holding writing a person will actually read. app-example is
// Expo's own scaffold and is not ours.
const SCAN_DIRS = ['lib', 'app', 'components', 'constants', 'hooks'];
const SKIP_DIRS = new Set(['node_modules', 'app-example', '.git', 'dist', 'build', '.expo']);
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);

// This file quotes every pattern it bans, so it would flag itself on every
// line. So would a test asserting the audit catches them.
const SKIP_FILES = new Set(['scripts/audit_ai_isms.js', 'scripts/test_ai_isms.js']);

// ---------------------------------------------------------------- catalogue
//
// severity 'block' is a hit that has to be fixed before work is called
// done. severity 'look' is a shape that is usually a tic but has honest
// uses, so it gets read by a person before it gets changed.

const CATEGORIES = [
  {
    key: 'meta-commentary',
    title: 'Commentary about the writing instead of the writing',
    severity: 'block',
    why: 'Announcing that a thing is about to be said, or that it is worth saying. The sentence after it already does the work. Nobody talking in a kitchen says any of this.',
    fix: 'Delete the clause. Keep the sentence it was attached to. If deleting leaves a dangling "and", end the sentence at the comma.',
    patterns: [
      /\b(?:and )?it (?:is|'s) worth (?:naming|saying|stating|noting|remembering|understanding|being clear)\b[^.]*/gi,
      /\bbefore anything else (?:in this|is|gets)\b[^.]*/gi,
      /\b(?:it is|it's) important to (?:note|remember|understand|say|be clear)\b[^.]*/gi,
      /\bworth noting (?:that|here)\b[^.]*/gi,
      /\b(?:the|one) (?:key|important|crucial|critical) (?:thing|point|insight|takeaway) (?:to (?:understand|remember|know)|here) (?:is|being)\b[^.]*/gi,
      /\bwhat (?:this|that) means (?:in practice )?is\b/gi,
      /\bhere(?:'s| is) (?:the thing|what (?:that|this) means|why)\b/gi,
      /\blet(?:'s| us) be (?:clear|direct|honest)\b[^.]*/gi,
      /\bto be (?:clear|direct|blunt|honest)\b,/gi,
      /\bit bears (?:repeating|saying)\b[^.]*/gi,
      /\bthe (?:short|honest|simple) (?:answer|version|summary) (?:is|here is)\b/gi,
      /\bstated (?:plainly|simply|directly)\b/gi,
      /\bnamed? (?:both |them |it )?plainly\b/gi,
      /\bplainly (?:put|stated)\b/gi,
      /\bthat (?:is|'s) (?:a|the) [a-z ]{0,24}topic and it belongs here\b/gi,
      /\bwhich is (?:the|exactly the) (?:point|whole point|reason)\b/gi,
      /\band that (?:is|'s) (?:the point|what matters|the finding)\b/gi,
      /\bthe (?:point|finding|informative part|useful part|important part) (?:here )?is\b/gi,
      // "This is worth knowing because it changes the strategy." The reader
      // decides what is worth knowing; the sentence after it is the thing.
      /\bis worth (?:knowing|stating|naming|noting|reading|carrying|having|saying|taking|remembering|doing properly)\b[^.]*/gi,
      /\b(?:the|one) (?:finding|part|thing|point|comparison|lesson|framing|detail|reason) (?:worth|that is worth) [a-z]+ing\b[^.]*/gi,
      /\bthe (?:practical|useful|honest|simple|clinical) (?:reading|response|value|upshot|point|position|use|importance|significance)\b[^.]{0,20}?(?: is| of this is)\b/gi,
      /\bboth halves (?:of that sentence )?(?:matter|belong)\b[^.]*/gi,
      /\bthe (?:limits?|caveats?|context) (?:need|needs) (?:stating|naming)\b[^.]*/gi,
      /\bwhich is the framing that\b[^.]*/gi,
      /\bthe (?:comparison|framing) that puts [^.]{3,40} in (?:context|proportion) is\b/gi,
    ],
    // "Worth raising with your doctor" is advice to the reader about a
    // conversation to have. It is not the writing commenting on itself.
    allowNear: [
      /\bworth (?:naming|raising|mentioning|bringing)\b[^.]{0,20}\b(?:to|with|up with) (?:whoever|a |an |your |the |their )/i,
    ],
  },
  {
    key: 'honesty-signalling',
    title: 'Announcing its own honesty',
    severity: 'block',
    why: 'Writing that calls itself honest, plain, or frank is asking to be trusted rather than earning it. This app already carries an evidence tier on every claim; that is what honesty looks like structurally.',
    fix: 'Cut the word. "Two honest reasons" is "two reasons". "The honest summary" is "the summary", or just the summary itself.',
    patterns: [
      /\bhonest(?:ly)?\b/gi,
      /\bfrankly\b/gi,
      /\bin all candou?r\b/gi,
      /\btruth be told\b/gi,
      /\bif (?:we|I am|I'm) being honest\b/gi,
      /\bthe (?:plain|blunt|unvarnished) (?:truth|fact|answer)\b/gi,
    ],
    // A trial reporting "honest reporting bias" is quoting a field term.
    allowNear: [/\bhonest (?:broker|signal(?:ling|ing)?|reporting bias)\b/i],
  },
  {
    key: 'filler-words',
    title: 'The filler words already banned in CLAUDE.md',
    severity: 'block',
    why: 'Standing rule since 2026-08-24. "real", "genuine" and "genuinely" are almost always doing nothing, and where they are doing something a stronger word exists.',
    fix: 'Delete, or replace with the word that says what was meant: measured, documented, diagnosed, substantial, tested.',
    // "really" is deliberately absent: it is colloquial rather than
    // machine-sounding, and this app's register is somebody talking in
    // their kitchen. CLAUDE.md bans these three by name.
    patterns: [/\bgenuine(?:ly)?\b/gi, /\breal\b/gi],
    // "real time" and "real world" are set phrases, not the filler sense.
    allowNear: [
      /\breal[- ](?:time|world|estate|number)\b/i,
      // Scare-quoted: the sentence is reporting somebody else's use of the
      // word, or holding it at arm's length. The quotes are the point.
      /["'\u201c\u2018]real["'\u201d\u2019]/i,
      // Authenticity is the SUBJECT of this entry, not filler in it:
      // whether a food is real and whether it is healthy are two questions.
      /\bfood being real\b/i,
      // "No real, cited oxalate data" is tier text produced from the live
      // foods_reference.db and matched as a key here and in two compute
      // scripts. Rewording it means rebuilding the shipped database.
      /\bno real, cited\b/i,
    ],
  },
  {
    key: 'redundant-own',
    title: 'Redundant "own" after a possessive',
    severity: 'block',
    why: 'Standing rule since 2026-08-24, direct correction: "This is not how people talk... The word \'own\' has no place there at all." The possessive already establishes ownership.',
    fix: 'Delete "own". The idiom family "in its own right", "on its own terms", "on its own merits", "on X\'s own", and the medical "the body\'s own tissue" survive.',
    patterns: [/\b(?:'s|s'|its|their|his|her|your|our|my) own \w+/gi],
    allowNear: [
      // Quoted to be named, not used. A sentence reporting the tic, such
      // as the release note describing what was removed, has to be able to
      // print it.
      /["\u201c][^"\u201d]{0,24}(?:'s|s') own/i,
      /\bown (?:right|terms|merits|accord|sake|expense|devices|volition|making)\b/i,
      // Same sense, stated as the immune system turning on the body:
      // "keeps the body from attacking its own tissue" is CLAUDE.md's own example.
      /\battack(?:s|ing|ed)? (?:its|their|his|her|the body's) own (?:tissue|cells?|organs?|thyroid)\b/i,
      // The self-versus-other sense. In autoimmunity and in autologous cell
      // therapy, "own" is the claim: the cells came from this patient and
      // not a donor, the target is self-protein and not a foreign one.
      /\b(?:the body|a patient|the patient|a person|the recipient)'s own (?:tissue|cells?|cell nuclei|immune|T cells?|B cells?|marrow|stem cells?|thyroid|insulin|antibod|protein)/i,
      /\bon (?:its|their|his|her|your|our|my) own\b/i,
      // 'build your own below', 'make your own': the idiom, not a possessive.
      // "grow your own food", "building your own" and the rest: "own" means
      // self-made rather than bought, so deleting it changes the claim.
      /\b(?:build|make|create|roll|grow|write|design|choose|pick|start|bring|add|use|enter)(?:s|ing)? (?:your|their|his|her|our|my|its) own\b/i,
    ],
  },
  {
    key: 'antithesis',
    title: 'The "not X, it is Y" reversal',
    severity: 'block',
    why: 'The single most recognizable machine cadence. It sets up a strawman so the real point sounds like a revelation. One in a document is rhetoric; three is a tell.',
    fix: 'State the positive half alone. "Nutrition supports a person. It does not treat these." becomes "Nutrition supports a person." if the negative is already said elsewhere, which it usually is.',
    patterns: [
      /\b(?:it|this|that|there)(?:'s| is| was) not (?:just |simply |merely |only )?(?:about )?[^.,;]{3,60}[,.] (?:it|this|that)(?:'s| is| was)\b/gi,
      /\bis(?:n't| not) (?:just|simply|merely|only) [^.,;]{3,50}[,;] (?:it|but|it's)\b/gi,
      /\bnot (?:because|about) [^.,;]{3,60}, but (?:because|about)\b/gi,
      /\bless (?:about|a matter of) [^.,;]{3,50} (?:and|than) more (?:about|a matter of)\b/gi,
      /\bnot (?:a|an|the) [a-z ]{2,30}\. (?:A|An|The|It(?:'s| is))\b/g,
      // The cleft: "What this is not is X", "What the research supports is
      // Y", "What listing one does is Z". Same reversal, fronted instead of
      // trailing, and it reads as a reveal every time.
      /\bwhat (?:this|that|it|they|the [a-z]+(?: [a-z]+)?) (?:is|are|was|were|does|do|did|means?|shows?|supports?|establishes?|saves?|follows?|survives?|changes?|matters?)\b[^.,;:]{0,55}? is\b/gi,
      /\bwhat (?:this|that|it) (?:is|does) not\b[^.,;:]{0,55}? is\b/gi,
    ],
  },
  {
    key: 'the-x-is-the-y',
    title: 'The "X is the Y" pronouncement',
    severity: 'look',
    why: 'A flat declarative that promotes an observation into a verdict: "The mixed pattern is the finding." "That gradient is the informative part." It reads as a lecturer pausing for effect.',
    fix: 'Say what follows from it instead. "The mixed pattern is the finding" becomes "A lower ferritin with normal circulating iron is a different picture from anaemia, and it has a different answer."',
    patterns: [
      /\bthat (?:gradient|pattern|difference|distinction|gap|number|figure|contrast) is the\b[^.]*/gi,
      /\bthe (?:mixed |whole |entire )?(?:pattern|point|finding|answer|question|difference) is the\b[^.]*/gi,
      /\bthat (?:is|'s) the (?:finding|point|whole point|informative part|useful part|part that matters)\b/gi,
      /\bboth (?:things |of these )?can be true at once\b/gi,
      /\bthe (?:real|actual) (?:question|issue|problem) (?:here )?is\b/gi,
    ],
  },
  {
    key: 'transition-tics',
    title: 'Discourse markers nobody speaks',
    severity: 'block',
    why: 'Sentence-initial signposting that exists to make a paragraph feel structured. In speech these are silence.',
    fix: 'Delete and start the sentence at its subject. If the connection is not obvious without the marker, the sentences are in the wrong order.',
    patterns: [
      /(?:^|[.;]\s+|\n\s*)(?:Importantly|Crucially|Notably|Ultimately|Essentially|Fundamentally|Interestingly|Significantly|Critically|Indeed|Moreover|Furthermore|Additionally|Consequently|Nevertheless|Nonetheless)\b,?/g,
      /(?:^|[.;]\s+)(?:That said|In essence|In short|Simply put|Put simply|In other words|That is to say|At its core|At the end of the day|When all is said and done|All things considered|Needless to say|It goes without saying)\b,?/gi,
      /\bit(?:'s| is) (?:precisely |exactly )?(?:this|that|here) (?:that|which|where)\b/gi,
    ],
    // "In short bursts, cortisol is adaptive" is not the discourse marker.
    allowNear: [/\bin short (?:bursts|order|supply)\b/i],
  },
  {
    key: 'inflated-diction',
    // VITAL is the name of a cited trial, not the word 'vital'. An all-caps
    // match in this app is an acronym or a study name, never diction.
    skipAllCaps: true,
    title: 'Words nobody says out loud',
    severity: 'block',
    why: 'The register this app is written in is somebody standing in their kitchen. None of these belong there.',
    fix: 'Use the plain word. delve into becomes look at. leverage becomes use. robust becomes strong or well-tested. navigate becomes handle or get through. underscore becomes show.',
    patterns: [
      /\bdelv(?:e|es|ed|ing)\b/gi,
      /\bleverag(?:e|es|ed|ing)\b/gi,
      /\brobust\b/gi,
      /\bnuanced?\b/gi,
      /\b(?:the )?landscape of\b/gi,
      /\bin the realm of\b/gi,
      /\btapestry\b/gi,
      /\bnavigat(?:e|es|ed|ing) (?:the|this|your)\b/gi,
      /\bunderscor(?:e|es|ed|ing)\b/gi,
      /\bshowcas(?:e|es|ed|ing)\b/gi,
      /\bpivotal\b/gi,
      /\bmyriad\b/gi,
      /\bplethora\b/gi,
      /\ba testament to\b/gi,
      /\bserves? as a\b/gi,
      /\bstands? as (?:a|the)\b/gi,
      /\bintricate\b/gi,
      /\bmultifaceted\b/gi,
      /\bholistic\b/gi,
      /\bseamless(?:ly)?\b/gi,
      /\bparadigm\b/gi,
      /\bunlock(?:s|ing)? (?:the|your)\b/gi,
      /\bempower(?:s|ing|ed)?\b/gi,
      /\bjourney of discovery\b/gi,
      /\bdive (?:deep|into)\b/gi,
      /\bcornerstone\b/gi,
      /\bvital(?:ly)?\b/gi,
      /\bcrucial(?:ly)?\b/gi,
    ],
    // "comprehensive" is the correct word for a metabolic panel, and
    // "holistic" is a named practitioner category the Digest reports on.
    allowNear: [
      /\bcomprehensive metabolic panel\b/i,
      /\bholistic (?:medicine|practitioner|health coach)\b/i,
      // Allan Savory's method is named Holistic Planned Grazing. The Digest
      // reports on it by name, including the part that does not hold up.
      /\bholistic[- ](?:planned grazing|management|grazing)\b/i,
      /\bvital signs?\b/i,
      // "Vital wheat gluten" is the ingredient's name on the package.
      /\bvital wheat gluten\b/i,
      /\bvitamin\b/i,
    ],
  },
  {
    key: 'hedge-pivot',
    title: 'The "while X, Y" concession opener',
    severity: 'look',
    why: 'Opening on a concession so the second half lands as the correction. Overwhelmingly common in generated text and rare in speech.',
    fix: 'Two sentences, positive first. "While the evidence is mixed, iron is worth measuring" becomes "Iron is worth measuring. The evidence on supplementing it is mixed."',
    patterns: [
      /(?:^|[.;]\s+)While [^.,;]{5,70},/g,
      /(?:^|[.;]\s+)(?:Although|Though) [^.,;]{5,70},/g,
      /\bwhile it(?:'s| is) true that\b/gi,
    ],
  },
  {
    key: 'closing-flourish',
    title: 'The summing-up flourish',
    severity: 'block',
    why: 'A closing line that restates what was just said, in a cadence meant to feel conclusive. The reader already read it.',
    fix: 'Delete the sentence. The paragraph ends on its last piece of information.',
    patterns: [
      /\bthe bottom line\b[^.]*/gi,
      /(?:^|[.;]\s+)In the end,/g,
      /\bat the end of the day\b/gi,
      /\bwhen it comes down to it\b/gi,
      /\bthat, (?:in|at) (?:short|essence|bottom)\b[^.]*/gi,
      /\bthe (?:takeaway|upshot) (?:here )?is\b[^.]*/gi,
      /\bwhich is (?:why|what makes) (?:this|it|that) (?:so )?(?:matters|important|significant)\b/gi,
      /\bthe practical (?:reading|upshot|takeaway) is\b/gi,
    ],
  },
  {
    key: 'dashes',
    title: 'Dashes standing in for punctuation',
    severity: 'block',
    why: 'Standing rule. Em dash, en dash, and the " -- " double hyphen are the most reliable single tell in generated prose.',
    fix: 'A colon when what follows explains, a comma when it is an aside, parentheses when it is optional, a second sentence when it is a second thought.',
    patterns: [/—/g, /–/g, / -- /g, / – /g, / — /g],
  },
  {
    key: 'title-tics',
    title: 'Headline shapes that announce themselves',
    severity: 'look',
    why: 'The trailing ", and X" clause, the "Why X Matters" frame, and the colon-subtitle are headline shapes, not titles somebody would write for a page in a book.',
    fix: 'Name the subject. "Autism, ADHD and Dyslexia Are Here for Two Honest Reasons, and Neither of Them Is Treatment" becomes "Why These Three Are in a Food App".',
    titlesOnly: true,
    patterns: [
      /^[^,]{12,}, and (?:neither|either|both|that|this|it|why|what|how|the)\b/i,
      /^Why [A-Z][^:]*Matters?$/i,
      /^The [A-Z][a-z]+ (?:That|Which|Nobody|No One|Everyone)\b/,
      /\b(?:Is|Are|Was|Were) (?:Here|Not|More|Less) [A-Z]/,
      /: (?:What|Why|How|The) [A-Z]/,
      /\bUnderstanding [A-Z]/,
      /\bA Deep Dive\b/i,
      /\bEverything You Need to Know\b/i,
    ],
  },
  {
    key: 'listicle-cadence',
    title: 'The rule of three, and the counted promise',
    severity: 'look',
    why: 'Three parallel items where two would do, and openers that promise a count before delivering it, are both structural habits rather than sentences. A counted promise is fine when the count is load-bearing, which is why this one is a look rather than a block.',
    fix: 'Keep the count when the reader needs it to follow along. Cut the third item when it was added for rhythm.',
    patterns: [
      /\bthere are (?:two|three|four) (?:things|reasons|ways|parts|points)\b/gi,
      /\b(?:two|three|four) things (?:are worth|to (?:know|understand|remember))\b/gi,
      /\bfirst(?:ly)?,[^.]{10,120}\. second(?:ly)?,/gi,
      /\bnot only [^.,;]{3,50}, but (?:also )?\b/gi,
    ],
  },
];

// ------------------------------------------------------------------ scanner
//
// A small state machine rather than a regex, so a quote inside a comment
// and an apostrophe inside a string cannot desync the reader. It returns
// every string literal and JSX text run with its offset, plus every
// comment, kept separate.

// A template literal holding SQL. Two of its ordinary features read as
// prose tics to every pattern in the catalogue and are neither: "--" opens
// a comment on its own line, and REAL is a column type. Requiring a
// statement keyword at a line start keeps an ordinary sentence that happens
// to contain the word "select" or "update" out of this.
const SQL_START = /(^|\n)[ \t]*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|PRAGMA|BEGIN|COMMIT|WITH)\s+(?:TABLE|INDEX|VIEW|TRIGGER|UNIQUE|INTO|FROM|OR|IF|NOT|TRANSACTION|DISTINCT|ALL|[A-Za-z_]+\s*(?:\(|AS\b))/i;

// A line that begins with "--" is a SQL comment. Nothing in this app's
// prose starts a line that way, and the big schema literals open with a
// block of them before the first CREATE, so the keyword test alone misses
// them.
const SQL_COMMENT_LINE = /(^|\n)[ \t]*--[ \t]/;

function isSqlBody(body) {
  return body.length > 40 && (SQL_START.test(body) || SQL_COMMENT_LINE.test(body));
}

function scan(src, allowJsx) {
  const strings = [];
  const comments = [];
  const jsx = [];
  const sql = [];
  let i = 0;
  const n = src.length;
  // Tracks whether a '/' starts a regex literal or is a divide.
  let prevMeaning = '';

  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];

    if (c === '/' && c2 === '/') {
      const start = i;
      while (i < n && src[i] !== '\n') i += 1;
      comments.push({ start, text: src.slice(start, i) });
      continue;
    }
    if (c === '/' && c2 === '*') {
      const start = i;
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1;
      i += 2;
      comments.push({ start, text: src.slice(start, Math.min(i, n)) });
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      const start = i;
      i += 1;
      let body = '';
      while (i < n) {
        if (src[i] === '\\') {
          // Keep the escaped character so apostrophes read correctly.
          body += src[i + 1] === 'n' ? ' ' : src[i + 1];
          i += 2;
          continue;
        }
        if (src[i] === quote) break;
        if (quote !== '`' && src[i] === '\n') break; // Unterminated; bail.
        body += src[i];
        i += 1;
      }
      i += 1;
      if (isSqlBody(body)) {
        // A SQL statement in a template literal is code, not writing. Two
        // things in it read as prose to every pattern here and are neither:
        // "--" opens a SQL comment on its own line, and REAL is a column
        // type. lib/db.ts alone produced 2,795 hits this way, 35% of the
        // first full-corpus run, every one of them a developer note or a
        // datatype that no user will ever see.
        sql.push({ start, text: body });
        prevMeaning = 'value';
        continue;
      }
      strings.push({ start, text: body });
      prevMeaning = 'value';
      continue;
    }
    if (c === '/' && prevMeaning !== 'value') {
      // A regex literal. Skip it whole so a quote inside cannot desync.
      const start = i;
      i += 1;
      let inClass = false;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
        else if (src[i] === '\n') { i = start; break; } // Not a regex after all.
        i += 1;
      }
      if (i === start) { i += 1; prevMeaning = ''; continue; }
      i += 1;
      prevMeaning = 'value';
      continue;
    }

    if (/[A-Za-z0-9_$)\]]/.test(c)) prevMeaning = 'value';
    else if (!/\s/.test(c)) prevMeaning = '';
    i += 1;
  }

  // JSX text runs: >text< where text carries a letter and no brace.
  //
  // This one pass reads the raw source rather than the state machine above,
  // so it has to be told where the state machine has already been. Prose
  // inside a string, a comment or a SQL literal is either counted there or
  // deliberately not counted, and either way it is not JSX. Without this
  // check a SQL comment reading "Trends > Nutrients, Pattern Finder and
  // the ... <" is read as a JSX text run: that alone put 1,278 phantom hits
  // on one line of lib/db.ts.
  const covered = [...strings, ...comments, ...sql]
    .map((c) => [c.start, c.start + c.text.length + 2])
    .sort((a, b) => a[0] - b[0]);
  // Overlap, not just the start: a JSX match can open at a ">" in real
  // code and then run through the // comments that follow it, which is how
  // code comments were still arriving at the content tier in .tsx files.
  const overlapsCovered = (from, to) => {
    let lo = 0;
    let hi = covered.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (to < covered[mid][0]) hi = mid - 1;
      else if (from > covered[mid][1]) lo = mid + 1;
      else return true;
    }
    return false;
  };

  const jsxRe = allowJsx ? />([^<>{}]*[A-Za-z][^<>{}]*)</g : null;
  let m;
  while (jsxRe && (m = jsxRe.exec(src)) !== null) {
    if (overlapsCovered(m.index, m.index + m[0].length)) continue;
    const text = m[1].replace(/\s+/g, ' ').trim();
    if (text.length >= 20 && /\s/.test(text)) {
      jsx.push({ start: m.index + 1, text });
    }
  }

  return { strings, comments, jsx, sql };
}

function lineOf(src, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < src.length; i += 1) if (src[i] === '\n') line += 1;
  return line;
}

// Fields in the Digest whose value is a heading. Only these are tested
// against the title-shape patterns, which would be nonsense on a summary.
const TITLE_FIELD = /(?:^|[\s,{])(?:title|heading|label|name|topic|subtopic)\s*:\s*$/;

function fieldBefore(src, offset) {
  const back = src.slice(Math.max(0, offset - 60), offset);
  return TITLE_FIELD.test(back);
}

// A citation's `source`, `url` or `doi` is somebody else's published title
// or address, quoted verbatim. Its punctuation and word choice belong to
// whoever wrote it, so rewriting it would misquote them. Never reported.
const QUOTED_FIELD = /\b(?:source|citation|url|doi|href)\s*:\s*['"`]?$/;

function isQuotedSource(src, offset) {
  return QUOTED_FIELD.test(src.slice(Math.max(0, offset - 40), offset));
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (SCAN_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// Two Digest topic names the owner asked for back by name on 2026-09-18,
// after a sweep had shortened both to get this script quiet. "Building
// Real Soil" trips the filler-word rule and "Industry, Greenwashing &
// Honest Limits" trips the honesty rule, and both stay as they are: the
// person naming the shelves outranks the detector. A false positive gets
// fixed here, never by editing the text back.
const OWNER_CHOICE = ['Industry, Greenwashing & Honest Limits', 'Building Real Soil'];

function isOwnerChoice(text, index, length) {
  for (const phrase of OWNER_CHOICE) {
    let at = -1;
    while ((at = text.indexOf(phrase, at + 1)) !== -1) {
      if (index >= at && index + length <= at + phrase.length) return true;
    }
  }
  return false;
}

// An exemption is decided by the words immediately around the hit, not by
// the paragraph it sits in. Testing the whole paragraph was the first
// version and it was wrong in the expensive direction: one legitimate "in
// its own right" anywhere in a summary exempted every other "own" in it.
function allowedAt(category, text, index, length) {
  if (isOwnerChoice(text, index, length)) return true;
  if (!category.allowNear) return false;
  const window = text.slice(Math.max(0, index - 24), index + length + 24);
  return category.allowNear.some((re) => re.test(window));
}

function auditFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (SKIP_FILES.has(rel)) return [];

  const { strings, comments, jsx } = scan(src, /[.](?:tsx|jsx)$/.test(rel));
  const hits = [];

  // Prose only: a string with a space, some length, and at least one
  // lowercase run, so an id, a style key or a colour never gets read as
  // writing.
  const prose = [...strings, ...jsx].filter(
    (s) => s.text.length >= 18 && /\s/.test(s.text) && /[a-z]{3}/.test(s.text),
  );

  for (const category of CATEGORIES) {
    for (const chunk of prose) {
      if (isQuotedSource(src, chunk.start)) continue;
      if (category.titlesOnly && !fieldBefore(src, chunk.start)) continue;
      for (const re of category.patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(chunk.text)) !== null) {
          const matched = m[0].trim();
          if (!matched) break;
          if (allowedAt(category, chunk.text, m.index, matched.length)) continue;
          if (category.skipAllCaps && matched === matched.toUpperCase()) continue;
          hits.push({
            file: rel,
            line: lineOf(src, chunk.start),
            category: category.key,
            tier: 'content',
            matched,
            context: chunk.text.slice(Math.max(0, m.index - 50), m.index + matched.length + 50).trim(),
          });
          if (!re.global) break;
        }
      }
    }

    // Comments, reported separately: nobody using the app reads these, but
    // the dash and filler rules were written to cover the codebase too.
    if (category.key === 'dashes' || category.key === 'filler-words' || category.key === 'redundant-own') {
      for (const chunk of comments) {
        for (const re of category.patterns) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(chunk.text)) !== null) {
            const matched = m[0].trim();
            if (!matched) break;
            if (allowedAt(category, chunk.text, m.index, matched.length)) continue;
            if (category.skipAllCaps && matched === matched.toUpperCase()) continue;
            hits.push({
              file: rel,
              line: lineOf(src, chunk.start + m.index),
              category: category.key,
              tier: 'comment',
              matched,
              context: chunk.text.slice(Math.max(0, m.index - 40), m.index + matched.length + 40).replace(/\s+/g, ' ').trim(),
            });
            if (!re.global) break;
          }
        }
      }
    }
  }

  return hits;
}

function main() {
  const argv = process.argv.slice(2);
  const wantList = argv.includes('--list');
  const wantComments = argv.includes('--comments');
  const wantJson = argv.includes('--json');
  const paths = argv.filter((a) => !a.startsWith('--'));

  let files = [];
  if (paths.length > 0) {
    for (const p of paths) {
      const full = path.resolve(ROOT, p);
      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) walk(full, files);
      else if (fs.existsSync(full)) files.push(full);
    }
  } else {
    for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir), files);
  }

  let hits = [];
  for (const file of files) hits = hits.concat(auditFile(file));
  if (!wantComments) hits = hits.filter((h) => h.tier === 'content');

  if (wantJson) {
    process.stdout.write(JSON.stringify({ files: files.length, hits }, null, 2));
    return;
  }

  const byCategory = new Map();
  for (const hit of hits) {
    if (!byCategory.has(hit.category)) byCategory.set(hit.category, []);
    byCategory.get(hit.category).push(hit);
  }

  console.log(`AI-isms across ${files.length} files\n`);

  let blocking = 0;
  for (const category of CATEGORIES) {
    const found = byCategory.get(category.key) ?? [];
    if (found.length === 0) continue;
    if (category.severity === 'block') blocking += found.length;
    const fileCount = new Set(found.map((h) => h.file)).size;
    console.log(
      `${String(found.length).padStart(5)}  ${category.key}  (${fileCount} file${fileCount === 1 ? '' : 's'}, ${category.severity})`,
    );
    console.log(`       ${category.title}`);

    // The three commonest exact matches, so the shape is visible from the
    // tally alone without needing --list.
    const counts = new Map();
    for (const hit of found) {
      const k = hit.matched.toLowerCase().slice(0, 60);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [text, count] of top) console.log(`         ${String(count).padStart(4)}x  ${text}`);

    if (wantList) {
      for (const hit of found) {
        console.log(`         ${hit.file}:${hit.line}  ${hit.tier === 'comment' ? '[comment] ' : ''}${hit.context}`);
      }
    }
    console.log('');
  }

  console.log(`Total: ${hits.length} (${blocking} must be fixed, ${hits.length - blocking} to be read by a person)`);
  process.exitCode = blocking > 0 ? 1 : 0;
}

main();
