// The showcase ("the zoo"): renders the design system as a single self-contained
// HTML page from the BUILT artifacts only — the token manifest and the token CSS,
// both passed in and inlined. It never reads token sources, so what it shows is
// exactly what ships. Output is deterministic (no timestamps/randomness).
//
// Two parts:
//   1. Token galleries — every manifest token, grouped by tier then $type, each
//      with a type-appropriate visual. Data-driven: new tokens appear for free.
//   2. Demo UI elements — a fixed curated set shown across the interaction-state
//      matrix, styled ONLY through `var(--token)` custom properties. Where a token
//      is missing the property goes unset, so the gap is visible.
//
// Styling rule: the demo-element appearance block (between DEMO-STYLES markers)
// contains no literal colors or sizes — only `var(--…)`. Layout/chrome literals
// live outside that block.

const TIER_ORDER = ['primitive', 'semantic', 'component'];

const DEMO_ELEMENTS = [
  { kind: 'button', cls: 'zoo-button', label: 'Button' },
  { kind: 'input', cls: 'zoo-input', label: 'Text input' },
  { kind: 'checkbox', cls: 'zoo-checkbox', label: 'Selection control' },
  { kind: 'card', cls: 'zoo-democard', label: 'Card' },
  { kind: 'badge', cls: 'zoo-badge', label: 'Badge' },
  { kind: 'alert', cls: 'zoo-alert', label: 'Link / alert' },
];

const STATES = ['default', 'hover', 'active', 'focus', 'disabled', 'loading', 'error'];

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stringifyValue(v) {
  return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
}

// --- Token galleries -------------------------------------------------------

function animSample(name, decl) {
  return (
    `<div class="zoo-anim-wrap">` +
    `<div class="zoo-anim" style="${decl}"></div>` +
    `<button type="button" class="zoo-replay" data-replay>Replay</button>` +
    `</div>`
  );
}

function renderSample(e) {
  const v = `var(--${e.name})`;
  switch (e.type) {
    case 'color':
      return `<div class="zoo-swatch" style="background:${v}"></div>`;
    case 'dimension':
      return `<div class="zoo-bar" style="inline-size:${v}"></div>`;
    case 'fontFamily':
      return `<div class="zoo-specimen" style="font-family:${v}">Ag — the quick brown fox</div>`;
    case 'fontWeight':
      return `<div class="zoo-specimen" style="font-weight:${v}">Ag — the quick brown fox</div>`;
    case 'typography':
      return `<div class="zoo-specimen" style="font:${v}">Ag — the quick brown fox</div>`;
    case 'shadow':
      return `<div class="zoo-box" style="box-shadow:${v}"></div>`;
    case 'border':
      return `<div class="zoo-box" style="border:${v}"></div>`;
    case 'gradient':
      return `<div class="zoo-box" style="background:${v}"></div>`;
    case 'duration':
    case 'transition':
      return animSample(e.name, `animation-duration:${v}`);
    case 'cubicBezier':
      return animSample(e.name, `animation-timing-function:${v}`);
    default: // number, strokeStyle, unknown
      return `<code class="zoo-value">${escapeHtml(stringifyValue(e.value))}</code>`;
  }
}

function renderCard(e) {
  return (
    `<figure class="zoo-card">` +
    `<div class="zoo-sample">${renderSample(e)}</div>` +
    `<figcaption>` +
    `<code class="zoo-name">--${escapeHtml(e.name)}</code>` +
    `<span class="zoo-val">${escapeHtml(stringifyValue(e.value))}</span>` +
    (e.ref ? `<span class="zoo-ref">→ {${escapeHtml(e.ref)}}</span>` : '') +
    (e.description ? `<p class="zoo-desc">${escapeHtml(e.description)}</p>` : '') +
    `</figcaption>` +
    `</figure>`
  );
}

function groupBy(items, key) {
  const m = new Map();
  for (const it of items) {
    const k = it[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

function renderGalleries(manifest) {
  const tiers = [...TIER_ORDER, ...new Set(manifest.map((e) => e.tier).filter((t) => !TIER_ORDER.includes(t)))];
  let html = '';
  for (const tier of tiers) {
    const items = manifest.filter((e) => e.tier === tier);
    if (items.length === 0) continue;
    html += `<section class="zoo-tier"><h3 class="zoo-tier-title">${escapeHtml(tier ?? 'other')}</h3>`;
    for (const [type, toks] of groupBy(items, 'type')) {
      html +=
        `<div class="zoo-typegroup">` +
        `<h4 class="zoo-type-title">${escapeHtml(type ?? 'untyped')}</h4>` +
        `<div class="zoo-grid">${toks.map(renderCard).join('')}</div>` +
        `</div>`;
    }
    html += `</section>`;
  }
  return html || `<p class="zoo-empty">No tokens in the built set yet.</p>`;
}

// --- Demo UI elements + state matrix --------------------------------------

function stateClass(state) {
  return state === 'default' ? '' : `is-${state}`;
}

function renderControl(el, state) {
  const cls = `${el.cls} ${stateClass(state)}`.trim();
  const disabled = state === 'disabled' ? ' disabled' : '';
  const invalid = state === 'error' ? ' aria-invalid="true"' : '';
  switch (el.kind) {
    case 'button':
      return (
        `<button type="button" class="${cls}"${disabled}>` +
        (state === 'loading' ? `<span class="zoo-spinner" aria-hidden="true"></span> ` : '') +
        `Button</button>`
      );
    case 'input':
      return `<input class="${cls}" type="text" value="Text"${disabled}${invalid}>`;
    case 'checkbox':
      return (
        `<label class="zoo-checkbox-label">` +
        `<input class="${cls}" type="checkbox" checked${disabled}${invalid}> Option` +
        `</label>`
      );
    case 'card':
      return (
        `<div class="${cls}">` +
        `<strong>Card title</strong>` +
        `<p class="zoo-text-muted">Body text using an existing token.</p>` +
        `</div>`
      );
    case 'badge':
      return `<span class="${cls}">Badge</span>`;
    case 'alert':
      return `<div class="${cls}"><a class="zoo-link" href="#">A link</a> inside an alert.</div>`;
    default:
      return '';
  }
}

function renderDemo() {
  return DEMO_ELEMENTS.map(
    (el) =>
      `<div class="zoo-demo">` +
      `<h4 class="zoo-demo-title">${escapeHtml(el.label)}</h4>` +
      `<div class="zoo-states">` +
      STATES.map(
        (s) =>
          `<div class="zoo-state">` +
          `<span class="zoo-state-label">${s}</span>` +
          `<div class="zoo-state-box">${renderControl(el, s)}</div>` +
          `</div>`,
      ).join('') +
      `</div>` +
      `</div>`,
  ).join('');
}

// --- Styles ----------------------------------------------------------------

// Chrome: showcase layout and gallery sizing. Literals are allowed here because
// this is the museum, not an exhibit. Also holds the baseline focus indicator
// (an accessibility guarantee) and the reduced-motion rule.
const CHROME_STYLES = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
.zoo-header { padding: 1.5rem 2rem; border-bottom: 1px solid rgba(128,128,128,0.3); }
.zoo-header h1 { margin: 0; font-size: 1.25rem; }
.zoo-note { margin: 0.5rem 0 0; font-size: 0.85rem; opacity: 0.7; max-width: 70ch; }
main { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 2.5rem; }
.zoo-section > h2 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin: 0 0 1rem; }
.zoo-tier-title { margin: 1.25rem 0 0.5rem; font-size: 1rem; }
.zoo-type-title { margin: 0.75rem 0 0.5rem; font-size: 0.85rem; font-weight: 600; opacity: 0.6; }
.zoo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.75rem; }
.zoo-card { margin: 0; border: 1px solid rgba(128,128,128,0.25); border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.zoo-sample { min-height: 52px; display: flex; align-items: center; }
.zoo-swatch { inline-size: 100%; block-size: 52px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.12); }
.zoo-bar { block-size: 12px; min-inline-size: 4px; background: rgba(128,128,128,0.5); border-radius: 4px; }
.zoo-box { inline-size: 72px; block-size: 52px; border-radius: 6px; background: rgba(128,128,128,0.15); }
.zoo-specimen { font-size: 1.1rem; }
.zoo-name { font-size: 0.78rem; font-weight: 600; word-break: break-all; }
.zoo-val, .zoo-ref { font-size: 0.72rem; opacity: 0.7; }
.zoo-ref { font-style: italic; }
.zoo-desc { font-size: 0.7rem; opacity: 0.55; margin: 0.2rem 0 0; }
.zoo-value { font-size: 0.85rem; }
.zoo-empty { opacity: 0.6; }
.zoo-states { display: grid; grid-template-columns: repeat(7, minmax(104px, 1fr)); gap: 0.75rem; align-items: start; }
.zoo-state { display: flex; flex-direction: column; gap: 0.4rem; }
.zoo-state-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.5; }
.zoo-state-box { min-height: 44px; display: flex; align-items: center; }
.zoo-demo-title { margin: 1rem 0 0.5rem; }
:focus-visible { outline: 3px solid #4488ff; outline-offset: 2px; }
.zoo-anim-wrap { display: flex; align-items: center; gap: 0.5rem; }
.zoo-anim { inline-size: 24px; block-size: 24px; border-radius: 50%; background: rgba(128,128,128,0.5); animation-name: zoo-pulse; animation-iteration-count: 1; animation-fill-mode: both; animation-play-state: paused; }
.zoo-anim.is-playing { animation-play-state: running; }
.zoo-replay { font-size: 0.7rem; }
.zoo-spinner { display: inline-block; inline-size: 0.8em; block-size: 0.8em; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: zoo-spin 0.8s linear infinite; vertical-align: middle; }
@keyframes zoo-pulse { from { transform: translateX(0); } to { transform: translateX(56px); } }
@keyframes zoo-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .zoo-anim, .zoo-anim.is-playing, .zoo-spinner { animation: none !important; }
}
`;

// Demo-element appearance: token-only. Every color/size is a var(--…); a missing
// token leaves the property unset, surfacing the gap. No literals in this block.
const DEMO_STYLES = `/* DEMO-STYLES-START — token-only; appearance is var(--…), gaps stay visible */
.zoo-button { display: inline-flex; align-items: center; cursor: pointer; gap: var(--space-control-gap);
  background: var(--color-action-bg); color: var(--color-action-text);
  border-style: solid; border-color: var(--color-action-border); border-width: var(--border-width-control);
  border-radius: var(--radius-control); padding-block: var(--space-control-block); padding-inline: var(--space-control-inline);
  font: var(--typography-label); }
.zoo-button:hover, .zoo-button.is-hover { background: var(--color-action-bg-hover); }
.zoo-button:active, .zoo-button.is-active { background: var(--color-action-bg-active); }
.zoo-button:focus-visible, .zoo-button.is-focus { outline-color: var(--color-focus-ring); }
.zoo-button[disabled], .zoo-button.is-disabled { background: var(--color-action-bg-disabled); color: var(--color-text-disabled); cursor: not-allowed; }
.zoo-button.is-error { background: var(--color-feedback-error-bg); color: var(--color-feedback-error-text); }

.zoo-input { background: var(--color-surface); color: var(--color-text);
  border-style: solid; border-color: var(--color-border); border-width: var(--border-width-control);
  border-radius: var(--radius-control); padding-block: var(--space-control-block); padding-inline: var(--space-control-inline);
  font: var(--typography-body); }
.zoo-input:hover, .zoo-input.is-hover { border-color: var(--color-border-hover); }
.zoo-input:focus-visible, .zoo-input.is-focus { border-color: var(--color-focus-ring); outline-color: var(--color-focus-ring); }
.zoo-input[disabled], .zoo-input.is-disabled { background: var(--color-surface-disabled); color: var(--color-text-disabled); }
.zoo-input.is-error, .zoo-input[aria-invalid="true"] { border-color: var(--color-feedback-error-border); }

.zoo-checkbox { accent-color: var(--color-action-bg); }
.zoo-checkbox-label { display: inline-flex; align-items: center; gap: var(--space-inline-gap); color: var(--color-text); font: var(--typography-body); }
.zoo-checkbox.is-error { outline-color: var(--color-feedback-error-border); }

.zoo-democard { display: block; background: var(--color-surface); color: var(--color-text);
  border-style: solid; border-color: var(--color-border); border-width: var(--border-width-surface);
  border-radius: var(--radius-surface); padding: var(--space-surface); box-shadow: var(--shadow-surface);
  font: var(--typography-body); }
.zoo-democard.is-error { border-color: var(--color-feedback-error-border); }

.zoo-badge { display: inline-flex; align-items: center; background: var(--color-accent-bg); color: var(--color-accent-text);
  border-radius: var(--radius-pill); padding-block: var(--space-badge-block); padding-inline: var(--space-badge-inline);
  font: var(--typography-caption); }
.zoo-badge.is-error { background: var(--color-feedback-error-bg); color: var(--color-feedback-error-text); }

.zoo-alert { display: block; background: var(--color-surface); color: var(--color-text);
  border-style: solid; border-color: var(--color-border); border-width: var(--border-width-surface);
  border-radius: var(--radius-surface); padding: var(--space-surface); font: var(--typography-body); }
.zoo-alert.is-error { background: var(--color-feedback-error-bg); color: var(--color-feedback-error-text); border-color: var(--color-feedback-error-border); }
.zoo-link { color: var(--color-text-link); text-decoration: underline; }
.zoo-text-muted { color: var(--color-text-muted); }
/* DEMO-STYLES-END */`;

const REPLAY_SCRIPT = `
document.querySelectorAll('[data-replay]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var anim = btn.parentElement.querySelector('.zoo-anim');
    if (!anim) return;
    anim.classList.remove('is-playing');
    void anim.offsetWidth;
    anim.classList.add('is-playing');
  });
});`;

/**
 * Render the showcase to a single self-contained HTML string.
 * @param {{manifest: Array<object>, tokenCss: string}} input — built artifacts only.
 * @returns {string} deterministic HTML
 */
export function renderShowcase({ manifest, tokenCss }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ontwerpsysteem — the zoo</title>
<style>
/* --- built token custom properties (inlined) --- */
${tokenCss.trim()}
/* --- showcase chrome --- */
${CHROME_STYLES.trim()}
/* --- demo elements (token-only) --- */
${DEMO_STYLES}
</style>
</head>
<body>
<header class="zoo-header">
<h1>ontwerpsysteem — the zoo</h1>
<p class="zoo-note">Rendered from the built tokens. Demo elements are styled only from design tokens; an unstyled control means the semantic token it needs does not exist yet — a visible coverage gap, not a bug.</p>
</header>
<main>
<section class="zoo-section">
<h2>Tokens</h2>
${renderGalleries(manifest)}
</section>
<section class="zoo-section">
<h2>UI elements — state matrix</h2>
${renderDemo()}
</section>
</main>
<script type="application/json" id="zoo-manifest">${JSON.stringify(manifest)}</script>
<script>${REPLAY_SCRIPT}</script>
</body>
</html>
`;
}
