import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { runBuild, BuildAborted } from '../scripts/lib/build-core.mjs';
import { tmpDir, treesEqual } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realTokens = join(root, 'design-system', 'source', 'values');

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

  it('Stable name derivation (color.text.default → --color-text-default)', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: dist });
    const css = readFileSync(join(dist, 'css', 'tokens.css'), 'utf8');
    expect(css).toMatch(/--color-text-default:/);
  });

  it('Emits all three platform artifacts', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: dist });
    expect(existsSync(join(dist, 'css', 'tokens.css'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'tokens.js'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'tokens.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'tailwind', 'theme.css'))).toBe(true);
  });
});
