import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The accepted pre-refactor zoo, frozen as the visual/behavioural oracle
// (design-system/change-propagation.md). Its bytes are the reference every
// rebuild is judged against — this pin makes "someone edited the baseline" a
// test failure instead of a silent re-oracle.
const BASELINE = join(root, 'design-system', 'reference', 'accepted-zoo', 'generated');
const BASELINE_SHA256 = '86ae95c3412868887bc5dd2f4aabc2eff438fe5b632234945e8daeccb915103c';

// The correction's frozen inventory. Contract-correction work reconciles what
// exists; it does not add to it. Each list below is the state this correction
// inherited — a failure means something joined the tree that is not motion-
// contract work. Widen a list deliberately (and record why in the change's
// DECISIONS.md) only when a reviewed change genuinely means to grow the system.
const FROZEN = {
  devDependencies: ['ajv', 'ajv-formats', 'style-dictionary', 'vitest'],
  effectModules: [
    'atmosphere.mjs',
    'deterministic-random.mjs',
    'grid.mjs',
    'helpers.mjs',
    'phyllotaxis.mjs',
    'weather-particles.mjs',
  ],
  zooStyleModules: [
    'atmosphere.css',
    'base.css',
    'components.css',
    'material.css',
    'responsive.css',
    'states.css',
    'themes.css',
    'type.css',
    'weather.css',
  ],
  skinIds: [
    'cream', 'lilac', 'sage', 'clay', 'indigo', 'plum',
    'slate', 'moss', 'rose', 'ochre', 'teal', 'wine',
  ],
};

const componentClasses = () => {
  const css = readFileSync(join(root, 'design-system', 'source', 'zoo', 'styles', 'components.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]).sort());
};
// Inherited component vocabulary: the primitives shipped so far (buttons, cards,
// fields, links, marks, pills, segmented control, use-case cells — `mk`/`pdot`
// are the mark/pill descendant glyphs those primitives already carry). A new
// class here is a new component — out of scope for contract-correction work.
const FROZEN_COMPONENT_CLASSES = [
  'btn', 'btn-ink', 'btn-red', 'card', 'card-body', 'card-title', 'field',
  'field-label', 'lbl', 'lnk', 'mark', 'mark-fail', 'mark-pass', 'mark-warn',
  'mk', 'pdot', 'pill', 'pill-ink', 'pill-quiet', 'pill-red', 'seg',
  'seg-cell', 'seg-radio', 'use-cell', 'use-grid', 'use-label', 'use-row',
];

describe('motion-contract scope guard — the correction stays a correction', () => {
  // Spec: showcase / Scenario: Accepted baseline remains the visual oracle;
  // propagation-validation / Scenario: Out-of-scope correction is rejected.
  // Editing or regenerating the baseline would re-oracle the system onto
  // unaudited output — forbidden for this change and for any remediation.
  it('the accepted zoo baseline is byte-for-byte the accepted file', () => {
    const html = readFileSync(join(BASELINE, 'index.html'));
    const sha = createHash('sha256').update(html).digest('hex');
    expect(
      sha,
      'the accepted zoo baseline was edited or regenerated — it is the visual oracle and must never be rewritten; verify against it instead',
    ).toBe(BASELINE_SHA256);
  });

  it('no regenerated snapshot lives beside the accepted baseline', () => {
    expect(readdirSync(BASELINE).sort()).toEqual(['index.html']);
  });

  it('no dependency joined the tree for this correction', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies ?? {}).sort(), 'runtime dependencies appeared').toEqual([]);
    expect(Object.keys(pkg.devDependencies).sort()).toEqual(FROZEN.devDependencies);
  });

  it('the version was not bumped and no release artifact was added', () => {
    expect(readFileSync(join(root, 'design-system', 'VERSION'), 'utf8').trim()).toBe('0.1.1');
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    const released = [...changelog.matchAll(/^## (\d+\.\d+\.\d+) — /gm)].map((m) => m[1]);
    expect(released[0], 'a release entry newer than 0.1.1 appeared').toBe('0.1.1');
    expect(new Set(released)).toEqual(new Set(['0.1.0', '0.1.1']));
  });

  it('no new effect module, style module, or skin was introduced', () => {
    const effects = readdirSync(join(root, 'design-system', 'source', 'zoo', 'effects')).sort();
    expect(effects.filter((f) => f.endsWith('.mjs'))).toEqual(FROZEN.effectModules);
    const styles = readdirSync(join(root, 'design-system', 'source', 'zoo', 'styles')).sort();
    expect(styles.filter((f) => f.endsWith('.css'))).toEqual(FROZEN.zooStyleModules);
    const skins = JSON.parse(readFileSync(join(root, 'design-system', 'source', 'skins', 'skins.json'), 'utf8'));
    expect(skins.map((s) => s.id)).toEqual(FROZEN.skinIds);
  });

  it('no new component class was introduced', () => {
    expect([...componentClasses()]).toEqual(FROZEN_COMPONENT_CLASSES);
  });
});
