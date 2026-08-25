## Purpose

Defines the consumer-facing adoption contract so whole-app and island integrations mount the complete shipped design-system surface without leaking styles into neutral application regions.

## ADDED Requirements

### Requirement: Whole-app adoption mounts the complete shipped surface

The whole-app integration guidance SHALL identify the shipped root token, component, effect, and font assets, and SHALL show them mounted for the application root rather than presenting tokens as a complete integration by themselves.

#### Scenario: Whole-app instructions provide working class and effect styling

- **WHEN** a consumer follows the whole-app instructions and imports the documented assets
- **THEN** the root token asset, component asset, effect asset, and font asset paths resolve in the assembled bundle
- **AND** the documented application root receives the system styles needed for component and effect classes
- **AND** the guidance does not imply that importing tokens alone mounts component or effect styling

### Requirement: Island adoption uses one scoped root for all scoped surfaces

The island integration guidance SHALL use the shipped scoped token, component, effect, font, and shadcn adapter assets, and SHALL place the `.ontwerp` scope on the chrome root that contains the corresponding markup. The scoped adapter SHALL be `values/shadcn/adapter.scoped.css`, not the root adapter.

#### Scenario: Scoped imports and adapter resolve under the island root

- **WHEN** a consumer follows the island instructions for a shadcn-shaped island
- **THEN** `tokens.scoped.css`, `components.scoped.css`, `effects.scoped.css`, `fonts.css`, and `values/shadcn/adapter.scoped.css` resolve in the assembled bundle
- **AND** the token, component, effect, and adapter selectors apply beneath the same `.ontwerp` root
- **AND** no root-scoped adapter import is presented as the island adapter

### Requirement: Island boundaries prevent excluded-subtree leakage

The integration guidance SHALL preserve the scope-placement and boundary safeguards: `.ontwerp` MUST be applied only to system chrome roots, excluded content MUST NOT be a descendant of that scope, and `.ontwerp-boundary` MUST be documented for neutral seams inside a scoped region.

#### Scenario: Neutral content remains outside the system scope

- **WHEN** an island integration contains an embedded or host-styled subtree that must remain neutral
- **THEN** the documented markup places the scope on the chrome root rather than an ancestor of that subtree
- **AND** the guidance provides `.ontwerp-boundary` as the seam escape hatch when the neutral subtree is inside scoped chrome
- **AND** the adapter and scoped effect/component rules have no documented path to apply outside the intended island

### Requirement: Consumer documentation is checked against the assembled bundle

The repository SHALL verify that every asset path and adoption example named by the consumer guidance exists in the assembled release bundle, including the scoped shadcn adapter path.

#### Scenario: Documentation path audit catches drift

- **WHEN** the consumer documentation path audit runs against the assembled bundle
- **THEN** each documented import path resolves to a shipped file
- **AND** a missing, renamed, or root-vs-scoped path causes the audit to fail
- **AND** the audit does not require a new runtime dependency or a visual redesign
