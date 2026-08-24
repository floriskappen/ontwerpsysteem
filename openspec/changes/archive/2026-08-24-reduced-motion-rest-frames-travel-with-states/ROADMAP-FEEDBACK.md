The roadmap's C7 said "move the frames out of responsive.css into the states/weather
layers", but the frames needed re-authoring, not moving: the old block's combined
low-specificity selectors (`.bloom i, .grid i, .wxc`) lost the cascade to the very
animations they covered, so bloom and per-glyph header weather never actually rested
under reduced motion. A roadmap note that a rest rule must be at least as specific as
its animation rule (or simply "one rest rule per animation selector") would have saved
the discovery.

Second note: `npm run check:motion` is a manual seam. It carries the only behavioural
verification for three showcase scenarios ("settles every animated surface", "reduced
motion is respected", "focus is visible"), but nothing in `npm test` or
`npm run check` invokes it — the structural gate in validate.mjs catches a *missing*
rest frame, not a present-but-wrong pose. Wiring was deliberately left out here (the
script resolves playwright from sibling checkouts and exits non-zero when absent, so
bolting it onto `check` today would break playwright-less environments); a later
roadmap entry should decide where it hangs once playwright availability is guaranteed
machine-wide.
