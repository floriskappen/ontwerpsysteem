# Decisions — utility-mark-canonical-examples

Recorded during apply. Each entry: what was done, what was rejected, and why.

## D1 — Scenario 2 implemented as a closed-world audit (task 2.2 was weaker than the spec)

- **Did:** the spec scenario requires that "no prose label, subtitle, section header,
  taxonomy tag, or eyebrow is assigned that treatment" — everywhere, not just on the two
  corrected selectors. Task 2.2 compressed this to "prose examples are excluded".
  Implemented as `markAudit` in `test/utility-mark.test.mjs`: across every zoo style
  module, the set of selectors carrying the utility-mark treatment must equal exactly
  `{.val, .pill, .mark}`, and the allow-list itself may never contain a prose-named role.
  Mutation self-tests prove the check fails in both directions (a regressed label; a new
  element acquiring the treatment).
- **Rejected:** asserting only `.field-label` / `.theme-switch-label` / `.val`, as the
  task literally reads.
- **Why:** the specs are authoritative over the tasks; a looser test would also pass
  while leaving the scenario's actual guarantee unenforced. The *edits* still stayed
  limited to the two offending selectors (design risk note respected) — everything else
  already complies; the audit makes that compliance enforceable instead of incidental.

## D2 — Generated-output assertions included although design.md emphasised source level

- **Did:** scenario 1's WHEN clause inspects *the generated showcase*, so the suite also
  builds the real page and asserts the corrected voices there, plus the shipped
  `components.scoped.css` (`.ontwerp .field-label`) — the consumer-facing artifact the
  audit worried about — and that no presentational property on the built page reads
  `var(--typography-mark)` anymore (token *alias declarations* like
  `--badge-typography: var(--typography-mark)` on the scope root are declarations, not
  wiring, and are exempt).
- **Rejected:** source-only checks.
- **Why:** a requirement inspected on the generated artifact must be able to fail on the
  generated artifact (build transforms could reintroduce or mask the mistake).

## D3 — Surface preservation read as oracle-preservation, not whole-sheet byte equality

- **Did:** pin the accepted baseline by sha256 (never regenerated); assert the rebuilt
  page's `.field-label`/`.theme-switch-label` rules differ from the baseline **only** in
  `font`/`text-transform` (every other declaration verbatim); freeze devDependencies,
  version, and the component-class vocabulary; pin the authored token values
  (`typography.mark` = `{font.mono}` 10px, badge → mark), the resolved build output
  (`--typography-mark` still JetBrains Mono, `--typography-label` still Archivo), and the
  normative sentences of `language/type.md`.
- **Rejected:** diffing the whole built sheet against the baseline. Earlier archived
  corrections (keyframe namespacing, rest-frame relocations, stepped clocks, effect ink)
  are recorded, legitimate deltas; re-recording them here would duplicate the standing
  `zoo-parity` / `motion-scope` guards, which continue to cover the global surface.
- **Why:** follows the oracle-preservation precedent of motion-contract-consistency D2;
  the two-rule delta is exactly this change's allowed footprint.

## D4 — Pills and status marks keep their uppercase treatment

- **Did:** `.pill` and `.mark` stay on `--badge-typography` (resolves to
  `typography.mark`) inside the sanctioned data set.
- **Rejected:** sweeping every uppercase string to lowercase while at it.
- **Why:** design non-goals explicitly exclude badges/status marks whose content is not a
  prose label; `language/type.md` sanctions mono-uppercase for coded events; the audit's
  blocker #3 named exactly the field and theme labels. Broadening would expand the
  correction beyond the audited defect.

## D5 — New dedicated test file rather than extending showcase.test.mjs

- **Did:** `test/utility-mark.test.mjs` (17 tests): one describe per spec scenario plus a
  markup-inventory describe for task 1.2.
- **Rejected:** appending to `test/showcase.test.mjs`.
- **Why:** matches the precedent of the previous correction changes
  (`motion-contract`, `motion-scope`, `effects-ink` as focused files); keeps failures
  local to the contract they guard; `showcase.test.mjs` is already the largest suite.
- **Quality revision:** the suite initially carried its own CSS rule walker — the third
  copy of that shape in the repo. Instead of keeping it, `helpers.mjs`'s private
  `rulesWithBodies` was exported and reused (no behaviour change); a redundant negative
  assertion subsumed by the voice check was removed.

## Tasks-vs-specs disagreements encountered

- Task 2.2 ("prose examples are excluded") vs spec scenario 2 (no prose label,
  subtitle, section header, taxonomy tag, or eyebrow carries the treatment anywhere) —
  resolved in favour of the spec; see D1.
- No other disagreement: tasks 1.x, 2.1, 2.3, 3.x match their scenarios once the
  generated-artifact requirement of scenario 1 is honoured (see D2).

## Review rulings

Each implementer decision ruled on against the repo constitution and existing
conventions:

- **D1 — accept.** Specs are authoritative over tasks; a closed-world audit with
  mutation self-tests in both directions is exactly the "named check per scenario"
  discipline the previous correction changes established. The edits themselves stayed
  limited to the two audited selectors, so no scope creep.
- **D2 — accept.** A requirement whose WHEN inspects the generated artifact must be able
  to fail there; this matches the effects-ink/motion-contract precedent of building the
  real system once and asserting on both shipped forms.
- **D3 — accept.** Oracle-preservation follows the motion-scope baseline-hash precedent,
  and whole-sheet byte equality was genuinely wrong here: the accepted baseline's page
  sheet does not even carry every current source rule (`.mark` is absent from it), so
  pinning the hash plus the two-rule delta is the correct granularity while the standing
  `zoo-parity` / `motion-scope` guards keep covering the global surface.
- **D4 — accept.** The non-goals exclude badges/status marks whose content is data, and
  `language/type.md` sanctions mono-uppercase for coded events.
- **D5 — accept.** Focused test file matches precedent; keeping the contract predicates
  (`carriesUtilityMark`, `markAudit`, `proseLabelViolations`) local to the suite rather
  than moving them beside effect-ink's contract in `helpers.mjs` is right — they have one
  consumer today, and hoisting them would generalise for an imagined caller.

### Review change

- Strengthened "no rule on the built page wires the mark typography" into a full
  closed-world audit of the built page (same predicate, same allow-list as the source
  audit). Before, a section emitting its own `<style>` with an uppercased prose label or
  a `--badge-typography` wiring passed every test while violating scenario 2's
  "no prose label … is assigned that treatment"; only direct `var(--typography-mark)`
  reads were caught on the generated artifact. Verified green by construction: the
  accepted baseline sheet shows the post-correction carriers are exactly `.pill` and
  `.val` (both allow-listed), `:root` aliases are skipped as declarations and
  `@font-face` is skipped by the walker.
