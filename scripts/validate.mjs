#!/usr/bin/env node
// Conformance gate CLI. Scans tokens/, runs the full validation, prints each
// violation with its token path, and exits non-zero on any failure so the
// build (and CI) can depend on it.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateTokenDir } from './lib/validate-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensDir = join(root, 'tokens');

const { errors } = validateTokenDir(tokensDir);

if (errors.length > 0) {
  console.error(`✖ Token validation failed (${errors.length} violation${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) {
    const where = e.path ? `${e.file ?? '?'} @ ${e.path}` : (e.file ?? '?');
    console.error(`  [${e.rule}] ${where}\n    ${e.message}`);
  }
  console.error('');
  process.exit(1);
}

console.log('✓ Tokens valid.');
