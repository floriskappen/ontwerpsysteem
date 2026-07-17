import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runBuild, assembleBundle } from '../scripts/lib/build-core.mjs';
import { tmpDir, fontFaces } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Recursively map every file in a dir to a content hash, keyed by relative path.
function fileHashes(dir) {
  const out = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p)] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return out;
}

describe('consumer bundle (distribution)', () => {
  it('contains the full agent-readable surface', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const rel = join(dist, 'release');

    const required = [
      'AGENTS.md', 'README.md', 'brief.md', 'CHANGELOG.md', 'VERSION',
      'templates/DESIGN.md',
      'values/css/tokens.css', 'values/js/tokens.js', 'values/manifest/tokens.json', 'values/tailwind/theme.css',
      'language/motion.md', 'language/anti-goals.md',
      'recipes/index.json',
      'zoo/index.html', 'zoo/source/index.mjs',
      'fonts/archivo-latin.woff2',
    ];
    const missing = required.filter((f) => !existsSync(join(rel, f)));
    expect(missing, `bundle missing: ${missing.join(', ')}`).toEqual([]);

    // the consumer AGENTS.md is the consumer variant, not the dev one
    expect(readFileSync(join(rel, 'AGENTS.md'), 'utf8')).toContain('consumer bundle');
  });

  it('excludes development machinery', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const rel = join(dist, 'release');

    for (const junk of ['scripts', 'test', 'openspec', 'reference', 'package.json', 'node_modules', 'design-system']) {
      expect(existsSync(join(rel, junk)), `bundle should not contain ${junk}`).toBe(false);
    }
  });

  it('is deterministic — re-assembly from unchanged inputs is byte-identical', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const first = fileHashes(join(dist, 'release'));
    assembleBundle(root, dist); // rewrite the bundle from the same inputs
    const second = fileHashes(join(dist, 'release'));
    expect(second).toEqual(first);
  });
});

// One shared build for the scoped-distribution assertions.
let _rel;
function releaseOnce() {
  if (!_rel) {
    const dist = tmpDir();
    _rel = runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist }).then(
      () => join(dist, 'release'),
    );
  }
  return _rel;
}

describe('scoped css distribution (consumer bundle)', () => {
  // Spec: distribution / Scenarios: Island adoption is import-only; Whole-app
  // adoption needs no scope class. The bundle carries all four CSS targets as
  // importable files; the root file keeps :root so whole-app needs no class.
  it('bundle ships scope-aware css targets', async () => {
    const rel = await releaseOnce();
    const cssDir = join(rel, 'values', 'css');
    for (const f of ['tokens.css', 'tokens.scoped.css', 'components.scoped.css', 'effects.scoped.css']) {
      expect(existsSync(join(cssDir, f)), `values/css/${f} must ship`).toBe(true);
    }
    expect(readFileSync(join(cssDir, 'tokens.css'), 'utf8')).toMatch(/^:root \{/);
    expect(readFileSync(join(cssDir, 'tokens.scoped.css'), 'utf8')).toMatch(/^\.ontwerp \{/);
  });

  // Spec: Scenarios: Boundary neutralises the inherited voice; Consumer re-points
  // the boundary font. Structural: the primitive ships in BOTH token CSS files,
  // re-points the font slots to the consumer slot, and pins the three inherited
  // voice properties.
  it('boundary primitive ships and re-points the voice', async () => {
    const rel = await releaseOnce();
    for (const f of ['tokens.css', 'tokens.scoped.css']) {
      const css = readFileSync(join(rel, 'values', 'css', f), 'utf8');
      const block = css.match(/\.ontwerp-boundary \{([^}]*)\}/)?.[1];
      expect(block, `${f}: .ontwerp-boundary block`).toBeTruthy();
      for (const slot of ['--font-sans', '--font-heading', 'font-family']) {
        expect(block, `${f}: ${slot} re-points to the consumer slot`).toMatch(
          new RegExp(`${slot}: var\\(--ontwerp-boundary-font, [^)]*system-ui`),
        );
      }
      expect(block, `${f}: text-transform pinned`).toContain('text-transform: none');
      expect(block, `${f}: letter-spacing pinned`).toContain('letter-spacing: normal');
    }
  });

  // Spec: distribution / Scenario: Fonts wire up by import alone. Every src url
  // in the shipped fonts.css resolves against its own location into the
  // bundle's fonts/; no other shipped CSS carries (or needs) a @font-face.
  it('fonts wire up by import alone', async () => {
    const rel = await releaseOnce();
    const cssDir = join(rel, 'values', 'css');
    const faces = fontFaces(readFileSync(join(cssDir, 'fonts.css'), 'utf8'));
    expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) {
      expect(face.url, `${face.family}: src must be a relative url`).toMatch(/^\.\.\//);
      const target = join(cssDir, face.url); // resolved against fonts.css's own location
      expect(existsSync(target), `${face.family}: ${face.url} must resolve`).toBe(true);
      expect(target.startsWith(join(rel, 'fonts')), `${face.family}: target must live in the bundle's fonts/`).toBe(true);
    }
    for (const other of ['tokens.css', 'tokens.scoped.css', 'components.scoped.css', 'effects.scoped.css']) {
      expect(readFileSync(join(cssDir, other), 'utf8'), `${other} must not need @font-face`).not.toContain('@font-face');
    }
  });

  // Spec: distribution / Scenario: Every referenced family is shipped. Families
  // come from the built values (manifest fontFamily tokens — the shipped, first
  // family of each stack) AND the design language prose; each must have a
  // binary in fonts/ and a declaration in fonts.css. Caveat has no token — the
  // prose reference is what obliges it to ship, end-to-end.
  it('every referenced family is shipped', async () => {
    const rel = await releaseOnce();
    const manifest = JSON.parse(readFileSync(join(rel, 'values', 'manifest', 'tokens.json'), 'utf8'));
    const referenced = new Set(
      manifest.filter((e) => e.type === 'fontFamily').map((e) => e.value[0]),
    );
    const languageDir = join(rel, 'language');
    const prose = readdirSync(languageDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => readFileSync(join(languageDir, f), 'utf8'))
      .join('\n');
    for (const family of ['Archivo', 'JetBrains Mono', 'Caveat']) {
      if (prose.includes(family)) referenced.add(family);
    }
    expect([...referenced], 'the design language must reference Caveat').toContain('Caveat');
    const cssDir = join(rel, 'values', 'css');
    const declared = new Map(
      fontFaces(readFileSync(join(cssDir, 'fonts.css'), 'utf8')).map((f) => [f.family, f.url]),
    );
    for (const family of referenced) {
      expect(declared.has(family), `${family} must have a @font-face in fonts.css`).toBe(true);
      expect(
        existsSync(join(cssDir, declared.get(family))),
        `${family} must have its binary in the bundle's fonts/`,
      ).toBe(true);
    }
  });

  // Spec: distribution / Scenario: Weight tokens render without synthesis — the
  // bundle-side mirror of Gate A: every fontWeight token in the shipped manifest
  // sits inside the token-bound face's declared range in the shipped fonts.css.
  it('weight tokens render without synthesis', async () => {
    const rel = await releaseOnce();
    const manifest = JSON.parse(readFileSync(join(rel, 'values', 'manifest', 'tokens.json'), 'utf8'));
    const weights = manifest.filter((e) => e.type === 'fontWeight' && typeof e.value === 'number');
    expect(weights.length).toBeGreaterThan(0);
    const bound = JSON.parse(readFileSync(join(rel, 'fonts', 'faces.json'), 'utf8')).faces.find(
      (f) => f.tokenBound,
    );
    expect(bound, 'the shipped faces.json must mark the token-bound face').toBeTruthy();
    const face = fontFaces(readFileSync(join(rel, 'values', 'css', 'fonts.css'), 'utf8')).find(
      (f) => f.family === bound.family,
    );
    expect(face, `${bound.family} must be declared in the shipped fonts.css`).toBeTruthy();
    const [min, max = min] = face.weight.split(/\s+/).map(Number);
    for (const w of weights) {
      expect(
        w.value >= min && w.value <= max,
        `${w.path} = ${w.value} must sit inside the shipped ${bound.family} range ${min}–${max}`,
      ).toBe(true);
    }
  });

  // Spec: Scenarios: Skin override survives same-selector deduplication; The slot
  // is documented. Dedupe safety is a property of the selector SHAPE: the slot's
  // selector differs from the base token block's, so a bundler that merges
  // same-selector custom-property rules cannot fold the override into the base.
  it('skin slot is documented and dedupe-safe by shape', async () => {
    const rel = await releaseOnce();
    const docs = readFileSync(join(rel, 'AGENTS.md'), 'utf8') + readFileSync(join(rel, 'README.md'), 'utf8');
    expect(docs).toContain('.ontwerp[data-skin=');
    expect(docs).toMatch(/not a supported override/);
    const baseSelector = readFileSync(join(rel, 'values', 'css', 'tokens.scoped.css'), 'utf8').match(/^([^{]+)\{/)[1].trim();
    expect(baseSelector).toBe('.ontwerp');
    expect('.ontwerp[data-skin="name"]').not.toBe(baseSelector);
  });
});
