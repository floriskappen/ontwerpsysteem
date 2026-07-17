import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFontWeightCoverage, validateFonts } from '../scripts/lib/validate-core.mjs';
import { tmpDir } from './helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = join(root, 'assets', 'fonts');

// A minimal faces.json fixture: one declared face over a given file.
const facesFixture = (file, min, max) =>
  JSON.stringify({
    faces: [{ family: 'Fixture', file, style: 'normal', weight: { min, max }, tokenBound: true }],
  });

describe('propagation-validation', () => {
  // Task 4.1: the woff2 reader (brotli + table directory, no dependencies) reads
  // the REAL weight coverage of all three shipped binaries: fvar wght min/max
  // for variable faces, OS/2 usWeightClass for statics.
  it('woff2 reader reports real weight coverage of every shipped face', () => {
    expect(readFontWeightCoverage(join(fontsDir, 'archivo-latin.woff2'))).toEqual({
      min: 400, max: 700, variable: true,
    });
    expect(readFontWeightCoverage(join(fontsDir, 'jetbrains-mono-latin.woff2'))).toEqual({
      min: 500, max: 500, variable: false,
    });
    expect(readFontWeightCoverage(join(fontsDir, 'caveat-latin.woff2'))).toEqual({
      min: 500, max: 700, variable: true,
    });
  });

  // Spec: Scenario: Weight token outside the shipped range fails (Gate A).
  it('weight token outside shipped range fails', () => {
    const dir = tmpDir();
    copyFileSync(join(fontsDir, 'archivo-latin.woff2'), join(dir, 'face.woff2'));
    writeFileSync(join(dir, 'faces.json'), facesFixture('face.woff2', 400, 700));
    const { errors } = validateFonts(dir, [
      { path: 'weight.light', value: 300, file: 'primitive/font.tokens.json' },
    ]);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('font-weight');
    expect(errors[0].path).toBe('weight.light');
    expect(errors[0].message).toContain('300');
    expect(errors[0].message).toContain('400–700');
  });

  // Spec: Scenario: Weight tokens inside the range pass — over the REAL source
  // tree. This is the check that would have caught S9 (weight.regular = 400
  // against the old 500–700 face).
  it('weight tokens inside range pass', () => {
    const src = JSON.parse(
      readFileSync(join(root, 'design-system', 'source', 'values', 'primitive', 'font.tokens.json'), 'utf8'),
    );
    const weightTokens = Object.entries(src.weight)
      .filter(([k]) => !k.startsWith('$'))
      .map(([k, v]) => ({ path: `weight.${k}`, value: v.$value, file: 'primitive/font.tokens.json' }));
    // the S9 token is present and checked
    expect(weightTokens.map((t) => t.value)).toContain(400);
    const { errors } = validateFonts(fontsDir, weightTokens);
    expect(errors).toEqual([]);
  });

  // Spec: Scenario: Declaration exceeding real coverage fails (Gate B) — a
  // fixture declaring 100–900 over the shipped 400–700 Archivo.
  it('declared range exceeding real coverage fails', () => {
    const dir = tmpDir();
    copyFileSync(join(fontsDir, 'archivo-latin.woff2'), join(dir, 'archivo-latin.woff2'));
    writeFileSync(join(dir, 'faces.json'), facesFixture('archivo-latin.woff2', 100, 900));
    const { errors } = validateFonts(dir, []);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('font-face');
    expect(errors[0].file).toBe('archivo-latin.woff2');
    expect(errors[0].message).toContain('100–900'); // the declared range
    expect(errors[0].message).toContain('400–700'); // the binary's actual coverage
  });

  // Spec: Scenario: Replacing a font file is re-checked — Gate B reads coverage
  // from the binary at validation time; the same declaration flips verdict when
  // the file underneath it changes. No cached/recorded coverage is trusted.
  it('replaced font file is re-checked', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'faces.json'), facesFixture('face.woff2', 400, 700));
    // a binary genuinely covering 400–700 passes…
    copyFileSync(join(fontsDir, 'archivo-latin.woff2'), join(dir, 'face.woff2'));
    expect(validateFonts(dir, []).errors).toEqual([]);
    // …and replacing it (same faces.json) with a static 500 face fails
    copyFileSync(join(fontsDir, 'jetbrains-mono-latin.woff2'), join(dir, 'face.woff2'));
    const { errors } = validateFonts(dir, []);
    expect(errors.length).toBe(1);
    expect(errors[0].rule).toBe('font-face');
    expect(errors[0].message).toContain('500–500');
  });
});
