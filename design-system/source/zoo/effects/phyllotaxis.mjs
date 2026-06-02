import { lcg, r2 } from './deterministic-random.mjs';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈137.5° — the angle seed heads grow by

export function seedHead(n = 64) {
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

export function renderDivider() {
  return (
    '<div class="divider" aria-hidden="true">' +
    `<svg class="seed" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">${seedHead()}</svg>` +
    '</div>'
  );
}

export function leafMark(cls = '') {
  const s =
    'fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"';
  return (
    `<svg class="leaf-mark${cls ? ` ${cls}` : ''}" viewBox="0 0 28 40" aria-hidden="true" focusable="false">` +
    `<path d="M14 2 C23 13 23 26 14 38 C5 26 5 13 14 2 Z" ${s}/>` +
    `<path d="M14 7 L14 35 M14 15 L20 11 M14 15 L8 11 M14 23 L21 19 M14 23 L7 19" ${s}/>` +
    '</svg>'
  );
}

export function growingSeedHead(n = 44) {
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

export const implementsRecipes = [];
