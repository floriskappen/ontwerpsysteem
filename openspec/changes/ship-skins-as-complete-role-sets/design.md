## Context

C3 declared every semantic colour token `supply` or `derive` and registered 19 derivation
rules in `colour.derivations.json`, but nothing consumes that contract. Demo skins override
~9 roles; the derived roles bottom out in cream/oxblood primitives, so a skin swap strands
the greys, disabled tier, and destructive on the base palette (S10). C2 keeps component→
semantic aliases live in the built CSS, but semantic→primitive links are *not* live for
derived roles — overriding the four supply roles does not re-derive borders/greys at runtime.
A complete skin must therefore carry computed values for the derived roles too.

## Goals / Non-Goals

**Goals:**
- One canonical skin source (supply set per skin) as the single source of truth.
- Build expands each skin through the registry into a complete role set, emitted as
  importable CSS in the dedupe-safe `data-skin` slot.
- Every demo skin supplies its own destructive pigment; the zoo reskins the full role set.
- A gate proves no skin strands a colour token.

**Non-Goals:**
- No new colour roles, derivation rules, or provenance grammar (that is C3, already landed).
- No effects, reduced-motion, or new-component work (sibling Wave 2 changes own those).
- No dark skins (light-only by design, C9).

## Decisions

- **Skins carry computed literals for derived roles, not var() chains.** The derived
  semantic tokens alias cream/oxblood *primitives*, so a runtime cascade from the four
  supply roles is impossible without re-linking every role to a function of the core —
  which the DTCG format cannot express (no arithmetic). Alternative (rewire every derived
  semantic token to reference a supply role) was rejected: mix/alpha are computations, not
  aliases. So the build evaluates the registry offline and emits explicit values. Component
  tokens still follow their live C2 aliases to the semantic roles the skin sets.

- **Supply set = provenance, read from the token source.** The canonical skin source lists
  only the roles whose token provenance is `supply` (paper, ink, accent, destructive). The
  build derives the rest, so a skin author writes four colours and the machinery guarantees
  completeness. Alternative (skins list all ~24 roles by hand) reintroduces exactly the
  hand-derivation S10 fought.

- **Derivation compute engine mirrors the registry's three formula kinds.** `mix` (sRGB
  interpolate by ratio, optional alpha), `alpha` (set opacity), `identity`. The registry is
  the spec; the engine is its executable twin. Kept in `build-core.mjs` beside the existing
  transforms.

- **Coverage gate lives in propagation-validation.** It is a cross-layer drift check (skins
  vs. the role contract), the same family as the recipe/module reference gates. It reads the
  token provenance and the registry, not a hard-coded role list, so new roles are covered
  automatically.

- **Zoo skin data is generated, theme bar consumes it.** `skins.mjs` becomes a build output
  from the canonical source; the theme bar emits the full role set, and its hand-set
  bloom/pollen vars drop out because the blooms are `var()` references to `surface-claim` /
  `accent-soft`, which the complete skin now sets.

## Risks / Trade-offs

- **sRGB mix drift vs. hand-tuned cream** → the reference cream sheet was hand-tuned within
  the recipes; a skin's computed greys may differ slightly from a designer's eye. Mitigation:
  the cream base keeps its authored primitives; only skins are machine-expanded, and the
  registry note already documents cream as the tuned exception.

- **Generated `skins.mjs` churns if the compute engine changes** → mitigated by determinism
  (same source + registry ⇒ byte-identical output) and the drift scenario in the build spec.

- **Bundler dropping a same-selector override (S11)** → avoided by the `data-skin` slot whose
  selector differs from the base token block; already specced in distribution (C1).

## Migration Plan

Additive: no token renamed or removed; `:root`/scoped token builds unchanged. Rose is the
first complete skin (already hand-derived in the consumer, now regenerated from its supply
core). Changelog marks the skin format as BREAKING for anyone who authored 9-var skins.
