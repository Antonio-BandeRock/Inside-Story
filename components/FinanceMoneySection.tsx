import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  ACCOUNT_KINDS,
  accountKind,
  accountKindLabel,
  comparePayoffStrategies,
  describePayoff,
  formatAccountMoney,
  isLiability,
  netWorth,
  type Debt,
} from '../lib/financeAccounts';
import {
  deleteAccount,
  listAccounts,
  listNetWorthHistory,
  upsertAccount,
  type AccountRecord,
  type NetWorthPoint,
} from '../lib/financeAccountsDb';
import { parsePriceInput } from '../lib/groceryList';

// Accounts, net worth and debt payoff, 2026-09-05, pass 2 of the Finances
// rebuild. These are the parts every mainstream finance app has and the
// first build did not, which is what made it fair to call minimal.
//
// The payoff comparison deliberately does not pick a winner. Highest rate
// first is always cheaper in interest and that is arithmetic; smallest
// balance first clears individual debts sooner and is easier for many
// people to keep going with, and that is a fact about people. The screen
// reports both and says what each is good at, because which one someone
// will actually stick to is not something an app can know.

type Props = { tabColor: string };

const KIND_OPTIONS = ACCOUNT_KINDS.map((kind) => ({
  label: `${kind.side === 'liability' ? 'Owe: ' : 'Own: '}${kind.label}`,
  value: kind.code,
}));

const EXTRA_OPTIONS = [
  { label: 'Nothing extra', value: '0' },
  { label: '$50 a month extra', value: '50' },
  { label: '$100 a month extra', value: '100' },
  { label: '$250 a month extra', value: '250' },
  { label: '$500 a month extra', value: '500' },
];

export function FinanceMoneySection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [history, setHistory] = useState<NetWorthPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ id: string | null; name: string; kind: string; balance: string; apr: string; minimumPayment: string } | null>(null);
  const [extra, setExtra] = useState('0');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listAccounts(), listNetWorthHistory()])
      .then(([rows, points]) => { setAccounts(rows); setHistory(points); })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => netWorth(accounts), [accounts]);
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  // Only debts with everything the simulation needs can be modelled. One
  // missing interest rate would silently make a debt look free, so those
  // are named rather than quietly left out.
  const { debts, incomplete } = useMemo(() => {
    const ready: Debt[] = [];
    const missing: AccountRecord[] = [];
    for (const account of accounts) {
      if (!account.active || !isLiability(account.kind) || account.balance <= 0) continue;
      if (account.apr == null || account.minimumPayment == null || account.minimumPayment <= 0) missing.push(account);
      else ready.push({ id: account.id, name: account.name, balance: account.balance, apr: account.apr, minimumPayment: account.minimumPayment });
    }
    return { debts: ready, incomplete: missing };
  }, [accounts]);

  const comparison = useMemo(
    () => (debts.length > 0 ? comparePayoffStrategies(debts, Number(extra) || 0) : null),
    [debts, extra],
  );

  const trend = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    return { change: last.net - first.net, from: first.date, points: history.length };
  }, [history]);

  const showsDebtTerms = form ? accountKind(form.kind)?.carriesDebtTerms === true : false;

  async function save() {
    if (!form) return;
    if (!form.name.trim()) { showInfoAlert('Almost there', 'Give the account a name you will recognize.'); return; }
    const balance = form.balance.trim() ? parsePriceInput(form.balance.replace('-', '')) : 0;
    if (balance == null) { showInfoAlert('Almost there', 'Enter the balance as a number.'); return; }
    const negative = form.balance.trim().startsWith('-');

    await upsertAccount({
      id: form.id ?? undefined,
      name: form.name,
      kind: form.kind,
      balance: negative ? -balance : balance,
      apr: showsDebtTerms && form.apr.trim() ? Number(form.apr) : null,
      minimumPayment: showsDebtTerms && form.minimumPayment.trim() ? parsePriceInput(form.minimumPayment) : null,
    });
    setForm(null);
    load();
  }

  if (loading) return <Text style={[styles.bodyText, styles.panelStandalone]}>Adding up your accounts…</Text>;

  return (
    <>
      {infoAlertElement}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Net worth</Text>
        {accounts.length === 0 ? (
          <Text style={styles.bodyText}>
            Add what you own and what you owe, and this becomes one number that answers whether things are moving in the
            right direction. Balances are typed in rather than pulled from a bank, so nothing leaves your phone.
          </Text>
        ) : (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>What you own</Text>
              <Text style={styles.statValue}>{formatAccountMoney(totals.assets)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>What you owe</Text>
              <Text style={styles.statValue}>{formatAccountMoney(totals.liabilities)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabelStrong}>Net worth</Text>
              <Text style={[styles.statValueStrong, totals.net < 0 && styles.negative]}>{formatAccountMoney(totals.net)}</Text>
            </View>
            {trend ? (
              <Text style={styles.footnote}>
                {trend.change >= 0 ? 'Up' : 'Down'} {formatAccountMoney(Math.abs(trend.change))} since {trend.from},
                across {trend.points} times you updated a balance. A point is recorded when you change a balance, not
                daily, so this line only moves when something real did.
              </Text>
            ) : (
              <Text style={styles.footnote}>Update a balance again later and this starts showing which way things are moving.</Text>
            )}
          </>
        )}
        {!form ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setForm({ id: null, name: '', kind: 'checking', balance: '', apr: '', minimumPayment: '' })}>
            <Text style={styles.primaryButtonText}>+ Add an account</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Name</Text>
            <VoiceInputButton onResult={(t) => setForm({ ...form, name: t })} color={tabColor} />
          </View>
          <AppTextInput style={styles.input} placeholder="e.g. Everyday checking" value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })} />

          <Text style={styles.label}>What kind</Text>
          <PopoverSelect options={KIND_OPTIONS} selected={form.kind} onSelect={(v) => setForm({ ...form, kind: v })}
            tabColor={tabColor} searchable />

          <Text style={styles.label}>Balance</Text>
          <AppTextInput style={[styles.input, styles.shortInput]} placeholder="0.00" keyboardType="decimal-pad"
            value={form.balance} onChangeText={(t) => setForm({ ...form, balance: t })} />
          <Text style={styles.helperText}>
            {isLiability(form.kind)
              ? 'Enter what you owe as a plain positive number. It is counted against your net worth automatically.'
              : 'Enter the balance as it reads. Put a minus in front only if the account is actually overdrawn.'}
          </Text>

          {showsDebtTerms ? (
            <>
              <Text style={styles.label}>Interest rate and minimum payment</Text>
              <View style={styles.inlineRow}>
                <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="APR %" keyboardType="decimal-pad"
                  value={form.apr} onChangeText={(t) => setForm({ ...form, apr: t })} />
                <AppTextInput style={[styles.input, styles.tinyInput]} placeholder="Min pay" keyboardType="decimal-pad"
                  value={form.minimumPayment} onChangeText={(t) => setForm({ ...form, minimumPayment: t })} />
              </View>
              <Text style={styles.helperText}>Both are needed before a payoff plan can be worked out for this debt.</Text>
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

      {accounts.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accounts</Text>
          {accounts.map((account) => (
            <View key={account.id} style={[styles.listRow, !account.active && styles.paused]}>
              <View style={styles.listMain}>
                <Text style={styles.listTitle}>{account.name}</Text>
                <Text style={styles.listMeta}>
                  {accountKindLabel(account.kind)}
                  {account.apr != null ? ` · ${account.apr}% APR` : ''}
                  {account.minimumPayment != null ? ` · min ${formatAccountMoney(account.minimumPayment)}` : ''}
                </Text>
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => setForm({
                    id: account.id, name: account.name, kind: account.kind, balance: String(account.balance),
                    apr: account.apr != null ? String(account.apr) : '',
                    minimumPayment: account.minimumPayment != null ? String(account.minimumPayment) : '',
                  })}>
                    <Text style={styles.actionText}>Update balance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await deleteAccount(account.id); load(); }}>
                    <Text style={styles.actionTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.listAmount, isLiability(account.kind) && styles.negative]}>
                {isLiability(account.kind) ? '-' : ''}{formatAccountMoney(Math.abs(account.balance))}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paying off what you owe</Text>
        {debts.length === 0 && incomplete.length === 0 ? (
          <Text style={styles.bodyText}>
            Nothing owed, or nothing entered yet. Add a card or a loan with its interest rate and minimum payment, and
            this works out how long it takes and what each order costs.
          </Text>
        ) : (
          <>
            {debts.length > 0 && comparison ? (
              <>
                <Text style={styles.label}>If you put extra at it each month</Text>
                <PopoverSelect options={EXTRA_OPTIONS} selected={extra} onSelect={setExtra} tabColor={tabColor} />
                <Text style={styles.bodyText}>{describePayoff(comparison)}</Text>

                {comparison.avalanche.months != null ? (
                  <>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Highest rate first</Text>
                      <Text style={styles.statValue}>
                        {comparison.avalanche.months} mo · {formatAccountMoney(comparison.avalanche.totalInterest ?? 0)} interest
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Smallest balance first</Text>
                      <Text style={styles.statValue}>
                        {comparison.snowball.months} mo · {formatAccountMoney(comparison.snowball.totalInterest ?? 0)} interest
                      </Text>
                    </View>
                    <Text style={styles.footnote}>
                      Order they clear, highest rate first:{' '}
                      {comparison.avalanche.order.map((step) => `${step.name} (month ${step.clearedInMonth})`).join(', ')}
                    </Text>
                  </>
                ) : null}
              </>
            ) : null}

            {incomplete.length > 0 ? (
              <Text style={styles.footnote}>
                {incomplete.map((a) => a.name).join(', ')} {incomplete.length === 1 ? 'has' : 'have'} no interest rate or
                minimum payment recorded, so {incomplete.length === 1 ? 'it is' : 'they are'} left out rather than
                treated as interest-free.
              </Text>
            ) : null}
          </>
        )}
      </View>
    </>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    panelStandalone: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    shortInput: { maxWidth: 160 },
    tinyInput: { maxWidth: 110, flex: 1 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },

    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 4, gap: 12 },
    statLabel: { ...typography.body, color: colors.textSecondary, flex: 1, ...textShadow },
    statLabelStrong: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
    statValue: { ...typography.body, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
    statValueStrong: { ...typography.sectionTitle, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
    negative: { color: colors.danger },

    listRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    paused: { opacity: 0.55 },
    listMain: { flex: 1 },
    listTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    listMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    listAmount: { ...typography.body, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
    listActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
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
  });
}
