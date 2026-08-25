## Why

Shadcn/Tailwind consumers use a different semantic variable contract from ontwerp, so adopting the system currently requires each consumer to hand-author and maintain a crosswalk. The completed colour-role contract now supplies the focus, destructive, muted, disabled, and surface roles needed for a stable adapter; this change makes that mapping importable without changing consumer components.

## What Changes

- Add an optional shadcn variable crosswalk under the shipped values surface.
- Provide equivalent `:root` and `.ontwerp`-scoped forms for whole-app and island consumers.
- Map shadcn semantic variables to ontwerp semantic roles, including focus ring, destructive, muted, card, background, foreground, border, and primary roles.
- Document the adapter's mapping decisions, including muted semantics, the dedicated focus-ring role, and square radius mapping.
- Keep the adapter values-only: no component reimplementations, runtime loader, or new runtime dependency.
- Extend build and bundle validation so the generated adapter is shipped and its two forms stay structurally aligned.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec/specs/distribution`: the consumer bundle additionally ships an optional shadcn values adapter in root and scoped forms.
- `openspec/specs/build-pipeline`: the build emits the adapter from one canonical source into the consumer bundle and validates its root/scoped parity.

## Impact

Affected build assembly and validation, new source CSS under `design-system/source/values/shadcn/`, and generated release artifacts under `design-system/dist/release/values/`. No component source, showcase behavior, token names, or package dependencies change. The adapter adds an additive consumer-facing output; existing imports remain valid.
