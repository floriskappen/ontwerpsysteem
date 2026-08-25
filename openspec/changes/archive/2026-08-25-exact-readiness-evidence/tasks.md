## 1. Reconcile observed evidence

- [x] 1.1 Re-run `npm run build`, `npm run validate`, `npm test`, and `openspec validate --all --strict` from the final correction state; record exact gate summaries and counts in `docs/releases/v1.0.0-readiness.md` (covers `readiness-evidence` → “Stale or incomplete gate evidence fails review”).
- [x] 1.2 Confirm and record reproducibility evidence from the existing deterministic-build check, separately from the strict OpenSpec count; label browser/device inspection and release approval as human-owned and incomplete until a human performs them (covers `readiness-evidence` → “Current machine evidence and human ownership are separated”).

## 2. Protect the bounded correction contract

- [x] 2.1 Review the final diff and readiness report to confirm no component, skin, effect, visual redesign, dependency, version, downstream pin, release artifact, tag, publish, push, or accepted-baseline change was introduced; retain the existing targeted regression suite (covers `propagation-validation` → “Out-of-scope correction is rejected”).
- [x] 2.2 Run the existing build, validation, test, strict-spec, and baseline/parity checks and verify the accepted baseline is byte-for-byte untouched; add a narrowly scoped regression only if one of the specified evidence or correction contracts lacks enforcement (covers `propagation-validation` → “Bounded correction preserves gates and baseline”). *(Condition met: no gate enforced the `readiness-evidence` contract — added `test/readiness-evidence.test.mjs`.)*
