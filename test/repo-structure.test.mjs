import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { collectTokenFiles } from '../scripts/lib/validate-core.mjs';
import { runBuild } from '../scripts/lib/build-core.mjs';
import { tmpDir, treesEqual } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('repo-structure', () => {
  it('File outside the tier directories is rejected', () => {
    const dir = tmpDir();
    // A token file directly under tokens/, not in a tier subdirectory.
    writeFileSync(join(dir, 'stray.tokens.json'), JSON.stringify({ a: { $type: 'color', $value: '#fff' } }));
    const { errors } = collectTokenFiles(dir);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('structure');
    expect(errors[0].file).toBe('stray.tokens.json');
  });

  it('Outputs are reproducible and ignored', async () => {
    const a = tmpDir();
    const b = tmpDir();
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: a });
    await runBuild({ tokensDir: join(root, 'design-system', 'source', 'values'), distDir: b });
    expect(treesEqual(a, b)).toBe(true);

    // dist/ is git-ignored.
    const ignored = execFileSync('git', ['check-ignore', 'design-system/dist/'], { cwd: root }).toString().trim();
    expect(ignored).toBe('design-system/dist/');
  });

  it('Clean install runs the pipeline (scripts and deps are declared)', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.scripts.validate).toBeTruthy();
    expect(pkg.scripts.build).toBeTruthy();
    for (const dep of ['style-dictionary', 'ajv', 'vitest']) {
      expect(pkg.devDependencies[dep]).toBeTruthy();
    }
  });
});

describe('design-language', () => {
  // Spec: design-language / Scenario: Consumer finds the scoped-application
  // rule. language/type.md must state the scope-root rule, the html/body
  // prohibition, the boundary primitive by name, and the fonts.css wiring path.
  it('type language documents scoped font application', () => {
    const doc = readFileSync(join(root, 'design-system', 'language', 'type.md'), 'utf8');
    expect(doc, 'the voice is applied at the scope root').toMatch(/scope root/i);
    expect(doc, 'html/body application is prohibited').toMatch(/never on `html` or `body`/);
    expect(doc, 'the boundary primitive is referenced by name').toContain('.ontwerp-boundary');
    expect(doc, 'fonts are wired by importing the shipped fonts CSS').toContain('values/css/fonts.css');
  });

  // Spec: design-language / Requirement: The utility mark is reserved for data.
  // Scenario: A reader can tell data marks from prose labels.
  it('type language reserves the utility mark for data, not prose', () => {
    const doc = readFileSync(join(root, 'design-system', 'language', 'type.md'), 'utf8');
    expect(doc, 'the mark is named and reserved for data').toMatch(/utility mark.*for \*\*data\*\*/is);
    for (const datum of ['numerals', 'counts', 'machine identifiers', 'coded events']) {
      expect(doc.toLowerCase(), `data example: ${datum}`).toContain(datum);
    }
    for (const prose of ['labels', 'subtitles', 'eyebrows']) {
      expect(doc.toLowerCase(), `prose example: ${prose}`).toContain(prose);
    }
    expect(doc, 'prose stays in the Archivo lowercase voice').toMatch(/lowercase Archivo/i);
    expect(doc, 'mono-uppercase on prose is out of system').toMatch(/out of system/i);
  });

  // Spec: design-language / Scenario: Reader finds the rest-pose rule stated
  // normatively — every animated state/effect requires a deliberate reduced-motion
  // rest pose; missing one is incomplete, not polish; the pose is a stopped
  // animation plus an explicit rest frame (or ambient-field removal), never a
  // frozen mid-cycle frame.
  it('motion language documents the reduced-motion rest-pose rule', () => {
    const doc = readFileSync(join(root, 'design-system', 'language', 'motion.md'), 'utf8');
    expect(doc, 'the rule is stated as a requirement for every animated surface').toMatch(
      /every animated state or effect requires a deliberate reduced-motion rest pose/i,
    );
    expect(doc, 'incomplete, not optional polish').toMatch(/incomplete,\s+not optional polish/i);
    expect(doc, 'a stopped animation with an explicit rest frame').toMatch(
      /stopped animation together with an explicitly declared rest frame/i,
    );
    expect(doc, 'ambient fields may be removed instead of posed').toMatch(
      /removed from the layout instead/i,
    );
    expect(doc, 'distinct from a frozen mid-cycle frame').toMatch(/never a frozen mid-cycle frame/i);
  });
});
