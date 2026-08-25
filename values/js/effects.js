/* generated from design-system/source/zoo/effects/ — do not edit by hand.
   The zoo's effect generators as one dependency-free ESM module, exporting the
   data primaries the markup wrappers render from. */

const lcg = (n) => ((n * 9301 + 49297) % 233280) / 233280;

const r2 = (n) => Number(n.toFixed(2));

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// var(--…) name from a token path: color.surface.page -> --color-surface-page.
const cssVar = (path) => '--' + path.replaceAll('.', '-');

// The determinism memo behind every effect data function: one computed field per
// parameter set. Repeated calls return the *same* array, so a field is computed
// once per process and two renders provably cannot drift apart. Callers keep the
// returned value read-only — mutating it would leak into every later render.
function memoByArgs(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const made = fn(...args);
    cache.set(key, made);
    return made;
  };
}

// The stepped clock: every periodic animation quantises at the system's 8fps
// flip-book rate — steps(durSec × 8), floored at 2 so even a sub-second loop
// steps — shared by every effect that emits animation timing (weather fields,
// breathing grid). Periodic motion steps through discrete states; it never
// eases between them.
const STEP_FPS = 8;
const stepTF = (durSec) => `steps(${Math.max(2, Math.round(durSec * STEP_FPS))})`;

// Grid effect: a background grid of breathing lines. Per-cell range and phase
// are derived from the index alone so the field desyncs without any runtime
// randomness; the field is computed once and every render reads the same cells.

const COLS = 16;
const ROWS = 10;

// One plain object per cell — the values the shipped CSS animates. They stay
// unitless, exactly as they are written into the style attribute.
const cellField = memoByArgs(() => ({
  cols: COLS,
  rows: ROWS,
  cells: Array.from({ length: COLS * ROWS }, (_, i) => {
    const r1 = ((i * 9301 + 49297) % 233280) / 233280;
    const r2 = ((i * 1597 + 51749) % 233280) / 233280;
    const r3 = ((i * 7919 + 12553) % 233280) / 233280;
    const d = 7 + r3 * 9; // 7–16s loop, unchanged
    return {
      index: i,
      a: (0.05 + r1 * 0.05).toFixed(3), // low  0.050–0.100
      b: (0.1 + r2 * 0.06).toFixed(3), // high  0.100–0.160
      d: d.toFixed(2),
      dl: (-r1 * 12).toFixed(2), // negative offsets desync the field
      tf: stepTF(d), // stepped clock quantised at this cell's own duration
    };
  }),
}));

// Data primary — the whole field as data, markup-free.
const gridData = () => cellField();

// String wrapper kept for the zoo sections; derived from the data above.
function renderGrid() {
  const { cells, cols, rows } = gridData();
  return (
    `<div class="grid" aria-hidden="true" style="--cols:${cols};--rows:${rows}">` +
    cells.map((c) => `<i style="--a:${c.a};--b:${c.b};--d:${c.d}s;--dl:${c.dl}s;--tf:${c.tf}"></i>`).join('') +
    '</div>'
  );
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈137.5° — the angle seed heads grow by

// The seed field, computed once per size and shared by every render: dot i sits
// at phyllotaxis position i, with a hair of deterministic jitter so the lattice
// reads as grown, not machined — nature keeps no perfectly regular rank (the
// imperfection principle). Everything derives from the index alone.
const headDots = memoByArgs((n) =>
  Array.from({ length: n }, (_, i) => {
    const a = i * GOLDEN_ANGLE;
    const rad = 3.5 * Math.sqrt(i); // even areal spacing, like a real seed head
    const jx = r2((lcg(i * 3 + 1) - 0.5) * 1.1);
    const jy = r2((lcg(i * 5 + 2) - 0.5) * 1.1);
    return {
      cx: r2(Math.cos(a) * rad + jx),
      cy: r2(Math.sin(a) * rad + jy),
      r: r2(0.85 + i * 0.012 + (lcg(i * 7 + 3) - 0.5) * 0.18), // size varies a touch too
      index: i,
    };
  }),
);

// Data primary — one plain object per seed, markup-free.
const seedHeadData = (n = 64) => headDots(n);

// String wrapper kept for the zoo sections: the circles are rendered from the
// data above, never recomputed, so markup and data cannot diverge.
function seedHead(n = 64) {
  return seedHeadData(n)
    .map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`)
    .join('');
}

function renderDivider() {
  return (
    '<div class="divider" aria-hidden="true">' +
    `<svg class="seed" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">${seedHead()}</svg>` +
    '</div>'
  );
}

function leafMark(cls = '') {
  const s =
    'fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"';
  return (
    `<svg class="leaf-mark${cls ? ` ${cls}` : ''}" viewBox="0 0 28 40" aria-hidden="true" focusable="false">` +
    `<path d="M14 2 C23 13 23 26 14 38 C5 26 5 13 14 2 Z" ${s}/>` +
    `<path d="M14 7 L14 35 M14 15 L20 11 M14 15 L8 11 M14 23 L21 19 M14 23 L7 19" ${s}/>` +
    '</svg>'
  );
}

// The growing variant: same packing at its own scale, each dot carrying --gi so
// the state CSS can germinate them one index at a time.
const growingDots = memoByArgs((n) =>
  Array.from({ length: n }, (_, i) => {
    const a = i * GOLDEN_ANGLE;
    const rad = 3.3 * Math.sqrt(i);
    return {
      cx: r2(Math.cos(a) * rad),
      cy: r2(Math.sin(a) * rad),
      r: r2(0.8 + i * 0.014),
      gi: i,
      index: i,
    };
  }),
);

// Data primary — one plain object per seed, with its germination order.
const growingSeedHeadData = (n = 44) => growingDots(n);

// String wrapper kept for the zoo sections; derived from the data, byte-identical.
function growingSeedHead(n = 44) {
  return growingSeedHeadData(n)
    .map((d) => `<circle class="gseed" style="--gi:${d.gi}" cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`)
    .join('');
}

// Every field below has the same shape: a memoised data primary returning one
// plain object per particle — its element class, stable index, and the CSS
// custom properties (in render order) the shipped effects CSS animates it by —
// plus a one-line string wrapper that renders those objects for the zoo
// sections. The data function owns both the values and their order, so markup
// and data cannot diverge and nothing is ever recomputed.
const particle = (cls, index, vars) => ({ cls, index, vars });

const renderParticles = (data) =>
  data
    .map(
      (p) =>
        `<i class="${p.cls}" style="${Object.entries(p.vars)
          .map(([k, v]) => `${k}:${v}`)
          .join(';')}"></i>`,
    )
    .join('');

function windField() {
  const streaks = Array.from({ length: 12 }, (_, i) => {
    const y = r2(5 + lcg(i * 2 + 1) * 90); // vertical band, 5–95%
    const len = r2(20 + lcg(i * 3 + 5) * 46); // streak length, 20–66% of the plate
    const d = r2(2.2 + lcg(i * 5 + 2) * 2.8); // 2.2–5.0s
    const dl = r2(-lcg(i * 7 + 3) * d); // negative offset desyncs the field
    const o = r2(0.1 + lcg(i * 11 + 4) * 0.18); // 0.10–0.28 ink alpha
    return particle('gust', i, {
      '--y': `${y}%`,
      '--len': `${len}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--tf': stepTF(d),
    });
  });
  const motes = Array.from({ length: 7 }, (_, i) => {
    const y = r2(8 + lcg(i * 4 + 13) * 84);
    const d = r2(1.8 + lcg(i * 6 + 17) * 2.0);
    const dl = r2(-lcg(i * 9 + 19) * d);
    const o = r2(0.16 + lcg(i * 13 + 23) * 0.22);
    const sz = r2(1.5 + lcg(i * 3 + 29) * 1.6);
    const bob = r2(d * 0.4);
    return particle('mote', i, {
      '--y': `${y}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--sz': `${sz}px`,
      '--bd': `${bob}s`,
      '--tf': stepTF(d),
      '--tf2': stepTF(bob),
    });
  });
  return streaks.concat(motes);
}

function rainField() {
  const drops = Array.from({ length: 38 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100); // across the full width
    const len = r2(16 + lcg(i * 3 + 5) * 20); // 16–36px drop length
    const d = r2(0.6 + lcg(i * 5 + 2) * 0.45); // 0.6–1.05s
    const dl = r2(-lcg(i * 7 + 3) * (d + 0.4));
    const o = r2(0.28 + lcg(i * 11 + 4) * 0.34); // 0.28–0.62 ink alpha
    return particle('drop', i, {
      '--x': `${x}%`,
      '--len': `${len}px`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--tf': stepTF(d),
    });
  });
  const splashes = Array.from({ length: 13 }, (_, i) => {
    const x = r2(4 + lcg(i * 3 + 31) * 92);
    const d = r2(0.6 + lcg(i * 5 + 37) * 0.45);
    const dl = r2(-lcg(i * 7 + 41) * d);
    const o = r2(0.2 + lcg(i * 11 + 43) * 0.28);
    return particle('splash', i, {
      '--x': `${x}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--tf': stepTF(d),
    });
  });
  return drops.concat(splashes);
}

function fleckField() {
  return Array.from({ length: 16 }, (_, i) => {
    const sgn = lcg(i * 17 + 9) < 0.5 ? -1 : 1;
    const x = r2(lcg(i * 2 + 1) * 100);
    const d = r2(4 + lcg(i * 3 + 5) * 4); // 4–8s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.22 + lcg(i * 11 + 4) * 0.26);
    const drift = r2(sgn * (12 + lcg(i * 5 + 2) * 30)); // px
    const spin = r2(sgn * (160 + lcg(i * 13 + 7) * 280)); // deg
    const w = r2(2 + lcg(i * 3 + 23) * 2); // 2–4px wide
    const h = r2(7 + lcg(i * 19 + 11) * 8); // 7–15px
    return particle('fleck', i, {
      '--x': `${x}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--drift': `${drift}px`,
      '--spin': `${spin}deg`,
      '--w': `${w}px`,
      '--h': `${h}px`,
      '--tf': stepTF(d),
    });
  });
}

function driftField() {
  return Array.from({ length: 30 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const y = r2(lcg(i * 3 + 5) * 100);
    const d = r2(4.5 + lcg(i * 5 + 2) * 4.5); // 4.5–9s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.55 + lcg(i * 11 + 4) * 0.4); // 0.55–0.95
    const dx = r2(-22 + lcg(i * 13 + 7) * 44);
    const dy = r2(30 + lcg(i * 5 + 19) * 50);
    const sz = r2(2.5 + lcg(i * 3 + 23) * 4); // 2.5–6.5px
    return particle('pollen', i, {
      '--x': `${x}%`,
      '--y': `${y}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--dx': `${dx}px`,
      '--dy': `${dy}px`,
      '--sz': `${sz}px`,
      '--tf': stepTF(d),
    });
  });
}

function fireflyField() {
  return Array.from({ length: 14 }, (_, i) => {
    const x = r2(6 + lcg(i * 2 + 1) * 88);
    const y = r2(8 + lcg(i * 3 + 5) * 84);
    const dx = r2(-18 + lcg(i * 13 + 7) * 36);
    const dy = r2(-16 + lcg(i * 5 + 19) * 32);
    const dw = r2(8 + lcg(i * 7 + 3) * 5); // 8–13s wander
    const bd = r2(1.6 + lcg(i * 11 + 4) * 1.6); // 1.6–3.2s blink
    const o = r2(0.7 + lcg(i * 3 + 23) * 0.3); // 0.70–1.0
    const sz = r2(3 + lcg(i * 17 + 9) * 2); // 3–5px
    const dl = r2(-lcg(i * 19 + 11) * dw);
    const bl = r2(-lcg(i * 23 + 13) * bd);
    return particle('firefly', i, {
      '--x': `${x}%`,
      '--y': `${y}%`,
      '--dx': `${dx}px`,
      '--dy': `${dy}px`,
      '--dw': `${dw}s`,
      '--bd': `${bd}s`,
      '--o': `${o}`,
      '--sz': `${sz}px`,
      '--dl': `${dl}s`,
      '--bl': `${bl}s`,
      '--tf': stepTF(dw),
      '--tf2': stepTF(bd),
    });
  });
}

function flakeField() {
  return Array.from({ length: 32 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const d = r2(5 + lcg(i * 3 + 5) * 4); // 5–9s slow fall
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.3 + lcg(i * 11 + 4) * 0.3); // 0.30–0.60
    const sw = r2(6 + lcg(i * 13 + 7) * 12); // 6–18px sway
    const sz = r2(3 + lcg(i * 3 + 23) * 3); // 3–6px
    const rot = r2((lcg(i * 17 + 9) < 0.5 ? -1 : 1) * (40 + lcg(i * 5 + 2) * 90));
    return particle('flake', i, {
      '--x': `${x}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--sw': `${sw}px`,
      '--sz': `${sz}px`,
      '--rot': `${rot}deg`,
      '--tf': stepTF(d),
    });
  });
}

function hazeField() {
  return Array.from({ length: 6 }, (_, i) => {
    const y = r2(6 + lcg(i * 3 + 5) * 80);
    const d = r2(14 + lcg(i * 5 + 2) * 8); // 14–22s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const bh = r2(18 + lcg(i * 13 + 7) * 26); // band thickness 18–44px
    const sgn = lcg(i * 17 + 9) < 0.5 ? -1 : 1;
    return particle('haze', i, {
      '--y': `${y}%`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--bh': `${bh}px`,
      '--dir': `${sgn}`,
      '--tf': stepTF(d),
    });
  });
}

function sunpoolField() {
  return Array.from({ length: 8 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 90);
    const y = r2(lcg(i * 3 + 5) * 78);
    const sz = r2(60 + lcg(i * 13 + 7) * 80); // 60–140px
    const d = r2(6 + lcg(i * 5 + 2) * 5); // 6–11s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const dx = r2(-14 + lcg(i * 17 + 9) * 28);
    const dy = r2(-12 + lcg(i * 3 + 23) * 24);
    return particle('sunpool', i, {
      '--x': `${x}%`,
      '--y': `${y}%`,
      '--sz': `${sz}px`,
      '--d': `${d}s`,
      '--dl': `${dl}s`,
      '--o': `${o}`,
      '--dx': `${dx}px`,
      '--dy': `${dy}px`,
      '--tf': stepTF(d),
    });
  });
}

// Data primaries — one memoised Particle[] per field.
const windParticlesData = memoByArgs(windField);
const rainParticlesData = memoByArgs(rainField);
const fleckParticlesData = memoByArgs(fleckField);
const driftParticlesData = memoByArgs(driftField);
const fireflyParticlesData = memoByArgs(fireflyField);
const flakeParticlesData = memoByArgs(flakeField);
const hazeParticlesData = memoByArgs(hazeField);
const sunpoolParticlesData = memoByArgs(sunpoolField);

// String wrappers kept for the zoo sections; each renders its field's data.
const windParticles = () => renderParticles(windParticlesData());
const rainParticles = () => renderParticles(rainParticlesData());
const fleckParticles = () => renderParticles(fleckParticlesData());
const driftParticles = () => renderParticles(driftParticlesData());
const fireflyParticles = () => renderParticles(fireflyParticlesData());
const flakeParticles = () => renderParticles(flakeParticlesData());
const hazeParticles = () => renderParticles(hazeParticlesData());
const sunpoolParticles = () => renderParticles(sunpoolParticlesData());

// Hand-set weather text: one datum per character of the phrase, spaces included
// — they are part of the run a renderer must lay out, and keeping them here
// makes this data function the single source of the output's cardinality. Each
// datum carries its position in the source string (spaces consume one too), so
// --ci stays aligned with the phrase exactly as the zoo has always set it.
const textGlyphs = memoByArgs((str) => [...str].map((char, index) => ({ char, index })));

// Data primary — {char,index}[] for every character of the phrase.
const weatherTextData = (str) => textGlyphs(str);

// String wrapper kept for the zoo sections: a span per glyph, a literal space
// where the phrase breathes.
function weatherText(str) {
  return weatherTextData(str)
    .map(({ char, index }) =>
      char === ' ' ? ' ' : `<span class="wxc" style="--ci:${index}">${escapeHtml(char)}</span>`,
    )
    .join('');
}

// The atmosphere's operating contract as executable defaults: which weather
// fields the system ships, what each costs by default, how many blooms mount,
// and whether weather mounts unless explicitly opted in. The numbers decided
// for v1 live here once, and are consumed by the zoo render, the shipped
// effects module and the validation gate alike — so generator, documentation
// and gate cannot drift apart. Recipe metadata and language prose restate this
// contract for consumers; nothing passes validation because a document says so.

// One line per import: the effects inliner folds local imports by line.

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
function atmosphereContract() {
  return Object.freeze({
    ...ENVELOPE,
    particlesPerField: { ...ENVELOPE.particlesPerField },
    fields: fieldRegistry().map(({ id, data }) => ({ id, particles: data().length })),
  });
}

// The field registry behind validation: id plus the thunk that yields the
// field, kept separate from atmosphereContract() so the gate can recount the
// generators and catch a hand-edited contract.
function weatherFields() {
  return fieldRegistry().map(({ id, data }) => ({ id, data }));
}

// Data primary — one { cls } per bloom, the class derived from position because
// atmosphere.css styles each bloom by its b1/b2/b3 name. This function, not the
// zoo markup, owns the bloom cardinality.
const bloomData = () =>
  Array.from({ length: ENVELOPE.bloomCount }, (_, i) => ({ cls: `b${i + 1}` }));

// String wrapper kept for the zoo sections: the bloom elements in order.
const ambientBlooms = () => bloomData().map(({ cls }) => `<i class="${cls}"></i>`).join('');

export { seedHeadData, growingSeedHeadData, gridData, windParticlesData, rainParticlesData, fleckParticlesData, driftParticlesData, fireflyParticlesData, flakeParticlesData, hazeParticlesData, sunpoolParticlesData, weatherTextData, bloomData, weatherFields, atmosphereContract };
