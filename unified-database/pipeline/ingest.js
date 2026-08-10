// The shared glue every per-source adapter hands its output to -- the
// real "everything downstream already works" half of the promise made
// in sources/README.md. An adapter's job ends at returning an array of
// NormalizedRecord; this is what actually writes it into the database,
// registers the source if it's new, and is safe to re-run (re-ingesting
// a source with the same source_food_id updates the existing row rather
// than creating a duplicate, so a future re-import of an already-known
// source is a real, cheap refresh, not a fresh flood of duplicates).

function esc(s) {
  return s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
}

/**
 * Builds the real SQL statements to register a source (INSERT OR
 * IGNORE -- if it's already registered, this is a no-op, never
 * clobbers real metadata a person may have hand-edited).
 */
function buildSourceRegistration(sourceMeta) {
  return `INSERT OR IGNORE INTO sources (source_code, display_name, country_or_region, language, home_url, license_or_terms, raw_format, last_ingested_at)
    VALUES (${esc(sourceMeta.sourceCode)}, ${esc(sourceMeta.displayName)}, ${esc(sourceMeta.countryOrRegion)}, ${esc(sourceMeta.language)}, ${esc(sourceMeta.homeUrl)}, ${esc(sourceMeta.licenseOrTerms)}, ${esc(sourceMeta.rawFormat)}, ${esc(new Date().toISOString())});
    UPDATE sources SET last_ingested_at = ${esc(new Date().toISOString())} WHERE source_code = ${esc(sourceMeta.sourceCode)};`;
}

/**
 * Builds the real SQL statements to ingest one source's own array of
 * NormalizedRecord (see sources/README.md for the exact required
 * shape). UPSERTs on (source_code, source_food_id) so re-running an
 * ingest for a source that's already been imported updates rather than
 * duplicates -- a real requirement given "import future additions...
 * in a very easy way" explicitly means re-running the same steps, not
 * just running them once.
 */
function buildIngestStatements(sourceCode, records) {
  const statements = [];
  const nowIso = new Date().toISOString();

  for (const r of records) {
    if (!r.nameOriginal) {
      throw new Error(`Record missing required nameOriginal for source ${sourceCode}: ${JSON.stringify(r).slice(0, 200)}`);
    }
    const langualJson = r.langualCodes ? JSON.stringify(r.langualCodes) : null;
    const rawJson = JSON.stringify(r.raw ?? {});

    statements.push(
      `INSERT INTO raw_foods (source_code, source_food_id, name_original, name_english, latin_name, langual_codes, category_original, raw_json, ingested_at)
       VALUES (${esc(sourceCode)}, ${esc(r.sourceFoodId)}, ${esc(r.nameOriginal)}, ${esc(r.nameEnglish)}, ${esc(r.latinName)}, ${esc(langualJson)}, ${esc(r.categoryOriginal)}, ${esc(rawJson)}, ${esc(nowIso)})
       ON CONFLICT(source_code, source_food_id) DO UPDATE SET
         name_original = excluded.name_original,
         name_english = COALESCE(excluded.name_english, raw_foods.name_english), -- never clobber a real, already-verified English name with a re-ingest that doesn't have one
         latin_name = COALESCE(excluded.latin_name, raw_foods.latin_name),
         langual_codes = COALESCE(excluded.langual_codes, raw_foods.langual_codes),
         category_original = excluded.category_original,
         raw_json = excluded.raw_json,
         ingested_at = excluded.ingested_at;`
    );

    if (r.nutrients) {
      for (const [code, amount] of Object.entries(r.nutrients)) {
        if (amount === null || amount === undefined) continue;
        // source_food_id may be NULL for a source with no native ID --
        // in that case there's no stable key to upsert nutrients
        // against across re-imports, so this subquery intentionally
        // matches on name_original too as a real fallback, not just
        // source_food_id alone.
        statements.push(
          `INSERT INTO raw_food_nutrients (raw_id, nutrient_code, amount_per_100g, unit)
           SELECT raw_id, ${esc(code)}, ${amount}, 'g'
           FROM raw_foods
           WHERE source_code = ${esc(sourceCode)}
             AND ${r.sourceFoodId ? `source_food_id = ${esc(r.sourceFoodId)}` : `source_food_id IS NULL AND name_original = ${esc(r.nameOriginal)}`}
           ON CONFLICT(raw_id, nutrient_code) DO UPDATE SET amount_per_100g = excluded.amount_per_100g;`
        );
      }
    }
  }

  return statements;
}

module.exports = { buildSourceRegistration, buildIngestStatements };
