-- Inside Story -- Unified Whole-Foods Database, Phase 1 schema.
--
-- WHAT THIS IS: a real, new, separate SQLite database -- entirely isolated
-- from assets/data/foods_reference.db and from the live app. Nothing in
-- lib/db.ts or any app screen reads from this file. It exists to become
-- the richer, more rigorous "master" this project always meant to have --
-- built from RAW source data (not the app's already-filtered/curated
-- subset), classified fresh against a real, explicit whole-food rule,
-- matched across sources wherever the same real food/species can be
-- confirmed regardless of language, and only THEN merged with everything
-- the current app database already carries (scores, aliases, interaction
-- rules, etc.) to become a real, verified, drop-in replacement.
--
-- The eventual swap into the live app is a separate, later, explicitly
-- verified step (see this directory's own README.md for the full plan) --
-- this schema and the pipeline built on it are safe to run, re-run, and
-- iterate on indefinitely with zero risk to the working app, because
-- nothing here is wired to it yet.
--
-- DESIGN PRINCIPLE: raw data is never discarded on the way in. Every
-- source's own original record is preserved verbatim (raw_foods.raw_json)
-- even after normalization -- if a future need surfaces for a field this
-- schema didn't think to break out into its own column, it's still
-- sitting there, recoverable, not lost the way the original 2026 filter
-- pass silently dropped anything it didn't keep.

PRAGMA foreign_keys = ON;

-- One row per real, named data source (the 9 already in use, plus
-- whatever a future session adds). This is the actual place "ready to
-- import new source data... in a very easy way" starts: registering a
-- new source here, then writing one small adapter under sources/ (see
-- that directory's own README.md for the required interface), is the
-- whole cost of adding source #10 -- everything downstream (classify,
-- match, review, merge) already works unchanged.
CREATE TABLE sources (
  source_code        TEXT PRIMARY KEY,   -- e.g. 'USDA', 'Norway_Matvaretabellen' -- matches this app's own existing source-code convention exactly, so a merge with the live app database's data can key off the same real value
  display_name        TEXT NOT NULL,      -- e.g. 'USDA FoodData Central (SR Legacy)'
  country_or_region   TEXT,               -- e.g. 'United States'
  language             TEXT NOT NULL,      -- real ISO-ish code: 'en', 'no', 'sv', 'fr', 'de', 'ja'
  home_url             TEXT,               -- the real, citable source URL
  license_or_terms     TEXT,               -- e.g. 'CC-BY 4.0', 'Public Domain', 'USDA open data'
  raw_format            TEXT,               -- e.g. 'xlsx', 'zip-csv', 'json-api'
  last_ingested_at      TEXT,               -- ISO timestamp of the most recent successful raw ingest run
  notes                 TEXT
);

-- The raw, minimally-transformed ingest layer -- "fully encompassing"
-- means everything a source ever offered lands here, before any
-- whole-food filtering or cross-source matching happens. This is
-- intentionally a wider net than the current app database's own foods
-- table: nothing gets excluded at ingest time. Exclusion only happens
-- later, explicitly, via whole_food_classifications, so the reasoning
-- for every real exclusion decision stays visible and auditable rather
-- than silently baked into what never got imported in the first place.
CREATE TABLE raw_foods (
  raw_id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source_code          TEXT NOT NULL REFERENCES sources(source_code),
  source_food_id        TEXT,               -- the source's own native ID for this food, if it has one (USDA's fdc_id, Norway's real food number, etc.) -- NULL is fine for a source with no stable native ID
  name_original          TEXT NOT NULL,      -- verbatim, exactly as the source wrote it, original language untouched
  name_english            TEXT,               -- a real English name, from either a source-verified provenance or real machine translation -- see name_english_source; NULL means genuinely not yet available at all
  name_english_source     TEXT,               -- 'source_verified' (the source's own real, documented English data -- e.g. Norway's own /en/ API) | 'machine_translated' (real, automated translation -- see pipeline/translate.js -- a genuine first pass, not a human-verified fact, and never presented as equivalent to source_verified) | NULL when name_english itself is NULL
  latin_name              TEXT,               -- scientific/species name, when the source provides one -- the strongest real cross-language matching signal available
  langual_codes           TEXT,               -- JSON array of LanguaL codes, when the source provides them (e.g. '["N0001","G0003","A0152"]')
  category_original        TEXT,               -- the source's own raw category/group label, completely untouched -- normalization into this project's own category scheme happens later, downstream, never here
  raw_json                  TEXT NOT NULL,      -- the FULL original raw record from the source, preserved as JSON -- the real safety net: even a field this schema didn't anticipate is still recoverable from here
  ingested_at                TEXT NOT NULL,      -- ISO timestamp of this specific row's own ingest
  UNIQUE (source_code, source_food_id)
);

CREATE INDEX idx_raw_foods_source ON raw_foods(source_code);
CREATE INDEX idx_raw_foods_name_original ON raw_foods(name_original);
CREATE INDEX idx_raw_foods_name_english ON raw_foods(name_english);
CREATE INDEX idx_raw_foods_latin_name ON raw_foods(latin_name);
CREATE INDEX idx_raw_foods_category_original ON raw_foods(category_original);

-- Structured nutrient values per raw food, mapped onto this app's own
-- already-established nutrient_code vocabulary (the same codes already
-- used throughout assets/data/foods_reference.db's own nutrients table --
-- protein, fiber_total, vitamin_d, etc.) during the normalize step, so a
-- later merge with the live app's data needs no second mapping pass.
-- Kept separate from raw_foods itself (mirroring the app's own proven
-- foods/food_nutrients split) rather than folded into raw_json alone,
-- since real classification and matching logic both need to query
-- specific nutrient values directly (e.g. "does this row have a real
-- measured protein value," the same kind of check already used to gate
-- this app's own CKD/Type 1 Diabetes sub-criteria).
CREATE TABLE raw_food_nutrients (
  raw_id            INTEGER NOT NULL REFERENCES raw_foods(raw_id),
  nutrient_code      TEXT NOT NULL,
  amount_per_100g     REAL,
  unit                 TEXT,
  PRIMARY KEY (raw_id, nutrient_code)
);

CREATE INDEX idx_raw_food_nutrients_code ON raw_food_nutrients(nutrient_code);

-- The real, rule-driven (then human-reviewed) whole-food determination.
-- One row per raw_foods row, created by the classify step and confirmed
-- or corrected by a real person via the audit tool -- never auto-applied
-- blind at scale, the same "tool proposes, human decides" discipline
-- already proven on this app's own existing Reference Database Audit
-- tool across 10,000+ real decisions.
CREATE TABLE whole_food_classifications (
  raw_id            INTEGER PRIMARY KEY REFERENCES raw_foods(raw_id),
  is_whole_food      INTEGER,               -- 0, 1, or NULL (NULL = not yet classified at all)
  rule_matched        TEXT,                   -- which real, named rule decided it -- see pipeline/classify.js's own RULES list for the authoritative definitions
  auto_confidence      TEXT,                   -- 'high' | 'medium' | 'low' -- how confident the first, automated pass was; 'low' always forces reviewed=0 until a person looks at it
  reviewed              INTEGER NOT NULL DEFAULT 0,  -- 0 = automated pass only, 1 = a real person has confirmed or corrected this via the audit tool
  reviewer_note         TEXT,
  classified_at          TEXT
);

-- The real cross-source "this is the same real food" linkage -- the
-- actual payoff of doing species/name matching properly. Once a food's
-- rows are grouped here, the eventual app-facing export can answer "show
-- me every source's own measurement of this exact food" with a single,
-- structural lookup -- no runtime fuzzy matching ever needed again.
CREATE TABLE food_match_groups (
  match_group_id             INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_english_name       TEXT NOT NULL,   -- the real, agreed English name representing this whole matched group
  canonical_latin_name          TEXT,             -- species name, when known, shared by every real member
  is_region_specific             INTEGER NOT NULL DEFAULT 0,  -- a real, DERIVED fact (see pipeline/match.js) -- 1 once matching has genuinely completed and this group still has exactly one real member, meaning no equivalent was found anywhere else, not a guess made up front
  created_at                     TEXT
);

CREATE TABLE food_match_members (
  match_group_id     INTEGER NOT NULL REFERENCES food_match_groups(match_group_id),
  raw_id                INTEGER NOT NULL REFERENCES raw_foods(raw_id),
  match_method          TEXT NOT NULL,   -- 'latin_name' | 'langual_code' | 'canonical_name' | 'unmatched_standalone' (no automated match found -- a real, single-member group, awaiting a person's confirmation that it's genuinely region-specific) | 'manual' (a real person linked this by hand, not the automated cascade) -- the strongest real signal that actually produced this link, in the same priority order the matching cascade runs in
  match_confidence      TEXT NOT NULL,   -- 'proposed' (the tool suggested it, awaiting a real person's confirmation) | 'confirmed' (a real person has confirmed it, or it's an exact species/code match strong enough to auto-confirm -- see pipeline/match.js for exactly which cases qualify)
  PRIMARY KEY (match_group_id, raw_id)
);

CREATE INDEX idx_food_match_members_raw_id ON food_match_members(raw_id);
