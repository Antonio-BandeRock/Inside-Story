// Injection site rotation (A4 of the competitive build plan, 2026-09-30).
// A person who gives themselves shots, a biologic for RA, psoriasis, IBD or
// lupus, insulin for type 1 diabetes, a disease-modifying shot for MS, a
// CGRP antibody for migraine, B12 for pernicious anemia, keeps a record of
// where each one went and sees the spot in their rotation used longest ago.
//
// Which meds this applies to is decided from the med itself, never from a
// condition, so nobody is missed because the condition they inject for is
// not one of the 19: a med whose name matches a medicine only ever given as
// a shot at home starts with the switch on, one that comes as both a tablet
// and a shot (methotrexate, semaglutide, B12) asks, and any other med can be
// turned on by hand. The person's answer always wins over the list.
//
// The app records sites and suggests the next one in the person's own
// rotation. It never says which spots are right for a med, never changes a
// dose or a schedule, and names the prescriber and the med's leaflet as
// where the list of spots comes from.
//
// Pure and free of runtime imports so scripts/test_injection_sites.js can
// check it without a phone.

export type InjectionSite = { key: string; label: string };

export type SiteUse = { id: string; siteKey: string; siteLabel: string; recordedAt: string; scheduleItemId: string | null };

// How a medicine on the list is usually given, which decides the preset.
// home: only ever a shot the person gives themselves, so the switch starts on.
// either: comes as a tablet, a spray or a shot, so the app asks.
// clinic: usually an infusion or a shot given at a clinic, so it starts off.
export type InjectableKind = 'home' | 'either' | 'clinic';

export type KnownInjectable = {
  id: string;
  name: string;
  kind: InjectableKind;
  // Condition codes from lib/conditionCodeMap.ts, and plain names for what
  // falls outside the 19 (pernicious anemia, osteoporosis).
  conditions: readonly string[];
  // Generic and brand names, matched as whole words.
  names: readonly string[];
};

export const BUILT_IN_SITES: readonly InjectionSite[] = [
  { key: 'belly_left', label: 'Belly, left side' },
  { key: 'belly_right', label: 'Belly, right side' },
  { key: 'thigh_left', label: 'Left thigh' },
  { key: 'thigh_right', label: 'Right thigh' },
  { key: 'arm_left', label: 'Back of left upper arm' },
  { key: 'arm_right', label: 'Back of right upper arm' },
  { key: 'buttock_left', label: 'Left buttock' },
  { key: 'buttock_right', label: 'Right buttock' },
];

// The rotation a med starts with: the belly, thighs and upper arms, which
// is where most self-injection leaflets point. The buttocks are one tap
// away, and any spot of the person's choosing can be added.
export const DEFAULT_ROTATION_KEYS: readonly string[] = ['belly_left', 'belly_right', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'];

export function defaultRotation(): InjectionSite[] {
  return BUILT_IN_SITES.filter((s) => DEFAULT_ROTATION_KEYS.includes(s.key));
}

const CONDITION_LABELS: Record<string, string> = {
  hashimotos: "Hashimoto's",
  rheumatoid_arthritis: 'rheumatoid arthritis',
  psoriasis: 'psoriasis and psoriatic arthritis',
  graves: "Graves' disease",
  type_1_diabetes: 'type 1 diabetes',
  celiac: 'celiac disease',
  ibd: "Crohn's and ulcerative colitis",
  multiple_sclerosis: 'multiple sclerosis',
  lupus: 'lupus',
  sjogrens: "Sjögren's",
  pcos: 'PCOS',
  chronic_kidney_disease: 'chronic kidney disease',
  fatty_liver_disease: 'fatty liver disease',
  type_2_diabetes: 'type 2 diabetes',
  ibs: 'IBS',
  migraine: 'migraine',
  cardiovascular_disease: 'heart and blood vessel disease',
  gout: 'gout',
  prostate_health: 'prostate health',
};

export const KNOWN_INJECTABLES: readonly KnownInjectable[] = [
  // Biologics and shots for RA, psoriasis, IBD and lupus
  { id: 'adalimumab', name: 'Adalimumab', kind: 'home', conditions: ['rheumatoid_arthritis', 'psoriasis', 'ibd'], names: ['adalimumab', 'humira', 'amjevita', 'hadlima', 'hyrimoz', 'cyltezo', 'yusimry', 'idacio', 'hulio', 'yuflyma', 'simlandi', 'abrilada', 'imraldi', 'amgevita'] },
  { id: 'etanercept', name: 'Etanercept', kind: 'home', conditions: ['rheumatoid_arthritis', 'psoriasis'], names: ['etanercept', 'enbrel', 'erelzi', 'eticovo', 'benepali'] },
  { id: 'certolizumab', name: 'Certolizumab', kind: 'home', conditions: ['rheumatoid_arthritis', 'psoriasis', 'ibd'], names: ['certolizumab', 'cimzia'] },
  { id: 'golimumab', name: 'Golimumab', kind: 'home', conditions: ['rheumatoid_arthritis', 'psoriasis', 'ibd'], names: ['golimumab', 'simponi'] },
  { id: 'ustekinumab', name: 'Ustekinumab', kind: 'home', conditions: ['psoriasis', 'ibd'], names: ['ustekinumab', 'stelara', 'wezlana', 'selarsdi', 'pyzchiva', 'otulfi', 'imuldosa', 'yesintek', 'steqeyma'] },
  { id: 'secukinumab', name: 'Secukinumab', kind: 'home', conditions: ['psoriasis'], names: ['secukinumab', 'cosentyx'] },
  { id: 'ixekizumab', name: 'Ixekizumab', kind: 'home', conditions: ['psoriasis'], names: ['ixekizumab', 'taltz'] },
  { id: 'brodalumab', name: 'Brodalumab', kind: 'home', conditions: ['psoriasis'], names: ['brodalumab', 'siliq', 'kyntheum'] },
  { id: 'bimekizumab', name: 'Bimekizumab', kind: 'home', conditions: ['psoriasis'], names: ['bimekizumab', 'bimzelx'] },
  { id: 'guselkumab', name: 'Guselkumab', kind: 'home', conditions: ['psoriasis', 'ibd'], names: ['guselkumab', 'tremfya'] },
  { id: 'risankizumab', name: 'Risankizumab', kind: 'home', conditions: ['psoriasis', 'ibd'], names: ['risankizumab', 'skyrizi'] },
  { id: 'tildrakizumab', name: 'Tildrakizumab', kind: 'home', conditions: ['psoriasis'], names: ['tildrakizumab', 'ilumya', 'ilumetri'] },
  { id: 'mirikizumab', name: 'Mirikizumab', kind: 'home', conditions: ['ibd'], names: ['mirikizumab', 'omvoh'] },
  { id: 'sarilumab', name: 'Sarilumab', kind: 'home', conditions: ['rheumatoid_arthritis'], names: ['sarilumab', 'kevzara'] },
  { id: 'anakinra', name: 'Anakinra', kind: 'home', conditions: ['rheumatoid_arthritis'], names: ['anakinra', 'kineret'] },
  { id: 'tocilizumab', name: 'Tocilizumab', kind: 'either', conditions: ['rheumatoid_arthritis'], names: ['tocilizumab', 'actemra', 'roactemra', 'tofidence', 'tyenne'] },
  { id: 'abatacept', name: 'Abatacept', kind: 'either', conditions: ['rheumatoid_arthritis'], names: ['abatacept', 'orencia'] },
  { id: 'belimumab', name: 'Belimumab', kind: 'either', conditions: ['lupus'], names: ['belimumab', 'benlysta'] },
  { id: 'vedolizumab', name: 'Vedolizumab', kind: 'either', conditions: ['ibd'], names: ['vedolizumab', 'entyvio'] },
  { id: 'infliximab', name: 'Infliximab', kind: 'clinic', conditions: ['ibd', 'rheumatoid_arthritis', 'psoriasis'], names: ['infliximab', 'remicade', 'inflectra', 'renflexis', 'avsola', 'zymfentra', 'remsima'] },
  { id: 'anifrolumab', name: 'Anifrolumab', kind: 'clinic', conditions: ['lupus'], names: ['anifrolumab', 'saphnelo'] },
  { id: 'methotrexate', name: 'Methotrexate', kind: 'either', conditions: ['rheumatoid_arthritis', 'psoriasis', 'ibd'], names: ['methotrexate', 'otrexup', 'rasuvo', 'reditrex', 'metoject', 'trexall'] },
  // Multiple sclerosis
  { id: 'glatiramer_acetate', name: 'Glatiramer acetate', kind: 'home', conditions: ['multiple_sclerosis'], names: ['glatiramer', 'copaxone', 'glatopa'] },
  { id: 'interferon_beta', name: 'Interferon beta', kind: 'home', conditions: ['multiple_sclerosis'], names: ['interferon beta', 'avonex', 'rebif', 'plegridy', 'betaseron', 'betaferon', 'extavia'] },
  { id: 'ofatumumab', name: 'Ofatumumab', kind: 'home', conditions: ['multiple_sclerosis'], names: ['ofatumumab', 'kesimpta'] },
  { id: 'natalizumab', name: 'Natalizumab', kind: 'clinic', conditions: ['multiple_sclerosis'], names: ['natalizumab', 'tysabri', 'tyruko'] },
  { id: 'ocrelizumab', name: 'Ocrelizumab', kind: 'clinic', conditions: ['multiple_sclerosis'], names: ['ocrelizumab', 'ocrevus'] },
  // Diabetes
  { id: 'insulin', name: 'Insulin', kind: 'home', conditions: ['type_1_diabetes', 'type_2_diabetes'], names: ['insulin', 'lantus', 'levemir', 'tresiba', 'toujeo', 'basaglar', 'semglee', 'rezvoglar', 'humalog', 'novolog', 'novorapid', 'apidra', 'fiasp', 'lyumjev', 'admelog', 'humulin', 'novolin', 'glargine', 'detemir', 'degludec', 'lispro', 'aspart', 'glulisine'] },
  { id: 'pramlintide', name: 'Pramlintide', kind: 'home', conditions: ['type_1_diabetes', 'type_2_diabetes'], names: ['pramlintide', 'symlin'] },
  { id: 'glucagon', name: 'Glucagon', kind: 'either', conditions: ['type_1_diabetes'], names: ['glucagon', 'glucagen', 'gvoke', 'dasiglucagon', 'zegalogue'] },
  { id: 'semaglutide', name: 'Semaglutide', kind: 'either', conditions: ['type_2_diabetes', 'fatty_liver_disease'], names: ['semaglutide', 'ozempic', 'wegovy'] },
  { id: 'liraglutide', name: 'Liraglutide', kind: 'home', conditions: ['type_2_diabetes'], names: ['liraglutide', 'victoza', 'saxenda'] },
  { id: 'dulaglutide', name: 'Dulaglutide', kind: 'home', conditions: ['type_2_diabetes'], names: ['dulaglutide', 'trulicity'] },
  { id: 'tirzepatide', name: 'Tirzepatide', kind: 'home', conditions: ['type_2_diabetes', 'fatty_liver_disease'], names: ['tirzepatide', 'mounjaro', 'zepbound'] },
  { id: 'exenatide', name: 'Exenatide', kind: 'home', conditions: ['type_2_diabetes'], names: ['exenatide', 'byetta', 'bydureon'] },
  // Migraine
  { id: 'erenumab', name: 'Erenumab', kind: 'home', conditions: ['migraine'], names: ['erenumab', 'aimovig'] },
  { id: 'fremanezumab', name: 'Fremanezumab', kind: 'home', conditions: ['migraine'], names: ['fremanezumab', 'ajovy'] },
  { id: 'galcanezumab', name: 'Galcanezumab', kind: 'home', conditions: ['migraine'], names: ['galcanezumab', 'emgality'] },
  { id: 'sumatriptan', name: 'Sumatriptan', kind: 'either', conditions: ['migraine'], names: ['sumatriptan', 'imitrex', 'zembrace', 'imigran'] },
  { id: 'eptinezumab', name: 'Eptinezumab', kind: 'clinic', conditions: ['migraine'], names: ['eptinezumab', 'vyepti'] },
  // Heart and blood vessels, kidneys, gout
  { id: 'evolocumab', name: 'Evolocumab', kind: 'home', conditions: ['cardiovascular_disease'], names: ['evolocumab', 'repatha'] },
  { id: 'alirocumab', name: 'Alirocumab', kind: 'home', conditions: ['cardiovascular_disease'], names: ['alirocumab', 'praluent'] },
  { id: 'enoxaparin', name: 'Enoxaparin', kind: 'home', conditions: ['cardiovascular_disease'], names: ['enoxaparin', 'lovenox', 'clexane', 'dalteparin', 'fragmin', 'fondaparinux', 'arixtra'] },
  { id: 'epoetin', name: 'Epoetin', kind: 'either', conditions: ['chronic_kidney_disease'], names: ['epoetin', 'epogen', 'procrit', 'retacrit', 'eprex', 'darbepoetin', 'aranesp', 'mircera'] },
  { id: 'pegloticase', name: 'Pegloticase', kind: 'clinic', conditions: ['gout'], names: ['pegloticase', 'krystexxa'] },
  // Hormones and fertility, including ovulation induction for PCOS
  { id: 'gonadotropins', name: 'Fertility injections', kind: 'home', conditions: ['pcos'], names: ['follitropin', 'gonal f', 'gonal-f', 'follistim', 'puregon', 'menopur', 'menotropins', 'ganirelix', 'cetrorelix', 'cetrotide', 'ovidrel', 'ovitrelle', 'pregnyl', 'novarel', 'choriogonadotropin'] },
  { id: 'leuprolide', name: 'Leuprolide', kind: 'either', conditions: ['prostate_health'], names: ['leuprolide', 'leuprorelin', 'lupron', 'eligard'] },
  { id: 'testosterone', name: 'Testosterone', kind: 'either', conditions: [], names: ['testosterone cypionate', 'testosterone enanthate', 'depo-testosterone', 'xyosted'] },
  { id: 'medroxyprogesterone', name: 'Medroxyprogesterone', kind: 'either', conditions: ['pcos'], names: ['depo-provera', 'depo provera', 'depo-subq', 'sayana'] },
  // Outside the 19, named so a person is never missed
  { id: 'vitamin_b12_injection', name: 'Vitamin B12 shots', kind: 'either', conditions: ['pernicious anemia'], names: ['cyanocobalamin', 'hydroxocobalamin', 'methylcobalamin injection', 'b12 injection', 'b12 shot', 'b12 shots', 'vitamin b12 injection'] },
  { id: 'teriparatide', name: 'Teriparatide', kind: 'home', conditions: ['osteoporosis'], names: ['teriparatide', 'forteo', 'abaloparatide', 'tymlos'] },
  { id: 'denosumab', name: 'Denosumab', kind: 'either', conditions: ['osteoporosis'], names: ['denosumab', 'prolia', 'jubbonti'] },
  { id: 'dupilumab', name: 'Dupilumab', kind: 'home', conditions: ['eczema and asthma'], names: ['dupilumab', 'dupixent'] },
  { id: 'omalizumab', name: 'Omalizumab', kind: 'home', conditions: ['asthma and hives'], names: ['omalizumab', 'xolair'] },
  { id: 'somatropin', name: 'Growth hormone', kind: 'home', conditions: ['growth hormone deficiency'], names: ['somatropin', 'genotropin', 'norditropin', 'humatrope', 'omnitrope', 'saizen'] },
];

function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

// The known medicine a med's name or generic name refers to, matched as
// whole words so "insulin resistance" in a note never counts but a typed
// "Lantus SoloStar" does. Brands with a tablet form (Rybelsus for
// semaglutide) are left off the list on purpose.
export function matchInjectable(name: string | null | undefined, genericName?: string | null): KnownInjectable | null {
  const haystack = normalise(`${name ?? ''} ${genericName ?? ''}`);
  if (!haystack.trim()) return null;
  for (const med of KNOWN_INJECTABLES) {
    if (genericName && genericName === med.id) return med;
    for (const alias of med.names) {
      if (haystack.includes(normalise(alias))) return med;
    }
  }
  return null;
}

/**
 * Whether a med gets injection sites. The person's answer (`stored`, null
 * when they have never answered) always wins; otherwise only a medicine
 * that is only ever a shot at home starts on.
 */
export function isInjected(stored: boolean | null, match: KnownInjectable | null): boolean {
  if (stored !== null) return stored;
  return match?.kind === 'home';
}

function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export function conditionWords(conditions: readonly string[]): string {
  return joinWords(conditions.map((c) => CONDITION_LABELS[c] ?? c));
}

// The line under the switch, saying why it starts where it does.
export function matchLine(match: KnownInjectable | null, injected: boolean): string {
  if (!match) {
    return injected
      ? 'Turned on for this med. Any med given as a shot can keep a site record.'
      : 'Turn this on if this med is a shot you give yourself or someone gives you at home.';
  }
  const forWhat = match.conditions.length ? `, used for ${conditionWords(match.conditions)}` : '';
  if (match.kind === 'home') return `${match.name}${forWhat}, is given as a shot, so this started on.`;
  if (match.kind === 'either') return `${match.name}${forWhat}, comes as a shot and in other forms. Turn this on if yours is a shot.`;
  return `${match.name}${forWhat}, is usually given at a clinic, where the site is chosen for you. Turn this on if you inject it at home.`;
}

export const INJECTION_LEAD =
  'Keeps a record of where each shot went and suggests the spot in your rotation used longest ago. The spots in the rotation are yours to set from what your prescriber or the med’s leaflet names; the app never changes a dose or a schedule.';

// The site in the rotation used longest ago, with a spot never used first,
// in rotation order. Skipping a spot or using one out of turn is handled
// the same way: whatever has waited longest comes next.
export function nextSite(rotation: readonly InjectionSite[], history: readonly SiteUse[]): InjectionSite | null {
  if (rotation.length === 0) return null;
  let best: InjectionSite | null = null;
  let bestAt: string | null = null;
  for (const site of rotation) {
    const at = lastUseOf(site.key, history)?.recordedAt ?? null;
    if (at === null) return site;
    if (bestAt === null || at < bestAt) {
      best = site;
      bestAt = at;
    }
  }
  return best;
}

export function lastUseOf(siteKey: string, history: readonly SiteUse[]): SiteUse | null {
  let found: SiteUse | null = null;
  for (const use of history) {
    if (use.siteKey === siteKey && (!found || use.recordedAt > found.recordedAt)) found = use;
  }
  return found;
}

export function latestUse(history: readonly SiteUse[]): SiteUse | null {
  let found: SiteUse | null = null;
  for (const use of history) if (!found || use.recordedAt > found.recordedAt) found = use;
  return found;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-09-28...' to '28 Sep', read from the date characters so a stored
// local day is never shifted by a time zone.
export function siteDate(recordedAt: string): string {
  const [, month, day] = recordedAt.slice(0, 10).split('-').map(Number);
  return `${day} ${MONTH_SHORT[month - 1]}`;
}

function daysBetween(fromDay: string, toDay: string): number {
  const [y1, m1, d1] = fromDay.split('-').map(Number);
  const [y2, m2, d2] = toDay.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function agoWords(recordedAt: string, today: string): string {
  const days = daysBetween(recordedAt.slice(0, 10), today);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function nextSiteLine(rotation: readonly InjectionSite[], history: readonly SiteUse[]): string | null {
  const next = nextSite(rotation, history);
  return next ? `Next site: ${next.label}` : null;
}

export function lastSiteLine(history: readonly SiteUse[], today: string): string {
  const last = latestUse(history);
  if (!last) return 'No shot recorded yet.';
  return `Last shot: ${last.siteLabel}, ${agoWords(last.recordedAt, today)} (${siteDate(last.recordedAt)}).`;
}

// One label per choice in the site picker: the suggested spot first and
// marked, then the rest in rotation order with when each was last used.
export function siteChoices(
  rotation: readonly InjectionSite[],
  history: readonly SiteUse[],
): { site: InjectionSite; label: string }[] {
  const next = nextSite(rotation, history);
  const ordered = next ? [next, ...rotation.filter((s) => s.key !== next.key)] : [...rotation];
  return ordered.map((site) => {
    const last = lastUseOf(site.key, history);
    const when = last ? `, last ${siteDate(last.recordedAt)}` : ', not used yet';
    return { site, label: `${site.label}${next && site.key === next.key ? ' (next)' : when}` };
  });
}

// A spot the person names. Its key is made from the words so the same spot
// typed on two devices merges into one.
export function ownSite(label: string): InjectionSite | null {
  const trimmed = label.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const slug = normalise(trimmed).trim().replace(/ /g, '_');
  if (!slug) return null;
  return { key: `own:${slug}`, label: trimmed };
}

export function isOwnSite(site: InjectionSite): boolean {
  return site.key.startsWith('own:');
}

// The rotation kept in a steady order: the built-in spots in body order,
// then the person's spots in the order they were added.
export function orderRotation(rotation: readonly InjectionSite[]): InjectionSite[] {
  const builtIn = BUILT_IN_SITES.filter((b) => rotation.some((s) => s.key === b.key));
  const own = rotation.filter((s) => !BUILT_IN_SITES.some((b) => b.key === s.key));
  const seen = new Set<string>();
  return [...builtIn, ...own].filter((s) => (seen.has(s.key) ? false : (seen.add(s.key), true)));
}

export function toggleSite(rotation: readonly InjectionSite[], site: InjectionSite): InjectionSite[] {
  return rotation.some((s) => s.key === site.key)
    ? rotation.filter((s) => s.key !== site.key)
    : orderRotation([...rotation, site]);
}

export function parseRotation(json: string | null): InjectionSite[] | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json);
    if (!Array.isArray(value)) return null;
    return orderRotation(
      value.filter((s): s is InjectionSite => s && typeof s.key === 'string' && typeof s.label === 'string'),
    );
  } catch {
    return null;
  }
}
