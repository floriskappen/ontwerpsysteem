import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild, emitSkins } from '../scripts/lib/build-core.mjs';
import {
  expandAllSkins,
  applyRule,
  skinCss,
  skinsModule,
  skinsToData,
  loadRegistry,
  loadSkinSource,
} from '../scripts/lib/skins-core.mjs';
import { validateEntries, collectTokenFiles } from '../scripts/lib/validate-core.mjs';
import { tmpDir, customProps, computeVar, treesEqual } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const realTokens = join(root, 'design-system', 'source', 'values');
const SKINS_SOURCE = join(root, 'design-system', 'source', 'skins', 'skins.json');
const ZOO_SKINS_MODULE = join(root, 'design-system', 'source', 'zoo', 'data', 'skins.mjs');

// One shared build of the real system for every artifact-level check.
let _built;
function builtOnce() {
  if (!_built) {
    const dist = tmpDir();
    _built = runBuild({ tokensDir: realTokens, distDir: dist }).then(() => ({
      dist,
      page: readFileSync(join(dist, 'zoo', 'index.html'), 'utf8'),
      tokensScoped: readFileSync(join(dist, 'css', 'tokens.scoped.css'), 'utf8'),
      componentsScoped: readFileSync(join(dist, 'css', 'components.scoped.css'), 'utf8'),
      effectsScoped: readFileSync(join(dist, 'css', 'effects.scoped.css'), 'utf8'),
      tokensRoot: readFileSync(join(dist, 'css', 'tokens.css'), 'utf8'),
      releaseCssSkins: join(dist, 'release', 'values', 'css', 'skins'),
      manifest: JSON.parse(readFileSync(join(dist, 'manifest', 'tokens.json'), 'utf8')),
    }));
  }
  return _built;
}

// The role contract, the canonical skins and the registry, straight from source.
const ROLES = expandAllSkins().roles;
const ROLE_NAMES = new Set(ROLES.map((r) => r.name));
const DERIVED_ROLES = ROLES.filter((r) => r.provenance === 'derive');
const REGISTRY = loadRegistry();
const SOURCE = loadSkinSource();
const BASE_SKIN = SOURCE.find((s) => s.base);
const DEMO_SKINS = SOURCE.filter((s) => !s.base);

// Parse one emitted skin file into { props } (both adoption forms carry the
// same declarations, so the union is the role set).
function readSkinCss(path) {
  const css = readFileSync(path, 'utf8');
  return { css, props: customProps(css) };
}

// Parse one selector's brace block into its custom-property map (null if the
// selector is absent).
function blockProps(css, selector) {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) return null;
  const open = css.indexOf('{', at);
  return customProps(css.slice(open + 1, css.indexOf('}', open)));
}

describe('skins as complete role sets — build pipeline', () => {
  // Spec: build-pipeline / Scenario: Skin file declares every colour role.
  // Named check 5.1 skin-declares-every-role.
  it('5.1 skin-declares-every-role: an emitted skin declares every colour-carrying semantic role', async () => {
    const { releaseCssSkins } = await builtOnce();
    const files = readdirSync(releaseCssSkins).filter((f) => f.endsWith('.css'));
    expect(files.length, 'one file per non-base skin').toBe(DEMO_SKINS.length);
    for (const file of files) {
      const id = file.replace(/\.css$/, '');
      const skin = SOURCE.find((s) => s.id === id);
      const { css, props } = readSkinCss(join(releaseCssSkins, file));
      // the dedupe-safe slot, AND its equivalent attribute form so importing
      // the file + setting data-skin is the only step for island AND whole-app;
      // both forms must carry the SAME declarations — a divergent :root block
      // would reskin whole-app consumers differently from islands
      const island = blockProps(css, `.ontwerp[data-skin="${id}"]`);
      const wholeApp = blockProps(css, `:root[data-skin="${id}"]`);
      expect(island, `${id}: island form present`).not.toBeNull();
      expect(wholeApp, `${id}: whole-app form present`).not.toBeNull();
      expect(wholeApp, `${id}: both adoption forms agree`).toEqual(island);
      // every colour-carrying semantic role is declared…
      expect([...props.keys()].sort()).toEqual([...ROLE_NAMES, 'color-ink'].map((n) => `--${n}`).sort());
      // …the supplied ones carrying the skin's own values
      for (const [path, value] of Object.entries(skin.supply)) {
        expect(props.get(`--${path.split('.').join('-')}`), `${id}: supplied ${path}`).toBe(value);
      }
    }
  });

  // Spec: Scenario: Derived role is computed from the skin's supplied core.
  // Named check 5.2 derived-from-supplied-core. The expected value is computed
  // here from the skin's four supplied roles alone — the primitives are never
  // consulted — so an equality pass IS the independence property.
  it('5.2 derived-from-supplied-core: each derived role equals its rule over the supplied core, off the base palette', async () => {
    const { releaseCssSkins, tokensRoot } = await builtOnce();
    const basePalette = customProps(tokensRoot);
    for (const skin of DEMO_SKINS) {
      const { props } = readSkinCss(join(releaseCssSkins, `${skin.id}.css`));
      for (const role of DERIVED_ROLES) {
        const rule = REGISTRY.get(role.derivation);
        expect(rule, `${role.path} names a registered rule`).toBeDefined();
        const expected = applyRule(rule, (p) => skin.supply[p]);
        expect(
          props.get(`--${role.name}`),
          `${skin.id}: ${role.path}`,
        ).toBe(expected);
      }
      // not a copy of the base palette: the mid-grey moves off cream's value
      expect(props.get('--color-text-quiet')).not.toBe(basePalette.get('--color-text-quiet'));
    }
  });

  // Spec: Scenario: An unregistered or unresolvable derivation halts skin emission.
  // Named check 5.3 bad-derivation-halts.
  it('5.3 bad-derivation-halts: unregistered rule / non-supplied input fails, naming skin, role and cause', async () => {
    // a registry missing a rule a token names
    const registryPath = join(tmpDir(), 'registry.json');
    const withoutAccentSoft = [...REGISTRY.values()].filter((r) => r.id !== 'accent-soft');
    writeFileSync(registryPath, JSON.stringify(withoutAccentSoft));
    const unregistered = expandAllSkins({ registryPath });
    const unregErrors = unregistered.skins.flatMap((s) => s.errors);
    expect(unregErrors.some((e) => /"lilac"/.test(e.message) && /color\.accent\.soft/.test(e.message) && /unregistered derivation rule "accent-soft"/.test(e.message))).toBe(true);

    // a skin whose supply cannot feed a rule input (rose loses its danger pigment)
    const skinsPath = join(tmpDir(), 'skins.json');
    const rose = structuredClone(SOURCE.find((s) => s.id === 'rose'));
    delete rose.supply['color.destructive.base'];
    writeFileSync(skinsPath, JSON.stringify([rose]));
    const unresolved = expandAllSkins({ skinsPath }).skins[0].errors;
    expect(unresolved.some((e) => /"rose"/.test(e.message) && /color\.destructive\.soft/.test(e.message) && /not one of the skin's supplied roles/.test(e.message))).toBe(true);

    // and the BUILD halts on such a source: emitSkins throws before writing
    // anything — no dist, and the checked-in zoo module untouched.
    const dist = tmpDir();
    const zooModuleBefore = readFileSync(ZOO_SKINS_MODULE, 'utf8');
    expect(() => emitSkins(dist, { skinsPath })).toThrow(/Skin expansion failed[\s\S]*"rose"[\s\S]*color\.destructive\.soft/);
    expect(existsSync(join(dist, 'css')), 'the halt happens before any output is written').toBe(false);
    expect(readFileSync(ZOO_SKINS_MODULE, 'utf8')).toBe(zooModuleBefore);
  });

  // Spec: Scenario: Zoo skin data matches the shipped skins.
  // Named check 5.4 zoo-data-matches-skins. A source edit is replayed through
  // the same emitters the build calls (expand → skinCss/skinsModule); neither
  // the repo tree nor the checked-in module is touched.
  it('5.4 zoo-data-matches-skins: a skin-source edit lands in both the skin CSS and the generated zoo data, same role set', async () => {
    const edited = structuredClone(SOURCE);
    edited.find((s) => s.id === 'rose').supply['color.surface.page'] = '#F0DDE0';
    const skinsPath = join(tmpDir(), 'skins.json');
    writeFileSync(skinsPath, JSON.stringify(edited));
    const { skins } = expandAllSkins({ skinsPath });
    const rose = skins.find((s) => s.id === 'rose');

    const css = skinCss(rose);
    const moduleText = skinsModule(skins);
    expect(css).toContain('--color-surface-page: #F0DDE0;');
    expect(moduleText).toContain("'color-surface-page': '#F0DDE0',");
    // the same complete role set on both sides — for every EMITTED skin (the
    // base skin's module entry is vars: null; it renders from the base CSS)
    for (const skin of skins.filter((s) => !s.base)) {
      const cssNames = skinCss(skin)
        .match(/--([a-z0-9-]+):/g)
        .map((m) => m.slice(2, -1));
      const moduleVars = [...skinsModule([skin]).matchAll(/'([a-z0-9-]+)': '/g)].map((m) => m[1]);
      expect(new Set(moduleVars), `${skin.id}: module vars`).toEqual(new Set(cssNames));
    }
    expect(skinsModule([skins.find((s) => s.base)])).toContain('vars: null');

    // and the shipped artefacts agree today: the checked-in zoo module is the
    // generator's exact output for the current source, and each shipped skin
    // file's role set equals the corresponding module entry's.
    expect(readFileSync(ZOO_SKINS_MODULE, 'utf8')).toBe(skinsModule(expandAllSkins().skins));
    const { releaseCssSkins } = await builtOnce();
    for (const skin of expandAllSkins().skins.filter((s) => !s.base)) {
      const { props } = readSkinCss(join(releaseCssSkins, `${skin.id}.css`));
      const shipped = new Set([...props.keys()].map((k) => k.slice(2)));
      expect(shipped, `${skin.id}: shipped role set`).toEqual(new Set(['color-ink', ...Object.keys(skinVars(skin))]));
    }
  });
});

// The vars object a generated module entry carries for a skin — read through
// the real generator so this suite cannot drift from it.
function skinVars(skin) {
  return skinsToData([skin])[0].vars;
}

describe('skins as complete role sets — distribution', () => {
  // Spec: distribution / Scenario: One skin file reskins the whole colour surface.
  // Named check 5.5 one-file-reskins-surface. Limitation: not a browser —
  // computeVar() hand-rolls var() substitution over the parsed declarations,
  // with the skin map applied after the built maps, mirroring how
  // .ontwerp[data-skin] out-specifies .ontwerp on the same scope root.
  it('5.5 one-file-reskins-surface: one shipped skin file + data-skin reskins every role, nothing left on the base palette', async () => {
    const { releaseCssSkins, tokensScoped, componentsScoped, effectsScoped } = await builtOnce();
    const base = [
      customProps(tokensScoped.match(/\.ontwerp \{([^}]*)\}/)[1]),
      customProps(componentsScoped),
      customProps(effectsScoped),
    ];
    const baseOnly = (name) => computeVar(name, ...base);

    for (const skin of DEMO_SKINS) {
      const override = readSkinCss(join(releaseCssSkins, `${skin.id}.css`)).props;
      // every colour-carrying semantic role takes the skin's own value
      for (const role of ROLES) {
        expect(computeVar(`--${role.name}`, ...base, override), `${skin.id}: ${role.path}`).toBe(
          override.get(`--${role.name}`),
        );
      }
      // the named surface of the spec — greys, borders, on-ink, disabled tier,
      // destructive — plus the halftone anchor from the roadmap's done condition
      for (const name of ['color-text-quiet', 'color-text-faint', 'color-border-default', 'color-text-on-ink', 'color-text-disabled', 'color-surface-disabled', 'color-destructive-base', 'color-destructive-soft', 'color-ink']) {
        expect(override.has(`--${name}`), `${skin.id} declares ${name}`).toBe(true);
      }
      // and component tokens follow their live aliases onto the skin
      for (const name of ['--button-border-default', '--field-text', '--link-text-hover']) {
        expect(computeVar(name, ...base, override), `${skin.id}: ${name}`).not.toBe(baseOnly(name));
      }
    }
  });

  // Spec: distribution / Scenarios: Danger reads as danger per skin;
  // Destructive is supplied, its soft variant derived.
  // Named check 5.6 destructive-per-skin.
  it('5.6 destructive-per-skin: every skin supplies its own danger pigment and derives its soft variant', async () => {
    const { releaseCssSkins } = await builtOnce();
    const dangers = SOURCE.map((s) => s.supply['color.destructive.base']);
    for (const skin of SOURCE) {
      expect(skin.supply['color.destructive.base'], `${skin.id} supplies destructive.base`).toMatch(/^#[0-9A-F]{6}$/);
      expect(skin.supply['color.destructive.base'], `${skin.id}: danger distinct from accent`).not.toBe(
        skin.supply['color.accent.base'],
      );
      if (skin.base) continue; // the base renders from the base token CSS, no file
      const { props } = readSkinCss(join(releaseCssSkins, `${skin.id}.css`));
      const rule = REGISTRY.get('destructive-soft');
      expect(props.get('--color-destructive-base')).toBe(skin.supply['color.destructive.base']);
      expect(props.get('--color-destructive-soft'), `${skin.id}: soft derived from ITS base`).toBe(
        applyRule(rule, (p) => skin.supply[p]),
      );
    }
    // no single global danger shared across skins
    expect(new Set(dangers).size, 'danger pigments are per-skin').toBe(SOURCE.length);
  });
});

describe('skin coverage gate (propagation-validation)', () => {
  const { entries } = collectTokenFiles(realTokens);
  const derivations = JSON.parse(readFileSync(join(root, 'design-system', 'language', 'colour.derivations.json'), 'utf8'));
  const coverageErrors = (errors) => errors.filter((e) => e.rule === 'skin-coverage');

  // Minimal semantic role set for the mismatch shapes: one supplied role and
  // one derived role, annotated per the provenance contract.
  const fixtureEntries = [
    {
      tier: 'semantic',
      file: 's',
      data: {
        color: {
          $type: 'color',
          text: {
            default: { $value: '#1F1B16', $extensions: { 'ontwerp.role': { provenance: 'supply' } } },
            quiet: { $value: '#8A8170', $extensions: { 'ontwerp.role': { provenance: 'derive', derivation: 'text-quiet' } } },
          },
        },
      },
    },
  ];
  const fixtureRegistry = [{ id: 'text-quiet', inputs: ['color.text.default'], formula: { kind: 'alpha', step: 50 } }];

  // Spec: propagation-validation / Scenario: A skin that strands a colour token fails.
  // Named check 5.7 coverage-gate-strands.
  it('5.7 coverage-gate-strands: a stranded token fails the gate, naming skin and token', () => {
    // synthetic: a skin supplying nothing leaves even the simplest role stranded
    let { errors } = validateEntries(fixtureEntries, {
      derivations: fixtureRegistry,
      skins: [{ id: 'hollow', label: 'hollow', supply: {} }],
    });
    let bad = coverageErrors(errors);
    expect(bad.some((e) => /"hollow"/.test(e.message) && /strands colour token "color\.text\.quiet"/.test(e.message))).toBe(true);

    // real tokens: lilac losing its accent strands everything downstream of it
    const lilac = structuredClone(SOURCE.find((s) => s.id === 'lilac'));
    delete lilac.supply['color.accent.base'];
    ({ errors } = validateEntries(entries, { derivations, skins: [lilac] }));
    bad = coverageErrors(errors);
    expect(bad.some((e) => /"lilac"/.test(e.message) && /strands colour token "color\.accent\.soft"/.test(e.message))).toBe(true);
    expect(bad.some((e) => /"lilac"/.test(e.message) && /strands colour token "color\.focus-ring"/.test(e.message))).toBe(true);
  });

  // Spec: Scenario: A skin whose supply set does not match the contract fails.
  // Named check 5.8 coverage-gate-supply-mismatch.
  it('5.8 coverage-gate-supply-mismatch: omitted supply role / supplied derived role fail, naming the role', () => {
    const { errors } = validateEntries(fixtureEntries, {
      derivations: fixtureRegistry,
      skins: [
        { id: 'omitter', label: 'o', supply: {} }, // omits color.text.default
        { id: 'overreacher', label: 'o', supply: { 'color.text.default': '#1F1B16', 'color.text.quiet': '#8A8170' } }, // supplies a derived role
      ],
    });
    const bad = coverageErrors(errors);
    expect(bad.some((e) => /"omitter"/.test(e.message) && /omits supplied role "color\.text\.default"/.test(e.message))).toBe(true);
    expect(bad.some((e) => /"overreacher"/.test(e.message) && /supplies "color\.text\.quiet", whose declared provenance is derived/.test(e.message))).toBe(true);
  });

  // Spec: Scenario: A complete skin passes.
  // Named check 5.9 coverage-gate-passes — the whole shipped source, gate green.
  it('5.9 coverage-gate-passes: the shipped skins all pass the coverage gate', () => {
    const { errors } = validateEntries(entries, { derivations, skins: SOURCE });
    expect(coverageErrors(errors)).toEqual([]);
    expect(errors, 'the whole validation stays green with the gate active').toEqual([]);
  });
});

describe('skins as complete role sets — showcase', () => {
  // The per-skin :root:has(#th-…) override blocks of the built page, keyed by id.
  const skinBlocks = (page) =>
    new Map([...page.matchAll(/:root:has\(#th-(\w+):checked\)\s*\{([^}]*)\}/g)].map((m) => [m[1], customProps(m[2])]));

  // Spec: showcase / Scenario: The swap cascades through the built output alone.
  // Named check 5.11 no-relink: the demo overrides declare only semantic colour
  // roles (+ the --color-ink halftone anchor) — never a built component-token
  // custom property re-linked to make the swap cascade.
  it('5.11 no-relink: skin overrides touch only colour roles, no built component token', async () => {
    const { page, manifest } = await builtOnce();
    const componentTokens = new Set(manifest.filter((e) => e.tier === 'component').map((e) => e.name));
    expect(componentTokens.size).toBeGreaterThan(0);
    const blocks = skinBlocks(page);
    expect(blocks.size).toBe(DEMO_SKINS.length);
    for (const [id, override] of blocks) {
      for (const declared of override.keys()) {
        expect(componentTokens.has(declared.slice(2)), `${id} re-declares component token ${declared}`).toBe(false);
      }
      // the swap rides the semantic roles the components alias to
      for (const role of ROLES) {
        expect(override.has(`--${role.name}`), `${id} declares ${role.name}`).toBe(true);
      }
    }
  });

  // Spec: Scenario: Demo skins are generated, not hand-authored partial overrides.
  // Named check 5.12 demo-skins-generated.
  it('5.12 demo-skins-generated: the theme bar renders the generated complete role sets', async () => {
    const { page } = await builtOnce();
    const blocks = skinBlocks(page);
    for (const skin of DEMO_SKINS) {
      const vars = skinVars(expandAllSkins({ skinsPath: SKINS_SOURCE }).skins.find((s) => s.id === skin.id));
      const block = blocks.get(skin.id);
      // the page block IS the generated complete set — not a hand-authored subset
      expect(new Set([...block.keys()].map((k) => k.slice(2))), `${skin.id} page block`).toEqual(
        new Set(['color-ink', ...Object.keys(vars)]),
      );
      // and the derived roles genuinely move (the old ~9-var partial did not)
      expect(block.get('--color-text-muted')).toBeDefined();
      expect(block.get('--color-destructive-soft')).toBeDefined();
    }
  });

  // Spec: Scenario: Demo skins are not misrepresented as shipped tokens.
  // Named check 5.13 demo-not-shipped-tokens.
  it('5.13 demo-not-shipped-tokens: the demo is labelled illustrative and the shipped token CSS carries no skin', async () => {
    const { page, tokensRoot, tokensScoped, releaseCssSkins } = await builtOnce();
    expect(page).toContain('illustrative');
    expect(page).toContain('not\n   shipped'); // the disclaimer names what it is not
    // the real palette in the build outputs knows nothing of the demo skins
    for (const css of [tokensRoot, tokensScoped]) {
      expect(css).not.toContain('data-skin');
      for (const skin of DEMO_SKINS) {
        expect(css, `${skin.id}'s paper must not leak into the shipped token CSS`).not.toContain(
          skin.supply['color.surface.page'],
        );
      }
    }
    // while the importable skins ship beside them, clearly separate
    expect(existsSync(join(releaseCssSkins, `${DEMO_SKINS[0].id}.css`))).toBe(true);
  });

  // Named check 5.14 baseline gates: skin outputs deterministic across builds,
  // emitted into dist and the consumer bundle, and the regenerated zoo module
  // byte-stable. The CLI gates themselves run in CI / before archive.
  it('5.14 baseline gates: skin outputs are deterministic and ship in dist and the bundle', async () => {
    const zooModuleBefore = readFileSync(ZOO_SKINS_MODULE, 'utf8');
    const a = tmpDir();
    const b = tmpDir();
    await runBuild({ tokensDir: realTokens, distDir: a });
    await runBuild({ tokensDir: realTokens, distDir: b });
    expect(treesEqual(join(a, 'css', 'skins'), join(b, 'css', 'skins'))).toBe(true);
    expect(readFileSync(ZOO_SKINS_MODULE, 'utf8'), 'regenerated zoo module is byte-stable').toBe(zooModuleBefore);
    const { releaseCssSkins } = await builtOnce();
    expect(treesEqual(join(a, 'release', 'values', 'css', 'skins'), releaseCssSkins)).toBe(true);
    expect(BASE_SKIN.supply['color.surface.page']).toBeTruthy(); // sanity: source readable
  });
});
