import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { MyItemsCategory } from './MyItemsHub';

// The Digest's own topic-menu look (see purple-digest.tsx's own
// DigestTopicMenu/digestTopicMenuItem), pulled out into a real, reusable
// component rather than copied a second time -- built 2026-08-23 for
// Food's own new resting-screen "Desktop" (see food.tsx), but generic:
// takes the same MyItemsCategory shape MyItemsHub's own popup already
// uses, so any tab building its own Desktop later reads from the exact
// same category data its own "My X" popup (if it has one) already
// computes, no second data shape to keep in sync.
//
// Deliberately dumb/presentational, same split DigestTopicMenu itself
// keeps from its own screen: which categories to show, and what happens
// on tap (a real onPress per category, drilling into a submenu or
// navigating elsewhere), is entirely the caller's own decision.
export function TabDesktopMenu({ categories, tabColor }: { categories: MyItemsCategory[]; tabColor: string }) {
  return (
    <View style={styles.list}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={[styles.item, { borderColor: tabColor }]} onPress={category.onPress} activeOpacity={0.85}>
          <Text style={[styles.itemLabel, { color: tabColor }]} numberOfLines={1}>
            {category.label}
          </Text>
          {category.count !== undefined ? <Text style={styles.itemCount}>{category.count}</Text> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
  },
  itemLabel: { ...typography.label, flex: 1, marginRight: 8 },
  itemCount: { ...typography.caption, color: colors.textSecondary },
});
