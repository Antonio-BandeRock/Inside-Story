import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { sortByLabel } from '../lib/choiceOrder';
import type { GardenPlanting, GardenPlot } from '../lib/db';
import { getDesktopBridge, isDesktopApp, type StationListenerStatus } from '../lib/desktop/bridge';
import {
  deleteGateway,
  describeGatewayReader,
  getListenPort,
  lastUnmatchedReport,
  listGateways,
  onGatewayRead,
  readGatewayHere,
  readGatewayNow,
  saveGateway,
  saveGatewaySensor,
  setGatewayPolling,
  setListenPort,
  stopReadingGatewayHere,
  type GatewaySensorSetting,
  type GatewayWithSettings,
  type UnmatchedReport,
} from '../lib/ecowittDb';
import { DEFAULT_LISTEN_PORT, PUSH_ADDRESS_TIP, PUSH_HOW, PUSH_PHONE_NOTE, pushStatus, pushSteps } from '../lib/ecowittPush';
import {
  ADDRESS_TIP,
  GATEWAY_HOW,
  GATEWAY_STEPS,
  gatewayStatus,
  HOURS_NOTE,
  normaliseHost,
  ONE_DEVICE_NOTE,
  type GatewayMethod,
  POLL_CHOICES,
  PROBE_TEMPERATURE_CHOICES,
  RAIN_NOTE,
  WHILE_OPEN_NOTE,
  type GatewayRead,
  type GatewaySensor,
} from '../lib/ecowittLocal';
import { areaPath } from '../lib/gardenAreaNesting';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { QuickAreaForm } from './QuickAreaForm';
import { ThumbRow } from './ThumbRow';
import { ThumbEndRow } from './ThumbEndRow';

// Garden > Growing Conditions > Sensors on Your Network (I20, 2026-09-28):
// an Ecowitt gateway read over the home network while the app is open.
// What the gateway's answer means is in lib/ecowittLocal.ts, the reads and
// writes in lib/ecowittDb.ts, and the reading on a timer in
// components/EcowittPoller.tsx; this is where a gateway is added and each
// of its sensors is given an area.

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const NO_PLOT = '__none__';
const NO_PLANTING = '__none__';

const LIGHT_NOTE =
  'An outdoor station reports sunlight in W/m² or lux. A figure in W/m² is kept as it is, since turning sunlight into the light a plant uses depends on the sky.';

const METHOD_CHOICES: { label: string; value: GatewayMethod }[] = [
  { label: 'Ask it by its address (recommended)', value: 'ask' },
  { label: 'It sends its readings to this computer', value: 'push' },
];

const OLD_INSTALLER_NOTE =
  'This copy of Inside Story on the computer is too old to receive readings. Install the latest version, then come back here.';

function stationListener() {
  return isDesktopApp() ? getDesktopBridge().stationListener ?? null : null;
}

type ReaderLine = Awaited<ReturnType<typeof describeGatewayReader>>;

/** The setup steps, numbered, each on a line of its own. */
function SetupSteps(props: { upTo?: number; steps?: string[] }) {
  const all = props.steps ?? GATEWAY_STEPS;
  const steps = props.upTo ? all.slice(0, props.upTo) : all;
  return (
    <View style={styles.steps}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <Text style={[styles.stepNumber, { color: TAB_COLOR }]}>{index + 1}</Text>
          <Text style={[styles.bodyText, styles.stepText]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function when(stamp: string | null): string {
  if (!stamp) return '';
  const date = new Date(stamp);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function EcowittGatewaySection(props: {
  areas: GardenPlot[];
  plantings: GardenPlanting[];
  onAreaAdded: () => Promise<void> | void;
  /** Called after a reading is kept, so the lens can show it. */
  onRead: () => void;
}) {
  const [gateways, setGateways] = useState<GatewayWithSettings[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState<Record<string, GatewayRead>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addingAreaFor, setAddingAreaFor] = useState<string | null>(null);
  const [method, setMethod] = useState<GatewayMethod>('ask');
  const [readers, setReaders] = useState<Record<string, ReaderLine>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [listener, setListener] = useState<StationListenerStatus | null>(null);
  const [port, setPort] = useState(String(DEFAULT_LISTEN_PORT));
  const [portProblem, setPortProblem] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedReport | null>(null);

  const onComputer = isDesktopApp();
  const bridge = stationListener();

  const load = useCallback(async () => {
    const all = await listGateways();
    setGateways(all);
    const lines: Record<string, ReaderLine> = {};
    for (const entry of all) lines[entry.gateway.id] = await describeGatewayReader(entry.gateway);
    setReaders(lines);
    setUnmatched(lastUnmatchedReport());
    const held = stationListener();
    if (held) {
      setListener(await held.status());
      setPort(String(await getListenPort()));
    }
  }, []);

  useEffect(() => {
    void load();
    const unsubscribe = onGatewayRead((gatewayId, read) => {
      setLastRead((held) => ({ ...held, [gatewayId]: read }));
      void load();
      props.onRead();
    });
    // The listener is started by EcowittPoller on its own tick, so the
    // status here is looked at again every few seconds while a station is
    // being set up, rather than only after something arrives.
    const held = stationListener();
    const timer = held
      ? setInterval(() => {
          void held.status().then(setListener);
          setUnmatched(lastUnmatchedReport());
        }, 5000)
      : null;
    return () => {
      unsubscribe();
      if (timer) clearInterval(timer);
    };
    // props.onRead is a parent callback; reloading on it is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const areaOptions = useMemo(
    () => [
      { label: 'No area in particular', value: NO_PLOT },
      ...sortByLabel(props.areas.map((area) => ({ label: areaPath(area.id, props.areas), value: area.id }))),
    ],
    [props.areas],
  );

  function plantingOptionsFor(plotId: string | null) {
    if (!plotId) return [];
    const mine = props.plantings.filter((planting) => planting.plotId === plotId && planting.status === 'growing');
    if (mine.length === 0) return [];
    return [
      { label: 'The area as a whole', value: NO_PLANTING },
      ...sortByLabel(mine.map((planting) => ({ label: planting.foodName, value: planting.id }))),
    ];
  }

  function startForm(entry: GatewayWithSettings | null) {
    setProblem(null);
    setEditingId(entry?.gateway.id ?? null);
    setName(entry?.gateway.name ?? '');
    setHost(entry?.gateway.host ?? '');
    setMethod(entry?.gateway.method ?? 'ask');
    setAdding(true);
  }

  async function handleSave() {
    const sends = onComputer && method === 'push';
    const address = normaliseHost(host);
    if (!address && !sends) {
      setProblem('Type the address the gateway has on your network, such as 192.168.1.40.');
      return;
    }
    const id = await saveGateway({
      id: editingId ?? undefined,
      name: name.trim() || 'Ecowitt gateway',
      host: address ?? '',
      method: onComputer ? method : undefined,
    });
    setAdding(false);
    setEditingId(null);
    await load();
    if (!sends) await readNow(id);
  }

  async function handleTakeOver(id: string) {
    setConfirmingId(null);
    await readGatewayHere(id);
    await load();
  }

  async function handleStopHere(id: string) {
    await stopReadingGatewayHere(id);
    await load();
  }

  async function handlePort() {
    const value = Number(port.trim());
    if (!Number.isInteger(value) || value < 1024 || value > 65535) {
      setPortProblem('A port is a whole number from 1024 to 65535, such as 8588.');
      return;
    }
    setPortProblem(null);
    await setListenPort(value);
    // Restart on the new port now rather than on the poller's next tick.
    if (bridge && gateways.some((entry) => entry.readsHere && entry.gateway.method === 'push')) {
      await bridge.stop();
      setListener(await bridge.start(value));
    }
  }

  async function readNow(id: string) {
    setBusyId(id);
    try {
      // A kept read reaches this band through onGatewayRead; a failed one
      // only needs the problem line redrawn.
      const result = await readGatewayNow(id);
      if (!result.read) await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: string) {
    await deleteGateway(id);
    await load();
  }

  async function saveSensor(entry: GatewayWithSettings, sensor: GatewaySensor | GatewaySensorSetting, change: Partial<GatewaySensorSetting>) {
    const held = entry.sensors.find((setting) => setting.sensorKey === ('sensorKey' in sensor ? sensor.sensorKey : sensor.key));
    const sensorKey = 'sensorKey' in sensor ? sensor.sensorKey : sensor.key;
    const plotId = change.plotId !== undefined ? change.plotId : held?.plotId ?? null;
    await saveGatewaySensor({
      gateway: entry.gateway,
      sensorKey,
      label: sensor.label,
      plotId,
      plantingId: change.plantingId !== undefined ? change.plantingId : change.plotId !== undefined ? null : held?.plantingId ?? null,
      probeMeasurement: change.probeMeasurement !== undefined ? change.probeMeasurement : held?.probeMeasurement ?? null,
      kept: change.kept !== undefined ? change.kept : held?.kept ?? true,
    });
    await load();
  }

  function renderSensor(entry: GatewayWithSettings, sensor: GatewaySensor | null, setting: GatewaySensorSetting | null) {
    const key = setting?.sensorKey ?? sensor?.key ?? '';
    const label = setting?.label ?? sensor?.label ?? key;
    const plotId = setting?.plotId ?? null;
    const plantings = setting ? plantingOptionsFor(plotId) : [];
    const canBeEither = sensor?.temperatureCanBeEither ?? key.startsWith('probe');
    const source = setting ?? (sensor as GatewaySensor);
    const reported = lastRead[entry.gateway.id]?.sensors.some((found) => found.key === key);
    const addKey = `${entry.gateway.id}:${key}`;
    return (
      <View key={key} style={styles.sensorBox}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {setting && lastRead[entry.gateway.id] && !reported ? (
          <Text style={styles.captionText}>Not in the gateway’s last answer.</Text>
        ) : null}
        {addingAreaFor === addKey ? (
          <QuickAreaForm
            areas={props.areas}
            caption="Saving picks this area for this sensor."
            backLabel="Back to the sensor"
            onSaved={async (id) => {
              await props.onAreaAdded();
              await saveSensor(entry, source, { plotId: id, kept: true });
              setAddingAreaFor(null);
            }}
            onBack={() => setAddingAreaFor(null)}
          />
        ) : (
          <>
            <View style={styles.fieldRow}>
              <Text style={styles.captionText}>Area</Text>
              <PopoverSelect
                options={areaOptions}
                selected={setting ? plotId ?? NO_PLOT : ''}
                placeholder="Pick an area to keep it"
                onSelect={(value) => void saveSensor(entry, source, { plotId: value === NO_PLOT ? null : value })}
                tabColor={TAB_COLOR}
                width={220}
              />
              <TouchableOpacity onPress={() => setAddingAreaFor(addKey)}>
                <Text style={styles.linkText}>Add an area</Text>
              </TouchableOpacity>
            </View>
            {plantings.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.captionText}>For</Text>
                <PopoverSelect
                  options={plantings}
                  selected={setting?.plantingId ?? NO_PLANTING}
                  onSelect={(value) => void saveSensor(entry, source, { plantingId: value === NO_PLANTING ? null : value })}
                  tabColor={TAB_COLOR}
                  width={220}
                />
              </View>
            ) : null}
            {setting && canBeEither ? (
              <View style={styles.fieldRow}>
                <Text style={styles.captionText}>Its temperature is</Text>
                <PopoverSelect
                  options={PROBE_TEMPERATURE_CHOICES}
                  selected={setting.probeMeasurement ?? 'soil_temperature'}
                  onSelect={(value) => void saveSensor(entry, source, { probeMeasurement: value })}
                  tabColor={TAB_COLOR}
                  width={200}
                />
              </View>
            ) : null}
            {setting ? (
              <View style={styles.fieldRow}>
                <Text style={styles.captionText}>{setting.kept ? 'Kept' : 'Not kept'}</Text>
                <Switch
                  value={setting.kept}
                  onValueChange={(value) => void saveSensor(entry, setting, { kept: value })}
                  trackColor={{ true: TAB_COLOR, false: colors.border }}
                />
              </View>
            ) : (
              <Text style={styles.captionText}>Nothing from this sensor is kept until it is given an area.</Text>
            )}
          </>
        )}
      </View>
    );
  }

  if (adding) {
    const sends = onComputer && method === 'push';
    return (
      <View style={styles.formCard}>
        {sends ? null : (
          <>
            <Text style={styles.fieldLabel}>Before you type anything</Text>
            <SetupSteps upTo={2} />
          </>
        )}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Name</Text>
          <AppTextInput style={[styles.textInput, styles.wideInput]} value={name} onChangeText={setName} placeholder="Greenhouse gateway" />
        </View>
        {onComputer ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>How it is read</Text>
            <PopoverSelect
              options={METHOD_CHOICES}
              selected={method}
              onSelect={(value) => setMethod(value === 'push' ? 'push' : 'ask')}
              tabColor={TAB_COLOR}
              width={280}
            />
          </View>
        ) : null}
        {sends && !bridge ? <Text style={styles.errorText}>{OLD_INSTALLER_NOTE}</Text> : null}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{sends ? 'Address (can be left blank)' : 'Address'}</Text>
          <AppTextInput
            style={[styles.textInput, styles.wideInput]}
            value={host}
            onChangeText={setHost}
            placeholder="192.168.1.40"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
        <Text style={styles.captionText}>
          {sends
            ? 'It is filled in from the first reading the station sends.'
            : 'Only the address: no http, no password, nothing after it.'}
        </Text>
        {problem ? <Text style={styles.errorText}>{problem}</Text> : null}
        <ThumbRow primary="first" style={styles.actionRow}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => void handleSave()}>
            <Text style={styles.primaryButtonText}>{sends ? 'Save' : 'Save and Read It'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAdding(false);
              setEditingId(null);
            }}
          >
            <Text style={styles.linkText}>Cancel</Text>
          </TouchableOpacity>
        </ThumbRow>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {gateways.length === 0 ? (
        <View style={styles.formCard}>
          <Text style={styles.bodyText}>{GATEWAY_HOW}</Text>
          <Text style={styles.fieldLabel}>Setting it up</Text>
          <SetupSteps />
        </View>
      ) : null}
      {gateways.map((entry) => {
        const { gateway, sensors, polling } = entry;
        const sends = gateway.method === 'push';
        const reader = readers[gateway.id];
        const read = lastRead[gateway.id];
        const waiting = read ? read.sensors.filter((sensor) => !sensors.some((setting) => setting.sensorKey === sensor.key)) : [];
        const saved = sortByLabel(sensors.map((setting) => ({ label: setting.label, value: setting.sensorKey }))).map(
          (option) => sensors.find((setting) => setting.sensorKey === option.value) as GatewaySensorSetting,
        );
        return (
          <View key={gateway.id} style={styles.formCard}>
            <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>{gateway.name}</Text>
            <Text style={styles.captionText}>
              {sends
                ? gateway.host
                  ? `Sends its readings, from ${gateway.host}`
                  : 'Sends its readings to a computer'
                : gateway.host}
            </Text>
            {reader ? <Text style={styles.bodyText}>{reader.text}</Text> : null}
            {reader?.takeOverLabel ? (
              confirmingId === gateway.id ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.bodyText}>{reader.takeOverConfirm}</Text>
                  <ThumbRow primary="first" style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                      onPress={() => void handleTakeOver(gateway.id)}
                    >
                      <Text style={styles.primaryButtonText}>{reader.takeOverLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setConfirmingId(null)}>
                      <Text style={styles.linkText}>Cancel</Text>
                    </TouchableOpacity>
                  </ThumbRow>
                </View>
              ) : (
                <TouchableOpacity onPress={() => (reader.takeOverConfirm ? setConfirmingId(gateway.id) : void handleTakeOver(gateway.id))}>
                  <Text style={styles.linkText}>{reader.takeOverLabel}</Text>
                </TouchableOpacity>
              )
            ) : null}
            {entry.readsHere ? (() => {
              const status = sends
                ? pushStatus({
                    listening: listener?.listening ?? false,
                    listenError: bridge ? listener?.error ?? null : OLD_INSTALLER_NOTE,
                    lastReadAt: polling.lastReadAt,
                    lastProblem: polling.lastProblem,
                  })
                : gatewayStatus({
                    reading: busyId === gateway.id,
                    lastReadAt: polling.lastReadAt,
                    lastProblem: polling.lastProblem,
                    readsHere: entry.readsHere,
                  });
              const dot =
                status.kind === 'connected' ? colors.primary : status.kind === 'problem' ? colors.danger : colors.textMuted;
              return (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: dot }]} />
                  <Text style={styles.bodyText}>{status.text}</Text>
                </View>
              );
            })() : null}
            {entry.readsHere && sends && bridge && listener?.error ? <Text style={styles.errorText}>{listener.error}</Text> : null}
            {entry.readsHere && sends && !bridge ? <Text style={styles.errorText}>{OLD_INSTALLER_NOTE}</Text> : null}
            {!entry.readsHere ? null : polling.lastProblem ? (
              <Text style={styles.errorText}>
                {polling.lastProblem}
                {polling.lastAttemptAt ? ` (${when(polling.lastAttemptAt)})` : ''}
              </Text>
            ) : polling.lastLine ? (
              <Text style={styles.bodyText}>
                {polling.lastLine} {polling.lastReadAt ? `Last read ${when(polling.lastReadAt)}.` : ''}
              </Text>
            ) : null}
            {entry.readsHere && !sends ? (
              <View style={styles.fieldRow}>
                <Text style={styles.captionText}>How often</Text>
                <PopoverSelect
                  options={POLL_CHOICES}
                  selected={String(polling.everyMinutes)}
                  onSelect={(value) => void setGatewayPolling(gateway.id, { everyMinutes: Number(value) }).then(load)}
                  tabColor={TAB_COLOR}
                  width={200}
                />
              </View>
            ) : null}
            {entry.readsHere && sends ? (
              <>
                <Text style={styles.fieldLabel}>Setting up the station to send</Text>
                <SetupSteps steps={pushSteps({ addresses: listener?.addresses ?? [], port: Number(port) || DEFAULT_LISTEN_PORT })} />
                <View style={styles.fieldRow}>
                  <Text style={styles.captionText}>Port this computer listens on</Text>
                  <AppTextInput
                    style={[styles.textInput, styles.portInput]}
                    value={port}
                    onChangeText={setPort}
                    onBlur={() => void handlePort()}
                    onSubmitEditing={() => void handlePort()}
                    keyboardType="number-pad"
                  />
                </View>
                {portProblem ? <Text style={styles.errorText}>{portProblem}</Text> : null}
                <Text style={styles.captionText}>{PUSH_ADDRESS_TIP}</Text>
              </>
            ) : null}
            <ThumbEndRow style={styles.actionRow}>
              {entry.readsHere && !sends ? (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                  disabled={busyId === gateway.id}
                  onPress={() => void readNow(gateway.id)}
                >
                  <Text style={styles.primaryButtonText}>{busyId === gateway.id ? 'Reading…' : 'Read It Now'}</Text>
                </TouchableOpacity>
              ) : null}
              {entry.readsHere ? (
                <TouchableOpacity onPress={() => void handleStopHere(gateway.id)}>
                  <Text style={styles.linkText}>Stop Reading It Here</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => void handleRemove(gateway.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startForm(entry)}>
                <Text style={styles.linkText}>Change</Text>
              </TouchableOpacity>
            </ThumbEndRow>
            {saved.length > 0 || waiting.length > 0 ? <Text style={styles.fieldLabel}>Sensors</Text> : null}
            {saved.map((setting) => renderSensor(entry, read?.sensors.find((sensor) => sensor.key === setting.sensorKey) ?? null, setting))}
            {waiting.map((sensor) => renderSensor(entry, sensor, null))}
            {saved.length === 0 && waiting.length === 0 ? (
              <Text style={styles.captionText}>
                {sends
                  ? 'The first reading the station sends lists its sensors here, each to be given an area.'
                  : entry.readsHere
                    ? 'Read It Now lists the sensors the gateway reports, each to be given an area.'
                    : 'The sensors are given areas on the device that reads it.'}
              </Text>
            ) : null}
            {waiting.length > 0 ? (
              <Text style={styles.captionText}>
                Next: give each sensor you want kept an area. Nothing from a sensor is kept until it has one.
              </Text>
            ) : null}
            {read && read.notKept.length > 0 ? (
              <Text style={styles.captionText}>Also reported and not kept in Garden: {read.notKept.join(', ')}.</Text>
            ) : null}
            <Text style={styles.captionText}>
              Removing the gateway keeps every reading it gave. Its readings are kept under the sensor’s name, such as “
              {gateway.name}, Outdoor station”.
            </Text>
          </View>
        );
      })}
      <TouchableOpacity style={[styles.primaryButton, styles.addButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => startForm(null)}>
        <Text style={styles.primaryButtonText}>+ Add a Gateway</Text>
      </TouchableOpacity>
      {unmatched && onComputer ? (
        <View style={styles.formCard}>
          <Text style={styles.errorText}>
            {`A station at ${unmatched.from}${unmatched.stationType ? ` (${unmatched.stationType})` : ''} sent readings at ${when(unmatched.at)}, and no gateway received on this computer matches it. Add a gateway that sends its readings to this computer, or press Read It on This Computer on the one it belongs to.`}
          </Text>
        </View>
      ) : null}
      <View style={styles.formCard}>
        <Text style={styles.captionText}>{onComputer ? PUSH_HOW : PUSH_PHONE_NOTE}</Text>
        <Text style={styles.captionText}>{ADDRESS_TIP}</Text>
        <Text style={styles.captionText}>{WHILE_OPEN_NOTE}</Text>
        <Text style={styles.captionText}>{ONE_DEVICE_NOTE}</Text>
        <Text style={styles.captionText}>{HOURS_NOTE}</Text>
        <Text style={styles.captionText}>{RAIN_NOTE}</Text>
        <Text style={styles.captionText}>{LIGHT_NOTE}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
  steps: { gap: 6 },
  stepRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  stepNumber: { ...typography.label, minWidth: 16, ...textShadow },
  stepText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  sensorBox: { gap: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  cardTitle: { ...typography.label, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  wideInput: { flex: 1, minWidth: 160 },
  portInput: { width: 90 },
  confirmBox: { gap: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  addButton: { alignSelf: 'flex-start' },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
