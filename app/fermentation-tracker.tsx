import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { PopoverSelect } from '../components/PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  advanceFermentationBatch,
  deleteFermentationBatch,
  deleteFermentationHarvest,
  listAllFermentationHarvests,
  listFermentationBatches,
  listFermentations,
  markFermentationHarvestFinished,
  recordFermentationHarvest,
  recordFermentationHarvestUsage,
  startFermentationBatch,
  type FermentationBatch,
  type FermentationBatchStage,
  type FermentationHarvest,
  type FermentationRecord,
} from '../lib/db';
import { parseAmountValue } from '../lib/measurement';

// The Fermentation Tracker, 2026-08-20 -- "a tracker for the entire
// process... with triggers and reminders for keeping the fermentation
// moving along with storing and everything through the ability of
// drinking them," plus "My Fermented Drinks" (the harvest half). Data
// layer (fermentation_batches/fermentation_task_links/
// fermentation_harvests, see lib/db.ts's own comments) shipped earlier
// this same session; this is the real UI on top of it.
//
// Reached from app/food-items.tsx's own "Saved Fermentations" list (a new
// "Track" action button alongside the existing Edit/Delete, passing
// fermentationId/fermentationName) or opened bare from Fermentation
// Builder's own save flow -- either way, this screen shows every active
// batch across every saved fermentation recipe, not just one, since a
// person can genuinely have more than one jar going at once. Follows
// food-product-detail.tsx's own screen shape (a Stack-pushed detail
// screen, no floating-button/CurrentPageHelp wiring, same as that
// screen), not a new tab -- this is scoped to Fermentation Builder's own
// saved recipes, not a whole new life-domain the way Garden is.
//
// Stage flow is deliberately linear, not a free picker: primary ->
// carbonating -> refrigerated -> (Record Harvest, which finishes the
// batch and creates the real fermentation_harvests row Section 2 below
// reads from). scheduleFermentationStageReminders (lib/db.ts) already
// stops generating reminders once a batch reaches 'refrigerated', so
// nothing further is scheduled from here.
const STAGE_LABELS: Record<FermentationBatchStage, string> = {
  primary: 'Primary Ferment',
  carbonating: 'Carbonating',
  refrigerated: 'Refrigerated — Ready to Harvest',
  finished: 'Finished',
};

const NEXT_STAGE: Partial<Record<FermentationBatchStage, FermentationBatchStage>> = {
  primary: 'carbonating',
  carbonating: 'refrigerated',
};

const NEXT_STAGE_BUTTON_LABEL: Partial<Record<FermentationBatchStage, string>> = {
  primary: 'Move to Carbonating',
  carbonating: 'Move to the Fridge',
};

const HARVEST_UNITS = ['cup', 'ml', 'l', 'fl oz', 'pint', 'quart'];

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export default function FermentationTrackerScreen() {
  const router = useRouter();
  const { fermentationId, fermentationName } = useLocalSearchParams<{ fermentationId?: string; fermentationName?: string }>();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<FermentationBatch[]>([]);
  const [harvests, setHarvests] = useState<FermentationHarvest[]>([]);
  const [savedFermentations, setSavedFermentations] = useState<FermentationRecord[]>([]);

  const [startPickerFermentationId, setStartPickerFermentationId] = useState<string | null>(fermentationId ?? null);
  const [starting, setStarting] = useState(false);

  // Keyed by fermentation_harvests.id -- each harvest row gets its own
  // independent "log a glass" amount field, not one shared input, since
  // more than one harvest can be on hand at once (see HARVEST_UNITS'
  // own comment).
  const [logAmounts, setLogAmounts] = useState<Record<string, string>>({});

  // Keyed by fermentation_batches.id -- the inline "how much did this
  // batch make?" form only opens for the one batch actually being
  // harvested, not every refrigerated batch at once.
  const [harvestingBatchId, setHarvestingBatchId] = useState<string | null>(null);
  const [harvestQuantityText, setHarvestQuantityText] = useState('');
  const [harvestUnit, setHarvestUnit] = useState<string>('cup');
  const [recordingHarvest, setRecordingHarvest] = useState(false);

  const load = useCallback(async () => {
    const [loadedBatches, loadedHarvests, loadedFermentations] = await Promise.all([
      listFermentationBatches(),
      listAllFermentationHarvests(),
      listFermentations(),
    ]);
    setBatches(loadedBatches);
    setHarvests(loadedHarvests);
    setSavedFermentations(loadedFermentations);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A batch already being tracked for the fermentation this screen was
  // opened FROM (if any) -- used to decide whether "Start Tracking" even
  // needs to show for that one, since starting a second batch of the
  // same recipe while one's already going is a real, valid thing to do
  // (nothing here blocks it), but the quick-start prompt at the top is
  // only for the common "nothing going yet" case.
  const hasActiveBatchForOpenedFermentation = fermentationId ? batches.some((batch) => batch.fermentationId === fermentationId) : false;

  async function handleStartTracking() {
    const targetId = fermentationId ?? startPickerFermentationId;
    if (!targetId) {
      showInfoAlert('Pick a fermentation first', 'Choose which saved fermentation this new batch is actually built from.');
      return;
    }
    const targetName =
      fermentationName ?? savedFermentations.find((entry) => entry.id === targetId)?.name ?? 'Fermentation';
    setStarting(true);
    try {
      await startFermentationBatch({ fermentationId: targetId, fermentationName: targetName });
      await load();
      showInfoAlert('Tracking started', `${targetName} is now tracked. You'll get a reminder to stir/check it starting tomorrow.`);
    } catch {
      showInfoAlert('Something went wrong', 'Could not start tracking that batch. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handleAdvance(batch: FermentationBatch) {
    const next = NEXT_STAGE[batch.stage];
    if (!next) return;
    try {
      await advanceFermentationBatch({ fermentationBatchId: batch.id, fermentationName: batch.fermentationName, nextStage: next });
      await load();
    } catch {
      showInfoAlert('Something went wrong', 'Could not move that batch to its next stage. Please try again.');
    }
  }

  async function handleDeleteBatch(batch: FermentationBatch) {
    const ok = await confirmSheet({
      title: `Stop tracking "${batch.fermentationName}"?`,
      message: 'This removes it from your active batches and cancels its own remaining reminders. This cannot be undone.',
      confirmLabel: 'Stop Tracking',
      destructive: true,
    });
    if (!ok) return;
    await deleteFermentationBatch(batch.id);
    await load();
  }

  function openHarvestForm(batch: FermentationBatch) {
    setHarvestingBatchId(batch.id);
    setHarvestQuantityText('');
    setHarvestUnit('cup');
  }

  async function handleRecordHarvest(batch: FermentationBatch) {
    const quantity = parseAmountValue(harvestQuantityText);
    if (!quantity || quantity <= 0) {
      showInfoAlert('Enter how much this made', 'Type in a real quantity before recording the harvest.');
      return;
    }
    setRecordingHarvest(true);
    try {
      await recordFermentationHarvest({
        fermentationBatchId: batch.id,
        fermentationId: batch.fermentationId,
        drinkName: batch.fermentationName,
        readyAt: new Date().toISOString(),
        quantity,
        unit: harvestUnit,
      });
      setHarvestingBatchId(null);
      await load();
      showInfoAlert(
        'Harvest recorded',
        `${batch.fermentationName} is ready to drink and now shows under My Fermented Drinks below.`,
      );
    } catch {
      showInfoAlert('Something went wrong', 'Could not record that harvest. Please try again.');
    } finally {
      setRecordingHarvest(false);
    }
  }

  async function handleLogGlass(harvest: FermentationHarvest) {
    const amount = parseAmountValue(logAmounts[harvest.id] ?? '');
    if (!amount || amount <= 0) {
      showInfoAlert('Enter an amount', `Type in how much you're drinking, in ${harvest.unit}.`);
      return;
    }
    await recordFermentationHarvestUsage(harvest.id, amount);
    setLogAmounts((current) => ({ ...current, [harvest.id]: '' }));
    await load();
  }

  async function handleMarkEmpty(harvest: FermentationHarvest) {
    const ok = await confirmSheet({
      title: `Mark "${harvest.drinkName}" as gone?`,
      message: 'This clears its remaining amount to zero. Make more whenever you\'re ready to replace it.',
      confirmLabel: 'Mark Gone',
    });
    if (!ok) return;
    await markFermentationHarvestFinished(harvest.id);
    await load();
  }

  async function handleDeleteHarvest(harvest: FermentationHarvest) {
    const ok = await confirmSheet({
      title: `Delete "${harvest.drinkName}" from your history?`,
      message: 'This removes the whole record, not just its remaining amount. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteFermentationHarvest(harvest.id);
    await load();
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Fermentation Tracker' }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Fermentation Tracker' }} />
      {infoAlertElement}
      {confirmSheetElement}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Start Tracking -- shown whenever there's a real fermentation to
            start (either the one this screen was opened for, or, absent
            that, a picker over every saved fermentation recipe) and no
            active batch for it yet. */}
        {!hasActiveBatchForOpenedFermentation ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Start Tracking a Batch</Text>
            {fermentationId ? (
              <Text style={styles.caption}>{fermentationName ?? 'This fermentation'} isn&apos;t being tracked yet.</Text>
            ) : (
              <>
                <Text style={styles.caption}>Which saved fermentation is this real jar built from?</Text>
                <PopoverSelect
                  options={savedFermentations.map((entry) => ({ label: entry.name, value: entry.id }))}
                  selected={startPickerFermentationId}
                  onSelect={setStartPickerFermentationId}
                  tabColor={colors.tabFood}
                  placeholder="Choose a fermentation"
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, starting || (!fermentationId && !startPickerFermentationId) ? styles.disabled : null]}
              onPress={handleStartTracking}
              disabled={starting || (!fermentationId && !startPickerFermentationId)}
            >
              <Text style={styles.primaryButtonText}>{starting ? 'Starting…' : 'Start Tracking'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Active Batches -- every real jar currently in progress, across
            every saved fermentation recipe, most recently started first
            (see listFermentationBatches' own ORDER BY). */}
        <Text style={styles.sectionHeading}>Active Batches</Text>
        {batches.length === 0 ? (
          <Text style={styles.emptyText}>Nothing being tracked right now.</Text>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {batch.fermentationName}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteBatch(batch)} accessibilityLabel={`Stop tracking ${batch.fermentationName}`} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.caption}>{STAGE_LABELS[batch.stage]}</Text>
              <Text style={styles.caption}>
                Started {daysSince(batch.startedAt)} day{daysSince(batch.startedAt) === 1 ? '' : 's'} ago · this stage for{' '}
                {daysSince(batch.stageChangedAt)} day{daysSince(batch.stageChangedAt) === 1 ? '' : 's'}
              </Text>

              {batch.stage === 'primary' || batch.stage === 'carbonating' ? (
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.tabFood }]} onPress={() => handleAdvance(batch)}>
                  <Text style={[styles.secondaryButtonText, { color: colors.tabFood }]}>{NEXT_STAGE_BUTTON_LABEL[batch.stage]}</Text>
                </TouchableOpacity>
              ) : null}

              {batch.stage === 'refrigerated' && harvestingBatchId !== batch.id ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => openHarvestForm(batch)}>
                  <Text style={styles.primaryButtonText}>Record Harvest</Text>
                </TouchableOpacity>
              ) : null}

              {batch.stage === 'refrigerated' && harvestingBatchId === batch.id ? (
                <View style={styles.harvestForm}>
                  <Text style={styles.caption}>How much did this batch make?</Text>
                  <View style={styles.harvestFormRow}>
                    <AppTextInput
                      value={harvestQuantityText}
                      onChangeText={setHarvestQuantityText}
                      style={styles.harvestQuantityInput}
                      placeholder="Amount"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                    <PopoverSelect
                      options={HARVEST_UNITS}
                      selected={harvestUnit}
                      onSelect={setHarvestUnit}
                      tabColor={colors.tabFood}
                    />
                  </View>
                  <View style={styles.harvestFormRow}>
                    <TouchableOpacity
                      style={[styles.primaryButton, styles.harvestFormButton, recordingHarvest ? styles.disabled : null]}
                      onPress={() => handleRecordHarvest(batch)}
                      disabled={recordingHarvest}
                    >
                      <Text style={styles.primaryButtonText}>{recordingHarvest ? 'Saving…' : 'Save Harvest'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.harvestFormButton]}
                      onPress={() => setHarvestingBatchId(null)}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          ))
        )}

        {/* My Fermented Drinks -- mirrors Garden's own Harvest Log lens
            (see garden.tsx's own comment): the full history, most
            recently ready first, an available one gets Log a Glass/Mark
            Gone, an already-empty one just shows as done. */}
        <Text style={styles.sectionHeading}>My Fermented Drinks</Text>
        {harvests.length === 0 ? (
          <Text style={styles.emptyText}>Nothing harvested yet. Record a harvest from a refrigerated batch above once it&apos;s ready.</Text>
        ) : (
          harvests.map((harvest) => {
            const isAvailable = harvest.quantityRemaining > 0;
            return (
              <View key={harvest.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {harvest.drinkName}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteHarvest(harvest)} accessibilityLabel={`Delete ${harvest.drinkName}`} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.caption}>
                  {isAvailable
                    ? `${harvest.quantityRemaining} of ${harvest.quantity} ${harvest.unit} left`
                    : `Gone — made ${harvest.quantity} ${harvest.unit}`}
                </Text>
                <Text style={styles.caption}>Ready {harvest.readyAt.slice(0, 10)}</Text>

                {isAvailable ? (
                  <>
                    <View style={styles.harvestFormRow}>
                      <AppTextInput
                        value={logAmounts[harvest.id] ?? ''}
                        onChangeText={(text) => setLogAmounts((current) => ({ ...current, [harvest.id]: text }))}
                        style={styles.harvestQuantityInput}
                        placeholder={`Amount (${harvest.unit})`}
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity style={[styles.secondaryButton, styles.harvestFormButton, { borderColor: colors.tabFood }]} onPress={() => handleLogGlass(harvest)}>
                        <Text style={[styles.secondaryButtonText, { color: colors.tabFood }]}>Log a Glass</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleMarkEmpty(harvest)}>
                      <Text style={styles.secondaryButtonText}>Mark Gone</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginTop: 12, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  emptyText: { ...typography.body, color: colors.textMuted, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow },
  itemTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, marginRight: 8, ...textShadow },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, ...textShadow },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  harvestForm: { gap: 8, marginTop: 4 },
  harvestFormRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  harvestFormButton: { flex: 1, marginTop: 0 },
  harvestQuantityInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...textShadow,
  },
});
