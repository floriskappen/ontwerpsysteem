import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkMotionTokens,
  checkMotionRecipes,
  checkLanguageExamples,
  checkShippedMotionCss,
  checkShippedCssDocument,
  extractShippedCss,
  collectMotionInputs,
  checkMotionContract,
} from '../scripts/lib/motion-contract.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { checkKeyframeCoverage, cssEntriesUnder } from '../scripts/lib/keyframe-coverage.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Fixture shorthand for the authored-surface gates.
const tokens = (json) => [{ file: 'primitive/motion.tokens.json', json }];
const recipes = (...list) => [{ file: 'design-system/recipes/motion.recipes.json', recipes: list }];
const language = (markdown) => [{ file: 'design-system/language/motion.md', markdown }];

describe('motion contract — authored motion values', () => {
  // Spec: propagation-validation / Scenario: Smooth interaction affordance fails
  // validation — an authored motion value declaring continuous easing fails and is
  // identified by path.
  it('a cubic-bezier easing token fails, naming the token path', () => {
    const { errors } = checkMotionTokens(
      tokens({ easing: { $type: 'cubicBezier', paper: { $value: [0.22, 0.61, 0.36, 1] } } }),
    );
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].rule).toBe('motion-contract');
    expect(errors[0].message).toContain('easing.paper');
  });

  // The audited defect, verbatim: motion.duration.hover / motion.duration.transition
  // advertised smooth interaction timing the language forbids.
  it('an interaction-flavoured duration token fails', () => {
    const { errors } = checkMotionTokens(
      tokens({ duration: { hover: { $value: '200ms' }, transition: { $value: '240ms' } } }),
    );
    expect(errors.map((e) => e.message).join('\n')).toMatch(/duration\.hover/);
    expect(errors.map((e) => e.message).join('\n')).toMatch(/duration\.transition/);
  });

  // Spec: Scenario: Stepped motion with reduced-motion coverage passes — periodic
  // loop lengths are exactly what the value layer may still carry.
  it('periodic loop lengths pass untouched', () => {
    const { errors } = checkMotionTokens(
      tokens({
        duration: {
          bloom: { $value: '180ms' },
          'breathe-min': { $value: '7s' },
          'drift-1': { $value: '38s' },
        },
      }),
    );
    expect(errors).toEqual([]);
  });
});

describe('motion contract — authored recipes', () => {
  it('a recipe declaring a transition or easing in a declarative field fails, naming the field', () => {
    for (const recipe of [
      { id: 'motion.clock.stepped', useWhen: 'apply transition: opacity 200ms on hover' },
      { id: 'motion.clock.stepped', intent: 'quiet ease-in-out drift' },
      { id: 'motion.clock.stepped', notes: 'cubic-bezier(0.4, 0, 0.2, 1) throughout' },
    ]) {
      const { errors } = checkMotionRecipes(recipes(recipe));
      expect(errors.length, JSON.stringify(recipe)).toBe(1);
      expect(errors[0].message).toMatch(/useWhen|intent|notes/);
    }
  });

  // Naming what a recipe rejects is not declaring it — the exemption the real
  // motion.clock.stepped recipe relies on.
  it('the avoid field may name the rejected smooth affordances', () => {
    const { errors } = checkMotionRecipes(
      recipes({
        id: 'motion.clock.stepped',
        avoid: 'smooth easing affordances (ease, ease-in-out, linear, cubic-bezier) and every interaction transition',
      }),
    );
    expect(errors).toEqual([]);
  });

  it('a recipe with no smooth-motion vocabulary passes', () => {
    const { errors } = checkMotionRecipes(
      recipes({
        id: 'motion.clock.stepped',
        intent: 'system stepped animation clock',
        useWhen: 'all periodic animations',
        notes: 'evaluated at 8fps using steps() keyframe timing',
      }),
    );
    expect(errors).toEqual([]);
  });
});

describe('motion contract — language examples', () => {
  const example = (css) => language(`# Motion\n\n\`\`\`css\n${css}\n\`\`\`\n`);

  // Spec: design-language / Scenario: Smooth motion affordances are rejected by
  // the documented contract — a code example cannot smuggle smooth motion past
  // the reader even when the prose is clean.
  it('a fenced example declaring a hover transition or smooth easing fails, naming the affordance', () => {
    for (const css of [
      '.btn:hover { background: var(--x); transition: background 240ms ease-in-out; }',
      '.bloom i { animation: ontwerp-d1 38s cubic-bezier(0.22, 0.61, 0.36, 1) infinite; }',
      '.grid i { animation: ontwerp-bo 9s linear infinite; }',
    ]) {
      const { errors } = checkLanguageExamples(example(css));
      expect(errors.length, css).toBe(1);
      expect(errors[0].message).toMatch(/smooth-motion affordance/);
    }
  });

  it('normative prose may name the prohibitions without tripping the gate', () => {
    const md =
      '# Motion\n\nInteractions are immediate: no transitions and no smooth easing\n(`ease`, `ease-in-out`, any `cubic-bezier()` curve) anywhere in the\ninteraction path.\n';
    expect(checkLanguageExamples(language(md)).errors).toEqual([]);
  });

  it('a stepped example passes', () => {
    const { errors } = checkLanguageExamples(
      example('.grid i { animation: ontwerp-bo var(--d) steps(72) infinite; }'),
    );
    expect(errors).toEqual([]);
  });
});

describe('motion contract — extracting shipped CSS from the built page', () => {
  // The built zoo page carries more than one <style> block (bundle styles, then
  // demo/skin styles). A gate that read only the first would let smooth motion
  // ship from a later block with every check green.
  it('smooth motion in a later <style> block is still caught', () => {
    const html =
      '<style>.grid i { animation: ontwerp-bo var(--d) var(--tf, steps(64)) infinite; }</style>' +
      '<style>.th-cream:checked ~ .card { transition: opacity 240ms ease-in-out; }</style>';
    const { errors } = checkShippedMotionCss([
      { file: 'zoo/index.html', css: extractShippedCss(html) },
    ]);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.map((e) => e.message).join(' ')).toMatch(/transition/);
  });

  it('inline style attributes are checked too', () => {
    const errors = checkShippedMotionCss([
      { file: 'zoo/index.html', css: extractShippedCss('<i style="--tf:ease-in-out"></i>') },
    ]).errors;
    // errors carry {file, rule, path, message} objects — assert on the message text
    expect(errors.map((e) => e.message).join(' ')).toMatch(/--tf/);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('motion contract — shipped CSS', () => {
  // Spec: propagation-validation / Scenario: Smooth interaction affordance fails
  // validation — a shipped interaction rule with a generic transition fails and
  // is identified.
  it('an interaction transition declaration fails, naming the rule', () => {
    const errors = checkShippedCssDocument(
      '.ontwerp .btn:hover { background: var(--x); transition: background 240ms ease-out; }',
    );
    expect(errors.some((e) => /transition/.test(e))).toBe(true);
    expect(errors.join(' ')).toMatch(/interactions are immediate/);
  });

  // Spec: Scenario: Smooth atmosphere timing fails validation — `ease`,
  // `linear`, or cubic easing on the periodic atmosphere animation fails and
  // identifies the animation.
  it.each([
    ['ease-in-out', '.grid i { animation: ontwerp-bo 9s ease-in-out infinite; }'],
    ['ease', '.bloom .b1 { animation: ontwerp-d1 38s ease infinite alternate; }'],
    ['linear', '.wx-rain .wxc { animation: ontwerp-wx-rain 3s linear infinite; }'],
    [
      'cubic-bezier',
      '.bloom .b2 { animation: ontwerp-d2 51s cubic-bezier(0.22, 0.61, 0.36, 1) infinite alternate; }',
    ],
  ])('%s periodic timing fails', (_label, css) => {
    const errors = checkShippedCssDocument(css);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.join(' ')).toMatch(/periodic motion must step/);
  });

  it('linear-gradient geometry is not mistaken for a clock', () => {
    expect(checkShippedCssDocument('.bloom .b3 { background: radial-gradient(circle, var(--x) 0%, transparent 60%); }')).toEqual([]);
    expect(checkShippedCssDocument('.sheet { background: repeating-linear-gradient(45deg, #000 0 2px, transparent 2px 4px); }')).toEqual([]);
  });

  // The shipped form of the correction: literal step counts and var()-carried
  // step counts both read as stepped.
  it.each([
    ['literal steps', '@keyframes ontwerp-bo { 0%,100% { --bo: var(--a); } 50% { --bo: var(--b); } } .grid i { animation: ontwerp-bo 9s steps(72) infinite; }'],
    ['var-carried steps', '.grid i { --tf: steps(64); animation: ontwerp-bo var(--d) var(--tf, steps(64)) infinite; }'],
  ])('%s passes', (_label, css) => {
    expect(checkShippedCssDocument(css)).toEqual([]);
  });

  // Spec: Scenario: Stepped motion with reduced-motion coverage passes — the two
  // halves of the full contract together, through BOTH gates: stepped timing
  // clears the motion gate while the retained keyframe-coverage gate still
  // demands the co-located rest pose.
  it('stepped timing plus a reduced-motion rest pose clears both retained gates', () => {
    const css = [
      '@keyframes ontwerp-demo { 0%, 100% { opacity: 0.08; } 50% { opacity: 0.16; } }',
      '.demo { animation: ontwerp-demo 9s steps(72) infinite; }',
      '@media (prefers-reduced-motion: reduce) { .demo { animation: none; opacity: 0.08; } }',
    ].join('\n');
    expect(checkShippedMotionCss([{ file: 'shipped.css', css }]).errors).toEqual([]);
    expect(checkKeyframeCoverage([{ file: 'shipped.css', css }]).errors).toEqual([]);
  });

  it('dropping the rest pose still fails the retained coverage gate beside a clean motion scan', () => {
    const css = [
      '@keyframes ontwerp-demo { 0%, 100% { opacity: 0.08; } 50% { opacity: 0.16; } }',
      '.demo { animation: ontwerp-demo 9s steps(72) infinite; }',
    ].join('\n');
    expect(checkShippedMotionCss([{ file: 'shipped.css', css }]).errors).toEqual([]);
    expect(checkKeyframeCoverage([{ file: 'shipped.css', css }]).errors.length).toBe(1);
  });
});

describe('motion contract — the real shipped surfaces', () => {
  let dist;
  let builtPage;

  beforeAll(async () => {
    dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    builtPage = readFileSync(join(dist, 'zoo', 'index.html'), 'utf8');
  }, 60000);

  // End-to-end over what actually ships: authored tokens + recipes + language
  // AND the freshly built CSS bundle and zoo page, exactly as validate.mjs runs
  // the gate.
  it('every collected surface passes all four gates after a real build', () => {
    const inputs = collectMotionInputs({
      tokensDir: join(root, 'design-system', 'source', 'values'),
      recipesDir: join(root, 'design-system', 'recipes'),
      languageDir: join(root, 'design-system', 'language'),
      distDir: dist,
    });
    const { errors } = checkMotionContract(inputs);
    expect(errors, errors.map((e) => `${e.file}: ${e.message}`).join('\n')).toEqual([]);
  });

  it('the built page animates stepped — no smooth easing survives the build transform', () => {
    const shipped = extractShippedCss(builtPage);
    expect(shipped.replace(/\/\*[\s\S]*?\*\//g, '')).toMatch(/steps\(/);
    expect(shipped).not.toMatch(/\bease(?:-in-out|-in|-out)?\b|\bcubic-bezier\s*\(/);
  });

  it('the atmosphere grid cells carry their per-cell step count from the generator', () => {
    expect(builtPage).toMatch(/--tf:steps\(\d+\)/);
  });
});
