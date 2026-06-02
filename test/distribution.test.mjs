import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runBuild, assembleBundle } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Recursively map every file in a dir to a content hash, keyed by relative path.
function fileHashes(dir) {
  const out = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p)] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return out;
}

describe('consumer bundle (distribution)', () => {
  it('contains the full agent-readable surface', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const rel = join(dist, 'release');

    const required = [
      'AGENTS.md', 'README.md', 'brief.md', 'CHANGELOG.md', 'VERSION',
      'templates/DESIGN.md',
      'values/css/tokens.css', 'values/js/tokens.js', 'values/manifest/tokens.json', 'values/tailwind/theme.css',
      'language/motion.md', 'language/anti-goals.md',
      'recipes/index.json',
      'zoo/index.html', 'zoo/source/index.mjs',
      'fonts/archivo-latin.woff2',
    ];
    const missing = required.filter((f) => !existsSync(join(rel, f)));
    expect(missing, `bundle missing: ${missing.join(', ')}`).toEqual([]);

    // the consumer AGENTS.md is the consumer variant, not the dev one
    expect(readFileSync(join(rel, 'AGENTS.md'), 'utf8')).toContain('consumer bundle');
  });

  it('excludes development machinery', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const rel = join(dist, 'release');

    for (const junk of ['scripts', 'test', 'openspec', 'reference', 'package.json', 'node_modules', 'design-system']) {
      expect(existsSync(join(rel, junk)), `bundle should not contain ${junk}`).toBe(false);
    }
  });

  it('is deterministic — re-assembly from unchanged inputs is byte-identical', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const first = fileHashes(join(dist, 'release'));
    assembleBundle(root, dist); // rewrite the bundle from the same inputs
    const second = fileHashes(join(dist, 'release'));
    expect(second).toEqual(first);
  });
});
