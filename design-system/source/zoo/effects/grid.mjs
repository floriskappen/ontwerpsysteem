// Grid effect: a background grid of breathing lines. Per-cell range and phase
// are derived from the index alone so the field desyncs without any runtime
// randomness; the field is computed once and every render reads the same cells.
import { memoByArgs, stepTF } from './helpers.mjs';

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
export const gridData = () => cellField();

// String wrapper kept for the zoo sections; derived from the data above.
export function renderGrid() {
  const { cells, cols, rows } = gridData();
  return (
    `<div class="grid" aria-hidden="true" style="--cols:${cols};--rows:${rows}">` +
    cells.map((c) => `<i style="--a:${c.a};--b:${c.b};--d:${c.d}s;--dl:${c.dl}s;--tf:${c.tf}"></i>`).join('') +
    '</div>'
  );
}

export const implementsRecipes = ['atmosphere.grid.breathing'];
