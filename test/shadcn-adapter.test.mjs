import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import {
  REQUIRED_SHADCN_VARS,
  lintAdapterSource,
  renderAdapterVariants,
  checkAdapterOutputs,
  AdapterGateError,
} from '../scripts/lib/shadcn-adapter.mjs';
import { tmpDir, customProps, computeVar, cssRules, releaseBundleOnce } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realValues = join(root, 'design-system', 'source', 'values');
const canonicalPath = join(realValues, 'shadcn', 'adapter.css');

const releaseOnce = releaseBundleOnce(realValues);

function shipped(rel) {
  return {
    root: readFileSync(join(rel, 'values', 'shadcn', 'adapter.css'), 'utf8'),
    scoped: readFileSync(join(rel, 'values', 'shadcn', 'adapter.scoped.css'), 'utf8'),
    tokens: readFileSync(join(rel, 'values', 'css', 'tokens.css'), 'utf8'),
    tokensScoped: readFileSync(join(rel, 'values', 'css', 'tokens.scoped.css'), 'utf8'),
  };
}

function tierMap(rel) {
  const entries = JSON.parse(readFileSync(join(rel, 'values', 'manifest', 'tokens.json'), 'utf8'));
  return new Map(entries.map((e) => [`--${e.name}`, e.tier]));
}

// One shared build for every read-only assertion.
let bundle;
const once = async () => (bundle ??= { rel: await releaseOnce(), files: undefined });

describe('shadcn adapter — build emits both forms into the bundle', () => {
  // build-pipeline / Scenario: Adapter outputs are present after a build;
  // distribution: assembled under values/shadcn/ in both forms.
  it('ships adapter.css and adapter.scoped.css under values/shadcn/', async () => {
    const { rel } = await once();
    if (!bundle.files) bundle.files = shipped(rel);
    for (const f of ['adapter.css', 'adapter.scoped.css']) {
      expect(existsSync(join(rel, 'values', 'shadcn', f)), `values/shadcn/${f}`).toBe(true);
    }
    // importable CSS artifacts: a comment banner followed by a style rule
    expect(bundle.files.root.trim()).toMatch(/^(\/\*[\s\S]*?\*\/\s*)?:root \{/);
    expect(bundle.files.scoped.trim()).toMatch(/^(\/\*[\s\S]*?\*\/\s*)?:?\.?[A-Za-z][^{]*\{/);
  });
});

describe('shadcn adapter — whole-app consumption (:root form)', () => {
  // distribution / Scenario: Whole-app consumer imports the adapter.
  it('resolves shadcn variables through the ontwerp roles at the document root', async () => {
    await once();
    const { root: adapterRoot, tokens } = bundle.files;
    const tokenProps = customProps(tokens);
    const adapterProps = customProps(adapterRoot);

    for (const v of REQUIRED_SHADCN_VARS) {
      expect(adapterProps.has(v), `${v} declared`).toBe(true);
      expect(adapterProps.get(v), `${v} maps onto an ontwerp role`).toMatch(/^var\(--color-|^var\(--radius-/);
    }

    // every crosswalk entry resolves to its documented role — the complete
    // mapping, not a sample, so no pair can drift while the suite stays green
    const expected = {
      '--background': '--color-surface-page',
      '--foreground': '--color-text-default',
      '--card': '--color-surface-claim',
      '--card-foreground': '--color-text-default',
      '--popover': '--color-surface-warm',
      '--popover-foreground': '--color-text-default',
      '--primary': '--color-surface-ink',
      '--primary-foreground': '--color-text-on-ink',
      '--secondary': '--color-surface-deep',
      '--secondary-foreground': '--color-text-default',
      '--muted': '--color-surface-disabled',
      '--muted-foreground': '--color-text-muted',
      '--accent': '--color-accent-soft',
      '--accent-foreground': '--color-text-default',
      '--destructive': '--color-destructive-base',
      '--destructive-foreground': '--color-text-on-ink',
      '--border': '--color-border-default',
      '--input': '--color-border-default',
      '--ring': '--color-focus-ring',
    };
    const resolve = (name) => computeVar(name, tokenProps, adapterProps);
    for (const [shadcn, role] of Object.entries(expected)) {
      expect(resolve(shadcn), `${shadcn} resolves through ${role}`).toBe(resolve(role));
    }
    // focus ring through color.focus-ring and destructive through
    // color.destructive.base are pinned above (the scenario names both);
    // radius preserves the square-corner contract
    expect(resolve('--radius')).toBe('0px');
  });

  it('declares everything on :root and nothing else', async () => {
    await once();
    const { rules } = cssRules(bundle.files.root);
    expect(rules.map((r) => r.selectors)).toEqual([[':root']]);
  });
});

describe('shadcn adapter — island consumption (.ontwerp-scoped form)', () => {
  // distribution / Scenario: Island consumer imports the adapter.
  it('resolves the same variables inside the scope and establishes none outside it', async () => {
    await once();
    const { root: adapterRoot, scoped, tokens, tokensScoped } = bundle.files;

    // confined to the island: every rule sits on the scope class…
    const { rules } = cssRules(scoped);
    expect(rules.length).toBeGreaterThanOrEqual(1);
    for (const rule of rules) {
      expect(rule.selectors, 'every selector is the scope class').toEqual(['.ontwerp']);
    }
    // …and no :root declaration exists anywhere outside comments, so the
    // adapter cannot establish these variables document-wide.
    expect(scoped.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain(':root');

    // same values as the whole-app form once the scoped tokens are in play
    const outer = customProps(tokens);
    const inner = customProps(tokensScoped);
    const a = computeVar('--ring', outer, customProps(adapterRoot));
    const b = computeVar('--ring', inner, customProps(scoped));
    expect(b).toBe(a);
    expect(b).toBe(computeVar('--color-focus-ring', inner));
  });
});

describe('shadcn adapter — output parity', () => {
  // build-pipeline / Scenario: Root and scoped adapters cannot drift.
  it('differs only in the enclosing selector', async () => {
    await once();
    const { root: adapterRoot, scoped } = bundle.files;

    // identical custom-property names AND values
    const a = customProps(adapterRoot);
    const b = customProps(scoped);
    expect([...b.keys()].sort()).toEqual([...a.keys()].sort());
    for (const [name, value] of a) expect(b.get(name), name).toBe(value);

    // byte-level: swapping the selector makes the files identical
    expect(scoped.replace('.ontwerp {', ':root {')).toBe(adapterRoot);

    // and the gate agrees on a clean pair
    expect(checkAdapterOutputs({ root: adapterRoot, scoped })).toEqual([]);
  });
});

describe('shadcn adapter — values-only boundary', () => {
  // distribution / Requirement: Shadcn adapter is values-only; Scenario:
  // Adapter stays a thin crosswalk; build-pipeline / Dependency-free values build.
  it('ships declarations and comments only — no components, scripts, loaders, or metadata', async () => {
    await once();
    const { root: adapterRoot, scoped } = bundle.files;
    for (const [label, css] of [['adapter.css', adapterRoot], ['adapter.scoped.css', scoped]]) {
      expect(css, `${label}: no markup`).not.toMatch(/<\s*\/?\s*[a-zA-Z]/);
      expect(css, `${label}: no assets`).not.toMatch(/\burl\s*\(/i);
      expect(css, `${label}: no runtime import`).not.toMatch(/\b(?:import|require)\s*\(/);
      expect(css, `${label}: no script URIs`).not.toContain('javascript:');
      const { rules, keyframes } = cssRules(css);
      const allowed = label === 'adapter.css' ? ':root' : '.ontwerp';
      expect(rules.map((r) => r.selectors), `${label}: only its own selector`).toEqual([[allowed]]);
      expect(keyframes, `${label}: no keyframes`).toEqual([]);
    }
    // and the build grew no runtime dependency to produce them
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.dependencies).toBeUndefined();
  });
});

describe('shadcn adapter — mapping decisions travel with the crosswalk', () => {
  // distribution / Requirement: Adapter mapping decisions are documented;
  // Scenario: Consumer can identify non-obvious mappings.
  it('documents muted, ring, destructive, and radius next to the mappings', async () => {
    await once();
    const canonical = readFileSync(canonicalPath, 'utf8');
    for (const [label, css] of [['canonical source', canonical], ['shipped root form', bundle.files.root]]) {
      expect(css, `${label}: muted uses the quiet roles`).toMatch(/muted[^*]*quiet roles/is);
      expect(css, `${label}: ring uses the dedicated focus-ring role, not the accent`).toMatch(
        /focus-ring role[^*]*NOT the accent|NOT the accent by convention/is,
      );
      expect(css, `${label}: destructive keeps its own pigment`).toMatch(/own pigment/is);
      expect(css, `${label}: radius stays square`).toMatch(/square corners/is);
    }
    // the documentation must not imply shadcn component implementations ship here
    expect(canonical).toMatch(/VALUES ONLY/i);
    expect(canonical).toMatch(/no component CSS/i);
  });
});

describe('shadcn adapter — determinism', () => {
  // build-pipeline: generated outputs SHALL be deterministic.
  it('re-renders byte-identical outputs from the unchanged source', () => {
    const source = readFileSync(canonicalPath, 'utf8');
    const first = renderAdapterVariants(source);
    const second = renderAdapterVariants(source);
    expect(second.root).toBe(first.root);
    expect(second.scoped).toBe(first.scoped);
  });

  it('rebuilds byte-identical adapter artifacts', async () => {
    const distA = tmpDir();
    const distB = tmpDir();
    await runBuild({ tokensDir: realValues, distDir: distA });
    await runBuild({ tokensDir: realValues, distDir: distB });
    for (const f of ['adapter.css', 'adapter.scoped.css']) {
      expect(readFileSync(join(distA, 'css', 'shadcn', f)).equals(readFileSync(join(distB, 'css', 'shadcn', f))), f).toBe(true);
    }
  });
});

describe('shadcn adapter — the gate fails loudly on an incomplete mapping', () => {
  // build-pipeline / Scenario: Missing role mapping fails the gate.
  it('halts the build naming the unresolved role', async () => {
    const source = readFileSync(canonicalPath, 'utf8').replace(
      ':root {',
      ':root {\n  --chart-1: var(--color-no-such-role);',
    );
    const brokenPath = join(tmpDir(), 'adapter.css');
    writeFileSync(brokenPath, source);
    const dist = tmpDir();
    const err = await runBuild({ tokensDir: realValues, distDir: dist, adapterSourcePath: brokenPath }).then(
      () => null,
      (e) => e,
    );
    expect(err, 'the build must reject').toBeTruthy();
    expect(err).toBeInstanceOf(AdapterGateError);
    expect(err.message).toMatch(/Shadcn adapter gate failed/);
    expect(JSON.stringify(err.errors)).toContain('--color-no-such-role');
    // and nothing was assembled from the broken crosswalk
    expect(existsSync(join(dist, 'release'))).toBe(false);
  });

  it('halts the build naming the missing required variable', async () => {
    const source = readFileSync(canonicalPath, 'utf8').replace(/\n\s*--ring: var\(--color-focus-ring\);\n/, '\n');
    const brokenPath = join(tmpDir(), 'adapter.css');
    writeFileSync(brokenPath, source);
    const err = await runBuild({
      tokensDir: realValues,
      distDir: tmpDir(),
      adapterSourcePath: brokenPath,
    }).then(
      () => null,
      (e) => e,
    );
    expect(err).toBeInstanceOf(AdapterGateError);
    expect(JSON.stringify(err.errors)).toContain('"--ring"');
  });
});

describe('shadcn adapter — unit gates', () => {
  const tiers = new Map([
    ['--color-surface-page', 'semantic'],
    ['--color-paper', 'primitive'],
    ['--button-border-default', 'component'],
  ]);
  const okBody = (extra = '') =>
    `:root {\n${REQUIRED_SHADCN_VARS.map((v) => `  ${v}: var(--color-surface-page);`).join('\n')}\n${extra}}`;

  it('rejects non-semantic role references, naming each', () => {
    const primitiveRef = lintAdapterSource(okBody('  --x: var(--color-paper);\n'), { tiers });
    expect(primitiveRef.some((e) => e.rule === 'role-resolution' && e.message.includes('--color-paper'))).toBe(true);
    const unknownRef = lintAdapterSource(okBody('  --y: var(--color-gone);\n'), { tiers });
    expect(unknownRef.some((e) => e.rule === 'role-resolution' && e.message.includes('--color-gone'))).toBe(true);
    const clean = lintAdapterSource(okBody(), { tiers });
    expect(clean).toEqual([]);
  });

  it('names every missing required variable', () => {
    const body = `:root {\n  --background: var(--color-surface-page);\n}`;
    const errors = lintAdapterSource(body, { tiers });
    const missing = errors.filter((e) => e.rule === 'required-variable').map((e) => e.path);
    expect(missing).toContain('--ring');
    expect(missing).toContain('--muted-foreground');
    expect(missing).toContain('--radius');
    expect(missing).not.toContain('--background');
  });

  it('rejects component selectors, extra rules, at-rules, markup, and loaders', () => {
    const cases = [
      // a component rule as the whole source → its selector is not :root
      ['.btn { color: red; }', 'selector-confinement'],
      // a second rule appended after the crosswalk → one rule only
      [`${okBody()}\n.btn { color: red; }`, 'structure'],
      ['@media screen { :root { --background: var(--color-surface-page); } }', 'structure'],
      ['<script>alert(1)</script>', 'markup'],
      ['<div class="card">x</div>', 'markup'],
      [':root { --background: url(evil.js); }', 'runtime-loader'],
      ['{ "name": "fake-pkg", "dependencies": {} }', 'package-metadata'],
    ];
    for (const [src, rule] of cases) {
      const errors = lintAdapterSource(src, { tiers });
      expect(errors.some((e) => e.rule === rule), `${JSON.stringify(src.slice(0, 30))} → ${rule}`).toBe(true);
    }
  });

  it('flags drift between the emitted forms, naming the property', () => {
    const good = renderAdapterVariants(okBody());
    const drifted = { ...good, scoped: good.scoped.replace('var(--color-surface-page)', 'red') };
    const errors = checkAdapterOutputs(drifted);
    expect(errors.some((e) => e.rule === 'parity' && e.path === '--background')).toBe(true);

    const halfMissing = { ...good, scoped: good.scoped.replace('--ring: var(--color-surface-page);', '') };
    expect(checkAdapterOutputs(halfMissing).some((e) => e.rule === 'parity' && e.path === '--ring')).toBe(true);

    const escaped = { ...good, scoped: good.scoped.replace('.ontwerp {', ':root {') };
    expect(checkAdapterOutputs(escaped).some((e) => e.rule === 'selector-confinement')).toBe(true);
  });

  it('accepts the canonical source against the real built manifest', async () => {
    const { rel } = await once();
    const errors = lintAdapterSource(readFileSync(canonicalPath, 'utf8'), { tiers: tierMap(rel) });
    expect(errors).toEqual([]);
  });
});
