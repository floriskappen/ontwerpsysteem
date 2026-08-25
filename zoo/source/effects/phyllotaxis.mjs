import { lcg, r2 } from './deterministic-random.mjs';
import { memoByArgs } from './helpers.mjs';

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
export const seedHeadData = (n = 64) => headDots(n);

// String wrapper kept for the zoo sections: the circles are rendered from the
// data above, never recomputed, so markup and data cannot diverge.
export function seedHead(n = 64) {
  return seedHeadData(n)
    .map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`)
    .join('');
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
export const growingSeedHeadData = (n = 44) => growingDots(n);

// String wrapper kept for the zoo sections; derived from the data, byte-identical.
export function growingSeedHead(n = 44) {
  return growingSeedHeadData(n)
    .map((d) => `<circle class="gseed" style="--gi:${d.gi}" cx="${d.cx}" cy="${d.cy}" r="${d.r}"/>`)
    .join('');
}

export const implementsRecipes = [];
