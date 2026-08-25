## ADDED Requirements

### Requirement: Integration guide documents three adoption cases

The bundle's consumer documentation SHALL document three adoption cases as first-class, complete
paths: whole-app adoption (importing the `:root` token CSS with no scope class), island / partial
adoption (importing the scoped token, component, and effects CSS and applying the scope class to
the consuming chrome's root elements only — never to an ancestor of a subtree that must stay
neutral — with the boundary primitive at descendant seams inside the scope), and retrofit of an
existing application (stated honestly as a component-by-component reskin). The island case SHALL
carry the font wiring (scoped voice at the scope root, fonts CSS import) and the boundary recipe;
the retrofit case SHALL carry the migration checklist (shadows→none, radius→0, palette→semantic
roles, font→Archivo, status glyphs→status marks/states) and name the shadcn adapter as the
accelerator for shadcn-shaped chrome.

#### Scenario: A scoped consumer follows Case B start-to-finish

- **WHEN** a consumer adopting an island reads the guide and follows it top to bottom
- **THEN** they find the scope-on-chrome-roots-only rule with the ancestor trap named, the scoped
  imports, the font wiring, the boundary primitive for inner seams, and where skins apply
- **AND** no step requires copying or hand-re-scoping a shipped file

#### Scenario: A retrofitting consumer gets the honest checklist

- **WHEN** a consumer with an existing styled app reads the guide
- **THEN** the guide states that importing tokens alone restyles nothing and that adoption is a
  per-component rewrite
- **AND** the migration checklist names the concrete substitutions (shadows→none, radius→0,
  palette→semantic roles, font→Archivo, status glyphs→marks/states)

### Requirement: Consumer docs state the CSS-reset interaction

The bundle's consumer documentation SHALL state that the system's typographic voice assumes CSS
inheritance on a no-reset baseline, and SHALL provide the counter-rule recipe for reset-heavy
environments (Tailwind Preflight): re-assert `text-transform: inherit` on form controls inside the
scope (e.g. `.ontwerp button, .ontwerp select { text-transform: inherit }`), so the lowercase voice
survives a reset that pins `text-transform: none`.

#### Scenario: A Preflight consumer finds the counter-rule

- **WHEN** a consumer whose app ships Tailwind Preflight reads the guide
- **THEN** they find why buttons/labels revert to source casing under a reset and the scoped
  counter-rule that restores the voice

### Requirement: Consumer docs carry role-based testing guidance

The bundle's consumer documentation SHALL state how consumer tests should assert the system:
tests assert semantic roles and structure (a status mark exists, danger renders as a rule of the
destructive role, focus claims the border), never raw presentation utilities, palette class names,
or specific glyphs — so a skin swap or role reskin does not break the consumer's test suite.

#### Scenario: Consumer tests survive a reskin

- **WHEN** a consumer follows the documented testing guidance
- **THEN** their assertions reference roles and semantics rather than palette utilities or glyphs
- **AND** applying a different shipped skin does not require editing those tests
