# Constitution — ontwerpsysteem

A vendor-neutral, agent-readable design system. This document is the durable
layer: the principles and the contract that every change must respect, so that
many agents can evolve the system over time without it drifting. Specific values
(color ramps, type scales, the exact set of semantic roles) live in the OpenSpec
specs, not here — this is the "why" and the "rules of the game", not the data.

---

## 1. What this is

The source of truth is **design tokens** expressed in the **DTCG (Design Tokens
Community Group) Format Module 2025.10** — plain JSON in `.tokens.json` files. A
build step transforms those canonical tokens into whatever each platform needs
(CSS custom properties, JS/TS, etc.). A living **showcase** ("the zoo") renders
every token and every component state from the built tokens.

Three things make up the deliverable:

1. **Canonical tokens** — DTCG JSON, hand-authored, the single source of truth.
2. **Build pipeline** — transforms tokens → platform outputs. Outputs are
   generated artifacts; they are never hand-edited and never the thing a change
   edits.
3. **Showcase** — a living style guide that renders the system from the live,
   built tokens, so what you see is always what ships.

---

## 2. Principles

1. **Tokens are the source of truth.** Everything visual traces back to a token.
   Outputs (CSS/JS) are generated, never authored by hand. If a value isn't in a
   token, it isn't in the system.
2. **Vendor-neutral and portable.** The format is open DTCG JSON. No proprietary
   tool, no single vendor, owns the system. Any DTCG-aware tool can read it; the
   build can target any platform. We never depend on a tool we can't replace.
3. **Intent over appearance.** Tokens are named for what they *mean*, not what
   they *look like*. `color.text.muted`, not `color.gray-600`. Intent-based
   naming is the single biggest maintainability lever — it is the law, not a
   preference.
4. **Three tiers, never more.** primitive → semantic → component. References
   point only "down" a tier. Components reference semantic tokens; semantic
   tokens reference primitives; primitives hold raw values. Components never
   reference primitives directly. More than three tiers creates confusion about
   where a value comes from — we stop at three.
5. **Theme by swapping, not duplicating.** A theme/mode (light/dark, density,
   brand, high-contrast) changes only what semantic tokens *point to*, via DTCG
   `$extends` / group inheritance. The same semantic token resolves differently
   per mode; components are theme-agnostic and never change.
6. **The contract is a public API.** The token names, their meanings, and the
   tier rules are consumed by other projects and other agents. Renaming or
   re-pointing a public token is a breaking change for every consumer. Treat the
   contract with the caution you'd give a published API.
7. **Accessibility is a constraint, not a feature.** Contrast targets,
   focus-visible behaviour, reduced-motion, and hit-target minimums are baked
   into semantic tokens and enforced in validation — not bolted on later.
8. **Motion is systematized like everything else.** Duration and easing are
   named scales; choreography (staggering, ordering, distance-scaled duration)
   is specified, not improvised per animation.

---

## 3. The token contract

This is the load-bearing external interface. Its precise rules are specified in
the `token-contract` capability spec; the invariants that must always hold:

- **DTCG conformance.** Tokens use the 2025.10 `$type` vocabulary — atomic
  (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`,
  `number`) and composite (`typography`, `shadow`, `border`, `strokeStyle`,
  `gradient`, `transition`). `$value`, `$type`, `$description` as defined by the
  spec; `$type` may be inherited from a group.
- **Tiering & references.** Aliases use `{group.token}` syntax and resolve to a
  token's `$value`. References only point down a tier (component → semantic →
  primitive). No dangling references, no cycles.
- **Public surface.** Consumers reference semantic and component tokens.
  Primitives are an implementation detail of the system and are not part of the
  stable public surface.
- **Theming.** Expressed with `$extends` / group inheritance — never by copying a
  file per theme.
- **Color space.** Color ramps are authored in a perceptual space (e.g. OKLCH)
  so that scales are perceptually even; the chosen space and rationale live in
  the relevant spec's design.md.
- **Naming grammar.** Intent-based, tier-aware, with a defined grammar and
  examples of valid/invalid names in the `token-contract` spec. Consistency here
  is non-negotiable.
- **Validation.** Every token set validates against a JSON Schema and the DTCG
  rules; the build must succeed and emit the expected outputs before a change is
  considered done.
- **Versioning.** The system is versioned with semver. Additive changes are
  minor; breaking changes (renames, removals, meaning changes) require a major
  bump, a changelog entry, and `$deprecated` on the retiring token rather than a
  silent delete.

---

## 4. How the system is evolved (governance)

- **OpenSpec governs the machinery, not the look.** Changes go through OpenSpec
  (proposal → specs → design → tasks) to build and maintain the *apparatus* — the
  token format and validation, the repo structure, the build pipeline, the
  showcase, governance tooling. The design system's *content* — the actual color
  ramps, type scale, spacing, motion timings, and semantic roles — is authored as
  token files that conform to the contract; it is not specced as a capability.
  OpenSpec builds the machine; the tokens are what flows through it.
- **Capabilities** are the technical parts of the repo, e.g. `token-format`,
  `repo-structure`, `build-pipeline`, `showcase`, and `governance`. The list is
  illustrative and grows with the apparatus, not with the design language.
- **Validation gates** (see config.yaml `tasks` rules) are first-class: schema
  valid, references resolve, build succeeds, contrast/accessibility targets met,
  showcase renders. A change isn't done until its gates pass.
- **Deprecate, don't delete.** Retiring a public token uses `$deprecated` with an
  explanation and a successor, so consumers can migrate before removal.
- **Decisions are recorded.** The "why" lives in each change's design.md and is
  preserved when the change is archived. The constitution captures only the
  invariants that outlast any single change.

---

## 5. Non-goals

- **Not a component framework.** This system defines tokens and conventions, not
  React/Vue/Svelte components. The showcase may use a framework to render, but
  the system itself is framework-agnostic.
- **Not a re-invention of primitives.** We don't redesign the hamburger menu, the
  modal, or the slider from scratch — we standardize their tokens and their state
  matrices (default/hover/active/focus/disabled/loading/error).
- **No magic numbers.** A value used twice is a token. Ad-hoc literals in outputs
  are a bug, not a shortcut.
