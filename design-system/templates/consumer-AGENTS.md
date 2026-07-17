# Agent Read Order — ontwerp design system (consumer bundle)

You are looking at a pinned release of the **ontwerp** design system, vendored into
this application (typically as a git submodule). This bundle is the design system as
consumed: everything you need to apply it, and nothing of its development machinery.

## Read in this order

1. **`brief.md`** — the core thesis (paper, ink, pigment, grain, stepped motion,
   nature as behaviour).
2. **`language/`** — concise prose for each layer: principles, atmosphere, material,
   motion, colour, type, components, states, theming, anti-goals.
3. **`recipes/`** — reusable patterns as structured JSON (stable IDs, intent, when to
   use / avoid, the source modules and values that implement them). `index.json` is
   the compiled list.
4. **`zoo/`** — the worked example. `zoo/index.html` is the rendered reference page;
   `zoo/source/` is its modular source. This is the canonical "what correct looks
   like" — read it before inventing UI.
5. **`values/`** — the built design values: CSS custom properties (`values/css/`,
   both `:root` and `.ontwerp`-scoped variants plus the scoped component/effects
   bundles), JS/TS (`values/js/`), a Tailwind theme, and the token manifest.
   Consume these; do not hardcode raw values.
6. **`fonts/`** — the self-hosted woff2 faces (also inlined in `zoo/index.html`).
   Wire them by importing `values/css/fonts.css` — its `@font-face` `src` urls
   resolve to this directory; never hand-author `@font-face` rules for the
   system's faces. Apply the voice at the scope root, never `html`/`body` — see
   `language/type.md`. `fonts/faces.json` records each face's declared weight
   range and provenance.

## Adopting the CSS: whole-app or as an island

**Whole-app** (the system owns the document): import `values/css/tokens.css` — the
token custom properties land on `:root` and apply document-wide, no scope class
needed.

**Island** (the system mounts inside a shared DOM): import the scoped targets and
apply the scope class to the island's root element. Never copy or re-scope a
shipped file by hand — the scoped files are generated from the same sources as
everything else and stay in sync on every pin advance.

```css
@import "vendor/ontwerp/values/css/tokens.scoped.css";      /* tokens under .ontwerp */
@import "vendor/ontwerp/values/css/components.scoped.css";  /* component classes, scoped */
@import "vendor/ontwerp/values/css/effects.scoped.css";     /* states, atmosphere, material, weather — scoped */
```

```html
<div class="ontwerp"> …the system applies in here, and only in here… </div>
```

### The boundary primitive — `.ontwerp-boundary`

To stop the system's inherited voice at a seam *inside* a system subtree (an
embedded third-party widget, a host-styled region), put `.ontwerp-boundary` on the
seam element. It ships in both token CSS files. It re-points the font slots
(`--font-sans`, `--font-heading`) to the consumer slot `--ontwerp-boundary-font`
(neutral system stack by default) and pins `font-family`, `text-transform`, and
`letter-spacing`. Set `--ontwerp-boundary-font` on or above the boundary element
to render the bounded subtree in your own stack instead.

### Skin overrides — the `data-skin` slot

Skins apply through one reserved selector shape:

- island: `.ontwerp[data-skin="<name>"] { --color-…: …; }` with
  `<div class="ontwerp" data-skin="<name>">`
- whole-app: `:root[data-skin="<name>"]` with the attribute on `<html>`

The override must land on the element that carries the token declarations (the
scope root) — a custom property's `var()` resolves where the property is declared.
Because the slot's selector differs from the base token block's, bundlers that
deduplicate same-selector custom-property rules cannot drop it. A second bare
scope-class rule (another `.ontwerp { … }` block) is **not a supported override
mechanism** — aggressive bundlers merge or drop same-selector custom-property
rules, so such an override can silently disappear.

### Tailwind v4

`values/tailwind/theme.css` is an *alternative* consumption path to the plain CSS
files — never import both (that would double-declare every token). Every theme
variable carries the `ontwerp` namespace segment after its Tailwind namespace
(`--color-ontwerp-paper`, `--font-ontwerp-sans`, `--button-ontwerp-text-default`),
so importing the theme can never redefine what your own `font-sans` or
`rounded-md` mean. Utilities read as `bg-ontwerp-paper`, `font-ontwerp-sans`, ….

## Rules for applying this system

- **Invent from recipes and principles, not framework defaults.** Missing components
  are derived from `recipes/` + `language/`, never from Material/Bootstrap defaults.
- **Consume semantic values.** Use the semantic/component CSS variables and tokens,
  not raw primitives.
- **Honour the anti-goals** (`language/anti-goals.md`) and reduced-motion rest states.
- **Record what you do** in this app's pin file — see `DESIGN.md` (copy the template
  from `templates/DESIGN.md`).

## Updating

This bundle is pinned to `VERSION`. To adopt a newer release, advance the pin
(`git submodule update --remote`), then read `CHANGELOG.md` for the entries between
your old and new version: each names the recipe/language IDs that changed and what to
re-check. Propagate those changes into this app's UI and update `DESIGN.md`.
