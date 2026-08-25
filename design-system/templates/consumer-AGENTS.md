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
   bundles), the shadcn crosswalk (`values/shadcn/`, root + scoped), JS/TS
   (`values/js/`), a Tailwind theme, and the token manifest.
   Consume these; do not hardcode raw values.
6. **`fonts/`** — the self-hosted woff2 faces (also inlined in `zoo/index.html`).
   Wire them by importing `values/css/fonts.css` — its `@font-face` `src` urls
   resolve to this directory; never hand-author `@font-face` rules for the
   system's faces. Apply the voice at the scope root, never `html`/`body` — see
   `language/type.md`. `fonts/faces.json` records each face's declared weight
   range and provenance.

## Adopting the system — three cases

Pick the case that matches how the system enters your DOM. All three consume the same shipped
files — nothing is ever copied or re-scoped by hand.

### Case A — whole-app

The system owns the document. Import `values/css/tokens.css`: token custom properties land on
`:root` and apply document-wide, no scope class needed. If the page also hosts content outside the
system, keep the voice off `html`/`body` (set it on your app's root container instead) and use the
boundary primitive below on the seams — same rules as Case B, just one scope.

### Case B — island / partial adoption

The system mounts inside a shared DOM (tool chrome inside someone else's app). Import the scoped
targets and put the scope class on your chrome's root elements:

```css
@import "vendor/ontwerp/values/css/tokens.scoped.css";      /* tokens under .ontwerp */
@import "vendor/ontwerp/values/css/components.scoped.css";  /* component classes, scoped */
@import "vendor/ontwerp/values/css/effects.scoped.css";     /* states, atmosphere, material, weather — scoped */
@import "vendor/ontwerp/values/css/fonts.css";              /* @font-face wiring for the faces */
```

```html
<div class="ontwerp"> …the system applies in here, and only in here… </div>
```

The seam rules that make islands safe:

- **Scope on your chrome roots only — never on an ancestor of a subtree that must stay neutral.**
  A scope class on `<body>` or a top-of-page wrapper cascades tokens and voice into embedded
  widgets, host-styled regions, everything. Scope tightly enough that excluded subtrees are *not*
  descendants of a scope root.
- **Set the voice at the scope root** — families and inherited properties (`text-transform`,
  `letter-spacing`) there, never on `html` or `body`. See `language/type.md`.
- **`.ontwerp-boundary` stops the voice at inner seams.** An embedded third-party widget inside an
  otherwise-scoped region gets `.ontwerp-boundary` on its seam element: it re-points the font slots
  (`--font-sans`, `--font-heading`) to the consumer slot `--ontwerp-boundary-font` (neutral system
  stack by default) and pins `font-family`, `text-transform`, and `letter-spacing`.
- **Skins apply through the reserved slot**: `.ontwerp[data-skin="<name>"]` (see below).
- **shadcn/Tailwind chrome?** Import `values/shadcn/adapter.css` (or `adapter.scoped.css` for the
  scoped form) beside the token CSS — the standard shadcn variables map onto ontwerp roles with no
  hand-written crosswalk.

### Case C — retrofit of an existing app

Be honest about what this is: **importing tokens alone changes nothing about existing UI.** There
is no global switch that reskins hardcoded utilities; adoption is a component-by-component rewrite
of your chrome onto the system's values. The migration checklist, applied per component:

| From (typical legacy styling) | To (system equivalent) |
|---|---|
| shadows → none | elevation is ink-on-paper; depth comes from borders and fills |
| radius → 0 (`--radius-none`) | square corners everywhere; chips may use `--radius-chip` |
| palette utilities → semantic roles | `bg-stone-100` → `var(--color-surface-warm)`-class roles, never raw hex |
| font stack → Archivo | wire `values/css/fonts.css`, set the voice at the scope root |
| status glyphs → marks/states | ✓/✗/spinners become status marks and lifecycle states (`state.mark.*`) |

Transitions follow the motion language: stepped timings with reduced-motion rest states, not
smooth easings. If your existing chrome is shadcn-shaped, the adapter (Case B's last bullet) does
most of the palette mapping for you — start there, then rewrite component classes.

### CSS resets (Tailwind Preflight and friends)

The system's typographic voice assumes CSS inheritance on a no-reset baseline — that is how the
lowercase voice reaches buttons and labels at all. A reset breaks the chain: Preflight pins
`button, select { text-transform: none }`, so every control outside the `.btn` class renders its
label in source casing. Inside a scope, restore inheritance with the counter-rule:

```css
.ontwerp button, .ontwerp select { text-transform: inherit }
```

(Whole-app: same selectors against your root.) Anything else a reset flattens — list markers,
border styles — re-asserts the same way, scoped inside the system's region.

### Testing the system in your app

Write consumer tests against **semantic roles and structure, never raw presentation**: assert that
a status mark exists, that danger renders as a rule of the destructive role, that focus claims the
border — not that an element carries `bg-stone-800` or prints `✓`. Palette class names and glyphs
are implementation details the system is free to change (a skin swap changes both); role-level
assertions survive reskins untouched.

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

### Theming is light-only

Every skin is a light paper surface: skins vary hue and role assignment, never
lightness polarity. There is no dark mode by design — the grain/multiply/ink
material language needs a light ground (`language/theming.md`,
`language/anti-goals.md`). If your application ships its own `.dark` theme,
pick one of the two supported responses: keep this system's chrome on its
light paper while your surfaces switch, or omit the system from those
dark-mode surfaces. Do not author a dark skin, and do not wait for one.

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
