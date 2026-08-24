# ontwerp design system — consumer bundle

This is a pinned release of the **ontwerp** design system: a self-contained,
agent-readable surface for applying the system to an application. It contains no
build tooling — read it, don't build it. Start with **`AGENTS.md`**.

## Contents

```
AGENTS.md        reading order for an agent applying the system
brief.md         core thesis
language/        concise prose per layer
recipes/         reusable patterns (JSON) + index.json
zoo/             worked example: index.html (rendered) + source/
values/          built values: css/, js/, tailwind/, manifest/
                 css/ carries tokens.css (:root, whole-app) and the scoped
                 island targets: tokens.scoped.css, components.scoped.css,
                 effects.scoped.css (all confined to the .ontwerp scope class)
fonts/           self-hosted woff2 faces
templates/       DESIGN.md — copy into your app as the pin file
VERSION          this release's semver
CHANGELOG.md     per-release changes, keyed to recipe/language IDs
```

## Use it

1. Vendor this bundle into your app, pinned to a release — recommended as a git
   submodule of the design system's `release` branch fixed to a release tag/commit:
   ```bash
   git submodule add -b release <design-system-repo-url> vendor/ontwerp
   cd vendor/ontwerp && git checkout v<version>   # pin to an exact release
   ```
2. Copy `templates/DESIGN.md` into your app (e.g. `docs/DESIGN.md`) and fill it in.
3. Apply the system: consume `values/`, follow `recipes/` + `language/`, use `zoo/`
   as the reference for correct results.
   - **Whole-app**: import `values/css/tokens.css` (tokens on `:root`, no scope
     class needed).
   - **Island in a shared DOM**: import `values/css/tokens.scoped.css` +
     `components.scoped.css` + `effects.scoped.css` and put `class="ontwerp"` on
     the island root — never copy or re-scope shipped files by hand.
   - **Boundary**: `.ontwerp-boundary` on a descendant seam stops the system's
     voice there; set `--ontwerp-boundary-font` to choose the bounded font.
   - **Skins**: override colour roles on `.ontwerp[data-skin="<name>"]` (island)
     or `:root[data-skin="<name>"]` (whole-app). A second bare `.ontwerp { … }`
     rule is not a supported override mechanism — bundlers may dedupe it away.
   - **Theming is light-only**: every skin is a light paper; skins vary hue,
     never lightness polarity, and there is no dark mode by design. If your app
     has its own `.dark` theme, keep this system's chrome light or leave the
     system off those surfaces (see `language/theming.md`).

## Update it (propagation)

```bash
git submodule update --remote vendor/ontwerp     # move toward the latest release
cd vendor/ontwerp && git log --oneline <old>..HEAD   # the releases you crossed
```

Each release on this branch is one commit; read the matching `CHANGELOG.md` entries
between your old and new version. Every entry names the recipe/language IDs that
changed and what to re-check. Propagate those into your UI, pin to the new release,
and update your `DESIGN.md`.
