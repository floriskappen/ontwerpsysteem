## 1. Correct canonical prose examples

- [x] 1.1 Update the existing field-gutter and theme-switch label styles to use the existing Archivo lowercase label treatment, without changing tokens or adding components.
- [x] 1.2 Verify the canonical field and theme section markup remains the same component inventory and contains the intended prose labels.

## 2. Add regression coverage

- [x] 2.1 Add `canonical prose labels` coverage that fails when either field or theme label uses utility-mark typography or uppercase transformation (covers Scenario: Prose labels do not teach utility-mark styling).
- [x] 2.2 Add `data utility mark remains available` coverage that verifies the existing type specimen retains mono-uppercase styling and prose examples are excluded (covers Scenario: Data marks remain available and constrained).
- [x] 2.3 Add `showcase surface preservation` coverage that verifies no new component/dependency/token-value or type-language changes accompany the correction (covers Scenario: Correction preserves the established showcase surface).

## 3. Verify generated artifacts

- [x] 3.1 Run the build and confirm the generated showcase carries the corrected label styles without hand-editing `dist/`.
- [x] 3.2 Run `npm run validate`, `npm test`, and strict OpenSpec validation for `utility-mark-canonical-examples`; record summaries and resolve any failures.
