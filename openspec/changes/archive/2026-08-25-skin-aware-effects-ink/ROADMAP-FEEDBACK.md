# ROADMAP-FEEDBACK

The roadmap's "replace every remaining cream ink literal … with the existing ink role"
read as a plain `var()` swap, but four of the six families paint alpha-modulated ink, so
the mechanical fix required relative-colour syntax (`rgb(from var(--color-ink) r g b / α)`)
to preserve the baseline — worth saying in the roadmap entry when the fix is not a plain
substitution. It also could not anticipate that the zoo page inlines style comments, which
puts even comment wording under the showcase gate.

Minor, non-blocking: the repo now brace-matches CSS in four places (build-core's
scoper, keyframe-coverage's gate, helpers.mjs' keyframes/rules parser, and the new
effect-ink `rulesWithBodies`). When a fifth consumer appears, extract one shared minimal
rule-walker into `scripts/lib/` instead of growing a fifth copy.
