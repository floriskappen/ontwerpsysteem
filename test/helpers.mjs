import { readdirSync, readFileSync, statSync, mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

export function tmpDir(prefix = 'ont-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** Read a directory tree into a sorted map of relPath -> file contents (Buffer). */
export function readTree(dir) {
  const out = new Map();
  function walk(d) {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.set(relative(dir, full), readFileSync(full));
    }
  }
  walk(dir);
  return out;
}

/** Parse `--name: value;` custom-property declarations out of CSS text into a Map. */
export function customProps(cssText) {
  const map = new Map();
  for (const m of cssText.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
    map.set(m[1], m[2].trim());
  }
  return map;
}

/**
 * Compute a custom property the way a browser does for properties that are all
 * declared on the same scope root: later maps override earlier ones, and every
 * var(--x) in a value is substituted recursively.
 *
 * Limitation (named per the change tasks): this is NOT a real browser — it
 * hand-rolls var() substitution over the declaration graph. That matches
 * browser semantics exactly for the case under test, because a custom
 * property's var() resolves on the element where the property is declared, and
 * both the built tokens and the overrides land on the same scope root (:root).
 */
export function computeVar(name, ...maps) {
  const lookup = (n) => {
    for (let i = maps.length - 1; i >= 0; i--) if (maps[i].has(n)) return maps[i].get(n);
    return undefined;
  };
  const seen = new Set();
  const resolve = (value) => {
    if (value === undefined) return undefined;
    return value.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, ref) => {
      if (seen.has(ref)) throw new Error(`var() cycle at ${ref}`);
      seen.add(ref);
      const out = resolve(lookup(ref));
      seen.delete(ref);
      return out ?? '';
    });
  };
  return resolve(lookup(name));
}

/** Split a comma-separated CSS list on top-level commas (paren-aware). */
export function splitCssList(list) {
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
 * Parse CSS text into its top-level style rules and declared keyframe names.
 * Recurses into grouping at-rules (@media/@supports); other at-rule bodies
 * (@keyframes/@property/@font-face/@theme) contain no style rules and are
 * skipped. Comment-stripped, brace-matched — enough structure to assert on
 * selectors and keyframes without a real CSS parser.
 */
export function cssRules(cssText) {
  const rules = [];
  const keyframes = [];
  const blockEnd = (s, from) => {
    let depth = 0;
    for (let j = from; j < s.length; j += 1) {
      if (s[j] === '{') depth += 1;
      else if (s[j] === '}') {
        depth -= 1;
        if (depth === 0) return j + 1;
      }
    }
    throw new Error('unbalanced braces');
  };
  const walk = (s) => {
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
        if (name === 'keyframes') keyframes.push(prelude.split(/\s+/)[1]);
        else if (name === 'media' || name === 'supports') walk(s.slice(brace + 1, end - 1));
      } else {
        rules.push({ selectors: splitCssList(prelude) });
      }
      i = end;
    }
  };
  walk(cssText.replace(/\/\*[\s\S]*?\*\//g, ''));
  return { rules, keyframes };
}

/** Every animation name referenced by animation/animation-name declarations. */
export function animationRefs(cssText) {
  const names = [];
  for (const m of cssText.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)) {
    for (const part of splitCssList(m[1])) {
      const first = part.split(/\s+/)[0];
      if (first && first !== 'none') names.push(first);
    }
  }
  return names;
}

/**
 * Parse every @font-face block out of CSS (or HTML with inlined CSS) into
 * { family, style, weight, url } records. `url` is the first src url() target
 * (relative path or data: URI); family is unquoted.
 */
export function fontFaces(cssText) {
  const faces = [];
  for (const m of cssText.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = m[1];
    const prop = (name) => body.match(new RegExp(`${name}\\s*:\\s*([^;]+)`))?.[1].trim();
    faces.push({
      family: prop('font-family')?.replace(/^['"]|['"]$/g, ''),
      style: prop('font-style'),
      weight: prop('font-weight'),
      url: body.match(/src\s*:\s*url\(([^)]+)\)/)?.[1],
    });
  }
  return faces;
}

/** True if two directory trees are byte-identical. */
export function treesEqual(a, b) {
  const ta = readTree(a);
  const tb = readTree(b);
  if (ta.size !== tb.size) return false;
  for (const [rel, buf] of ta) {
    const other = tb.get(rel);
    if (!other || !buf.equals(other)) return false;
  }
  return true;
}
