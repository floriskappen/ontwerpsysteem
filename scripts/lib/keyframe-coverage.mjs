// The keyframe-coverage gate: every @keyframes declared in SHIPPED CSS must have a
// reduced-motion rest pose that travels beside it. An animated state without an
// accessible fallback is an accessibility defect nothing else in the machinery
// catches — this gate is that catch.
//
// The gate reads the built bundle (dist/css/**), never the zoo source tree: a rest
// frame authored in a stylesheet the build does not ship (as lived in responsive.css
// for a year) is exactly the failure this gate exists to catch, so source-tree scans
// would re-open the hole it closes. The parser and the check are pure over CSS text,
// so they unit-test per scenario; cssEntriesUnder is the one filesystem walker, shared
// by scripts/validate.mjs and the tests so both scan exactly the same files.
//
// Coverage semantics, deliberately mechanical:
//   - A keyframe is REFERENCED by every style rule whose animation/animation-name
//     declaration names it; each such selector must be covered.
//   - A selector is covered when some @media (prefers-reduced-motion: reduce) rule
//     lists that exact (normalised) selector AND both (a) stops the animation
//     (`animation`/`animation-name`: none) and (b) asserts a rest pose — either
//     removal from layout (display: none) or a declared static value for EVERY
//     property the keyframe animates, custom properties included (--bo).
//   - Exact selector equality is the point, not a limitation: the rest rule must win
//     the cascade against the animation rule it neutralises, and only the same
//     selector guarantees equal specificity. The old combined `.bloom i, .grid i,
//     .wxc { animation: none }` block read as coverage while losing to its own
//     higher-specificity animation rules — this shape forbids that regression.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Strip /* … */ comments. No string literals in our CSS contain them; kept total by
// bailing on unterminated comments.
function stripComments(cssText) {
  return cssText.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Split a comma-separated list on top-level commas (paren-aware), trimmed, empties dropped.
function splitTopLevel(list) {
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

const normaliseSelector = (sel) => sel.replace(/\s+/g, ' ').trim();

// Parse `prop: value` declarations out of a declaration block.
function parseDecls(body) {
  const decls = new Map();
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i === -1) continue;
    const prop = part.slice(0, i).trim().toLowerCase();
    const value = part.slice(i + 1).trim();
    if (prop && value) decls.set(prop, value);
  }
  return decls;
}

// Index of `just past the }` matching the `{` at `from`.
function blockEnd(s, from) {
  let depth = 0;
  for (let j = from; j < s.length; j += 1) {
    if (s[j] === '{') depth += 1;
    else if (s[j] === '}') {
      depth -= 1;
      if (depth === 0) return j + 1;
    }
  }
  throw new Error('unbalanced braces in CSS');
}

/**
 * Walk CSS text collecting what coverage needs:
 *   keyframes: name -> Set of animated property names (custom properties included)
 *   usages:    name -> Set of normalised selectors whose animation names it
 *   rmRules:   [{ selectors: [normalised], decls: Map }] from prefers-reduced-motion blocks
 *
 * Two passes over the text: keyframes must all be known before usages are matched,
 * because the animation declaration conventionally precedes its @keyframes
 * (`.gseed { animation: ontwerp-germinate … }` comes first in states.css).
 */
function parseCoverageModel(cssText) {
  const css = stripComments(cssText);
  const keyframes = new Map();
  const usages = new Map();
  const rmRules = [];

  // Property names animated by one @keyframes body: the declarations inside each
  // `0% { … }` frame, custom properties included.
  const collectFrames = (body, name) => {
    const props = new Set();
    let i = 0;
    while (i < body.length) {
      const brace = body.indexOf('{', i);
      if (brace === -1) break;
      const end = blockEnd(body, brace);
      for (const prop of parseDecls(body.slice(brace + 1, end - 1)).keys()) props.add(prop);
      i = end;
    }
    keyframes.set(name, props);
  };

  // Record which selectors reference which declared keyframe names.
  const noteUsage = (selectors, decls) => {
    for (const prop of ['animation', 'animation-name']) {
      const value = decls.get(prop);
      if (!value) continue;
      for (const item of splitTopLevel(value)) {
        const m = item.match(/^([A-Za-z_-][\w-]*)\b/);
        if (!m || !keyframes.has(m[1])) continue; // keyword/idents that are not keyframes
        if (!usages.has(m[1])) usages.set(m[1], new Set());
        for (const sel of selectors) usages.get(m[1]).add(normaliseSelector(sel));
      }
    }
  };

  // One structural pass. `pass` says what this walk gathers: pass 1 collects the
  // @keyframes bodies, pass 2 records style rules with every keyframe name known.
  const walk = (s, inReducedMotion, pass) => {
    let i = 0;
    while (i < s.length) {
      if (/\s/.test(s[i])) {
        i += 1;
        continue;
      }
      const brace = s.indexOf('{', i);
      if (brace === -1) break;
      const prelude = s.slice(i, brace).trim();
      const end = blockEnd(s, brace);
      if (prelude.startsWith('@')) {
        const name = prelude.slice(1).split(/[\s(]/)[0];
        if (name === 'keyframes') {
          if (pass === 1) collectFrames(s.slice(brace + 1, end - 1), prelude.split(/\s+/)[1]);
        } else if (name === 'media' || name === 'supports') {
          walk(
            s.slice(brace + 1, end - 1),
            inReducedMotion || /prefers-reduced-motion\s*:\s*reduce/.test(prelude),
            pass,
          );
        }
        // Other at-rules (@property, @font-face, …) hold no style rules worth scanning.
        i = end;
        continue;
      }
      if (pass === 2) {
        const decls = parseDecls(s.slice(brace + 1, end - 1));
        const selectors = splitTopLevel(prelude).map(normaliseSelector);
        if (inReducedMotion) rmRules.push({ selectors, decls });
        else noteUsage(selectors, decls);
      }
      i = end;
    }
  };

  walk(css, false, 1);
  walk(css, false, 2);
  return { keyframes, usages, rmRules };
}

const stopsAnimation = (decls) => {
  for (const prop of ['animation', 'animation-name']) {
    const value = decls.get(prop)?.toLowerCase();
    if (value === 'none' || value?.startsWith('none ') || value?.startsWith('none,')) return true;
  }
  return false;
};

const assertsPose = (decls, animatedProps) =>
  decls.get('display')?.trim().toLowerCase() === 'none' ||
  [...animatedProps].every((p) => decls.has(p));

/**
 * Check every shipped CSS entry for keyframe coverage.
 * @param {Array<{file: string, css: string}>} entries
 * @returns {{errors: Array<{file: string, rule: string, path?: string, message: string}>}}
 */
export function checkKeyframeCoverage(entries) {
  const errors = [];
  const merged = { keyframes: new Map(), usages: new Map(), rmRules: [] };
  for (const { file, css } of entries) {
    const model = parseCoverageModel(css);
    // Keyframes may be referenced across files of one bundle; merge per-file models
    // so usage and coverage can land in different layers of the same shipment.
    for (const [name, props] of model.keyframes) {
      if (!merged.keyframes.has(name)) merged.keyframes.set(name, props);
      else for (const p of props) merged.keyframes.get(name).add(p);
    }
    for (const [name, sels] of model.usages) {
      if (!merged.usages.has(name)) merged.usages.set(name, new Set());
      for (const sel of sels) merged.usages.get(name).add(sel);
    }
    merged.rmRules.push(...model.rmRules.map((r) => ({ ...r, file })));
  }

  for (const [name, props] of merged.keyframes) {
    const selectors = merged.usages.get(name) ?? new Set();
    // A keyframe nothing in the shipped CSS references has no runtime surface to
    // cover (it ships dead); coverage is demanded for the selectors that play it.
    for (const sel of selectors) {
      const covering = merged.rmRules.filter((r) => r.selectors.includes(sel));
      if (covering.length === 0) {
        errors.push({
          file: '(bundle)',
          path: name,
          rule: 'keyframe-coverage',
          message:
            `Shipped keyframe "${name}" (referenced by "${sel}") has no ` +
            `@media (prefers-reduced-motion: reduce) rest-pose rule naming that selector.`,
        });
        continue;
      }
      if (!covering.some((r) => stopsAnimation(r.decls))) {
        errors.push({
          file: '(bundle)',
          path: name,
          rule: 'keyframe-coverage',
          message:
            `The reduced-motion rule for "${sel}" does not stop keyframe "${name}" ` +
            `(needs \`animation: none\` or \`animation-name: none\`).`,
        });
        continue;
      }
      const posed = covering.find((r) => assertsPose(r.decls, props));
      if (!posed) {
        errors.push({
          file: '(bundle)',
          path: name,
          rule: 'keyframe-coverage',
          message:
            `The reduced-motion rule for "${sel}" stops keyframe "${name}" but asserts no rest ` +
            `pose: declare display:none (removal) or a static value for each animated ` +
            `property (${[...props].join(', ')}).`,
        });
      }
    }
  }
  return { errors };
}

/** Read every *.css under `dir` (recursive — dist/css carries a skins/ subdirectory). */
export function cssEntriesUnder(dir) {
  const entries = [];
  const walk = (d) => {
    for (const name of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(d, name.name);
      if (name.isDirectory()) walk(full);
      else if (name.name.endsWith('.css')) entries.push({ file: full, css: readFileSync(full, 'utf8') });
    }
  };
  walk(dir);
  return entries;
}
