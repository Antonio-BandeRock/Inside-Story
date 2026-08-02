import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { deleteSide, listFavorites, listSides } from '../lib/db';
import { useInfoAlert } from '../components/InfoAlert';

// A Stack push outside the (tabs) group, same shape as app/profile.tsx/
// app/purple-digest.tsx -- reached by tapping a category link in
// MyItemsHub.tsx's own popup (2026-08-01), which replaced that popup's
// previous "show everything inline, tap nothing" list after being
// reported as having nothing selectable in it.
//
// Deliberately one shared screen for every builder's own saved/favorited
// items, not a separate route per builder -- itemType decides WHICH
// builder's own data to fetch (see loadItems' own switch below), so
// adding a new builder's category later (Salad, Smoothie, ...) means
// adding one more case there, not a new screen. This mirrors the same
// "specific to the builders themselves" decision already made for the
// underlying tables (see lib/db.ts's own sides/side_ingredients comment)
// -- the STORAGE stays per-builder, but the LIST UI that browses whatever
// storage exists doesn't need to be.
//
// Tapping a real SAVED item (not yet a favorite -- see the tap handler's
// own comment below) opens app/food-item-detail.tsx, 2026-08-01: a
// side-scoped entry point into Insights' own Nutrients/6 Dimensions/
// Cooking & Prep lenses, reusing that already-built rendering rather than
// a parallel viewer here. Favorites (and any future itemType this
// screen's own loadItems doesn't handle yet) still show an honest "coming
// soon" message on tap, same pattern as this app's own not-yet-built
// lenses elsewhere.
type FoodItemEntry = { id: string; title: string; subtitle?: string };

export default function FoodItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const { itemType, status, title } = useLocalSearchParams<{ itemType: string; status: string; title: string }>();
  const [items, setItems] = useState<FoodItemEntry[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setItems(null);
    loadItems(itemType, status).then((loaded) => {
      if (isCurrent) setItems(loaded);
    });
    return () => {
      isCurrent = false;
    };
  }, [itemType, status]);

  // Refetches in place after a delete, rather than navigating anywhere --
  // the person is deleting FROM this list, so staying on it (now one item
  // shorter) is the expected result, same as any list-with-delete pattern
  // elsewhere in the app.
  async function refreshItems() {
    setItems(await loadItems(itemType, status));
  }

  function handleDelete(item: FoodItemEntry) {
    Alert.alert(`Delete "${item.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(itemType, item.id);
          await refreshItems();
        },
      },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      {/* Sets the native header's own title to whatever category was
          tapped ("Saved Sides," "Favorite Sides," ...) -- this screen has
          no fixed title of its own in app/_layout.tsx's Stack.Screen list
          (unlike profile/assessment/purple-digest) specifically because it
          covers every builder's every category, not one fixed thing. */}
      {/* headerLeft: () => null, 2026-08-02 -- explicitly requested: this
          is the actual "Saved Sides" list screen (the request was about
          this screen the whole time -- an earlier pass mistakenly edited
          food-item-detail.tsx, a different screen, instead). The floating
          Close button below already leaves the screen; the native
          header's own top-left back chevron was a redundant second way to
          do the same thing, and the one control here that didn't follow
          this app's own bottom-anchored, thumb-reachable convention. */}
      <Stack.Screen options={{ title: title || 'Saved Items', headerLeft: () => null }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        {items === null ? null : items.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here yet.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={styles.itemTapArea}
                onPress={() => {
                  // Only a real saved item (not yet a favorite -- those are
                  // a different, JSON-payload shape with no ingredients to
                  // show yet, see lib/db.ts's own favorites table) has
                  // anything for food-item-detail.tsx to actually show.
                  if (status === 'saved' && itemType === 'side') {
                    router.push({ pathname: '/food-item-detail', params: { itemType, id: item.id, title: item.title } });
                    return;
                  }
                  showInfoAlert(
                    item.title,
                    'Full detail view -- Nutrients, 6 Dimensions, and Cooking & Prep for this item -- is coming soon.',
                  );
                }}
              >
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              {/* Edit/Delete, 2026-08-01 -- explicitly requested after a
                  saved side turned out to have no way to fix a mistaken
                  ingredient once saved. Scoped to real saved items only
                  (not favorites -- a different, not-yet-editable shape, see
                  the tap handler's own comment above), and only for
                  itemTypes supportsEdit/deleteItem below actually support --
                  grows by one case in each of those, not a UI change here,
                  as more builders get their own real save path. */}
              {status === 'saved' && supportsEdit(itemType) ? (
                <TouchableOpacity
                  style={styles.itemActionButton}
                  onPress={() => {
                    // Side pushes into app/(tabs)/food.tsx's own Side
                    // Builder pre-loaded via editSideId (see that file and
                    // SideBuilder.tsx's own editSideId prop). Written
                    // inline (not returned from a helper) so the route's
                    // own literal pathname stays visible to Expo Router's
                    // typed-routes checking -- a helper returning a plain
                    // `string` pathname would widen it past what
                    // router.push's typed Href accepts.
                    if (itemType === 'side') {
                      router.push({ pathname: '/food', params: { editSideId: item.id } });
                    }
                  }}
                  accessibilityLabel={`Edit ${item.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="pencil-outline" size={19} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
              {status === 'saved' && supportsDelete(itemType) ? (
                <TouchableOpacity
                  style={styles.itemActionButton}
                  onPress={() => handleDelete(item)}
                  accessibilityLabel={`Delete ${item.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={19} color={colors.danger} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
      {infoAlertElement}

      {/* Same circular floating close button as profile.tsx/purple-digest.tsx's
          own -- see purple-digest.tsx's own comment for why this stays
          colors.primary rather than any one builder's identity color: a
          neutral "close" affordance, not tied to whichever category this
          happens to be showing. */}
      <TouchableOpacity
        style={[styles.closeButton, { bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET }]}
        onPress={() => router.back()}
        activeOpacity={0.85}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

// Fetches whichever builder's own data this category actually needs --
// the one place this screen knows about specific builders/tables at all.
// Grows by one case as each builder gets a real save path; Side is the
// first and only one right now.
async function loadItems(itemType: string | undefined, status: string | undefined): Promise<FoodItemEntry[]> {
  if (itemType === 'side') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'side');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const sides = await listSides();
    return sides.map((side) => ({
      id: side.id,
      title: side.name,
      // The actual ingredients, not just a count, 2026-08-02 -- explicitly
      // requested: two differently-built "Mixed Vegetable Medley" sides
      // read identically as "N ingredients" before this. Falls back to
      // the count only for the (not currently reachable) zero-ingredient
      // case ingredientNames itself can't cover.
      subtitle: side.ingredientNames || `${side.ingredientCount} ingredient${side.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  return [];
}

// Whether this itemType supports Edit/Delete at all -- kept as two
// separate checks (rather than one) since an itemType could in principle
// support one without the other, even though today they're the same set
// (Side, only). Grows by one case per builder as each gets a real save
// path, same as loadItems above.
function supportsEdit(itemType: string | undefined): boolean {
  return itemType === 'side';
}

function supportsDelete(itemType: string | undefined): boolean {
  return itemType === 'side';
}

async function deleteItem(itemType: string | undefined, id: string): Promise<void> {
  if (itemType === 'side') {
    await deleteSide(id);
  }
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  // flexGrow + justifyContent: 'flex-end', 2026-08-02, explicitly
  // requested -- with only a few saved items, they used to stack from the
  // top, leaving the bottom of the screen (the easiest place for a thumb
  // to reach one-handed) empty. flexGrow lets this container fill the
  // ScrollView's own viewport when content is shorter than it, which is
  // what flex-end has room to push against; once real content exceeds
  // that height, normal scrolling takes over and this has no effect --
  // never fights a long list, only fills empty space in a short one.
  container: { padding: 16, paddingTop: 12, flexGrow: 1, justifyContent: 'flex-end' },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // The tappable "open detail" part of the row -- everything except the
  // Edit/Delete buttons, which sit outside it as their own separate
  // touch targets rather than nested TouchableOpacitys (nesting one
  // touchable inside another is unreliable on Android, where the outer
  // one can swallow taps meant for the inner one).
  itemTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  // marginRight, 2026-08-02, explicitly requested -- Delete in particular
  // sat flush against the screen's true edge (only the container's own
  // 16px padding away from it); this pulls both action buttons a bit
  // further in, and as a side effect gives Edit/Delete a touch more
  // breathing room from each other too.
  itemActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 6,
  },
  itemTextWrap: { flex: 1, marginRight: 12 },
  itemTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
