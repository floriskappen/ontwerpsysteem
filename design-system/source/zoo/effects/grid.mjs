// Grid effect: renders a background grid of breathing lines.
// Per-cell range and phase are derived from the index so the field
// desyncs without any runtime randomness.

export function renderGrid() {
  const COLS = 16;
  const ROWS = 10;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
    const r1 = ((i * 9301 + 49297) % 233280) / 233280;
    const r2 = ((i * 1597 + 51749) % 233280) / 233280;
    const r3 = ((i * 7919 + 12553) % 233280) / 233280;
    const a = (0.05 + r1 * 0.05).toFixed(3); // low  0.050–0.100
    const b = (0.1 + r2 * 0.06).toFixed(3); // high  0.100–0.160
    const d = (7 + r3 * 9).toFixed(2); // 7–16s
    const dl = (-r1 * 12).toFixed(2); // negative offsets desync the field
    return `<i style="--a:${a};--b:${b};--d:${d}s;--dl:${dl}s"></i>`;
  }).join('');
  return `<div class="grid" aria-hidden="true" style="--cols:${COLS};--rows:${ROWS}">${cells}</div>`;
}

export const implementsRecipes = ['atmosphere.grid.breathing'];
