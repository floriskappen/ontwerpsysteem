# Roadmap feedback

The C11 entry says to ship `.ontwerp-root { isolation: isolate }` as "the CSS the
scoped bundle needs", but the scoped build prefixes every class rule, so that CSS
only works with the chrome root nested one element *inside* the token scope — a
constraint worth stating (or a same-element form worth designing for) in any
future change that adds scope-relative primitives.

Related, from the seam audit: nothing in-repo ever supplies the class — no
element in the zoo, its sections, or any doc example carries
`class="ontwerp-root"`, so the fixed-behind-scope pattern ships as
consumer-facing CSS only (like the skin adoption forms) and the running
showcase never demonstrates it. A future baseline-refresh change could put it
on the zoo body so the documented pattern is exercised by its own showcase.
