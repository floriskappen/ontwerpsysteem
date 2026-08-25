// The motion-contract gate: the shipped motion contract says interactions are
// immediate (no CSS transition, no easing curve anywhere in the interaction
// path) and periodic motion runs on the system's stepped clock (steps(), never
// continuously eased). This gate holds four surfaces to that contract:
//
//   1. authored motion tokens (source/values/**) — no cubic-bezier/transition-
//      typed value, no easing group, no interaction-named duration/easing token;
//   2. authored design-language recipes (design-system/recipes/*.json) — no
//      recipe field declares a transition or smooth easing. The `avoid` field
//      is exempt by design: naming what a recipe rejects is not declaring it;
//   3. language examples (design-system/language/*.md) — only fenced code
//      blocks are scanned, so normative prose may name the prohibitions freely
//      while an example cannot smuggle smooth motion past the reader;
//   4. shipped surfaces (dist/css/** plus every <style> block of the built
//      zoo page and all inline style attributes) — no `transition*` declaration anywhere,
//      and no smooth easing literal (`ease`, `ease-in-out`, `linear`,
//      `cubic-bezier(`) in any animation timing position or custom-property
//      value. Stepped timing passes: literal steps(...) and var() references
//      whose definitions are stepped.
//
// It runs beside the keyframe-coverage gate, which it deliberately retains:
// stepped timing PLUS reduced-motion rest poses is the full contract, and one
// gate does not excuse the other. A source-only check would miss build-
// transform regressions; a shipped-only check would allow contradictory
// authored recipes to remain — so both are checked.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Smooth easing literals as they appear in CSS values and declaration prose.
// `linear` is allowed only inside linear-gradient()/repeating-linear-gradient(),
// which name a gradient geometry, not a clock.
const SMOOTH_EASING_RE =
  /\bcubic-bezier\s*\(|\bease(?:-in-out|-in|-out)?\b|\blinear\b(?!-gradient)/gi;

// A CSS transition declaration — the interaction affordance the language bans.
const TRANSITION_DECL_RE =
  /(?:^|[;{\s])transition(?:-property|-duration|-timing-function|-delay)?\s*:/i;

const stripComments = (cssText) => cssText.replace(/\/\*[\s\S]*?\*\//g, '');

const violation = (rule) => (file, path, message) => ({ rule, file, path, message });

/**
 * Gate 1 — authored motion token values. A token object is any node with $value.
 * Fails on: a cubicBezier/transition-typed value, a token under an `easing`
 * group, or an interaction-named duration/easing token (hover, press, …).
 * Periodic loop lengths (breathe-*, drift-*, bloom lag) are legal.
 */
export function checkMotionTokens(files) {
  const err = violation('motion-contract');
  const errors = [];
  const INTERACTION_NAME_RE =
    /(^|[.\[])(hover|press|active|focus|release|transition)([.\]$]|$)/i;

  for (const { file, json } of files) {
    const walk = (node, segments, effectiveType) => {
      if (node === null || typeof node !== 'object') return;
      let type = effectiveType;
      if (typeof node.$type === 'string') type = node.$type;
      if (Array.isArray(node)) {
        node.forEach((child) => walk(child, segments, type));
        return;
      }
      for (const [key, child] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        walk(child, [...segments, key], type);
      }
      if ('$value' in node) {
        const path = segments.join('.');
        const group = segments.length > 1 ? segments[segments.length - 2] : '';
        const leaf = segments[segments.length - 1] ?? '';
        if (type === 'cubicBezier' || type === 'transition' || group.toLowerCase() === 'easing') {
          errors.push(
            err(file, path, `Smooth easing affordance "${path}" contradicts the immediate-interaction, stepped-periodic motion contract — the system ships no easing curves.`),
          );
        }
        if (
          /(duration|easing|delay)/i.test(segments.slice(0, -1).join('.') + '.' + leaf) &&
          INTERACTION_NAME_RE.test(leaf)
        ) {
          errors.push(
            err(file, path, `Interaction-flavoured motion token "${path}" advertises smooth interaction motion; interactions are immediate and carry no duration or easing.`),
          );
        }
      }
    };
    walk(json, [], undefined);
  }
  return { errors };
}

/** Gate 2 — authored recipes: no field except `avoid` declares smooth motion. */
export function checkMotionRecipes(entries) {
  const err = violation('motion-contract');
  const errors = [];
  for (const { file, recipes } of entries) {
    for (const recipe of Array.isArray(recipes) ? recipes : []) {
      for (const [field, value] of Object.entries(recipe ?? {})) {
        if (field === 'avoid') continue; // names what the recipe rejects, not does
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        const easing = text.match(SMOOTH_EASING_RE);
        const transition = text.match(TRANSITION_DECL_RE);
        if (easing || transition) {
          errors.push(
            err(file, recipe.id ?? '(recipe)', `Recipe field "${field}" declares a smooth-motion affordance (${[...(easing ?? []), ...(transition ?? [])].join(', ')}) — declare only immediate interactions and stepped periodic timing.`),
          );
        }
      }
    }
  }
  return { errors };
}

// Fenced code blocks are where a language doc shows executable truth; prose
// stays free to name the prohibition ("no transitions", "without smooth
// easing affordances") without tripping the gate.
function fencedCodeBlocks(markdown) {
  return [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
}

/** Gate 3 — language examples: no fenced example declares smooth motion. */
export function checkLanguageExamples(entries) {
  const err = violation('motion-contract');
  const errors = [];
  for (const { file, markdown } of entries) {
    for (const block of fencedCodeBlocks(markdown)) {
      const css = stripComments(block);
      const easing = css.match(SMOOTH_EASING_RE);
      const transition = css.match(TRANSITION_DECL_RE);
      if (easing || transition) {
        errors.push(
          err(file, '(language example)', `A code example declares a smooth-motion affordance (${[...(easing ?? []), ...(transition ?? [])].join(', ')}) — examples must show immediate interactions and stepped periodic timing.`),
        );
      }
    }
  }
  return { errors };
}

/**
 * The shipped-surface check over one CSS document. Applied verbatim to every
 * dist/css file, and to the built zoo page via extractShippedCss (which hands
 * us the <style> block and every inline style attribute).
 */
export function checkShippedCssDocument(cssText) {
  const errors = [];
  const css = stripComments(cssText);
  const transition = TRANSITION_DECL_RE.exec(css);
  if (transition) {
    errors.push(`interaction transition declaration "${transition[0].trim()}…" — interactions are immediate`);
  }
  for (const decl of css.matchAll(/--[\w-]+\s*:\s*([^;}]+)/g)) {
    const easing = decl[1].match(SMOOTH_EASING_RE);
    if (easing) errors.push(`custom property "${decl[0].split(':')[0].trim()}" carries smooth easing (${easing.join(', ')})`);
  }
  // Animation shorthand / animation-timing-function: the timing-function slot
  // sits between the duration(s) and the fill/iteration keywords, or after the
  // property's colon. Rather than parse the grammar, reject the smooth
  // literals wherever they appear outside a comment — they have no legitimate
  // role in this stylesheet family (gradients excluded by the lookahead).
  const easing = css.match(SMOOTH_EASING_RE);
  if (easing) errors.push(`smooth easing literal (${[...new Set(easing)].join(', ')}) in animation timing — periodic motion must step`);
  return errors;
}

/** Gate 4 — shipped CSS documents carry no smooth-motion affordance. */
export function checkShippedMotionCss(entries) {
  const errors = [];
  for (const { file, css } of entries) {
    for (const problem of checkShippedCssDocument(css)) {
      errors.push({
        file,
        rule: 'motion-contract',
        path: '(shipped css)',
        message: `Shipped surface exposes ${problem}.`,
      });
    }
  }
  return { errors };
}

/**
 * Pull the checkable CSS out of a built zoo page: every <style> block plus all
 * inline style attributes. The built page carries more than one block (bundle
 * styles, then demo/skin styles) — scanning only the first would leave the
 * later blocks outside the contract.
 */
export function extractShippedCss(html) {
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const inline = [...html.matchAll(/style="([^"]*)"/g)].map((m) => `{${m[1]}}`).join('\n');
  return `${styles.join('\n')}\n${inline}`;
}

/** Recursive *.json / *.md listing used by collectMotionInputs. */
function filesUnder(dir, ext) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(d, name.name);
      if (name.isDirectory()) walk(full);
      else if (name.name.endsWith(ext)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * Gather every surface the gate inspects. Throws when the built bundle is
 * missing so validate.mjs fails loudly instead of skipping the shipped half.
 */
export function collectMotionInputs({ tokensDir, recipesDir, languageDir, distDir }) {
  const tokens = filesUnder(tokensDir, '.tokens.json').map((file) => ({
    file,
    json: JSON.parse(readFileSync(file, 'utf8')),
  }));
  const recipes = filesUnder(recipesDir, '.json').map((file) => ({
    file,
    recipes: JSON.parse(readFileSync(file, 'utf8')),
  }));
  const language = filesUnder(languageDir, '.md').map((file) => ({
    file,
    markdown: readFileSync(file, 'utf8'),
  }));

  const distCssDir = join(distDir, 'css');
  let shipped;
  try {
    readdirSync(distCssDir);
  } catch {
    throw new Error(
      'The shipped CSS bundle is missing; run "npm run build" before validating — the motion contract is checked against what actually ships.',
    );
  }
  shipped = filesUnder(distCssDir, '.css').map((file) => ({
    file,
    css: readFileSync(file, 'utf8'),
  }));
  const zooPage = join(distDir, 'zoo', 'index.html');
  try {
    shipped.push({ file: zooPage, css: extractShippedCss(readFileSync(zooPage, 'utf8')) });
  } catch {
    throw new Error(
      'The built zoo page is missing; run "npm run build" before validating — inline animation timing ships with the page, not the css bundle.',
    );
  }

  return { tokens, recipes, language, shipped };
}

/** Run all four gates over collected inputs. */
export function checkMotionContract(inputs) {
  return {
    errors: [
      ...checkMotionTokens(inputs.tokens).errors,
      ...checkMotionRecipes(inputs.recipes).errors,
      ...checkLanguageExamples(inputs.language).errors,
      ...checkShippedMotionCss(inputs.shipped).errors,
    ],
  };
}
