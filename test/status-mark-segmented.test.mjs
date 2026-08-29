import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { collectTokenFiles } from '../scripts/lib/validate-core.mjs';
import { renderComponents, implementsRecipes } from '../design-system/source/zoo/sections/components.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_CSS = () =>
  readFileSync(join(root, 'design-system', 'source', 'zoo', 'styles', 'components.css'), 'utf8');

// One shared build of the real tokens; also recompiles recipes/index.json,
// exactly as `npm run build` does.
let _built;
function builtOnce() {
  if (!_built) {
    const dist = tmpDir();
    _built = runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist }).then(() => ({
      index: JSON.parse(readFileSync(join(root, 'design-system', 'recipes', 'index.json'), 'utf8')),
      page: readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'),
      componentsScoped: readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8'),
    }));
  }
  return _built;
}

const MARKS_CELL = (() => {
  const h = renderComponents();
  const start = h.indexOf('status marks');
  const open = h.lastIndexOf('<div class="use-cell">', start);
  return h.slice(open, h.indexOf('</div>\n  </div>', start));
})();

describe('status mark & segmented control — registered chrome primitives (design-language)', () => {
  // Spec: design-language / Scenario: Status-mark recipe is registered and complete
  // (+ the segmented-control counterpart). Task 1.3 named check: recipe-index
  // compilation includes both IDs.
  it('recipe-index compilation includes both IDs with the full recipe shape', async () => {
    const { index } = await builtOnce();
    for (const id of ['state.mark.static', 'component.tabs.segmented']) {
      const recipe = index.find((r) => r.id === id);
      expect(recipe, `${id} compiled into recipes/index.json`).toBeTruthy();
      for (const field of ['id', 'intent', 'useWhen', 'avoid', 'sourceModules', 'valueRefs', 'reducedMotion', 'notes']) {
        expect(recipe[field], `${id}.${field}`).toBeTruthy();
      }
      expect(recipe.sourceModules.length).toBeGreaterThan(0);
      expect(recipe.valueRefs.length).toBeGreaterThan(0);
    }
  });

  // Spec: both recipes carry resolvable source-module and value references
  // (the cross-layer half of the registration scenario).
  it('both recipes resolve their source modules and value references', async () => {
    const { index } = await builtOnce();
    const { entries } = collectTokenFiles(join(root, 'design-system', 'source', 'values'));
    const tokenPaths = new Set();
    const walk = (node, path) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        if (value && typeof value === 'object' && '$value' in value) tokenPaths.add([...path, key].join('.'));
        else walk(value, [...path, key]);
      }
    };
    for (const entry of entries) walk(entry.data, []);
    for (const id of ['state.mark.static', 'component.tabs.segmented']) {
      const recipe = index.find((r) => r.id === id);
      for (const mod of recipe.sourceModules) {
        expect(existsSync(join(root, mod)), `${id} sourceModule ${mod}`).toBe(true);
      }
      for (const ref of recipe.valueRefs) {
        expect(tokenPaths.has(ref), `${id} valueRef ${ref}`).toBe(true);
      }
    }
  });

  // Spec: design-language / Scenario: The mark's relationship to the lifecycle
  // states is documented — declared IN THE RECIPE (via reducedMotion/notes), so it
  // is discoverable where consumers register from, not only in prose.
  it('the mark recipe declares the inert-rest-frame relationship and fallback role', async () => {
    const { index } = await builtOnce();
    const recipe = index.find((r) => r.id === 'state.mark.static');
    const declared = `${recipe.reducedMotion} ${recipe.notes}`;
    expect(declared).toMatch(/inert rest frame of a lifecycle state/i);
    expect(declared).toMatch(/fallback/i);
    expect(recipe.notes).toMatch(/fail/i);
    expect(recipe.valueRefs).toContain('color.destructive.base'); // fail never borrows the accent
  });

  // Spec: segmented control defines the pick-one selected-state contract in its
  // recipe notes: selected inverts unselected, switch is immediate.
  it('the segmented recipe states the inverted selected-state contract and instant switch', async () => {
    const { index } = await builtOnce();
    const recipe = index.find((r) => r.id === 'component.tabs.segmented');
    expect(recipe.notes).toMatch(/invert/i);
    expect(recipe.notes).toMatch(/immediate/i);
  });

  // Task 2.1 / spec: states.md states the same relationship the recipe declares.
  it('states.md documents the mark as the lifecycle rest frame and compliant fallback', () => {
    const doc = readFileSync(join(root, 'design-system', 'language', 'states.md'), 'utf8');
    expect(doc).toMatch(/inert rest frame of a lifecycle state/i);
    expect(doc).toMatch(/compliant static fallback/i);
    expect(doc).toMatch(/ripe at/i); // pass = ripe-at-rest
    expect(doc).toMatch(/destructive\s+pigment\s+confined\s+to\s+a\s+(thin\s+)?rule/i); // fail = destructive on a rule
    expect(doc).toMatch(/quiet/i); // warn = quiet
    expect(doc).toMatch(/never\s+a\s+green\s+tick/i);
  });

  // Task 2.2 / spec: components.md describes the reusable pick-one mode selector,
  // distinct from the theme-switch affordance.
  it('components.md documents the segmented control contract', () => {
    const doc = readFileSync(join(root, 'design-system', 'language', 'components.md'), 'utf8');
    expect(doc).toMatch(/pick-one mode selector/i);
    expect(doc).toMatch(/selected cell inverts the unselected treatment/i);
    expect(doc).toMatch(/immediate/i);
    expect(doc).toMatch(/distinct from the theme-switch/i);
  });
});

describe('status mark & segmented control — showcase worked examples (showcase)', () => {
  // Task 3.1 named check: the section module declares both new recipe IDs.
  it('showcase-module implementsRecipes declaration covers both new IDs', () => {
    expect(implementsRecipes).toContain('state.mark.static');
    expect(implementsRecipes).toContain('component.tabs.segmented');
  });

  // Spec: showcase / Scenario: Both primitives are shown token-styled.
  it('renders the status mark (pass/fail/warn) and segmented control from token vars', async () => {
    const { page } = await builtOnce();
    expect(page).toContain('mark mark-pass');
    expect(page).toContain('mark mark-warn');
    expect(page).toContain('mark mark-fail');
    expect(page).toContain('class="seg"');
    // styled through the system's token custom properties, not literals
    const css = COMPONENTS_CSS();
    for (const block of ['.mark .mk', '.mark-warn .mk', '.mark-fail .mk', '.seg-cell', '.seg-radio:checked + .seg-cell']) {
      expect(css).toContain(block);
    }
    expect(css).toMatch(/\.seg-radio:checked \+ \.seg-cell \{[^}]*var\(--color-surface-ink\)[^}]*\}/);
    // every paint declaration of either primitive resolves through a token
    // custom property — a literal hex/rgb/hsl would pass the selector checks
    // above while silently opting the primitive out of the token system
    const literals = [];
    for (const rule of css.match(/\.(?:mark|seg)[^{]*\{[^}]*\}/g) ?? []) {
      for (const decl of rule.match(/(?:background|color|border)[^:;{}]*:[^;{}]*/g) ?? []) {
        if (/#[0-9a-fA-F]{3,8}\b|\bhsla?\(|\brgba?\(/.test(decl)) literals.push(decl.trim());
      }
    }
    expect(literals, 'primitive colours must be token vars').toEqual([]);
  });

  // Spec: Scenario: The fail mark uses the destructive role, not the accent —
  // colour resolves from color.destructive AND stays confined to the rule element,
  // never flooding the mark box and never touching --color-accent-base.
  it('fail draws the destructive role, confined to the rule, not the accent', () => {
    const css = COMPONENTS_CSS();
    expect(css).toMatch(/\.mark-fail \.mk \{[^}]*var\(--color-destructive-base\)[^}]*\}/);
    // every destructive reference sits on the fail indicator rule alone
    const destructiveRules = [...css.matchAll(/([^{}]+)\{[^}]*--color-destructive-base[^}]*\}/g)].map((m) => m[1].trim());
    expect(destructiveRules.length).toBeGreaterThan(0);
    for (const sel of destructiveRules) expect(sel).toContain('.mark-fail .mk');
    // and the accent never appears in any fail-mark rule
    const failBlocks = css.match(/\.mark-fail[^{]*\{[^}]*\}/g) ?? [];
    expect(failBlocks.length).toBeGreaterThan(0);
    for (const block of failBlocks) expect(block).not.toContain('--color-accent-base');
    // and the pigment is confined to a RULE, per states.md: the indicator is
    // line-shaped (narrower than tall), so a filled dot or a flooded mark box
    // cannot pass while the "thin rule" property is violated
    const failMk = css.match(/\.mark-fail \.mk \{([^}]*)\}/)[1];
    const width = Number(failMk.match(/width:\s*([\d.]+)px/)?.[1]);
    const height = Number(failMk.match(/height:\s*([\d.]+)px/)?.[1]);
    expect(width).toBeLessThan(height);
  });

  // Task 3.3 / spec: Status is not a green tick or checkbox — dots and rules only,
  // per the pill convention; no glyph character and no checkbox input anywhere in
  // the status-mark markup or CSS.
  it('shows status without a green-check icon or checkbox glyph', () => {
    expect(MARKS_CELL).not.toMatch(/[✓✔☑✅☐☒✗⨯]|checkbox|green-tick|<svg|<img/i);
    // indicators are the dot/rule element only — no other glyph carriers
    const carriers = [...MARKS_CELL.matchAll(/<i class="([^"]*)"/g)].map((m) => m[1]);
    expect(carriers.length).toBe(3);
    for (const c of carriers) expect(c).toBe('mk');
    // and none in the stylesheet either
    expect(COMPONENTS_CSS()).not.toMatch(/[✓✔☑✅☐☒]/);
  });

  // Task 3.2 named check / spec: The segmented switch is immediate — no transition
  // and no @keyframes anywhere in components.css (both primitives are
  // transition-free by design). Comments are stripped first: the named check is
  // about real declarations, not prose mentioning the words.
  it('introduces no transitions and no @keyframes', () => {
    const css = COMPONENTS_CSS().replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toContain('@keyframes');
    expect(css).not.toMatch(/transition\s*:/);
    expect(css).not.toMatch(/animation\s*:/);
  });

  // Spec: the selected cell inverts the unselected treatment, instantly.
  it('selected segment inverts the unselected treatment', () => {
    const css = COMPONENTS_CSS();
    const unselected = css.match(/\.seg-cell \{([^}]*)\}/)[1];
    const selected = css.match(/\.seg-radio:checked \+ \.seg-cell \{([^}]*)\}/)[1];
    expect(unselected).toMatch(/background:\s*var\(--color-surface-page\)/); // paper…
    expect(selected).toMatch(/background:\s*var\(--color-surface-ink\)/);     // …vs solid ink
    expect(unselected).toMatch(/color:\s*var\(--color-text-default\)/);       // …ink text
    expect(selected).toMatch(/color:\s*var\(--color-text-on-ink\)/);          // …vs paper text
  });

  // The classes must travel: the same style sources ship in the scoped component
  // bundle (Change 1), scope-prefixed, so an importing consumer gets both
  // primitives without copying zoo internals.
  it('ships both primitives in the scoped component bundle', async () => {
    const { componentsScoped } = await builtOnce();
    for (const sel of ['.mark ', '.mark-pass', '.mark-warn', '.mark-fail', '.seg ', '.seg-radio:checked + .seg-cell']) {
      expect(componentsScoped).toContain(sel);
    }
    expect(componentsScoped).toContain('var(--color-destructive-base)');
    // Neither primitive is animated — a mark is already at rest and the segmented
    // switch is instant. Asserted against components.css, the module they live in,
    // rather than the whole bundle: the bundle also carries surfaces.css, whose
    // reveal keyframes are a different family's motion, not these two primitives'.
    // (comments stripped — they may mention the words)
    expect(COMPONENTS_CSS().replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('@keyframes');
  });
});
