// The showcase ("the zoo"): a single, self-contained page that presents the
// design system the way the system itself would — a class-schedule sheet pinned
// to a sun-warmed wall. Cream paper + grain, the a–l rooster axis, a red margin
// rule, lowercased Archivo, square corners, breathing hairline borders.
//
// It is rendered from the BUILT artifacts only (the token manifest + the token
// CSS, both inlined) — never from token sources, so what you see is what ships.
// It is curated, not exhaustive: it shows colour, type and components IN USE.
// The full token inventory lives in dist/manifest/tokens.json and dist/css — the
// technical record belongs in code, not on the wall.
//
// Everything visual is driven by the system's own custom properties (var(--…)),
// so the page reskins itself when the tokens change. Output is deterministic.

const COLS = 12;
const AXIS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// A multiplied fractal-noise grain, inline so the page stays self-contained.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

// --- Curated palette: solid colours only, in manifest order (paper → ink →
// accent). The rgba rule/bloom variants are deliberately left off the wall. ---
function renderPalette(manifest) {
  const chips = manifest
    .filter((e) => e.tier === 'primitive' && e.type === 'color' && /^#/.test(String(e.value)))
    .map((e) => {
      const name = e.path.replace(/^color\./, '');
      return (
        `<figure class="chip">` +
        `<div class="chip-swatch" style="background:${escapeHtml(e.value)}"></div>` +
        `<figcaption class="chip-meta"><span class="chip-name">${escapeHtml(name)}</span>` +
        `<span class="mark">${escapeHtml(String(e.value))}</span></figcaption>` +
        `</figure>`
      );
    })
    .join('');
  return `<div class="chips">${chips}</div>`;
}

// --- Type specimen: the scale set in real, lowercased Archivo. ---
function renderType() {
  const specimen = [
    ['display', 'de ontwerp', 'display · 168'],
    ['t-heading-lg', 'a quiet quarterly read', 'heading · 40'],
    ['t-heading-md', 'where the company is pointing', 'heading · 20'],
    ['t-body', 'eight pages, mailed in cream. no dashboard, no streaks, no shame — a reader for long things, lit like an afternoon window.', 'body · 15'],
    ['t-body-sm', 'streak: 6 days · 1 skipped, that’s fine', 'small · 13'],
  ];
  const lines = specimen
    .map(
      ([cls, text, tag]) =>
        `<div class="spec-row"><span class="mark spec-tag">${escapeHtml(tag)}</span>` +
        `<p class="${cls} spec-line">${escapeHtml(text)}</p></div>`,
    )
    .join('');
  return `<div class="spec">${lines}<p class="mark spec-foot">archivo · lowercased · weights 500–700 · jetbrains mono for marks</p></div>`;
}

// --- Components in use: real :hover / :focus, never a state grid. ---
function renderComponents() {
  return `
<div class="use-grid">
  <div class="use-cell" data-coord="a1">
    <span class="mark use-label">buttons</span>
    <div class="use-row">
      <button class="btn">download pdf</button>
      <button class="btn btn-red">begin reading</button>
      <button class="btn btn-ink">put it to bed</button>
    </div>
    <p class="mark use-hint">hover — paper inverts on ink</p>
  </div>

  <div class="use-cell" data-coord="e1">
    <span class="mark use-label">fields</span>
    <label class="field">
      <span class="field-label">e-post</span>
      <input type="text" placeholder="jouw@adres.nl">
    </label>
    <label class="field">
      <span class="field-label">naam</span>
      <input type="text" value="jelle boon">
    </label>
    <p class="mark use-hint">focus — the full border goes red</p>
  </div>

  <div class="use-cell" data-coord="a4">
    <span class="mark use-label">folio marks</span>
    <div class="use-row">
      <span class="pill"><i class="pdot"></i>on schedule</span>
      <span class="pill pill-red"><i class="pdot"></i>open in margin</span>
      <span class="pill pill-ink"><i class="pdot"></i>filed · iv 2026</span>
      <span class="pill pill-quiet"><i class="pdot"></i>draft</span>
    </div>
  </div>

  <div class="use-cell card" data-coord="e4">
    <span class="mark use-label">i.</span>
    <h3 class="t-heading-md card-title">de bedrijfskompas</h3>
    <p class="t-body-sm card-body">a quarterly read on where the company is pointing — eight pages, no dashboard. <a class="lnk" href="#">begin reading</a>.</p>
  </div>
</div>`;
}

function tickStrip() {
  const marks = ['fill', 'half', 'slash', 'dot', '', 'fill', '', 'red', 'dot', '', 'half', 'slash'];
  return `<div class="ticks">${marks.map((m) => `<span class="tk${m ? ' tk-' + m : ''}"></span>`).join('')}</div>`;
}

function axisRow() {
  return `<div class="axis">${AXIS.map((l) => `<span class="mark">${l}</span>`).join('')}</div>`;
}

// --- Page styles. Colour/type/spacing all come from the system's own tokens
// (var(--…)); literals are reserved for layout and atmosphere. Square corners
// everywhere — the system has no radius. ---
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
}
/* grain — multiplied across the sheet */
body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: ${GRAIN}; background-size: 180px 180px;
  mix-blend-mode: multiply; opacity: 0.5;
}
/* bloom — three slow blobs, sun through a window */
.bloom { position: fixed; inset: -20vmax; z-index: 0; pointer-events: none; mix-blend-mode: screen; filter: blur(80px); }
.bloom i { position: absolute; width: 56vmax; height: 56vmax; border-radius: 50%; opacity: 0.5; will-change: transform; display: block; }
.bloom .b1 { background: radial-gradient(circle, var(--color-cream-bloom) 0%, transparent 60%); top: -12vmax; left: -6vmax; animation: d1 38s ease-in-out infinite alternate; }
.bloom .b2 { background: radial-gradient(circle, var(--color-amber) 0%, transparent 55%); top: 28vmax; right: -16vmax; opacity: 0.32; animation: d2 51s ease-in-out infinite alternate; }
.bloom .b3 { background: radial-gradient(circle, var(--color-red-soft) 0%, transparent 50%); bottom: -24vmax; left: 22vmax; opacity: 0.2; animation: d3 67s ease-in-out infinite alternate; }
@keyframes d1 { to { transform: translate(8vmax, 6vmax) scale(1.15); } }
@keyframes d2 { to { transform: translate(-10vmax, -5vmax) scale(0.95); } }
@keyframes d3 { to { transform: translate(12vmax, -8vmax) scale(1.1); } }

.sheet { position: relative; z-index: 1; padding: var(--space-2xl) var(--space-2xl) var(--space-2xl) var(--size-page-left); max-width: 1280px; margin: 0 auto; }
/* red margin rule with a top dot */
.rule { position: fixed; top: var(--space-2xl); bottom: var(--space-2xl); left: var(--size-margin-rule-x); width: 1px; background: var(--color-accent-base); z-index: 2; }
.rule::before { content: ""; position: absolute; left: -3px; top: 0; width: var(--size-dot); height: var(--size-dot); background: var(--color-accent-base); }

.mark { font: var(--typography-mark); text-transform: uppercase; color: var(--color-text-quiet); }
.mark-red { color: var(--color-accent-base); }

/* folio strips */
.folio { display: flex; justify-content: space-between; align-items: baseline; padding-block: var(--space-sm); border-bottom: 1px solid var(--color-border-default); }
.folio.foot { border-bottom: 0; border-top: 1px solid var(--color-border-default); margin-top: var(--space-2xl); }
.folio .dot-red { color: var(--color-accent-base); }

.axis { display: grid; grid-template-columns: repeat(${COLS}, 1fr); border-bottom: 1px solid var(--color-border-default); margin-top: -1px; }
.axis > span { padding: 4px 6px; border-left: 1px solid var(--color-border-quiet); }
.axis > span:first-child { border-left: 0; }

section { margin-top: var(--space-2xl); }
.sec-head { display: flex; align-items: baseline; gap: var(--space-md); margin-bottom: var(--space-lg); }
.sec-head .n { color: var(--color-accent-base); }
.sec-head h2 { font: var(--typography-heading-md); text-transform: lowercase; margin: 0; }

/* masthead — display type, full-bleed and clipped (line-height 0.92) */
.masthead { overflow: hidden; margin-top: var(--space-xl); }
.masthead .big { font: var(--typography-display); line-height: 0.92; letter-spacing: -0.04em; white-space: nowrap; margin: 0; }
.masthead .sub { font: var(--typography-body-lg); color: var(--color-text-soft); max-width: 46ch; margin: var(--space-md) 0 0; }

/* palette */
.chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); border: 1px solid var(--color-border-default); }
.chip { margin: 0; border-left: 1px solid var(--color-border-quiet); }
.chip:first-child { border-left: 0; }
.chip-swatch { height: 92px; border-bottom: 1px solid var(--color-border-quiet); }
.chip-meta { display: flex; flex-direction: column; gap: 2px; padding: var(--space-sm); }
.chip-name { font: var(--typography-body-sm); }

/* type specimen */
.spec { border-top: 1px solid var(--color-border-default); }
.spec-row { display: grid; grid-template-columns: 96px 1fr; gap: var(--space-md); align-items: baseline; padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border-quiet); }
.spec-tag { padding-top: 6px; }
.spec-line { margin: 0; max-width: none; }
.spec-foot { margin: var(--space-md) 0 0; }
.display { font: var(--typography-display); line-height: 0.92; letter-spacing: -0.04em; }
.t-heading-lg { font: var(--typography-heading-lg); }
.t-heading-md { font: var(--typography-heading-md); }
.t-body { font: var(--typography-body); }
.t-body-sm { font: var(--typography-body-sm); color: var(--color-text-soft); }

/* components in use */
.use-grid { display: grid; grid-template-columns: repeat(2, 1fr); border: 1px solid var(--color-border-default); }
.use-cell { position: relative; padding: var(--space-xl); border-left: 1px solid var(--color-border-default); border-top: 1px solid var(--color-border-default); display: flex; flex-direction: column; gap: var(--space-md); align-items: flex-start; min-height: var(--size-cell-min); }
.use-cell:nth-child(-n+2) { border-top: 0; }
.use-cell:nth-child(odd) { border-left: 0; }
.use-cell::after { content: attr(data-coord); position: absolute; top: 6px; right: 8px; font: var(--typography-mark); text-transform: uppercase; color: var(--color-text-faint); }
.use-label { align-self: flex-start; }
.use-hint { margin: auto 0 0; color: var(--color-text-faint); }
.use-row { display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center; }

/* buttons */
.btn { font: var(--button-typography); text-transform: lowercase; color: var(--button-text-default); background: var(--button-surface-default);
  border: 1px solid var(--button-border-default); padding: var(--button-padding-block) var(--button-padding-inline); cursor: pointer;
  transition: background-color var(--motion-duration-hover) var(--motion-easing-standard), color var(--motion-duration-hover) var(--motion-easing-standard), border-color var(--motion-duration-hover) var(--motion-easing-standard); }
.btn:hover { background: var(--button-surface-hover); color: var(--button-text-hover); border-color: var(--button-border-hover); }
.btn-red { border-color: var(--color-accent-base); color: var(--color-accent-base); }
.btn-red:hover { background: var(--color-accent-base); color: var(--color-text-on-ink); border-color: var(--color-accent-base); }
.btn-ink { background: var(--color-surface-ink); color: var(--color-text-on-ink); border-color: var(--color-surface-ink); }
.btn-ink:hover { background: transparent; color: var(--color-text-default); border-color: var(--color-border-strong); }

/* fields — label as gutter */
.field { display: grid; grid-template-columns: 104px 1fr; align-items: stretch; border: 1px solid var(--field-border-default); width: 100%; max-width: 360px;
  transition: border-color var(--motion-duration-hover) var(--motion-easing-standard); }
.field + .field { margin-top: -1px; }
.field-label { font: var(--typography-mark); text-transform: uppercase; color: var(--color-text-quiet); padding: 0 var(--space-md); display: flex; align-items: center;
  background: var(--color-surface-deep); border-right: 1px solid var(--color-border-quiet); transition: color var(--motion-duration-hover) var(--motion-easing-standard); }
.field input { border: 0; background: transparent; font: var(--field-typography); color: var(--field-text); padding: var(--field-padding-block) var(--field-padding-inline); outline: none; text-transform: lowercase; width: 100%; }
.field input::placeholder { color: var(--field-placeholder); }
.field:focus-within { border-color: var(--field-border-focus); }
.field:focus-within .field-label { color: var(--color-accent-base); }

/* folio pills */
.pill { display: inline-flex; align-items: center; gap: var(--space-inline-gap); font: var(--badge-typography); text-transform: uppercase; color: var(--badge-text);
  border: 1px solid var(--badge-border); padding: var(--badge-padding-block) var(--badge-padding-inline); }
.pdot { width: 6px; height: 6px; background: currentColor; }
.pill-red { color: var(--color-accent-base); border-color: var(--color-accent-base); }
.pill-ink { background: var(--color-surface-ink); color: var(--color-text-on-ink); border-color: var(--color-surface-ink); }
.pill-quiet { color: var(--color-text-quiet); border-color: var(--color-border-quiet); }

/* card */
.card { background: var(--color-surface-claim); }
.card-title { margin: 0; }
.card-body { margin: 0; max-width: 34ch; }
.lnk { color: var(--link-text-default); text-decoration: underline; text-decoration-color: var(--link-underline-default); text-underline-offset: 3px;
  transition: text-decoration-color var(--motion-duration-hover) var(--motion-easing-standard), color var(--motion-duration-hover) var(--motion-easing-standard); }
.lnk:hover { color: var(--link-text-hover); text-decoration-color: var(--link-underline-hover); }

/* tick strip */
.ticks { display: grid; grid-template-columns: repeat(${COLS}, 1fr); border: 1px solid var(--color-border-default); margin-top: var(--space-lg); }
.tk { height: var(--size-tick); border-left: 1px solid var(--color-border-quiet); position: relative; }
.tk:first-child { border-left: 0; }
.tk-fill { background: var(--color-text-default); }
.tk-red { background: var(--color-accent-base); }
.tk-half { background: linear-gradient(180deg, transparent 50%, var(--color-text-default) 50%); }
.tk-slash::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 46%, var(--color-text-default) 46% 54%, transparent 54%); }
.tk-dot::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, var(--color-text-default) 0 2px, transparent 2.5px); }

a { color: inherit; }
a:focus-visible, button:focus-visible { outline: 2px solid var(--color-accent-base); outline-offset: 2px; }
::selection { background: var(--color-accent-base); color: var(--color-surface-page); }

@media (prefers-reduced-motion: reduce) {
  .bloom i { animation: none; }
}
@media (max-width: 720px) {
  .sheet { padding-left: var(--space-xl); }
  .rule { left: var(--space-md); }
  .use-grid { grid-template-columns: 1fr; }
  .use-cell:nth-child(odd) { border-left: 0; }
  .use-cell { border-left: 0; }
  .use-cell:nth-child(2) { border-top: 1px solid var(--color-border-default); }
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
<div class="bloom" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
<div class="rule" aria-hidden="true"></div>
<div class="sheet">

  <div class="folio">
    <span class="mark mark-red">de ontwerp</span>
    <span class="mark">the zoo · design system</span>
    <span class="mark"><span class="dot-red">●</span> in cream</span>
  </div>
  ${axisRow()}

  <header class="masthead">
    <h1 class="big">de ontwerp</h1>
    <p class="sub">a class-schedule sheet pinned to a sun-warmed wall — dutch grid logic crossed with a quiet literary warmth.</p>
  </header>

  <section>
    <div class="sec-head"><span class="mark n">i.</span><h2>paper &amp; ink</h2></div>
    ${renderPalette(manifest)}
  </section>

  <section>
    <div class="sec-head"><span class="mark n">ii.</span><h2>type</h2></div>
    ${renderType()}
  </section>

  <section>
    <div class="sec-head"><span class="mark n">iii.</span><h2>in use</h2></div>
    ${renderComponents()}
    ${tickStrip()}
  </section>

  <div class="folio foot">
    <span class="mark">rooster · 12 columns · a–l</span>
    <span class="mark">druk iv — 2026</span>
    <span class="mark"><span class="dot-red">●</span> printed in cream</span>
  </div>

</div>
</body>
</html>
`;
}
