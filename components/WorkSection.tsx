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
import { WORK_PROMPT_COUNT, WORK_PROMPT_GROUPS } from '../constants/workBenefitPrompts';
import {
  BENEFIT_KINDS,
  benefitStanding,
  describeBenefitStanding,
  describeMatchGap,
  describeWorkSummary,
  formatBenefitAmount,
  matchGap,
  summarizeWork,
  type Benefit,
  type BenefitKind,
  type ResetCadence,
} from '../lib/workBenefits';
import {
  NO_SCORE_NOTE,
  SCALE_LABELS,
  SCALE_MAX,
  SCALE_MIN,
  SDT_ATTRIBUTION,
  WORK_DIMENSIONS,
  buildWorkTrend,
  describeDimensionTrend,
  describeWorkTrend,
  dimensionLabel,
  type WorkCheckin,
} from '../lib/workMeaning';
import {
  deleteBenefit,
  getWorkCheckinForWeek,
  listBenefits,
  listWorkCheckins,
  recordBenefitUse,
  rollBenefitPeriod,
  saveWorkCheckin,
  upsertBenefit,
} from '../lib/workDb';
import { parsePriceInput } from '../lib/groceryList';

// Work: what it gives you, and how it is actually going.
//
// Life's second area, 2026-09-05, which is what the tab was built for. Its
// lens list is meant to read as a list of AREAS rather than a pile of views
// belonging to one of them, and until now there was only Finances to test that
// against.
//
// Four sections, because the request had two halves and each needs both a
// place to look and a place to enter:
//
//   Overview   what is about to be lost, and what is being declined
//   What I Get the allowances and matches someone has recorded
//   Worth Asking the questions, which claim nothing
//   How It Feels the weekly four answers, and their direction
//
// The rule running through all of it: this app does not know what anyone is
// entitled to. It holds what they found out and counts it down.

type Props = { tabColor: string };
type Section = 'overview' | 'have' | 'ask' | 'feel';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'have', label: 'What I Get' },
  { key: 'ask', label: 'Worth Asking' },
  { key: 'feel', label: 'How It Feels' },
];

const KIND_OPTIONS = BENEFIT_KINDS.map((kind) => ({ label: kind.label, value: kind.code }));
const RESET_OPTIONS = [
  { label: 'Resets every year', value: 'yearly' },
  { label: 'Resets every month', value: 'monthly' },
  { label: 'Never resets', value: 'never' },
];

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type BenefitForm = {
  id: string | null;
  name: string;
  kind: BenefitKind;
  total: string;
  used: string;
  resets: ResetCadence;
  resetOn: string;
  notes: string;
};

function blankBenefitForm(): BenefitForm {
  return { id: null, name: '', kind: 'allowance', total: '', used: '', resets: 'yearly', resetOn: '', notes: '' };
}

type CheckinForm = { autonomy: number; competence: number; relatedness: number; drain: number; note: string };

export function WorkSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [section, setSection] = useState<Section>('overview');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [checkins, setCheckins] = useState<WorkCheckin[]>([]);
  const [thisWeek, setThisWeek] = useState<WorkCheckin | null>(null);
  const [loading, setLoading] = useState(false);
  const [benefitForm, setBenefitForm] = useState<BenefitForm | null>(null);
  const [useForm, setUseForm] = useState<{ id: string; kind: BenefitKind; amount: string } | null>(null);
  const [checkinForm, setCheckinForm] = useState<CheckinForm | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listBenefits(), listWorkCheckins(), getWorkCheckinForWeek(todayLocal())])
      .then(([benefitRows, checkinRows, current]) => {
        setBenefits(benefitRows);
        setCheckins(checkinRows);
        setThisWeek(current);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summary = useMemo(() => summarizeWork(benefits, todayLocal()), [benefits]);
  const trend = useMemo(() => buildWorkTrend(checkins), [checkins]);

  async function saveBenefit() {
    if (!benefitForm) return;
    const form = benefitForm;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you will recognise, like "Dental max" or "Retirement match".');
      return;
    }
    if (form.kind !== 'perk') {
      const total = parsePriceInput(form.total);
      if (total == null || total <= 0) {
        showInfoAlert(
          'Almost there',
          form.kind === 'match'
            ? 'Enter the point past which they stop matching, as a percentage.'
            : 'Enter how much there is altogether.',
        );
        return;
      }
    }
    if (form.resets !== 'never' && form.resetOn.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.resetOn.trim())) {
      showInfoAlert('Almost there', 'Enter the reset date as YYYY-MM-DD, or leave it blank if you do not know it.');
      return;
    }

    await upsertBenefit({
      id: form.id ?? undefined,
      name: form.name,
      kind: form.kind,
      total: form.kind === 'perk' ? null : parsePriceInput(form.total),
      used: form.used.trim() ? parsePriceInput(form.used) ?? 0 : 0,
      resets: form.resets,
      resetOn: form.resetOn.trim() || null,
      notes: form.notes,
    });
    setBenefitForm(null);
    load();
  }

  async function saveUse() {
    if (!useForm) return;
    const amount = parsePriceInput(useForm.amount);
    if (amount == null || amount < 0) {
      showInfoAlert('Almost there', 'Enter an amount.');
      return;
    }
    await recordBenefitUse(useForm.id, amount);
    setUseForm(null);
    load();
  }

  async function saveCheckin() {
    if (!checkinForm) return;
    await saveWorkCheckin({ date: todayLocal(), ...checkinForm });
    setCheckinForm(null);
    load();
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

      <View style={styles.pillRow}>
        {SECTIONS.map((entry) => (
          <TouchableOpacity
            key={entry.key}
            style={[styles.pill, section === entry.key && styles.pillActive]}
            onPress={() => setSection(entry.key)}
          >
            <Text style={[styles.pillText, section === entry.key && styles.pillTextActive]}>{entry.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === 'overview' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What your work gives you</Text>
            <Text style={styles.bodyText}>{describeWorkSummary(summary)}</Text>
            {summary.recorded === 0 ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setSection('ask')}>
                <Text style={styles.primaryButtonText}>Start with the questions</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {summary.expiringUnused.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About to go</Text>
              {summary.expiringUnused.map((standing) => (
                <View key={standing.benefit.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{standing.benefit.name}</Text>
                    <Text style={[styles.rowMeta, styles.warn]}>{describeBenefitStanding(standing)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {summary.matchesShort.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Money you are turning down</Text>
              {summary.matchesShort.map(({ benefit, gap }) => (
                <View key={benefit.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{benefit.name}</Text>
                    <Text style={[styles.rowMeta, styles.warn]}>{describeMatchGap(gap)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>How work has been going</Text>
            <Text style={styles.bodyText}>{describeWorkTrend(trend)}</Text>
            {!thisWeek ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setSection('feel');
                  setCheckinForm({ autonomy: 3, competence: 3, relatedness: 3, drain: 3, note: '' });
                }}
              >
                <Text style={styles.primaryButtonText}>Answer for this week</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.footnote}>This week is answered. Come back next week.</Text>
            )}
          </View>
        </>
      ) : null}

      {section === 'have' ? (
        <>
          {!benefitForm ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setBenefitForm(blankBenefitForm())}>
              <Text style={styles.primaryButtonText}>+ Add something you get</Text>
            </TouchableOpacity>
          ) : null}

          {benefitForm ? (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>What is it</Text>
                <VoiceInputButton onResult={(t) => setBenefitForm({ ...benefitForm, name: t })} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Dental max"
                value={benefitForm.name}
                onChangeText={(t) => setBenefitForm({ ...benefitForm, name: t })}
              />

              <Text style={styles.label}>What kind of thing</Text>
              <PopoverSelect
                options={KIND_OPTIONS}
                selected={benefitForm.kind}
                onSelect={(value) =>
                  setBenefitForm({
                    ...benefitForm,
                    kind: value as BenefitKind,
                    // A perk has no numbers, and a match never resets, so
                    // switching clears what no longer applies rather than
                    // leaving a stale value to be saved and ignored.
                    total: value === 'perk' ? '' : benefitForm.total,
                    used: value === 'perk' ? '' : benefitForm.used,
                    resets: value === 'perk' || value === 'match' ? 'never' : benefitForm.resets,
                  })
                }
                tabColor={tabColor}
              />
              <Text style={styles.helperText}>
                {BENEFIT_KINDS.find((entry) => entry.code === benefitForm.kind)?.help}
              </Text>

              {benefitForm.kind !== 'perk' ? (
                <>
                  <Text style={styles.label}>
                    {benefitForm.kind === 'match' ? 'They match up to' : 'How much there is'}
                  </Text>
                  <View style={styles.inlineRow}>
                    <AppTextInput
                      style={[styles.input, styles.tinyInput]}
                      placeholder={benefitForm.kind === 'match' ? '5' : '0'}
                      keyboardType="decimal-pad"
                      value={benefitForm.total}
                      onChangeText={(t) => setBenefitForm({ ...benefitForm, total: t })}
                    />
                    <AppTextInput
                      style={[styles.input, styles.tinyInput]}
                      placeholder={benefitForm.kind === 'match' ? 'you pay 3' : 'used so far'}
                      keyboardType="decimal-pad"
                      value={benefitForm.used}
                      onChangeText={(t) => setBenefitForm({ ...benefitForm, used: t })}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    {benefitForm.kind === 'match'
                      ? 'Both as a share of pay. This app will not ask what you earn, so it reports the gap as a share and never as an amount.'
                      : 'Whatever you have used already, if you know it.'}
                  </Text>
                </>
              ) : null}

              {benefitForm.kind !== 'perk' && benefitForm.kind !== 'match' ? (
                <>
                  <Text style={styles.label}>Does it reset</Text>
                  <PopoverSelect
                    options={RESET_OPTIONS}
                    selected={benefitForm.resets}
                    onSelect={(value) => setBenefitForm({ ...benefitForm, resets: value as ResetCadence })}
                    tabColor={tabColor}
                  />
                  {benefitForm.resets !== 'never' ? (
                    <>
                      <Text style={styles.label}>Next reset (optional)</Text>
                      <AppTextInput
                        style={[styles.input, styles.shortInput]}
                        placeholder="YYYY-MM-DD"
                        value={benefitForm.resetOn}
                        onChangeText={(t) => setBenefitForm({ ...benefitForm, resetOn: t })}
                      />
                      <Text style={styles.helperText}>
                        Without this nothing can count down, and the app will say so rather than guess a year end.
                      </Text>
                    </>
                  ) : null}
                </>
              ) : null}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setBenefitForm(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={saveBenefit}>
                  <Text style={styles.primaryButtonText}>{benefitForm.id ? 'Save changes' : 'Add it'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {benefits.length === 0 && !benefitForm ? (
            <View style={styles.card}>
              <Text style={styles.bodyText}>
                Nothing here yet. Worth Asking has the questions to take to whoever runs your benefits, and whatever
                comes back goes in here with its amount and its date.
              </Text>
            </View>
          ) : null}

          {benefits.map((benefit) => {
            const standing = benefitStanding(benefit, todayLocal());
            const gap = matchGap(benefit);
            return (
              <View key={benefit.id} style={[styles.card, !benefit.active && styles.dimmed]}>
                <Text style={styles.cardTitle}>{benefit.name}</Text>
                <Text style={styles.rowMeta}>
                  {BENEFIT_KINDS.find((entry) => entry.code === benefit.kind)?.label}
                </Text>

                {gap ? (
                  <Text style={[styles.bodyText, !gap.gettingFullMatch && styles.warn]}>{describeMatchGap(gap)}</Text>
                ) : (
                  <>
                    {standing.remaining != null && benefit.total != null && benefit.total > 0 ? (
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.max(2, Math.round(standing.fraction * 100))}%` }]} />
                      </View>
                    ) : null}
                    <Text style={[styles.bodyText, standing.expiringUnused && styles.warn]}>
                      {describeBenefitStanding(standing)}
                    </Text>
                  </>
                )}

                {useForm?.id === benefit.id ? (
                  <View style={styles.inlineForm}>
                    <Text style={styles.label}>
                      {benefit.kind === 'match' ? 'What you pay in now' : 'How much you just used'}
                    </Text>
                    <AppTextInput
                      style={[styles.input, styles.shortInput]}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      value={useForm.amount}
                      onChangeText={(t) => setUseForm({ ...useForm, amount: t })}
                    />
                    <View style={styles.formActions}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => setUseForm(null)}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={saveUse}>
                        <Text style={styles.primaryButtonText}>Record it</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={styles.rowActions}>
                  {benefit.kind !== 'perk' ? (
                    <TouchableOpacity onPress={() => setUseForm({ id: benefit.id, kind: benefit.kind, amount: '' })}>
                      <Text style={styles.actionText}>
                        {benefit.kind === 'match' ? 'Change what I pay in' : 'Record some used'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      setBenefitForm({
                        id: benefit.id,
                        name: benefit.name,
                        kind: benefit.kind,
                        total: benefit.total != null ? String(benefit.total) : '',
                        used: String(benefit.used),
                        resets: benefit.resets,
                        resetOn: benefit.resetOn ?? '',
                        notes: benefit.notes ?? '',
                      })
                    }
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  {benefit.kind !== 'perk' && benefit.kind !== 'match' && benefit.used > 0 ? (
                    <TouchableOpacity
                      onPress={() =>
                        setConfirm({
                          title: `Start ${benefit.name} again?`,
                          message:
                            'This sets what you have used back to zero, for a new period. Do it once the reset has actually happened, since it clears the record of the period just gone.',
                          actions: [
                            {
                              label: 'Start again',
                              onPress: async () => {
                                setConfirm(null);
                                await rollBenefitPeriod(benefit.id, benefit.resetOn);
                                load();
                              },
                            },
                            { label: 'Not yet', onPress: () => setConfirm(null) },
                          ],
                        })
                      }
                    >
                      <Text style={styles.actionText}>It reset</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      setConfirm({
                        title: `Remove ${benefit.name}?`,
                        message: 'This removes it and everything recorded against it.',
                        actions: [
                          {
                            label: 'Remove',
                            destructive: true,
                            onPress: async () => {
                              setConfirm(null);
                              await deleteBenefit(benefit.id);
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
            );
          })}
        </>
      ) : null}

      {section === 'ask' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Worth asking about</Text>
            <Text style={styles.bodyText}>
              {WORK_PROMPT_COUNT} questions to put to whoever runs your benefits. They are questions rather than a list
              of what you have, because what exists depends entirely on where you are and who you work for. This app
              will not tell you what you are entitled to. Ask, then put the answers in What I Get and it will keep track
              of the amounts and the dates.
            </Text>
          </View>

          {WORK_PROMPT_GROUPS.map((group) => {
            const open = openGroup === group.code;
            return (
              <View key={group.code} style={styles.card}>
                <TouchableOpacity onPress={() => setOpenGroup(open ? null : group.code)}>
                  <Text style={styles.cardTitle}>{group.label}</Text>
                  <Text style={styles.rowMeta}>{group.why}</Text>
                  <Text style={[styles.actionText, styles.spacedAction]}>
                    {open ? 'Hide the questions' : `Show the ${group.prompts.length} questions`}
                  </Text>
                </TouchableOpacity>
                {open
                  ? group.prompts.map((prompt) => (
                      <View key={prompt.ask} style={styles.row}>
                        <View style={styles.rowMain}>
                          <Text style={styles.rowTitle}>{prompt.ask}</Text>
                          {prompt.note ? <Text style={styles.rowMeta}>{prompt.note}</Text> : null}
                        </View>
                      </View>
                    ))
                  : null}
              </View>
            );
          })}
        </>
      ) : null}

      {section === 'feel' ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How work has been going</Text>
            <Text style={styles.bodyText}>{describeWorkTrend(trend)}</Text>
            <Text style={styles.footnote}>{SDT_ATTRIBUTION}</Text>
            <Text style={styles.footnote}>{NO_SCORE_NOTE}</Text>
            {!checkinForm ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  setCheckinForm(
                    thisWeek
                      ? {
                          autonomy: thisWeek.autonomy,
                          competence: thisWeek.competence,
                          relatedness: thisWeek.relatedness,
                          drain: thisWeek.drain,
                          note: thisWeek.note ?? '',
                        }
                      : { autonomy: 3, competence: 3, relatedness: 3, drain: 3, note: '' },
                  )
                }
              >
                <Text style={styles.primaryButtonText}>
                  {thisWeek ? 'Change this week' : 'Answer for this week'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {checkinForm ? (
            <View style={styles.formCard}>
              {WORK_DIMENSIONS.map((dimension) => (
                <View key={dimension.code}>
                  <Text style={styles.label}>{dimension.question}</Text>
                  <View style={styles.scaleRow}>
                    {Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, index) => SCALE_MIN + index).map((value) => {
                      const picked = checkinForm[dimension.code] === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          style={[styles.scaleButton, picked && styles.scaleButtonOn]}
                          onPress={() => setCheckinForm({ ...checkinForm, [dimension.code]: value })}
                        >
                          <Text style={picked ? styles.scaleTextOn : styles.scaleText}>{value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.helperText}>{SCALE_LABELS[checkinForm[dimension.code]]}</Text>
                </View>
              ))}

              <View style={styles.labelRow}>
                <Text style={styles.label}>Anything worth remembering (optional)</Text>
                <VoiceInputButton onResult={(t) => setCheckinForm({ ...checkinForm, note: t })} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. covered for two people all week"
                value={checkinForm.note}
                onChangeText={(t) => setCheckinForm({ ...checkinForm, note: t })}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setCheckinForm(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={saveCheckin}>
                  <Text style={styles.primaryButtonText}>Save this week</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {trend ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Each one over time</Text>
              {trend.dimensions.map((entry) => (
                <View key={entry.dimension} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{dimensionLabel(entry.dimension)}</Text>
                    <Text style={[styles.rowMeta, entry.improving === false && styles.warn]}>
                      {describeDimensionTrend(entry)}
                    </Text>
                  </View>
                </View>
              ))}
              <Text style={styles.footnote}>
                {formatBenefitAmount('days', trend.weeksCovered)} of weeks covered. Nothing here is compared against
                anyone else, because there is nobody to compare it to.
              </Text>
            </View>
          ) : null}
        </>
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
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    warn: { color: colors.danger },

    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    pill: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    },
    pillActive: { backgroundColor: tabColor, borderColor: tabColor },
    pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
    pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    shortInput: { maxWidth: 160 },
    tinyInput: { maxWidth: 120, flex: 1 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineForm: {
      marginTop: 12, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 10,
      backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: tabColor,
    },

    scaleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    scaleButton: {
      flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted,
    },
    scaleButtonOn: { backgroundColor: tabColor, borderColor: tabColor },
    scaleText: { ...typography.body, color: colors.textPrimary, ...textShadow },
    scaleTextOn: { ...typography.body, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    rowActions: { flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    spacedAction: { marginTop: 8 },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginVertical: 8 },
    barFill: { height: 8, borderRadius: 4, backgroundColor: tabColor },

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
