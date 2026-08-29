# Tasks — add-staggered-reveal-surfaces

## 1. Recipes: register the reveal motion and the four surfaces

- [x] 1.1 Add the reveal-motion recipe to `design-system/recipes/motion.recipes.json`
      with the full recipe shape. `intent`/`notes` MUST state the boundary: an
      already-rendered element changes state immediately; the members of a
      newly-rendered surface arrive on the stepped clock. `avoid` MUST name
      transitions and smooth easing.
      (spec: *Reveal recipe is registered and complete*)
- [x] 1.2 Add `component.menu.dropdown`, `component.popover.note`,
      `component.dialog.sheet`, and `component.disclosure.fold` to
      `component.recipes.json` with the full recipe shape; each `notes` names
      the registered reveal motion as the motion it composes.
      (spec: *Each reveal-surface recipe is registered and complete*)
- [x] 1.3 `component.dialog.sheet` notes MUST state it is non-modal — no focus trap, no
      inert backdrop — and name `<dialog>` + `showModal()` as the route for a consumer
      needing a real modal.
      (spec: *The sheet's modality limits are documented*)
- [x] 1.4 Recompile `design-system/recipes/index.json` via the build. Named check: the
      compiled index contains all five new IDs.

## 2. Language prose

- [x] 2.1 Add the staggered-reveal rule to `design-system/language/motion.md` as a fourth
      guideline plus a prose section, restating rule 2 so "instant" reads as *state change
      on an already-rendered element* and cannot be misread as banning surface arrival —
      and so reveal cannot be misread as licence for an interaction transition.
      (spec: *The reveal boundary is documented*; *Reader finds the stepped-motion rule
      stated normatively*)
- [x] 2.2 Add the four surfaces to `design-system/language/components.md` as guidelines
      7–10, each naming its native mechanism and its reveal motion.
- [x] 2.3 Confirm no fenced code block in `language/*.md` introduces a transition or a
      smooth easing literal — the motion-contract gate scans fenced blocks only.
      (spec: *Smooth motion affordances are rejected by the documented contract*)

## 3. Zoo worked examples + class-rooted CSS

- [x] 3.1 Add `design-system/source/zoo/sections/surfaces.mjs` rendering all four
      surfaces, with `implementsRecipes` declaring the four component IDs. Disclosure on
      `<details>/<summary>`; menu, note, and sheet on `popover` + `popovertarget`. No
      `<script>`. Each staggered member carries its index as a custom property.
      (spec: *Each reveal surface is shown token-styled*; *The generated page carries no
      script*)
- [x] 3.2 Add `design-system/source/zoo/styles/surfaces.css`: `ontwerp-`-prefixed
      one-shot `steps()` reveal keyframes. Every
      selector class-rooted (`.od-fold[open]`, `.od-menu:popover-open`) — `scopeCss` fails
      the build otherwise. No `transition`, no `ease`/`linear`/`cubic-bezier`.
      (spec: *Members arrive stepped and staggered*)
- [x] 3.3 Author the four reduced-motion rest poses in the same module, each holding the
      surface fully arrived with `animation: none`.
      (spec: *Reduced motion holds every member arrived*)
- [x] 3.4 Register `surfaces.css` in the `pageStyles` bundle and `renderSurfaces()` in the
      section order in `design-system/source/zoo/index.mjs`.

## 4. Verification gates

- [x] 4.1 `npm run build` succeeds: `scopeCss` accepts every new selector and the scoped
      component bundle carries the reveal classes.
- [x] 4.2 `npm run validate` passes: cross-layer refs resolve for all five recipes, the
      showcase-module recipe declaration covers the four component IDs, the motion-contract
      gate passes over the new CSS and recipes, and keyframe coverage finds a rest pose for
      each of the four new keyframes.
      (spec: *Reveal recipe is registered and complete*; *Members arrive stepped and
      staggered*; *Reduced motion holds every member arrived*)
- [x] 4.3 `npm run test` passes — including `test/showcase.test.mjs:83`, which asserts the
      generated page contains no `transition:`.
- [x] 4.4 Add showcase tests: the generated page has zero `<script>` tags, renders all four
      surfaces, and each reveal keyframe has a matching reduced-motion rest pose.
      (spec: *The generated page carries no script*)
- [x] 4.5 Render the built zoo and screenshot each surface open, in both normal and
      `prefers-reduced-motion: reduce` modes, to confirm the stagger reads as a flip-book
      arrival and the rest poses are fully arrived.
- [x] 4.6 `openspec validate add-staggered-reveal-surfaces --strict` passes.

## 5. Refine opacity and reveal mechanics

- [x] 5.1 Replace the card and popover-note translucent claim grounds with the opaque
      warm-paper role across values, recipes, language, adapter mappings, and zoo styles.
- [x] 5.2 Rename the motion recipe to `motion.reveal.stepped-height` and update every
      component recipe and document that composes it.
- [x] 5.3 Remove member indices, delays, opacity animations, and transforms; animate the
      menu, note, sheet, and fold reveal containers from zero to intrinsic block size in
      two stepped frames over 250ms.
- [x] 5.4 Update structural and browser-facing tests for opaque grounds, height-only
      motion, and fully expanded reduced-motion rest poses.
- [x] 5.5 Rebuild, run validation and all tests, strictly validate OpenSpec, and visually
      inspect all four surfaces in normal and reduced-motion modes.
