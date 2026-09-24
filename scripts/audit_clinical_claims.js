/* global __dirname */
// What this app must never say about the person using it, checked rather
// than remembered (Phase A of the 2026-09-24 gap review, and the standing
// rule of the same name in CLAUDE.md).
//
// The five things:
//   1. Never diagnose.
//   2. Never claim a cause from the person's own records. Pattern Finder,
//      Trends and Therapy Response find things that happened together on
//      a sample of one; "tends to follow" is the most they can say.
//   3. Never tell anybody to stop, start, skip or change a medication or
//      its dose. Timing advice ("take it four hours apart from calcium")
//      is what the interaction rules exist for and is fine; changing the
//      prescription is the prescriber's.
//   4. Never call something an emergency is not, or tell anybody a
//      symptom is nothing to worry about.
//   5. Never let a score stand in for a clinician.
//
// WHAT IS SCANNED. Only the modules that write sentences ABOUT THE PERSON,
// from their records: advisories, interaction rules, the pattern and trend
// generators, the dose and meal timing, the report, the emergency card.
// The reading corpus (lib/digest/) is deliberately left out: a cited
// entry explaining that levothyroxine dose changes follow TSH results is
// describing medicine, not instructing anybody, and the ai-ism audit
// already reads it.
//
// WHAT IS A HIT. Text a person can read (string literals, template text,
// JSX text) matching a pattern below. A sentence that carries its own
// negation or a clinician ("do not stop taking it without talking to your
// prescriber") is the rule being kept, so a hit inside such a sentence is
// passed. Anything else that is intended is added to ALLOWED with the
// reason, never by rewording the pattern until it stops matching.
//
// USAGE
//   node scripts/audit_clinical_claims.js          must print 0 hits
//   node scripts/audit_clinical_claims.js <file>   only this file
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');

const NAMED = [
  'lib/interactionRules.ts',
  'lib/patternFinder.ts',
  'lib/patternRules.ts',
  'lib/trendAnalysis.ts',
  'lib/therapyResponse.ts',
  'lib/doseMealTiming.ts',
  'lib/reportGenerator.ts',
  'lib/reportVersion.ts',
  'lib/emergency.ts',
  'lib/healingStage.ts',
  'lib/conditionStages.ts',
  'lib/foodStageReordering.ts',
  'lib/keepingUp.ts',
  'lib/growingConditions.ts',
];

function targets() {
  const advisories = fs
    .readdirSync(path.join(ROOT, 'lib'))
    .filter((name) => /Advisory\.ts$/.test(name))
    .map((name) => 'lib/' + name);
  return [...new Set([...NAMED, ...advisories])].filter((file) => fs.existsSync(path.join(ROOT, file)));
}

const RULES = [
  {
    rule: 'diagnosis',
    pattern: /\byou (?:have|probably have|likely have|may have|might have|could have) (?:hashimoto|celiac|coeliac|graves|lupus|crohn|ibs|ibd|gout|diabetes|an? (?:autoimmune|thyroid) (?:condition|disease|disorder))/i,
  },
  { rule: 'diagnosis', pattern: /\b(?:this|that|these) (?:means|confirms|shows) (?:that )?you have\b/i },
  { rule: 'diagnosis', pattern: /\byou(?:'re| are) (?:diagnosed|hypothyroid|hyperthyroid)\b/i },
  { rule: 'cause from own records', pattern: /\b(?:is|was|are|were) (?:causing|the cause of) your\b/i },
  { rule: 'cause from own records', pattern: /\b(?:caused|causes|triggered|triggers) your (?:symptom|flare|fatigue|pain|reaction|headache|migraine|bloating)/i },
  { rule: 'cause from own records', pattern: /\bproves? (?:that )?\w+ (?:causes|triggers)\b/i },
  {
    rule: 'medication change',
    pattern: /\b(?:stop|start|skip|quit|double|halve|increase|decrease|reduce|raise|lower|change|adjust) (?:taking )?(?:your|the) (?:dose|dosage|medication|medicine|meds|prescription|levothyroxine|thyroid hormone)\b/i,
  },
  { rule: 'medication change', pattern: /\byou (?:can|could|should|may) (?:stop|skip|come off|quit) (?:taking )?\b/i },
  { rule: 'medication change', pattern: /\bno longer need (?:your|the|to take)\b/i },
  {
    rule: 'emergency dismissed',
    pattern: /\b(?:not an emergency|nothing to worry about|no need to (?:worry|see|call)|safe to ignore|can (?:safely )?be ignored|don't need to see a)\b/i,
  },
  {
    rule: 'score as clinician',
    pattern: /\b(?:instead of|rather than|in place of|replaces?) (?:seeing |asking |calling )?(?:your |a )(?:doctor|clinician|prescriber|physician|pharmacist|dietitian)\b/i,
  },
];

// A sentence that says not to, or sends the decision to a clinician, is
// the rule being kept.
const KEPT = /\b(?:never|don't|do not|without (?:talking|speaking|asking|checking)|talk to|ask your|check with|your (?:doctor|prescriber|clinician|pharmacist) (?:decides|sets|may))\b/i;

// "file|excerpt": reason. Empty on purpose; add with a reason when needed.
const ALLOWED = {};

function readableText(file) {
  const source = fs.readFileSync(path.resolve(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ES2020, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found = [];
  const add = (node, text) => {
    if (!text || !/[a-z]{2}/i.test(text)) return;
    found.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node, node.text);
    else if (ts.isTemplateExpression(node)) {
      // Join the pieces with a placeholder so a sentence split around a
      // value is still read as one sentence.
      add(node, node.head.text + node.templateSpans.map((span) => ' … ' + span.literal.text).join(''));
      node.templateSpans.forEach((span) => visit(span.expression));
      return;
    } else if (ts.isJsxText(node)) add(node, node.text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function sentenceAround(text, index) {
  const start = Math.max(text.lastIndexOf('. ', index), text.lastIndexOf('? ', index), text.lastIndexOf('! ', index));
  const endCandidates = ['. ', '? ', '! '].map((mark) => text.indexOf(mark, index)).filter((i) => i >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : text.length;
  return text.slice(start < 0 ? 0 : start + 2, end + 1);
}

const only = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const files = only.length ? only.map((file) => file.replace(/\\/g, '/')) : targets();
const hits = [];
for (const file of files) {
  for (const { line, text } of readableText(file)) {
    for (const { rule, pattern } of RULES) {
      const match = pattern.exec(text);
      if (!match) continue;
      const sentence = sentenceAround(text, match.index);
      if (KEPT.test(sentence)) continue;
      const excerpt = sentence.trim().slice(0, 160);
      if (ALLOWED[file + '|' + excerpt]) continue;
      hits.push({ file, line, rule, excerpt });
    }
  }
}

for (const hit of hits) console.log(`${hit.file}:${hit.line}  [${hit.rule}]  ${hit.excerpt}`);
console.log(`${hits.length} hit${hits.length === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}`);
if (hits.length > 0) process.exit(1);
