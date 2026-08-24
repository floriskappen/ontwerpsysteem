# V1 worker notes

Frontier pass: read this first. One short entry per thing hit; newest last.

- `design-system/source/zoo/sections/theme-bar.mjs` hardcodes the base skin's swatch
  colours (`#F1ECE0` / `#B84A39`) because the generated data module carries `vars: null`
  for the base skin. Pre-existing, left alone in C6 — but it is a second copy of the cream
  supply values and will silently drift if cream's canonical source ever changes. A
  generated base-skin swatch pair in `skinsToData()` would close it.
- C5: the artifacts never pin the weather-particle datum shape; chose
  `{ cls, index, vars }` (vars in render order) so one generic renderer keeps the bytes
  stable — reasoning in `openspec/changes/effects-as-pure-data-modules/DECISIONS.md` §2.
  Also spec-silent: `weatherText`'s spaces (same file §1). No visual values were invented.
- C7: the pre-change reduced-motion block was partly inert — `.bloom i, .grid i, .wxc`
  lost specificity to `.bloom .b1` / `.wx-rain .wxc`, so bloom and glyph weather kept
  animating under reduce. Rest rules now mirror animation selectors exactly and the new
  keyframe-coverage gate (`scripts/lib/keyframe-coverage.mjs`) enforces selector-exact
  coverage against `design-system/dist/css/**`. C8 (and any change adding a keyframe)
  must ship a stop+pose rule naming the animation's exact selector or validation fails;
  poses for particle fields are removal (`display: none`), per
  `openspec/changes/reduced-motion-rest-frames-travel-with-states/DECISIONS.md`.
  Behavioural check: `npm run check:motion` (headless, no screenshots).
