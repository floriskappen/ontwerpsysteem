## 1. Reconciliation

- [x] 1.1 Consumer README contents tree matches the assembled bundle (add `values/shadcn/`); verify bundle AGENTS.md reading order against actual bundle files; `openspec validate --all --strict` green.

## 2. Changelog

- [x] 2.1 Append Unreleased entries for the four latest changes: status mark + segmented control (recipes/CSS), light-only theming (language), shadcn adapter (values, optional), integration guide + utility-mark scope (docs, BREAKING-adjacent) — keyed to IDs with propagation notes.

## 3. Readiness report

- [x] 3.1 Write `docs/releases/v1.0.0-readiness.md`: gate results, drafted v1.0.0 entry + BREAKING migration notes, human-approved-steps checklist; report excluded from the consumer bundle.

## 4. Verification

- [x] 4.2 Run every gate (`npm run build`, `npm run validate`, `npm test`, `openspec validate prepare-v1-release --strict`, then `openspec validate --all --strict`); confirm no publish/tag/push/pin action was taken and VERSION is unchanged.
