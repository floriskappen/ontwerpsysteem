## Context

Post-`add-scoped-css-distribution`, the effect layers (`states.css`, `atmosphere.css`, `material.css`, `weather.css`) ship as a scoped `effects` bundle generated from the zoo style sources, with all keyframes namespaced `ontwerp-*`. But the one `@media (prefers-reduced-motion: reduce)` block lives in `styles/responsive.css` — a zoo layout stylesheet the build does not ship as an effect bundle. So the accessible fallback never reaches a consumer that imports the effects, and it does not cover the per-glyph header weather at all. Consumers re-author it by hand per keyframe (S21, S26). Nothing in the machinery detects an animated keyframe that lacks a rest pose.

## Goals / Non-Goals

**Goals:**
- The reduced-motion rest frame for every animated state/effect travels in the same shipped layer as the animation.
- A validation gate fails the build on any shipped `@keyframes` without a reduced-motion rest pose — including keyframes a later change adds.
- The motion language states the rest-pose rule as a requirement, not polish.
- Zero visual change for viewers without a reduced-motion preference.

**Non-Goals:**
- No new animated states or effects (that is C8); this change only completes reduced-motion for what exists and installs the gate that will hold C8 to the same bar.
- No change to keyframe names, the scoped-bundle mechanism, or the build's output set — those are C1, already archived.
- The specific rest-pose values are content authored in the style sources, not specced here.

## Decisions

**Co-locate rest frames with their animation, not in a shared reduced-motion stylesheet.** The rest frame for `ontwerp-germinate` lives beside `ontwerp-germinate` in `states.css`; the weather rest frames in `weather.css`; and so on. Alternative — keep one central `@media` block (as `responsive.css` did today) — was rejected because the build ships per-layer effect sources, and a central block either fails to ship or forces the build to special-case a zoo-only file. Co-location makes "the fallback ships with the animation" a structural fact rather than a build rule, and makes an omission visible in the same file during review.

**Enforce coverage in `propagation-validation`, keyed to the shipped CSS.** The gate parses the shipped bundle, collects every `@keyframes` name and the selectors that reference it, and requires a `prefers-reduced-motion` rule that both stops the animation and declares a rest pose (or hides the element). Keying it to the *shipped* output — not the zoo source tree — is the crux: it is exactly the gap that let the rest frames sit un-shipped in `responsive.css`. This mirrors the existing cross-layer reference and font-coverage gates already in this capability.

**Rest pose = stopped animation + explicit pose, not a frozen frame.** A paused mid-cycle frame reads as broken (a half-grown seed head, a drop stuck mid-fall). The rule and the gate both demand an asserted static value (or `display: none` for particle fields, which read as broken when frozen). This matches what the existing `responsive.css` block already does for the states it covered and generalises it.

**Motion language as a documentation requirement, not a prose-matched gate.** Following the `type.md` scope-safe-font precedent in `design-language`, the rule is a normative documentation requirement; its teeth are the keyframe-coverage gate, not brittle text matching of the prose.

## Risks / Trade-offs

- [A consumer's own keyframes get swept up if the gate scans a merged stylesheet] → The gate scopes to the system's shipped bundle, identified by build output path, not to arbitrary consumer CSS.
- [Co-location scatters reduced-motion rules across four files, so there is no single place to audit] → The gate is the audit; it enumerates every keyframe and its coverage, so scattering costs nothing reviewers rely on.
- [A keyframe that animates a custom property (e.g. `--bo` grid breathing) has a less obvious "rest pose"] → The rule accepts stopping the animation plus a declared static value for the driven property; for ambient fields, hiding the field is an accepted pose.

## Migration Plan

Additive for consumers — importing an effect layer now yields an accessible default that previously had to be hand-authored; no public names change, so no semver break beyond the release that carries it. The zoo output is unchanged for viewers without a reduced-motion preference. Downstream, de-ontwerper deletes its hand-authored reduced-motion block on pin advance.
