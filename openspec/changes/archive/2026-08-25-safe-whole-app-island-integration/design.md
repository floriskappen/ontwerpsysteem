## Context

The release bundle already contains separate root and `.ontwerp`-scoped CSS targets, a boundary primitive, and root/scoped shadcn adapters. Consumer prose in the repository and release template is the durable entry point, while `design-system/dist/release/` is the assembled path surface to audit.

## Goals / Non-Goals

**Goals:**

- Make the two adoption paths executable from documentation alone.
- Keep all island imports and selectors under the same `.ontwerp` root.
- Add a deterministic documentation-to-bundle path check that can fail on drift.
- Preserve the existing boundary, reset, skin, and leakage safeguards.

**Non-Goals:**

- No new components, CSS targets, runtime integration API, dependency, or visual change.
- No redesign of the established light-paper system or its scoped selectors.
- No replacement of the existing boundary mechanism with a broader reset.

## Decisions

1. **Treat the assembled release bundle as the path oracle.** The check will resolve the exact files named by the consumer docs after build, rather than validating only source paths. This catches stale documentation when generated layout changes; manually duplicating a path allowlist in the docs would not.

2. **Document complete mounts, not token-only shorthand.** Whole-app examples will name root tokens plus the shipped component/effect and font assets. Island examples will name the scoped equivalents and the scoped adapter. This makes the existing bundle contract observable without changing it.

3. **Keep scope and boundary rules normative in the guide.** The `.ontwerp` root remains tight around chrome, and `.ontwerp-boundary` remains the escape hatch for an unavoidable neutral descendant. A global scope or an adapter mounted outside that root is rejected rather than made convenient.

4. **Use documentation and validation tests only.** A browser or framework integration layer would add machinery to solve a prose/path mismatch. A build-time path audit plus existing validation is sufficient and keeps dependencies unchanged.

## Risks / Trade-offs

- [Risk] Generated release paths can change without the source guide being updated → the bundle audit fails before the change is accepted.
- [Risk] More explicit imports make the guide longer → keep the examples minimal and link repeated safeguards to the canonical island section.
- [Risk] A consumer may still put `.ontwerp` on an overly broad ancestor → retain the explicit forbidden placement and neutral-subtree scenario in the contract.

## Migration Plan

Update the canonical consumer documentation and its generated release copy, then run the normal build and documentation path audit. Consumers need only reread the corrected Case A or Case B instructions; no code or dependency migration is required. Reverting the documentation and audit changes restores the previous guide without affecting shipped runtime assets.
