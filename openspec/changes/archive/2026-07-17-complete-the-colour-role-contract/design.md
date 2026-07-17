# Design — complete-the-colour-role-contract

## Context

The semantic colour layer covers surface/text/accent/border but consumers hit missing
intents (focus-ring, destructive, disabled, muted) and had to reverse-engineer how the
long-tail colours derive from ink + paper + accent (S2, S10). Skins today override ~7
roles and only work because the zoo re-links aliases at runtime. Two downstream changes
(`ship-skins-as-complete-role-sets`, `add-shadcn-adapter`) need a complete, explicit
role contract to build on.

## Goals / Non-Goals

**Goals:** make the role set complete and the supply-vs-derive split machine-checkable;
give derivations stable IDs an implementation (and a future skin validator) can execute.

**Non-Goals:** shipping complete skins (Wave 2), the shadcn crosswalk (Wave 3), scoped
CSS or live-alias builds (sibling Wave 1 changes), and any dark-mode story. This change
does not decide the visual values of the new roles — those are content.

## Decisions

1. **Provenance lives in token `$extensions`, not only in a prose table.** The tokens
   are the source of truth; a markdown-only table would drift. `ontwerp.role` metadata
   (`supply` / `derive` + `derivation` ID) makes the contract queryable by the Wave 2
   skin validator. The colour.md roles table becomes a checked projection of the tokens,
   not a second authority. Alternative — generating the table — was rejected: language/
   files are hand-authored prose by convention; a sync check keeps them honest without a
   generator.

2. **Derivation rules are a JSON registry co-located with the prose**
   (`design-system/language/colour.derivations.json`). Putting them in `recipes/` was
   rejected: recipes share a fixed schema (intent/useWhen/sourceModules) and are compiled
   into `recipes/index.json`; derivations have a different shape (inputs + formula) and a
   different consumer (the token validator, later the skin validator). Co-location with
   `colour.md` keeps the prose and the machine form in one place.

3. **Derivations compute from skin-supplied roles only — no chains.** A rule's inputs
   must be `supply` roles. This keeps "a complete skin = the supplied set; everything
   else computes in one pass" true by construction, and keeps the validator a single
   walk. A would-be chain (derive from a derived role) is expressed by registering a
   composed rule instead.

4. **Alpha variants become grammar, not convention.** `ink-a65`-style names already
   exist; formalising `<base>-a<step>` at the primitive tier gives derivation formulas a
   well-formed target (alpha ramps over a base) and lets validation catch a variant
   whose base was renamed away. Restricted to primitives so semantic names stay pure
   intent.

5. **Strictly additive.** The red stops doubling as danger by *adding* a destructive
   role, not by repointing accent; no token is renamed or removed, so no `$deprecated`,
   no consumer migration. The "muted" tier lands as real semantic alias tokens (so the
   roles-table sync check stays strict — every row is backed by a token), aliasing the
   same primitives as the quiet/faint inks.

## Risks / Trade-offs

- [Roles-table sync check parses hand-written markdown] → keep the checked surface
  minimal: role path + provenance columns only; a malformed table fails loudly rather
  than passing silently.
- [Provenance metadata is required on all semantic colour tokens, so existing tokens
  fail validation until annotated] → the implementation annotates the existing roles in
  the same change; the gate lands together with conforming content.
- [Formula expressiveness: mix ratios + alpha steps may not cover a future derivation]
  → the registry schema names the formula kind explicitly, so a new kind is an additive
  schema extension, not a rewrite.
