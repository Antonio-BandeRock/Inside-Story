// Arranging Home from Home, 1.0.39.16. Direct request:
//
//   "the ability to long hold on a Home screen group that causes it to be
//   able to be dragged and dropped into a new order on the screen and to be
//   turned off from the Home screen... And the same for the quick access
//   items in each group, they should also be able to be dragged and dropped
//   to change the order if there are more than one, and also turned off
//   from being seen... So, maybe we have each group be turned on and off
//   from the Home group? That way it's available without having to go to
//   Profile at all."
//
// Holding any band on Home hands the page to this list. Everything becomes
// one row of its own name: the eleven group names, and under whichever one
// is open, the cards inside it. Drag a row by its grip and the rest shift
// to make room. Tap the eye to turn something off, tap it again to turn it
// back on, which is the part that keeps the whole job on this page: a group
// that vanished the moment it was switched off could only be recovered from
// Profile, so a switched-off group stays right here, greyed, saying so.
//
// Profile's own Home Screen card still does all of this and stays the place
// to go for a sweep. This is the same settings, reachable where they are
// being looked at.
//
// Why every row folds to its name while arranging: order is the only thing
// being decided, the content is in the way of seeing it, and uniform rows
// are what make a drag land where the finger says. Picking up a group also
// closes whatever was open underneath, for the same reason.
//
// The drag is React Native's own PanResponder, deliberately. A drag-and-drop
// library would be a new dependency, and a new dependency changes the EAS
// fingerprint, which strands every phone's over-the-air updates until a full
// rebuild reaches it. That is a steep price for a list of a dozen rows. The
// responder lives on the grip alone, so the page underneath still scrolls
// normally everywhere else.
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fragment, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { homeGroupIdentity } from '../constants/homeGroups';
import { textShadow, typography } from '../constants/typography';
import {
  groupHomeSectionsForDisplay,
  homeGroupIdOf,
  homeGroupMembers,
  reorderHomeGroups,
  reorderWithinHomeGroup,
} from '../lib/homeSections';
import {
  HOME_SECTION_LABELS,
  isHomeGroupVisible,
  isHomeSectionVisible,
  type HomeSectionKey,
  type VisualPreferences,
} from '../lib/visualPreferences';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';

// One row, group or card, the same height for both. The drag reads a
// distance and divides by this to get a number of places moved, so it has
// to be a fixed number rather than whatever a row happened to measure.
const ROW_HEIGHT = 48;

type Drag =
  | { kind: 'group'; index: number; count: number }
  | { kind: 'item'; groupId: string; index: number; count: number };

type Props = {
  // The reconciled section order, exactly what Home itself renders
  // from (getOrderedHomeSectionKeys), never the raw saved field.
  order: HomeSectionKey[];
  prefs: VisualPreferences;
  onReorder: (next: HomeSectionKey[]) => void;
  onToggleGroup: (groupId: string) => void;
  onToggleSection: (key: HomeSectionKey) => void;
  onDone: () => void;
};

export function HomeArrangeList({ order, prefs, onReorder, onToggleGroup, onToggleSection, onDone }: Props) {
  const groups = groupHomeSectionsForDisplay(order);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  // Two copies of the drag on purpose. The state copy re-renders the rows
  // so they can shift out of the way; the ref copy is what the gesture
  // handlers read, because a handler created on one render would otherwise
  // keep answering with that render's values for the whole drag.
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  // How many places the row has moved so far. Whole places, not pixels, so
  // this only changes when the row actually crosses a neighbour rather than
  // on every frame of the gesture.
  const [places, setPlaces] = useState(0);
  const placesRef = useRef(0);
  const dragY = useRef(new Animated.Value(0)).current;

  function finish() {
    const held = dragRef.current;
    const moved = placesRef.current;
    dragRef.current = null;
    placesRef.current = 0;
    setDrag(null);
    setPlaces(0);
    dragY.setValue(0);
    if (!held || moved === 0) return;
    const to = held.index + moved;
    onReorder(
      held.kind === 'group'
        ? reorderHomeGroups(order, held.index, to)
        : reorderWithinHomeGroup(order, held.groupId, held.index, to),
    );
  }

  function responderFor(descriptor: Drag) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragRef.current = descriptor;
        placesRef.current = 0;
        dragY.setValue(0);
        setPlaces(0);
        setDrag(descriptor);
        // Picking a group up closes whatever was showing inside one, so
        // every row below is the same height as every row above and the
        // drag lands where it looks like it will.
        if (descriptor.kind === 'group') setOpenGroupId(null);
        Haptics.selectionAsync().catch(() => {
          // A phone with no haptics is not a reason to refuse the drag.
        });
      },
      onPanResponderMove: (_event, gesture) => {
        dragY.setValue(gesture.dy);
        // Clamped to the ends of whatever this row is allowed to move
        // among: all the groups, or the cards inside one group. A card can
        // never be dragged out from under the name it sits beneath.
        const lowest = -descriptor.index;
        const highest = descriptor.count - 1 - descriptor.index;
        const next = Math.max(lowest, Math.min(highest, Math.round(gesture.dy / ROW_HEIGHT)));
        if (next !== placesRef.current) {
          placesRef.current = next;
          setPlaces(next);
        }
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }

  // Where a row that is NOT the one being held should sit right now: one
  // place up if the held row has passed it going down, one place down if it
  // has passed going up, nothing otherwise.
  function shiftFor(kind: 'group' | 'item', groupId: string | null, index: number): number {
    if (!drag || places === 0 || drag.kind !== kind) return 0;
    if (drag.kind === 'item' && drag.groupId !== groupId) return 0;
    if (index === drag.index) return 0;
    const to = drag.index + places;
    if (places > 0 && index > drag.index && index <= to) return -ROW_HEIGHT;
    if (places < 0 && index < drag.index && index >= to) return ROW_HEIGHT;
    return 0;
  }

  function isHeld(kind: 'group' | 'item', groupId: string | null, index: number): boolean {
    if (!drag || drag.kind !== kind || drag.index !== index) return false;
    return drag.kind !== 'item' || drag.groupId === groupId;
  }

  function renderArrangeRow(options: {
    rowKey: string;
    kind: 'group' | 'item';
    groupId: string | null;
    index: number;
    count: number;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    visible: boolean;
    inset: boolean;
    caption?: string;
    onToggleVisible: () => void;
    onPress?: () => void;
  }) {
    const { rowKey, kind, groupId, index, count, title, icon, color, visible, inset, caption } = options;
    const held = isHeld(kind, groupId, index);
    const descriptor: Drag =
      kind === 'group' ? { kind: 'group', index, count } : { kind: 'item', groupId: groupId ?? '', index, count };
    // A group of one, or a card that is the only one under its name, has
    // nowhere to be dragged to, so it gets no grip rather than a dead one.
    const canDrag = count > 1;
    return (
      <Animated.View
        key={rowKey}
        style={[
          styles.row,
          inset && styles.rowInset,
          { borderColor: color },
          held
            ? { transform: [{ translateY: dragY }], zIndex: 2, elevation: 4, opacity: 0.94 }
            : { transform: [{ translateY: shiftFor(kind, groupId, index) }] },
        ]}
      >
        <TouchableOpacity
          style={styles.rowBody}
          onPress={options.onPress}
          disabled={!options.onPress}
          activeOpacity={options.onPress ? 0.75 : 1}
          accessibilityRole={options.onPress ? 'button' : 'text'}
        >
          <Ionicons name={icon} size={16} color={visible ? color : colors.textMuted} style={textShadow} />
          <View style={styles.rowTitleColumn}>
            <Text
              style={[styles.rowTitle, { color: visible ? colors.textPrimary : colors.textMuted }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={options.onToggleVisible}
          style={styles.rowButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Turn off ${title}` : `Turn on ${title}`}
        >
          <Ionicons
            name={visible ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={visible ? color : colors.textMuted}
          />
        </TouchableOpacity>

        {canDrag ? (
          <View
            style={styles.rowButton}
            accessibilityRole="adjustable"
            accessibilityLabel={`Drag ${title} to another place`}
            {...responderFor(descriptor).panHandlers}
          >
            <Ionicons name="reorder-three-outline" size={22} color={held ? color : colors.textSecondary} />
          </View>
        ) : (
          <View style={styles.rowButton} />
        )}
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Ionicons name="reorder-four-outline" size={18} color={colors.accent} style={textShadow} />
          <Text style={styles.bannerTitle}>Arranging your Home screen</Text>
          <TouchableOpacity onPress={onDone} style={styles.doneButton} accessibilityRole="button">
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerHelp}>
          Drag anything by its grip to move it. Tap a group to see the cards inside it and arrange those the same
          way. The eye turns something off, and turning it back on is the same tap, so nothing here has to be
          found again somewhere else.
        </Text>
      </View>

      {groups.map((group, groupIndex) => {
        const groupId = homeGroupIdOf(group);
        const members = homeGroupMembers(group);
        const identity = group.kind === 'tab' ? homeGroupIdentity(group.path) : undefined;
        const color = identity?.color ?? colors.primary;
        // A card belonging to no tab is a row on Home rather than a band,
        // so here it is one row too, and its eye writes that card's own
        // switch: there is no group behind it to turn off separately.
        const solo = group.kind === 'solo';
        const visible = solo ? isHomeSectionVisible(prefs, members[0]) : isHomeGroupVisible(prefs, groupId);
        const open = openGroupId === groupId;
        const hiddenCount = members.filter((key) => !isHomeSectionVisible(prefs, key)).length;
        return (
          <Fragment key={groupId}>
            {renderArrangeRow({
              rowKey: `group:${groupId}`,
              kind: 'group',
              groupId: null,
              index: groupIndex,
              count: groups.length,
              title: identity?.title ?? HOME_SECTION_LABELS[members[0]],
              icon: identity?.icon ?? 'ellipse-outline',
              color,
              visible,
              inset: false,
              caption: solo
                ? undefined
                : `${members.length} ${members.length === 1 ? 'card' : 'cards'}${
                    hiddenCount > 0 ? `, ${hiddenCount} turned off` : ''
                  }`,
              onToggleVisible: () => (solo ? onToggleSection(members[0]) : onToggleGroup(groupId)),
              onPress: solo ? undefined : () => setOpenGroupId(open ? null : groupId),
            })}
            {open && !solo
              ? members.map((key, memberIndex) =>
                  renderArrangeRow({
                    rowKey: `item:${key}`,
                    kind: 'item',
                    groupId,
                    index: memberIndex,
                    count: members.length,
                    title: HOME_SECTION_LABELS[key],
                    icon: identity?.icon ?? 'ellipse-outline',
                    color,
                    visible: isHomeSectionVisible(prefs, key),
                    inset: true,
                    onToggleVisible: () => onToggleSection(key),
                  }),
                )
              : null}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: HOME_BAND_GAP },
  banner: {
    ...homeBandStyle,
    borderColor: colors.accent,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    paddingVertical: 12,
    gap: 6,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerTitle: { ...typography.bodyEmphasis, ...textShadow, color: colors.accent, flex: 1, fontWeight: '400' },
  bannerHelp: { ...typography.caption, ...textShadow, color: colors.textSecondary, lineHeight: 16 },
  doneButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  doneText: { ...typography.caption, ...textShadow, color: colors.surface },
  // The same band shape every row on Home already wears, at a fixed height
  // so the drag arithmetic above stays honest.
  row: {
    ...homeBandStyle,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: HOME_BAND_CONTENT_PADDING,
    paddingRight: 4,
  },
  // A card sits in from the group name above it, so the list reads as what
  // it is: names, and the things under each name.
  rowInset: { marginLeft: 20 },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitleColumn: { flex: 1 },
  rowTitle: { ...typography.body, ...textShadow },
  rowCaption: { ...typography.caption, ...textShadow, color: colors.textMuted, lineHeight: 14 },
  rowButton: { width: 40, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
});
