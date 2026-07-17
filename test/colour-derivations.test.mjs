import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEntries } from '../scripts/lib/validate-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Minimal semantic colour role set: one supplied role and one derived role,
// annotated per the provenance contract.
const roleFixture = (derivation = 'text-quiet') => [
  {
    tier: 'semantic',
    file: 's',
    data: {
      color: {
        $type: 'color',
        text: {
          default: { $value: '#1F1B16', $extensions: { 'ontwerp.role': { provenance: 'supply' } } },
          quiet: { $value: '#8A8170', $extensions: { 'ontwerp.role': { provenance: 'derive', derivation } } },
        },
      },
    },
  },
];

const REGISTRY = [
  { id: 'text-quiet', inputs: ['color.text.default'], formula: { kind: 'alpha', step: 50 } },
];

const derivationErrors = (errors) => errors.filter((e) => e.rule === 'derivation');
const tableErrors = (errors) => errors.filter((e) => e.rule === 'roles-table');

describe('colour derivation registry', () => {
  // Spec: Registry entry missing a required field
  it('registry entry missing a field fails', () => {
    const { errors } = validateEntries(roleFixture(), {
      derivations: [{ id: 'text-quiet', inputs: ['color.text.default'] }], // no formula
    });
    const bad = derivationErrors(errors);
    expect(bad.some((e) => /incomplete/.test(e.message) && /text-quiet/.test(e.message))).toBe(true);
  });

  // Spec: Duplicate derivation rule IDs
  it('duplicate rule ids fail', () => {
    const { errors } = validateEntries(roleFixture(), {
      derivations: [...REGISTRY, ...REGISTRY],
    });
    const bad = derivationErrors(errors);
    expect(bad.some((e) => /Duplicate derivation rule ID "text-quiet"/.test(e.message))).toBe(true);
  });

  // Spec: Derivation input references a non-supplied role
  it('input naming a non-supplied role fails', () => {
    const { errors } = validateEntries(roleFixture(), {
      derivations: [
        ...REGISTRY,
        // one input is itself derived, one does not exist at all — both invalid
        { id: 'grey-chain', inputs: ['color.text.quiet'], formula: { kind: 'alpha', step: 30 } },
        { id: 'grey-ghost', inputs: ['color.text.ghost'], formula: { kind: 'alpha', step: 30 } },
      ],
    });
    const bad = derivationErrors(errors);
    expect(bad.some((e) => e.path === 'grey-chain' && /color\.text\.quiet/.test(e.message))).toBe(true);
    expect(bad.some((e) => e.path === 'grey-ghost' && /color\.text\.ghost/.test(e.message))).toBe(true);
  });

  // Spec: Token names an unregistered derivation rule
  it('token referencing unregistered rule fails', () => {
    const { errors } = validateEntries(roleFixture('nonexistent-rule'), { derivations: REGISTRY });
    const bad = derivationErrors(errors);
    expect(bad.length).toBe(1);
    expect(bad[0].path).toBe('color.text.quiet');
    expect(bad[0].message).toMatch(/unregistered derivation rule "nonexistent-rule"/);
  });

  it('the shipped registry and tokens resolve cleanly', () => {
    const registry = JSON.parse(
      readFileSync(join(root, 'design-system', 'language', 'colour.derivations.json'), 'utf8'),
    );
    expect(Array.isArray(registry)).toBe(true);
    expect(registry.length).toBeGreaterThan(0);
    for (const rule of registry) {
      expect(typeof rule.id).toBe('string');
      expect(Array.isArray(rule.inputs) && rule.inputs.length > 0).toBe(true);
      expect(['mix', 'alpha', 'identity']).toContain(rule.formula.kind);
      if (rule.formula.kind === 'mix') expect(rule.formula.ratio).toBeGreaterThan(0);
      if (rule.formula.kind === 'alpha') expect(rule.formula.step).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('colour roles table sync', () => {
  const TABLE = [
    '| Role | Consumers | Provenance |',
    '| --- | --- | --- |',
    '| `color.text.default` | primary text | supply |',
    '| `color.text.quiet` | utility marks | derive · `text-quiet` |',
  ];
  const doc = (rows = TABLE) => `# Colour\n\n${rows.join('\n')}\n`;

  // Spec: Semantic colour token missing from the roles table
  it('token absent from roles table fails', () => {
    const { errors } = validateEntries(roleFixture(), {
      colourDoc: doc(TABLE.slice(0, 3)), // quiet row dropped
    });
    const bad = tableErrors(errors);
    expect(bad.length).toBe(1);
    expect(bad[0].path).toBe('color.text.quiet');
    expect(bad[0].message).toMatch(/missing from the roles table/);
  });

  // Spec: Roles-table row without a backing token
  it('table row without backing token fails', () => {
    const { errors } = validateEntries(roleFixture(), {
      colourDoc: doc([...TABLE, '| `color.text.gone` | nothing | supply |']),
    });
    const bad = tableErrors(errors);
    expect(bad.length).toBe(1);
    expect(bad[0].path).toBe('color.text.gone');
    expect(bad[0].message).toMatch(/no backing semantic colour token/);
  });

  // Spec: Roles-table provenance contradicts token metadata
  it('table provenance mismatch fails', () => {
    const { errors } = validateEntries(roleFixture(), {
      colourDoc: doc([
        TABLE[0],
        TABLE[1],
        '| `color.text.default` | primary text | derive · `text-quiet` |', // token says supply
        TABLE[3],
      ]),
    });
    const bad = tableErrors(errors);
    expect(bad.length).toBe(1);
    expect(bad[0].path).toBe('color.text.default');
    expect(bad[0].message).toMatch(/contradicts/);
  });

  it('a matching table passes both directions', () => {
    const { errors } = validateEntries(roleFixture(), { colourDoc: doc(), derivations: REGISTRY });
    expect(errors).toEqual([]);
  });
});
