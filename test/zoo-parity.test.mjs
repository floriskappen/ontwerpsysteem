import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The accepted pre-refactor zoo, frozen as the visual/behavioural source of truth.
const BASELINE = join(root, 'design-system', 'reference', 'accepted-zoo', 'generated', 'index.html');

// Pull every top-level CSS selector out of the page's <style> block. The modular
// CSS is one rule per line, so a selector is the text before the first `{` on a
// line that hasn't already opened/closed a block. This is deliberately coarse —
// it only needs to catch a whole rule (e.g. `.palette`, `.sw-chip`) going missing.
function selectors(html) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
  const set = new Set();
  for (const line of style.split('\n')) {
    const m = line.match(/^([^{}]*)\{/);
    const sel = m && m[1].trim();
    if (sel) set.add(sel);
  }
  return set;
}

describe('zoo visual parity with the accepted baseline', () => {
  it('keeps every CSS selector the accepted baseline defines (no dropped styling)', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const built = selectors(readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'));
    const base = selectors(readFileSync(BASELINE, 'utf8'));

    const missing = [...base].filter((sel) => !built.has(sel));
    expect(missing, `modular zoo dropped accepted CSS rules:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('introduces no newly-unstyled class versus the baseline', async () => {
    // Classes emitted in the body that no CSS rule targets. The accepted baseline
    // already carries a couple of harmless no-op classes (e.g. sw-ink); this guards
    // against the rebuild making a *previously styled* class go unstyled.
    const unstyled = (html) => {
      const body = html.slice(html.indexOf('</style>'));
      const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
      const used = new Set();
      for (const attr of body.matchAll(/class="([^"]+)"/g)) {
        for (const cls of attr[1].split(/\s+/)) if (cls) used.add(cls);
      }
      return new Set([...used].filter((cls) => !style.includes(`.${cls}`)));
    };

    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const built = unstyled(readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'));
    const base = unstyled(readFileSync(BASELINE, 'utf8'));

    const regressed = [...built].filter((cls) => !base.has(cls));
    expect(regressed, `classes that lost their CSS in the rebuild:\n  ${regressed.join('\n  ')}`).toEqual([]);
  });
});
