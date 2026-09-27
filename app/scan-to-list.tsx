// Scan a household thing onto the grocery list (G7 of the competitive build
// plan, Phase 2, 2026-09-27). Dish soap, foil, toothpaste: the things a
// household runs out of that the food scanner has nothing to say about.
//
// The barcode is read by the camera or typed, looked up in the name this
// device already gave it, then in Open Products Facts and Open Beauty Facts,
// and the person settles the name and the group before it goes on the list.
// Only the barcode leaves the phone. Opened from the grocery list (listId,
// so the line lands on that list) and from Life > Kitchen's non-food side.
// Food scans keep going through Food > Scan a Product, which can put the
// product on the list from its own Saved step.
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { PhoneOnlyNotice } from '../components/PhoneOnlyNotice';
import { PopoverSelect } from '../components/PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { HOUSEHOLD_GROUPS } from '../constants/householdItems';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import {
  HOUSEHOLD_OFFLINE,
  NOT_A_BARCODE,
  defaultGroupFor,
  describeAddedToList,
  describeHouseholdSource,
  householdGroupChoices,
  listLineName,
  readBarcode,
  type HouseholdProduct,
} from '../lib/scanToList';
import { findHouseholdProduct, putHouseholdOnList } from '../lib/scanToListDb';

const TAB = colors.tabLife;
const OWN_GROUP = 'A group of your own…';
const BUILT_IN_GROUPS = HOUSEHOLD_GROUPS.map((group) => group.label);

// What the person is settling before it goes on the list.
type Draft = {
  barcode: string;
  source: HouseholdProduct['source'];
  name: string;
  brand: string;
  group: string;
  unit: string;
  quantity: string;
  offline: boolean;
};

export default function ScanToListScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const params = useLocalSearchParams<{ listId?: string }>();
  const listId = typeof params.listId === 'string' && params.listId ? params.listId : null;

  const [mode, setMode] = useState<'find' | 'scan'>(isDesktopApp() ? 'find' : 'scan');
  const [codeText, setCodeText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [ownGroupOpen, setOwnGroupOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const handledScan = useRef(false);

  useEffect(() => {
    if (mode === 'scan' && !isDesktopApp() && permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [mode, permission, requestPermission]);

  const lookUp = useCallback(async (barcode: string) => {
    setBusy(true);
    setMessage(null);
    setDraft(null);
    setAdded(null);
    setOwnGroupOpen(false);
    try {
      const found = await findHouseholdProduct(barcode);
      if (found.kind === 'found') {
        const product = found.product;
        setDraft({
          barcode,
          source: product.source,
          name: product.name,
          brand: product.brand ?? '',
          group: product.group,
          unit: found.unit,
          quantity: '1',
          offline: false,
        });
      } else {
        setDraft({
          barcode,
          source: 'Typed',
          name: '',
          brand: '',
          group: defaultGroupFor('Typed'),
          unit: '',
          quantity: '1',
          offline: found.kind === 'offline',
        });
      }
    } catch (error) {
      console.error('[ScanToList] Lookup failed', error);
      setMessage(HOUSEHOLD_OFFLINE);
    } finally {
      setBusy(false);
    }
  }, []);

  function lookUpTyped() {
    const barcode = readBarcode(codeText);
    if (!barcode) {
      setDraft(null);
      setMessage(NOT_A_BARCODE);
      return;
    }
    lookUp(barcode);
  }

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (handledScan.current) return;
      handledScan.current = true;
      setMode('find');
      const barcode = readBarcode(result.data);
      if (!barcode) {
        setDraft(null);
        setMessage(NOT_A_BARCODE);
        return;
      }
      setCodeText(barcode);
      lookUp(barcode);
    },
    [lookUp],
  );

  function startScanning() {
    handledScan.current = false;
    setAdded(null);
    setMessage(null);
    setMode('scan');
  }

  const quantity = draft ? parseFloat(draft.quantity) : NaN;
  const canAdd = !!draft && draft.name.trim().length > 0 && draft.group.trim().length > 0 && quantity > 0;

  async function putOnList() {
    if (!draft || !canAdd) return;
    setBusy(true);
    try {
      const name = draft.name.replace(/\s+/g, ' ').trim();
      const brand = draft.brand.trim() || null;
      const lineName = listLineName(name, brand);
      const result = await putHouseholdOnList({
        barcode: draft.barcode,
        lineName,
        name,
        brand,
        group: draft.group.trim(),
        unit: draft.unit.trim(),
        quantity,
        listId,
      });
      setAdded(describeAddedToList(lineName, result.listName, result.started));
      setDraft(null);
      setCodeText('');
    } catch (error) {
      console.error('[ScanToList] Adding to the list failed', error);
      setMessage('That did not go on the list. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  function update(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  if (mode === 'scan') {
    if (isDesktopApp()) {
      return (
        <View style={styles.screen}>
          <View style={styles.content}>
            <PhoneOnlyNotice feature="scanHouseholdCode" color={TAB} action={{ label: 'Type the Numbers Instead', onPress: () => setMode('find') }} />
          </View>
        </View>
      );
    }
    if (!permission) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <View style={styles.card}>
              <Text style={styles.text}>Getting the camera ready…</Text>
            </View>
          </View>
        </View>
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <View style={styles.card}>
              <Ionicons name="camera-outline" size={40} color={colors.textMuted} style={styles.centerIcon} />
              <Text style={styles.title}>Camera access needed</Text>
              <Text style={styles.text}>
                The camera reads the barcode on the package. The picture is never kept; only the numbers it reads are used.
              </Text>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('find')}>
                <Text style={styles.secondaryButtonText}>Type the Numbers Instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.screen}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={handleScan}
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
        </View>
        <View style={styles.scanFooter}>
          <Text style={styles.scanHint}>Point this at the barcode on the package. It reads on its own.</Text>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('find')}>
            <Text style={styles.secondaryButtonText}>Type the Numbers Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const groupChoices = draft ? householdGroupChoices(BUILT_IN_GROUPS, draft.group) : BUILT_IN_GROUPS;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Scan a household thing onto the list</Text>
        <Text style={styles.body}>
          For what the house runs out of that is not food: cleaning, paper, laundry, personal care and the rest. Only the
          barcode is sent, to Open Products Facts and Open Beauty Facts, and once you have named a product this device
          remembers it.
        </Text>
        <Text style={styles.caption}>Food goes through Food &gt; Scan a Product, which can put it on the list too.</Text>
      </View>

      {added ? (
        <View style={styles.card}>
          <Text style={styles.strong}>{added}</Text>
          {listId ? (
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>Back to the List</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.push('/grocery-list')}>
              <Text style={styles.secondaryButtonText}>Open the List</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <TouchableOpacity style={[styles.inset, styles.primaryButton]} activeOpacity={0.85} onPress={startScanning}>
        <Ionicons name="barcode-outline" size={18} color={colors.textOnButton} />
        <Text style={styles.primaryButtonText}>{added ? 'Scan Another' : 'Scan the Barcode'}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Or type the numbers under the barcode</Text>
        <AppTextInput
          style={styles.input}
          placeholder="e.g. 3017620422003"
          keyboardType="number-pad"
          value={codeText}
          onChangeText={setCodeText}
          onSubmitEditing={lookUpTyped}
        />
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} disabled={busy || !codeText.trim()} onPress={lookUpTyped}>
          <Text style={styles.secondaryButtonText}>Look Up These Numbers</Text>
        </TouchableOpacity>
      </View>

      {busy && !draft ? (
        <View style={styles.card}>
          <Text style={styles.body}>Looking that up…</Text>
        </View>
      ) : null}

      {message ? (
        <View style={styles.card}>
          <Text style={styles.body}>{message}</Text>
        </View>
      ) : null}

      {draft ? (
        <View style={styles.card}>
          <Text style={styles.caption}>Barcode {draft.barcode}</Text>
          <Text style={styles.body}>{draft.offline ? HOUSEHOLD_OFFLINE : describeHouseholdSource(draft.source)}</Text>
          <Text style={styles.label}>What it is</Text>
          <AppTextInput
            style={styles.input}
            placeholder="e.g. Dish soap"
            value={draft.name}
            onChangeText={(text) => update({ name: text })}
          />
          <Text style={styles.label}>Brand, if it matters</Text>
          <AppTextInput
            style={styles.input}
            placeholder="leave empty if any will do"
            value={draft.brand}
            onChangeText={(text) => update({ brand: text })}
          />
          <Text style={styles.label}>Group on the list</Text>
          <PopoverSelect
            selected={draft.group}
            options={[...groupChoices, OWN_GROUP]}
            onSelect={(value) => {
              if (value === OWN_GROUP) {
                setOwnGroupOpen(true);
                update({ group: '' });
              } else {
                setOwnGroupOpen(false);
                update({ group: value });
              }
            }}
            placeholder="Pick a group"
            tabColor={TAB}
          />
          {ownGroupOpen ? (
            <AppTextInput
              style={styles.input}
              placeholder="Name the group"
              value={draft.group}
              onChangeText={(text) => update({ group: text })}
            />
          ) : null}
          <Text style={styles.label}>How many</Text>
          <View style={styles.amountRow}>
            <AppTextInput
              style={[styles.input, styles.amountInput]}
              keyboardType="decimal-pad"
              value={draft.quantity}
              onChangeText={(text) => update({ quantity: text })}
            />
            <AppTextInput
              style={[styles.input, styles.unitInput]}
              placeholder="bottles, rolls, packs"
              value={draft.unit}
              onChangeText={(text) => update({ unit: text })}
            />
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, !canAdd || busy ? styles.disabled : null]}
            activeOpacity={0.85}
            disabled={!canAdd || busy}
            onPress={putOnList}
          >
            <Ionicons name="cart-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>{busy ? 'Adding…' : 'Put It on My List'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  centerBody: { flex: 1, justifyContent: 'center' },
  centerIcon: { alignSelf: 'center' },
  card: { ...homeBandStyle, borderColor: TAB, padding: HOME_BAND_CONTENT_PADDING, gap: 10 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  body: { ...typography.body, color: colors.textSecondary, ...textShadow },
  strong: { ...typography.body, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
  label: { ...typography.label, color: colors.textPrimary, ...textShadow },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  amountRow: { flexDirection: 'row', gap: 10 },
  amountInput: { width: 90 },
  unitInput: { flex: 1 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.body, color: colors.textOnButton },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  disabled: { opacity: 0.5 },
  inset: { marginHorizontal: HOME_BAND_CONTENT_PADDING },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 180, borderWidth: 2, borderColor: colors.accent, borderRadius: 16 },
  scanFooter: { padding: 20, gap: 10, backgroundColor: colors.background },
  scanHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
});
