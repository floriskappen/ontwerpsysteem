## Why

The colour role contract (C3) declares every semantic colour token as `supply` or
`derive` and registers the derivation rules, but no artifact acts on it. The demo skins
still override only ~9 roles, and derived roles (`text-quiet/-muted/-faint`, the disabled
tier, borders, `destructive`) bottom out in cream/oxblood primitives — so on a live zoo
theme switch the greys read warm-yellow on cool skins and fixed oxblood collides with the
accent on warm/red skins (S10). A skin must ship as a *complete* role set: the supply core
plus every derived colour computed from it, so switching a skin reskins everything.

## What Changes

- **Skin definition = the supply set only.** A canonical skin source holds, per skin, just
  the supply-provenance roles (paper `color.surface.page`, ink `color.text.default`, accent
  `color.accent.base`, danger `color.destructive.base`). The build expands each through the
  derivation registry into a complete block covering every colour-carrying role.
- **Per-skin destructive.** `color.destructive.base` is skin-supplied (already `supply` in
  the C3 contract); every demo skin now supplies its own danger pigment so it reads as
  danger against that skin's accent, not a global oxblood. `destructive.soft` derives from it.
- **Importable skin CSS.** The build emits one importable skin file per skin under the
  dedupe-safe `.ontwerp[data-skin="<name>"]` slot (C1), not just zoo demo data.
- **Single source, no drift.** The zoo's `skins.mjs` and theme bar are generated from /
  validated against the same canonical skin source; the theme bar reskins the full role set
  (quiet/muted/faint/disabled/destructive move per theme) and its hand-set bloom/pollen vars
  fold into roles the registry already covers.
- **Coverage gate.** A validation gate walks every colour-carrying semantic token and fails
  if any skin neither supplies nor derives it — a new skin cannot silently strand a token.

Additive: no token is renamed, retyped, or removed; the `:root` and scoped token builds are
unchanged. Consumers gain importable complete skins.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `build-pipeline`: build expands the canonical skin source through the derivation registry
  into complete per-skin CSS in the `data-skin` slot, and generates the zoo skin data from it.
- `distribution`: the bundle ships importable skin files, each a complete role set, in the
  dedupe-safe slot.
- `showcase`: the zoo theme bar applies complete skins (full role set) generated from the
  canonical skin source, not hand-authored partial overrides.
- `propagation-validation`: a coverage gate asserts each skin supplies-or-derives every
  colour-carrying token.

## Impact

- New canonical skin source + generated importable skin CSS under `dist/`.
- `design-system/source/zoo/data/skins.mjs`, `sections/theme-bar.mjs` (generated / full role set).
- Build (`scripts/lib/build-core.mjs`): derivation compute engine, skin expansion, skin outputs.
- Validation tooling: the skin coverage gate.
- Depends on C2 (live aliases) and C3 (provenance + derivation registry); unblocks release-v1.
