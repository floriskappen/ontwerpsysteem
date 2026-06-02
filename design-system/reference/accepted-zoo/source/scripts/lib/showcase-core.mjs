// The showcase ("the zoo"): a single, self-contained page that presents the
// design system the way the system itself would — warm cream paper, one ink, one
// accent, square corners, breathing hairlines. It is the system wearing itself.
//
// It is rendered from the BUILT artifacts only (the token manifest + the token
// CSS, both inlined) — never from token sources, so what you see is what ships.
// It is curated, not exhaustive: colour shown by role, type as a specimen, and
// components in use. The full inventory lives in dist/manifest + dist/css.
//
// The system's real values all come through its own custom properties (var(--…)).
// Literals are reserved for layout, atmosphere (grain, grid, bloom), and the
// THEMING DEMO — illustrative alternate skins that swap only colour roles to show
// the "theme by swapping" principle. Interactions are instant. Output is
// deterministic: per-cell animation timing is derived from the cell index, never
// from randomness or the clock.

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// var(--…) name from a token path: color.surface.page -> --color-surface-page.
const cssVar = (path) => '--' + path.replaceAll('.', '-');

// A multiplied fractal-noise grain, inline so the page stays self-contained.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

const r2 = (n) => Number(n.toFixed(2));
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈137.5° — the angle seed heads grow by

// --- The section divider: a phyllotactic seed head. Each dot is the system's own
// Ben-Day ink dot; their placement follows Vogel's model (the golden angle that
// sunflowers and most seed heads pack seeds by), so a rational dot mark reads, on a
// second look, as something grown. Deterministic — no randomness. ---
function seedHead(n = 64) {
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = i * GOLDEN_ANGLE;
    const rad = 3.5 * Math.sqrt(i); // even areal spacing, like a real seed head
    // a hair of deterministic jitter so the lattice reads as grown, not machined —
    // nature keeps no perfectly regular rank (the imperfection principle).
    const jx = r2((lcg(i * 3 + 1) - 0.5) * 1.1);
    const jy = r2((lcg(i * 5 + 2) - 0.5) * 1.1);
    const x = r2(Math.cos(a) * rad + jx);
    const y = r2(Math.sin(a) * rad + jy);
    const dot = r2(0.85 + i * 0.012 + (lcg(i * 7 + 3) - 0.5) * 0.18); // size varies a touch too
    dots.push(`<circle cx="${x}" cy="${y}" r="${dot}"/>`);
  }
  return dots.join('');
}
function renderDivider() {
  return (
    '<div class="divider" aria-hidden="true">' +
    `<svg class="seed" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">${seedHead()}</svg>` +
    '</div>'
  );
}

// --- A botanical mark drawn the way the system draws everything else: in hairlines.
// One leaf — outline + midrib + veins — at the rule weight (a non-scaling 1px stroke),
// so it reads as a botanical plate, not a sticker. Used once, in the colophon. ---
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

// --- A GROWING seed head: the phyllotaxis mark again (the system's grown order), but
// emitted so each seed can be staggered into place. Seeds appear in golden-angle order
// — the spiral fills the way a real head sets seed, outward from the centre. Used as
// the "germinating" loader: growth, not a spinner. Deterministic; each seed carries its
// index (--gi) so the CSS can delay it. ---
function growingSeedHead(n = 44) {
  const seeds = [];
  for (let i = 0; i < n; i++) {
    const a = i * GOLDEN_ANGLE;
    const rad = 3.3 * Math.sqrt(i);
    const x = r2(Math.cos(a) * rad);
    const y = r2(Math.sin(a) * rad);
    const dot = r2(0.8 + i * 0.014);
    seeds.push(`<circle class="gseed" style="--gi:${i}" cx="${x}" cy="${y}" r="${dot}"/>`);
  }
  return seeds.join('');
}

// --- Weather: a staggered, per-glyph animation for a header (.wx-wind / .wx-rain).
// Each letter becomes its own inline-block span carrying its index (--ci); the index
// offsets the animation delay so a gust — or a run of drops — ripples across the word,
// the same way the grid staggers its cells. It is continuous ambient motion (an
// animation, never an interaction transition), suppressed under prefers-reduced-motion.
// The glyph motion is paired with a visible PARTICLE FIELD (see windParticles /
// rainParticles) so the word reads as caught in actual weather. ---
function weatherText(str) {
  let i = 0;
  return [...str]
    .map((ch) => {
      if (ch === ' ') {
        i += 1;
        return ' ';
      }
      const span = `<span class="wxc" style="--ci:${i}">${escapeHtml(ch)}</span>`;
      i += 1;
      return span;
    })
    .join('');
}

// A small integer-seeded LCG in [0,1). Same family the grid uses — gives the particle
// fields varied positions / speeds / phases while staying fully deterministic (no
// Math.random, no clock), so the page renders byte-for-byte identically every build.
const lcg = (n) => ((n * 9301 + 49297) % 233280) / 233280;

// The stepped, low-FPS look. A system-wide stylistic choice: motion in this design
// system advances in discrete frames, like stop-motion or a flip-book, never as a
// smooth continuous slide — it keeps the animation feeling hand-made and physical
// rather than digital. We hold a constant frame rate (WX_FPS) and derive each
// animation's step count from its own duration, so a 5s drift and a 0.8s drop both
// tick at the same calm rate. steps() can't take a var()/calc(), so the count is
// computed here and baked into a per-particle --tf custom property.
const WX_FPS = 8; // deliberately low — the flip-book rate everything animates at
const stepTF = (durSec) => `steps(${Math.max(2, Math.round(durSec * WX_FPS))})`;

// --- Wind particles: tapered hairline STREAKS that blow left→right across the plate,
// plus a few square INK SPECKS carried along on the same wind (each with a gentle
// vertical bob). Positions, lengths, speeds and phases are all index-seeded. ---
function windParticles() {
  const streaks = Array.from({ length: 12 }, (_, i) => {
    const y = r2(5 + lcg(i * 2 + 1) * 90); // vertical band, 5–95%
    const len = r2(20 + lcg(i * 3 + 5) * 46); // streak length, 20–66% of the plate
    const d = r2(2.2 + lcg(i * 5 + 2) * 2.8); // 2.2–5.0s — the slow ones read as far off
    const dl = r2(-lcg(i * 7 + 3) * d); // negative offset desyncs the field
    const o = r2(0.1 + lcg(i * 11 + 4) * 0.18); // 0.10–0.28 ink alpha
    return `<i class="gust" style="--y:${y}%;--len:${len}%;--d:${d}s;--dl:${dl}s;--o:${o};--tf:${stepTF(d)}"></i>`;
  });
  const motes = Array.from({ length: 7 }, (_, i) => {
    const y = r2(8 + lcg(i * 4 + 13) * 84);
    const d = r2(1.8 + lcg(i * 6 + 17) * 2.0);
    const dl = r2(-lcg(i * 9 + 19) * d);
    const o = r2(0.16 + lcg(i * 13 + 23) * 0.22);
    const sz = r2(1.5 + lcg(i * 3 + 29) * 1.6);
    const bob = r2(d * 0.4);
    return `<i class="mote" style="--y:${y}%;--d:${d}s;--dl:${dl}s;--o:${o};--sz:${sz}px;--bd:${bob}s;--tf:${stepTF(d)};--tf2:${stepTF(bob)}"></i>`;
  });
  return streaks.join('') + motes.join('');
}

// --- Rain particles: slanted hairline DROPS streaking top→bottom, plus short SPLASH
// ticks that flash open along the floor (timed loosely, to suggest impacts). All
// index-seeded; rain is fast and dense, so more drops, shorter durations. ---
function rainParticles() {
  const drops = Array.from({ length: 38 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100); // across the full width
    const len = r2(16 + lcg(i * 3 + 5) * 20); // 16–36px drop length
    const d = r2(0.6 + lcg(i * 5 + 2) * 0.45); // 0.6–1.05s — fast fall
    const dl = r2(-lcg(i * 7 + 3) * (d + 0.4));
    const o = r2(0.28 + lcg(i * 11 + 4) * 0.34); // 0.28–0.62 ink alpha — clearly visible
    return `<i class="drop" style="--x:${x}%;--len:${len}px;--d:${d}s;--dl:${dl}s;--o:${o};--tf:${stepTF(d)}"></i>`;
  });
  const splashes = Array.from({ length: 13 }, (_, i) => {
    const x = r2(4 + lcg(i * 3 + 31) * 92);
    const d = r2(0.6 + lcg(i * 5 + 37) * 0.45);
    const dl = r2(-lcg(i * 7 + 41) * d);
    const o = r2(0.2 + lcg(i * 11 + 43) * 0.28);
    return `<i class="splash" style="--x:${x}%;--d:${d}s;--dl:${dl}s;--o:${o};--tf:${stepTF(d)}"></i>`;
  });
  return drops.join('') + splashes.join('');
}

// --- Fall particles (the "leaves" effect, abstracted): not a drawn leaf but a small
// hairline FLECK — a thin sliver — that falls while tumbling and drifting on a single
// graceful S-curve. Abstract on purpose; it reads as something autumnal coming down
// without being a literal sticker-leaf. Each fleck fades in at the top and dissolves
// before it lands, so it never hits a hard edge. ---
function fleckParticles() {
  return Array.from({ length: 16 }, (_, i) => {
    const sgn = lcg(i * 17 + 9) < 0.5 ? -1 : 1;
    const x = r2(lcg(i * 2 + 1) * 100);
    const d = r2(4 + lcg(i * 3 + 5) * 4); // 4–8s — a slow, unhurried fall
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.22 + lcg(i * 11 + 4) * 0.26);
    const drift = r2(sgn * (12 + lcg(i * 5 + 2) * 30)); // px, ± across
    const spin = r2(sgn * (160 + lcg(i * 13 + 7) * 280)); // deg of tumble
    const w = r2(2 + lcg(i * 3 + 23) * 2); // 2–4px wide sliver
    const h = r2(7 + lcg(i * 19 + 11) * 8); // 7–15px tall
    return `<i class="fleck" style="--x:${x}%;--d:${d}s;--dl:${dl}s;--o:${o};--drift:${drift}px;--spin:${spin}deg;--w:${w}px;--h:${h}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

// --- Drift particles: warm motes — pollen, or dandelion seed-down — lifting and
// wandering on a slow current of sunlit air, fading in and out at the edges of sight.
// Tinted with the system's amber (the same warmth the bloom carries), so the field
// reads as light made visible, not dirt. ---
function driftParticles() {
  return Array.from({ length: 30 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const y = r2(lcg(i * 3 + 5) * 100);
    const d = r2(4.5 + lcg(i * 5 + 2) * 4.5); // 4.5–9s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.55 + lcg(i * 11 + 4) * 0.4); // 0.55–0.95 — clearly visible
    const dx = r2(-22 + lcg(i * 13 + 7) * 44); // wander left or right
    const dy = r2(30 + lcg(i * 5 + 19) * 50); // lift upward, px
    const sz = r2(2.5 + lcg(i * 3 + 23) * 4); // 2.5–6.5px squares
    return `<i class="pollen" style="--x:${x}%;--y:${y}%;--d:${d}s;--dl:${dl}s;--o:${o};--dx:${dx}px;--dy:${dy}px;--sz:${sz}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

// --- Firefly particles: the one ANIMAL in the set. Warm motes that wander the dusk on
// a slow meander and BLINK on and off — the blink falls naturally out of the stepped,
// low-FPS clock (the light snaps, it does not fade), the way a firefly actually pulses.
// Each carries a soft amber glow. Wander and blink run on separate clocks, so no two
// agree and the field shimmers. ---
function fireflyParticles() {
  return Array.from({ length: 14 }, (_, i) => {
    const x = r2(6 + lcg(i * 2 + 1) * 88);
    const y = r2(8 + lcg(i * 3 + 5) * 84);
    const dx = r2(-18 + lcg(i * 13 + 7) * 36); // slow meander, px
    const dy = r2(-16 + lcg(i * 5 + 19) * 32);
    const dw = r2(8 + lcg(i * 7 + 3) * 5); // 8–13s wander
    const bd = r2(1.6 + lcg(i * 11 + 4) * 1.6); // 1.6–3.2s blink
    const o = r2(0.7 + lcg(i * 3 + 23) * 0.3); // 0.70–1.0 — bright when lit
    const sz = r2(3 + lcg(i * 17 + 9) * 2); // 3–5px
    const dl = r2(-lcg(i * 19 + 11) * dw);
    const bl = r2(-lcg(i * 23 + 13) * bd);
    return `<i class="firefly" style="--x:${x}%;--y:${y}%;--dx:${dx}px;--dy:${dy}px;--dw:${dw}s;--bd:${bd}s;--o:${o};--sz:${sz}px;--dl:${dl}s;--bl:${bl}s;--tf:${stepTF(dw)};--tf2:${stepTF(bd)}"></i>`;
  }).join('');
}

// --- Snow particles: small OUTLINED squares — snow drawn the way this system draws
// everything, in hairlines rather than filled dots — swaying down slow and fading
// before they reach the foot. Calm and even, no tumble: distinct from the rain's fast
// streaks and the autumn fleck's spin. ---
function flakeParticles() {
  return Array.from({ length: 32 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const d = r2(5 + lcg(i * 3 + 5) * 4); // 5–9s slow fall
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.3 + lcg(i * 11 + 4) * 0.3); // 0.30–0.60 visible alpha
    const sw = r2(6 + lcg(i * 13 + 7) * 12); // 6–18px side-to-side sway
    const sz = r2(3 + lcg(i * 3 + 23) * 3); // 3–6px squares
    const rot = r2((lcg(i * 17 + 9) < 0.5 ? -1 : 1) * (40 + lcg(i * 5 + 2) * 90)); // slow tip
    return `<i class="flake" style="--x:${x}%;--d:${d}s;--dl:${dl}s;--o:${o};--sw:${sw}px;--sz:${sz}px;--rot:${rot}deg;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

// --- Mist particles: a few wide, very soft BANDS of paper-pale haze drifting slowly
// sideways at their own heights and speeds, so the layers part like morning fog. The
// faintest, slowest field — the word is glimpsed through it, never hidden. ---
function hazeParticles() {
  return Array.from({ length: 6 }, (_, i) => {
    const y = r2(6 + lcg(i * 3 + 5) * 80);
    const d = r2(14 + lcg(i * 5 + 2) * 8); // 14–22s — very slow
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const bh = r2(18 + lcg(i * 13 + 7) * 26); // band thickness 18–44px
    const sgn = lcg(i * 17 + 9) < 0.5 ? -1 : 1; // drift this way or that
    return `<i class="haze" style="--y:${y}%;--d:${d}s;--dl:${dl}s;--o:${o};--bh:${bh}px;--dir:${sgn};--tf:${stepTF(d)}"></i>`;
  }).join('');
}

// --- Light particles (dappled sun): soft warm POOLS — the bloom's vocabulary shrunk and
// scattered — that breathe (swell and fade) and drift a little, like sunlight broken
// through a canopy moving in a breeze. Warm-multiplied onto the paper, so they read as
// light pooling on the page rather than as objects on it. ---
function sunpoolParticles() {
  return Array.from({ length: 8 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 90);
    const y = r2(lcg(i * 3 + 5) * 78);
    const sz = r2(60 + lcg(i * 13 + 7) * 80); // 60–140px soft pools
    const d = r2(6 + lcg(i * 5 + 2) * 5); // 6–11s breathe
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const dx = r2(-14 + lcg(i * 17 + 9) * 28); // small drift
    const dy = r2(-12 + lcg(i * 3 + 23) * 24);
    return `<i class="sunpool" style="--x:${x}%;--y:${y}%;--sz:${sz}px;--d:${d}s;--dl:${dl}s;--o:${o};--dx:${dx}px;--dy:${dy}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

// --- The weather section: eight STANDALONE headers, no containers. Each word sits in
// open air with its particle field feathered (a mask) so the weather bleeds into the
// page rather than living in a box; the glyphs themselves react too. Rain lands and
// breaks on a faint ground line beneath its word. All motion is stepped (the low-FPS
// look) and removed under reduced motion. ---
function renderWeather() {
  return `
<div class="wx-grid">
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${windParticles()}</div>
    <h3 class="wx-word wx-wind">${weatherText('najaarswind')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">wind</span><span class="wx-note">glyphs lean into the gust; streaks and specks blow past</span></figcaption>
  </figure>
  <figure class="wx-cell is-rain">
    <div class="wx-field" aria-hidden="true">${rainParticles()}</div>
    <h3 class="wx-word wx-rain">${weatherText('motregen')}</h3>
    <div class="wx-ground" aria-hidden="true"></div>
    <figcaption class="wx-cap"><span class="wx-name">rain</span><span class="wx-note">glyphs fall and recover; drops break on the ground beneath the word</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${fleckParticles()}</div>
    <h3 class="wx-word wx-leaves">${weatherText('bladval')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">fall</span><span class="wx-note">abstract flecks tumbling down on a slow, drifting S</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${driftParticles()}</div>
    <h3 class="wx-word wx-drift">${weatherText('stuifmeel')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">pollen</span><span class="wx-note">warm seed-down lifting on a slow, sunlit current</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${fireflyParticles()}</div>
    <h3 class="wx-word wx-fireflies">${weatherText('vuurvliegjes')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">fireflies</span><span class="wx-note">warm motes wander the dusk and blink on and off</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${flakeParticles()}</div>
    <h3 class="wx-word wx-snow">${weatherText('sneeuw')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">snow</span><span class="wx-note">outlined flakes sway down slow and settle</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${hazeParticles()}</div>
    <h3 class="wx-word wx-mist">${weatherText('nevel')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">mist</span><span class="wx-note">soft banks of haze drift across and veil the word</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${sunpoolParticles()}</div>
    <h3 class="wx-word wx-sun">${weatherText('lichtval')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">light</span><span class="wx-note">warm sun-pools breathe through a moving canopy</span></figcaption>
  </figure>
</div>`;
}

// --- Palette by ROLE. Each row is a colour role with the var that ships it and a
// plain-language note on what it is for; the resolved value (looked up from the
// built manifest) is shown as a genuine mono value. This is curated — it names
// roles, not the full inventory. ---
const PALETTE = [
  {
    role: 'surface',
    note: 'the paper everything is printed on',
    pigment: 'chalk & unbleached paper',
    items: [
      { label: 'page', path: 'color.surface.page', use: 'the sheet — this background', here: true },
      { label: 'deep', path: 'color.surface.deep', use: 'margins & footer strips' },
      { label: 'claim', path: 'color.surface.claim', use: 'filled / selected cells' },
    ],
  },
  {
    role: 'ink',
    note: 'one warm near-black, stepped down for hierarchy',
    pigment: 'oak gall & lampblack',
    items: [
      { label: 'default', path: 'color.text.default', use: 'primary text' },
      { label: 'soft', path: 'color.text.soft', use: 'secondary text' },
      { label: 'quiet', path: 'color.text.quiet', use: 'utility marks' },
      { label: 'faint', path: 'color.text.faint', use: 'placeholders, footnotes' },
    ],
  },
  {
    role: 'accent',
    note: 'the single accent — sparing, never decoration',
    pigment: 'madder root & red ochre',
    items: [
      { label: 'base', path: 'color.accent.base', use: 'links, focus, the margin' },
      { label: 'soft', path: 'color.accent.soft', use: 'the accent, softened' },
    ],
  },
  {
    role: 'border',
    note: 'ink at three weights — the system draws with hairlines',
    pigment: 'the ink, let down with water',
    items: [
      { label: 'quiet', path: 'color.border.quiet', use: 'inner rules' },
      { label: 'default', path: 'color.border.default', use: 'the default rule' },
      { label: 'strong', path: 'color.border.strong', use: 'emphasis' },
    ],
  },
];

function renderPalette(manifest) {
  const value = new Map(manifest.map((e) => [e.path, e.value]));
  const groups = PALETTE.map((g) => {
    const swatches = g.items
      .map((it) => {
        const v = value.get(it.path);
        const onInk = it.path.startsWith('color.text') || it.path === 'color.accent.base';
        return (
          `<figure class="sw${onInk ? ' sw-ink' : ''}${it.here ? ' sw-here' : ''}">` +
          `<div class="sw-chip" style="background:var(${cssVar(it.path)})">` +
          (it.here ? `<span class="sw-here-tag">you are here</span>` : '') +
          `</div>` +
          `<figcaption class="sw-meta">` +
          `<span class="sw-name">${escapeHtml(it.label)}</span>` +
          `<span class="sw-use">${escapeHtml(it.use)}</span>` +
          (v ? `<span class="val sw-val">${escapeHtml(String(v))}</span>` : '') +
          `</figcaption></figure>`
        );
      })
      .join('');
    return (
      `<div class="role">` +
      `<div class="role-head"><span class="role-name">${escapeHtml(g.role)}</span>` +
      `<span class="role-note">${escapeHtml(g.note)}</span></div>` +
      `<div class="role-swatches">${swatches}</div></div>`
    );
  }).join('');
  // pigment coda: the colours shown behaving like real ink — three blots soaking into
  // the paper (a soft bleed at the edge) and LAYERING by multiply, so where they cross
  // the pigment deepens the way dye does. Organic, never a perfect disc.
  const pigment =
    `<div class="role pigment">` +
    `<div class="role-head"><span class="role-name">pigment</span>` +
    `<span class="role-note">ink let down with water — it bleeds into the paper and deepens where colours layer, the way real dye does</span></div>` +
    `<div class="pigment-plate" aria-hidden="true"><i class="blot blot-a"></i><i class="blot blot-b"></i><i class="blot blot-c"></i></div>` +
    `</div>`;
  return `<div class="palette">${groups}${pigment}</div>`;
}

// --- Type specimen: the scale set in real, lowercased Archivo. Role named in
// Archivo; the size shown as a genuine mono value. ---
function renderType() {
  const specimen = [
    ['display', 'de ontwerp', '168px', '0.92'],
    ['t-heading-lg', 'a quiet, warm system', '40px', '1.02'],
    ['t-heading-md', 'where the work is pointing', '20px', '1.1'],
    ['t-body', 'cream paper, one ink, one accent, square corners. small enough to hold in your head, warm enough to want to.', '15px', '1.5'],
    ['t-body-sm', 'utility text, footnotes, the small print that still has to read well', '13px', '1.45'],
  ];
  const lines = specimen
    .map(
      ([cls, text, size, lh]) =>
        `<div class="spec-row"><span class="spec-tag"><span class="spec-role">${escapeHtml(cls.replace(/^t-/, '').replace(/-/g, ' '))}</span>` +
        `<span class="val">${escapeHtml(size)} · ${escapeHtml(lh)}</span></span>` +
        `<p class="${cls} spec-line">${escapeHtml(text)}</p></div>`,
    )
    .join('');
  // figures are set in a different face (Caveat) — show the numerals on their own row.
  const figures =
    `<div class="spec-row"><span class="spec-tag"><span class="spec-role">figures</span>` +
    `<span class="val">caveat</span></span>` +
    `<p class="spec-fig spec-line">0 1 2 3 4 5 6 7 8 9</p></div>`;
  return `<div class="spec">${lines}${figures}<p class="spec-foot">archivo, lowercased · weights 500–700 · jetbrains mono for values · caveat for figures</p></div>`;
}

// --- Components in use: real :hover / :focus / :active, never a state grid.
// Buttons carry the heavier bottom-edge, a faint halftone on every one, and drop
// instantly on press. Below them, a second register: the system's STATES drawn as a
// life-cycle instead of as icons — fallow (empty), germinating (loading, the seed head
// filling in golden-angle order), ripe (done — it deepens rather than ticking green),
// and rising (progress, water filling from the foot). Each loops on the stepped clock. ---
function renderComponents() {
  return `
<div class="use-grid">
  <div class="use-cell">
    <span class="use-label">buttons</span>
    <div class="use-row">
      <button class="btn"><span class="lbl">read more</span></button>
      <button class="btn btn-red"><span class="lbl">begin</span></button>
      <button class="btn btn-ink"><span class="lbl">put to bed</span></button>
    </div>
  </div>

  <div class="use-cell">
    <span class="use-label">fields</span>
    <label class="field">
      <span class="field-label">e-post</span>
      <input type="text" placeholder="jouw@adres.nl">
    </label>
    <label class="field">
      <span class="field-label">naam</span>
      <input type="text" value="jelle boon">
    </label>
  </div>

  <div class="use-cell">
    <span class="use-label">marks</span>
    <div class="use-row">
      <span class="pill pill-red"><i class="pdot"></i>live</span>
      <span class="pill pill-ink"><i class="pdot"></i>in draft</span>
      <span class="pill pill-quiet"><i class="pdot"></i>shipped</span>
    </div>
  </div>

  <div class="use-cell card">
    <span class="use-label">a card</span>
    <h3 class="t-heading-md card-title">an atlas of good companies</h3>
    <p class="t-body-sm card-body">places worth working at, dropped as dots on a map — tap one to read what it is really about. <a class="lnk" href="#">open the map</a>.</p>
  </div>
</div>

<span class="use-sub">states, as a season — not icons, but a life-cycle</span>
<div class="state-grid">
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="fallow"></span></div>
    <figcaption class="state-cap"><span class="state-name">fallow</span><span class="state-note">empty — nothing sown yet</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><svg class="gseedhead" viewBox="-26 -26 52 52" focusable="false">${growingSeedHead()}</svg></div>
    <figcaption class="state-cap"><span class="state-name">germinating</span><span class="state-note">loading — the head fills, seed by seed</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="ripe"></span></div>
    <figcaption class="state-cap"><span class="state-name">ripe</span><span class="state-note">done — the colour deepens, never a green tick</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="rising"><span class="rising-fill"></span></span></div>
    <figcaption class="state-cap"><span class="state-name">rising</span><span class="state-note">progress — water filling from the foot</span></figcaption>
  </figure>
</div>`;
}

// --- Theming demo. Illustrative skins that swap ONLY colour roles (surface, ink,
// accent) while structure, type and components stay identical — the "theme by
// swapping" principle, made visible. Script-free: radio :checked drives the
// panel's overridden variables. These are NOT shipped tokens. ---
const SKINS = [
  { id: 'cream', label: 'cream', vars: null },
  {
    id: 'lilac',
    label: 'lilac',
    vars: {
      'color-surface-page': '#ECE7F3',
      'color-surface-deep': '#E1D8EE',
      'color-surface-claim': 'rgba(206, 189, 232, 0.5)',
      'color-text-default': '#241D33',
      'color-text-soft': '#4C4264',
      'color-accent-base': '#7C5CBF',
      'color-accent-soft': '#9277CC',
    },
  },
  {
    id: 'sage',
    label: 'sage',
    vars: {
      'color-surface-page': '#E8EDE3',
      'color-surface-deep': '#D9E2D1',
      'color-surface-claim': 'rgba(199, 214, 189, 0.5)',
      'color-text-default': '#1E261C',
      'color-text-soft': '#455041',
      'color-accent-base': '#4F7A52',
      'color-accent-soft': '#6E976F',
    },
  },
  {
    id: 'clay',
    label: 'clay',
    vars: {
      'color-surface-page': '#F1E4DC',
      'color-surface-deep': '#E7D2C6',
      'color-surface-claim': 'rgba(226, 200, 184, 0.5)',
      'color-text-default': '#2A1C16',
      'color-text-soft': '#574236',
      'color-accent-base': '#A8412E',
      'color-accent-soft': '#C0604D',
    },
  },
  {
    id: 'indigo',
    label: 'indigo',
    vars: {
      'color-surface-page': '#E6EAF2',
      'color-surface-deep': '#D7DEEC',
      'color-surface-claim': 'rgba(196, 209, 235, 0.5)',
      'color-text-default': '#1B2233',
      'color-text-soft': '#3F4860',
      'color-accent-base': '#3F5BA8',
      'color-accent-soft': '#6478BC',
    },
  },
  {
    id: 'plum',
    label: 'plum',
    vars: {
      'color-surface-page': '#F1E3EC',
      'color-surface-deep': '#E7D0DF',
      'color-surface-claim': 'rgba(228, 196, 216, 0.5)',
      'color-text-default': '#2C1B26',
      'color-text-soft': '#574150',
      'color-accent-base': '#9C3F77',
      'color-accent-soft': '#B5608F',
    },
  },
  {
    id: 'slate',
    label: 'slate',
    vars: {
      'color-surface-page': '#E8EBF0',
      'color-surface-deep': '#D9DEE8',
      'color-surface-claim': 'rgba(199, 208, 222, 0.5)',
      'color-text-default': '#1B2028',
      'color-text-soft': '#424A57',
      'color-accent-base': '#4D6483',
      'color-accent-soft': '#6E83A0',
    },
  },
  {
    id: 'moss',
    label: 'moss',
    vars: {
      'color-surface-page': '#EAEBE0',
      'color-surface-deep': '#DCDED0',
      'color-surface-claim': 'rgba(204, 208, 184, 0.5)',
      'color-text-default': '#21241A',
      'color-text-soft': '#474B38',
      'color-accent-base': '#5E6B2C',
      'color-accent-soft': '#7D8A4A',
    },
  },
  {
    id: 'rose',
    label: 'rose',
    vars: {
      'color-surface-page': '#F4E8E9',
      'color-surface-deep': '#ECD8DA',
      'color-surface-claim': 'rgba(233, 204, 208, 0.5)',
      'color-text-default': '#2B1B1E',
      'color-text-soft': '#574247',
      'color-accent-base': '#B24A5A',
      'color-accent-soft': '#C56E7C',
    },
  },
  {
    id: 'ochre',
    label: 'ochre',
    vars: {
      'color-surface-page': '#F3ECDD',
      'color-surface-deep': '#EADCC4',
      'color-surface-claim': 'rgba(229, 212, 175, 0.5)',
      'color-text-default': '#292210',
      'color-text-soft': '#564A2F',
      'color-accent-base': '#B07C20',
      'color-accent-soft': '#C49A4A',
    },
  },
  {
    id: 'teal',
    label: 'teal',
    vars: {
      'color-surface-page': '#E3EDEB',
      'color-surface-deep': '#D2E2DF',
      'color-surface-claim': 'rgba(193, 221, 216, 0.5)',
      'color-text-default': '#16241F',
      'color-text-soft': '#3E534E',
      'color-accent-base': '#2E7A70',
      'color-accent-soft': '#519790',
    },
  },
  {
    id: 'wine',
    label: 'wine',
    vars: {
      'color-surface-page': '#F2E7E7',
      'color-surface-deep': '#E8D3D3',
      'color-surface-claim': 'rgba(227, 197, 197, 0.5)',
      'color-text-default': '#2A1718',
      'color-text-soft': '#553B3D',
      'color-accent-base': '#8E3A3F',
      'color-accent-soft': '#A85D61',
    },
  },
];

function renderThemeBar() {
  // Top-of-page switcher. Each tab carries a mini two-tone swatch (the skin's paper
  // + accent) so it reads as "pick your paper", not plain text. Selecting a skin
  // reskins the WHOLE page: body:has(#…:checked) overrides the colour-role vars,
  // which cascade (via the re-link layer) through every component. Script-free.
  const tabs = SKINS.map((s, i) => {
    const sw = s.vars
      ? { surface: s.vars['color-surface-page'], accent: s.vars['color-accent-base'] }
      : { surface: '#F1ECE0', accent: '#B84A39' };
    return (
      `<input class="th-radio" type="radio" name="th" id="th-${s.id}"${i === 0 ? ' checked' : ''}>` +
      `<label class="th-tab" for="th-${s.id}">` +
      `<span class="th-chip" style="--s:${sw.surface};--a:${sw.accent}"></span>${escapeHtml(s.label)}</label>`
    );
  }).join('');

  // Generated: each skin's whole-page role override + its active/focus tab state.
  const rules = SKINS.map((s) => {
    const pieces = [];
    if (s.vars) {
      const decls = Object.entries(s.vars)
        .map(([k, v]) => `--${k}: ${v};`)
        .join(' ');
      // reskin the bloom + pollen too, so the atmosphere shifts hue with the theme.
      // The broad b1 blob stays a LIGHT surface tint (it sits at high opacity over a
      // huge area — a saturated accent there reads far too hot); the two smaller blobs
      // and the pollen take the skin's soft accent, matching the cream baseline's weight.
      const bloom =
        '--wx-bloom-a: var(--color-surface-claim); --wx-bloom-b: var(--color-accent-soft); --wx-bloom-c: var(--color-accent-soft); --wx-pollen: var(--color-accent-soft);';
      pieces.push(`body:has(#th-${s.id}:checked) { ${decls} ${bloom} }`);
    }
    pieces.push(`#th-${s.id}:checked + .th-tab { background: var(--color-text-default); color: var(--color-surface-page); }`);
    pieces.push(`#th-${s.id}:focus-visible + .th-tab { outline: 2px solid var(--color-accent-base); outline-offset: -2px; }`);
    return pieces.join('\n');
  }).join('\n');

  return (
    `<style>\n/* illustrative skins — these override colour roles for the demo only; they are not\n   shipped [data-theme] token themes. */\n${rules}\n</style>\n` +
    `<div class="theme-bar">` +
    `<span class="theme-switch-label">theme</span>` +
    `<div class="theme-seg">${tabs}</div>` +
    `</div>`
  );
}

// --- Animated grid ambience: a faint pulsing rooster behind everything. The cell
// alphas breathe on the system's breathe range (7–16s, the breathe-min/max
// durations); per-cell range and phase are derived from the index so the field
// desyncs without any randomness. Suppressed under prefers-reduced-motion. ---
function renderGrid() {
  const COLS = 16;
  const ROWS = 10;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const r1 = ((i * 9301 + 49297) % 233280) / 233280;
    const r2 = ((i * 1597 + 51749) % 233280) / 233280;
    const r3 = ((i * 7919 + 12553) % 233280) / 233280;
    const a = (0.05 + r1 * 0.05).toFixed(3); // low  0.050–0.100
    const b = (0.1 + r2 * 0.06).toFixed(3); // high  0.100–0.160
    const d = (7 + r3 * 9).toFixed(2); // 7–16s, the breathe range
    const dl = (-r1 * 12).toFixed(2); // negative offsets desync the field
    return `<i style="--a:${a};--b:${b};--d:${d}s;--dl:${dl}s"></i>`;
  }).join('');
  return `<div class="grid" aria-hidden="true" style="--cols:${COLS};--rows:${ROWS}">${cells}</div>`;
}

// --- Page styles. Colour/type/spacing come from the system's own tokens
// (var(--…)); literals are reserved for layout, atmosphere, the stepped feel, and
// the illustrative theming demo. Square corners everywhere — the system has no
// radius. ---
function pageStyles() {
  return `
* { box-sizing: border-box; border-radius: 0; }
html, body { margin: 0; }
body {
  background: var(--color-surface-page);
  color: var(--color-text-default);
  font: var(--typography-body);
  text-transform: lowercase;
  letter-spacing: -0.012em;
  -webkit-font-smoothing: antialiased;
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  overflow-x: hidden;
  /* interactions are instant — hover changes have no transition and the press is an
     untransitioned hard drop; the only motion on the page is the ambient grid and
     bloom. */
  /* re-link the colour-carrying component vars to their colour roles so one role
     override (the theming demo) reskins the whole page. The build flattens these
     aliases to literals; the showcase restores the link for the live reskin. */
  --button-text-default: var(--color-text-default);
  --button-text-hover: var(--color-text-on-ink);
  --button-surface-hover: var(--color-surface-ink);
  --button-border-default: var(--color-border-strong);
  --button-border-hover: var(--color-surface-ink);
  --field-border-default: var(--color-border-default);
  --field-border-focus: var(--color-accent-base);
  --field-text: var(--color-text-default);
  --field-placeholder: var(--color-text-faint);
  --badge-text: var(--color-text-default);
  --badge-border: var(--color-border-default);
  --link-text-default: var(--color-text-default);
  --link-text-hover: var(--color-accent-base);
  --link-underline-default: var(--color-border-quiet);
  --link-underline-hover: var(--color-accent-base);
  /* bloom + pollen colours — the cream baseline (a warm amber + soft red glow, amber
     motes). The theming demo overrides these per skin (see renderThemeBar) so the
     atmosphere and the pollen reskin with the theme too. */
  --wx-bloom-a: var(--color-cream-bloom);
  --wx-bloom-b: var(--color-amber);
  --wx-bloom-c: var(--color-red-soft);
  --wx-pollen: var(--color-amber);
}

/* atmosphere: a pulsing grid, grain, and a slow warm bloom */
.grid {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
  display: grid; grid-template-columns: repeat(var(--cols), 1fr); grid-template-rows: repeat(var(--rows), 1fr);
}
@property --bo { syntax: '<number>'; initial-value: 0.08; inherits: false; }
.grid i {
  --bo: var(--a);
  border-right: 1px solid rgb(31 27 22 / var(--bo));
  border-bottom: 1px solid rgb(31 27 22 / var(--bo));
  animation: bo var(--d) ease-in-out infinite; animation-delay: var(--dl);
}
@keyframes bo { 0%, 100% { --bo: var(--a); } 50% { --bo: var(--b); } }

body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: ${GRAIN}; background-size: 180px 180px;
  mix-blend-mode: multiply; opacity: 0.62;
}
.bloom { position: fixed; inset: -20vmax; z-index: 0; pointer-events: none; mix-blend-mode: multiply; filter: blur(64px); }
.bloom i { position: absolute; width: 68vmax; height: 68vmax; opacity: 0.85; will-change: transform; display: block; }
.bloom .b1 { background: radial-gradient(circle, var(--wx-bloom-a) 0%, transparent 68%); top: -14vmax; left: -8vmax; animation: d1 38s ease-in-out infinite alternate; }
.bloom .b2 { background: radial-gradient(circle, var(--wx-bloom-b) 0%, transparent 64%); top: 24vmax; right: -18vmax; opacity: 0.42; animation: d2 51s ease-in-out infinite alternate; }
.bloom .b3 { background: radial-gradient(circle, var(--wx-bloom-c) 0%, transparent 60%); bottom: -26vmax; left: 20vmax; opacity: 0.34; animation: d3 67s ease-in-out infinite alternate; }
@keyframes d1 { to { transform: translate(8vmax, 6vmax) scale(1.15); } }
@keyframes d2 { to { transform: translate(-10vmax, -5vmax) scale(0.95); } }
@keyframes d3 { to { transform: translate(12vmax, -8vmax) scale(1.1); } }

.sheet { position: relative; z-index: 1; padding: var(--space-2xl); max-width: 1180px; margin: 0 auto; }

/* the section divider — a phyllotactic seed head: the system's ink dot, placed by the
   golden angle (a sunflower's packing). Quiet, centred. */
.divider { display: flex; justify-content: center; margin: var(--space-2xl) 0; }
.seed { width: 42px; height: 42px; fill: var(--color-text-soft); opacity: 0.8; }

/* the hairline botanical mark in the colophon — a leaf as a drawing, at rule weight */
.leaf-mark { width: 16px; height: 23px; flex: none; color: var(--color-border-strong); }

/* weather — staggered per-glyph motion for a header (.wx-wind / .wx-rain / .wx-leaves
   / .wx-drift). Each glyph is an inline-block carrying its index (--ci); the index
   offsets the delay so the effect ripples across, like the grid's staggered cells.
   All four are STEPPED (steps()) — the system's low-FPS, stop-motion look. */
.wxc { display: inline-block; will-change: transform; }
.wx-wind .wxc { animation: wx-wind 2.6s steps(6) infinite; animation-delay: calc(var(--ci) * 0.08s); }
@keyframes wx-wind {
  0%, 100% { transform: translateX(0) rotate(0); }
  35% { transform: translateX(0.045em) rotate(1.6deg); }
  65% { transform: translateX(-0.02em) rotate(-0.9deg); }
}
.wx-rain .wxc { animation: wx-rain 2.1s steps(5) infinite; animation-delay: calc(var(--ci) * 0.07s); }
@keyframes wx-rain {
  0%, 72%, 100% { transform: translateY(0); opacity: 1; }
  10% { transform: translateY(0.16em); opacity: 0.78; }
  34% { transform: translateY(0); opacity: 1; }
}
/* leaves: each glyph drifts down a touch and tips, like a leaf catching air */
.wx-leaves .wxc { animation: wx-leaves 3.4s steps(7) infinite; animation-delay: calc(var(--ci) * 0.1s); }
@keyframes wx-leaves {
  0%, 100% { transform: translateY(0) rotate(0); }
  40% { transform: translateY(0.08em) rotate(-2.4deg); }
  70% { transform: translateY(0.03em) rotate(1.4deg); }
}
/* pollen/drift: each glyph lifts and settles, the way a thing rides warm air */
.wx-drift .wxc { animation: wx-drift 4s steps(8) infinite; animation-delay: calc(var(--ci) * 0.12s); }
@keyframes wx-drift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.05em); }
}
/* fireflies: the word glows a touch warmer as the swarm pulses — a soft amber breath */
.wx-fireflies .wxc { animation: wx-fireflies 3s steps(6) infinite; animation-delay: calc(var(--ci) * 0.11s); }
@keyframes wx-fireflies {
  0%, 100% { transform: translateY(0); text-shadow: none; }
  50% { transform: translateY(-0.03em); text-shadow: 0 0 0.5em var(--wx-pollen); }
}
/* snow: each glyph settles — a slow, soft downward sink and recover */
.wx-snow .wxc { animation: wx-snow 4.4s steps(8) infinite; animation-delay: calc(var(--ci) * 0.13s); }
@keyframes wx-snow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(0.05em); }
}
/* mist: glyphs soften, fading a little as a bank passes, as if seen through haze */
.wx-mist .wxc { animation: wx-mist 5s steps(6) infinite; animation-delay: calc(var(--ci) * 0.09s); }
@keyframes wx-mist {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.62; }
}
/* light: glyphs warm and lift faintly as a sun-pool drifts over them */
.wx-sun .wxc { animation: wx-sun 4.6s steps(7) infinite; animation-delay: calc(var(--ci) * 0.12s); }
@keyframes wx-sun {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* four STANDALONE headers — no boxes. Each .wx-cell is borderless; its .wx-field is
   feathered at the top and sides (a mask) so the weather bleeds into the page instead
   of being clipped to a panel. The word's own glyphs carry the .wx-* motion; the
   particles move around it. Removed under reduced motion (see the media query). */
.wx-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2xl) var(--space-xl); }
.wx-cell { position: relative; overflow: hidden; margin: 0; min-height: 140px;
  padding: var(--space-md) 0; display: flex; flex-direction: column; justify-content: center; gap: var(--space-sm); }
.wx-field { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
  -webkit-mask: linear-gradient(to bottom, transparent, #000 18%), linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
  -webkit-mask-composite: source-in;
  mask: linear-gradient(to bottom, transparent, #000 18%), linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
  mask-composite: intersect; }
.wx-word { position: relative; z-index: 1; margin: 0; font: var(--typography-heading-lg); text-transform: lowercase; }
.wx-cap { position: relative; z-index: 1; display: flex; align-items: baseline; gap: var(--space-md); flex-wrap: wrap; }
.wx-name { font: var(--typography-label); text-transform: lowercase; }
.wx-note { font: var(--typography-body-sm); color: var(--color-text-soft); }

/* rain stands on a faint ground rule near the cell foot: the drops land there and
   fade (drop-land), and the splashes flash open on the same line. */
.wx-ground { position: absolute; left: 0; right: 0; bottom: var(--space-md); height: 1px; z-index: 1; pointer-events: none;
  background: linear-gradient(to right, transparent, var(--color-border-default) 7%, var(--color-border-default) 93%, transparent); }
.is-rain .drop { animation-name: drop-land; }
@keyframes drop-land { 0% { top: -16%; opacity: var(--o); } 84% { opacity: var(--o); } 100% { top: calc(100% - var(--space-md)); opacity: 0; } }
.is-rain .splash { bottom: var(--space-md); }

/* wind: tapered hairline streaks blow left→right; a few square ink specks ride along,
   bobbing on the same wind. Both cross the plate on the shared gust keyframe, stepped
   per-particle (var(--tf)) so they advance frame by frame. */
.gust { position: absolute; top: var(--y); left: calc(-1 * var(--len)); width: var(--len); height: 1px;
  background: linear-gradient(90deg, transparent, rgb(31 27 22 / var(--o)) 35%, rgb(31 27 22 / var(--o)) 65%, transparent);
  animation: gust var(--d) var(--tf) infinite; animation-delay: var(--dl); will-change: left; }
@keyframes gust { to { left: 100%; } }
.mote { position: absolute; top: var(--y); left: -4%; width: var(--sz); height: var(--sz);
  background: rgb(31 27 22 / var(--o)); will-change: left, transform;
  animation: gust var(--d) var(--tf) infinite, bob var(--bd) var(--tf2) infinite;
  animation-delay: var(--dl), var(--dl); }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

/* rain: slanted hairline drops streak top→bottom; short splash ticks flash open along
   the floor to read as impacts. */
.drop { position: absolute; top: -20%; left: var(--x); width: 1px; height: var(--len);
  background: linear-gradient(180deg, transparent, rgb(31 27 22 / var(--o)));
  transform: rotate(9deg); transform-origin: top; animation: drop var(--d) var(--tf) infinite; animation-delay: var(--dl); will-change: top; }
@keyframes drop { to { top: 120%; } }
.splash { position: absolute; bottom: 7%; left: var(--x); width: 7px; height: 1px; transform: scaleX(0);
  background: rgb(31 27 22 / var(--o)); animation: splash var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes splash { 0%, 68% { transform: scaleX(0); opacity: 0; } 80% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1.8); opacity: 0; } }

/* fall (abstract): a thin hairline sliver that falls while tumbling and drifting on a
   single graceful S — it fades in at the top and dissolves before it lands, so it never
   meets a hard edge. One animation, so the tumble and the descent stay in step. */
.fleck { position: absolute; top: -14%; left: var(--x); width: var(--w); height: var(--h);
  background: var(--color-text-soft); will-change: top, transform, opacity;
  animation: fleckfall var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes fleckfall {
  0% { top: -14%; transform: translateX(0) rotate(0deg); opacity: 0; }
  12% { opacity: var(--o); }
  50% { transform: translateX(calc(var(--drift) * -0.5)) rotate(calc(var(--spin) * 0.5)); }
  85% { opacity: var(--o); }
  100% { top: 116%; transform: translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
}

/* pollen/drift: warm amber motes lifting and wandering on a slow current, fading in
   and out at the edges of sight — light made visible. */
.pollen { position: absolute; left: var(--x); top: var(--y); width: var(--sz); height: var(--sz);
  background: var(--wx-pollen); will-change: transform, opacity;
  animation: drift var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes drift {
  0% { transform: translate(0, 0); opacity: 0; }
  25%, 75% { opacity: var(--o); }
  100% { transform: translate(var(--dx), calc(-1 * var(--dy))); opacity: 0; }
}

/* fireflies (the animal): warm motes wander on one slow clock and blink on a second,
   faster one — the stepped timing makes the light snap on and off the way a firefly
   pulses, rather than fade. Each carries a small amber glow. */
.firefly { position: absolute; left: var(--x); top: var(--y); width: var(--sz); height: var(--sz);
  background: var(--wx-pollen); box-shadow: 0 0 5px 1px var(--wx-pollen); opacity: 0; will-change: transform, opacity;
  animation: firefly-wander var(--dw) var(--tf) infinite, firefly-blink var(--bd) var(--tf2) infinite;
  animation-delay: var(--dl), var(--bl); }
@keyframes firefly-wander { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(var(--dx), var(--dy)); } }
@keyframes firefly-blink { 0%, 44%, 100% { opacity: 0; } 54%, 70% { opacity: var(--o); } }

/* snow: small open (hairline-outlined) squares — snow as line-art — swaying down slow
   and fading before they reach the foot, so nothing piles at a hard edge. */
.flake { position: absolute; top: -10%; left: var(--x); width: var(--sz); height: var(--sz);
  border: 1px solid rgb(31 27 22 / 0.55); opacity: 0; will-change: top, transform, opacity;
  animation: snowfall var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes snowfall {
  0% { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0; }
  12% { opacity: var(--o); }
  25% { transform: translateX(var(--sw)) rotate(calc(var(--rot) * 0.25)); }
  50% { transform: translateX(0) rotate(calc(var(--rot) * 0.5)); }
  75% { transform: translateX(calc(-1 * var(--sw))) rotate(calc(var(--rot) * 0.75)); }
  88% { opacity: var(--o); }
  100% { top: 112%; transform: translateX(0) rotate(var(--rot)); opacity: 0; }
}

/* mist: wide, very soft paper-pale bands drifting slowly sideways at their own heights
   and speeds, so the layers part like morning fog. The faintest, slowest field. */
.haze { position: absolute; left: 10%; top: var(--y); width: 80%; height: var(--bh); opacity: 0;
  background: linear-gradient(90deg, transparent, var(--color-surface-page) 30%, var(--color-surface-page) 70%, transparent);
  filter: blur(6px); will-change: transform, opacity;
  animation: haze-drift var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes haze-drift {
  0% { transform: translateX(calc(var(--dir) * -22%)); opacity: 0; }
  25%, 75% { opacity: var(--o); }
  100% { transform: translateX(calc(var(--dir) * 22%)); opacity: 0; }
}

/* light (dappled sun): soft warm pools — the bloom shrunk and scattered — breathing and
   drifting a little, warm-multiplied onto the paper so they read as sunlight pooling. */
.sunpool { position: absolute; left: var(--x); top: var(--y); width: var(--sz); height: var(--sz);
  border-radius: 50%; background: radial-gradient(circle, var(--wx-pollen), transparent 70%);
  mix-blend-mode: multiply; filter: blur(10px); opacity: 0; will-change: transform, opacity;
  animation: sunpool-breathe var(--d) var(--tf) infinite; animation-delay: var(--dl); }
@keyframes sunpool-breathe {
  0%, 100% { transform: translate(0, 0) scale(0.85); opacity: 0; }
  50% { transform: translate(var(--dx), var(--dy)) scale(1.1); opacity: var(--o); }
}

/* three voices, one job each: Caveat for numerals only (.fig), JetBrains Mono for
   genuine values only (.val — hexes, sizes), and Archivo for everything else —
   titles, labels and notes, set apart by size / weight / colour. */
.val { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-text-quiet); }

/* masthead */
.masthead { overflow: hidden; position: relative; }
/* the masthead carries the pollen effect: a field of warm motes drifting up behind
   the wordmark, whose own glyphs lift gently (.wx-drift). */
.masthead-wx { z-index: 0; }
.masthead .big { position: relative; z-index: 1; font: var(--typography-display); line-height: 0.92; letter-spacing: -0.04em; white-space: nowrap; margin: 0; }
.masthead .sub { position: relative; z-index: 1; font: var(--typography-body-lg); color: var(--color-text-soft); max-width: 48ch; margin: var(--space-md) 0 0; }

/* sections */
section { margin-top: var(--space-2xl); }
.sec-head { display: flex; align-items: baseline; gap: var(--space-lg); margin-bottom: var(--space-lg); border-bottom: 1px solid var(--color-border-default); padding-bottom: var(--space-sm); }
.fig { font-family: 'Caveat', cursive; font-weight: 700; font-size: 52px; line-height: 0.7; color: var(--color-accent-base); text-transform: none; }
.sec-head h2 { font: var(--typography-heading-lg); text-transform: lowercase; margin: 0; }
.sec-head .sec-note { margin-left: auto; align-self: center; font: var(--typography-body-sm); text-transform: lowercase; color: var(--color-text-soft); }

/* palette by role */
.palette { display: grid; gap: var(--space-xl); }
.role-head { display: flex; align-items: baseline; gap: var(--space-md); margin-bottom: var(--space-md); }
.role-name { font: var(--typography-heading-md); text-transform: lowercase; }
.role-note { font: var(--typography-body-sm); color: var(--color-text-soft); }
/* the colour + component panels are solid paper (they mask the atmosphere behind),
   carrying the SAME light grain as the page — a low-opacity multiply layer dropped
   behind the content so text stays readable. auto-fit (not auto-fill) lets the
   swatches stretch to fill the row, so the last colours still meet the right border. */
.role-swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); border: 1px solid var(--color-border-default);
  position: relative; isolation: isolate; background: var(--color-surface-page); }
.role-swatches::before, .use-grid::before, .state-grid::before, .pigment-plate::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image: ${GRAIN}; background-size: 180px 180px; mix-blend-mode: multiply; opacity: 0.5; }
.role-swatches > .sw, .use-grid > .use-cell, .state-grid > .state-cell { position: relative; z-index: 1; }
.sw { margin: 0; border-left: 1px solid var(--color-border-quiet); }
.sw:first-child { border-left: 0; }
.sw-chip { height: 80px; border-bottom: 1px solid var(--color-border-quiet); position: relative; }
.sw-here .sw-chip { box-shadow: inset 0 0 0 2px var(--color-accent-base); }
.sw-here-tag { position: absolute; left: 8px; bottom: 6px; font-family: 'Archivo', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: -0.01em; text-transform: lowercase; color: var(--color-accent-base); line-height: 1; }
.sw-meta { display: flex; flex-direction: column; gap: 2px; padding: var(--space-sm); }
.sw-name { font: var(--typography-label); text-transform: lowercase; }
.sw-use { font: var(--typography-body-sm); color: var(--color-text-soft); }
.sw-val { margin-top: 2px; }

/* type specimen — no top rule of its own; the section header already draws the line */
.spec-row { display: grid; grid-template-columns: 120px 1fr; gap: var(--space-lg); align-items: baseline; padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border-quiet); }
.spec-row:first-child { padding-top: 0; }
.spec-tag { display: flex; flex-direction: column; gap: 2px; }
.spec-role { font: var(--typography-label); text-transform: lowercase; color: var(--color-text-default); }
.spec-line { margin: 0; max-width: none; }
.spec-fig { font-family: 'Caveat', cursive; font-weight: 700; font-size: 40px; line-height: 1; letter-spacing: 0.02em; color: var(--color-accent-base); text-transform: none; }
.spec-foot { margin: var(--space-md) 0 0; font: var(--typography-body-sm); color: var(--color-text-soft); }
.display { font: var(--typography-display); line-height: 0.92; letter-spacing: -0.04em; }
.t-heading-lg { font: var(--typography-heading-lg); }
.t-heading-md { font: var(--typography-heading-md); }
.t-body { font: var(--typography-body); }
.t-body-sm { font: var(--typography-body-sm); color: var(--color-text-soft); }

/* components in use */
.use-grid { display: grid; grid-template-columns: repeat(2, 1fr); border: 1px solid var(--color-border-default);
  position: relative; isolation: isolate; background: var(--color-surface-page); }
.use-cell { position: relative; padding: var(--space-xl); border-left: 1px solid var(--color-border-default); border-top: 1px solid var(--color-border-default); display: flex; flex-direction: column; gap: var(--space-md); align-items: flex-start; min-height: var(--size-cell-min); }
.use-cell:nth-child(-n+2) { border-top: 0; }
.use-cell:nth-child(odd) { border-left: 0; }
.use-label { font: var(--typography-label); text-transform: lowercase; color: var(--color-text-default); }
.use-row { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center; }

.lbl { position: relative; z-index: 1; }

/* buttons — opaque (the grid never shows through), a faint halftone (Ben-Day) dot
   screen on every one, a heavier bottom-edge, an INSTANT press (transform is not
   transitioned, so it reads as a hard drop) and a snappy, few-step hover. */
.btn { font: var(--button-typography); text-transform: lowercase; color: var(--button-text-default); background: var(--color-surface-page);
  border: 1px solid var(--button-border-default); border-bottom-width: 3px; padding: var(--button-padding-block) var(--button-padding-inline);
  position: relative; overflow: hidden; cursor: pointer; }
.btn::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image: radial-gradient(rgb(31 27 22) 1px, transparent 1.4px); background-size: 5px 5px; background-position: center; opacity: 0.06; }
.btn:hover { background: var(--button-surface-hover); color: var(--button-text-hover); border-color: var(--button-border-hover); }
.btn:active { transform: translateY(2px); border-bottom-width: 1px; }
.btn-red { color: var(--color-accent-base); border-color: var(--color-accent-base); }
.btn-red:hover { background: var(--color-accent-base); color: var(--color-text-on-ink); border-color: var(--color-accent-base); }
.btn-ink { background: var(--color-surface-ink); color: var(--color-text-on-ink); border-color: var(--color-surface-ink); }
.btn-ink:hover { background: var(--color-surface-page); color: var(--color-text-default); border-color: var(--color-border-strong); }

/* fields — label as gutter */
.field { display: grid; grid-template-columns: 104px 1fr; align-items: stretch; border: 1px solid var(--field-border-default); width: 100%; max-width: 360px; }
.field + .field { margin-top: -1px; }
.field-label { font: var(--typography-mark); text-transform: uppercase; color: var(--color-text-quiet); padding: 0 var(--space-md); display: flex; align-items: center;
  background: var(--color-surface-deep); border-right: 1px solid var(--color-border-quiet); }
.field input { border: 0; background: transparent; font: var(--field-typography); color: var(--field-text); padding: var(--field-padding-block) var(--field-padding-inline); outline: none; text-transform: lowercase; width: 100%; }
.field input::placeholder { color: var(--field-placeholder); }
.field:focus-within { border-color: var(--field-border-focus); }
.field:focus-within .field-label { color: var(--color-accent-base); }

/* marks (pills) */
.pill { display: inline-flex; align-items: center; gap: var(--space-inline-gap); font: var(--badge-typography); text-transform: uppercase; color: var(--badge-text);
  border: 1px solid var(--badge-border); padding: var(--badge-padding-block) var(--badge-padding-inline); }
.pill .pdot { width: 6px; height: 6px; background: currentColor; position: relative; z-index: 1; }
.pill-red { color: var(--color-accent-base); border-color: var(--color-accent-base); }
.pill-ink { background: var(--color-surface-ink); color: var(--color-text-on-ink); border-color: var(--color-surface-ink); }
.pill-quiet { color: var(--color-text-quiet); border-color: var(--color-border-quiet); }

/* card */
.card { background: var(--color-surface-claim); }
.card-title { margin: 0; }
.card-body { margin: 0; max-width: 34ch; }
.lnk { color: var(--link-text-default); text-decoration: underline; text-decoration-color: var(--link-underline-default); text-underline-offset: 3px; }
.lnk:hover { color: var(--link-text-hover); text-decoration-color: var(--link-underline-hover); }

/* states, as a life-cycle — a second register under the components, on the same light-
   grain paper. Each state is a natural stage, not an icon, and loops on the stepped
   clock: fallow (empty), germinating (loading), ripe (done), rising (progress). */
.use-sub { display: block; margin: var(--space-xl) 0 var(--space-md); font: var(--typography-label); text-transform: lowercase; color: var(--color-text-soft); }
.state-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--color-border-default);
  position: relative; isolation: isolate; background: var(--color-surface-page); }
.state-cell { margin: 0; padding: var(--space-lg) var(--space-md); border-left: 1px solid var(--color-border-quiet); border-top: 1px solid var(--color-border-quiet);
  display: flex; flex-direction: column; align-items: center; gap: var(--space-md); text-align: center; }
.state-cell:nth-child(-n+4) { border-top: 0; }
.state-cell:nth-child(4n+1) { border-left: 0; }
.state-art { width: 100%; height: 64px; display: flex; align-items: center; justify-content: center; position: relative; }
.state-cap { display: flex; flex-direction: column; gap: 2px; }
.state-name { font: var(--typography-label); text-transform: lowercase; }
.state-note { font: var(--typography-body-sm); color: var(--color-text-soft); }

/* fallow — a tilled but empty plot: faint furrows ruled across the paper, resting. */
.fallow { width: 52px; height: 40px; border: 1px solid var(--color-border-quiet);
  background-image: repeating-linear-gradient(to bottom, var(--color-border-quiet) 0 1px, transparent 1px 7px); opacity: 0.7; }

/* germinating — the seed head fills in golden-angle order; each seed pops in on a stagger
   keyed to its index, so the spiral grows outward, then clears and grows again. */
.gseedhead { width: 56px; height: 56px; fill: var(--color-text-soft); }
.gseed { opacity: 0; animation: germinate 4s steps(12) infinite; animation-delay: calc(var(--gi) * 0.05s); }
@keyframes germinate { 0% { opacity: 0; } 8% { opacity: 0.9; } 82% { opacity: 0.9; } 92%, 100% { opacity: 0; } }

/* ripe — a fruit that deepens through its stages (pale → soft → ripe) and swells a touch;
   the colour itself reports doneness, in discrete steps, never a green tick. */
.ripe { width: 30px; height: 30px; border-radius: 50%; background: var(--color-surface-claim); animation: ripen 4s steps(5) infinite; }
@keyframes ripen {
  0% { background: var(--color-surface-claim); transform: scale(0.82); }
  45% { background: var(--color-accent-soft); transform: scale(0.95); }
  80%, 100% { background: var(--color-accent-base); transform: scale(1); }
}

/* rising — water filling a vessel from the foot, tick by tick (stepped), the way a level
   climbs rather than a bar sliding. */
.rising { width: 34px; height: 46px; border: 1px solid var(--color-border-default); background: var(--color-surface-page); position: relative; overflow: hidden; }
.rising-fill { position: absolute; left: 0; right: 0; bottom: 0; height: 100%; background: var(--color-accent-soft); opacity: 0.5; transform: translateY(100%); animation: rise 4.5s steps(9) infinite; }
@keyframes rise { 0% { transform: translateY(100%); } 80%, 100% { transform: translateY(0); } }

/* pigment coda — colours behaving like ink: soft-bled organic blots that LAYER by
   multiply, deepening where they cross (subtractive, like real dye on paper). */
.pigment-plate { position: relative; height: 132px; border: 1px solid var(--color-border-default);
  background: var(--color-surface-page); isolation: isolate; overflow: hidden; }
.blot { position: absolute; z-index: 1; width: 92px; height: 92px; mix-blend-mode: multiply; filter: blur(1.5px); opacity: 0.85; }
.blot-a { left: 8%; top: 16px; background: var(--color-accent-soft); border-radius: 47% 53% 45% 55% / 55% 47% 53% 45%; }
.blot-b { left: 30%; top: 26px; background: var(--color-text-soft); border-radius: 52% 48% 56% 44% / 46% 54% 44% 56%; }
.blot-c { left: 52%; top: 14px; background: var(--wx-pollen); border-radius: 45% 55% 50% 50% / 53% 45% 55% 47%; }

/* theme switcher — top of page; selecting a skin reskins the whole page (the
   generated body:has() rules override the colour roles). It is one segmented
   control (joined segments, a shared 3px plate edge) so it reads as a pick-one,
   each segment carrying a mini paper+accent swatch. */
.theme-bar { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; padding-bottom: var(--space-lg); margin-bottom: var(--space-lg); border-bottom: 1px solid var(--color-border-default); }
.theme-switch-label { font: var(--typography-mark); text-transform: uppercase; color: var(--color-text-quiet); }
.theme-seg { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--color-border-strong); border-bottom-width: 3px; }
.th-radio { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.th-tab { display: inline-flex; align-items: center; gap: var(--space-sm); padding: 6px var(--space-md); cursor: pointer;
  font: var(--typography-label); text-transform: lowercase; color: var(--color-text-default); background: var(--color-surface-page);
  border-left: 1px solid var(--color-border-default); }
.th-tab:first-of-type { border-left: 0; }
.th-tab:hover { background: var(--color-surface-deep); }
.th-chip { width: 22px; height: 15px; background: var(--s); border: 1px solid var(--color-border-strong); position: relative; flex: none; }
.th-chip::after { content: ""; position: absolute; right: 2px; top: 2px; bottom: 2px; width: 5px; background: var(--a); }
/* the palette reskins with the chosen theme; its built hex values are the cream
   baseline, so hide them once a demo skin is on (they would no longer match). */
body:not(:has(#th-cream:checked)) .sw-val { display: none; }

/* colophon */
.colophon { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-2xl); padding-top: var(--space-lg); border-top: 1px solid var(--color-border-default); font: var(--typography-body-sm); color: var(--color-text-soft); }

a { color: inherit; }
a:focus-visible, button:focus-visible, .th-tab:focus-visible { outline: 2px solid var(--color-accent-base); outline-offset: 2px; }
::selection { background: var(--color-accent-base); color: var(--color-surface-page); }

@media (prefers-reduced-motion: reduce) {
  .bloom i, .grid i, .wxc { animation: none; }
  .wx-field { display: none; } /* drop the particle field entirely — a frozen mid-fall reads as broken */
  /* the life-cycle states freeze in a fully-formed, legible rest pose (not mid-cycle) */
  .gseed { opacity: 0.9; animation: none; }
  .ripe { animation: none; background: var(--color-accent-base); }
  .rising-fill { animation: none; transform: translateY(45%); }
}
@media (max-width: 720px) {
  .sheet { padding: var(--space-xl); }
  .use-grid { grid-template-columns: 1fr; }
  .use-cell:nth-child(odd) { border-left: 0; }
  .use-cell { border-left: 0; }
  .use-cell:not(:first-child) { border-top: 1px solid var(--color-border-default); }
  .wx-grid { grid-template-columns: 1fr; gap: var(--space-xl); }
  .state-grid { grid-template-columns: repeat(2, 1fr); }
  .state-cell:nth-child(4n+1) { border-left: 1px solid var(--color-border-quiet); }
  .state-cell:nth-child(-n+4) { border-top: 1px solid var(--color-border-quiet); }
  .state-cell:nth-child(odd) { border-left: 0; }
  .state-cell:nth-child(-n+2) { border-top: 0; }
  .masthead .big { white-space: normal; }
}
`;
}

/**
 * Render the zoo to a single self-contained HTML string.
 * @param {{manifest: Array<object>, tokenCss: string, fontCss?: string}} input — built artifacts only.
 * @returns {string} deterministic HTML
 */
export function renderShowcase({ manifest, tokenCss, fontCss = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>de ontwerp — the zoo</title>
<style>
${fontCss.trim()}
/* --- built token custom properties (inlined) --- */
${tokenCss.trim()}
/* --- the sheet --- */
${pageStyles().trim()}
</style>
</head>
<body>
${renderGrid()}
<div class="bloom" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
<div class="sheet">

  ${renderThemeBar()}

  <header class="masthead">
    <div class="wx-field masthead-wx" aria-hidden="true">${driftParticles()}</div>
    <h1 class="big wx-drift">${weatherText('de ontwerp')}</h1>
    <p class="sub">this is the zoo — a single page that shows the design system in action: its colour, type, components and motion, all built from the same tokens.</p>
  </header>

  <section>
    <div class="sec-head"><span class="fig">1</span><h2>colour by role</h2><span class="sec-note">paper &amp; ink</span></div>
    ${renderPalette(manifest)}
  </section>

  ${renderDivider()}

  <section>
    <div class="sec-head"><span class="fig">2</span><h2>type</h2><span class="sec-note">sizes, faces &amp; figures</span></div>
    ${renderType()}
  </section>

  ${renderDivider()}

  <section>
    <div class="sec-head"><span class="fig">3</span><h2>in use</h2><span class="sec-note">components, and states as a cycle</span></div>
    ${renderComponents()}
  </section>

  ${renderDivider()}

  <section>
    <div class="sec-head"><span class="fig">4</span><h2>weather</h2><span class="sec-note">ambient motion for headers</span></div>
    ${renderWeather()}
  </section>

  <footer class="colophon">${leafMark()}<span>een ontwerpsysteem voor floris kappens projecten — en voor wie er verder gebruik van wil maken.</span></footer>

</div>
</body>
</html>
`;
}
