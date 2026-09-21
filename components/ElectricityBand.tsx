// The Electricity band on Growing Costs: the household's bills, the one
// from before the grow as the baseline, and what the bills since run above
// it, beside what the equipment recorded under every area says it draws.
//
// 2026-09-21, direct instruction: "Some will be ongoing expenses, like the
// lights, the AC, electricity usage - so there needs to be a way to record
// the current electricity bill prior to starting their indoor grow." A bill
// is the household's, never one area's, which is why it lives here and not
// under an area. The arithmetic (per-day comparison, the bills' rate, the
// setup's monthly draw) is in lib/growSetup.ts.
//
// The difference is a figure, not a cost, until the person records it: the
// Record it as a growing cost form below writes it under the Electricity
// kind, tied to an area or a group like any other cost, so the household
// budget sees the grow's electricity once and By Area sets it against the
// harvests. Nothing here writes to the budget on its own.

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import { recordGrowingCost } from '../lib/gardenMoneyDb';
import {
  billDays,
  compareElectricity,
  describeElectricity,
  describeSetupPower,
  electricityRate,
  summarizeSetupPower,
  type ElectricityBill,
} from '../lib/growSetup';
import { addElectricityBill, deleteElectricityBill, listAllGrowEquipmentInUse, listElectricityBills, setElectricityBillBaseline } from '../lib/growSetupDb';
import { formatTradeMoney } from '../lib/harvestTrade';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { TabBand } from './TabBand';

type Folds = ReturnType<typeof useBandFolds>;

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Props = {
  folds: Folds;
  /** The Area picker's choices, the same list the cost form offers: an
   *  area, a whole group, or none. */
  plotOptions: { label: string; value: string }[];
  noPlotValue: string;
  groupPrefix: string;
  /** Called after the difference is recorded as a growing cost. */
  onCostRecorded: () => Promise<void> | void;
};

export function ElectricityBand({ folds, plotOptions, noPlotValue, groupPrefix, onCostRecorded }: Props) {
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [setupLine, setSetupLine] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [kwh, setKwh] = useState('');
  const [amount, setAmount] = useState('');
  const [beforeGrow, setBeforeGrow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordDate, setRecordDate] = useState(todayDateString());
  const [recordPlot, setRecordPlot] = useState(noPlotValue);
  const [recordError, setRecordError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rows, equipment] = await Promise.all([listElectricityBills(), listAllGrowEquipmentInUse()]);
    setBills(rows);
    const power = summarizeSetupPower(equipment);
    setSetupLine(equipment.length === 0 ? null : describeSetupPower(power, electricityRate(rows)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const comparison = compareElectricity(bills);

  async function handleSave() {
    if (!isDateString(start) || !isDateString(end)) {
      setError('Enter the billing period as two dates, YYYY-MM-DD.');
      return;
    }
    if (Date.parse(end) < Date.parse(start)) {
      setError('The period ends before it starts.');
      return;
    }
    const total = numberOrNull(amount);
    if (total === null) {
      setError('Enter what the bill came to.');
      return;
    }
    await addElectricityBill({ periodStart: start, periodEnd: end, kwh: numberOrNull(kwh), amount: total, beforeGrow });
    setStart('');
    setEnd('');
    setKwh('');
    setAmount('');
    setBeforeGrow(false);
    setError(null);
    setAdding(false);
    await load();
  }

  async function handleBaseline(bill: ElectricityBill) {
    await setElectricityBillBaseline(bill.id, !bill.beforeGrow);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteElectricityBill(id);
    await load();
  }

  function startRecording() {
    setRecordAmount(comparison.extraPerMonth && comparison.extraPerMonth > 0 ? (Math.round(comparison.extraPerMonth * 100) / 100).toFixed(2) : '');
    setRecordDate(todayDateString());
    setRecordPlot(noPlotValue);
    setRecordError(null);
    setRecording(true);
  }

  async function handleRecord() {
    const value = numberOrNull(recordAmount);
    if (value === null) {
      setRecordError('Enter the amount to record.');
      return;
    }
    if (!isDateString(recordDate)) {
      setRecordError('Enter the date as YYYY-MM-DD.');
      return;
    }
    const forGroup = recordPlot.startsWith(groupPrefix);
    await recordGrowingCost({
      occurredOn: recordDate,
      amount: value,
      description: 'Electricity above the bill from before the grow',
      kind: 'electricity',
      plotId: recordPlot === noPlotValue || forGroup ? null : recordPlot,
      costGroupId: forGroup ? recordPlot.slice(groupPrefix.length) : null,
    });
    setRecording(false);
    await onCostRecorded();
  }

  return (
    <TabBand folds={folds} color={TAB_COLOR} id="garden:costs:electricity" title="Electricity" icon="flash-outline" count={bills.length}>
      <View style={styles.card}>
        <Text style={styles.captionText}>
          Record the bill you have now, from before the grow starts, and mark it as the baseline. Every bill after it is compared with that one per day, so a short bill and a long one compare fairly, and the difference is what the grow is costing in electricity. A bill is the whole household&apos;s, so it lives here rather than under one area.
        </Text>
        <Text style={styles.moneyTotal}>{describeElectricity(comparison)}</Text>
        {setupLine ? <Text style={styles.captionText}>From the equipment recorded under your areas: {setupLine}</Text> : null}
        {bills.map((bill) => (
          <View key={bill.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.bodyText}>
                {formatTradeMoney(bill.amount)}
                {bill.kwh !== null ? `, ${bill.kwh} kWh` : ''}
                {bill.beforeGrow ? ' · Before the grow' : ''}
              </Text>
              <Text style={styles.captionText}>
                {bill.periodStart} to {bill.periodEnd}, {billDays(bill)} days, {formatTradeMoney(bill.amount / billDays(bill))} a day
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleBaseline(bill)}>
              <Text style={styles.linkText}>{bill.beforeGrow ? 'Not the baseline' : 'Before the grow'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(bill.id)}>
              <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
        {adding ? (
          <View style={styles.nestedForm}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>From</Text>
              <AppTextInput style={[styles.textInput, styles.dateInput]} value={start} onChangeText={setStart} placeholder="YYYY-MM-DD" />
              <Text style={styles.fieldLabel}>To</Text>
              <AppTextInput style={[styles.textInput, styles.dateInput]} value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <AppTextInput style={[styles.textInput, styles.shortInput]} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
              <Text style={styles.fieldLabel}>kWh</Text>
              <AppTextInput style={[styles.textInput, styles.shortInput]} value={kwh} onChangeText={setKwh} placeholder="Optional" keyboardType="numeric" />
            </View>
            <Text style={styles.captionText}>The kWh is on the bill and is optional, but with it the app knows what a kWh costs you and can price what the equipment draws.</Text>
            <TouchableOpacity
              style={[styles.pill, { borderColor: TAB_COLOR }, beforeGrow ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null]}
              onPress={() => setBeforeGrow(!beforeGrow)}
            >
              <Text style={beforeGrow ? styles.pillTextActive : { color: TAB_COLOR }}>This bill is from before the grow</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>Save Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAdding(false); setError(null); }}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => setAdding(true)}>
              <Text style={styles.primaryButtonText}>+ Add a Bill</Text>
            </TouchableOpacity>
            {comparison.extraPerMonth !== null && comparison.extraPerMonth > 0 && !recording ? (
              <TouchableOpacity onPress={startRecording}>
                <Text style={styles.linkText}>Record it as a growing cost</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {recording ? (
          <View style={styles.nestedForm}>
            <Text style={styles.fieldLabel}>Record the difference as a growing cost</Text>
            <Text style={styles.captionText}>One month of what the bills run above the baseline, under the Electricity kind, tied to the area or group the grow is in. Change the amount if a month is not what you want.</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <AppTextInput style={[styles.textInput, styles.shortInput]} value={recordAmount} onChangeText={setRecordAmount} placeholder="0.00" keyboardType="decimal-pad" />
              <Text style={styles.fieldLabel}>Date</Text>
              <AppTextInput style={[styles.textInput, styles.dateInput]} value={recordDate} onChangeText={setRecordDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Area</Text>
              <PopoverSelect options={plotOptions} selected={recordPlot} onSelect={setRecordPlot} tabColor={TAB_COLOR} width={220} />
            </View>
            {recordError ? <Text style={styles.errorText}>{recordError}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleRecord}>
                <Text style={styles.primaryButtonText}>Record</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecording(false)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </TabBand>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  moneyTotal: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  shortInput: { width: 110 },
  dateInput: { width: 140 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  rowText: { flex: 1, minWidth: 160, gap: 2 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  pillTextActive: { color: colors.textOnButton },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' },
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginVertical: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
