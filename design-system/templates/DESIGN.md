<!--
  Pin file for an application that consumes the ontwerp design system.
  Copy this to your app (e.g. .design/DESIGN.md) and keep it current.
  Record DECISIONS AND DEVIATIONS, not an exhaustive element catalogue —
  the design system's own recipes and zoo are the conformance reference.
  Your agent updates this whenever it advances the pin or propagates a change.
-->

# Design system pin

- **System:** ontwerp design system
- **Pinned version:** <e.g. 0.1.0>
- **Pinned commit:** <release-branch SHA the submodule points at>
- **Submodule path:** <e.g. vendor/ontwerp>
- **Last synced:** <date>

## Adopted

<!-- Which parts of the system this app uses. -->
- e.g. paper surface + ink/accent colour roles
- e.g. stepped motion clock, button ink-press, field-as-gutter, lifecycle states

## Deviations (by exception only)

### Adapted
<!-- Used, but changed for this app's constraints — say why. -->
- e.g. weather particles disabled on mobile (perf budget)

### Omitted
<!-- Deliberately not used yet. -->
- e.g. pigment coda — no use case yet

### Extended
<!-- App-specific UI with no design-system equivalent — note which recipes it follows. -->
- e.g. `.invoice-table` — new; follows `component.*` recipes

## Propagation log

<!-- Append one line per pin advance. -->
- <date> <old-version> → <new-version>: <what was propagated / re-checked>
