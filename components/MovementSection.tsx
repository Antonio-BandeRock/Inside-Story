import { useCallback, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useInfoAlert } from './InfoAlert';
import { PhoneOnlyNotice } from './PhoneOnlyNotice';
import { TabBand, makeTabBandStyles } from './TabBand';
import { RecordPhotos } from './RecordPhotos';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  getDailyNutrientBreakdown,
  getHealthSyncState,
  getLatestHealthRecord,
  getLatestSyncedBodyMeasurement,
  getStepCountForDate,
  getStepCountTrend,
  getStoredMeasurementSystem,
  listHealthRecords,
  setHealthSyncEnabled,
  type DailyStepCount,
  type HealthRecord,
  type HealthSyncState,
} from '../lib/db';
import {
  HEALTH_SIGNALS,
  getGrantedHealthAccess,
  getHealthAvailability,
  localDateOf,
  noHealthAccess,
  nutritionFieldsCovered,
  openHealthSettings,
  requestHealthAccess,
  writeDayHydration,
  writeDayNutrition,
  type GrantedHealthAccess,
  type HealthAvailability,
  type HealthSignal,
} from '../lib/healthConnect';
import { isDesktopApp } from '../lib/desktop/bridge';
import { EXERCISE_TYPE_NAMES, syncHealthConnect } from '../lib/healthSync';
import { detectMeasurementSystemFromLocale, kgToLb } from '../lib/measurement';

// Movement: what the phone's health store has, read as is. Life's eighth
// area, 2026-09-14, the JS half of the Health Connect rebuild.
//
// THREE CARDS, IN THE ORDER A PERSON NEEDS THEM.
//
// The first says whether the phone can do this at all and lets them switch
// it on. The second lists every signal with what the store had for it, and
// the empty state per row is honest about WHY it is empty: a phone with
// step syncing off is "no source", not 0, and a heart rate row on a phone
// with no watch says so. The third sends this app's logged water and food
// back to the store, so a person who tracks in three apps has one figure.
//
// NOTHING HERE INTERPRETS. Steps and sleep hours go to Trends and Pattern
// Finder, which show them beside symptoms and let the person look. Any
// claim about what a figure means waits for a cited Digest entry.

type Props = { tabColor: string };

type SignalSummary = {
  signal: HealthSignal;
  /** The one line the row shows, or null when the store has nothing. */
  headline: string | null;
  caption: string;
};

const HEALTH_CONNECT_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

const SOURCE_HINT: Record<HealthSignal['usualSource'], string> = {
  phone: 'Phones count these themselves, but only share them once step syncing is on in Samsung Health or Google Fit.',
  watch: 'This comes from a watch or ring that writes to Health Connect. Without one there is nothing to read.',
  device: 'This comes from a scale, cuff or meter whose app writes to Health Connect.',
  app: 'This comes from another app that logs it to Health Connect.',
};

function formatCount(value: number): string {
  return Math.round(value).toLocaleString();
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function describeLastSync(state: HealthSyncState): string {
  if (!state.lastSyncAt) return 'Not synced yet.';
  const minutes = Math.round((Date.now() - new Date(state.lastSyncAt).getTime()) / 60000);
  if (minutes < 1) return 'Synced just now.';
  if (minutes < 60) return `Synced ${minutes} min ago.`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Synced ${hours} h ago.`;
  return `Synced ${formatDay(state.lastSyncAt)}.`;
}

export function MovementSection({ tabColor }: Props) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const band = useMemo(() => makeTabBandStyles(tabColor), [tabColor]);
  const folds = useBandFolds();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const [availability, setAvailability] = useState<HealthAvailability | null>(null);
  const [access, setAccess] = useState<GrantedHealthAccess>(noHealthAccess());
  const [syncState, setSyncState] = useState<HealthSyncState>({ enabled: false, lastSyncAt: null });
  const [busy, setBusy] = useState<'connect' | 'sync' | 'water' | 'nutrition' | null>(null);
  const [summaries, setSummaries] = useState<SignalSummary[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<HealthRecord[]>([]);
  const [imperial, setImperial] = useState(false);

  const loadStored = useCallback(async (granted: GrantedHealthAccess) => {
    const today = localDateOf(new Date());
    const [todaySteps, stepTrend, distance, sleep, heartRate, restingHeartRate, hrv, spo2, glucose, skinTemperature, cycle, weight, systolic, diastolic, workouts, system] =
      await Promise.all([
        getStepCountForDate(today),
        getStepCountTrend(7),
        getLatestHealthRecord('distance'),
        getLatestHealthRecord('sleep'),
        getLatestHealthRecord('heart_rate'),
        getLatestHealthRecord('resting_heart_rate'),
        getLatestHealthRecord('hrv'),
        getLatestHealthRecord('spo2'),
        getLatestHealthRecord('glucose'),
        getLatestHealthRecord('skin_temperature'),
        getLatestHealthRecord('menstruation'),
        getLatestSyncedBodyMeasurement('weight'),
        getLatestSyncedBodyMeasurement('blood_pressure_systolic'),
        getLatestSyncedBodyMeasurement('blood_pressure_diastolic'),
        listHealthRecords('exercise', 90),
        getStoredMeasurementSystem(),
      ]);
    const useImperial = (system ?? detectMeasurementSystemFromLocale()) === 'imperial';
    setImperial(useImperial);
    setRecentWorkouts(workouts.slice(-5).reverse());

    const synced = (row: DailyStepCount | null) => (row && row.source === 'health_connect' ? row : null);
    const syncedTrend = stepTrend.filter((row) => row.source === 'health_connect');
    const weekAverage = syncedTrend.length > 0
      ? syncedTrend.reduce((sum, row) => sum + row.stepCount, 0) / syncedTrend.length
      : null;

    const headlineFor = (key: HealthSignal['key']): { headline: string | null; caption: string } => {
      switch (key) {
        case 'steps': {
          const todayRow = synced(todaySteps);
          if (!todayRow && weekAverage === null) return { headline: null, caption: '' };
          const parts: string[] = [];
          if (todayRow) parts.push(`${formatCount(todayRow.stepCount)} today`);
          if (weekAverage !== null) parts.push(`${formatCount(weekAverage)} a day over the last ${syncedTrend.length} synced day${syncedTrend.length === 1 ? '' : 's'}`);
          return { headline: parts.join(', '), caption: 'Phone and watch counted together, without double counting.' };
        }
        case 'distance':
          return distance && distance.value !== null
            ? { headline: useImperial ? `${(distance.value * 0.621371).toFixed(1)} mi on ${formatDay(distance.startedAt)}` : `${distance.value.toFixed(1)} km on ${formatDay(distance.startedAt)}`, caption: 'Latest day the store had.' }
            : { headline: null, caption: '' };
        case 'exercise':
          return workouts.length > 0
            ? { headline: `${workouts.length} in the last 90 days`, caption: 'The most recent are listed below.' }
            : { headline: null, caption: '' };
        case 'glucose':
          return glucose && glucose.value !== null
            ? { headline: `${glucose.value.toFixed(1)} mmol/L (${Math.round(glucose.value2 ?? glucose.value * 18.0182)} mg/dL)`, caption: `${formatDay(glucose.startedAt)} at ${formatTime(glucose.startedAt)}.` }
            : { headline: null, caption: '' };
        case 'sleep':
          return sleep && sleep.value !== null
            ? { headline: `${formatHours(sleep.value2 ?? sleep.value)} ending ${formatDay(sleep.endedAt ?? sleep.startedAt)}`, caption: sleep.value2 !== null && sleep.value2 !== sleep.value ? `${formatHours(sleep.value)} in bed, ${formatHours(sleep.value2)} asleep by the stages recorded.` : 'Time in bed; no stages were recorded.' }
            : { headline: null, caption: '' };
        case 'cycle':
          return cycle
            ? { headline: `Last flow day ${formatDay(cycle.startedAt)}`, caption: 'Kept as logged, ready for Pattern Finder.' }
            : { headline: null, caption: '' };
        case 'weight':
          return weight
            ? { headline: useImperial ? `${kgToLb(weight.value).toFixed(1)} lb on ${formatDay(weight.loggedAt)}` : `${weight.value.toFixed(1)} kg on ${formatDay(weight.loggedAt)}`, caption: 'In the Weight lens beside anything typed in.' }
            : { headline: null, caption: '' };
        case 'bloodPressure':
          return systolic && diastolic
            ? { headline: `${Math.round(systolic.value)}/${Math.round(diastolic.value)} mmHg on ${formatDay(systolic.loggedAt)}`, caption: 'Kept with the typed-in readings.' }
            : { headline: null, caption: '' };
        case 'heartRate': {
          if (!heartRate || heartRate.value === null) return { headline: null, caption: '' };
          let low: number | null = null;
          try {
            low = heartRate.detailJson ? (JSON.parse(heartRate.detailJson) as { min?: number }).min ?? null : null;
          } catch {
            low = null;
          }
          return { headline: `${Math.round(heartRate.value)} bpm average on ${formatDay(heartRate.startedAt)}`, caption: low !== null && heartRate.value2 !== null ? `Low ${low}, high ${Math.round(heartRate.value2)}.` : '' };
        }
        case 'restingHeartRate':
          return restingHeartRate && restingHeartRate.value !== null
            ? { headline: `${Math.round(restingHeartRate.value)} bpm on ${formatDay(restingHeartRate.startedAt)}`, caption: '' }
            : { headline: null, caption: '' };
        case 'hrv':
          return hrv && hrv.value !== null
            ? { headline: `${Math.round(hrv.value)} ms on ${formatDay(hrv.startedAt)}`, caption: 'Kept, not interpreted.' }
            : { headline: null, caption: '' };
        case 'spo2':
          return spo2 && spo2.value !== null
            ? { headline: `${Math.round(spo2.value)}% on ${formatDay(spo2.startedAt)}`, caption: '' }
            : { headline: null, caption: '' };
        case 'skinTemperature':
          return skinTemperature && skinTemperature.value !== null
            ? { headline: `${skinTemperature.value > 0 ? '+' : ''}${skinTemperature.value.toFixed(2)} °C from baseline, ${formatDay(skinTemperature.startedAt)}`, caption: 'Overnight average, as the watch reported it.' }
            : { headline: null, caption: '' };
        default:
          return { headline: null, caption: '' };
      }
    };

    setSummaries(
      HEALTH_SIGNALS.map((signal) => {
        const { headline, caption } = headlineFor(signal.key);
        if (headline) return { signal, headline, caption };
        if (!granted.readable.has(signal.key)) return { signal, headline: null, caption: 'Not granted. Connect, or change it in Health Connect settings.' };
        return { signal, headline: null, caption: 'No source in the last 90 days. Tap for what would write it.' };
      }),
    );
  }, []);

  const refresh = useCallback(async (runSync: boolean) => {
    const available = await getHealthAvailability();
    setAvailability(available);
    const state = await getHealthSyncState();
    setSyncState(state);
    let granted = noHealthAccess();
    if (available === 'available') {
      granted = await getGrantedHealthAccess();
      setAccess(granted);
      if (runSync && state.enabled && granted.readable.size > 0) {
        await syncHealthConnect(granted);
        setSyncState(await getHealthSyncState());
      }
    } else {
      setAccess(granted);
    }
    await loadStored(granted);
  }, [loadStored]);

  useFocusEffect(
    useCallback(() => {
      refresh(true).catch(() => undefined);
    }, [refresh]),
  );

  const handleConnect = useCallback(async () => {
    setBusy('connect');
    try {
      const granted = await requestHealthAccess();
      setAccess(granted);
      if (granted.readable.size === 0 && !granted.canWriteHydration && !granted.canWriteNutrition) {
        showInfoAlert('Nothing granted', 'Health Connect did not allow any of the signals. Open its settings to change that, then come back and connect again.');
        return;
      }
      await setHealthSyncEnabled(true);
      if (granted.readable.size > 0) await syncHealthConnect(granted);
      setSyncState(await getHealthSyncState());
      await loadStored(granted);
    } finally {
      setBusy(null);
    }
  }, [loadStored, showInfoAlert]);

  const handleSync = useCallback(async () => {
    setBusy('sync');
    try {
      const result = await syncHealthConnect(access);
      setSyncState(await getHealthSyncState());
      await loadStored(access);
      if (!result.ok) showInfoAlert('Partly synced', 'Some signals could not be read this time. What did come through has been kept; try again in a moment.');
    } finally {
      setBusy(null);
    }
  }, [access, loadStored, showInfoAlert]);

  const handleStop = useCallback(async () => {
    await setHealthSyncEnabled(false);
    setSyncState(await getHealthSyncState());
    showInfoAlert('Syncing stopped', 'Nothing more is read until you connect again. What was already synced stays. To take the permissions away as well, use Health Connect settings.');
  }, [showInfoAlert]);

  const handleSendWater = useCallback(async () => {
    setBusy('water');
    try {
      const today = localDateOf(new Date());
      const breakdown = await getDailyNutrientBreakdown(today);
      const ml = (breakdown.dayTotals.water ?? 0) + (breakdown.supplementTotals.water ?? 0);
      if (!(ml > 0)) {
        showInfoAlert('Nothing to send', 'No water or other drinks are logged for today yet. Log them in Schedules > Hydration first.');
        return;
      }
      const sent = await writeDayHydration(today, ml);
      showInfoAlert(
        sent ? 'Sent' : 'Not sent',
        sent
          ? `${formatCount(ml)} ml for today is now in Health Connect. Sending again later replaces it with the newer total.`
          : 'Health Connect did not take the record. Check that this app has write access for hydration in its settings.',
      );
    } finally {
      setBusy(null);
    }
  }, [showInfoAlert]);

  const handleSendNutrition = useCallback(async () => {
    setBusy('nutrition');
    try {
      const today = localDateOf(new Date());
      const breakdown = await getDailyNutrientBreakdown(today);
      const totals: Record<string, number> = { ...breakdown.dayTotals };
      for (const [code, amount] of Object.entries(breakdown.supplementTotals)) totals[code] = (totals[code] ?? 0) + amount;
      const covered = nutritionFieldsCovered(totals);
      if (covered === 0) {
        showInfoAlert('Nothing to send', 'No meals are logged for today yet, or none of them resolved to nutrient figures.');
        return;
      }
      const sent = await writeDayNutrition(today, totals);
      showInfoAlert(
        sent ? 'Sent' : 'Not sent',
        sent
          ? `Today's totals for ${covered} nutrients (food and supplements together) are now in Health Connect as one day record. Sending again later replaces it.`
          : 'Health Connect did not take the record. Check that this app has write access for nutrition in its settings.',
      );
    } finally {
      setBusy(null);
    }
  }, [showInfoAlert]);

  const explainSignal = useCallback((summary: SignalSummary) => {
    const { signal } = summary;
    const lines = [signal.feeds, SOURCE_HINT[signal.usualSource]];
    if (!access.readable.has(signal.key)) lines.push('This app has not been granted this signal. Connect, or change it in Health Connect settings.');
    showInfoAlert(signal.label, lines.join('\n\n'));
  }, [access, showInfoAlert]);

  const connected = availability === 'available' && syncState.enabled && access.readable.size > 0;
  const readableCount = access.readable.size;

  // The computer has no Health Connect to read from, so on the desktop
  // build the lens says so (lib/desktop/phoneOnly.ts) instead of the
  // "this phone cannot share health data" line, which would be about the
  // wrong device. What the phone has already synced is not held here yet.
  if (isDesktopApp()) {
    return (
      <View style={band.column}>
        <PhoneOnlyNotice feature="healthConnect" color={tabColor} />
      </View>
    );
  }

  return (
    <View style={band.column}>
      <View style={band.box}>
        <Text style={styles.cardTitle}>Phone health data</Text>
        {availability === null ? (
          <Text style={styles.bodyText}>Checking the phone.</Text>
        ) : availability === 'unsupported' ? (
          <Text style={styles.bodyText}>
            This phone cannot share health data with the app. Health Connect is an Android service; on iPhone this waits for a build that does not exist yet.
          </Text>
        ) : availability === 'not_installed' ? (
          <>
            <Text style={styles.bodyText}>
              Health Connect is not on this phone. It is part of Android 14 and later; on Android 9 to 13 it installs from the Play Store.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(HEALTH_CONNECT_PLAY_URL).catch(() => undefined)}>
              <Text style={styles.secondaryButtonText}>Get Health Connect</Text>
            </TouchableOpacity>
          </>
        ) : availability === 'update_required' ? (
          <>
            <Text style={styles.bodyText}>Health Connect is on this phone but needs an update before this app can read from it.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(HEALTH_CONNECT_PLAY_URL).catch(() => undefined)}>
              <Text style={styles.secondaryButtonText}>Update Health Connect</Text>
            </TouchableOpacity>
          </>
        ) : connected ? (
          <>
            <Text style={styles.bodyText}>
              Connected. {readableCount} of {HEALTH_SIGNALS.length} signals readable. {describeLastSync(syncState)}
            </Text>
            <Text style={styles.helperText}>
              Syncs each time this area opens. Nothing is read in the background.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSync} disabled={busy !== null}>
                <Text style={styles.primaryButtonText}>{busy === 'sync' ? 'Syncing' : 'Sync now'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => openHealthSettings()}>
                <Text style={styles.secondaryButtonText}>Health Connect settings</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleStop} style={styles.linkRow}>
              <Text style={styles.actionText}>Stop syncing</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.bodyText}>
              Not connected. Nothing is read until you say so. Connecting opens the phone&apos;s Health Connect dialog, where each signal is a separate choice.
            </Text>
            {readableCount > 0 && !syncState.enabled ? (
              <Text style={styles.helperText}>Permissions are already granted for {readableCount} signals; connecting turns syncing back on.</Text>
            ) : null}
            <TouchableOpacity style={styles.primaryButton} onPress={handleConnect} disabled={busy !== null}>
              <Text style={styles.primaryButtonText}>{busy === 'connect' ? 'Connecting' : 'Connect'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TabBand folds={folds} color={tabColor} id="life:movement:what-the-phone-has" title="What the phone has" icon="walk-outline">
        <Text style={styles.helperText}>
          Read as recorded, nothing added. An empty row means the store had nothing for it, not that the figure was zero.
        </Text>
        {summaries.map((summary) => (
          <TouchableOpacity key={summary.signal.key} style={styles.row} onPress={() => explainSignal(summary)}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{summary.signal.label}</Text>
              {summary.headline ? (
                <>
                  <Text style={styles.rowValue}>{summary.headline}</Text>
                  {summary.caption ? <Text style={styles.rowMeta}>{summary.caption}</Text> : null}
                </>
              ) : (
                <Text style={styles.rowMeta}>{summary.caption}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {recentWorkouts.length > 0 ? (
          <View style={styles.subBlock}>
            <Text style={styles.subHeading}>Recent workouts</Text>
            {recentWorkouts.map((workout) => {
              const typeName = EXERCISE_TYPE_NAMES[workout.value2 ?? 0] ?? `Workout type ${workout.value2}`;
              let title: string | null = null;
              try {
                title = workout.detailJson ? (JSON.parse(workout.detailJson) as { title?: string | null }).title ?? null : null;
              } catch {
                title = null;
              }
              return (
                <View key={workout.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{title || typeName}</Text>
                    <Text style={styles.rowMeta}>
                      {formatDay(workout.startedAt)} at {formatTime(workout.startedAt)}, {workout.value ?? 0} min{title && title !== typeName ? `, ${typeName.toLowerCase()}` : ''}
                    </Text>
                    <RecordPhotos ownerKind="workout" ownerId={String(workout.id)} tabColor={tabColor} title={title || typeName} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </TabBand>

      {availability === 'available' ? (
        <TabBand folds={folds} color={tabColor} id="life:movement:send-to-the-phone" title="Send to the phone" icon="walk-outline">
          <Text style={styles.helperText}>
            What is logged here, into Health Connect, so other apps on the phone see the same day. Each send replaces that day&apos;s earlier record rather than adding to it.
          </Text>
          {access.canWriteHydration || access.canWriteNutrition ? (
            <View style={styles.buttonRow}>
              {access.canWriteHydration ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSendWater} disabled={busy !== null}>
                  <Text style={styles.primaryButtonText}>{busy === 'water' ? 'Sending' : "Send today's water"}</Text>
                </TouchableOpacity>
              ) : null}
              {access.canWriteNutrition ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSendNutrition} disabled={busy !== null}>
                  <Text style={styles.primaryButtonText}>{busy === 'nutrition' ? 'Sending' : "Send today's nutrition"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <Text style={styles.rowMeta}>Write access for hydration and nutrition is not granted. Connect, or change it in Health Connect settings.</Text>
          )}
          {imperial ? <Text style={styles.footnote}>Volumes go over in millilitres, which is what Health Connect stores; other apps show them in their units.</Text> : null}
        </TabBand>
      ) : null}
      {infoAlertElement}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowValue: { ...typography.body, color: colors.textSecondary, marginTop: 2, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },

    subBlock: { marginTop: 14 },
    subHeading: { ...typography.label, color: colors.menuLabelMuted, marginBottom: 4, ...textShadow },

    buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    linkRow: { marginTop: 12 },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    primaryButton: {
      backgroundColor: colors.buttonColor, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18,
      alignItems: 'center', marginTop: 12, ...BUTTON_SHADOW,
    },
    primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    secondaryButton: {
      backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', marginTop: 12,
    },
    secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  });
}

export const MOVEMENT_HELP_SECTIONS = [
  {
    heading: 'What this is',
    body: 'The phone keeps a health store called Health Connect, and every app that counts steps, records sleep or talks to a scale can write into it. This area reads from that store and shows what it found, as recorded. Nothing is read until you connect, and each signal is a separate choice in the phone\'s dialog.',
  },
  {
    heading: 'Where it goes',
    body: 'Steps and sleep hours go to Trends, and steps go to Pattern Finder, which shows weeks with less movement beside weeks with more and the symptoms logged in each. A scale or cuff reading lands next to the typed-in ones. The watch-only signals (heart rate, its variability, blood oxygen, skin temperature) are kept and shown here, and not interpreted.',
  },
  {
    heading: 'Empty is not zero',
    body: 'A phone whose step syncing is off has nothing in the store, and this area says "no source" rather than showing 0. A watch signal on a phone with no watch says the same. Tap any row for what would write it.',
  },
  {
    heading: 'Sending the other way',
    body: 'Water and nutrition logged here can be sent into Health Connect as one record per day, so another app on the phone sees the same figures. Sending a day again replaces the earlier record.',
  },
  {
    heading: 'What is not done',
    body: 'Nothing runs in the background; the store is read when this area opens or Sync Now is tapped. A record the store later deletes is not removed here yet. iPhone has no equivalent until an iOS build exists.',
  },
];
