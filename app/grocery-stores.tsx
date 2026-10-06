// Stores and Aisles (G6 of the competitive build plan, Phase 2, 2026-09-26).
// Where the person names the stores they shop at and lays each one out:
// aisles in the order they are walked, and which reference category sits in
// which aisle. A grocery list naming that store then reads in that order.
//
// Both lists are open. A store with lists behind it is retired rather than
// deleted, so those lists keep their name; an aisle carries no history, so it
// goes, after what it held is moved to an aisle the person picks or back
// under its own heading. The arranging itself is lib/groceryAisles.ts.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet } from '../components/AppActionSheet';
import { AppTextInput } from '../components/AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { PopoverSelect } from '../components/PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  categoryKey,
  describeStoreLayout,
  moveAisle,
  placeableCategories,
  planAisleRemoval,
  type GroceryStoreLayout,
} from '../lib/groceryAisles';
import {
  addGroceryAisle,
  addGroceryStore,
  ADDED_BY_HAND_CATEGORY,
  getGroceryStoreLayout,
  listGroceryStores,
  listSeenGroceryCategories,
  placeGroceryCategory,
  removeGroceryAisle,
  removeGroceryStore,
  renameGroceryAisle,
  renameGroceryStore,
  saveGroceryAisleOrder,
  type GroceryStoreRecord,
} from '../lib/groceryDb';
import { explainNotYet } from '../lib/notYet';
import { ThumbEndRow } from '../components/ThumbEndRow';

const OWN_HEADING = '__own_heading__';

export default function GroceryStoresScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const { storeId: startStoreId } = useLocalSearchParams<{ storeId?: string }>();

  const [stores, setStores] = useState<GroceryStoreRecord[]>([]);
  const [layouts, setLayouts] = useState<Map<string, GroceryStoreLayout>>(new Map());
  const [seenCategories, setSeenCategories] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(startStoreId ?? null);
  const [message, setMessage] = useState('');

  const [newStore, setNewStore] = useState('');
  const [storeRename, setStoreRename] = useState('');
  const [confirmStoreRemove, setConfirmStoreRemove] = useState(false);

  const [newAisle, setNewAisle] = useState('');
  const [editingAisleId, setEditingAisleId] = useState<string | null>(null);
  const [aisleRename, setAisleRename] = useState('');
  const [removingAisleId, setRemovingAisleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all = await listGroceryStores();
    const next = new Map<string, GroceryStoreLayout>();
    for (const store of all) next.set(store.id, await getGroceryStoreLayout(store.id));
    setStores(all);
    setLayouts(next);
    setSeenCategories(await listSeenGroceryCategories());
    setSelectedId((current) => (current && all.some((store) => store.id === current) ? current : all[0]?.id ?? null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selected = stores.find((store) => store.id === selectedId) ?? null;
  const layout = useMemo(
    () => (selected ? layouts.get(selected.id) ?? { aisles: [], placements: {} } : null),
    [selected, layouts],
  );
  const categories = useMemo(
    () => placeableCategories(seenCategories, layout, ADDED_BY_HAND_CATEGORY),
    [seenCategories, layout],
  );

  async function run(action: () => Promise<void | string>, done?: string) {
    setMessage('');
    try {
      await action();
      await load();
      if (done) setMessage(done);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function selectStore(id: string) {
    setSelectedId(id);
    setStoreRename('');
    setEditingAisleId(null);
    setMessage('');
  }

  async function handleAddStore() {
    const name = newStore.trim();
    if (!name) return explainNotYet('Type the name of the store first.');
    await run(async () => {
      const id = await addGroceryStore(name);
      setSelectedId(id);
      setNewStore('');
    });
  }

  async function handleRemoveStore() {
    if (!selected) return;
    setConfirmStoreRemove(false);
    const name = selected.name;
    setMessage('');
    try {
      const outcome = await removeGroceryStore(selected.id);
      setSelectedId(null);
      await load();
      setMessage(
        outcome === 'retired'
          ? `${name} is off the store list. The lists already shopped there keep its name.`
          : `${name} is gone, along with its aisles.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  const removingAisle = layout?.aisles.find((aisle) => aisle.id === removingAisleId) ?? null;
  const removalChoices = layout && removingAisle
    ? [
        ...layout.aisles
          .filter((aisle) => aisle.id !== removingAisle.id)
          .map((aisle) => ({ id: aisle.id as string | null, label: `Move to ${aisle.name}` })),
        { id: null as string | null, label: 'Back under their category headings' },
      ]
    : [];
  const removingHolds = layout && removingAisle
    ? Object.values(layout.placements).filter((id) => id === removingAisle.id).length
    : 0;

  function removeAisle(replacementId: string | null) {
    if (!selected || !layout || !removingAisle) return;
    const plan = planAisleRemoval(layout, removingAisle.id, replacementId);
    const aisleId = removingAisle.id;
    setRemovingAisleId(null);
    setEditingAisleId(null);
    void run(() => removeGroceryAisle(selected.id, aisleId, replacementId), plan.sentence);
  }

  const placementOptions = layout
    ? [
        { label: 'Its category heading', value: OWN_HEADING },
        ...layout.aisles.map((aisle) => ({ label: aisle.name, value: aisle.id })),
      ]
    : [];

  function placedIn(category: string): string {
    if (!layout) return OWN_HEADING;
    for (const [placed, aisleId] of Object.entries(layout.placements)) {
      if (categoryKey(placed) === categoryKey(category)) return aisleId;
    }
    return OWN_HEADING;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.title}>Stores and Aisles</Text>
          <Text style={styles.muted}>
            Lay out a store the way you walk it, and a grocery list for that store reads in the same order. A category left out of every aisle keeps its category heading after the aisles.
          </Text>
        </View>

        {message ? (
          <View style={styles.card}>
            <Text style={styles.body}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Your stores</Text>
          {stores.length === 0 ? (
            <Text style={styles.muted}>No stores yet. Add the first one below.</Text>
          ) : null}
          {stores.map((store) => {
            const active = store.id === selectedId;
            const caption = describeStoreLayout(layouts.get(store.id) ?? null) ?? 'Not arranged yet';
            return (
              <TouchableOpacity
                key={store.id}
                style={[styles.row, active && styles.rowActive]}
                activeOpacity={0.85}
                onPress={() => selectStore(store.id)}
                accessibilityState={{ selected: active }}
              >
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowName}>{store.name}</Text>
                  <Text style={styles.rowMeta}>{caption}</Text>
                </View>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.accent : colors.textMuted} />
              </TouchableOpacity>
            );
          })}
          <Text style={styles.label}>Add a store of your own</Text>
          <ThumbEndRow style={styles.inlineRow}>
            <AppTextInput
              style={[styles.input, styles.flex]}
              value={newStore}
              onChangeText={setNewStore}
              placeholder="Store name"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.smallButton} activeOpacity={0.85} onPress={handleAddStore}>
              <Text style={styles.smallButtonText}>Add</Text>
            </TouchableOpacity>
          </ThumbEndRow>
        </View>

        {selected && layout ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{selected.name}</Text>
            <ThumbEndRow style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.flex]}
                value={storeRename}
                onChangeText={setStoreRename}
                placeholder="Rename this store"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.smallButton}
                activeOpacity={0.85}
                onPress={() => {
                  const name = storeRename.trim();
                  if (!name) return explainNotYet('Type the new name for this store first.');
                  void run(async () => {
                    await renameGroceryStore(selected.id, name);
                    setStoreRename('');
                  }, `Renamed to ${name}, on every list that named it too.`);
                }}
              >
                <Text style={styles.smallButtonText}>Rename</Text>
              </TouchableOpacity>
            </ThumbEndRow>
            <TouchableOpacity style={styles.textButton} activeOpacity={0.85} onPress={() => setConfirmStoreRemove(true)}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.textButtonLabel, { color: colors.danger }]}>Remove this store</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {selected && layout ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Aisles, in the order you walk them</Text>
            {layout.aisles.length === 0 ? (
              <Text style={styles.muted}>No aisles yet. Name them the way the store signs them, or the way you think of them.</Text>
            ) : null}
            {layout.aisles.map((aisle, index) => {
              const held = placeableCategories([], { aisles: layout.aisles, placements: Object.fromEntries(Object.entries(layout.placements).filter(([, id]) => id === aisle.id)) }, null);
              const editing = editingAisleId === aisle.id;
              return (
                <View key={aisle.id} style={styles.aisleWrap}>
                  <View style={styles.aisleRow}>
                    <TouchableOpacity
                      style={styles.rowTextWrap}
                      activeOpacity={0.85}
                      onPress={() => {
                        setEditingAisleId(editing ? null : aisle.id);
                        setAisleRename(aisle.name);
                      }}
                    >
                      <Text style={styles.rowName}>{aisle.name}</Text>
                      <Text style={styles.rowMeta}>{held.length > 0 ? held.join(', ') : 'Nothing placed here yet'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrow}
                      disabled={index === 0}
                      onPress={() => void run(() => saveGroceryAisleOrder(moveAisle(layout.aisles, aisle.id, -1)))}
                      accessibilityLabel={`Move ${aisle.name} earlier`}
                    >
                      <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.border : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrow}
                      disabled={index === layout.aisles.length - 1}
                      onPress={() => void run(() => saveGroceryAisleOrder(moveAisle(layout.aisles, aisle.id, 1)))}
                      accessibilityLabel={`Move ${aisle.name} later`}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={index === layout.aisles.length - 1 ? colors.border : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {editing ? (
                    <View style={styles.editor}>
                      <ThumbEndRow style={styles.inlineRow}>
                        <AppTextInput
                          style={[styles.input, styles.flex]}
                          value={aisleRename}
                          onChangeText={setAisleRename}
                          placeholder="Aisle name"
                          placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity
                          style={styles.smallButton}
                          activeOpacity={0.85}
                          onPress={() => {
                            const name = aisleRename.trim();
                            if (!name) return explainNotYet('Type the new name for this aisle first.');
                            void run(async () => {
                              await renameGroceryAisle(aisle.id, name);
                              setEditingAisleId(null);
                            });
                          }}
                        >
                          <Text style={styles.smallButtonText}>Rename</Text>
                        </TouchableOpacity>
                      </ThumbEndRow>
                      <TouchableOpacity style={styles.textButton} activeOpacity={0.85} onPress={() => setRemovingAisleId(aisle.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text style={[styles.textButtonLabel, { color: colors.danger }]}>Remove this aisle</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Text style={styles.label}>Add an aisle of your own</Text>
            <ThumbEndRow style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.flex]}
                value={newAisle}
                onChangeText={setNewAisle}
                placeholder="Aisle 4, Produce, Back wall"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.smallButton}
                activeOpacity={0.85}
                onPress={() => {
                  const name = newAisle.trim();
                  if (!name) return explainNotYet('Type the aisle name first, for example Produce.');
                  void run(async () => {
                    await addGroceryAisle(selected.id, name);
                    setNewAisle('');
                  });
                }}
              >
                <Text style={styles.smallButtonText}>Add</Text>
              </TouchableOpacity>
            </ThumbEndRow>
          </View>
        ) : null}

        {selected && layout && layout.aisles.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Which aisle each category is in</Text>
            {categories.length === 0 ? (
              <Text style={styles.muted}>Categories appear here once a grocery list has been built.</Text>
            ) : (
              <Text style={styles.muted}>The categories are the ones your grocery lists have used.</Text>
            )}
            {categories.map((category) => (
              <View key={category} style={styles.placementRow}>
                <Text style={[styles.rowName, styles.flex]}>{category}</Text>
                <PopoverSelect
                  selected={placedIn(category)}
                  options={placementOptions}
                  onSelect={(value) =>
                    void run(() => placeGroceryCategory(selected.id, category, value === OWN_HEADING ? null : value))
                  }
                  placeholder="Its category heading"
                  width={200}
                  tabColor={colors.tabLife}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <AppActionSheet
        visible={confirmStoreRemove}
        onClose={() => setConfirmStoreRemove(false)}
        title={selected ? `Remove ${selected.name}?` : 'Remove this store?'}
        message="If any grocery list was shopped there, the store leaves this list and those lists keep its name. If none was, the store and its aisles are deleted."
        actions={[
          { label: 'Remove It', onPress: handleRemoveStore, destructive: true },
          { label: 'Keep It', onPress: () => setConfirmStoreRemove(false) },
        ]}
      />
      <AppActionSheet
        visible={removingAisle != null}
        onClose={() => setRemovingAisleId(null)}
        title={removingAisle ? `Remove ${removingAisle.name}?` : 'Remove this aisle?'}
        message={
          removingHolds > 0
            ? `It holds ${removingHolds} ${removingHolds === 1 ? 'category' : 'categories'}. Pick where ${removingHolds === 1 ? 'it goes' : 'they go'}.`
            : 'Nothing is placed in it.'
        }
        actions={
          removingHolds > 0
            ? [
                ...removalChoices.map((choice) => ({ label: choice.label, onPress: () => removeAisle(choice.id) })),
                { label: 'Keep It', onPress: () => setRemovingAisleId(null) },
              ]
            : [
                { label: 'Remove It', onPress: () => removeAisle(null), destructive: true },
                { label: 'Keep It', onPress: () => setRemovingAisleId(null) },
              ]
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  card: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  flex: { flex: 1 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: 6, ...textShadow },
  body: { ...typography.body, color: colors.textPrimary, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.accent },
  rowTextWrap: { flex: 1, gap: 2 },
  rowName: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
  },
  smallButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  textButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  textButtonLabel: { ...typography.body, ...textShadow },
  aisleWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  aisleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10 },
  arrow: { paddingHorizontal: 8, paddingVertical: 6 },
  editor: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 10,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
});
