## Why

The consumer guidance names whole-app and island adoption, but its examples do not consistently prove that the shipped component/effect CSS and scoped shadcn adapter are mounted. A consumer can therefore follow the guide and get tokens without working component classes, or leak the adapter outside the `.ontwerp` island. This change repairs the end-to-end instructions against the assembled release bundle without adding integration machinery.

## What Changes

- Make whole-app guidance explicitly import the shipped root token, component, and effect targets and show the corresponding system root.
- Make island guidance import the `.ontwerp`-scoped token, component, effect, font, and `values/shadcn/adapter.scoped.css` targets, with the adapter mounted under the same `.ontwerp` root.
- Preserve and make auditable the existing boundary, scope-placement, and leakage safeguards.
- Verify every documented path and import against the assembled consumer bundle.

## Capabilities

### New Capabilities

- `consumer-integration`: Documents complete, verifiable whole-app and island adoption contracts for the shipped bundle.

### Modified Capabilities

None.

## Impact

Affects the consumer integration documentation in `README.md`, `design-system/templates/`, and the assembled release bundle's documentation. No runtime dependency, component implementation, token contract, or new integration machinery is added.
