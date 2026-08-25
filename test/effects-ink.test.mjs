import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { extractShippedCss } from '../scripts/lib/motion-contract.mjs';
import {
  tmpDir,
  customProps,
  EFFECT_INK_FAMILIES,
  collectEffectInk,
  effectInkViolations,
  effectInkCoverageGaps,
  resolveInk,
} from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realTokens = join(root, 'design-system', 'source', 'values');
const SKINS_SOURCE = join(root, 'design-system', 'source', 'skins', 'skins.json');

// One shared build of the real system; both consumer CSS forms are inspected.
let _built;
function builtOnce() {
  if (!_built) {
    const dist = tmpDir();
    _built = runBuild({ tokensDir: realTokens, distDir: dist }).then(() => ({
      dist,
      page: readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'),
      tokensScoped: readFileSync(join(dist, 'css', 'tokens.scoped.css'), 'utf8'),
      effectsScoped: readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8'),
      releaseSkinsDir: join(dist, 'release', 'values', 'css', 'skins'),
    }));
  }
  return _built;
}

const SOURCE = JSON.parse(readFileSync(SKINS_SOURCE, 'utf8'));
const ALTERNATE_SKINS = SOURCE.filter((s) => !s.base);
const BASE_INK = '#1f1b16'; // the built base token CSS's --color-ink (asserted below)

// The custom-property map a shipped skin file declares (both adoption forms
// carry the same declarations — asserted by the skins suite).
function skinOverrides(skinsDir, id) {
  return customProps(readFileSync(join(skinsDir, `${id}.css`), 'utf8'));
}

// The two consumer CSS forms, as [label, text] pairs.
async function builtForms() {
  const { page, effectsScoped } = await builtOnce();
  return [
    ['root (zoo page)', extractShippedCss(page)],
    ['scoped (effects.scoped.css)', effectsScoped],
  ];
}

describe('effect ink follows the selected skin — built outputs', () => {
  // Spec: showcase / Scenario: The swap cascades through the built output alone
  // (no hardcoded effect ink literals); distribution / Scenario: Effect CSS
  // keeps ink skin-aware. Both consumer CSS forms are inspected after a build.
  it('carries no stranded cream literal and no unroled ink in either CSS form', async () => {
    for (const [form, css] of await builtForms()) {
      expect(effectInkViolations(css).map((v) => v.message), form).toEqual([]);
      // and nothing drifted out of the gate's sight
      expect(effectInkCoverageGaps(css).map((v) => v.message), form).toEqual([]);
    }
  });

  // Vacuity guard, positive form: every family is found in BOTH forms with all
  // its paint declarations, so a selector rename can never make this suite a
  // test that cannot fail.
  it('finds every effect family and all its paint declarations in both forms', async () => {
    const expected = new Set(EFFECT_INK_FAMILIES.map((f) => f.family));
    for (const [form, css] of await builtForms()) {
      const families = new Set(collectEffectInk(css).map((e) => e.family));
      expect(families, form).toEqual(expected);
    }
    // each family contributes every declaration the contract names
    const scopedCss = (await builtForms())[1][1];
    const scopedDecls = collectEffectInk(scopedCss);
    for (const fam of EFFECT_INK_FAMILIES) {
      expect(scopedDecls.filter((e) => e.family === fam.family).length, fam.family).toBe(fam.props.length);
    }
  });

  // Spec: propagation-validation / Scenario: All shipped skins recolour ink
  // effects — every alternate skin's own ink resolves into grid, wind streaks
  // and motes, rain drops and splashes, and snow outlines, in root AND scoped
  // generated CSS, via the shipped skin files themselves.
  it('resolves every effect declaration to each alternate skin ink, in both forms', async () => {
    const { tokensScoped, releaseSkinsDir } = await builtOnce();
    const forms = (await builtForms()).map(([form, css]) => [form, collectEffectInk(css)]);
    for (const skin of ALTERNATE_SKINS) {
      const override = skinOverrides(releaseSkinsDir, skin.id);
      const skinInk = override.get('--color-ink');
      expect(skinInk, `${skin.id} declares --color-ink`).toBeTruthy();
      for (const [form, decls] of forms) {
        expect(decls.length, `${form} carries declarations`).toBeGreaterThan(0);
        for (const entry of decls) {
          const resolved = resolveInk(entry.value, skinInk);
          expect(resolved, `${skin.id}: ${form} ${entry.family} ${entry.property}`).toContain(
            skinInk.toLowerCase(),
          );
        }
      }
    }

    // The propagation is real colour movement, not lexical: skins carry
    // pairwise-distinct inks, so distinct skins must paint distinct colours.
    const inks = ALTERNATE_SKINS.map((s) => skinOverrides(releaseSkinsDir, s.id).get('--color-ink'));
    expect(new Set(inks.map((c) => c.toLowerCase())).size).toBe(inks.length);

    // And the base palette still computes the exact colour the removed literal
    // held: rgb(31 27 22) — the accepted visual baseline is preserved by
    // construction, not by assumption.
    const baseInk = customProps(tokensScoped).get('--color-ink');
    expect(baseInk?.toLowerCase()).toBe(BASE_INK);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(BASE_INK.slice(i, i + 2), 16));
    expect([r, g, b]).toEqual([31, 27, 22]);
  });
});

describe('effect ink follows the selected skin — stranded-literal fixture', () => {
  // Spec: propagation-validation / Scenario: A stranded effect ink literal
  // fails. A reintroduced cream literal must fail the regression naming the
  // affected effect family and declaration — exercised here against a fixture
  // that replays the exact defect this change corrected.
  it('a reintroduced cream literal fails, naming the family and declaration', () => {
    const fixture = `
.mote { position: absolute; top: var(--y); left: -4%; width: var(--sz); height: var(--sz);
  background: rgb(31 27 22 / var(--o)); will-change: left, transform; }
.flake { position: absolute; top: -10%; left: var(--x); width: var(--sz); height: var(--sz);
  border: 1px solid rgb(31 27 22 / 0.55); opacity: 0; }
`;
    const violations = effectInkViolations(fixture);
    const messages = violations.map((v) => v.message);
    expect(violations.some((v) => v.kind === 'literal' && v.family === 'motes' && /background/.test(v.message))).toBe(true);
    expect(violations.some((v) => v.kind === 'literal' && v.family === 'snow outlines' && /border/.test(v.message))).toBe(true);
    expect(messages.join('\n')).toMatch(/base cream ink literal/);
    expect(messages.join('\n')).toMatch(/--color-ink/);
  });

  // The same fixture repaired the way the change repairs it passes clean —
  // and a DIFFERENT hardcoded colour is caught too, not just the cream one.
  it('the roled repair of the same fixture passes, and any other literal fails', () => {
    const fixed = `
.mote { position: absolute; top: var(--y); left: -4%; width: var(--sz); height: var(--sz);
  background: rgb(from var(--color-ink) r g b / var(--o)); will-change: left, transform; }
.flake { position: absolute; top: -10%; left: var(--x); width: var(--sz); height: var(--sz);
  border: 1px solid rgb(from var(--color-ink) r g b / 0.55); opacity: 0; }
`;
    expect(effectInkViolations(fixed)).toEqual([]);

    const offPalette = '.mote { background: #000000; }';
    const violations = effectInkViolations(offPalette);
    expect(violations.some((v) => v.kind === 'role-missing' && v.family === 'motes')).toBe(true);
  });
});
