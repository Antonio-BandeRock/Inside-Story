import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  DUE_SOON_DAYS,
  UPKEEP_CATEGORIES,
  describeUpkeepStanding,
  describeUpkeepSummary,
  formatUpkeepMoney,
  nextDueAfterDoing,
  summarizeUpkeep,
  upkeepStanding,
  type UpkeepCadence,
  type UpkeepCategory,
  type UpkeepItem,
} from '../lib/upkeep';
import {
  deleteUpkeepItem,
  listUpkeepItems,
  markUpkeepDone,
  renewUpkeepItem,
  upsertUpkeepItem,
} from '../lib/upkeepDb';
import { parsePriceInput } from '../lib/groceryList';

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

type Props = { tabColor: string };

const CATEGORY_OPTIONS = UPKEEP_CATEGORIES.map((entry) => ({ label: entry.label, value: entry.code }));
const CADENCE_OPTIONS = [
  { label: 'Needs doing again', value: 'recurring' },
  { label: 'Runs out on a date', value: 'expires' },
];
const INTERVAL_OPTIONS = [
  { label: 'Every month', value: '1' },
  { label: 'Every 3 months', value: '3' },
  { label: 'Every 6 months', value: '6' },
  { label: 'Every year', value: '12' },
  { label: 'Every 2 years', value: '24' },
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
  intervalMonths: string;
  lastDoneOn: string;
  expiresOn: string;
  renewable: boolean;
  cost: string;
};

function blankForm(): ItemForm {
  return {
    id: null, name: '', category: 'home', cadence: 'recurring',
    intervalMonths: '12', lastDoneOn: '', expiresOn: '', renewable: true, cost: '',
  };
}

export function UpkeepSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [items, setItems] = useState<UpkeepItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ItemForm | null>(null);
  const [renewForm, setRenewForm] = useState<{ id: string; name: string; date: string } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    listUpkeepItems()
      .then(setItems)
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summary = useMemo(() => summarizeUpkeep(items, todayLocal()), [items]);

  // Grouped for the list, in the order the categories are declared rather than
  // alphabetically, so Home leads and Something else trails.
  const grouped = useMemo(
    () =>
      UPKEEP_CATEGORIES.map((category) => ({
        category,
        entries: items.filter((item) => item.category === category.code),
      })).filter((group) => group.entries.length > 0),
    [items],
  );

  async function save() {
    if (!form) return;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you will recognise, like "Boiler service" or "Passport".');
      return;
    }
    const dateOk = (value: string) => !value.trim() || /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    if (!dateOk(form.lastDoneOn) || !dateOk(form.expiresOn)) {
      showInfoAlert('Almost there', 'Enter dates as YYYY-MM-DD, or leave one blank if you do not know it.');
      return;
    }
    if (form.cadence === 'expires' && !form.expiresOn.trim()) {
      showInfoAlert(
        'Almost there',
        'Something that runs out needs the date it runs out on, or there is nothing to count down. Add it here, or switch this to something that needs doing again.',
      );
      return;
    }

    await upsertUpkeepItem({
      id: form.id ?? undefined,
      name: form.name,
      category: form.category,
      cadence: form.cadence,
      intervalMonths: Number(form.intervalMonths) || null,
      lastDoneOn: form.lastDoneOn,
      expiresOn: form.expiresOn,
      renewable: form.renewable,
      cost: form.cost.trim() ? parsePriceInput(form.cost) : null,
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

  if (loading) return <Text style={[styles.bodyText, styles.panelStandalone]}>Loading…</Text>;

  return (
    <>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upkeep</Text>
        <Text style={styles.bodyText}>{describeUpkeepSummary(summary)}</Text>
        {!form ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setForm(blankForm())}>
            <Text style={styles.primaryButtonText}>+ Add something</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>What is it</Text>
            <VoiceInputButton onResult={(t) => setForm({ ...form, name: t })} color={tabColor} />
          </View>
          <AppTextInput
            style={styles.input}
            placeholder="e.g. Boiler service"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

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
                options={INTERVAL_OPTIONS}
                selected={form.intervalMonths}
                onSelect={(value) => setForm({ ...form, intervalMonths: value })}
                tabColor={tabColor}
              />

              <Text style={styles.label}>Last done (optional)</Text>
              <View style={styles.inlineRow}>
                <AppTextInput
                  style={[styles.input, styles.shortInput]}
                  placeholder="YYYY-MM-DD"
                  value={form.lastDoneOn}
                  onChangeText={(t) => setForm({ ...form, lastDoneOn: t })}
                />
                <TouchableOpacity style={styles.pillSmall} onPress={() => setForm({ ...form, lastDoneOn: todayLocal() })}>
                  <Text style={styles.pillTextSmall}>Today</Text>
                </TouchableOpacity>
              </View>
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
                placeholder="YYYY-MM-DD"
                value={form.expiresOn}
                onChangeText={(t) => setForm({ ...form, expiresOn: t })}
              />

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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overdue</Text>
          {summary.overdue.map((standing) => (
            <View key={standing.item.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{standing.item.name}</Text>
                <Text style={[styles.rowMeta, styles.warn]}>{describeUpkeepStanding(standing)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {summary.dueSoon.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next {DUE_SOON_DAYS} days</Text>
          {summary.dueSoon.map((standing) => (
            <View key={standing.item.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{standing.item.name}</Text>
                <Text style={styles.rowMeta}>{describeUpkeepStanding(standing)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {grouped.map((group) => (
        <View key={group.category.code} style={styles.card}>
          <Text style={styles.cardTitle}>{group.category.label}</Text>
          {group.entries.map((item) => {
            const standing = upkeepStanding(item, todayLocal());
            return (
              <View key={item.id} style={[styles.row, !item.active && styles.dimmed]}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
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
                    <TouchableOpacity
                      onPress={() =>
                        setForm({
                          id: item.id,
                          name: item.name,
                          category: item.category,
                          cadence: item.cadence,
                          intervalMonths: item.intervalMonths != null ? String(item.intervalMonths) : '12',
                          lastDoneOn: item.lastDoneOn ?? '',
                          expiresOn: item.expiresOn ?? '',
                          renewable: item.renewable,
                          cost: item.cost != null ? String(item.cost) : '',
                        })
                      }
                    >
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
        </View>
      ))}
    </>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    panelStandalone: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
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
