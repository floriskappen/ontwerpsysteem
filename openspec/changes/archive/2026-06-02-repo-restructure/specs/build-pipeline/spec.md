## MODIFIED Requirements

### Requirement: Build transforms canonical tokens into platform outputs

The build SHALL read all value source files under `design-system/source/values/`, validate them, and emit built platform outputs (CSS custom properties, JS/TS ESM, Tailwind v4 theme, and structured token manifest) under `design-system/dist/`.

#### Scenario: Build executes and outputs to design-system/dist
- **WHEN** the build is run on a valid set of source files
- **THEN** it generates the platform outputs inside `design-system/dist/`
