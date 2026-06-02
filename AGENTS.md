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
5. **`values/`** — the built design values: CSS custom properties (`values/css/`),
   JS/TS (`values/js/`), a Tailwind theme, and the token manifest. Consume these;
   do not hardcode raw values.
6. **`fonts/`** — the self-hosted woff2 faces (also inlined in `zoo/index.html`).

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
