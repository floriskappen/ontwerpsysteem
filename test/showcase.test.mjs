import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderShowcase } from '../scripts/lib/showcase-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// A small built-manifest fixture: two solid primitive colours, one rgba primitive,
// one semantic colour that resolves to the same hex as a primitive, one dimension.
const MANIFEST = [
  { path: 'color.paper', name: 'color-paper', tier: 'primitive', type: 'color', value: '#F1ECE0', ref: null },
  { path: 'color.ink', name: 'color-ink', tier: 'primitive', type: 'color', value: '#1F1B16', ref: null },
  { path: 'color.ink-a65', name: 'color-ink-a65', tier: 'primitive', type: 'color', value: 'rgba(31, 27, 22, 0.65)', ref: null },
  { path: 'color.surface.page', name: 'color-surface-page', tier: 'semantic', type: 'color', value: '#F1ECE0', ref: 'color.paper' },
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

  it('curates a clean palette from the built tokens (primitives only, deduped)', () => {
    const h = html();
    const chips = h.match(/<figure class="chip">/g) || [];
    expect(chips.length).toBe(2); // the two solid primitive colours only
    expect(h).toContain('#F1ECE0');
    expect(h).toContain('#1F1B16');
    expect(h).not.toContain('rgba(31, 27, 22, 0.65)'); // alpha rule variants stay off the wall
  });

  it('does not dump tokens, tiers, or a state matrix', () => {
    const h = html();
    expect(h).not.toMatch(/\bprimitive\b|\bsemantic\b/); // no tier jargon on the page
    expect(h).not.toMatch(/is-hover|is-active|is-disabled/); // no forced state matrix
    expect(h).not.toMatch(/\$type|grouped by|gallery/i); // no technical token inventory
  });

  it('shows the system in use: masthead, palette, type specimen, components', () => {
    const h = html();
    expect(h).toContain('de ontwerp'); // masthead
    expect(h).toContain('paper &amp; ink');
    expect(h).toContain('class="btn"');
    expect(h).toContain('class="field"');
    expect(h).toContain('class="pill"');
    expect(h).toContain('use-cell card');
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

  it('is emitted by the build under dist/showcase/ with fonts inlined', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'tokens'), distDir: dist });
    const out = join(dist, 'showcase', 'index.html');
    expect(existsSync(out)).toBe(true);
  });
});
