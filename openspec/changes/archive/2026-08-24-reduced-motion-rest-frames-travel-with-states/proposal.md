## Why

The animated states and effects ship their `@keyframes` but not their reduced-motion rest frames. The only `@media (prefers-reduced-motion: reduce)` block lives in the zoo-only `styles/responsive.css`, which is not one of the effect layers the build ships as a scoped bundle — so a consumer importing the states/atmosphere/weather CSS gets the animation with no accessible fallback and must hand-author a rest pose per keyframe (struggle S21). That block also never covered the per-glyph header weather (S26). An animation that ignores the reduced-motion signal is an accessibility defect, and nothing in the machinery catches an uncovered keyframe.

## What Changes

- Move every reduced-motion rest-frame rule out of the zoo-only `styles/responsive.css` and into the same effect-layer style source as the animation it neutralises (states, atmosphere, material, weather), so the accessible fallback travels into the shipped scoped effects bundle instead of staying zoo-internal.
- Cover the currently-uncovered animations: every lifecycle state, particle field, ambient layer, **and** the per-glyph header weather motion gets a deliberate reduced-motion rest pose (a legible settled frame, not a frozen mid-cycle), with the motion neutralised.
- Add a validation gate: every `@keyframes` in shipped CSS SHALL have a corresponding reduced-motion rule that both stops the animation and asserts an explicit rest pose. An uncovered keyframe fails the build. This gate applies to any animated state or effect a later change introduces.
- State the rule normatively in the motion language: an animated state without a deliberate reduced-motion rest pose is incomplete, not optional polish.
- The zoo stays visually identical for viewers without a reduced-motion preference; only the reduced-motion behaviour becomes complete and shipped.

This is machinery, not values (the rest-pose poses themselves are content authored in the style sources). It builds on C1's namespaced keyframes and scoped effects bundle (archived `add-scoped-css-distribution`) — it does not re-spec them.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `showcase`: reduced motion yields a deliberate rest pose for every animated state and effect (including per-glyph header weather), and each rest-pose rule is authored in the same style source module as the animation it neutralises rather than in a separate zoo-only stylesheet, so it ships with the effects bundle.
- `propagation-validation`: adds the keyframe-coverage gate — every shipped `@keyframes` must have a matching reduced-motion rule that neutralises it with an explicit rest pose.
- `design-language`: the motion language document states the reduced-motion rest-pose rule normatively.

## Impact

- Style sources: `design-system/source/zoo/styles/{states,atmosphere,material,weather}.css` gain co-located reduced-motion rules; `styles/responsive.css` loses its reduced-motion block.
- Language: `design-system/language/motion.md`.
- Tooling: the propagation-validation gate gains the keyframe-coverage check.
- Consumers: additive — importing any effect layer now yields an accessible default for free; no public name changes. De-ontwerper can delete its hand-authored reduced-motion block.
