import { readdirSync, readFileSync, statSync, mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { runBuild } from '../scripts/lib/build-core.mjs';

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

// --- Effect ink contract (skin-aware-effects-ink) ---

/**
 * The shipped effect families that paint ink, the declarations that do the
 * painting, and the exact selector each CSS form uses (root = the zoo page's
 * inlined sheet; scoped = effects.scoped.css, which prefixes `.ontwerp `).
 * A family not listed here is outside the gate; a listed declaration that
 * paints anything but the `--color-ink` role is a violation.
 */
export const EFFECT_INK_FAMILIES = [
  { family: 'grid', props: ['border-right', 'border-bottom'], selectors: ['.grid i', '.ontwerp .grid i'] },
  { family: 'wind streaks', props: ['background'], selectors: ['.gust', '.ontwerp .gust'] },
  { family: 'motes', props: ['background'], selectors: ['.mote', '.ontwerp .mote'] },
  { family: 'rain drops', props: ['background'], selectors: ['.drop', '.ontwerp .drop'] },
  { family: 'splashes', props: ['background'], selectors: ['.splash', '.ontwerp .splash'] },
  { family: 'snow outlines', props: ['border'], selectors: ['.flake', '.ontwerp .flake'] },
];

const CREAM_LITERAL = /31\s+27\s+22/;
const INK_ROLE = 'var(--color-ink)';

/**
 * Walk every style rule (including inside @media/@supports) WITH its body as
 * { selector, body }. At-rule bodies that cannot contain effect rules
 * (@keyframes/@property/@font-face) are skipped. Comment-stripped,
 * brace-matched — enough structure to assert on declarations without a real
 * CSS parser.
 */
function* rulesWithBodies(cssText) {
  const text = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = function* (s) {
    let i = 0;
    while (i < s.length) {
      const brace = s.indexOf('{', i);
      if (brace === -1) return;
      const prelude = s.slice(i, brace).trim();
      let depth = 0;
      let end = -1;
      for (let j = brace; j < s.length; j += 1) {
        if (s[j] === '{') depth += 1;
        else if (s[j] === '}') {
          depth -= 1;
          if (depth === 0) {
            end = j + 1;
            break;
          }
        }
      }
      if (end === -1) throw new Error('unbalanced braces');
      const body = s.slice(brace + 1, end - 1);
      if (prelude.startsWith('@')) {
        const name = prelude.slice(1).split(/[\s(]/)[0];
        if (name === 'media' || name === 'supports') yield* walk(body);
        // @keyframes/@property/@font-face carry no effect rules
      } else {
        for (const sel of splitCssList(prelude)) yield { selector: sel, body };
      }
      i = end;
    }
  };
  yield* walk(text);
}

/**
 * Every effect-ink declaration found in `cssText`, as
 * { family, selector, property, value }. A rule whose body hides the element
 * (`display: none` — the reduced-motion rest frame removes particle fields)
 * paints no ink and is skipped.
 */
export function collectEffectInk(cssText) {
  const found = [];
  for (const { selector, body } of rulesWithBodies(cssText)) {
    if (/display\s*:\s*none/.test(body)) continue;
    for (const fam of EFFECT_INK_FAMILIES) {
      if (!fam.selectors.includes(selector)) continue;
      for (const prop of fam.props) {
        const m = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;}]+)`, 'i'));
        if (m) found.push({ family: fam.family, selector, property: prop, value: m[1].trim() });
      }
    }
  }
  return found;
}

/**
 * The effect-ink violations in one CSS form: an inspected declaration still on
 * the known base cream literal, or on ANY hardcoded colour instead of the
 * skin-overridable ink role. Each violation names the effect family, the
 * selector and the offending declaration.
 */
export function effectInkViolations(cssText) {
  const violations = [];
  for (const entry of collectEffectInk(cssText)) {
    if (CREAM_LITERAL.test(entry.value)) {
      violations.push({
        family: entry.family,
        kind: 'literal',
        message: `${entry.family} (${entry.selector}) ${entry.property} paints with the base cream ink literal "${entry.value}" instead of the skin-overridable --color-ink role`,
      });
    } else if (!entry.value.includes(INK_ROLE)) {
      violations.push({
        family: entry.family,
        kind: 'role-missing',
        message: `${entry.family} (${entry.selector}) ${entry.property} does not resolve through the --color-ink role (value "${entry.value}")`,
      });
    }
  }
  return violations;
}

/**
 * Coverage gaps: family/property pairs the gate expects but this CSS form did
 * not offer up for inspection. Checked separately from violations so a fixture
 * can exercise a single family while a full output must carry them all.
 */
export function effectInkCoverageGaps(cssText) {
  const covered = new Set(collectEffectInk(cssText).map((e) => `${e.family}::${e.property}`));
  const gaps = [];
  for (const fam of EFFECT_INK_FAMILIES) {
    for (const prop of fam.props) {
      if (!covered.has(`${fam.family}::${prop}`)) {
        gaps.push({
          family: fam.family,
          property: prop,
          message: `${fam.family} declares no ${prop} ink to inspect — the gate expected this declaration to exist`,
        });
      }
    }
  }
  return gaps;
}

/**
 * Resolve the ink role inside one collected declaration value against a
 * skin's `--color-ink`. Only the role is substituted — alpha variables stay
 * symbolic — lower-cased so hex cases compare equal.
 */
export function resolveInk(value, skinInk) {
  return value.replaceAll('var(--color-ink)', skinInk).toLowerCase();
}

/**
 * Assemble the consumer release bundle once per process and hand back its
 * `release/` dir. Test suites that only read the built output share this so
 * each run pays for a single build.
 */
export function releaseBundleOnce(tokensDir) {
  let rel;
  return () => {
    if (!rel) {
      const dist = tmpDir();
      rel = runBuild({ tokensDir, distDir: dist }).then(() => join(dist, 'release'));
    }
    return rel;
  };
}
