# Roadmap feedback

The C5 done-conditions ("no shipped generator returns an HTML/SVG string as its primary
API; the determinism test exists; the zoo output is byte-identical") held up and are all
met. What the roadmap could not have anticipated, and what cost the most interpretation:
`weatherText` renders word spaces as bare text nodes between glyph spans, so "the data
function is the single source of cardinality" and "one markup element per datum" cannot
both hold literally for it — future generator changes should say whether text-run helpers
follow the field rule or a node-per-datum variant (recorded in DECISIONS.md §1).
