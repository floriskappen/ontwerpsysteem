# Changelog

Releases of the ontwerp design system. Each entry lists the **recipe and language
IDs** whose durable behaviour changed and a short **propagation note** — what a
consuming application must re-check after advancing its pin. Versions are semver:
**MAJOR** = breaking design/contract change, **MINOR** = additive, **PATCH** = fixes.
Exploratory (non-durable) changes do not appear here.

Entry format:

```
## <version> — <date>

### Added | Changed | Removed
- <recipe-or-language-id>: <what changed>   [**BREAKING** if it changes meaning]

**Propagation:** <what a consumer must re-check after advancing the pin>
```

## 0.1.0 — 2026-06-02

Initial release — the full accepted design language and its worked example (the zoo).

### Added
- Language: `principles`, `atmosphere`, `material`, `motion`, `colour`, `type`,
  `components`, `states`, `theming`, `anti-goals`.
- Recipes: `atmosphere.grid.breathing`, `material.surface.paper-grain`,
  `material.pigment.multiply-blot`, `motion.clock.stepped`, `motion.weather.wind`,
  `motion.weather.rain`, `state.loading.germinating`, `state.done.ripe`,
  `component.button.ink-press`, and the theme recipes.
- Built values (CSS custom properties, JS/TS, Tailwind theme, token manifest) and
  embedded fonts.

**Propagation:** first release — adopt the surface you need and record what you
adopt, adapt, or omit in your pin file (`DESIGN.md`).
