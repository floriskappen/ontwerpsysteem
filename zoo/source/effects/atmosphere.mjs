// The atmosphere's operating contract as executable defaults: which weather
// fields the system ships, what each costs by default, how many blooms mount,
// and whether weather mounts unless explicitly opted in. The numbers decided
// for v1 live here once, and are consumed by the zoo render, the shipped
// effects module and the validation gate alike — so generator, documentation
// and gate cannot drift apart. Recipe metadata and language prose restate this
// contract for consumers; nothing passes validation because a document says so.

// One line per import: the effects inliner folds local imports by line.
import { windParticlesData, rainParticlesData, fleckParticlesData, driftParticlesData } from './weather-particles.mjs';
import { fireflyParticlesData, flakeParticlesData, hazeParticlesData, sunpoolParticlesData } from './weather-particles.mjs';

// The decided v1 envelope: the ambient stack mounts once per chrome root and
// never per tile, card or list item; every weather field costs between 6 and 51
// particles by default; exactly three blooms ship behind the sheet; weather is
// opt-in and off by default. Stated once here. The validation gate carries the
// same numbers and fails on any divergence, so editing one side alone goes red
// rather than quietly re-deciding the contract.
const ENVELOPE = Object.freeze({
  mountCardinality: 'once-per-root',
  particlesPerField: Object.freeze({ min: 6, max: 51 }),
  bloomCount: 3,
  weatherEnabledByDefault: false,
});

// One entry per weather field the system ships, naming the data primary whose
// length IS that field's default cost — the count is derived from the
// generator, never restated, so a field's cost cannot drift from its output.
// A new field must be registered here: the validation gate reflects over every
// effects module and fails on an exported *ParticlesData no entry covers, so an
// uncontracted field cannot pass silently.
const FIELD_DATA = [
  ['wind', windParticlesData],
  ['rain', rainParticlesData],
  ['fleck', fleckParticlesData],
  ['drift', driftParticlesData],
  ['firefly', fireflyParticlesData],
  ['flake', flakeParticlesData],
  ['haze', hazeParticlesData],
  ['sunpool', sunpoolParticlesData],
];

let fields;
function fieldRegistry() {
  if (!fields) fields = FIELD_DATA.map(([id, data]) => ({ id, data }));
  return fields;
}

// Data primary — the contract itself: the declared envelope plus each shipped
// weather field with its observed default particle cost. Frozen copies of the
// envelope go out, so a consumer thawing one return value cannot bend the next.
export function atmosphereContract() {
  return Object.freeze({
    ...ENVELOPE,
    particlesPerField: { ...ENVELOPE.particlesPerField },
    fields: fieldRegistry().map(({ id, data }) => ({ id, particles: data().length })),
  });
}

// The field registry behind validation: id plus the thunk that yields the
// field, kept separate from atmosphereContract() so the gate can recount the
// generators and catch a hand-edited contract.
export function weatherFields() {
  return fieldRegistry().map(({ id, data }) => ({ id, data }));
}

// Data primary — one { cls } per bloom, the class derived from position because
// atmosphere.css styles each bloom by its b1/b2/b3 name. This function, not the
// zoo markup, owns the bloom cardinality.
export const bloomData = () =>
  Array.from({ length: ENVELOPE.bloomCount }, (_, i) => ({ cls: `b${i + 1}` }));

// String wrapper kept for the zoo sections: the bloom elements in order.
export const ambientBlooms = () => bloomData().map(({ cls }) => `<i class="${cls}"></i>`).join('');

export const implementsRecipes = [];
