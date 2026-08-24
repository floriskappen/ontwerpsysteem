# Proposal: add-status-mark-and-segmented-control

## Why

Two common chrome primitives have no shipped recipe, class, or worked example, so every
consumer invents a divergent one (struggles S14, S15): a static pass/fail/warn **status
mark** — the compliant fallback for consumers who cannot mount the animated lifecycle
states — and a **tab / segmented control** for mode selection. The design system forbids
green-check status glyphs but ships no static primitive to reach for instead, and its only
segmented affordance (`.th-tab`) is a bespoke theme switcher, not a reusable control.

## What Changes

This change touches the **design-language machinery** (recipes + language prose) and the
**showcase machinery** (the zoo's worked examples). It is purely additive — no recipe,
class, token, or keyframe is renamed or removed.

- **New recipe `state.mark.static`** in `state.recipes.json`: the static, non-animated
  pass/fail/warn primitive, registered with the full recipe shape (stable ID, intent,
  usage, source modules, value refs, `reducedMotion`). Its recipe declares its relationship
  to the animated lifecycle states — a status mark is the *inert rest frame* of a lifecycle
  state — so a consumer who cannot mount the animated states has a documented, compliant
  fallback.
- **New recipe `component.tabs.segmented`** in `component.recipes.json`: square hairline
  cells sharing an ink rule, selected = solid ink + paper text, unselected = paper + ink
  text, instant switch. Settles the selected-state contract S15 had to invent.
- **Language docs** — `states.md` gains the status mark (as the lifecycle rest frame);
  `components.md` gains the segmented control.
- **Zoo worked examples** — the components section renders the segmented control and the
  status mark, styled through tokens: the fail mark draws from the `color.destructive`
  role (not the accent), neither primitive uses a green-check or checkbox glyph, and the
  switch is instant. No `@keyframes` is introduced (both treatments are transition-free),
  keeping the primitives compliant with the anti-goals and with a future reduced-motion
  keyframe gate.
- **Content, not specced:** the exact swatch colours, sizes, and glyph-free mark shape are
  authored under the contract, per this repo's OpenSpec scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `design-language`: the design language gains two registered chrome-primitive recipes
  (static status mark, segmented control) and documents them in the language prose; the
  status-mark recipe declares its inert-rest-frame relationship to the lifecycle states.
- `showcase`: the zoo renders both primitives as token-styled worked examples that honour
  the anti-goals (no green tick / checkbox glyph; fail mark on the destructive role; instant
  switch).

## Impact

- `design-system/recipes/state.recipes.json`, `component.recipes.json`, and the compiled
  `recipes/index.json` (additive recipe entries).
- `design-system/language/states.md`, `components.md` (additive prose).
- `design-system/source/zoo/sections/components.mjs` + `styles/components.css` (the worked
  examples and their class-rooted styles, which flow into the scoped component CSS bundle
  via the existing scope-aware build). `implementsRecipes` gains the two new IDs.
- Depends on the `color.destructive` role from `complete-the-colour-role-contract`.
  Consumers: purely additive; a consumer reaching for pass/fail or a mode-switcher finds a
  shipped recipe + class instead of inventing one. No migration required.
