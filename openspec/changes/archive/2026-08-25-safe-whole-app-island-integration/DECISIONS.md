# Decisions — safe-whole-app-island-integration

1. **Whole-app mount shape: `tokens.css` + scoped component/effect targets + `.ontwerp` on
   the app root container.** The spec requires whole-app guidance to name "the shipped root
   token, component, effect, and font assets" and to show the application root receiving
   component/effect styles. Component/effect CSS ships only in `.ontwerp`-scoped form
   (`components.scoped.css`, `effects.scoped.css`), so Case A now mounts those files and puts
   `class="ontwerp"` on the application's root container (never `html`/`body`, per
   `language/type.md`). Rejected: telling whole-app consumers to import only `tokens.scoped.css`
   under one scope and skip `tokens.css` — it would drop the root token asset the spec names;
   rejected also: asking the build for a new unscoped component/effect target — a non-goal.

2. **Path-audit oracle: `design-system/dist/release/` when present, else a fresh deterministic
   assembly.** Task 2.1 names the concrete dir; it is gitignored build output, so a test that
   *only* reads it would fail on a fresh checkout and silently pass against a stale one.
   Implementation resolves against the real dir when it exists and otherwise assembles once via
   the shared `releaseBundleOnce` helper — byte-identical output per the determinism gate in
   `distribution.test.mjs`. Template-parity ("generated release documentation matches the
   canonical templates") is asserted against a fresh assembly so the suite stays
   order-independent.

3. **Documented-path extractor counts delimited tokens only** (backticked inline code or quoted
   import specifiers). Prose such as "invent it from the recipes/principles" (README.md) is not
   an asset path; treating it as one produced a false audit failure during development.

4. **consumer-README.md Case B shorthand expanded to fully qualified paths.** It named
   `components.scoped.css`, `effects.scoped.css`, `fonts.css` bare; bare names are ambiguous
   against the bundle root and unauditable. This goes slightly beyond task 1.2's letter
   ("matching imports") to meet the spec scenario that all five island paths resolve by name.

5. **Existing `distribution.test.mjs` assertion kept green without weakening.** Its check that
   the consumer AGENTS.md contains `values/shadcn/adapter.css` still passes because the file
   names the unscoped adapter as the *whole-app* form (Case A) and fences it off inside Case B;
   the new stricter assertions live in `test/consumer-integration.test.mjs`.

6. **`templates/DESIGN.md` reviewed, unchanged (task 1.3).** Its adoption-case line points at the
   bundle guide's three cases; nothing in it contradicts the corrected mounts, and adding mount
   detail would expand the pin-file template beyond its record-keeping scope.

7. **No cleanup group exists in tasks.md.** The change ships two groups (guidance repair,
   verification contract); the final-gate role a cleanup group would play is covered by task 2.3
   (build → audit → validate → tests → strict OpenSpec), which was run in full. No extra cleanup
   tasks were invented to satisfy the expectation.

8. **No ROADMAP-FEEDBACK written.** The roadmap entry for this change
   (`docs/roadmap/03-v1-coherence-remediation.md`) anticipated exactly what building it revealed;
   nothing to feed back.

## Review ruling (quality revision)

All eight decisions are judged against the repo constitution (modularity, no speculative
generalization, durable docs move with durable changes) and are **accepted**; none reverted.

- **D1 accepted.** Matches Requirement 1's letter ("root token, component, effect, and font
  assets"; application root receives the styles) and both rejected alternatives were correctly
  rejected: dropping `tokens.css` would unname a root asset the spec requires; asking for an
  unscoped component/effect target contradicts design.md's non-goals.
- **D2 accepted, comment corrected.** dist-first matches task 2.1's named oracle and the fresh
  fallback keeps CI/fresh checkouts deterministic. The original comment claimed both branches
  always audit "exactly what `npm run build` assembles" — false for a stale prebuilt dir —
  so the comment now states what actually holds (parity never trusts the prebuilt dir).
- **D3 accepted.** Delimited-token extraction is the right precision/cost point; the false
  positive it avoids is real (`recipes/principles` in README prose).
- **D4 accepted.** Serves the spec scenario that all five island paths resolve by name; bare
  filenames are unauditable against the bundle root.
- **D5 verified, accepted.** Confirmed `distribution.test.mjs` asserts the consumer AGENTS.md
  contains `values/shadcn/adapter.css` and that the updated template still carries the literal
  in its Case A section; no assertion was weakened.
- **D6 accepted.** DESIGN.md is untouched in the diff and its adoption-case line stays accurate.
- **D7 accepted.** Task 2.3 is the final gate; inventing cleanup tasks would be ceremony.
- **D8 upheld by review.** No unwired seam exists: the audit file is auto-discovered by vitest's
  default include (config customizes only exclude/timeouts), no runtime symbol or integration API
  was added, and `package.json` is untouched — no new dependency to rule on.

Review edits to `test/consumer-integration.test.mjs`: strengthened the island-adapter fence
regex — bare `not` matched any negative aside, so a Case B line recommending the `:root`
adapter could pass ("do not worry about scoping…"); now fences on
`never|only|whole-app|case a|leak|:root`, which all three guides' current fence lines satisfy.
Removed a subsumed regex alternation in the Case A scope-class check.
