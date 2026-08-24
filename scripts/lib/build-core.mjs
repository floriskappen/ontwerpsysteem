// Style Dictionary build, parameterised by source/output directory so it can be
// driven both by the CLI (scripts/build.mjs) and by tests (temp dirs). The build
// is gated on validation: if the tokens do not conform, it throws BuildAborted
// and writes nothing to the output directory.
//
// Name derivation is a single documented rule — the kebab transform — applied to
// every target, so `color.text.muted` becomes `color-text-muted` (and
// `--color-text-muted` in CSS) across all outputs. The Tailwind target adds one
// documented step on top: the literal segment `ontwerp` is inserted between the
// first path segment and the remainder (`--color-ontwerp-text-muted`), so the
// theme's variables sit in an `ontwerp` namespace *within* each Tailwind variable
// namespace and can never silently redefine a consumer's own theme variables.
// Both mappings are part of the public contract.

import { mkdirSync, readFileSync, writeFileSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { validateTokenDir, TIERS } from './validate-core.mjs';
import { renderShowcase } from './showcase-core.mjs';
import { expandAllSkins, skinCss, skinsModule, skinsToData } from './skins-core.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FONTS_DIR = join(REPO_ROOT, 'assets', 'fonts');
const ZOO_STYLES_DIR = join(REPO_ROOT, 'design-system', 'source', 'zoo', 'styles');
const ZOO_SKINS_MODULE = join(REPO_ROOT, 'design-system', 'source', 'zoo', 'data', 'skins.mjs');

// The shipped, scope-class-prefixed CSS bundles are generated from the very same
// style sources the zoo compiles — never authored in parallel — so a consumer's
// import can never lag the showcase. Zoo-only files (base.css, type.css,
// themes.css, responsive.css) style the page, not the system, and stay internal.
// Effects sources are listed in the zoo's own cascade order.
const SHIPPED_COMPONENT_SOURCES = ['components.css'];
const SHIPPED_EFFECTS_SOURCES = ['atmosphere.css', 'material.css', 'states.css', 'weather.css'];

// Self-hosted fonts. Every @font-face rule — the base64-inlined flavour the zoo
// embeds AND the relative-url flavour shipped as values/css/fonts.css — is
// generated from the canonical face definitions in assets/fonts/faces.json
// (family, file, style, declared weight range), so the two outputs can never
// drift and no family/weight string is hardcoded here. The zoo inlines the
// binaries to stay a single self-contained file (no network, openable over
// file://); the consumer bundle keeps the CSS small and cacheable with relative
// urls resolving to its fonts/ directory. Deterministic — same bytes every build.
export function loadFaces(fontsDir = FONTS_DIR) {
  return JSON.parse(readFileSync(join(fontsDir, 'faces.json'), 'utf8')).faces;
}

// The declared weight descriptor: a single value for a static face, a range for
// a variable one.
const weightDescriptor = (w) => (w.min === w.max ? `${w.min}` : `${w.min} ${w.max}`);

function faceRules(srcOf) {
  return loadFaces()
    .map(
      (f) =>
        `@font-face { font-family: '${f.family}'; font-style: ${f.style}; ` +
        `font-weight: ${weightDescriptor(f.weight)}; font-display: swap; ` +
        `src: ${srcOf(f)} format('woff2'); }`,
    )
    .join('\n');
}

// Base64-inlined flavour (embedded in the zoo HTML).
let _fontCss;
function fontCss() {
  if (_fontCss === undefined) {
    _fontCss = faceRules(
      (f) => `url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, f.file)).toString('base64')})`,
    );
  }
  return _fontCss;
}

// Relative-url flavour: shipped as values/css/fonts.css, whose urls resolve from
// values/css/ to the bundle's sibling fonts/ directory.
function fontsCssRelative() {
  return (
    '/* generated from assets/fonts/faces.json — do not edit by hand.\n' +
    '   Import this file to wire the shipped faces; urls resolve to the bundle\'s fonts/ directory. */\n' +
    faceRules((f) => `url(../../fonts/${f.file})`) +
    '\n'
  );
}

export class BuildAborted extends Error {
  constructor(errors) {
    super(`Build aborted: ${errors.length} token validation violation(s).`);
    this.name = 'BuildAborted';
    this.errors = errors;
  }
}

// Expand the canonical skin source through the derivation registry and emit one
// importable skin CSS file per non-base skin under the dedupe-safe data-skin
// slot, plus the generated zoo skin-data module. Returns the expanded skins so
// the same complete role sets drive the zoo render (single source, no drift).
// Halts the build — naming the skin, role, and missing rule or input — if any
// skin fails to expand (an unregistered rule or an input that is not a supplied
// role), so a skin can never silently strand a colour role.
// `skinsPath` injects a foreign skin source (tests exercise the halt); the
// checked-in zoo module is then left alone — it is regenerated only from the
// canonical source, never from a fixture.
export function emitSkins(distDir, { skinsPath } = {}) {
  const { skins } = expandAllSkins(skinsPath ? { skinsPath } : undefined);
  const failures = skins.flatMap((s) => s.errors.map((e) => e.message));
  if (failures.length > 0) {
    throw new Error(`Skin expansion failed:\n  - ${failures.join('\n  - ')}`);
  }
  const skinsDir = join(distDir, 'css', 'skins');
  mkdirSync(skinsDir, { recursive: true });
  for (const skin of skins) {
    if (skin.base) continue; // the base skin renders from the base token CSS
    writeFileSync(join(skinsDir, `${skin.id}.css`), skinCss(skin));
  }
  // The generated zoo skin-data module is regenerated into the source tree, the
  // same way compileRecipes regenerates recipes/index.json, so the demonstrated
  // skins and the shipped skin files come from one source and cannot diverge.
  if (!skinsPath) writeFileSync(ZOO_SKINS_MODULE, skinsModule(skins));
  return skinsToData(skins);
}

let _registered = false;
function registerOnce() {
  if (_registered) return;
  _registered = true;

  // Tailwind name rule: insert the literal `ontwerp` segment after the first
  // path segment of the already-kebabed name (`color.text.muted` →
  // `--color-ontwerp-text-muted`). Runs after `name/kebab` (platform transforms
  // are appended after the transformGroup's), so it only splices the namespace
  // segment into the derived name. Uniform — component tokens included
  // (`--button-ontwerp-text-default`) — because every `@theme` variable lands on
  // :root in the consumer. Applied only on the Tailwind platform; the plain CSS
  // outputs are confined by :root-vs-scope, not by naming.
  StyleDictionary.registerTransform({
    name: 'name/ontwerp/tailwind',
    type: 'name',
    transform: (token) => {
      const first = String(token.path[0]);
      if (token.name === first) return `${first}-ontwerp`;
      if (!token.name.startsWith(`${first}-`)) {
        throw new Error(
          `Tailwind namespacing: derived name "${token.name}" does not begin with its first path segment "${first}".`,
        );
      }
      return `${first}-ontwerp-${token.name.slice(first.length + 1)}`;
    },
  });

  // ESM object: keys are the derived (kebab) names, values are resolved. Typed
  // via a sibling .d.ts. No file header → deterministic output.
  StyleDictionary.registerFormat({
    name: 'esm/object',
    format: ({ dictionary }) => {
      const lines = dictionary.allTokens.map(
        (t) => `  ${JSON.stringify(t.name)}: ${JSON.stringify(t.$value ?? t.value)},`,
      );
      return `const tokens = {\n${lines.join('\n')}\n};\n\nexport default tokens;\n`;
    },
  });

  StyleDictionary.registerFormat({
    name: 'esm/dts',
    format: ({ dictionary }) => {
      const lines = dictionary.allTokens.map((t) => `  ${JSON.stringify(t.name)}: string;`);
      return `declare const tokens: {\n${lines.join('\n')}\n};\n\nexport default tokens;\n`;
    },
  });

  // Structured manifest: one entry per token carrying the metadata the flat
  // CSS/JS outputs drop (tier, $type, raw alias + full alias chain, description).
  // Tier comes from the source file path; the raw alias from the pre-resolution
  // original value; the chain from walking those originals down to the token
  // that holds the raw value. `value` stays fully resolved — the manifest (with
  // the JS output) is the resolved-data surface now that the CSS keeps aliases
  // live as var() references.
  StyleDictionary.registerFormat({
    name: 'json/manifest',
    format: ({ dictionary }) => {
      // Pure-alias ref of a token's *source* value, or null for raw values.
      const refOf = (t) => {
        const original = t?.original?.$value ?? t?.original?.value;
        return typeof original === 'string' && /^\{.+\}$/.test(original.trim())
          ? original.trim().slice(1, -1)
          : null;
      };
      const byPath = new Map(dictionary.allTokens.map((t) => [t.path.join('.'), t]));
      const entries = dictionary.allTokens.map((t) => {
        const fp = (t.filePath ?? '').replaceAll('\\', '/');
        const tier = TIERS.find((x) => fp.includes(`/${x}/`)) ?? null;
        const ref = refOf(t);
        const entry = {
          path: t.path.join('.'),
          name: t.name,
          tier,
          type: t.$type ?? t.type ?? null,
          value: t.$value ?? t.value,
          ref,
        };
        if (ref) {
          // Ordered dot-paths from the immediate reference down to the token
          // holding the raw value. Validation forbids dangling/circular refs;
          // the seen-guard keeps this walk total regardless.
          const chain = [];
          const seen = new Set();
          let next = ref;
          while (next && !seen.has(next)) {
            seen.add(next);
            chain.push(next);
            next = refOf(byPath.get(next));
          }
          entry.chain = chain;
        }
        const description = t.$description ?? t.description;
        if (description) entry.description = description;
        return entry;
      });
      return `${JSON.stringify(entries, null, 2)}\n`;
    },
  });
}

function makeConfig(tokensDir, distDir, scopeClass) {
  const fileHeader = false;
  return {
    source: [`${tokensDir}/**/*.tokens.json`],
    usesDtcg: true,
    log: { verbosity: 'silent' },
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `${distDir}/css/`,
        files: [
          {
            destination: 'tokens.css',
            format: 'css/variables',
            options: { selector: ':root', outputReferences: true, showFileHeader: fileHeader },
          },
          // The scoped variant: the identical token set emitted by the same
          // Style Dictionary run, under the scope class instead of :root — an
          // island consumer imports this and applies the class to a subtree.
          {
            destination: 'tokens.scoped.css',
            format: 'css/variables',
            options: { selector: scopeClass, outputReferences: true, showFileHeader: fileHeader },
          },
        ],
      },
      tailwind: {
        transformGroup: 'css',
        transforms: ['name/ontwerp/tailwind'],
        buildPath: `${distDir}/tailwind/`,
        files: [
          {
            destination: 'theme.css',
            format: 'css/variables',
            options: { selector: '@theme', outputReferences: true, showFileHeader: fileHeader },
          },
        ],
      },
      js: {
        transforms: ['attribute/cti', 'name/kebab', 'color/css'],
        buildPath: `${distDir}/js/`,
        files: [
          { destination: 'tokens.js', format: 'esm/object' },
          { destination: 'tokens.d.ts', format: 'esm/dts' },
        ],
      },
      manifest: {
        transforms: ['attribute/cti', 'name/kebab', 'color/css'],
        buildPath: `${distDir}/manifest/`,
        files: [{ destination: 'tokens.json', format: 'json/manifest' }],
      },
    },
  };
}

function compileRecipes(recipesDir) {
  try {
    const files = readdirSync(recipesDir).filter((f) => f.endsWith('.recipes.json'));
    const allRecipes = [];
    for (const file of files) {
      const content = JSON.parse(readFileSync(join(recipesDir, file), 'utf8'));
      if (Array.isArray(content)) {
        allRecipes.push(...content);
      } else {
        allRecipes.push(content);
      }
    }
    writeFileSync(join(recipesDir, 'index.json'), JSON.stringify(allRecipes, null, 2) + '\n');
  } catch (err) {
    console.warn('Warning: Failed to compile recipes:', err.message);
  }
}

// The boundary reset primitive, shipped inside BOTH token CSS outputs (it bounds
// the voice the tokens establish, and whole-app consumers need it too). Applied to
// a descendant seam inside a scoped (or whole-app) subtree it stops the system's
// inherited voice: the font slots are re-pointed to a consumer-overridable custom
// property (--<scope>-boundary-font, neutral system stack by default) — a fresh
// slot, not a reference, because the in-scope token value is exactly the value a
// boundary must escape — and the three inherited voice properties are pinned.
function boundaryCss(scopeClass) {
  const name = scopeClass.slice(1); // ".ontwerp" → "ontwerp"
  const slot = `var(--${name}-boundary-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)`;
  return `/* boundary primitive — stops the system's inherited voice at a descendant seam.
   Set --${name}-boundary-font on or above the boundary to re-point the bounded voice. */
.${name}-boundary {
  --font-sans: ${slot};
  --font-heading: ${slot};
  font-family: ${slot};
  text-transform: none;
  letter-spacing: normal;
}
`;
}

// Split a selector list on top-level commas (paren-aware, so `:is(a, b)` stays whole).
function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Scope a shipped style source by descendant-prefixing every class-rooted
 * selector with the scope class (`.btn` → `.ontwerp .btn`). Deliberately strict:
 * any selector it cannot confidently scope — anything not rooted in a class —
 * fails the build rather than passing through bare, as do at-rules it does not
 * know to be safe. @keyframes / @property / @font-face pass through unchanged
 * (they are document-global by nature; keyframe names are namespaced at source);
 * @media / @supports recurse.
 */
export function scopeCss(cssText, scopeClass, sourceLabel = 'css') {
  const fail = (msg) => {
    throw new Error(`Cannot scope ${sourceLabel}: ${msg}`);
  };
  const n = cssText.length;
  // Index just past the '}' matching the '{' at `from`.
  const blockEnd = (from) => {
    let depth = 0;
    for (let j = from; j < n; j += 1) {
      const c = cssText[j];
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) return j + 1;
      }
    }
    return fail('unbalanced braces');
  };

  let out = '';
  let i = 0;
  while (i < n) {
    const ch = cssText[i];
    if (/\s/.test(ch)) {
      out += ch;
      i += 1;
      continue;
    }
    if (cssText.startsWith('/*', i)) {
      const end = cssText.indexOf('*/', i + 2);
      if (end === -1) fail('unterminated comment');
      out += cssText.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    if (ch === '@') {
      const brace = cssText.indexOf('{', i);
      if (brace === -1) fail('at-rule without a block');
      const prelude = cssText.slice(i, brace).trim();
      const name = prelude.slice(1).split(/[\s(]/)[0];
      const end = blockEnd(brace);
      if (name === 'keyframes' || name === 'property' || name === 'font-face') {
        out += cssText.slice(i, end);
      } else if (name === 'media' || name === 'supports') {
        out += `${prelude} {\n${scopeCss(cssText.slice(brace + 1, end - 1), scopeClass, sourceLabel)}\n}`;
      } else {
        fail(`unsupported at-rule @${name} — cannot confidently scope it`);
      }
      i = end;
      continue;
    }
    // A plain style rule.
    const brace = cssText.indexOf('{', i);
    const stray = cssText.indexOf('}', i);
    if (brace === -1 || (stray !== -1 && stray < brace)) fail('unparseable rule');
    const end = blockEnd(brace);
    const body = cssText.slice(brace, end);
    if (body.indexOf('{', 1) !== -1) fail('nested rules are unsupported');
    const scoped = splitSelectorList(cssText.slice(i, brace))
      .map((sel) => {
        if (!/^\.[A-Za-z_][A-Za-z0-9_-]*/.test(sel)) {
          fail(`selector "${sel}" is not class-rooted; refusing to emit it bare`);
        }
        return `${scopeClass} ${sel}`;
      })
      .join(', ');
    out += `${scoped} ${body}`;
    i = end;
  }
  return out;
}

// Generate the shipped scoped bundles from the zoo's own style sources.
function buildScopedBundles(stylesDir, distDir, scopeClass) {
  const bundle = (files) => {
    const banner =
      `/* generated — ${scopeClass}-scoped build of ${files.join(' + ')}\n` +
      `   from the showcase's style sources; do not edit by hand. */\n\n`;
    return (
      banner +
      files
        .map((f) => scopeCss(readFileSync(join(stylesDir, f), 'utf8').trim(), scopeClass, f))
        .join('\n\n')
    );
  };
  mkdirSync(join(distDir, 'css'), { recursive: true });
  writeFileSync(join(distDir, 'css', 'components.scoped.css'), bundle(SHIPPED_COMPONENT_SOURCES) + '\n');
  writeFileSync(join(distDir, 'css', 'effects.scoped.css'), bundle(SHIPPED_EFFECTS_SOURCES) + '\n');
}

// Assemble the consumer bundle: a clean, self-contained, agent-readable surface
// under <distDir>/release/, built from the freshly built outputs plus the durable
// design surface. It deliberately excludes dev machinery (scripts, tests, openspec,
// the accepted-zoo baseline). Cleared and rewritten each time so re-assembly from
// unchanged inputs is deterministic.
export function assembleBundle(root, distDir) {
  const out = join(distDir, 'release');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const ds = (...p) => join(root, 'design-system', ...p);
  const copy = (src, dest) => cpSync(src, join(out, dest), { recursive: true });

  // built values (css / js / tailwind / manifest)
  for (const d of ['css', 'js', 'tailwind', 'manifest']) copy(join(distDir, d), join('values', d));
  // durable design surface
  copy(ds('language'), 'language');
  copy(ds('recipes'), 'recipes');
  copy(ds('source', 'zoo'), join('zoo', 'source'));
  copy(join(distDir, 'zoo', 'index.html'), join('zoo', 'index.html'));
  copy(join(root, 'assets', 'fonts'), 'fonts');
  // entry docs, pin-file template, version + changelog
  copy(ds('brief.md'), 'brief.md');
  copy(ds('templates', 'consumer-AGENTS.md'), 'AGENTS.md');
  copy(ds('templates', 'consumer-README.md'), 'README.md');
  copy(ds('templates', 'DESIGN.md'), join('templates', 'DESIGN.md'));
  copy(ds('VERSION'), 'VERSION');
  copy(join(root, 'CHANGELOG.md'), 'CHANGELOG.md');

  return out;
}

/**
 * Validate then build. Throws BuildAborted (without writing output) if invalid.
 * `scopeClass` names the selector the scoped CSS outputs are confined to
 * (default `.ontwerp`; the published bundle always carries the default — the
 * parameter exists so a fork can rebrand the scope). `stylesDir` points at the
 * zoo style sources the scoped bundles AND the showcase are generated from
 * (default: the repo's own zoo styles; tests may point it at an edited copy).
 * @param {{tokensDir?: string, distDir?: string, scopeClass?: string, stylesDir?: string}} opts
 */
export async function runBuild({
  tokensDir = 'tokens',
  distDir = 'dist',
  scopeClass = '.ontwerp',
  stylesDir = ZOO_STYLES_DIR,
} = {}) {
  const root = REPO_ROOT;
  if (!/^\.[A-Za-z_][A-Za-z0-9_-]*$/.test(scopeClass)) {
    throw new Error(`scopeClass must be a single class selector like ".ontwerp", got "${scopeClass}"`);
  }
  compileRecipes(join(root, 'design-system', 'recipes'));

  const { errors } = validateTokenDir(tokensDir);
  if (errors.length > 0) throw new BuildAborted(errors);

  registerOnce();
  const sd = new StyleDictionary(makeConfig(tokensDir, distDir, scopeClass));
  await sd.buildAllPlatforms();

  // Ship the boundary reset primitive inside both token CSS outputs (no extra
  // import to forget; both files come from this same run, so they cannot drift).
  const boundary = boundaryCss(scopeClass);
  for (const f of ['tokens.css', 'tokens.scoped.css']) {
    const p = join(distDir, 'css', f);
    writeFileSync(p, `${readFileSync(p, 'utf8')}\n${boundary}`);
  }

  // Emit the scoped component + effects bundles from the zoo's style sources.
  buildScopedBundles(stylesDir, distDir, scopeClass);

  // Emit the importable fonts CSS next to tokens.css. Generated from the same
  // canonical face definitions the zoo inlines; the release assembly copies it
  // into values/css/ where its relative urls resolve to the shipped fonts/.
  writeFileSync(join(distDir, 'css', 'fonts.css'), fontsCssRelative());

  // Expand the canonical skin source into complete role sets: emit the importable
  // per-skin CSS (dist/css/skins/) and regenerate the zoo skin-data module. The
  // returned skins drive the zoo render below, so the demo and the shipped files
  // are one and the same.
  const skins = emitSkins(distDir);

  // Generate the zoo from the freshly built artifacts only (the manifest
  // and the token CSS) — never from the token sources — so it reflects exactly
  // what ships. Inputs are inlined into a single self-contained HTML file.
  const manifest = JSON.parse(readFileSync(join(distDir, 'manifest', 'tokens.json'), 'utf8'));
  const tokenCss = readFileSync(join(distDir, 'css', 'tokens.css'), 'utf8');
  const html = renderShowcase({ manifest, tokenCss, fontCss: fontCss(), stylesDir, skins });
  mkdirSync(join(distDir, 'zoo'), { recursive: true });
  writeFileSync(join(distDir, 'zoo', 'index.html'), html);

  // Assemble the consumer bundle from the built outputs + the durable surface.
  assembleBundle(root, distDir);

  return { errors: [] };
}
