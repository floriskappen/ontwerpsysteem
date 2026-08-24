# v1 worker-loop handoff

Instructions for the automated per-change loop (plan → implement → verify → oversee)
running the remainder of `V1_ROADMAP.md`. A frontier pass reviews everything at the end.

Read `AGENTS.md` first, then this file. This file overrides nothing in `AGENTS.md` or
`design-system/change-propagation.md` — it only says *which* work is yours and where the
traps are.

---

## Scope

### You own these four, end to end

| Order | Change | State |
|---|---|---|
| 1 | `ship-skins-as-complete-role-sets` (C6) | in flight — 8/24 tasks done |
| 2 | `effects-as-pure-data-modules` (C5) | proposed, 0/19 |
| 3 | `reduced-motion-rest-frames-travel-with-states` (C7) | proposed, 0/17 |
| 4 | `document-atmosphere-mount-and-cost-contract` (C11) | **not yet created** — create it from the roadmap |

Do them in that order. C6 is already part-built; C11 depends on C5 landing.

### Do not touch these five

`add-status-mark-and-segmented-control` (C8) · `declare-light-only-theming` (C9) ·
`add-shadcn-adapter` (C10) · `rewrite-consumer-integration-guide` (C13) ·
`release-v1` (C14).

**Do not create their change directories, and do not draft their proposals.** For C9, C10
and C13 the framing *is* the work — a drafted proposal anchors the later pass on choices
it should be making fresh. C8's `design.md` exists but explicitly defers the visual
values ("does not decide the exact swatch colours, sizes, or glyph-free shapes"), and
those values are the change. C14 must run last, after the five above are archived.

If your planning step concludes one of your four needs something from a skipped change,
stop and write it to `V1_WORKER_NOTES.md` (see below) instead of reaching into it.

---

## Per-change notes

### C6 — finish the skins change

Tasks 1.1–3.2 are **done and committed**: the canonical skin source
(`design-system/source/skins/skins.json`, 12 skins × 4 supplied roles), the derivation
engine (`scripts/lib/skins-core.mjs`), `emitSkins()` in `build-core.mjs`, per-skin CSS in
`dist/css/skins/`, bundle inclusion, the generated zoo `skins.mjs`, and the theme-bar
rewrite. **Do not re-implement any of it.**

What is left is §4 (the coverage gate) and §5 (14 named checks):

- The gate gap is exact and small: `validate-core.mjs` carries the JSDoc for the `skins`
  option but no implementation, and `scripts/validate.mjs` never passes skins in. Close
  both ends.
- **Task 5.10 is owner-verified in the live zoo and is not yours.** Leave it unchecked
  and note it. Do not take browser screenshots — headless-Chrome captures of the showcase
  are prohibited in this repo.
- Task 1.2's text was amended in place: the engine lives in a new `skins-core.mjs`, not
  in `build-core.mjs`. That deviation is recorded, not a defect to "fix".

### C5 — effects as data

The oracle is **byte-identical zoo output**. `test/zoo-parity.test.mjs` and the accepted
baseline under `design-system/reference/accepted-zoo/` are the judge.

> **If parity goes red, your refactor is wrong. Never regenerate or edit the accepted
> baseline to make a test pass.** The baseline is the specification here.

`design.md` already makes six decisions with rejected alternatives — implement them,
don't relitigate them. Decision 2 in particular: keep the string wrappers, make them thin
renderers over the data, byte-identical output.

### C7 — reduced-motion rest frames

The rest poses are **already chosen** in `V1_ROADMAP.md` (C7, first bullet): germinating →
filled seed head @ 0.9, ripe → accent fill @ scale(1), rising → settled vessel, particle
fields → hidden, per-glyph header motion → static. Use those. Do not invent new ones.

The gate keys to the **shipped** CSS bundle, not the zoo source tree — `design.md` calls
this "the crux", because scanning the source is exactly what let the frames sit
un-shipped in `responsive.css`. If a keyframe is awkward to cover (the `--bo` grid
breathing is the known one), `design.md` already grants the escape: stop the animation
plus a declared static value, or hide the field. Take that route rather than loosening
the gate.

### C11 — atmosphere mount + cost contract

Create the change from the roadmap's C11 section. The numbers are already decided: 6–51
particles per field, 3 blooms, weather opt-in and off by default, `mountCardinality:
"once-per-root"`, `isolation: isolate` on the chrome root. Encode them as **generator
defaults plus a validation test**, not as prose assertions.

Keep the `language/atmosphere.md` prose short and factual. If you find yourself writing
rationale or a stance, stop and flag it — that is frontier-pass work.

---

## House style

The most likely failure mode here is code that passes all 82 tests and reads foreign. In
a design system whose thesis is coherence, that is real debt.

- **Comments explain *why*, in prose, above the thing.** Read `scripts/lib/skins-core.mjs`
  lines 1–19 and `emitSkins()` in `scripts/lib/build-core.mjs` for the register. Match
  that density. Never write `// loop over the skins`.
- **Follow the pipeline order** for any durable change: language prose → recipe JSON →
  zoo section → shipped CSS → test. Do not skip layers.
- **One source, always.** Never author a parallel copy of something the build can
  generate. Every existing generated file says so in its header.
- **British spelling** — `colour`, not `color`, in prose, filenames and identifiers.
  (Token paths stay `color.*`; that is the DTCG side, leave it alone.)
- Modularity: no monolithic files, per `AGENTS.md`.

---

## Gates

Before marking any task done:

```
npm run build && npm run validate && npm test
openspec validate <change-id> --strict
```

Baseline at handoff: **82 tests passing, 9 files.** Test count should only go up.

Do not archive a change whose tasks are not all checked, except C6, where 5.10 is
owner-verified — archive it only if the loop's oversight step is explicitly told the
owner has confirmed the zoo swap.

---

## `V1_WORKER_NOTES.md`

Create it and append to it rather than deciding, whenever you hit:

- a new visual value (a colour, size, shape, proportion) not already specified
- prose that would state a stance, rationale or trade-off rather than a fact
- a spec that is silent where you would have to invent
- anything that made you want to touch a skipped change

One short entry each: what you hit, where, and what you did instead. That file is the
frontier pass's first read.
