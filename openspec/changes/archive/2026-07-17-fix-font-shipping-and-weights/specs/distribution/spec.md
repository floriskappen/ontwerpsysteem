# distribution Delta

## ADDED Requirements

### Requirement: Bundle ships a complete, importable font layer

The consumer bundle SHALL contain the font binaries under `fonts/` and an importable fonts CSS under `values/css/` whose `@font-face` declarations cover every font family that the built values or the design language reference. Every `fontWeight` token in the built values SHALL be renderable by the shipped face bound to the typographic voice without synthetic (faux) weights.

#### Scenario: Fonts wire up by import alone

- **WHEN** a consumer imports the bundle's fonts CSS from its shipped location
- **THEN** the relative `src` URLs resolve to the bundle's `fonts/` directory and every declared family renders from the shipped binaries, with no hand-authored `@font-face` required

#### Scenario: Every referenced family is shipped

- **WHEN** the bundle is inspected
- **THEN** each font family named by the built values or the design language has both a font binary in `fonts/` and a matching `@font-face` declaration in the fonts CSS

#### Scenario: Weight tokens render without synthesis

- **WHEN** any `fontWeight` token from the built values is applied to the typographic voice's face
- **THEN** the shipped face's weight coverage includes that weight
