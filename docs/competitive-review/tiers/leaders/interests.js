// Interests (planned tenth tab) and Learn: each function against its leader.
// Checked 2026-10-07. Nothing here is built; CLAUDE.md items 31 and 37.
const { L, M } = require('./shape.js');

const NA = 'Text scales with the phone, uncapped; screen reader labels not audited';
const IPAID = 'Not yet placed on a tier (P27); Individual is $89.99 a year';

function notBuilt(o) {
  return {
    does: M(o.does, 'Not built', '-'),
    depth: M(o.depth, 'Not built', '-'),
    taps: M(o.taps || 'Built in', 'Not built', '-'),
    offline: M(o.offline || 'Varies', 'Would be on the phone', o.offlineV || '+'),
    privacy: M(o.privacy || 'Account', 'No account', o.privacyV || '+'),
    access: M('Not checked', NA, '?'),
    price: M(o.price, o.ours || IPAID, o.priceV || '-'),
    conds: M(o.conds || 'None', o.oursConds || 'None', o.condsV || '='),
  };
}

module.exports = [
  L('p-interests', {
    leader: 'Notion',
    also: ['Pinterest', 'Strava'],
    src: ['https://www.notion.com/templates/category/hobbies'],
    v: 'behind',
    m: notBuilt({ does: 'A hobby template for anything', depth: 'Whatever the person builds', privacy: 'Account, cloud', price: 'Free for one person', oursConds: 'Fatigue and flares beside practice', condsV: '+' }),
    why: 'Notion holds any interest if the person builds the page; nothing ready-made follows an interest into practice.',
    win: 'The Interests tab (Q65): following and practising as two stages of one record, sessions, gear and costs, nothing pushed toward earning.',
    items: ['Q65'],
  }),
  L('p-projects', {
    leader: 'Todoist',
    also: ['Notion', 'Trello'],
    src: ['https://www.todoist.com/pricing'],
    v: 'behind',
    m: notBuilt({ does: 'Projects with tasks, boards and dates', depth: 'Sections, sub-tasks, labels', price: 'Free for 5 projects; $60 a year', oursConds: 'Garden, kitchen and life records in one project', condsV: '+' }),
    why: 'Not built.',
    win: 'Projects across the app (Q66), reading records from any tab, on top of To-Do projects (Q47).',
    items: ['Q66', 'Q47'],
  }),
  L('p-makeitpay', {
    leader: 'SCORE',
    also: ['SBA Learning Center', 'QuickBooks Solopreneur'],
    src: ['https://www.score.org/'],
    v: 'behind',
    m: notBuilt({ does: 'Free mentoring and small-business reading', depth: 'Templates and workshops', taps: 'Web', offline: 'Online', privacy: 'Account for mentoring', price: 'Free', conds: 'None', oursConds: 'Pacing and energy beside the work', condsV: '+' }),
    why: 'Not built.',
    win: 'Making It Pay (Q67): self-employment reading and a viability worksheet from the interest’s own costs and time.',
    rule: 'Never advises starting a business or quitting a job.',
    items: ['Q67'],
  }),
  L('p-learn-ready', {
    leader: 'Anki',
    also: ['Quizlet', 'Duolingo'],
    src: ['https://apps.ankiweb.net/'],
    v: 'behind',
    m: notBuilt({ does: 'Spaced repetition with thousands of shared decks', depth: 'Every subject', offline: 'On the phone', offlineV: '=', privacy: 'Optional account', price: 'Free on Android and the web; $24.99 once on iPhone', ours: 'Free (decided 2026-10-06)', priceV: '=', oursConds: 'Decks on the 19 conditions and food', condsV: '+' }),
    why: 'Not built.',
    win: 'Ready-made decks on Free (Q68), mostly critical-thinking questions, spaced, printable.',
    rule: 'No points, streaks or pushed percentages.',
    items: ['Q68'],
  }),
  L('p-learn-own', {
    leader: 'Quizlet',
    also: ['Anki'],
    src: ['https://quizlet.com/upgrade'],
    v: 'behind',
    m: notBuilt({ does: 'Make sets from typed or imported terms', depth: 'Study modes, AI from notes (paid)', privacy: 'Account', price: 'Free to make sets; Plus about $36 a year', ours: 'Paid (decided 2026-10-06)', oursConds: 'Decks made from the person’s own records', condsV: '+' }),
    why: 'Making decks is free on Quizlet and Anki and is planned as paid here, so the win has to come from what the free tools cannot do.',
    win: 'Decks from a table and from the person’s own records (Q69), which neither leader can make.',
    items: ['Q69'],
  }),
  L('p-knowledge', {
    leader: null,
    also: ['Duolingo widget'],
    src: ['https://www.duolingo.com/'],
    v: 'alone',
    why: 'A Home card counting what a person has come to know, from what they read and recorded, with no score, has no counterpart.',
    items: ['Q70'],
  }),
];
