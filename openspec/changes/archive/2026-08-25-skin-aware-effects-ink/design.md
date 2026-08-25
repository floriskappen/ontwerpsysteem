## Context

See `proposal.md` and the modified capability deltas. The source weather and atmosphere styles currently use the literal `rgb(31 27 22 / …)` for several ink-painted effects, while the skin pipeline already exposes the skin-overridable `--color-ink` role and emits root/scoped CSS from the same source. Generated outputs must remain build artifacts.

## Goals / Non-Goals

**Goals:**

- Make all named ink-painted effect families resolve through the existing ink role in both generated CSS forms.
- Preserve opacity variables, selectors, animation timing, markup, deterministic output, and accepted showcase output.
- Add a focused regression that catches future cream literals and demonstrates alternate-skin propagation.

**Non-Goals:**

- No new token, skin, effect, component, dependency, or visual treatment.
- No changes to particle data, effect cardinality, reduced-motion behavior, or baseline files.
- No hand edits to generated `dist` or release artifacts.

## Decisions

1. **Use the existing semantic ink custom property.** Replace only the hardcoded colour component of affected declarations with `var(--color-ink)` while retaining each declaration's existing alpha variable. This uses the live alias-preserving skin path and avoids introducing a new role or deriving colour in effect code. A new effect-specific token was rejected because the roadmap requires the existing ink role and the effects are ink, not a new semantic category.

2. **Keep the correction in the shared source stylesheet.** The source weather and atmosphere modules are the inputs for both root and scoped generated bundles, so one source change prevents output drift. Editing generated CSS directly was rejected because it would be overwritten by the next build and violate the repository's propagation rules.

3. **Test the built outputs and skin resolution.** Extend focused skin/build regression coverage to inspect the generated root and scoped effects CSS and to resolve declarations under every alternate skin. A source-only string check was rejected because it would not prove that both consumer outputs preserve the skin cascade.

4. **Preserve the visual baseline.** The replacement changes only the colour source from the base ink literal to the base skin's equivalent role value, so the default rendered appearance remains equivalent while alternate skins become coherent. No baseline regeneration is permitted.

## Risks / Trade-offs

- [Risk] A future effect can introduce a different hardcoded ink form that a narrow family check misses → Mitigation: assert the affected effect selectors contain the role reference and reject the known base literal in the shipped effects CSS.
- [Risk] CSS processing could flatten or rewrite the role reference differently in one output → Mitigation: inspect both root and scoped generated outputs and run the complete build/validation/test gates during implementation.
- [Risk] Replacing a literal could alter the base skin's computed colour if opacity handling changes → Mitigation: retain existing alpha variables and compare the accepted zoo output; the change must remain byte-identical.

## Migration Plan

No consumer migration is required: the public token names and CSS class contracts remain unchanged. Build, validation, and tests run before the change is archived. Rollback is a source-only revert if the baseline or any existing gate changes.
