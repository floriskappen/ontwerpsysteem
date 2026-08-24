// Conformance gate for the token contract. Two layers:
//   1. DTCG 2025.10 JSON Schema (ajv) — structure + the $type vocabulary.
//   2. Custom checks a schema cannot express — type resolvability across group
//      inheritance, the intent-based naming grammar, the three-tier reference
//      rules, and alias resolution (no dangling targets, no cycles).
//
// Everything here is pure: it operates on in-memory token entries so it can be
// unit-tested per scenario without touching disk. The CLI wrapper
// (scripts/validate.mjs) is responsible for reading files and process exit.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { computeSkinRoles, roleVarName } from './skins-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TIERS = ['primitive', 'semantic', 'component'];

// References point only "down" a tier. A token in `from` may reference a token
// in any tier listed for it. Primitives may reference nothing.
const ALLOWED_REFERENCE_TARGETS = {
  primitive: [],
  semantic: ['primitive'],
  component: ['semantic'],
};

// Appearance words are forbidden in semantic/component names: those tiers name
// intent (role/meaning), not what a value looks like. Primitives may use them.
const APPEARANCE_WORDS = new Set([
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'gray', 'grey', 'slate', 'zinc', 'neutral', 'stone', 'black',
  'white', 'brown', 'gold', 'silver',
]);

const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SCALE_RE = /^\d{2,4}$/; // numeric ramp step, e.g. 500, 600
// Alpha-ramp production at the primitive tier: `<base>-a<step>` — an existing
// base primitive at <step>% opacity (e.g. ink-a65). Step is 1–99.
const ALPHA_VARIANT_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)-a(\d{1,2})$/;

let _validateSchema;
function getSchemaValidator() {
  if (!_validateSchema) {
    const schema = JSON.parse(
      readFileSync(join(__dirname, '..', '..', 'schema', 'dtcg.schema.json'), 'utf8'),
    );
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    _validateSchema = ajv.compile(schema);
  }
  return _validateSchema;
}

// A token is a DTCG object carrying a $value. Anything else with child keys is a group.
function isToken(node) {
  return node && typeof node === 'object' && !Array.isArray(node) && '$value' in node;
}

// Walk one token file (a root group), yielding every token with its dot-path
// and the $type inherited from the nearest ancestor group (if any).
function* walkTokens(node, path = [], inheritedType) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const ownType = typeof node.$type === 'string' ? node.$type : undefined;
  const effectiveType = ownType ?? inheritedType;
  if (isToken(node)) {
    yield { path: path.join('.'), token: node, type: ownType ?? inheritedType };
    return;
  }
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    yield* walkTokens(node[key], [...path, key], effectiveType);
  }
}

// Collect every `{...}` alias appearing anywhere inside a $value (covers
// composite types whose references are nested in sub-fields).
function collectReferences(value, acc = []) {
  if (typeof value === 'string') {
    const m = value.match(/^\{([^{}]+)\}$/);
    if (m) acc.push(m[1]);
  } else if (Array.isArray(value)) {
    for (const v of value) collectReferences(v, acc);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectReferences(v, acc);
  }
  return acc;
}

function checkName(path, tier, errors, file, byPath) {
  const segments = path.split('.');
  for (const seg of segments) {
    if (!SEGMENT_RE.test(seg)) {
      errors.push({
        file,
        path,
        rule: 'naming',
        message: `Name segment "${seg}" is not lowercase kebab-case.`,
      });
    }
  }
  // Alpha-variant grammar: `<base>-a<step>` is a primitive-tier production only.
  if (tier === 'primitive') {
    const alpha = segments[segments.length - 1].match(ALPHA_VARIANT_RE);
    if (alpha) {
      const step = Number(alpha[2]);
      if (step < 1) {
        errors.push({
          file,
          path,
          rule: 'naming',
          message: `Alpha variant "${path}" has step ${alpha[2]}; the opacity step must be an integer from 1 to 99.`,
        });
      }
      const basePath = [...segments.slice(0, -1), alpha[1]].join('.');
      const base = byPath?.get(basePath);
      if (!base || base.tier !== 'primitive') {
        errors.push({
          file,
          path,
          rule: 'naming',
          message:
            `Alpha variant "${path}" has no base primitive "${basePath}" in its collection; ` +
            `an -a<step> name must be an alpha-ramp step over an existing base.`,
        });
      }
    }
  }
  if (tier === 'semantic' || tier === 'component') {
    for (const seg of segments) {
      if (ALPHA_VARIANT_RE.test(seg)) {
        errors.push({
          file,
          path,
          rule: 'naming',
          message:
            `Name "${path}" carries the alpha-variant suffix ("${seg}"); ${tier} tokens must name ` +
            `intent, not composition — alpha ramps live at the primitive tier.`,
        });
        break;
      }
    }
    for (const seg of segments) {
      for (const part of seg.split('-')) {
        if (APPEARANCE_WORDS.has(part) || SCALE_RE.test(part)) {
          errors.push({
            file,
            path,
            rule: 'naming',
            message:
              `Name "${path}" encodes appearance ("${part}"); ${tier} tokens must name intent ` +
              `(e.g. color.text.muted), not appearance (e.g. color.blue-500).`,
          });
          break;
        }
      }
    }
  }
}

/**
 * Validate a set of already-parsed token entries.
 * @param {Array<{tier: string, file: string, data: object}>} entries
 * @param {{derivations?: unknown, colourDoc?: string, skins?: unknown}} [options]
 *   `derivations`: the parsed colour derivation registry
 *   (design-system/language/colour.derivations.json) — when given, the registry
 *   itself is validated and every token `derivation` reference must resolve.
 *   `colourDoc`: the text of language/colour.md — when given, its roles table is
 *   synced against the semantic colour tokens in both directions.
 *   `skins`: the parsed canonical skin source
 *   (design-system/source/skins/skins.json) — when given (with `derivations`),
 *   the skin coverage gate asserts each skin supplies exactly the supply-provenance
 *   roles and that expanding it yields a value for every colour-carrying token.
 * @returns {{errors: Array<{file?: string, path?: string, rule: string, message: string}>}}
 */
export function validateEntries(entries, options = {}) {
  const errors = [];
  const validateSchema = getSchemaValidator();

  // Layer 1: schema (structure + $type vocabulary), per file.
  for (const { file, data } of entries) {
    if (!validateSchema(data)) {
      for (const err of validateSchema.errors ?? []) {
        errors.push({
          file,
          path: err.instancePath || '/',
          rule: 'schema',
          message: `${err.instancePath || '(root)'} ${err.message}`,
        });
      }
    }
  }

  // Flatten all tokens across all entries into a global path -> token index.
  const byPath = new Map();
  for (const { tier, file, data } of entries) {
    for (const { path, token, type } of walkTokens(data)) {
      if (byPath.has(path)) {
        errors.push({
          file,
          path,
          rule: 'duplicate',
          message: `Token path "${path}" is defined more than once.`,
        });
      }
      byPath.set(path, {
        path,
        tier,
        file,
        type,
        refs: collectReferences(token.$value),
        extensions: token.$extensions,
      });
    }
  }

  for (const entry of byPath.values()) {
    // Layer 2a: every token must resolve to a $type (own or inherited).
    if (!entry.type) {
      errors.push({
        file: entry.file,
        path: entry.path,
        rule: 'type',
        message: `Token "${entry.path}" has no resolvable $type (none on the token or any ancestor group).`,
      });
    }

    // Layer 2b: naming grammar.
    checkName(entry.path, entry.tier, errors, entry.file, byPath);

    // Layer 2c: tier / reference direction + resolution.
    const allowed = ALLOWED_REFERENCE_TARGETS[entry.tier] ?? [];
    for (const ref of entry.refs) {
      const target = byPath.get(ref);
      if (!target) {
        errors.push({
          file: entry.file,
          path: entry.path,
          rule: 'reference',
          message: `Token "${entry.path}" references "{${ref}}", which does not resolve to any token.`,
        });
        continue;
      }
      if (entry.tier === 'primitive') {
        errors.push({
          file: entry.file,
          path: entry.path,
          rule: 'tier',
          message: `Primitive token "${entry.path}" must hold a raw value but references "{${ref}}".`,
        });
      } else if (!allowed.includes(target.tier)) {
        errors.push({
          file: entry.file,
          path: entry.path,
          rule: 'tier',
          message:
            `${entry.tier} token "${entry.path}" references ${target.tier} token "{${ref}}"; ` +
            `${entry.tier} tokens may only reference ${allowed.join(', ') || 'nothing'}.`,
        });
      }
    }
  }

  // Layer 2d: no cyclic alias chains.
  detectCycles(byPath, errors);

  // Layer 2e: skin provenance — every semantic colour token declares whether a
  // skin supplies its value or a derivation rule computes it.
  const roleProvenance = checkProvenance(byPath, errors);

  // Layer 2f: the derivation registry (shape, unique IDs, supply-only inputs)
  // and resolution of every token's `derivation` reference against it.
  if (options.derivations !== undefined) {
    checkDerivations(options.derivations, roleProvenance, errors);
  }

  // Layer 2g: the roles table in language/colour.md stays in sync with the
  // semantic colour tokens, in both directions, including provenance.
  if (typeof options.colourDoc === 'string') {
    checkRolesTable(options.colourDoc, roleProvenance, errors);
  }

  // Layer 2h: the skin coverage gate — every skin's supply set is exactly the
  // supply-provenance role set, and expanding it leaves no colour-carrying
  // token without a supplied-or-derived value. Needs the registry to expand
  // against (the same one the build uses).
  if (options.skins !== undefined && options.derivations !== undefined) {
    checkSkinCoverage(options.skins, roleProvenance, options.derivations, errors);
  }

  return { errors };
}

// Every semantic-tier token of type `color` must carry
// $extensions["ontwerp.role"]: { provenance: "supply" | "derive", derivation? }.
// "derive" names the registry rule that produces the value; "supply" must not.
// Returns the map of conforming roles (path -> { provenance, derivation }).
function checkProvenance(byPath, errors) {
  const roleProvenance = new Map();
  for (const entry of byPath.values()) {
    if (entry.tier !== 'semantic' || entry.type !== 'color') continue;
    const role = entry.extensions?.['ontwerp.role'];
    if (
      !role || typeof role !== 'object' || Array.isArray(role) ||
      (role.provenance !== 'supply' && role.provenance !== 'derive')
    ) {
      errors.push({
        file: entry.file,
        path: entry.path,
        rule: 'provenance',
        message:
          `Semantic colour token "${entry.path}" declares no skin provenance; add ` +
          `$extensions["ontwerp.role"] with provenance "supply" or "derive".`,
      });
      continue;
    }
    if (role.provenance === 'derive' && typeof role.derivation !== 'string') {
      errors.push({
        file: entry.file,
        path: entry.path,
        rule: 'provenance',
        message:
          `Semantic colour token "${entry.path}" declares provenance "derive" but names no ` +
          `derivation rule; add a "derivation" field with a registered rule ID.`,
      });
      continue;
    }
    if (role.provenance === 'supply' && role.derivation !== undefined) {
      errors.push({
        file: entry.file,
        path: entry.path,
        rule: 'provenance',
        message:
          `Semantic colour token "${entry.path}" declares provenance "supply" but carries a ` +
          `"derivation" reference — a supplied value has no producing rule.`,
      });
      continue;
    }
    roleProvenance.set(entry.path, { provenance: role.provenance, derivation: role.derivation, file: entry.file });
  }
  return roleProvenance;
}

// The colour derivation registry: an array of { id, inputs, formula } rules.
// IDs are unique; inputs reference existing skin-supplied semantic colour roles
// only (a complete skin = the supplied set; everything else computes in one
// pass); every token `derivation` reference resolves to a registered ID.
function checkDerivations(derivations, roleProvenance, errors) {
  const REGISTRY_FILE = 'design-system/language/colour.derivations.json';
  if (!Array.isArray(derivations)) {
    errors.push({
      file: REGISTRY_FILE,
      rule: 'derivation',
      message: 'The colour derivation registry must be an array of { id, inputs, formula } rules.',
    });
    return;
  }
  const ids = new Set();
  for (const [i, rule] of derivations.entries()) {
    const label = rule && typeof rule === 'object' && typeof rule.id === 'string' ? `"${rule.id}"` : `at index ${i}`;
    const complete =
      rule && typeof rule === 'object' && !Array.isArray(rule) &&
      typeof rule.id === 'string' &&
      Array.isArray(rule.inputs) && rule.inputs.length > 0 && rule.inputs.every((x) => typeof x === 'string') &&
      rule.formula && typeof rule.formula === 'object' && typeof rule.formula.kind === 'string';
    if (!complete) {
      errors.push({
        file: REGISTRY_FILE,
        path: rule?.id,
        rule: 'derivation',
        message: `Derivation rule ${label} is incomplete; each rule needs an "id", non-empty "inputs", and a "formula" naming its kind.`,
      });
      continue;
    }
    if (ids.has(rule.id)) {
      errors.push({
        file: REGISTRY_FILE,
        path: rule.id,
        rule: 'derivation',
        message: `Duplicate derivation rule ID "${rule.id}".`,
      });
    }
    ids.add(rule.id);
    for (const input of rule.inputs) {
      const p = roleProvenance.get(input);
      if (!p || p.provenance !== 'supply') {
        errors.push({
          file: REGISTRY_FILE,
          path: rule.id,
          rule: 'derivation',
          message:
            `Derivation rule "${rule.id}" input "${input}" is not a skin-supplied semantic colour ` +
            `role; derivations compute from supplied roles only (no chains).`,
        });
      }
    }
  }
  for (const [path, role] of roleProvenance) {
    if (role.provenance === 'derive' && !ids.has(role.derivation)) {
      errors.push({
        file: role.file,
        path,
        rule: 'derivation',
        message: `Token "${path}" names unregistered derivation rule "${role.derivation}"; register it in ${REGISTRY_FILE}.`,
      });
    }
  }
}

// Repo-relative label of the canonical skin source, used on every skin-
// coverage error; the on-disk path itself is resolved from tokensDir in
// validateTokenDir.
const SKINS_FILE = 'design-system/source/skins/skins.json';

// The skin coverage gate. For every skin in the canonical source:
//   1. its supply set is EXACTLY the supply-provenance role set — no omitted
//      supply role, no supplied role whose provenance is derive, no key that
//      is not a semantic colour role at all;
//   2. expanding it through the derivation registry (the same computeSkinRoles
//      the build uses, so gate and build cannot drift) leaves every
//      colour-carrying token with a value — each either supplied or produced
//      by its registered rule over the supplied roles.
// Every failure names the skin and the offending role.
function checkSkinCoverage(skins, roleProvenance, derivations, errors) {
  if (!Array.isArray(skins)) {
    errors.push({
      file: SKINS_FILE,
      rule: 'skin-coverage',
      message: 'The canonical skin source must be an array of { id, label, supply } skins.',
    });
    return;
  }
  const roles = [...roleProvenance.entries()].map(([path, role]) => ({
    path,
    name: roleVarName(path),
    provenance: role.provenance,
    derivation: role.derivation,
  }));
  const rulesById = new Map(
    (Array.isArray(derivations) ? derivations : [])
      .filter((r) => r && typeof r === 'object' && !Array.isArray(r) && typeof r.id === 'string')
      .map((r) => [r.id, r]),
  );
  for (const [i, skin] of skins.entries()) {
    if (!skin || typeof skin !== 'object' || Array.isArray(skin) || typeof skin.id !== 'string') {
      errors.push({
        file: SKINS_FILE,
        rule: 'skin-coverage',
        message: `Skin at index ${i} is malformed; each skin needs a string "id" and a "supply" object.`,
      });
      continue;
    }
    const id = skin.id;
    const supply = skin.supply && typeof skin.supply === 'object' && !Array.isArray(skin.supply) ? skin.supply : {};

    // 1. exact supply-set match against the provenance contract.
    const supplyPaths = new Set(Object.keys(supply));
    for (const role of roles) {
      if (role.provenance === 'supply' && !supplyPaths.has(role.path)) {
        errors.push({
          file: SKINS_FILE,
          path: role.path,
          rule: 'skin-coverage',
          message: `Skin "${id}" omits supplied role "${role.path}"; a skin's supply set must contain exactly the supply-provenance roles.`,
        });
      }
    }
    for (const path of supplyPaths) {
      const provenance = roleProvenance.get(path)?.provenance;
      if (provenance === 'derive') {
        errors.push({
          file: SKINS_FILE,
          path,
          rule: 'skin-coverage',
          message: `Skin "${id}" supplies "${path}", whose declared provenance is derived; a skin supplies only the supply-provenance roles — the rest compute.`,
        });
      } else if (provenance === undefined) {
        errors.push({
          file: SKINS_FILE,
          path,
          rule: 'skin-coverage',
          message: `Skin "${id}" supplies "${path}", which is not a colour-carrying semantic role; a skin supplies only the supply-provenance roles.`,
        });
      }
    }

    // 2. expansion completeness: no stranded token. An omitted supply role is
    // already reported above (and a supplied one always lands in props), so
    // this pass only adds the derived gaps their absence causes.
    const { props } = computeSkinRoles({ id, supply }, roles, rulesById);
    const covered = new Set(props.map(([name]) => name));
    for (const role of roles) {
      if (role.provenance !== 'derive') continue;
      if (!covered.has(role.name)) {
        errors.push({
          file: SKINS_FILE,
          path: role.path,
          rule: 'skin-coverage',
          message: `Skin "${id}" strands colour token "${role.path}" — it is neither supplied nor produced by its derivation over the skin's supplied roles.`,
        });
      }
    }
  }
}

// The roles table in language/colour.md: one row per semantic colour role —
// first cell the backticked token path, last cell the provenance, written
// `supply` or `derive · \`rule-id\``. Checked in both directions against the
// token source. The checked surface is deliberately minimal (path + provenance);
// a malformed row fails loudly rather than passing silently.
function checkRolesTable(colourDoc, roleProvenance, errors) {
  const DOC_FILE = 'design-system/language/colour.md';
  const rows = new Map();
  for (const line of colourDoc.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const pathMatch = cells[0]?.match(/^`(color\.[a-z0-9.-]+)`$/);
    if (!pathMatch) continue; // header / separator / prose tables
    const path = pathMatch[1];
    const provCell = cells[cells.length - 1] ?? '';
    let provenance = null;
    let derivation;
    if (provCell === 'supply') {
      provenance = 'supply';
    } else {
      const dm = provCell.match(/^derive\s*·\s*`([a-z0-9-]+)`$/);
      if (dm) {
        provenance = 'derive';
        derivation = dm[1];
      }
    }
    if (!provenance) {
      errors.push({
        file: DOC_FILE,
        path,
        rule: 'roles-table',
        message:
          `Roles-table row for "${path}" has a malformed provenance cell "${provCell}"; ` +
          'expected "supply" or "derive · `rule-id`".',
      });
      continue;
    }
    rows.set(path, { provenance, derivation });
  }
  for (const [path, role] of roleProvenance) {
    const row = rows.get(path);
    if (!row) {
      errors.push({
        file: DOC_FILE,
        path,
        rule: 'roles-table',
        message: `Semantic colour token "${path}" is missing from the roles table in ${DOC_FILE}.`,
      });
      continue;
    }
    if (row.provenance !== role.provenance || (role.provenance === 'derive' && row.derivation !== role.derivation)) {
      const describe = (p, d) => (p === 'derive' ? `derive · ${d}` : p);
      errors.push({
        file: DOC_FILE,
        path,
        rule: 'roles-table',
        message:
          `Roles-table provenance for "${path}" (${describe(row.provenance, row.derivation)}) contradicts ` +
          `the token's declared provenance (${describe(role.provenance, role.derivation)}).`,
      });
    }
  }
  for (const path of rows.keys()) {
    if (!roleProvenance.has(path)) {
      errors.push({
        file: DOC_FILE,
        path,
        rule: 'roles-table',
        message: `Roles-table row "${path}" has no backing semantic colour token.`,
      });
    }
  }
}

function detectCycles(byPath, errors) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map([...byPath.keys()].map((k) => [k, WHITE]));
  const reported = new Set();

  function visit(path, stack) {
    color.set(path, GRAY);
    const node = byPath.get(path);
    for (const ref of node?.refs ?? []) {
      if (!byPath.has(ref)) continue; // dangling already reported
      const c = color.get(ref);
      if (c === GRAY) {
        const cycle = [...stack.slice(stack.indexOf(ref)), ref].join(' -> ');
        if (!reported.has(cycle)) {
          reported.add(cycle);
          errors.push({
            path,
            rule: 'reference',
            message: `Circular reference detected: ${cycle}.`,
          });
        }
      } else if (c === WHITE) {
        visit(ref, [...stack, ref]);
      }
    }
    color.set(path, BLACK);
  }

  for (const path of byPath.keys()) {
    if (color.get(path) === WHITE) visit(path, [path]);
  }
}

// --- Font contract (weights vs. shipped faces) ---
//
// A minimal woff2 reader: enough of RFC 8478 brotli (Node built-in) + the WOFF2
// table directory to locate the untransformed `fvar` / `OS/2` tables and report
// a font file's REAL weight coverage. Deliberately no new dependency, and
// deliberately read from the binary at validation time — a hand-recorded
// coverage value would re-create exactly the drift these gates exist to catch.

// The WOFF2 known-table-tag registry (flag values 0–62; 63 = arbitrary tag).
const WOFF2_KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern',
  'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty',
  'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

function readUIntBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const b = buf[pos + i];
    if (i === 0 && b === 0x80) throw new Error('UIntBase128: leading zero byte');
    if (value & 0xfe000000) throw new Error('UIntBase128: overflow');
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) return { value: value >>> 0, next: pos + i + 1 };
  }
  throw new Error('UIntBase128: exceeds 5 bytes');
}

// Decompress a woff2 buffer's table stream and return { tag -> Buffer } for the
// (untransformed) tables we care about. Transformed tables (glyf/loca/hmtx) are
// located to keep offsets right but never parsed.
function woff2Tables(buf) {
  if (buf.length < 48 || buf.toString('latin1', 0, 4) !== 'wOF2') {
    throw new Error('not a woff2 file (bad signature)');
  }
  const numTables = buf.readUInt16BE(12);
  const totalCompressedSize = buf.readUInt32BE(20);
  let pos = 48;
  const entries = [];
  for (let t = 0; t < numTables; t += 1) {
    const flags = buf[pos];
    pos += 1;
    const tagIndex = flags & 0x3f;
    const transformVersion = (flags >> 6) & 0x03;
    let tag;
    if (tagIndex === 63) {
      tag = buf.toString('latin1', pos, pos + 4);
      pos += 4;
    } else {
      tag = WOFF2_KNOWN_TAGS[tagIndex];
    }
    const orig = readUIntBase128(buf, pos);
    pos = orig.next;
    // The null transform is version 3 for glyf/loca, version 0 for every other
    // table; a non-null transform stores its transformLength in the directory.
    const nullVersion = tag === 'glyf' || tag === 'loca' ? 3 : 0;
    let streamLength = orig.value;
    if (transformVersion !== nullVersion) {
      const tr = readUIntBase128(buf, pos);
      pos = tr.next;
      streamLength = tr.value;
    }
    entries.push({ tag, streamLength, transformed: transformVersion !== nullVersion });
  }
  const decompressed = brotliDecompressSync(buf.subarray(pos, pos + totalCompressedSize));
  const tables = new Map();
  let offset = 0;
  for (const e of entries) {
    if (!e.transformed) tables.set(e.tag, decompressed.subarray(offset, offset + e.streamLength));
    offset += e.streamLength;
  }
  return tables;
}

/**
 * Report a font file's REAL weight coverage, read from the woff2 binary itself:
 * the `fvar` wght axis min/max for a variable face, `OS/2 usWeightClass` (a
 * single-point range) for a static one.
 * @returns {{min: number, max: number, variable: boolean}}
 */
export function readFontWeightCoverage(filePath) {
  const tables = woff2Tables(readFileSync(filePath));
  const fvar = tables.get('fvar');
  if (fvar) {
    const axesArrayOffset = fvar.readUInt16BE(4);
    const axisCount = fvar.readUInt16BE(8);
    const axisSize = fvar.readUInt16BE(10);
    for (let i = 0; i < axisCount; i += 1) {
      const at = axesArrayOffset + i * axisSize;
      if (fvar.toString('latin1', at, at + 4) === 'wght') {
        return {
          min: fvar.readInt32BE(at + 4) / 65536,
          max: fvar.readInt32BE(at + 12) / 65536,
          variable: true,
        };
      }
    }
  }
  const os2 = tables.get('OS/2');
  if (!os2) throw new Error(`${filePath}: no fvar wght axis and no OS/2 table — cannot determine weight coverage`);
  const w = os2.readUInt16BE(4);
  return { min: w, max: w, variable: false };
}

/**
 * The two font gates, both anchored on the canonical face definitions in
 * `<fontsDir>/faces.json`:
 *   Gate A — every `fontWeight` token value sits inside the declared weight
 *   range of the token-bound face.
 *   Gate B — every face's declared range is contained in the binary's real
 *   coverage, read from the woff2 at validation time (a static face counts as
 *   covering exactly its single weight).
 * @param {string} fontsDir directory holding faces.json and the woff2 binaries
 * @param {Array<{path: string, value: number, file?: string}>} weightTokens
 * @returns {{errors: Array}}
 */
export function validateFonts(fontsDir, weightTokens = []) {
  const errors = [];
  const facesPath = join(fontsDir, 'faces.json');
  if (!existsSync(facesPath)) {
    return {
      errors: [{ file: 'assets/fonts/faces.json', rule: 'font-face', message: 'The canonical face definition file (faces.json) is missing.' }],
    };
  }
  let faces;
  try {
    faces = JSON.parse(readFileSync(facesPath, 'utf8')).faces;
  } catch (err) {
    return { errors: [{ file: 'assets/fonts/faces.json', rule: 'font-face', message: `Failed to parse faces.json: ${err.message}` }] };
  }
  if (!Array.isArray(faces)) {
    return { errors: [{ file: 'assets/fonts/faces.json', rule: 'font-face', message: 'faces.json must carry a "faces" array.' }] };
  }

  // Gate A: fontWeight tokens vs. the token-bound face's declared range.
  const bound = faces.find((f) => f.tokenBound);
  if (!bound) {
    errors.push({
      file: 'assets/fonts/faces.json',
      rule: 'font-weight',
      message: 'No face in faces.json is marked tokenBound; the fontWeight tokens have no face to validate against.',
    });
  } else {
    for (const t of weightTokens) {
      if (typeof t.value !== 'number') continue; // aliases resolve to a numeric token checked here
      if (t.value < bound.weight.min || t.value > bound.weight.max) {
        errors.push({
          file: t.file,
          path: t.path,
          rule: 'font-weight',
          message:
            `fontWeight token "${t.path}" is ${t.value}, outside the declared weight range ` +
            `${bound.weight.min}–${bound.weight.max} of the token-bound face "${bound.family}" (${bound.file}).`,
        });
      }
    }
  }

  // Gate B: declared ranges vs. the binaries' real coverage (read every run —
  // replacing a font file is re-checked; no recorded coverage is trusted).
  for (const face of faces) {
    const filePath = join(fontsDir, face.file);
    if (!existsSync(filePath)) {
      errors.push({
        file: face.file,
        rule: 'font-face',
        message: `Face "${face.family}" declares file "${face.file}", which does not exist in ${fontsDir}.`,
      });
      continue;
    }
    let real;
    try {
      real = readFontWeightCoverage(filePath);
    } catch (err) {
      errors.push({
        file: face.file,
        rule: 'font-face',
        message: `Could not read weight coverage from "${face.file}": ${err.message}`,
      });
      continue;
    }
    if (face.weight.min < real.min || face.weight.max > real.max) {
      errors.push({
        file: face.file,
        rule: 'font-face',
        message:
          `Face "${face.family}" (${face.file}) declares weight range ${face.weight.min}–${face.weight.max}, ` +
          `but the binary's actual coverage is ${real.min}–${real.max}` +
          `${real.variable ? ' (fvar wght axis)' : ' (static face, OS/2 usWeightClass)'}. ` +
          'The declaration must not promise weights the shipped binary cannot render.',
      });
    }
  }

  return { errors };
}

// --- Filesystem helpers (used by the CLI; thin and separately testable) ---

export function tierFromRelPath(relPath) {
  const top = relPath.split(sep)[0];
  return TIERS.includes(top) ? top : null;
}

function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

/**
 * Read every *.tokens.json under `tokensDir`, assigning each a tier from its
 * directory. Files outside the three tier directories are reported as errors.
 * @returns {{entries: Array, errors: Array}}
 */
export function collectTokenFiles(tokensDir) {
  const entries = [];
  const errors = [];
  for (const full of walkFiles(tokensDir)) {
    if (!full.endsWith('.tokens.json')) continue;
    const rel = relative(tokensDir, full);
    const tier = tierFromRelPath(rel);
    if (!tier) {
      errors.push({
        file: rel,
        rule: 'structure',
        message: `Token file "${rel}" is outside the tier directories. Allowed: ${TIERS.join('/')}.`,
      });
      continue;
    }
    entries.push({ tier, file: rel, data: JSON.parse(readFileSync(full, 'utf8')) });
  }
  return { entries, errors };
}

function validateRecipesAndShowcase(root, tokenPaths, errors) {
  const recipesDir = join(root, 'design-system', 'recipes');
  let recipes = [];
  try {
    const indexPath = join(recipesDir, 'index.json');
    if (existsSync(indexPath)) {
      recipes = JSON.parse(readFileSync(indexPath, 'utf8'));
    }
  } catch (err) {
    errors.push({
      rule: 'recipes',
      message: `Failed to parse recipes index.json: ${err.message}`
    });
    return;
  }

  const recipeIds = new Set(recipes.map((r) => r.id));

  // Validate each recipe
  for (const recipe of recipes) {
    // 1. Check sourceModules exist
    for (const mod of recipe.sourceModules || []) {
      const fullModPath = join(root, mod);
      if (!existsSync(fullModPath)) {
        errors.push({
          file: `recipes/index.json`,
          path: recipe.id,
          rule: 'recipes',
          message: `Recipe "${recipe.id}" references non-existent source module: "${mod}"`
        });
      }
    }
    // 2. Check valueRefs exist
    for (const ref of recipe.valueRefs || []) {
      if (!tokenPaths.has(ref)) {
        errors.push({
          file: `recipes/index.json`,
          path: recipe.id,
          rule: 'recipes',
          message: `Recipe "${recipe.id}" references non-existent token: "${ref}"`
        });
      }
    }
  }

  // 3. Validate showcase source modules under design-system/source/zoo/sections & effects
  const zooDirs = [
    join(root, 'design-system', 'source', 'zoo', 'sections'),
    join(root, 'design-system', 'source', 'zoo', 'effects')
  ];

  for (const dir of zooDirs) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.mjs')) continue;
      const file = join(dir, name);
      const content = readFileSync(file, 'utf8');
      const implementsMatches = content.match(/export\s+const\s+implementsRecipes\s*=\s*\[([\s\S]*?)\]/);
      if (!implementsMatches) {
        errors.push({
          file: relative(root, file),
          rule: 'showcase-metadata',
          message: `Showcase module "${relative(root, file)}" does not declare implementsRecipes metadata.`
        });
        continue;
      }
      
      // Parse the IDs inside implementsRecipes
      const rawIds = implementsMatches[1];
      const ids = rawIds
        .split(',')
        .map((s) => s.trim().replace(/['"`]/g, ''))
        .filter(Boolean);
      
      for (const id of ids) {
        if (!recipeIds.has(id)) {
          errors.push({
            file: relative(root, file),
            rule: 'showcase-metadata',
            message: `Showcase module "${relative(root, file)}" references invalid recipe ID: "${id}"`
          });
        }
      }
    }
  }
}

/** Run the full gate over a tokens directory on disk. */
export function validateTokenDir(tokensDir) {
  const { entries, errors: structureErrors } = collectTokenFiles(tokensDir);

  // The colour role contract lives next to the prose: the derivation registry
  // and the roles table in language/colour.md, both synced against the tokens.
  const languageDir = join(tokensDir, '..', '..', 'language');
  const options = {};
  const registryPath = join(languageDir, 'colour.derivations.json');
  if (existsSync(registryPath)) {
    try {
      options.derivations = JSON.parse(readFileSync(registryPath, 'utf8'));
    } catch (err) {
      structureErrors.push({
        file: 'design-system/language/colour.derivations.json',
        rule: 'derivation',
        message: `Failed to parse the colour derivation registry: ${err.message}`,
      });
    }
  } else {
    structureErrors.push({
      file: 'design-system/language/colour.derivations.json',
      rule: 'derivation',
      message: 'The colour derivation registry is missing.',
    });
  }
  const colourDocPath = join(languageDir, 'colour.md');
  if (existsSync(colourDocPath)) {
    options.colourDoc = readFileSync(colourDocPath, 'utf8');
  } else {
    structureErrors.push({
      file: 'design-system/language/colour.md',
      rule: 'roles-table',
      message: 'language/colour.md is missing; the colour role contract must be documented there.',
    });
  }

  // The canonical skin source, for the coverage gate (layer 2h).
  const skinsPath = join(tokensDir, '..', '..', 'source', 'skins', 'skins.json');
  if (existsSync(skinsPath)) {
    try {
      options.skins = JSON.parse(readFileSync(skinsPath, 'utf8'));
    } catch (err) {
      structureErrors.push({
        file: SKINS_FILE,
        rule: 'skin-coverage',
        message: `Failed to parse the canonical skin source: ${err.message}`,
      });
    }
  } else {
    structureErrors.push({
      file: SKINS_FILE,
      rule: 'skin-coverage',
      message: 'The canonical skin source is missing; shipped skins cannot be coverage-checked.',
    });
  }

  const { errors } = validateEntries(entries, options);
  const allErrors = [...structureErrors, ...errors];

  // The font contract: fontWeight tokens vs. the shipped faces (Gate A) and
  // declared @font-face ranges vs. the binaries' real coverage (Gate B).
  const weightTokens = [];
  for (const entry of entries) {
    for (const { path, token, type } of walkTokens(entry.data)) {
      if (type === 'fontWeight' && typeof token.$value === 'number') {
        weightTokens.push({ path, value: token.$value, file: entry.file });
      }
    }
  }
  const fontsDir = join(tokensDir, '..', '..', '..', 'assets', 'fonts');
  allErrors.push(...validateFonts(fontsDir, weightTokens).errors);

  if (allErrors.length === 0) {
    // Collect all valid token paths
    const tokenPaths = new Set();
    for (const entry of entries) {
      for (const { path } of walkTokens(entry.data)) {
        tokenPaths.add(path);
      }
    }
    const root = join(tokensDir, '..', '..', '..');
    validateRecipesAndShowcase(root, tokenPaths, allErrors);
  }

  return { errors: allErrors };
}
