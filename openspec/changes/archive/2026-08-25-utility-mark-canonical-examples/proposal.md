## Why

The canonical zoo currently teaches a rule that `language/type.md` forbids: its field gutter and theme-switch labels use the mono-uppercase utility-mark treatment even though they are human-written prose. Because the zoo is the system's worked example, this contradiction can make consumers copy the wrong typography; the correction is needed before release evidence can be trusted.

## What Changes

- Render the canonical field and theme labels in the existing Archivo lowercase label treatment rather than `typography.mark`/uppercase.
- Keep the existing mono-uppercase utility mark unchanged for numeric, measured, machine-identifying, and coded data examples.
- Add focused source-level markup/style regression coverage proving prose labels are lowercase Archivo and utility-mark data remains available.
- Do not add components, dependencies, visual values, or alter the resolved type-language contract. **BREAKING-adjacent**: canonical example markup/style is corrected to match the already-published prose rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `showcase`: canonical examples SHALL demonstrate the utility-mark boundary consistently with the documented type language.

## Impact

Affected zoo section markup and component/theme styles, plus targeted showcase regression tests. No public token names, token values, dependencies, or runtime APIs change; generated `dist/` output is rebuilt but not hand-edited.
