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
- Frontier/visual pass: the three fluid type ranges were documented in `$description`
  prose only (`"source is fluid: clamp(72px, 11vw, 168px)"`) while the composite shipped
  the ceiling, so display type never scaled and the zoo scrolled sideways at 375px
  (document 773px wide in a 375px window). Moved each documented range into the token
  value — the CSS `font` shorthand accepts `clamp()`, verified in Chromium — so one
  source now serves the showcase and consumers. Residual, and deliberately not decided
  here: at the 72px floor the masthead still exceeds a 375px viewport by ~48px and breaks
  "de ontwer/p". Lowering the floor is a new visual value, so it is the owner's call.
- Frontier/visual pass: keyboard focus for buttons lived only in `base.css`, which is
  showcase-only and never ships, so `components.scoped.css` gave consumers a `.btn` with
  no focus indicator at all while the zoo demonstrated one. Added a class-rooted
  `.btn:focus-visible` to `components.css` in the focus-ring role. The page reset keeps
  its bare-element rule: `scopeCss()` deliberately refuses non-class-rooted selectors so
  the bundle never styles a host page's own elements, which is why bare `<a>`/`<button>`
  focus stays the consumer's business.
- Frontier/visual pass, not actioned: `--color-text-quiet` (the `.field-label` colour)
  measures 3.0–3.3:1 on page across all twelve skins — cream 3.27, derived skins ~3.0 —
  below WCAG AA 4.5:1 for normal text. Not a regression (the derivations reproduce
  cream faithfully) and the system states no contrast bar, but v1 propagates it to
  consumers. Ochre's accent is the floor at 3.10:1. Changing any of it is a visual
  decision, so it is recorded rather than taken.
