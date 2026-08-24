// The skin engine: the executable twin of the colour role contract (C3).
//
// A skin is authored as ONLY its supply-provenance roles (paper, ink, accent,
// destructive — the four whose semantic-token provenance is `supply`). This
// module reads that canonical supply set, the semantic colour tokens' provenance
// ($extensions["ontwerp.role"]), and the derivation registry
// (design-system/language/colour.derivations.json), and expands each skin into a
// COMPLETE colour role set: every `derive`-provenance role computed offline from
// the skin's supplied core.
//
// The offline compute is required because the derived semantic tokens alias
// cream/oxblood *primitives* — DTCG carries no arithmetic, so a four-role runtime
// override cannot re-derive the greys/borders/blooms/destructive. The build emits
// explicit computed literals instead; component tokens still follow their live
// C2 aliases to the semantic roles the skin sets.
//
// No hard-coded role list lives here: the roles, their provenance, and each
// derived role's rule ID all come from the token source. Deterministic — the same
// supply set + registry yield byte-identical output every run.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SKINS_SOURCE = join(REPO_ROOT, 'design-system', 'source', 'skins', 'skins.json');
const SEMANTIC_DIR = join(REPO_ROOT, 'design-system', 'source', 'values', 'semantic');
const REGISTRY_PATH = join(REPO_ROOT, 'design-system', 'language', 'colour.derivations.json');

// The kebab custom-property name for a role path: the documented name-derivation
// rule (path segments joined by "-"), so `color.text.on-ink` → `color-text-on-ink`
// — exactly the built token name the skin override must re-link.
export function roleVarName(path) {
  return path.split('.').join('-');
}

// --- Colour arithmetic (the registry's three formula kinds) ---

function parseHex(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(String(hex).trim());
  if (!m) throw new Error(`skin colour "${hex}" is not a 6-digit hex value`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function toHex({ r, g, b }) {
  const h = (c) => Math.round(c).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

// Match the shipped primitive style: `rgba(31, 27, 22, 0.65)`.
function toRgba({ r, g, b }, step) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${step / 100})`;
}

// Interpolate a toward b by ratio in sRGB (a*(1-t) + b*t per channel).
function mix(a, b, ratio) {
  return {
    r: a.r * (1 - ratio) + b.r * ratio,
    g: a.g * (1 - ratio) + b.g * ratio,
    b: a.b * (1 - ratio) + b.b * ratio,
  };
}

/**
 * Apply one registered rule over a resolver that returns a supplied role's raw
 * value. Returns the computed CSS value string. Throws (naming role + reason) on
 * an unknown formula kind or an input that is not a supplied role — the caller
 * decides whether to halt (build) or collect (validation gate).
 */
export function applyRule(rule, resolve) {
  const input = (i) => {
    const v = resolve(rule.inputs[i]);
    if (v === undefined) {
      throw new Error(`input "${rule.inputs[i]}" is not one of the skin's supplied roles`);
    }
    return v;
  };
  const { formula } = rule;
  if (formula.kind === 'identity') {
    return input(0);
  }
  if (formula.kind === 'alpha') {
    return toRgba(parseHex(input(0)), formula.step);
  }
  if (formula.kind === 'mix') {
    const c = mix(parseHex(input(0)), parseHex(input(1)), formula.ratio);
    return formula.alpha === undefined ? toHex(c) : toRgba(c, formula.alpha);
  }
  throw new Error(`unknown formula kind "${formula.kind}"`);
}

// --- The role contract, read from the token source ---

function isToken(node) {
  return node && typeof node === 'object' && !Array.isArray(node) && '$value' in node;
}

function* walkColorTokens(node, path = [], inheritedType) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const type = typeof node.$type === 'string' ? node.$type : inheritedType;
  if (isToken(node)) {
    yield { path: path.join('.'), type, token: node };
    return;
  }
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    yield* walkColorTokens(node[key], [...path, key], type);
  }
}

/**
 * The ordered colour-role contract: every semantic token of type `color`, in
 * source order, with its provenance and (for derived roles) its rule ID. Read
 * from every semantic *.tokens.json so a new colour file is covered automatically.
 * @param {string} [semanticDir]
 * @returns {Array<{path: string, name: string, provenance: string, derivation?: string}>}
 */
export function loadRoleContract(semanticDir = SEMANTIC_DIR) {
  const roles = [];
  for (const file of readdirSync(semanticDir).sort()) {
    if (!file.endsWith('.tokens.json')) continue;
    const data = JSON.parse(readFileSync(join(semanticDir, file), 'utf8'));
    for (const { path, type, token } of walkColorTokens(data)) {
      if (type !== 'color') continue;
      const role = token.$extensions?.['ontwerp.role'];
      if (!role) continue;
      roles.push({
        path,
        name: roleVarName(path),
        provenance: role.provenance,
        derivation: role.derivation,
      });
    }
  }
  return roles;
}

export function loadRegistry(registryPath = REGISTRY_PATH) {
  const list = JSON.parse(readFileSync(registryPath, 'utf8'));
  return new Map(list.map((r) => [r.id, r]));
}

export function loadSkinSource(skinsPath = SKINS_SOURCE) {
  return JSON.parse(readFileSync(skinsPath, 'utf8'));
}

// --- Skin expansion ---

/**
 * Expand one skin's supply set into its complete role set. Never throws; returns
 * the computed props (ordered [name, value] pairs) plus any expansion errors,
 * each naming the skin, the role, and the missing rule or input. `props` also
 * carries `--color-ink` (the primitive the zoo's Ben-Day halftone reads directly)
 * set to the skin's supplied ink, so the halftone reskins with the role set.
 * @returns {{ props: Array<[string, string]>, errors: Array<{role: string, message: string}> }}
 */
export function computeSkinRoles(skin, roles, rulesById) {
  const supply = skin.supply ?? {};
  const resolve = (path) => supply[path];
  const props = [];
  const errors = [];

  // The primitive halftone anchor: the skin's ink, ahead of the roles.
  if (supply['color.text.default'] !== undefined) {
    props.push(['color-ink', supply['color.text.default']]);
  }

  for (const role of roles) {
    if (role.provenance === 'supply') {
      const value = supply[role.path];
      if (value === undefined) {
        errors.push({ role: role.path, message: `skin "${skin.id}" omits supplied role "${role.path}"` });
        continue;
      }
      props.push([role.name, value]);
      continue;
    }
    // derive
    const rule = rulesById.get(role.derivation);
    if (!rule) {
      errors.push({
        role: role.path,
        message: `skin "${skin.id}" role "${role.path}" names unregistered derivation rule "${role.derivation}"`,
      });
      continue;
    }
    try {
      props.push([role.name, applyRule(rule, resolve)]);
    } catch (err) {
      errors.push({
        role: role.path,
        message: `skin "${skin.id}" role "${role.path}" (rule "${role.derivation}"): ${err.message}`,
      });
    }
  }
  return { props, errors };
}

/**
 * Load the canonical source + contract + registry and expand every skin.
 * @returns {{ roles: Array, skins: Array<{id, label, base: boolean, props, errors}> }}
 */
export function expandAllSkins({
  skinsPath = SKINS_SOURCE,
  semanticDir = SEMANTIC_DIR,
  registryPath = REGISTRY_PATH,
} = {}) {
  const roles = loadRoleContract(semanticDir);
  const rulesById = loadRegistry(registryPath);
  const source = loadSkinSource(skinsPath);
  const skins = source.map((skin) => {
    const { props, errors } = computeSkinRoles(skin, roles, rulesById);
    return { id: skin.id, label: skin.label, base: skin.base === true, props, errors };
  });
  return { roles, skins };
}

// --- Emitters ---

/**
 * One importable skin CSS file: the complete role set under the dedupe-safe
 * `.ontwerp[data-skin="<id>"]` slot (selector shape differs from the base token
 * block, so a bundler that merges same-selector custom-property rules cannot fold
 * the override into the base), PLUS the equivalent attribute form on `:root` —
 * whole-app adoption sets data-skin on the root and imports no scope class, so
 * without the second block the file would not apply there. With both, importing
 * the file and setting the attribute are the only steps either way.
 */
export function skinCss(skin, scopeClass = '.ontwerp') {
  const decls = skin.props.map(([name, value]) => `  --${name}: ${value};`).join('\n');
  return (
    `/* generated skin — ${skin.id}. Complete colour role set computed from the skin's\n` +
    `   four supplied roles (paper, ink, accent, destructive); do not edit by hand.\n` +
    `   Import this file and set data-skin="${skin.id}" on a ${scopeClass} root (island)\n` +
    `   or on :root (whole-app) to reskin the whole colour surface. */\n` +
    `${scopeClass}[data-skin="${skin.id}"] {\n${decls}\n}\n` +
    `:root[data-skin="${skin.id}"] {\n${decls}\n}\n`
  );
}

/**
 * The runtime skin-data shape the zoo theme bar consumes: `{ id, label, vars }`,
 * where the base skin's `vars` is null (it renders from the base token CSS) and
 * every other skin's `vars` is its complete role set keyed by kebab role name (no
 * `--` prefix). Identical in meaning to the generated `skins.mjs` module, so the
 * built zoo and the checked-in module cannot diverge.
 */
export function skinsToData(skins) {
  return skins.map((skin) =>
    skin.base
      ? { id: skin.id, label: skin.label, vars: null }
      : { id: skin.id, label: skin.label, vars: Object.fromEntries(skin.props) },
  );
}

/**
 * The generated zoo skin data module. The base skin carries `vars: null` (it
 * renders straight from the base token CSS — the hand-tuned cream primitives);
 * every other skin carries its complete computed role set as a vars object keyed
 * by kebab role name (no `--` prefix — the theme bar adds it).
 */
export function skinsModule(skins) {
  const entries = skins.map((skin) => {
    if (skin.base) {
      return `  { id: '${skin.id}', label: '${skin.label}', vars: null },`;
    }
    const vars = skin.props.map(([name, value]) => `      '${name}': '${value}',`).join('\n');
    return (
      `  {\n    id: '${skin.id}',\n    label: '${skin.label}',\n    vars: {\n${vars}\n    },\n  },`
    );
  });
  return (
    '// GENERATED from design-system/source/skins/skins.json by the build\n' +
    '// (scripts/lib/skins-core.mjs → skinsModule). Do not edit by hand: each skin is\n' +
    '// its four supplied roles expanded into the complete colour role set through the\n' +
    '// derivation registry, so switching a skin reskins every colour-carrying role —\n' +
    '// greys, disabled tier, blooms, borders, and the per-skin destructive — not just\n' +
    '// paper/ink/accent. The base (cream) skin renders from the base token CSS.\n' +
    'export const SKINS = [\n' +
    entries.join('\n') +
    '\n];\n'
  );
}
