import { driftParticles, weatherText } from '../effects/weather-particles.mjs';

export function renderMasthead() {
  return `
  <header class="masthead">
    <div class="wx-field masthead-wx" aria-hidden="true">${driftParticles()}</div>
    <h1 class="big wx-drift">${weatherText('de ontwerp')}</h1>
    <p class="sub">this is the zoo — a single page that shows the design system in action: its colour, type, components and motion, all built from the same tokens.</p>
  </header>
  `;
}
export const implementsRecipes = [
  "atmosphere.grid.breathing",
  "motion.clock.stepped"
];
