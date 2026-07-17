# Design System Struggles

A running log of friction encountered while integrating the **ontwerp** design system
(`git@github.com:floriskappen/ontwerpsysteem.git`, pinned `v0.1.1`) into de-ontwerper.
Purpose: feed concrete, real-world consumer pain back into a future version of the design
system. Each entry: what I hit → why it was friction → what the design system could do to
fix it.

Scope note: this app integrates the system **only into its own tool UI (chrome)** — the
launcher, project view, canvas chrome, agent panel — and deliberately **not** into the
prototypes the agent generates (those keep the neutral shadcn baseline).

---

## Phase 0 — Analysis / onboarding

### S1. No guidance for coexisting with a sandboxed component kit in the same DOM
- **Hit:** This app renders user-generated prototypes (shadcn baseline) in the *same DOM*
  as the tool chrome. The design system's integration guide (Case 1/2) assumes you are
  reskinning the *whole* app and says to wire the value layer at the root and consume its
  tokens everywhere. It has no story for "apply me to part of the app and explicitly keep
  me out of another part."
- **Why friction:** The naive instruction — import `values/css/tokens.css` and set the page
  to paper/ink — would bleed paper backgrounds, Archivo, and square corners into every
  prototype tile via the cascade (fonts especially). The whole value of the prototypes is
  that they look like a *neutral* baseline, not like this design system.
- **DS could fix:** Ship a scoping convention — e.g. all consumer-facing rules scoped under
  a `.ontwerp` root class / `[data-ontwerp]` attribute instead of bare `:root`, plus a
  documented "reset boundary" recipe for excluding subtrees (font-family, color, the
  ambient layers). A short "partial adoption / island" section in the consumer AGENTS.md.

### S2. Token namespace collides conceptually with shadcn but doesn't map to it
- **Hit:** The app is shadcn/Tailwind v4. shadcn's semantic vars are `--background`,
  `--foreground`, `--primary`, `--card`, `--border`, `--ring`, `--muted`, etc. The design
  system ships its own semantic names: `--color-surface-page`, `--color-text-default`,
  `--color-accent-base`, `--color-border-default`, etc. There is no provided crosswalk.
- **Why friction:** To reskin shadcn-shaped chrome I have to hand-author a mapping from DS
  roles → shadcn roles (and decide what `--ring`, `--destructive`, `--muted-foreground`
  become — the DS has one accent (toasted red) that doubles as both "accent" and the only
  warm hue, and no dedicated destructive/success/ring roles).
- **DS could fix:** Ship an optional `values/shadcn/` adapter (a `:root` block mapping DS
  semantic tokens onto the shadcn variable contract), or at least document the intended
  mapping. Define roles for focus-ring, destructive, and disabled explicitly.

### S3. The chrome isn't token-driven, so "wire the value layer" doesn't reskin anything
- **Hit:** The integration guide frames adoption as "import tokens, consume them." But this
  app's chrome uses *hardcoded* palette utilities (`bg-stone-100`, `text-stone-500`,
  `border-stone-200`, `rounded-md`, `shadow-lg`). Importing tokens changes nothing on its
  own; every chrome component has to be manually rewritten.
- **Why friction:** The real work is a per-component className rewrite, not a build wiring
  step. The guide undersells this; a newcomer would import the theme, see no change, and be
  confused.
- **DS could fix:** Be explicit that adoption on an existing app = a component-by-component
  reskin, and provide a migration checklist (shadows→none, radius→0, palette→roles,
  font→Archivo, success-ticks→organic states). The zoo is a *greenfield* example; a
  "retrofit" worked example would help.

### S4. Light-only system vs. an app that ships a `.dark` theme
- **Hit:** The app's `index.css` defines a full `.dark` palette. The design system is
  paper/ink and light-only (`brief.md`, no dark tokens; "theming = skin swap" but no dark
  skin is shipped).
- **Why friction:** I have to decide unilaterally whether chrome keeps dark mode (then I owe
  a dark paper/ink palette the DS doesn't provide) or drops it. Either way it's a deviation
  to record, not a supported path.
- **DS could fix:** Either ship a dark skin (it claims theming is just role-swap, so this
  should be cheap) or state explicitly that the system is light-only and why.

### S5. Fonts: cascade isolation is on the consumer
- **Hit:** DS wants Archivo (UI/display) + JetBrains Mono (marks) + Caveat (numerals),
  self-hosted woff2 in `fonts/`. The natural place to set the UI font is `body`/`html`
  (the app currently does `html { @apply font-sans }`). But that cascades into the
  prototype tiles, which must stay on the neutral stack.
- **Why friction:** I can't set the font globally; I have to either scope it to a chrome
  wrapper or re-assert the baseline font at the tile boundary — and the DS gives no
  guidance on either.
- **DS could fix:** Document font application as a scoped concern, and note the Caveat face
  is referenced in `language/type.md` but I should confirm it's actually shipped/used.

### S6. Two `@theme` blocks (DS tailwind theme vs. app's existing `@theme inline`)
- **Hit:** The app already has an `@theme inline { ... }` mapping shadcn vars to Tailwind
  color utilities. The DS ships `values/tailwind/theme.css` as its own `@theme { ... }`
  block (defining `--color-paper`, `--font-sans: Archivo…`, etc.). `--font-sans` and
  `--radius-*` names overlap between the two.
- **Why friction:** Importing the DS theme overrides `--font-sans` and the radius scale
  globally (Tailwind utilities like `font-sans`, `rounded-md` change meaning), which again
  risks leaking into tiles via any shared utility. Need to reconcile/namespace.
- **DS could fix:** Namespace the Tailwind theme outputs (e.g. `--color-ontwerp-paper`,
  `--font-ontwerp-sans`) or document the collision and the override semantics for Tailwind
  v4 consumers.

## Phase 1 — Foundation (change `add-design-system-foundation`)

### S7. The roadmap's own scoping target would break its own isolation guarantee
- **Hit:** The integration roadmap said to apply `.ontwerp` to the `ProjectView` *outer* div. But
  that div wraps `<Canvas>`, and every prototype tile body is a React-portaled DOM descendant of
  it. Scoping `.ontwerp` there would make every DS custom property cascade into the tile bodies —
  directly violating the roadmap's own Done-when ("no `.ontwerp` vars resolved inside [a tile]").
- **Why friction:** The DS gives no tool to say "apply my tokens here but not to this descendant
  subtree" (no token-reset boundary recipe). The only robust option is to never put the scope on
  an ancestor of the thing you want to exclude.
- **Resolution taken:** `.ontwerp` is applied only to chrome roots that are not ancestors of tile
  bodies — the launcher root, the agent `aside`, and the project-view loading/error roots (early
  returns with no canvas). The `ProjectView` main outer div is NOT scoped; canvas backdrop and
  tile-frame chrome get per-element `.ontwerp` in change 4. The tile body's `font-family` is also
  pinned at the boundary as defense-in-depth.
- **DS could fix:** Ship a documented "island scoping" convention and a token-reset boundary
  recipe (re-assert or unset the DS custom properties at a chosen descendant), so partial adoption
  doesn't require reasoning about the entire DOM ancestor chain.

### S8. No scoped build of the token layer — consumer must copy to re-scope
- **Hit:** The DS ships `values/css/tokens.css` as a `:root { … }` block and
  `values/tailwind/theme.css` as a bare `@theme`. Both define `--font-sans` and `--radius-*` that
  collide with this app's shadcn `@theme inline`. To get the tokens under `.ontwerp` (not `:root`)
  I had to *copy* the token block and re-scope it, because CSS `@import` cannot rewrite a selector
  and the DS ships no `.ontwerp`-scoped variant.
- **Why friction:** The copy drifts from the DS source when the pin advances — a manual re-sync
  step the consumer now owns, with no build-time check that the copy matches the source.
- **Resolution taken:** `src/app/styles/ontwerp.css` holds the re-scoped copy with a header
  pointing at the source path + pin; advancing the pin requires re-syncing the block (noted in the
  file and `docs/DESIGN.md`). The DS bare `@theme` is not imported.
- **DS could fix:** Ship a second build target whose token block is scoped under a consumer-chosen
  class (e.g. `values/css/tokens.scoped.css` emitting `.ontwerp { … }`), or document a build-time
  re-scope step, so consumers don't maintain a manual copy.

### S9. Archivo face covers only weights 500–700 while a 400 token exists
- **Hit:** `language/type.md` and the `@font-face` (mirrored from `zoo/index.html`) declare Archivo
  as a variable face covering `font-weight: 500 700`. But `values/css/tokens.css` defines
  `--weight-regular: 400`, which no shipped Archivo glyph covers.
- **Why friction:** Any chrome text set to `--weight-regular` (400) synthesises a faux weight or
  falls back. Minor for now (chrome restyle is changes 2–4), but the token implies a weight the
  face doesn't provide.
- **DS could fix:** Either ship the 400 master for Archivo, or drop/relabel `--weight-regular` to
  match the face's real range.

## Phase 2 — Launcher chrome reskin (change `reskin-launcher-chrome`)

### S10. Skins are *partial* role overrides, but the flattened token copy strands the rest
- **Hit:** The zoo ships themes (`zoo/source/data/skins.mjs`) as skins that override only ~7 colour
  roles (`--color-surface-page/-deep/-claim`, `--color-text-default/-soft`, `--color-accent-base/
  -soft`). They *work* in the zoo only because `base.css` re-links every component/border/on-ink token
  to those roles with `var(...)` at runtime, so one 7-var override cascades everywhere. Our token copy
  (S8) flattened those aliases to cream *literals*, so applying a skin's 7 vars alone leaves borders,
  the ink surface, on-ink text, the quiet/faint greys, and all `--button-*/--field-*/--card-*/
  --badge-*` tokens stranded on cream — brown rules and warm-cream buttons on a rose sheet. The
  lighter "ink" greys are also warm/yellowish and read wrong on a cool skin; the zoo should have
  re-derived them per skin too.
- **Why friction:** To ship one skin (rose) I had to hand-re-derive *every* colour-carrying token from
  the skin's ink/paper/accent, not just paste 7 values — the exact work the DS's runtime aliasing hides
  from a whole-app adopter but dumps on a scoped/flattened consumer.
- **Resolution taken:** The rose skin is baked into the single `.ontwerp` token block: the 7 skin vars
  verbatim + every dependent colour token re-derived. Structural tokens stay the cream mirror. The
  button halftone (hardcoded to cream ink in the DS) is token-driven (`var(--color-ink)`) so it themes.
- **DS could fix:** Ship skins as a complete set of role overrides (or a documented derivation for the
  greys/on-ink/borders), and ship the token layer with the component aliases *kept as `var(...)`* in a
  scoped build (see S8), so one skin override reskins a scoped consumer the way it reskins the zoo.

### S11. A second scoped rule that re-declares custom properties is silently dropped by the bundler
- **Hit:** The natural way to express "a skin" without touching the base tokens is a second rule —
  `.ontwerp { --color-…: <rose> }` after the base block. Tailwind v4's CSS pipeline (Lightning CSS)
  dedupes same-target custom-property rules and *dropped the override entirely* (the base cream values
  won). Bumping specificity (`.ontwerp.ontwerp`, `:not(#…)`) or changing the selector (`html .ontwerp`)
  all still produced byte-identical output — the override never reached the stylesheet.
- **Why friction:** The clean "layer a skin on top" pattern doesn't survive the build, so the skin has
  to be merged into the one canonical token block. Cost a while to diagnose (it looked like a cascade
  bug, not a dead-code-elimination one).
- **DS could fix:** N/A to the DS itself, but a scoped token build (S8) with a documented skin-override
  slot would sidestep it; recorded here so the next consumer doesn't chase the same ghost.

### S12. The component-class copy is a re-sync burden, and the halftone isn't a utility
- **Hit:** Like the token block (S8), the component classes are a *copy* of
  `zoo/source/styles/components.css`, re-scoped under `.ontwerp`. Advancing the pin means re-syncing
  both blocks by hand. And the button's Ben-Day halftone (`::before` radial-gradient + blend) plus its
  instant `:active` drop simply aren't expressible as Tailwind utilities on the element, which is *why*
  the classes are ported rather than inlined — but that's the thing that makes them a maintenance copy.
- **Why friction:** Two hand-maintained copies (tokens + components) drift from the pin with no
  build-time check that they still match the source.
- **DS could fix:** Ship a scoped build of *both* the tokens and the components (emitting under a
  consumer-chosen class), so the consumer imports rather than copies.

### S13. Tailwind Preflight fights the DS's inherited lowercase voice
- **Hit:** The DS voice is lowercase, inherited from the body (the zoo has no CSS reset). Tailwind
  Preflight resets `button, select { text-transform: none }`, so every non-`.btn` button in chrome
  (seed selectors, the row open-target) rendered its label in the source casing, breaking the voice.
- **Why friction:** The DS assumes a no-reset baseline; dropping it into a Preflight app needs a
  scoped counter-rule the DS doesn't mention.
- **Resolution taken:** `.ontwerp button, .ontwerp select { text-transform: inherit }` in `@layer
  base`; `.btn`/`.field-label` keep their explicit transforms.
- **DS could fix:** Note the Preflight/reset interaction in the consumer guide, or set the voice on a
  wrapper with an explicit `button { text-transform: inherit }` recipe.

## Phase 3 — App-shell + agent-panel reskin (change `reskin-app-shell-and-agent-panel`)

### S14. The DS forbids success glyphs but ships no "status mark" primitive to replace them
- **Hit:** The DS anti-goals forbid green-check success icons and status-as-checkbox. The agent panel
  had a harness report (`✓`/`✗`/`⚠`, green/red/amber) and a token-meter "Applied yes/no" (green/red)
  that had to go. But the DS's *positive* answer to "how do you show pass/fail" is the organic growth
  metaphor (germinating / ripe / fallow) — which lives in the zoo effects and is scoped to a *later*
  change (lifecycle states, change 5). For a presentation-only reskin there's no shipped, static
  "status mark" component to reach for in the meantime.
- **Why friction:** I had to invent an interim treatment (mono `.pill` marks — neutral ink for pass,
  `.pill-red` for fail, `.pill-quiet` for warn) that is DS-compliant (no glyph, red confined to the
  rule) but is explicitly *not* the DS's intended organic representation — a deliberate half-step that
  change 5 will supersede. Recording it so change 5 knows the pills are a placeholder, not the target.
- **DS could fix:** Ship a static status-mark component (the compliant answer for consumers who can't
  yet adopt the animated lifecycle states), or state that pass/fail must always be an organic state
  and provide a non-animated fallback rendering of it.

### S15. No tab / segmented-control component in the DS
- **Hit:** The mode selector (Instant / Planner) is a segmented control — a common chrome primitive.
  The DS component set (button, field, card, pill/badge, link) has no tab or segmented control, and
  the zoo's `.th-tab` is a table-header affordance, not a reusable segmented toggle.
- **Why friction:** I had to invent the recipe from `language/components.md` + principles (square
  hairline cells sharing an ink rule, selected = solid ink, unselected = paper) and decide the
  selected-state contract myself — the kind of choice a shipped component would settle.
- **DS could fix:** Add a tab / segmented-control recipe (or component class) with a defined
  selected-state treatment, so consumers don't each invent a divergent one.

### S16. Presentation-coupled consumer tests break on a role reskin
- **Hit:** Existing agent-panel tests asserted the *old* presentation directly — the mode selector's
  `bg-stone-800`/`bg-white` selected state and a `getAllByText(/✓/)` count on the harness report.
  Swapping palettes/glyphs for DS roles broke these even though behaviour was unchanged.
- **Why friction:** The anti-goals the DS encodes (no green tick, no smooth transition) were only
  *implicitly* tested via brittle className/glyph string matches, so adopting the DS meant rewriting
  assertions in lockstep with the reskin — coupling that makes each future skin change a test edit.
- **DS could fix:** N/A to the DS itself, but the consumer lesson (recorded for the next surface):
  assert DS *roles* / semantics (a pill mark exists, red is a rule not a fill) rather than raw palette
  utilities, so a skin swap doesn't churn behavioural tests.

## Phase 4 — Canvas backdrop + tile-frame reskin (change `reskin-canvas-chrome`)

### S17. No reset recipe for the token/typography boundary where chrome meets a sandboxed subtree
- **Hit:** The canvas is the first surface where a `.ontwerp` chrome element (the tile `<article>`
  frame) is a DOM *ancestor* of an unstyled prototype subtree (the portaled `<RuntimeHost>` body). The
  DS base rule sets `font-family` / `text-transform` / `letter-spacing` as **inherited** properties and
  redefines `--font-sans` to Archivo — all of which cascade straight through the frame into the body.
  The DS ships tokens and components but **no reset/boundary recipe** for "stop the DS here."
- **Why friction:** I had to hand-author a `.ontwerp-reset` class that (a) re-declares `--font-sans`/
  `--font-heading` back to the literal Geist baseline — a DS token can't be consumed here because the
  in-scope `--font-sans` is exactly the polluted value — and (b) pins the three inherited typography
  properties to their defaults, kept unlayered to beat both `@layer base` and Tailwind's utility. It is
  a consumer-maintained mirror of the DS base rule that must be re-synced by hand whenever the base rule
  changes, and it only neutralises *typography* — DS colour custom properties still inherit into the
  body (harmless only because shadcn components read `--background`/`--primary`, not `--color-*`).
- **DS could fix:** Ship a scoping/reset primitive (e.g. a `.ontwerp-boundary` that resets the inherited
  base properties and re-points `--font-sans`), or define the base voice with non-inherited selectors so
  it doesn't cascade past the scope root. This is the S7/S8 island-scoping gap at the *subtree* seam.

### S18. Mono-uppercase "utility mark" is over-applied by the DS vocabulary to non-data text
- **Hit:** The DS's one sanctioned uppercase treatment is the JetBrains-Mono "utility mark," and the
  natural reading of it (reinforced by the change's own tasks) is to reach for mono-uppercase on any
  small label — subtitle, section header, taxonomy tag, lane name. Applied literally that produces the
  decorative mono-uppercase tic an owner preference explicitly rejects for subtitles/labels.
- **Why friction:** The DS gives no guidance separating a **data/identifier mark** (zoom `%`, a count, a
  machine event token — where mono genuinely encodes "measured value / code") from a **prose label**
  (a subtitle, a heading, a human flow name — which belong in the Archivo voice). I had to draw that
  line myself and deviate from the tasks, reserving mono for numerals/identifiers and rendering prose
  labels in Archivo lowercase.
- **DS could fix:** Scope the "utility mark" recipe to numeric/coded data explicitly, and give prose
  labels/eyebrows an Archivo treatment, so consumers don't default to mono-uppercasing every caption.

## Phase 5 — Chrome lifecycle states (change `add-chrome-lifecycle-states`)

### S19. The states ship as string-emitting globals + `dangerouslySetInnerHTML`, not as components
- **Hit:** The zoo delivers the lifecycle art two layers down from anything reusable: the generators
  (`effects/phyllotaxis.mjs`) **emit SVG-markup strings** (`` `<circle cx=…/>` ``) meant for
  `innerHTML`, the sections (`sections/states.mjs`) concatenate more markup strings, and the CSS hangs
  on bare globals (`.fallow`, `.gseed`, `.ripe`, `.rising`). None of it is a component, none of it is
  scoped, and the data (dot positions) is entangled with its presentation (the SVG string).
- **Why friction:** To use them idiomatically I had to **invert the port**: rewrite the generators to
  return data (`{ cx, cy, r, index }[]`) instead of markup, render `<circle>` from that data in React
  (dropping `dangerouslySetInnerHTML` entirely), and re-scope every state selector under `.ontwerp`
  (descendant rules) so it can't collide with a prototype tile body. The keyframe names also had to be
  namespaced (`ontwerp-germinate`/`-ripen`/`-rise`) since bare `germinate`/`rise` are collision-prone in
  a shared document. It's a faithful re-expression, not a copy — and a re-sync burden on pin advance.
- **DS could fix:** Ship the generators as pure data functions (return coordinates, not strings) and the
  states as scope-able primitives, so a consumer isn't forced to choose between `innerHTML` and a rewrite.

### S20. Determinism is a stated principle but the generators don't enforce it
- **Hit:** The DS narrates the seed head as "grown, not machined" with deterministic jitter, and the
  loader is meant to loop stably — but nothing in the shipped generators pins that: they're plain
  functions a caller could easily reseed per-render, and there's no memoization, so a naive port
  re-computes (and could re-jitter) the lattice on every render, making the loader shimmer.
- **Why friction:** I had to add the determinism guarantees the principle implies but the code omits —
  seed strictly by index, **memoize per dot count** so re-renders are byte-identical, and add an
  architecture test forbidding `Math.random`/`Date.now`/`performance.now` in the generator module —
  because "deterministic" was a prose intention, not an enforced property of the artifact.
- **DS could fix:** Bake the seeding + memoization into the shipped generator and mark the module
  clock-free, so determinism is a property of the code rather than a caption the consumer must re-earn.

### S21. Reduced-motion rest states must be hand-authored per keyframe, across four states
- **Hit:** The states CSS ships four independent `steps()` keyframes (`germinate`, `ripen`, `rise`, plus
  the static `fallow`) with **no reduced-motion handling at all** — the zoo has no
  `@media (prefers-reduced-motion: reduce)` for them. A loading/iterating loader that ignores the
  reduced-motion signal is an accessibility regression, and the DS leaves it entirely to the consumer.
- **Why friction:** I had to hand-derive the "fully-formed rest frame" for each animated state (the
  filled seed head at `opacity: 0.9`, the ripe fruit at `--color-accent-base`/`scale(1)`, the vessel at
  `translateY(0)`) and freeze all of them in one `@media` block with `animation: none` — a per-state
  authoring task with no shipped default, and a test to prove each state is covered so a future keyframe
  isn't silently left animating.
- **DS could fix:** Ship each stepped-clock state with its own reduced-motion rest frame (or a shared
  `@media` block), so the accessible default travels with the animation instead of being re-authored.

## Phase 6 — Chrome atmosphere (change `add-chrome-atmosphere`)

### S22. The atmosphere ships as bare-global CSS across three files — a re-sync burden that only grows
- **Hit:** The ambient layer is spread over `atmosphere.css` (grid/grain/bloom), `material.css`
  (divider/leaf), and `weather.css` (eight particle fields + per-glyph header motion), every rule a
  **bare global** (`.grid`, `.bloom`, `.gust`, `.drop`, `.fleck`, …) with **global keyframe names**
  (`bo`, `d1`/`d2`/`d3`, `gust`, `drop`, `drift`, `snowfall`, …), and the grid/particle generators
  emit HTML strings (`` `<i style="--a…">` ``) for `innerHTML` — the same string-emit + bare-global
  shape as the lifecycle states (S19), now multiplied across a much larger surface.
- **Why friction:** Every one of those selectors had to be re-scoped under `.ontwerp` and every keyframe
  namespaced (`ontwerp-bo`, `ontwerp-gust`, …) to keep the atmosphere from colliding with a prototype
  tile's CSS in the shared document, and both generators had to be inverted to return data arrays
  (`renderGrid` → cell data, the weather fns → `Particle[]`) rendered as `<i>` in React. It's a large,
  purely mechanical re-expression that the pinned-copy header now has to keep in sync across **three**
  source files at once — the copy-drift risk (S8/S12) scaled up by the size of the ambient layer.
- **DS could fix:** Ship the atmosphere as scope-able primitives with namespaced keyframes and the
  generators as pure data functions, so a consumer can mount it behind their own scope without a
  three-file re-scope-and-rewrite pass on every pin advance.

### S23. `position: fixed` atmosphere fights the `.ontwerp` DOM scope — tokens need the tree, paint needs a context
- **Hit:** The ambient layers must be **`position: fixed`** (viewport-relative, so they don't pan/zoom
  with the canvas graph) yet must resolve `.ontwerp`-scoped tokens — which only works if they're DOM
  **descendants** of the scope, since the cascade follows the DOM tree, not the fixed layout tree. But a
  fixed, `z-0` layer also paints **above** in-flow non-positioned content in the same stacking context
  (CSS paints positioned `z:0` after non-positioned blocks), so naively mounting it inside a chrome root
  draws the grid/grain over the launcher text rather than behind it.
- **Why friction:** Getting both right took a stacking-context dance the DS never mentions: put `isolation:
  isolate` on each chrome root (so the fixed layers are trapped in that context, not the viewport), keep
  the layers as DOM children of the scope (for tokens), and **lift the chrome content above `z-0`**
  (`relative z-10` on the launcher content; the canvas header/empty/overlay were already z-indexed). The
  zoo sidesteps all of this because its content lives in `.sheet { position: relative; z-index: 1 }` on a
  single-page body — a layout the app's multi-surface chrome doesn't share, so the interaction had to be
  re-solved per mount point.
- **DS could fix:** Document the fixed-behind-scope pattern (isolate + descendant mount + z-lifted
  content) alongside the atmosphere, since "mount these fixed layers inside your token scope, behind your
  content" is exactly the non-obvious part a consumer needs and the bare CSS omits.

### S24. Ambient motion has a real perf ceiling on a multi-tile canvas, and the DS caps nothing
- **Hit:** The canvas can host many live prototype tiles, each an iframe-like runtime; the atmosphere
  adds a continuously-animating grid (160 cells breathing on eased loops) plus three blurred blooms on
  top. The DS ships the atmosphere as a **single-page showcase** with no guidance on per-instance cost,
  no cap on particle counts (weather fields run 6–51 elements each), and no note that mounting it
  per-surface would multiply that cost by the number of surfaces.
- **Why friction:** To keep the ambient layer from scaling with tile count I had to make the cost an
  explicit invariant the DS leaves implicit: **mount the stack once per chrome root** (not per tile),
  keep weather **opt-in and off by default**, cap every generator at the zoo's modest counts, and add an
  architecture/integration test asserting the single-mount + the caps so a future change can't quietly
  regress it. The perf ceiling — one animated grid + three blooms behind each of two chrome roots, weather
  off — is a budget I had to set and defend, not one the DS provided.
- **DS could fix:** State the intended mount cardinality and particle caps with the atmosphere (it is
  ambient chrome, mount once; fields are capped at N), so the cost model travels with the layer instead
  of being reverse-engineered by the consumer.


---

## Phase 7 — First-pass chrome polish

### S25. The atmosphere grid is a fixed viewport lattice; a canvas needs it coupled to a pan/zoom transform
- **Hit:** The DS breathing grid (`.atmos-grid` / `effects/grid.mjs`) is a `position: fixed`,
  viewport-sized CSS-grid of `<i>` cells. On an infinite pan/zoom canvas that reads as wrong — the
  grid stays nailed to the screen while the content it is supposed to sit under slides and scales past
  it. There is no DS affordance for a grid that tracks a transform, no level-of-detail story, and no
  cursor interaction.
- **Why friction:** I had to re-author the grid from scratch for the canvas — a `linear-gradient`
  background lattice whose `background-size`/`background-position` are driven by transform CSS vars the
  viewport publishes, snapping cell size across three world-cell LOD steps — and keep the DS lattice
  only on the (fixed) launcher. Two grids now exist for one visual idea because the DS one can't move.
- **DS could fix:** Offer the grid as a transform-aware layer (accept a scale + offset, expose an LOD
  policy) or at least document a "grid that tracks a canvas" recipe; ambient chrome that only works on
  static pages is half a grid for any tool with a canvas.

### S26. Per-glyph header weather ships as CSS with no component to produce the markup, and cursor-reactive ambience isn't a thing
- **Hit:** The `wx-leaves` (and siblings) per-glyph header motion is real DS CSS, but it needs each
  glyph wrapped in an indexed `.wxc` span (`--ci`) — and the DS ships no component/helper that emits
  that markup, so "put weather on this heading" is a manual glyph-splitting chore that also has to
  re-solve accessibility (full text as a label, spans hidden). Separately, the DS ambient register is
  entirely self-driven (eased loops, stepped clocks); there is no notion of ambience that *responds to
  the pointer*, which is what a canvas grid wants.
- **Why friction:** I built a `WeatherText` component to split a heading into indexed spans with an
  `aria-label` fallback, and invented a cursor-reactive grid highlight (a pointer-masked `::after`
  twin) with no DS pattern to lean on — including its reduced-motion rest, which the DS `@media` block
  only covered for particle fields, not the per-glyph header motion.
- **DS could fix:** Ship the per-glyph weather as a component/directive (not just CSS that assumes
  hand-authored spans), fold the header motion into the reduced-motion block, and offer at least one
  pointer-reactive ambient primitive so "ambience that answers the cursor" isn't invented per consumer.
