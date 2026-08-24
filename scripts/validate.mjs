#!/usr/bin/env node
// Conformance gate CLI. Scans tokens/, runs the full validation, prints each
// violation with its token path, and exits non-zero on any failure so the
// build (and CI) can depend on it.
//
// After the token gates it runs the keyframe-coverage gate over the SHIPPED CSS
// (design-system/dist/css/**), so an animated state or effect without a shipped
// reduced-motion rest pose fails validation. The gate is keyed to built output on
// purpose — a rest frame in a stylesheet the build does not ship must not count —
// so this entry point expects `npm run build` to have run; a missing bundle fails
// loudly rather than skipping silently.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { validateTokenDir } from './lib/validate-core.mjs';
import { checkKeyframeCoverage, cssEntriesUnder } from './lib/keyframe-coverage.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensDir = join(root, 'design-system', 'source', 'values');
const distCssDir = join(root, 'design-system', 'dist', 'css');

const { errors } = validateTokenDir(tokensDir);

// Keyframe coverage over the shipped CSS (see module header for why dist, not source).
if (!existsSync(distCssDir)) {
  errors.push({
    file: 'design-system/dist/css',
    rule: 'keyframe-coverage',
    message:
      'The shipped CSS bundle is missing; run "npm run build" before validating — ' +
      'reduced-motion coverage is checked against what actually ships.',
  });
} else {
  errors.push(...checkKeyframeCoverage(cssEntriesUnder(distCssDir)).errors);
}

if (errors.length > 0) {
  console.error(`✖ Validation failed (${errors.length} violation${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) {
    const where = e.path ? `${e.file ?? '?'} @ ${e.path}` : (e.file ?? '?');
    console.error(`  [${e.rule}] ${where}\n    ${e.message}`);
  }
  console.error('');
  process.exit(1);
}

console.log('✓ Tokens valid.');
console.log('✓ Reduced-motion keyframe coverage complete.');
