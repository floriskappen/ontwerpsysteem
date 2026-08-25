## Why

Every V1 roadmap change is now archived (C1–C11, C13). Before the single bounded Sol coherence
audit and the human's publish decision, the repo owes three non-publishing obligations: reconcile
specs and documentation with what actually ships, complete the human-readable changelog and
migration notes for everything since `0.1.1`, and leave a durable release-readiness report so the
human approves from evidence, not archaeology.

## What Changes

- Reconcile documentation with the shipped bundle: consumer README contents tree, bundle reading
  order, and spec text checked against `design-system/dist/release/` as it exists now.
- Complete the `## Unreleased` changelog section with entries for the four most recent changes
  (status mark + segmented control, light-only theming, shadcn adapter, integration guide +
  utility-mark scope), keyed to recipe/language IDs with propagation notes.
- Produce `docs/releases/v1.0.0-readiness.md`: gate results, the drafted v1.0.0 entry with
  BREAKING marks and migration notes, and the explicit list of steps that remain human-approved
  (publish, tag, pin advance).
- Run every gate (`npm run build`, `npm run validate`, `npm test`,
  `openspec validate --all --strict`) and record the results in the report.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec/specs/distribution`: a release SHALL NOT be published without a durable
  release-readiness report recording gate results and drafted migration notes — the written
  counterpart to "agent-drafts / human-approves".

## Impact

Dev-repo documentation only: `CHANGELOG.md` (Unreleased section), a new file under `docs/releases/`,
and the consumer README contents listing. No token values, build outputs, component sources, zoo
behaviour, or VERSION changes. VERSION stays `0.1.1`; nothing is published, tagged, or pushed.
