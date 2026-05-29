#!/usr/bin/env node
// Build CLI. Runs the validation gate first (via runBuild) and emits platform
// outputs under dist/ only when tokens conform. On any violation it prints the
// failures and exits non-zero without writing dist/.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runBuild, BuildAborted } from './lib/build-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  await runBuild({ tokensDir: join(root, 'tokens'), distDir: join(root, 'dist') });
  console.log('✓ Build complete → dist/ (css, js, tailwind).');
} catch (err) {
  if (err instanceof BuildAborted) {
    console.error(`✖ ${err.message} Run "npm run validate" for details. dist/ left untouched.`);
    process.exit(1);
  }
  throw err;
}
