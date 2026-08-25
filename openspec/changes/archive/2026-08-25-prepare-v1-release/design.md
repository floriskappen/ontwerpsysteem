## Context

All V1 changes are archived; `openspec validate --all --strict` passes. The consumer bundle is
assembled on every build and its contents have grown across the wave (scoped CSS targets, boundary
primitive, skin slot, complete skins, fonts layer, effects module, shadcn adapter) — the docs that
describe the bundle were written incrementally and need one reconciliation pass. The CHANGELOG's
`## Unreleased` section accumulated entries up to the Wave-2 changes but predates C8/C9/C10/C13.
`VERSION` reads `0.1.1`; the v1.0.0 bump, publish, tag, and De Ontwerper's pin advance are the
human-approved steps this change must NOT perform.

## Goals / Non-Goals

**Goals:**

- One reconciliation pass over bundle-describing docs vs. the actual assembled bundle.
- A complete, human-readable Unreleased changelog covering every durable change since 0.1.1.
- A durable readiness report (`docs/releases/v1.0.0-readiness.md`) with gate evidence and the
  drafted v1.0.0 entry.

**Non-Goals:**

- No publish, tag, push, or VERSION bump — those are `npm run release` + human approval.
- No new design content, recipes, tokens, or bundle artifacts.
- No edits to the accepted zoo baseline; no screenshots.

## Decisions

### The readiness report lives in `docs/releases/`, not the bundle

Development-side governance material stays out of the consumer surface (the distribution spec
already excludes dev machinery from the bundle). `docs/releases/v1.0.0-readiness.md` sits beside
the roadmap docs the human already reads.

### Changelog entries are appended to `## Unreleased`, not a pre-written `## 1.0.0`

Version selection and dating are `npm run release --write`'s job (agent drafts, human approves).
Completing Unreleased gives the human full material without usurping the version step. The report
carries the *drafted* v1.0.0 rendering for approval convenience.

## Risks / Trade-offs

- [Risk] The report goes stale as work continues past it. → It records the gate results of a
  specific state and says so; re-running the gates after any further change is part of the audit.
