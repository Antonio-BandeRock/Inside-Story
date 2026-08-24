// One-off, session-scoped migration script -- 2026-08-24, direct report:
// "there needs to be some sort of continuity between app buttons...
// follow the color of the ground color chosen in the Profile... look
// like buttons, not like pills... have some depth." Applies the new
// shared colors.buttonColor/colors.textOnButton/BUTTON_SHADOW tokens
// (see constants/colors.ts) to the 10 Food builders whose own
// primaryButton/splitButton style blocks were verified byte-identical
// before running this (see the session's own investigation) -- not run
// against any file whose pattern wasn't first confirmed to match.
//
// Not meant to be reusable or kept long-term; disposable once applied
// and verified via tsc/eslint per file.
const fs = require('fs');
const path = require('path');

const FILES = [
  'BakedGoodsBuilder.tsx',
  'BeverageBuilder.tsx',
  'DessertBuilder.tsx',
  'HandheldsBuilder.tsx',
  'SaladBuilder.tsx',
  'SaucesBuilder.tsx',
  'SideBuilder.tsx',
  'SmoothieBuilder.tsx',
  'SnackBuilder.tsx',
  'SoupBuilder.tsx',
];

const PRIMARY_BUTTON_BLOCK_OLD = `primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
  },`;
const PRIMARY_BUTTON_BLOCK_NEW = `primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
    ...BUTTON_SHADOW,
  },`;

const SPLIT_BUTTON_BLOCK_OLD = `splitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },`;
const SPLIT_BUTTON_BLOCK_NEW = `splitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...BUTTON_SHADOW,
  },`;

for (const name of FILES) {
  const filePath = path.join(__dirname, '..', 'components', name);
  let text = fs.readFileSync(filePath, 'utf8');
  const before = text;

  text = text.replace(
    "import { colors, inputBackground } from '../constants/colors';",
    "import { BUTTON_SHADOW, colors, inputBackground } from '../constants/colors';",
  );

  const tabColorCount = (text.match(/\{ backgroundColor: tabColor \}/g) || []).length;
  text = text.split('{ backgroundColor: tabColor }').join('{ backgroundColor: colors.buttonColor }');

  text = text.replace(
    'primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary }',
    'primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton }',
  );

  if (!text.includes(PRIMARY_BUTTON_BLOCK_OLD)) {
    throw new Error(`${name}: primaryButton block not found as expected`);
  }
  text = text.replace(PRIMARY_BUTTON_BLOCK_OLD, PRIMARY_BUTTON_BLOCK_NEW);

  if (!text.includes(SPLIT_BUTTON_BLOCK_OLD)) {
    throw new Error(`${name}: splitButton block not found as expected`);
  }
  text = text.replace(SPLIT_BUTTON_BLOCK_OLD, SPLIT_BUTTON_BLOCK_NEW);

  if (text === before) {
    throw new Error(`${name}: no changes applied -- pattern mismatch`);
  }

  fs.writeFileSync(filePath, text, 'utf8');
  console.log(`${name}: OK, replaced ${tabColorCount} tabColor button backgrounds`);
}
