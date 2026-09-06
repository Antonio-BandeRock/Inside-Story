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
import { HOUSEHOLD_GROUPS } from '../constants/householdItems';
import {
  addKitchenItem,
  listPurchasableFoods,
  type KitchenItemKind,
  type PurchasableFood,
  deleteKitchenItem,
  describeKitchenAge,
  listKitchenInventory,
  markKitchenItemGone,
  consumeKitchenItem,
  type KitchenInventoryItem,
} from '../lib/kitchenDb';
import {
  DISPOSITION_KINDS,
  DONATION_RECORD_NOTE,
  RECIPIENT_KINDS,
  describeValuation,
  formatQuantity,
  valueReceivedGoods,
  type DispositionKind,
  type ReceivedGood,
  type RecipientKind,
  type RecordedPrice,
} from '../lib/harvestTrade';
import { getLastPaidPrices, recordDisposition } from '../lib/harvestTradeDb';

type DispositionForm = {
  itemId: string;
  kind: DispositionKind;
  quantity: string;
  withWhom: string;
  amount: string;
  // Gifts only: who got it, and whether they gave a receipt.
  recipientKind: RecipientKind;
  receiptGiven: boolean;
  // What came back, for a trade. Two rows to start, since a trade is at
  // least one thing for one thing and a second row is usually wanted.
  received: { foodName: string; quantity: string; unit: string }[];
};

const SOURCE_LABEL: Record<KitchenInventoryItem['source'], string> = {
  manual: 'Added by you',
  purchase: 'Bought',
  garden: 'From the garden',
  fermentation: 'Fermented',
  // 2026-09-05. Traded for, rather than bought: surplus harvest swapped for
  // something else. Worth saying, because nothing was spent on it.
  trade: 'Traded for',
};

export function KitchenSection({ tabColor }: { tabColor: string }) {
  const [items, setItems] = useState<KitchenInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [useAmount, setUseAmount] = useState('');
  const [kind, setKind] = useState<KitchenItemKind>('food');
  const [addOpen, setAddOpen] = useState(false);
  // What the picker settled on. Nothing is typed except the amount, which is
  // the point: "as free from manual writing something as we can."
  const [picked, setPicked] = useState<{ name: string; unit: string; category: string; group: string } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [foods, setFoods] = useState<PurchasableFood[]>([]);
  const [newQuantity, setNewQuantity] = useState('');
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [disposition, setDisposition] = useState<DispositionForm | null>(null);
  // What this person has actually paid for things, used only to say what a
  // trade saved them. Never to price what they gave away.
  const [lastPaid, setLastPaid] = useState<Record<string, RecordedPrice>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listKitchenInventory(kind));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  // The canonical purchasable set, fetched once. See listPurchasableFoods for
  // why this is not a hand-written list of staples.
  useEffect(() => {
    void listPurchasableFoods().then(setFoods).catch(() => setFoods([]));
  }, []);

  useEffect(() => {
    void getLastPaidPrices().then(setLastPaid).catch(() => setLastPaid({}));
  }, []);

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
    if (!picked || !Number.isFinite(quantity) || quantity <= 0) {
      showInfoAlert('Not quite', 'Pick something from the list, then say how much.');
      return;
    }
    await run(async () => {
      await addKitchenItem({
        foodName: picked.name,
        quantity,
        unit: picked.unit,
        category: picked.category,
        kind,
      });
      setPicked(null);
      setNewQuantity('');
      setPickerSearch('');
      setAddOpen(false);
    });
  }

  // One shape for both catalogues, so the picker below does not care which
  // inventory it is filling.
  const search = pickerSearch.trim().toLowerCase();
  const catalogue =
    kind === 'food'
      ? foods.map((food) => ({ name: food.baseName, unit: food.form === 'count' ? 'each' : 'g', category: food.category, group: food.category }))
      : HOUSEHOLD_GROUPS.flatMap((group) =>
          group.items.map((item) => ({ name: item.name, unit: item.unit, category: group.label, group: group.label })),
        );
  const matches = search
    ? catalogue.filter((entry) => entry.name.toLowerCase().includes(search))
    : catalogue;

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
        kind: item.kind,
        note: 'Running low',
      });
    });
    showInfoAlert('Added', `${item.foodName} is on your grocery list.`);
  }

  async function handleDisposition(item: KitchenInventoryItem) {
    if (!disposition) return;
    const quantity = Number(disposition.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showInfoAlert('How much?', 'Say how much of it went, above zero.');
      return;
    }
    if (quantity > item.quantityRemaining) {
      showInfoAlert(
        'More than you have',
        `There is ${formatQuantity(item.quantityRemaining, item.unit)} left, so that is the most that can have gone.`,
      );
      return;
    }
    const amount = disposition.kind === 'sold' ? Number(disposition.amount) : null;
    if (disposition.kind === 'sold' && (!Number.isFinite(amount as number) || (amount as number) <= 0)) {
      showInfoAlert('How much did you get?', 'Enter what it sold for.');
      return;
    }
    const received: ReceivedGood[] = disposition.kind === 'traded'
      ? disposition.received
          .filter((row) => row.foodName.trim() && Number(row.quantity) > 0)
          .map((row) => ({ foodName: row.foodName.trim(), quantity: Number(row.quantity), unit: row.unit.trim() }))
      : [];
    if (disposition.kind === 'traded' && received.length === 0) {
      showInfoAlert('What came back?', 'A trade means something came the other way. Say what, and how much.');
      return;
    }

    await run(async () => {
      await recordDisposition({
        occurredOn: new Date().toISOString().slice(0, 10),
        kind: disposition.kind,
        inventoryId: item.id,
        foodName: item.foodName,
        quantityGiven: quantity,
        unit: item.unit,
        withWhom: disposition.withWhom,
        amount,
        received,
        recipientKind: disposition.recipientKind,
        receiptGiven: disposition.receiptGiven,
      });
      setDisposition(null);
    });

    if (received.length > 0) {
      const valuation = valueReceivedGoods(received, lastPaid);
      const note = describeValuation(valuation);
      showInfoAlert(
        'In your kitchen',
        `${received.map((good) => `${formatQuantity(good.quantity, good.unit)} of ${good.foodName}`).join(', ')} added.${note ? ` ${note}` : ''}`,
      );
    }
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
        <View style={styles.kindRow}>
          {(['food', 'non_food'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.kindPill, kind === option && { backgroundColor: tabColor, borderColor: tabColor }]}
              activeOpacity={0.85}
              onPress={() => {
                setKind(option);
                setAddOpen(false);
                setPicked(null);
                setPickerSearch('');
              }}
            >
              <Text style={[styles.kindPillText, kind === option && styles.kindPillTextActive]}>
                {option === 'food' ? 'Food' : 'Household'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.cardTitle}>
          {kind === 'food' ? 'What is in your kitchen' : 'What the house needs'}
        </Text>
        <Text style={styles.bodyText}>
          {kind === 'food'
            ? 'Everything on hand, from the garden, from what you have fermented, and from what you have bought. Ticking something off a grocery list puts it here.'
            : 'Cleaning, paper, laundry, personal care and the rest. Kept apart from food because none of it has nutrients, a score, or anything else the app knows how to say about a food.'}
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
            <Text style={styles.fieldLabel}>
              {picked ? 'How much?' : kind === 'food' ? 'Which food?' : 'Which one?'}
            </Text>
            {picked ? (
              <>
                <View style={styles.pickedRow}>
                  <Text style={styles.pickedName}>{picked.name}</Text>
                  <TouchableOpacity onPress={() => setPicked(null)} activeOpacity={0.85}>
                    <Text style={styles.changeLink}>Change</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <AppTextInput
                    style={[styles.input, styles.rowGrow]}
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    placeholder={`How many ${picked.unit}`}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: tabColor }]}
                    activeOpacity={0.85}
                    disabled={busy}
                    onPress={handleAdd}
                  >
                    <Text style={styles.smallButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <AppTextInput
                  style={styles.input}
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder="Search, or just scroll"
                />
                <ScrollView style={styles.picker} nestedScrollEnabled>
                  {matches.length === 0 ? (
                    <Text style={styles.itemMeta}>Nothing matches that.</Text>
                  ) : (
                    matches.map((entry) => (
                      <TouchableOpacity
                        key={`${entry.group}:${entry.name}`}
                        style={styles.pickerRow}
                        activeOpacity={0.85}
                        onPress={() => setPicked(entry)}
                      >
                        <Text style={styles.pickerName}>{entry.name}</Text>
                        <Text style={styles.pickerGroup}>{entry.group}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}
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
                      <>
                        <Text style={styles.itemMeta}>
                          This came from a harvest, so it is removed where the rest of its history lives rather than here.
                        </Text>

                        {disposition?.itemId === item.id ? (
                          <View style={styles.dispositionBox}>
                            <Text style={styles.dispositionTitle}>More than you can eat?</Text>
                            <View style={styles.actionRow}>
                              {DISPOSITION_KINDS.map((entry) => (
                                <TouchableOpacity
                                  key={entry.code}
                                  style={[
                                    styles.secondaryButton,
                                    disposition.kind === entry.code && { backgroundColor: tabColor, borderColor: tabColor },
                                  ]}
                                  activeOpacity={0.85}
                                  onPress={() => setDisposition({ ...disposition, kind: entry.code })}
                                >
                                  <Text
                                    style={
                                      disposition.kind === entry.code ? styles.smallButtonText : styles.secondaryButtonText
                                    }
                                  >
                                    {entry.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <Text style={styles.itemMeta}>
                              {DISPOSITION_KINDS.find((entry) => entry.code === disposition.kind)?.help}
                            </Text>

                            <View style={styles.row}>
                              <AppTextInput
                                style={[styles.input, styles.rowGrow]}
                                value={disposition.quantity}
                                onChangeText={(text) => setDisposition({ ...disposition, quantity: text })}
                                placeholder={`how much (${item.unit || `amount`})`}
                                keyboardType="numeric"
                              />
                              <AppTextInput
                                style={[styles.input, styles.rowGrow]}
                                value={disposition.withWhom}
                                onChangeText={(text) => setDisposition({ ...disposition, withWhom: text })}
                                placeholder={disposition.kind === 'sold' ? 'who bought it' : 'who with'}
                              />
                            </View>

                            {disposition.kind === 'sold' ? (
                              <AppTextInput
                                style={styles.input}
                                value={disposition.amount}
                                onChangeText={(text) => setDisposition({ ...disposition, amount: text })}
                                placeholder="what you got for it"
                                keyboardType="numeric"
                              />
                            ) : null}

                            {disposition.kind === 'given' ? (
                              <>
                                <Text style={styles.dispositionSubtitle}>Who got it</Text>
                                <View style={styles.actionRow}>
                                  {RECIPIENT_KINDS.map((entry) => (
                                    <TouchableOpacity
                                      key={entry.code}
                                      style={[
                                        styles.secondaryButton,
                                        disposition.recipientKind === entry.code && {
                                          backgroundColor: tabColor,
                                          borderColor: tabColor,
                                        },
                                      ]}
                                      activeOpacity={0.85}
                                      onPress={() =>
                                        setDisposition({
                                          ...disposition,
                                          recipientKind: entry.code,
                                          receiptGiven: entry.code === 'person' ? false : disposition.receiptGiven,
                                        })
                                      }
                                    >
                                      <Text
                                        style={
                                          disposition.recipientKind === entry.code
                                            ? styles.smallButtonText
                                            : styles.secondaryButtonText
                                        }
                                      >
                                        {entry.label}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>

                                {disposition.recipientKind === 'organization' ? (
                                  <>
                                    <TouchableOpacity
                                      style={styles.receiptRow}
                                      activeOpacity={0.85}
                                      onPress={() =>
                                        setDisposition({ ...disposition, receiptGiven: !disposition.receiptGiven })
                                      }
                                    >
                                      <View
                                        style={[
                                          styles.receiptBox,
                                          disposition.receiptGiven && { backgroundColor: tabColor, borderColor: tabColor },
                                        ]}
                                      >
                                        {disposition.receiptGiven ? <Text style={styles.smallButtonText}>{'\u2713'}</Text> : null}
                                      </View>
                                      <Text style={styles.receiptLabel}>They gave me a receipt</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.itemMeta}>{DONATION_RECORD_NOTE}</Text>
                                  </>
                                ) : null}
                              </>
                            ) : null}

                            {disposition.kind === 'traded' ? (
                              <>
                                <Text style={styles.dispositionSubtitle}>What came back</Text>
                                {disposition.received.map((row, index) => (
                                  <View key={index} style={styles.row}>
                                    <AppTextInput
                                      style={[styles.input, styles.rowGrow]}
                                      value={row.foodName}
                                      onChangeText={(text) => {
                                        const next = [...disposition.received];
                                        next[index] = { ...next[index], foodName: text };
                                        setDisposition({ ...disposition, received: next });
                                      }}
                                      placeholder="what you got"
                                    />
                                    <AppTextInput
                                      style={[styles.input, styles.rowNarrow]}
                                      value={row.quantity}
                                      onChangeText={(text) => {
                                        const next = [...disposition.received];
                                        next[index] = { ...next[index], quantity: text };
                                        setDisposition({ ...disposition, received: next });
                                      }}
                                      placeholder="how much"
                                      keyboardType="numeric"
                                    />
                                    <AppTextInput
                                      style={[styles.input, styles.rowNarrow]}
                                      value={row.unit}
                                      onChangeText={(text) => {
                                        const next = [...disposition.received];
                                        next[index] = { ...next[index], unit: text };
                                        setDisposition({ ...disposition, received: next });
                                      }}
                                      placeholder="unit"
                                    />
                                  </View>
                                ))}
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    setDisposition({
                                      ...disposition,
                                      received: [...disposition.received, { foodName: '', quantity: '', unit: '' }],
                                    })
                                  }
                                >
                                  <Text style={[styles.itemMeta, { color: tabColor }]}>+ Something else came back</Text>
                                </TouchableOpacity>
                                <Text style={styles.itemMeta}>
                                  Whatever you got goes straight into your kitchen. No money moved either way, so nothing
                                  here counts as income or as spending.
                                </Text>
                              </>
                            ) : null}

                            <View style={styles.actionRow}>
                              <TouchableOpacity
                                style={[styles.smallButton, { backgroundColor: tabColor }]}
                                activeOpacity={0.85}
                                disabled={busy}
                                onPress={() => void handleDisposition(item)}
                              >
                                <Text style={styles.smallButtonText}>Record it</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.85}
                                onPress={() => setDisposition(null)}
                              >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.secondaryButton}
                            activeOpacity={0.85}
                            disabled={busy}
                            onPress={() =>
                              setDisposition({
                                itemId: item.id,
                                kind: 'traded',
                                quantity: '',
                                withWhom: '',
                                amount: '',
                                recipientKind: 'person',
                                receiptGiven: false,
                                received: [{ foodName: '', quantity: '', unit: '' }],
                              })
                            }
                          >
                            <Text style={styles.secondaryButtonText}>Sold, Traded or Gave Away</Text>
                          </TouchableOpacity>
                        )}
                      </>
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
  rowNarrow: { width: 84 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  // Recording that a surplus was sold, traded or given away, 2026-09-05.
  // Set apart on its own surface because it is a different kind of act from
  // the row's other buttons: those change an amount, this records an event
  // that also moves goods somewhere else.
  dispositionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    gap: 8,
  },
  dispositionTitle: { ...typography.bodyEmphasis, ...textShadow, color: colors.textPrimary, fontWeight: '400' },
  dispositionSubtitle: { ...typography.caption, ...textShadow, color: colors.textMuted, marginTop: 2 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  receiptBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptLabel: { ...typography.body, ...textShadow, color: colors.textPrimary, flex: 1 },
  addBlock: { gap: 8, marginTop: 4 },
  kindRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  kindPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  kindPillText: { ...typography.caption, ...textShadow, color: colors.textSecondary },
  kindPillTextActive: { color: colors.textOnButton, textShadowColor: 'transparent' },
  // Tall enough to scroll a full catalogue without swallowing the page.
  picker: { maxHeight: 260 },
  pickerRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerName: { ...typography.body, ...textShadow, color: colors.textPrimary },
  pickerGroup: { ...typography.caption, ...textShadow, color: colors.textMuted },
  pickedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pickedName: { ...typography.label, ...textShadow, color: colors.textPrimary, flex: 1 },
  changeLink: { ...typography.caption, ...textShadow, color: colors.primary },
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
