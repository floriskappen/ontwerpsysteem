import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ATMOSPHERE_COST_CONTRACT,
  checkAtmosphereContract,
  collectAtmosphereInputs,
} from '../scripts/lib/atmosphere-contract.mjs';
import { atmosphereContract } from '../design-system/source/zoo/effects/atmosphere.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir, cssRules } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RECIPES_PATH = join(root, 'design-system', 'recipes', 'atmosphere.recipes.json');

// The real repo state, as the validation CLI collects it.
const realInputs = () => collectAtmosphereInputs();

// A mutable deep copy of collected inputs with one mutation applied — the
// failure scenarios each bend exactly one fact and expect exactly that bend
// to be named back.
const withMutation = async (mutate) => {
  const inputs = structuredClone(await realInputs());
  mutate(inputs.declared, inputs.observed);
  return checkAtmosphereContract(inputs);
};

describe('atmosphere cost contract', () => {
  // Spec: propagation-validation / Scenario: Valid atmosphere defaults pass.
  it('valid defaults pass', async () => {
    const { errors } = checkAtmosphereContract(await realInputs());
    expect(errors).toEqual([]);
  });

  // Spec: Scenario: Out-of-range particle default fails (below the floor).
  it('a field below the particle floor fails, naming the field and observed count', async () => {
    const { errors } = await withMutation((declared, observed) => {
      declared.fields.push({ id: 'fixture-thin', particles: 5 });
      observed.fieldCounts.push({ id: 'fixture-thin', particles: 5 });
      observed.availableFieldIds.push('fixture-thin');
    });
    expect(errors.some((e) => e.rule === 'atmosphere-cost' && /fixture-thin/.test(e.message) && /\b5\b/.test(e.message)))
      .toBe(true);
  });

  // Spec: Scenario: Out-of-range particle default fails (above the ceiling).
  it('a field above the particle ceiling fails, naming the field and observed count', async () => {
    const { errors } = await withMutation((declared, observed) => {
      declared.fields.push({ id: 'fixture-heavy', particles: ATMOSPHERE_COST_CONTRACT.particles.max + 1 });
      observed.fieldCounts.push({
        id: 'fixture-heavy',
        particles: ATMOSPHERE_COST_CONTRACT.particles.max + 1,
      });
      observed.availableFieldIds.push('fixture-heavy');
    });
    const max = ATMOSPHERE_COST_CONTRACT.particles.max;
    expect(
      errors.some((e) => e.rule === 'atmosphere-cost' && /fixture-heavy/.test(e.message) && new RegExp(`\\b${max + 1}\\b`).test(e.message)),
    ).toBe(true);
  });

  // Declared cost is derived from the generator; a hand-edited contract entry
  // must fail against the recount.
  it('a declared count that disagrees with its generator fails', async () => {
    const { errors } = await withMutation((declared) => {
      declared.fields.find((f) => f.id === 'haze').particles = 9;
    });
    expect(errors.some((e) => e.rule === 'atmosphere-cost' && /"haze" declares 9 particles but its generator yields 6/.test(e.message)))
      .toBe(true);
  });

  // Spec: Scenario: Bloom count drift fails.
  it('a bloom default other than three fails, naming the observed count', async () => {
    for (const drifted of [2, 4]) {
      const { errors } = await withMutation((declared) => {
        declared.bloomCount = drifted;
      });
      expect(errors.some((e) => e.rule === 'atmosphere-cost' && new RegExp(`bloom default is ${drifted}`).test(e.message)))
        .toBe(true);
    }
  });

  // And the markup cannot drift from the declaration either.
  it('a bloom generator yield that disagrees with the declaration fails, naming the yield', async () => {
    const { errors } = await withMutation((_declared, observed) => {
      observed.bloomCount = 4;
    });
    expect(errors.some((e) => e.rule === 'atmosphere-cost' && /yields 4 blooms against a declared default of 3/.test(e.message)))
      .toBe(true);
  });

  // Spec: Scenario: Default weather activation fails.
  it('weather enabled by default fails and identifies the weather default', async () => {
    const { errors } = await withMutation((declared) => {
      declared.weatherEnabledByDefault = true;
    });
    expect(errors.some((e) => e.rule === 'atmosphere-default' && /weather must be opt-in and off by default/.test(e.message)))
      .toBe(true);
  });

  // Spec: design-language / Scenario: Cost drift fails validation — plus the
  // design's risk note: an uncontracted field cannot pass silently.
  it('an uncontracted weather field cannot pass silently', async () => {
    const { errors } = await withMutation((_declared, observed) => {
      observed.availableFieldIds.push('mist');
    });
    expect(errors.some((e) => e.rule === 'atmosphere-coverage' && /uncontracted weather field "mist"/.test(e.message)))
      .toBe(true);
  });

  it('a contracted entry no generator backs fails as stale', async () => {
    const { errors } = await withMutation((declared, observed) => {
      observed.availableFieldIds = observed.availableFieldIds.filter((id) => id !== 'haze');
      observed.fieldCounts = observed.fieldCounts.filter((f) => f.id !== 'haze');
      declared.fields = declared.fields.filter((f) => f.id !== 'haze');
      // Contracted but never exported by any effects module.
      declared.fields.push({ id: 'retired', particles: 10 });
      observed.fieldCounts.push({ id: 'retired', particles: 10 });
    });
    expect(errors.some((e) => e.rule === 'atmosphere-coverage' && /"retired", which exports no/.test(e.message)))
      .toBe(true);
  });
});

describe('recipe metadata carries the atmosphere contract', () => {
  // Spec: design-language / Scenario: Recipe exposes the atmosphere operating envelope.
  it('the breathing-grid recipe declares once-per-root mounting and the decided cost envelope', () => {
    const recipe = JSON.parse(readFileSync(RECIPES_PATH, 'utf8')).find(
      (r) => r.id === 'atmosphere.grid.breathing',
    );
    expect(recipe, 'the breathing-grid recipe exists').toBeTruthy();
    expect(recipe.mountCardinality).toBe(atmosphereContract().mountCardinality);
    expect(recipe.mountCardinality).toBe('once-per-root');
    expect(recipe.cost.particlesPerField).toEqual(atmosphereContract().particlesPerField);
    expect(recipe.cost.particlesPerField).toEqual({ min: 6, max: 51 });
    expect(recipe.cost.blooms).toBe(atmosphereContract().bloomCount);
    expect(recipe.cost.blooms).toBe(3);
    expect(recipe.cost.weatherEnabledByDefault).toBe(atmosphereContract().weatherEnabledByDefault);
    expect(recipe.cost.weatherEnabledByDefault).toBe(false);
  });

  it('the compiled recipe index carries the same metadata', () => {
    const source = JSON.parse(readFileSync(RECIPES_PATH, 'utf8')).find(
      (r) => r.id === 'atmosphere.grid.breathing',
    );
    const compiled = JSON.parse(
      readFileSync(join(root, 'design-system', 'recipes', 'index.json'), 'utf8'),
    ).find((r) => r.id === 'atmosphere.grid.breathing');
    expect(compiled).toEqual(source);
  });

  // Spec: design-language / Requirement: Atmosphere declares its mount cardinality
  // and cost contract — the language file states it too. Factual anchors only:
  // the terms a consumer must be able to find, not prose opinions.
  it('the atmosphere language states the cardinality, envelope, opt-in, and stacking pattern', () => {
    const md = readFileSync(join(root, 'design-system', 'language', 'atmosphere.md'), 'utf8');
    for (const fact of ['once per chrome root', '6–51 particles', 'three blooms', 'opt-in', '.ontwerp-root', 'isolation: isolate', 'z-0']) {
      expect(md.includes(fact), `atmosphere.md states "${fact}"`).toBe(true);
    }
  });
});

describe('shipped fixed-behind-scope primitive', () => {
  let dist;

  beforeAll(async () => {
    dist = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: dist });
  }, 60000);

  const scopedCss = () =>
    readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  // Spec: showcase / Scenario: Scoped atmosphere mounting is available.
  it('ships the chrome-root isolation under the scope class', () => {
    expect(scopedCss()).toMatch(/\.ontwerp \.ontwerp-root\s*\{[^}]*isolation:\s*isolate/);
  });

  // Spec: Scenario: Atmosphere CSS does not force global mounting — the
  // primitive stays scoped to the chrome-root pattern, never html/body.
  it('never emits the primitive bare or rooted at html/body', () => {
    const selectors = cssRules(scopedCss()).rules.flatMap((r) => r.selectors);
    expect(selectors.some((s) => s === '.ontwerp-root')).toBe(false);
    expect(selectors.filter((s) => s.includes('ontwerp-root')).every((s) => s.startsWith('.ontwerp '))).toBe(true);
    expect(selectors.filter((s) => /^(html|body)\b/.test(s))).toEqual([]);
  });

  it('keeps the ambient layers usable as descendants of the scoped root', () => {
    const selectors = cssRules(scopedCss()).rules.flatMap((r) => r.selectors);
    expect(selectors).toContain('.ontwerp .grid');
    expect(selectors).toContain('.ontwerp .bloom');
  });

  // The zoo consumes the same source primitive (bare form on the page) and
  // mounts the ambient stack exactly once despite its many sections. Weather
  // fields appear only where a section opts in (masthead drift, the weather
  // demos); the stack itself carries none. The bloom markup is generated from
  // the contract, so the shipped page shows exactly the declared three blooms.
  it('mounts the ambient stack once per root in the generated zoo', () => {
    const html = readFileSync(join(dist, 'zoo', 'index.html'), 'utf8');
    const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? '';
    expect(style.replace(/\/\*[\s\S]*?\*\//g, '')).toMatch(/\.ontwerp-root\s*\{[^}]*isolation:\s*isolate/);
    const body = html.slice(html.indexOf('</style>'));
    expect([...body.matchAll(/class="grid"/g)]).toHaveLength(1);
    expect([...body.matchAll(/class="bloom"/g)]).toHaveLength(1);
    expect(body).toContain(
      '<div class="bloom" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>',
    );
  });

  it('lifts the sheet content above the ambient layers', () => {
    const css = readFileSync(join(root, 'design-system', 'source', 'zoo', 'styles', 'base.css'), 'utf8');
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).toMatch(/\.sheet\s*\{[^}]*z-index:\s*1/);
  });
});
