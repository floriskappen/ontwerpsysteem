## 1. Reconcile motion sources

- [x] 1.1 Remove the obsolete smooth UI transition/easing affordances from canonical motion tokens and update motion language/recipe metadata to state immediate interactions and stepped periodic timing (covers design-language scenarios: rest-pose and stepped-motion rule; smooth affordance rejection).
- [x] 1.2 Replace smooth easing declarations on periodic atmosphere animations with the established stepped timing while preserving selectors, keyframes, durations, endpoints, and reduced-motion rest rules (covers showcase scenario: interactions and periodic atmosphere contract).

## 2. Add focused contract checks

- [x] 2.1 Add named validation/test coverage that fails for transition or smooth-easing interaction declarations and for non-stepped periodic atmosphere timing, and passes for stepped timing with reduced-motion coverage (covers propagation-validation motion-contract scenarios).
- [x] 2.2 Add a regression check that rejects out-of-scope changes and verifies the accepted showcase baseline remains the oracle without new components, skins, effects, dependencies, versions, releases, or visual redesign (covers showcase baseline and propagation scope scenarios).

## 3. Verify generated surfaces

- [x] 3.1 Regenerate build outputs from canonical sources and verify token schema, alias resolution, shipped CSS, and showcase output contain no forbidden smooth motion affordances.
- [x] 3.2 Run `npm run build`, `npm run validate`, `npm test`, reduced-motion checks, zoo parity checks, and `openspec validate motion-contract-consistency --strict`; record only observed results and do not edit the accepted baseline.
