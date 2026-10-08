// One function compared with the leading app for that one function.
//   v: 'better' | 'even' | 'behind' | 'alone' (nobody else offers it)
//   m: the same eight measures every time, each [leader, ours, mark]
//      where mark is '+' ours is better, '=' even, '-' behind, '?' not checked.
//   why: the verdict in one line. win: what it takes to be better (even and behind).
//   items: build-plan ids (items.txt) that carry the win.
//   rule: set when the leader's edge rests on something a standing rule forbids here.
const MEASURES = [
  ['does', 'What it does'], ['depth', 'Depth'], ['taps', 'Taps'], ['offline', 'Offline'],
  ['privacy', 'Privacy'], ['access', 'Accessibility'], ['price', 'Price'], ['conds', 'Conditions covered'],
];
const VERDICTS = { better: 'Better', even: 'Even', behind: 'Behind', alone: 'Nobody else' };
const M = (leader, ours, mark) => [leader, ours, mark];
const L = (id, o) => ({ id, checked: '2026-10-07', also: [], src: [], items: [], ...o });
module.exports = { L, M, MEASURES, VERDICTS };
