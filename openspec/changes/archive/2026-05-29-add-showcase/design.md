## Context

The pipeline validates and builds tokens but the system is invisible. This change adds the showcase ("the zoo") that renders it, plus the structured manifest the showcase reads from. It is the feedback loop for the next phase (porting real token content): you will see ramps, scales, and UI in context as they land. Today only placeholder tokens exist, so the showcase starts sparse and fills in — early gaps are useful coverage signal, not defects.

## Goals / Non-Goals

**Goals**
- See every token rendered with a type-appropriate visual, grouped by tier — straight from the built outputs.
- See tokens applied in context on a small, fixed set of representative UI elements across their interaction states.
- Keep the showcase honest ("what you see is what ships"): it reads only build artifacts, never source tokens.
- Stay lean and vendor-neutral: no heavyweight app framework, ideally no new runtime dependency.

**Non-Goals**
- No real, shippable components — these are demo renders inside the zoo, not a component library (the system is "not a component framework"). Real component tokens come later.
- No theming/mode switching yet (single default mode); the layout can grow into it.
- No contrast/a11y auditing beyond reduced-motion and visible focus — richer accessibility checks belong to a later governance change, and need semantic color roles that don't exist yet.

## Decisions

### Static generation, not an app
The showcase is generated as static files under `dist/showcase/` by a build step, not served by a Vite/SPA framework. This makes the constitution's "renders from built tokens" literally a build target, adds no runtime framework, stays trivially reproducible and gitignored like every other output, and avoids a dev-server dependency in a repo that prizes minimal vendor lock-in. A framework is only warranted by rich interactivity — which is exactly the component work we are deferring.

### Self-contained output (data inlined)
The generator inlines the manifest data and token CSS into the produced HTML so the page opens directly from `dist/` over `file://` with no server and no `fetch`/module-loading restrictions. This is what makes "viewable without a server" true in practice.

### Manifest is the data source; galleries are data-driven
The showcase renders from the new JSON manifest, not the flat CSS/JS outputs (which drop `$type`, tier, and `$description`). Galleries iterate the manifest, so any token added later appears automatically with no showcase edit. The manifest is emitted as another Style Dictionary target rather than a separate resolution pass: SD already exposes each token's resolved value and derived name, its source `filePath` (from which tier is read), and its pre-resolution `original.$value` (from which the raw alias is read). Keeping it inside the build means one source of resolution and the same gate/determinism as every other output.

### States via CSS, variants for the rest
Interactive states (hover, active, focus-visible, disabled) are shown with native CSS pseudo-classes — no JS framework needed. Loading and error are shown as explicit static variant markup. This keeps the state matrix fully expressible in static HTML+CSS.

### Token-strict demo styling; gaps stay visible
Demo elements are styled only through `var(--token)` custom properties, with no literal colors/sizes in the showcase's own stylesheet — upholding "no magic numbers" and dogfooding the public semantic surface. A referenced token that doesn't exist yet leaves the property unset (no literal fallback), so the element visibly lacks that styling and the missing token is surfaced as a coverage gap.

### Minimal tooling
The generator is a plain Node script (template literals over the manifest), ideally with no new dependency. Animated samples honour `prefers-reduced-motion` via a CSS media query plus a manual replay control. If a templating/markup helper proves worth it, it will be a small, replaceable library — never a framework the system depends on.
