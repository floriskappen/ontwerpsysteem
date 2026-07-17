import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realTokens = join(root, 'design-system', 'source', 'values');

function buildManifest() {
  const dist = tmpDir();
  return runBuild({ tokensDir: realTokens, distDir: dist }).then(() =>
    JSON.parse(readFileSync(join(dist, 'manifest', 'tokens.json'), 'utf8')),
  );
}

describe('build-pipeline: token manifest', () => {
  it('carries per-token metadata', async () => {
    const manifest = await buildManifest();
    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest.length).toBeGreaterThan(0);
    for (const e of manifest) {
      expect(typeof e.path).toBe('string');
      expect(typeof e.name).toBe('string');
      expect(['primitive', 'semantic', 'component']).toContain(e.tier);
      expect(typeof e.type).toBe('string');
      expect(e.value).toBeDefined();
      expect('ref' in e).toBe(true);
    }
    // description carried through when present on the source token
    expect(manifest.some((e) => typeof e.description === 'string')).toBe(true);
  });

  it('aliased token records its reference with a determinable tier', async () => {
    const manifest = await buildManifest();
    const alias = manifest.find((e) => e.ref);
    expect(alias).toBeDefined();
    // resolved value is present alongside the raw alias
    expect(alias.value).toBeTruthy();
    // the referenced token resolves to an entry whose tier is known
    const target = manifest.find((e) => e.path === alias.ref);
    expect(target).toBeDefined();
    expect(['primitive', 'semantic', 'component']).toContain(target.tier);
  });

  // Spec: "Aliased token records its full chain" + "Manifest carries per-token metadata".
  it('manifest records full alias chain', async () => {
    const manifest = await buildManifest();
    const byPath = new Map(manifest.map((e) => [e.path, e]));

    // the worked example: component → semantic → primitive
    const btn = byPath.get('button.border.default');
    expect(btn).toBeDefined();
    expect(btn.ref).toBe('color.border.strong');
    expect(btn.chain).toEqual(['color.border.strong', 'color.ink-a95']);
    expect(byPath.get(btn.chain.at(-1)).tier).toBe('primitive');

    for (const e of manifest) {
      if (!e.ref) {
        // non-alias tokens carry no chain
        expect(e.chain, `${e.path} holds a raw value`).toBeUndefined();
        continue;
      }
      // the chain starts at the immediate reference…
      expect(e.chain[0], `${e.path} chain starts at its ref`).toBe(e.ref);
      // …every member exists in the manifest with a determinable tier…
      for (const p of e.chain) {
        const member = byPath.get(p);
        expect(member, `chain member ${p} of ${e.path} exists`).toBeDefined();
        expect(['primitive', 'semantic', 'component']).toContain(member.tier);
      }
      // …and it ends at the token holding the raw value
      expect(byPath.get(e.chain.at(-1)).ref, `${e.path} chain ends at a raw value`).toBeNull();
    }
  });

  it('is deterministic', async () => {
    const a = await buildManifest();
    const b = await buildManifest();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
