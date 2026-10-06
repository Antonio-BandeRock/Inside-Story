// The navigation switch button, 1.0.61.13 (2026-10-05). Direct request: "a
// semitransparent button sticking out of the bottom right side of the app
// screen just above the top edge of the footer. This is the navigation
// switch button. If long pressed, then it asks if you want to switch, and
// then lets you switch if you select yes. When you switch, that same switch
// button then is on the lower left corner of the app screen just above the
// footer area. If the user just short presses the button, a flyout informs
// them of what long pressing the button will let them do."
//
// It sits on the far side from the hubs, which is where the other hand would
// reach for it, and shows that hand: a right hand while the left hand works
// the navigation, a left hand once it has moved across. The tab shape is the
// Tell Claude edge button's (flat against the edge, rounded on the inside),
// so the two read as one kind of thing: something tucked into the edge that
// is not part of the screen.
//
// A screen reader's double tap goes straight to the question, since a flyout
// about holding the button helps nobody who cannot see it. The same choice
// is in Profile > Appearance & Navigation for anybody who would rather not
// hold a button at all.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { farSide, setNavigationHand, useNavigationHand, type NavigationHand } from '../lib/navigationHand';
import { useConfirmSheet } from './ConfirmSheet';

const TAB_HEIGHT = 44;
const TAB_WIDTH = 30;
const GAP_ABOVE_FOOTER = 8;
const FLYOUT_SHOWN_MS = 6000;
const FLYOUT_WIDTH = 240;

function handName(hand: NavigationHand): string {
  return hand === 'left' ? 'left hand' : 'right hand';
}

export function handSwitchQuestion(hand: NavigationHand) {
  const other = farSide(hand);
  return {
    title: `Switch to ${handName(other)} navigation?`,
    message:
      `The menu buttons move to the bottom ${other} corner, where your ${handName(other)} thumb rests, ` +
      `and this button moves to the ${hand} edge. Hold it again any time to switch back.`,
    confirmLabel: other === 'left' ? 'Switch to Left Hand' : 'Switch to Right Hand',
    cancelLabel: hand === 'left' ? 'Keep Left Hand' : 'Keep Right Hand',
  };
}

export function HandSwitchButton() {
  const hand = useNavigationHand();
  const side = farSide(hand);
  const footerHeight = useFooterBandHeight();
  const [confirm, confirmElement] = useConfirmSheet();
  const [flyout, setFlyout] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottom = footerHeight + GAP_ABOVE_FOOTER;

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  function hideFlyout() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setFlyout(false);
  }

  function showFlyout() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setFlyout(true);
    hideTimer.current = setTimeout(() => setFlyout(false), FLYOUT_SHOWN_MS);
  }

  async function askToSwitch() {
    hideFlyout();
    const ok = await confirm(handSwitchQuestion(hand));
    if (ok) setNavigationHand(side);
  }

  const edgeStyle = side === 'right' ? styles.tabOnRight : styles.tabOnLeft;

  return (
    <>
      {flyout ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={hideFlyout} accessible={false}>
          <View
            style={[
              styles.flyout,
              { bottom: bottom + TAB_HEIGHT + 8 },
              side === 'right' ? { right: 8 } : { left: 8 },
            ]}
          >
            <Text style={styles.flyoutTitle}>Navigation switch</Text>
            <Text style={styles.flyoutText}>
              Press and hold this button to move the menu buttons to the {side} side of the screen, for your{' '}
              {handName(side)}.
            </Text>
          </View>
        </Pressable>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.tab, edgeStyle, { bottom }, pressed ? styles.tabPressed : null]}
        onPress={showFlyout}
        onLongPress={() => void askToSwitch()}
        delayLongPress={450}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${handName(side)} navigation`}
        accessibilityHint="Asks before moving the menu buttons to the other side"
        accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
        onAccessibilityAction={() => void askToSwitch()}
      >
        <Ionicons name={side === 'right' ? 'hand-right-outline' : 'hand-left-outline'} size={18} color={colors.textPrimary} />
      </Pressable>
      {confirmElement}
    </>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.85,
  },
  tabOnRight: {
    right: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  tabOnLeft: {
    left: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  tabPressed: { opacity: 1 },
  flyout: {
    position: 'absolute',
    width: FLYOUT_WIDTH,
    padding: 12,
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flyoutTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  flyoutText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
