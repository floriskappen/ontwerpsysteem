# Design — add-staggered-reveal-surfaces

## Where the boundary sits

The existing rule reads "interactions are immediate ... no CSS transition and no easing
curve anywhere in the interaction path." Taken loosely, that forbids a menu from
animating open; taken literally, it governs the *interaction path* — the state change
applied to an element already on the page.

The boundary this change draws: **an element that is already rendered changes state in
the frame it happens** (hover, press, selection, focus — untouched, still hard cuts).
**An element that was not previously rendered arrives on the stepped clock**, its
container growing from zero to its intrinsic block size. Pressing the invoker is still
instant: the surface is present in that frame and takes its first stepped frame
immediately. Its contents do not stagger, fade, or translate; they are simply revealed by
the growing paper boundary.

That framing keeps the reveal inside the *periodic* half of the contract, which was
already stepped — the reveal is a periodic-clock animation that runs once rather than
looping. It needs no new category and no gate change.

**Alternative considered:** a new `transition` allowance scoped to overlays only. Rejected
— it would put a smooth easing curve into the system for the first time, split the motion
contract into two clocks, and require relaxing `motion-contract.mjs`. The stepped route
reuses the system clock and passes every gate unchanged.

## Why no JavaScript

The zoo ships zero `<script>` tags today, and the built page is a single self-contained
HTML file. Rather than break that, the four surfaces use native platform state:

| surface | mechanism | why |
|---|---|---|
| disclosure | `<details>` / `<summary>` | native open state, no script |
| dropdown menu | `popover` + `popovertarget` | native light-dismiss, focus handling, top layer |
| popover note | `popover` + `popovertarget` | same, non-modal |
| dialog sheet | `<div class="…" popover>` | modal-ish sheet without `showModal()` |

**Alternative considered:** `<dialog>` with `showModal()`. Rejected — it needs a script,
which would make the zoo the first page in the system to ship one and would put the
worked example out of reach of a consumer copying markup.

A consequence worth stating: the sheet is a `popover`, not a true modal `<dialog>`, so it
does not trap focus or render an inert backdrop. The recipe says so, and points a
consumer needing a real modal at `<dialog>` + the same reveal classes.

## Why animation, not transition, for a `popover`

The usual CSS route for animating a popover open is `@starting-style` plus a
`transition` on `display`/`overlay` — which the contract bans outright. An `animation`
on the `:popover-open` state needs neither: the element goes from `display: none` to
rendered, and a non-looping `steps()` animation runs on that. Same for `[open]` on
`<details>`. So the ban costs nothing here; it just picks the other mechanism.

## Why no new token

Reveal timing lives in `styles/surfaces.css`, not in the token set. The surface uses two
steps over 250ms: shorter than the previous three-step 375ms member reveal, while still
landing exactly on the system's 8fps clock.

This matters beyond consistency. `motion-contract.mjs` gate 1 rejects any
interaction-named duration token (`/hover|press|active|focus|release|transition/`) and
any `easing` group. A `duration.reveal-step` token would pass that regex today, but it
would make the token set the place a consumer looks for interaction timing — which is
exactly the affordance the value layer is documented as deliberately withholding. Keeping
reveal timing in the style module preserves that.

**Alternative considered:** a `motion.duration.reveal-step` semantic token. Rejected for
the above; revisit only if a second consumer-facing surface needs the same increment.

## Selector discipline

`scopeCss` fails the build on any selector not rooted in a class, so every rule is
written class-first with the state as a suffix — `.od-fold[open]`, `.od-menu:popover-open`,
`.od-sheet[popover]` — never a bare `details`, `dialog`, or `[popover]`. Keyframe names
carry the `ontwerp-` prefix, matching every other keyframe in the system, because
`scopeCss` passes `@keyframes` through document-global and unprefixed names would collide
in a consumer's page.

## Opaque paper grounds

Cards and popover notes are physical sheets, not colour washes. They use
`color.surface.warm`, an opaque paper role, rather than `color.surface.claim`, whose alpha
is appropriate for selection blooms but lets the page atmosphere show through.

## Reduced motion

The shared height keyframe has co-located rest poses in `styles/surfaces.css` per the
rest-pose rule and enforced by the keyframe-coverage gate. Each pose is the surface fully
arrived — `block-size: auto`, `animation: none`. A reveal has a
natural finished frame, so none of these needs the "remove the field instead" escape that
the ambient weather fields use.
