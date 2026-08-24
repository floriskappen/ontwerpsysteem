import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grid from '../design-system/source/zoo/effects/grid.mjs';
import * as phyllotaxis from '../design-system/source/zoo/effects/phyllotaxis.mjs';
import * as weather from '../design-system/source/zoo/effects/weather-particles.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EFFECTS_DIR = join(root, 'design-system', 'source', 'zoo', 'effects');

// Every data primary, with the call that exercises it. The same thunks back the
// determinism and purity checks, so a generator added to this list once is
// covered by the whole contract.
const dataCalls = [
  ['seedHeadData()', () => phyllotaxis.seedHeadData()],
  ['seedHeadData(24)', () => phyllotaxis.seedHeadData(24)],
  ['growingSeedHeadData()', () => phyllotaxis.growingSeedHeadData()],
  ['growingSeedHeadData(20)', () => phyllotaxis.growingSeedHeadData(20)],
  ['gridData()', () => grid.gridData()],
  ['windParticlesData()', () => weather.windParticlesData()],
  ['rainParticlesData()', () => weather.rainParticlesData()],
  ['fleckParticlesData()', () => weather.fleckParticlesData()],
  ['driftParticlesData()', () => weather.driftParticlesData()],
  ['fireflyParticlesData()', () => weather.fireflyParticlesData()],
  ['flakeParticlesData()', () => weather.flakeParticlesData()],
  ['hazeParticlesData()', () => weather.hazeParticlesData()],
  ['sunpoolParticlesData()', () => weather.sunpoolParticlesData()],
  ["weatherTextData('najaarswind')", () => weather.weatherTextData('najaarswind')],
  ["weatherTextData('de ontwerp')", () => weather.weatherTextData('de ontwerp')], // spaced: spaces are data (DECISIONS.md §1)
];

// The elements a markup string must never contain: structured data carries
// values, not tags.
const isMarkup = (s) => /<\/?[a-zA-Z][^>]*>/.test(s);

function collectStrings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collectStrings(x, out));
  return out;
}

describe('effects contract', () => {
  // Spec: effects-contract / Scenario: Primary export returns structured data.
  it('primary export returns structured data', () => {
    for (const [name, call] of dataCalls) {
      const out = call();
      const items = Array.isArray(out) ? out : out.cells; // gridData is object-of-arrays
      expect(items, `${name} yields elements`).toBeInstanceOf(Array);
      expect(items.length, `${name} yields a field`).toBeGreaterThan(0);
      for (const datum of items) {
        expect(datum, `${name}: plain objects only`).not.toBeNull();
        expect(Object.getPrototypeOf(datum), `${name}: plain objects only`).toBe(Object.prototype);
        expect(typeof datum.index, `${name}: stable per-element index`).toBe('number');
      }
      for (const s of collectStrings(out)) {
        expect(isMarkup(s), `${name}: "${s}" must not be markup`).toBe(false);
      }
    }
  });

  // Spec: Scenario: Primary export returns structured data — the coordinates and
  // animation parameters each family promises are really there.
  it('data carries the values its effect renders by', () => {
    for (const d of phyllotaxis.seedHeadData()) {
      expect(d).toEqual({
        cx: expect.any(Number), cy: expect.any(Number), r: expect.any(Number), index: expect.any(Number),
      });
    }
    for (const d of phyllotaxis.growingSeedHeadData()) {
      expect(d.gi, 'growing seeds carry their germination order').toBe(d.index);
    }
    const field = grid.gridData();
    expect(field.cols).toBe(16);
    expect(field.rows).toBe(10);
    expect(field.cells.length).toBe(field.cols * field.rows);
    for (const c of field.cells) {
      expect(c).toEqual({
        index: expect.any(Number), a: expect.any(String), b: expect.any(String),
        d: expect.any(String), dl: expect.any(String),
      });
    }
    for (const name of ['wind', 'rain', 'fleck', 'drift', 'firefly', 'flake', 'haze', 'sunpool']) {
      for (const p of weather[`${name}ParticlesData`]()) {
        expect(p.cls, `${name}: particles name their element class`).toEqual(expect.any(String));
        expect(Object.keys(p.vars).length, `${name}: particles carry their custom properties`).toBeGreaterThan(0);
        for (const [k, v] of Object.entries(p.vars)) {
          expect(k.startsWith('--'), `custom property ${k}`).toBe(true);
          expect(v).toEqual(expect.any(String));
        }
      }
    }
    const phrase = 'najaarswind';
    for (const g of weather.weatherTextData(phrase)) {
      expect(g.char).toHaveLength(1);
      expect(g.index >= 0 && g.index < phrase.length, `index ${g.index} inside the phrase`).toBe(true);
    }
  });

  // Spec: Scenario: Every generator has a data primary. The exact export set per
  // field-producing module — every module ships its data primaries alongside the
  // wrappers derived from them, and no module consists of string functions alone.
  it('every generator has a data primary', async () => {
    const expected = {
      'grid.mjs': ['gridData'],
      'phyllotaxis.mjs': ['seedHeadData', 'growingSeedHeadData'],
      'weather-particles.mjs': [
        'windParticlesData', 'rainParticlesData', 'fleckParticlesData', 'driftParticlesData',
        'fireflyParticlesData', 'flakeParticlesData', 'hazeParticlesData', 'sunpoolParticlesData',
        'weatherTextData',
      ],
    };
    // The contract enumerates every effects module by name: a newly added .mjs
    // must be added here (or named as a non-field helper) — never left to pass
    // unexamined. Two modules produce no field: deterministic-random holds the
    // index-LCG, helpers the shared escape/memo plumbing that both the data
    // primaries and the zoo sections import.
    const nonFieldModules = ['deterministic-random.mjs', 'helpers.mjs'];
    const knownModules = [...nonFieldModules, ...Object.keys(expected)].sort();
    expect(
      readdirSync(EFFECTS_DIR).filter((f) => f.endsWith('.mjs')).sort(),
      'an uncontracted effects module exists — add it to `expected`',
    ).toEqual(knownModules);
    for (const [file, dataFns] of Object.entries(expected)) {
      const mod = await import(join(EFFECTS_DIR, file));
      const exportedFns = Object.keys(mod).filter((k) => typeof mod[k] === 'function');
      for (const name of dataFns) {
        expect(typeof mod[name], `${file} exports ${name}`).toBe('function');
      }
      expect(
        exportedFns.filter((n) => !dataFns.includes(n)).length,
        `${file} must not consist of markup-string functions alone`,
      ).toBeLessThan(exportedFns.length);
    }
  });

  // Spec: Scenario: Repeated calls are byte-identical. Same reference proves the
  // per-parameter-set memo answered the repeat call.
  it('repeated calls are byte-identical and served from the memo', () => {
    for (const [name, call] of dataCalls) {
      const first = call();
      const second = call();
      expect(second, name).toEqual(first);
      expect(second, `${name}: memoised, not recomputed`).toBe(first);
    }
  });

  // Spec: Scenario: Effect modules are clock-free. The brief's determinism
  // promise as a build-gated property: no wall-clock or nondeterministic runtime
  // source anywhere under effects/.
  it('effect modules are clock-free', () => {
    const forbidden = /\bMath\.random\b|\bDate\.now\b|\bperformance\.now\b/;
    for (const file of readdirSync(EFFECTS_DIR).filter((f) => f.endsWith('.mjs'))) {
      const src = readFileSync(join(EFFECTS_DIR, file), 'utf8');
      expect(forbidden.test(src), `${file} must stay clock-free`).toBe(false);
    }
  });

  // Spec: Scenario: Output depends only on the index and declared inputs.
  it('output depends only on the index and declared inputs', () => {
    // Call order cannot matter: recompute everything in reverse and every result
    // is unchanged — the memo identity shows nothing was recomputed at all.
    const snapshot = dataCalls.map(([, call]) => call());
    [...dataCalls].reverse().forEach(([name, call]) => call());
    for (const first of snapshot) expect(dataCalls.map(([, call]) => call())).toContain(first);

    // Element values cannot depend on the field size: dot i of a small head
    // equals dot i of a large one, because both derive from i alone.
    const small = phyllotaxis.seedHeadData(24);
    const large = phyllotaxis.seedHeadData(64);
    for (let i = 0; i < small.length; i++) expect(small[i]).toEqual(large[i]);
    const fewGlyphs = weather.weatherTextData('sneeuw');
    const manyGlyphs = weather.weatherTextData('sneeuwvlok');
    for (let i = 0; i < fewGlyphs.length; i++) expect(fewGlyphs[i]).toEqual(manyGlyphs[i]);
  });

  // Spec: Scenarios: Wrapper renders from the data function; Wrapper and data
  // agree on the field. Every wrapper names its data function in its own source,
  // and its markup carries exactly one element per datum, in the data's order.
  it('wrapper renders from the data function', () => {
    const count = (out, re) => [...out.matchAll(re)].length;
    const attrValues = (out, name) =>
      [...out.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((m) => m[1]);
    // Values written into a style="" attribute: `--d:3.2s` up to the next ; or quote.
    const varValues = (out, k) =>
      [...out.matchAll(new RegExp(`${k}:([^;"]+)`, 'g'))].map((m) => m[1]);

    const checks = [
      {
        name: 'seedHead',
        wrapper: phyllotaxis.seedHead,
        dataName: 'seedHeadData',
        data: () => phyllotaxis.seedHeadData(),
        verify(out, dots) {
          expect(count(out, /<circle\b/g)).toBe(dots.length);
          expect(attrValues(out, 'cx')).toEqual(dots.map((d) => String(d.cx)));
          expect(attrValues(out, 'cy')).toEqual(dots.map((d) => String(d.cy)));
          expect(attrValues(out, 'r')).toEqual(dots.map((d) => String(d.r)));
        },
      },
      {
        name: 'growingSeedHead',
        wrapper: phyllotaxis.growingSeedHead,
        dataName: 'growingSeedHeadData',
        data: () => phyllotaxis.growingSeedHeadData(),
        verify(out, seeds) {
          expect(count(out, /<circle\b/g)).toBe(seeds.length);
          expect(varValues(out, '--gi')).toEqual(seeds.map((d) => String(d.gi)));
          expect(attrValues(out, 'cx')).toEqual(seeds.map((d) => String(d.cx)));
          expect(attrValues(out, 'r')).toEqual(seeds.map((d) => String(d.r)));
        },
      },
      {
        // The divider wraps one seed head, deriving transitively:
        // renderDivider → seedHead → seedHeadData. Its field is the circles.
        name: 'renderDivider',
        wrapper: phyllotaxis.renderDivider,
        dataName: 'seedHead',
        data: () => phyllotaxis.seedHeadData(),
        verify(out, dots) {
          expect(count(out, /<circle\b/g)).toBe(dots.length);
          expect(attrValues(out, 'cx')).toEqual(dots.map((d) => String(d.cx)));
        },
      },
      {
        name: 'renderGrid',
        wrapper: grid.renderGrid,
        dataName: 'gridData',
        data: () => grid.gridData(),
        verify(out, field) {
          expect(count(out, /<i\b/g)).toBe(field.cells.length);
          expect(varValues(out, '--a')).toEqual(field.cells.map((c) => c.a));
          expect(varValues(out, '--b')).toEqual(field.cells.map((c) => c.b));
          expect(varValues(out, '--d')).toEqual(field.cells.map((c) => `${c.d}s`));
          expect(varValues(out, '--dl')).toEqual(field.cells.map((c) => `${c.dl}s`));
        },
      },
      ...['wind', 'rain', 'fleck', 'drift', 'firefly', 'flake', 'haze', 'sunpool'].map(
        (kind) => ({
          name: `${kind}Particles`,
          wrapper: weather[`${kind}Particles`],
          dataName: `${kind}ParticlesData`,
          data: () => weather[`${kind}ParticlesData`](),
          verify(out, particles) {
            expect(count(out, /<i\b/g)).toBe(particles.length);
            expect(attrValues(out, 'class')).toEqual(particles.map((p) => p.cls));
            const [[k, v]] = Object.entries(particles[0].vars);
            expect(out, 'first element carries the first datum’s properties').toContain(
              `class="${particles[0].cls}" style="${k}:${v}`,
            );
          },
        }),
      ),
      {
        // Spaces are part of the phrase, so they are part of the data; the
        // wrapper renders them as their literal character (byte-parity with the
        // accepted baseline forbids wrapping them in elements). The phrase is
        // the masthead's own 'de ontwerp' on purpose: a space-free phrase would
        // let a data function that drops spaces pass this whole suite.
        name: 'weatherText',
        wrapper: weather.weatherText,
        render: () => weather.weatherText('de ontwerp'),
        dataName: 'weatherTextData',
        data: () => weather.weatherTextData('de ontwerp'),
        verify(out, glyphs) {
          const nodes = out.match(/<span[^>]*>[^<]*<\/span>| /g) ?? [];
          expect(nodes.length).toBe(glyphs.length);
          for (let i = 0; i < glyphs.length; i++) {
            if (glyphs[i].char === ' ') expect(nodes[i], `node ${i}`).toBe(' ');
            else {
              expect(nodes[i], `node ${i}`).toBe(
                `<span class="wxc" style="--ci:${glyphs[i].index}">${glyphs[i].char}</span>`,
              );
            }
          }
        },
      },
    ];

    for (const { name, wrapper, render, dataName, data, verify } of checks) {
      expect(String(wrapper), `${name} derives from ${dataName}`).toContain(dataName);
      verify(render ? render() : wrapper(), data());
    }
  });
});
