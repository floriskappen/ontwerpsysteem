export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// var(--…) name from a token path: color.surface.page -> --color-surface-page.
export const cssVar = (path) => '--' + path.replaceAll('.', '-');

// The determinism memo behind every effect data function: one computed field per
// parameter set. Repeated calls return the *same* array, so a field is computed
// once per process and two renders provably cannot drift apart. Callers keep the
// returned value read-only — mutating it would leak into every later render.
export function memoByArgs(fn) {
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
export const stepTF = (durSec) => `steps(${Math.max(2, Math.round(durSec * STEP_FPS))})`;

export const implementsRecipes = [];
