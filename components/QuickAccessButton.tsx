// One quick-access button on the thumb side, 1.0.66.6 (2026-10-10). Direct
// request: "Let's change Where is it and Ask Your Records from being on the
// Home screen to being quick access buttons on the navigation hand side.
// However, I think maybe now that there will be four buttons, we should make
// it one button with 4 choices on it." And for the menu: "Make the 4 choices
// be a list of 4 pressed backgrounded behind the text of each choice with a
// different background behind them all for it to make the menu pop."
//
// The edge tab is the navigation switch's shape (components/EdgeTab.tsx), just
// above the footer where the voice note's tab used to be. A tap opens a short
// list right above it: each choice sits in a dark pressed-in well, and the
// wells sit on the lighter menu panel, so the list stands out from
// whatever screen is behind it. The voice note is the choice nearest the
// thumb, since it is the one that has to be quick.
//
// Most choices open sheets mounted elsewhere at the root (the voice note and
// Low Stimulation, which kept their sheets when they lost their own tabs, Ask
// Your Records, and Store Its Location), through lib/quickAccess.ts. Where
// Is It is a screen.
//
// Store Its Location joined in 1.0.66.9 as Where Is It's companion, by
// direct request: "Where is it can only draw on what the user has told it
// about where something is located. We need a button for them to do that."
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useSyncExternalStore, type ComponentProps } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { useNavigationHand } from '../lib/navigationHand';
import { getHubSpots, otherHubSpots, registerHubSpot, subscribeHubSpots } from '../lib/hubHandoff';
import { openQuickAccessSheet } from '../lib/quickAccess';
import { EDGE_TAB_HEIGHT, EDGE_TAB_WIDTH, EdgeTab } from './EdgeTab';
import { HANDOFF_LABELS } from './HubHandoff';

const GAP_ABOVE_FOOTER = 8;
const MENU_WIDTH = 250;

type Choice = {
  key: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  run: () => void;
};

export function QuickAccessButton() {
  const hand = useNavigationHand();
  const footerHeight = useFooterBandHeight();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const prefs = useVisualPreferences();
  const [open, setOpen] = useState(false);
  const bottom = footerHeight + GAP_ABOVE_FOOTER;
  const menuBottom = bottom + EDGE_TAB_HEIGHT + 6;
  const maxHeight = Math.max(160, windowHeight - menuBottom - insets.top - 16);
  const lowStimulationOn = prefs.lowStimulation;

  // A change of mind goes straight to the other menu, 1.0.66.8. Direct
  // instruction: with this menu open, pressing the TabHub or a LensHub button
  // shows that menu and this one goes away. Both directions run through
  // lib/hubHandoff.ts: this button registers where it is, so the hubs' own
  // menus carry a stand-in for it, and this menu carries a stand-in for each
  // of theirs over its backdrop.
  const tabLeft = hand === 'right' ? windowWidth - EDGE_TAB_WIDTH : 0;
  useEffect(
    () =>
      registerHubSpot({ key: 'quick', left: tabLeft, bottom, width: EDGE_TAB_WIDTH, height: EDGE_TAB_HEIGHT, open: () => setOpen(true) }),
    [tabLeft, bottom],
  );
  const allHubs = useSyncExternalStore(subscribeHubSpots, getHubSpots, getHubSpots);
  const otherHubs = otherHubSpots(allHubs, 'quick');

  useEffect(() => {
    if (!open) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  function pick(run: () => void) {
    setOpen(false);
    run();
  }

  // Top to bottom as drawn; the last one is nearest the thumb.
  const choices: Choice[] = [
    { key: 'ask', label: 'Ask Your Records', icon: 'help-circle-outline', run: () => openQuickAccessSheet('askRecords') },
    { key: 'where', label: 'Where Is It', icon: 'location-outline', run: () => router.push({ pathname: '/where-is-it', params: { listen: '1' } }) },
    { key: 'storeLocation', label: 'Store Its Location', icon: 'pin-outline', run: () => openQuickAccessSheet('storeLocation') },
    {
      key: 'lowStimulation',
      label: lowStimulationOn ? 'Low Stimulation is on' : 'Low Stimulation',
      icon: lowStimulationOn ? 'moon' : 'moon-outline',
      run: () => openQuickAccessSheet('lowStimulation'),
    },
    { key: 'voice', label: 'Voice Note', icon: 'mic-outline', run: () => openQuickAccessSheet('voiceNote') },
  ];

  const menuSide = hand === 'right' ? { right: 8 } : { left: 8 };

  return (
    <>
      <EdgeTab
        side={hand}
        bottom={bottom}
        onPress={() => setOpen((was) => !was)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="Quick access"
        accessibilityHint="Opens Voice Note, Low Stimulation, Store Its Location, Where Is It and Ask Your Records"
        accessibilityState={{ expanded: open }}
      >
        <Ionicons name="grid-outline" size={18} color={colors.textPrimary} />
      </EdgeTab>
      {open ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessible={false} />
          {otherHubs.map((spot) => (
            <Pressable
              key={spot.key}
              style={{ position: 'absolute', left: spot.left, bottom: spot.bottom, width: spot.width, height: spot.height }}
              onPress={() => pick(spot.open)}
              accessibilityRole="button"
              accessibilityLabel={HANDOFF_LABELS[spot.key]}
            />
          ))}
          <View style={[styles.panel, menuSide, { bottom: menuBottom, maxHeight }]}>
            <ScrollView contentContainerStyle={styles.list} bounces={false}>
              {choices.map((choice) => (
                <Pressable
                  key={choice.key}
                  onPress={() => pick(choice.run)}
                  accessibilityRole="button"
                  accessibilityLabel={choice.label}
                  style={({ pressed }) => [styles.well, pressed ? styles.wellPressed : null]}
                >
                  <Ionicons name={choice.icon} size={20} color={colors.textPrimary} style={textShadow} />
                  <Text style={styles.label}>{choice.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // The panel behind every choice: the lighter menu grey with a firm border and a
  // drop shadow, so the list lifts off the screen behind it.
  panel: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  // 8 to 4 and wells 12 to 6 padding in 1.0.66.7, direct instruction: half
  // the space between, each choice about a quarter shorter (48 to 36 dp).
  list: { gap: 4 },
  // Each choice in a pressed-in well: darker than the panel, its top edge
  // shaded and its bottom edge catching light, the way a recess reads.
  well: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.6)',
    borderLeftColor: 'rgba(0,0,0,0.45)',
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  wellPressed: { backgroundColor: 'rgba(0,0,0,0.55)' },
  label: { ...typography.bodyEmphasis, fontWeight: '400', color: colors.textPrimary, flexShrink: 1, ...textShadow },
});
