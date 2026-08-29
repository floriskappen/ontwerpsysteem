# Proposal: add-staggered-reveal-surfaces

## Why

The system ships two components — `component.button.ink-press` and
`component.tabs.segmented` — and both are press-instant by nature. There is no menu,
popover, dialog, or disclosure anywhere in the recipes, the language prose, or the zoo.
So a consumer building any surface that *arrives* rather than *toggles in place* has no
recipe to reach for and invents one, and the system reads as though it forbids all
motion on interaction — which it does not.

What the motion contract actually bans is narrow: a `transition` declaration, and a
smooth easing literal (`ease`, `linear`, `cubic-bezier`) in a timing position
(`scripts/lib/motion-contract.mjs`). A one-shot `steps()` animation is already legal.
The gap is that no *component* uses the stepped clock for the height of an arriving
surface.

## What Changes

This change touches the **design-language machinery** (recipes + language prose) and the
**showcase machinery** (the zoo's worked examples). It is additive: no recipe, class,
token, or keyframe is renamed or removed, and the immediate-interaction rule is not
relaxed.

- **New recipe `motion.reveal.stepped-height`** in `motion.recipes.json`: a one-shot
  block-size reveal on the system's stepped clock. It states the
  boundary the language needs — a *state change* on an element already on the page stays
  immediate (hover, press, selection), while a *surface that was not previously rendered*
  grows to its intrinsic height in stepped frames. Its contents carry no stagger, delay,
  opacity animation, or transform. Reveal is periodic-clock motion
  that happens to run once, not an interaction transition.
- **Four new component recipes** for the surfaces that reveal:
  `component.menu.dropdown`, `component.popover.note`, `component.dialog.sheet`,
  `component.disclosure.fold`. Each carries the full recipe shape and names
  `motion.reveal.stepped-height` as the motion it composes.
- **Language docs** — `motion.md` gains the staggered-reveal rule as a fourth guideline,
  stated so it cannot be misread as licence for interaction transitions;
  `components.md` gains the four surfaces.
- **Zoo worked examples** — a new "surfaces" subsection under section 3 renders all four,
  built from tokens, with **no JavaScript** (the zoo ships none): the disclosure on
  `<details>/<summary>`, the menu, note, and sheet on the native `popover` attribute with
  `popovertarget` invokers. Every selector stays class-rooted, because `scopeCss`
  (`scripts/lib/build-core.mjs`) fails the build on anything else.
- **Opaque paper** — cards and popover notes use the opaque warm-paper role, never a
  translucent claim wash that lets ambience or neighbouring content show through.
- **Reduced motion** — the reveal keyframe ships its rest pose in the same module: the
  surface at its intrinsic height, animation stopped, nothing mid-arrival. The keyframe-coverage
  gate enforces this.
- **Content, not specced:** the exact duration, glyph-free chevron shape, and panel
  dimensions are authored under the contract, per this repo's OpenSpec scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `design-language`: the language gains a registered stepped-height reveal motion recipe that
  draws the boundary between an immediate state change and a stepped surface arrival,
  four registered reveal-surface component recipes that compose it, and matching prose.
- `showcase`: the zoo renders all four reveal surfaces as token-styled, script-free worked
  examples whose container heights grow on the stepped clock and whose reduced-motion
  rest poses hold them fully present.

## Impact

- `design-system/recipes/motion.recipes.json`, `component.recipes.json`, and the compiled
  `recipes/index.json` (additive entries).
- `design-system/language/motion.md`, `components.md` (additive prose).
- `design-system/source/zoo/sections/surfaces.mjs` (new) + `styles/surfaces.css` (new),
  registered in `source/zoo/index.mjs`'s style bundle and section order.
- No motion token is added: reveal timing is authored in the style module. The motion token set
  keeps carrying periodic loop lengths only, so the motion-contract gate's token rule is
  untouched.
- Consumers: purely additive. A consumer building a menu, popover, dialog, or disclosure
  finds a shipped recipe and class instead of inventing one. No migration required.
