import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { findCropGuideByKey } from '../lib/cropGuides';
import { frostDateLabel } from '../lib/frostDates';
import { getFrostDates, type FrostDatesResult } from '../lib/homeSky';
import {
  dateLabel,
  goodFriday,
  localDate,
  MOON_PHASE_NAMES,
  moonIllumination,
  moonPhaseName,
  moonPhasesBetween,
  moonQuarter,
  moonSign,
  seasonMarkers,
  SIGN_CLASS,
  solarTermNow,
} from '../lib/moonSky';
import {
  actionLabel,
  addDaysToDate,
  expectedDates,
  FROST_FREE_SEASON_LINES,
  frostAnchor,
  isOpen,
  SOWING_LIMITS,
  SOWING_SOURCES,
  SOWING_WINDOWS,
  upcomingWindows,
  windowsNear,
  type DatedWindow,
  type FrostAnchor,
  type SowingAction,
  type SowingWindow,
} from '../lib/sowingWindows';
import {
  EVIDENCE_TIER_LABELS,
  MOON_KIND_LABELS,
  moonDaysFor,
  moonKindFor,
  QUARTER_LABELS,
  QUARTER_WORK,
  SIGN_CLASS_LABELS,
  SOWING_TRADITIONS,
  TRADITIONS_INTRO,
  type SowingTradition,
} from '../lib/sowingTraditions';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { makeTabBandStyles, TabBand } from './TabBand';

// Sowing Calendar, a lens of Garden (I5, 1.0.55.20).
//
// The windows for sowing and planting each crop, counted from the frost
// dates My Zone works out for the saved place (lib/sowingWindows.ts, cited
// to extension services), and beside them the older ways people have timed
// the same work: the moon's quarters and the signs the Amish and
// Pennsylvania German almanacs follow, the solstices, equinoxes and holy
// days of the sayings, the 24 solar terms, and others
// (lib/sowingTraditions.ts, lib/moonSky.ts). Direct request, 2026-09-28:
// "let's include things the ammish and others do using moon phases,
// equinox, and solstace as timing."
//
// Nothing here says a crop must go in, and nothing grades a tradition: each
// is told the way its keepers tell it, with what trials have found beside
// it on tap. A window is where a crop usually does well, never a rule.

const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);
const DAY_MS = 86400000;
const NEAR_DAYS = 28;

const ACTION_ORDER: SowingAction[] = ['indoors', 'direct', 'plantOut', 'autumn', 'frostFree'];

function todayString(): string {
  return localDate(Date.now());
}

function cropName(w: SowingWindow): string {
  return findCropGuideByKey(w.key)?.name ?? w.key;
}

/** "October 5", or "October 5, 2027" when it is not this year. */
function dayWithYear(date: string, today: string): string {
  return date.slice(0, 4) === today.slice(0, 4) ? dateLabel(date) : `${dateLabel(date)}, ${date.slice(0, 4)}`;
}

function windowLine(d: DatedWindow, today: string): string {
  if (isOpen(d, today)) return `Open now, until ${dayWithYear(d.end, today)}`;
  return `${dayWithYear(d.start, today)} to ${dayWithYear(d.end, today)}`;
}

function msLabel(ms: number, today: string): string {
  return dayWithYear(localDate(ms), today);
}

function spanLabel(from: number, until: number, today: string): string {
  const a = localDate(from);
  const b = localDate(until);
  return a === b ? dayWithYear(a, today) : `${dayWithYear(a, today)} to ${dayWithYear(b, today)}`;
}

function cropDetail(w: SowingWindow, anchor: FrostAnchor | null, today: string): string {
  const guide = findCropGuideByKey(w.key);
  const lines: string[] = [];
  if (anchor) {
    const windows = upcomingWindows(w, anchor, today).slice(0, 4);
    if (windows.length > 0) {
      lines.push('Windows here:');
      for (const d of windows) lines.push(`• ${actionLabel(w, d.action)}: ${windowLine(d, today)}`);
    } else if (anchor.kind === 'frostFree') {
      lines.push('This one needs a cold winter or long summer days, which a place with no usual frost does not give, so it has no window here.');
    }
    if (anchor.kind === 'frostFree' && w.frostFree) {
      lines.push(`Where there is no usual frost it is ${FROST_FREE_SEASON_LINES[w.frostFree]}.`);
    }
  }
  if (w.sprout) lines.push(`Seed comes up in about ${w.sprout[0]} to ${w.sprout[1]} days in warm soil.`);
  if (w.harvest) {
    const from = w.harvestFrom === 'sowing' ? 'sowing' : 'planting out';
    lines.push(`First harvest about ${w.harvest[0]} to ${w.harvest[1]} days from ${from}.`);
  } else if (guide) {
    lines.push(`Ready: ${guide.ready}`);
  }
  if (guide) {
    const kind = moonKindFor(guide);
    lines.push('');
    lines.push(`By the moon, this is one of the ${MOON_KIND_LABELS[kind]}.`);
    const spans = moonDaysFor(kind, Date.now(), 45).slice(0, 2);
    for (const { span, fruitful } of spans) {
      const signs = fruitful.length
        ? `; moon in a fruitful sign ${fruitful.map((f) => spanLabel(f.from, f.until, today)).join(' and ')}`
        : '';
      lines.push(`• ${spanLabel(span.from, span.until, today)}${signs}`);
    }
    lines.push('Trials have not found a consistent effect of the moon on a crop; this is the almanac tradition, told as it is kept.');
  }
  return lines.join('\n');
}

function traditionDetail(t: SowingTradition): string {
  return [
    `Kept by: ${t.whoKeeps}`,
    '',
    ...t.says.map((line) => `• ${line}`),
    '',
    `${EVIDENCE_TIER_LABELS[t.tier]}. ${t.evidence}`,
    '',
    'Sources:',
    ...t.sources.map((s) => `${s.label}: ${s.url}`),
  ].join('\n');
}

type CalendarDay = { date: string; name: string; note: string };

/** The dates the sayings and the sky mark, over the coming year. */
function calendarDays(today: string, southern: boolean | null): CalendarDay[] {
  const year = Number(today.slice(0, 4));
  const out: CalendarDay[] = [];
  for (const y of [year, year + 1]) {
    for (const marker of seasonMarkers(y, southern ?? false)) {
      out.push({ date: localDate(marker.at), name: marker.name, note: southern === null ? 'One of the sun’s four turning points.' : marker.note });
    }
    out.push({ date: goodFriday(y), name: 'Good Friday', note: 'Potatoes go in, in the old saying. It moves with the moon and the March equinox.' });
    out.push({ date: `${y}-03-17`, name: 'St Patrick’s Day', note: 'Peas go in, in the old saying.' });
    out.push({ date: `${y}-05-15`, name: 'San Isidro Labrador', note: 'The farmers’ feast, when seed and fields are blessed.' });
    out.push({ date: `${y}-06-24`, name: 'Midsummer Day', note: 'Asparagus is left to grow from here, in the old saying.' });
  }
  const horizon = addDaysToDate(today, 365);
  return out.filter((d) => d.date >= today && d.date < horizon).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function SowingCalendarLens({
  scrollBottomPadding,
  onOpenMyZone,
}: {
  scrollBottomPadding: number;
  onOpenMyZone: () => void;
}) {
  const folds = useBandFolds();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [frost, setFrost] = useState<FrostDatesResult | null>(null);
  const [today, setToday] = useState(todayString());

  const load = useCallback(async () => {
    setToday(todayString());
    setFrost(await getFrostDates());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const southern = frost?.status === 'ready' ? frost.dates.southern : null;
  const anchor = useMemo(
    () => (frost?.status === 'ready' ? frostAnchor(frost.dates.frost, frost.dates.southern) : null),
    [frost],
  );

  const crops = useMemo(
    () => [...SOWING_WINDOWS].sort((a, b) => cropName(a).localeCompare(cropName(b))),
    [],
  );

  const nearByAction = useMemo(() => {
    const groups = new Map<SowingAction, { w: SowingWindow; d: DatedWindow }[]>();
    if (!anchor) return groups;
    for (const w of crops) {
      for (const d of windowsNear(w, anchor, today, NEAR_DAYS)) {
        const list = groups.get(d.action) ?? [];
        list.push({ w, d });
        groups.set(d.action, list);
      }
    }
    return groups;
  }, [anchor, crops, today]);
  const nearCount = [...nearByAction.values()].reduce((sum, list) => sum + list.length, 0);

  const nextAfterNear = useMemo(() => {
    if (!anchor || nearCount > 0) return null;
    let best: { w: SowingWindow; d: DatedWindow } | null = null;
    for (const w of crops) {
      const d = upcomingWindows(w, anchor, today)[0];
      if (d && (!best || d.start < best.d.start)) best = { w, d };
    }
    return best;
  }, [anchor, crops, nearCount, today]);

  const now = Date.now();
  const sign = moonSign(now);
  const phases = useMemo(() => moonPhasesBetween(Date.now(), Date.now() + 40 * DAY_MS).slice(0, 4), []);
  const term = useMemo(() => solarTermNow(Date.now()), []);
  const days = useMemo(() => calendarDays(today, southern).slice(0, 8), [today, southern]);

  function openCrop(w: SowingWindow) {
    showInfoAlert(cropName(w), cropDetail(w, anchor, today));
  }

  function openAbout() {
    showInfoAlert('How the windows are worked out', [SOWING_LIMITS, '', 'Sources:', ...SOWING_SOURCES].join('\n'));
  }

  function anchorLine(): string | null {
    if (!anchor) return null;
    if (anchor.kind === 'frost') {
      const last = frostDateLabel(anchor.lastHalf, anchor.southern);
      const safe = frostDateLabel(anchor.lastNineInTen, anchor.southern);
      const first = anchor.firstHalf === null ? null : frostDateLabel(anchor.firstHalf, anchor.southern);
      return `Counted from the last frost of spring, ${last} in half the years and ${safe} in 9 years out of 10${first ? `, and the first after summer, ${first}` : ''}.`;
    }
    return anchor.frostYears === 0
      ? `No frost came here in any of the last ${anchor.seasons} years, so the calendar follows the months of a frost-free place: cool-season crops in the cooler, drier months and heat lovers in spring and summer.`
      : `Frost came here in ${anchor.frostYears} of the last ${anchor.seasons} years, too few to give a usual last date, so the calendar follows the months of a frost-free place: cool-season crops in the cooler, drier months and heat lovers in spring and summer.`;
  }

  const placeLabel = frost?.status === 'ready' ? frost.dates.placeLabel : null;
  const line = anchorLine();

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Sowing Calendar</Text>
        {frost === null ? (
          <Text style={styles.bodyText}>Reading the frost dates for this place.</Text>
        ) : frost.status === 'no-location' ? (
          <>
            <Text style={styles.bodyText}>
              The windows are counted from the frost dates for the place saved in My Zone. Save a place there and they
              show here. The moon, the sky and the traditions below need no place.
            </Text>
            <TouchableOpacity onPress={onOpenMyZone}>
              <Text style={[styles.linkText, { color: TAB_COLOR }]}>Open My Zone</Text>
            </TouchableOpacity>
          </>
        ) : frost.status === 'error' ? (
          <>
            <Text style={[styles.bodyText, styles.errorText]}>{frost.message}</Text>
            <TouchableOpacity onPress={() => void load()}>
              <Text style={[styles.linkText, { color: TAB_COLOR }]}>Try Again</Text>
            </TouchableOpacity>
          </>
        ) : anchor === null ? (
          <Text style={styles.bodyText}>The history for this place came back with too few days to work the frost dates out.</Text>
        ) : (
          <>
            {placeLabel ? <Text style={styles.captionText}>For {placeLabel}.</Text> : null}
            <Text style={styles.bodyText}>{line}</Text>
            <TouchableOpacity onPress={openAbout}>
              <Text style={[styles.linkText, { color: TAB_COLOR }]}>How the windows are worked out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {anchor ? (
        <TabBand folds={folds} color={TAB_COLOR} id="garden:sowing:now" title="What to Sow Now" icon="calendar-outline" count={nearCount}>
          <View style={band.rows}>
            {nearCount === 0 ? (
              <View style={band.row}>
                <Text style={styles.bodyText}>
                  Nothing in this calendar opens in the next four weeks.
                  {nextAfterNear
                    ? ` The next is ${cropName(nextAfterNear.w)}, ${actionLabel(nextAfterNear.w, nextAfterNear.d.action).toLowerCase()} from ${dayWithYear(nextAfterNear.d.start, today)}.`
                    : ''}
                </Text>
              </View>
            ) : (
              ACTION_ORDER.filter((action) => nearByAction.has(action)).map((action) => (
                <View key={action} style={[band.row, styles.group]}>
                  <Text style={styles.fieldLabel}>{action === 'frostFree' ? 'In season now' : actionLabelPlural(action)}</Text>
                  {(nearByAction.get(action) ?? []).map(({ w, d }) => (
                    <TouchableOpacity key={`${w.key}|${d.start}`} onPress={() => openCrop(w)} style={styles.cropRow}>
                      <Text style={styles.bodyText}>{action === 'plantOut' || action === 'autumn' ? `${cropName(w)} (${actionLabel(w, action).toLowerCase()})` : cropName(w)}</Text>
                      <Text style={styles.captionText}>{windowLine(d, today)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        </TabBand>
      ) : null}

      <TabBand folds={folds} color={TAB_COLOR} id="garden:sowing:crops" title="Every Crop" icon="leaf-outline" count={crops.length}>
        <View style={band.rows}>
          {crops.map((w) => {
            const next = anchor ? upcomingWindows(w, anchor, today)[0] : undefined;
            const exp = expectedDates(w, today, 'seed');
            const caption = next
              ? `${actionLabel(w, next.action)}: ${windowLine(next, today)}`
              : exp.harvestDays
                ? `First harvest about ${exp.harvestDays[0]} to ${exp.harvestDays[1]} days`
                : 'Tap for its timing';
            return (
              <TouchableOpacity key={w.key} style={band.row} onPress={() => openCrop(w)}>
                <Text style={styles.bodyText}>{cropName(w)}</Text>
                <Text style={styles.captionText}>{caption}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TabBand>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:sowing:sky" title="Moon and Sky" icon="moon-outline">
        <View style={band.rows}>
          <View style={[band.row, styles.group]}>
            <Text style={styles.fieldLabel}>The moon today</Text>
            <Text style={styles.bodyText}>
              {moonPhaseName(now)}, {Math.round(moonIllumination(now) * 100)}% lit, in {sign}.
            </Text>
            <Text style={styles.captionText}>
              {quarterNow(now)} In the almanacs, {sign} is {SIGN_CLASS_LABELS[SIGN_CLASS[sign]]}.
            </Text>
          </View>
          <View style={[band.row, styles.group]}>
            <Text style={styles.fieldLabel}>Next phases</Text>
            {phases.map((p) => (
              <Text key={p.at} style={styles.bodyText}>
                {MOON_PHASE_NAMES[p.phase]}: {msLabel(p.at, today)}
              </Text>
            ))}
          </View>
          <View style={[band.row, styles.group]}>
            <Text style={styles.fieldLabel}>Days of the sun and the sayings</Text>
            {days.map((d) => (
              <View key={`${d.date}|${d.name}`}>
                <Text style={styles.bodyText}>
                  {d.name}: {dayWithYear(d.date, today)}
                </Text>
                <Text style={styles.captionText}>{d.note}</Text>
              </View>
            ))}
            {southern === null ? (
              <Text style={styles.captionText}>Save a place in My Zone and the equinoxes and solstices are named for its half of the world.</Text>
            ) : null}
          </View>
          <View style={[band.row, styles.group]}>
            <Text style={styles.fieldLabel}>Solar term</Text>
            <Text style={styles.bodyText}>
              {term.current.name} ({term.current.chinese}), since {msLabel(term.current.at, today)}.
            </Text>
            <Text style={styles.captionText}>{term.current.meaning}</Text>
            <Text style={styles.captionText}>
              Next: {term.next.name}, {msLabel(term.next.at, today)}.
            </Text>
          </View>
        </View>
      </TabBand>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:sowing:traditions" title="Planting by Tradition" icon="book-outline" count={SOWING_TRADITIONS.length}>
        <View style={band.rows}>
          <View style={band.row}>
            <Text style={styles.captionText}>{TRADITIONS_INTRO}</Text>
          </View>
          {SOWING_TRADITIONS.map((t) => (
            <TouchableOpacity key={t.key} style={band.row} onPress={() => showInfoAlert(t.name, traditionDetail(t))}>
              <Text style={styles.bodyText}>{t.name}</Text>
              <Text style={styles.captionText}>{EVIDENCE_TIER_LABELS[t.tier]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TabBand>

      {infoAlertElement}
    </ScrollView>
  );
}

function actionLabelPlural(action: SowingAction): string {
  if (action === 'indoors') return 'Start indoors';
  if (action === 'direct') return 'Sow outside';
  if (action === 'plantOut') return 'Plant out';
  return 'Sow or plant for autumn';
}

function quarterNow(ms: number): string {
  const quarter = moonQuarter(ms);
  return `${QUARTER_LABELS[quarter]}. ${QUARTER_WORK[quarter]}`;
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  card: { gap: 8 },
  group: { gap: 6 },
  cropRow: { gap: 2, paddingVertical: 2 },
  cardTitle: { ...typography.sectionTitle, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  linkText: { ...typography.body, ...textShadow },
  errorText: { color: colors.danger },
});
