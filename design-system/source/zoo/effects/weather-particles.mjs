import { escapeHtml } from './helpers.mjs';
import { lcg, r2 } from './deterministic-random.mjs';

export function weatherText(str) {
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

const WX_FPS = 8; // deliberately low — the flip-book rate everything animates at
const stepTF = (durSec) => `steps(${Math.max(2, Math.round(durSec * WX_FPS))})`;

export function windParticles() {
  const streaks = Array.from({ length: 12 }, (_, i) => {
    const y = r2(5 + lcg(i * 2 + 1) * 90); // vertical band, 5–95%
    const len = r2(20 + lcg(i * 3 + 5) * 46); // streak length, 20–66% of the plate
    const d = r2(2.2 + lcg(i * 5 + 2) * 2.8); // 2.2–5.0s
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

export function rainParticles() {
  const drops = Array.from({ length: 38 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100); // across the full width
    const len = r2(16 + lcg(i * 3 + 5) * 20); // 16–36px drop length
    const d = r2(0.6 + lcg(i * 5 + 2) * 0.45); // 0.6–1.05s
    const dl = r2(-lcg(i * 7 + 3) * (d + 0.4));
    const o = r2(0.28 + lcg(i * 11 + 4) * 0.34); // 0.28–0.62 ink alpha
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

export function fleckParticles() {
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
    return `<i class="fleck" style="--x:${x}%;--d:${d}s;--dl:${dl}s;--o:${o};--drift:${drift}px;--spin:${spin}deg;--w:${w}px;--h:${h}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

export function driftParticles() {
  return Array.from({ length: 30 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const y = r2(lcg(i * 3 + 5) * 100);
    const d = r2(4.5 + lcg(i * 5 + 2) * 4.5); // 4.5–9s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.55 + lcg(i * 11 + 4) * 0.4); // 0.55–0.95
    const dx = r2(-22 + lcg(i * 13 + 7) * 44);
    const dy = r2(30 + lcg(i * 5 + 19) * 50);
    const sz = r2(2.5 + lcg(i * 3 + 23) * 4); // 2.5–6.5px
    return `<i class="pollen" style="--x:${x}%;--y:${y}%;--d:${d}s;--dl:${dl}s;--o:${o};--dx:${dx}px;--dy:${dy}px;--sz:${sz}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

export function fireflyParticles() {
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
    return `<i class="firefly" style="--x:${x}%;--y:${y}%;--dx:${dx}px;--dy:${dy}px;--dw:${dw}s;--bd:${bd}s;--o:${o};--sz:${sz}px;--dl:${dl}s;--bl:${bl}s;--tf:${stepTF(dw)};--tf2:${stepTF(bd)}"></i>`;
  }).join('');
}

export function flakeParticles() {
  return Array.from({ length: 32 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 100);
    const d = r2(5 + lcg(i * 3 + 5) * 4); // 5–9s slow fall
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.3 + lcg(i * 11 + 4) * 0.3); // 0.30–0.60
    const sw = r2(6 + lcg(i * 13 + 7) * 12); // 6–18px sway
    const sz = r2(3 + lcg(i * 3 + 23) * 3); // 3–6px
    const rot = r2((lcg(i * 17 + 9) < 0.5 ? -1 : 1) * (40 + lcg(i * 5 + 2) * 90));
    return `<i class="flake" style="--x:${x}%;--d:${d}s;--dl:${dl}s;--o:${o};--sw:${sw}px;--sz:${sz}px;--rot:${rot}deg;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

export function hazeParticles() {
  return Array.from({ length: 6 }, (_, i) => {
    const y = r2(6 + lcg(i * 3 + 5) * 80);
    const d = r2(14 + lcg(i * 5 + 2) * 8); // 14–22s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const bh = r2(18 + lcg(i * 13 + 7) * 26); // band thickness 18–44px
    const sgn = lcg(i * 17 + 9) < 0.5 ? -1 : 1;
    return `<i class="haze" style="--y:${y}%;--d:${d}s;--dl:${dl}s;--o:${o};--bh:${bh}px;--dir:${sgn};--tf:${stepTF(d)}"></i>`;
  }).join('');
}

export function sunpoolParticles() {
  return Array.from({ length: 8 }, (_, i) => {
    const x = r2(lcg(i * 2 + 1) * 90);
    const y = r2(lcg(i * 3 + 5) * 78);
    const sz = r2(60 + lcg(i * 13 + 7) * 80); // 60–140px
    const d = r2(6 + lcg(i * 5 + 2) * 5); // 6–11s
    const dl = r2(-lcg(i * 7 + 3) * d);
    const o = r2(0.18 + lcg(i * 11 + 4) * 0.22); // 0.18–0.40
    const dx = r2(-14 + lcg(i * 17 + 9) * 28);
    const dy = r2(-12 + lcg(i * 3 + 23) * 24);
    return `<i class="sunpool" style="--x:${x}%;--y:${y}%;--sz:${sz}px;--d:${d}s;--dl:${dl}s;--o:${o};--dx:${dx}px;--dy:${dy}px;--tf:${stepTF(d)}"></i>`;
  }).join('');
}

export const implementsRecipes = [];
