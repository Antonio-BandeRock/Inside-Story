// Generates a real .sql file (UPDATE ... SET instructions = '<json>' WHERE
// id = '<id>';) from the map backfill_curated_recipe_instructions_extract.js
// produces, with proper SQL single-quote escaping (doubled, the standard
// SQL-string escape), so it can be run through the sqlite3 CLI the same
// way every other direct database change in this project already is:
//   node scripts/backfill_curated_recipe_instructions_extract.js
//   node scripts/backfill_curated_recipe_instructions_generate_sql.js
//   sqlite3 assets/data/foods_reference.db < scripts/backfill_instructions.sql
//
// 2026-08-26 -- see the extract script's own header comment for the full
// bug this fixes. This assumes curated_recipes.instructions already
// exists as a column (`ALTER TABLE curated_recipes ADD COLUMN
// instructions TEXT;`, applied once, directly, before running this).
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'recipe_instructions_by_id.json');
const OUT_SQL = path.join(__dirname, 'backfill_instructions.sql');

const data = require(DATA_PATH);

function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

const lines = [];
for (const [id, instructions] of Object.entries(data)) {
  const json = JSON.stringify(instructions);
  lines.push(`UPDATE curated_recipes SET instructions = '${sqlEscape(json)}' WHERE id = '${sqlEscape(id)}';`);
}

fs.writeFileSync(OUT_SQL, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${lines.length} UPDATE statements to ${OUT_SQL}`);
