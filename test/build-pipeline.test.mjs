import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, existsSync, readFileSync, cpSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { runBuild, BuildAborted } from '../scripts/lib/build-core.mjs';
import { tmpDir, treesEqual, customProps, computeVar, cssRules, animationRefs, fontFaces } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realTokens = join(root, 'design-system', 'source', 'values');
const zooStyles = join(root, 'design-system', 'source', 'zoo', 'styles');

// The Tailwind theme's name for a manifest entry: the `ontwerp` segment spliced
// in after the first path segment (the documented Tailwind namespace rule).
const twName = (e) => {
  const first = e.path.split('.')[0];
  return e.name === first ? `${first}-ontwerp` : `${first}-ontwerp-${e.name.slice(first.length + 1)}`;
};

// One shared build of the real tokens for the alias-preservation assertions.
let _built;
function builtOnce() {
  if (!_built) {
    const dist = tmpDir();
    _built = runBuild({ tokensDir: realTokens, distDir: dist }).then(() => ({
      dist,
      fontsCss: readFileSync(join(dist, 'css', 'fonts.css'), 'utf8'),
      zooHtml: readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'),
      css: readFileSync(join(dist, 'css', 'tokens.css'), 'utf8'),
      scoped: readFileSync(join(dist, 'css', 'tokens.scoped.css'), 'utf8'),
      componentsScoped: readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8'),
      effectsScoped: readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8'),
      theme: readFileSync(join(dist, 'tailwind', 'theme.css'), 'utf8'),
      js: readFileSync(join(dist, 'js', 'tokens.js'), 'utf8'),
      manifest: JSON.parse(readFileSync(join(dist, 'manifest', 'tokens.json'), 'utf8')),
    }));
  }
  return _built;
}

describe('build-pipeline', () => {
  it('Build runs only on valid tokens (aborts, writes nothing)', async () => {
    const tokensDir = tmpDir();
    const distDir = join(tmpDir(), 'dist'); // does not exist yet
    mkdirSync(join(tokensDir, 'primitive'), { recursive: true });
    // Invalid: no resolvable $type.
    writeFileSync(
      join(tokensDir, 'primitive', 'color.tokens.json'),
      JSON.stringify({ color: { brand: { base: { $value: '#fff' } } } }),
    );

    await expect(runBuild({ tokensDir, distDir })).rejects.toBeInstanceOf(BuildAborted);
    expect(existsSync(distDir)).toBe(false);
  });

  it('Deterministic output (two builds are byte-identical)', async () => {
    const a = tmpDir();
    const b = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: a });
    await runBuild({ tokensDir: realTokens, distDir: b });
    expect(treesEqual(a, b)).toBe(true);
  });

  // Spec scenario "Stable name derivation" names color.text.muted; the real token
  // set has no such token, so the same rule is asserted on color.text.default —
  // CSS keeps the kebab path, the Tailwind theme splices in the `ontwerp` segment
  // after the first path segment (color.text.muted → --color-ontwerp-text-muted).
  it('Stable name derivation (color.text.default → --color-text-default / --color-ontwerp-text-default)', async () => {
    const { css, theme, manifest } = await builtOnce();
    expect(css).toMatch(/--color-text-default:/);
    expect(theme).toMatch(/--color-ontwerp-text-default:/);
    // the rule itself, on the spec's example path shape
    expect(twName({ path: 'color.text.muted', name: 'color-text-muted' })).toBe('color-ontwerp-text-muted');
    // and it holds for every token in the manifest
    for (const e of manifest) expect(theme, `theme.css: --${twName(e)}`).toContain(`--${twName(e)}:`);
  });

  it('Emits all three platform artifacts', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: dist });
    expect(existsSync(join(dist, 'css', 'tokens.css'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'tokens.js'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'tokens.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'tailwind', 'theme.css'))).toBe(true);
  });

  // Spec: "Aliased token emits a var() reference" + "Tailwind theme preserves aliases".
  it('css aliased token emits var() reference', async () => {
    const { css, theme, manifest } = await builtOnce();
    const byPath = new Map(manifest.map((e) => [e.path, e]));
    const aliased = manifest.filter((e) => e.type === 'color' && e.ref);
    expect(aliased.length).toBeGreaterThan(0);
    for (const e of aliased) {
      const target = byPath.get(e.ref);
      expect(target, `${e.path} references ${e.ref}, which must exist`).toBeDefined();
      // Per-file derived names: the Tailwind theme carries the `ontwerp` segment,
      // and its alias var() refs must point at the NAMESPACED target names so
      // every reference still resolves within the artifact.
      for (const [label, file, nameOf] of [
        ['tokens.css', css, (t) => t.name],
        ['theme.css', theme, twName],
      ]) {
        // the alias is kept live as a var() to the target's derived name…
        expect(file, `${label}: --${nameOf(e)}`).toContain(`--${nameOf(e)}: var(--${nameOf(target)})`);
        // …and the reference resolves within the same file
        expect(file, `${label}: target --${nameOf(target)}`).toMatch(new RegExp(`--${nameOf(target)}: `));
      }
    }
    // the full chain from the spec scenario is followable inside the file
    expect(css).toContain('--button-border-default: var(--color-border-strong)');
    expect(css).toContain('--color-border-strong: var(--color-ink-a95)');
  });

  // Spec: "Raw values emit literals". Scoped to the primitive tier per the
  // change tasks: composite tokens (typography shorthands) may legitimately
  // carry var() for refs *embedded inside* their raw composite value; a
  // primitive's source holds nothing but the raw value.
  it('css raw-valued token emits literal', async () => {
    const { css, theme, manifest } = await builtOnce();
    const raw = manifest.filter((e) => !e.ref && e.tier === 'primitive');
    expect(raw.length).toBeGreaterThan(0);
    for (const e of raw) {
      for (const [label, file, nameOf] of [
        ['tokens.css', css, (t) => t.name],
        ['theme.css', theme, twName],
      ]) {
        const m = file.match(new RegExp(`--${nameOf(e)}: ([^;]*);`));
        expect(m, `${label}: --${nameOf(e)} must be declared`).toBeTruthy();
        expect(m[1], `${label}: --${nameOf(e)} must be a literal`).not.toContain('var(');
      }
    }
  });

  // Spec: "Overriding a role cascades through the chain". Limitation: this is
  // not a browser-driven check — computeVar() hand-rolls var() substitution over
  // the parsed declarations (see helpers.mjs), which mirrors how custom
  // properties declared on the same scope root (:root) compute in a browser.
  it('role override re-links the chain', async () => {
    const { css } = await builtOnce();
    const base = customProps(css);
    // baseline: the chain bottoms out at the primitive literal
    expect(computeVar('--button-border-default', base)).toBe('rgba(31, 27, 22, 0.95)');
    // a later :root rule overriding the semantic role re-links the component var
    const override = customProps(':root { --color-border-strong: #123456; }');
    expect(computeVar('--button-border-default', base, override)).toBe('#123456');
  });

  // Spec: "Resolved-data outputs stay literal".
  it('esm output stays fully resolved', async () => {
    const { js } = await builtOnce();
    expect(js).not.toContain('var(--');
  });

  // Spec: build-pipeline / Scenario: Fonts CSS is emitted. One @font-face per
  // face in the canonical assets/fonts/faces.json, with relative src urls that
  // resolve to existing binaries next to the bundle's shipped fonts/.
  it('fonts.css emitted', async () => {
    const { dist, fontsCss } = await builtOnce();
    const canonical = JSON.parse(readFileSync(join(root, 'assets', 'fonts', 'faces.json'), 'utf8')).faces;
    const declared = fontFaces(fontsCss);
    expect(declared.length).toBe(canonical.length);
    // the release assembly places it next to the shipped fonts/
    const releaseCssDir = join(dist, 'release', 'values', 'css');
    expect(existsSync(join(releaseCssDir, 'fonts.css'))).toBe(true);
    for (const face of declared) {
      expect(face.url, `src of ${face.family} must be relative`).toMatch(/^\.\.\/\.\.\/fonts\//);
      expect(
        existsSync(join(releaseCssDir, face.url)),
        `${face.url} must resolve to a shipped binary from values/css/`,
      ).toBe(true);
    }
  });

  // Spec: build-pipeline / Scenario: Showcase and fonts CSS share one face
  // definition. Both outputs are parsed back and must declare identical family
  // names, weight ranges, and styles — and match faces.json, their one source.
  it('zoo and fonts.css share one face definition', async () => {
    const { fontsCss, zooHtml } = await builtOnce();
    const shape = (faces) => faces.map(({ family, style, weight }) => ({ family, style, weight }));
    const inlined = shape(fontFaces(zooHtml));
    expect(inlined.length).toBeGreaterThan(0);
    expect(inlined).toEqual(shape(fontFaces(fontsCss)));
    const canonical = JSON.parse(readFileSync(join(root, 'assets', 'fonts', 'faces.json'), 'utf8')).faces;
    expect(inlined).toEqual(
      canonical.map((f) => ({
        family: f.family,
        style: f.style,
        weight: f.weight.min === f.weight.max ? `${f.weight.min}` : `${f.weight.min} ${f.weight.max}`,
      })),
    );
  });
});

describe('scoped css distribution (build outputs)', () => {
  // Spec: build-pipeline / Scenario: Scoped token CSS is emitted.
  it('scoped token css is emitted', async () => {
    const { scoped, manifest } = await builtOnce();
    expect(scoped).toMatch(/^\.ontwerp \{/);
    for (const e of manifest) {
      expect(scoped, `tokens.scoped.css: --${e.name}`).toContain(`--${e.name}:`);
    }
  });

  // Spec: Scenario: Scope class is a build parameter (.ontwerp default is
  // asserted by the shared build above).
  it('scope class is a build parameter', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: dist, scopeClass: '.acme' });
    const scoped = readFileSync(join(dist, 'css', 'tokens.scoped.css'), 'utf8');
    expect(scoped).toMatch(/^\.acme \{/);
    expect(scoped).toContain('.acme-boundary {');
    expect(readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8')).toContain('.acme .btn');
    expect(readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8')).toContain('.acme .wxc');
  });

  // Spec: Scenario: Scoped and root token outputs cannot drift. Both files come
  // out of one Style Dictionary run — everything but the enclosing selector is
  // byte-identical (declarations AND the appended boundary primitive).
  it('scoped and root token outputs cannot drift', async () => {
    const { css, scoped } = await builtOnce();
    expect(scoped.replace(/^\.ontwerp \{/, ':root {')).toBe(css);
    // and, structurally: the declaration sets are identical
    const rootDecls = customProps(css.match(/:root \{([^}]*)\}/)[1]);
    const scopedDecls = customProps(scoped.match(/\.ontwerp \{([^}]*)\}/)[1]);
    expect(Object.fromEntries(scopedDecls)).toEqual(Object.fromEntries(rootDecls));
  });

  // Spec: Scenario: Scoped bundles are emitted from the showcase's style sources.
  it('scoped bundles regenerate from zoo style sources', async () => {
    const styles = tmpDir();
    cpSync(zooStyles, styles, { recursive: true });
    appendFileSync(join(styles, 'components.css'), '\n.zz-sentinel-comp { outline-width: 7px; }\n');
    appendFileSync(join(styles, 'weather.css'), '\n.zz-sentinel-fx { outline-width: 9px; }\n');
    const dist = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: dist, stylesDir: styles });
    expect(readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8')).toContain(
      '.ontwerp .zz-sentinel-comp { outline-width: 7px; }',
    );
    expect(readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8')).toContain(
      '.ontwerp .zz-sentinel-fx { outline-width: 9px; }',
    );
  });

  // Spec: Scenario: Every rule is confined to the scope.
  it('every rule is confined to the scope', async () => {
    const { componentsScoped, effectsScoped } = await builtOnce();
    for (const [label, file] of [['components.scoped.css', componentsScoped], ['effects.scoped.css', effectsScoped]]) {
      const { rules } = cssRules(file);
      expect(rules.length, `${label} has style rules`).toBeGreaterThan(0);
      for (const rule of rules) {
        for (const sel of rule.selectors) {
          expect(sel, `${label}: "${sel}" must be the scope class or a descendant of it`).toMatch(
            /^\.ontwerp(\s|\[|:|$)/,
          );
        }
      }
    }
  });

  // Spec: Scenario: All keyframes carry the namespace — across every shipped CSS
  // output, and every animation reference resolves to a declared prefixed name.
  it('all keyframes carry the namespace', async () => {
    const { css, scoped, componentsScoped, effectsScoped, theme } = await builtOnce();
    const shipped = [
      ['tokens.css', css],
      ['tokens.scoped.css', scoped],
      ['components.scoped.css', componentsScoped],
      ['effects.scoped.css', effectsScoped],
      ['theme.css', theme],
    ];
    const declared = new Set();
    for (const [label, file] of shipped) {
      for (const name of cssRules(file).keyframes) {
        expect(name, `${label}: @keyframes ${name}`).toMatch(/^ontwerp-/);
        declared.add(name);
      }
    }
    expect(declared.size).toBeGreaterThan(0);
    let refs = 0;
    for (const [label, file] of shipped) {
      for (const name of animationRefs(file)) {
        refs += 1;
        expect(declared.has(name), `${label}: animation "${name}" must resolve to a declared ontwerp- keyframe`).toBe(true);
      }
    }
    expect(refs).toBeGreaterThan(0);
  });

  // Spec: Requirement: Fluid type ranges are substituted into CSS outputs only.
  // The regression this guards is the one that shipped: the ranges were recorded in
  // prose while every output carried the ceiling, so type never scaled.
  it('substitutes ontwerp.fluid ranges into CSS outputs and leaves portable outputs plain', async () => {
    const { css, scoped, theme, js, manifest } = await builtOnce();
    const sources = JSON.parse(
      readFileSync(join(realTokens, 'semantic', 'typography.tokens.json'), 'utf8'),
    ).typography;

    const fluid = Object.entries(sources).filter(([, t]) => t?.$extensions?.['ontwerp.fluid']);
    expect(fluid.length, 'some typography token declares a fluid range').toBeGreaterThan(0);

    for (const [name, token] of fluid) {
      const range = token.$extensions['ontwerp.fluid'];
      const ceiling = token.$value.fontSize;

      for (const [label, out, prop] of [
        ['tokens.css', css, `--typography-${name}`],
        ['tokens.scoped.css', scoped, `--typography-${name}`],
        ['theme.css', theme, `--typography-ontwerp-${name}`],
      ]) {
        const decl = out.split('\n').find((l) => l.includes(`${prop}:`));
        expect(decl, `${label} declares ${prop}`).toBeDefined();
        expect(decl, `${label}: ${prop} carries the fluid range`).toContain(range);
        expect(decl, `${label}: ${prop} does not fall back to the bare ceiling`).not.toContain(`${ceiling}/`);
      }

      // Portable outputs must stay parseable: a clamp() is a CSS capability.
      const jsDecl = js.split('\n').find((l) => l.includes(`"typography-${name}"`));
      expect(jsDecl, `tokens.js declares typography-${name}`).toBeDefined();
      expect(jsDecl, `tokens.js: typography-${name} keeps a plain dimension`).toContain(`"fontSize":"${ceiling}"`);
      expect(jsDecl).not.toContain('clamp(');

      const entry = manifest.find((e) => e.path === `typography.${name}`);
      expect(entry, `manifest carries typography.${name}`).toBeDefined();
      expect(entry.value.fontSize, `manifest: typography.${name} keeps a plain dimension`).toBe(ceiling);
    }
  });

  // Spec: Scenario: Tailwind theme is emitted with namespaced variables.
  it('tailwind names carry the ontwerp segment', async () => {
    const { theme } = await builtOnce();
    const decls = [...customProps(theme).keys()];
    expect(decls.length).toBeGreaterThan(0);
    for (const name of decls) {
      expect(name, `theme.css declares ${name}`).toMatch(/^--[a-z][a-z0-9]*-ontwerp(-|$)/);
    }
    // every var() reference also points at a namespaced target (self-contained)
    for (const m of theme.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) {
      expect(m[1], `theme.css references ${m[1]}`).toMatch(/^--[a-z][a-z0-9]*-ontwerp(-|$)/);
    }
  });
});
