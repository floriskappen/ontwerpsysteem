# ontwerpsysteem

A vendor-neutral, agent-readable design system codebase.

This repository is structured to be an agent-readable design language system, where design principles, interactive recipes, source modules, and design values (tokens) are clearly separated and validated.

## Key entry point

If you are an AI agent, you **MUST** start by reading:
- **[AGENTS.md](file:///Users/kade/git/personal/ontwerpsysteem/AGENTS.md)**: Outlines the reading path and rules of the repository.
- **[design-system/brief.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/brief.md)**: Summarizes the visual thesis (paper, ink, pigment, stepped motion).
- **[design-system/change-propagation.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/change-propagation.md)**: Governs how updates propagate.

> **If you were asked to "integrate this design system" into another repository**, you are working in a *consuming* app, not this repo. Jump straight to **[Integrating this design system into your app](#integrating-this-design-system-into-your-app)** and follow Case 1.

## Repository Layout

- `design-system/brief.md`: Compressed system thesis.
- `design-system/change-propagation.md`: Workflow checklist for agents.
- `design-system/language/`: Readable design principles (prose).
- `design-system/recipes/`: Reusable behaviors (JSON).
- `design-system/source/zoo/`: Modular showcase source files.
- `design-system/source/values/`: Design tokens / value files.
- `design-system/reference/accepted-zoo/`: Pre-refactor visual baseline.
- `design-system/templates/`: Consumer-facing templates (consumer `AGENTS.md`, consumer `README.md`, the `DESIGN.md` pin file).
- `design-system/VERSION` + `CHANGELOG.md`: The released version (semver) and the per-release change log keyed to recipe/language IDs.
- `design-system/dist/release/`: The assembled consumer bundle (generated; published to the `release` branch).
- `openspec/`: OpenSpec workflow change logs and capability specifications.

## Developer Workflows

### Setup
Ensure you have Node.js installed, then install dependencies:
```bash
npm install
```

### Validate
Runs the full validation suite (JSON Schemas, naming grammar, tier referencing, and cross-layer recipe references):
```bash
npm run validate
```

### Build
Runs the Style Dictionary build and compiles the showcase "zoo":
```bash
npm run build
```

### Test
Runs integration tests:
```bash
npm run test
```

## Integrating this design system into your app

Consuming apps do **not** clone or vendor this whole dev repo. They consume a **pinned release**: a self-contained, agent-readable bundle published to the **`release` branch** (and version tags). The bundle contains built values + fonts, `language/`, `recipes/`, the zoo as a worked example, a consumer `AGENTS.md`, a `DESIGN.md` pin-file template, `VERSION`, and `CHANGELOG.md` — and nothing else (no build tooling, tests, or openspec).

The bundle is the source of truth once vendored: start from `vendor/ontwerp/AGENTS.md` inside it.

### Case 1 — Set it up in an existing repo (one-time)

This is what to do when asked to "integrate this design system into our repo".

1. **Add the design system as a submodule, pinned to a release:**
   ```bash
   git submodule add -b release <this-repo-url> vendor/ontwerp
   cd vendor/ontwerp && git checkout <latest-tag>   # e.g. v0.1.0 — pin to an exact release
   cd ../..
   ```
2. **Create the pin file** from the shipped template:
   ```bash
   mkdir -p .design && cp vendor/ontwerp/templates/DESIGN.md .design/DESIGN.md
   ```
   Fill in the pinned version + submodule commit. You will keep this current.
3. **Wire the value layer** into your build (pick what fits your stack):
   - CSS variables: import `vendor/ontwerp/values/css/tokens.css`
   - Tailwind v4: `@import "vendor/ontwerp/values/tailwind/theme.css";`
   - JS/TS: import tokens from `vendor/ontwerp/values/js/tokens.js`
   - Fonts: serve `vendor/ontwerp/fonts/*.woff2` (or lift the `@font-face` rules from `vendor/ontwerp/zoo/index.html`)
4. **Tell your app's agents about it.** Add this to your repo's own `AGENTS.md` / `CLAUDE.md`:
   > **Design authority:** `vendor/ontwerp/` (pinned — see `.design/DESIGN.md`). For ANY UI work, read `vendor/ontwerp/AGENTS.md` first, then its `language/` and `recipes/`, and use `vendor/ontwerp/zoo/` as the worked example. Consume `vendor/ontwerp/values/` — never hardcode colours/spacing/type/motion. Record adopted parts and any deviations in `.design/DESIGN.md`.
5. **Apply the system to existing UI:** read the bundle, reskin the app's components from its values/recipes/principles, and record what you adopted / adapted / omitted in `.design/DESIGN.md`.

### Case 2 — Build new UI in the consuming repo

No design-system change — this is pure consumption. Before writing any UI:

1. Read `vendor/ontwerp/AGENTS.md`, then the relevant `language/` and `recipes/`, using `vendor/ontwerp/zoo/` as the reference for what "correct" looks like.
2. Build from **recipes and principles, not framework defaults**; consume `values/` for every value.
3. If you need UI the system doesn't cover, invent it from the recipes/principles and log it under **Extended** in `.design/DESIGN.md` (note which recipes it follows).

The pin does not move — you build against the version you already adopted.

### Case 3 — Adopt a design-system update (propagation)

1. **Advance the pin** to a chosen release and see what you crossed:
   ```bash
   cd vendor/ontwerp
   git fetch && git checkout <new-tag>          # or: git submodule update --remote
   git log --oneline <old-tag>..<new-tag>       # one commit per release
   cd ../..
   ```
2. **Read `vendor/ontwerp/CHANGELOG.md`** for the entries between your old and new version. Each entry names the **recipe/language IDs** that changed and a **propagation note** — what to re-check.
3. For each entry, read the *current* recipe/language for the named IDs and **apply the change** wherever those IDs are used in your app. Value changes (a token's value) mostly flow in on rebuild; behavioural/recipe changes need to be re-applied. Entries marked **BREAKING** are where you slow down.
4. **Update `.design/DESIGN.md`**: bump the pinned version/commit and append a line to its propagation log. Commit the submodule bump together with the app changes.

> Nothing auto-notifies your app that a release exists — Case 3 starts with a deliberate fetch/checkout. A small `make sync` (bump pin + print the changelog slice) per consuming repo is a convenient wrapper.

## Releasing (maintainers of this repo)

Cut a release of the consumer bundle — semver, **agent-drafts / human-approves**:
```bash
npm run release                      # draft: proposed version + changelog from touched recipe/language IDs
npm run release -- --write           # apply the draft, then edit CHANGELOG.md (per-ID + propagation note)
npm run release -- --publish         # ship the bundle to the `release` branch + tag (no push)
git push origin release <tag>        # publish to the remote consumers pull from
```
The build assembles the bundle under `design-system/dist/release/` on every `npm run build`; `release --publish` is what commits it to the `release` branch. See `design-system/change-propagation.md` → "Releasing to consumers".
