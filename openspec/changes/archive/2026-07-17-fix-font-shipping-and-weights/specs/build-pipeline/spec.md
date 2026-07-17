# build-pipeline Delta

## ADDED Requirements

### Requirement: Standalone fonts CSS output

The build SHALL emit a fonts CSS file at `values/css/fonts.css` under `dist/` containing one `@font-face` declaration per shipped font file, with `src` URLs expressed as relative paths that resolve against the bundle's `fonts/` directory. Family names, weight ranges, styles, and file bindings SHALL be generated from a single canonical face-definition source that also drives the showcase's inlined `@font-face` rules, so the two can never disagree.

#### Scenario: Fonts CSS is emitted

- **WHEN** the build completes
- **THEN** `dist/` contains `values/css/fonts.css` declaring every shipped face
- **AND** each declaration's `src` is a relative URL that resolves to a font file shipped in the bundle's `fonts/` directory

#### Scenario: Showcase and fonts CSS share one face definition

- **WHEN** the showcase HTML and `values/css/fonts.css` are built
- **THEN** the inlined showcase `@font-face` rules and the fonts CSS declare identical family names, weight ranges, and styles for every face, derived from the same face-definition source
