// A medicine's label, as its manufacturer filed it with the FDA (A11,
// Phase 2, reshaped 2026-09-26).
//
// The person scans the barcode on the box, types the NDC printed on it, or
// searches by name, and sees the label word for word with where it came
// from, what was sent to get it, when, and which version it is. The app
// interprets nothing on it and checks it against nothing. Three rules from
// the instruction that shaped this screen, all enforced in
// lib/medicineLabel.ts and covered by scripts/test_medicine_label.js:
//
//   - a code finds only the label that lists that exact code;
//   - nothing opens until the person picks it, even when one label matched;
//   - when nothing matches, the screen says so and shows nothing in its place.
//
// Opened from a med on Life > My Meds (treatmentId, treatmentName), the
// label can be kept with that med and read offline; the kept copy changes
// only when the person replaces it after Check for a Newer Version.
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { PhoneOnlyNotice } from '../components/PhoneOnlyNotice';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import {
  LABEL_FDA_CAVEAT,
  LABEL_SOURCE_NOTE,
  SAVED_COPY_NOTE,
  dailyMedUrl,
  labelCaption,
  labelIdentity,
  labelName,
  notADrugCodeMessage,
  notFoundMessage,
  pickPrompt,
  readScannedCode,
  readTypedCode,
  retrievalStatement,
  unreachableMessage,
  versionCheckMessage,
  type LabelDocument,
  type LookupAsk,
} from '../lib/medicineLabel';
import { getSavedLabel, removeSavedLabel, saveLabel, type SavedLabel } from '../lib/medicineLabelDb';
import { lookUpLabel } from '../lib/medicineLabelLookup';
import { explainNotYet } from '../lib/notYet';

const TAB = colors.tabLife;

// What the person is reading: a label they picked from a lookup, or the
// copy kept with a med.
type Shown = {
  document: LabelDocument;
  sent: string;
  retrievedAt: string;
  howFound: 'code' | 'name';
  isSavedCopy: boolean;
};

// The last lookup: labels to pick from, or one sentence and nothing else.
type Found = { ask: LookupAsk; labels: LabelDocument[]; total: number; sent: string; retrievedAt: string };

export default function MedicineLabelScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const params = useLocalSearchParams<{ treatmentId?: string; treatmentName?: string }>();
  const treatmentId = typeof params.treatmentId === 'string' && params.treatmentId ? params.treatmentId : null;
  const treatmentName = typeof params.treatmentName === 'string' ? params.treatmentName : '';

  const [mode, setMode] = useState<'find' | 'scan'>('find');
  const [codeText, setCodeText] = useState('');
  // Filled from the med, never searched on its own: the person presses Search.
  const [nameText, setNameText] = useState(treatmentName);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [saved, setSaved] = useState<SavedLabel | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [newer, setNewer] = useState<{ document: LabelDocument; retrievedAt: string } | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set(['boxed_warning']));

  const [permission, requestPermission] = useCameraPermissions();
  const handledScan = useRef(false);

  useEffect(() => {
    if (!treatmentId) return;
    let cancelled = false;
    getSavedLabel(treatmentId)
      .then((label) => {
        if (cancelled || !label) return;
        setSaved(label);
        setShown({
          document: label.document,
          sent: label.whatWasSent,
          retrievedAt: label.retrievedAt,
          howFound: label.howFound,
          isSavedCopy: true,
        });
      })
      .catch((error) => console.error('[MedicineLabel] Failed to read the kept label', error));
    return () => {
      cancelled = true;
    };
  }, [treatmentId]);

  useEffect(() => {
    if (mode === 'scan' && permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [mode, permission, requestPermission]);

  const runLookup = useCallback(async (ask: LookupAsk) => {
    setBusy(true);
    setFound(null);
    setMessage(null);
    setShown(null);
    try {
      const outcome = await lookUpLabel(ask);
      if (outcome.kind === 'unreachable') setMessage(unreachableMessage(outcome.status));
      else if (outcome.kind === 'not_found') setMessage(notFoundMessage(ask));
      else setFound({ ask, labels: outcome.labels, total: outcome.total, sent: outcome.sent, retrievedAt: outcome.retrievedAt });
    } finally {
      setBusy(false);
    }
  }, []);

  function lookUpCode() {
    if (!codeText.trim()) return explainNotYet('Type the code from the box or the pharmacy label first.');
    const reading = readTypedCode(codeText);
    if (reading.kind !== 'ndc') {
      setFound(null);
      setShown(null);
      setMessage(notADrugCodeMessage(reading));
      return;
    }
    runLookup({ kind: 'code', reading });
  }

  function searchName() {
    if (!nameText.trim()) return explainNotYet("Type the medicine's brand or generic name first.");
    runLookup({ kind: 'name', name: nameText });
  }

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (handledScan.current) return;
      handledScan.current = true;
      setMode('find');
      const reading = readScannedCode(result.data);
      if (reading.kind !== 'ndc') {
        setFound(null);
        setShown(null);
        setMessage(notADrugCodeMessage(reading));
        return;
      }
      setCodeText(reading.shown);
      runLookup({ kind: 'code', reading });
    },
    [runLookup],
  );

  function startScanning() {
    handledScan.current = false;
    setMode('scan');
  }

  function pick(document: LabelDocument) {
    if (!found) return;
    setOpen(new Set(['boxed_warning']));
    setShown({
      document,
      sent: found.sent,
      retrievedAt: found.retrievedAt,
      howFound: found.ask.kind === 'name' ? 'name' : 'code',
      isSavedCopy: false,
    });
  }

  async function keep() {
    if (!treatmentId || !shown) return;
    const label: SavedLabel = {
      treatmentId,
      document: shown.document,
      howFound: shown.howFound,
      whatWasSent: shown.sent,
      retrievedAt: shown.retrievedAt,
    };
    await saveLabel(label);
    setSaved(label);
    setShown({ ...shown, isSavedCopy: true });
    setSavedNote(`Kept with ${treatmentName || 'this med'}. It reads the same without a connection.`);
  }

  async function checkNewer() {
    if (!saved) return;
    setBusy(true);
    setNewer(null);
    try {
      const outcome = await lookUpLabel({ kind: 'setId', setId: saved.document.setId });
      if (outcome.kind === 'unreachable') setSavedNote(unreachableMessage(outcome.status));
      else if (outcome.kind === 'not_found') setSavedNote(notFoundMessage({ kind: 'setId', setId: saved.document.setId }));
      else {
        const current = outcome.labels[0];
        setSavedNote(versionCheckMessage(saved.document, current));
        if (current.version !== saved.document.version) setNewer({ document: current, retrievedAt: outcome.retrievedAt });
      }
    } finally {
      setBusy(false);
    }
  }

  async function replaceWithNewer() {
    if (!saved || !treatmentId || !newer) return;
    const label: SavedLabel = { ...saved, document: newer.document, retrievedAt: newer.retrievedAt };
    await saveLabel(label);
    setSaved(label);
    setNewer(null);
    setShown({ document: label.document, sent: label.whatWasSent, retrievedAt: label.retrievedAt, howFound: label.howFound, isSavedCopy: true });
    setSavedNote(`Replaced with version ${newer.document.version}.`);
  }

  async function removeKept() {
    if (!treatmentId) return;
    await removeSavedLabel(treatmentId);
    setSaved(null);
    setShown(null);
    setSavedNote(null);
    setNewer(null);
  }

  function toggle(key: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (mode === 'scan') {
    if (isDesktopApp()) {
      return (
        <View style={styles.screen}>
          <View style={styles.content}>
            <PhoneOnlyNotice feature="scanMedicineCode" color={TAB} action={{ label: 'Type the Code Instead', onPress: () => setMode('find') }} />
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
                The camera reads the barcode on the medicine box. The picture is never kept; only the code it reads is used.
              </Text>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('find')}>
                <Text style={styles.secondaryButtonText}>Type the Code Instead</Text>
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
          barcodeScannerSettings={{ barcodeTypes: ['datamatrix', 'upc_a', 'ean13'] }}
          onBarcodeScanned={handleScan}
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
        </View>
        <View style={styles.scanFooter}>
          <Text style={styles.scanHint}>
            Point this at the barcode on the medicine box, or the small square code on a prescription package. It reads on its own.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('find')}>
            <Text style={styles.secondaryButtonText}>Type the Code Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (shown) {
    const doc = shown.document;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.title}>{labelName(doc)}</Text>
          <Text style={styles.caption}>{labelCaption(doc)}</Text>
          <Text style={styles.body}>{labelIdentity(doc)}</Text>
          <Text style={styles.body}>{retrievalStatement(shown.sent, shown.retrievedAt)}</Text>
          {shown.isSavedCopy ? <Text style={styles.body}>{SAVED_COPY_NOTE}</Text> : null}
          <Text style={styles.strong}>{LABEL_SOURCE_NOTE}</Text>
          <Text style={styles.caption}>{LABEL_FDA_CAVEAT}</Text>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => Linking.openURL(dailyMedUrl(doc.setId))}>
            <Ionicons name="open-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Open This Label on DailyMed</Text>
          </TouchableOpacity>
        </View>

        {savedNote ? (
          <View style={styles.card}>
            <Text style={styles.body}>{savedNote}</Text>
            {newer ? (
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={replaceWithNewer}>
                <Text style={styles.primaryButtonText}>Replace with Version {newer.document.version}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {doc.sections.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.body}>
              This label carries none of the warning, interaction or patient sections this screen shows. DailyMed shows every part of it.
            </Text>
          </View>
        ) : (
          doc.sections.map((section) => {
            const isOpen = open.has(section.key);
            const boxed = section.key === 'boxed_warning';
            return (
              <View key={section.key} style={[styles.card, boxed ? styles.boxedCard : null]}>
                <TouchableOpacity style={styles.foldRow} activeOpacity={0.8} onPress={() => toggle(section.key)} accessibilityRole="button">
                  <Text style={[styles.sectionHeading, boxed ? styles.boxedHeading : null]}>{section.heading}</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {isOpen ? (
                  <Text style={styles.labelText} selectable>
                    {section.text}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}

        {treatmentId && !shown.isSavedCopy ? (
          <TouchableOpacity style={[styles.inset, styles.primaryButton]} activeOpacity={0.85} onPress={keep}>
            <Ionicons name="bookmark-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>Keep This Label with {treatmentName || 'This Med'}</Text>
          </TouchableOpacity>
        ) : null}
        {shown.isSavedCopy ? (
          <TouchableOpacity style={[styles.inset, styles.secondaryButton]} activeOpacity={0.85} disabled={busy} onPress={checkNewer}>
            <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>{busy ? 'Asking openFDA…' : 'Check for a Newer Version'}</Text>
          </TouchableOpacity>
        ) : null}
        {found ? (
          <TouchableOpacity style={[styles.inset, styles.secondaryButton]} activeOpacity={0.85} onPress={() => setShown(null)}>
            <Text style={styles.secondaryButtonText}>Back to the List</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.inset, styles.secondaryButton]}
          activeOpacity={0.85}
          onPress={() => {
            setShown(null);
            setFound(null);
            setMessage(null);
            setSavedNote(null);
          }}
        >
          <Text style={styles.secondaryButtonText}>Look Up a Different Label</Text>
        </TouchableOpacity>
        {shown.isSavedCopy && treatmentId ? (
          <TouchableOpacity style={[styles.inset, styles.secondaryButton]} activeOpacity={0.85} onPress={removeKept}>
            <Text style={styles.secondaryButtonText}>Remove the Kept Label</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      <View style={styles.card}>
        <Text style={styles.title}>{treatmentName ? `The label for ${treatmentName}` : 'Look up a medicine label'}</Text>
        <Text style={styles.body}>
          Scan the barcode on the box, type the code printed on it (the NDC, 10 or 11 digits), or search by name. The code or
          the name is sent to openFDA, the U.S. Food and Drug Administration&apos;s public data service, and nothing else is.
        </Text>
        <Text style={styles.caption}>{LABEL_SOURCE_NOTE}</Text>
        {saved ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => setShown({ document: saved.document, sent: saved.whatWasSent, retrievedAt: saved.retrievedAt, howFound: saved.howFound, isSavedCopy: true })}
          >
            <Text style={styles.secondaryButtonText}>Back to the Kept Label</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.inset, styles.primaryButton]} activeOpacity={0.85} onPress={startScanning}>
        <Ionicons name="barcode-outline" size={18} color={colors.textOnButton} />
        <Text style={styles.primaryButtonText}>Scan the Barcode</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Code from the box or pharmacy label</Text>
        <AppTextInput
          style={styles.input}
          placeholder="e.g. 0074-4341-13"
          value={codeText}
          onChangeText={setCodeText}
          onSubmitEditing={lookUpCode}
        />
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} disabled={busy} onPress={lookUpCode}>
          <Text style={styles.secondaryButtonText}>Look Up This Code</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Or the medicine&apos;s name</Text>
        <AppTextInput
          style={styles.input}
          placeholder="brand or generic name"
          value={nameText}
          onChangeText={setNameText}
          onSubmitEditing={searchName}
        />
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} disabled={busy} onPress={searchName}>
          <Text style={styles.secondaryButtonText}>Search by Name</Text>
        </TouchableOpacity>
      </View>

      {busy ? (
        <View style={styles.card}>
          <Text style={styles.body}>Asking openFDA…</Text>
        </View>
      ) : null}

      {message ? (
        <View style={styles.card}>
          <Text style={styles.body}>{message}</Text>
        </View>
      ) : null}

      {found ? (
        <View style={styles.card}>
          <Text style={styles.body}>{pickPrompt(found.ask, found.labels.length, found.total)}</Text>
          <Text style={styles.caption}>{retrievalStatement(found.sent, found.retrievedAt)}</Text>
          {found.labels.map((doc) => (
            <TouchableOpacity key={doc.setId} style={styles.pickRow} activeOpacity={0.8} onPress={() => pick(doc)}>
              <View style={styles.pickText}>
                <Text style={styles.pickName}>{labelName(doc)}</Text>
                <Text style={styles.caption}>{labelCaption(doc)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
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
  boxedCard: { borderColor: colors.danger },
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
  foldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHeading: { ...typography.label, color: colors.textPrimary, flex: 1, ...textShadow },
  boxedHeading: { color: colors.danger },
  labelText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pickText: { flex: 1, gap: 2 },
  pickName: { ...typography.body, color: colors.textPrimary, ...textShadow },
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
  inset: { marginHorizontal: HOME_BAND_CONTENT_PADDING },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 180, borderWidth: 2, borderColor: colors.accent, borderRadius: 16 },
  scanFooter: { padding: 20, gap: 10, backgroundColor: colors.background },
  scanHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
});
