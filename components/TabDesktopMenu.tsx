import { StyleSheet, View } from 'react-native';
import { HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import type { MyItemsCategory } from './MyItemsHub';

// Built 2026-08-23 for Food's own resting-screen "Desktop" (see food.tsx)
// as a copy of the Digest's topic-menu look, and generic: it takes the same
// MyItemsCategory shape MyItemsHub's own popup already uses, so any tab
// building its own Desktop reads from the exact same category data its
// "My X" popup (if it has one) already computes, no second data shape to
// keep in sync.
//
// 2026-09-12: each row is a HomeSectionBand action row (the band look
// passed through to Food, direct request), so it reads the same as Home's
// own Grocery List row: icon and name in the tab colour, the count at the
// right edge, a chevron pointing forward, edge to edge. The caller's
// ScrollView carries no horizontal padding for that reason.
//
// Deliberately dumb/presentational, same split DigestTopicMenu itself
// keeps from its own screen: which categories to show, and what happens
// on tap (a real onPress per category, drilling into a submenu or
// navigating elsewhere), is entirely the caller's own decision.
export function TabDesktopMenu({ categories, tabColor }: { categories: MyItemsCategory[]; tabColor: string }) {
  return (
    <View style={styles.list}>
      {categories.map((category) => (
        <HomeSectionBand
          key={category.id}
          kind="action"
          title={category.label}
          icon={category.icon ?? 'folder-outline'}
          color={tabColor}
          value={category.count !== undefined ? String(category.count) : undefined}
          caption={category.caption}
          onPress={category.onPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: HOME_BAND_GAP },
});
