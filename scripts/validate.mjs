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
//
// It then runs the atmosphere cost-contract gate over the executable generator
// defaults (source/zoo/effects/atmosphere.mjs), failing on any default weather
// field outside the 6–51 particle envelope, a bloom default other than three,
// weather enabled without opt-in, or a field no contract entry covers.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { validateTokenDir } from './lib/validate-core.mjs';
import { checkKeyframeCoverage, cssEntriesUnder } from './lib/keyframe-coverage.mjs';
import { checkAtmosphereContract, collectAtmosphereInputs } from './lib/atmosphere-contract.mjs';
import { checkAdapterOutputs, tiersFromManifest } from './lib/shadcn-adapter.mjs';

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

// Atmosphere cost contract over the executable generator defaults.
try {
  errors.push(...checkAtmosphereContract(await collectAtmosphereInputs()).errors);
} catch (err) {
  errors.push({
    file: 'design-system/source/zoo/effects/atmosphere.mjs',
    rule: 'atmosphere-cost',
    message: `The atmosphere contract could not be loaded: ${err.message}`,
  });
}

// Shadcn crosswalk gate over what actually shipped under dist/css/shadcn —
// keyed to built output like the keyframe gate, so a stale or hand-edited
// bundle cannot slip past validation. Role references resolve against the
// built manifest of the same dist.
if (existsSync(distCssDir)) {
  const adapterDir = join(distCssDir, 'shadcn');
  const forms = ['adapter.css', 'adapter.scoped.css'];
  if (forms.some((f) => !existsSync(join(adapterDir, f)))) {
    errors.push({
      file: 'design-system/dist/css/shadcn',
      rule: 'shadcn-adapter',
      message:
        'The shadcn crosswalk artifacts are missing; run "npm run build" — ' +
        'the shipped CSS must carry both the root and scoped adapters.',
    });
  } else {
    let tiers;
    const manifestPath = join(root, 'design-system', 'dist', 'manifest', 'tokens.json');
    if (existsSync(manifestPath)) {
      try {
        tiers = tiersFromManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
      } catch {
        // unreadable manifest: parity/confinement still checked below
      }
    }
    errors.push(
      ...checkAdapterOutputs(
        {
          root: readFileSync(join(adapterDir, 'adapter.css'), 'utf8'),
          scoped: readFileSync(join(adapterDir, 'adapter.scoped.css'), 'utf8'),
        },
        { tiers },
      ).map((e) => ({ ...e, file: e.file.startsWith('dist/') ? `design-system/${e.file}` : e.file })),
    );
  }
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
console.log('✓ Atmosphere cost contract enforced.');
