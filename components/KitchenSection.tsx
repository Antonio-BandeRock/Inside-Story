// What is in the kitchen: seeing it, adding to it, using it up, and putting it
// back on the shopping list when it runs low.
//
// 2026-09-05, asked for directly: "I shouldn't need to open the grocery list.
// It should live somewhere... The user needs a way to add to their inventory of
// on hand kitchen items, or mark them as expended, with them being able to
// quickly add the item to the list as they want to." Until now this existed
// only as a read-through inside the grocery list, with nowhere to look at it
// and nothing to change.
//
// Its own component rather than more of app/(tabs)/life.tsx, matching what
// FinanceHealthSection and FinanceMoneySection already do there: Life holds
// several unrelated domains and each one keeps its own file.
//
// The screen's job beyond listing: say how much an amount can be trusted.
// Nothing decrements this as someone cooks, so every row carries how long it
// has been claimed. A bottle "added today" and one "added 3 months ago" are
// different kinds of fact, and only one of them is worth acting on.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { useInfoAlert } from './InfoAlert';
import { BUTTON_SHADOW, colors, inputBackground } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { formatGroceryAmount } from '../lib/groceryList';
import { addGroceryListItem, getActiveGroceryList } from '../lib/groceryDb';
import {
  addKitchenItem,
  deleteKitchenItem,
  describeKitchenAge,
  listKitchenInventory,
  markKitchenItemGone,
  consumeKitchenItem,
  type KitchenInventoryItem,
} from '../lib/kitchenDb';

const SOURCE_LABEL: Record<KitchenInventoryItem['source'], string> = {
  manual: 'Added by you',
  purchase: 'Bought',
  garden: 'From the garden',
  fermentation: 'Fermented',
};

export function KitchenSection({ tabColor }: { tabColor: string }) {
  const [items, setItems] = useState<KitchenInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [useAmount, setUseAmount] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listKitchenInventory());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    const quantity = Number(newQuantity);
    if (!newName.trim() || !Number.isFinite(quantity) || quantity <= 0) {
      showInfoAlert('Not enough to go on', 'A name and an amount above zero are both needed.');
      return;
    }
    await run(async () => {
      await addKitchenItem({ foodName: newName, quantity, unit: newUnit });
      setNewName('');
      setNewQuantity('');
      setNewUnit('');
      setAddOpen(false);
    });
  }

  // Straight onto whatever list is open, so "I am nearly out of this" takes one
  // tap from the shelf it is about. No list yet is said plainly rather than one
  // being created silently: a grocery list records what it was built FROM (a
  // date, a day count, a head count), and inventing those to hold one item
  // would produce a list that lies about its own purpose.
  async function handleAddToList(item: KitchenInventoryItem) {
    const list = await getActiveGroceryList();
    if (!list) {
      showInfoAlert(
        'No list open',
        'Start a grocery list first, then anything here can be added to it in one tap.',
      );
      return;
    }
    await run(async () => {
      await addGroceryListItem(list.id, {
        foodName: item.foodName,
        unit: item.unit,
        quantity: item.quantity,
        note: 'Running low',
      });
    });
    showInfoAlert('Added', `${item.foodName} is on your grocery list.`);
  }

  async function handleMarkGone(item: KitchenInventoryItem) {
    const ok = await confirmSheet({
      title: `${item.foodName} is gone?`,
      message: 'It stops showing here and stops counting against your grocery list. What it was stays on record.',
      confirmLabel: 'It is gone',
    });
    if (ok) await run(() => markKitchenItemGone(item.id));
  }

  async function handleUseSome(item: KitchenInventoryItem) {
    const amount = Number(useAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showInfoAlert('How much?', 'Enter an amount above zero.');
      return;
    }
    await run(async () => {
      await consumeKitchenItem(item.id, amount);
      setUseAmount('');
      setExpandedId(null);
    });
  }

  return (
    <View>
      {infoAlertElement}
      {confirmSheetElement}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What is in your kitchen</Text>
        <Text style={styles.bodyText}>
          Everything on hand, from the garden, from what you have fermented, and from what you have bought. Ticking
          something off a grocery list puts it here.
        </Text>
        <Text style={styles.caveat}>
          Nothing takes this down as you cook, so it is only as right as you keep it. Each one says how long it has been
          here for that reason.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tabColor }]}
          activeOpacity={0.85}
          onPress={() => setAddOpen((open) => !open)}
        >
          <Ionicons name={addOpen ? 'close' : 'add'} size={16} color={colors.textOnButton} />
          <Text style={styles.primaryButtonText}>{addOpen ? 'Cancel' : 'Add Something'}</Text>
        </TouchableOpacity>

        {addOpen ? (
          <View style={styles.addBlock}>
            <Text style={styles.fieldLabel}>What is it?</Text>
            <AppTextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Olive oil" />
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <Text style={styles.fieldLabel}>How much</Text>
                <AppTextInput
                  style={styles.input}
                  value={newQuantity}
                  onChangeText={setNewQuantity}
                  placeholder="750"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rowHalf}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <AppTextInput style={styles.input} value={newUnit} onChangeText={setNewUnit} placeholder="ml" />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tabColor }]}
              activeOpacity={0.85}
              disabled={busy}
              onPress={handleAdd}
            >
              <Text style={styles.primaryButtonText}>Put It In the Kitchen</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {loading ? (
        <Text style={[styles.bodyText, styles.standalone]}>Looking…</Text>
      ) : items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Nothing here yet. Add something above, log a garden harvest, or tick an item off a grocery list.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const partly = item.quantityRemaining < item.quantity;
            return (
              <View key={item.id} style={styles.itemCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setExpandedId(expanded ? null : item.id);
                    setUseAmount('');
                  }}
                >
                  <Text style={styles.itemName}>{item.foodName}</Text>
                  <Text style={styles.itemMeta}>
                    {formatGroceryAmount(item.quantityRemaining, item.unit)}
                    {partly ? ` left of ${formatGroceryAmount(item.quantity, item.unit)}` : ''}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {SOURCE_LABEL[item.source]} · {describeKitchenAge(item.addedAt)}
                  </Text>
                  {item.note ? <Text style={styles.itemMeta}>{item.note}</Text> : null}
                </TouchableOpacity>

                {expanded ? (
                  <View style={styles.actions}>
                    <Text style={styles.fieldLabel}>Used how much?</Text>
                    <View style={styles.row}>
                      <AppTextInput
                        style={[styles.input, styles.rowGrow]}
                        value={useAmount}
                        onChangeText={setUseAmount}
                        placeholder={item.unit || 'amount'}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: tabColor }]}
                        activeOpacity={0.85}
                        disabled={busy}
                        onPress={() => handleUseSome(item)}
                      >
                        <Text style={styles.smallButtonText}>Use</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: tabColor }]}
                        activeOpacity={0.85}
                        disabled={busy}
                        onPress={() => handleAddToList(item)}
                      >
                        <Ionicons name="cart-outline" size={14} color={colors.textOnButton} />
                        <Text style={styles.smallButtonText}>Add to List</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.85}
                        disabled={busy}
                        onPress={() => void handleMarkGone(item)}
                      >
                        <Text style={styles.secondaryButtonText}>All Gone</Text>
                      </TouchableOpacity>
                      {item.source === 'manual' || item.source === 'purchase' ? (
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          activeOpacity={0.85}
                          disabled={busy}
                          onPress={() => void run(async () => void (await deleteKitchenItem(item.id)))}
                        >
                          <Text style={styles.secondaryButtonText}>Remove</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {item.source === 'garden' || item.source === 'fermentation' ? (
                      <Text style={styles.itemMeta}>
                        This came from a harvest, so it is removed where the rest of its history lives rather than here.
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary },
  bodyText: { ...typography.body, ...textShadow, color: colors.textSecondary },
  caveat: { ...typography.caption, ...textShadow, color: colors.textMuted },
  standalone: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  list: { maxHeight: 460 },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 3,
  },
  itemName: { ...typography.label, ...textShadow, color: colors.textPrimary },
  itemMeta: { ...typography.caption, ...textShadow, color: colors.textSecondary },
  actions: { marginTop: 10, gap: 8 },
  fieldLabel: { ...typography.caption, ...textShadow, color: colors.textMuted },
  input: {
    backgroundColor: inputBackground(colors.primary),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  rowHalf: { flex: 1, gap: 4 },
  rowGrow: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  addBlock: { gap: 8, marginTop: 4 },
  primaryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.label, color: colors.textOnButton, textShadowColor: 'transparent' },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...BUTTON_SHADOW,
  },
  smallButtonText: { ...typography.caption, color: colors.textOnButton, textShadowColor: 'transparent' },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryButtonText: { ...typography.caption, ...textShadow, color: colors.textSecondary },
});
