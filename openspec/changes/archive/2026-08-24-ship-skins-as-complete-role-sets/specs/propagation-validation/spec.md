## ADDED Requirements

### Requirement: Skin coverage gate

The validation gate SHALL verify, for every shipped skin, that the set of roles the skin
supplies is exactly the set of semantic colour roles whose declared provenance is
skin-supplied, and that expanding the skin yields a value for every colour-carrying
semantic token — each token either supplied by the skin or produced by its registered
derivation rule over the skin's supplied roles. The gate SHALL fail when a skin omits a
supplied role, supplies a role whose provenance is derived, or leaves any colour-carrying
token without a supplied-or-derived value, naming the skin and the offending role.

#### Scenario: A skin that strands a colour token fails

- **WHEN** a shipped skin leaves a colour-carrying semantic token that is neither supplied nor produced by a derivation over the skin's supplied roles
- **THEN** the validation gate fails, naming the skin and the stranded token

#### Scenario: A skin whose supply set does not match the contract fails

- **WHEN** a skin omits a supply-provenance role, or supplies a role whose declared provenance is derived
- **THEN** the validation gate fails, naming the skin and the mismatched role

#### Scenario: A complete skin passes

- **WHEN** a skin supplies exactly the supply-provenance roles and every derived role resolves from them
- **THEN** the skin coverage gate passes for that skin
