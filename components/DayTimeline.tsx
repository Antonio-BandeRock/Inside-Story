// The one Today timeline (B1 of the competitive build plan, 2026-09-26),
// drawn from lib/dayTimeline.ts. The same component is the Home card
// (compact), the Schedules > Timeline lens and the whole of app/timeline.tsx.
//
// The strip is one piece from a few days back to a few days ahead, moved
// through by a smooth sideways scroll and opened with Now in the middle.
// By direct instruction there is no tap to the next day or back a day, no
// paging and no snapping: "Make the time line be fully scrollable
// horizontally, and not a tap to move to the next time frame or back in
// time frames. Make it a smooth scroll with the Now being in the middle
// and where the scroll would normally start." Coming back to the screen
// opens it on Now again.
//
// The ScrollView is react-native-gesture-handler's rather than React
// Native's, so it takes part in the same gesture arbitration as the tab
// swipe in SwipeableTabScreen and a sideways drag on the strip scrolls the
// strip rather than changing tab.
//
// Read-only: a tap on a card goes to where that thing is kept, which is
// where it is marked done, skipped or changed.

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  clockLabel,
  describeOverdue,
  initialScrollX,
  layoutTimeline,
  overdueWhen,
  statusLabel,
  type DayTimelineItem,
  type DayTimelineView,
  type TimelineKind,
  type TimelineRoute,
} from '../lib/dayTimeline';
import { loadDayTimeline } from '../lib/dayTimelineDb';

type IconName = ComponentProps<typeof Ionicons>['name'];

const KIND_ICONS: Record<TimelineKind, IconName> = {
  meal: 'restaurant-outline',
  dose: 'medkit-outline',
  appointment: 'calendar-outline',
  reminder: 'bulb-outline',
  garden: 'leaf-outline',
  routine: 'list-outline',
  checkin: 'pulse-outline',
  flare: 'flame-outline',
  sleep: 'moon-outline',
  due: 'receipt-outline',
  countdown: 'hourglass-outline',
};

const KIND_COLORS: Record<TimelineKind, string> = {
  meal: colors.tabFood,
  dose: colors.tabSchedules,
  appointment: colors.tabSchedules,
  reminder: colors.primary,
  garden: colors.tabGarden,
  routine: colors.tabLife,
  checkin: colors.tabBioCompass,
  flare: colors.danger,
  sleep: colors.tabTrends,
  due: colors.tabLife,
  countdown: colors.tabLife,
};

const COMPACT_OVERDUE_LIMIT = 3;
const HEADER_HEIGHT = 40;
const LANE_GAP = 6;
const REFRESH_MS = 60_000;

function lineOf(style: { fontSize: number; lineHeight?: number }): number {
  return style.lineHeight ?? Math.round(style.fontSize * 1.35);
}

export function DayTimeline({ tabColor, compact = false }: { tabColor: string; compact?: boolean }) {
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const [view, setView] = useState<DayTimelineView | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [viewport, setViewport] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // Set false on every arrival, so the strip opens on Now each time rather
  // than wherever it was left.
  const centered = useRef(false);

  const refresh = useCallback(async () => {
    const at = Date.now();
    setNow(at);
    setView(await loadDayTimeline(at));
  }, []);

  useFocusEffect(
    useCallback(() => {
      centered.current = false;
      void refresh();
    }, [refresh]),
  );

  // The Now line moves once a minute. The records are read again only on
  // arrival, which is when they can have changed.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const layout = useMemo(() => (view ? layoutTimeline(view, now) : null), [view, now]);

  useEffect(() => {
    if (!layout || viewport <= 0 || centered.current) return;
    centered.current = true;
    scrollRef.current?.scrollTo({ x: initialScrollX(layout.nowX, viewport, layout.width), animated: false });
  }, [layout, viewport]);

  // A card holds three lines of reading text, so its height follows the
  // phone's font size rather than being fixed against it.
  const laneHeight = Math.ceil((lineOf(typography.caption) * 2 + lineOf(typography.body)) * fontScale + 14);

  function go(route: TimelineRoute) {
    router.push({ pathname: route.pathname, params: route.params ?? {} } as unknown as Href);
  }

  function onViewport(event: LayoutChangeEvent) {
    setViewport(event.nativeEvent.layout.width);
  }

  if (!view || !layout) {
    return <Text style={styles.muted}>Reading the days around today...</Text>;
  }

  const overdueShown = compact ? view.overdue.slice(0, COMPACT_OVERDUE_LIMIT) : view.overdue;
  const overdueHidden = view.overdue.length - overdueShown.length;
  const stripHeight = HEADER_HEIGHT + Math.max(1, layout.lanes) * (laneHeight + LANE_GAP) + 4;
  const nothing = view.items.length === 0 && view.overdue.length === 0;

  function renderRow(item: DayTimelineItem, when: string) {
    const tint = KIND_COLORS[item.kind];
    return (
      <TouchableOpacity key={item.id} style={[styles.row, { borderLeftColor: tint }]} onPress={() => go(item.route)}>
        <Ionicons name={KIND_ICONS[item.kind]} size={16} color={tint} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.caption}>{[when, item.caption].filter(Boolean).join(' · ')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrap}>
      {view.overdue.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupHeading}>{describeOverdue(view.overdue.length)}</Text>
          {overdueShown.map((item) => renderRow(item, overdueWhen(item, view.today)))}
          {overdueHidden > 0 ? (
            <TouchableOpacity style={styles.moreRow} onPress={() => router.push('/timeline')}>
              <Text style={styles.link}>{overdueHidden === 1 ? '1 more on the full timeline' : `${overdueHidden} more on the full timeline`}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {view.anyTime.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupHeading}>Any time today</Text>
          {view.anyTime.map((item) => renderRow(item, 'Today'))}
        </View>
      ) : null}

      <View style={styles.stripFrame} onLayout={onViewport}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="normal"
          scrollEventThrottle={16}
        >
          <View style={{ width: layout.width, height: stripHeight }}>
            {layout.dayMarks.map((mark) => (
              <View key={mark.day} style={[styles.dayLine, { left: mark.x, height: stripHeight }]}>
                <Text style={[styles.dayLabel, mark.day === view.today && { color: tabColor }]} numberOfLines={1}>
                  {mark.label}
                </Text>
              </View>
            ))}
            {layout.ticks.map((tick) => (
              <View key={tick.x} style={[styles.tick, { left: tick.x }, tick.label ? styles.tickMajor : null]}>
                {tick.label ? (
                  <Text style={styles.tickLabel} numberOfLines={1}>
                    {tick.label}
                  </Text>
                ) : null}
              </View>
            ))}

            {layout.cards.map((card) => {
              const { item } = card;
              const tint = KIND_COLORS[item.kind];
              const word = statusLabel(item.status);
              const when = item.allDay ? 'Any time' : clockLabel(item.start);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      left: card.x,
                      width: card.width - 2,
                      top: HEADER_HEIGHT + card.lane * (laneHeight + LANE_GAP),
                      height: laneHeight,
                      borderLeftColor: tint,
                    },
                    item.status === 'done' || item.status === 'skipped' ? styles.cardSettled : null,
                    item.status === 'overdue' ? styles.cardWaiting : null,
                  ]}
                  onPress={() => go(item.route)}
                >
                  <View style={styles.cardTop}>
                    <Ionicons name={KIND_ICONS[item.kind]} size={12} color={tint} />
                    <Text style={styles.caption} numberOfLines={1}>
                      {word ? `${when} · ${word}` : when}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.caption} numberOfLines={1}>
                    {item.caption ?? ' '}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.nowLine, { left: layout.nowX, height: stripHeight, backgroundColor: tabColor }]} />
            <View style={[styles.nowPill, { left: layout.nowX + 4, borderColor: tabColor }]}>
              <Text style={styles.nowText} numberOfLines={1}>
                Now {clockLabel(now)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {nothing ? (
        <Text style={styles.muted}>
          Nothing on these days yet. Meals, doses and appointments from Schedules, routines with a reminder, check-ins,
          sleep, bills, upkeep and Days Until counters all land here as they are added.
        </Text>
      ) : null}
      {compact ? (
        <TouchableOpacity onPress={() => router.push('/timeline')}>
          <Text style={styles.link}>Open the full timeline</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  group: { gap: 6 },
  groupHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow, flexShrink: 1 },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  link: { ...typography.body, color: colors.primary, ...textShadow },
  moreRow: { paddingVertical: 4 },
  stripFrame: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dayLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    backgroundColor: colors.border,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    ...textShadow,
    position: 'absolute',
    top: 2,
    left: 6,
    width: 180,
  },
  tick: { position: 'absolute', top: 24, width: 1, height: 6, backgroundColor: colors.border },
  tickMajor: { height: 10 },
  tickLabel: {
    ...typography.caption,
    color: colors.textMuted,
    ...textShadow,
    position: 'absolute',
    top: 0,
    left: 4,
    width: 60,
  },
  card: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  cardSettled: { opacity: 0.72 },
  cardWaiting: { borderColor: colors.accent },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
  nowLine: { position: 'absolute', top: 0, width: 2 },
  nowPill: {
    position: 'absolute',
    top: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  nowText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
});
