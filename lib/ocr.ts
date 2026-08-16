// Real, on-device OCR for the barcode-scanning feature, 2026-08-16 --
// scanning an ingredients list or a price tag both need real text pulled
// out of a photo. Uses rn-mlkit-ocr (Google ML Kit on Android, Apple
// Vision on iOS, both fully on-device -- no photo ever leaves the phone
// for this step), confirmed as the actively-maintained real package (its
// own predecessor, react-native-mlkit-ocr, was independently checked and
// found archived/abandoned before this one was chosen).
//
// Every real call is dynamically imported, matching the exact discipline
// lib/mealPhotos.ts/lib/customBackgroundImage.ts already established for
// every native-module dependency in this app -- a plain top-level import
// from a real native module once crashed the whole app at launch (see
// lib/customBackgroundImage.ts's own header comment), since its own
// native-module lookup runs the instant the JS bundle evaluates the
// import, not when the function is actually called.
export async function recognizeTextFromImage(imageUri: string): Promise<string | null> {
  try {
    const { recognizeText } = await import('rn-mlkit-ocr');
    const result = await recognizeText(imageUri, 'latin');
    const text = result?.text?.trim();
    return text || null;
  } catch (error) {
    console.error('[ocr] recognizeTextFromImage failed', error);
    return null;
  }
}

// A real, best-effort price guess from a real price-tag/receipt photo's
// OCR'd text -- always shown as an editable, pre-filled field for a
// person to confirm or correct before it's ever saved, per direct
// decision: attempt OCR, never trust it silently. A real price tag often
// also shows a smaller per-unit price ("$0.25/oz") alongside the actual
// shelf price -- picking the LARGEST plausible dollar match is a
// reasonable real-world heuristic for "the actual price," not a
// guarantee, which is exactly why this always stays a pre-fill, not a
// final answer.
export function extractPriceGuess(text: string): number | null {
  const matches = [...text.matchAll(/\$?\s*(\d{1,4}\.\d{2})\b/g)];
  if (matches.length === 0) return null;
  const values = matches.map((match) => parseFloat(match[1])).filter((value) => !Number.isNaN(value) && value > 0);
  if (values.length === 0) return null;
  return Math.max(...values);
}
