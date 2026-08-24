import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The accepted pre-refactor zoo, frozen as the visual/behavioural source of truth.
const BASELINE = join(root, 'design-system', 'reference', 'accepted-zoo', 'generated', 'index.html');

// Pull every CSS selector out of the page's <style> block, split by media context:
// `plain` selectors apply unconditionally; `reducedMotion` selectors sit inside a
// `@media (prefers-reduced-motion: reduce)` block. The modular CSS is one rule per
// line, so a selector is the text before the first `{` on a rule line; @media
// preludes are context, not selectors, and never enter either set. This split
// exists because C7 relocated the reduced-motion rest frames between modules (the
// baseline carried them in responsive.css); the unconditional surface — what every
// viewer sees — is still compared exactly as before, baseline subset of built.
// Keyframe identifiers are compared modulo the `ontwerp-` namespace prefix: the
// scoped-distribution change renamed every shipped keyframe at source
// (`germinate` → `ontwerp-germinate`), and the baseline predates that. Only the
// identifier differs — the frames and their consumers are checked as usual.
function collectSelectors(html) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
  const plain = new Set();
  const reducedMotion = new Set();
  const mediaStack = []; // one entry per open @media block: does it gate reduced motion?
  for (const rawLine of style.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^@media\b/.test(line) && line.endsWith('{')) {
      mediaStack.push(/prefers-reduced-motion\s*:\s*reduce/.test(line));
      continue;
    }
    if (line === '}') {
      mediaStack.pop();
      continue;
    }
    const brace = line.indexOf('{');
    if (brace <= 0) continue; // continuation or closing lines of multi-line blocks
    const head = line.slice(0, brace).trim();
    if (!head) continue;
    // @keyframes are compared, modulo the ontwerp- prefix (see note above); other
    // at-rule preludes (@property, @font-face) are not selectors.
    const isKeyframes = head.startsWith('@keyframes');
    if (!isKeyframes && head.startsWith('@')) continue;
    const normalised = isKeyframes
      ? head.replace(/^@keyframes (?:ontwerp-)?/, '@keyframes ')
      : head;
    // Selector lists are compared per individual selector, so a relocation that
    // regroups a combined rule is judged on coverage, not on grouping.
    const target = mediaStack.at(-1) ? reducedMotion : plain;
    for (const sel of normalised.split(',').map((s) => s.trim()).filter(Boolean)) target.add(sel);
  }
  return { plain, reducedMotion };
}

// The relocation record for the rest frames C7 moved out of responsive.css. Two of
// the baseline's combined low-specificity selectors could never have won the
// cascade against the animation rules they meant to stop (`.bloom i` (0,1,1) vs
// `.bloom .b1` (0,2,0); `.wxc` (0,1,0) vs `.wx-rain .wxc` (0,2,0)), so the move
// re-specifies them per animation selector. Each maps to the exact replacement
// selectors the rebuilt page must carry; everything else must survive verbatim.
const RELOCATED_REST_FRAMES = {
  '.bloom i': ['.bloom .b1', '.bloom .b2', '.bloom .b3'],
  '.wxc': [
    '.wx-drift .wxc', '.wx-fireflies .wxc', '.wx-leaves .wxc', '.wx-mist .wxc',
    '.wx-rain .wxc', '.wx-snow .wxc', '.wx-sun .wxc', '.wx-wind .wxc',
  ],
};

describe('zoo visual parity with the accepted baseline', () => {
  it('keeps every unconditional CSS selector the accepted baseline defines (no dropped styling)', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const built = collectSelectors(readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'));
    const base = collectSelectors(readFileSync(BASELINE, 'utf8'));

    const missing = [...base.plain].filter((sel) => !built.plain.has(sel));
    expect(missing, `modular zoo dropped accepted CSS rules:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('keeps every reduced-motion rest frame the baseline defines (C7 relocations recorded)', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const built = collectSelectors(readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'));
    const base = collectSelectors(readFileSync(BASELINE, 'utf8'));

    expect(base.reducedMotion.size, 'the baseline does carry rest frames').toBeGreaterThan(0);
    const problems = [];
    for (const sel of [...base.reducedMotion].sort()) {
      const replacements = RELOCATED_REST_FRAMES[sel];
      if (replacements) {
        for (const r of replacements) {
          if (!built.reducedMotion.has(r)) problems.push(`${sel} was relocated but ${r} is missing`);
        }
      } else if (!built.reducedMotion.has(sel)) {
        problems.push(`rest frame ${sel} vanished from the rebuilt page`);
      }
    }
    // And the rebuild covers strictly more than the baseline did: the per-glyph
    // header weather (S26) now rests too.
    expect(built.reducedMotion.size).toBeGreaterThan(base.reducedMotion.size);
    expect(problems, problems.join('\n  ')).toEqual([]);
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
