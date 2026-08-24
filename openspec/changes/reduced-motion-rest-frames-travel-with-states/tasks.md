## 1. Co-locate reduced-motion rest frames in the effect layers

- [ ] 1.1 In `styles/states.css`, add an `@media (prefers-reduced-motion: reduce)` rest-pose rule beside each lifecycle keyframe (`ontwerp-germinate` → filled seed head at rest, `ontwerp-ripen` → accent fill at `scale(1)`, `ontwerp-rise` → settled vessel), each stopping the animation and declaring the static pose.
- [ ] 1.2 In `styles/atmosphere.css`, add reduced-motion rules that stop the grid breathing (`ontwerp-bo`) and the bloom drifts (`ontwerp-d1/-d2/-d3`) and hold a static pose (or hide the ambient field), co-located with those keyframes.
- [ ] 1.3 In `styles/weather.css`, add reduced-motion rules that (a) remove the particle fields (`.wx-field` hidden — a frozen mid-fall reads as broken) and (b) stop and rest every per-glyph header weather animation (`ontwerp-wx-wind/-rain/-leaves/-drift/-fireflies/-snow/-mist/-sun`), the gap S26 flagged.
- [ ] 1.4 In `styles/material.css`, add reduced-motion coverage for any keyframe it ships; if it ships none, confirm and record that no rule is needed.
- [ ] 1.5 Remove the reduced-motion block from `styles/responsive.css`, leaving its `max-width` layout media queries intact, so no rest frame lives in a non-shipped stylesheet.

## 2. Keyframe-coverage validation gate

- [ ] 2.1 Implement the `keyframe-coverage` gate in the propagation-validation tooling: parse the shipped CSS, collect every `@keyframes` name and the selectors referencing it, and require a `prefers-reduced-motion` rule that stops the animation and asserts a rest pose (static value or element removal) for those selectors.
- [ ] 2.2 Key the gate to the built/shipped CSS bundle path, not the zoo source tree, so a rest frame in a non-shipped stylesheet is not counted as coverage.
- [ ] 2.3 Wire the gate into the existing validation entry point so `openspec`-adjacent validation and CI run it.

## 3. Motion language rule

- [ ] 3.1 Update `design-system/language/motion.md` to state normatively that every animated state/effect requires a deliberate reduced-motion rest pose (stopped animation + explicit rest frame, or ambient-field removal), and that an animated state without one is incomplete, not optional polish.

## 4. Verification — named checks per scenario

- [ ] 4.1 `keyframe-coverage/uncovered-fails`: unit test — a fixture keyframe with no reduced-motion rule fails the gate, naming it (propagation-validation → "Uncovered keyframe fails").
- [ ] 4.2 `keyframe-coverage/covered-passes`: unit test — every shipped keyframe covered by a stop+rest rule passes; run against the real shipped bundle (propagation-validation → "Covered keyframe passes").
- [ ] 4.3 `keyframe-coverage/non-shipped-frame-ignored`: unit test — a keyframe whose only reduced-motion rule lives in a non-shipped stylesheet is reported uncovered (propagation-validation → "A rest frame outside the shipped CSS does not satisfy the gate").
- [ ] 4.4 `reduced-motion/rest-pose`: Playwright check with `prefers-reduced-motion: reduce` emulated — every animated state and effect, including the per-glyph header weather, is stopped and holds a rest pose (or the ambient field is absent), none mid-cycle (showcase → "Reduced motion settles every animated surface").
- [ ] 4.5 `reduced-motion/co-location`: assert each effect-layer style source declaring an animation carries its reduced-motion rest-pose rule in the same module, and that no reduced-motion-only stylesheet remains (showcase → "Rest-pose rules are co-located with their animation").
- [ ] 4.6 `focus/visible`: keyboard-focus check shows a visible focus indicator on an interactive component (showcase → "Focus is visible").
- [ ] 4.7 `motion-doc/rest-pose-rule`: assert `language/motion.md` states the rest-pose requirement and the "incomplete, not polish" clause (design-language → "Reader finds the rest-pose rule stated normatively").
- [ ] 4.8 Baseline gates: `openspec validate --strict` passes; the build succeeds and emits the scoped effects bundle carrying the co-located reduced-motion rules; the generated zoo is visually unchanged for viewers without a reduced-motion preference (parity against the accepted-zoo baseline).
