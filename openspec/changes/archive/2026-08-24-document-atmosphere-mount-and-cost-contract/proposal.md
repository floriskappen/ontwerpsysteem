## Why

The atmosphere generators already create substantial ambient fields, but their mount cardinality, default cost envelope, weather opt-in behaviour, and stacking-context requirements are implicit. Consumers can therefore multiply the work per tile or place the layers outside the token scope, producing avoidable performance and rendering failures. C5 has now established the data-generating APIs this contract must govern.

## What Changes

- Document that the ambient stack mounts once per chrome root, never per tile, card, or list item.
- Add machine-readable atmosphere recipe metadata for mount cardinality and cost limits.
- Set generator defaults and validation around the decided envelope: 6–51 particles per field, three blooms, and weather disabled unless explicitly opted in.
- Provide the fixed-behind-scope mounting pattern: an isolated chrome root, ambient descendants within the scope tree, and content lifted above `z-0`.
- Add validation scenarios that fail when generator defaults exceed the envelope or weather is enabled by default.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `design-language`: atmosphere language and recipe metadata gain normative mount-cardinality and cost-contract requirements.
- `propagation-validation`: validation gains atmosphere cost/default checks.
- `showcase`: the shipped atmosphere mounting pattern and scoped isolation contract are specified.

## Impact

Affected atmosphere language and recipe JSON, effect generator defaults, scoped atmosphere CSS, and validation tests. No new runtime dependency or visual redesign is required; existing C5 data modules remain the source of generated fields.