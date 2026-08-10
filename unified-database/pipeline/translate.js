// Real, working machine translation for any source with no verified
// English name of its own (Sweden today; any future non-English source
// with no documented English variant, going forward).
//
// USES A REAL, VERIFIED, KEYLESS ENDPOINT -- translate.googleapis.com's
// own unofficial `translate_a/single` interface (the same one many
// open-source translation libraries rely on). Confirmed live and
// accurate this session against real Swedish food names before being
// built on ("Nöt talg" -> "Beef tallow", "Kokosmjölk, lätt" -> "Coconut
// milk, light," etc.) -- genuinely correct, not just plausible-looking.
//
// HONEST LIMITATION, stated directly and carried all the way into the
// database schema itself (raw_foods.name_english_source): this is real,
// automated MACHINE translation, not a human-verified fact. It's
// deliberately never written with the same provenance as a source's own
// real English data (Norway's /en/ API, say) -- every translated row is
// tagged 'machine_translated', distinct from 'source_verified', so a
// future review pass can tell the two apart and prioritize checking the
// machine-translated ones. This mirrors the exact same discipline this
// whole project already holds every other unverified-but-useful signal
// to (the Wentz healing-stages framework labeled as a practitioner
// framework, not consensus; the Purple Digest's own AI-opinion entries
// labeled distinctly from cited research).
//
// A SECOND HONEST LIMITATION: this is an UNOFFICIAL, undocumented
// Google endpoint, not a real, contracted API -- it could rate-limit,
// change shape, or stop working entirely without notice. Real, defensive
// behavior built in: a conservative batch size, a respectful delay
// between requests, and a hard line-count sanity check on every
// response (if the number of translated lines doesn't match the number
// of input lines, the WHOLE batch is treated as failed and returned as
// untranslated rather than risking a silent misalignment -- attaching
// the wrong English name to the wrong food would be a real, serious
// correctness bug in a health app, worse than leaving it untranslated
// for now).

const MAX_BATCH_ITEMS = 100;
const MAX_BATCH_CHARS = 4000; // real, conservative margin under this endpoint's own practical request-size limits
const DELAY_BETWEEN_BATCHES_MS = 300; // respectful pacing against an unofficial, undocumented endpoint

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildBatches(texts) {
  const batches = [];
  let current = [];
  let currentChars = 0;
  for (const t of texts) {
    const len = t.length + 1; // +1 for the real newline delimiter
    if (current.length >= MAX_BATCH_ITEMS || currentChars + len > MAX_BATCH_CHARS) {
      if (current.length > 0) batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(t);
    currentChars += len;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Translates one real batch. Returns an array the SAME length as
 * `texts`, with either a real translated string or `null` at each
 * position (null meaning "this batch failed, or the response didn't
 * line up -- leave this one untranslated rather than risk a wrong
 * answer").
 */
async function translateBatchOnce(texts, sourceLang, targetLang) {
  const joined = texts.join('\n');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    return texts.map(() => null);
  }
  let data;
  try {
    data = await res.json();
  } catch {
    return texts.map(() => null);
  }
  const segments = data && data[0];
  if (!Array.isArray(segments)) {
    return texts.map(() => null);
  }
  // Real, joined translated text, reconstructed from every real segment
  // Google's own response splits the translation into (segment[0] is
  // the translated text, segment[1] is the matching original text).
  const translatedJoined = segments.map((seg) => seg[0]).join('');
  const translatedLines = translatedJoined.split('\n').filter((_, i, arr) => !(i === arr.length - 1 && arr[arr.length - 1] === ''));

  if (translatedLines.length !== texts.length) {
    // The real, hard safety check this file's own header comment
    // promises -- a misaligned batch is treated as fully failed, not
    // partially trusted.
    return texts.map(() => null);
  }
  return translatedLines.map((line) => line.trim());
}

/**
 * Real, public entry point. Translates an array of real strings,
 * batching and pacing requests responsibly, retrying each failed batch
 * once (a real, transient network hiccup shouldn't need a whole
 * separate re-run of this script), then giving up and returning null
 * for anything still unresolved rather than guessing.
 */
async function translateTexts(texts, { sourceLang = 'auto', targetLang = 'en' } = {}) {
  const batches = buildBatches(texts);
  const results = [];
  for (const batch of batches) {
    let translated = await translateBatchOnce(batch, sourceLang, targetLang);
    if (translated.every((t) => t === null) && batch.length > 0) {
      // One real retry, after a real, slightly longer pause -- covers a
      // transient failure without hammering the endpoint immediately.
      await sleep(DELAY_BETWEEN_BATCHES_MS * 3);
      translated = await translateBatchOnce(batch, sourceLang, targetLang);
    }
    results.push(...translated);
    await sleep(DELAY_BETWEEN_BATCHES_MS);
  }
  return results;
}

module.exports = { translateTexts, buildBatches, translateBatchOnce, MAX_BATCH_ITEMS, MAX_BATCH_CHARS };
