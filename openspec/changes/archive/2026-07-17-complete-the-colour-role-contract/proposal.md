# Proposal: complete-the-colour-role-contract

## Why

Real consumer integrations (struggles S2, S10) exposed two gaps in the semantic colour
contract: there are no roles for focus-ring, destructive, disabled, or muted — the single
toasted red doubles as accent *and* danger — and the derivation of the long-tail colours
(ink-soft/quiet/faint greys, borders, on-ink, surface-deep/claim, blooms) from a skin's
ink + paper + accent is implicit, forcing consumers and skin authors to reverse-engineer
it. Downstream changes (`ship-skins-as-complete-role-sets`, `add-shadcn-adapter`) build
directly on this contract.

## What Changes

This change touches the **token contract consumers depend on** (naming grammar, token
metadata) and the **design-language documentation machinery**. All changes are additive —
no existing token is renamed, retyped, or removed.

- **token-format — naming grammar additions:** the primitive-tier grammar formally
  recognises alpha-variant names (`<base>-a<step>`, e.g. `ink-a65`) as alpha-ramp steps
  over an existing base primitive; validation fails on an alpha variant whose base does
  not exist.
- **token-format — role provenance metadata:** every colour-carrying semantic token
  declares (via a DTCG `$extensions` entry) whether a skin must **supply** its value or
  the value is **derived**; derived roles name the derivation rule that produces them.
  Validation enforces presence and that derivation references resolve.
- **design-language — colour role contract documentation:** `language/colour.md` must
  carry a roles table covering every semantic colour role (role, what may consume it,
  provenance), kept in sync with the token source by a validation check; derivation rules
  (mix ratios / alpha ramps over ink + paper + accent) are registered with stable IDs in
  a machine-readable registry that the token metadata resolves against.
- **Content (authored under the contract, not specced):** the new roles themselves —
  focus-ring, destructive (+ soft), disabled text/border/surface, the documented muted
  mapping — and the actual derivation formulas land as token files and `colour.md` prose
  conforming to the machinery above. Which roles exist and their values are design-system
  content, per this repo's OpenSpec scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `token-format`: naming grammar gains the alpha-variant primitive production; semantic
  colour tokens gain a required provenance declaration with resolvable derivation
  references.
- `design-language`: the colour language document must enumerate the complete role
  contract; derivation rules get a machine-readable registry; validation keeps tokens and
  the roles table from drifting.

## Impact

- `design-system/source/values/semantic/color.tokens.json`, `primitive/color.tokens.json`
  (additive roles + provenance metadata), `component/component.tokens.json` (consumers of
  the roles where components reference them).
- `design-system/language/colour.md` (roles table + derivation prose) and a new
  `design-system/language/colour.derivations.json` registry.
- Validation tooling (naming check, provenance check, derivation resolution, roles-table
  sync).
- Consumers: purely additive; unblocks `ship-skins-as-complete-role-sets` (Wave 2) and
  `add-shadcn-adapter` (Wave 3). No migration required.
