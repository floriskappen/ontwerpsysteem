## Why

The redesigned zoo proved the direction but carried borrowed furniture and AI-generic
tells: a fixed red margin rule and an a–l rooster axis that aren't viable system
elements, a bottom "art" folio lifted from the reference sheet, Roman numerals +
mono-caps section marks, and a colour section that lists anonymous hexes with no roles
— the page's own background never even shown. It also doesn't demonstrate the system's
headline principle (theme by swapping colour roles), nor carry the hand-set motion and
texture vocabulary the sibling site established.

## What Changes

- Strip the borrowed furniture: remove the fixed red margin rule, the a–l rooster axis
  row, and the bottom art folio.
- Rework the palette into colour **roles** (surface / ink / accent / border) labelled by
  purpose, and show the page background itself.
- Add a **theming demo**: alternate light skins (lilac, sage, clay) that change only
  colour roles, switchable in-page with no script, demonstrating "theme by swapping".
  The skins are illustrative — not claimed as shipped token sets.
- Replace the section furniture's voice: handwritten figures (Caveat, self-hosted) and
  annotated marks instead of Roman numerals + mono caps.
- Adopt the hand-set vocabulary as the zoo's own aesthetic: an animated pulsing grid
  ambience, a halftone (Ben-Day) surface treatment (incl. on buttons), a heavier button
  bottom-edge, and a stepped "jumpy" interaction feel.
- Keep motion/focus accessibility, self-containment, determinism, and "the system's real
  values come from the build outputs" intact.

## Capabilities

### Modified Capabilities

- `showcase`: ADD a "demonstrates theming by swapping" requirement; MODIFY "renders only
  from built outputs" so the system's real values still come from the build artifacts
  while clearly-illustrative demo content (the theming skins) is permitted. The
  removed motifs and new voice/ambience are implementation detail under the existing
  "rendered in the system's own aesthetic" requirement.

## Impact

- Rewrites `scripts/lib/showcase-core.mjs` and its tests.
- `scripts/lib/build-core.mjs`: embed a third self-hosted font (Caveat, OFL) for the
  handwritten voice.
- New committed asset: `assets/fonts/caveat-latin.woff2`.
- No token-contract or build-output change. Stepped easing is **not** added as a token
  this round: DTCG 2025.10 has no steps timing-function type (only `cubicBezier`), so it
  remains a deferred token-model decision and ships as a showcase literal for now.
