## Why

The pipeline validates and builds tokens, but there is no way to *see* the system. The constitution requires a living showcase ("the zoo") that renders the system from the built tokens, so what you see is always what ships. Without it, porting real content (the next phase) is blind — you can't tell whether a token looks right, only whether it validates. A showcase makes the system visible and turns content authoring into a feedback loop.

## What Changes

- Add a **showcase site** that renders the design system from the *built* outputs only (never re-resolving source tokens), preserving "what you see is what ships":
  - **Token galleries** — every token auto-rendered from the built set, grouped by tier (primitive → semantic → component) and by `$type`, each with a fit-for-type visual (color → swatch, dimension → bar, typography/fontFamily/fontWeight → specimen, duration/cubicBezier/transition → replayable sample, shadow/border/gradient/strokeStyle → applied box, number → value). New tokens appear automatically; nothing is hand-listed.
  - **Component state-matrix scaffold** — the default/hover/active/focus/disabled/loading/error layout, rendered with placeholder stand-in components. No component tokens exist yet, so this is the empty frame that fills in when component content lands.
- Add a **structured token manifest** build output — JSON carrying each token's path, tier, `$type`, resolved value, raw alias, and `$description`. The existing flat CSS/JS/Tailwind outputs drop this metadata; the showcase needs it to group and label tokens. **Additive, non-breaking**: existing outputs and their public name mapping are unchanged.

## Capabilities

### New Capabilities

- `showcase`: the zoo — how the system is rendered from built outputs (token galleries by tier and `$type`, the component state-matrix scaffold), the rule that it reads only built artifacts, and how it is run.

### Modified Capabilities

- `build-pipeline`: add a structured token manifest as a new output target (path, tier, `$type`, resolved value, raw alias, `$description`). Additive only — no change to the CSS/JS/Tailwind outputs or the path→name contract.

## Impact

- New: a showcase app/site (a small render layer over `dist/`), plus a manifest emitter in the build.
- Modified: the Style Dictionary build gains one output target; `dist/` gains a manifest artifact (generated, gitignored, like all outputs).
- Adds a dev dependency for the showcase's render/serve tooling.
- Not a consumer-facing contract change: token names, meanings, and existing outputs are untouched. The manifest is a new, separately-versioned output, not a change to the existing public surface.
