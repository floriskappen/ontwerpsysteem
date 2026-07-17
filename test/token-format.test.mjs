import { describe, it, expect } from 'vitest';
import { validateEntries } from '../scripts/lib/validate-core.mjs';

// Each test mirrors one scenario in specs/token-format/spec.md, crafting the
// smallest token set that exercises it.

const rulesOf = (errors) => new Set(errors.map((e) => e.rule));

describe('token-format', () => {
  it('Token missing a resolvable type', () => {
    const { errors } = validateEntries([
      { tier: 'primitive', file: 'p', data: { color: { brand: { base: { $value: '#fff' } } } } },
    ]);
    expect(rulesOf(errors)).toContain('type');
    expect(errors.some((e) => e.path === 'color.brand.base')).toBe(true);
  });

  it('Type outside the vocabulary', () => {
    const { errors } = validateEntries([
      { tier: 'primitive', file: 'p', data: { c: { $type: 'colour', $value: '#fff' } } },
    ]);
    expect(rulesOf(errors)).toContain('schema');
  });

  it('Valid intent-based semantic name', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: { color: { $type: 'color', text: { muted: { $value: '#888' } } } },
      },
    ]);
    expect(errors.filter((e) => e.rule === 'naming')).toEqual([]);
  });

  it('Appearance-named semantic token', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: { color: { $type: 'color', 'blue-500': { $value: '#3b82f6' } } },
      },
    ]);
    const naming = errors.filter((e) => e.rule === 'naming');
    expect(naming.length).toBeGreaterThan(0);
    expect(naming[0].path).toBe('color.blue-500');
  });

  it('Semantic aliases a primitive', () => {
    const { errors } = validateEntries([
      { tier: 'primitive', file: 'p', data: { color: { $type: 'color', brand: { base: { $value: '#3b5bdb' } } } } },
      {
        tier: 'semantic',
        file: 's',
        data: {
          color: {
            $type: 'color',
            text: {
              muted: {
                $value: '{color.brand.base}',
                $extensions: { 'ontwerp.role': { provenance: 'supply' } },
              },
            },
          },
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  it('Component references a primitive directly', () => {
    const { errors } = validateEntries([
      { tier: 'primitive', file: 'p', data: { color: { $type: 'color', brand: { base: { $value: '#3b5bdb' } } } } },
      { tier: 'component', file: 'c', data: { color: { $type: 'color', button: { bg: { $value: '{color.brand.base}' } } } } },
    ]);
    const tier = errors.filter((e) => e.rule === 'tier');
    expect(tier.length).toBe(1);
    expect(tier[0].path).toBe('color.button.bg');
  });

  it('Dangling reference', () => {
    const { errors } = validateEntries([
      { tier: 'semantic', file: 's', data: { color: { $type: 'color', text: { muted: { $value: '{color.nope}' } } } } },
    ]);
    const ref = errors.filter((e) => e.rule === 'reference');
    expect(ref.length).toBe(1);
    expect(ref[0].message).toMatch(/does not resolve/);
  });

  it('Circular reference', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: {
          color: {
            $type: 'color',
            a: { $value: '{color.b}' },
            b: { $value: '{color.a}' },
          },
        },
      },
    ]);
    expect(errors.some((e) => /Circular/.test(e.message))).toBe(true);
  });

  it('Validation blocks a non-conforming change (errors carry token paths)', () => {
    const { errors } = validateEntries([
      { tier: 'semantic', file: 's', data: { color: { $type: 'color', 'gray-600': { $value: '{color.missing}' } } } },
    ]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((e) => e.path !== undefined)).toBe(true);
  });

  // Spec: Alpha-variant primitive names follow the alpha-ramp grammar
  it('alpha-variant with existing base passes', () => {
    const { errors } = validateEntries([
      {
        tier: 'primitive',
        file: 'p',
        data: {
          color: {
            $type: 'color',
            ink: { $value: '#1F1B16' },
            'ink-a65': { $value: 'rgba(31, 27, 22, 0.65)' },
          },
        },
      },
    ]);
    expect(errors).toEqual([]);
  });

  it('alpha-variant with missing base fails naming the base', () => {
    const { errors } = validateEntries([
      { tier: 'primitive', file: 'p', data: { color: { $type: 'color', 'mist-a40': { $value: 'rgba(0, 0, 0, 0.4)' } } } },
    ]);
    const naming = errors.filter((e) => e.rule === 'naming');
    expect(naming.length).toBe(1);
    expect(naming[0].path).toBe('color.mist-a40');
    expect(naming[0].message).toContain('color.mist');
  });

  it('alpha-variant suffix at semantic tier fails', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: {
          color: {
            $type: 'color',
            'wash-a20': {
              $value: '#ddd',
              $extensions: { 'ontwerp.role': { provenance: 'supply' } },
            },
          },
        },
      },
    ]);
    const naming = errors.filter((e) => e.rule === 'naming');
    expect(naming.length).toBe(1);
    expect(naming[0].path).toBe('color.wash-a20');
    expect(naming[0].message).toMatch(/intent/);
  });

  // Spec: Semantic colour tokens declare skin provenance
  it('semantic colour token without provenance fails', () => {
    const { errors } = validateEntries([
      { tier: 'semantic', file: 's', data: { color: { $type: 'color', text: { muted: { $value: '#888' } } } } },
    ]);
    const provenance = errors.filter((e) => e.rule === 'provenance');
    expect(provenance.length).toBe(1);
    expect(provenance[0].path).toBe('color.text.muted');
  });

  it('derive without derivation id fails', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: {
          color: {
            $type: 'color',
            text: { muted: { $value: '#888', $extensions: { 'ontwerp.role': { provenance: 'derive' } } } },
          },
        },
      },
    ]);
    const provenance = errors.filter((e) => e.rule === 'provenance');
    expect(provenance.length).toBe(1);
    expect(provenance[0].message).toMatch(/names no\s+derivation rule/);
  });

  it('supply with derivation id fails', () => {
    const { errors } = validateEntries([
      {
        tier: 'semantic',
        file: 's',
        data: {
          color: {
            $type: 'color',
            text: {
              muted: {
                $value: '#888',
                $extensions: { 'ontwerp.role': { provenance: 'supply', derivation: 'text-quiet' } },
              },
            },
          },
        },
      },
    ]);
    const provenance = errors.filter((e) => e.rule === 'provenance');
    expect(provenance.length).toBe(1);
    expect(provenance[0].message).toMatch(/supplied value has no producing rule/);
  });
});
