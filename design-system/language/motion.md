# Motion

Motion guidelines:
1. **Low-FPS Stepped Clock**: Animations progress in discrete, flip-book steps (configured system-wide at 8fps) rather than smooth digital floats.
2. **Instant Interactions**: Element interactions (hover, active press) are immediate and hard-cut (no transitions) to emphasize mechanical contact.
3. **Reduced Motion**: All ambient particle fields and grid cycles are completely frozen or hidden on `prefers-reduced-motion: reduce`.

## The reduced-motion rest-pose rule

Every animated state or effect requires a deliberate reduced-motion rest pose: when `prefers-reduced-motion: reduce` is requested, the animation stops and the surface settles into a settled, legible frame the viewer can read as finished — a stopped animation together with an explicitly declared rest frame for each property the keyframe drives. A rest pose is never a frozen mid-cycle frame: a half-grown seed head or a drop stuck mid-fall reads as broken, so an ambient field that cannot settle legibly is removed from the layout instead.

An animated state or effect shipped without a deliberate rest pose is incomplete, not optional polish. Rest poses are authored in the same style source module as the animation they neutralise, so the accessible fallback ships wherever the animation ships; the keyframe-coverage validation gate fails the build while any shipped `@keyframes` lacks one.
