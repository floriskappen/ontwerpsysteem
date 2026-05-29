import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderShowcase } from '../scripts/lib/showcase-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const MANIFEST = [
  { path: 'color.brand.base', name: 'color-brand-base', tier: 'primitive', type: 'color', value: '#3b5bdb', ref: null, description: 'Brand.' },
  { path: 'color.text.muted', name: 'color-text-muted', tier: 'semantic', type: 'color', value: '#3b5bdb', ref: 'color.brand.base' },
  { path: 'space.sm', name: 'space-sm', tier: 'primitive', type: 'dimension', value: '8px', ref: null },
];
const TOKEN_CSS = ':root { --color-brand-base: #3b5bdb; --color-text-muted: #3b5bdb; --space-sm: 8px; }';

const html = () => renderShowcase({ manifest: MANIFEST, tokenCss: TOKEN_CSS });

const demoBlock = (h) => h.split('DEMO-STYLES-START')[1].split('DEMO-STYLES-END')[0];

describe('showcase', () => {
  it('renders every manifest token grouped by tier and type', () => {
    const h = html();
    for (const e of MANIFEST) expect(h).toContain(`--${e.name}`);
    expect(h).toContain('primitive');
    expect(h).toContain('semantic');
    // type groupings appear
    expect(h).toContain('color');
    expect(h).toContain('dimension');
  });

  it('shows alias resolution', () => {
    expect(html()).toContain('color.brand.base'); // the referenced token path
  });

  it('renders the curated demo elements with the full state matrix', () => {
    const h = html();
    for (const c of ['zoo-button', 'zoo-input', 'zoo-checkbox', 'zoo-democard', 'zoo-badge', 'zoo-alert']) {
      expect(h).toContain(c);
    }
    for (const s of ['is-hover', 'is-active', 'is-focus', 'is-disabled', 'is-loading', 'is-error']) {
      expect(h).toContain(s);
    }
  });

  it('honours reduced motion and provides a visible focus indicator', () => {
    const h = html();
    expect(h).toContain('prefers-reduced-motion');
    expect(h).toContain(':focus-visible');
  });

  it('styles demo elements with tokens only (no literals in the demo block)', () => {
    const block = demoBlock(html());
    expect(block).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); // no hex colors
    expect(block).not.toMatch(/rgba?\(/); // no rgb colors
    expect(block).not.toMatch(/\d+(px|rem|em|%)/); // no literal sizes
    expect(block).toContain('var(--');
  });

  it('is self-contained (no network/external references) and inlines its inputs', () => {
    const h = html();
    expect(h).not.toMatch(/https?:\/\//);
    expect(h).not.toMatch(/<link\b/);
    expect(h).not.toMatch(/<script[^>]*\bsrc=/);
    expect(h).toContain('--color-brand-base: #3b5bdb'); // token CSS inlined
  });

  it('is deterministic for identical input', () => {
    expect(html()).toBe(html());
  });

  it('is emitted by the build under dist/showcase/', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'tokens'), distDir: dist });
    expect(existsSync(join(dist, 'showcase', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'manifest', 'tokens.json'))).toBe(true);
  });
});
