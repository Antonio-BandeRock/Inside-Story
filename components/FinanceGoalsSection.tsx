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
  GOAL_COST_KINDS,
  defaultUnitFor,
  describeContributionSources,
  describeCostProgress,
  describeGoalProgress,
  describeGoalsSummary,
  describePace,
  formatGoalAmount,
  goalCostKindLabel,
  isPaceRefusal,
  pace,
  summarizeGoals,
  type GoalCostKind,
} from '../lib/financeGoals';
import {
  addGoalContribution,
  addGoalCost,
  createGoal,
  deleteGoal,
  deleteGoalCost,
  listGoalsWithProgress,
  setGoalStatus,
  type GoalWithProgress,
} from '../lib/financeGoalsDb';
import { parsePriceInput } from '../lib/groceryList';

// Goals, 2026-09-05, pass 3 of the Finances rebuild.
//
// The screen's job is to keep the model's central rule visible: a goal's
// costs are of different kinds, and they are never blended. So there is no
// single progress bar for a goal anywhere here. Each cost line gets its
// own bar in its own unit, and the goal above them reports how many are met
// and which one is furthest behind.
//
// That last figure is the useful one, and it is why this is not a savings
// tracker: it answers whether the thing holding you up is money or a
// weekend, which a single percentage cannot say at all.

type Props = { tabColor: string };

const KIND_OPTIONS = GOAL_COST_KINDS.map((kind) => ({ label: kind.label, value: kind.code }));

const STATUS_LABEL: Record<string, string> = {
  active: '',
  reached: 'reached',
  given_up: 'set aside',
};

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type GoalForm = { name: string; reason: string; targetDate: string };
type CostForm = { goalId: string; kind: GoalCostKind; label: string; target: string; unit: string };
type ContribForm = { costId: string; kind: GoalCostKind; unit: string; amount: string; occurredOn: string; note: string };

export function FinanceGoalsSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm | null>(null);
  const [costForm, setCostForm] = useState<CostForm | null>(null);
  const [contribForm, setContribForm] = useState<ContribForm | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    listGoalsWithProgress()
      .then(setGoals)
      .catch((error) => showInfoAlert('Could not load goals', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summary = useMemo(() => summarizeGoals(goals, todayLocal()), [goals]);

  async function saveGoal() {
    if (!goalForm) return;
    if (!goalForm.name.trim()) {
      showInfoAlert('Almost there', 'Give the goal a name.');
      return;
    }
    const date = goalForm.targetDate.trim();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showInfoAlert('Almost there', 'Enter the date as YYYY-MM-DD, or leave it blank if there is no deadline.');
      return;
    }
    await createGoal({ name: goalForm.name, reason: goalForm.reason, targetDate: date || null });
    setGoalForm(null);
    load();
  }

  async function saveCost() {
    if (!costForm) return;
    if (!costForm.label.trim()) {
      showInfoAlert('Almost there', 'Say what this cost is, like "Lumber" or "Building it".');
      return;
    }
    const target = parsePriceInput(costForm.target);
    if (target == null || target <= 0) {
      showInfoAlert('Almost there', 'Enter how much it will take, greater than zero.');
      return;
    }
    if (costForm.kind !== 'money' && !costForm.unit.trim()) {
      showInfoAlert('Almost there', 'Say what this is counted in: hours, kg, jars, whatever fits.');
      return;
    }
    await addGoalCost({
      goalId: costForm.goalId,
      kind: costForm.kind,
      label: costForm.label,
      target,
      unit: costForm.unit,
    });
    setCostForm(null);
    load();
  }

  async function saveContribution() {
    if (!contribForm) return;
    const amount = parsePriceInput(contribForm.amount);
    if (amount == null || amount <= 0) {
      showInfoAlert('Almost there', 'Enter how much went in, greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(contribForm.occurredOn)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD).');
      return;
    }
    await addGoalContribution({
      costId: contribForm.costId,
      occurredOn: contribForm.occurredOn,
      amount,
      note: contribForm.note,
    });
    setContribForm(null);
    load();
  }

  if (loading) return <Text style={[styles.bodyText, styles.panelStandalone]}>Adding up your goals…</Text>;

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
        <Text style={styles.cardTitle}>Goals</Text>
        {goals.length === 0 ? (
          <Text style={styles.bodyText}>
            A goal here is something you want, plus what it will actually take to get it. That cost can be money, but it
            can just as easily be hours of work or things you provide yourself, and most real goals are a mix. Restoring a
            bed costs lumber and a weekend. A year of preserves costs jars, produce and time.
          </Text>
        ) : (
          <Text style={styles.bodyText}>{describeGoalsSummary(summary)}</Text>
        )}
        {!goalForm ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setGoalForm({ name: '', reason: '', targetDate: '' })}
          >
            <Text style={styles.primaryButtonText}>+ Add a goal</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {goalForm ? (
        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>What is it</Text>
            <VoiceInputButton onResult={(t) => setGoalForm({ ...goalForm, name: t })} color={tabColor} />
          </View>
          <AppTextInput
            style={styles.input}
            placeholder="e.g. Rebuild the raised bed"
            value={goalForm.name}
            onChangeText={(t) => setGoalForm({ ...goalForm, name: t })}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Why it matters (optional)</Text>
            <VoiceInputButton onResult={(t) => setGoalForm({ ...goalForm, reason: t })} color={tabColor} />
          </View>
          <AppTextInput
            style={styles.input}
            placeholder="e.g. so the greens keep going through summer"
            value={goalForm.reason}
            onChangeText={(t) => setGoalForm({ ...goalForm, reason: t })}
          />
          <Text style={styles.helperText}>
            Worth writing down. It is what you read on the day the effort stops feeling worth it.
          </Text>

          <Text style={styles.label}>By when (optional)</Text>
          <View style={styles.inlineRow}>
            <AppTextInput
              style={[styles.input, styles.shortInput]}
              placeholder="YYYY-MM-DD"
              value={goalForm.targetDate}
              onChangeText={(t) => setGoalForm({ ...goalForm, targetDate: t })}
            />
            <TouchableOpacity style={styles.pillSmall} onPress={() => setGoalForm({ ...goalForm, targetDate: '' })}>
              <Text style={styles.pillTextSmall}>No date</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            With a date the app can work out what each cost means per month. Without one it will say so rather than
            invent a figure.
          </Text>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setGoalForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={saveGoal}>
              <Text style={styles.primaryButtonText}>Add it</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {goals.map(({ progress }) => {
        const { goal } = progress;
        const statusWord = STATUS_LABEL[goal.status] ?? '';
        return (
          <View key={goal.id} style={[styles.card, goal.status !== 'active' && styles.dimmed]}>
            <Text style={styles.cardTitle}>
              {goal.name}
              {statusWord ? ` · ${statusWord}` : ''}
            </Text>
            {goal.reason ? <Text style={styles.reasonText}>{goal.reason}</Text> : null}
            <Text style={styles.bodyText}>{describeGoalProgress(progress)}</Text>
            {goal.targetDate ? (
              <Text style={styles.footnote}>Aiming for {goal.targetDate}.</Text>
            ) : progress.costsTotal > 0 ? (
              <Text style={styles.footnote}>No date set, so there is no per-month figure for this one.</Text>
            ) : null}

            {progress.costs.map((entry) => {
              const paceResult = pace(entry, goal.targetDate, todayLocal());
              const paceText = describePace(entry, paceResult);
              const overdue = !isPaceRefusal(paceResult) && paceResult.overdue;
              return (
                <View key={entry.cost.id} style={styles.costBlock}>
                  <View style={styles.costHeadRow}>
                    <Text style={styles.costLabel}>
                      {entry.cost.label}
                      <Text style={styles.costKind}> · {goalCostKindLabel(entry.cost.kind).toLowerCase()}</Text>
                    </Text>
                    {entry.met ? <Text style={styles.metTag}>met</Text> : null}
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        entry.met && styles.barFillMet,
                        { width: `${Math.max(2, Math.round(entry.fraction * 100))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.costMeta}>{describeCostProgress(entry)}</Text>
                  {(() => {
                    const sources = describeContributionSources(entry);
                    return sources ? (
                      <Text style={[styles.costMeta, entry.hasBothSources && styles.warn]}>{sources}</Text>
                    ) : null;
                  })()}
                  {paceText ? (
                    <Text style={[styles.costMeta, overdue && styles.warn]}>{paceText}</Text>
                  ) : null}
                  <View style={styles.costActions}>
                    {!entry.met || entry.cost.kind !== 'money' ? (
                      <TouchableOpacity
                        onPress={() =>
                          setContribForm({
                            costId: entry.cost.id,
                            kind: entry.cost.kind,
                            unit: entry.cost.unit,
                            amount: '',
                            occurredOn: todayLocal(),
                            note: '',
                          })
                        }
                      >
                        <Text style={styles.actionText}>Record what went in</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() =>
                        setConfirm({
                          title: `Remove ${entry.cost.label}?`,
                          message:
                            'This removes the cost and everything recorded against it. The goal itself stays, and its other costs are untouched.',
                          actions: [
                            {
                              label: 'Remove',
                              destructive: true,
                              onPress: async () => {
                                setConfirm(null);
                                await deleteGoalCost(entry.cost.id);
                                load();
                              },
                            },
                            { label: 'Keep it', onPress: () => setConfirm(null) },
                          ],
                        })
                      }
                    >
                      <Text style={styles.actionTextRemove}>Remove cost</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {contribForm && progress.costs.some((entry) => entry.cost.id === contribForm.costId) ? (
              <View style={styles.inlineForm}>
                <Text style={styles.label}>
                  How much went in
                  {contribForm.kind !== 'money' && contribForm.unit ? ` (${contribForm.unit})` : ''}
                </Text>
                <AppTextInput
                  style={[styles.input, styles.shortInput]}
                  placeholder={contribForm.kind === 'money' ? '0.00' : '0'}
                  keyboardType="decimal-pad"
                  value={contribForm.amount}
                  onChangeText={(t) => setContribForm({ ...contribForm, amount: t })}
                />
                <Text style={styles.label}>When</Text>
                <View style={styles.inlineRow}>
                  <AppTextInput
                    style={[styles.input, styles.shortInput]}
                    placeholder="YYYY-MM-DD"
                    value={contribForm.occurredOn}
                    onChangeText={(t) => setContribForm({ ...contribForm, occurredOn: t })}
                  />
                  <TouchableOpacity
                    style={styles.pillSmall}
                    onPress={() => setContribForm({ ...contribForm, occurredOn: todayLocal() })}
                  >
                    <Text style={styles.pillTextSmall}>Today</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setContribForm(null)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveContribution}>
                    <Text style={styles.primaryButtonText}>Record it</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {costForm && costForm.goalId === goal.id ? (
              <View style={styles.inlineForm}>
                <Text style={styles.label}>What kind of cost</Text>
                <PopoverSelect
                  options={KIND_OPTIONS}
                  selected={costForm.kind}
                  onSelect={(value) =>
                    setCostForm({
                      ...costForm,
                      kind: value as GoalCostKind,
                      unit: defaultUnitFor(value as GoalCostKind),
                    })
                  }
                  tabColor={tabColor}
                />
                <Text style={styles.helperText}>
                  {GOAL_COST_KINDS.find((entry) => entry.code === costForm.kind)?.help}
                </Text>

                <Text style={styles.label}>What is it</Text>
                <AppTextInput
                  style={styles.input}
                  placeholder={costForm.kind === 'time' ? 'e.g. Building it' : 'e.g. Lumber'}
                  value={costForm.label}
                  onChangeText={(t) => setCostForm({ ...costForm, label: t })}
                />

                <Text style={styles.label}>How much it takes</Text>
                <View style={styles.inlineRow}>
                  <AppTextInput
                    style={[styles.input, styles.tinyInput]}
                    placeholder={costForm.kind === 'money' ? '0.00' : '0'}
                    keyboardType="decimal-pad"
                    value={costForm.target}
                    onChangeText={(t) => setCostForm({ ...costForm, target: t })}
                  />
                  {costForm.kind !== 'money' ? (
                    <AppTextInput
                      style={[styles.input, styles.tinyInput]}
                      placeholder="hours"
                      value={costForm.unit}
                      onChangeText={(t) => setCostForm({ ...costForm, unit: t })}
                    />
                  ) : null}
                </View>
                {costForm.kind !== 'money' ? (
                  <Text style={styles.helperText}>
                    Whatever you count it in. Everything recorded against this cost is in that same unit, so nothing has
                    to be converted.
                  </Text>
                ) : null}

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setCostForm(null)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveCost}>
                    <Text style={styles.primaryButtonText}>Add this cost</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.goalActions}>
              {!costForm ? (
                <TouchableOpacity
                  onPress={() =>
                    setCostForm({ goalId: goal.id, kind: 'money', label: '', target: '', unit: '' })
                  }
                >
                  <Text style={styles.actionText}>+ Add a cost</Text>
                </TouchableOpacity>
              ) : null}
              {goal.status === 'active' ? (
                <>
                  <TouchableOpacity onPress={async () => { await setGoalStatus(goal.id, 'reached'); load(); }}>
                    <Text style={styles.actionText}>Mark reached</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await setGoalStatus(goal.id, 'given_up'); load(); }}>
                    <Text style={styles.actionText}>Set aside</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={async () => { await setGoalStatus(goal.id, 'active'); load(); }}>
                  <Text style={styles.actionText}>Pick it back up</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  setConfirm({
                    title: `Delete ${goal.name}?`,
                    message:
                      'This removes the goal, every cost on it, and everything recorded against them. It cannot be undone. If you have just stopped for now, Set aside keeps all of it.',
                    actions: [
                      {
                        label: 'Delete',
                        destructive: true,
                        onPress: async () => {
                          setConfirm(null);
                          await deleteGoal(goal.id);
                          load();
                        },
                      },
                      { label: 'Keep it', onPress: () => setConfirm(null) },
                    ],
                  })
                }
              >
                <Text style={styles.actionTextRemove}>Delete</Text>
              </TouchableOpacity>
            </View>

            {progress.costsTotal === 0 ? (
              <Text style={styles.footnote}>
                Add at least one cost and this goal starts being something the app can follow. Until then it is a note.
              </Text>
            ) : null}
          </View>
        );
      })}

      {goals.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why there is no single percentage</Text>
          <Text style={styles.bodyText}>
            A goal needing {formatGoalAmount('money', 500, '')} and {formatGoalAmount('time', 20, 'hours')}, with half of
            each in, is not half done. It is half funded and half worked, and those are two separate facts. Money with no
            hours behind it is not halfway either: the money is finished and the work has not started.
          </Text>
          <Text style={styles.footnote}>
            So each cost is tracked in its own unit and nothing is ever turned into anything else. What the app tells you
            instead is how many costs are met and which one is furthest behind, which is what actually says whether the
            thing in your way is money or a weekend.
          </Text>
        </View>
      ) : null}
    </>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    panelStandalone: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    dimmed: { opacity: 0.6 },
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    reasonText: { ...typography.body, color: colors.textPrimary, marginBottom: 8, fontStyle: 'italic', ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    warn: { color: colors.danger },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    shortInput: { maxWidth: 160 },
    tinyInput: { maxWidth: 110, flex: 1 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineForm: {
      marginTop: 12, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 12,
      borderRadius: 10, backgroundColor: colors.surfaceMuted,
      borderLeftWidth: 3, borderLeftColor: tabColor,
    },

    costBlock: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    costHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
    costLabel: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
    costKind: { ...typography.caption, color: colors.textMuted, ...textShadow },
    metTag: { ...typography.caption, color: colors.statusGood, ...textShadow },
    costMeta: { ...typography.caption, color: colors.textMuted, marginTop: 4, ...textShadow },
    barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginTop: 6 },
    barFill: { height: 8, borderRadius: 4, backgroundColor: tabColor },
    barFillMet: { backgroundColor: colors.statusGood },
    costActions: { flexDirection: 'row', gap: 14, marginTop: 8, flexWrap: 'wrap' },
    goalActions: { flexDirection: 'row', gap: 14, marginTop: 14, flexWrap: 'wrap' },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    pillSmall: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    },
    pillTextSmall: { ...typography.caption, color: colors.textPrimary, ...textShadow },
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
