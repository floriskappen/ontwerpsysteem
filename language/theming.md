# Theming

Theming model:
1. **Skin Swap**: Switching themes changes color role assignments only.
2. **Structural Stability**: Typography, spacing, rules, and sizes are unchanged by themes.
3. **Cascade Integrity**: Components cascade roles dynamically so that swapping the roles updates all visual assets instantly.

## Light-only by design

Every skin is a **light paper** surface. Skins vary **hue** — the paper's tint, the
ink's cast, the accent's pigment — and their role assignments, never lightness
polarity. There is no dark mode, no inverted theme, and no skin that darkens the
sheet below its paper ground: this is a deliberate stance, not missing work.

The rationale is material, not stylistic. The entire language — paper grain, ink
on a light sheet, multiply-blended blooms, halftone texture — assumes light falls
*onto* the surface. A dark ground collapses it: multiply pools toward black
instead of letting pigment show, grain loses its tooth, and ink flips from mark
to hole. A "dark skin" would not be a variation of this system; it would be a
different design language wearing these token names.

## Integrating with an existing `.dark` theme

An application that already ships its own dark mode has exactly two supported
responses. Both are sanctioned answers, not deviations to record in the pin file:

1. **Keep the system's chrome on its light paper.** The system renders as a
   physical sheet on the page, and a sheet does not invert when the lights go
   down. Its island stays paper while the surrounding application switches.
2. **Omit the system from dark-mode surfaces.** Where the application goes
   dark, the design system simply is not mounted there.

Requiring or waiting for a dark design-system palette is not a supported path —
the system ships none, and a consumer owes itself none.
