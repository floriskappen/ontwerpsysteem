// Reveal surfaces — the chrome that arrives rather than toggling in place.
// Script-free by construction: the fold rides <details>'s own open state, and
// the menu, note, and sheet ride the platform popover attribute with a
// popovertarget invoker. Each surface has one reveal container whose block size
// grows around fixed content; rows and lines never animate independently.
export function renderSurfaces() {
  return `
<span class="use-sub">surfaces, as an arrival — chrome that was not there a frame ago</span>
<div class="use-grid">

  <div class="use-cell">
    <span class="use-label">dropdown</span>
    <div class="od-anchor">
      <button class="btn od-menu-invoker" popovertarget="od-menu-demo">
        <span class="lbl">field notes</span> <i class="od-cue" aria-hidden="true"></i>
      </button>
      <div class="od-menu" popover id="od-menu-demo">
        <ul class="od-menu-list">
          <li><button class="od-menu-item">sow a row</button></li>
          <li><button class="od-menu-item">mark the plot</button></li>
          <li><button class="od-menu-item">read the weather</button></li>
          <li><button class="od-menu-item">put to bed</button></li>
          <li><button class="od-menu-item od-menu-item-quiet">archive</button></li>
        </ul>
      </div>
    </div>
    <p class="surf-note">the paper height grows in two stepped frames. its items stay fixed; the press itself is instant.</p>
  </div>

  <div class="use-cell">
    <span class="use-label">popover note</span>
    <div class="od-anchor">
      <button class="btn od-note-invoker" popovertarget="od-note-demo">
        <span class="lbl">what is a claim</span> <i class="od-cue" aria-hidden="true"></i>
      </button>
      <div class="od-note" popover id="od-note-demo">
        <div class="od-note-reveal">
          <div class="od-note-body">
            <p class="od-note-line od-note-head">warm paper</p>
            <p class="od-note-line">the opaque ground a card and note sit on — paper that fully masks what lies behind.</p>
            <p class="od-note-line">claim remains a translucent role for selected cells, never this surface.</p>
          </div>
        </div>
      </div>
    </div>
    <p class="surf-note">an annotation standing off the paper on a hairline, its lines in reading order.</p>
  </div>

  <div class="use-cell">
    <span class="use-label">dialog sheet</span>
    <button class="btn btn-ink" popovertarget="od-sheet-demo"><span class="lbl">open the sheet</span></button>
    <div class="od-sheet" popover id="od-sheet-demo">
      <div class="od-sheet-frame">
        <div class="od-sheet-head">
          <h3 class="od-sheet-title">put the plot to bed</h3>
          <button class="od-sheet-dismiss" popovertarget="od-sheet-demo" popovertargetaction="hide">close</button>
        </div>
        <div class="od-sheet-body">
          <p class="od-sheet-line">the rows are cleared and the ground is turned over.</p>
          <p class="od-sheet-line">nothing is sown again until the weather says so.</p>
          <p class="od-sheet-line">
            <span class="mark mark-warn"><i class="mk"></i>this cannot be undone</span>
          </p>
        </div>
      </div>
    </div>
    <p class="surf-note">a sheet on the top layer — light-dismiss, but not a focus-trapping modal.</p>
  </div>

  <div class="use-cell">
    <span class="use-label">disclosure fold</span>
    <details class="od-fold">
      <summary class="od-fold-head">how the grain is made <i class="od-fold-sign" aria-hidden="true"></i></summary>
      <div class="od-fold-reveal">
        <div class="od-fold-body">
          <p class="od-fold-line">a fractal-noise turbulence, multiplied over the whole sheet.</p>
          <p class="od-fold-line">it is one fixed layer, never one per panel.</p>
        </div>
      </div>
    </details>
    <details class="od-fold" open>
      <summary class="od-fold-head">why the press does not glide <i class="od-fold-sign" aria-hidden="true"></i></summary>
      <div class="od-fold-reveal">
        <div class="od-fold-body">
          <p class="od-fold-line">contact is mechanical: the plate drops in the frame you press it.</p>
          <p class="od-fold-line">only a surface that was not there yet gets to arrive.</p>
        </div>
      </div>
    </details>
    <p class="surf-note">the sign is two hairline rules — a plus losing its upright — not a rotating chevron.</p>
  </div>

</div>`;
}
export const implementsRecipes = [
  "component.menu.dropdown",
  "component.popover.note",
  "component.dialog.sheet",
  "component.disclosure.fold"
];
