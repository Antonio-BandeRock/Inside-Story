import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { listFavorites, listSides } from '../lib/db';
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

  return (
    <View style={styles.wrapper}>
      {/* Sets the native header's own title to whatever category was
          tapped ("Saved Sides," "Favorite Sides," ...) -- this screen has
          no fixed title of its own in app/_layout.tsx's Stack.Screen list
          (unlike profile/assessment/purple-digest) specifically because it
          covers every builder's every category, not one fixed thing. */}
      <Stack.Screen options={{ title: title || 'Saved Items' }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        {items === null ? null : items.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here yet.</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
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
      subtitle: `${side.ingredientCount} ingredient${side.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  return [];
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingTop: 12 },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
