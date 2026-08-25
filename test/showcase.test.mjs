import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync, cpSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderShowcase } from '../scripts/lib/showcase-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir, customProps, computeVar } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// A small built-manifest fixture covering a couple of the colour-role paths the
// palette renders, plus an rgba primitive and a dimension.
const MANIFEST = [
  { path: 'color.surface.page', name: 'color-surface-page', tier: 'semantic', type: 'color', value: '#F1ECE0', ref: 'color.paper' },
  { path: 'color.accent.base', name: 'color-accent-base', tier: 'semantic', type: 'color', value: '#B84A39', ref: 'color.red' },
  { path: 'color.text.default', name: 'color-text-default', tier: 'semantic', type: 'color', value: '#1F1B16', ref: 'color.ink' },
  { path: 'color.ink-a65', name: 'color-ink-a65', tier: 'primitive', type: 'color', value: 'rgba(31, 27, 22, 0.65)', ref: null },
  { path: 'space.lg', name: 'space-lg', tier: 'primitive', type: 'dimension', value: '16px', ref: null },
];
const TOKEN_CSS = ':root { --color-surface-page: #f1ece0; --color-text-default: #1f1b16; --color-accent-base: #b84a39; }';
const FONT_CSS = "@font-face { font-family: 'Archivo'; src: url(data:font/woff2;base64,AAAA) format('woff2'); }";

const html = (over = {}) => renderShowcase({ manifest: MANIFEST, tokenCss: TOKEN_CSS, fontCss: FONT_CSS, ...over });

const externalRefs = (h) =>
  (h.match(/(?:src|href)\s*=\s*["']https?:/gi) || []).concat(h.match(/url\(\s*["']?https?:/gi) || []);

describe('showcase (the zoo)', () => {
  it('is rendered in the paper theme, not generic/dark chrome', () => {
    const h = html();
    expect(h).toContain('background: var(--color-surface-page)'); // paints the system surface
    expect(h).not.toContain('color-scheme'); // no reliance on UA light/dark
    expect(h).toContain('border-radius: 0'); // square corners everywhere
  });

  it('shows the palette by colour role, including the page background itself', () => {
    const h = html();
    for (const role of ['surface', 'ink', 'accent', 'border']) {
      expect(h).toContain(`role-name">${role}`);
    }
    // the page background is shown, flagged, and reskins with the theme (role var)
    expect(h).toContain('background:var(--color-surface-page)');
    expect(h).toContain('you are here');
    // resolved values from the built manifest are shown as genuine values
    expect(h).toContain('#F1ECE0');
    // alpha rule variants are not enumerated as a token dump
    expect(h).not.toContain('rgba(31, 27, 22, 0.65)');
  });

  it('does not dump tokens, tiers, or a state matrix', () => {
    const h = html();
    expect(h).not.toMatch(/\bprimitive\b|\bsemantic\b/); // no tier jargon on the page
    expect(h).not.toMatch(/is-hover|is-active|is-disabled/); // no forced state matrix
    expect(h).not.toMatch(/\$type|grouped by|gallery/i); // no technical token inventory
  });

  it('drops the borrowed furniture (margin rule, a–l axis, art folio)', () => {
    const h = html();
    expect(h).not.toContain('class="rule"'); // no fixed red margin rule
    expect(h).not.toContain('class="axis"'); // no a–l rooster axis row
    expect(h).not.toMatch(/druk iv|printed in cream|rooster · 12/i); // no bottom art folio
    expect(h).not.toMatch(/>i\.<|>ii\.<|>iii\.</); // no Roman numerals
  });

  it('shows the system in use: masthead, palette, type specimen, components', () => {
    const h = html();
    expect(h).toContain('de ontwerp'); // masthead
    expect(h).toContain('paper &amp; ink');
    expect(h).toContain('class="btn"');
    expect(h).toContain('class="field"');
    expect(h).toContain('pill-red');
    expect(h).toContain('use-cell card');
  });

  it('carries the hand-set vocabulary: handwritten figures, grid ambience, halftone, instant press', () => {
    const h = html();
    expect(h).toContain("font-family: 'Caveat'"); // handwritten editorial voice
    expect(h).toContain('class="fig">1'); // a section figure, not a Roman numeral
    expect(h).toContain('class="grid"'); // animated grid ambience
    expect(h).toContain('.btn::before'); // faint Ben-Day dot screen on every button
    expect(h).toContain('radial-gradient(var(--color-ink) 1px'); // the halftone dots, token-driven
    expect(h).toContain('border-bottom-width: 3px'); // heavier button bottom-edge
    expect(h).not.toMatch(/transition\s*:/); // interactions are instant — no CSS transitions (keyframe animations, incl. steps(), are fine)
  });

  it('reskins the whole page by swapping only colour roles, illustratively, with no script', () => {
    const h = html();
    expect(h).toContain('class="theme-bar"'); // a top-of-page switcher, not a contained preview
    expect(h).toContain('illustrative'); // not misrepresented as shipped tokens
    expect(h).toContain(':root:has(#th-lilac:checked)'); // CSS-only, whole-page switch, on the token scope root
    expect(h).not.toContain('th-stage'); // the old contained preview panel is gone
    // the skins override only colour roles — never type or spacing
    const overrides = [...h.matchAll(/:root:has\(#th-\w+:checked\) \{([^}]*)\}/g)].map((m) => m[1]).join(' ');
    expect(overrides).toContain('--color-surface-page');
    expect(overrides).not.toMatch(/--typography|--space-/);
    expect(h).not.toMatch(/<script\b/); // switching needs no JavaScript
  });

  it('honours reduced motion for the ambient grid and bloom', () => {
    const h = html();
    expect(h).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.grid i[\s\S]*animation: none/);
  });

  it('self-hosts fonts and stays self-contained (no network)', () => {
    const h = html();
    expect(h).toContain('data:font/woff2'); // fonts inlined
    expect(externalRefs(h).length).toBe(0);
    expect(h).not.toMatch(/<link\b/);
    expect(h).not.toMatch(/<script[^>]*\bsrc=/);
  });

  it('is deterministic for identical input', () => {
    expect(html()).toBe(html());
  });

  it('is emitted by the build under dist/zoo/ with all three fonts inlined', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const out = join(dist, 'zoo', 'index.html');
    expect(existsSync(out)).toBe(true);
    const page = readFileSync(out, 'utf8');
    expect((page.match(/@font-face/g) || []).length).toBe(3); // Archivo, JetBrains Mono, Caveat
    expect(page).toContain("font-family: 'Caveat'");
  });
});

// One shared build of the real tokens for the reskin-through-built-CSS checks.
let _zooBuilt;
function zooBuiltOnce() {
  if (!_zooBuilt) {
    const dist = tmpDir();
    _zooBuilt = runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist }).then(() => ({
      page: readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'),
      manifest: JSON.parse(readFileSync(join(dist, 'manifest', 'tokens.json'), 'utf8')),
      componentsScoped: readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8'),
      effectsScoped: readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8'),
    }));
  }
  return _zooBuilt;
}

// The plain :root blocks of the page (built tokens + the zoo's own effect vars),
// in cascade order, as customProps maps.
const rootBlocks = (page) => [...page.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => customProps(m[1]));
// The per-skin :root:has(#th-…) override blocks, keyed by skin id.
const skinBlocks = (page) =>
  new Map([...page.matchAll(/:root:has\(#th-(\w+):checked\)\s*\{([^}]*)\}/g)].map((m) => [m[1], customProps(m[2])]));

describe('showcase reskins through the built alias-preserving CSS', () => {
  it('zoo source does not re-link built tokens', async () => {
    const { manifest } = await zooBuiltOnce();
    const tokenNames = new Set(manifest.map((e) => e.name));
    const zooDir = join(root, 'design-system', 'source', 'zoo');
    const files = [];
    // Skip the scratch files a concurrent build leaves beside a regenerated source
    // artifact for the instant before it renames them into place: this assertion is
    // about authored zoo source, and stat-ing one that has just been renamed throws.
    (function walk(d) {
      for (const name of readdirSync(d).sort()) {
        if (name.includes('.tmp-')) continue;
        const p = join(d, name);
        if (statSync(p).isDirectory()) walk(p);
        else files.push(p);
      }
    })(zooDir);
    // every custom property the zoo source declares, however it declares it
    const declared = [];
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/--([a-z][a-z0-9-]*)\s*:/g)) {
        declared.push({ file: f.slice(zooDir.length + 1), name: m[1] });
      }
    }
    expect(declared.length).toBeGreaterThan(0);
    // none may collide with a built token name; the zoo-local --wx-* effect vars
    // are its own vocabulary, not built tokens.
    const collisions = declared.filter((d) => !d.name.startsWith('wx-') && tokenNames.has(d.name));
    expect(collisions, 'zoo source re-declares built token custom properties').toEqual([]);
  });

  it('component styles carry no hardcoded colour', () => {
    const css = readFileSync(join(root, 'design-system', 'source', 'zoo', 'styles', 'components.css'), 'utf8');
    // no rgb()/#hex colour literals at all (a var() fallback would be the only
    // tolerated position, and components.css uses none)
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    // the halftone dot screen draws from the ink token
    expect(css).toContain('radial-gradient(var(--color-ink)');
  });

  // Limitation: not a real browser — computeVar() hand-rolls var() substitution
  // over the page's :root declarations (see helpers.mjs), which mirrors browser
  // computation because the built tokens and the skin overrides are declared on
  // the same scope root (:root); :root:has() outspecifies :root.
  it('theme swap restyles components via built CSS', async () => {
    const { page } = await zooBuiltOnce();
    const base = rootBlocks(page);
    const skins = skinBlocks(page);
    expect(skins.size).toBeGreaterThanOrEqual(3);

    // colour-carrying vars each named component paints with
    const colour = {
      'button text': '--button-text-default',
      'button halftone': '--color-ink',
      'field text': '--field-text',
      'card surface': '--color-surface-claim',
      'badge text': '--badge-text',
      'link hover': '--link-text-hover',
    };
    const cream = Object.fromEntries(
      Object.entries(colour).map(([k, v]) => [k, computeVar(v, ...base)]),
    );
    for (const v of Object.values(cream)) expect(v).toMatch(/^(#|rgb)/); // resolves to a concrete colour

    for (const [id, override] of skins) {
      for (const [what, name] of Object.entries(colour)) {
        const swapped = computeVar(name, ...base, override);
        expect(swapped, `${what} under skin "${id}"`).toMatch(/^(#|rgb)/);
        expect(swapped, `${what} must change under skin "${id}"`).not.toBe(cream[what]);
      }
      // layout and typography stay identical: the skin declares no such override…
      for (const declaredName of override.keys()) {
        expect(declaredName).not.toMatch(/^--(typography|space|size|radius|font|button-padding|field-padding|badge-padding)/);
      }
      // …and the computed type/spacing is byte-identical to cream
      for (const name of ['--typography-body', '--button-typography', '--space-lg', '--button-padding-inline']) {
        expect(computeVar(name, ...base, override), `${name} under skin "${id}"`).toBe(computeVar(name, ...base));
      }
    }

    // the demo remains labelled illustrative, not shipped tokens
    expect(page).toContain('illustrative');
  });

  it('hover and focus states keep responding through the built chain', async () => {
    const { page } = await zooBuiltOnce();
    const base = rootBlocks(page);
    const skins = skinBlocks(page);
    // every var() a :hover / :focus rule reads must resolve through the built
    // chain alone (the zoo's deleted re-link block must not be missed)
    const stateVars = new Set();
    for (const m of page.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!/:(hover|focus|focus-visible|focus-within)/.test(m[1])) continue;
      for (const v of m[2].matchAll(/var\((--[a-zA-Z0-9-]+)\)/g)) stateVars.add(v[1]);
    }
    expect(stateVars.size).toBeGreaterThan(0);
    expect([...stateVars]).toEqual(expect.arrayContaining(['--button-surface-hover', '--field-border-focus', '--link-underline-hover']));
    for (const name of stateVars) {
      const resolved = computeVar(name, ...base);
      expect(resolved, `${name} read by a state rule`).toBeTruthy();
      expect(resolved).not.toContain('var(');
    }
    // and the button hover state itself reskins with a demo skin (surface.ink → ink)
    const [id, override] = [...skins.entries()][0];
    expect(computeVar('--button-surface-hover', ...base, override), `hover surface under skin "${id}"`).not.toBe(
      computeVar('--button-surface-hover', ...base),
    );
  });
});

describe('showcase consumes the shipped keyframe names', () => {
  // Spec: showcase / Scenario: Showcase and shipped bundles share one set of
  // keyframe names — the zoo declares only ontwerp-prefixed keyframes, and every
  // one of them also appears in the shipped scoped bundles built from the same
  // style sources. No second, unprefixed name set exists anywhere.
  it('every zoo keyframe is ontwerp-prefixed and shipped', async () => {
    const { page, componentsScoped, effectsScoped } = await zooBuiltOnce();
    const names = [...page.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    const shipped = componentsScoped + effectsScoped;
    for (const name of names) {
      expect(name, `zoo @keyframes ${name}`).toMatch(/^ontwerp-/);
      expect(shipped, `@keyframes ${name} must also ship in a scoped bundle`).toContain(`@keyframes ${name}`);
    }
  });

  // Spec: Scenario: A keyframe edit propagates to both surfaces — one edited
  // style source, one build, and the change lands in the zoo AND the shipped
  // effects bundle (the no-drift guarantee that lets consumers delete copies).
  it('a keyframe edit propagates to both surfaces', async () => {
    const styles = tmpDir();
    cpSync(join(root, 'design-system', 'source', 'zoo', 'styles'), styles, { recursive: true });
    const weather = join(styles, 'weather.css');
    const edited = readFileSync(weather, 'utf8').replace(
      '@keyframes ontwerp-gust { to { left: 100%; } }',
      '@keyframes ontwerp-gust { to { left: 97.531%; } }',
    );
    expect(edited).toContain('97.531%'); // the source line under edit still exists
    writeFileSync(weather, edited);

    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist, stylesDir: styles });
    expect(readFileSync(join(dist, 'zoo', 'index.html'), 'utf8')).toContain('left: 97.531%');
    expect(readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8')).toContain('left: 97.531%');
  });
});

describe('showcase reduced-motion rest frames are co-located', () => {
  const stylesDir = join(root, 'design-system', 'source', 'zoo', 'styles');
  const readStyle = (f) => readFileSync(join(stylesDir, f), 'utf8');
  const EFFECT_LAYERS = ['atmosphere.css', 'material.css', 'states.css', 'weather.css'];

  // Spec: showcase / Scenario: Rest-pose rules are co-located with their animation —
  // every effect layer that declares an animation carries its reduced-motion rest
  // poses in the same module, so the fallback ships wherever the animation ships.
  it('every effect layer declaring animations carries its reduced-motion block in-module', () => {
    for (const file of EFFECT_LAYERS) {
      const css = readStyle(file);
      if (!css.includes('@keyframes')) continue;
      expect(css.includes('@media (prefers-reduced-motion: reduce)'), `${file} declares keyframes`).toBe(true);
    }
    // material ships no keyframes today; recorded here so the claim is checked,
    // not assumed (if one appears, the block above demands its rest poses).
    expect(readStyle('material.css').includes('@keyframes')).toBe(false);
  });

  it('no reduced-motion rule remains outside the effect layers', () => {
    for (const name of readdirSync(stylesDir).sort()) {
      const css = readStyle(name);
      const isEffectLayer = EFFECT_LAYERS.includes(name);
      expect(css.includes('prefers-reduced-motion') && !isEffectLayer, `${name} holds reduced-motion rules`).toBe(false);
    }
  });
});

// The accepted pre-effects-refactor zoo, frozen as the byte-level oracle for the
// markup this change now derives from data functions.
const BASELINE = join(root, 'design-system', 'reference', 'accepted-zoo', 'generated', 'index.html');

// Every region of the page that carries effect markup, as [kind, bytes] pairs in
// document order: the ambient grid, the seed-head dividers, the germinating
// state art, and each weather field.
function effectRegions(html) {
  const grab = (kind, re) => [...html.matchAll(re)].map((m) => [kind, m[0]]);
  return [
    ...grab('grid', /<div class="grid"[^>]*>[\s\S]*?<\/div>/g),
    ...grab('divider', /<div class="divider"[\s\S]*?<\/div>/g),
    ...grab('gseedhead', /<svg class="gseedhead"[\s\S]*?<\/svg>/g),
    ...grab('wx-field', /<div class="wx-field[^"]*"[^>]*>[\s\S]*?<\/div>/g),
  ];
}

const EFFECTS_DIR = join(root, 'design-system', 'source', 'zoo', 'effects');

// Effect element authoring: the particle/glyph class names and seed-head circles
// only ever appear as template literals inside the effect modules. Returns the
// offending [file, match] pairs found in any other zoo source file.
function scanForEffectMarkup(file, src) {
  const authored = /class="(?:gust|mote|drop|splash|fleck|pollen|firefly|flake|haze|sunpool|wxc)[ "]|<circle\b/g;
  return [...src.matchAll(authored)].map((m) => [file, m[0]]);
}

describe('showcase effect markup through the data-derived wrappers', () => {
  // The one recorded motion-correction exemption (design.md: byte-identical
  // output *outside* the intended motion correction). The stepped-clock change
  // appends a per-cell step count to every grid cell's style attribute —
  // `;--tf:steps(N)` — and nothing else. It is stripped from BOTH sides before
  // the byte comparison, exactly like C7's recorded rest-frame relocations in
  // zoo-parity: any other byte difference in any region still fails.
  const stripMotionClock = (html) => html.replace(/;--tf:steps\(\d+\)/g, '');

  // Spec: showcase / Scenario: Effect output stays stable across rebuilds.
  it('effect markup is byte-identical to the accepted baseline, modulo the recorded stepped-clock addition', async () => {
    const { page } = await zooBuiltOnce();
    const built = effectRegions(stripMotionClock(page));
    const base = effectRegions(stripMotionClock(readFileSync(BASELINE, 'utf8')));
    expect(built.map(([kind]) => kind), 'same regions in the same order').toEqual(base.map(([kind]) => kind));
    for (let i = 0; i < base.length; i++) {
      const [kind] = built[i];
      expect(built[i][1], `${kind} region ${i} must be byte-identical`).toBe(base[i][1]);
    }
  });

  // …and the stripped addition is really there: every grid cell carries its
  // stepped clock into the shipped page (weather fields carried --tf before
  // this change, so the count is taken inside the grid region only).
  it('grid cells carry the per-cell stepped clock against the unchanged baseline geometry', async () => {
    const { page } = await zooBuiltOnce();
    const gridRegion = page.match(/<div class="grid"[^>]*>[\s\S]*?<\/div>/)[0];
    expect(gridRegion).toMatch(/--dl:-?\d+\.\d+s;--tf:steps\(\d+\)/);
    expect([...gridRegion.matchAll(/--tf:steps\((\d+)\)/g)].length).toBe(160); // 16×10 cells
  });

  // Spec: Scenario: Effect markup comes from the data-derived wrappers — no
  // parallel path: outside the effect modules themselves, no zoo source authors
  // effect elements; sections only place wrapper output into containers.
  it('no effect element markup is authored outside the effect modules', async () => {
    const { page } = await zooBuiltOnce();
    expect(page.length).toBeGreaterThan(0); // the real build is what the other checks scan
    const zooDir = join(root, 'design-system', 'source', 'zoo');
    const offenders = [];
    (function walk(dir) {
      for (const name of readdirSync(dir).sort()) {
        const p = join(dir, name);
        if (p === EFFECTS_DIR) continue;
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.mjs')) offenders.push(...scanForEffectMarkup(p, readFileSync(p, 'utf8')));
      }
    })(zooDir);
    expect(offenders, 'effect element templates must live only in effects/').toEqual([]);
  });
});
