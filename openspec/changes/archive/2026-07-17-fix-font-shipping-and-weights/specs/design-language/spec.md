# design-language Delta

## ADDED Requirements

### Requirement: Type language documents scope-safe font application

The type language documentation under `design-system/language/` SHALL document font application as a scoped concern: the typographic voice (font families and the inherited voice properties) is set on the consumer's scope root element, never on `html` or `body`, so the voice cannot cascade into subtrees that must stay neutral. The documentation SHALL reference the boundary primitive as the escape hatch for excluding a descendant subtree inside a scoped region.

#### Scenario: Consumer finds the scoped-application rule

- **WHEN** a consumer reads the type language documentation
- **THEN** it states that the voice is applied at the scope root, states that `html`/`body` application is not the supported path, and points to the boundary primitive for neutral descendant subtrees
