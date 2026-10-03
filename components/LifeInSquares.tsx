// Your Life in Squares, drawn (2026-10-02). Every rule lives in
// lib/lifeSquares.ts and every read in lib/lifeSquaresDb.ts; this file lays
// out one period at a time and moves between them.
//
// Sideways is a three-page pager: the period on screen in the middle with
// a placeholder either side that names its period and reads nothing. When
// a swipe lands on a placeholder it becomes the period on screen and only
// then is read, and the pager settles back to the middle. Nothing is ever
// to the right of now. A tap on a square goes in a level; the path across
// the top goes back out. At the Hour level each record opens the tab and
// lens where it is kept.
//
// The pager is react-native-gesture-handler's ScrollView, as in
// components/DayTimeline.tsx, so a sideways drag moves the timeline rather
// than the tab. Previous and Next buttons do the same for a mouse.
//
// Tab colours are light, so the icon and any number on a square are drawn
// dark and carry no shadow (scripts/audit_dark_text_shadow.js).
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '../constants/colors';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import {
  buildDayPage,
  buildHourPage,
  buildMonthPage,
  buildWeekPage,
  buildYearPage,
  crumbsFor,
  dayString,
  describeTabs,
  hourLabel,
  isFuture,
  periodDays,
  periodKey,
  placeAtLevel,
  placeLabel,
  recordCaption,
  shiftPlace,
  SQUARE_MIN,
  SQUARE_TAB_NAME,
  SQUARE_TAB_PATH,
  SQUARES_NOTE,
  squareRoute,
  squareSource,
  type Presence,
  type SquarePlace,
  type SquareRecord,
  type SquareTab,
  type TimeSquare,
} from '../lib/lifeSquares';
import { loadPresence, loadRecords, rememberedSquarePlace, rememberSquarePlace } from '../lib/lifeSquaresDb';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ON_SQUARE = '#1B2526';
const EMPTY_SQUARE = 'rgba(255,255,255,0.06)';
const LABEL_COLUMN = 34;

const TAB_COLOR: Record<SquareTab, string> = (() => {
  const out = {} as Record<SquareTab, string>;
  for (const tab of Object.keys(SQUARE_TAB_PATH) as SquareTab[]) {
    out[tab] = TAB_ROUTES.find((route) => route.path === SQUARE_TAB_PATH[tab])?.color ?? colors.border;
  }
  return out;
})();

function nowParts(): { today: string; nowHour: number } {
  const now = new Date();
  return { today: dayString(now), nowHour: now.getHours() };
}

function todayPlace(level: SquarePlace['level']): SquarePlace {
  const { today, nowHour } = nowParts();
  return { level, day: today, hour: nowHour };
}

// Which hours a Week or Day page draws: the waking day, stretched to take
// in any record before or after it, so a night of nothing is not twelve
// rows of empty squares and a 3am entry is never cut off.
function hourSpan(minutes: (number | null)[]): number[] {
  let first = 6;
  let last = 22;
  for (const minute of minutes) {
    if (minute === null) continue;
    const hour = Math.floor(minute / 60);
    first = Math.min(first, hour);
    last = Math.max(last, hour);
  }
  const hours: number[] = [];
  for (let hour = first; hour <= last; hour += 1) hours.push(hour);
  return hours;
}

type Loaded = { key: string; presence?: Presence; records?: SquareRecord[] };

type Props = {
  /** Home opens at today's Day; Trends opens where the person last was. */
  startAt?: 'remembered' | 'today';
};

export function LifeInSquares({ startAt = 'remembered' }: Props) {
  const [place, setPlace] = useState<SquarePlace>(() => (startAt === 'remembered' && rememberedSquarePlace()) || todayPlace('day'));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [width, setWidth] = useState(0);
  const [reload, setReload] = useState(0);
  const pager = useRef<ScrollView>(null);
  const { today, nowHour } = nowParts();
  const key = periodKey(place);
  const nextIsFuture = isFuture(shiftPlace(place, 1), today, nowHour);

  useEffect(() => {
    rememberSquarePlace(place);
  }, [place]);

  useFocusEffect(
    useCallback(() => {
      setReload((n) => n + 1);
    }, []),
  );

  // Only the period on screen is read.
  useEffect(() => {
    let live = true;
    const reading = place.level === 'year' || place.level === 'month' ? loadPresence(place).then((presence) => ({ key, presence })) : loadRecords(place).then((records) => ({ key, records }));
    reading
      .then((result) => {
        if (live) setLoaded(result);
      })
      .catch(() => {
        if (live) setLoaded({ key, presence: new Map(), records: [] });
      });
    return () => {
      live = false;
    };
    // key stands for the period; place itself changes with every hour shift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reload]);

  const centre = useCallback(() => {
    if (width > 0) pager.current?.scrollTo({ x: width, animated: false });
  }, [width]);

  useEffect(centre, [centre, key]);

  const go = useCallback((next: SquarePlace) => {
    setLoaded(null);
    setPlace(next);
  }, []);

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page === 0) go(shiftPlace(place, -1));
    else if (page === 2 && !nextIsFuture) go(shiftPlace(place, 1));
    else centre();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = Math.floor(event.nativeEvent.layout.width);
    if (measured !== width) setWidth(measured);
  };

  const ready = loaded !== null && loaded.key === key;
  const crumbs = useMemo(() => crumbsFor(place), [place]);
  const atToday = periodDays(place).from <= today && periodDays(place).through >= today && (place.level !== 'hour' || place.hour === nowHour);

  const placeholder = (at: SquarePlace) => (
    <View style={[styles.page, { width }]}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{placeLabel(at)}</Text>
        <Text style={styles.caption}>Let go to read this {at.level}.</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root} onLayout={onLayout}>
      <View style={styles.crumbs}>
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          return (
            <TouchableOpacity
              key={crumb.level}
              style={[styles.crumb, current && styles.crumbCurrent]}
              onPress={() => (current ? undefined : go(placeAtLevel(place, crumb.level, today, nowHour)))}
              disabled={current}
              accessibilityRole="button"
              accessibilityLabel={current ? `${crumb.label}, showing` : `Go out to ${crumb.label}`}
            >
              <Text style={[styles.crumbText, current && styles.crumbTextCurrent]}>{crumb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.heading}>
        <TouchableOpacity style={styles.step} onPress={() => go(shiftPlace(place, -1))} accessibilityRole="button" accessibilityLabel={`Previous ${place.level}`}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headingText}>{placeLabel(place)}</Text>
        <TouchableOpacity
          style={[styles.step, nextIsFuture && styles.stepOff]}
          onPress={() => (nextIsFuture ? undefined : go(shiftPlace(place, 1)))}
          disabled={nextIsFuture}
          accessibilityRole="button"
          accessibilityLabel={nextIsFuture ? 'Nothing after now' : `Next ${place.level}`}
        >
          <Ionicons name="chevron-forward" size={20} color={nextIsFuture ? colors.textMuted : colors.textPrimary} />
        </TouchableOpacity>
      </View>
      {!atToday ? (
        <TouchableOpacity style={styles.todayButton} onPress={() => go(todayPlace(place.level))} accessibilityRole="button">
          <Text style={styles.todayText}>Back to now</Text>
        </TouchableOpacity>
      ) : null}

      {width > 0 ? (
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: width, y: 0 }}
          onMomentumScrollEnd={onSettle}
          onLayout={centre}
        >
          {placeholder(shiftPlace(place, -1))}
          <View style={[styles.page, { width }]}>
            {ready ? (
              <PeriodPage place={place} loaded={loaded} today={today} width={width} onOpen={go} />
            ) : (
              <Text style={styles.caption}>Reading {placeLabel(place)}.</Text>
            )}
          </View>
          {nextIsFuture ? <View style={[styles.page, { width }]} /> : placeholder(shiftPlace(place, 1))}
        </ScrollView>
      ) : null}

      <Text style={[styles.caption, styles.note]}>{SQUARES_NOTE}</Text>
    </View>
  );
}

type PageProps = { place: SquarePlace; loaded: Loaded; today: string; width: number; onOpen: (place: SquarePlace) => void };

function PeriodPage({ place, loaded, today, width, onOpen }: PageProps) {
  const presence = loaded.presence ?? new Map();
  const records = loaded.records ?? [];
  const year = Number(place.day.slice(0, 4));
  const month = Number(place.day.slice(5, 7));

  if (place.level === 'year') {
    const tiles = buildYearPage(year, presence, today);
    const tile = Math.max(SQUARE_MIN * 2, Math.floor((width - 16) / 3));
    return (
      <View style={styles.wrap}>
        {tiles.map((t) => (
          <TouchableOpacity
            key={t.month}
            style={[styles.monthTile, { width: tile - 8 }, t.future && styles.future]}
            onPress={() => onOpen(t.place)}
            disabled={t.future}
            accessibilityRole="button"
            accessibilityLabel={`${t.label}, ${describeTabs(t.tabs)}`}
          >
            <Text style={styles.tileLabel}>{t.label}</Text>
            <TabStripes tabs={t.tabs} height={14} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (place.level === 'month') {
    const weeks = buildMonthPage(year, month, presence, today);
    const cell = Math.max(SQUARE_MIN - 4, Math.floor(width / 7) - 4);
    return (
      <View>
        <View style={styles.row}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, i) => (
            <Text key={i} style={[styles.weekday, { width: cell + 4 }]}>
              {letter}
            </Text>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={w} style={styles.row}>
            {week.map((d, i) =>
              d === null ? (
                <View key={i} style={{ width: cell + 4, height: cell + 4 }} />
              ) : (
                <TouchableOpacity
                  key={d.day}
                  style={[styles.dayCell, { width: cell, height: cell }, d.today && styles.todayCell, d.future && styles.future]}
                  onPress={() => onOpen(d.place)}
                  disabled={d.future}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.dayNumber}, ${describeTabs(d.tabs)}`}
                >
                  <View style={StyleSheet.absoluteFill}>
                    <TabStripes tabs={d.tabs} height={cell} vertical />
                  </View>
                  <Text style={[styles.dayNumber, d.tabs.length > 0 ? styles.onSquare : styles.offSquare]}>{d.dayNumber}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        ))}
      </View>
    );
  }

  if (place.level === 'week') {
    const columns = buildWeekPage(periodDays(place).from, records, today);
    const hours = hourSpan(records.map((r) => r.minute));
    const size = Math.max(SQUARE_MIN - 6, Math.floor((width - LABEL_COLUMN) / 7) - 2);
    const hasThatDay = columns.some((c) => c.thatDay.first !== null);
    return (
      <View>
        <View style={styles.row}>
          <View style={{ width: LABEL_COLUMN }} />
          {columns.map((c) => (
            <TouchableOpacity key={c.day} style={{ width: size + 2 }} onPress={() => onOpen({ level: 'day', day: c.day, hour: 8 })} disabled={c.future} accessibilityRole="button">
              <Text style={[styles.weekday, c.day === today && styles.weekdayToday]}>{c.label}</Text>
              <Text style={[styles.weekday, c.day === today && styles.weekdayToday]}>{c.dayNumber}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasThatDay ? (
          <View style={styles.row}>
            <Text style={[styles.hourLabel, { width: LABEL_COLUMN }]}>Day</Text>
            {columns.map((c) => (
              <Square key={c.day} square={c.thatDay} size={size} label={`${c.label} ${c.dayNumber}, that day`} onPress={() => onOpen({ level: 'day', day: c.day, hour: 8 })} />
            ))}
          </View>
        ) : null}
        {hours.map((hour) => (
          <View key={hour} style={styles.row}>
            <Text style={[styles.hourLabel, { width: LABEL_COLUMN }]}>{hourLabel(hour)}</Text>
            {columns.map((c) => (
              <Square key={c.day} square={c.hours[hour]} size={size} label={`${c.label} ${c.dayNumber}, ${hourLabel(hour)}`} onPress={() => onOpen({ level: 'hour', day: c.day, hour })} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (place.level === 'day') {
    const page = buildDayPage(place.day, records);
    const hours = hourSpan(records.map((r) => r.minute));
    const size = Math.max(SQUARE_MIN, Math.min(64, Math.floor((width - LABEL_COLUMN - 12) / 4) - 2));
    return (
      <View>
        {page.thatDay.length > 0 ? (
          <View style={styles.thatDay}>
            <Text style={styles.caption}>That day</Text>
            {page.thatDay.map((record) => (
              <RecordRow key={record.id} record={record} />
            ))}
          </View>
        ) : null}
        {hours.map((hour) => (
          <View key={hour} style={styles.row}>
            <Text style={[styles.hourLabel, { width: LABEL_COLUMN + 12 }]}>{hourLabel(hour)}</Text>
            {page.rows[hour].quarters.map((square, q) => (
              <Square key={q} square={square} size={size} label={`${hourLabel(hour)}, quarter ${q + 1}`} onPress={() => onOpen({ level: 'hour', day: place.day, hour })} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  const quarters = buildHourPage(place.day, place.hour, records);
  if (quarters.every((q) => q.records.length === 0)) {
    return <Text style={styles.caption}>Nothing written down in this hour.</Text>;
  }
  return (
    <View>
      {quarters.map((quarter) =>
        quarter.records.length === 0 ? null : (
          <View key={quarter.label} style={styles.quarter}>
            <Text style={styles.caption}>From {quarter.label}</Text>
            {quarter.records.map((record) => (
              <RecordRow key={record.id} record={record} />
            ))}
          </View>
        ),
      )}
    </View>
  );
}

function TabStripes({ tabs, height, vertical = false }: { tabs: SquareTab[]; height: number; vertical?: boolean }) {
  if (tabs.length === 0) return <View style={[{ height }, styles.emptyStripe]} />;
  return (
    <View style={[{ height, flexDirection: 'row' }, vertical && styles.stripesFill]}>
      {tabs.map((tab) => (
        <View key={tab} style={{ flex: 1, backgroundColor: TAB_COLOR[tab] }} />
      ))}
    </View>
  );
}

function Square({ square, size, label, onPress }: { square: TimeSquare; size: number; label: string; onPress: () => void }) {
  const source = square.first ? squareSource(square.first.source) : undefined;
  if (!square.first || !source) {
    return <View style={[styles.square, { width: size, height: size, backgroundColor: EMPTY_SQUARE }]} />;
  }
  const names = square.records.map((r) => r.title).join(', ');
  return (
    <TouchableOpacity
      style={[styles.square, { width: size, height: size, backgroundColor: TAB_COLOR[source.tab] }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${names}`}
    >
      <Ionicons name={source.icon as IconName} size={Math.round(size * 0.5)} color={ON_SQUARE} />
      {square.more > 0 ? <Text style={styles.more}>+{square.more}</Text> : null}
    </TouchableOpacity>
  );
}

function RecordRow({ record }: { record: SquareRecord }) {
  const source = squareSource(record.source);
  if (!source) return null;
  return (
    <TouchableOpacity
      style={styles.recordRow}
      onPress={() => {
        const route = squareRoute(source);
        router.push({ pathname: route.pathname, params: route.params } as unknown as Href);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${record.title}, opens ${SQUARE_TAB_NAME[source.tab]} ${source.lensLabel}`}
    >
      <View style={[styles.square, { width: SQUARE_MIN, height: SQUARE_MIN, backgroundColor: TAB_COLOR[source.tab] }]}>
        <Ionicons name={source.icon as IconName} size={22} color={ON_SQUARE} />
      </View>
      <View style={styles.recordText}>
        <Text style={styles.recordTitle}>{record.title}</Text>
        <Text style={styles.caption}>{recordCaption(record)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // The same surface as the band around it, so the squares carry their
  // own surface wherever they are placed.
  root: { backgroundColor: colors.surface },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow },
  note: { marginTop: 10 },
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  crumb: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.surfaceMuted },
  crumbCurrent: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.tabTrends },
  crumbText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  crumbTextCurrent: { color: colors.tabTrends },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headingText: { ...typography.label, color: colors.textPrimary, flex: 1, textAlign: 'center', ...textShadow },
  step: { width: SQUARE_MIN, height: SQUARE_MIN, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surfaceMuted },
  stepOff: { opacity: 0.4 },
  todayButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.surfaceMuted, marginBottom: 8 },
  todayText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  page: { minHeight: 120 },
  placeholder: { flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: 12 },
  placeholderText: { ...typography.label, color: colors.textPrimary, textAlign: 'center', marginBottom: 4, ...textShadow },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  monthTile: { margin: 4, padding: 8, borderRadius: 8, backgroundColor: colors.surfaceMuted, minHeight: SQUARE_MIN + 16, justifyContent: 'space-between' },
  tileLabel: { ...typography.label, color: colors.textPrimary, marginBottom: 6, ...textShadow },
  future: { opacity: 0.35 },
  row: { flexDirection: 'row', alignItems: 'center' },
  weekday: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  weekdayToday: { color: colors.tabTrends },
  dayCell: { margin: 2, borderRadius: 6, overflow: 'hidden', backgroundColor: EMPTY_SQUARE, alignItems: 'center', justifyContent: 'center' },
  todayCell: { borderWidth: 2, borderColor: colors.textPrimary },
  dayNumber: { ...typography.caption },
  onSquare: { color: ON_SQUARE, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
  offSquare: { color: colors.textMuted, ...textShadow },
  stripesFill: { flex: 1 },
  emptyStripe: { backgroundColor: EMPTY_SQUARE, borderRadius: 3 },
  hourLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  square: { margin: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', right: 2, bottom: 1, fontSize: 10, color: ON_SQUARE },
  thatDay: { marginBottom: 8 },
  quarter: { marginBottom: 10 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  recordText: { flex: 1 },
  recordTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
});
