import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, hexToRgba, iridescentSheen } from '../constants/colors';
import {
  FLOATING_BUTTON_SIZE,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
  useBottomLeftHubPosition,
} from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { typography } from '../constants/typography';

export type LensOption<T extends string> = {
  key: T;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

// Wide enough for a 2-column grid where even the longest labels this app
// actually uses ("Cooking & Prep", "Prescriptions", "Food Reactions") sit
// on one line without being cut off -- a 3rd column looked tighter but
// forced ellipsis on exactly those.
const CARD_WIDTH = 260;

// The same floating-hub pattern as TabHub (components/TabHub.tsx), one
// level down: instead of picking which app tab to go to, this picks which
// view within the CURRENT tab is active. Replaces the horizontal row of
// tab pills that used to sit under the header on any screen with more than
// one view (Insights, Schedule, Bio-Compass) -- same size, same popup
// format. The screen using this is responsible for showing which option is
// currently selected via PageIdentityLabel's own activeLensLabel prop (see
// components/PageIdentityLabel.tsx), rendered in the screen's bottom
// corner rather than up in ScreenHeader now.
//
// 2026-07-25: the trigger button itself was redesigned to double as a "you
// are in this tab" marker -- rather than a generic list icon, it shows the
// SAME icon this page has in TabHub's own picker (looked up here by
// matching `pageTitle` against TAB_ROUTES), enlarged, tinted in that tab's
// own identity color, with a diagonal light/color sheen meant to echo the
// butterfly artwork's own iridescence. Icon shape still differs per tab
// (calendar vs. compass vs. medical cross) on top of the color, the same
// shape-plus-color pairing already used for TabHub's colorblind-accessible
// active pill -- color is reinforcement here, not the only signal.
// Anchored to the screen's true bottom-left corner (useBottomLeftHubPosition)
// instead of "one slot left of TabHub" -- being the one hub that identifies
// *which tab you're in* earns it the corner. This is also the one spot to
// flip to the opposite corner whenever the deferred left/right-handed
// layout switch (see CLAUDE.md's Next Steps) gets built. Insights' own
// ScopeHub (app/(tabs)/insights.tsx) moved the other direction, into the
// slot this button vacated, to avoid the two overlapping.
export function LensHub<T extends string>({
  pageTitle,
  options,
  selected,
  onSelect,
}: {
  // Shown as this popup's own header (e.g. "INSIGHTS") -- since this same
  // component serves several different screens, it has no way to know its
  // own page's name otherwise. Also used to find this page's own entry in
  // TAB_ROUTES, for the trigger button's icon/color (see below) -- must
  // match a `title` there exactly. Every tab except Home now has one of
  // these (Home has nothing else inside it to switch between); Food,
  // Trends, and Reports currently pass a single placeholder option each
  // until their real sub-views are designed.
  pageTitle: string;
  options: LensOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const { bottom: buttonBottom, left: buttonLeft } = useBottomLeftHubPosition();
  // Falls back to the brand teal/list icon only if a page ever passes a
  // pageTitle with no TAB_ROUTES match -- shouldn't happen in practice, but
  // cheaper than a crash if a future page's title drifts out of sync.
  const tabRoute = TAB_ROUTES.find((route) => route.title === pageTitle);
  const tabIcon = tabRoute?.icon ?? 'list';
  const tabColor = tabRoute?.color ?? colors.primary;

  function choose(key: T) {
    setOpen(false);
    onSelect(key);
  }

  const cardBottom = buttonBottom + FLOATING_BUTTON_SIZE + 12;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { bottom: buttonBottom, left: buttonLeft, borderColor: hexToRgba(tabColor, 0.55) }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityLabel={`Choose a view for ${pageTitle}`}
      >
        {/* The sheen -- see constants/colors.ts's iridescentSheen for the
            actual recipe, shared with TabHub's own active-item pill so the
            two use the literal same coloration, not just a similar one. */}
        <LinearGradient
          colors={iridescentSheen(tabColor)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name={tabIcon} size={32} color={tabColor} />
      </TouchableOpacity>

      {/* statusBarTranslucent/navigationBarTranslucent: see the identical
          comment on TabHub's own Modal (components/TabHub.tsx) -- same
          Android edge-to-edge gap, same fix, needed on every full-screen
          modal in this family or the OS's own top/bottom bars flash an
          opaque seam only while that one modal happens to be open. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.card, { bottom: cardBottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN, width: CARD_WIDTH }]}>
            <Text style={styles.cardHeader}>{pageTitle}</Text>
            <View style={styles.grid}>
              {options.map((option) => {
                const active = option.key === selected;
                const tintColor = active ? colors.primary : colors.textMuted;
                return (
                  <TouchableOpacity key={option.key} style={styles.item} onPress={() => choose(option.key)} activeOpacity={0.7}>
                    <Ionicons name={option.icon} size={22} color={tintColor} />
                    <Text style={[styles.itemLabel, { color: tintColor }]} numberOfLines={1} ellipsizeMode="tail">
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    // Neutral base rather than a flat colors.primary fill -- the tab's own
    // color now lives in the icon and the sheen overlay instead, so a
    // second, unrelated brand color underneath it would compete rather
    // than reinforce. overflow: 'hidden' clips the sheen gradient (added
    // as a child, see JSX) to this same circle.
    backgroundColor: colors.menuSurface,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  card: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardHeader: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 6,
    marginLeft: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // 2 columns -- wide enough that even this app's longest lens labels
  // ("Cooking & Prep", "Prescriptions", "Food Reactions") sit on one line.
  item: { width: '50%', alignItems: 'center', gap: 2, paddingVertical: 6 },
  itemLabel: { ...typography.caption, fontSize: 11 },
});
