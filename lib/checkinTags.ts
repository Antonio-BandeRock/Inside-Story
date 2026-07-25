// Fixed picklist of what a wellbeing check-in can be tagged with. This is
// app-level UI vocabulary, not researched/cited medical content (unlike the
// D1-D6 tiers or the physiology/lab-test reference data), so it lives as a
// plain TS constant rather than a bundled DB table -- there's nothing here
// to verify against a citation, just labels for what the person is
// reporting about themselves.
//
// Deliberately includes positive tags (good_energy, digestion_calm,
// slept_well, ...) alongside the negative/symptom ones -- the whole point
// raised for this feature is that early on, before enough history exists
// to see a real trend, logging what's going RIGHT is what keeps someone
// using the app, and it's just as valuable a correlation input as a
// symptom is.

export type CheckinTagCategory =
  | 'digestive'
  | 'energy'
  | 'mood_stress'
  | 'sleep'
  | 'skin'
  | 'pain_physical'
  | 'cognitive';

export type CheckinTagDefinition = {
  code: string;
  label: string;
  category: CheckinTagCategory;
  // Which direction this tag usually points -- a UI hint (e.g. for color
  // coding), not a hard rule; the check-in's own `valence` field is the
  // actual source of truth since context can flip a tag's meaning (e.g.
  // "wired" after coffee vs. "wired" as an anxiety symptom).
  usualValence: 'positive' | 'negative';
};

export const CHECKIN_TAG_CATEGORIES: Record<CheckinTagCategory, string> = {
  digestive: 'Digestive / IBS',
  energy: 'Energy',
  mood_stress: 'Mood & Stress',
  sleep: 'Sleep',
  skin: 'Skin',
  pain_physical: 'Pain & Physical',
  cognitive: 'Cognitive',
};

export const CHECKIN_TAGS: CheckinTagDefinition[] = [
  // Digestive / IBS -- Rome IV-style symptom set, the same functional-GI
  // framing already used for this app's D1-D6 Fiber Type sub-criterion.
  { code: 'bloating', label: 'Bloating', category: 'digestive', usualValence: 'negative' },
  { code: 'cramping', label: 'Cramping', category: 'digestive', usualValence: 'negative' },
  { code: 'diarrhea', label: 'Diarrhea', category: 'digestive', usualValence: 'negative' },
  { code: 'constipation', label: 'Constipation', category: 'digestive', usualValence: 'negative' },
  { code: 'gas', label: 'Gas', category: 'digestive', usualValence: 'negative' },
  { code: 'reflux_heartburn', label: 'Reflux / Heartburn', category: 'digestive', usualValence: 'negative' },
  { code: 'nausea', label: 'Nausea', category: 'digestive', usualValence: 'negative' },
  { code: 'digestion_calm', label: 'Digestion felt calm/normal', category: 'digestive', usualValence: 'positive' },

  // Energy
  { code: 'fatigue', label: 'Fatigue', category: 'energy', usualValence: 'negative' },
  { code: 'energy_crash', label: 'Energy crash', category: 'energy', usualValence: 'negative' },
  { code: 'wired_jittery', label: 'Wired / jittery', category: 'energy', usualValence: 'negative' },
  { code: 'good_energy', label: 'Good, steady energy', category: 'energy', usualValence: 'positive' },

  // Mood & Stress
  { code: 'anxious', label: 'Anxious', category: 'mood_stress', usualValence: 'negative' },
  { code: 'irritable', label: 'Irritable', category: 'mood_stress', usualValence: 'negative' },
  { code: 'low_mood', label: 'Low mood', category: 'mood_stress', usualValence: 'negative' },
  { code: 'stressed', label: 'Stressed', category: 'mood_stress', usualValence: 'negative' },
  { code: 'calm_good_mood', label: 'Calm / good mood', category: 'mood_stress', usualValence: 'positive' },

  // Sleep
  { code: 'trouble_falling_asleep', label: 'Trouble falling asleep', category: 'sleep', usualValence: 'negative' },
  { code: 'woke_frequently', label: 'Woke up frequently', category: 'sleep', usualValence: 'negative' },
  { code: 'groggy', label: 'Groggy on waking', category: 'sleep', usualValence: 'negative' },
  { code: 'slept_well', label: 'Slept well', category: 'sleep', usualValence: 'positive' },

  // Skin
  { code: 'skin_flare', label: 'Skin flare / rash', category: 'skin', usualValence: 'negative' },
  { code: 'itching', label: 'Itching', category: 'skin', usualValence: 'negative' },
  { code: 'skin_clear', label: 'Skin clear/calm', category: 'skin', usualValence: 'positive' },

  // Pain & Physical
  { code: 'joint_pain', label: 'Joint pain', category: 'pain_physical', usualValence: 'negative' },
  { code: 'headache', label: 'Headache', category: 'pain_physical', usualValence: 'negative' },
  { code: 'muscle_soreness', label: 'Muscle soreness', category: 'pain_physical', usualValence: 'negative' },
  { code: 'heart_palpitations', label: 'Heart palpitations', category: 'pain_physical', usualValence: 'negative' },
  { code: 'temperature_sensitivity', label: 'Cold/heat sensitivity', category: 'pain_physical', usualValence: 'negative' },
  { code: 'swelling', label: 'Swelling', category: 'pain_physical', usualValence: 'negative' },
  { code: 'felt_good_physically', label: 'Felt good physically', category: 'pain_physical', usualValence: 'positive' },

  // Cognitive
  { code: 'brain_fog', label: 'Brain fog', category: 'cognitive', usualValence: 'negative' },
  { code: 'clear_headed', label: 'Clear-headed / focused', category: 'cognitive', usualValence: 'positive' },
];

export function getCheckinTagsByCategory(): { category: CheckinTagCategory; label: string; tags: CheckinTagDefinition[] }[] {
  return (Object.keys(CHECKIN_TAG_CATEGORIES) as CheckinTagCategory[]).map((category) => ({
    category,
    label: CHECKIN_TAG_CATEGORIES[category],
    tags: CHECKIN_TAGS.filter((tag) => tag.category === category),
  }));
}

export function getCheckinTagDefinition(code: string): CheckinTagDefinition | undefined {
  return CHECKIN_TAGS.find((tag) => tag.code === code);
}
