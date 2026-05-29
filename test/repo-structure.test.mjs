import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { collectTokenFiles } from '../scripts/lib/validate-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir, treesEqual } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('repo-structure', () => {
  it('File outside the tier directories is rejected', () => {
    const dir = tmpDir();
    // A token file directly under tokens/, not in a tier subdirectory.
    writeFileSync(join(dir, 'stray.tokens.json'), JSON.stringify({ a: { $type: 'color', $value: '#fff' } }));
    const { errors } = collectTokenFiles(dir);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('structure');
    expect(errors[0].file).toBe('stray.tokens.json');
  });

  it('Outputs are reproducible and ignored', async () => {
    const a = tmpDir();
    const b = tmpDir();
    await runBuild({ tokensDir: join(root, 'tokens'), distDir: a });
    await runBuild({ tokensDir: join(root, 'tokens'), distDir: b });
    expect(treesEqual(a, b)).toBe(true);

    // dist/ is git-ignored.
    const ignored = execFileSync('git', ['check-ignore', 'dist'], { cwd: root }).toString().trim();
    expect(ignored).toBe('dist');
  });

  it('Clean install runs the pipeline (scripts and deps are declared)', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.validate).toBeTruthy();
    expect(pkg.scripts.build).toBeTruthy();
    for (const dep of ['style-dictionary', 'ajv', 'vitest']) {
      expect(pkg.devDependencies[dep]).toBeTruthy();
    }
  });
});
