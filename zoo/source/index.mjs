import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Sync utility to read modular CSS files
const readCss = (file) => readFileSync(join(__dirname, 'styles', file), 'utf8').trim();

// Import modular components
import { renderGrid } from './effects/grid.mjs';
import { driftParticles, weatherText } from './effects/weather-particles.mjs';
import { renderThemeBar } from './sections/theme-bar.mjs';
import { renderMasthead } from './sections/masthead.mjs';
import { renderPalette } from './sections/palette.mjs';
import { renderDivider } from './effects/phyllotaxis.mjs';
import { renderType } from './sections/type.mjs';
import { renderComponents } from './sections/components.mjs';
import { renderStates } from './sections/states.mjs';
import { renderWeather } from './sections/weather.mjs';
import { renderColophon } from './sections/colophon.mjs';

export function renderShowcase({ manifest, tokenCss, fontCss = '' }) {
  // Bundle modular CSS stylesheets
  const pageStyles = [
    readCss('base.css'),
    readCss('atmosphere.css'),
    readCss('material.css'),
    readCss('type.css'),
    readCss('components.css'),
    readCss('states.css'),
    readCss('weather.css'),
    readCss('themes.css'),
    readCss('responsive.css')
  ].join('\n');

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
${pageStyles}
</style>
</head>
<body>
${renderGrid()}
<div class="bloom" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
<div class="sheet">

  ${renderThemeBar()}

  ${renderMasthead()}

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
    ${renderStates()}
  </section>

  ${renderDivider()}

  <section>
    <div class="sec-head"><span class="fig">4</span><h2>weather</h2><span class="sec-note">ambient motion for headers</span></div>
    ${renderWeather()}
  </section>

  ${renderColophon()}

</div>
</body>
</html>
`;
}
