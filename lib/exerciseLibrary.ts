// The exercise library behind Life > Workouts (H11, 2026-09-28).
//
// Pure data and sentences, no database, so scripts/test_exercise_library.js
// can check every entry and, with --links, every URL.
//
// What each built-in exercise carries: the steps to do it, the safety points,
// the usual mistakes, an easier and a harder version, the default amount, and
// a link to a demonstration page (the ACE Fitness exercise library, or the
// NHS where ACE has no page for it). The technique here is the widely taught
// form those pages show; the link is where a person watches it done.
//
// Conditions. A note appears only for a condition the person tracks, and only
// on the exercises its tag fits, each note carrying its source. Nothing here
// forbids an exercise, and nothing frames exercise as treating a condition.
// "Gentle on a flare day" marks exercises low in load and impact that can be
// done lying, sitting or holding on; it is a filter for finding them, never a
// rule, and how a flare day goes is for the person to judge.

export type ExerciseCategory = 'strength' | 'core' | 'cardio' | 'stretch' | 'mobility' | 'balance';

export const EXERCISE_CATEGORIES: { key: ExerciseCategory; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'stretch', label: 'Stretching' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'balance', label: 'Balance' },
];

export type Equipment =
  | 'none'
  | 'chair'
  | 'wall'
  | 'mat'
  | 'step'
  | 'dumbbells'
  | 'band'
  | 'kettlebell'
  | 'bar'
  | 'ball'
  | 'bike'
  | 'pool';

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: 'Nothing',
  chair: 'A chair',
  wall: 'A wall',
  mat: 'A mat',
  step: 'A step',
  dumbbells: 'Dumbbells',
  band: 'Resistance band',
  kettlebell: 'Kettlebell',
  bar: 'Pull-up bar',
  ball: 'Exercise ball',
  bike: 'Bike',
  pool: 'Pool',
};

/** What a condition note looks for. */
export type ExerciseTag =
  /** Heavier load or a hold where breath gets held. */
  | 'strain'
  /** Jumping or landing. */
  | 'impact'
  /** Standing weight on the feet and ankles. */
  | 'onFeet'
  /** Hard enough to breathe hard for a while. */
  | 'vigorous'
  /** Usually done outside. */
  | 'outdoor';

export type ExerciseMeasure = 'reps' | 'time';
export type ExerciseIntensity = 'light' | 'moderate' | 'vigorous';

export type Demonstration = { source: string; url: string };

export type LibraryExercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: string;
  equipment: Equipment[];
  measure: ExerciseMeasure;
  sets: number;
  /** For measure 'reps'. */
  reps?: number;
  /** For measure 'time'. */
  seconds?: number;
  /** Done on one side then the other. */
  perSide?: boolean;
  steps: string[];
  safety: string[];
  mistakes: string[];
  easier: string;
  harder: string;
  gentle: boolean;
  intensity: ExerciseIntensity;
  tags: ExerciseTag[];
  demo: Demonstration;
};

const ACE_BASE = 'https://www.acefitness.org/resources/everyone/exercise-library/';
function ace(id: number, slug: string): Demonstration {
  return { source: 'ACE Fitness exercise library', url: `${ACE_BASE}${id}/${slug}/` };
}
const NHS_STRENGTH: Demonstration = { source: 'NHS strength exercises', url: 'https://www.nhs.uk/live-well/exercise/strength-exercises/' };
const NHS_BALANCE: Demonstration = { source: 'NHS balance exercises', url: 'https://www.nhs.uk/live-well/exercise/balance-exercises/' };
const NHS_SITTING: Demonstration = { source: 'NHS sitting exercises', url: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/' };
const NHS_FLEXIBILITY: Demonstration = { source: 'NHS flexibility exercises', url: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/' };
const NHS_WALKING: Demonstration = { source: 'NHS walking for health', url: 'https://www.nhs.uk/live-well/exercise/walking-for-health/' };
const NHS_WARM_UP: Demonstration = { source: 'NHS how to warm up', url: 'https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/' };
const NHS_GUIDELINES: Demonstration = {
  source: 'NHS physical activity guidelines',
  url: 'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/',
};
const SWIM_ENGLAND: Demonstration = { source: 'Swim England, Just Swim', url: 'https://www.swimming.org/justswim/' };

/** Every demonstration page named above, for the link check. */
export const SHARED_DEMONSTRATIONS: Demonstration[] = [
  NHS_STRENGTH,
  NHS_BALANCE,
  NHS_SITTING,
  NHS_FLEXIBILITY,
  NHS_WALKING,
  NHS_WARM_UP,
  NHS_GUIDELINES,
  SWIM_ENGLAND,
];

export const LIBRARY_EXERCISES: LibraryExercise[] = [
  // Strength, lower body
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight squat',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Stand with your feet about hip width apart, toes turned out a little.',
      'Push your hips back and bend your knees as if sitting into a chair behind you.',
      'Go down as far as is comfortable, chest up and heels on the floor.',
      'Press through your whole foot to stand back up.',
    ],
    safety: [
      'Keep your knees travelling in line with your toes, not falling inward.',
      'Breathe in on the way down and out on the way up.',
    ],
    mistakes: ['Lifting the heels.', 'Rounding the lower back at the bottom.'],
    easier: 'Squat down to a chair and stand back up from it.',
    harder: 'Hold a dumbbell at your chest (goblet squat) or pause for two seconds at the bottom.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(135, 'bodyweight-squat'),
  },
  {
    id: 'sit-to-stand',
    name: 'Sit to stand',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['chair'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    steps: [
      'Sit near the front of a sturdy chair, feet flat and hip width apart.',
      'Lean forward a little, arms folded across your chest or held out in front.',
      'Stand up slowly, using your legs rather than your hands.',
      'Sit back down slowly and with control.',
    ],
    safety: ['Use a chair that will not slide, with its back against a wall.', 'Use your hands on your thighs if you need them.'],
    mistakes: ['Dropping into the seat.', 'Rocking back and forth to get up.'],
    easier: 'Use a higher seat, or push up with your hands.',
    harder: 'Stand up more slowly, taking three seconds each way.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_STRENGTH,
  },
  {
    id: 'forward-lunge',
    name: 'Forward lunge',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Stand tall with your feet hip width apart.',
      'Step one foot forward and lower your back knee toward the floor.',
      'Stop when both knees are bent at about a right angle.',
      'Push through the front foot to step back to the start.',
    ],
    safety: ['Keep the front knee over the ankle, not past the toes.', 'Hold a wall or a chair if your balance wobbles.'],
    mistakes: ['Taking too short a step.', 'Leaning the body forward over the front leg.'],
    easier: 'Hold on to a chair and make the step smaller.',
    harder: 'Hold dumbbells at your sides.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(94, 'forward-lunge'),
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Stand tall with your feet hip width apart.',
      'Step one foot back and lower that knee toward the floor.',
      'Keep most of your weight on the front foot.',
      'Push through the front heel to bring the back foot in again.',
    ],
    safety: ['Stepping back is easier on the front knee than stepping forward.', 'Hold a chair for balance if needed.'],
    mistakes: ['Letting the front knee cave inward.', 'Bouncing the back knee off the floor.'],
    easier: 'Make the step shorter and go only part of the way down.',
    harder: 'Hold dumbbells at your sides.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(319, 'reverse-lunge'),
  },
  {
    id: 'side-lunge',
    name: 'Side lunge',
    category: 'strength',
    muscles: 'Inner and outer thighs, glutes',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Stand with your feet together.',
      'Take a wide step to one side and sit your hips back over that foot.',
      'Keep the other leg straight and both feet pointing forward.',
      'Push off the bent leg to come back to the start.',
    ],
    safety: ['Keep the bent knee in line with the toes.', 'Go only as low as your hips allow without pain.'],
    mistakes: ['Rounding the back.', 'Letting the heel of the bent leg lift.'],
    easier: 'Take a smaller step and bend less.',
    harder: 'Hold a dumbbell or kettlebell at your chest.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(50, 'side-lunge'),
  },
  {
    id: 'step-up',
    name: 'Step-up',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['step'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    perSide: true,
    steps: [
      'Stand facing a sturdy step or the bottom stair.',
      'Put one whole foot on the step.',
      'Press through that foot to stand up on the step.',
      'Step back down with the same leg, with control.',
    ],
    safety: ['Use a step that cannot tip or slide, and a rail if there is one.', 'Start with a low step.'],
    mistakes: ['Pushing off the back foot instead of the top one.', 'Only the toes on the step.'],
    easier: 'Use a lower step and hold the rail.',
    harder: 'Use a higher step or hold dumbbells.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(28, 'step-up'),
  },
  {
    id: 'glute-bridge',
    name: 'Glute bridge',
    category: 'strength',
    muscles: 'Glutes, back of the thighs',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Lie on your back with knees bent and feet flat, hip width apart.',
      'Tighten your stomach and squeeze your buttocks.',
      'Lift your hips until your body is straight from shoulders to knees.',
      'Hold for a moment, then lower slowly.',
    ],
    safety: ['Rest on your shoulders, not your neck.', 'Stop lifting before your lower back arches.'],
    mistakes: ['Pushing the hips too high and arching the back.', 'Letting the knees fall apart.'],
    easier: 'Lift only part of the way and hold for less time.',
    harder: 'Straighten one leg and lift on the other (single-leg bridge).',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(49, 'glute-bridge'),
  },
  {
    id: 'calf-raise',
    name: 'Calf raise',
    category: 'strength',
    muscles: 'Calves',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Stand tall, holding a wall or chair back lightly.',
      'Rise up on to the balls of your feet.',
      'Pause at the top.',
      'Lower your heels slowly to the floor.',
    ],
    safety: ['Hold on for balance; the calves are what is working here.'],
    mistakes: ['Bouncing instead of lowering slowly.', 'Rolling on to the outside edges of the feet.'],
    easier: 'Do it sitting, lifting the heels with the feet flat.',
    harder: 'Do it on one foot at a time.',
    gentle: true,
    intensity: 'light',
    tags: ['onFeet'],
    demo: ace(51, 'calf-raises'),
  },
  {
    id: 'wall-squat',
    name: 'Wall squat with a ball',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['wall', 'ball'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Place an exercise ball between your lower back and a wall.',
      'Walk your feet out a little in front of you, hip width apart.',
      'Bend your knees and let the ball roll with you as you lower.',
      'Press through your heels to rise again.',
    ],
    safety: ['Keep your knees behind your toes.', 'Go only as low as is comfortable.'],
    mistakes: ['Feet too close to the wall.', 'Knees drifting inward.'],
    easier: 'Lean on the wall without the ball and slide only a little way down.',
    harder: 'Hold at the bottom for five seconds each time.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(69, 'stability-ball-wall-squats'),
  },
  {
    id: 'goblet-squat',
    name: 'Goblet squat',
    category: 'strength',
    muscles: 'Thighs, glutes, upper back',
    equipment: ['dumbbells', 'kettlebell'],
    measure: 'reps',
    sets: 3,
    reps: 10,
    steps: [
      'Hold one dumbbell or kettlebell close to your chest with both hands.',
      'Stand with your feet a little wider than hip width.',
      'Sit your hips back and down between your heels, chest up.',
      'Drive through your feet to stand.',
    ],
    safety: ['Breathe out as you stand; do not hold your breath.', 'Choose a weight you can lift 10 times with good form.'],
    mistakes: ['Letting the weight pull you forward.', 'Knees falling inward.'],
    easier: 'Use a lighter weight or none.',
    harder: 'Use a heavier weight or add a pause at the bottom.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet', 'strain'],
    demo: ace(362, 'goblet-squat'),
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian deadlift',
    category: 'strength',
    muscles: 'Back of the thighs, glutes, lower back',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 3,
    reps: 10,
    steps: [
      'Stand with dumbbells in front of your thighs, knees a little bent.',
      'Hinge at the hips, pushing them back, and slide the weights down your legs.',
      'Keep your back flat and lower until you feel a stretch in the back of the thighs.',
      'Squeeze your glutes to bring your hips forward and stand up.',
    ],
    safety: ['Keep the weights close to your legs the whole way.', 'Breathe out as you stand up.'],
    mistakes: ['Rounding the back to reach lower.', 'Bending the knees into a squat.'],
    easier: 'Practise the hip hinge with a broom handle along your back, no weight.',
    harder: 'Do it on one leg (single-leg Romanian deadlift).',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet', 'strain'],
    demo: ace(317, 'romanian-deadlift'),
  },
  {
    id: 'hip-hinge',
    name: 'Hip hinge',
    category: 'mobility',
    muscles: 'Back of the thighs, glutes, lower back',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Hold a broom handle along your back, touching your head, upper back and tailbone.',
      'Soften your knees.',
      'Push your hips back and tip forward while all three points stay on the handle.',
      'Squeeze your glutes to come back up.',
    ],
    safety: ['It teaches the movement for lifting anything off the floor with a flat back.'],
    mistakes: ['Losing contact with the handle at the lower back.'],
    easier: 'Hinge only a short way.',
    harder: 'Hold light dumbbells and move on to the Romanian deadlift.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(33, 'hip-hinge'),
  },
  {
    id: 'side-lying-hip-abduction',
    name: 'Side-lying leg lift',
    category: 'strength',
    muscles: 'Outer hips',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    perSide: true,
    steps: [
      'Lie on your side with your legs straight and stacked.',
      'Rest your head on your lower arm.',
      'Lift the top leg slowly, toes pointing forward.',
      'Lower it slowly without letting it rest.',
    ],
    safety: ['Keep your hips stacked; do not roll backward.'],
    mistakes: ['Lifting too high and rolling the hip back.', 'Turning the toes up to the ceiling.'],
    easier: 'Bend the bottom knee for a steadier base.',
    harder: 'Add a resistance band above the knees.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(38, 'side-lying-hip-abduction'),
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian split squat',
    category: 'strength',
    muscles: 'Thighs, glutes',
    equipment: ['chair'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Stand a long step in front of a bench or chair, facing away from it.',
      'Rest the top of one foot on the seat behind you.',
      'Lower your back knee toward the floor, keeping your chest up.',
      'Push through the front foot to rise.',
    ],
    safety: ['Use a bench or chair that cannot move.', 'Keep the front knee in line with the toes.'],
    mistakes: ['Standing too close to the bench.', 'Pushing off the back foot.'],
    easier: 'Do a split squat with both feet on the floor.',
    harder: 'Hold dumbbells at your sides.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['onFeet', 'strain'],
    demo: ace(366, 'bulgarian-split-squat'),
  },
  // Strength, upper body
  {
    id: 'wall-push-up',
    name: 'Wall push-up',
    category: 'strength',
    muscles: 'Chest, shoulders, back of the arms',
    equipment: ['wall'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Stand an arm length from a wall and put your palms on it at shoulder height.',
      'Keep your body straight from head to heels.',
      'Bend your elbows to bring your chest toward the wall.',
      'Push back to the start.',
    ],
    safety: ['Keep your feet planted so they do not slip.'],
    mistakes: ['Sticking the hips out.', 'Flaring the elbows straight out to the sides.'],
    easier: 'Stand closer to the wall.',
    harder: 'Move to a kitchen counter, then to the bent-knee push-up.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_STRENGTH,
  },
  {
    id: 'bent-knee-push-up',
    name: 'Bent-knee push-up',
    category: 'strength',
    muscles: 'Chest, shoulders, back of the arms',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    steps: [
      'Kneel and place your hands on the floor a little wider than your shoulders.',
      'Walk your hands forward until your body is straight from head to knees.',
      'Lower your chest toward the floor.',
      'Push back up.',
    ],
    safety: ['Pad your knees with a folded mat.', 'Keep your stomach tight so the hips do not sag.'],
    mistakes: ['Hips high in the air.', 'Head dropping toward the floor.'],
    easier: 'Do the wall push-up.',
    harder: 'Do the full push-up from the toes.',
    gentle: false,
    intensity: 'moderate',
    tags: [],
    demo: ace(13, 'bent-knee-push-up'),
  },
  {
    id: 'push-up',
    name: 'Push-up',
    category: 'strength',
    muscles: 'Chest, shoulders, back of the arms, core',
    equipment: ['none'],
    measure: 'reps',
    sets: 3,
    reps: 8,
    steps: [
      'Start in a plank with hands a little wider than your shoulders.',
      'Keep a straight line from head to heels.',
      'Lower your chest to just above the floor, elbows angled back.',
      'Push the floor away to come back up.',
    ],
    safety: ['Breathe out on the push; do not hold your breath.'],
    mistakes: ['Sagging hips.', 'Only going part of the way down.'],
    easier: 'Do the bent-knee push-up, or put your hands on a bench.',
    harder: 'Put your feet on a step, or slow the lowering to three seconds.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(41, 'push-up'),
  },
  {
    id: 'bent-over-row',
    name: 'Bent-over row',
    category: 'strength',
    muscles: 'Upper back, back of the shoulders, biceps',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 3,
    reps: 10,
    steps: [
      'Hold dumbbells, soften your knees and hinge forward with a flat back.',
      'Let your arms hang below your shoulders.',
      'Pull the weights toward your lower ribs, squeezing your shoulder blades together.',
      'Lower them slowly.',
    ],
    safety: ['Keep your back flat and your neck in line with it.', 'Breathe out as you pull.'],
    mistakes: ['Jerking the weight up.', 'Rounding the back.'],
    easier: 'Do the single-arm row with one hand on a bench.',
    harder: 'Use heavier weights and pause at the top.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(12, 'bent-over-row'),
  },
  {
    id: 'single-arm-row',
    name: 'Single-arm row',
    category: 'strength',
    muscles: 'Upper back, biceps',
    equipment: ['dumbbells', 'chair'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    perSide: true,
    steps: [
      'Put one hand and one knee on a bench or sturdy chair.',
      'Hold a dumbbell in the other hand, arm hanging straight.',
      'Pull the weight up beside your ribs, elbow close to your body.',
      'Lower it slowly.',
    ],
    safety: ['The supporting hand takes the strain off your lower back.'],
    mistakes: ['Twisting the body to lift the weight.'],
    easier: 'Use a lighter weight.',
    harder: 'Use a heavier weight and slow the lowering.',
    gentle: false,
    intensity: 'moderate',
    tags: [],
    demo: ace(126, 'single-arm-row'),
  },
  {
    id: 'band-row',
    name: 'Standing row with a band',
    category: 'strength',
    muscles: 'Upper back, biceps',
    equipment: ['band'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Anchor a band at chest height in a door or round a post.',
      'Hold both ends and step back until the band is taut.',
      'Pull your hands to your ribs, squeezing your shoulder blades together.',
      'Let your arms straighten slowly.',
    ],
    safety: ['Check the anchor is secure before you pull.', 'Check the band for nicks or tears.'],
    mistakes: ['Shrugging the shoulders up to the ears.'],
    easier: 'Step closer to the anchor.',
    harder: 'Step further back or use a stronger band.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(335, 'standing-row'),
  },
  {
    id: 'shoulder-press',
    name: 'Standing shoulder press',
    category: 'strength',
    muscles: 'Shoulders, back of the arms',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 3,
    reps: 10,
    steps: [
      'Stand holding dumbbells at shoulder height, palms facing forward.',
      'Tighten your stomach.',
      'Press the weights up until your arms are straight overhead.',
      'Lower them back to your shoulders slowly.',
    ],
    safety: ['Do not arch your lower back to get the weight up.', 'Breathe out as you press.'],
    mistakes: ['Leaning back.', 'Locking the elbows hard at the top.'],
    easier: 'Sit on a chair with a back, and use lighter weights.',
    harder: 'Press one arm at a time.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(71, 'standing-shoulder-press'),
  },
  {
    id: 'biceps-curl',
    name: 'Biceps curl',
    category: 'strength',
    muscles: 'Biceps',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Stand holding dumbbells at your sides, palms facing forward.',
      'Keep your elbows close to your body.',
      'Bend your elbows to bring the weights toward your shoulders.',
      'Lower them slowly.',
    ],
    safety: ['Move only at the elbow; keep the back still.'],
    mistakes: ['Swinging the body to lift the weight.'],
    easier: 'Sit on a chair, or use a band under your feet.',
    harder: 'Slow the lowering to three seconds.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(70, 'bicep-curl'),
  },
  {
    id: 'seated-biceps-curl',
    name: 'Seated biceps curl',
    category: 'strength',
    muscles: 'Biceps',
    equipment: ['chair', 'dumbbells'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Sit tall at the front of a chair, feet flat.',
      'Hold light dumbbells or filled water bottles, arms by your sides.',
      'Bend your elbows to bring the weights up.',
      'Lower them slowly.',
    ],
    safety: ['Start light; a can of beans is a fine first weight.'],
    mistakes: ['Leaning back to lift.'],
    easier: 'Use no weight and curl with a clenched fist.',
    harder: 'Stand and use heavier weights.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(44, 'seated-biceps-curl'),
  },
  {
    id: 'triceps-extension',
    name: 'Overhead triceps extension',
    category: 'strength',
    muscles: 'Back of the arms',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Hold one dumbbell with both hands above your head.',
      'Keep your upper arms close to your ears.',
      'Bend your elbows to lower the weight behind your head.',
      'Straighten your arms to lift it again.',
    ],
    safety: ['Start light; the weight passes behind your head.', 'Keep your stomach tight so your back does not arch.'],
    mistakes: ['Elbows flaring wide.'],
    easier: 'Do it sitting in a chair with a back.',
    harder: 'Use a heavier weight.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(74, 'triceps-extension'),
  },
  {
    id: 'lateral-raise',
    name: 'Lateral raise',
    category: 'strength',
    muscles: 'Shoulders',
    equipment: ['dumbbells'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Stand holding light dumbbells at your sides, elbows slightly bent.',
      'Raise your arms out to the sides to shoulder height.',
      'Pause.',
      'Lower slowly.',
    ],
    safety: ['Stop at shoulder height.', 'Keep the weights light; this is a small muscle.'],
    mistakes: ['Shrugging.', 'Swinging the weights up.'],
    easier: 'Raise one arm at a time, or use no weight.',
    harder: 'Hold at the top for two seconds.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(26, 'lateral-raise'),
  },
  {
    id: 'reverse-fly',
    name: 'Reverse fly',
    category: 'strength',
    muscles: 'Back of the shoulders, upper back',
    equipment: ['dumbbells', 'band'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Hinge forward with a flat back, light dumbbells hanging below your chest.',
      'With elbows slightly bent, raise your arms out to the sides.',
      'Squeeze your shoulder blades together at the top.',
      'Lower slowly.',
    ],
    safety: ['Keep your neck in line with your back.'],
    mistakes: ['Using weights too heavy to lift without swinging.'],
    easier: 'Pull a band apart in front of your chest while standing tall.',
    harder: 'Pause at the top for two seconds.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(353, 'reverse-fly'),
  },
  {
    id: 'chest-press',
    name: 'Dumbbell chest press',
    category: 'strength',
    muscles: 'Chest, shoulders, back of the arms',
    equipment: ['dumbbells', 'mat'],
    measure: 'reps',
    sets: 3,
    reps: 10,
    steps: [
      'Lie on your back on a bench or the floor, knees bent, a dumbbell in each hand.',
      'Hold the weights beside your chest.',
      'Press them up until your arms are straight above your chest.',
      'Lower them slowly.',
    ],
    safety: ['Breathe out as you press; do not hold your breath.', 'On the floor, your elbows stop you going too deep.'],
    mistakes: ['Arching the back off the bench.', 'Letting the weights drift apart.'],
    easier: 'Use lighter weights or a band behind your back.',
    harder: 'Press one arm at a time.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(19, 'chest-press'),
  },
  {
    id: 'chin-up',
    name: 'Chin-up',
    category: 'strength',
    muscles: 'Back, biceps',
    equipment: ['bar'],
    measure: 'reps',
    sets: 3,
    reps: 5,
    steps: [
      'Hang from a bar with your palms facing you, hands shoulder width apart.',
      'Draw your shoulders down away from your ears.',
      'Pull until your chin is over the bar.',
      'Lower all the way with control.',
    ],
    safety: ['Check the bar is secure before hanging from it.', 'Breathe out as you pull.'],
    mistakes: ['Kicking the legs to get up.', 'Dropping fast on the way down.'],
    easier: 'Stand on a chair and lower yourself slowly from the top.',
    harder: 'Add a pause with your chin over the bar.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['strain'],
    demo: ace(190, 'chin-ups'),
  },
  {
    id: 'farmers-carry',
    name: "Farmer's carry",
    category: 'strength',
    muscles: 'Grip, shoulders, core, legs',
    equipment: ['dumbbells', 'kettlebell'],
    measure: 'time',
    sets: 3,
    seconds: 30,
    steps: [
      'Stand between two weights and pick them up with a flat back.',
      'Stand tall, shoulders down and back.',
      'Walk with short, steady steps.',
      'Set the weights down with the same flat back.',
    ],
    safety: ['Lift and lower the weights by bending your knees and hips.', 'Clear the path before you start.'],
    mistakes: ['Leaning to one side.', 'Shrugging the shoulders up.'],
    easier: 'Use lighter weights, or shopping bags.',
    harder: 'Carry one weight in one hand (suitcase carry).',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet', 'strain'],
    demo: ace(359, 'farmer-s-carry'),
  },
  // Kettlebell
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell swing',
    category: 'strength',
    muscles: 'Glutes, back of the thighs, core',
    equipment: ['kettlebell'],
    measure: 'reps',
    sets: 3,
    reps: 12,
    steps: [
      'Stand with feet a little wider than your hips, a kettlebell in front of you.',
      'Hinge at the hips and hike the bell back between your legs.',
      'Snap your hips forward to swing it to chest height; the arms only guide it.',
      'Let it fall back between your legs and hinge again.',
    ],
    safety: [
      'Learn the hip hinge first; the power comes from the hips, not the arms or back.',
      'Clear the space in front and behind you.',
    ],
    mistakes: ['Squatting instead of hinging.', 'Lifting the bell with the arms.'],
    easier: 'Do the Romanian deadlift with the kettlebell, no swing.',
    harder: 'Swing with one hand.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['strain', 'vigorous', 'onFeet'],
    demo: ace(391, 'swing'),
  },
  {
    id: 'turkish-get-up',
    name: 'Turkish get-up',
    category: 'strength',
    muscles: 'Shoulders, core, hips, legs',
    equipment: ['kettlebell', 'mat'],
    measure: 'reps',
    sets: 2,
    reps: 3,
    perSide: true,
    steps: [
      'Lie on your back holding a light kettlebell straight up in one hand, that knee bent.',
      'Roll on to the opposite elbow, then the hand, keeping the bell over your shoulder.',
      'Lift your hips, sweep the straight leg under you to a kneel, and stand up.',
      'Reverse each step to lie back down.',
    ],
    safety: ['Learn it with no weight, or a shoe balanced on your fist.', 'Keep your eyes on the bell throughout.'],
    mistakes: ['Rushing the steps.', 'Letting the arm holding the bell bend.'],
    easier: 'Do only the first part, to the elbow (half get-up).',
    harder: 'Use a heavier bell.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(388, 'turkish-get-up'),
  },
  // Core
  {
    id: 'front-plank',
    name: 'Plank',
    category: 'core',
    muscles: 'Core, shoulders',
    equipment: ['mat'],
    measure: 'time',
    sets: 3,
    seconds: 20,
    steps: [
      'Rest on your forearms with elbows under your shoulders.',
      'Step your feet back so your body is straight from head to heels.',
      'Tighten your stomach and buttocks.',
      'Hold, breathing steadily.',
    ],
    safety: ['Keep breathing through the hold.', 'Come down when your hips start to sag.'],
    mistakes: ['Hips too high or sagging.', 'Holding the breath.'],
    easier: 'Hold it from your knees.',
    harder: 'Lift one foot a little way off the floor.',
    gentle: false,
    intensity: 'moderate',
    tags: ['strain'],
    demo: ace(32, 'front-plank'),
  },
  {
    id: 'side-plank-modified',
    name: 'Side plank from the knees',
    category: 'core',
    muscles: 'Sides of the waist, shoulders',
    equipment: ['mat'],
    measure: 'time',
    sets: 2,
    seconds: 15,
    perSide: true,
    steps: [
      'Lie on your side on one forearm, elbow under your shoulder, knees bent.',
      'Lift your hips so your body is straight from head to knees.',
      'Hold, breathing steadily.',
      'Lower and change sides.',
    ],
    safety: ['Keep the shoulder away from your ear.'],
    mistakes: ['Letting the hips drop back.'],
    easier: 'Hold for less time.',
    harder: 'Straighten the legs and hold from your feet.',
    gentle: false,
    intensity: 'moderate',
    tags: [],
    demo: ace(99, 'side-plank-modified'),
  },
  {
    id: 'bird-dog',
    name: 'Bird dog',
    category: 'core',
    muscles: 'Core, lower back, glutes',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Kneel on all fours, hands under shoulders and knees under hips.',
      'Reach one arm forward and the opposite leg back, level with your body.',
      'Hold for two seconds without letting the hips tip.',
      'Return and change sides.',
    ],
    safety: ['Move slowly and keep the middle still.'],
    mistakes: ['Lifting the leg too high and arching the back.'],
    easier: 'Lift only the arm, or only the leg.',
    harder: 'Hold each reach for five seconds.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(14, 'bird-dog'),
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    category: 'core',
    muscles: 'Deep stomach muscles',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Lie on your back, arms pointing to the ceiling, knees bent over your hips.',
      'Press your lower back gently into the floor.',
      'Lower one arm behind you and the opposite leg toward the floor.',
      'Bring them back and change sides.',
    ],
    safety: ['Keep your lower back on the floor; go only as far as you can do that.'],
    mistakes: ['Rushing.', 'The back arching as the leg lowers.'],
    easier: 'Move only the legs, with heels tapping the floor.',
    harder: 'Straighten the leg fully as it lowers.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(147, 'supine-dead-bug'),
  },
  {
    id: 'pelvic-tilt',
    name: 'Pelvic tilt',
    category: 'core',
    muscles: 'Deep stomach muscles, lower back',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Lie on your back with knees bent and feet flat.',
      'Tighten your stomach to flatten your lower back into the floor.',
      'Hold for a few seconds.',
      'Relax back to the start.',
    ],
    safety: ['A small movement is all it takes.'],
    mistakes: ['Pushing with the feet or lifting the hips.'],
    easier: 'Do it standing with your back against a wall.',
    harder: 'Hold for ten seconds each time.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(7, 'supine-pelvic-tilts'),
  },
  {
    id: 'crunch',
    name: 'Crunch',
    category: 'core',
    muscles: 'Stomach',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 12,
    steps: [
      'Lie on your back, knees bent, fingertips lightly behind your ears.',
      'Tighten your stomach.',
      'Curl your head and shoulders off the floor.',
      'Lower slowly.',
    ],
    safety: ['Do not pull on your neck; the hands only support it.'],
    mistakes: ['Yanking the head forward.', 'Coming up too far.'],
    easier: 'Cross your arms over your chest.',
    harder: 'Hold at the top for two seconds.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(52, 'crunch'),
  },
  {
    id: 'reverse-crunch',
    name: 'Reverse crunch',
    category: 'core',
    muscles: 'Lower stomach',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Lie on your back, knees bent over your hips, arms by your sides.',
      'Tighten your stomach and curl your hips a little off the floor.',
      'Lower them slowly.',
    ],
    safety: ['Use your stomach, not a swing of the legs.'],
    mistakes: ['Rocking to get the hips up.'],
    easier: 'Make the lift smaller.',
    harder: 'Straighten the legs a little more.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(76, 'reverse-crunch'),
  },
  {
    id: 'russian-twist',
    name: 'Russian twist',
    category: 'core',
    muscles: 'Sides of the waist',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    perSide: true,
    steps: [
      'Sit with knees bent and heels on the floor, leaning back a little with a straight back.',
      'Hold your hands together in front of your chest.',
      'Turn your upper body to one side, then the other.',
    ],
    safety: ['Keep the back straight; turn from the ribs.', 'Skip it if twisting while leaning back hurts your back.'],
    mistakes: ['Rounding the back.', 'Only moving the arms.'],
    easier: 'Sit more upright.',
    harder: 'Hold a light weight, or lift your feet.',
    gentle: false,
    intensity: 'moderate',
    tags: [],
    demo: ace(65, 'russian-twist'),
  },
  {
    id: 'superman',
    name: 'Superman',
    category: 'core',
    muscles: 'Lower back, glutes, upper back',
    equipment: ['mat'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    steps: [
      'Lie face down with arms stretched forward.',
      'Lift your arms, chest and legs a little way off the floor.',
      'Hold for two seconds, looking at the floor.',
      'Lower slowly.',
    ],
    safety: ['Keep the lift small; it is not a backbend.'],
    mistakes: ['Craning the neck up.'],
    easier: 'Lift only the arms, or only the legs.',
    harder: 'Hold each lift for five seconds.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(9, 'supermans'),
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain climbers',
    category: 'cardio',
    muscles: 'Core, shoulders, legs',
    equipment: ['none'],
    measure: 'time',
    sets: 3,
    seconds: 30,
    steps: [
      'Start in a high plank, hands under your shoulders.',
      'Drive one knee toward your chest.',
      'Switch legs, stepping or hopping.',
      'Keep going at a steady pace.',
    ],
    safety: ['Keep your hands under your shoulders.', 'Step rather than hop to keep it low impact.'],
    mistakes: ['Hips bouncing high.'],
    easier: 'Put your hands on a bench and step each foot in slowly.',
    harder: 'Speed it up.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['vigorous'],
    demo: ace(258, 'mountain-climbers'),
  },
  // Cardio
  {
    id: 'walking',
    name: 'Walking',
    category: 'cardio',
    muscles: 'Legs, heart and lungs',
    equipment: ['none'],
    measure: 'time',
    sets: 1,
    seconds: 20 * 60,
    steps: [
      'Start at an easy pace for the first few minutes.',
      'Pick it up to a brisk pace, where you can talk but not sing.',
      'Swing your arms and stand tall.',
      'Slow down for the last few minutes.',
    ],
    safety: ['Wear shoes with support and good grip.', 'Carry water on longer walks.'],
    mistakes: ['Starting too fast.', 'Looking down at the feet all the way.'],
    easier: 'Walk for less time, or split it into two shorter walks.',
    harder: 'Walk faster, or choose a route with hills.',
    gentle: true,
    intensity: 'moderate',
    tags: ['onFeet', 'outdoor'],
    demo: NHS_WALKING,
  },
  {
    id: 'cycling',
    name: 'Cycling',
    category: 'cardio',
    muscles: 'Legs, heart and lungs',
    equipment: ['bike'],
    measure: 'time',
    sets: 1,
    seconds: 30 * 60,
    steps: [
      'Set the saddle so your leg is nearly straight at the bottom of the pedal stroke.',
      'Pedal easily for the first five minutes.',
      'Ride at a pace where you breathe harder but can still talk.',
      'Pedal easily for the last five minutes.',
    ],
    safety: ['Wear a helmet outdoors.', 'A stationary bike takes traffic and weather out of it.'],
    mistakes: ['Saddle too low, straining the knees.'],
    easier: 'Ride a flat route, or use a stationary bike on low resistance.',
    harder: 'Add hills or short faster stretches.',
    gentle: false,
    intensity: 'moderate',
    tags: ['outdoor'],
    demo: NHS_GUIDELINES,
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'cardio',
    muscles: 'Whole body, heart and lungs',
    equipment: ['pool'],
    measure: 'time',
    sets: 1,
    seconds: 20 * 60,
    steps: [
      'Start with a few easy lengths.',
      'Swim at a steady pace, resting at the wall when you need to.',
      'Mix strokes if one tires a joint.',
      'Finish with a couple of easy lengths.',
    ],
    safety: ['Swim where there is a lifeguard.', 'Drink water; you still sweat in a pool.'],
    mistakes: ['Holding the breath instead of breathing out under water.'],
    easier: 'Walk lengths in the shallow end, or use a float.',
    harder: 'Swim longer without resting.',
    gentle: true,
    intensity: 'moderate',
    tags: ['outdoor'],
    demo: SWIM_ENGLAND,
  },
  {
    id: 'warm-up-march',
    name: 'Warm-up march',
    category: 'cardio',
    muscles: 'Legs, heart and lungs',
    equipment: ['none'],
    measure: 'time',
    sets: 1,
    seconds: 5 * 60,
    steps: [
      'March on the spot, lifting your knees a little.',
      'Swing your arms in time.',
      'Gradually lift the knees higher and swing wider.',
      'Finish with a few shoulder rolls.',
    ],
    safety: ['Hold a chair back if you need to.'],
    mistakes: ['Skipping it before harder work.'],
    easier: 'March sitting in a chair.',
    harder: 'Add heel digs and side steps.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_WARM_UP,
  },
  {
    id: 'squat-jump',
    name: 'Squat jump',
    category: 'cardio',
    muscles: 'Thighs, glutes, calves',
    equipment: ['none'],
    measure: 'reps',
    sets: 3,
    reps: 8,
    steps: [
      'Stand with your feet hip width apart.',
      'Squat down, arms swinging back.',
      'Jump straight up, swinging your arms forward.',
      'Land softly through the balls of your feet into the next squat.',
    ],
    safety: ['Land quietly with soft knees.', 'Jump on a surface with some give, not concrete.'],
    mistakes: ['Landing with straight legs.', 'Knees caving in on landing.'],
    easier: 'Squat and rise on to your toes without leaving the floor.',
    harder: 'Jump higher, or add more rounds.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['impact', 'vigorous', 'onFeet'],
    demo: ace(116, 'squat-jumps'),
  },
  {
    id: 'burpee',
    name: 'Burpee',
    category: 'cardio',
    muscles: 'Whole body',
    equipment: ['none'],
    measure: 'reps',
    sets: 3,
    reps: 6,
    steps: [
      'Squat and place your hands on the floor.',
      'Jump or step your feet back to a plank.',
      'Jump or step your feet back in.',
      'Stand up, or jump with arms overhead.',
    ],
    safety: ['Step instead of jumping for less impact.', 'Keep the hips level in the plank.'],
    mistakes: ['Sagging hips in the plank.', 'Landing hard.'],
    easier: 'Put your hands on a bench and step each foot back.',
    harder: 'Add a push-up at the bottom.',
    gentle: false,
    intensity: 'vigorous',
    tags: ['impact', 'vigorous'],
    demo: ace(306, 'burpee'),
  },
  // Stretching
  {
    id: 'cat-cow',
    name: 'Cat-cow',
    category: 'mobility',
    muscles: 'Spine',
    equipment: ['mat'],
    measure: 'reps',
    sets: 1,
    reps: 8,
    steps: [
      'Kneel on all fours.',
      'Breathe in as you let your stomach drop and lift your chest and tailbone.',
      'Breathe out as you round your back up toward the ceiling, tucking your chin.',
      'Move slowly between the two.',
    ],
    safety: ['Move within a comfortable range.'],
    mistakes: ['Moving fast.'],
    easier: 'Do it seated, rounding and arching the back with hands on your knees.',
    harder: 'Hold each end for a breath.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(15, 'cat-cow'),
  },
  {
    id: 'childs-pose',
    name: "Child's pose",
    category: 'stretch',
    muscles: 'Back, hips, shoulders',
    equipment: ['mat'],
    measure: 'time',
    sets: 1,
    seconds: 45,
    steps: [
      'Kneel, big toes together and knees apart.',
      'Sit your hips back toward your heels.',
      'Reach your arms forward and rest your forehead down.',
      'Breathe slowly.',
    ],
    safety: ['Put a cushion between hips and heels if your knees complain.'],
    mistakes: ['Forcing the hips down.'],
    easier: 'Rest your forehead on a cushion or stacked fists.',
    harder: 'Walk your hands to one side, then the other.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(227, 'childs-pose'),
  },
  {
    id: 'cobra',
    name: 'Cobra',
    category: 'stretch',
    muscles: 'Front of the body, lower back',
    equipment: ['mat'],
    measure: 'time',
    sets: 2,
    seconds: 20,
    steps: [
      'Lie face down with your hands under your shoulders.',
      'Press gently to lift your chest, keeping hips on the floor.',
      'Keep your elbows bent and shoulders down.',
      'Hold, then lower.',
    ],
    safety: ['Lift only as high as your lower back is comfortable.'],
    mistakes: ['Locking the arms straight.', 'Shoulders up by the ears.'],
    easier: 'Rest on your forearms (sphinx).',
    harder: 'Hold for longer.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(16, 'cobra'),
  },
  {
    id: 'downward-dog',
    name: 'Downward-facing dog',
    category: 'stretch',
    muscles: 'Back of the legs, shoulders, back',
    equipment: ['mat'],
    measure: 'time',
    sets: 2,
    seconds: 30,
    steps: [
      'Start on all fours, toes tucked under.',
      'Lift your hips up and back to make an upside-down V.',
      'Press your hands down and let your head hang.',
      'Bend your knees as much as you need to keep the back long.',
    ],
    safety: ['This puts weight on the wrists and your head below your heart.'],
    mistakes: ['Rounding the back to get the heels down.'],
    easier: 'Put your hands on a chair seat or a wall.',
    harder: 'Hold longer, pedalling the heels.',
    gentle: false,
    intensity: 'light',
    tags: [],
    demo: ace(18, 'downward-facing-dog'),
  },
  {
    id: 'hip-flexor-stretch',
    name: 'Kneeling hip flexor stretch',
    category: 'stretch',
    muscles: 'Front of the hips',
    equipment: ['mat'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    perSide: true,
    steps: [
      'Kneel on one knee with the other foot flat in front.',
      'Tuck your tailbone under slightly.',
      'Shift your weight forward until you feel a stretch at the front of the back hip.',
      'Hold, then change sides.',
    ],
    safety: ['Pad the kneeling knee.'],
    mistakes: ['Arching the lower back instead of tucking.'],
    easier: 'Do it standing, one foot on a step.',
    harder: 'Reach the arm on the kneeling side overhead.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(142, 'kneeling-hip-flexor-stretch'),
  },
  {
    id: 'hamstring-stretch',
    name: 'Lying hamstring stretch',
    category: 'stretch',
    muscles: 'Back of the thighs',
    equipment: ['mat', 'band'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    perSide: true,
    steps: [
      'Lie on your back, both knees bent.',
      'Loop a band or towel round one foot and straighten that leg toward the ceiling.',
      'Hold it where you feel a stretch in the back of the thigh.',
      'Change legs.',
    ],
    safety: ['Keep the other foot on the floor and your back flat.'],
    mistakes: ['Bouncing into the stretch.'],
    easier: 'Keep the lifted knee slightly bent.',
    harder: 'Straighten the other leg along the floor.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(235, 'supine-hamstrings-stretch'),
  },
  {
    id: 'calf-stretch',
    name: 'Standing calf stretch',
    category: 'stretch',
    muscles: 'Calves',
    equipment: ['wall'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    perSide: true,
    steps: [
      'Stand facing a wall, hands on it.',
      'Step one foot back and press that heel down.',
      'Bend the front knee until you feel the stretch in the back calf.',
      'Hold, then change sides.',
    ],
    safety: ['Keep both feet pointing forward.'],
    mistakes: ['Lifting the back heel.'],
    easier: 'Take a shorter step back.',
    harder: 'Bend the back knee a little to reach the lower calf.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(152, 'standing-dorsi-flexion-calf-stretch'),
  },
  {
    id: 'butterfly-stretch',
    name: 'Seated butterfly stretch',
    category: 'stretch',
    muscles: 'Inner thighs, hips',
    equipment: ['mat'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    steps: [
      'Sit tall with the soles of your feet together.',
      'Hold your ankles.',
      'Let your knees fall toward the floor.',
      'Lean forward from the hips, back straight, for more stretch.',
    ],
    safety: ['Never push the knees down with your hands.'],
    mistakes: ['Rounding the back to lean further.'],
    easier: 'Sit on a cushion, feet further from the body.',
    harder: 'Draw your feet closer in.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(216, 'seated-butterfly-stretch'),
  },
  {
    id: 'chest-stretch',
    name: 'Standing chest stretch',
    category: 'stretch',
    muscles: 'Chest, front of the shoulders',
    equipment: ['none'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    steps: [
      'Stand tall and clasp your hands behind your lower back.',
      'Draw your shoulders back and down.',
      'Lift your chest.',
      'Hold, breathing steadily.',
    ],
    safety: ['Keep it gentle in the front of the shoulders.'],
    mistakes: ['Arching the lower back.'],
    easier: 'Hold a towel between your hands if they do not meet.',
    harder: 'Place a forearm on a door frame and turn gently away.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(209, 'standing-chest-stretch'),
  },
  {
    id: 'triceps-stretch',
    name: 'Overhead triceps stretch',
    category: 'stretch',
    muscles: 'Back of the arms, shoulders',
    equipment: ['none'],
    measure: 'time',
    sets: 1,
    seconds: 20,
    perSide: true,
    steps: [
      'Reach one arm up and bend the elbow so the hand drops behind your head.',
      'Use the other hand to ease the elbow back.',
      'Hold, then change arms.',
    ],
    safety: ['Keep your head up; do not push it forward.'],
    mistakes: ['Pulling hard on the elbow.'],
    easier: 'Hold a towel over the shoulder instead.',
    harder: 'Hold for longer.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(174, 'overhead-triceps-stretch'),
  },
  {
    id: 'spinal-twist',
    name: 'Lying spinal twist',
    category: 'stretch',
    muscles: 'Back, sides of the waist',
    equipment: ['mat'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    perSide: true,
    steps: [
      'Lie on your back, knees bent and arms out wide.',
      'Let both knees lower to one side.',
      'Turn your head the other way if that is comfortable.',
      'Hold, then change sides.',
    ],
    safety: ['Let gravity do it; do not force the knees down.'],
    mistakes: ['Lifting the opposite shoulder off the floor.'],
    easier: 'Put a cushion under the knees.',
    harder: 'Straighten the top leg.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(229, 'supine-spinal-twist-with-rib-grab-and-progressions'),
  },
  {
    id: 'neck-stretch',
    name: 'Neck bend',
    category: 'mobility',
    muscles: 'Neck',
    equipment: ['none'],
    measure: 'reps',
    sets: 1,
    reps: 5,
    steps: [
      'Sit or stand tall, shoulders relaxed.',
      'Lower your chin slowly toward your chest.',
      'Bring it back up to level and look ahead.',
      'Repeat slowly.',
    ],
    safety: ['Move slowly and never roll the head back hard.'],
    mistakes: ['Moving quickly.'],
    easier: 'Make the movement smaller.',
    harder: 'Add a slow turn to each side.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(204, 'neck-flexion-and-extension'),
  },
  {
    id: 'ankle-flexion',
    name: 'Ankle pumps',
    category: 'mobility',
    muscles: 'Ankles, calves',
    equipment: ['chair'],
    measure: 'reps',
    sets: 1,
    reps: 15,
    steps: [
      'Sit with your legs out in front or one foot raised.',
      'Point your toes away.',
      'Pull them back toward you.',
      'Repeat, then circle the ankle each way.',
    ],
    safety: ['Move within a comfortable range.'],
    mistakes: ['Moving the whole leg instead of the ankle.'],
    easier: 'Do fewer.',
    harder: 'Loop a band round the foot for resistance.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(23, 'ankle-flexion'),
  },
  {
    id: 'warrior-one',
    name: 'Warrior I',
    category: 'stretch',
    muscles: 'Hips, legs, shoulders',
    equipment: ['mat'],
    measure: 'time',
    sets: 1,
    seconds: 30,
    perSide: true,
    steps: [
      'Step one foot back, turning it out a little, and bend the front knee.',
      'Face your hips forward.',
      'Reach your arms overhead.',
      'Hold, then change sides.',
    ],
    safety: ['Keep the front knee over the ankle.'],
    mistakes: ['Front knee travelling past the toes.'],
    easier: 'Shorten the stance and keep your hands on your hips.',
    harder: 'Bend the front knee deeper.',
    gentle: false,
    intensity: 'light',
    tags: ['onFeet'],
    demo: ace(228, 'warrior-i'),
  },
  // Balance
  {
    id: 'single-leg-stand',
    name: 'Single-leg stand',
    category: 'balance',
    muscles: 'Ankles, hips, core',
    equipment: ['chair'],
    measure: 'time',
    sets: 2,
    seconds: 20,
    perSide: true,
    steps: [
      'Stand beside a chair or counter, a hand on it.',
      'Lift one foot a little way off the floor.',
      'Stand tall and look at a spot ahead.',
      'Hold, then change sides.',
    ],
    safety: ['Keep something to hold within reach every time.'],
    mistakes: ['Locking the standing knee.'],
    easier: 'Keep your fingertips on the chair.',
    harder: 'Let go of the chair, or close your eyes with the chair beside you.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: ace(112, 'single-leg-stand'),
  },
  {
    id: 'heel-to-toe-walk',
    name: 'Heel-to-toe walk',
    category: 'balance',
    muscles: 'Ankles, legs, core',
    equipment: ['wall'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Stand beside a wall or along a counter.',
      'Put the heel of one foot right in front of the toes of the other.',
      'Step the back foot forward the same way.',
      'Look ahead, not down.',
    ],
    safety: ['Keep a hand near the wall.'],
    mistakes: ['Looking at the feet.'],
    easier: 'Leave a small gap between heel and toe.',
    harder: 'Walk without touching the wall.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_BALANCE,
  },
  {
    id: 'sideways-walk',
    name: 'Sideways walk',
    category: 'balance',
    muscles: 'Hips, legs',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    steps: [
      'Stand with feet together, knees slightly bent.',
      'Step sideways, then bring the other foot to meet it.',
      'Keep your hips level.',
      'Walk ten steps one way, then back.',
    ],
    safety: ['Clear the space first; stay near a counter.'],
    mistakes: ['Dragging the feet.'],
    easier: 'Take smaller steps holding the counter.',
    harder: 'Add a band above the knees.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_BALANCE,
  },
  {
    id: 'single-leg-rdl',
    name: 'Single-leg Romanian deadlift',
    category: 'balance',
    muscles: 'Back of the thighs, glutes, ankles',
    equipment: ['none'],
    measure: 'reps',
    sets: 2,
    reps: 8,
    perSide: true,
    steps: [
      'Stand on one foot, knee soft.',
      'Hinge forward while the free leg reaches straight back.',
      'Keep your hips level and back flat.',
      'Return to standing.',
    ],
    safety: ['Hold a chair with one hand until your balance is steady.'],
    mistakes: ['Opening the hip toward the ceiling.'],
    easier: 'Keep the back toe touching the floor.',
    harder: 'Hold a dumbbell in the opposite hand.',
    gentle: false,
    intensity: 'moderate',
    tags: ['onFeet'],
    demo: ace(329, 'single-leg-romanian-deadlift'),
  },
  // Chair
  {
    id: 'seated-marching',
    name: 'Seated hip marching',
    category: 'mobility',
    muscles: 'Hips, thighs',
    equipment: ['chair'],
    measure: 'reps',
    sets: 2,
    reps: 10,
    perSide: true,
    steps: [
      'Sit tall at the front of a chair, holding the sides.',
      'Lift one knee as far as is comfortable.',
      'Lower it with control.',
      'Change legs.',
    ],
    safety: ['Use a chair without wheels.'],
    mistakes: ['Leaning back to lift the knee.'],
    easier: 'Make the lift smaller.',
    harder: 'Hold each lift for a count of three.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_SITTING,
  },
  {
    id: 'seated-twist',
    name: 'Seated upper-body twist',
    category: 'mobility',
    muscles: 'Back, sides of the waist',
    equipment: ['chair'],
    measure: 'reps',
    sets: 1,
    reps: 5,
    perSide: true,
    steps: [
      'Sit tall with feet flat, arms crossed with hands on your shoulders.',
      'Turn your upper body to one side without moving your hips.',
      'Hold for a breath.',
      'Turn to the other side.',
    ],
    safety: ['Turn only as far as is comfortable.'],
    mistakes: ['Twisting the hips along with the ribs.'],
    easier: 'Make the turn smaller.',
    harder: 'Hold each side for five seconds.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_SITTING,
  },
  {
    id: 'seated-arm-raise',
    name: 'Seated arm raise',
    category: 'mobility',
    muscles: 'Shoulders',
    equipment: ['chair'],
    measure: 'reps',
    sets: 1,
    reps: 8,
    steps: [
      'Sit tall, arms by your sides.',
      'Raise both arms out and up as high as is comfortable.',
      'Lower slowly.',
      'Breathe in on the way up and out on the way down.',
    ],
    safety: ['Stop below any point where the shoulder pinches.'],
    mistakes: ['Shrugging the shoulders up.'],
    easier: 'Raise one arm at a time.',
    harder: 'Hold a light weight.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_SITTING,
  },
  {
    id: 'full-body-stretch',
    name: 'Whole-body stretch routine',
    category: 'stretch',
    muscles: 'Whole body',
    equipment: ['none'],
    measure: 'time',
    sets: 1,
    seconds: 5 * 60,
    steps: [
      'Hold each stretch for about 30 seconds, breathing steadily.',
      'Work from the neck down: neck, shoulders, chest, back, hips, thighs, calves.',
      'Stretch to mild tension, never pain.',
      'Do it after exercise, when the muscles are warm.',
    ],
    safety: ['Do not bounce in a stretch.'],
    mistakes: ['Holding the breath.'],
    easier: 'Do the stretches sitting down.',
    harder: 'Hold each stretch for a full minute.',
    gentle: true,
    intensity: 'light',
    tags: [],
    demo: NHS_FLEXIBILITY,
  },
];

export function findLibraryExercise(id: string): LibraryExercise | null {
  return LIBRARY_EXERCISES.find((exercise) => exercise.id === id) ?? null;
}

// Condition notes. Each one names who it is for, which exercises it fits,
// what it says and where that comes from. The condition names are written
// out here so this module needs nothing from the database.

export type ConditionNoteSource = { label: string; url: string };

export type ConditionNote = {
  id: string;
  conditions: string[];
  /** Fits an exercise carrying any of these tags. */
  tags: ExerciseTag[];
  text: string;
  source: ConditionNoteSource;
};

const PUBMED = 'https://pubmed.ncbi.nlm.nih.gov/';

export const CONDITION_NAMES: Record<string, string> = {
  cardiovascular_disease: 'heart disease',
  rheumatoid_arthritis: 'rheumatoid arthritis',
  psoriasis: 'psoriasis',
  lupus: 'lupus',
  gout: 'gout',
  multiple_sclerosis: 'MS',
  migraine: 'migraine',
  type_1_diabetes: 'type 1 diabetes',
  type_2_diabetes: 'type 2 diabetes',
};

export const CONDITION_NOTES: ConditionNote[] = [
  {
    id: 'strain-heart',
    conditions: ['cardiovascular_disease'],
    tags: ['strain'],
    text:
      'The American Heart Association statement on resistance exercise and heart disease supports strength work for most people, with a check from your care team first. It advises breathing out on the effort rather than holding your breath, and a weight you can lift 10 to 15 times.',
    source: { label: 'Williams MA et al., Circulation 2007;116:572-584', url: `${PUBMED}17638929/` },
  },
  {
    id: 'impact-arthritis',
    conditions: ['rheumatoid_arthritis', 'psoriasis'],
    tags: ['impact', 'onFeet'],
    text:
      'The 2018 EULAR recommendations for people with inflammatory arthritis, psoriatic arthritis included, support regular activity including strength work, adapted to how the joints are on the day. The easier version below takes load off the joints.',
    source: { label: 'Rausch Osthoff AK et al., Ann Rheum Dis 2018;77:1251-1260', url: `${PUBMED}29997112/` },
  },
  {
    id: 'gout-attack',
    conditions: ['gout'],
    tags: ['impact', 'onFeet'],
    text:
      'The NHS advises resting and raising a joint during a gout attack, and regular exercise between attacks as part of looking after gout. This one puts weight on the feet.',
    source: { label: 'NHS: Gout', url: 'https://www.nhs.uk/conditions/gout/' },
  },
  {
    id: 'heat-ms',
    conditions: ['multiple_sclerosis'],
    tags: ['vigorous', 'impact'],
    text:
      'A rise in body heat can bring MS symptoms up for a while, and they settle as the body cools (Uhthoff phenomenon). A cool room, a fan, cold water and shorter bouts are the usual ways around it.',
    source: { label: 'Davis SL et al., J Appl Physiol 2010;109:1531-1537', url: `${PUBMED}20671034/` },
  },
  {
    id: 'sun-lupus',
    conditions: ['lupus'],
    tags: ['outdoor'],
    text:
      'Sunlight can bring on lupus symptoms for many people. The Lupus Foundation of America suggests covering up, sunscreen, and avoiding the strongest sun of the middle of the day.',
    source: { label: 'Lupus Foundation of America: Sun safety', url: 'https://www.lupus.org/resources/sun-safety-with-lupus' },
  },
  {
    id: 'vigorous-migraine',
    conditions: ['migraine'],
    tags: ['vigorous'],
    text:
      'In one study of people with migraine, over a third reported attacks brought on by exercise, most often by hard effort. Warming up gradually and building the effort slowly is one way to see whether that applies to you.',
    source: { label: 'Koppen H et al., J Headache Pain 2013;14:99', url: `${PUBMED}24359317/` },
  },
];

/** A note about a whole session rather than one exercise. */
export const SESSION_NOTES: ConditionNote[] = [
  {
    id: 'glucose-session',
    conditions: ['type_1_diabetes', 'type_2_diabetes'],
    tags: [],
    text:
      'Exercise moves blood glucose, sometimes for hours afterward. The American Diabetes Association position statement suggests checking glucose before, during longer sessions and after, keeping fast-acting carbohydrate within reach, and planning insulin or glucose-lowering medicine around exercise with your care team.',
    source: { label: 'Colberg SR et al., Diabetes Care 2016;39:2065-2079', url: `${PUBMED}27926890/` },
  },
  {
    id: 'glucose-type1',
    conditions: ['type_1_diabetes'],
    tags: [],
    text:
      'The 2017 international consensus on exercise in type 1 diabetes sets out glucose ranges for starting, pausing and carbohydrate top-ups, and says the plan is worked out with your diabetes team.',
    source: { label: 'Riddell MC et al., Lancet Diabetes Endocrinol 2017;5:377-390', url: `${PUBMED}28126459/` },
  },
];

/** How much, from the World Health Organization, shown with the library. */
export const ACTIVITY_GUIDELINE = {
  text:
    'The World Health Organization suggests adults aim for 150 to 300 minutes of moderate activity a week, or 75 to 150 of vigorous, plus muscle-strengthening on two or more days. It also says any amount counts.',
  source: { label: 'Bull FC et al., Br J Sports Med 2020;54:1451-1462', url: `${PUBMED}33239350/` },
};

export const GENTLE_FILTER_LABEL = 'Gentle on a flare day';
export const GENTLE_FILTER_HELP =
  'Marks exercises low in load and impact that can be done lying down, sitting, or holding on to something. It helps find them; it is not a rule, and how a flare day goes is yours to judge.';

export type NoteForPerson = { condition: string; text: string; source: ConditionNoteSource };

function conditionList(codes: string[]): string {
  const names = codes.map((code) => CONDITION_NAMES[code] ?? code);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The notes that fit one exercise, only for conditions the person tracks. */
export function exerciseNotesFor(tags: readonly ExerciseTag[], tracked: readonly string[]): NoteForPerson[] {
  const out: NoteForPerson[] = [];
  for (const note of CONDITION_NOTES) {
    const mine = note.conditions.filter((code) => tracked.includes(code));
    if (mine.length === 0) continue;
    if (!note.tags.some((tag) => tags.includes(tag))) continue;
    out.push({ condition: conditionList(mine), text: note.text, source: note.source });
  }
  return out;
}

/** The notes about a whole session, only for conditions the person tracks. */
export function sessionNotesFor(tracked: readonly string[]): NoteForPerson[] {
  return SESSION_NOTES.filter((note) => note.conditions.some((code) => tracked.includes(code))).map((note) => ({
    condition: conditionList(note.conditions.filter((code) => tracked.includes(code))),
    text: note.text,
    source: note.source,
  }));
}

export function noteHeading(note: NoteForPerson): string {
  return `Because you track ${note.condition}`;
}

// Amounts.

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const minuteWord = minutes === 1 ? '1 minute' : `${minutes} minutes`;
  return rest === 0 ? minuteWord : `${minuteWord} ${rest} seconds`;
}

export type Amount = {
  measure: ExerciseMeasure;
  sets: number;
  reps: number | null;
  seconds: number | null;
  perSide: boolean;
  weight?: number | null;
  weightUnit?: string | null;
  restSeconds?: number | null;
};

/** "3 sets of 10 each side, 8 kg, 60 seconds rest". */
export function describeAmount(amount: Amount): string {
  const each = amount.measure === 'reps' ? `${amount.reps ?? 0}` : formatSeconds(amount.seconds ?? 0);
  const side = amount.perSide ? ' each side' : '';
  const body = amount.sets <= 1 ? `${each}${side}` : `${amount.sets} sets of ${each}${side}`;
  const parts = [amount.measure === 'reps' && amount.sets <= 1 ? `${body} times` : body];
  if (amount.weight != null && amount.weight > 0) parts.push(`${amount.weight} ${amount.weightUnit || 'kg'}`);
  if (amount.restSeconds != null && amount.restSeconds > 0 && amount.sets > 1) parts.push(`${formatSeconds(amount.restSeconds)} rest`);
  return parts.join(', ');
}

/** The default amount a library exercise starts with in a workout. */
export function defaultAmount(exercise: LibraryExercise): Amount {
  return {
    measure: exercise.measure,
    sets: exercise.sets,
    reps: exercise.reps ?? null,
    seconds: exercise.seconds ?? null,
    perSide: exercise.perSide === true,
    weight: null,
    weightUnit: null,
    restSeconds: exercise.sets > 1 ? 60 : null,
  };
}

// Search and filter, over library and custom exercises alike.

export type Searchable = {
  name: string;
  category: ExerciseCategory;
  muscles: string;
  equipment: Equipment[];
  gentle: boolean;
};

export type ExerciseFilter = {
  query: string;
  category: ExerciseCategory | 'all';
  equipment: Equipment | 'all';
  gentleOnly: boolean;
};

export const NO_FILTER: ExerciseFilter = { query: '', category: 'all', equipment: 'all', gentleOnly: false };

export function matchesFilter(exercise: Searchable, filter: ExerciseFilter): boolean {
  if (filter.category !== 'all' && exercise.category !== filter.category) return false;
  if (filter.equipment !== 'all' && !exercise.equipment.includes(filter.equipment)) return false;
  if (filter.gentleOnly && !exercise.gentle) return false;
  const words = filter.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${exercise.name} ${exercise.muscles} ${exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' ')}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function categoryLabel(category: ExerciseCategory): string {
  return EXERCISE_CATEGORIES.find((entry) => entry.key === category)?.label ?? category;
}

export function equipmentLine(equipment: readonly Equipment[]): string {
  if (equipment.length === 0 || (equipment.length === 1 && equipment[0] === 'none')) return 'No equipment';
  return equipment.filter((e) => e !== 'none').map((e) => EQUIPMENT_LABELS[e]).join(' or ');
}
