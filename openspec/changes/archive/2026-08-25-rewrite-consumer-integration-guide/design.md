## Context

The machinery for all three adoption modes already ships: `:root` and `.ontwerp` token CSS, scoped
component/effects bundles, the boundary primitive, the `data-skin` slot, scoped font wiring
(`values/css/fonts.css`, voice at the scope root), complete skins, and — as of C10 — the shadcn
adapter. What does not exist is consumer documentation that teaches them together; the guide in
`templates/consumer-AGENTS.md` covers whole-app plus island snippets but not the seam rules, and
says nothing about retrofits, CSS resets, testing, or the utility-mark scope. The frictions this
change resolves are recorded verbatim in `DESIGN_SYSTEM_STRUGGLES.md` (S1, S3, S13, S16, S18) from
de-ontwerper's real integration.

## Goals / Non-Goals

**Goals:**

- One authoritative integration guide, shipped in the bundle, covering Cases A/B/C end-to-end.
- Operational notes (reset interaction, role-based testing, utility-mark scope) carried in the same
  shipped docs and enforced by tests where they are checkable.
- Repo-facing docs (`README.md` Cases 1–3) aligned with the bundle's guide so both tell one story.

**Non-Goals:**

- No build-pipeline or output changes: the bundle's file set is unchanged (the guide lives in the
  files already assembled).
- No new tokens, components, CSS, or zoo changes; no baseline regeneration.
- No dark-mode guidance beyond what C9 already fixed as light-only.

## Decisions

### The bundle's `AGENTS.md` IS the integration guide

The consumer entry doc grows the three cases as its adoption section (it already carries island
snippets, boundary, skins, Tailwind notes). A separate `integrating.md` was rejected: two docs
would drift, and agents read `AGENTS.md` first anyway — the reading-order contract makes it the
one file guaranteed to be seen. The repo `README.md` keeps its own Cases 1–3 (setup/build/
propagate) but points at the same three adoption modes with the same rules.

### Checkable requirements, stated at full strength

Each spec requirement names concrete artifacts a test can assert: the ancestor-trap sentence,
the five substitution pairs of the retrofit checklist, the literal Preflight counter-rule shape,
the "roles, never utilities" testing rule, and the data/prose split for mono-uppercase. Tests
assert these strings exist in the SHIPPED bundle files (as `distribution.test.mjs` already does
for skins), so the docs cannot silently regress on a pin advance.

### The pin file records which case was adopted

`templates/DESIGN.md` gains an "Adoption" line (whole-app / island / retrofit). Consumers record
deviations already; recording the mode makes propagation advice targetable ("an island consumer
advancing the pin re-checks scope placement first"). Kept to one field — the pin file is not a
survey.

## Risks / Trade-offs

- [Risk] Prescriptive docs age faster than prose principles. → Every prescription here restates a
  rule that already ships as machinery (boundary class, adapter files, scoped builds); if the
  machinery changes, the gate tests fail in the same commit.
- [Risk] The BREAKING-adjacent utility-mark ruling invalidates consumers' existing labels. → The
  v1 changelog entry (release prep) carries it explicitly marked BREAKING with the migration note;
  de-ontwerper already made this exact correction by hand (S18).
