# Motion

Motion guidelines:
1. **Low-FPS Stepped Clock**: Animations progress in discrete, flip-book steps (configured system-wide at 8fps) rather than smooth digital floats.
2. **Instant Interactions**: A state change on an element already on the page (hover, active press, selection, focus) is immediate and hard-cut (no transitions) to emphasize mechanical contact.
3. **Stepped-height Reveal**: A surface that was not rendered a frame ago — a menu, a popover, a sheet, a fold's body — grows from zero to its intrinsic height on the stepped clock. Its content does not stagger, fade, or translate. The press that opens it is still instant.
4. **Reduced Motion**: All ambient particle fields and grid cycles are completely frozen or hidden on `prefers-reduced-motion: reduce`.

## The immediate-interaction, stepped-arrival rule

A state change on an element that is already rendered is immediate: a hover, press, or selection applies in the frame it happens, with no CSS transition and no easing curve anywhere in the interaction path. Periodic motion — ambient atmosphere cycles, weather fields, grown lifecycle states — runs on the stepped clock: its timing is quantised with `steps()` at the system rate, never continuously eased. Smooth easing affordances (`ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear` timing, and any `cubic-bezier()` curve) are out of system for every animation in it.

The dividing line is whether the element was on the page a frame ago, not whether a person caused the motion. A button that drops on press was already there, so it hard-cuts. A menu that opens was not, so its paper boundary may grow into place.

## The stepped-height reveal rule

A surface that has just become present — a dropdown menu, a popover note, a dialog sheet, the body of a disclosure fold — does not blink into existence whole. Its own block size grows from zero to its intrinsic height on the stepped clock. The content is not a procession: rows, lines, and actions carry no per-member delay, opacity animation, or transform. They remain fixed and are exposed by the advancing paper boundary. Reveal is periodic motion that happens to run a single time; it is not a second, smoother clock.

This is not licence for an interaction to glide. The invoking press is untouched and instant — the surface is present in the frame the button goes down and takes its first stepped height there. A reveal authored with a `transition`, with an easing curve, or by marching content downward item by item is out of system exactly as an eased hover would be; the mechanism is a short one-shot `steps()` block-size animation.

Reveal timing is authored in the style module beside the animation, not in the value layer — matching how the lifecycle states and the weather fields carry theirs. It is deliberately terse: two stepped frames over 250ms, one system-clock tick per frame. The value layer holds this contract too: there is no transition duration and no easing curve among the canonical motion values — nothing for a consumer to apply as a smooth transition or a hover fade, because an interaction that needed one would contradict the language. Periodic loop lengths (`duration.breathe-*`, `duration.drift-*`) are the only durations the motion tokens carry, so the tokens never become the place a consumer looks for interaction timing.

## The reduced-motion rest-pose rule

Every animated state or effect requires a deliberate reduced-motion rest pose: when `prefers-reduced-motion: reduce` is requested, the animation stops and the surface settles into a settled, legible frame the viewer can read as finished — a stopped animation together with an explicitly declared rest frame for each property the keyframe drives. A rest pose is never a frozen mid-cycle frame: a half-grown seed head or a drop stuck mid-fall reads as broken, so an ambient field that cannot settle legibly is removed from the layout instead.

An animated state or effect shipped without a deliberate rest pose is incomplete, not optional polish. Rest poses are authored in the same style source module as the animation they neutralise, so the accessible fallback ships wherever the animation ships; the keyframe-coverage validation gate fails the build while any shipped `@keyframes` lacks one.
