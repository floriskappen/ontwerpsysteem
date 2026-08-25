# V1 frontier preparation

This phase completes the remaining V1 work before one bounded Sol coherence audit and human release
approval. Luna plans each change; Ox Alpha implements and independently reviews it. The resolved
decisions and exact scopes in `V1_ROADMAP.md` are authoritative.

- [x] **add-status-mark-and-segmented-control** (archived as `2026-08-24-add-status-mark-and-segmented-control`) — C8: finish the already-open change through the
  full language → recipe → zoo → shipped CSS pipeline. Preserve its organic status vocabulary and
  square, instant segmented-control contract; do not introduce generic icons or new visual values
  beyond the approved change.
- [x] **declare-light-only-theming** (archived as `2026-08-24-declare-light-only-theming`) — C9: state the already-decided paper/light-only stance in the
  language and consumer guidance. This is documentation of a resolved decision, not a dark-mode
  implementation or new skin.
- [x] **add-shadcn-adapter** (archived as `2026-08-25-add-shadcn-adapter`) — C10: ship the values-only shadcn variable crosswalk in root and scoped
  forms. Do not reimplement components or add a runtime dependency.
- [x] **rewrite-consumer-integration-guide** (archived as `2026-08-25-rewrite-consumer-integration-guide`) — C13: document whole-app, island, and retrofit adoption;
  carry the reset, testing, utility-mark, font, scope, and migration rules into the shipped consumer
  bundle and templates.
- [x] **prepare-v1-release** (archived as `2026-08-25-prepare-v1-release`) — Reconcile specs and documentation, run every gate, prepare the
  human-readable V1 changelog and migration notes, and produce a durable release-readiness report
  (`docs/releases/v1.0.0-readiness.md`).
  Do not run a publish command, push a release branch, create a tag, or advance De Ontwerper's pin.

After these five changes, stop for the single bounded Sol coherence audit. Only the human may approve
the actual V1 publish/tag and downstream pin advance.
