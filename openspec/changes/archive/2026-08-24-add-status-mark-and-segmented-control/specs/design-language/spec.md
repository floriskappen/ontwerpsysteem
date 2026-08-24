# design-language Delta

## ADDED Requirements

### Requirement: Static status mark is a registered chrome primitive

The design language SHALL register a static status-mark recipe (`state.mark.static`) in
`design-system/recipes/` and document it in the states language prose. The recipe SHALL
carry the full recipe shape (stable unique ID, intent, usage rules, source module
references, value references, and a `reducedMotion` field) and SHALL declare that the
status mark is the inert rest frame of a lifecycle state — the non-animated pass / fail /
warn primitive a consumer reaches for when it cannot mount the animated lifecycle states.
The states language document SHALL state this same relationship, so the static mark and
the animated states read as one status idiom rather than a second, parallel one.

#### Scenario: Status-mark recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** `state.mark.static` is present with a stable ID, intent, usage rules, resolvable
  source module and value references, and a `reducedMotion` field

#### Scenario: The mark's relationship to the lifecycle states is documented

- **WHEN** a consumer reads the states language document
- **THEN** it states that the static status mark is the inert rest frame of a lifecycle
  state and is the compliant fallback when the animated states cannot be mounted

### Requirement: Segmented control is a registered chrome primitive

The design language SHALL register a segmented-control recipe
(`component.tabs.segmented`) in `design-system/recipes/` and document it in the components
language prose. The recipe SHALL carry the full recipe shape (stable unique ID, intent,
usage rules, source module references, value references, and a `reducedMotion` field) and
SHALL define the selected-state contract for a pick-one control: a selected cell reads as
the inverse of an unselected one, and switching is immediate. The components language
document SHALL describe the segmented control as a reusable mode selector distinct from
the theme-switch affordance.

#### Scenario: Segmented-control recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** `component.tabs.segmented` is present with a stable ID, intent, usage rules,
  resolvable source module and value references, and a `reducedMotion` field

#### Scenario: The selected-state contract is documented

- **WHEN** a consumer reads the components language document
- **THEN** it describes the segmented control as a pick-one mode selector whose selected
  cell inverts the unselected treatment and whose switch is immediate
