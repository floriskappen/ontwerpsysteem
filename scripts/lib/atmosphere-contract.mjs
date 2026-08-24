// The atmosphere cost-contract gate: the validation counterpart to the
// executable defaults in design-system/source/zoo/effects/atmosphere.mjs.
//
// Three numbers are decided for v1 — 6–51 particles per weather field, exactly
// three blooms, weather off unless opted in — and this gate holds them as its
// own anchor (ATMOSPHERE_COST_CONTRACT). It then enforces three-way agreement:
// the decided anchor, the declared defaults shipped beside the generators, and
// the counts the generators actually yield must all match, so no single edit —
// to a field's length, to the declared envelope, or to the bloom markup — can
// move the contract alone. Recipe metadata and prose restate the contract but
// are never consulted here: a document saying 51 cannot make a 52-particle
// field legal.
//
// The gate also refuses an uncontracted field: it reflects over every effects
// module and fails on any exported *ParticlesData the declared registry does
// not name, so a future field added without a contract entry goes red instead
// of silently escaping the envelope.

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EFFECTS_DIR = join(
  dirname(fileURLToPath(import.meta.url)), '..', '..', 'design-system', 'source', 'zoo', 'effects',
);

// The decided v1 cost contract. Change it here AND in the source module's
// ENVELOPE in the same commit or validation fails — deliberately, because the
// two statements are the enforcement and the shipping halves of one decision.
export const ATMOSPHERE_COST_CONTRACT = Object.freeze({
  particles: Object.freeze({ min: 6, max: 51 }),
  blooms: 3,
  weatherEnabledByDefault: false,
});

// Gather what the gate judges: the declared contract plus the observed surface
// of the generators (per-field recounts, every exported *ParticlesData across
// the effects tree, the bloom count bloomData yields). Filesystem/import work
// lives only here, mirroring cssEntriesUnder in keyframe-coverage.mjs; the
// check below stays pure over this shape.
export async function collectAtmosphereInputs() {
  const atmosphere = await import(pathToFileURL(join(EFFECTS_DIR, 'atmosphere.mjs')));
  const availableFieldIds = [];
  // Reflect over every module on disk, not a hand-kept list: a brand-new file
  // exporting a particle field is exactly the case the coverage check exists for.
  for (const name of readdirSync(EFFECTS_DIR).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(join(EFFECTS_DIR, name)));
    for (const key of Object.keys(mod)) {
      const m = /^(.*)ParticlesData$/.exec(key);
      if (m) availableFieldIds.push(m[1]);
    }
  }
  return {
    declared: atmosphere.atmosphereContract(),
    observed: {
      fieldCounts: atmosphere.weatherFields().map(({ id, data }) => ({ id, particles: data().length })),
      availableFieldIds: availableFieldIds.sort(),
      bloomCount: atmosphere.bloomData().length,
    },
  };
}

/**
 * Check the atmosphere cost contract over collected inputs. Pure: same inputs,
 * same errors. Errors carry { file, rule, message } in the shape validate.mjs
 * prints, with rules `atmosphere-cost` (envelope/bloom drift),
 * `atmosphere-default` (weather opt-in), and `atmosphere-coverage`
 * (uncontracted or stale field entries).
 */
export function checkAtmosphereContract({ declared, observed }) {
  const errors = [];
  const fail = (rule, message) =>
    errors.push({
      file: 'design-system/source/zoo/effects/atmosphere.mjs',
      rule,
      message,
    });
  const { min, max } = ATMOSPHERE_COST_CONTRACT.particles;

  // The declared envelope must restate the decided numbers exactly.
  if (
    declared.particlesPerField?.min !== min ||
    declared.particlesPerField?.max !== max
  ) {
    fail(
      'atmosphere-cost',
      `declared particle envelope ${JSON.stringify(declared.particlesPerField)} does not match ` +
        `the decided ${min}–${max} per weather field.`,
    );
  }

  // Every contracted field must sit inside the envelope, naming field + count.
  for (const field of declared.fields ?? []) {
    if (!Number.isInteger(field.particles) || field.particles < min || field.particles > max) {
      fail(
        'atmosphere-cost',
        `weather field "${field.id}" defaults to ${field.particles} particles; ` +
          `the contract allows ${min}–${max}.`,
      );
    }
  }

  // Coverage both ways: a generator the contract never names cannot pass
  // silently, and a contract entry naming no generator is stale.
  const contracted = new Set((declared.fields ?? []).map((f) => f.id));
  const available = new Set(observed.availableFieldIds);
  for (const id of available) {
    if (!contracted.has(id)) {
      fail(
        'atmosphere-coverage',
        `uncontracted weather field "${id}" exports a data primary but has no entry in the ` +
          `atmosphere contract; register it before shipping.`,
      );
    }
  }
  for (const id of contracted) {
    if (!available.has(id)) {
      fail(
        'atmosphere-coverage',
        `the atmosphere contract names field "${id}", which exports no *ParticlesData primary.`,
      );
    }
  }

  // Declared costs must equal what the generators actually yield.
  for (const count of observed.fieldCounts) {
    const field = (declared.fields ?? []).find((f) => f.id === count.id);
    if (field && field.particles !== count.particles) {
      fail(
        'atmosphere-cost',
        `weather field "${count.id}" declares ${field.particles} particles but its generator ` +
          `yields ${count.particles}.`,
      );
    }
  }

  // The ambient bloom default is exactly three, declared and observed.
  if (declared.bloomCount !== ATMOSPHERE_COST_CONTRACT.blooms) {
    fail(
      'atmosphere-cost',
      `declared bloom default is ${declared.bloomCount}; the contract fixes exactly ` +
        `${ATMOSPHERE_COST_CONTRACT.blooms}.`,
    );
  }
  if (observed.bloomCount !== declared.bloomCount) {
    fail(
      'atmosphere-cost',
      `the bloom generator yields ${observed.bloomCount} blooms against a declared default of ` +
        `${declared.bloomCount}.`,
    );
  }

  // Weather is opt-in: the default configuration must not enable it.
  if (declared.weatherEnabledByDefault !== ATMOSPHERE_COST_CONTRACT.weatherEnabledByDefault) {
    fail(
      'atmosphere-default',
      'weather must be opt-in and off by default; the declared atmosphere default enables it.',
    );
  }

  return { errors };
}
