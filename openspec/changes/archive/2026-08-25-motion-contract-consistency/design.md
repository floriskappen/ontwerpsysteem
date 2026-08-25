## Context

The current source contains unused smooth UI duration/easing tokens, while atmosphere declarations use `ease-in-out`. The language and existing reduced-motion gate already establish immediate interactions, stepped periodic motion, and co-located rest poses. The accepted zoo output remains the visual oracle.

## Goals / Non-Goals

**Goals:**

- Make authored motion metadata and shipped CSS agree with the established contract.
- Keep periodic atmosphere animation visibly stepped without changing its authored movement endpoints.
- Add a focused executable regression that catches future transition/easing leakage.
- Preserve reduced-motion coverage and byte-identical output outside the intended motion correction.

**Non-Goals:**

- No new visual values, components, skins, effects, dependencies, or runtime motion system.
- No baseline or snapshot regeneration, release/version work, or downstream changes.
- No redesign of the established atmosphere choreography.

## Decisions

1. **Remove obsolete smooth UI affordances at the canonical source.** The unused transition/easing token declarations contradict the language and produce consumer-facing generated values. Removing them at the primitive/semantic source avoids a generated-output patch and keeps the token pipeline authoritative. Retaining them under a renamed or deprecated alias would continue advertising a contract the system rejects.

2. **Use stepped timing for atmosphere declarations.** Replace CSS easing functions only where periodic atmosphere animation currently declares them, using the existing stepped motion convention. This preserves selectors, keyframes, durations, endpoints, and reduced-motion rules; rewriting keyframe geometry or timing values would risk changing the accepted baseline.

3. **Validate source and shipped surfaces.** Add a focused test/validation check that scans authored motion declarations and built CSS for forbidden interaction transitions and smooth periodic atmosphere timing, alongside the existing keyframe coverage gate. A source-only check would miss build-transform regressions; a shipped-only check would allow contradictory authored recipes to remain.

4. **Treat parity and scope as hard gates.** Run the existing zoo parity check against the accepted baseline and keep the correction limited to the roadmap item. If parity exposes an intentional motion-byte difference, the implementation must preserve the baseline through the smallest source correction rather than editing the baseline.

## Risks / Trade-offs

- [Risk] Removing public generated motion tokens may affect an undocumented consumer. → The tokens already contradict the normative immediate-interaction language; record the removal as the scoped contract correction and do not add replacements that preserve smooth semantics.
- [Risk] Converting atmosphere easing to stepped timing changes generated CSS bytes. → Keep the existing keyframes and durations unchanged, and use the existing parity/build gates to detect unintended broader drift.
- [Risk] A regex-only guard may miss a new CSS property form. → Check both canonical motion sources and all shipped CSS, and retain the existing focused tests as named regressions.

## Migration Plan

Update canonical source and tests, run the build and validation gates, then verify the showcase parity and strict OpenSpec validation. Rollback is a source-only revert; generated outputs are regenerated rather than hand-edited.
