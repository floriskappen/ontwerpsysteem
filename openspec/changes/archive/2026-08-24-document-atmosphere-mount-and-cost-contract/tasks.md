## 1. Atmosphere contract sources

- [x] 1.1 Add explicit atmosphere generator/configuration defaults covering every weather field, the three-bloom default, and weather-off-by-default behaviour; expose the defaults for validation without duplicating field data.
- [x] 1.2 Extend `atmosphere.grid.breathing` recipe metadata with `mountCardinality: "once-per-root"`, particle/bloom cost limits, and the weather opt-in default; regenerate `design-system/recipes/index.json`.
- [x] 1.3 Update `design-system/language/atmosphere.md` with concise factual mount, cost, opt-in, and fixed-behind-scope instructions, including the isolated chrome root and content-above-`z-0` pattern.

## 2. Scoped atmosphere mounting

- [x] 2.1 Add the scoped chrome-root isolation primitive to the atmosphere style source and ensure ambient descendants remain behind content in the documented stacking order.
- [x] 2.2 Verify the generated scoped effects CSS and zoo consume the source primitive without introducing a global body/html atmosphere layer or changing accepted effect markup.

## 3. Validation coverage

- [x] 3.1 Add an atmosphere validation function and wire it into the validation CLI so it inspects executable defaults rather than prose or recipe metadata.
- [x] 3.2 Add named tests for valid defaults, particle counts below/above 6–51, bloom count other than three, and weather enabled by default; include a check that an uncontracted field cannot pass silently.
- [x] 3.3 Add tests for recipe cardinality/cost metadata and the fixed-behind-scope CSS primitive, covering the scenarios in the design-language and showcase deltas.

## 4. Verification

- [x] 4.1 Run `npm run build`, `npm run validate`, and `npm test`; confirm the accepted zoo effect regions remain byte-identical.
- [x] 4.2 Run `openspec validate document-atmosphere-mount-and-cost-contract --strict` and confirm every spec scenario has a corresponding named validation check.