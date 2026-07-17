# propagation-validation Delta

## ADDED Requirements

### Requirement: Font weight tokens resolve within shipped face coverage

The validation gate SHALL verify that every `fontWeight` token value falls inside the declared weight range of the shipped face bound to the system's token-driven typographic voice. A weight token outside that range SHALL fail validation with an error naming the token, its value, and the face's declared range.

#### Scenario: Weight token outside the shipped range fails

- **WHEN** a `fontWeight` token's value lies outside the declared weight range of the face bound to the weight tokens
- **THEN** the validation gate fails, naming the token, its value, and the declared range

#### Scenario: Weight tokens inside the range pass

- **WHEN** every `fontWeight` token value lies inside the bound face's declared weight range
- **THEN** the weight-coverage check passes

### Requirement: Declared @font-face ranges match actual face coverage

The validation gate SHALL verify, for each shipped font file, that the declared `@font-face` weight range is contained within the weight-axis coverage of the font binary itself (a static face counts as covering exactly its single weight). A declaration promising weights the binary does not carry SHALL fail validation with an error naming the file, the declared range, and the actual coverage.

#### Scenario: Declaration exceeding real coverage fails

- **WHEN** a face's declared weight range includes a weight the shipped font binary's weight axis does not cover
- **THEN** the validation gate fails, naming the font file, the declared range, and the binary's actual coverage

#### Scenario: Replacing a font file is re-checked

- **WHEN** a shipped font file is replaced and the gate runs
- **THEN** the declared range is re-verified against the new binary's actual coverage
