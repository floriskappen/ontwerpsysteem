import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// Spec: readiness-evidence, "Readiness reports record exact observed gate
// evidence" (merged to openspec/specs/readiness-evidence when this change's
// delta archives). The report is durable human-review prose, but the
// drift that made it lie twice (180→245 tests, 9→8 strict specs) is fully
// machine-checkable: the recorded counts must agree with what the cited
// commands output *now*. That agreement is what these tests enforce; the
// human-owned checks stay outside automation by design.
//
// Scope note: the strict-spec total and the collected test-file count can be
// re-derived cheaply and exactly without re-running the gates. The recorded
// pass/fail case totals cannot be re-derived without running the suite inside
// itself, so they are enforced structurally (present, zero failures claimed)
// rather than numerically — see DECISIONS.md in the change folder.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = () =>
  readFileSync(join(root, 'docs', 'releases', 'v1.0.0-readiness.md'), 'utf8');

function runOpenSpecValidateStrict() {
  const res = spawnSync('openspec', ['validate', '--all', '--strict'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (res.error && res.error.code === 'ENOENT') {
    throw new Error(
      'The openspec CLI is required to check release evidence against live strict validation; install it (npm i -g @fission-ai/openspec) and re-run.',
    );
  }
  if (res.status !== 0) throw new Error(`openspec validate --all --strict failed:\n${res.stderr}`);
  return res.stdout;
}

/** Collect the current test files without running any tests (~5s). */
function currentTestFiles() {
  const out = execFileSync(
    join(root, 'node_modules', '.bin', 'vitest'),
    ['list', '--filesOnly'],
    { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
  );
  return out.split('\n').filter((l) => l.trim().endsWith('.test.mjs')).length;
}

describe('readiness evidence', () => {
  // Scenario: Stale or incomplete gate evidence fails review → "omits an
  // executed gate … THEN readiness review fails and names the stale, missing,
  // or unsupported evidence."
  it('records every executed machine gate with its command and an observed result', () => {
    const gates = [
      ['Build', 'npm run build'],
      ['Validation', 'npm run validate'],
      ['Tests', 'npm test'],
      ['Strict OpenSpec', 'openspec validate --all --strict'],
      ['Reproducibility', 'deterministic-build'],
    ];
    for (const [name, needle] of gates) {
      const found = gateRowFor(needle);
      expect(found, `readiness report omits the ${name} gate (${needle})`).toBeTruthy();
      expect(
        found.result,
        `${name} gate row has no observed result`,
      ).toMatch(/\S/);
    }
  });

  // Scenario: Stale or incomplete gate evidence fails review → "gives a count
  // that differs from the current gate output". The audit's blocker #5 was
  // exactly this drift on the strict-spec count.
  it('strict-spec count matches live `openspec validate --all --strict` output', () => {
    const live = runOpenSpecValidateStrict();
    const m = live.match(/Totals:\s*(\d+)\s*passed,\s*(\d+)\s*failed/);
    expect(m, 'could not parse Totals from openspec output').toBeTruthy();
    const [, passed, failed] = m;
    expect(failed).toBe('0');

    const recorded = gateRowFor('openspec validate --all --strict');
    const rm = recorded.result.match(/(\d+)\s*passed,\s*(\d+)\s*failed/);
    expect(rm, 'report records no pass/fail counts for strict OpenSpec').toBeTruthy();
    expect(
      rm[1],
      `stale evidence: report says ${rm[1]} strict items passed but the command reports ${passed}`,
    ).toBe(passed);
    expect(rm[2]).toBe('0');
  });

  it('test summary claims zero failures and its file count matches the collected suite', () => {
    const recorded = gateRowFor('npm test');
    const rm = recorded.result.match(/(\d+)\s*passed,\s*(\d+)\s*failed/);
    expect(rm, 'report records no pass/fail counts for npm test').toBeTruthy();
    expect(rm[2], 'release evidence must record zero failing tests').toBe('0');

    const fm = recorded.result.match(/\((\d+)\s+files?\)/);
    expect(fm, 'report does not record the test-file count').toBeTruthy();
    const live = currentTestFiles();
    expect(
      Number(fm[1]),
      `stale evidence: report says ${fm[1]} test files but the suite collects ${live}`,
    ).toBe(live);
  });

  // Requirement: "It SHALL distinguish machine-observed results from
  // human-owned checks" + scenario "...labels browser/device or
  // release-approval checks as human-owned when they have not been performed".
  it('separates human-owned checks and never presents them as performed', () => {
    const text = REPORT();
    const section = text.split(/^##\s+/m).find((s) => /^.*human-owned/i.test(s.split('\n')[0]));
    expect(section, 'no human-owned checks section found').toBeTruthy();

    const items = section.split('\n').filter((l) => /^\s*[-*]\s/.test(l));
    expect(items.length, 'human-owned section lists no checks').toBeGreaterThan(0);
    for (const item of items) {
      expect(
        item,
        `human-owned item is not marked unperformed: ${item.trim().slice(0, 80)}`,
      ).toMatch(/not\s+(been\s+)?performed|pending|incomplete|unstarted|not\s+started/i);
    }

    // The two ownership boundaries the spec names explicitly.
    expect(section).toMatch(/browser/i);
    expect(section).toMatch(/device|responsive/i);
    expect(section).toMatch(/release approval|approv/i);

    // The separation holds everywhere, not only inside the section: the
    // scenario's third clause ("presents an unobserved human/device check as
    // complete") is violated just as surely by a fabricated result in prose
    // or another section as by a listed item missing its unperformed marker.
    const outside = text.split(section).join('');
    for (const line of outside.split('\n')) {
      const namesHumanCheck = /\b(taste|skin|browser|device|responsive|adoption)\b/i.test(line);
      const claimsCompletion = /\b(perform|verif|confirm|approv)/i.test(line);
      if (!namesHumanCheck || !claimsCompletion) continue;
      expect(
        line.trim().slice(0, 100),
        'line outside the human-owned section presents a human check as done',
      ).toMatch(/\b(not|no|none|until a human|unperformed|pending|incomplete|unstarted)/i);
    }
  });

  // Requirement: "The release-readiness report SHALL identify the repository
  // state" — a commit identifier and the VERSION stance, without pinning the
  // hash to HEAD (evidence may legitimately predate later commits; the report
  // instructs re-running after any further commit).
  it('identifies the repository state and version stance it speaks for', () => {
    const text = REPORT();
    expect(text, 'no commit hash identifying the evidenced state').toMatch(
      /`[0-9a-f]{7,40}`/,
    );
    expect(text, 'no VERSION stance recorded').toMatch(
      /\*{0,2}VERSION\*{0,2}:?\*{0,2}\s*`[0-9]+\.[0-9]+\.[0-9]+`/,
    );
    expect(text).toMatch(/unchanged/i);
  });

  // Task 1.2 / design risk 3: reproducibility evidence is its own gate and
  // must not be conflated with the strict OpenSpec count.
  it('records reproducibility separately from the strict-spec count', () => {
    const repro = gateRowFor('deterministic-build');
    expect(repro.result.toLowerCase()).toMatch(/byte-identical|deterministic/);
    expect(repro.result).not.toMatch(/spec/i);
  });
});

/**
 * Gate-table row whose command cell names `needle`, with the result cell
 * isolated. Only markdown table rows qualify, and an exact command-cell match
 * (`| npm test |`) beats a cell that merely contains the needle
 * (`| deterministic-build checks inside npm test |`), so a prose mention or
 * another row's phrasing can never shadow the intended gate.
 */
function gateRowFor(needle) {
  const hits = [];
  for (const line of REPORT().split('\n')) {
    if (!/^\s*\|/.test(line) || !line.includes(`\`${needle}\``)) continue;
    const cells = line.split('|').map((c) => c.trim());
    const cmdIdx = cells.findIndex((c) => c.includes(`\`${needle}\``));
    hits.push({
      line,
      cells,
      command: cells[cmdIdx],
      result: cells[cmdIdx + 1] ?? '',
      exact: cells[cmdIdx] === `\`${needle}\``,
    });
  }
  return hits.find((h) => h.exact) ?? hits[0] ?? null;
}
