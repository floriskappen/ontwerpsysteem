## Context

The showcase machinery (manifest output, generation under `dist/`, the gate) was built in `add-showcase` and works. What was wrong was the *presentation*: an exhaustive, tier-grouped token gallery plus a seven-state matrix, in generic chrome that rendered dark on a dark-mode OS. This change keeps the machinery and re-conceives the page. The implementation already exists (`scripts/lib/showcase-core.mjs`); these artifacts reconcile the spec with it.

## Goals / Non-Goals

**Goals**
- The zoo looks like an artifact of *this* system — warm cream paper, ink, one red accent, lowercased Archivo, square corners, the rooster axis and a margin rule.
- Curated, designed sections (palette · type specimen · components in use), not a token dump.
- Driven by the built tokens, so it reskins when tokens change; readable offline in its real fonts.

**Non-Goals**
- Not a fabricated product/marketing page — it's the system shown well, not invented screens.
- Not an exhaustive token reference — that's the manifest + CSS.
- No theming/mode switching yet.

## Decisions

### The zoo wears the system's own tokens
The page is styled almost entirely through the built CSS custom properties (`var(--color-…)`, `var(--typography-…)`, `var(--space-…)`), with literals reserved for layout and atmosphere. This makes "renders from built tokens" true at the chrome level too: change a token, rebuild, and the whole page reskins. It also dogfoods the semantic/component surface.

### Curated sections, full record in the build outputs
The page shows a curated colour palette (solid primitives only, deduped — the rgba rule/bloom variants stay off the wall), a type specimen in real lowercased Archivo, and a handful of components in use. The exhaustive, machine-readable inventory lives in `dist/manifest/tokens.json` and `dist/css/tokens.css`. Tiers and per-token listings are deliberately not surfaced — they confused more than they explained.

### Real interaction, not a state matrix
Components use real `:hover` / `:focus(-within)` (buttons invert paper↔ink; fields go red on focus) plus an explicit `:focus-visible` outline. A fixed grid of every state was technical noise.

### Self-hosted fonts, embedded
Archivo and JetBrains Mono (latin woff2, OFL) are committed under `assets/fonts/` and base64-inlined into the page at build time. This renders the real typefaces while keeping the page a single self-contained file with no network requests (the prior "no external refs" guarantee is preserved). The source bundle shipped no font files, so self-hosting is a deliberate addition.

### Atmosphere as identity, behind reduced-motion
Multiplied SVG grain and three slow drifting bloom blobs give the "sun through a window" feel from the brief. They are decorative and pause under `prefers-reduced-motion`.

### Display type bleeds, on purpose
The 168px display token is a full-bleed, clipped masthead band rather than a grid cell it overflows — turning the earlier overflow bug into the intended editorial treatment.
