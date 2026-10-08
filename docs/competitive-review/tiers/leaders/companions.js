// Companion tiers: each against the leader for sharing with that kind of person.
// Checked 2026-10-07. None is built past the shopping list and chores between
// two connections (lib/peerRelationships.ts); prices from the tier table.
const { L, M } = require('./shape.js');

const NA = 'Text scales with the phone, uncapped; screen reader labels not audited';

function notBuilt(o) {
  return {
    does: M(o.does, 'Not built', '-'),
    depth: M(o.depth, 'Not built', '-'),
    taps: M(o.taps || 'Invite', 'Not built', '-'),
    offline: M(o.offline || 'Cloud', 'Would merge through the relay and shared folder', o.offlineV || '='),
    privacy: M(o.privacy || 'Company holds the shared data', 'Sealed between the two, allowlist per area', o.privacyV || '+'),
    access: M('Not checked', NA, '?'),
    price: M(o.price, o.ours, o.priceV || '-'),
    conds: M(o.conds || 'None', o.oursConds || 'Health domain never shared unless chosen', o.condsV || '+'),
  };
}

module.exports = [
  L('c-viewer', {
    leader: 'Cozi',
    also: ['OurGroceries'],
    src: ['https://www.cozi.com/cozi-gold/'],
    v: 'behind',
    m: notBuilt({ does: 'Family calendar, lists and meals, everyone free', depth: 'Shared calendar', price: 'Free with ads; Gold $39 a year', ours: 'First 2 to 3 seats free, then $17.99 a year a seat', priceV: '-' }),
    why: 'Not built; Cozi gives the whole family the same view free.',
    win: 'The household viewer seat (Q71): meal plan, list and Trends summary, ticking off the list, all seats on Free past a second person reconsidered.',
    items: ['Q71', 'P12'],
  }),
  L('c-household', {
    leader: 'Cozi',
    also: ['OurHome', 'AnyList'],
    src: ['https://www.cozi.com/cozi-gold/'],
    v: 'behind',
    m: notBuilt({ does: 'Everyone edits the calendar, lists and meals', depth: 'Chores, rewards on OurHome', price: 'Free; Gold $39 a year for the family', ours: '$17.99 a year a seat' }),
    why: 'Per-seat pricing loses to one family price.',
    win: 'The household tier (Q71) with one family price, built on the allowlist (P12) and shared chores (J8).',
    items: ['Q71', 'P12', 'J8'],
  }),
  L('c-partner', {
    leader: 'Apple Health (Sharing)',
    also: ['AnyList', 'Paired'],
    src: ['https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios'],
    v: 'behind',
    m: notBuilt({ does: 'Share chosen health categories with a person, end-to-end encrypted', depth: 'Per category, alerts on changes', privacy: 'End-to-end encrypted', privacyV: '=', price: 'Free', ours: '$134.99 a year for two', conds: 'Any', oursConds: 'Meals and shopping shared, health private by default' }),
    why: 'Apple shares health data per category for free; ours would add two full accounts and the meals.',
    win: 'The Partner tier (Q72): two full accounts, meals and shopping shared, per-category choice of the rest, ended cleanly (P32).',
    items: ['Q72', 'P12', 'P32'],
  }),
  L('c-guardian', {
    leader: 'Google Family Link',
    also: ['Baby Connect', 'Apple Family Sharing'],
    src: ['https://families.google/familylink/'],
    v: 'behind',
    m: notBuilt({ does: 'A parent manages a child’s device and accounts', depth: 'Apps and screen time, not health', price: 'Free', ours: 'Free with Individual or Partner', priceV: '=', conds: 'None', oursConds: 'A child’s conditions, meds and food' }),
    why: 'Not built.',
    win: 'Children’s records under Guardian (Q56), handed over at adulthood (P30).',
    items: ['Q56', 'P30'],
  }),
  L('c-caregiver', {
    leader: 'CareClinic',
    also: ['Medisafe (Medfriend)', 'Caring Village'],
    src: ['https://careclinic.io/'],
    v: 'behind',
    m: notBuilt({ does: 'A caregiver sees and logs for another person', depth: 'Meds, symptoms, care plan', price: 'Free core; Medfriend alerts free on Medisafe', ours: '$49.99 a year per person cared for', oursConds: 'The 19 conditions, consent or attestation' }),
    why: 'Not built, and priced where the leaders are free.',
    win: 'The Caregiver tier (Q73) with every change logged where both read it (P31) and missed doses told on time (A16, M1).',
    items: ['Q73', 'P31', 'A16'],
  }),
];
