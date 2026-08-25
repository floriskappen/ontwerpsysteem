// The shadcn adapter gate: lint, render, and check for the values-only
// ontwerp ⇄ shadcn crosswalk. Everything here is PURE (string in, findings
// out) so it can be unit-tested per scenario without touching disk — the same
// discipline as validate-core.mjs. The callers own IO:
//   - build-core.runBuild lints the canonical source, renders BOTH selector
//     forms from it, checks the pair, and only then writes dist/css/shadcn/.
//   - scripts/validate.mjs re-checks whatever actually shipped under
//     dist/css/shadcn/, so a stale bundle cannot sneak past validation.
//
// The canonical contract (design-system/source/values/shadcn/adapter.css):
//   * exactly ONE style rule whose selector is `:root` (the generator
//     re-selectors it for the scoped form; anything else is a component or
//     global rule and is rejected),
//   * custom-property declarations and explanatory comments ONLY,
//   * every var() reference resolves to a SEMANTIC-tier ontwerp role, so the
//     crosswalk tracks skins instead of freezing the base palette,
//   * every variable in REQUIRED_SHADCN_VARS is declared.

// The shadcn variables the crosswalk MUST provide: the semantic core a
// shadcn-shaped chrome consumes (background/foreground pairs for surface,
// card, popover, primary, secondary, muted, accent, destructive, the three
// line roles, and the radius scale root). Missing any one leaves a consumer's
// existing chrome silently unstyled — hence a hard gate, not a convention.
export const REQUIRED_SHADCN_VARS = [
  '--background', '--foreground',
  '--card', '--card-foreground',
  '--popover', '--popover-foreground',
  '--primary', '--primary-foreground',
  '--secondary', '--secondary-foreground',
  '--muted', '--muted-foreground',
  '--accent', '--accent-foreground',
  '--destructive', '--destructive-foreground',
  '--border', '--input', '--ring',
  '--radius',
];

const VAR_DECL_RE = /(--[A-Za-z0-9-]+)\s*:\s*([^;}]+)/g;
const VAR_REF_RE = /var\((--[A-Za-z0-9-]+)/g;

/** Thrown by the build when the crosswalk fails its gate; carries the findings. */
export class AdapterGateError extends Error {
  constructor(errors) {
    super(`Shadcn adapter gate failed: ${errors.length} violation(s).`);
    this.name = 'AdapterGateError';
    this.errors = errors;
  }
}

/**
 * Tier lookup for role resolution, from built manifest entries. Manifest entry
 * names are already kebab-cased CSS names ("color-focus-ring"; the dotted form
 * lives on the `path` field); prefixing "--" yields exactly the custom-property
 * form the crosswalk references ("--color-focus-ring"). One definition, shared
 * by the build-time and validate-time callers.
 */
export function tiersFromManifest(entries) {
  return new Map(entries.map((e) => [`--${e.name}`, e.tier]));
}

const err = (rule, message, path) => ({ file: 'values/shadcn/adapter.css', rule, message, ...(path ? { path } : {}) });

/** Which required shadcn variables a declaration map fails to declare. */
const missingRequired = (decls) => REQUIRED_SHADCN_VARS.filter((v) => !decls.has(v));

/** Strip /*…*​/ comments — analysis sees declarations, never prose examples. */
function stripComments(cssText) {
  return cssText.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Parse the canonical source into its single rule. Returns
 * `{ errors, selector, body }` where `body` is the VERBATIM rule body
 * (comments included — they are the shipped documentation).
 */
function parseCanonicalSource(cssText) {
  const errors = [];
  const n = cssText.length;
  let i = 0;
  let rule = null;

  const skipWs = () => {
    while (i < n && /\s/.test(cssText[i])) i += 1;
  };

  while (i < n) {
    skipWs();
    if (i >= n) break;
    if (cssText.startsWith('/*', i)) {
      const end = cssText.indexOf('*/', i + 2);
      if (end === -1) {
        errors.push(err('structure', 'unterminated comment in the adapter source.'));
        break;
      }
      i = end + 2;
      continue;
    }
    if (cssText[i] === '@') {
      const word = cssText.slice(i).match(/^@([a-z-]+)/)?.[1] ?? '?';
      errors.push(
        err('structure', `at-rule @${word} is not allowed in the adapter source; it ships declarations only.`),
      );
      break;
    }
    if (rule) {
      errors.push(
        err('structure', 'the adapter source must contain exactly one style rule; found a second.'),
        );
      break;
    }
    const brace = cssText.indexOf('{', i);
    if (brace === -1) {
      errors.push(err('structure', 'no style rule found; the adapter source must be one `:root { … }` rule.'));
      break;
    }
    const selector = cssText.slice(i, brace).trim();
    let depth = 1;
    let j = brace + 1;
    while (j < n && depth > 0) {
      if (cssText[j] === '{') depth += 1;
      else if (cssText[j] === '}') depth -= 1;
      j += 1;
    }
    if (depth !== 0) {
      errors.push(err('structure', 'unbalanced braces in the adapter source.'));
      break;
    }
    const body = cssText.slice(brace + 1, j - 1);
    if (body.includes('{')) {
      errors.push(
        err('selector-confinement', 'nested rules are not allowed in the adapter source; declarations only.'),
      );
    }
    rule = { selector, body };
    i = j;
  }

  if (errors.length === 0 && !rule) {
    errors.push(err('structure', 'no style rule found; the adapter source must be one `:root { … }` rule.'));
  }
  return { errors, selector: rule?.selector ?? null, body: rule?.body ?? '' };
}

/** Values-only scan: no markup, scripts, loaders, assets, or package metadata. */
function checkValuesOnly(cssText) {
  const errors = [];
  const bare = stripComments(cssText);
  const rejects = [
    ['markup', /<\s*\/?\s*[a-zA-Z]/, 'looks like markup; the adapter ships declarations, not DOM'],
    ['runtime-loader', /\b(?:import|require)\s*\(|\bexpression\s*\(/i, 'is script/loader syntax; the adapter is plain CSS'],
    ['runtime-loader', /javascript:/i, 'embeds a script URI'],
    ['runtime-loader', /@import\b/, 'loads another stylesheet at runtime; consumers import files themselves'],
    ['runtime-loader', /\burl\s*\(/i, 'references an external asset; the crosswalk carries no assets'],
    ['package-metadata', /"dependencies"\s*:|"devDependencies"\s*:|^\s*\{\s*"/, 'looks like package dependency metadata'],
  ];
  for (const [rule, re, why] of rejects) {
    const m = bare.match(re);
    if (m) errors.push(err(rule, `the adapter contains ${m[0].trim().slice(0, 40)} — ${why}.`));
  }
  return errors;
}

/** Declarations of one rule body (comments stripped first). */
function declarations(body) {
  const map = new Map();
  for (const m of stripComments(body).matchAll(VAR_DECL_RE)) {
    map.set(m[1], m[2].trim());
  }
  return map;
}

/**
 * Lint the CANONICAL SOURCE. `tiers` maps built ontwerp custom-property names
 * (e.g. `--color-surface-page`) to their tier ('primitive'|'semantic'|'component').
 * Every failure names the offending mapping.
 */
export function lintAdapterSource(cssText, { tiers } = {}) {
  const errors = [];
  const { errors: structureErrors, selector, body } = parseCanonicalSource(cssText);
  errors.push(...structureErrors);

  // The canonical rule is authored on :root; the generator derives the scoped
  // form from it. Any other selector is a component or global rule.
  if (selector !== null && selector !== ':root') {
    errors.push(
      err(
        'selector-confinement',
        `the adapter source's rule must be selected by ":root" (the generator derives the scoped form); got "${selector}".`,
      ),
    );
  }

  const decls = declarations(body);
  for (const required of missingRequired(decls)) {
    errors.push(err('required-variable', `missing required shadcn variable "${required}" in the adapter crosswalk.`, required));
  }

  for (const [, value] of decls) {
    for (const m of value.matchAll(VAR_REF_RE)) {
      const ref = m[1];
      const tier = tiers?.get(ref);
      if (tier === undefined) {
        errors.push(
          err('role-resolution', `the adapter maps onto "${ref}", which resolves to no ontwerp token — an unresolved role reference.`, ref),
        );
      } else if (tier !== 'semantic') {
        errors.push(
          err('role-resolution', `the adapter maps onto "${ref}" (${tier} tier); the crosswalk may reference semantic roles only.`, ref),
        );
      }
    }
  }

  errors.push(...checkValuesOnly(cssText));
  return errors;
}

/**
 * Render both selector forms from the canonical source. Throws only if the
 * source cannot be parsed into its single rule (lint it first for gate
 * reporting); the emitted bytes depend solely on the source text, so
 * unchanged input is byte-identical output.
 */
export function renderAdapterVariants(cssText, { scopeClass = '.ontwerp' } = {}) {
  const { errors, body } = parseCanonicalSource(cssText);
  if (errors.length > 0) {
    throw new Error(`Cannot render the shadcn adapter source:\n  - ${errors.map((e) => e.message).join('\n  - ')}`);
  }
  const banner =
    `/* generated — do not edit by hand.\n` +
    `   Generated from design-system/source/values/shadcn/adapter.css (the canonical,\n` +
    `   documented crosswalk); regenerate with "npm run build". */\n\n`;
  // Body verbatim: its comments ARE the shipped documentation, and its own
  // two-space indentation is already correct inside a generated rule.
  const bodyText = body.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
  return {
    root: `${banner}:root {\n${bodyText}\n}\n`,
    scoped: `${banner}${scopeClass} {\n${bodyText}\n}\n`,
  };
}

/**
 * Check a rendered ROOT/SCOPED pair against each other and the contract:
 * identical custom-property names AND values, differing only in selector;
 * each confined to exactly its own selector; required variables present in
 * both forms; values-only content in both. When `tiers` is given (built token
 * name → tier), every var() reference in BOTH forms must resolve to a
 * semantic role.
 */
export function checkAdapterOutputs({ root, scoped }, { scopeClass = '.ontwerp', tiers } = {}) {
  const errors = [];
  const parseForm = (cssText, expectedSelector, label) => {
    const { errors: parseErrors, selector, body } = parseCanonicalSource(cssText);
    for (const e of parseErrors) errors.push({ ...e, file: `dist/css/shadcn/${label}` });
    if (selector !== undefined && selector !== null && selector !== expectedSelector) {
      errors.push({
        file: `dist/css/shadcn/${label}`,
        rule: 'selector-confinement',
        message: `expected the ${label} adapter to declare exactly ${expectedSelector}; found "${selector}".`,
      });
    }
    return declarations(body);
  };

  const rootDecls = parseForm(root, ':root', 'adapter.css');
  const scopedDecls = parseForm(scoped, scopeClass, 'adapter.scoped.css');

  for (const [label, decls] of [['adapter.css', rootDecls], ['adapter.scoped.css', scopedDecls]]) {
    for (const required of missingRequired(decls)) {
      errors.push({
        file: `dist/css/shadcn/${label}`,
        rule: 'required-variable',
        message: `missing required shadcn variable "${required}".`,
        path: required,
      });
    }
  }

  const names = new Set([...rootDecls.keys(), ...scopedDecls.keys()]);
  for (const name of names) {
    const a = rootDecls.get(name);
    const b = scopedDecls.get(name);
    if (a === undefined || b === undefined) {
      errors.push({
        file: 'dist/css/shadcn/',
        rule: 'parity',
        message: `"${name}" is declared in only one adapter form; root and scoped adapters cannot drift.`,
        path: name,
      });
    } else if (a !== b) {
      errors.push({
        file: 'dist/css/shadcn/',
        rule: 'parity',
        message: `"${name}" differs between the root and scoped adapters ("${a}" vs "${b}").`,
        path: name,
      });
    }
  }

  for (const [label, cssText] of [['adapter.css', root], ['adapter.scoped.css', scoped]]) {
    for (const e of checkValuesOnly(cssText)) {
      errors.push({ ...e, file: `dist/css/shadcn/${label}` });
    }
  }

  if (tiers) {
    for (const [label, decls] of [['adapter.css', rootDecls], ['adapter.scoped.css', scopedDecls]]) {
      for (const e of resolveRoles(decls, tiers)) {
        errors.push({ ...e, file: `dist/css/shadcn/${label}` });
      }
    }
  }
  return errors;
}

/** True when every var() reference in the declarations resolves to a known SEMANTIC role. */
function resolveRoles(decls, tiers) {
  const errors = [];
  for (const [name, value] of decls) {
    for (const m of String(value).matchAll(VAR_REF_RE)) {
      const ref = m[1];
      const tier = tiers?.get(ref);
      if (tier === undefined) {
        errors.push(err('role-resolution', `"${name}" maps onto "${ref}", which resolves to no ontwerp token.`, ref));
      } else if (tier !== 'semantic') {
        errors.push(err('role-resolution', `"${name}" maps onto "${ref}" (${tier} tier); semantic roles only.`, ref));
      }
    }
  }
  return errors;
}
