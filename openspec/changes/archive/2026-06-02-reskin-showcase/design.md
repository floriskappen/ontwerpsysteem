## Context

Second visual pass on the zoo. The goal is to make it read as a genuine artifact of the
system — not a debug page, not a sheet borrowed from the reference — and to demonstrate
the constitution's headline principle (theme by swapping). The change is showcase
apparatus only; no token values change.

## Decisions

### Theming demo is showcase-only and illustrative, not real `$extends` token themes

The reskin is demonstrated with scoped CSS-variable overrides on a demo panel, using the
system's own colour-role variable names — not by authoring per-theme token sets and
emitting `[data-theme]` build output. Rationale: the palettes are still being explored,
and real multi-theme build output is a larger `build-pipeline` change that belongs with
the deferred token-model pass. Trade-off: the skins are not shipped tokens, so the spec
marks them illustrative and the "renders only from built outputs" requirement is relaxed
to permit clearly-demonstrative content. Promoting the chosen palettes to real `$extends`
themes is a follow-up.

### CSS-only theme switcher (radio + `:checked`), no JavaScript

Tabs are radio inputs whose `:checked` state drives the panel's overridden variables via
sibling selectors. Keeps the page self-contained and script-free, matching the current
zero-JS page and the "viewable offline, no network" requirement. The demo buttons inside
the panel reference colour-role variables directly (not the resolved `--button-*` tokens,
which the build emits as literals) so they actually reskin.

### Handwritten voice via a third self-hosted face (Caveat, OFL), furniture only

Caveat is used only for the zoo's editorial furniture — section figures and annotation
marks — never for the content type scale, which stays Archivo + JetBrains Mono (the
system's real type). The handwritten face is the zoo's annotation voice, not a system
font token. Trade-off: a third embedded font (~50 KB) grows the page; acceptable for a
single self-contained artifact.

### Stepped easing ships as a literal, not a token

The DTCG 2025.10 `$type` enum has only `cubicBezier`; a `steps()` / non-bezier timing
function has no conformant representation. Modeling it is a token-model decision and is
deferred with the other token-model flags. The stepped feel ships as a showcase CSS
literal now (the page already uses literals for atmosphere), so the look lands without
breaking token conformance.

### Grid ambience reuses existing duration primitives; deterministic, no client JS

The pulsing grid uses the existing `breathe-min/max` duration tokens (via their built CSS
vars) for its loop range. Per-cell pulse range, duration and phase are computed at
generate time from the cell index (no randomness) so output stays deterministic, and the
animation is suppressed under `prefers-reduced-motion`.

### Removed motifs are implementation, not a spec change

The margin rule, a–l axis and bottom art folio were never required by the spec; removing
them is an aesthetic decision under "rendered in the system's own aesthetic". Only the
theming demo introduces genuinely new behaviour that the spec must account for.
