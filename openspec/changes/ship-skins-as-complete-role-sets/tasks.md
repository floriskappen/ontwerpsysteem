## 1. Canonical skin source + derivation engine

- [x] 1.1 Add a canonical skin source (each skin = only the supply-provenance roles: paper, ink, accent, destructive), replacing the 9-var demo overrides. Include rose as the first complete skin, regenerated from its supply core.
- [x] 1.2 Add a derivation compute engine in `scripts/lib/skins-core.mjs` (new module, not `build-core.mjs` as originally written — the engine is a self-contained contract worth its own file; `build-core.mjs` imports it) implementing the registry's three formula kinds — `mix` (sRGB interpolate by ratio, optional alpha), `alpha` (set opacity), `identity` — reading rules from `design-system/language/colour.derivations.json`.
- [x] 1.3 Read the supply/derive provenance and each derived role's rule ID from the semantic colour token source, so the engine takes no hard-coded role list.

## 2. Emit skins as complete, importable CSS

- [x] 2.1 For each skin, compute every `derive`-provenance role over the skin's supplied roles and emit one skin CSS file under the `.ontwerp[data-skin="<name>"]` slot, declaring supplied + computed roles together.
- [x] 2.2 Make skin emission deterministic (same source + registry ⇒ byte-identical output) and fail the build, naming skin/role/rule, on an unregistered rule or an input that is not a supplied role.
- [x] 2.3 Include the emitted skin files in the consumer bundle assembly under the built values, in the dedupe-safe slot.

## 3. Generate zoo skin data + full-role-set theme bar

- [x] 3.1 Generate the zoo's `skins.mjs` from the canonical skin source (complete role set per skin), never hand-authored.
- [x] 3.2 Update `sections/theme-bar.mjs` to emit the full role set per skin; drop the hand-set bloom/pollen block where the registry-covered roles (`surface-claim`, `accent-soft`) now carry the values.

## 4. Skin coverage validation gate

- [ ] 4.1 Add the skin coverage gate to the validation tooling: assert each skin's supply set equals the supply-provenance role set, and that expanding it yields a value for every colour-carrying semantic token.
- [ ] 4.2 Fail the gate — naming the skin and offending role — on a stranded token, an omitted supply role, or a supplied derive-provenance role.

## 5. Verification (each scenario → a named check)

- [ ] 5.1 **skin-declares-every-role**: assert an emitted skin file declares a custom property for every colour-carrying semantic role (BP · "Skin file declares every colour role").
- [ ] 5.2 **derived-from-supplied-core**: assert a derived role's emitted value equals its rule applied to the skin's supplied roles, independent of the base palette (BP · "Derived role is computed from the skin's supplied core").
- [ ] 5.3 **bad-derivation-halts**: assert emission fails on an unregistered rule / non-supplied input (BP · "An unregistered or unresolvable derivation halts skin emission").
- [ ] 5.4 **zoo-data-matches-skins**: rebuild after a skin-source edit; assert emitted skin CSS and generated `skins.mjs` both reflect it with the same complete role set (BP · "Zoo skin data matches the shipped skins").
- [ ] 5.5 **one-file-reskins-surface**: apply a shipped skin file + `data-skin` over the token CSS; assert every role (greys, borders, on-ink, disabled, destructive) takes the skin value, none on the base palette (distribution · "One skin file reskins the whole colour surface").
- [ ] 5.6 **destructive-per-skin**: assert each shipped skin supplies its own `color.destructive.base` and a derived `color.destructive.soft`; assert no shared global danger value (distribution · "Danger reads as danger per skin" + "Destructive is supplied, its soft variant derived").
- [ ] 5.7 **coverage-gate-strands**: feed a skin missing a colour token's supply/derivation; assert the gate fails naming skin + token (propagation-validation · "A skin that strands a colour token fails").
- [ ] 5.8 **coverage-gate-supply-mismatch**: feed a skin that omits a supply role or supplies a derived role; assert the gate fails naming the mismatched role (propagation-validation · "A skin whose supply set does not match the contract fails").
- [ ] 5.9 **coverage-gate-passes**: assert a complete skin passes the gate (propagation-validation · "A complete skin passes").
- [ ] 5.10 **zoo-full-swap** (owner-verified in the live zoo, no headless screenshots): switch skins and confirm the complete surface moves — greys, disabled tier, blooms, destructive — with layout/type/components unchanged (showcase · "The reskin swaps the complete colour role set").
- [ ] 5.11 **no-relink**: assert the zoo styles contain no re-declaration of built component token custom properties re-linking them to colour roles (showcase · "The swap cascades through the built output alone").
- [ ] 5.12 **demo-skins-generated**: assert the theme bar's skin data is the generated complete-role-set output, not a hand-authored partial subset (showcase · "Demo skins are generated, not hand-authored partial overrides").
- [ ] 5.13 **demo-not-shipped-tokens**: assert the theming demo is presented as illustrative, distinct from the real palette in the build outputs (showcase · "Demo skins are not misrepresented as shipped tokens").
- [ ] 5.14 **baseline gates**: `openspec validate ship-skins-as-complete-role-sets --strict`, `npm run build`, and `npm run validate` pass; skin outputs are emitted and deterministic.
