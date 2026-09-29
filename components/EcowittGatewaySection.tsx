import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { sortByLabel } from '../lib/choiceOrder';
import type { GardenPlanting, GardenPlot } from '../lib/db';
import {
  deleteGateway,
  listGateways,
  readGatewayNow,
  saveGateway,
  saveGatewaySensor,
  setGatewayPolling,
  type GatewaySensorSetting,
  type GatewayWithSettings,
} from '../lib/ecowittDb';
import {
  GATEWAY_HOW,
  HOURS_NOTE,
  normaliseHost,
  ONE_DEVICE_NOTE,
  POLL_CHOICES,
  PROBE_TEMPERATURE_CHOICES,
  WHILE_OPEN_NOTE,
  type GatewayRead,
  type GatewaySensor,
} from '../lib/ecowittLocal';
import { areaPath } from '../lib/gardenAreaNesting';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { QuickAreaForm } from './QuickAreaForm';

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

  const load = useCallback(async () => {
    setGateways(await listGateways());
  }, []);

  useEffect(() => {
    void load();
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
    setAdding(true);
  }

  async function handleSave() {
    const address = normaliseHost(host);
    if (!address) {
      setProblem('Type the address the gateway has on your network, such as 192.168.1.40.');
      return;
    }
    const id = await saveGateway({ id: editingId ?? undefined, name: name.trim() || 'Ecowitt gateway', host: address });
    setAdding(false);
    setEditingId(null);
    await load();
    await readNow(id);
  }

  async function readNow(id: string) {
    setBusyId(id);
    try {
      const result = await readGatewayNow(id);
      if (result.read) setLastRead((held) => ({ ...held, [id]: result.read as GatewayRead }));
      await load();
      props.onRead();
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
    return (
      <View style={styles.formCard}>
        <Text style={styles.captionText}>{GATEWAY_HOW}</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Name</Text>
          <AppTextInput style={[styles.textInput, styles.wideInput]} value={name} onChangeText={setName} placeholder="Greenhouse gateway" />
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Address</Text>
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
        {problem ? <Text style={styles.errorText}>{problem}</Text> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => void handleSave()}>
            <Text style={styles.primaryButtonText}>Save and Read It</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setAdding(false);
              setEditingId(null);
            }}
          >
            <Text style={styles.linkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {gateways.length === 0 ? <Text style={styles.captionText}>{GATEWAY_HOW}</Text> : null}
      {gateways.map((entry) => {
        const { gateway, sensors, polling } = entry;
        const read = lastRead[gateway.id];
        const waiting = read ? read.sensors.filter((sensor) => !sensors.some((setting) => setting.sensorKey === sensor.key)) : [];
        const saved = sortByLabel(sensors.map((setting) => ({ label: setting.label, value: setting.sensorKey }))).map(
          (option) => sensors.find((setting) => setting.sensorKey === option.value) as GatewaySensorSetting,
        );
        return (
          <View key={gateway.id} style={styles.formCard}>
            <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>{gateway.name}</Text>
            <Text style={styles.captionText}>{gateway.host}</Text>
            {polling.lastProblem ? (
              <Text style={styles.errorText}>
                {polling.lastProblem}
                {polling.lastAttemptAt ? ` (${when(polling.lastAttemptAt)})` : ''}
              </Text>
            ) : polling.lastLine ? (
              <Text style={styles.bodyText}>
                {polling.lastLine} {polling.lastReadAt ? `Last read ${when(polling.lastReadAt)}.` : ''}
              </Text>
            ) : null}
            <View style={styles.fieldRow}>
              <Text style={styles.bodyText}>Read it on this device</Text>
              <Switch
                value={polling.readingOn}
                onValueChange={(value) => void setGatewayPolling(gateway.id, { readingOn: value }).then(load)}
                trackColor={{ true: TAB_COLOR, false: colors.border }}
              />
            </View>
            {polling.readingOn ? (
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
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                disabled={busyId === gateway.id}
                onPress={() => void readNow(gateway.id)}
              >
                <Text style={styles.primaryButtonText}>{busyId === gateway.id ? 'Reading…' : 'Read It Now'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startForm(entry)}>
                <Text style={styles.linkText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleRemove(gateway.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
            {saved.length > 0 || waiting.length > 0 ? <Text style={styles.fieldLabel}>Sensors</Text> : null}
            {saved.map((setting) => renderSensor(entry, read?.sensors.find((sensor) => sensor.key === setting.sensorKey) ?? null, setting))}
            {waiting.map((sensor) => renderSensor(entry, sensor, null))}
            {saved.length === 0 && waiting.length === 0 ? (
              <Text style={styles.captionText}>Read It Now lists the sensors the gateway reports, each to be given an area.</Text>
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
      <View style={styles.formCard}>
        <Text style={styles.captionText}>{WHILE_OPEN_NOTE}</Text>
        <Text style={styles.captionText}>{ONE_DEVICE_NOTE}</Text>
        <Text style={styles.captionText}>{HOURS_NOTE}</Text>
        <Text style={styles.captionText}>{LIGHT_NOTE}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
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
