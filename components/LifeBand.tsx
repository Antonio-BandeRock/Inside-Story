// The band shapes Life's lenses are built from, 2026-09-19.
//
// Direct instruction, after Conditions took the edge-to-edge look: "the
// full screen width and new formatting for everything is needed wherever
// it isn't already in place." Every Life lens now stacks the same three
// shapes, so they live here once rather than as a copy in each section:
//
// 1. LifeBand: a fold. One row carrying a name (and a count), opening on
//    tap to its rows, with the open state remembered per band through
//    useBandFolds. My Meds was the first Life lens to take it, 2026-09-13.
// 2. box: a band that is not a fold (an intro, a form, an empty notice).
//    Same edges, its own content inset, nothing to tap on the row.
// 3. heading: a one-row band introducing a group of boxes that are not
//    inside a fold, on the muted surface so it reads as a label.
//
// Life's scroll content has no side inset any more (app/(tabs)/life.tsx),
// so a band reaches the edge by default; nothing here cancels a margin.
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from './HomeSectionBand';

type Folds = ReturnType<typeof useBandFolds>;

export function LifeBand({
  folds,
  color,
  id,
  title,
  icon,
  count,
  children,
}: {
  folds: Folds;
  color: string;
  id: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  count?: number;
  children: ReactNode;
}) {
  return (
    <HomeSectionBand
      kind="fold"
      title={count == null ? title : `${title} (${count})`}
      icon={icon}
      color={color}
      expanded={folds.isOpen(id)}
      onToggle={() => folds.toggle(id)}
    >
      {children}
    </HomeSectionBand>
  );
}

// The non-fold shapes, in the tab's colour. A lens stacks them inside one
// `column`, whose gap is HOME_BAND_GAP, so no shape carries a margin of
// its own and the distance between bands cannot drift.
export function makeLifeBandStyles(tabColor: string) {
  return StyleSheet.create({
    box: {
      ...homeBandStyle,
      borderColor: tabColor,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    // A box on the muted surface: a standalone line (loading, empty, an
    // error) that needs a surface but is not a card in its own right.
    boxMuted: {
      ...homeBandStyle,
      backgroundColor: colors.surfaceMuted,
      borderColor: tabColor,
      paddingVertical: 12,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    },
    heading: {
      ...homeBandStyle,
      backgroundColor: colors.surfaceMuted,
      borderColor: tabColor,
      paddingVertical: 10,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    },
    headingText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
    // What a fold's rows sit on: the muted surface, rounded, inside the
    // band's own inset. The band is the box; these are its lines.
    row: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      padding: 12,
    },
    rows: { gap: HOME_BAND_GAP },
    column: { gap: HOME_BAND_GAP },
    // For the few things that sit between bands rather than inside one (a
    // row of section pills, a lone Add button): the same inset the bands
    // give their content, so nothing lands on the screen's edge.
    inset: { paddingHorizontal: HOME_BAND_CONTENT_PADDING },
  });
}
