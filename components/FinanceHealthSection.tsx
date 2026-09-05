import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getTrackedConditionsWithNames } from '../lib/foodPersonalization';
import {
  checkBill,
  describeConditionCosts,
  describeHealthAccount,
  describePlanStanding,
  formatHealthMoney,
  healthAccountStanding,
  planStanding,
  rollUpConditionCosts,
  type ConditionCost,
  type HealthAccount,
  type InsurancePlan,
  type MedicalBill,
} from '../lib/financeHealth';
import {
  createMedicalBill,
  deleteMedicalBill,
  getHealthMoneySnapshot,
  setMedicalBillStatus,
  upsertHealthAccount,
  upsertInsurancePlan,
} from '../lib/financeHealthDb';
import { monthlyFactor, parseDueRule } from '../lib/financeSchedule';
import { LEGACY_CADENCE_MONTHLY } from '../lib/financeCore';
import { parsePriceInput } from '../lib/groceryList';

// The health-money half of Finances, 2026-09-05. Pulled into its own
// component rather than added to app/(tabs)/life.tsx because it is a
// self-contained subject with its own data, and life.tsx already carries
// the budgeting half.
//
// What this answers, and what a general finance app cannot:
//
//   Where am I against my deductible and out-of-pocket maximum. That is
//   the figure that decides whether a scan happens this year or next.
//
//   Is my FSA about to be forfeited. Use-it-or-lose-it money is a pure
//   loss that a date on a screen prevents.
//
//   Does this bill match the Explanation of Benefits. See checkBill in
//   lib/financeHealth.ts: the provider's billed amount is deliberately not
//   part of that equation, because billed above allowed is written off
//   under the plan's contract and is not money anyone owes.
//
//   What has a condition actually cost. Assembled from bills, repeating
//   costs, one-offs and therapy sessions that carry a condition tag.
//   Nothing is inferred: an untagged cost is reported as untagged rather
//   than divided across whichever conditions someone happens to track.

type Props = { tabColor: string };

type Form = 'plan' | 'bill' | 'account' | null;

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shortDate(value: string): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [, m, d] = value.slice(0, 10).split('-').map(Number);
  return names[m - 1] ? `${names[m - 1]} ${d}` : value.slice(0, 10);
}

/**
 * Whole months from `since` up to and including the current one.
 *
 * A repeating cost is counted at its monthly value times this, because a
 * $45 monthly prescription eight months into a year is $360 and showing
 * $45 would answer a question nobody asked. The current month counts as a
 * whole one: it has already been paid for.
 */
function monthsElapsedSince(since: string): number {
  const [sy, sm] = since.slice(0, 7).split('-').map(Number);
  const now = new Date();
  if (!sy || !sm) return 1;
  const months = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm) + 1;
  return Math.max(1, months);
}

const ACCOUNT_KIND_OPTIONS = [
  { label: 'FSA (use it or lose it)', value: 'fsa' },
  { label: 'HSA (rolls over)', value: 'hsa' },
];

export function FinanceHealthSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [plan, setPlan] = useState<InsurancePlan | null>(null);
  const [bills, setBills] = useState<MedicalBill[]>([]);
  const [accounts, setAccounts] = useState<HealthAccount[]>([]);
  const [costs, setCosts] = useState<ConditionCost[]>([]);
  const [conditions, setConditions] = useState<{ code: string; name: string }[]>([]);
  const [openForm, setOpenForm] = useState<Form>(null);
  const [loading, setLoading] = useState(false);

  // The year so far is the window everything here is measured over: a
  // deductible resets annually, an FSA expires annually, and "what has this
  // cost me" is almost always asked about a year.
  const since = useMemo(() => `${new Date().getFullYear()}-01-01`, []);

  const [planForm, setPlanForm] = useState({ name: '', yearStart: since, deductible: '', oopMax: '', metDeductible: '', metOop: '' });
  const [billForm, setBillForm] = useState({
    serviceDate: todayLocal(), provider: '', description: '', billed: '', allowed: '',
    insurancePaid: '', youOwe: '', appliedDeductible: '', conditionCode: '',
  });
  const [accountForm, setAccountForm] = useState({ kind: 'fsa', planYear: String(new Date().getFullYear()), contributed: '', spent: '', deadline: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getHealthMoneySnapshot(since), getTrackedConditionsWithNames()])
      .then(([snapshot, userConditions]) => {
        setPlan(snapshot.plan);
        setBills(snapshot.bills);
        setAccounts(snapshot.accounts);
        setConditions(userConditions.map((c) => ({ code: c.code, name: c.name })));

        // Repeating costs are scaled here rather than in SQL, so the
        // rule-derived monthly factor stays in one place.
        const months = monthsElapsedSince(since);
        const fromRecurring: ConditionCost[] = snapshot.costInputs.recurringTagged.map((row) => {
          const rule = parseDueRule(row.ruleJson);
          const factor = rule ? monthlyFactor(rule) : (LEGACY_CADENCE_MONTHLY[row.legacyCadence] ?? 0);
          return { amount: row.amount * factor * months, conditionCode: row.conditionCode, source: 'recurring' };
        });

        setCosts([
          ...snapshot.costInputs.fromBills,
          ...snapshot.costInputs.fromEntries,
          ...snapshot.costInputs.fromTherapies,
          ...fromRecurring,
        ]);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [since, showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const standing = useMemo(() => (plan ? planStanding(plan, bills) : null), [plan, bills]);
  const rollup = useMemo(() => rollUpConditionCosts(costs), [costs]);
  const conditionName = useCallback(
    (code: string) => conditions.find((c) => c.code === code)?.name ?? code,
    [conditions],
  );
  const conditionOptions = useMemo(
    () => [{ label: 'Not for a tracked condition', value: '' }, ...conditions.map((c) => ({ label: c.name, value: c.code }))],
    [conditions],
  );

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const num = (raw: string): number | null => (raw.trim() ? parsePriceInput(raw) : null);

  async function savePlan() {
    if (!planForm.name.trim()) { showInfoAlert('Almost there', 'Give the plan a name you will recognize.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(planForm.yearStart)) { showInfoAlert('Almost there', 'Enter the date your plan year starts (YYYY-MM-DD).'); return; }
    await upsertInsurancePlan({
      id: plan?.id,
      name: planForm.name,
      yearStart: planForm.yearStart,
      deductible: num(planForm.deductible),
      outOfPocketMax: num(planForm.oopMax),
      deductibleMetAtStart: num(planForm.metDeductible) ?? 0,
      outOfPocketMetAtStart: num(planForm.metOop) ?? 0,
    });
    setOpenForm(null);
    load();
  }

  async function saveBill() {
    if (!billForm.provider.trim()) { showInfoAlert('Almost there', 'Who was this bill from?'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(billForm.serviceDate)) { showInfoAlert('Almost there', 'Enter the date of the service (YYYY-MM-DD).'); return; }
    const owed = num(billForm.youOwe);
    await createMedicalBill({
      serviceDate: billForm.serviceDate,
      provider: billForm.provider,
      description: billForm.description,
      billed: num(billForm.billed),
      allowed: num(billForm.allowed),
      insurancePaid: num(billForm.insurancePaid),
      youOwe: owed,
      appliedToDeductible: num(billForm.appliedDeductible),
      // Anything that counts toward the deductible also counts toward the
      // out-of-pocket maximum, which is true on every plan; what does not
      // hold in reverse is copays, so this only ever fills the one
      // direction that is safe to assume.
      appliedToOutOfPocket: num(billForm.appliedDeductible),
      conditionCode: billForm.conditionCode || null,
    });
    setBillForm({ ...billForm, provider: '', description: '', billed: '', allowed: '', insurancePaid: '', youOwe: '', appliedDeductible: '' });
    setOpenForm(null);
    load();
  }

  async function saveAccount() {
    const contributed = num(accountForm.contributed);
    if (contributed == null) { showInfoAlert('Almost there', 'Enter how much has gone into it this year.'); return; }
    await upsertHealthAccount({
      kind: accountForm.kind as 'hsa' | 'fsa',
      planYear: accountForm.planYear,
      contributed,
      spent: num(accountForm.spent) ?? 0,
      deadline: accountForm.kind === 'fsa' && /^\d{4}-\d{2}-\d{2}$/.test(accountForm.deadline) ? accountForm.deadline : null,
    });
    setOpenForm(null);
    load();
  }

  function renderBar(label: string, met: number, limit: number | null, fraction: number | null) {
    return (
      <View style={styles.barRow}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={styles.barValue}>
            {formatHealthMoney(met)}
            {limit != null ? ` of ${formatHealthMoney(limit)}` : ''}
          </Text>
        </View>
        <View style={styles.barTrack}>
          {fraction != null ? <View style={[styles.barFill, { width: `${Math.max(2, Math.round(fraction * 100))}%` }]} /> : null}
        </View>
      </View>
    );
  }

  if (loading) {
    return <Text style={[styles.bodyText, styles.panelStandalone]}>Adding up your health costs…</Text>;
  }

  return (
    <>
      {infoAlertElement}

      {/* Where you stand with the plan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your plan this year</Text>
        {standing && plan ? (
          <>
            {renderBar('Deductible', standing.deductible.met, standing.deductible.limit, standing.deductible.fraction)}
            {renderBar('Out-of-pocket max', standing.outOfPocket.met, standing.outOfPocket.limit, standing.outOfPocket.fraction)}
            <Text style={styles.bodyText}>{describePlanStanding(standing)}</Text>
            <TouchableOpacity onPress={() => { setPlanForm({
              name: plan.name, yearStart: plan.yearStart,
              deductible: plan.deductible != null ? String(plan.deductible) : '',
              oopMax: plan.outOfPocketMax != null ? String(plan.outOfPocketMax) : '',
              metDeductible: String(plan.deductibleMetAtStart), metOop: String(plan.outOfPocketMetAtStart),
            }); setOpenForm('plan'); }}>
              <Text style={styles.actionText}>Edit plan</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.bodyText}>
              Add your deductible and out-of-pocket maximum and this shows where you stand as bills come in. It is the
              figure that decides whether something can wait until next year or is better done now.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setOpenForm('plan')}>
              <Text style={styles.primaryButtonText}>Add my plan</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {openForm === 'plan' ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>Plan name</Text>
          <AppTextInput style={styles.input} placeholder="e.g. Employer PPO" value={planForm.name}
            onChangeText={(t) => setPlanForm({ ...planForm, name: t })} />
          <Text style={styles.label}>Plan year starts</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="YYYY-MM-DD" value={planForm.yearStart}
            onChangeText={(t) => setPlanForm({ ...planForm, yearStart: t })} />
          <Text style={styles.helperText}>Many plan years do not start in January, so this is asked rather than assumed.</Text>
          <Text style={styles.label}>Deductible</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={planForm.deductible} onChangeText={(t) => setPlanForm({ ...planForm, deductible: t })} />
          <Text style={styles.label}>Out-of-pocket maximum</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={planForm.oopMax} onChangeText={(t) => setPlanForm({ ...planForm, oopMax: t })} />
          <Text style={styles.label}>Already met before you started tracking</Text>
          <View style={styles.inlineRow}>
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="Deduct." keyboardType="decimal-pad"
              value={planForm.metDeductible} onChangeText={(t) => setPlanForm({ ...planForm, metDeductible: t })} />
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="OOP" keyboardType="decimal-pad"
              value={planForm.metOop} onChangeText={(t) => setPlanForm({ ...planForm, metOop: t })} />
          </View>
          <Text style={styles.helperText}>
            Read these off your insurer’s site if you are starting partway through the year, so the bars start where you
            actually are rather than at zero.
          </Text>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpenForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={savePlan}>
              <Text style={styles.primaryButtonText}>Save plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* HSA and FSA */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HSA & FSA</Text>
        {accounts.length === 0 ? (
          <Text style={styles.bodyText}>
            If you have an FSA, add it. That money is forfeited if it is not spent by your plan’s deadline, and a date on
            a screen is the whole difference between using it and losing it.
          </Text>
        ) : (
          accounts.map((account) => {
            const s = healthAccountStanding(account, todayLocal());
            return (
              <View key={account.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>
                    {account.kind === 'fsa' ? 'FSA' : 'HSA'} · {account.planYear}
                  </Text>
                  <Text style={s.atRiskOfForfeit ? styles.warnText : styles.listMeta}>{describeHealthAccount(s)}</Text>
                </View>
                <Text style={styles.listAmount}>{formatHealthMoney(s.available)}</Text>
              </View>
            );
          })
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setOpenForm('account')}>
          <Text style={styles.primaryButtonText}>+ Add an account</Text>
        </TouchableOpacity>
      </View>

      {openForm === 'account' ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>Which kind</Text>
          <PopoverSelect options={ACCOUNT_KIND_OPTIONS} selected={accountForm.kind}
            onSelect={(v) => setAccountForm({ ...accountForm, kind: v })} tabColor={tabColor} />
          <Text style={styles.label}>Plan year</Text>
          <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="2026" keyboardType="number-pad" maxLength={4}
            value={accountForm.planYear} onChangeText={(t) => setAccountForm({ ...accountForm, planYear: t })} />
          <Text style={styles.label}>Put in so far</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={accountForm.contributed} onChangeText={(t) => setAccountForm({ ...accountForm, contributed: t })} />
          <Text style={styles.label}>Spent so far</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={accountForm.spent} onChangeText={(t) => setAccountForm({ ...accountForm, spent: t })} />
          {accountForm.kind === 'fsa' ? (
            <>
              <Text style={styles.label}>Spend it by</Text>
              <AppTextInput style={[styles.input, styles.shortInput]} placeholder="YYYY-MM-DD" value={accountForm.deadline}
                onChangeText={(t) => setAccountForm({ ...accountForm, deadline: t })} />
              <Text style={styles.helperText}>Often the end of the plan year, sometimes with a grace period. Check your plan.</Text>
            </>
          ) : (
            <Text style={styles.helperText}>An HSA has no deadline. The money is yours and rolls over indefinitely.</Text>
          )}
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpenForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={saveAccount}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* What each condition costs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What each condition costs</Text>
        <Text style={styles.bodyText}>{describeConditionCosts(rollup, conditionName)}</Text>
        {rollup.byCondition.map((entry) => (
          <View key={entry.conditionCode} style={styles.listRow}>
            <View style={styles.listMain}>
              <Text style={styles.listTitle}>{conditionName(entry.conditionCode)}</Text>
              <Text style={styles.listMeta}>
                {Object.entries(entry.bySource)
                  .map(([source, amount]) => `${SOURCE_LABELS[source] ?? source} ${formatHealthMoney(amount)}`)
                  .join(' · ')}
              </Text>
            </View>
            <Text style={styles.listAmount}>{formatHealthMoney(entry.total)}</Text>
          </View>
        ))}
        {rollup.untagged > 0 ? (
          <Text style={styles.footnote}>
            {formatHealthMoney(rollup.untagged)} of health spending is not tagged to a condition. It is shown here on its
            own rather than divided between them, because splitting it would turn one honest figure into several invented
            ones.
          </Text>
        ) : null}
      </View>

      {/* Bills */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medical bills</Text>
        {bills.length === 0 ? (
          <Text style={styles.bodyText}>
            Add a bill with the figures from its Explanation of Benefits and this checks the arithmetic: what your plan
            allowed, minus what insurance paid, is what you owe. What the provider billed is not part of that, and
            treating it as if it were is the most common way people end up paying more than they should.
          </Text>
        ) : (
          bills.map((bill) => {
            const result = checkBill(bill);
            return (
              <View key={bill.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{bill.provider}</Text>
                  <Text style={styles.listMeta}>
                    {shortDate(bill.serviceDate)}
                    {bill.description ? ` · ${bill.description}` : ''}
                    {bill.conditionCode ? ` · ${conditionName(bill.conditionCode)}` : ''}
                    {bill.status !== 'unpaid' ? ` · ${bill.status}` : ''}
                  </Text>
                  <Text style={result.balances ? styles.listMeta : styles.warnText}>{result.message}</Text>
                  <View style={styles.listActions}>
                    {bill.status !== 'paid' ? (
                      <TouchableOpacity onPress={async () => { await setMedicalBillStatus(bill.id, 'paid', bill.youOwe); load(); }}>
                        <Text style={styles.actionText}>Mark paid</Text>
                      </TouchableOpacity>
                    ) : null}
                    {bill.status !== 'disputed' ? (
                      <TouchableOpacity onPress={async () => { await setMedicalBillStatus(bill.id, 'disputed', null); load(); }}>
                        <Text style={styles.actionText}>Dispute</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={async () => { await deleteMedicalBill(bill.id); load(); }}>
                      <Text style={styles.actionTextRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.listAmount}>{bill.youOwe != null ? formatHealthMoney(bill.youOwe) : '—'}</Text>
              </View>
            );
          })
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setOpenForm('bill')}>
          <Text style={styles.primaryButtonText}>+ Add a bill</Text>
        </TouchableOpacity>
      </View>

      {openForm === 'bill' ? (
        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Who from</Text>
            <VoiceInputButton onResult={(t) => setBillForm({ ...billForm, provider: t })} color={tabColor} />
          </View>
          <AppTextInput style={styles.input} placeholder="e.g. Riverside Endocrinology" value={billForm.provider}
            onChangeText={(t) => setBillForm({ ...billForm, provider: t })} />

          <Text style={styles.label}>Date of service</Text>
          <View style={styles.inlineRow}>
            <AppTextInput style={[styles.input, styles.shortInput]} placeholder="YYYY-MM-DD" value={billForm.serviceDate}
              onChangeText={(t) => setBillForm({ ...billForm, serviceDate: t })} />
            <TouchableOpacity style={styles.pillSmall} onPress={() => setBillForm({ ...billForm, serviceDate: todayLocal() })}>
              <Text style={styles.pillTextSmall}>Today</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>What it was for</Text>
          <AppTextInput style={styles.input} placeholder="e.g. thyroid panel" value={billForm.description}
            onChangeText={(t) => setBillForm({ ...billForm, description: t })} />

          <Text style={styles.label}>Which condition</Text>
          <PopoverSelect options={conditionOptions} selected={billForm.conditionCode}
            onSelect={(v) => setBillForm({ ...billForm, conditionCode: v })} tabColor={tabColor} />
          <Text style={styles.helperText}>Only tag it if it really was for that condition. Untagged is fine and is counted honestly.</Text>

          <Text style={styles.label}>From the Explanation of Benefits</Text>
          <View style={styles.inlineRow}>
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="Billed" keyboardType="decimal-pad"
              value={billForm.billed} onChangeText={(t) => setBillForm({ ...billForm, billed: t })} />
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="Allowed" keyboardType="decimal-pad"
              value={billForm.allowed} onChangeText={(t) => setBillForm({ ...billForm, allowed: t })} />
          </View>
          <View style={styles.inlineRow}>
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="Plan paid" keyboardType="decimal-pad"
              value={billForm.insurancePaid} onChangeText={(t) => setBillForm({ ...billForm, insurancePaid: t })} />
            <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="You owe" keyboardType="decimal-pad"
              value={billForm.youOwe} onChangeText={(t) => setBillForm({ ...billForm, youOwe: t })} />
          </View>
          <Text style={styles.helperText}>
            Billed is the provider’s list price and allowed is what your plan’s contract says it is worth. The gap
            between them is written off, not owed by you.
          </Text>

          <Text style={styles.label}>Counted toward your deductible</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={billForm.appliedDeductible} onChangeText={(t) => setBillForm({ ...billForm, appliedDeductible: t })} />
          <Text style={styles.helperText}>The EOB states this. It is read off rather than worked out, because which services count is plan-specific.</Text>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setOpenForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={saveBill}>
              <Text style={styles.primaryButtonText}>Add bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  medicalBill: 'bills',
  recurring: 'repeating',
  entry: 'one-offs',
  therapy: 'therapies',
};

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    panelStandalone: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    card: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
      borderWidth: 2, borderColor: tabColor,
    },
    formCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
      borderWidth: 2, borderColor: tabColor,
    },
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    warnText: { ...typography.caption, color: colors.statusYellowStandalone, marginTop: 2, ...textShadow },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    shortInput: { maxWidth: 160 },
    tinyInput: { maxWidth: 110, flex: 1 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },

    barRow: { marginBottom: 12 },
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 12 },
    barLabel: { ...typography.caption, color: colors.textSecondary, flex: 1, ...textShadow },
    barValue: { ...typography.caption, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
    barTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
    barFill: { height: 10, borderRadius: 5, backgroundColor: tabColor },

    listRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    listMain: { flex: 1 },
    listTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    listMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    listAmount: { ...typography.body, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
    listActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
    actionText: { ...typography.caption, color: tabColor, marginTop: 8, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

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
    pillSmall: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    pillTextSmall: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  });
}
