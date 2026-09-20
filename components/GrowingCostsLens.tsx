import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { listGardenPlots, type GardenPlot } from '../lib/db';
import { describeGardenNet, GROWING_COST_KINDS, growingCostKindLabel, type GrowingCostKind } from '../lib/gardenMoney';
import {
  deleteGrowingCost,
  listGrowingCosts,
  loadGardenMoneyPicture,
  recordGrowingCost,
  type GardenMoneyPicture,
  type GrowingCostRecord,
} from '../lib/gardenMoneyDb';
import { formatTradeMoney } from '../lib/harvestTrade';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles, TabBand } from './TabBand';

// Growing Costs, a lens of Garden.
//
// 2026-09-20, direct instruction: "The Garden harvest should also take into
// account all money spent to grow the food. This should include nutrients
// purchased to feed the garden if natural growing techniques aren't used
// that are free to them, such as compost from kitchen scraps."
//
// What is entered here is a finance entry in the Garden & growing supplies
// category, so the household budget on Life > Finances sees the same money
// once, and what was typed there shows here too. The top card is the net:
// what kept harvests and produce given to you would have cost at recorded
// prices, less everything spent on growing. See lib/gardenMoney.ts for the
// three rules that figure follows.

const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

const KIND_OPTIONS = GROWING_COST_KINDS.map((kind) => ({ label: kind.label, value: kind.code }));
const NO_PLOT = '__none__';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function GrowingCostsLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const folds = useBandFolds();
  const [costs, setCosts] = useState<GrowingCostRecord[]>([]);
  const [picture, setPicture] = useState<GardenMoneyPicture | null>(null);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<GrowingCostKind | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDateString());
  const [plotId, setPlotId] = useState<string>(NO_PLOT);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [costRows, money, plotRows] = await Promise.all([listGrowingCosts(), loadGardenMoneyPicture(), listGardenPlots()]);
    setCosts(costRows);
    setPicture(money);
    setPlots(plotRows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    setError(null);
  }, [description, kind, amount, date]);

  const plotOptions = useMemo(
    () => [{ label: 'The whole garden', value: NO_PLOT }, ...plots.map((plot) => ({ label: plot.name, value: plot.id }))],
    [plots],
  );

  const kindHelp = kind ? GROWING_COST_KINDS.find((entry) => entry.code === kind)?.help ?? null : null;

  async function handleSave() {
    const value = Number(amount.replace(/[^0-9.]/g, ''));
    if (!description.trim()) {
      setError('Say what it was.');
      return;
    }
    if (!kind) {
      setError('Pick what kind of cost it was.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter what it cost.');
      return;
    }
    if (!isDateString(date)) {
      setError('The date needs to be YYYY-MM-DD.');
      return;
    }
    await recordGrowingCost({
      occurredOn: date,
      amount: Math.round(value * 100) / 100,
      description: description.trim(),
      kind,
      plotId: plotId === NO_PLOT ? null : plotId,
    });
    setDescription('');
    setKind(null);
    setAmount('');
    setDate(todayDateString());
    setPlotId(NO_PLOT);
    setAdding(false);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteGrowingCost(id);
    await load();
  }

  const summary = picture?.summary ?? null;

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>What the Garden Costs and Gives Back</Text>
        {summary ? (
          <>
            <Text style={styles.moneyTotal}>{describeGardenNet(summary)}</Text>
            <Text style={styles.captionText}>
              Harvests kept for eating: {formatTradeMoney(summary.harvestsAvoided)} at prices you have recorded paying.
              {'\n'}Produce given to you: {formatTradeMoney(summary.receivedAvoided)} at the same prices.
              {'\n'}Spent on growing: {formatTradeMoney(summary.growingCosts)}, everything in the Garden &amp; growing supplies
              category of your budget.
            </Text>
            <Text style={styles.captionText}>
              The comparison is for the whole garden, never one crop: a bag of fertilizer feeds the whole bed, and charging
              it to the tomatoes would be a made-up split. Compost from your kitchen scraps costs nothing and is never
              entered here.
            </Text>
          </>
        ) : null}
      </View>

      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Record Money Spent on Growing</Text>
        {adding ? (
          <>
            <Text style={styles.fieldLabel}>What was it?</Text>
            <AppTextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="A bag of fertilizer, a flat of seedlings"
            />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kind</Text>
              <PopoverSelect
                options={KIND_OPTIONS}
                selected={kind}
                onSelect={(value) => setKind(value as GrowingCostKind)}
                tabColor={TAB_COLOR}
                width={240}
                placeholder="Pick a kind"
              />
            </View>
            {kindHelp ? <Text style={styles.captionText}>{kindHelp}</Text> : null}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Cost</Text>
              <AppTextInput
                style={[styles.textInput, styles.shortInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date</Text>
              <AppTextInput
                style={[styles.textInput, styles.dateInput]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
              <TouchableOpacity onPress={() => setDate(todayDateString())}>
                <Text style={styles.linkText}>Today</Text>
              </TouchableOpacity>
            </View>
            {plots.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>For</Text>
                <PopoverSelect options={plotOptions} selected={plotId} onSelect={setPlotId} tabColor={TAB_COLOR} width={220} />
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>Save Cost</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAdding(false)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.captionText}>
              Seeds, soil, fertilizer, water, tools, anything bought to grow food. It goes into your budget under Garden
              &amp; growing supplies and is set against what the garden gives back.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
              onPress={() => setAdding(true)}
            >
              <Text style={styles.primaryButtonText}>+ Add a Cost</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:costs:list" title="Growing Costs" icon="wallet-outline" count={costs.length}>
        <View style={styles.card}>
          {costs.length === 0 ? (
            <Text style={styles.captionText}>Nothing recorded yet.</Text>
          ) : (
            costs.map((cost) => (
              <View key={cost.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.bodyText}>
                    {formatTradeMoney(cost.amount)}
                    {cost.description ? `, ${cost.description}` : ''}
                  </Text>
                  <Text style={styles.captionText}>
                    {cost.occurredOn}
                    {cost.kind ? ` · ${growingCostKindLabel(cost.kind)}` : ' · Entered in Finances'}
                    {cost.plotName ? ` · ${cost.plotName}` : ''}
                    {cost.compostPileName ? ` · ${cost.compostPileName}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(cost.id)}>
                  <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <Text style={styles.captionText}>
            Deleting a cost here removes it from your budget too, since it is the same entry.
          </Text>
        </View>
      </TabBand>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  card: { gap: 8 },
  cardTitle: { ...typography.sectionTitle, ...textShadow },
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
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
