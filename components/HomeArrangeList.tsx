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
// The list opens where the hold happened, 1.0.39.19: "If I long press a
// sub category, they should be what I see when the ability to move them
// pops up. I didn't realize I needed to select the name of the group to
// get to the sub items." So holding a card hands over that card (openFor)
// and the group it lives in is already open, with its cards showing and
// ready to be dragged. Holding a group's own name still starts on the
// group names, because that is the thing that gesture is about.
//
// The drag is React Native's own PanResponder, deliberately. A drag-and-drop
// library would be a new dependency, and a new dependency changes the EAS
// fingerprint, which strands every phone's over-the-air updates until a full
// rebuild reaches it. That is a steep price for a list of a dozen rows. The
// responder lives on the grip alone, so the page underneath still scrolls
// normally everywhere else.
//
// Three things had to be right before a drop landed, 1.0.39.17: "I grab the
// grip on the right side it acts like it wants to move above or below the
// neighbor groups but it isn't allowed to do it."
//
//  1. Rows are ROW_HEIGHT tall but sit ROW_PITCH apart, because every
//     stacked band in this app leaves HOME_BAND_GAP under it. Counting
//     places by height alone had the arithmetic and the eye disagreeing
//     about where the row had got to.
//  2. A responder built during render is a different responder on the next
//     render, and setPlaces re-renders mid-gesture. The replacement never
//     received the grant, so it measured every later move from the top of
//     the screen instead of from where the finger went down. They are built
//     once each now and kept.
//  3. Home draws this list inside a ScrollView, and a finger travelling
//     straight down is exactly what a ScrollView believes belongs to it. The
//     grip refuses to hand the gesture over, and Home switches scrolling off
//     for as long as a row is held (onDragChange).
//
// What this list shows and what the page shows have to agree, 1.0.39.18:
// "Shared Folder Setup shows when I go to move groups but its not there
// when I select Done." A card can be off the page for either of two
// reasons, and only one of them belongs here. Switched off is a decision
// somebody made, so it stays on the list, greyed, waiting to be switched
// back on. Nothing to show today is not a decision at all: the shared
// folder card exists only while there is no shared folder yet, and the
// week trend only while there is a week to draw. Those are not rows.
// Home answers which is which through hasContent, and the drag counts
// places among the rows on screen, turning that back into places in the
// saved order at the moment it lands.
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Fragment, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type PanResponderInstance,
} from 'react-native';
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
  HOME_SECTIONS_ALWAYS_SHOWN,
  isHomeSectionVisible,
  type HomeSectionKey,
  type VisualPreferences,
} from '../lib/visualPreferences';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';

// One row, group or card, the same height for both. Fixed rather than
// whatever a row happened to measure, so the drag can do arithmetic on it.
const ROW_HEIGHT = 48;
// And how far apart two rows actually sit, which is the row plus the one
// gap every stacked band on Home leaves under it. This is the number a
// drag divides by to count places moved, and the distance a neighbour
// slides to make room.
const ROW_PITCH = ROW_HEIGHT + HOME_BAND_GAP;

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
  // Whether a card has anything to show right now, which is a different
  // question from whether it is switched on. Home is the only thing that
  // knows, so Home answers it.
  hasContent: (key: HomeSectionKey) => boolean;
  // The card that was being held when this list came up, if it was a card
  // rather than a group name. Its group opens straight away, so the cards
  // inside are what the hold actually produces. Read once, when the list
  // appears, and never again: from there on the list is the thing being
  // driven, not Home.
  openFor?: HomeSectionKey | null;
  // Where that opened group ended up down the page, once it has been laid
  // out. Home scrolls to it, because the page it replaced was scrolled to
  // wherever the card being held happened to be, and a list that opens
  // somewhere in its own middle is no better than one that opens closed.
  onReveal?: (y: number) => void;
  // Called with true the moment a grip is taken and false when it is let
  // go. Home uses it to stop its ScrollView scrolling while a row is being
  // moved; without that the scroll wins the gesture and the row never gets
  // anywhere.
  onDragChange?: (dragging: boolean) => void;
  onDone: () => void;
};

export function HomeArrangeList({
  order,
  prefs,
  onReorder,
  onToggleGroup,
  onToggleSection,
  hasContent,
  openFor,
  onReveal,
  onDragChange,
  onDone,
}: Props) {
  // Every group, paired with where it sits in the saved order, and with
  // only the cards that have something to show. A group whose cards are
  // all absent today is not a row either, the same way Home draws no band
  // for it. Both index numbers are kept because the drag counts places
  // among these rows while the reorder writes against the saved order.
  const groups = groupHomeSectionsForDisplay(order)
    .map((group, orderIndex) => ({
      group,
      orderIndex,
      members: homeGroupMembers(group)
        .map((key, memberIndex) => ({ key, memberIndex }))
        .filter(({ key }) => hasContent(key)),
    }))
    .filter((entry) => entry.members.length > 0);
  const [openGroupId, setOpenGroupId] = useState<string | null>(() => {
    if (!openFor) return null;
    const holding = groups.find((entry) => entry.members.some((member) => member.key === openFor));
    // A card belonging to no tab is its own row here, so there is nothing
    // to open for it: it is already the thing being looked at.
    if (!holding || holding.group.kind !== 'tab') return null;
    return homeGroupIdOf(holding.group);
  });

  // Both halves of where the opened group sits in the page: this list's
  // own top, and the row's top within the list. Which of the two layout
  // events arrives first is not something to rely on, so each one records
  // its number and then asks whether the other has arrived yet. Once only:
  // after that the person is the one deciding where this list is scrolled.
  const wrapTop = useRef<number | null>(null);
  const openRowTop = useRef<number | null>(null);
  const revealed = useRef(false);

  function tryReveal() {
    if (revealed.current || wrapTop.current === null || openRowTop.current === null) return;
    revealed.current = true;
    onReveal?.(wrapTop.current + openRowTop.current);
  }

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

  // The gesture handlers below outlive the render that made them, so they
  // read the current props through here rather than closing over whichever
  // ones happened to be in scope when the row was first drawn.
  const latest = useRef({ order, onReorder, onDragChange, groups });
  latest.current = { order, onReorder, onDragChange, groups };

  function finish() {
    const held = dragRef.current;
    const moved = placesRef.current;
    dragRef.current = null;
    placesRef.current = 0;
    setDrag(null);
    setPlaces(0);
    dragY.setValue(0);
    latest.current.onDragChange?.(false);
    if (!held || moved === 0) return;
    // Places crossed on screen, turned into places in the saved order: the
    // row lands where the row it was dropped onto is sitting right now, so
    // a card the page is not showing today keeps whatever place it had.
    const { order: saved, groups: shown } = latest.current;
    const to = held.index + moved;
    if (held.kind === 'group') {
      const from = shown[held.index];
      const onto = shown[to];
      if (!from || !onto) return;
      latest.current.onReorder(reorderHomeGroups(saved, from.orderIndex, onto.orderIndex));
      return;
    }
    const group = shown.find((entry) => homeGroupIdOf(entry.group) === held.groupId);
    const fromCard = group?.members[held.index];
    const ontoCard = group?.members[to];
    if (!fromCard || !ontoCard) return;
    latest.current.onReorder(
      reorderWithinHomeGroup(saved, held.groupId, fromCard.memberIndex, ontoCard.memberIndex),
    );
  }

  // Same reason as `latest`: a responder built once has to be able to reach
  // the newest finish, which is the one holding the newest order.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // One responder per row, made the first time that row is drawn and kept
  // for as long as the list is up. Rebuilding them every render, which is
  // what 1.0.39.16 did, swapped a fresh responder onto the grip in the
  // middle of the gesture: it had never been granted anything, so its idea
  // of where the finger started was the top of the screen, and the row shot
  // to the end of its range and stayed there. The row's place in the list
  // can still change between renders, so that is handed over through a
  // holder the responder reads at the moment the grip is taken.
  const responders = useRef(new Map<string, { descriptor: { current: Drag }; instance: PanResponderInstance }>())
    .current;

  function responderFor(rowKey: string, descriptor: Drag): PanResponderInstance {
    const made = responders.get(rowKey);
    if (made) {
      made.descriptor.current = descriptor;
      return made.instance;
    }
    const holder = { current: descriptor };
    const instance = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // Nobody gets to take this gesture back. A finger moving straight
      // down is what a ScrollView reads as a scroll, and Home draws this
      // list inside one.
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        const held = holder.current;
        dragRef.current = held;
        placesRef.current = 0;
        dragY.setValue(0);
        setPlaces(0);
        setDrag(held);
        latest.current.onDragChange?.(true);
        // Picking a group up closes whatever was showing inside one, so
        // every row below is the same height as every row above and the
        // drag lands where it looks like it will.
        if (held.kind === 'group') setOpenGroupId(null);
        Haptics.selectionAsync().catch(() => {
          // A phone with no haptics is not a reason to refuse the drag.
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const held = holder.current;
        dragY.setValue(gesture.dy);
        // Clamped to the ends of whatever this row is allowed to move
        // among: all the groups, or the cards inside one group. A card can
        // never be dragged out from under the name it sits beneath.
        const lowest = -held.index;
        const highest = held.count - 1 - held.index;
        const next = Math.max(lowest, Math.min(highest, Math.round(gesture.dy / ROW_PITCH)));
        if (next !== placesRef.current) {
          placesRef.current = next;
          setPlaces(next);
        }
      },
      onPanResponderRelease: () => finishRef.current(),
      onPanResponderTerminate: () => finishRef.current(),
    });
    responders.set(rowKey, { descriptor: holder, instance });
    return instance;
  }

  // Where a row that is NOT the one being held should sit right now: one
  // place up if the held row has passed it going down, one place down if it
  // has passed going up, nothing otherwise.
  function shiftFor(kind: 'group' | 'item', groupId: string | null, index: number): number {
    if (!drag || places === 0 || drag.kind !== kind) return 0;
    if (drag.kind === 'item' && drag.groupId !== groupId) return 0;
    if (index === drag.index) return 0;
    const to = drag.index + places;
    if (places > 0 && index > drag.index && index <= to) return -ROW_PITCH;
    if (places < 0 && index < drag.index && index >= to) return ROW_PITCH;
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
    onLayoutTop?: (y: number) => void;
    // Absent for a card that cannot be turned off (Your Story), which gets
    // no eye button rather than one that does nothing.
    onToggleVisible?: () => void;
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
        onLayout={options.onLayoutTop ? (event) => options.onLayoutTop?.(event.nativeEvent.layout.y) : undefined}
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

        {options.onToggleVisible ? (
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
        ) : null}

        {canDrag ? (
          <View
            style={styles.rowButton}
            accessibilityRole="adjustable"
            accessibilityLabel={`Drag ${title} to another place`}
            {...responderFor(rowKey, descriptor).panHandlers}
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
    <View
      style={styles.wrap}
      onLayout={(event) => {
        wrapTop.current = event.nativeEvent.layout.y;
        tryReveal();
      }}
    >
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

      {groups.map(({ group, members: shownMembers }, groupIndex) => {
        const groupId = homeGroupIdOf(group);
        const members = shownMembers.map((member) => member.key);
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
              onToggleVisible:
                solo && HOME_SECTIONS_ALWAYS_SHOWN.has(members[0])
                  ? undefined
                  : () => (solo ? onToggleSection(members[0]) : onToggleGroup(groupId)),
              onPress: solo ? undefined : () => setOpenGroupId(open ? null : groupId),
              onLayoutTop:
                openFor && open
                  ? (y) => {
                      openRowTop.current = y;
                      tryReveal();
                    }
                  : undefined,
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
                    onToggleVisible: HOME_SECTIONS_ALWAYS_SHOWN.has(key) ? undefined : () => onToggleSection(key),
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
  doneText: { ...typography.caption, color: colors.surface },
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
