import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { StarterLists } from './StarterLists';
import { TabBand, useTabBandStyles } from './TabBand';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  DUE_SOON_DAYS,
  TIME_CHOICES,
  UPKEEP_CATEGORIES,
  describeAssignee,
  describeInterval,
  describePlaceGroup,
  describeTimeFit,
  describeUpkeepStanding,
  describeUpkeepSummary,
  fitInMinutes,
  formatUpkeepMoney,
  groupByPlace,
  nextDueAfterDoing,
  placeChoices,
  placeRemovalNote,
  resolveAssignee,
  summarizeUpkeep,
  upkeepStanding,
  type AssigneeContext,
  type CustomUpkeepPlace,
  type UpkeepCadence,
  type UpkeepCategory,
  type UpkeepItem,
} from '../lib/upkeep';
import {
  assignUpkeepItem,
  countUpkeepInPlace,
  createUpkeepPlace,
  deleteUpkeepItem,
  listUpkeepItems,
  listUpkeepPlaces,
  loadAssigneeContext,
  markUpkeepDone,
  removeUpkeepPlace,
  renameUpkeepPlace,
  renewUpkeepItem,
  upsertUpkeepItem,
} from '../lib/upkeepDb';
import { listConnections } from '../lib/connections';
import { talksAutomatically } from '../lib/peerRelationships';
import { compareLabels } from '../lib/choiceOrder';
import { parsePriceInput } from '../lib/groceryList';
import { useWalkMark } from './WalkMark';
import { RecordPhotos } from './RecordPhotos';
import { describePlainDate, readPlainDateField, readPlainDates, type Lean } from '../lib/plainDate';

// Upkeep: things that need doing again, and things that run out.
//
// Life's fourth area, 2026-09-05. Chosen over the alternatives because the
// mechanism was already proven three times the same day and because the
// documents half is load-bearing for anyone whose papers have to be renewed
// somewhere that is not where they were issued.
//
// The screen's job is to make one distinction visible: something OVERDUE is a
// different kind of fact from something coming up, and something that cannot be
// placed on a calendar at all is a third. All three are listed, because
// dropping the third would let a clean-looking screen hide the item nobody has
// finished setting up.

type Props = {
  tabColor: string;
  /** C5: words from a capture note, opening the form with them as the name. */
  prefillName?: string | null;
};

const CATEGORY_OPTIONS = UPKEEP_CATEGORIES.map((entry) => ({ label: entry.label, value: entry.code }));
const CADENCE_OPTIONS = [
  { label: 'Needs doing again', value: 'recurring' },
  { label: 'Runs out on a date', value: 'expires' },
];
// A chore around the house comes round in days or weeks as often as in
// months (J6, 2026-09-29), so an interval is a unit and a number: d:7 is
// every week, m:12 every year. Days are stored in interval_days, months in
// interval_months, and only one of the two is ever set.
const INTERVAL_OPTIONS = [
  { label: 'Every day', value: 'd:1' },
  { label: 'Every week', value: 'd:7' },
  { label: 'Every 2 weeks', value: 'd:14' },
  { label: 'Every month', value: 'm:1' },
  { label: 'Every 3 months', value: 'm:3' },
  { label: 'Every 6 months', value: 'm:6' },
  { label: 'Every year', value: 'm:12' },
  { label: 'Every 2 years', value: 'm:24' },
];

function intervalCode(item: Pick<UpkeepItem, 'intervalDays' | 'intervalMonths'>): string {
  if (item.intervalDays != null && item.intervalDays > 0) return `d:${item.intervalDays}`;
  if (item.intervalMonths != null && item.intervalMonths > 0) return `m:${item.intervalMonths}`;
  return 'm:12';
}

function readIntervalCode(code: string): { intervalDays: number | null; intervalMonths: number | null } {
  const [unit, raw] = code.split(':');
  const value = Number(raw) || null;
  return unit === 'd' ? { intervalDays: value, intervalMonths: null } : { intervalDays: null, intervalMonths: value };
}

const ADD_PLACE = '__add_place__';
const NO_PLACE = '__no_place__';
const ANYONE = '__anyone__';
const NO_TIME = '__no_time__';
const TIME_OPTIONS = [
  { label: 'Not written down', value: NO_TIME },
  ...[5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240].map((n) => ({ label: `${n} minutes`, value: String(n) })),
];

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type ItemForm = {
  id: string | null;
  name: string;
  category: UpkeepCategory;
  cadence: UpkeepCadence;
  interval: string;
  lastDoneOn: string;
  expiresOn: string;
  renewable: boolean;
  cost: string;
  /** A place code, or '' for none given. */
  place: string;
  /** Minutes as a string, or '' when not written down. */
  minutes: string;
  /** An assignee code, or '' for anyone. */
  assignedTo: string;
  household: boolean;
};

function blankForm(): ItemForm {
  return {
    id: null, name: '', category: 'home', cadence: 'recurring',
    interval: 'm:12', lastDoneOn: '', expiresOn: '', renewable: true, cost: '',
    place: '', minutes: '', assignedTo: '', household: false,
  };
}

function formFor(item: UpkeepItem): ItemForm {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    cadence: item.cadence,
    interval: intervalCode(item),
    lastDoneOn: item.lastDoneOn ?? '',
    expiresOn: item.expiresOn ?? '',
    renewable: item.renewable,
    cost: item.cost != null ? String(item.cost) : '',
    place: item.place ?? '',
    minutes: item.minutes != null ? String(item.minutes) : '',
    assignedTo: item.assignedTo ?? '',
    household: item.household,
  };
}

type Context = AssigneeContext & { myName: string | null };
const EMPTY_CONTEXT: Context = { myPersonId: null, myKey: null, connections: [], family: [], myName: null };

export function UpkeepSection({ tabColor, prefillName }: Props) {
  // The outline on a button a Your Story walk line names (components/WalkMark.ts).
  const walkMark = useWalkMark();
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [items, setItems] = useState<UpkeepItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ItemForm | null>(null);
  const [renewForm, setRenewForm] = useState<{ id: string; name: string; date: string } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);
  // J6: the places the person named, and the one being named or renamed.
  const [places, setPlaces] = useState<CustomUpkeepPlace[]>([]);
  const [placeEdit, setPlaceEdit] = useState<{ id: string | null; name: string } | null>(null);
  const [placeRemoval, setPlaceRemoval] = useState<{ id: string; name: string; inUse: number; moveTo: string } | null>(null);
  // Who a chore can be for, and the people it can be shared with.
  const [context, setContext] = useState<Context>(EMPTY_CONTEXT);
  const [linked, setLinked] = useState<{ key: string; name: string }[]>([]);
  // J7: how much time somebody has, or null before they say.
  const [freeMinutes, setFreeMinutes] = useState<number | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const band = useTabBandStyles(tabColor);
  const folds = useBandFolds();

  // A capture note turned into an upkeep item (C5) arrives as words for the
  // name. Everything else is left for the person, since a note carries no
  // cadence; a date in the words is offered beside the date box below.
  useEffect(() => {
    if (prefillName && prefillName.trim()) setForm({ ...blankForm(), name: prefillName.trim() });
  }, [prefillName]);

  // C4: a date box takes words too. What the words read as is shown with a
  // Use it button and never put in the box by itself.
  function renderDateOffer(value: string, lean: Lean, onUse: (date: string) => void) {
    const now = new Date();
    const found = readPlainDateField(value, now, lean);
    if (!found) return null;
    return (
      <View style={styles.inlineRow}>
        <Text style={styles.helperText}>{`Reads as ${describePlainDate({ ...found, time: null }, now)}.`}</Text>
        <TouchableOpacity style={styles.pillSmall} onPress={() => onUse(found.date)}>
          <Text style={styles.pillTextSmall}>Use it</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // A date said in the name ("Passport runs out 3 March 2031"), offered for
  // the date box that is still empty.
  function renderNameDateOffer(currentForm: ItemForm) {
    const expires = currentForm.cadence === 'expires';
    if ((expires ? currentForm.expiresOn : currentForm.lastDoneOn).trim()) return null;
    const now = new Date();
    const found = readPlainDates(currentForm.name, now, expires ? 'future' : 'past')[0];
    if (!found || !found.matched) return null;
    const label = describePlainDate({ ...found, time: null }, now);
    return (
      <View style={styles.inlineRow}>
        <Text style={styles.helperText}>
          {expires ? `The name mentions ${label}. Runs out then?` : `The name mentions ${label}. Last done then?`}
        </Text>
        <TouchableOpacity
          style={styles.pillSmall}
          onPress={() => setForm(expires ? { ...currentForm, expiresOn: found.date } : { ...currentForm, lastDoneOn: found.date })}
        >
          <Text style={styles.pillTextSmall}>Use it</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      listUpkeepItems(),
      listUpkeepPlaces(),
      loadAssigneeContext().catch(() => EMPTY_CONTEXT),
      listConnections().catch(() => []),
    ])
      .then(([loadedItems, loadedPlaces, loadedContext, connections]) => {
        setItems(loadedItems);
        setPlaces(loadedPlaces);
        setContext(loadedContext);
        // Only a link that keeps things in step by itself can carry a chore.
        setLinked(
          connections
            .filter((entry) => talksAutomatically(entry.role))
            .map((entry) => ({ key: entry.publicKeyBase64, name: entry.name })),
        );
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summary = useMemo(() => summarizeUpkeep(items, todayLocal()), [items]);

  // J6: grouped by room or area, alphabetical, with No place given last.
  const grouped = useMemo(() => groupByPlace(items, places, todayLocal()), [items, places]);

  // J7: what fits in the time somebody has.
  const timeFit = useMemo(
    () => (freeMinutes != null ? fitInMinutes(items, freeMinutes, todayLocal(), context) : null),
    [items, freeMinutes, context],
  );

  const placeOptions = useMemo(
    () => [
      { label: 'No place given', value: NO_PLACE },
      ...placeChoices(places).map((entry) => ({ label: entry.label, value: entry.code })),
      { label: 'Add a place of your own', value: ADD_PLACE },
    ],
    [places],
  );

  // Anyone and the person themselves first, then everybody else by name.
  const assigneeOptions = useMemo(() => {
    const others = [
      ...context.family.map((entry) => ({ label: entry.name, value: `family:${entry.id}` })),
      ...linked.map((entry) => ({ label: entry.name, value: `key:${entry.key}` })),
    ].sort((a, b) => compareLabels(a.label, b.label));
    return [
      { label: 'Anyone', value: ANYONE },
      ...(context.myPersonId ? [{ label: 'Me', value: `person:${context.myPersonId}` }] : []),
      ...others,
    ];
  }, [context, linked]);

  function nameForAssignee(code: string): string | null {
    if (!code) return null;
    if (code.startsWith('person:')) return context.myName;
    return assigneeOptions.find((entry) => entry.value === code)?.label ?? null;
  }

  async function take(item: UpkeepItem) {
    if (!context.myPersonId) return;
    await assignUpkeepItem(item.id, `person:${context.myPersonId}`, context.myName);
    load();
  }

  async function giveBack(item: UpkeepItem) {
    await assignUpkeepItem(item.id, null, null);
    load();
  }

  async function saveNewPlaceName() {
    if (!placeEdit || !form) return;
    const name = placeEdit.name.trim();
    if (!name) {
      showInfoAlert('Almost there', 'Give the place a name, like "Spare room" or "Boat".');
      return;
    }
    if (placeEdit.id) {
      await renameUpkeepPlace(placeEdit.id, name);
      setPlaces(await listUpkeepPlaces());
      setPlaceEdit(null);
      return;
    }
    const code = await createUpkeepPlace(name);
    setPlaces(await listUpkeepPlaces());
    setForm({ ...form, place: code });
    setPlaceEdit(null);
  }

  async function startPlaceRemoval(id: string, name: string) {
    const inUse = await countUpkeepInPlace(id);
    if (inUse === 0) {
      setConfirm({
        title: `Remove ${name}?`,
        message: placeRemovalNote(name, 0),
        actions: [
          {
            label: 'Remove',
            destructive: true,
            onPress: async () => {
              setConfirm(null);
              await removeUpkeepPlace(id, null);
              if (form?.place === id) setForm({ ...form, place: '' });
              load();
            },
          },
          { label: 'Keep it', onPress: () => setConfirm(null) },
        ],
      });
      return;
    }
    setPlaceRemoval({ id, name, inUse, moveTo: '' });
  }

  async function finishPlaceRemoval() {
    if (!placeRemoval) return;
    if (!placeRemoval.moveTo) {
      showInfoAlert('Almost there', 'Pick where the things in it go first.');
      return;
    }
    const moved = await removeUpkeepPlace(placeRemoval.id, placeRemoval.moveTo);
    if (moved && form?.place === placeRemoval.id) setForm({ ...form, place: placeRemoval.moveTo });
    setPlaceRemoval(null);
    load();
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you will recognise, like "Boiler service" or "Passport".');
      return;
    }
    const dateOk = (value: string) => !value.trim() || /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    if (!dateOk(form.lastDoneOn) || !dateOk(form.expiresOn)) {
      showInfoAlert('Almost there', 'Enter dates as YYYY-MM-DD, or tap Use it under a date written in words. Leave one blank if you do not know it.');
      return;
    }
    if (form.cadence === 'expires' && !form.expiresOn.trim()) {
      showInfoAlert(
        'Almost there',
        'Something that runs out needs the date it runs out on, or there is nothing to count down. Add it here, or switch this to something that needs doing again.',
      );
      return;
    }

    const interval = readIntervalCode(form.interval);
    await upsertUpkeepItem({
      id: form.id ?? undefined,
      name: form.name,
      category: form.category,
      cadence: form.cadence,
      intervalMonths: interval.intervalMonths,
      intervalDays: interval.intervalDays,
      lastDoneOn: form.lastDoneOn,
      expiresOn: form.expiresOn,
      renewable: form.renewable,
      cost: form.cost.trim() ? parsePriceInput(form.cost) : null,
      place: form.place || null,
      minutes: Number(form.minutes) || null,
      assignedTo: form.assignedTo || null,
      assignedName: nameForAssignee(form.assignedTo),
      // Somebody on a linked phone only ever sees a chore that is shared.
      household: form.household || form.assignedTo.startsWith('key:'),
    });
    setForm(null);
    load();
  }

  function confirmDone(item: UpkeepItem) {
    const next = nextDueAfterDoing({ ...item, lastDoneOn: todayLocal() }, todayLocal());
    setConfirm({
      title: `${item.name} done today?`,
      message: next
        ? `This records today as the last time it was done, so the next one comes due ${next}. The clock runs from when you actually did it rather than from a fixed month.`
        : 'This records today as the last time it was done.',
      actions: [
        {
          label: 'Done today',
          onPress: async () => {
            setConfirm(null);
            await markUpkeepDone(item.id, todayLocal());
            load();
          },
        },
        { label: 'Not yet', onPress: () => setConfirm(null) },
      ],
    });
  }

  if (loading) return <View style={band.boxMuted}><Text style={styles.bodyText}>Loading…</Text></View>;

  return (
    <View style={band.column}>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
      />

      <View style={band.box}>
        <Text style={styles.cardTitle}>Upkeep</Text>
        <Text style={styles.bodyText}>{describeUpkeepSummary(summary)}</Text>
        {!form ? (
          <TouchableOpacity style={[styles.primaryButton, walkMark('upkeep.add')]} onPress={() => setForm(blankForm())}>
            <Text style={styles.primaryButtonText}>+ Add something</Text>
          </TouchableOpacity>
        ) : null}
        {!form ? (
          <StarterLists kind="upkeep" tabColor={tabColor} heldNames={items.map((item) => item.name)} onAdded={load} />
        ) : null}
        {/* The timeline of these dates is Schedules > Upkeep, 2026-09-13:
            items are defined here and read there, the same split as My
            Meds and Schedules > Meds. */}
        <TouchableOpacity onPress={() => router.push({ pathname: '/schedule', params: { openScheduleLens: 'upkeep' } })}>
          <Text style={styles.actionText}>See these by date on Schedules &gt; Upkeep</Text>
        </TouchableOpacity>
      </View>

      {form ? (
        <View style={band.box}>
          <Text style={styles.label}>What is it</Text>
          <AppTextInput
            onVoiceResult={(t) => setForm({ ...form, name: t })}
            micColor={tabColor}
            style={styles.input}
            placeholder="e.g. Boiler service"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

          <Text style={styles.label}>Where (optional)</Text>
          <PopoverSelect
            options={placeOptions}
            selected={form.place || NO_PLACE}
            onSelect={(value) => {
              if (value === ADD_PLACE) {
                setPlaceEdit({ id: null, name: '' });
                return;
              }
              setForm({ ...form, place: value === NO_PLACE ? '' : value });
            }}
            tabColor={tabColor}
            searchable
          />
          {placeEdit ? (
            <View style={styles.inlineForm}>
              <Text style={styles.label}>{placeEdit.id ? 'New name for the place' : 'Name of the place'}</Text>
              <AppTextInput
                onVoiceResult={(t) => setPlaceEdit({ ...placeEdit, name: t })}
                micColor={tabColor}
                style={styles.input}
                placeholder="e.g. Spare room"
                value={placeEdit.name}
                onChangeText={(t) => setPlaceEdit({ ...placeEdit, name: t })}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setPlaceEdit(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={saveNewPlaceName}>
                  <Text style={styles.primaryButtonText}>{placeEdit.id ? 'Rename it' : 'Add the place'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {(() => {
            // Rename and Remove are offered on the places the person named,
            // never on the built-in ones.
            const own = places.find((entry) => entry.id === form.place);
            if (!own || placeEdit) return null;
            return (
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => setPlaceEdit({ id: own.id, name: own.name })}>
                  <Text style={styles.actionText}>{`Rename ${own.name}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startPlaceRemoval(own.id, own.name)}>
                  <Text style={styles.actionTextRemove}>{`Remove ${own.name}`}</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
          {placeRemoval ? (
            <View style={styles.inlineForm}>
              <Text style={styles.helperText}>{placeRemovalNote(placeRemoval.name, placeRemoval.inUse)}</Text>
              <Text style={styles.label}>Move them to</Text>
              <PopoverSelect
                options={placeChoices(places)
                  .filter((entry) => entry.code !== placeRemoval.id)
                  .map((entry) => ({ label: entry.label, value: entry.code }))}
                selected={placeRemoval.moveTo || null}
                placeholder="Pick a place"
                onSelect={(value) => setPlaceRemoval({ ...placeRemoval, moveTo: value })}
                tabColor={tabColor}
                searchable
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setPlaceRemoval(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={finishPlaceRemoval}>
                  <Text style={styles.primaryButtonText}>Move and remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>Which part of life</Text>
          <PopoverSelect
            options={CATEGORY_OPTIONS}
            selected={form.category}
            onSelect={(value) => setForm({ ...form, category: value as UpkeepCategory })}
            tabColor={tabColor}
          />
          <Text style={styles.helperText}>
            {UPKEEP_CATEGORIES.find((entry) => entry.code === form.category)?.example}
          </Text>

          <Text style={styles.label}>Which kind of thing</Text>
          <PopoverSelect
            options={CADENCE_OPTIONS}
            selected={form.cadence}
            onSelect={(value) => setForm({ ...form, cadence: value as UpkeepCadence })}
            tabColor={tabColor}
          />
          <Text style={styles.helperText}>
            {form.cadence === 'recurring'
              ? 'Counted from the last time you did it, not from a fixed month. A boiler serviced in March is next due the following March.'
              : 'One date, and then it is over. A passport, a registration, a warranty.'}
          </Text>

          {form.cadence === 'recurring' ? (
            <>
              <Text style={styles.label}>How often</Text>
              <PopoverSelect
                options={
                  INTERVAL_OPTIONS.some((entry) => entry.value === form.interval)
                    ? INTERVAL_OPTIONS
                    : [...INTERVAL_OPTIONS, { label: describeInterval(readIntervalCode(form.interval)), value: form.interval }]
                }
                selected={form.interval}
                onSelect={(value) => setForm({ ...form, interval: value })}
                tabColor={tabColor}
              />

              <Text style={styles.label}>Last done (optional)</Text>
              <View style={styles.inlineRow}>
                <AppTextInput
                  style={[styles.input, styles.shortInput]}
                  placeholder="YYYY-MM-DD or in words"
                  value={form.lastDoneOn}
                  onChangeText={(t) => setForm({ ...form, lastDoneOn: t })}
                />
                <TouchableOpacity style={styles.pillSmall} onPress={() => setForm({ ...form, lastDoneOn: todayLocal() })}>
                  <Text style={styles.pillTextSmall}>Today</Text>
                </TouchableOpacity>
              </View>
              {renderDateOffer(form.lastDoneOn, 'past', (date) => setForm({ ...form, lastDoneOn: date }))}
              {renderNameDateOffer(form)}
              <Text style={styles.helperText}>
                Without this there is no next date, and the app will say so rather than counting from today and inventing
                a schedule nobody set.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Runs out on</Text>
              <AppTextInput
                style={[styles.input, styles.shortInput]}
                placeholder="YYYY-MM-DD or in words"
                value={form.expiresOn}
                onChangeText={(t) => setForm({ ...form, expiresOn: t })}
              />
              {renderDateOffer(form.expiresOn, 'future', (date) => setForm({ ...form, expiresOn: date }))}
              {renderNameDateOffer(form)}

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setForm({ ...form, renewable: !form.renewable })}
              >
                <View style={[styles.checkBox, form.renewable && styles.checkBoxOn]}>
                  {form.renewable ? <Text style={styles.checkMark}>{'✓'}</Text> : null}
                </View>
                <Text style={styles.checkLabel}>This can be renewed</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Leave it off for something that simply ends, like a warranty. The app will not tell you to renew
                something that cannot be renewed.
              </Text>
            </>
          )}

          <Text style={styles.label}>What it costs (optional)</Text>
          <AppTextInput
            style={[styles.input, styles.shortInput]}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={form.cost}
            onChangeText={(t) => setForm({ ...form, cost: t })}
          />
          <Text style={styles.helperText}>
            Nothing is guessed at. Anything with no cost recorded is counted separately, and the total says so rather
            than pretending to be complete.
          </Text>

          <Text style={styles.label}>How long it takes (optional)</Text>
          <PopoverSelect
            options={
              !form.minutes || TIME_OPTIONS.some((entry) => entry.value === form.minutes)
                ? TIME_OPTIONS
                : [...TIME_OPTIONS, { label: `${form.minutes} minutes`, value: form.minutes }]
            }
            selected={form.minutes || NO_TIME}
            onSelect={(value) => setForm({ ...form, minutes: value === NO_TIME ? '' : value })}
            tabColor={tabColor}
          />
          <Text style={styles.helperText}>
            Used by I Have Some Time below. Anything with no time written down is left out there and counted, never
            guessed at.
          </Text>

          <Text style={styles.label}>Who does it</Text>
          <PopoverSelect
            options={assigneeOptions}
            selected={form.assignedTo || ANYONE}
            onSelect={(value) => {
              const code = value === ANYONE ? '' : value;
              setForm({ ...form, assignedTo: code, household: form.household || code.startsWith('key:') });
            }}
            tabColor={tabColor}
            searchable={assigneeOptions.length > 8}
          />
          <Text style={styles.helperText}>
            {form.assignedTo.startsWith('key:')
              ? 'They are on a linked phone, so this is shared with the household and reaches them there.'
              : 'Anyone means whoever gets to it first can take it. Nobody is counted or compared.'}
          </Text>

          {linked.length > 0 ? (
            <>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => {
                  if (form.assignedTo.startsWith('key:')) return;
                  setForm({ ...form, household: !form.household });
                }}
              >
                <View style={[styles.checkBox, form.household && styles.checkBoxOn]}>
                  {form.household ? <Text style={styles.checkMark}>{'✓'}</Text> : null}
                </View>
                <Text style={styles.checkLabel}>Share with the household</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                {`${linked.map((entry) => entry.name).join(', ')} will see it, can take it or mark it done, and see when it was last done. Upkeep you do not share stays with you, on your devices.`}
              </Text>
            </>
          ) : null}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={save}>
              <Text style={styles.primaryButtonText}>{form.id ? 'Save changes' : 'Add it'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {summary.overdue.length > 0 ? (
        <TabBand folds={folds} color={tabColor} id="life:upkeep:overdue" title="Overdue" icon="alert-circle-outline" count={summary.overdue.length}>
          {summary.overdue.map((standing) => (
            <View key={standing.item.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{standing.item.name}</Text>
                <Text style={[styles.rowMeta, styles.warn]}>{describeUpkeepStanding(standing)}</Text>
              </View>
            </View>
          ))}
        </TabBand>
      ) : null}

      {summary.dueSoon.length > 0 ? (
        <TabBand folds={folds} color={tabColor} id="life:upkeep:due-soon" title={`Next ${DUE_SOON_DAYS} days`} icon="time-outline" count={summary.dueSoon.length}>
          {summary.dueSoon.map((standing) => (
            <View key={standing.item.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{standing.item.name}</Text>
                <Text style={styles.rowMeta}>{describeUpkeepStanding(standing)}</Text>
              </View>
            </View>
          ))}
        </TabBand>
      ) : null}

      {items.some((item) => item.active) ? (
        <TabBand folds={folds} color={tabColor} id="life:upkeep:time" title="I Have Some Time" icon="hourglass-outline">
          <Text style={styles.bodyText}>
            Say how long you have, and the things due or coming due that fit in it are listed, soonest first.
          </Text>
          <PopoverSelect
            options={TIME_CHOICES.map((n) => ({ label: `I have ${n} minutes`, value: String(n) }))}
            selected={freeMinutes != null ? String(freeMinutes) : null}
            placeholder="How long do you have?"
            onSelect={(value) => setFreeMinutes(Number(value))}
            tabColor={tabColor}
          />
          {timeFit && freeMinutes != null ? (
            <>
              <Text style={styles.helperText}>{describeTimeFit(timeFit, freeMinutes)}</Text>
              {timeFit.fits.map((standing) => (
                <View key={standing.item.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{standing.item.name}</Text>
                    <Text style={[styles.rowMeta, standing.overdue && styles.warn]}>
                      {`${standing.item.minutes} minutes. ${describeUpkeepStanding(standing)}`}
                    </Text>
                    <View style={styles.rowActions}>
                      <TouchableOpacity onPress={() => confirmDone(standing.item)}>
                        <Text style={styles.actionText}>Done today</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </TabBand>
      ) : null}

      {grouped.map((group) => (
        <TabBand
          key={group.code ?? 'none'}
          folds={folds}
          color={tabColor}
          id={`life:upkeep:place:${group.code ?? 'none'}`}
          title={group.label}
          icon="home-outline"
          count={group.entries.length}
        >
          <Text style={styles.helperText}>{describePlaceGroup(group)}</Text>
          {group.entries.map((item) => {
            const standing = upkeepStanding(item, todayLocal());
            const who = resolveAssignee(item, context);
            return (
              <View key={item.id} style={[styles.row, !item.active && styles.dimmed]}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowMeta}>
                    {[
                      describeAssignee(who) + '.',
                      item.minutes != null ? `Takes about ${item.minutes} minutes.` : null,
                      item.household ? 'Shared with the household.' : null,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </Text>
                  <Text
                    style={[
                      styles.rowMeta,
                      standing.overdue && styles.warn,
                      standing.missing != null && styles.needsSetup,
                    ]}
                  >
                    {describeUpkeepStanding(standing)}
                  </Text>
                  {item.cost != null ? (
                    <Text style={styles.rowMeta}>{formatUpkeepMoney(item.cost)} when it comes round.</Text>
                  ) : null}
                  <RecordPhotos ownerKind="upkeep" ownerId={item.id} tabColor={tabColor} title={item.name} />

                  {renewForm?.id === item.id ? (
                    <View style={styles.inlineForm}>
                      <Text style={styles.label}>New date</Text>
                      <AppTextInput
                        style={[styles.input, styles.shortInput]}
                        placeholder="YYYY-MM-DD"
                        value={renewForm.date}
                        onChangeText={(t) => setRenewForm({ ...renewForm, date: t })}
                      />
                      <View style={styles.formActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setRenewForm(null)}>
                          <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={async () => {
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(renewForm.date.trim())) {
                              showInfoAlert('Almost there', 'Enter the new date as YYYY-MM-DD.');
                              return;
                            }
                            await renewUpkeepItem(item.id, renewForm.date.trim());
                            setRenewForm(null);
                            load();
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Renewed</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.rowActions}>
                    {item.cadence === 'recurring' ? (
                      <TouchableOpacity onPress={() => confirmDone(item)}>
                        <Text style={styles.actionText}>Done today</Text>
                      </TouchableOpacity>
                    ) : item.renewable ? (
                      <TouchableOpacity onPress={() => setRenewForm({ id: item.id, name: item.name, date: '' })}>
                        <Text style={styles.actionText}>Renewed</Text>
                      </TouchableOpacity>
                    ) : null}
                    {who.kind !== 'me' && context.myPersonId ? (
                      <TouchableOpacity onPress={() => take(item)}>
                        <Text style={styles.actionText}>{who.kind === 'anyone' ? 'Take it' : 'Take it over'}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {who.kind !== 'anyone' ? (
                      <TouchableOpacity onPress={() => giveBack(item)}>
                        <Text style={styles.actionText}>Leave it for anyone</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => setForm(formFor(item))}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setConfirm({
                          title: `Remove ${item.name}?`,
                          message: 'This removes it and everything recorded about it, including when it was last done.',
                          actions: [
                            {
                              label: 'Remove',
                              destructive: true,
                              onPress: async () => {
                                setConfirm(null);
                                await deleteUpkeepItem(item.id);
                                load();
                              },
                            },
                            { label: 'Keep it', onPress: () => setConfirm(null) },
                          ],
                        })
                      }
                    >
                      <Text style={styles.actionTextRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </TabBand>
      ))}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    dimmed: { opacity: 0.6 },
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    warn: { color: colors.danger },
    needsSetup: { color: colors.statusYellowStandalone },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    shortInput: { maxWidth: 160 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineForm: {
      marginTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 10,
      backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: tabColor,
    },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    checkBox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: tabColor,
      alignItems: 'center', justifyContent: 'center',
    },
    checkBoxOn: { backgroundColor: tabColor },
    checkMark: { ...typography.caption, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
    checkLabel: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    rowActions: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    pillSmall: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    },
    pillTextSmall: { ...typography.caption, color: colors.textPrimary, ...textShadow },

    formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    primaryButton: {
      backgroundColor: colors.buttonColor, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18,
      alignItems: 'center', marginTop: 12, ...BUTTON_SHADOW,
    },
    primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    secondaryButton: {
      backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', marginTop: 12,
    },
    secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  });
}
