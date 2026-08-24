# V1 worker notes

Frontier pass: read this first. One short entry per thing hit; newest last.

- `design-system/source/zoo/sections/theme-bar.mjs` hardcodes the base skin's swatch
  colours (`#F1ECE0` / `#B84A39`) because the generated data module carries `vars: null`
  for the base skin. Pre-existing, left alone in C6 — but it is a second copy of the cream
  supply values and will silently drift if cream's canonical source ever changes. A
  generated base-skin swatch pair in `skinsToData()` would close it.
