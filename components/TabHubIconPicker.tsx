// The card a long press on the TabHub button opens, or a right-click on it on
// a computer, for picking the icon the button wears (1.0.66.17). Direct
// request, 2026-10-10: "adding a long press on the tabhub menu icon to change
// it to one of the others. I would want them to be displayed in the same size
// of box as the lenshub menus, and work just like them," then "put a right
// click on the desktop version."
//
// So it is a LensHub card in every measurement: the same span, bottom, height
// and least height (cardHeightFor, cardMinHeightFor), the same columns and
// label, a scrolling grid, and held invisible until the window is up.
//
// Each choice sits in the button's own pressed-in well, shrunk (1.0.66.18).
// Direct request, 2026-10-10: "do the small versions so they are easier to
// see, but make the new version bigger in the menu so the choices are at
// least as big as they are now, but a little bigger in their menu would be
// better." So every icon is shown as it will look on the button, and the
// artwork inside the well comes out a little larger than the 30 point bare
// icons the card first had. The one on the button now wears the same well
// lit up: a stronger glow and rim in the ground theme colour. A tap on an icon puts it on the button at once and closes the
// card; a tap outside closes it with nothing changed.
//
// The icons and their groups come from lib/tabHubIconOptions.ts, the same list
// Profile > Appearance shows, and a pick goes through chooseTabHubIcon there,
// so the Recent row at the top holds picks made in either place.
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, lighten, MENU_LABEL_LIGHTEN_FRACTION } from '../constants/colors';
import { useHubMenuCardSpan, useMenuCardBottom, useMenuCardFit } from '../constants/floatingButton';
import {
  TAB_HUB_ICON_SOURCES,
  TAB_HUB_WELL_GLOW_OPACITY,
  TAB_HUB_WELL_RIM_OPACITY,
  tabHubIconSizeInWell,
} from '../constants/tabHubIcons';
import { MENU_MAX_FONT_SCALE, menuLabelShadow, menuLineHeight, textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { gridColumnsFor } from '../lib/menuFit';
import {
  chooseTabHubIcon,
  recentTabHubIcons,
  TAB_HUB_ICON_GROUPS,
  tabHubIconLabel,
  type TabHubIconOption,
} from '../lib/tabHubIconOptions';
import { modalAnimationType } from '../lib/visualPreferences';
import { ActiveRingCircle } from './ActiveRingCircle';
import { cardHeightFor, cardMinHeightFor, GRID_MIN_COLUMN_WIDTH } from './LensHub';

// LensHub's card padding and label, measure for measure.
const CARD_PADDING = 8;
const LABEL_FONT_SIZE = 11;
// The well each choice sits in. At 48 the artwork inside reaches about 44
// points across, against the 30 the bare icons had.
const WELL_SIZE = 48;
// The icon on the button now: its well lit up rather than ringed.
const ACTIVE_GLOW_OPACITY = 0.7;
const ACTIVE_RIM_OPACITY = 1;
// The ring TabHub's own menu card wears, since this card belongs to that
// button rather than to any one tab.
const CARD_RING_LIGHTEN_FRACTION = 0.35;

type Props = { visible: boolean; onClose: () => void };

export function TabHubIconPicker({ visible, onClose }: Props) {
  const { tabHubIcon, tabHubIconRecent } = useVisualPreferences();
  const [cardReady, setCardReady] = useState(false);
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { left: cardLeft, width: cardWidth } = useHubMenuCardSpan();
  const cardBottom = useMenuCardBottom();
  const cardFit = useMenuCardFit(cardHeightFor(fontScale), cardMinHeightFor(fontScale));
  const columns = gridColumnsFor({ innerWidth: cardWidth - CARD_PADDING * 2, columnWidth: GRID_MIN_COLUMN_WIDTH, minColumns: 3 });
  const itemWidthPercent = 100 / columns;
  const ringColor = lighten(colors.buttonColor, CARD_RING_LIGHTEN_FRACTION);

  // Only worth a row once there is somewhere other than here to go back to.
  const recent = recentTabHubIcons(tabHubIconRecent);
  const groups: { key: string; title: string; options: TabHubIconOption[] }[] = [
    ...(recent.length > 1
      ? [{ key: 'recent', title: 'Recent', options: recent.map((key) => ({ key, label: tabHubIconLabel(key) ?? key })) }]
      : []),
    ...TAB_HUB_ICON_GROUPS,
  ];

  function choose(option: TabHubIconOption) {
    onClose();
    void chooseTabHubIcon(option.key);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType('fade')}
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => {
        setCardReady(true);
        if (Platform.OS === 'android') NavigationBar.setStyle('dark');
      }}
      onDismiss={() => setCardReady(false)}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close without changing the icon" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            { bottom: cardBottom, left: cardLeft, width: cardWidth, height: cardFit.height, borderColor: ringColor },
            { opacity: cardReady ? 1 : 0 },
          ]}
          pointerEvents={cardReady ? 'auto' : 'none'}
        >
          <ScrollView style={styles.gridScroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {groups.map((group) => (
              <View key={group.key} style={styles.groupBlock}>
                <View style={styles.groupHeaderRow}>
                  <Text style={[styles.groupHeaderText, { color: ringColor }]} maxFontSizeMultiplier={MENU_MAX_FONT_SCALE}>
                    {group.title}
                  </Text>
                </View>
                {group.options.map((option) => {
                  const source = TAB_HUB_ICON_SOURCES[option.key];
                  if (!source) return null;
                  const active = option.key === tabHubIcon;
                  const { iconWidth, iconHeight } = tabHubIconSizeInWell(option.key, WELL_SIZE);
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.item, { width: `${itemWidthPercent}%` }]}
                      onPress={() => choose(option)}
                      activeOpacity={0.7}
                      accessibilityLabel={active ? `${option.label}, the icon now on the button` : option.label}
                    >
                      <ActiveRingCircle
                        size={WELL_SIZE}
                        glowColor={colors.buttonColor}
                        glowOpacity={active ? ACTIVE_GLOW_OPACITY : TAB_HUB_WELL_GLOW_OPACITY}
                        rimColor={colors.buttonColor}
                        rimOpacity={active ? ACTIVE_RIM_OPACITY : TAB_HUB_WELL_RIM_OPACITY}
                      >
                        <Image source={source} style={{ width: iconWidth, height: iconHeight }} resizeMode="contain" />
                      </ActiveRingCircle>
                      <Text
                        style={[
                          styles.itemLabel,
                          { color: lighten(active ? colors.buttonColor : colors.textMuted, MENU_LABEL_LIGHTEN_FRACTION) },
                        ]}
                        maxFontSizeMultiplier={MENU_MAX_FONT_SCALE}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={[styles.navBarMask, { height: insets.bottom }]} pointerEvents="none" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  navBarMask: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background },
  card: {
    position: 'absolute',
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: CARD_PADDING,
    paddingHorizontal: CARD_PADDING,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  gridScroll: { flex: 1 },
  grid: { flexDirection: 'column' },
  groupBlock: { flexDirection: 'row', flexWrap: 'wrap' },
  groupHeaderRow: { width: '100%', paddingTop: 10, paddingBottom: 2, paddingHorizontal: 4 },
  groupHeaderText: { ...typography.eyebrow, ...textShadow },
  item: { alignItems: 'center', gap: 3, paddingVertical: 6 },
  // Wraps rather than cutting a name short: choices are shown in full.
  itemLabel: {
    ...typography.caption,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: menuLineHeight(LABEL_FONT_SIZE),
    textAlign: 'center',
    paddingHorizontal: 2,
    ...menuLabelShadow,
  },
});
