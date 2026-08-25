## Context

See `proposal.md` for motivation. The build already emits root and `.ontwerp` token CSS, assembles `dist/release/values/`, and validates semantic colour roles. Shadcn's variables are a consumer-facing compatibility surface, so the adapter must be additive and generated alongside those outputs without entering the token tiers or zoo component sources.

## Goals / Non-Goals

**Goals:**

- Add one canonical, readable mapping source and deterministic root/scoped CSS artifacts.
- Keep mappings expressed through ontwerp semantic custom properties so skins and scoped role overrides continue to cascade.
- Make the adapter available in the assembled release bundle and validate that every referenced role exists.
- Make the non-obvious interoperability choices visible at the source boundary.

**Non-Goals:**

- No shadcn component CSS, markup, Tailwind preset, JavaScript, or runtime integration.
- No new semantic tokens or changes to the existing token contract.
- No attempt to support a dark shadcn theme or alter the system's light-paper stance.

## Decisions

### Keep the crosswalk outside the token tiers

The adapter is an interoperability layer, not design-system content. A small CSS source under `design-system/source/values/shadcn/` can reference the public semantic roles without adding vendor vocabulary to DTCG token files. A token-file adapter was rejected because shadcn names are a foreign output contract and would pollute validation, manifests, and Tailwind naming.

### Generate both selector forms from one mapping

Author the declarations once, then emit `adapter.css` with a root selector and `adapter.scoped.css` with the `.ontwerp` selector during the existing build. This avoids the consumer-facing root/scoped files drifting; hand-authoring two complete files was rejected because it recreates the exact synchronization burden the adapter removes.

### Validate references at build time

The build will parse the adapter's `var(--color-...)` references and compare them with the canonical token paths already collected by validation, while also checking root/scoped property parity. A missing semantic role or required shadcn variable therefore fails before release assembly instead of producing a silently incomplete crosswalk.

### Assemble as optional values

The release assembler copies the adapter directory beside `values/css/`, `values/js/`, and `values/tailwind/`. Existing consumers do not import it, and importing it remains CSS-only. Adding a dependency or invoking component/runtime code was rejected because the roadmap explicitly constrains this change to a values-only crosswalk.

## Risks / Trade-offs

- [Risk] Shadcn evolves its variable vocabulary independently. → Keep the adapter isolated and document the mapped contract so a later crosswalk revision can be additive or explicitly versioned.
- [Risk] A bundler may alter custom-property declarations. → Use distinct root/scoped files and validate the generated artifacts before release; consumers import the form matching their adoption mode.
- [Risk] A semantic role is renamed upstream. → Build-time reference validation fails with the unresolved role instead of shipping a broken adapter.
