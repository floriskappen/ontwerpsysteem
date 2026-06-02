## Context

The repo is built to be agent-readable, but the prescribed reading path (AGENTS.md → brief → change-propagation → language → recipes → source/zoo → source/values) covers only `design-system/`. The rest — `scripts/`, `test/`, `openspec/`, the `.claude`/`.codex`/`.agents` tooling, and the ~2.2k-line accepted-zoo baseline — is dev machinery a consuming app never reads. By line count the consumer-relevant surface (~1.9k lines) is a minority of the repo, dominated by machinery and the regression baseline. So a consuming app should receive a distilled bundle, not the whole repo.

Consumption is two distinct layers with opposite update costs: **values** (CSS vars / manifest) update mechanically; **language + recipes** applied to bespoke app UI require interpretive, agent-driven propagation. The hard part is the second layer.

## Goals / Non-Goals

**Goals:**
- A clean, self-contained consumer bundle assembled by the build, readable without tooling.
- Pinning + propagation that gives a consuming agent a high-signal "what changed" slice, not noisy commit history.
- Submodule ergonomics (local content, automatic exact pin) without dragging dev machinery into every consumer.
- A release flow where the agent drafts version + changelog and a human approves.

**Non-Goals:**
- Publishing to a package registry (npm) — deferred; the same artifact can publish later if wanted.
- Framework adapters (Flutter, Material UI) — still deferred per the roadmap.
- Changing token names, the token format, naming grammar, or existing `dist/` outputs.
- Automatic, unattended publishing.

## Decisions

**1. Slim bundle, not a whole-repo submodule.** Vendor only the consumer surface. Rationale: the dev machinery and the regression baseline are larger than the design itself and invite a consuming agent to run builds or edit the baseline. *Alternative — whole-repo submodule:* simplest to wire, but drags ~2x irrelevant content and muddies the consumer's mental model. Rejected.

**2. Publish to a dedicated `release` branch (+ tags), assembled into `design-system/dist/release/` first.** Consumers add the `release` branch as a submodule pinned to a release commit/tag. Rationale: keeps the submodule ergonomics the user wanted (local, auto-pinned) while the submodule contents are 100% relevant. The `release` branch is one-commit-per-release, so the submodule's `git log <pin>..HEAD` is already the curated change list — this is *why* we don't parse `main`'s noisy history. *Alternatives:* registry package (deferred, decision #1 of the ff questions chose release-branch); on-demand fetch without vendoring (loses offline/local guarantee).

**3. Propagation is driven by an ID-keyed `CHANGELOG`, not a raw diff.** Each release entry names the recipe/language IDs that changed plus a propagation note, and marks breaking vs additive. The consuming agent reads the changelog slice, then reads the *current* recipe/language for those IDs to get full intent. Rationale: applying a design change to bespoke code is judgment, fed best by intent + IDs, not a CSS diff.

**4. Changelog is drafted from `implementsRecipes` + durable-change metadata, human-approved.** The release step diffs touched recipe/language IDs since the last release (the repo already tracks `implementsRecipes` and durable-vs-exploratory) to draft entries; a human edits and approves before publish. Rationale: closes the loop with existing propagation-validation; keeps a human gate on the external contract. *Alternative — fully automated:* rejected in the ff questions (no gate on a load-bearing external surface).

**5. Bundle includes the zoo source + rendered `index.html`.** Rationale: the zoo is the single most useful artifact for an agent applying the design — a correct, worked reference implementation. Costs ~1.2k lines of bundle size; worth it. The accepted-zoo baseline stays out (internal regression anchor only).

**6. Consumer pin file records decisions and deviations, not an element catalogue.** The consuming agent maintains a small pin file (version + SHA, adopted parts, and adapted/omitted/extended by exception). Rationale: exhaustive per-element conformance notes rot instantly in UI-heavy apps; the design system's own recipes/zoo are the conformance reference, so only deviations need recording.

## Risks / Trade-offs

- **Submodule friction** (detached HEAD, `--recurse-submodules`, CI) → document a one-line `sync` convention (`git submodule update --remote` + show changelog slice); the slim, relevant bundle reduces the temptation to poke at it.
- **`release` branch commits built artifacts**, in tension with "outputs aren't committed" → resolved by the `repo-structure` delta: the working tree on `main` stays clean; the `release` branch is the sanctioned distribution channel.
- **Changelog drift / under-curation** (durable change ships with no entry) → seed drafts mechanically from touched recipe/language IDs so the default is an entry, not silence; the human gate catches the rest.
- **Bundle/source divergence** (bundle stale vs `main`) → bundle is always build-assembled and deterministic, never hand-edited; releasing always re-assembles.
- **Two reading orders to maintain** (dev AGENTS.md vs consumer AGENTS.md) → keep the consumer AGENTS.md generated or templated from the same source so they don't drift.

## Migration Plan

Additive; nothing to migrate. Land the assembly step + `VERSION`/`CHANGELOG` + release script, cut `v0`/initial release to seed the `release` branch, then document the consumer submodule + pin-file convention. Existing consumers (none yet) unaffected. Rollback = stop publishing; `main` is untouched.

## Resolved Decisions

- **Versioning: semver** (`MAJOR.MINOR.PATCH`). Pairs with the changelog's breaking/additive marker; MAJOR = breaking design/contract change, MINOR = additive, PATCH = fixes. Seed `0.1.0`.
- **Templates ship in this repo.** The consumer `AGENTS.md` and the pin-file (`DESIGN.md`) template live under `design-system/templates/`; the build copies the consumer `AGENTS.md` into the bundle, and the pin-file template ships in the bundle for consumers to copy.

## Open Questions

- Exact bundle path/branch names (`dist/release/`, branch `release`, tag prefix `v`) — cosmetic, settle in implementation.
