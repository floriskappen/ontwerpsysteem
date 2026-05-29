## Context

First change in the repo. CONSTITUTION.md defines the principles and the token contract; this change builds the machinery that enforces and serves it. No existing code or specs to reconcile with. Everything here is net-new and decisions made now become the contract every later change and every consumer depends on.

## Goals / Non-Goals

**Goals**
- A working, reproducible pipeline: author DTCG tokens → validate against the contract → build CSS, JS/TS, and Tailwind v4 outputs.
- Make the contract executable: naming grammar, tier rules, and reference integrity are enforced by `npm run validate`, not just documented.
- Prove it end-to-end with a trivial placeholder token set.

**Non-Goals**
- No real design-system content (no actual color ramps, type scale, etc.) — that is authored later as tokens.
- No theming/modes implementation yet (single default mode); the layout anticipates it without building it.
- No showcase ("zoo") — separate change.
- No publishing/packaging to a registry — separate concern.

## Decisions

### Build tool: Style Dictionary (latest, v4+)
Chosen for first-class DTCG support and a mature multi-target transform model. Alternatives (Theo — effectively unmaintained; Cobalt UI; a hand-rolled transformer) offered less ecosystem or more maintenance. Style Dictionary's custom formats cover all three targets we need.

### Validation: DTCG JSON Schema (ajv) + custom checks
A JSON Schema validated with ajv covers structure and the `$type` vocabulary, but cannot express *tier-relative* rules (a reference's legality depends on which tier the referencing token lives in) or the intent-vs-appearance naming rule. So validation is two-layer: ajv for shape, plus a small JS checker for naming grammar, tier/reference direction, and alias resolution. We author a focused DTCG schema rather than depending on an external one we can't control — consistent with the vendor-neutrality principle.

### Directory layout: tier-as-folder
Sources live in `tokens/{primitive,semantic,component}/`, tier inferred from the directory. Alternative — encoding tier in filenames or a per-file marker — is noisier and easier to get wrong. Folder-per-tier makes the checker's job trivial (it knows a file's tier from its path) and keeps the contract visible in the tree.

### Output name mapping is part of the contract
A token's dot-path maps to output names by one documented rule (`color.text.muted` → `--color-text-muted`, and the analogous shape in JS/TS and Tailwind). Consumers depend on these names, so the mapping is treated as public API; changing it is a breaking change. Style Dictionary's default kebab transform is adopted so the rule is standard, not bespoke.

### Tailwind v4 via `@theme`
Tailwind v4 reads theme values from CSS `@theme`, so the Tailwind target is a CSS artifact exposing tokens as theme variables — no JS preset needed. This keeps the Tailwind output close to the CSS output and avoids a second, divergent representation.

### Placeholder tokens, not content
To prove the pipeline we ship the smallest possible set: one primitive and one semantic alias of it. It exercises validation (schema + naming + tier + resolution) and every output target, and is explicitly disposable — deleted when real tokens are ported from the existing system.
