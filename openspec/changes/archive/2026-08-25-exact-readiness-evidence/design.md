## Context

See `proposal.md` for motivation. The readiness report is a durable human-review artifact, while the repository gates are the authoritative source for machine-observed results. The current report predates the final coherence corrections and must be reconciled without changing the design system or release state.

## Goals / Non-Goals

**Goals:**

- Re-run the existing build, validation, test, strict-spec, and reproducibility gates from the final correction state.
- Update the readiness report with exact observed results and clear ownership boundaries.
- Preserve the accepted zoo baseline and make any regression addition narrowly target an uncovered readiness contract.

**Non-Goals:**

- No implementation redesign, new visual content, new runtime capability, dependency, or release artifact.
- No version bump, release publication/tag, downstream pin advance, or fabricated human/device evidence.

## Decisions

- **Use the existing gates as evidence sources.** The report will quote their observed summaries rather than introduce a parallel readiness runner, avoiding drift between release evidence and CI checks. A bespoke script was considered and rejected as unnecessary machinery.
- **Keep readiness documentation as the primary output.** Machine results belong in the report; tests remain the enforcement mechanism. Updating generated output or the accepted baseline was considered and rejected because those artifacts are not evidence records.
- **Treat human/device checks as explicit ownership boundaries.** Unperformed browser/device inspection and release approval will be labelled human-owned, rather than inferred from automated checks. This keeps the report honest and preserves the release workflow.
- **Add regression coverage only if a gap is found.** Existing gates and targeted tests are retained; a new check is justified only when it directly protects the evidence or bounded-correction contract. Broad cleanup or opportunistic coverage is out of scope.

## Risks / Trade-offs

- [Risk] A future gate output format can change and make a copied summary stale → record the command, exact result, and repository state together so the report can be rechecked.
- [Risk] Documentation-only evidence can be mistaken for human approval → keep the human-owned section explicit and preserve the prohibition on publish/tag/push actions.
- [Risk] A strict-spec count can be confused with test-file count → label the strict OpenSpec result separately from test totals.
