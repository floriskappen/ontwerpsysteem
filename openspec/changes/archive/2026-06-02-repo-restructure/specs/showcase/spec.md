## ADDED Requirements

### Requirement: Showcase is generated from modular source files

The showcase ("the zoo") SHALL be generated from modular source files located in `design-system/source/zoo/`. The source SHALL be separated by section (e.g. `sections/`), styles (e.g. `styles/`), and interactive effects (e.g. `effects/`). The build process SHALL compile these modules into a single, self-contained HTML file.

#### Scenario: Showcase generation from modular sources
- **WHEN** the showcase build is triggered
- **THEN** it reads the modular components and styles from `design-system/source/zoo/`
- **AND** produces a single compiled file at `design-system/dist/zoo/index.html`

## MODIFIED Requirements

### Requirement: Showcase renders only from built outputs

The showcase SHALL draw the design system's values exclusively from built outputs located under `design-system/dist/` (such as CSS custom properties and the token manifest) and SHALL NOT read raw sources directly.

#### Scenario: Showcase reflects built values
- **WHEN** the values are modified and the system is rebuilt
- **THEN** the showcase is regenerated using only the outputs in `design-system/dist/`
