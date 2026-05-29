// Conformance gate for the token contract. Two layers:
//   1. DTCG 2025.10 JSON Schema (ajv) — structure + the $type vocabulary.
//   2. Custom checks a schema cannot express — type resolvability across group
//      inheritance, the intent-based naming grammar, the three-tier reference
//      rules, and alias resolution (no dangling targets, no cycles).
//
// Everything here is pure: it operates on in-memory token entries so it can be
// unit-tested per scenario without touching disk. The CLI wrapper
// (scripts/validate.mjs) is responsible for reading files and process exit.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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

function checkName(path, tier, errors, file) {
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
  if (tier === 'semantic' || tier === 'component') {
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
 * @returns {{errors: Array<{file?: string, path?: string, rule: string, message: string}>}}
 */
export function validateEntries(entries) {
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
    checkName(entry.path, entry.tier, errors, entry.file);

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

  return { errors };
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

/** Run the full gate over a tokens directory on disk. */
export function validateTokenDir(tokensDir) {
  const { entries, errors: structureErrors } = collectTokenFiles(tokensDir);
  const { errors } = validateEntries(entries);
  return { errors: [...structureErrors, ...errors] };
}
