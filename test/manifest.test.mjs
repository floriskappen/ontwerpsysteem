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

  it('is deterministic', async () => {
    const a = await buildManifest();
    const b = await buildManifest();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
