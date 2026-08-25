## Why

The shipped motion contract says interactions are immediate and periodic motion is stepped, but the canonical motion values still expose smooth transition/easing affordances and the atmosphere CSS uses `ease-in-out`. This coherence correction is needed now because consumers can otherwise follow the language while receiving contradictory built values and shipped CSS.

## What Changes

- Remove or neutralise smooth UI transition/easing affordances from the canonical motion values and their generated outputs.
- Reconcile atmosphere timing with the established stepped-clock behaviour without changing the accepted visual baseline.
- Add focused regression coverage for transition/easing leakage and stepped periodic motion, while retaining reduced-motion coverage.
- Preserve the established light-paper visual language, existing effects, baseline output, dependencies, versions, and release decisions; do not add components, skins, effects, or redesign.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `openspec/specs/design-language`: motion language and recipes must expose only the immediate-interaction and stepped-periodic contract.
- `openspec/specs/showcase`: shipped and showcase motion must not provide smooth interaction transitions or smooth atmosphere easing.
- `openspec/specs/propagation-validation`: validation must catch smooth motion affordances and non-stepped periodic animation regressions.

## Impact

Affected canonical motion token files, atmosphere and related zoo styles, generated CSS/build outputs, motion language/recipe metadata, and focused tests/validation. No runtime dependency or public component API is added; this is a contract correction and may remove unused smooth-motion token affordances.
