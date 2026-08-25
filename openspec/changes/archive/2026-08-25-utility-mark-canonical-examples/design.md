## Context

See `proposal.md` for the motivation. The zoo currently has two prose labels wired to `typography.mark` and `text-transform: uppercase`, while the established type language reserves that treatment for data. The existing label treatment is already available through the semantic label typography and the zoo's lowercase voice.

## Goals / Non-Goals

**Goals:**

- Make the field gutter and theme-switch labels consume the existing prose-label treatment.
- Keep the existing data specimen as the canonical example of the utility mark.
- Add focused regression checks at the source/compiled-style boundary so the contradiction cannot return unnoticed.

**Non-Goals:**

- No token, font, spacing, colour, component, recipe, or language-content changes.
- No baseline regeneration, screenshots, browser evidence, or new dependency.
- No redesign of badges, status marks, segmented controls, or other uppercase treatments whose content is not a prose label.

## Decisions

### Reuse the existing label voice

Change only the two offending selectors to the existing `typography-label` / lowercase pattern already used by segmented labels and other prose. This avoids inventing a new value or creating a special-case token. A data mark remains the `.val` type specimen and keeps its current mono-uppercase styling.

### Test the canonical source and generated CSS contract

Add a targeted test that reads the two section/style sources (and, where appropriate, the generated showcase after build) and asserts that prose labels do not reference `typography-mark` or uppercase transformation, while `.val` still does. Source-level assertions keep the failure close to the authored mistake; the build test confirms the consumer-facing artifact carries the correction.

### Keep the change scoped to examples

Do not alter the global type documentation or token definitions: those already express the resolved rule. Do not add a component or change the showcase's section inventory. This preserves the accepted visual/content surface except for correcting the two contradictory canonical examples.

## Risks / Trade-offs

- [Risk] A broad search-and-replace could change legitimate status/data marks. → Limit edits and assertions to `.field-label` and `.theme-switch-label`; explicitly assert `.val` remains a utility mark.
- [Risk] Generated output can become stale during local inspection. → Treat source as authoritative and run the normal build/test gates during implementation; never hand-edit `dist/`.
