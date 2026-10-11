// Every icon the TabHub button can wear, in the groups both pickers show:
// Profile > Appearance > TabHub Icon, and the card a long press on the button
// itself opens (components/TabHubIconPicker.tsx, 1.0.66.17). One list, so the
// two can never offer different icons or call one by two names.
//
// The lists themselves moved here from app/profile.tsx, where their history is
// told: the insects on 2026-08-12, the animals and the three-way split on
// 2026-08-14, the app icon group on 2026-08-19, the seed removed on 2026-10-06.
// Conditions take their names from DIGEST_CATEGORY_META, the names the
// Conditions lens on Life shows, since this list is read on screens that have
// no reason to wait on the conditions table.
import { TAB_HUB_ICON_SOURCES } from '../constants/tabHubIcons';
import { CONDITION_CODE_TO_DIGEST_KEY } from './conditionCodeMap';
import { DIGEST_CATEGORY_META } from './digest';
import { getVisualPreferences, setVisualPreferences, type TabHubIconChoice } from './visualPreferences';

export type TabHubIconOption = { key: TabHubIconChoice; label: string };
export type TabHubIconGroupKey = 'tabHubAppIcon' | 'tabHubAnimals' | 'tabHubConditions' | 'tabHubInsects';
export type TabHubIconGroup = { key: TabHubIconGroupKey; title: string; options: TabHubIconOption[] };

const byLabel = (a: TabHubIconOption, b: TabHubIconOption) => a.label.localeCompare(b.label);

// One app icon. Direct instruction, 2026-10-10: "There should only be one
// default app icon."
const APP_ICON_OPTIONS: TabHubIconOption[] = [{ key: 'insideStory', label: 'Lifestead' }];

const ANIMAL_ICON_OPTIONS = ([
  { key: 'badger', label: 'Badger' },
  { key: 'bear', label: 'Bear' },
  { key: 'beaver', label: 'Beaver' },
  { key: 'bengalCat', label: 'Bengal Cat' },
  { key: 'bison', label: 'Bison' },
  { key: 'blackCat', label: 'Black Cat' },
  { key: 'borderCollie', label: 'Border Collie' },
  { key: 'canadaGoose', label: 'Canada Goose' },
  { key: 'cavalierKingCharlesSpaniel', label: 'Cavalier King Charles Spaniel' },
  { key: 'chipmunk', label: 'Chipmunk' },
  { key: 'cow', label: 'Cow' },
  { key: 'deer', label: 'Deer' },
  { key: 'donkey', label: 'Donkey' },
  { key: 'elephant', label: 'Elephant' },
  { key: 'frenchBulldog', label: 'French Bulldog' },
  { key: 'germanShepherd', label: 'German Shepherd' },
  { key: 'goat', label: 'Goat' },
  { key: 'goldenRetriever', label: 'Golden Retriever' },
  { key: 'grayTabbyCat', label: 'Gray Tabby Cat' },
  { key: 'horse', label: 'Horse' },
  { key: 'iguana', label: 'Iguana' },
  { key: 'labradorRetriever', label: 'Labrador Retriever' },
  { key: 'lion', label: 'Lion' },
  { key: 'maineCoon', label: 'Maine Coon' },
  { key: 'mallardDuck', label: 'Mallard Duck' },
  { key: 'orangeTabbyCat', label: 'Orange Tabby Cat' },
  { key: 'persianCat', label: 'Persian Cat' },
  { key: 'pig', label: 'Pig' },
  { key: 'rabbit', label: 'Rabbit' },
  { key: 'ragdollCat', label: 'Ragdoll Cat' },
  { key: 'rhino', label: 'Rhino' },
  { key: 'russianBlueCat', label: 'Russian Blue Cat' },
  { key: 'sheep', label: 'Sheep' },
  { key: 'siameseCat', label: 'Siamese Cat' },
  { key: 'sphynxCat', label: 'Sphynx Cat' },
  { key: 'squirrel', label: 'Squirrel' },
  { key: 'tiger', label: 'Tiger' },
  { key: 'wolf', label: 'Wolf' },
] as TabHubIconOption[]).sort(byLabel);

const INSECT_ICON_OPTIONS = ([
  { key: 'honeybee', label: 'Honeybee' },
  { key: 'bumblebee', label: 'Bumblebee' },
  { key: 'dragonfly', label: 'Dragonfly' },
  { key: 'hummingbird', label: 'Hummingbird' },
  { key: 'treeFrog', label: 'Tree Frog' },
  { key: 'monarchButterfly', label: 'Monarch Butterfly' },
  { key: 'ladybug', label: 'Ladybug' },
  { key: 'prayingMantis', label: 'Praying Mantis' },
] as TabHubIconOption[]).sort(byLabel);

// The plain butterfly keeps its 'default' key and stands for both thyroid
// conditions, beside one icon per tracked condition.
const CONDITION_KEYS = new Set<string>(Object.values(CONDITION_CODE_TO_DIGEST_KEY));
const CONDITION_ICON_OPTIONS = ([
  { key: 'default', label: "Graves' / Hashimoto's" },
  ...DIGEST_CATEGORY_META.filter((meta) => CONDITION_KEYS.has(meta.key) && TAB_HUB_ICON_SOURCES[meta.key]).map(
    (meta) => ({ key: meta.key as TabHubIconChoice, label: meta.label }),
  ),
] as TabHubIconOption[]).sort(byLabel);

// App Icon first, then the rest alphabetically (1.0.63.16).
export const TAB_HUB_ICON_GROUPS: TabHubIconGroup[] = [
  { key: 'tabHubAppIcon', title: 'App Icon', options: APP_ICON_OPTIONS },
  { key: 'tabHubAnimals', title: 'Animals', options: ANIMAL_ICON_OPTIONS },
  { key: 'tabHubConditions', title: 'Conditions', options: CONDITION_ICON_OPTIONS },
  { key: 'tabHubInsects', title: 'Insects & Other Wildlife', options: INSECT_ICON_OPTIONS },
];

const LABELS = new Map<TabHubIconChoice, string>(
  TAB_HUB_ICON_GROUPS.flatMap((group) => group.options.map((option) => [option.key, option.label] as const)),
);

export function tabHubIconLabel(key: TabHubIconChoice): string | undefined {
  return LABELS.get(key);
}

// How many past picks the card keeps above the groups, newest first.
export const TAB_HUB_RECENT_ICON_LIMIT = 5;

// Recent picks that still name an icon this list offers, newest first.
export function recentTabHubIcons(saved: readonly TabHubIconChoice[]): TabHubIconChoice[] {
  return saved.filter((key) => LABELS.has(key)).slice(0, TAB_HUB_RECENT_ICON_LIMIT);
}

// Both pickers choose through this, so a pick in Profile shows up in the
// card's Recent row too. The icon being left goes in as well, so the first
// pick ever made still leaves a way straight back.
export async function chooseTabHubIcon(key: TabHubIconChoice): Promise<void> {
  const current = await getVisualPreferences();
  if (current.tabHubIcon === key) return;
  const recent = [key, current.tabHubIcon, ...current.tabHubIconRecent].filter(
    (choice, index, all) => all.indexOf(choice) === index,
  );
  await setVisualPreferences({ tabHubIcon: key, tabHubIconRecent: recent.slice(0, TAB_HUB_RECENT_ICON_LIMIT) });
}
