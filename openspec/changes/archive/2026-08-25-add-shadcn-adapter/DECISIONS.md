# Decisions — add-shadcn-adapter

Working record of implementation decisions, task/spec disagreements, and
calls the tasks did not anticipate. If this change is archived, the durable
parts belong in the specs — not here.

## D1 — The canonical source is one `:root`-selected rule; the generator derives the scoped form

**What:** `design-system/source/values/shadcn/adapter.css` holds exactly one
rule selected by `:root`, carrying every crosswalk declaration plus the
decision comments. `renderAdapterVariants()` emits `adapter.css` (`:root`)
and `adapter.scoped.css` (`.ontwerp`) verbatim from that body, changing only
the selector.

**Rejected:** authoring two complete files by hand (the exact drift the change
exists to remove); a placeholder-selector template language (one more syntax
to document for no gain — `:root` is valid CSS, so the source can be linted,
highlighted, and previewed as-is); running the zoo's `scopeCss()` over the
crosswalk (it refuses non-class-rooted selectors and would re-select
declarations that must sit directly on the scope root).

## D2 — Required-variable set is the full shadcn semantic core, not the spec's minimum

**What:** the gate requires 20 variables: background/foreground pairs for
surface, card, popover, primary, secondary, muted, accent, destructive;
plus `--border`, `--input`, `--ring`, `--radius`.

**Why:** the distribution delta names background, foreground, primary, card,
border, ring, destructive, muted "and their foreground roles"; the roadmap's
done condition is stronger — "a shadcn/Tailwind consumer imports tokens +
adapter and their existing shadcn-shaped chrome picks up the system without
hand-authoring a crosswalk." Real shadcn chrome consumes popover, secondary,
accent, input, and radius too; omitting them would satisfy the letter of the
scenario and fail the done condition. Per instructions, the done condition is
implemented at its written strength.

## D3 — Concrete role mappings (the judgment calls)

| shadcn | ontwerp role | rationale |
|---|---|---|
| `--background` / `--foreground` | `color.surface.page` / `color.text.default` | the sheet and its ink |
| `--card` (+fg) | `color.surface.claim` / `text.default` | colour.md names claim "the card fill" |
| `--popover` (+fg) | `color.surface.warm` / `text.default` | a floating sheet is another toasted panel |
| `--primary` (+fg) | `color.surface.ink` / `text.on-ink` | primary posture = solid ink button, paper text |
| `--secondary` (+fg) | `color.surface.deep` / `text.default` | margin-strip paper for quiet controls |
| `--muted` / `--muted-foreground` | `color.surface.disabled` / `color.text.muted` | the system's quiet roles; see below |
| `--accent` (+fg) | `color.accent.soft` / `text.default` | hover highlight = soft accent wash |
| `--destructive` (+fg) | `color.destructive.base` / `text.on-ink` | danger keeps its own pigment |
| `--border` / `--input` | `color.border.default` (both) | fields share the single rule weight |
| `--ring` | `color.focus-ring` | dedicated role, never the accent by convention |
| `--radius` | `radius.none` | square-corner contract preserved |

The muted fill uses `surface.disabled` because the system ships no grey ramp:
that role *is* the faintest ink wash. It is documented in-file next to the
declaration. All references are semantic-tier, so skins cascade through the
whole crosswalk.

## D4 — Role resolution checks the built manifest, keyed by CSS name

**What:** `lintAdapterSource`/`checkAdapterOutputs` resolve every `var(--…)`
reference against `{ "--" + manifest.name → tier }`. A reference must hit a
**semantic**-tier token; primitive or component references are rejected.

**Why stronger than the task wording:** task 1.2 asks the source checks to
reject "unresolved ontwerp role references"; resolving against the current
build's manifest additionally rejects *resolvable-but-wrong-tier* references,
which is what the design means by "keep mappings expressed through ontwerp
semantic custom properties". The manifest is built moments earlier in the same
run, so this is still a source-level, pre-release check (task/spec agree once
read this way; recorded because the task worded it as a purely textual scan).

## D5 — Emission is gated on the crosswalk being present in the token tree

**What:** `runBuild` emits the adapters only when `<tokensDir>/shadcn/adapter.css`
exists; `runBuild` also accepts `adapterSourcePath` (test injection point,
mirroring `emitSkins`' `skinsPath`) so the halt path is exercised end-to-end
without mutating the canonical file.

**Why:** the crosswalk is authored as a value source under `source/values/`,
so "absent ⇒ skip" keeps foreign/test token trees building unchanged while the
real tree always gates. An unconditional repo-rooted read would have broken
every fixture-based `runBuild` test.

## D6 — Artifacts land in `dist/css/shadcn/` and assemble at `release/values/shadcn/`

**What:** generation writes `dist/css/shadcn/adapter{,.scoped}.css`;
`assembleBundle` copies that directory to `values/shadcn/` (not inside
`values/css/`). The validate CLI re-checks whatever shipped under
`dist/css/shadcn/` against the same contract plus manifest resolution.

**Why:** they ARE css values (so they live beside the other built css), but the
specs fix the consumer-facing path at `values/shadcn/`; a special-case copy
keeps both true. Double-wiring the gate (build-time on source, validate-time
on artifacts) means a stale or hand-edited bundle fails `npm run validate`
even when the source was fine.

## D7 — Build failures use a dedicated `AdapterGateError`, reported by the CLI

**What:** violations throw `AdapterGateError` with per-mapping findings;
`scripts/build.mjs` prints each finding and exits non-zero.

**Why:** reusing `BuildAborted` would print "token validation violation(s)" and
point users to `npm run validate`, which inspects *artifacts* that were never
written — the hint would lie. Naming the failing mapping at the build site is
what the build scenario requires.

## Task list vs specs

- The tasks mention no cleanup group; the change's group 3 (verification) plus
  the post-apply quality-revision pass serve that role. Nothing skipped.
- Task 1.1 says "root declarations"; the distribution spec requires both root
  and scoped forms. Implemented per the spec: declarations authored once,
  both forms generated (D1).
- No schema/token changes are involved (the crosswalk deliberately lives
  outside the DTCG tiers), so no migration or snapshot-fixture updates apply.

## Review ruling (review phase, 2026-08-25)

Each decision ruled on against the repo constitution and existing conventions —
modularity, values-only distribution, gates over conventions:

- **D1 — accept.** One `:root` canonical source with a derived scoped form is
  the same single-source discipline the scoped CSS bundles already follow; the
  byte-parity test makes the derivation enforceable rather than aspirational.
- **D2 — accept.** The 20-variable gate implements the roadmap done condition at
  written strength; `REQUIRED_SHADCN_VARS` states the contract once.
- **D3 — accept.** Every mapping is a semantic-tier reference documented beside
  its declaration, which is what distribution's "mapping decisions are
  documented" requirement asks; no grey ramp is invented.
- **D4 — accept.** Resolving against this build's manifest is strictly stronger
  than the task's textual scan and stays pre-release. Keyed by the manifest's
  kebab `name` field; the docstring's example showed the dotted `path` form and
  was corrected during review.
- **D5 — accept.** Presence-gated emission plus the `adapterSourcePath`
  injection mirror `emitSkins`' `skinsPath` pattern; fixture token trees keep
  building unchanged. The injection point is test-only by design, like its
  precedent.
- **D6 — accept.** Build output at `dist/css/shadcn/`, consumer path at
  `values/shadcn/` matches the spec's fixed bundle layout; the double-wired gate
  (build checks the source, validate re-checks the artifacts) catches stale or
  hand-edited bundles.
- **D7 — accept.** A dedicated `AdapterGateError` stops build.mjs from printing
  a "run npm run validate" hint about artifacts that were never written.

Review changes: the whole-app consumption test now pins all twenty mappings
explicitly instead of eight plus a shape regex, so any single wrong-but-
resolvable pair fails the suite; the D4 docstring was corrected. Seam audit:
every export of `shadcn-adapter.mjs` is consumed by `build.mjs`, `validate.mjs`
or `build-core.mjs` (tests aside), and the shipped pair lands in the release
bundle under `values/shadcn/`, asserted there. The roadmap entry needed no
correction; no ROADMAP-FEEDBACK.md was warranted.
