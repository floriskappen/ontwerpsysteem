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
values/          built values: css/, shadcn/, js/, tailwind/, manifest/
                 css/ carries tokens.css (:root, whole-app), fonts.css, and the
                 scoped island targets: tokens.scoped.css, components.scoped.css,
                 effects.scoped.css (all confined to the .ontwerp scope class)
                 shadcn/ carries the optional ontwerp⇄shadcn variable crosswalk
                 (adapter.css on :root, adapter.scoped.css under .ontwerp)
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
2. Copy `templates/DESIGN.md` into your app (e.g. `docs/DESIGN.md`) and fill it in,
   recording which adoption case you chose.
3. Apply the system: consume `values/`, follow `recipes/` + `language/`, use `zoo/`
   as the reference for correct results. `AGENTS.md` → "Adopting the system" is
   the full guide; the three cases in brief:
   - **Case A — whole-app**: import `values/css/tokens.css` (all token custom
     properties on `:root`) plus `values/css/components.scoped.css`,
     `values/css/effects.scoped.css`, and `values/css/fonts.css`, and put
     `class="ontwerp"` on your app's root container — the component/effect classes
     ship only in `.ontwerp`-scoped form, so tokens alone style nothing.
   - **Case B — island in a shared DOM**: import `values/css/tokens.scoped.css` +
     `values/css/components.scoped.css` + `values/css/effects.scoped.css` +
     `values/css/fonts.css` and put `class="ontwerp"` on your chrome roots only —
     never on an ancestor of a subtree that must stay neutral;
     `.ontwerp-boundary` at inner seams. shadcn-shaped chrome also imports
     `values/shadcn/adapter.scoped.css`, declared under the same `.ontwerp`
     root — never the `:root`-declared `values/shadcn/adapter.css` inside an
     island, which leaks shadcn variables into the shared document.
   - **Case C — retrofit**: importing tokens alone restyles nothing; rewrite
     component-by-component per the checklist in `AGENTS.md` (shadows → none,
     radius → 0, palette utilities → semantic roles, font → Archivo, status
     glyphs → marks/states).
   - **Boundary / skins / resets / tests**: `.ontwerp-boundary` stops the voice at
     a seam; skins apply via `.ontwerp[data-skin="<name>"]`; CSS-reset environments
     need the scoped `text-transform: inherit` counter-rule; test roles, not
     utilities — all detailed in `AGENTS.md`.
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
