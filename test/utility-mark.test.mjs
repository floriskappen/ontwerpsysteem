import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { renderComponents } from '../design-system/source/zoo/sections/components.mjs';
import { renderThemeBar } from '../design-system/source/zoo/sections/theme-bar.mjs';
import { tmpDir, customProps, computeVar, rulesWithBodies as rules } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STYLES = join(root, 'design-system', 'source', 'zoo', 'styles');
const VALUES = join(root, 'design-system', 'source', 'values');
const BASELINE = join(root, 'design-system', 'reference', 'accepted-zoo', 'generated', 'index.html');

// The utility-mark boundary this change enforces is already normative in the
// published type language (language/type.md): mono-uppercase JetBrains Mono is
// FOR DATA; prose stays in the Archivo lowercase voice. The zoo had two
// canonical contradictions — the field gutter label and the theme-switch label.
// These tests keep the correction in place and keep the data side available.

const read = (p) => readFileSync(p, 'utf8');

/** `prop: value` map of one rule body. */
const declarations = (body) => {
  const map = new Map();
  for (const d of body.split(';')) {
    const c = d.indexOf(':');
    if (c !== -1) map.set(d.slice(0, c).trim(), d.slice(c + 1).trim());
  }
  return map;
};

/** The rule styling `className` itself — not a descendant compound like
 *  `.field:focus-within .field-label` — optionally `.ontwerp`-scoped. */
function classRule(cssText, className, scope = '') {
  const wanted = scope ? `${scope} .${className}` : `.${className}`;
  return [...rules(cssText)].find((r) => r.selector === wanted);
}

// Every <style> block of a rendered page, in document order.
const pageSheet = (page) => [...page.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

// --- the utility-mark contract ----------------------------------------------

const isUppercase = (body) => /(^|[;\s])text-transform\s*:\s*uppercase\s*(;|$)/.test(body);
// A rule consumes the mark's typography through the semantic token, the badge
// component token that resolves to it, or an explicit mono face.
const usesMarkTypeface = (body) =>
  /var\(--typography-mark\)/.test(body) ||
  /var\(--badge-typography\)/.test(body) ||
  /'JetBrains Mono'/.test(body);
const carriesUtilityMark = (body) => isUppercase(body) || usesMarkTypeface(body);

// Spec: showcase / Scenario: Data marks remain available and constrained —
// the treatment stays AVAILABLE for data, and nothing else may hold it. This
// closed set is exactly what carried it after the correction: the canonical
// specimen (.val: numerals/measurements/code) and the coded status events
// (.pill/.mark via --badge-typography). Any other selector found carrying the
// treatment — a prose label, subtitle, section header, taxonomy tag, eyebrow,
// or anything newly written — is a violation.
const DATA_MARK_SELECTORS = ['.mark', '.pill', '.val'];

/** Violations of the closed world across [name, css] pairs. */
function markAudit(cssFiles) {
  const violations = [];
  for (const [name, css] of cssFiles) {
    for (const { selector, body } of rules(css)) {
      if (carriesUtilityMark(body) && !DATA_MARK_SELECTORS.includes(selector)) {
        violations.push(`${name}: "${selector}" carries utility-mark treatment but is not sanctioned data`);
      }
    }
  }
  return violations;
}

// Spec: Scenario: Prose labels do not teach utility-mark styling — the two
// corrected canonical labels must sit in the Archivo lowercase label voice.
const PROSE_LABELS = ['field-label', 'theme-switch-label'];

function proseLabelViolations(cssFiles) {
  const violations = [];
  for (const className of PROSE_LABELS) {
    // find every module that styles the class itself
    const owners = [];
    for (const [name, css] of cssFiles) {
      const rule = classRule(css, className);
      if (rule) owners.push({ name, rule });
    }
    if (owners.length === 0) {
      violations.push(`.${className} rule vanished`);
      continue;
    }
    if (owners.length > 1) violations.push(`.${className} is styled by ${owners.length} modules`);
    const { name, rule } = owners[0];
    const d = declarations(rule.body);
    if (carriesUtilityMark(rule.body)) violations.push(`${name}: .${className} uses utility-mark styling`);
    if (d.get('font') !== 'var(--typography-label)' || d.get('text-transform') !== 'lowercase') {
      violations.push(`${name}: .${className} is not in the Archivo lowercase label voice`);
    }
  }
  return violations;
}

const sourceStyles = () =>
  readdirSync(STYLES).sort().map((f) => [f, read(join(STYLES, f))]);

// One shared real build for every generated-output assertion.
let _built;
function zooBuiltOnce() {
  if (!_built) {
    const dist = tmpDir();
    _built = runBuild({ tokensDir: VALUES, distDir: dist }).then(() => ({
      page: read(join(dist, 'zoo', 'index.html')),
      componentsScoped: read(join(dist, 'css', 'components.scoped.css')),
    }));
  }
  return _built;
}

describe('canonical prose labels (utility-mark-canonical-examples)', () => {
  // Spec: showcase / Requirement: Canonical prose examples use the documented
  // voice boundary — source level, where the authored mistake lived.
  it('the field gutter and theme-switch labels are set in the Archivo lowercase label voice at source', () => {
    expect(proseLabelViolations(sourceStyles())).toEqual([]);
  });

  // The negative direction must be able to fail: re-introduce either half of
  // the original contradiction on a copy and the check names the offender.
  it('regressing either label to utility-mark typography or uppercase fails the check', () => {
    const components = read(join(STYLES, 'components.css'));
    const themes = read(join(STYLES, 'themes.css'));
    const marked = components.replace(
      '.field-label { font: var(--typography-label); text-transform: lowercase;',
      '.field-label { font: var(--typography-mark); text-transform: uppercase;',
    );
    expect(marked).toContain('--typography-mark'); // the fixture really regressed
    let v = proseLabelViolations([['components.css', marked], ['themes.css', themes]]);
    expect(v.length).toBeGreaterThan(0);
    expect(v.join(' ')).toMatch(/field-label/);

    const upperOnly = themes.replace(
      '.theme-switch-label { font: var(--typography-label); text-transform: lowercase;',
      '.theme-switch-label { font: var(--typography-label); text-transform: uppercase;',
    );
    expect(upperOnly).not.toBe(themes);
    v = proseLabelViolations([['components.css', components], ['themes.css', upperOnly]]);
    expect(v.length).toBeGreaterThan(0);
    expect(v.join(' ')).toMatch(/theme-switch-label/);
  });
});

describe('generated showcase teaches the correction (built, never hand-edited)', () => {
  // Spec: Scenario: Prose labels do not teach utility-mark styling — WHEN the
  // GENERATED showcase's labels are inspected.
  it('the built zoo page styles both labels in the Archivo lowercase voice beside their prose markup', async () => {
    const { page } = await zooBuiltOnce();
    const v = proseLabelViolations([['dist/zoo/index.html', pageSheet(page)]]);
    expect(v, v.join('\n')).toEqual([]);
    // the human-written phrases are still there as prose
    expect(page).toContain('field-label">e-post</span>');
    expect(page).toContain('field-label">naam</span>');
    expect(page).toContain('theme-switch-label">theme</span>');
  });

  it('on the built page too, nothing outside the sanctioned data set carries the mark', async () => {
    const { page } = await zooBuiltOnce();
    // Token ALIASES on a scope root (--badge-typography: var(--typography-mark))
    // are declarations, not wiring; only a real presentational property reading
    // the semantic/badge tokens would style an element with the mark. This is
    // the source audit's closed world, held on the generated artifact: a
    // section emitting its own <style> cannot quietly upper-case prose or wire
    // the badge/mark typeface to it.
    for (const { selector, body } of rules(pageSheet(page))) {
      for (const decl of body.split(';')) {
        const c = decl.indexOf(':');
        if (c === -1) continue;
        const [prop, value] = [decl.slice(0, c).trim(), decl.slice(c + 1).trim()];
        if (prop.startsWith('--')) continue; // custom-property alias
        expect(
          carriesUtilityMark(`${prop}:${value}`) && !DATA_MARK_SELECTORS.includes(selector),
          `${selector} styles ${prop} with the utility mark outside the sanctioned data set`,
        ).toBe(false);
      }
    }
  });

  it('the shipped scoped component bundle carries the corrected consumer-facing rule', async () => {
    const { componentsScoped } = await zooBuiltOnce();
    const rule = classRule(componentsScoped, 'field-label', '.ontwerp');
    expect(rule, 'the scoped bundle ships the field label').toBeTruthy();
    const d = declarations(rule.body);
    expect(d.get('font')).toBe('var(--typography-label)');
    expect(d.get('text-transform')).toBe('lowercase');
  });
});

describe('data utility mark remains available and constrained', () => {
  // Spec: Scenario: Data marks remain available and constrained — the existing
  // mono-uppercase treatment survives intact on its canonical carrier.
  it('.val keeps the full mono-uppercase signature as the canonical data specimen', () => {
    const rule = classRule(read(join(STYLES, 'type.css')), 'val');
    expect(rule, 'the type specimen still styles .val').toBeTruthy();
    const d = declarations(rule.body);
    expect(d.get('font-family')).toBe("'JetBrains Mono', monospace");
    expect(d.get('font-size')).toBe('10px');
    expect(parseFloat(d.get('letter-spacing'))).toBeGreaterThan(0); // letter-spaced
    expect(d.get('text-transform')).toBe('uppercase');
  });

  it('the built type specimen still exhibits the mark on real data values', async () => {
    const { page } = await zooBuiltOnce();
    expect(page.includes('class="val"'), 'specimen values carry the mark').toBe(true);
    expect(page).toContain('<span class="val">caveat</span>');
  });

  // …and constrained: across EVERY zoo style module, the set of selectors
  // carrying the treatment equals exactly the sanctioned data set — so no
  // prose label/subtitle/section header/taxonomy tag/eyebrow can hold it
  // anywhere, present or future.
  it('exactly the sanctioned data selectors carry the treatment, nothing else', () => {
    const files = sourceStyles();
    expect(markAudit(files), 'prose acquired the utility mark').toEqual([]);
    const carrying = new Set();
    for (const [, css] of files) {
      for (const { selector, body } of rules(css)) if (carriesUtilityMark(body)) carrying.add(selector);
    }
    expect([...carrying].sort()).toEqual(DATA_MARK_SELECTORS);
    // the allow-list itself cannot quietly become a prose list
    for (const sel of DATA_MARK_SELECTORS) expect(sel).not.toMatch(/label|subtitle|heading|eyebrow|note|tag/i);
  });

  it('the audit fails when any other element acquires the treatment', () => {
    const poisoned = `${read(join(STYLES, 'base.css'))}\n.use-label { font: var(--typography-label); text-transform: uppercase; }\n`;
    const v = markAudit([['base.css', poisoned]]);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/\.use-label/);
  });
});

describe('showcase surface preservation (utility-mark-canonical-examples)', () => {
  // Spec: Scenario: Correction preserves the established showcase surface.
  // The accepted baseline is the visual oracle and was NOT regenerated; the
  // rebuild differs from it only where the correction meant it to.
  const BASELINE_SHA256 = '86ae95c3412868887bc5dd2f4aabc2eff438fe5b632234945e8daeccb915103c';

  it('the accepted zoo baseline remains byte-for-byte the accepted file', () => {
    const sha = createHash('sha256').update(readFileSync(BASELINE)).digest('hex');
    expect(sha, 'the baseline was edited or regenerated — verify against it instead').toBe(BASELINE_SHA256);
  });

  it('the rebuilt page differs from the baseline only in the two corrected voices', async () => {
    const { page } = await zooBuiltOnce();
    const before = pageSheet(read(BASELINE));
    const after = pageSheet(page);
    for (const name of ['field-label', 'theme-switch-label']) {
      const was = declarations(classRule(before, name).body);
      const now = declarations(classRule(after, name).body);
      // the voice flipped to the Archivo lowercase label treatment…
      expect(was.get('font')).toBe('var(--typography-mark)');
      expect(was.get('text-transform')).toBe('uppercase');
      expect(now.get('font')).toBe('var(--typography-label)');
      expect(now.get('text-transform')).toBe('lowercase');
      // …and every OTHER declaration survived verbatim (colour, padding,
      // surface, rule — no visual value rode along)
      const stripVoice = (m) => new Map([...m].filter(([k]) => k !== 'font' && k !== 'text-transform'));
      expect(stripVoice(now)).toEqual(stripVoice(was));
    }
  });

  it('no dependency joined the tree and no release artifact appeared', () => {
    const pkg = JSON.parse(read(join(root, 'package.json')));
    expect(Object.keys(pkg.dependencies ?? {}), 'runtime dependencies appeared').toEqual([]);
    expect(Object.keys(pkg.devDependencies).sort()).toEqual(['ajv', 'ajv-formats', 'style-dictionary', 'vitest']);
    // Version pin retired at the deliberate 1.0.0 release; see motion-scope.test.mjs.
    expect(read(join(root, 'design-system', 'VERSION')).trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('the component vocabulary is unchanged by the correction', () => {
    const css = read(join(STYLES, 'components.css')).replace(/\/\*[\s\S]*?\*\//g, '');
    const classes = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]))].sort();
    expect(classes).toEqual([
      'btn', 'btn-ink', 'btn-red', 'card', 'card-body', 'card-title', 'field',
      'field-label', 'lbl', 'lnk', 'mark', 'mark-fail', 'mark-pass', 'mark-warn',
      'mk', 'pdot', 'pill', 'pill-ink', 'pill-quiet', 'pill-red', 'seg',
      'seg-cell', 'seg-radio', 'use-cell', 'use-grid', 'use-label', 'use-row',
    ]);
  });

  it('token values and the resolved type-language contract are unchanged', async () => {
    // authored tokens still define the boundary exactly as published
    const sem = JSON.parse(read(join(VALUES, 'semantic', 'typography.tokens.json'))).typography;
    expect(sem.mark.$value.fontFamily).toBe('{font.mono}');
    expect(sem.mark.$value.fontSize).toBe('10px');
    expect(sem.label.$value.fontFamily).toBe('{font.sans}');
    const comp = JSON.parse(read(join(VALUES, 'component', 'component.tokens.json')));
    expect(comp.badge.typography.$value).toBe('{typography.mark}');
    expect(comp.field.typography.$value).toBe('{typography.body}');
    // and they resolve identically in the build: mark = mono 10px, label = Archivo
    const { page } = await zooBuiltOnce();
    const roots = [...page.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => customProps(m[1]));
    expect(computeVar('--typography-mark', ...roots)).toMatch(/JetBrains Mono/);
    expect(computeVar('--typography-label', ...roots)).toMatch(/Archivo/);
  });

  it('the documented type language still states the utility-mark boundary verbatim', () => {
    const doc = read(join(root, 'design-system', 'language', 'type.md'));
    expect(doc).toContain('Prose labels, subtitles, section headers, taxonomy tags, and eyebrows are NOT utility marks');
    expect(doc).toContain('it is for **data**');
  });
});

describe('canonical field and theme markup keep their inventory and prose labels', () => {
  // Task 1.2 — the correction touched STYLES ONLY; the section markup keeps
  // the same component inventory and its human-written lowercase phrases.
  it('the components section renders the same inventory with its prose labels', () => {
    const h = renderComponents();
    const used = new Set([...h.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
    expect([...used].sort()).toEqual([
      'btn', 'btn-ink', 'btn-red', 'card', 'card-body', 'card-title', 'field',
      'field-label', 'lbl', 'lnk', 'mark', 'mark-fail', 'mark-pass', 'mark-warn',
      'mk', 'pdot', 'pill', 'pill-ink', 'pill-quiet', 'pill-red', 'seg',
      'seg-cell', 'seg-radio', 't-body-sm', 't-heading-md', 'use-cell',
      'use-grid', 'use-label', 'use-row',
    ]);
    expect(h).toContain('<span class="field-label">e-post</span>');
    expect(h).toContain('<span class="field-label">naam</span>');
  });

  it('the theme bar renders its switch label as prose beside the skin tabs', () => {
    const h = renderThemeBar();
    expect(h).toContain('<span class="theme-switch-label">theme</span>');
    expect([...h.matchAll(/class="th-tab"/g)].length).toBeGreaterThanOrEqual(3);
  });
});
