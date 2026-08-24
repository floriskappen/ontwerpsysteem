## Context

See proposal.md for motivation. The atmosphere is currently assembled from modular effect sources and style layers; C5's data primaries provide the stable source for field cardinality. The build already emits scoped effects CSS and the validator is the repository's executable contract gate.

## Goals / Non-Goals

**Goals:**

- Keep atmosphere limits close to the generator/configuration defaults so runtime output and validation share one source.
- Add a small, machine-readable recipe contract for mount cardinality and cost metadata.
- Make the fixed-behind-scope stacking context available in the shipped scoped CSS.
- Preserve deterministic output and the existing zoo baseline.

**Non-Goals:**

- No new visual effects, particles, bloom colours, or animation behaviour.
- No consumer framework adapter or per-component atmosphere API.
- No prose-heavy performance rationale beyond the factual operating envelope.

## Decisions

1. **Validate executable defaults, not documentation.** Define named atmosphere defaults in the effect/configuration source and have the validation gate inspect those defaults. Recipe metadata and language prose document the contract but cannot make an invalid count pass. This avoids a metadata-only check that could drift from emitted fields; a hand-maintained runtime manifest was rejected for the same reason.

2. **Keep weather opt-in at the mount boundary.** The default ambient stack contains the non-weather atmosphere and exposes weather as an explicit option. This preserves current static showcase behaviour while making consumers opt into the additional field cost. Making weather always-on was rejected because it violates the decided default and needlessly spends the budget.

3. **Use one root isolation primitive.** Add the fixed-behind-scope rule to the scoped atmosphere style source, with the chrome root establishing `isolation: isolate`; ambient descendants remain in the token tree and content is layered above them. A global `body` layer was rejected because it escapes island boundaries and cannot safely coexist with excluded subtrees.

4. **Extend the existing atmosphere recipe rather than inventing a parallel registry.** Add `mountCardinality` and cost/default metadata to the existing breathing-grid recipe and regenerate the recipe index. A second atmosphere manifest would create two sources of truth for consumer-facing guidance.

## Risks / Trade-offs

- [Risk] Existing consumers may mount weather or ambience per item without an explicit runtime error. → The recipe and language contract make the supported cardinality normative, while validation protects shipped defaults; consumer misuse remains observable integration behaviour.
- [Risk] CSS stacking-context changes can alter layering in the zoo. → Keep the primitive scoped to the chrome root and verify the generated showcase and accepted effect markup remain unchanged.
- [Risk] Generator counts could be changed in a future field without being included in validation. → Keep the field registry explicit and make the validation test fail for an uncontracted field rather than silently ignoring it.