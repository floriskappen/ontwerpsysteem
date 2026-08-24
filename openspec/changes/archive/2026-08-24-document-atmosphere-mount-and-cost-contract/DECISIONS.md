# Decisions

## 1. The chrome root nests inside the token scope (scoped builds)

**What:** The fixed-behind-scope primitive is authored as
`.ontwerp-root { isolation: isolate }` in `atmosphere.css`. The scoped bundle's
scoper prefixes every class-rooted selector, so consumers get
`.ontwerp .ontwerp-root` — the documented pattern therefore places the chrome
root one element **below** the token scope (`<div class="ontwerp"><div
class="ontwerp-root">…`), not on the same element.

**Rejected:** Putting both classes on one element (`class="ontwerp ontwerp-root"`)
— a descendant selector can never match its own scope element, so isolation would
silently vanish, which is exactly the S23 failure class. Special-casing the
primitive inside `scopeCss()` — a second magic path in the build for one rule;
the nesting costs consumers nothing.

**Why recorded here:** Neither the roadmap nor the specs say same-element vs
nested; the scoper decides it. The language doc states the nested shape
explicitly.

## 2. Bloom markup is generated from the contract module

**What:** `index.mjs` now renders the bloom `<i>` elements via `ambientBlooms()`
from `effects/atmosphere.mjs`, whose `bloomData()` owns the count. Output bytes
are identical to the accepted baseline (verified by hash).

**Rejected:** Keeping the hardcoded `b1/b2/b3` trio beside a declared
`bloomCount: 3` — two statements of one fact; the declared default could drift
from the real markup while validation still passed.

## 3. The decided numbers are anchored in the gate, not only in the source

**What:** The envelope constants live twice on purpose: as the shipping surface
(`ENVELOPE` in the source contract) and as the enforcement anchor
(`ATMOSPHERE_COST_CONTRACT` in `scripts/lib/atmosphere-contract.mjs`). The gate
fails unless decided ↔ declared ↔ observed all agree, and reflects over every
effects module so an unregistered `*ParticlesData` export fails coverage.

**Rejected:** Anchoring the gate on recipe metadata — design.md decision 1
explicitly rejects metadata-only checks. Anchoring solely in the source module —
editing `ENVELOPE` alone would have re-decided the contract with no friction.

## 4. New effects module required touching the C5 contract enumerations

Adding `atmosphere.mjs` meant extending `EFFECTS_SOURCES`/`EFFECTS_EXPORTS`/the
emitted `.d.ts` in `effects-core.mjs` and the per-module map in
`test/effects-contract.test.mjs`. That test's own instructions anticipate this
("a newly added .mjs must be added here"); noted so the C5 oracle's growth is
visible to its owners.

## 5. Tasks vs specs

No material disagreement found: the task list compresses the specs but never
contradicts them. One interpretation worth recording — task 2.2's "verify … zoo
consume the source primitive without … changing accepted effect markup" is read
as *style-source* consumption: the zoo page carries the primitive because its CSS
is compiled from the same `atmosphere.css`, while the DOM stays untouched. (An
HTML comment documenting the mount site was briefly added to `index.mjs` and
removed again — inert, but the task says the accepted effect markup does not
change.)

## Review ruling

All five calls ruled **accept**, judged against the repo constitution
(executable gates over prose; data primaries shipped, wrappers zoo-internal;
effect regions byte-identical to the accepted baseline):

1. **Nested chrome root — accept.** The descendant-selector reasoning is
   correct, and the scoped bundle plus its tests enforce exactly the decided
   shape: `.ontwerp .ontwerp-root` present, bare/html-body forms absent.
2. **Generated bloom markup — accept.** One statement of the cardinality,
   anchored at both ends: `bloomData()` derives from `ENVELOPE.bloomCount`,
   the gate recounts it, and the zoo test pins the literal `<i class="b1">…`
   markup string, so markup cannot drift while validation passes.
3. **Dual anchoring (source `ENVELOPE` + gate anchor) — accept.** This is the
   house pattern, not a project document edited to justify a dependency: C11's
   own roadmap line demands caps as generator defaults plus a validation test,
   not prose. The deliberate two-place edit is stated accurately in both file
   headers. No new dependency was added (`node:fs/path/url` only).
4. **C5 enumeration growth — accept.** Anticipated by
   `effects-contract.test.mjs`'s own instructions; recorded, not done
   silently.
5. **Style-source reading of task 2.2 — accept.** The zoo consumes the
   primitive through compiled CSS while DOM/effect regions stay byte-identical,
   which is what the task and the baseline oracle actually measure.

### Review notes

- `export const implementsRecipes = []` in `atmosphere.mjs` is load-bearing:
  validate-core's `showcase-metadata` rule errors on any `effects/*.mjs`
  without it. Not dead code.
- Seam audit: every new exported symbol has an in-repo caller
  (`ambientBlooms` → zoo index; `atmosphereContract`/`weatherFields`/
  `bloomData` → gate and recipe test; gate lib → validate.mjs). One exception
  named in ROADMAP-FEEDBACK: no element anywhere supplies `class="ontwerp-root"`.
- Spec coverage checked requirement-by-requirement: every scenario in the three
  deltas maps to a named, mutation-based check in
  `test/atmosphere-contract.test.mjs` that fails under violation; none
  missing, none loosened.
