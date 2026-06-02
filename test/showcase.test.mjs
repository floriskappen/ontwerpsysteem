import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderShowcase } from '../scripts/lib/showcase-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

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
    expect(h).toContain('radial-gradient(rgb(31 27 22) 1px'); // the halftone dots
    expect(h).toContain('border-bottom-width: 3px'); // heavier button bottom-edge
    expect(h).not.toMatch(/transition\s*:/); // interactions are instant — no CSS transitions (keyframe animations, incl. steps(), are fine)
  });

  it('reskins the whole page by swapping only colour roles, illustratively, with no script', () => {
    const h = html();
    expect(h).toContain('class="theme-bar"'); // a top-of-page switcher, not a contained preview
    expect(h).toContain('illustrative'); // not misrepresented as shipped tokens
    expect(h).toContain('body:has(#th-lilac:checked)'); // CSS-only, whole-page switch
    expect(h).not.toContain('th-stage'); // the old contained preview panel is gone
    // the skins override only colour roles — never type or spacing
    const overrides = [...h.matchAll(/body:has\(#th-\w+:checked\) \{([^}]*)\}/g)].map((m) => m[1]).join(' ');
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
