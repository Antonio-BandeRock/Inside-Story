import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  deleteBakedGoods,
  deleteBeverage,
  deleteDessert,
  deleteFavorite,
  deleteFermentation,
  deleteHandheld,
  deleteSalad,
  deleteSauce,
  deleteScannedProduct,
  deleteSide,
  deleteSmoothie,
  deleteSnack,
  deleteSoup,
  listBakedGoods,
  listBeverages,
  listDesserts,
  listFavorites,
  listFermentations,
  listHandhelds,
  listSalads,
  listSauces,
  listScannedProducts,
  listSides,
  listSmoothies,
  listSnacks,
  listSoups,
} from '../lib/db';
import { useConfirmSheet } from '../components/ConfirmSheet';
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
// side-scoped entry point into Insights' own Nutrients/Condition Scores/
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
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
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

  async function handleDelete(item: FoodItemEntry) {
    const ok = await confirmSheet({
      title: `Delete "${item.title}"?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    // Favorites live in the one shared, generic favorites table (see
    // lib/db.ts) regardless of itemType, so deleting one never needs the
    // per-builder deleteItem switch below -- 2026-08-08.
    if (status === 'favorite') {
      await deleteFavorite(item.id);
    } else {
      await deleteItem(itemType, item.id);
    }
    await refreshItems();
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
                  // "My Food Products," 2026-08-16 -- a real, dedicated
                  // detail screen (app/food-product-detail.tsx), genuinely
                  // different in shape from every builder's own saved
                  // item (one nutrient panel, one photo, real price-over-
                  // time history, no 6-Dimensions ingredient breakdown),
                  // so this is checked and returned first, ahead of the
                  // big itemType OR-chain just below that food-item-
                  // detail.tsx's own shape actually applies to.
                  if (itemType === 'scannedProduct') {
                    router.push({ pathname: '/food-product-detail', params: { id: item.id, title: item.title } });
                    return;
                  }
                  // Only a real saved item (not yet a favorite -- those are
                  // a different, JSON-payload shape with no ingredients to
                  // show yet, see lib/db.ts's own favorites table) has
                  // anything for food-item-detail.tsx to actually show.
                  if (
                    status === 'saved' &&
                    (itemType === 'side' ||
                      itemType === 'salad' ||
                      itemType === 'smoothie' ||
                      itemType === 'fermentation' ||
                      itemType === 'beverage' ||
                      itemType === 'snack' ||
                      itemType === 'bakedGoods' ||
                      itemType === 'soup' ||
                      itemType === 'sauce' ||
                      itemType === 'handheld' ||
                      itemType === 'dessert')
                  ) {
                    router.push({ pathname: '/food-item-detail', params: { itemType, id: item.id, title: item.title } });
                    return;
                  }
                  // "Use this Favorite," 2026-08-08 -- tapping a favorite
                  // resumes the matching builder pre-loaded with its own
                  // saved ingredients (via app/(tabs)/food.tsx's own
                  // fromSideFavoriteId/fromSaladFavoriteId/etc. params, the
                  // exact same shape as the Edit button's editSideId/etc.
                  // params just below, except this always produces a
                  // genuinely NEW saved item rather than editing the
                  // favorite itself -- a favorite is a reusable template,
                  // not a record with its own detail view). Written inline
                  // for the same typed-routes reason the Edit button's own
                  // block already explains.
                  if (status === 'favorite') {
                    if (itemType === 'side') {
                      router.push({ pathname: '/food', params: { fromSideFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'salad') {
                      router.push({ pathname: '/food', params: { fromSaladFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'smoothie') {
                      router.push({ pathname: '/food', params: { fromSmoothieFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'fermentation') {
                      router.push({ pathname: '/food', params: { fromFermentationFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'beverage') {
                      router.push({ pathname: '/food', params: { fromBeverageFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'snack') {
                      router.push({ pathname: '/food', params: { fromSnackFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'bakedGoods') {
                      router.push({ pathname: '/food', params: { fromBakedGoodsFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'soup') {
                      router.push({ pathname: '/food', params: { fromSoupFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'sauce') {
                      router.push({ pathname: '/food', params: { fromSauceFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'handheld') {
                      router.push({ pathname: '/food', params: { fromHandheldFavoriteId: item.id } });
                      return;
                    } else if (itemType === 'dessert') {
                      router.push({ pathname: '/food', params: { fromDessertFavoriteId: item.id } });
                      return;
                    }
                    // 'meal' favorites (see saveMealFavorite in lib/db.ts),
                    // 2026-08-08 -- resumes Meal Builder pre-loaded with the
                    // favorite's own saved components (see
                    // MealBuilder.tsx's own favoriteId prop/effect).
                    if (itemType === 'meal') {
                      router.push({ pathname: '/food', params: { mealFavoriteId: item.id } });
                      return;
                    }
                  }
                  showInfoAlert(
                    item.title,
                    'Full detail view (Nutrients, Condition Scores, and Cooking & Prep for this item) is coming soon.',
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
                    // Side/Salad/Smoothie/Fermentation/Beverage/Snack/
                    // BakedGoods/Soup/Sauces/Handhelds/Dessert each push into
                    // app/(tabs)/food.tsx's own builder pre-loaded via
                    // editSideId/editSaladId/editSmoothieId/
                    // editFermentationId/editBeverageId/editSnackId/
                    // editBakedGoodsId/editSoupId/editSauceId/
                    // editHandheldId/editDessertId (see that file and
                    // SideBuilder.tsx/SaladBuilder.tsx/SmoothieBuilder.tsx/
                    // FermentationBuilder.tsx/BeverageBuilder.tsx/
                    // SnackBuilder.tsx/BakedGoodsBuilder.tsx/SoupBuilder.tsx/
                    // SaucesBuilder.tsx/HandheldsBuilder.tsx/
                    // DessertBuilder.tsx's own props).
                    // Written inline (not returned from a helper) so each
                    // route's own literal
                    // pathname/params stay visible to Expo Router's
                    // typed-routes checking -- a helper returning a plain
                    // `string` pathname would widen it past what
                    // router.push's typed Href accepts.
                    if (itemType === 'side') {
                      router.push({ pathname: '/food', params: { editSideId: item.id } });
                    } else if (itemType === 'salad') {
                      router.push({ pathname: '/food', params: { editSaladId: item.id } });
                    } else if (itemType === 'smoothie') {
                      router.push({ pathname: '/food', params: { editSmoothieId: item.id } });
                    } else if (itemType === 'fermentation') {
                      router.push({ pathname: '/food', params: { editFermentationId: item.id } });
                    } else if (itemType === 'beverage') {
                      router.push({ pathname: '/food', params: { editBeverageId: item.id } });
                    } else if (itemType === 'snack') {
                      router.push({ pathname: '/food', params: { editSnackId: item.id } });
                    } else if (itemType === 'bakedGoods') {
                      router.push({ pathname: '/food', params: { editBakedGoodsId: item.id } });
                    } else if (itemType === 'soup') {
                      router.push({ pathname: '/food', params: { editSoupId: item.id } });
                    } else if (itemType === 'sauce') {
                      router.push({ pathname: '/food', params: { editSauceId: item.id } });
                    } else if (itemType === 'handheld') {
                      router.push({ pathname: '/food', params: { editHandheldId: item.id } });
                    } else if (itemType === 'dessert') {
                      router.push({ pathname: '/food', params: { editDessertId: item.id } });
                    }
                  }}
                  accessibilityLabel={`Edit ${item.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="pencil-outline" size={19} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
              {/* Track, 2026-08-20 -- the Fermentation Tracker's own real
                  entry point from a saved fermentation. Scoped to
                  itemType==='fermentation' && status==='saved' only, the
                  same real "editable saved item" scope Edit above already
                  uses -- a favorite has nothing to track yet (see the tap
                  handler's own "Use this Favorite" comment above), and no
                  other itemType has a Tracker to open. */}
              {status === 'saved' && itemType === 'fermentation' ? (
                <TouchableOpacity
                  style={styles.itemActionButton}
                  onPress={() => router.push({ pathname: '/fermentation-tracker', params: { fermentationId: item.id, fermentationName: item.title } })}
                  accessibilityLabel={`Track ${item.title}`}
                  hitSlop={8}
                >
                  <Ionicons name="flask-outline" size={19} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
              {/* Favorites are deletable too, 2026-08-08 -- the same generic
                  favorites table every itemType shares (see handleDelete's
                  own comment above), so this reuses supportsDelete's
                  existing itemType check rather than a separate favorite-
                  specific allowlist. No Edit button for a favorite -- "Use
                  this Favorite" (the tap handler above) already opens it in
                  a real, editable builder before anything is saved. */}
              {(status === 'saved' || status === 'favorite') && supportsDelete(itemType) ? (
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
      {confirmSheetElement}

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
// Grows by one case as each builder gets a real save path; Side, Salad,
// Smoothie, Fermentation, Beverage, Snack, Baked Goods, Soup, and Sauces
// are all nine sub-builders now covered -- Meal Builder assembles from
// these rather than adding a tenth case here.
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
  if (itemType === 'salad') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'salad');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const salads = await listSalads();
    return salads.map((salad) => ({
      id: salad.id,
      title: salad.name,
      subtitle: salad.ingredientNames || `${salad.ingredientCount} ingredient${salad.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'smoothie') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'smoothie');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const smoothies = await listSmoothies();
    return smoothies.map((smoothie) => ({
      id: smoothie.id,
      title: smoothie.name,
      subtitle: smoothie.ingredientNames || `${smoothie.ingredientCount} ingredient${smoothie.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'fermentation') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'fermentation');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const fermentations = await listFermentations();
    return fermentations.map((fermentation) => ({
      id: fermentation.id,
      title: fermentation.name,
      subtitle:
        fermentation.ingredientNames || `${fermentation.ingredientCount} ingredient${fermentation.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'beverage') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'beverage');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const beverages = await listBeverages();
    return beverages.map((beverage) => ({
      id: beverage.id,
      title: beverage.name,
      subtitle: beverage.ingredientNames || `${beverage.ingredientCount} ingredient${beverage.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'snack') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'snack');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const snacks = await listSnacks();
    return snacks.map((snack) => ({
      id: snack.id,
      title: snack.name,
      subtitle: snack.ingredientNames || `${snack.ingredientCount} ingredient${snack.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'bakedGoods') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'bakedGoods');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const bakedGoods = await listBakedGoods();
    return bakedGoods.map((bakedGood) => ({
      id: bakedGood.id,
      title: bakedGood.name,
      subtitle: bakedGood.ingredientNames || `${bakedGood.ingredientCount} ingredient${bakedGood.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'soup') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'soup');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const soups = await listSoups();
    return soups.map((soup) => ({
      id: soup.id,
      title: soup.name,
      subtitle: soup.ingredientNames || `${soup.ingredientCount} ingredient${soup.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'sauce') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'sauce');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const sauces = await listSauces();
    return sauces.map((sauce) => ({
      id: sauce.id,
      title: sauce.name,
      subtitle: sauce.ingredientNames || `${sauce.ingredientCount} ingredient${sauce.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'handheld') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'handheld');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const handhelds = await listHandhelds();
    return handhelds.map((handheld) => ({
      id: handheld.id,
      title: handheld.name,
      subtitle: handheld.ingredientNames || `${handheld.ingredientCount} ingredient${handheld.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  if (itemType === 'dessert') {
    if (status === 'favorite') {
      const favorites = await listFavorites(50, 'dessert');
      return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
    }
    const desserts = await listDesserts();
    return desserts.map((dessert) => ({
      id: dessert.id,
      title: dessert.name,
      subtitle: dessert.ingredientNames || `${dessert.ingredientCount} ingredient${dessert.ingredientCount === 1 ? '' : 's'}`,
    }));
  }
  // 'meal' has no 'saved' status ever reachable here (My Foods has no
  // "Saved Meals" tile -- see food.tsx's own mealFavoriteCount comment for
  // why), only 'favorite'.
  if (itemType === 'meal' && status === 'favorite') {
    const favorites = await listFavorites(50, 'meal');
    return favorites.map((favorite) => ({ id: favorite.id, title: favorite.name }));
  }
  // "My Food Products," 2026-08-16 -- real barcode-scanned items, always
  // 'saved' (there's no favorite concept for these -- a scanned product IS
  // the real, specific thing bought, not a reusable template). id is
  // scanned_products' own real INTEGER primary key, stringified to match
  // FoodItemEntry's own id type -- food-product-detail.tsx converts it
  // back to a number on the way in.
  if (itemType === 'scannedProduct') {
    const products = await listScannedProducts();
    return products.map((product) => ({
      id: String(product.id),
      title: product.name,
      subtitle: product.brand ?? undefined,
    }));
  }
  return [];
}

// Whether this itemType supports Edit/Delete at all -- kept as two
// separate checks (rather than one) since an itemType could in principle
// support one without the other, even though today they're the same set
// (Side, Salad, Smoothie, Fermentation, Beverage, Snack, Baked Goods, Soup,
// Sauces, Handhelds, and Dessert -- every sub-builder Meal Builder will
// eventually assemble from). Grows by one case per builder as each gets a
// real save path, same as loadItems above.
function supportsEdit(itemType: string | undefined): boolean {
  return (
    itemType === 'side' ||
    itemType === 'salad' ||
    itemType === 'smoothie' ||
    itemType === 'fermentation' ||
    itemType === 'beverage' ||
    itemType === 'snack' ||
    itemType === 'bakedGoods' ||
    itemType === 'soup' ||
    itemType === 'sauce' ||
    itemType === 'handheld' ||
    itemType === 'dessert'
  );
}

function supportsDelete(itemType: string | undefined): boolean {
  return (
    itemType === 'side' ||
    itemType === 'salad' ||
    itemType === 'smoothie' ||
    itemType === 'fermentation' ||
    itemType === 'beverage' ||
    itemType === 'snack' ||
    itemType === 'bakedGoods' ||
    itemType === 'soup' ||
    itemType === 'sauce' ||
    itemType === 'handheld' ||
    itemType === 'dessert' ||
    // 'meal' only ever reaches this screen as a favorite (see loadItems'
    // own 'meal' case above -- there's no 'saved' status for it), and
    // handleDelete's own status === 'favorite' branch always routes through
    // deleteFavorite rather than the deleteItem switch below, so this is
    // safe without a matching case there. Deliberately absent from
    // supportsEdit above -- "Use this Favorite" (the tap handler) already
    // covers reusing one; there's no separate "edit a meal favorite in
    // place" concept the way editSideId etc. has for a real saved record.
    itemType === 'meal' ||
    // 'scannedProduct' -- 2026-08-16, real "My Food Products" support.
    // Deliberately absent from supportsEdit too, same reasoning as 'meal':
    // this list's own row has no Edit pencil, since real editing (name,
    // ingredients text) happens inside food-product-detail.tsx itself,
    // reached by the row's own tap, not a second, separate quick-action.
    itemType === 'scannedProduct'
  );
}

async function deleteItem(itemType: string | undefined, id: string): Promise<void> {
  if (itemType === 'side') {
    await deleteSide(id);
  } else if (itemType === 'salad') {
    await deleteSalad(id);
  } else if (itemType === 'smoothie') {
    await deleteSmoothie(id);
  } else if (itemType === 'fermentation') {
    await deleteFermentation(id);
  } else if (itemType === 'beverage') {
    await deleteBeverage(id);
  } else if (itemType === 'snack') {
    await deleteSnack(id);
  } else if (itemType === 'bakedGoods') {
    await deleteBakedGoods(id);
  } else if (itemType === 'soup') {
    await deleteSoup(id);
  } else if (itemType === 'sauce') {
    await deleteSauce(id);
  } else if (itemType === 'handheld') {
    await deleteHandheld(id);
  } else if (itemType === 'dessert') {
    await deleteDessert(id);
  } else if (itemType === 'scannedProduct') {
    await deleteScannedProduct(Number(id));
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
