## 1. Replace hardcoded effect ink

- [x] 1.1 Update the shared atmosphere and weather source styles so grid, wind, mote, rain, splash, and snow ink declarations use the existing `--color-ink` role while preserving their opacity variables and all structure/timing (`showcase` effect-ink and baseline scenarios).
- [x] 1.2 Rebuild the root and scoped effects outputs from source and verify no generated artifact is hand-edited (`distribution` effect-CSS scenario).

## 2. Add skin propagation regression coverage

- [x] 2.1 Add a focused all-shipped-skins regression that resolves root and scoped effect CSS under every alternate skin and asserts grid, wind/mote, rain/splash, and snow ink follow the skin role (`propagation-validation` all-shipped-skins scenario).
- [x] 2.2 Add a failing-fixture assertion that identifies an affected effect family when a base cream ink literal is present (`propagation-validation` stranded-literal scenario).

## 3. Run existing gates and scope checks

- [x] 3.1 Run build, validation, and the full test suite; retain reduced-motion, token, and existing skin coverage (`showcase` and `distribution` scenarios).
- [x] 3.2 Verify accepted zoo output remains byte-identical and no new component, skin, effect, dependency, version/release artifact, downstream pin, or visual redesign is introduced (`propagation-validation` bounded-correction scenario).
- [x] 3.3 Run `openspec validate skin-aware-effects-ink --strict` and confirm every spec scenario has named regression coverage.
