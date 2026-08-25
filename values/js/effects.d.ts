/* generated alongside effects.js from design-system/source/zoo/effects/ — do not edit by hand. */

export interface SeedDot { cx: number; cy: number; r: number; index: number }
export interface GrowingSeedDot { cx: number; cy: number; r: number; gi: number; index: number }
export interface GridCell { index: number; a: string; b: string; d: string; dl: string; tf: string }
export interface GridField { cells: GridCell[]; cols: number; rows: number }
// One element of a weather field: its element class, stable index, and the CSS
// custom properties — in render order — that the shipped effects CSS animates it by.
export interface WeatherParticle { cls: string; index: number; vars: Record<string, string> }
// One character of hand-set weather text: the glyph and its position in the phrase.
export interface WeatherGlyph { char: string; index: number }
// One shipped weather field with its default cost: the count its data primary yields.
export interface AtmosphereFieldCost { id: string; particles: number }
// The atmosphere operating contract: mount cardinality, the 6–51 particle
// envelope per weather field, exactly three blooms, and weather off unless
// explicitly opted in. The validation gate enforces these executable defaults.
export interface AtmosphereContract {
  mountCardinality: 'once-per-root';
  particlesPerField: { min: number; max: number };
  bloomCount: number;
  weatherEnabledByDefault: boolean;
  fields: AtmosphereFieldCost[];
}

export function seedHeadData(n?: number): SeedDot[];
export function growingSeedHeadData(n?: number): GrowingSeedDot[];
export function gridData(): GridField;
export function windParticlesData(): WeatherParticle[];
export function rainParticlesData(): WeatherParticle[];
export function fleckParticlesData(): WeatherParticle[];
export function driftParticlesData(): WeatherParticle[];
export function fireflyParticlesData(): WeatherParticle[];
export function flakeParticlesData(): WeatherParticle[];
export function hazeParticlesData(): WeatherParticle[];
export function sunpoolParticlesData(): WeatherParticle[];
export function weatherTextData(str: string): WeatherGlyph[];
export function bloomData(): { cls: string }[];
export function weatherFields(): { id: string; data: () => unknown[] }[];
export function atmosphereContract(): AtmosphereContract;
