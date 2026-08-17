// A real, reusable "collapsed to just a label, tap to expand into a real
// overlay on top of the whole screen" card -- 2026-08-17, built for
// SideBuilder.tsx's own dish/ingredients summary (point 2 of that day's
// larger ingredient-adding-screen redesign: "It can still look like it does
// now when it is expanded, but as it is, it takes up a lot of space on the
// screen... it should just display over the top of whatever is on the
// screen currently and doesn't go away until you hit the collapse symbol").
//
// Built on the exact same OverlayContext portal AppActionSheet.tsx already
// uses, for the same real reason: it escapes ScreenBackground.tsx's own
// overflow:hidden clipping, the one proven way every other floating menu in
// this app already does this. Deliberately does NOT close on a backdrop
// tap, unlike AppActionSheet -- "doesn't go away until you hit the collapse
// symbol" is a real, literal requirement here, not a convenience default to
// keep. Deliberately no entrance animation either, matching
// AppActionSheet's own established caution around animation-plus-native-
// portal timing on Android (see that component's own header comment) -- a
// real, known risk class in this app's history.
//
// A real, reusable primitive from day one, not a SideBuilder-only one-off --
// the whole point of building this separately is that the same collapsed-
// card/expand-to-overlay shape is meant to be reused by every other Food
// builder once Side Builder's own redesign is confirmed correct.
import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useOverlay } from './OverlayContext';

export function CollapsibleOverlayCard({
  collapsedLabel,
  tabColor,
  expanded,
  onExpand,
  onCollapse,
  children,
}: {
  collapsedLabel: string;
  tabColor: string;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  children: ReactNode;
}) {
  const { showOverlay, hideOverlay } = useOverlay();
  // A real, stable per-instance identity -- see OverlayContext.tsx's own
  // OverlayOwner comment for why this exists. Genuinely needed here, not
  // just belt-and-suspenders: this card is now a permanent sibling of an
  // always-mounted AppActionSheet on the same screen (SideBuilder.tsx's own
  // ingredient-adding step), and without this, the sheet's own routine
  // hideOverlay() calls (fired on every render while it isn't visible) would
  // silently clobber this card's real content the instant both are mounted
  // together -- confirmed the real, on-device cause of exactly that report.
  const ownerRef = useRef({});

  const overlayNode = expanded ? (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* No onPress -- a tap on the backdrop is deliberately a no-op (see
          this file's own header comment); it still visually blocks and
          intercepts touches meant for whatever's underneath, which is the
          real point of a backdrop here. */}
      <Pressable style={styles.backdrop} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={[styles.card, { borderColor: tabColor }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, { color: tabColor }]} numberOfLines={1}>
              {collapsedLabel}
            </Text>
            {/* The "obvious collapse symbol" the request itself names
                directly -- a real, large, clearly-a-close-button chevron,
                not a small corner glyph easy to miss. */}
            <TouchableOpacity style={styles.collapseButton} onPress={onCollapse} accessibilityLabel="Collapse this card">
              <Ionicons name="chevron-up-circle" size={30} color={tabColor} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </View>
  ) : null;

  // Same real, deliberate pattern PopoverSelect.tsx/AppActionSheet.tsx
  // already use for this exact overlay mechanism: a synchronous
  // useLayoutEffect, not a plain useEffect, so this update can't be
  // deprioritized behind other scheduled work and show up late.
  useLayoutEffect(() => {
    if (expanded) {
      showOverlay(ownerRef.current, overlayNode);
    } else {
      hideOverlay(ownerRef.current);
    }
  });

  // Defensive: if this unmounts while its own overlay is still open (the
  // screen it's on navigates away mid-expand), don't leave the overlay
  // showing with no owner left to close it.
  useLayoutEffect(
    () => () => hideOverlay(ownerRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (expanded) return null;

  // Collapsed state -- a plain, fully-rounded pill showing just the label,
  // tap to expand. "Make all four corners be rounded," explicitly requested
  // -- no squared-off edge anywhere, unlike the connected-picker seam this
  // card used to form before this redesign.
  return (
    <TouchableOpacity style={[styles.collapsedCard, { borderColor: tabColor }]} onPress={onExpand} activeOpacity={0.8}>
      <Text style={[styles.collapsedLabel, { color: tabColor }]} numberOfLines={1}>
        {collapsedLabel}
      </Text>
      <Ionicons name="chevron-down-circle-outline" size={22} color={tabColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  collapsedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  collapsedLabel: {
    ...typography.bodyEmphasis,
    flexShrink: 1,
    marginRight: 8,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 60 },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '100%',
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: colors.menuSurface,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLabel: {
    ...typography.bodyEmphasis,
    fontSize: 17,
    flexShrink: 1,
    marginRight: 10,
  },
  collapseButton: {
    padding: 2,
  },
});
