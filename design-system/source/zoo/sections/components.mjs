export function renderComponents() {
  return `
<div class="use-grid">
  <div class="use-cell">
    <span class="use-label">buttons</span>
    <div class="use-row">
      <button class="btn"><span class="lbl">read more</span></button>
      <button class="btn btn-red"><span class="lbl">begin</span></button>
      <button class="btn btn-ink"><span class="lbl">put to bed</span></button>
    </div>
  </div>

  <div class="use-cell">
    <span class="use-label">fields</span>
    <label class="field">
      <span class="field-label">e-post</span>
      <input type="text" placeholder="jouw@adres.nl">
    </label>
    <label class="field">
      <span class="field-label">naam</span>
      <input type="text" value="jelle boon">
    </label>
  </div>

  <div class="use-cell">
    <span class="use-label">marks</span>
    <div class="use-row">
      <span class="pill pill-red"><i class="pdot"></i>live</span>
      <span class="pill pill-ink"><i class="pdot"></i>in draft</span>
      <span class="pill pill-quiet"><i class="pdot"></i>shipped</span>
    </div>
  </div>

  <div class="use-cell card">
    <span class="use-label">a card</span>
    <h3 class="t-heading-md card-title">an atlas of good companies</h3>
    <p class="t-body-sm card-body">places worth working at, dropped as dots on a map — tap one to read what it is really about. <a class="lnk" href="#">open the map</a>.</p>
  </div>
</div>`;
}
export const implementsRecipes = [
  "component.button.ink-press"
];
