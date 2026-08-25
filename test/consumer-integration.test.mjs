import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpDir, releaseBundleOnce, cssRules } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = join(root, 'design-system', 'templates');

// The canonical consumer guidance this change owns, plus the repo README's
// integration section — all three must agree with the assembled bundle.
const canonicalDocs = () => ({
  agents: readFileSync(join(templatesDir, 'consumer-AGENTS.md'), 'utf8'),
  readme: readFileSync(join(templatesDir, 'consumer-README.md'), 'utf8'),
  repoReadme: readFileSync(join(root, 'README.md'), 'utf8'),
});

/**
 * The path oracle is the assembled release bundle. Task 2.1 names
 * `design-system/dist/release/` directly; that dir is gitignored build output,
 * so when it exists the audit resolves against it, and otherwise against an
 * identical fresh assembly (the build is byte-deterministic — asserted in
 * distribution.test.mjs). Fresh checkouts and CI always take the
 * fresh-assembly branch; the template-parity test below never trusts the
 * prebuilt dir.
 */
const shippedRelease = join(root, 'design-system', 'dist', 'release');
const freshAssembly = releaseBundleOnce(join(root, 'design-system', 'source', 'values'));
async function releaseDir() {
  if (existsSync(shippedRelease)) return shippedRelease;
  return freshAssembly();
}

// --- Documentation path audit ------------------------------------------------

// Asset paths named by the guidance: bundle-rooted domains only, optional
// vendor/ontwerp/ prefix stripped. Only delimited tokens count — backticked
// inline code or quoted import specifiers inside fenced examples; prose like
// "recipes/principles" is not a path. Bare filenames ("tokens.css") and
// app-side paths ("docs/DESIGN.md") are ignored.
const DOC_PATH_RE =
  /[`"](?:vendor\/ontwerp\/)?((?:values|fonts|zoo|language|recipes|templates)\/[A-Za-z0-9][A-Za-z0-9._/-]*)[`"]/g;

function documentedPaths(text) {
  const out = new Set();
  for (const m of text.matchAll(DOC_PATH_RE)) {
    out.add(m[1].replace(/[/.,;)]+$/, ''));
  }
  return [...out];
}

/** Audit `paths` against an assembled release dir; returns the unresolvable ones. */
function auditPaths(rel, paths) {
  return paths.filter((p) => !existsSync(join(rel, p)));
}

const ALL_DOC_PATHS = () =>
  [...new Set(Object.values(canonicalDocs()).flatMap((t) => documentedPaths(t)))].sort();

// --- Case-section extraction --------------------------------------------------

/** Slice `text` from `start` up to the first line matching any `stops` anchor. */
function section(text, start, stops) {
  const from = text.indexOf(start);
  expect(from, `${JSON.stringify(start)} present`).toBeGreaterThanOrEqual(0);
  let end = text.length;
  for (const stop of stops) {
    const at = text.indexOf(stop, from + start.length);
    if (at !== -1) end = Math.min(end, at);
  }
  return text.slice(from, end);
}

function caseASections() {
  const { agents, readme, repoReadme } = canonicalDocs();
  return [
    ['templates/consumer-AGENTS.md', section(agents, '### Case A', ['### Case B'])],
    ['templates/consumer-README.md', section(readme, '- **Case A', ['- **Case B'])],
    ['README.md', section(repoReadme, '- **Case A', ['- **Case B'])],
  ];
}

function caseBSections() {
  const { agents, readme, repoReadme } = canonicalDocs();
  return [
    ['templates/consumer-AGENTS.md', section(agents, '### Case B', ['### Case C'])],
    ['templates/consumer-README.md', section(readme, '- **Case B', ['- **Case C'])],
    ['README.md', section(repoReadme, '- **Case B', ['- **Case C'])],
  ];
}

const WHOLE_APP_ASSETS = [
  'values/css/tokens.css',
  'values/css/components.scoped.css',
  'values/css/effects.scoped.css',
  'values/css/fonts.css',
];
const ISLAND_ASSETS = [
  ...WHOLE_APP_ASSETS.map((p) => p.replace('tokens.css', 'tokens.scoped.css')),
  'values/shadcn/adapter.scoped.css',
];

// Spec: consumer-integration / Requirement: Whole-app adoption mounts the
// complete shipped surface.
describe('whole-app adoption mounts the complete shipped surface', () => {
  // Scenario: Whole-app instructions provide working class and effect styling.
  it('Case A names the root token, component, effect, and font assets, and they resolve', async () => {
    const rel = await releaseDir();
    for (const [doc, text] of caseASections()) {
      const named = documentedPaths(text);
      const missing = WHOLE_APP_ASSETS.filter((p) => !named.includes(p));
      expect(missing, `${doc} Case A must name the complete mount`).toEqual([]);
      expect(auditPaths(rel, named), `${doc} Case A paths must resolve in the bundle`).toEqual([]);
    }
  });

  it('the documented application root carries .ontwerp so component/effect classes apply', () => {
    for (const [doc, text] of caseASections()) {
      expect(text, `${doc} Case A places the scope on the application root`).toMatch(
        /class="ontwerp"/,
      );
      expect(
        text,
        `${doc} Case A must not imply tokens alone mount component or effect styling`,
      ).toMatch(/tokens alone/i);
    }
  });
});

// Spec: consumer-integration / Requirement: Island adoption uses one scoped root
// for all scoped surfaces.
describe('island adoption uses one scoped root for all scoped surfaces', () => {
  // Scenario: Scoped imports and adapter resolve under the island root.
  it('Case B names tokens/components/effects/fonts and adapter.scoped.css, and they resolve', async () => {
    const rel = await releaseDir();
    for (const [doc, text] of caseBSections()) {
      const named = documentedPaths(text);
      const missing = ISLAND_ASSETS.filter((p) => !named.includes(p));
      expect(missing, `${doc} Case B must name the complete scoped mount`).toEqual([]);
      expect(auditPaths(rel, named), `${doc} Case B paths must resolve in the bundle`).toEqual([]);
    }
  });

  it('the token, component, effect, and adapter selectors share the one .ontwerp root', async () => {
    const rel = await releaseDir();
    // The shipped files themselves: every style rule outside @font-face/@keyframes
    // sits under .ontwerp (or on .ontwerp-boundary, its seam primitive).
    for (const f of [
      'values/css/tokens.scoped.css',
      'values/css/components.scoped.css',
      'values/css/effects.scoped.css',
      'values/shadcn/adapter.scoped.css',
    ]) {
      const css = readFileSync(join(rel, f), 'utf8');
      const { rules } = cssRules(css); // recurses @media/@supports; skips @keyframes/@font-face
      expect(rules.length, `${f} declares style rules`).toBeGreaterThan(0);
      for (const { selectors } of rules) {
        for (const sel of selectors) {
          expect(sel.startsWith('.ontwerp'), `${f}: "${sel}" lives under .ontwerp`).toBe(true);
        }
      }
    }
    for (const [doc, text] of caseBSections()) {
      expect(text, `${doc} Case B mounts the adapter under the same scope root`).toMatch(
        /(?:under your existing|under the same) `\.ontwerp`/,
      );
    }
  });

  it('no root-scoped adapter import is presented as the island adapter', () => {
    for (const [doc, text] of caseBSections()) {
      for (const line of text.split('\n')) {
        if (/values\/shadcn\/adapter\.css(?!\.scoped)/.test(line)) {
          expect(
            line,
            `${doc} Case B mentions the :root adapter only to fence it off`,
          ).toMatch(/never|only|whole-app|case a|leak|:root/i);
        }
      }
    }
  });
});

// Spec: consumer-integration / Requirement: Island boundaries prevent
// excluded-subtree leakage.
describe('island boundaries prevent excluded-subtree leakage', () => {
  // Scenario: Neutral content remains outside the system scope.
  it('every doc forbids the scope above neutral subtrees and documents .ontwerp-boundary at seams', () => {
    const { agents, readme, repoReadme } = canonicalDocs();
    for (const [doc, text] of Object.entries({ 'consumer-AGENTS.md': agents, 'consumer-README.md': readme, 'README.md': repoReadme })) {
      expect(text, `${doc} names the ancestor trap`).toMatch(/never on an ancestor of/i);
      expect(text, `${doc} documents the boundary primitive`).toContain('.ontwerp-boundary');
      expect(text, `${doc} frames the boundary as the seam escape hatch`).toMatch(
        /.ontwerp-boundary[^.\n]*(seam|escape)|seam[^.\n]*\.ontwerp-boundary/is,
      );
    }
  });

  it('island markup never places the scope on a document-level root', () => {
    for (const [doc, text] of caseBSections()) {
      expect(text, `${doc} Case B must not scope <body> or <html>`).not.toMatch(
        /<(body|html)[^>]*class="ontwerp"/,
      );
    }
  });
});

// Spec: consumer-integration / Requirement: Consumer documentation is checked
// against the assembled bundle.
describe('consumer documentation is checked against the assembled bundle', () => {
  // Scenario: Documentation path audit catches drift — every documented import
  // path resolves to a shipped file.
  it('every documented asset path resolves in the assembled release bundle', async () => {
    const rel = await releaseDir();
    const paths = ALL_DOC_PATHS();
    expect(paths.length, 'the docs do name asset paths').toBeGreaterThan(10);
    expect(auditPaths(rel, paths)).toEqual([]);
  });

  it('the audited set includes values/shadcn/adapter.scoped.css by name', () => {
    expect(ALL_DOC_PATHS()).toContain('values/shadcn/adapter.scoped.css');
  });

  it('a missing or renamed documented path fails the audit', async () => {
    const empty = tmpDir(); // no shipped files at all
    const missing = auditPaths(empty, ALL_DOC_PATHS());
    expect(missing).toContain('values/shadcn/adapter.scoped.css');
    expect(missing).toContain('values/css/tokens.scoped.css');
  });

  it('generated release documentation matches the canonical templates', async () => {
    const rel = await freshAssembly();
    expect(readFileSync(join(rel, 'AGENTS.md'), 'utf8')).toBe(
      readFileSync(join(templatesDir, 'consumer-AGENTS.md'), 'utf8'),
    );
    expect(readFileSync(join(rel, 'README.md'), 'utf8')).toBe(
      readFileSync(join(templatesDir, 'consumer-README.md'), 'utf8'),
    );
    expect(readFileSync(join(rel, 'templates', 'DESIGN.md'), 'utf8')).toBe(
      readFileSync(join(templatesDir, 'DESIGN.md'), 'utf8'),
    );
  });
});
