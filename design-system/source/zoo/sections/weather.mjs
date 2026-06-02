import {
  windParticles,
  weatherText,
  rainParticles,
  fleckParticles,
  driftParticles,
  fireflyParticles,
  flakeParticles,
  hazeParticles,
  sunpoolParticles,
} from '../effects/weather-particles.mjs';

export function renderWeather() {
  return `
<div class="wx-grid">
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${windParticles()}</div>
    <h3 class="wx-word wx-wind">${weatherText('najaarswind')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">wind</span><span class="wx-note">glyphs lean into the gust; streaks and specks blow past</span></figcaption>
  </figure>
  <figure class="wx-cell is-rain">
    <div class="wx-field" aria-hidden="true">${rainParticles()}</div>
    <h3 class="wx-word wx-rain">${weatherText('motregen')}</h3>
    <div class="wx-ground" aria-hidden="true"></div>
    <figcaption class="wx-cap"><span class="wx-name">rain</span><span class="wx-note">glyphs fall and recover; drops break on the ground beneath the word</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${fleckParticles()}</div>
    <h3 class="wx-word wx-leaves">${weatherText('bladval')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">fall</span><span class="wx-note">abstract flecks tumbling down on a slow, drifting S</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${driftParticles()}</div>
    <h3 class="wx-word wx-drift">${weatherText('stuifmeel')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">pollen</span><span class="wx-note">warm seed-down lifting on a slow, sunlit current</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${fireflyParticles()}</div>
    <h3 class="wx-word wx-fireflies">${weatherText('vuurvliegjes')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">fireflies</span><span class="wx-note">warm motes wander the dusk and blink on and off</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${flakeParticles()}</div>
    <h3 class="wx-word wx-snow">${weatherText('sneeuw')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">snow</span><span class="wx-note">outlined flakes sway down slow and settle</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${hazeParticles()}</div>
    <h3 class="wx-word wx-mist">${weatherText('nevel')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">mist</span><span class="wx-note">soft banks of haze drift across and veil the word</span></figcaption>
  </figure>
  <figure class="wx-cell">
    <div class="wx-field" aria-hidden="true">${sunpoolParticles()}</div>
    <h3 class="wx-word wx-sun">${weatherText('lichtval')}</h3>
    <figcaption class="wx-cap"><span class="wx-name">light</span><span class="wx-note">warm sun-pools breathe through a moving canopy</span></figcaption>
  </figure>
</div>`;
}
export const implementsRecipes = [
  "motion.weather.wind",
  "motion.weather.rain"
];
