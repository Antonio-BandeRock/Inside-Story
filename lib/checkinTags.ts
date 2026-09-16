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
  | 'cognitive'
  // Both added 2026-09-16. The 36 tags this list started with described a
  // body: what the gut, the joints, the skin and the sleep did. Two things
  // people report constantly had nowhere to go.
  //
  // Appetite is the one closest to this app's purpose. Whether someone ate
  // at all sits upstream of every food correlation the Pattern Finder can
  // draw, and "no appetite" is a documented experience in Hashimoto's,
  // IBD, chronic kidney disease and half the medications in My Meds. The
  // app could see what was logged and never why nothing was.
  //
  // Sensory and regulation covers being overwhelmed by noise, light or
  // crowds, and what follows when that does not let up. Named for
  // neurodivergent users, who asked for it, but not only theirs: light and
  // sound sensitivity is core to migraine, and the crash after too much
  // input is familiar to anyone managing fatigue.
  | 'appetite'
  | 'sensory_regulation';

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
  appetite: 'Appetite & Eating',
  energy: 'Energy',
  mood_stress: 'Mood & Stress',
  sleep: 'Sleep',
  skin: 'Skin',
  pain_physical: 'Pain & Physical',
  cognitive: 'Cognitive',
  sensory_regulation: 'Sensory & Regulation',
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

  // Appetite & Eating. Deliberately about the wanting and the doing, not
  // the digesting: what happened after food is already covered above.
  // 'forgot_to_eat' is the one that started this group, and it is the one
  // the meal reminders added the same day are meant to act on.
  { code: 'no_appetite', label: 'No appetite', category: 'appetite', usualValence: 'negative' },
  { code: 'forgot_to_eat', label: 'Forgot to eat', category: 'appetite', usualValence: 'negative' },
  { code: 'constant_hunger', label: 'Hungry all the time', category: 'appetite', usualValence: 'negative' },
  { code: 'food_aversion', label: "Couldn't face eating", category: 'appetite', usualValence: 'negative' },
  { code: 'ate_normally', label: 'Ate normally', category: 'appetite', usualValence: 'positive' },

  // Energy
  { code: 'fatigue', label: 'Fatigue', category: 'energy', usualValence: 'negative' },
  { code: 'energy_crash', label: 'Energy crash', category: 'energy', usualValence: 'negative' },
  { code: 'wired_jittery', label: 'Wired / jittery', category: 'energy', usualValence: 'negative' },
  { code: 'restless', label: "Restless / couldn't settle", category: 'energy', usualValence: 'negative' },
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
  // Both negative, which is a judgement about this list's purpose rather
  // than about the states themselves. Hyperfocus is not a bad thing to
  // experience; it is worth tagging here because of what it displaces, and
  // marking it negative is also what puts it in front of someone filling
  // in the Log tab's flare/reaction picker, which offers negative tags
  // only (see NEGATIVE_TAG_GROUPS in app/(tabs)/log.tsx).
  { code: 'hyperfocused', label: 'Hyperfocused / lost track of time', category: 'cognitive', usualValence: 'negative' },
  { code: 'couldnt_get_started', label: "Couldn't get started", category: 'cognitive', usualValence: 'negative' },
  { code: 'clear_headed', label: 'Clear-headed / focused', category: 'cognitive', usualValence: 'positive' },

  // Sensory & Regulation. Ordered as the day tends to run: too much input,
  // then the two ways that goes when it does not stop. Meltdown and
  // shutdown are kept apart on purpose, because they look nothing alike
  // from outside and a person knows which one they had.
  { code: 'overstimulated', label: 'Overstimulated', category: 'sensory_regulation', usualValence: 'negative' },
  { code: 'noise_light_sensitivity', label: 'Noise or light felt painful', category: 'sensory_regulation', usualValence: 'negative' },
  { code: 'meltdown', label: 'Meltdown', category: 'sensory_regulation', usualValence: 'negative' },
  { code: 'shutdown', label: 'Shutdown / withdrew', category: 'sensory_regulation', usualValence: 'negative' },
  { code: 'felt_regulated', label: 'Felt settled and regulated', category: 'sensory_regulation', usualValence: 'positive' },
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
