# Tasks — complete-the-colour-role-contract

## 1. Validator: alpha-variant naming grammar

- [x] 1.1 Extend `checkName` in `scripts/lib/validate-core.mjs` to recognise the
      `<base>-a<step>` production at the primitive tier: parse the suffix, resolve the
      base primitive within the same collection, error when it is missing, and error
      when the suffix appears on a semantic- or component-tier name.
- [x] 1.2 Add tests in `test/token-format.test.mjs`:
      `alpha-variant with existing base passes` (spec: *Alpha variant with an existing
      base primitive*), `alpha-variant with missing base fails naming the base` (spec:
      *Alpha variant whose base does not exist*), `alpha-variant suffix at semantic tier
      fails` (spec: *Alpha-variant name above the primitive tier*).

## 2. Validator: skin-provenance metadata

- [x] 2.1 In `validateEntries`, require an `$extensions["ontwerp.role"]` provenance
      entry (`"supply"` or `"derive"`) on every semantic-tier token of type `color`;
      require `derivation` when provenance is `"derive"` and forbid it when `"supply"`.
- [x] 2.2 Add tests in `test/token-format.test.mjs`:
      `semantic colour token without provenance fails` (spec: *Semantic colour token
      without a provenance declaration*), `derive without derivation id fails` (spec:
      *Derived role without a derivation reference*), `supply with derivation id fails`
      (spec: *Supplied role carrying a derivation reference*).
      > Note: the pre-existing `Semantic aliases a primitive` fixture gained a
      > `supply` provenance annotation — the gate now requires provenance on every
      > semantic colour token, so the fixture had to conform to stay a clean pass.

## 3. Derivation registry and resolution

- [x] 3.1 Create `design-system/language/colour.derivations.json`: an array of rules,
      each `{ id, inputs, formula }` where `formula` names its kind (`mix` with ratio,
      or `alpha` with step) and its parameters; author the actual rules for the derived
      roles (greys, borders, on-ink, surface-deep/claim, blooms) from ink + paper +
      accent — the formulas are content, the shape is the contract.
      > Note: two additive extensions to the named formula kinds, per design.md's
      > "a new kind is an additive schema extension": an `identity` kind (on-ink,
      > surface-ink, focus-ring are a supplied role unchanged), and an optional
      > `alpha` parameter on `mix` (the claim blooms are a mix laid on
      > translucently — the "composed rule" of design decision 3).
- [x] 3.2 Validator: load the registry; error on an entry missing `id`/`inputs`/
      `formula`, on duplicate IDs, and on an input that is not an existing skin-supplied
      semantic colour role; error on any token `derivation` reference that names an
      unregistered rule ID.
- [x] 3.3 Add tests in a new `test/colour-derivations.test.mjs`:
      `registry entry missing a field fails` (spec: *Registry entry missing a required
      field*), `duplicate rule ids fail` (spec: *Duplicate derivation rule IDs*),
      `input naming a non-supplied role fails` (spec: *Derivation input references a
      non-supplied role*), `token referencing unregistered rule fails` (spec: *Token
      names an unregistered derivation rule*).

## 4. Token content: complete the role set

- [x] 4.1 Add the new semantic colour roles to
      `design-system/source/values/semantic/color.tokens.json` (focus-ring, destructive
      + soft, disabled text/border/surface, muted aliases for the quiet/faint tier) with
      any new primitives they need in `primitive/color.tokens.json` (alpha variants
      follow the `<base>-a<step>` grammar). Values are content — pick them per
      `brief.md` and `language/colour.md` (destructive is distinct from accent; the
      focus ring is not a default blue ring, per anti-goals).
- [x] 4.2 Annotate every existing and new semantic colour token with its
      `ontwerp.role` provenance; derived tokens reference their registry rule IDs.
- [x] 4.3 Point component tokens at the new roles where a component consumes them
      (e.g. `field.border.focus` → the focus-ring role) — additive re-aliasing only, no
      renames.

## 5. Language: roles table and derivation prose

- [x] 5.1 Rewrite `design-system/language/colour.md`: the roles table (one row per
      semantic colour role: token path, what may consume it, provenance + rule ID for
      derived roles) and prose documenting each derivation rule (mix ratios / alpha
      ramps over ink + paper + accent), including the muted-tier mapping.
- [x] 5.2 Validator: parse the roles table and check it against the token source —
      error on an uncovered token, a row with no backing token, and a row whose
      provenance contradicts the token metadata.
- [x] 5.3 Add tests in `test/colour-derivations.test.mjs` (or alongside the language
      checks): `token absent from roles table fails` (spec: *Semantic colour token
      missing from the roles table*), `table row without backing token fails` (spec:
      *Roles-table row without a backing token*), `table provenance mismatch fails`
      (spec: *Roles-table provenance contradicts token metadata*).

## 6. Verification gates

- [x] 6.1 `npm run validate` passes end-to-end: DTCG schema conformance, naming grammar
      (incl. alpha variants), tier/alias resolution with no dangling or circular
      references, provenance + derivation resolution, roles-table sync.
- [x] 6.2 `npm run build` succeeds and the built outputs (CSS custom properties, JS,
      manifest) carry the new roles; `npm test` passes including the new named checks.
- [x] 6.3 Zoo check: rebuild the showcase and confirm the new roles render on the token
      sheet from the live built tokens, and that destructive/focus-ring usage respects
      contrast against their surfaces (browser-driven or the existing zoo-parity test,
      per config's preference for a real build + browser check).
      > Note: done structurally (no browser screenshots, per repo preference): the
      > built zoo HTML carries every new role as a `var()`-driven swatch (incl. the
      > new destructive group and the focus-ring swatch), the zoo-parity tests pass,
      > and computed WCAG contrast on paper: destructive.base 7.29:1,
      > destructive.soft 4.73:1, focus-ring 4.37:1, on-ink on destructive 7.29:1.
- [x] 6.4 `openspec validate complete-the-colour-role-contract` passes.
