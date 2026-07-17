# Type

Type standards:
1. **Lowercase Voice**: Titles and headers are written in lowercase text.
2. **Faces**: Archivo (weights 400–700) is the primary typographic voice, JetBrains Mono is reserved for numbers/values, and Caveat is used for handwritten numerals and marks.
3. **Hierarchy**: Displays are large and bold, body scales read with comfortable line heights.

## Wiring the fonts

Fonts are wired by importing `values/css/fonts.css` from its shipped location — one
`@font-face` per shipped face, with `src` urls that resolve to the bundle's `fonts/`
directory. Never hand-author `@font-face` rules for the system's faces: fonts.css is
generated from the same canonical face definitions (`fonts/faces.json`) the showcase
inlines, so it always matches exactly what ships.

## Scoped application

Font application is a scoped concern. Set the typographic voice — the font families
and the inherited voice properties (`text-transform`, `letter-spacing`) — on the
consumer's **scope root** element, never on `html` or `body`: applied to the document
root, the voice cascades into subtrees that must stay neutral (embedded widgets,
host-styled regions, third-party UI). To exclude a neutral descendant subtree
*inside* a scoped region, put the `.ontwerp-boundary` escape hatch on the seam
element — it ships in both token CSS files and can be re-pointed with
`--ontwerp-boundary-font`.
