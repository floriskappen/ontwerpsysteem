import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { checkKeyframeCoverage, cssEntriesUnder } from '../scripts/lib/keyframe-coverage.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Fixture shorthand: one keyframe, one animation rule, optional reduced-motion text.
const fixture = ({ keyframes, usage, reduced }) =>
  [
    keyframes ?? '@keyframes ontwerp-demo { 0% { opacity: 0; } 100% { opacity: 1; } }',
    usage ?? '.demo { animation: ontwerp-demo 2s infinite; }',
    reduced ?? '',
  ].join('\n');

describe('keyframe-coverage gate', () => {
  // Spec: propagation-validation / Scenario: Uncovered keyframe fails
  it('a shipped keyframe with no reduced-motion rule fails, naming it', () => {
    const { errors } = checkKeyframeCoverage([{ file: 'shipped.css', css: fixture({}) }]);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('keyframe-coverage');
    expect(errors[0].message).toContain('ontwerp-demo');
  });

  // Requirement text: the rule must neutralise the keyframe "for the selectors that
  // reference it". Coverage demands the referencing selector EXACTLY (DECISIONS §1/§4):
  // a broader, lower-specificity rest rule — the old combined `.wxc { animation: none }`
  // shape that lost the cascade to `.wx-rain .wxc` — must NOT read as coverage, or the
  // inert-stylesheet regression this change fixes ships again under a green gate.
  it('a rest rule naming a different selector does not cover the referencing one', () => {
    const css = [
      '.wx-rain .wxc { animation: ontwerp-wx-rain 3s infinite; }',
      '@keyframes ontwerp-wx-rain { 0%, 100% { transform: translate(0, 0); opacity: 1; } 50% { transform: translate(1px, -2px); opacity: 0.8; } }',
      '@media (prefers-reduced-motion: reduce) { .wxc { animation: none; transform: none; opacity: 1; } }',
    ].join('\n');
    const { errors } = checkKeyframeCoverage([{ file: 'shipped.css', css }]);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('.wx-rain .wxc');
  });

  // Spec: propagation-validation / requirement text: a rule that stops the animation
  // without asserting a rest pose SHALL fail.
  it('stopping an animation without asserting a rest pose fails', () => {
    const css = fixture({
      reduced: '@media (prefers-reduced-motion: reduce) { .demo { animation: none; } }',
    });
    const { errors } = checkKeyframeCoverage([{ file: 'shipped.css', css }]);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/asserts no rest pose/);
    expect(errors[0].message).toContain('opacity'); // names what the keyframe animates
  });

  // Spec: propagation-validation / Scenario: Covered keyframe passes
  it('a stop-plus-rest rule passes for every animated property', () => {
    const css = fixture({
      // two animated properties, both must be declared by the rest pose
      keyframes:
        '@keyframes ontwerp-ripen { 0% { background: red; transform: scale(0.8); } 100% { background: blue; transform: scale(1); } }',
      usage: '.ripe { animation: ontwerp-ripen 4s infinite; }',
      reduced:
        '@media (prefers-reduced-motion: reduce) { .ripe { animation: none; background: blue; transform: scale(1); } }',
    });
    expect(checkKeyframeCoverage([{ file: 'shipped.css', css }]).errors).toEqual([]);
  });

  it('removal from the layout counts as a rest pose', () => {
    const css = fixture({
      usage: '.drop { top: -20%; animation: ontwerp-drop 3s infinite; }',
      reduced: '@media (prefers-reduced-motion: reduce) { .drop { display: none; } }',
    });
    expect(checkKeyframeCoverage([{ file: 'shipped.css', css }]).errors).toEqual([]);
  });

  it('a custom-property keyframe is covered by pinning the driven variable', () => {
    const base = [
      '.grid i { --bo: var(--a); animation: ontwerp-bo var(--d) infinite; }',
      '@property --bo { syntax: "<number>"; initial-value: 0.08; inherits: false; }',
      '@keyframes ontwerp-bo { 0%, 100% { --bo: var(--a); } 50% { --bo: var(--b); } }',
    ].join('\n');
    // forward reference: the animation declaration precedes its @keyframes
    expect(checkKeyframeCoverage([{ file: 'a.css', css: base }]).errors.length).toBe(1);
    const covered =
      base + '\n@media (prefers-reduced-motion: reduce) { .grid i { animation: none; --bo: var(--a); } }';
    expect(checkKeyframeCoverage([{ file: 'a.css', css: covered }]).errors).toEqual([]);
  });

  it('coverage may live in another file of the same shipped bundle', () => {
    // The bundle ships as several files; usage in one and the rest frame in
    // another (of the SAME scanned set) is still co-shipped coverage.
    const entries = [
      { file: 'dist/css/a.css', css: fixture({}) },
      {
        file: 'dist/css/b.css',
        css: '@media (prefers-reduced-motion: reduce) { .demo { animation: none; opacity: 1; } }',
      },
    ];
    expect(checkKeyframeCoverage(entries).errors).toEqual([]);
  });

  // Spec: propagation-validation / Scenario: A rest frame outside the shipped CSS
  // does not satisfy the gate
  it('a rest frame outside the scanned shipped output does not count', async () => {
    // Mirror the real wiring: the gate reads dist/css/** only. A stylesheet that
    // the build does not ship (responsive.css sat there for exactly this reason)
    // never enters the scan, so its rest frame cannot stand in for a missing one.
    const dist = tmpDir();
    const shipped = join(dist, 'dist', 'css');
    mkdirSync(shipped, { recursive: true });
    writeFileSync(join(shipped, 'effects.scoped.css'), fixture({}));
    writeFileSync(
      join(dist, 'responsive.css'),
      '@media (prefers-reduced-motion: reduce) { .demo { animation: none; opacity: 1; } }',
    );
    const { errors } = checkKeyframeCoverage(cssEntriesUnder(shipped));
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('ontwerp-demo');
    // And moving the same file inside the shipped set satisfies the gate — the
    // boundary, not the content, decided it.
    writeFileSync(
      join(shipped, 'extra.css'),
      '@media (prefers-reduced-motion: reduce) { .demo { animation: none; opacity: 1; } }',
    );
    expect(checkKeyframeCoverage(cssEntriesUnder(shipped)).errors).toEqual([]);
  });

  // Task 2.x: the gate is keyed to built/shipped CSS — run against the real bundle.
  it('the real shipped effects bundle passes with co-located reduced-motion rules', async () => {
    const dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
    const entries = cssEntriesUnder(join(dist, 'css'));
    expect(entries.length).toBeGreaterThan(0);

    const { errors } = checkKeyframeCoverage(entries);
    expect(errors, errors.map((e) => e.message).join('\n')).toEqual([]);

    // The scoped effects bundle carries the co-located rest frames: one reduced-
    // motion block per effect layer that declares animations (states, atmosphere,
    // weather — material ships no keyframes), plus none lost from the zoo page.
    const effects = entries.find((e) => e.file.endsWith('effects.scoped.css'))?.css ?? '';
    expect(effects).toContain('@media (prefers-reduced-motion: reduce)');
    expect((effects.match(/@media \(prefers-reduced-motion: reduce\)/g) || []).length).toBe(3);
    for (const name of ['ontwerp-germinate', 'ontwerp-bo', 'ontwerp-wx-wind']) {
      expect(effects, `${name} ships`).toContain(`@keyframes ${name}`);
    }
  });

  it('a keyframe nothing references is not demanded coverage (it ships dead)', () => {
    const { errors } = checkKeyframeCoverage([
      { file: 'shipped.css', css: '@keyframes ontwerp-orphan { 0% { opacity: 0; } }' },
    ]);
    expect(errors).toEqual([]);
  });
});
