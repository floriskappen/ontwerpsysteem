import { escapeHtml, memoByArgs } from './helpers.mjs';
import { lcg, r2 } from './deterministic-random.mjs';

const WX_FPS = 8; // deliberately low — the flip-book rate everything animates at
const stepTF = (durSec) => `steps(${Math.max(2, Math.round(durSec * WX_FPS))})`;

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
export const windParticlesData = memoByArgs(windField);
export const rainParticlesData = memoByArgs(rainField);
export const fleckParticlesData = memoByArgs(fleckField);
export const driftParticlesData = memoByArgs(driftField);
export const fireflyParticlesData = memoByArgs(fireflyField);
export const flakeParticlesData = memoByArgs(flakeField);
export const hazeParticlesData = memoByArgs(hazeField);
export const sunpoolParticlesData = memoByArgs(sunpoolField);

// String wrappers kept for the zoo sections; each renders its field's data.
export const windParticles = () => renderParticles(windParticlesData());
export const rainParticles = () => renderParticles(rainParticlesData());
export const fleckParticles = () => renderParticles(fleckParticlesData());
export const driftParticles = () => renderParticles(driftParticlesData());
export const fireflyParticles = () => renderParticles(fireflyParticlesData());
export const flakeParticles = () => renderParticles(flakeParticlesData());
export const hazeParticles = () => renderParticles(hazeParticlesData());
export const sunpoolParticles = () => renderParticles(sunpoolParticlesData());

// Hand-set weather text: one datum per character of the phrase, spaces included
// — they are part of the run a renderer must lay out, and keeping them here
// makes this data function the single source of the output's cardinality. Each
// datum carries its position in the source string (spaces consume one too), so
// --ci stays aligned with the phrase exactly as the zoo has always set it.
const textGlyphs = memoByArgs((str) => [...str].map((char, index) => ({ char, index })));

// Data primary — {char,index}[] for every character of the phrase.
export const weatherTextData = (str) => textGlyphs(str);

// String wrapper kept for the zoo sections: a span per glyph, a literal space
// where the phrase breathes.
export function weatherText(str) {
  return weatherTextData(str)
    .map(({ char, index }) =>
      char === ' ' ? ' ' : `<span class="wxc" style="--ci:${index}">${escapeHtml(char)}</span>`,
    )
    .join('');
}

export const implementsRecipes = [];
