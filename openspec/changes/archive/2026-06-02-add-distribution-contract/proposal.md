## Why

Downstream applications need to consume this design system at a pinned version and later pull updates, propagating durable visual changes into their own bespoke UI. Today there is no consumable artifact, no version, and no curated record of what changed between versions — a consuming agent would have to vendor the whole dev repo (build tooling, tests, openspec workflow, the 2.2k-line regression baseline) and reverse-engineer changes from noisy commit history.

## What Changes

- Add a **consumer bundle**: a clean, self-contained, agent-readable surface assembled by the build — built values + fonts, `language/`, `recipes/`, the zoo source and rendered `index.html` as the canonical worked example, a consumer-oriented `AGENTS.md`, plus `VERSION` and `CHANGELOG.md`. It deliberately excludes dev machinery (scripts, tests, openspec, the accepted-zoo baseline).
- Publish the bundle to a dedicated **`release` branch** (and matching tags) in this repo, so consuming apps add it as a **git submodule** pinned to an exact release. Each commit on `release` is one release, so the submodule's `git log <pinned>..HEAD` is already a clean change list.
- Add **versioning + a curated `CHANGELOG.md`** keyed to recipe/language IDs with per-entry propagation notes. Cutting a release is an **agent-drafts / you-approve** step: it bumps `VERSION` and drafts changelog entries from the touched recipe/language IDs; a human reviews before publish.
- Define the **consumer-side pin file** contract (e.g. `.design/DESIGN.md`) that the consuming app's agent maintains: pinned version + SHA, what was adopted, and — recorded by deviation, not exhaustively — what was adapted, omitted, or extended.
- This is **machinery, not content** and is **additive** — no token names, formats, or existing build outputs change. No breaking changes to the consumer token contract.

## Capabilities

### New Capabilities
- `distribution`: the consumer bundle (contents + self-containment), the `release`-branch/tag publishing channel, versioning + the ID-keyed `CHANGELOG`, the agent-drafts/you-approve release workflow, and the consumer-side pin-file contract.

### Modified Capabilities
- `build-pipeline`: the build additionally assembles the consumer bundle from built outputs + the durable design surface into a release directory.
- `repo-structure`: clarify that generated outputs stay uncommitted on `main`, with the dedicated `release` branch as the sole sanctioned home for committed, published build artifacts.

## Impact

- Build tooling (`scripts/`): a release-assembly step and a `release`/version script; new npm script (e.g. `release`).
- New repo artifacts: `release` branch + tags, `design-system/VERSION`, `CHANGELOG.md`.
- Consuming repos: a submodule pointing at `release`, a `sync` convention (`git submodule update --remote` + show the changelog slice), and a maintained pin file.
- No change to token sources, token format, naming grammar, or existing `dist/` outputs.
