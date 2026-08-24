## Context

The current language describes theme swapping as role reassignment but does not state the supported lightness polarity. The consumer bundle already carries the material thesis and skin guidance, so the change can travel through the authored language and its generated consumer copy without introducing a new runtime surface.

## Goals / Non-Goals

**Goals:**

- Make the light-only stance and its material rationale normative in the language.
- Give consumers with an existing `.dark` mode two explicit integration choices.
- Preserve the existing skin and token machinery unchanged.

**Non-Goals:**

- Adding dark tokens, a dark skin, or automatic mode detection.
- Changing the zoo theme switch or colour derivation behavior.
- Expanding this change into the broader consumer integration guide planned as C13.

## Decisions

- **Author the stance in theming and anti-goals.** `theming.md` owns the positive contract; `anti-goals.md` records the prohibited interpretation. Updating both keeps readers from treating the restriction as an omission. A new language file would fragment the small, existing taxonomy.
- **State consumer choices, not a forced integration mechanism.** Guidance will say to keep design-system chrome light or exclude it from dark surfaces. This supports both whole-app and island consumers without inventing a dark-mode API or prescribing application architecture.
- **Keep shipped consumer documentation synchronized.** The source language and template-facing consumer surface are the durable authoring inputs; the release bundle's language and consumer guidance must reflect the same wording through the normal build/distribution path rather than hand-maintained divergent prose.

## Risks / Trade-offs

- [Risk] Consumers may expect an automatic dark-mode response from the word “theme”. → Mitigation: use “light-only by design” and the material rationale explicitly in both language documents and consumer guidance.
- [Risk] Generated release files could drift from source documentation. → Mitigation: update source inputs and verify the bundle propagation in the implementation tasks and build gates.
