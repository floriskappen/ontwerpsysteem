# showcase Specification

## Purpose
TBD - created by archiving change add-showcase. Update Purpose after archive.
## Requirements
### Requirement: Showcase renders only from built outputs

The showcase SHALL render the design system exclusively from build artifacts under `dist/` — the token manifest and the built CSS — and SHALL NOT read or re-resolve token source files under `tokens/`. This guarantees the showcase reflects exactly what the build produces, so what is shown is always what ships.

#### Scenario: Showcase reflects the built set

- **WHEN** the tokens change and the build is re-run
- **THEN** the showcase reflects the new built values with no edit to the showcase itself

#### Scenario: Sources are never read directly

- **WHEN** the showcase is generated
- **THEN** it consumes only artifacts under `dist/` and does not read files under `tokens/`

### Requirement: Token gallery renders every token by tier and type

The showcase SHALL render a gallery containing every token in the manifest, grouped by tier (primitive → semantic → component) and by `$type`. Each token SHALL be shown with a representation appropriate to its `$type` — for example a swatch for `color`, a sized bar for `dimension`, a text specimen for `fontFamily`/`fontWeight`/`typography`, a replayable sample for `duration`/`cubicBezier`/`transition`, an applied box for `shadow`/`border`/`gradient`/`strokeStyle`, and the literal value for `number`. The gallery is data-driven: it lists whatever the manifest contains, with no hand-maintained token list.

#### Scenario: Every token appears, grouped

- **WHEN** the showcase is generated from a manifest
- **THEN** every token in the manifest appears in the gallery, grouped by its tier and `$type`
- **AND** each token is rendered with a representation appropriate to its `$type`

#### Scenario: Aliases show their resolution

- **WHEN** a semantic or component token aliases a lower-tier token
- **THEN** the gallery shows both its resolved value and the token it references

### Requirement: Demo UI elements are styled strictly from tokens

The showcase SHALL render a fixed, curated set of representative UI elements — button, text input, selection control, card, badge, and link/alert — to show the tokens applied in context. Every visual property of these elements SHALL derive from a design token via the built CSS custom properties; the showcase SHALL NOT introduce hardcoded colors, sizes, or other literal visual values. When a referenced token does not exist, the element SHALL render without that styling rather than substituting a literal, so that missing coverage is visible.

#### Scenario: Element styling traces to tokens

- **WHEN** a demo element is rendered
- **THEN** each of its visual properties resolves to a token custom property
- **AND** the showcase's own styles introduce no literal color or size values

#### Scenario: Absent token surfaces as a gap

- **WHEN** a demo element references a token not present in the built set
- **THEN** the element renders without that styling and substitutes no literal value, making the missing token visible

### Requirement: Each demo element renders the interaction-state matrix

For every demo UI element, the showcase SHALL render the standard interaction-state matrix: default, hover, active, focus, disabled, loading, and error. Interactive states (hover, active, focus, disabled) SHALL be shown via native CSS state; non-interactive states (loading, error) SHALL be shown as explicit variants. Each state's appearance SHALL derive only from tokens.

#### Scenario: All states shown per element

- **WHEN** a demo element is rendered
- **THEN** the showcase presents it in each of the default, hover, active, focus, disabled, loading, and error states

### Requirement: Showcase honours motion and focus accessibility

The showcase SHALL honour `prefers-reduced-motion`: animated token samples (durations, easings, transitions) SHALL NOT auto-play when reduced motion is requested, and SHALL instead be replayable on demand. Focusable demo elements SHALL show a visible focus indicator.

#### Scenario: Reduced motion is respected

- **WHEN** the viewer has `prefers-reduced-motion` set
- **THEN** animated samples do not auto-play and can be triggered manually

#### Scenario: Focus is visible

- **WHEN** a focusable demo element receives keyboard focus
- **THEN** a visible focus indicator is shown

### Requirement: Showcase is a generated, self-contained artifact

The showcase SHALL be produced as a generated artifact under `dist/` — never committed, like all build outputs — and SHALL be viewable as static files without requiring a runtime server or framework. Regenerating the showcase from unchanged inputs SHALL be deterministic.

#### Scenario: Viewable without a server

- **WHEN** the showcase has been generated
- **THEN** it can be opened directly in a browser from `dist/` without a running server

#### Scenario: Generated, not committed

- **WHEN** the repository is inspected
- **THEN** the showcase output lives under `dist/`, is git-ignored, and is regenerated by the build

