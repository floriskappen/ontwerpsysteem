## ADDED Requirements

### Requirement: Canonical prose examples use the documented voice boundary
The canonical showcase SHALL render human-written field and theme labels in the existing Archivo lowercase label treatment. The mono-uppercase utility mark SHALL remain reserved for data such as numerals, counts, measurements, machine identifiers, and coded events; the correction SHALL not add components, introduce new visual values, or alter the resolved type-language contract.

#### Scenario: Prose labels do not teach utility-mark styling
- **WHEN** the generated showcase's field gutter and theme-switch labels are inspected
- **THEN** they use the existing Archivo label typography with lowercase treatment
- **AND** neither label uses the mono-uppercase utility-mark typography or uppercase transformation

#### Scenario: Data marks remain available and constrained
- **WHEN** the canonical type specimen and its styles are inspected
- **THEN** the existing mono-uppercase utility-mark treatment remains available for data examples
- **AND** no prose label, subtitle, section header, taxonomy tag, or eyebrow is assigned that treatment

#### Scenario: Correction preserves the established showcase surface
- **WHEN** the showcase is rebuilt from unchanged token and component inputs apart from the canonical label correction
- **THEN** the existing component inventory, token values, and documented type-language rules remain unchanged
- **AND** no new component, dependency, or visual value is introduced
