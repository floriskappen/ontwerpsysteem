# Decisions — add-status-mark-and-segmented-control

## 1. The task list has no cleanup group

**What the instruction assumed:** a cleanup group in `tasks.md` to work through.
**What exists:** four groups (recipes, language prose, zoo examples + CSS, verification
gates) and no cleanup group. Group 4 (the verification gates) was treated as the closing
group; cleanup obligations that a cleanup group would carry — no dead classes, no unused
CSS, no stray keyframes — are covered by the named checks (3.2/3.3) and by the existing
zoo-parity gate, all of which pass.

## 2. The zoo's segmented worked example is interactive via hidden radios, not static markup

**What I did:** the `.seg` example uses visually-hidden radio inputs + `<label>` cells,
with selection styled by the sibling combinator (`.seg-radio:checked + .seg-cell`). This
makes the worked example an actually-working pick-one control with zero JavaScript (the
zoo forbids scripts) and demonstrates the immediate switch for real.
**What I rejected:** (a) a purely static "one cell carries a selected class" mock — it
cannot demonstrate switching at all; (b) reusing the theme bar's `:has()` machinery —
design Decision 5 explicitly decouples `.seg` from it. The radio pattern mirrors
`.th-tab`'s proven input mechanism while staying scoped to `.seg` classes only.
Consequence: the CSS also supports bare-button authoring (`.seg-cell:first-child` drops
the first rule when no radios are present).

## 3. Each severity variant carries its own CSS rule

**What I did:** `.mark-pass`, `.mark-warn`, `.mark-fail` each have an explicit rule
carrying their role (`accent` / `text-quiet` / `destructive`).
**What I rejected:** styling pass as the default child rule with no `.mark-pass`
selector. The zoo-parity gate ("introduces no newly-unstyled class versus the baseline")
fails on any body class no CSS rule targets, so the default-only version is not a legal
build state. It is also better authoring: the pass→accent mapping is visible on the class
a consumer actually writes.

## 4. New test file `test/status-mark-segmented.test.mjs`

**What I did:** put all new tests in one file named after the change, following the repo
convention of spec-anchored assertions (doc-prose checks like `repo-structure.test.mjs`'s
design-language block, build-derived checks like `showcase.test.mjs`'s shared-build
pattern). **What I rejected:** spreading them into `showcase.test.mjs` /
`repo-structure.test.mjs` — the change spans two capabilities and a single file keeps its
named checks reviewable and removable as a unit.

## 5. Assertion hygiene: declarations, not prose

Two named checks ("no `@keyframes`/`transition`", "no green tick") are stated over
artifacts that also contain prose *about* those words (CSS comments travel into the
scoped bundle; language docs discuss ticks). The tests strip comments before asserting
and use whitespace-tolerant matching, so they check real declarations/content rather than
failing on documentation mentioning the words.

## Tasks vs. specs

No substantive disagreement found: where the tasks compress the specs (e.g. task 3.1's
"token-styled"), the spec wording was implemented and tested directly (colours resolve
through token custom properties; fail confined to the destructive role; selected cell
inverts unselected; switch immediate; no keyframes).

## Review ruling (review phase)

All five calls **accepted**; no new dependencies were introduced, so there was nothing to
rule on there.

- **1 (no cleanup group)** — accept. Group 4's named checks plus the zoo-parity gate do
  carry the cleanup obligations a cleanup group would have.
- **2 (radio-backed example)** — accept. Verified against the repo: the theme tabs do use
  hidden inputs (`body:not(:has(#th-cream:checked))` in themes.css), so the mechanism has
  precedent, and scoping selection to the sibling combinator keeps `.seg` decoupled from
  the `:has()` machinery as design Decision 5 requires. The bare-button form (`.seg-cell:
  first-child`) is part of the recipe's documented contract for consumers, not imagined
  gold-plating; only the radio form is exercised by tests, which is acceptable at two
  selectors.
- **3 (per-variant CSS rules)** — accept. The parity gate makes default-only styling an
  illegal build state, and the class-visible pass→accent mapping is better authoring.
- **4 (single spec-named test file)** — accept. Matches the `effects-contract.test.mjs` /
  `skins.test.mjs` precedent of one file per change's named checks.
- **5 (comment-stripping assertions)** — accept. Asserting over stripped declarations
  rather than prose is exactly right given comments travel into the scoped bundle.

Review also strengthened two tests whose assertions were looser than their stated
properties: "token-styled" now fails on any literal hex/rgb/hsl paint in either primitive,
and "confined to a rule" now asserts the fail indicator is line-shaped (narrower than
tall), so a filled dot cannot pass.
