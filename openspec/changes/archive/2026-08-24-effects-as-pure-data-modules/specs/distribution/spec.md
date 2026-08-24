## ADDED Requirements

### Requirement: Bundle ships a framework-neutral effects data module

The consumer bundle SHALL contain, under its built values, a framework-neutral JavaScript effects module (with a matching type declaration) that exposes the effect data functions as importable exports. The module SHALL depend on no framework and no build step, so a consumer can import it and render the returned data onto its own elements idiomatically instead of injecting markup strings. Its exported data functions SHALL be the same deterministic functions the showcase consumes.

#### Scenario: Effects module ships in the bundle

- **WHEN** the consumer bundle is inspected
- **THEN** its built values include a JavaScript effects module and a matching type declaration
- **AND** the module exports the effect data functions

#### Scenario: Effects module is consumable without tooling

- **WHEN** a consumer imports the effects module from the bundle
- **THEN** it can call the data functions and receive the effect data with no framework dependency and no build step
- **AND** the returned data is the same as the data the showcase renders from
