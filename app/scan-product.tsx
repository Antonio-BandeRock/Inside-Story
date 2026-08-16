// Real barcode scanning, 2026-08-16 -- follows the exact real, step-by-step
// workflow described directly by the app's own creator: scan the barcode,
// scan the ingredients list, get real nutrient data back from Open Food
// Facts / USDA FoodData Central (see lib/barcodeLookup.ts), build a real,
// quick report with color-coded and read-aloud flags for anything worth
// avoiding (see lib/scannedProductFlags.ts), and -- per direct decision --
// "Buy This" is ONE combined real action: it both saves the product to "My
// Processed Foods" and immediately offers the real price-photo step, with
// OCR attempted on the price too (also per direct decision), always shown
// as an editable, pre-filled confirm rather than trusted silently.
//
// Reached from Food's own "My Foods" hub (see app/(tabs)/food.tsx's own
// myFoodsCategories) as a real, standalone Stack screen -- matching
// app/connect.tsx/app/connections.tsx's established shape, not a 13th Food
// LensHub lens, since this is a genuinely different, multi-step camera/
// lookup/OCR flow, not "pick ingredients and save."
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { lookupProductByBarcode, type LookedUpProduct } from '../lib/barcodeLookup';
import {
  getFoodNutrients,
  getScannedProductByBarcode,
  recordScannedProductPrice,
  saveScannedProduct,
} from '../lib/db';
import { extractPriceGuess, recognizeTextFromImage } from '../lib/ocr';
import { pickAndSaveMealPhoto } from '../lib/mealPhotos';
import { flagAdditivesInIngredients, flagConditionConcernsInIngredients, type ScannedProductConditionFlag, type ScannedProductFlag } from '../lib/scannedProductFlags';

type ScanStatus =
  | 'scanning'
  | 'looking-up'
  | 'not-found'
  | 'ingredients'
  | 'report'
  | 'price-capture'
  | 'saved'
  | 'error';

const REPORTABLE_NUTRIENT_CODES = ['energy_kcal', 'fat_total', 'carbohydrate', 'sugars_total', 'protein', 'sodium'];

export default function ScanProductScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scanLockRef = useRef(false);

  const [barcode, setBarcode] = useState<string | null>(null);
  const [existingProductId, setExistingProductId] = useState<number | null>(null);
  const [lookedUp, setLookedUp] = useState<LookedUpProduct | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [ingredientsText, setIngredientsText] = useState('');
  const [ingredientsPhotoUri, setIngredientsPhotoUri] = useState<string | null>(null);
  const [capturingIngredients, setCapturingIngredients] = useState(false);
  const [nutrientSummary, setNutrientSummary] = useState<{ code: string; displayName: string; unit: string; amountPer100g: number }[]>([]);
  const [additiveFlags, setAdditiveFlags] = useState<ScannedProductFlag[]>([]);
  const [conditionFlags, setConditionFlags] = useState<ScannedProductConditionFlag[]>([]);
  const [computingReport, setComputingReport] = useState(false);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [capturingPrice, setCapturingPrice] = useState(false);
  const [pricePhotoUri, setPricePhotoUri] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  function resetForNewScan() {
    scanLockRef.current = false;
    setBarcode(null);
    setExistingProductId(null);
    setLookedUp(null);
    setName('');
    setBrand(null);
    setIngredientsText('');
    setIngredientsPhotoUri(null);
    setNutrientSummary([]);
    setAdditiveFlags([]);
    setConditionFlags([]);
    setSavedProductId(null);
    setPriceText('');
    setPricePhotoUri(null);
    setErrorMessage(null);
    setStatus('scanning');
  }

  // A real, explicit `productIdOverride` param, not just read from
  // savedProductId/existingProductId state -- computeReport is sometimes
  // called in the same synchronous handler that JUST called
  // setExistingProductId (the re-scan-an-already-saved-product path in
  // handleBarcodeScanned below), and React state updates aren't applied
  // synchronously -- this function's own useCallback closure would still
  // see the OLD (null) existingProductId at that exact moment, silently
  // showing zero nutrients for a product that's actually already saved.
  // Passing the real, definite id straight through as an argument sidesteps
  // that stale-closure risk entirely rather than depending on a render that
  // hasn't happened yet.
  const computeReport = useCallback(
    async (text: string, productIdOverride?: number) => {
      setComputingReport(true);
      try {
        const [additives, conditions] = await Promise.all([
          Promise.resolve(flagAdditivesInIngredients(text)),
          flagConditionConcernsInIngredients(text),
        ]);
        setAdditiveFlags(additives);
        setConditionFlags(conditions);
        const resolvedId = productIdOverride ?? savedProductId ?? existingProductId;
        if (resolvedId != null) {
          const nutrients = await getFoodNutrients(resolvedId, 'Scanned');
          setNutrientSummary(
            nutrients
              .filter((row) => REPORTABLE_NUTRIENT_CODES.includes(row.code))
              .sort((a, b) => REPORTABLE_NUTRIENT_CODES.indexOf(a.code) - REPORTABLE_NUTRIENT_CODES.indexOf(b.code)),
          );
        } else if (lookedUp) {
          setNutrientSummary(
            lookedUp.nutrients
              .filter((row) => REPORTABLE_NUTRIENT_CODES.includes(row.code))
              .map((row) => ({ code: row.code, displayName: row.code, unit: '', amountPer100g: row.amountPer100g }))
              .sort((a, b) => REPORTABLE_NUTRIENT_CODES.indexOf(a.code) - REPORTABLE_NUTRIENT_CODES.indexOf(b.code)),
          );
        }
        setStatus('report');
      } finally {
        setComputingReport(false);
      }
    },
    [savedProductId, existingProductId, lookedUp],
  );

  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    const scanned = result.data.trim();
    if (!scanned) {
      scanLockRef.current = false;
      return;
    }
    setBarcode(scanned);
    setStatus('looking-up');
    try {
      // Real, already-scanned reuse first -- scanning the same product a
      // second time should never re-hit the network or create a duplicate
      // "My Processed Foods" entry.
      const existing = await getScannedProductByBarcode(scanned);
      if (existing) {
        setExistingProductId(existing.id);
        setName(existing.name);
        setBrand(existing.brand);
        setIngredientsText(existing.ingredientsText ?? '');
        setSavedProductId(existing.id);
        if (existing.ingredientsText) {
          await computeReport(existing.ingredientsText, existing.id);
        } else {
          setStatus('ingredients');
        }
        return;
      }
      const result2 = await lookupProductByBarcode(scanned);
      if (!result2) {
        setStatus('not-found');
        return;
      }
      setLookedUp(result2);
      setName(result2.name);
      setBrand(result2.brand);
      setIngredientsText(result2.ingredientsText ?? '');
      setStatus('ingredients');
    } catch (error) {
      console.error('[ScanProductScreen] Lookup failed', error);
      setErrorMessage('Something went wrong looking that up. Check your connection and try again.');
      setStatus('error');
    }
  }, [computeReport]);

  async function handleCaptureIngredients() {
    setCapturingIngredients(true);
    try {
      const result = await pickAndSaveMealPhoto('camera', 'scanned-product-ingredients');
      if (result.status !== 'success') {
        if (result.status === 'permission-denied') {
          setErrorMessage("Inside Story needs camera access to photograph the ingredients list.");
        }
        return;
      }
      setIngredientsPhotoUri(result.uri);
      const recognized = await recognizeTextFromImage(result.uri);
      if (recognized) {
        setIngredientsText(recognized);
      }
    } finally {
      setCapturingIngredients(false);
    }
  }

  async function handleContinueFromIngredients() {
    await computeReport(ingredientsText);
  }

  function handleReadAloud() {
    const parts: string[] = [`${name}${brand ? `, by ${brand}` : ''}.`];
    const allFlags = [
      ...additiveFlags.map((flag) => `${flag.label}, a ${flag.severity === 'red' ? 'red' : flag.severity === 'yellow' ? 'yellow' : 'informational'} flag.`),
      ...conditionFlags.map((flag) => `${flag.label}, worth noting for your ${flag.conditionCode.replace(/_/g, ' ')}.`),
    ];
    if (allFlags.length === 0) {
      parts.push('Nothing flagged in the ingredients list.');
    } else {
      parts.push(`${allFlags.length} thing${allFlags.length === 1 ? '' : 's'} to be aware of.`);
      parts.push(...allFlags);
    }
    Speech.speak(parts.join(' '));
  }

  async function handleBuyThis() {
    if (!barcode) return;
    setSaving(true);
    try {
      let id = savedProductId ?? existingProductId;
      if (id == null) {
        id = await saveScannedProduct({
          barcode,
          name,
          brand,
          lookupSource: lookedUp?.lookupSource ?? 'Manual',
          ingredientsText: ingredientsText || null,
          photoUri: ingredientsPhotoUri,
          nutrients: lookedUp?.nutrients ?? [],
        });
        setSavedProductId(id);
      }
      setStatus('price-capture');
    } catch (error) {
      console.error('[ScanProductScreen] Failed to save scanned product', error);
      setErrorMessage('Something went wrong saving this. Please try again.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function handleCapturePrice() {
    setCapturingPrice(true);
    try {
      const result = await pickAndSaveMealPhoto('camera', 'scanned-product-price');
      if (result.status !== 'success') return;
      setPricePhotoUri(result.uri);
      const recognized = await recognizeTextFromImage(result.uri);
      if (recognized) {
        const guess = extractPriceGuess(recognized);
        if (guess != null) setPriceText(guess.toFixed(2));
      }
    } finally {
      setCapturingPrice(false);
    }
  }

  async function handleSavePrice() {
    const productId = savedProductId ?? existingProductId;
    if (productId == null) return;
    const parsed = parseFloat(priceText);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setSavingPrice(true);
    try {
      await recordScannedProductPrice({ scannedProductId: productId, price: parsed, photoUri: pricePhotoUri });
      setStatus('saved');
    } finally {
      setSavingPrice(false);
    }
  }

  // --- Render ---------------------------------------------------------

  if (!permission) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.text}>Inside Story needs your camera to scan a product&apos;s barcode.</Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'scanning') {
    return (
      <View style={styles.screen}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point your camera at a product&apos;s barcode</Text>
        </View>
      </View>
    );
  }

  if (status === 'looking-up') {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.text}>Looking that up…</Text>
        </View>
      </View>
    );
  }

  if (status === 'not-found') {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <Ionicons name="help-circle-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>Couldn&apos;t find that product</Text>
          <Text style={styles.text}>
            This barcode isn&apos;t in Open Food Facts or USDA FoodData Central yet. You can still log this food manually
            from any builder&apos;s own ingredient search.
          </Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={resetForNewScan}>
            <Text style={styles.primaryButtonText}>Scan Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.screen}>
        <View style={styles.centerBody}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.text}>{errorMessage}</Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={resetForNewScan}>
            <Text style={styles.primaryButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'ingredients') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{name}</Text>
        {brand ? <Text style={styles.text}>{brand}</Text> : null}
        <Text style={styles.sectionLabel}>Ingredients list</Text>
        <Text style={styles.text}>
          {ingredientsText
            ? "We already have an ingredients list. Take a real photo of the label to refine it, or edit it directly below."
            : "Take a photo of the ingredients list to check it for anything worth avoiding."}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, capturingIngredients ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleCaptureIngredients}
          disabled={capturingIngredients}
        >
          <Ionicons name="camera-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{capturingIngredients ? 'Reading…' : 'Take a Photo of the Ingredients'}</Text>
        </TouchableOpacity>
        <View style={styles.textAreaRow}>
          <AppTextInput
            value={ingredientsText}
            onChangeText={setIngredientsText}
            style={styles.textArea}
            multiline
            placeholder="Ingredients will appear here once scanned, or type them in directly."
            placeholderTextColor={colors.textMuted}
          />
          <VoiceInputButton onResult={setIngredientsText} />
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, computingReport ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleContinueFromIngredients}
          disabled={computingReport}
        >
          <Text style={styles.primaryButtonText}>{computingReport ? 'Checking…' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (status === 'report') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{name}</Text>
        {brand ? <Text style={styles.text}>{brand}</Text> : null}

        {nutrientSummary.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Per 100g</Text>
            {nutrientSummary.map((row) => (
              <View key={row.code} style={styles.nutrientRow}>
                <Text style={styles.text}>{row.displayName}</Text>
                <Text style={styles.text}>
                  {row.amountPer100g.toFixed(1)} {row.unit}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>
          {additiveFlags.length + conditionFlags.length === 0
            ? 'Nothing flagged'
            : `${additiveFlags.length + conditionFlags.length} thing${additiveFlags.length + conditionFlags.length === 1 ? '' : 's'} to be aware of`}
        </Text>
        {additiveFlags.map((flag, index) => (
          <View
            key={`additive-${index}`}
            style={[
              styles.flagRow,
              flag.severity === 'red'
                ? { backgroundColor: colors.statusRedBg, borderColor: colors.danger }
                : flag.severity === 'yellow'
                  ? { backgroundColor: colors.statusYellowBg, borderColor: colors.statusYellow }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.flagLabel}>{flag.label}</Text>
            <Text style={styles.flagDetail}>{flag.detail}</Text>
          </View>
        ))}
        {conditionFlags.map((flag, index) => (
          <View key={`condition-${index}`} style={[styles.flagRow, { backgroundColor: colors.statusYellowBg, borderColor: colors.statusYellow }]}>
            <Text style={styles.flagLabel}>{flag.label}</Text>
            <Text style={styles.flagDetail}>{flag.detail}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleReadAloud}>
          <Ionicons name="volume-high-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Read This to Me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, saving ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleBuyThis}
          disabled={saving}
        >
          <Ionicons name="cart-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Buy This'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={resetForNewScan}>
          <Text style={styles.secondaryButtonText}>Not Interested / Scan Another</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (status === 'price-capture') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
        <Text style={styles.title}>Added to My Processed Foods</Text>
        <Text style={styles.text}>Take a photo of the price to track it here next time, so you can watch how it changes over time.</Text>
        <TouchableOpacity
          style={[styles.primaryButton, capturingPrice ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleCapturePrice}
          disabled={capturingPrice}
        >
          <Ionicons name="camera-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{capturingPrice ? 'Reading…' : 'Take a Photo of the Price'}</Text>
        </TouchableOpacity>
        <View style={styles.textAreaRow}>
          <AppTextInput
            value={priceText}
            onChangeText={setPriceText}
            style={styles.priceInput}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, savingPrice ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleSavePrice}
          disabled={savingPrice || !priceText}
        >
          <Text style={styles.primaryButtonText}>{savingPrice ? 'Saving…' : 'Save Price'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setStatus('saved')}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // status === 'saved'
  return (
    <View style={styles.screen}>
      <View style={styles.centerBody}>
        <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.text}>{name} is in your My Processed Foods, ready to add from any builder&apos;s own ingredient search.</Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={resetForNewScan}>
          <Text style={styles.primaryButtonText}>Scan Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  camera: { flex: 1 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 3, borderColor: colors.accent, borderRadius: 16 },
  scanHint: { ...typography.body, color: '#FFFFFF', marginTop: 16, textAlign: 'center', paddingHorizontal: 24 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-between' },
  flagRow: { padding: 12, borderRadius: 10, borderWidth: 1, gap: 4 },
  flagLabel: { ...typography.bodyEmphasis, color: colors.textPrimary },
  flagDetail: { ...typography.caption, color: colors.textSecondary },
  textAreaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  textArea: {
    flex: 1,
    minHeight: 100,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
  },
  priceInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.background },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },
});
