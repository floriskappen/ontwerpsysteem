import { growingSeedHead } from '../effects/phyllotaxis.mjs';

export function renderStates() {
  return `
<span class="use-sub">states, as a season — not icons, but a life-cycle</span>
<div class="state-grid">
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="fallow"></span></div>
    <figcaption class="state-cap"><span class="state-name">fallow</span><span class="state-note">empty — nothing sown yet</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><svg class="gseedhead" viewBox="-26 -26 52 52" focusable="false">${growingSeedHead()}</svg></div>
    <figcaption class="state-cap"><span class="state-name">germinating</span><span class="state-note">loading — the head fills, seed by seed</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="ripe"></span></div>
    <figcaption class="state-cap"><span class="state-name">ripe</span><span class="state-note">done — the colour deepens, never a green tick</span></figcaption>
  </figure>
  <figure class="state-cell">
    <div class="state-art" aria-hidden="true"><span class="rising"><span class="rising-fill"></span></span></div>
    <figcaption class="state-cap"><span class="state-name">rising</span><span class="state-note">progress — water filling from the foot</span></figcaption>
  </figure>
</div>`;
}
export const implementsRecipes = [
  "state.loading.germinating",
  "state.done.ripe"
];
