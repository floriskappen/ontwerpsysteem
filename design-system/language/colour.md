# Colour

Colour parameters:
1. **Curated Ramps**: Ramps are mapped in a perceptual space to prevent luminance drift.
2. **Supplied Roles**: A skin supplies exactly four colours — the paper (`color.surface.page`), the ink (`color.text.default`), the accent (`color.accent.base`), and the destructive pigment (`color.destructive.base`). Every other colour role computes from those in one pass.
3. **Role Swapping**: Themes are applied by shifting the underlying colour role assignments; structure never changes.

## The role contract

Every semantic colour token declares its provenance in
`$extensions["ontwerp.role"]`: `supply` (a skin must provide the value) or
`derive` (a registered rule computes it from supplied roles). The table below is
a checked projection of the token source — the validation gate fails when a
token is missing from it, a row has no backing token, or a row's provenance
contradicts the token's metadata.

| Role | Consumers | Provenance |
| --- | --- | --- |
| `color.surface.page` | the sheet itself — page background, the root of every layout | supply |
| `color.surface.warm` | slightly toasted panels and strips | derive · `surface-warm` |
| `color.surface.deep` | margins, footer strips, the alert folio | derive · `surface-deep` |
| `color.surface.claim` | claimed / selected cells, the card fill | derive · `surface-claim` |
| `color.surface.claim-hover` | claimed cells on hover | derive · `surface-claim-hover` |
| `color.surface.ink` | inverted ink cells, solid and hovered buttons | derive · `surface-ink` |
| `color.surface.disabled` | inert control fills | derive · `surface-disabled` |
| `color.text.default` | primary text; field, card, badge and button text | supply |
| `color.text.soft` | secondary text | derive · `text-soft` |
| `color.text.quiet` | tertiary text, utility marks | derive · `text-quiet` |
| `color.text.muted` | adapter vocabulary — consumers asking for "muted" text | derive · `text-quiet` |
| `color.text.faint` | placeholders, axis labels, footnotes | derive · `text-faint` |
| `color.text.on-ink` | text on ink surfaces — hovered buttons, inverted cells | derive · `text-on-ink` |
| `color.text.disabled` | inert control text | derive · `text-disabled` |
| `color.accent.base` | links on hover, the margin rule, selection | supply |
| `color.accent.soft` | the accent softened | derive · `accent-soft` |
| `color.focus-ring` | focused field borders, focus outlines | derive · `focus-ring` |
| `color.destructive.base` | irreversible actions — delete, revoke, destroy | supply |
| `color.destructive.soft` | destructive hover washes, secondary danger | derive · `destructive-soft` |
| `color.border.default` | field, card and badge borders | derive · `border-default` |
| `color.border.quiet` | inner rules, resting link underlines | derive · `border-quiet` |
| `color.border.muted` | adapter vocabulary — consumers asking for "muted" rules | derive · `border-quiet` |
| `color.border.strong` | button borders, emphasis rules | derive · `border-strong` |
| `color.border.accent` | accent-weight rules | derive · `border-accent` |
| `color.border.disabled` | inert control borders | derive · `border-disabled` |

## Derivation rules

The machine-readable registry lives in
[`colour.derivations.json`](./colour.derivations.json); token metadata resolves
against it by rule ID, and every rule computes from supplied roles only — no
rule feeds on another rule's output. Three formula kinds exist:

- **mix** — interpolate the first input toward the second by `ratio` in sRGB;
  an optional `alpha` parameter then sets the result's opacity (a composed
  rule, standing in for a would-be chain).
- **alpha** — the first input with its alpha channel set to `step` percent.
- **identity** — the first input's value, unchanged.

In prose, over paper *P* = `color.surface.page`, ink *I* = `color.text.default`,
accent *A* = `color.accent.base`, destructive *D* = `color.destructive.base`:

- **The grey steps** are ink let down with paper, never a neutral grey ramp:
  soft = mix(*I*, *P*, 0.2), quiet = mix(*I*, *P*, 0.5), faint = mix(*I*, *P*, 0.7).
- **Rules (borders)** are the ink at fixed water levels: quiet 25%, default 65%,
  strong 95%; the accent rule is *A* at 85%; the disabled rule is ink at 15%.
- **On-ink** text is the paper showing through: identity(*P*). **Inverted
  surfaces** are the ink itself: identity(*I*).
- **Deep and warm surfaces** are the paper toasted toward the accent:
  warm = mix(*P*, *A*, 0.05), deep = mix(*P*, *A*, 0.1).
- **The claim blooms** are the accent let down 75% toward paper and laid on
  translucently: mix(*A*, *P*, 0.75) at 55% opacity, deepening to 85% on hover.
- **The disabled tier** is ink washes: text at 45% (between quiet and faint),
  borders at 15%, fills at 8%.
- **Soft pigments** step 20% toward paper: accent.soft = mix(*A*, *P*, 0.2),
  destructive.soft = mix(*D*, *P*, 0.2).
- **Focus** is the accent claiming the whole border: identity(*A*) — never a
  default blue ring.

The reference cream sheet's primitives were hand-tuned within these recipes
(the warm paper steps carry a little more sun than a literal mix); the registry
is the canonical computation a skin falls back on for any role it does not
hand-supply.

## The muted mapping

"Muted" is not a native word of this system — the native steps are quiet and
faint. It exists as real alias tokens so arriving consumers (and adapter
crosswalks) land on the same ink: `color.text.muted` is the quiet ink,
`color.border.muted` is the quiet rule. Use quiet/faint when speaking the
system's own language.

## Destructive is not the accent

The toasted red accent never doubles as danger. Irreversible actions use the
destructive role — its own deeper pigment (oxblood on the reference sheet),
distinct in duty from the accent yet harmonious with the palette. A skin
supplies it alongside paper, ink, and accent.

## Alpha-variant primitives

Primitive names may carry the alpha-ramp production `<base>-a<step>` (e.g.
`ink-a65` — the ink at 65% opacity). The base primitive must exist in the same
collection; semantic and component names must never carry the suffix — those
tiers name intent, not composition.
