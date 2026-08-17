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
import { Canvas, ColorMatrix, Image as SkiaImage, ImageFormat, useCanvasRef, useImage } from '@shopify/react-native-skia';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextInput } from '../components/AppTextInput';
import { DraggableCropOverlay, type CropRect } from '../components/DraggableCropOverlay';
import { SimpleSlider } from '../components/SimpleSlider';
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
import { countRecognizedLetters, extractPriceGuess, recognizeTextFromImage } from '../lib/ocr';
import { pickAndSaveMealPhoto, saveCapturedPhoto } from '../lib/mealPhotos';
import {
  flagAdditivesInIngredients,
  flagConditionConcernsForConditions,
  flagConditionConcernsInIngredients,
  type ScannedProductConditionFlag,
  type ScannedProductFlag,
} from '../lib/scannedProductFlags';
import { buildToneMatrix, computeContainRect, saveAdjustedIngredientsPhoto } from '../lib/toneAdjustment';

type ScanStatus =
  | 'scanning'
  | 'looking-up'
  | 'not-found'
  | 'ingredients'
  | 'report'
  | 'price-capture'
  | 'photo-capture'
  | 'photo-crop'
  | 'photo-tone'
  | 'photo-review'
  | 'saved'
  | 'error';

// 'ingredients' | 'price' -- which real photo step a photo action is for,
// shared by the action sheet (which button opened it) and the in-app
// camera step (what to do with the resulting picture).
type PhotoTargetKind = 'ingredients' | 'price';

// A real, just-captured (or library-picked) raw ingredients photo, waiting
// to go through the new crop + brightness/contrast step before it becomes
// a real, OCR'd ingredients attempt -- see both handleTakePicture and
// handleChooseFromLibrary below; a price photo never needs cropping the
// way a curved/shiny can's own label does, so it's scoped to the
// ingredients target only. Only the real uri is ever needed -- every real
// dimension the crop/tone render branches use comes straight from the
// Skia-loaded rawImage itself (useImage below), which is the one, real
// source of truth for a photo's own actual pixel size either way.
type PendingAdjustPhoto = { uri: string };

// Real, on-device screen bounds -- this app doesn't handle rotation
// anywhere else in this screen either, so these are computed once, the
// same way MAX_INGREDIENT_ANGLES/INGREDIENT_TABLE_COLUMNS below are real,
// module-scope constants rather than recomputed every render.
const SCREEN_SIZE = Dimensions.get('window');
const ADJUST_BOX_WIDTH = SCREEN_SIZE.width - 48;
const ADJUST_BOX_MAX_HEIGHT = SCREEN_SIZE.height * 0.55;

// Real, multi-angle ingredients capture, 2026-08-16 -- direct request: a
// curved can's own text is undistorted at a different spot in each frame,
// and a shiny label's glare moves to a different spot too, so photographing
// from a couple of angles and keeping whichever read the most real text is
// one real technique that covers both problems, rather than needing two
// separate features. Deliberately NOT persisted as a real, permanent file
// per attempt -- only the raw camera-capture uri is used for the thumbnail/
// OCR during review; only whichever one the person actually ends up using
// gets saved for real (see handleUseIngredientsAttempts below), matching
// the existing "exactly one real ingredients photo per product" invariant.
type IngredientsPhotoAttempt = {
  uri: string;
  width: number;
  height: number;
  recognizedText: string | null;
  recognizing: boolean;
};

// A real, bounded cap, not unlimited -- three real angles is already more
// than enough for a curved/glossy label per the real research behind this
// feature, and an unbounded "just keep shooting" flow would never give the
// person a clear moment to stop.
const MAX_INGREDIENT_ANGLES = 3;

// A real, safety-critical resize cap, 2026-08-16 -- direct, on-device
// report right after crop/tone first shipped: "went to save the cropped
// photo and the app restarted." Root-caused via a real adb logcat sweep,
// not guessed: a genuine, rapid camera-hardware open/close storm followed
// 9 seconds later by "ActivityManager: Killing... (adj 900): remove
// task" -- Android's own real memory-reclaim killing this app while it
// was still in active use. The most plausible real cause: a raw camera
// capture from takePictureAsync() has NO resolution cap at all (a modern
// phone's own sensor can easily be 20-50+ megapixels), and useImage()
// decodes that FULL, uncapped photo straight into Skia's own native
// memory just to show it on the crop/tone screens -- the exact same real
// class of problem this app's own history already documents once before
// for a much smaller static asset (moon.png/sun.png, ~500-600MB of real,
// confirmed extra memory growth from a single 2000x2000 image). A real
// phone camera photo is a considerably bigger risk than that already was.
// Capped here, before the photo ever reaches pendingAdjustPhoto/useImage,
// matching the same real discipline lib/mealPhotos.ts's own
// MEAL_PHOTO_MAX_DIMENSION already established for every other photo in
// this app -- deliberately a real, generous cap (well above what OCR
// legibility actually needs) rather than the tightest possible number,
// since the real risk here is decode memory, not display quality.
const RAW_INGREDIENTS_PHOTO_MAX_DIMENSION = 1600;

async function capIngredientsPhotoSize(uri: string, width: number, height: number): Promise<string> {
  const longerEdge = Math.max(width, height);
  if (!longerEdge || longerEdge <= RAW_INGREDIENTS_PHOTO_MAX_DIMENSION) return uri;
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    const resize =
      width >= height ? { width: RAW_INGREDIENTS_PHOTO_MAX_DIMENSION } : { height: RAW_INGREDIENTS_PHOTO_MAX_DIMENSION };
    const result = await manipulateAsync(uri, [{ resize }], { compress: 0.9, format: SaveFormat.JPEG });
    return result.uri;
  } catch {
    // A real, honest fallback -- if the resize itself somehow fails, the
    // original photo is still usable; better to risk the same memory cost
    // than to silently strand the person with no photo at all.
    return uri;
  }
}

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
  // Real, multi-angle capture state -- see IngredientsPhotoAttempt's own
  // header comment. selectedAttemptIndex null means "no manual override,
  // use whichever one read the most real text" -- tapping a thumbnail on
  // the review screen locks in an explicit choice instead.
  const [ingredientsAttempts, setIngredientsAttempts] = useState<IngredientsPhotoAttempt[]>([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number | null>(null);
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

  // Real crop + brightness/contrast state, 2026-08-16 -- see
  // lib/toneAdjustment.ts's own header comment for why this leans on
  // react-native-skia. pendingAdjustPhoto is the raw camera capture
  // waiting to go through both real steps; rawImage loads it once (a
  // real React hook, so it has to be called unconditionally here, not
  // inside either of the photo-crop/photo-tone render branches below).
  // cropRect is fractional (0-1), relative to however the raw photo ends
  // up displayed -- see DraggableCropOverlay's own header comment.
  const [pendingAdjustPhoto, setPendingAdjustPhoto] = useState<PendingAdjustPhoto | null>(null);
  const rawImage = useImage(pendingAdjustPhoto?.uri ?? null);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [toneBrightness, setToneBrightness] = useState(0);
  const [toneContrast, setToneContrast] = useState(0);
  const [applyingAdjustment, setApplyingAdjustment] = useState(false);
  const adjustCanvasRef = useCanvasRef();

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

  // Recomputed fresh from ingredientsAttempts every time it changes (each
  // new OCR result coming in, or a new photo being added), so it always
  // reflects the current best real read with no separate live-tracking
  // state to keep in sync. selectedAttemptIndex, when set, always wins --
  // a real, explicit tap on a specific photo should never get silently
  // overridden by a later angle's own OCR result finishing.
  const bestAttemptIndex = useMemo(() => {
    let best = -1;
    let bestScore = -1;
    ingredientsAttempts.forEach((attempt, index) => {
      const score = countRecognizedLetters(attempt.recognizedText);
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    return best;
  }, [ingredientsAttempts]);
  const effectiveAttemptIndex = selectedAttemptIndex ?? bestAttemptIndex;

  function resetForNewScan() {
    scanLockRef.current = false;
    setBarcode(null);
    setExistingProductId(null);
    setLookedUp(null);
    setName('');
    setBrand(null);
    setIngredientsText('');
    setIngredientsPhotoUri(null);
    setIngredientsAttempts([]);
    setSelectedAttemptIndex(null);
    setNutrientSummary([]);
    setAdditiveFlags([]);
    setConditionFlags([]);
    setSavedProductId(null);
    setPriceText('');
    setPricePhotoUri(null);
    setErrorMessage(null);
    setPhotoCaptureTarget(null);
    setPendingAdjustPhoto(null);
    setCropRect({ x: 0, y: 0, width: 1, height: 1 });
    setToneBrightness(0);
    setToneContrast(0);
    setStatus('scanning');
  }

  // The one real place a fresh angle actually becomes an OCR'd attempt on
  // the review screen -- reused by handleFinishAdjustment below (the only
  // real caller now that every ingredients photo goes through crop/tone
  // first; see handleTakePicture's own ingredients branch).
  async function addIngredientsAttempt(uri: string, width: number, height: number) {
    setStatus('photo-review');
    setIngredientsAttempts((prev) => [
      ...prev,
      { uri, width, height, recognizedText: null, recognizing: true },
    ]);
    const recognized = await recognizeTextFromImage(uri);
    setIngredientsAttempts((prev) =>
      prev.map((attempt) => (attempt.uri === uri ? { ...attempt, recognizedText: recognized, recognizing: false } : attempt)),
    );
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

  async function finishPricePhoto(uri: string) {
    setPricePhotoUri(uri);
    const recognized = await recognizeTextFromImage(uri);
    if (recognized) {
      const guess = extractPriceGuess(recognized);
      if (guess != null) setPriceText(guess.toFixed(2));
    }
  }

  // "Choose from Library" for either photo step. 2026-08-16, direct,
  // real, on-device report right after the crop/tone feature first
  // shipped: "I do not see any cropping mechanism... when trying to scan
  // the ingredients." A library-picked ingredients photo used to skip
  // crop/tone entirely and go straight to OCR -- a real, genuine gap, not
  // just a stale-bundle confusion, since a curved/shiny label picked from
  // an already-taken photo needs the exact same real help reading clearly
  // as one just captured with the camera. Now routes through the SAME
  // real 'photo-crop'/'photo-tone' steps handleTakePicture's own
  // ingredients branch already does. One real, accepted tradeoff, stated
  // plainly rather than silently absorbed: pickAndSaveMealPhoto already
  // writes a real, permanent file before this ever reaches crop/tone, and
  // whichever attempt is eventually chosen there gets saved a SECOND time
  // via saveCapturedPhoto -- a real, small, orphaned-file cost, not a
  // correctness problem, and not worth a second, parallel "pick without
  // saving" pipeline just to avoid it. A price photo is unaffected,
  // unchanged from before.
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
      if (target === 'ingredients') {
        setPendingAdjustPhoto({ uri: result.uri });
        setCropRect({ x: 0, y: 0, width: 1, height: 1 });
        setToneBrightness(0);
        setToneContrast(0);
        setStatus('photo-crop');
      } else {
        await finishPricePhoto(result.uri);
      }
    } finally {
      setBusy(false);
    }
  }

  // "Take a Photo" now opens the app's own in-app camera step (below)
  // rather than handing off to the phone's separate Camera app.
  function handleOpenCamera(target: PhotoTargetKind) {
    if (target === 'ingredients') {
      // A fresh multi-angle round every time this button is tapped --
      // any earlier attempts from a prior round shouldn't silently keep
      // influencing a brand-new attempt at reading the label.
      setIngredientsAttempts([]);
      setSelectedAttemptIndex(null);
    }
    setPhotoCaptureTarget(target);
    setStatus('photo-capture');
  }

  function handleCancelPhotoCapture() {
    const target = photoCaptureTarget;
    setPhotoCaptureTarget(null);
    if (target === 'price') {
      setStatus('price-capture');
    } else {
      // Back out to the review screen if at least one angle has already
      // been captured this round (so it isn't silently thrown away), or
      // straight back to the ingredients screen if none has yet.
      setStatus(ingredientsAttempts.length > 0 ? 'photo-review' : 'ingredients');
    }
  }

  async function handleTakePicture() {
    if (!cameraRef.current || takingPicture) return;
    const target = photoCaptureTarget;
    setTakingPicture(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.9 });

      if (target === 'ingredients') {
        // Real, direct request, 2026-08-16: "There definitely needs to be
        // a crop area that can be set... Please build in the brightness
        // and contrast adjustment ability." Every raw ingredients photo
        // now goes through both real steps before it becomes an OCR'd
        // attempt -- see handleFinishAdjustment, the one real place
        // addIngredientsAttempt actually gets called now. A fresh crop
        // rect and neutral tone every time, so a setting left over from a
        // DIFFERENT earlier angle in this same round never silently
        // carries over onto a brand-new photo.
        setPhotoCaptureTarget(null);
        const safeUri = await capIngredientsPhotoSize(picture.uri, picture.width, picture.height);
        setPendingAdjustPhoto({ uri: safeUri });
        setCropRect({ x: 0, y: 0, width: 1, height: 1 });
        setToneBrightness(0);
        setToneContrast(0);
        setStatus('photo-crop');
      } else {
        setPhotoCaptureTarget(null);
        setStatus('price-capture');
        setCapturingPrice(true);
        try {
          const result = await saveCapturedPhoto(
            picture.uri,
            'scanned-product-price',
            picture.width,
            picture.height,
            pricePhotoUri ?? undefined,
          );
          if (result.status === 'success') {
            await finishPricePhoto(result.uri);
          } else if (result.status === 'too-small') {
            setErrorMessage('That photo came out too small to use. Move a little closer and try again.');
          } else if (result.status === 'too-large-after-compression') {
            setErrorMessage("That photo couldn't be made small enough to save. Try again.");
          }
        } finally {
          setCapturingPrice(false);
        }
      }
    } catch (error) {
      console.error('[ScanProductScreen] Failed to take picture', error);
      setPhotoCaptureTarget(null);
      setStatus(target === 'price' ? 'price-capture' : ingredientsAttempts.length > 0 ? 'photo-review' : 'ingredients');
    } finally {
      setTakingPicture(false);
    }
  }

  function handleTakeAnotherAngle() {
    setPhotoCaptureTarget('ingredients');
    setStatus('photo-capture');
  }

  // Discards the raw photo entirely -- back to the camera (or the review
  // screen, if an earlier angle this round already made it that far).
  function handleCancelCrop() {
    setPendingAdjustPhoto(null);
    setStatus(ingredientsAttempts.length > 0 ? 'photo-review' : 'ingredients');
  }

  function handleConfirmCrop() {
    setStatus('photo-tone');
  }

  // Back to crop, not a discard -- the raw photo and the crop rect both
  // stay exactly as they were, only the screen changes.
  function handleBackFromTone() {
    setStatus('photo-crop');
  }

  // The one real place the crop + tone adjustment actually gets applied
  // and exported -- reads the SAME real Canvas the tone step's own live
  // preview already renders (see the 'photo-tone' render branch below),
  // so there's no separate, second high-resolution render pass to keep in
  // sync with what the person actually saw and approved.
  async function handleFinishAdjustment() {
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    setApplyingAdjustment(true);
    try {
      const snapshot = canvas.makeImageSnapshot();
      const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 90);
      const width = snapshot.width();
      const height = snapshot.height();
      const uri = await saveAdjustedIngredientsPhoto(base64);
      setPendingAdjustPhoto(null);
      if (uri) {
        await addIngredientsAttempt(uri, width, height);
      } else {
        setErrorMessage("That photo couldn't be saved. Please try again.");
        setStatus(ingredientsAttempts.length > 0 ? 'photo-review' : 'ingredients');
      }
    } finally {
      setApplyingAdjustment(false);
    }
  }

  function handleSelectAttempt(index: number) {
    setSelectedAttemptIndex(index);
  }

  // The one real place a multi-angle round actually persists anything --
  // whichever attempt is currently chosen (the auto-picked best, or the
  // person's own explicit tap) gets saved for real exactly the way a
  // single photo always did, with the same real too-small/too-large
  // handling. Every OTHER attempt's own raw camera-capture file is simply
  // left alone (never a real, permanent app file to begin with).
  async function handleUseIngredientsAttempts() {
    const attempt = ingredientsAttempts[effectiveAttemptIndex];
    if (!attempt) {
      setStatus('ingredients');
      return;
    }
    setCapturingIngredients(true);
    try {
      const result = await saveCapturedPhoto(
        attempt.uri,
        'scanned-product-ingredients',
        attempt.width,
        attempt.height,
        ingredientsPhotoUri ?? undefined,
      );
      if (result.status === 'success') {
        setIngredientsPhotoUri(result.uri);
        if (attempt.recognizedText) setIngredientsText(attempt.recognizedText);
      } else if (result.status === 'too-small') {
        setErrorMessage('That photo came out too small to use. Move a little closer and try again.');
      } else if (result.status === 'too-large-after-compression') {
        setErrorMessage("That photo couldn't be made small enough to save. Try again.");
      }
    } finally {
      setCapturingIngredients(false);
      // Clear the other, unused angles now that a real choice has been
      // made -- nothing else reads this state outside the review screen,
      // and there's no reason to keep holding onto raw camera-capture
      // files for angles that were never actually used.
      setIngredientsAttempts([]);
      setSelectedAttemptIndex(null);
      setStatus('ingredients');
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
              : ingredientsAttempts.length > 0
                ? 'Line up another angle of the label, then tap to capture.'
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

  // Real, direct-request crop step, 2026-08-16: "There definitely needs
  // to be a crop area that can be set. Otherwise it provides information
  // that isn't part of what we need." Shows the whole raw photo (aspect-
  // fit within a real, bounded box -- see computeContainRect's own header
  // comment for why the exact same math has to drive both what's drawn
  // and where the drag handles sit), with DraggableCropOverlay on top for
  // pulling a rectangle in from any edge.
  if (status === 'photo-crop') {
    if (!pendingAdjustPhoto || !rawImage) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <ActivityIndicator color={colors.accent} />
          </View>
        </View>
      );
    }
    const boxHeight = Math.min(ADJUST_BOX_MAX_HEIGHT, ADJUST_BOX_WIDTH * (rawImage.height() / rawImage.width()));
    const displayRect = computeContainRect(rawImage.width(), rawImage.height(), ADJUST_BOX_WIDTH, boxHeight);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>Set the Crop Area</Text>
        <Text style={styles.text}>
          Drag the corners in to keep just the ingredients text -- cutting out anything else the photo picked up helps it read more clearly.
        </Text>
        <View style={[styles.adjustCanvasBox, { width: ADJUST_BOX_WIDTH, height: boxHeight }]}>
          <Canvas style={{ width: ADJUST_BOX_WIDTH, height: boxHeight }}>
            <SkiaImage
              image={rawImage}
              x={displayRect.x}
              y={displayRect.y}
              width={displayRect.width}
              height={displayRect.height}
              fit="fill"
            />
          </Canvas>
          <View style={{ position: 'absolute', left: displayRect.x, top: displayRect.y, width: displayRect.width, height: displayRect.height }}>
            <DraggableCropOverlay width={displayRect.width} height={displayRect.height} value={cropRect} onChange={setCropRect} />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleConfirmCrop}>
          <Text style={styles.primaryButtonText}>Next: Adjust Brightness/Contrast</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleCancelCrop}>
          <Text style={styles.secondaryButtonText}>Retake Photo</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Real, direct-request brightness/contrast step, 2026-08-16 -- the same
  // real Canvas rendered here is what handleFinishAdjustment snapshots and
  // exports, so what's previewed live is exactly what gets used, never a
  // separate render pass that could quietly disagree with it. Renders
  // ONLY the already-cropped region, scaled to fill this canvas -- the
  // image is drawn larger than the canvas itself, offset so the chosen
  // crop rect lands exactly at (0,0), and the canvas's own bounds clip
  // everything else away.
  if (status === 'photo-tone') {
    if (!pendingAdjustPhoto || !rawImage) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <ActivityIndicator color={colors.accent} />
          </View>
        </View>
      );
    }
    const imgW = rawImage.width();
    const imgH = rawImage.height();
    const cropPixelX = cropRect.x * imgW;
    const cropPixelY = cropRect.y * imgH;
    const cropPixelW = cropRect.width * imgW;
    const cropPixelH = cropRect.height * imgH;
    const cropAspect = cropPixelW / cropPixelH;
    let toneCanvasW = ADJUST_BOX_WIDTH;
    let toneCanvasH = ADJUST_BOX_WIDTH / cropAspect;
    if (toneCanvasH > ADJUST_BOX_MAX_HEIGHT) {
      toneCanvasH = ADJUST_BOX_MAX_HEIGHT;
      toneCanvasW = ADJUST_BOX_MAX_HEIGHT * cropAspect;
    }
    const scale = toneCanvasW / cropPixelW;
    const toneMatrix = buildToneMatrix(toneBrightness, toneContrast);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>Adjust Brightness &amp; Contrast</Text>
        <Text style={styles.text}>
          A shiny or dim label often reads much better once the glare is cut down -- drag either slider to see it update live.
        </Text>
        <View style={[styles.adjustCanvasBox, { width: toneCanvasW, height: toneCanvasH, alignSelf: 'center' }]}>
          <Canvas ref={adjustCanvasRef} style={{ width: toneCanvasW, height: toneCanvasH }}>
            <SkiaImage image={rawImage} x={-cropPixelX * scale} y={-cropPixelY * scale} width={imgW * scale} height={imgH * scale}>
              <ColorMatrix matrix={toneMatrix} />
            </SkiaImage>
          </Canvas>
        </View>
        <View style={styles.sliderRow}>
          <SimpleSlider label="Brightness" value={toneBrightness} onChange={setToneBrightness} />
        </View>
        <View style={styles.sliderRow}>
          <SimpleSlider label="Contrast" value={toneContrast} onChange={setToneContrast} />
        </View>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => {
            setToneBrightness(0);
            setToneContrast(0);
          }}
        >
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, applyingAdjustment ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleFinishAdjustment}
          disabled={applyingAdjustment}
        >
          <Text style={styles.primaryButtonText}>{applyingAdjustment ? 'Saving…' : 'Use This Photo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleBackFromTone}>
          <Text style={styles.secondaryButtonText}>Back to Crop</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Real, direct request, 2026-08-16: multiple photos from different
  // angles cover both a curved can's undistorted-slice problem and a
  // shiny label's moving-glare problem with one real technique, since
  // this app can't send anything to a cloud OCR service without costing
  // real cellular data in exactly the grocery-store dead zones this
  // whole feature needs to work in. This screen is where those angles
  // actually get compared -- whichever one read the most real, legible
  // text is picked automatically, but every angle stays tappable so a
  // person can pick a different one by eye if the auto-pick looks wrong.
  // The manual-edit text field on the 'ingredients' screen is still the
  // real fallback either way, unchanged.
  if (status === 'photo-review') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>
          {ingredientsAttempts.length} photo{ingredientsAttempts.length === 1 ? '' : 's'} of up to {MAX_INGREDIENT_ANGLES}
        </Text>
        <Text style={styles.text}>
          {ingredientsAttempts.length > 1
            ? "Tap a photo below if a different one reads more clearly. The one with the border is what we'll use."
            : "Hard to read? A curved can or a shiny label often reads better from a second angle -- tap 'Take Another Angle' below."}
        </Text>

        <View style={styles.attemptRow}>
          {ingredientsAttempts.map((attempt, index) => {
            const isSelected = index === effectiveAttemptIndex;
            const isBest = index === bestAttemptIndex && selectedAttemptIndex == null;
            return (
              <TouchableOpacity
                key={attempt.uri}
                style={[styles.attemptCard, isSelected ? styles.attemptCardSelected : null]}
                activeOpacity={0.8}
                onPress={() => handleSelectAttempt(index)}
                disabled={attempt.recognizing}
              >
                <Image source={{ uri: attempt.uri }} style={styles.attemptThumbnail} resizeMode="cover" />
                {attempt.recognizing ? (
                  <View style={styles.attemptStatusRow}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={styles.attemptStatusText}>Reading…</Text>
                  </View>
                ) : (
                  <Text style={styles.attemptSnippet} numberOfLines={2}>
                    {attempt.recognizedText ? attempt.recognizedText : 'Nothing legible in this one'}
                  </Text>
                )}
                {isBest ? <Text style={styles.attemptBestBadge}>Clearest read</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {ingredientsAttempts.length < MAX_INGREDIENT_ANGLES ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleTakeAnotherAngle}>
            <Ionicons name="camera-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Take Another Angle</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, capturingIngredients ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleUseIngredientsAttempts}
          disabled={capturingIngredients || ingredientsAttempts.some((attempt) => attempt.recognizing)}
        >
          <Text style={styles.primaryButtonText}>
            {capturingIngredients ? 'Saving…' : ingredientsAttempts.length === 1 ? 'Use This Photo' : 'Use This One'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  // The real, shared box both the crop step's full-photo preview and the
  // tone step's cropped-region preview render inside -- same real border
  // treatment either way, sized dynamically per step (see ADJUST_BOX_
  // WIDTH/ADJUST_BOX_MAX_HEIGHT and the two render branches above).
  adjustCanvasBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  sliderRow: { alignItems: 'center' },
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
  // The multi-angle review screen's own real thumbnail grid -- one card
  // per captured angle, wrapping onto a new line rather than a fixed row,
  // so this still reads fine whether there's 1 photo or the real max of 3.
  attemptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  attemptCard: {
    width: 140,
    padding: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  attemptCardSelected: { borderColor: colors.accent },
  attemptThumbnail: { width: '100%', height: 110, borderRadius: 8, backgroundColor: colors.border },
  attemptStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attemptStatusText: { ...typography.caption, color: colors.textSecondary },
  attemptSnippet: { ...typography.caption, color: colors.textSecondary },
  attemptBestBadge: { ...typography.caption, color: colors.accent, fontWeight: '600' },
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
