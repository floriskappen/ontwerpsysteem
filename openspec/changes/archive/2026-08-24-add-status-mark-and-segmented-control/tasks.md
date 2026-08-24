# Tasks — add-status-mark-and-segmented-control

## 1. Recipes: register the two primitives

- [x] 1.1 Add `state.mark.static` to `design-system/recipes/state.recipes.json` with the
      full recipe shape (id, intent, useWhen, avoid, sourceModules → the components section
      + `styles/components.css`, valueRefs incl. `color.destructive.base` for fail and the
      accent/quiet roles for pass/warn, `reducedMotion`, notes). The `reducedMotion`/`notes`
      MUST state that the mark is the inert rest frame of a lifecycle state and the
      compliant fallback when the animated states cannot be mounted.
      (spec: *Status-mark recipe is registered and complete*).
- [x] 1.2 Add `component.tabs.segmented` to `design-system/recipes/component.recipes.json`
      with the full recipe shape; `notes` states the pick-one selected-state contract
      (selected cell inverts the unselected treatment) and that the switch is immediate.
      (spec: *Segmented-control recipe is registered and complete*).
- [x] 1.3 Recompile `design-system/recipes/index.json` via the build so both recipes appear
      in the compiled index. Named check: recipe-index compilation includes both IDs.

## 2. Language prose

- [x] 2.1 Add the status mark to `design-system/language/states.md`, stating explicitly
      that it is the inert rest frame of a lifecycle state and the compliant static fallback
      (pass = ripe-at-rest, fail = destructive confined to a rule, warn = quiet), no green
      tick. (spec: *The mark's relationship to the lifecycle states is documented*).
- [x] 2.2 Add the segmented control to `design-system/language/components.md` as a reusable
      pick-one mode selector — selected cell inverts the unselected treatment, immediate
      switch — distinct from the theme-switch affordance.
      (spec: *The selected-state contract is documented*).

## 3. Zoo worked examples + class-rooted CSS

- [x] 3.1 Add the status mark and segmented control to
      `design-system/source/zoo/sections/components.mjs`, and append their two new IDs to
      that module's `implementsRecipes`. Named check: showcase-module `implementsRecipes`
      declaration covers `state.mark.static` and `component.tabs.segmented`.
      (spec: *Both primitives are shown token-styled*).
- [x] 3.2 Add class-rooted styles to `design-system/source/zoo/styles/components.css`: a
      status-mark class trio whose fail treatment reads `var(--color-destructive-base)`
      confined to the rule (not the accent, no glyph), and a `.seg` segmented control that
      generalises `.th-tab`'s joined-cells + heavy-bottom-edge shape with selected = solid
      ink + paper text, unselected = paper + ink text. Introduce no `@keyframes` and no
      transitions. Named check: `styles/components.css` contains no `@keyframes` and no
      `transition` on the new classes; fail class references the destructive role.
      (spec: *The fail mark uses the destructive role, not the accent*; *The segmented
      switch is immediate*).
- [x] 3.3 Confirm no green-check / checkbox glyph is used in the status-mark markup or CSS
      (dots / rules only, per the pill convention). Named check: the mark markup contains no
      check/tick/checkbox glyph. (spec: *Status is not a green tick or checkbox*).

## 4. Verification gates

- [x] 4.1 `npm run validate` passes: cross-layer reference validation resolves both
      recipes' `sourceModules`/`valueRefs`, and the showcase-module recipe-declaration check
      passes for the two new IDs (propagation-validation gates).
- [x] 4.2 `npm run build` succeeds and rebuilds the zoo; confirm the components section
      renders the status mark (pass/fail/warn) and the segmented control from the live built
      tokens, with the fail mark on the destructive role and the selected segment inverted.
      (spec: *Both primitives are shown token-styled*; *The fail mark uses the destructive
      role, not the accent*).
- [x] 4.3 `openspec validate add-status-mark-and-segmented-control --strict` passes.
