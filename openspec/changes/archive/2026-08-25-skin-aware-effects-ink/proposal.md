## Why

The complete-role-set skin contract currently stops at surfaces and token-driven components: shipped grid, wind, rain, splash, mote, and snow effects still paint with the base cream ink literal. This release-blocking coherence defect means applying an alternate skin leaves ambient effects stranded on cream instead of following the selected ink role.

## What Changes

- Replace hardcoded effect ink colours in the source styles with the existing semantic ink role/custom property, preserving opacity and the accepted visual baseline.
- Ensure the generated root and scoped effects bundles carry the same skin-aware effect rules.
- Add focused regression coverage that verifies every shipped skin changes effect ink across the affected effect families, alongside existing token, build, validation, and test gates.
- Do not add components, skins, effects, dependencies, redesign, baseline updates, version changes, or release artifacts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `showcase`: shipped effect layers must draw ink from colour roles so complete skin swaps cover ambient and weather effects.
- `distribution`: generated effects CSS must preserve skin-resolvable ink references in both root and scoped consumer outputs.
- `propagation-validation`: regression coverage must detect effect ink literals that strand alternate skins on the base palette.

## Impact

Affected source effect styles, CSS build output, and skin regression tests. No public token names, dependencies, or runtime APIs change; the change preserves existing markup, timing, and accepted zoo output while correcting colour-role propagation.
