## Why

Consumers can currently read theming as an invitation to provide a dark mode, even though the system's material language depends on a light paper ground. The resolved light-only stance needs to be explicit in the durable language and consumer-facing guidance before the V1 integration documentation and release work.

## What Changes

- Document that skins vary hue and role assignments while retaining a light paper ground; dark mode is intentionally out of scope.
- Add the material-language rationale to the anti-goals so dark mode is rejected as a contract violation rather than treated as missing work.
- Document supported handling for consumers that already have a `.dark` theme: keep design-system chrome light or exclude the system from dark surfaces.
- Keep this change documentation-only: do not add a dark skin, dark-mode runtime, or new visual values.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `design-language`: define the light-only theming stance and the supported consumer response to existing dark surfaces.

## Impact

- Affects `design-system/language/theming.md`, `design-system/language/anti-goals.md`, and the corresponding shipped consumer documentation.
- No runtime dependencies, token names, component APIs, or generated visual values change.
