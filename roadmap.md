# Roadmap: Agent-Readable Design System Architecture

## Big Picture

The repository should become an agent-readable design language, not primarily a token
pipeline with a showcase attached.

The current zoo captures the right feeling: warm paper, ink, pigment, grain, stepped
motion, grown order, lifecycle states, and nature expressed as behaviour rather than
decoration. The restructure should preserve that direction, but make it obvious to an
agent where each part lives and how a change should propagate.

Before any destructive restructuring, preserve the current accepted zoo as a baseline.
This baseline is not the new architecture; it is the visual and behavioural source of
truth for rebuilding the system in the new architecture. If existing directories are
deleted or replaced, the accepted zoo must still be available as reference code and as a
self-contained generated artifact.

The zoo is the human-facing output. It is what Floris looks at to judge the system. It
should remain the designed, experiential reference page. But the zoo should not be one
large source blob where important atmosphere rules are hidden between markup and CSS.
The source behind the zoo should be modular, readable, and mapped to the durable design
language files that agents use when applying the system to other applications.

The target repository should answer four agent questions quickly:

1. What is the design language?
2. Where is each part implemented?
3. If I change something in the zoo, what else must be updated?
4. If I apply this to an external app, what rules and recipes should I reuse?

Screenshots are not part of the agent contract for now. The main inputs for agents should
be code and concise textual descriptions. The zoo can be opened by humans and inspected
as code by agents, but screenshot-based interpretation should not be required.

Adapters for specific frameworks, such as Flutter or Material UI, are deliberately
deferred. Agents are capable of adapting the generic system to their target environment.
The first priority is the system itself: modular source, clear language, reusable recipes,
and a propagation workflow.

## Proposed Future Shape

```text
AGENTS.md
README.md
roadmap.md

design-system/
  brief.md
  change-propagation.md

  reference/
    accepted-zoo/
      README.md
      source/
      generated/

  language/
    principles.md
    atmosphere.md
    material.md
    motion.md
    colour.md
    type.md
    components.md
    states.md
    theming.md
    anti-goals.md

  recipes/
    index.json
    atmosphere.recipes.json
    material.recipes.json
    motion.recipes.json
    component.recipes.json
    state.recipes.json
    theme.recipes.json

  source/
    zoo/
      index.mjs
      shell.mjs
      sections/
      styles/
      effects/
      data/
    values/
      tokens-or-values/

  dist/
    zoo/
    values/

openspec/
  specs/
  changes/

tools/
  build/
  validate/
```

The exact names can change during implementation. The important structure is:

- `AGENTS.md` gives the read order and repository rules for agents.
- `design-system/brief.md` is the compressed design-language summary.
- `design-system/language/` contains concise but durable prose.
- `design-system/recipes/` contains structured reusable behaviours and patterns.
- `design-system/reference/accepted-zoo/` preserves the current accepted zoo before the
  refactor, so the new architecture can be checked against it while old directories are
  replaced.
- `design-system/source/zoo/` contains modular source that generates the human zoo.
- `design-system/source/values/` contains the value layer, whether that remains DTCG
  tokens, a simpler custom format, or a hybrid.
- OpenSpec specs describe this architecture and its guarantees, not the old token-first
  worldview.

## Change 0: Preserve The Accepted Zoo Baseline

### Goal

Make it safe to delete or replace existing directories during the restructure without
losing the current zoo, which is the accepted visual and behavioural baseline.

The current zoo is in a good state visually. It should be treated as the reference used
to rebuild the system under the new structure, not as disposable generated output.

### Work

- Create `design-system/reference/accepted-zoo/`.
- Copy the current zoo source into `design-system/reference/accepted-zoo/source/`.
  At minimum this should preserve:
  - `scripts/lib/showcase-core.mjs`
  - any build code required to understand how it is assembled
  - relevant tests that describe the accepted behaviour
- Copy or generate the current self-contained zoo HTML into
  `design-system/reference/accepted-zoo/generated/index.html`.
- Add `design-system/reference/accepted-zoo/README.md` explaining:
  - this is the accepted pre-refactor baseline
  - it should not be edited as the new architecture
  - it exists so the new modular zoo can be compared against it
  - it can be deleted only after the new zoo fully replaces it and the user explicitly
    accepts the replacement
- Add a lightweight comparison check:
  - the new generated zoo must contain the same major sections and accepted concepts
    before the baseline is retired
  - visual parity is judged by Floris in the browser, not by screenshot tooling
- Do not require screenshot PNGs for agent understanding.

### OpenSpec Impact

Add this as the first change, even if it is mostly repository hygiene. It protects the
accepted design while later changes are allowed to remove or replace most existing
directories.

### Done When

- The accepted zoo exists in a committed reference location.
- The current generated HTML can be opened from the reference location without running
  the build.
- The roadmap and agent docs tell future agents not to lose or casually edit this
  baseline.

## Change 1: Reframe the Repository Contract

### Goal

Make the repository immediately understandable to agents. The first files an agent reads
should explain that this is a design-language repository whose human-facing output is the
zoo, not a generic token package.

### Work

- Add `AGENTS.md` with a strict read order:
  1. `design-system/brief.md`
  2. `design-system/change-propagation.md`
  3. relevant `design-system/language/*.md`
  4. relevant `design-system/recipes/*.json`
  5. relevant `design-system/source/zoo/**` modules
- Rewrite or replace `README.md` so it presents the repository as an agent-readable
  design system.
- Revisit `CONSTITUTION.md`. Either rewrite it around the new architecture or retire it
  if it duplicates `AGENTS.md` and `design-system/brief.md`.
- Add `design-system/brief.md` with the compact system thesis:
  - paper, ink, pigment, grain
  - physical, printed, grown, lightly weathered
  - nature as behaviour, not illustration
  - stepped motion, deterministic ambience, lifecycle states
  - the zoo is the human-facing output
- Add `design-system/change-propagation.md` explaining how agents should handle changes:
  - if zoo source changes, update language/recipes/values when the change is durable
  - if a value changes, regenerate the zoo
  - if a recipe changes, update examples/tests that exercise it
  - if a one-off zoo experiment is not yet durable, mark it as exploratory
- Update OpenSpec specs to describe the new contract.

### OpenSpec Impact

This probably needs a new capability such as `agent-contract` or `repository-contract`.
It may also require modifying or replacing the existing `repo-structure` and
`showcase` specs, because their current framing is too token-pipeline-oriented.

### Done When

- A new agent can read `AGENTS.md` and know exactly where to look.
- The repo no longer introduces itself as primarily a token pipeline.
- The zoo's role is clear: human-facing output generated from modular source.

## Change 2: Modularize the Zoo Source

### Goal

Split the current large `scripts/lib/showcase-core.mjs` into readable modules that mirror
the design system's actual parts. Important atmosphere and motion rules should no longer
be hidden inside one large file.

### Work

- Move zoo generation into `design-system/source/zoo/`.
- Split markup by section:
  - `sections/masthead.mjs`
  - `sections/palette.mjs`
  - `sections/type.mjs`
  - `sections/components.mjs`
  - `sections/states.mjs`
  - `sections/weather.mjs`
  - `sections/colophon.mjs`
- Split style source by system layer:
  - `styles/base.css`
  - `styles/atmosphere.css`
  - `styles/material.css`
  - `styles/type.css`
  - `styles/components.css`
  - `styles/states.css`
  - `styles/weather.css`
  - `styles/themes.css`
  - `styles/responsive.css`
- Split generated effects into readable modules:
  - `effects/grid.mjs`
  - `effects/phyllotaxis.mjs`
  - `effects/weather-particles.mjs`
  - `effects/pigment.mjs`
  - `effects/lifecycle.mjs`
  - `effects/deterministic-random.mjs`
- Keep the generated zoo as a single self-contained HTML file.
- Keep deterministic output and no network requests.
- Keep reduced-motion handling explicit and test-covered.
- Preserve the current visual result as closely as possible.

### OpenSpec Impact

Modify the `showcase` spec so it no longer only says "generated from built outputs".
It should say the zoo is generated from modular design-system source and value outputs.
The spec should require that durable visual concepts are discoverable by module, not
only by reading one full generated file.

### Done When

- The zoo still looks and behaves like the current accepted version.
- An agent can work on "motion", "weather", "states", or "components" without reading
  the whole zoo source.
- Tests prove the generated HTML is deterministic and self-contained.

## Change 3: Extract Language And Recipes From The Zoo

### Goal

Turn the accepted zoo decisions into explicit design-language files and structured
recipes. This gives agents a compact way to understand and reuse the atmosphere without
reverse-engineering it from CSS.

### Work

- Create concise language files:
  - `language/principles.md`: the core thesis and hierarchy of importance.
  - `language/atmosphere.md`: grain, bloom, ambience, never-perfect-stillness.
  - `language/material.md`: paper tooth, ink, pigment, multiply, soft bleed.
  - `language/motion.md`: stepped clock, deterministic particles, rest poses.
  - `language/colour.md`: paper/ink/accent, role swapping, pigment behaviour.
  - `language/type.md`: Archivo, JetBrains Mono, Caveat figures, lowercase voice.
  - `language/components.md`: square controls, heavy bottom edge, halftone, fields.
  - `language/states.md`: fallow, germinating, ripe, rising.
  - `language/theming.md`: skins change colour roles only.
  - `language/anti-goals.md`: no generic Material defaults, no decorative nature
    stickers, no smooth app-store motion, no green-tick status language.
- Create recipe JSON files with stable IDs, for example:
  - `atmosphere.grid.breathing`
  - `material.surface.paper-grain`
  - `material.pigment.multiply-blot`
  - `motion.clock.stepped`
  - `motion.weather.wind`
  - `motion.weather.rain`
  - `state.loading.germinating`
  - `state.done.ripe`
  - `component.button.ink-press`
- Each recipe should include:
  - `intent`
  - `useWhen`
  - `avoid`
  - `sourceModules`
  - `valueRefs`
  - `reducedMotion`
  - `notes`
- Add tests or validation that every recipe's `sourceModules` references existing files.
- Add tests or validation that every major zoo section links back to a language or recipe
  entry.

### OpenSpec Impact

Add a new capability such as `design-language` or `recipes`. This is the core change
that makes the repo useful for agents beyond this one zoo page.

### Done When

- The current zoo's important atmosphere decisions are represented in language/recipes.
- An agent can search a recipe ID and find the source module that implements it.
- Missing UI can be invented from recipes without copying arbitrary CSS blobs.

## Change 4: Decide And Rebuild The Value Layer

### Goal

Decide whether to keep DTCG tokens, simplify them, or replace them with a custom
value format that better fits this design system.

The decision should be pragmatic. Tokens are useful for exact values and consumer-facing
CSS variables. But if DTCG makes the architecture harder to understand, we should not
preserve it just because it exists.

### Options

#### Option A: Keep DTCG Tokens As The Value API

Keep `primitive / semantic / component` tokens, but make them subordinate to the design
language. Improve the manifest so it carries useful `$extensions`, descriptions, and
links to recipes.

Best if we still want standards-friendly CSS/JS/Tailwind outputs.

#### Option B: Replace Tokens With Simpler Values

Create a custom `values/*.json` format with exactly the concepts this system needs:
colour roles, typography, spacing, surfaces, motion clocks, recipes, and component
values. Build CSS variables from that.

Best if DTCG tiering feels like unnecessary conceptual overhead.

#### Option C: Hybrid

Keep DTCG for simple values, and use recipes/language for everything DTCG cannot model:
stepped timing, texture, grain, lifecycle states, and atmosphere.

This is probably the safest first target unless we discover the DTCG rules are actively
blocking clarity.

### Work

- Audit current tokens for stale concepts from older zoo versions:
  - margin rule
  - claimed cell
  - bloom-only primitives
  - flattened fluid type descriptions
- Decide what remains durable and what becomes recipe/source-only.
- If keeping tokens:
  - emit `$extensions` in the manifest
  - preserve useful descriptions
  - consider keeping aliases in CSS where live theming needs them
  - solve or document non-DTCG values such as stepped timing and fluid type
- If replacing tokens:
  - write the new values schema
  - write a new build output for CSS variables and JS values
  - migrate current values into the simpler format
- Update tests and specs around the chosen value model.

### OpenSpec Impact

This may remove or heavily rewrite `token-format` and `build-pipeline`. That is okay.
The old specs describe the current machinery, not a permanent obligation. If the new
architecture needs a `value-format` capability instead of `token-format`, make that
change explicitly.

### Done When

- Values are easy for agents to find, read, and use.
- The zoo can be generated from the chosen value layer.
- The value layer supports theme role swapping clearly.
- The architecture does not force atmosphere into tokens where it does not belong.

## Change 5: Add Propagation Validation

### Goal

Make it hard for agents to change one layer and forget the matching layer.

If an agent changes the zoo source, the repository should make clear whether the change
is exploratory or durable. Durable changes should be reflected in language, recipes,
values, and tests as appropriate.

### Work

- Add validation for recipe source references.
- Add validation for recipe value references.
- Add validation that major zoo modules declare which recipes they implement.
- Add a small change checklist, probably in `design-system/change-propagation.md`, that
  agents follow before finishing:
  - Did the zoo visual source change?
  - Is this an experiment or a durable design-system change?
  - If durable, did language/recipes/values update?
  - Did tests cover the changed behaviour?
  - Does reduced motion still have a deliberate rest state?
- Consider adding frontmatter or exported metadata in zoo modules:

```js
export const implementsRecipes = [
  "motion.clock.stepped",
  "material.surface.paper-grain"
];
```

### OpenSpec Impact

Add or modify a capability such as `design-language-validation` or `propagation`.

### Done When

- Agents have a mechanical checklist for propagation.
- Validation catches broken recipe/source/value references.
- Important atmosphere changes are unlikely to remain hidden in only one file.

## Change 6: Reconcile OpenSpec Around The New Architecture

### Goal

Clean up OpenSpec so it describes the new repository truth instead of preserving old
assumptions.

### Work

- Review existing specs:
  - `repo-structure`
  - `token-format`
  - `build-pipeline`
  - `showcase`
- Decide which specs survive, which are renamed, and which are replaced.
- Likely future specs:
  - `agent-contract`
  - `design-language`
  - `recipe-format`
  - `value-format`
  - `zoo-generation`
  - `propagation-validation`
- Archive or supersede old specs that imply:
  - tokens are the primary product
  - the zoo only renders from built token outputs
  - DTCG is mandatory even if the new value layer changes
- Keep OpenSpec for architecture and workflow. Do not use it to over-spec every visual
  taste decision. Taste lives in language files, recipes, source, and the zoo.

### Done When

- `openspec validate --all --strict` passes.
- Specs match the repository's actual architecture.
- There are no contradictory instructions between OpenSpec, `AGENTS.md`, and
  `design-system/`.

## Change 7: Optional Consumer Guidance Later

### Goal

Only after the core system is clear, consider whether the repo needs optional guidance
for external application contexts.

### Work

- Decide whether platform-specific notes are useful.
- If they are, keep them lightweight and generic.
- Avoid building full adapters too early. Agents should adapt the system using the
  language, recipes, values, and source modules.

### Done When

- Either the repo deliberately has no adapters, or it has small optional notes that do
  not distract from the generic design system.

## Suggested Change Order

0. **Preserve The Accepted Zoo Baseline**
1. **Reframe the Repository Contract**
2. **Modularize the Zoo Source**
3. **Extract Language And Recipes From The Zoo**
4. **Decide And Rebuild The Value Layer**
5. **Add Propagation Validation**
6. **Reconcile OpenSpec Around The New Architecture**
7. **Optional Consumer Guidance Later**

The baseline preservation change should happen before any destructive refactor. After
that, the next three changes should probably happen before any major value-layer
decision. They make the current accepted zoo understandable. Once that is done, the
token question will be easier to answer because we can see exactly what the value layer
needs to serve.

## Non-Negotiables

- The current zoo direction is the accepted visual baseline.
- The current zoo must be preserved before deleting or replacing existing directories.
- The zoo is the human-facing output.
- Agents should not need screenshots to understand the system.
- The source must be modular enough that atmosphere, motion, material, type, components,
  states, and theming are separately discoverable.
- Atmosphere is first-class, not decoration.
- Nature is expressed through behaviour, material, rhythm, and growth logic, not through
  generic illustrative motifs.
- Missing components should be invented from recipes and principles, not from framework
  defaults.
- The architecture may replace existing token/spec assumptions if they obscure the goal.
