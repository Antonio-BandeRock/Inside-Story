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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { lookupProductByBarcode, type LookedUpProduct } from '../lib/barcodeLookup';
import {
  getFoodNutrients,
  getScannedProductByBarcode,
  getUserConditions,
  recordScannedProductPrice,
  saveScannedProduct,
} from '../lib/db';
import { parseIngredientsForDisplay } from '../lib/ingredientsParsing';
import { extractPriceGuess, recognizeTextFromImage } from '../lib/ocr';
import { pickAndSaveMealPhoto, saveCapturedPhoto } from '../lib/mealPhotos';
import {
  flagAdditivesInIngredients,
  flagConditionConcernsForConditions,
  flagConditionConcernsInIngredients,
  type ScannedProductConditionFlag,
  type ScannedProductFlag,
} from '../lib/scannedProductFlags';

type ScanStatus =
  | 'scanning'
  | 'looking-up'
  | 'not-found'
  | 'ingredients'
  | 'report'
  | 'price-capture'
  | 'photo-capture'
  | 'saved'
  | 'error';

// 'ingredients' | 'price' -- which real photo step a photo action is for,
// shared by the action sheet (which button opened it) and the in-app
// camera step (what to do with the resulting picture).
type PhotoTargetKind = 'ingredients' | 'price';

const REPORTABLE_NUTRIENT_CODES = ['energy_kcal', 'fat_total', 'carbohydrate', 'sugars_total', 'protein', 'sodium'];

// 2026-08-16 -- direct, explicit request after the earlier wrap-grid of
// chips: a real, fixed-column-count table, not a variable-width flowing
// layout. A flexWrap grid lets each row hold a different number of items
// depending on how much text fits, which is exactly why it never actually
// read as "columns" lining up -- a genuine table needs the SAME number of
// cells in every row, each cell the same width, so content lines up
// vertically down every column regardless of what any one cell holds.
const INGREDIENT_TABLE_COLUMNS = 2;

function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

export default function ScanProductScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  // Real, device-measured bottom/top inset -- see the photo-capture render
  // branch below for why the shutter button needs this directly rather
  // than a flat guessed pixel value.
  const insets = useSafeAreaInsets();
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

  // Real, in-app camera capture for the ingredients/price photos -- see
  // saveCapturedPhoto's own header comment in lib/mealPhotos.ts for the
  // full, confirmed-on-device reason "Take a Photo" no longer hands off to
  // the phone's separate Camera app the way it briefly did.
  const cameraRef = useRef<CameraView>(null);
  const [photoCaptureTarget, setPhotoCaptureTarget] = useState<PhotoTargetKind | null>(null);
  const [takingPicture, setTakingPicture] = useState(false);

  // Fetched once, reused for every row of the real, readable ingredient
  // table below -- see flagConditionConcernsForConditions's own header
  // comment in lib/scannedProductFlags.ts for why this stays a single
  // fetch rather than one query per ingredient row.
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    getUserConditions().then(setSelectedConditions);
  }, []);

  // 2026-08-16 -- direct request: "the output needs to be in a readable
  // and completely understandable format or table of information." The
  // raw ingredientsText string (from OCR or Open Food Facts) is still the
  // real, single source of truth -- fed into computeReport, saved as-is,
  // and still directly editable below -- this is purely a real, derived
  // display: one row per real ingredient, in Title Case where the source
  // reads as straight-off-the-label ALL CAPS, each flagged inline with
  // the exact same real additive/condition matching the report step
  // already uses, just applied per-row instead of over the whole text.
  const parsedIngredientRows = useMemo(
    () =>
      parseIngredientsForDisplay(ingredientsText).map((entry) => ({
        ...entry,
        additiveFlags: flagAdditivesInIngredients(entry.raw),
        conditionFlags: flagConditionConcernsForConditions(entry.raw, selectedConditions),
      })),
    [ingredientsText, selectedConditions],
  );

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
    setPhotoCaptureTarget(null);
    setStatus('scanning');
  }

  // No stale-closure risk here anymore -- every real caller of computeReport
  // is now a genuine, separate user action (tapping "Continue" on the
  // ingredients screen), which always happens well after any setState call
  // that set savedProductId/existingProductId has already committed and
  // re-rendered. See handleBarcodeScanned below: the re-scan-an-
  // already-saved-product path used to call this synchronously, in the same
  // tick as setExistingProductId, which is why this used to need a real
  // productIdOverride param to sidestep a stale closure -- that call site
  // is gone now (a repeat scan always lands on the real 'ingredients'
  // screen too, so the person's own "Take a Photo of the Ingredients"
  // button is never silently skipped just because a product was scanned
  // once before), so the override was removed as genuinely dead code.
  const computeReport = useCallback(
    async (text: string) => {
      setComputingReport(true);
      try {
        const [additives, conditions] = await Promise.all([
          Promise.resolve(flagAdditivesInIngredients(text)),
          flagConditionConcernsInIngredients(text),
        ]);
        setAdditiveFlags(additives);
        setConditionFlags(conditions);
        const resolvedId = savedProductId ?? existingProductId;
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
      // "My Processed Foods" entry. This ALWAYS lands on the real
      // 'ingredients' screen next, even when a real ingredients_text is
      // already on file (a real, direct-request fix, 2026-08-16 -- this
      // used to jump straight to the report for a repeat scan, which
      // silently skipped the whole ingredients screen -- and therefore its
      // "Take a Photo of the Ingredients" button -- entirely, exactly
      // matching a real, repeated on-device report that the ingredients
      // scan step had "gone." Confirmed via a direct pull of the real
      // on-device scanned_products table: both real test products already
      // carried a genuine, non-empty ingredients_text from an earlier
      // session, so every later re-scan of either one during this same
      // testing session was silently taking this exact shortcut).
      const existing = await getScannedProductByBarcode(scanned);
      if (existing) {
        setExistingProductId(existing.id);
        setName(existing.name);
        setBrand(existing.brand);
        setIngredientsText(existing.ingredientsText ?? '');
        setSavedProductId(existing.id);
        setStatus('ingredients');
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
  }, []);

  async function finishIngredientsPhoto(uri: string) {
    setIngredientsPhotoUri(uri);
    const recognized = await recognizeTextFromImage(uri);
    if (recognized) setIngredientsText(recognized);
  }

  async function finishPricePhoto(uri: string) {
    setPricePhotoUri(uri);
    const recognized = await recognizeTextFromImage(uri);
    if (recognized) {
      const guess = extractPriceGuess(recognized);
      if (guess != null) setPriceText(guess.toFixed(2));
    }
  }

  // "Choose from Library" for either photo step -- unaffected by today's
  // fix, since a gallery/library pick never triggers a live camera preview
  // the way "Take a Photo" used to, so it was never at risk of the same
  // background-kill.
  async function handleChooseFromLibrary(target: PhotoTargetKind) {
    const scopeKey = target === 'ingredients' ? 'scanned-product-ingredients' : 'scanned-product-price';
    const previousUri = target === 'ingredients' ? ingredientsPhotoUri : pricePhotoUri;
    const setBusy = target === 'ingredients' ? setCapturingIngredients : setCapturingPrice;
    setBusy(true);
    try {
      const result = await pickAndSaveMealPhoto('library', scopeKey, previousUri ?? undefined);
      if (result.status !== 'success') {
        if (result.status === 'permission-denied') {
          setErrorMessage('Inside Story needs access to your photos to use an existing picture.');
        }
        return;
      }
      if (target === 'ingredients') await finishIngredientsPhoto(result.uri);
      else await finishPricePhoto(result.uri);
    } finally {
      setBusy(false);
    }
  }

  // "Take a Photo" now opens the app's own in-app camera step (below)
  // rather than handing off to the phone's separate Camera app.
  function handleOpenCamera(target: PhotoTargetKind) {
    setPhotoCaptureTarget(target);
    setStatus('photo-capture');
  }

  function handleCancelPhotoCapture() {
    const target = photoCaptureTarget;
    setPhotoCaptureTarget(null);
    setStatus(target === 'price' ? 'price-capture' : 'ingredients');
  }

  async function handleTakePicture() {
    if (!cameraRef.current || takingPicture) return;
    const target = photoCaptureTarget;
    setTakingPicture(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setPhotoCaptureTarget(null);
      setStatus(target === 'price' ? 'price-capture' : 'ingredients');

      const scopeKey = target === 'ingredients' ? 'scanned-product-ingredients' : 'scanned-product-price';
      const previousUri = target === 'ingredients' ? ingredientsPhotoUri : pricePhotoUri;
      const setBusy = target === 'ingredients' ? setCapturingIngredients : setCapturingPrice;
      setBusy(true);
      try {
        const result = await saveCapturedPhoto(picture.uri, scopeKey, picture.width, picture.height, previousUri ?? undefined);
        if (result.status === 'success') {
          if (target === 'ingredients') await finishIngredientsPhoto(result.uri);
          else await finishPricePhoto(result.uri);
        } else if (result.status === 'too-small') {
          setErrorMessage('That photo came out too small to use. Move a little closer and try again.');
        } else if (result.status === 'too-large-after-compression') {
          setErrorMessage("That photo couldn't be made small enough to save. Try again.");
        }
      } finally {
        setBusy(false);
      }
    } catch (error) {
      console.error('[ScanProductScreen] Failed to take picture', error);
      setPhotoCaptureTarget(null);
      setStatus(target === 'price' ? 'price-capture' : 'ingredients');
    } finally {
      setTakingPicture(false);
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

  // A real, in-app camera capture, staying inside this app's own process
  // the whole time (see saveCapturedPhoto's own header comment in
  // lib/mealPhotos.ts) -- used for both the ingredients photo and the
  // price photo, driven by photoCaptureTarget.
  if (status === 'photo-capture') {
    return (
      <View style={styles.screen}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        {/*
          Real, direct on-device report, 2026-08-16: "At the bottom it says
          line up the ingredients and then hit capture. I am seeing no
          capture anywhere." This is a genuine repeat of a bug class this
          whole app has already hit and fixed many times before -- see
          constants/floatingButton.ts's own header comment, which exists
          specifically because "a fixed guess would eventually undershoot
          on some real device and silently hide content behind a [system
          nav bar] again." This screen was the one real place that never
          adopted that established discipline: captureOverlay used a flat,
          hardcoded paddingBottom with no real safe-area-inset awareness at
          all, so on a device using Android's own 3-button navigation (the
          app's own creator's actual, already-documented preference), the
          shutter button was very likely rendering partly or entirely
          behind that real, opaque system nav-bar scrim -- functionally
          invisible, exactly matching "I am seeing no capture anywhere."
          Fixed the same way every other floating bottom control in this
          app already is: add the real, device-measured insets.bottom/
          insets.top on top of the same base numbers, rather than trusting
          a flat guess a second time.
        */}
        <View
          style={[styles.captureOverlay, { paddingTop: 60 + insets.top, paddingBottom: 48 + insets.bottom }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[styles.captureCancelButton, { top: 16 + insets.top }]}
            activeOpacity={0.8}
            onPress={handleCancelPhotoCapture}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.scanHint}>
            {photoCaptureTarget === 'price'
              ? 'Line up the price tag or receipt, then tap to capture.'
              : 'Line up the ingredients list, then tap to capture.'}
          </Text>
          <TouchableOpacity
            style={[styles.shutterButton, takingPicture ? styles.disabled : null]}
            activeOpacity={0.8}
            onPress={handleTakePicture}
            disabled={takingPicture}
          >
            {takingPicture ? <ActivityIndicator color={colors.background} /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>
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
            ? 'We already have an ingredients list, shown as a readable list below. Take a photo of the label to refine it, or edit the text directly.'
            : 'Take a photo of the ingredients list to check it for anything worth avoiding.'}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, capturingIngredients ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={() => handleOpenCamera('ingredients')}
          disabled={capturingIngredients}
        >
          <Ionicons name="camera-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{capturingIngredients ? 'Reading…' : 'Take a Photo of the Ingredients'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.libraryLink}
          activeOpacity={0.7}
          onPress={() => handleChooseFromLibrary('ingredients')}
          disabled={capturingIngredients}
        >
          <Text style={styles.libraryLinkText}>or choose an existing photo</Text>
        </TouchableOpacity>

        {parsedIngredientRows.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Ingredients We Found ({parsedIngredientRows.length})</Text>
            <Text style={styles.gridHint}>
              Tinted cells have something worth knowing -- the full explanation shows up on the next screen.
            </Text>
            <View style={styles.dataTable}>
              {chunkIntoRows(parsedIngredientRows, INGREDIENT_TABLE_COLUMNS).map((rowItems, rowIndex, allRows) => {
                const isLastRow = rowIndex === allRows.length - 1;
                return (
                  <View key={rowIndex} style={[styles.dataTableRow, isLastRow ? styles.dataTableRowLast : null]}>
                    {Array.from({ length: INGREDIENT_TABLE_COLUMNS }, (_, colIndex) => colIndex).map((colIndex) => {
                      const isLastCol = colIndex === INGREDIENT_TABLE_COLUMNS - 1;
                      const row = rowItems[colIndex];
                      if (!row) {
                        return <View key={colIndex} style={[styles.ingredientCell, isLastCol ? null : styles.ingredientCellDivider]} />;
                      }
                      const hasRedFlag = row.additiveFlags.some((flag) => flag.severity === 'red');
                      const hasYellowFlag = row.conditionFlags.length > 0 || row.additiveFlags.some((flag) => flag.severity === 'yellow');
                      const hasInfoFlag = row.additiveFlags.some((flag) => flag.severity === 'info');
                      const cellTint = hasRedFlag
                        ? { backgroundColor: colors.statusRedBg }
                        : hasYellowFlag
                          ? { backgroundColor: colors.statusYellowBg }
                          : hasInfoFlag
                            ? { backgroundColor: colors.surface }
                            : null;
                      return (
                        <View
                          key={colIndex}
                          style={[styles.ingredientCell, isLastCol ? null : styles.ingredientCellDivider, cellTint]}
                        >
                          <Text style={styles.ingredientCellText} numberOfLines={2}>
                            {row.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Edit the Text Directly</Text>
        <Text style={styles.text}>
          If something above looks wrong or got missed, fix it here. The list above updates as you type.
        </Text>
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
            <Text style={styles.sectionLabel}>Per 100g -- from the barcode scan</Text>
            <View style={styles.dataTable}>
              <View style={[styles.dataTableRow, styles.dataTableHeaderRow]}>
                <Text style={[styles.dataTableHeaderText, styles.dataTableColNutrient]}>Nutrient</Text>
                <Text style={[styles.dataTableHeaderText, styles.dataTableColAmount]}>Amount</Text>
                <Text style={[styles.dataTableHeaderText, styles.dataTableColUnit]}>Unit</Text>
              </View>
              {nutrientSummary.map((row, index) => (
                <View
                  key={row.code}
                  style={[styles.dataTableRow, index === nutrientSummary.length - 1 ? styles.dataTableRowLast : null]}
                >
                  <Text style={[styles.dataTableCellText, styles.dataTableColNutrient]}>{row.displayName}</Text>
                  <Text style={[styles.dataTableCellText, styles.dataTableColAmount]}>{row.amountPer100g.toFixed(1)}</Text>
                  <Text style={[styles.dataTableCellText, styles.dataTableColUnit]}>{row.unit}</Text>
                </View>
              ))}
            </View>
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
          onPress={() => handleOpenCamera('price')}
          disabled={capturingPrice}
        >
          <Ionicons name="camera-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{capturingPrice ? 'Reading…' : 'Take a Photo of the Price'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.libraryLink}
          activeOpacity={0.7}
          onPress={() => handleChooseFromLibrary('price')}
          disabled={capturingPrice}
        >
          <Text style={styles.libraryLinkText}>or choose an existing photo</Text>
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
  // paddingTop/paddingBottom (captureOverlay) and top (captureCancelButton)
  // are deliberately NOT set here anymore -- both are always supplied at
  // render time as insets.top/insets.bottom plus the same base numbers, so
  // there's only ever one real, device-aware value in play, never a stale
  // static one sitting underneath it.
  captureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  captureCancelButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
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
  // A real, fixed-column-count grid -- 2026-08-16, direct correction of
  // the earlier flex-wrap chip layout: "I don't want you putting every
  // word into it's own bubble... a table of information with the correct
  // number of columns and the correct number of rows, with everything
  // lined up correctly." A wrap-grid lets each row hold a different
  // number of items depending on text length, which is exactly why it
  // never actually read as columns lining up. dataTable/dataTableRow are
  // shared by both real tables on this screen (this one, and the Per
  // 100g nutrient table below) -- one real table style, not two.
  dataTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  dataTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataTableRowLast: { borderBottomWidth: 0 },
  dataTableHeaderRow: { backgroundColor: colors.surface },
  dataTableHeaderText: { ...typography.bodyEmphasis, color: colors.textSecondary, paddingVertical: 8, paddingHorizontal: 10 },
  dataTableCellText: { ...typography.body, color: colors.textPrimary, paddingVertical: 8, paddingHorizontal: 10 },
  // The Per 100g table's own real 3 columns -- fixed flex ratios, not
  // content-sized, so every row's amount/unit land in the same horizontal
  // position regardless of how long that row's own nutrient name is.
  dataTableColNutrient: { flex: 2 },
  dataTableColAmount: { flex: 1, textAlign: 'right' },
  dataTableColUnit: { flex: 1, textAlign: 'right' },
  // The ingredients table's own real cells -- every cell the same flex:1
  // width, so both real columns line up down the whole table regardless
  // of which row a given ingredient happens to land in.
  ingredientCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  ingredientCellDivider: { borderRightWidth: 1, borderRightColor: colors.border },
  ingredientCellText: { ...typography.caption, color: colors.textPrimary },
  gridHint: { ...typography.caption, color: colors.textMuted },
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
  libraryLink: { alignItems: 'center', paddingVertical: 4 },
  libraryLinkText: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'underline' },
});
