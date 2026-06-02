## 1. Strip borrowed furniture & restyle the voice (capability: showcase)

- [x] 1.1 Remove the fixed red margin rule, the a–l rooster axis row, and the bottom art
      folio from `scripts/lib/showcase-core.mjs`.
- [x] 1.2 Replace Roman numerals + mono-caps section marks with handwritten figures and
      annotation marks; reserve JetBrains Mono for genuine values (hexes) only.
- [x] 1.3 Embed Caveat (OFL) as a third self-hosted `@font-face` in `runBuild`'s font CSS;
      keep the page a single self-contained file with no network requests.

## 2. Palette by role (capability: showcase)

- [x] 2.1 Render the palette as colour roles (surface / ink / accent / border) labelled by
      purpose, drawn from the built tokens, including the page background swatch itself.

## 3. Theming demo (capability: showcase)

- [x] 3.1 Add an in-page, script-free theming demo (radio + `:checked`) with alternate
      light skins that override only colour-role variables, presented as illustrative.
- [x] 3.2 Demo buttons/swatches inside the panel reference colour-role variables directly
      so they actually reskin when the skin changes.

## 4. Hand-set vocabulary (capability: showcase)

- [x] 4.1 Add the animated pulsing grid ambience using the existing `breathe-min/max`
      duration vars; deterministic per-cell timing from the cell index; suppressed under
      `prefers-reduced-motion`.
- [x] 4.2 Add a halftone (Ben-Day) surface treatment and apply it to a button variant.
- [x] 4.3 Give buttons a heavier bottom-edge and a stepped "jumpy" interaction feel
      (literal `steps(...)`); keep a visible `:focus-visible` indicator.

## 5. Tests & verification

- [x] 5.1 Update the showcase tests: paper theme + square reset retained; palette shows
      colour roles incl. the page background; theming demo present and illustrative; no
      tier jargon / state matrix / token dump; components in use; three fonts inlined;
      self-contained (no network, no `<script src>`); deterministic.
      Covers scenarios: "The reskin is shown by swapping only colour roles",
      "Demo skins are not misrepresented as shipped tokens".
- [x] 5.2 `npm run validate && npm run build && npm test` green; the showcase regenerates
      deterministically and stays git-ignored. Covers scenarios "Showcase reflects the
      built set" and "Sources are never read directly" (build-driven render from `dist/`).
- [x] 5.3 Browser-open `dist/showcase/index.html` and confirm the reskin switches, the
      ambience respects reduced motion, and focus is visible.

## 6. Reconcile spec

- [x] 6.1 Apply the `showcase` delta (ADD theming-by-swapping; MODIFY "renders the
      system's real values from built outputs").
- [x] 6.2 `npx openspec validate reskin-showcase --strict` passes.
