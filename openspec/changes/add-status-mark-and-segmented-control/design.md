# Design — add-status-mark-and-segmented-control

## Context

The component vocabulary ships button, field, card, and pill/badge; the state vocabulary
ships the animated organic lifecycle (fallow / germinating / ripe / rising). Two chrome
primitives fall between them and are shipped by neither, so consumers invent them (S14,
S15): a *static* pass/fail/warn mark, and a segmented mode-selector. The only pass/fail
answer today is the animated lifecycle — overkill for a presentation-only reskin — and the
only segmented affordance is `.th-tab`, a bespoke theme switcher wired to `:has()` skin
rules, not a reusable control. The `color.destructive` role
(`complete-the-colour-role-contract`) now exists for the fail case, so the fail mark no
longer has to borrow the accent.

## Goals / Non-Goals

**Goals:** ship both primitives the repo's way — a registered recipe, language prose, a
zoo worked example, and class-rooted CSS that flows into the scoped bundle — so a consumer
finds a shipped answer instead of inventing one. Define the status mark's relationship to
the lifecycle states explicitly.

**Non-Goals:** the reduced-motion gate, skins, and effects modules (sibling Wave 2 changes
C5/C6/C7); the scoped-bundle build itself (C1). This change does not decide the exact
swatch colours, sizes, or glyph-free shapes — those are content authored under the
contract. It adds no dark story.

## Decisions

1. **The status mark is the inert rest frame of a lifecycle state, not a new metaphor.**
   Rather than introduce a parallel status language (which would risk the green-tick idiom
   the anti-goals reject), the mark is *defined as* a lifecycle state frozen at its resting
   pose: pass = ripe-at-rest, fail = the destructive pigment confined to a rule, warn =
   quiet. This keeps one status metaphor across the system and gives consumers who cannot
   mount the animated states a compliant static fallback that reads as the same language.
   The relationship is declared in the recipe (via `notes`/`reducedMotion`) and in
   `states.md`, so it is discoverable, not implicit. Alternative — a standalone badge
   variant in `components.md` — was rejected: it would divorce the mark from the states it
   is meant to be the still frame of, reopening the "is this a checkbox?" question.

2. **`state.mark.static` lives in `state.recipes.json`; `component.tabs.segmented` in
   `component.recipes.json`.** The mark is a state rendered inert, so it belongs with the
   states; the segmented control is a chrome control, so it belongs with the components.
   Filing by nature (not by "both are new") keeps the recipe collections coherent and lets
   `states.md` / `components.md` each document their own.

3. **Fail draws from `color.destructive`, never the accent.** Honours the C3 contract
   ("destructive is not the accent") and S14's rule that red stays confined to a rule.
   This is the one role-assignment worth locking in the spec, because a fail mark that
   floods or reuses the accent breaks both the palette contract and the anti-goals.

4. **Both primitives are transition-free — no `@keyframes`.** Instant switch matches the
   motion language ("all state shifts are immediate") and the anti-goals ("no smooth
   transitions"), and sidesteps C7's forthcoming reduced-motion keyframe gate entirely: a
   primitive with no animation needs no rest frame. If a later revision adds motion, it
   ships its reduced-motion rest with it.

5. **Generalise `.th-tab`'s proven shape, don't reuse it.** The segmented control adopts
   `.th-tab`'s joined-cells + shared heavy bottom-edge treatment but as a general `.seg`
   class decoupled from the theme-switch `:has()` machinery, so `.th-tab` stays the
   page-chrome theme switcher and consumers get a clean pick-one control.

## Risks / Trade-offs

- [The spec names specific primitives, which can read as speccing content] → the spec locks
  only the *machinery* guarantees (the recipes exist and are documented; the zoo renders
  them; fail uses the destructive role; no green-tick/checkbox glyph; instant switch),
  mirroring how the showcase spec already names buttons/fields/card and commits to square
  corners. Exact colours and sizes stay out of the spec, in the token-driven content.
- [Two status idioms could drift — the animated ripe vs. the static pass mark] → binding
  the mark to the lifecycle rest frame (Decision 1) makes them one idiom by definition, and
  the cross-layer validation keeps the recipe's source refs honest.
