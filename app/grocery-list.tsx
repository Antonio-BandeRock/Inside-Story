// The Grocery List, 2026-09-01. Specified on 2026-08-30 as "our first real
// report": pick how many days of the schedule to shop for, say how many
// people, and the app works out how much of each ingredient every scheduled
// dish needs. Then it is carried into a store, checked off, and priced.
//
// A standalone Stack screen rather than another Schedule lens, matching
// find-meal.tsx and scan-product.tsx, for the reason the whole feature
// exists: this is used away from the app's own planning surfaces, standing
// in an aisle with one hand, and it has to open in one tap from Home
// without picking a tab and then a lens first.
//
// Schedule's own Shopping List lens is deliberately left alone. It answers
// a different question (what is coming up), recomputes every time, and
// stores nothing. This one is written down once and then lived with, since
// a list that quietly rewrote itself mid-aisle would be worse than no list.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet } from '../components/AppActionSheet';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  addGroceryListItem,
  createGroceryListFromSchedule,
  deleteGroceryList,
  deleteGroceryListItem,
  getActiveGroceryList,
  getGroceryList,
  getGroceryListItems,
  listGroceryLists,
  rebuildGroceryListFromSchedule,
  setGroceryItemChecked,
  setGroceryListStatus,
  updateGroceryItemPurchase,
  updateGroceryListDetails,
  type GroceryListItemRecord,
  type GroceryListRecord,
} from '../lib/groceryDb';
import {
  describeGroceryWindow,
  formatMergedAmounts,
  formatMoney,
  groceryLineTotal,
  groceryListTotals,
  groceryPriceUnitLabel,
  groceryPriceUnitShortLabel,
  GROCERY_DAY_OPTIONS,
  GROCERY_PRICE_UNITS,
  isEncouragedGroceryWindow,
  type GroceryPriceUnit,
} from '../lib/groceryList';

const DEFAULT_DAYS = 3;
const MAX_PEOPLE = 12;

type Mode = 'setup' | 'list';

type EditorState = {
  priceText: string;
  priceUnit: GroceryPriceUnit;
  purchasedText: string;
  noteText: string;
};

const BLANK_EDITOR: EditorState = { priceText: '', priceUnit: 'total', purchasedText: '', noteText: '' };

function editorFromItem(item: GroceryListItemRecord): EditorState {
  return {
    priceText: item.price != null ? String(item.price) : '',
    priceUnit: item.priceUnit ?? 'total',
    purchasedText: item.purchasedQuantity != null ? String(item.purchasedQuantity) : '',
    noteText: item.note ?? '',
  };
}

function parseNumberOrNull(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function GroceryListScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const { listId } = useLocalSearchParams<{ listId?: string }>();

  const [mode, setMode] = useState<Mode>('setup');
  const [list, setList] = useState<GroceryListRecord | null>(null);
  const [items, setItems] = useState<GroceryListItemRecord[]>([]);
  const [history, setHistory] = useState<GroceryListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Setup form
  const [daysAhead, setDaysAhead] = useState(DEFAULT_DAYS);
  const [peopleCount, setPeopleCount] = useState(1);
  const [storeName, setStoreName] = useState('');

  // Per-item editor
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(BLANK_EDITOR);

  // Add-an-item form
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // A list named in the route wins, so returning from a barcode scan
      // always lands back on the same list rather than on whichever one
      // happens to be active.
      const target = listId ? await getGroceryList(listId) : await getActiveGroceryList();
      const past = await listGroceryLists();
      setHistory(past);
      if (target) {
        setList(target);
        setItems(await getGroceryListItems(target.id));
        setPeopleCount(target.peopleCount);
        setDaysAhead(target.daysAhead);
        setStoreName(target.storeName ?? '');
        setMode('list');
      } else {
        setList(null);
        setItems([]);
        setMode('setup');
      }
    } catch (error) {
      setErrorMessage(`Could not open your grocery list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const totals = useMemo(() => groceryListTotals(items), [items]);

  // 2026-09-01, direct request: the list should say which meals it was
  // built for. Derived from the lines rather than stored on the list,
  // since removing the last line that needed a meal should stop the list
  // claiming to cover it.
  const coveredMeals = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      for (const meal of item.mealNames) names.add(meal);
    }
    return Array.from(names);
  }, [items]);

  const sections = useMemo(() => {
    const grouped = new Map<string, GroceryListItemRecord[]>();
    for (const item of items) {
      if (!grouped.has(item.category)) grouped.set(item.category, []);
      grouped.get(item.category)!.push(item);
    }
    return Array.from(grouped.entries()).map(([category, categoryItems]) => ({ category, items: categoryItems }));
  }, [items]);

  async function refreshItems(currentListId: string) {
    setItems(await getGroceryListItems(currentListId));
  }

  async function handleBuild() {
    setBusy(true);
    setErrorMessage('');
    try {
      const id = await createGroceryListFromSchedule({ daysAhead, peopleCount, storeName });
      const created = await getGroceryList(id);
      setList(created);
      setItems(await getGroceryListItems(id));
      setMode('list');
    } catch (error) {
      setErrorMessage(`Could not build the list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleChecked(item: GroceryListItemRecord) {
    if (!list) return;
    // Flipped locally first so a checkbox in a store responds to the thumb
    // rather than to the database, then reconciled from the real rows.
    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, checked: !row.checked } : row)));
    try {
      await setGroceryItemChecked(item.id, !item.checked);
      await refreshItems(list.id);
    } catch {
      await refreshItems(list.id);
    }
  }

  function handleExpand(item: GroceryListItemRecord) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setEditor(editorFromItem(item));
  }

  async function handleSavePrice(item: GroceryListItemRecord) {
    if (!list) return;
    const price = parseNumberOrNull(editor.priceText);
    const purchased = parseNumberOrNull(editor.purchasedText);
    setBusy(true);
    try {
      await updateGroceryItemPurchase(item.id, {
        price,
        // Clearing the price clears what it meant too, so a stale unit can
        // never outlive the number it described.
        priceUnit: price == null ? null : editor.priceUnit,
        purchasedQuantity: purchased,
        note: editor.noteText.trim() || null,
      });
      await refreshItems(list.id);
      setExpandedId(null);
    } catch (error) {
      setErrorMessage(`Could not save that: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveItem(item: GroceryListItemRecord) {
    if (!list) return;
    setBusy(true);
    try {
      await deleteGroceryListItem(item.id);
      setExpandedId(null);
      await refreshItems(list.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItem() {
    if (!list) return;
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await addGroceryListItem(list.id, {
        foodName: name,
        quantity: parseNumberOrNull(newQuantity) ?? 1,
        unit: newUnit.trim(),
      });
      setNewName('');
      setNewQuantity('');
      setNewUnit('');
      await refreshItems(list.id);
    } finally {
      setBusy(false);
    }
  }

  // 2026-09-01. A list stores its lines when it is built, so a list made
  // before a fix keeps the old ones. This is how one catches up without
  // being thrown away and rebuilt from nothing.
  async function handleRefresh() {
    if (!list) return;
    setBusy(true);
    setErrorMessage('');
    try {
      const result = await rebuildGroceryListFromSchedule(list.id);
      await refreshItems(list.id);
      const parts = [`${result.carriedOver} kept as they were`];
      if (result.added > 0) parts.push(`${result.added} rewritten or new`);
      if (result.removed > 0) parts.push(`${result.removed} no longer on the schedule`);
      if (result.keptByHand > 0) parts.push(`${result.keptByHand} you added by hand, untouched`);
      showInfoAlert(
        'Refreshed from your schedule',
        `${parts.join(', ')}.` +
          (result.added > 0
            ? ' Anything rewritten starts without its tick or price, because its name changed and the app will not pretend two different names are the same thing.'
            : ''),
      );
    } catch (error) {
      setErrorMessage(`Could not refresh the list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  // 2026-09-01, asked for directly, including the warning: a list cannot be
  // recovered, and a finished one takes its whole record with it.
  //
  // That second part is the one worth spelling out rather than gesturing at.
  // Prices live on the list itself (see grocery_list_items), and the Grocery
  // Prices lens in Trends is built entirely out of them, so deleting a
  // shopped list also removes those points from the price history. Someone
  // tidying up old lists would have no way to know that from the word
  // "delete" alone.
  async function handleDeleteList() {
    if (!list) return;
    setConfirmDeleteOpen(false);
    setBusy(true);
    try {
      await deleteGroceryList(list.id);
      setList(null);
      setItems([]);
      setExpandedId(null);
      setMode('setup');
      setHistory(await listGroceryLists());
    } catch (error) {
      setErrorMessage(`Could not delete the list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  function deleteWarningMessage(): string {
    const priced = items.filter((item) => item.price != null).length;
    const parts = [
      'This cannot be undone. The list and everything on it goes for good.',
    ];
    if (priced > 0) {
      parts.push(
        `The ${priced} price${priced === 1 ? '' : 's'} recorded on it will go too, and ${priced === 1 ? 'that point' : 'those points'} will disappear from Grocery Prices in Trends.`,
      );
    }
    if (list?.status === 'completed') {
      parts.push('This list is already finished, so this is the only record of that shopping trip.');
    }
    parts.push('Building a new list does not bring any of it back.');
    return parts.join(' ');
  }

  async function handleFinish() {
    if (!list) return;
    setBusy(true);
    try {
      const nextStatus = list.status === 'active' ? 'completed' : 'active';
      await setGroceryListStatus(list.id, nextStatus);
      if (storeName.trim() !== (list.storeName ?? '')) {
        await updateGroceryListDetails(list.id, { storeName });
      }
      setList(await getGroceryList(list.id));
      setHistory(await listGroceryLists());
    } finally {
      setBusy(false);
    }
  }

  function handleScanForItem(item: GroceryListItemRecord) {
    if (!list) return;
    router.push(`/scan-product?groceryListId=${encodeURIComponent(list.id)}&groceryItemId=${encodeURIComponent(item.id)}`);
  }

  function handleScanNewItem() {
    if (!list) return;
    router.push(`/scan-product?groceryListId=${encodeURIComponent(list.id)}`);
  }

  function explainPeopleCount() {
    showInfoAlert(
      'How many people',
      'Every recipe in this app is written for one person, so this is a plain multiplier: two people doubles every amount, four people quadruples it. ' +
        'It changes what the list says to buy. It does not change anything about the meals themselves or how they are scored.',
    );
  }

  function explainDays() {
    showInfoAlert(
      'How many days',
      'Two to four days is what this was built around, because produce bought for a whole week stops being fresh long before the week is over. ' +
        'A week is still offered rather than blocked: someone who can only reach a store once a week is describing their life, not making a mistake.',
    );
  }

  function explainTotal() {
    showInfoAlert(
      'The running total',
      'This adds up only the lines that carry a price the app can actually turn into a number. ' +
        'A price entered per pound or per kilo needs a weight before it means anything, so until you enter one, that line is counted as missing rather than guessed at one pound. ' +
        'The total says how many lines are still waiting on that.',
    );
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <ActivityIndicator color={colors.accent} />
        </View>
        {infoAlertElement}
      </View>
    );
  }

  if (mode === 'setup') {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
          <View style={styles.card}>
            <Text style={styles.title}>Build a Grocery List</Text>
            <Text style={styles.muted}>
              This reads whatever is already on your schedule, works out how much of each ingredient those meals need, and writes it down as a list you can take
              into a store.
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.card}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>How many days are you shopping for?</Text>
              <TouchableOpacity onPress={explainDays} accessibilityLabel="About the number of days">
                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {GROCERY_DAY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pill, daysAhead === option && styles.pillActive]}
                  activeOpacity={0.85}
                  onPress={() => setDaysAhead(option)}
                >
                  <Text style={[styles.pillText, daysAhead === option && styles.pillTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.muted}>
              {isEncouragedGroceryWindow(daysAhead)
                ? 'Shopping every few days keeps produce fresh.'
                : 'Longer than four days is fine, though fresh produce is unlikely to last the whole window.'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>How many people are eating?</Text>
              <TouchableOpacity onPress={explainPeopleCount} accessibilityLabel="About the number of people">
                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.85}
                onPress={() => setPeopleCount((value) => Math.max(1, value - 1))}
                accessibilityLabel="One fewer person"
              >
                <Ionicons name="remove" size={20} color={colors.textOnButton} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{peopleCount}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.85}
                onPress={() => setPeopleCount((value) => Math.min(MAX_PEOPLE, value + 1))}
                accessibilityLabel="One more person"
              >
                <Ionicons name="add" size={20} color={colors.textOnButton} />
              </TouchableOpacity>
            </View>
            <Text style={styles.muted}>Recipes here are written for one person, so this multiplies every amount.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Which store? (optional)</Text>
            <AppTextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Where you are shopping"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.muted}>Saved with the list, so prices can later be compared between stores.</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} activeOpacity={0.85} onPress={handleBuild} disabled={busy}>
            <Ionicons name="cart-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>{busy ? 'Building…' : 'Build My Grocery List'}</Text>
          </TouchableOpacity>

          {history.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Earlier lists</Text>
              {history.map((past) => (
                <TouchableOpacity
                  key={past.id}
                  style={styles.historyRow}
                  activeOpacity={0.85}
                  onPress={() => router.replace(`/grocery-list?listId=${encodeURIComponent(past.id)}`)}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowName}>{past.name}</Text>
                    <Text style={styles.rowMeta}>
                      {describeGroceryWindow(past.daysAhead, past.peopleCount)}
                      {past.storeName ? ` · ${past.storeName}` : ''}
                      {past.status === 'completed' ? ' · done' : ' · still shopping'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
        {infoAlertElement}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{list?.name ?? 'Groceries'}</Text>
          <Text style={styles.muted}>
            {list ? describeGroceryWindow(list.daysAhead, list.peopleCount) : ''}
            {list?.storeName ? ` · ${list.storeName}` : ''}
          </Text>
          <View style={styles.labelRow}>
            <Text style={styles.progressText}>
              {totals.checkedCount} of {totals.itemCount} in the cart
              {totals.pricedCount > 0 ? ` · ${formatMoney(totals.pricedTotal)} so far` : ''}
            </Text>
            <TouchableOpacity onPress={explainTotal} accessibilityLabel="About the running total">
              <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {totals.unresolvedPriceCount > 0 ? (
            <Text style={styles.muted}>
              {totals.unresolvedPriceCount} {totals.unresolvedPriceCount === 1 ? 'line needs' : 'lines need'} a weight before the price can be counted.
            </Text>
          ) : null}
          {coveredMeals.length > 0 ? (
            <Text style={styles.muted}>
              {`Covers ${coveredMeals.length} scheduled ${coveredMeals.length === 1 ? 'meal' : 'meals'}: ${coveredMeals.join(', ')}.`}
            </Text>
          ) : null}
          {list?.status === 'completed' ? <Text style={styles.doneText}>This list is finished.</Text> : null}
        </View>

        {errorMessage ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, busy && styles.disabled]}
            activeOpacity={0.85}
            onPress={handleRefresh}
            disabled={busy}
          >
            <Ionicons name="sync-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleScanNewItem}>
            <Ionicons name="barcode-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Scan a Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, busy && styles.disabled]}
            activeOpacity={0.85}
            onPress={() => setConfirmDeleteOpen(true)}
            disabled={busy}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Delete List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, busy && styles.disabled]} activeOpacity={0.85} onPress={handleFinish} disabled={busy}>
            <Ionicons name={list?.status === 'active' ? 'checkmark-done-outline' : 'refresh-outline'} size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>{list?.status === 'active' ? 'Finish Shopping' : 'Reopen List'}</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>
              Nothing was scheduled in that window, so this list started empty. Add what you need below, or schedule some meals and build a new list.
            </Text>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.category} style={styles.card}>
            <Text style={styles.sectionLabel}>{section.category}</Text>
            {section.items.map((item) => {
              const lineTotal = groceryLineTotal(item);
              const expanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.itemWrap}>
                  <View style={styles.itemRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                      activeOpacity={0.85}
                      onPress={() => handleToggleChecked(item)}
                      accessibilityLabel={item.checked ? `Uncheck ${item.foodName}` : `Check off ${item.foodName}`}
                    >
                      {item.checked ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemTextWrap} activeOpacity={0.85} onPress={() => handleExpand(item)}>
                      <Text style={[styles.rowName, item.checked && styles.rowNameChecked]}>{item.foodName}</Text>
                      <Text style={styles.rowMeta}>
                        {formatMergedAmounts({ primary: { quantity: item.quantity, unit: item.unit }, extras: item.extraAmounts })}
                        {item.price != null
                          ? ` · ${formatMoney(item.price)} ${groceryPriceUnitShortLabel(item.priceUnit ?? 'total')}`
                          : ''}
                        {lineTotal != null && item.priceUnit !== 'total' ? ` = ${formatMoney(lineTotal)}` : ''}
                      </Text>
                      {item.soldAs || item.approxAmount ? (
                        <Text style={styles.rowMeta}>
                          {[item.approxAmount, item.soldAs].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                      {item.mealNames.length > 0 ? (
                        <Text style={styles.rowMeta} numberOfLines={2}>
                          {`For ${item.mealNames.join(', ')}`}
                        </Text>
                      ) : null}
                      {item.note ? <Text style={styles.rowMeta}>{item.note}</Text> : null}
                    </TouchableOpacity>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </View>

                  {expanded ? (
                    <View style={styles.editorBlock}>
                      <Text style={styles.editorLabel}>What did it cost?</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.currency}>$</Text>
                        <AppTextInput
                          style={styles.priceInput}
                          value={editor.priceText}
                          onChangeText={(text) => setEditor((current) => ({ ...current, priceText: text }))}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      <View style={styles.pillRow}>
                        {GROCERY_PRICE_UNITS.map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[styles.pill, editor.priceUnit === unit && styles.pillActive]}
                            activeOpacity={0.85}
                            onPress={() => setEditor((current) => ({ ...current, priceUnit: unit }))}
                          >
                            <Text style={[styles.pillText, editor.priceUnit === unit && styles.pillTextActive]}>{groceryPriceUnitLabel(unit)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {editor.priceUnit !== 'total' ? (
                        <>
                          <Text style={styles.editorLabel}>
                            {editor.priceUnit === 'each' ? 'How many did you buy?' : `How many ${editor.priceUnit} did you buy?`}
                          </Text>
                          <AppTextInput
                            style={styles.input}
                            value={editor.purchasedText}
                            onChangeText={(text) => setEditor((current) => ({ ...current, purchasedText: text }))}
                            keyboardType="decimal-pad"
                            placeholder={editor.priceUnit === 'each' ? String(Math.round(item.quantity)) : '0'}
                            placeholderTextColor={colors.textMuted}
                          />
                        </>
                      ) : null}

                      <Text style={styles.editorLabel}>A note (optional)</Text>
                      <AppTextInput
                        style={styles.input}
                        value={editor.noteText}
                        onChangeText={(text) => setEditor((current) => ({ ...current, noteText: text }))}
                        placeholder="Brand, substitution, anything worth remembering"
                        placeholderTextColor={colors.textMuted}
                      />

                      <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} activeOpacity={0.85} onPress={() => handleSavePrice(item)} disabled={busy}>
                        <Text style={styles.primaryButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => handleScanForItem(item)}>
                        <Ionicons name="barcode-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.secondaryButtonText}>Scan This Product</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => handleRemoveItem(item)}>
                        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.secondaryButtonText}>Remove From List</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Add something else</Text>
          <AppTextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="What do you need?"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.addAmountRow}>
            <AppTextInput
              style={[styles.input, styles.amountInput]}
              value={newQuantity}
              onChangeText={setNewQuantity}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
            />
            <AppTextInput
              style={[styles.input, styles.unitInput]}
              value={newUnit}
              onChangeText={setNewUnit}
              placeholder="unit"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TouchableOpacity style={[styles.primaryButton, (busy || !newName.trim()) && styles.disabled]} activeOpacity={0.85} onPress={handleAddItem} disabled={busy || !newName.trim()}>
            <Ionicons name="add" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => { setList(null); setItems([]); setMode('setup'); }}>
          <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Start a New List</Text>
        </TouchableOpacity>
      </ScrollView>
      <AppActionSheet
        visible={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Delete ${list?.name ?? 'this list'}?`}
        message={deleteWarningMessage()}
        actions={[
          { label: 'Delete It', onPress: handleDeleteList, destructive: true },
          { label: 'Keep It', onPress: () => setConfirmDeleteOpen(false) },
        ]}
      />
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  errorText: { ...typography.body, color: colors.danger, ...textShadow },
  doneText: { ...typography.caption, color: colors.statusGood, ...textShadow },
  progressText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  pillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  // Dark text on the light accent fill: cancel the shadow it would otherwise
  // inherit. See constants/typography.ts.
  pillTextActive: { color: colors.background, textShadowColor: 'transparent', textShadowRadius: 0 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
  },
  stepperValue: { ...typography.sectionTitle, color: colors.textPrimary, minWidth: 32, textAlign: 'center', ...textShadow },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  addAmountRow: { flexDirection: 'row', gap: 8 },
  amountInput: { flex: 1 },
  unitInput: { flex: 2 },
  itemWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  itemTextWrap: { flex: 1, gap: 2 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.statusGood, borderColor: colors.statusGood },
  rowTextWrap: { flex: 1, gap: 2 },
  rowName: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowNameChecked: { color: colors.textMuted, textDecorationLine: 'line-through' },
  rowMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  editorBlock: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  editorLabel: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currency: { ...typography.sectionTitle, color: colors.textSecondary, ...textShadow },
  priceInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  // Wraps rather than squeezing: three labelled buttons do not fit across a
  // phone, and a button whose text is cut in half is worse than one on its own
  // second line.
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 132,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
