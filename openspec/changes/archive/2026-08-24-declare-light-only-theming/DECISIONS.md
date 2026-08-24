# DECISIONS — declare-light-only-theming

## D1 — Consumer `.dark` guidance lives in the shipped consumer templates, not a new document

**What:** Added the light-only stance and the two supported `.dark` responses to
`design-system/templates/consumer-AGENTS.md` (§ "Theming is light-only") and
`design-system/templates/consumer-README.md` (a "Theming is light-only" bullet under
*Use it*). These ship verbatim as the bundle's `AGENTS.md` / `README.md`
(`scripts/lib/build-core.mjs` copies them unchanged).

**Why:** Spec requirement *"Existing dark themes have a supported integration response"*
names **consumer-facing design-system guidance**, and the roadmap done-when says the
consumer must find the stance "in the bundle". For a consumer, the bundle root docs are
that guidance; `language/theming.md` alone sits one hop deeper than the entry point.

**Rejected:** Putting the guidance only in `language/theming.md` (satisfies the language
requirement but not "guidance"); editing the repo-root `README.md` adoption cases
(that is Change 13 / `rewrite-consumer-integration-guide` scope); adding anything to
`templates/DESIGN.md` (a pin-file template, no requirement points there).

## D2 — Task 2.2 strengthened into failing tests

**What:** New suite `test/light-only-theming.test.mjs` (7 tests). It asserts the *built
bundle* carries the stance, its material rationale, and both `.dark` choices
(`theming.md`, `anti-goals.md`, `AGENTS.md`, `README.md`), and gates the documentation-only
constraint: every skin's `color.surface.page` has WCAG relative luminance ≥ 0.5 and no id
containing "dark"; all shipped CSS (tokens, scoped, components, effects, every skin file)
is free of `prefers-color-scheme`, `.dark` selectors, and `[data-theme]`; the token
manifest has no `dark`/`night` path.

**Why:** The roadmap done-when ("a consumer … finds the light-only stance … **in the
bundle**") and spec scenario *"No dark implementation is introduced"* demand checkable
properties. Task 2.2 only asked to "run the documentation/build validation and inspect
generated outputs" — an inspection that cannot fail later. Per the standing rule that
done conditions carry into the spec at full strength, the inspection became gates.

**Rejected:** A git-diff-based "no new token values" check (fragile in CI and redundant —
the change touches no token source, and the manifest/CSS gates catch reintroduction);
asserting exact prose sentences (would make wording changes break tests; semantic
anchors are asserted instead).

## D3 — Tasks vs specs: anti-goal does not itself enforce "no dark implementation"

Task 1.2 maps the anti-goal wording to the requirement *"No dark implementation is
introduced"*, but prose in `anti-goals.md` cannot prevent an implementation artifact —
that mapping is the task list compressing the spec. Implemented both halves at their own
strength: the anti-goal records the prohibition (task 1.2), and the test suite enforces
it (see D2). This is the only tasks-vs-specs tension found; the specs themselves were
unambiguous and internally consistent.

## D4 — "Light paper" made checkable as luminance ≥ 0.5

Spec requirement *"Theming is light-only by design"* says **every skin** is a light paper
surface. Made that a property: every skin's supplied page colour must have WCAG relative
luminance ≥ 0.5. All 12 current skins measure 0.79–0.84, so the gate has headroom while
still rejecting any future mid-tone or dark ground. Threshold chosen over alternatives
(OKLCH lightness floor, fixed hex allowlist) because relative luminance needs no
dependency and matches how "light ground vs ink contrast" is already reasoned about in
`language/colour.md`.

## Notes

- No `ANSWER.md` existed for this change; nothing pre-decided to inherit.
- Documentation-only change: no persisted schema, no migration, no fixtures touched;
  token sources untouched (`git status` confirms).
- No `ROADMAP-FEEDBACK.md`: the C9 roadmap entry (pure docs, light-only decided, bundle
  must carry the stance) matched what building it revealed.

## Review rulings

- **D1 — accepted.** The spec names *consumer-facing* guidance and the done-when puts it
  in the bundle; `assembleBundle` copies the two templates to bundle-root `AGENTS.md` /
  `README.md` verbatim (`scripts/lib/build-core.mjs`), so the authored wording ships
  exactly as written and no new document fragments the taxonomy.
- **D2 — accepted, one gate strengthened in review.** Turning task 2.2's unrepeatable
  inspection into failing gates was right. But the CSS gate hardcoded four filenames plus
  `skins/`, while `values/css/` also ships `fonts.css` (emitted beside `tokens.css` in
  `build-core.mjs`) — it escaped the check, as would any stylesheet added later. The gate
  now enumerates every `.css` under `values/css/`, and a sibling check scans the shipped
  JS for `prefers-color-scheme`, closing the last generated-output vector for *"no
  dark-mode runtime path"*. Today's bundle verified clean under the stricter gate.
- **D3 — accepted.** Tasks compressing specs is expected; enforcing each half at its own
  strength (prose records the prohibition, tests prevent its implementation) is correct.
- **D4 — accepted.** Threshold re-derived independently against `skins.json`: all 12
  skins' `color.surface.page` are pale grounds far above 0.5 with real headroom; WCAG
  relative luminance adds no dependency and matches how `language/colour.md` already
  reasons about ground vs ink. The change introduces no dependency at all.
- Seam audit: the only new exported symbol is the test helper `releaseBundleOnce`; its
  importers are exactly the two suites that consume built output — that is its job, not a
  dead application seam. No wiring debt to feed ROADMAP-FEEDBACK.
