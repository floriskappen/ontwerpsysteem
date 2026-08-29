# Decisions — add-staggered-reveal-surfaces

## Widening the motion-contract scope guard

`test/motion-scope.test.mjs` freezes an inventory inherited from the
`motion-contract-consistency` correction, and its header says to widen a list only when
"a reviewed change genuinely means to grow the system", recording why here.

**Widened:** `FROZEN.zooStyleModules` gains `surfaces.css`.

**Why:** that guard exists to stop *contract-correction* work from quietly growing the
system. This change is not a correction — it is a reviewed, additive change whose whole
purpose is four new components, and a new component family needs its own style module
under the repo's "modularity is king" rule (`AGENTS.md`). Folding the reveal surfaces into
`components.css` to dodge the guard would trade a real architectural boundary for a green
test.

**Not widened:** `effectModules`, `devDependencies`, `skinIds`, and
`FROZEN_COMPONENT_CLASSES` are all untouched. The reveal surfaces add no effect module (no
generator, no particles), no dependency, no skin, and no class to `components.css` — the
guard still holds everywhere it was pointed.

## One shared height keyframe

The four surfaces share one block-size keyframe. Near-identical per-surface keyframes
would multiply reduced-motion poses for no expressive gain, while the shared keyframe
makes "paper grows around fixed content" one fact in the stylesheet.

## Top-layer popovers use progressive anchor positioning

The menu and note are popovers, so the browser paints them in the top layer. That means
their `.od-anchor` DOM wrappers are not reliable containing blocks for ordinary absolute
positioning: `top: 100%; left: 0` placed both surfaces at the viewport's left edge during
browser verification.

Each invoker therefore exposes a distinct `anchor-name`, and an `@supports` block places
its popover with `position-anchor` plus `anchor()` edges. Keeping the placement override
inside feature detection is important: a browser without CSS anchor positioning retains
the platform's usable centred popover fallback instead of receiving half of a positioning
scheme and stranding the surface at the viewport origin.

## surfaces.css ships in the component bundle, not the effects bundle

`SHIPPED_COMPONENT_SOURCES` gains it rather than `SHIPPED_EFFECTS_SOURCES`. The split in
`build-core.mjs` is components-vs-ambient-effects, and these are components that happen to
animate — a consumer importing the component bundle must receive the reveal motion with
the components it belongs to, exactly as the focus ring ships with `.btn`.

A consequence: the effects bundle stays free of reveal keyframes, so a consumer taking
effects alone gets no orphaned animation.

## The readiness evidence numbers move

`docs/releases/v1.0.0-readiness.md` records live gate counts and
`test/readiness-evidence.test.mjs` asserts they match the current command output. Adding an
active change and new tests moves both counts, so the doc is updated in step. The v1.0.0
verdict and its dated evidence rows are untouched — only the two live counts the test pins.
