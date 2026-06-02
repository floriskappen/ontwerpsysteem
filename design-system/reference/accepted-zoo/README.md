# Reference: Accepted Pre-Refactor Zoo Baseline

This directory preserves the accepted visual and behavioural baseline of the design system showcase ("the zoo") prior to the modular repository restructuring.

## Contents

- [source/scripts/lib/showcase-core.mjs](file:///Users/kade/git/personal/ontwerpsysteem/design-system/reference/accepted-zoo/source/scripts/lib/showcase-core.mjs): The original monolithic showcase generation logic.
- [source/test/showcase.test.mjs](file:///Users/kade/git/personal/ontwerpsysteem/design-system/reference/accepted-zoo/source/test/showcase.test.mjs): The showcase integration tests.
- [generated/index.html](file:///Users/kade/git/personal/ontwerpsysteem/design-system/reference/accepted-zoo/generated/index.html): The fully compiled, self-contained showcase HTML page, including embedded styles and assets.

## Purpose

- This baseline serves as a source of truth for the visual look and behavior of the showcase.
- It must not be edited.
- As the repository is refactored and modularized, the newly generated showcase (in `design-system/dist/zoo/`) must be compared against `generated/index.html` to verify visual and interactive parity.
- This directory can be deleted only after the new modular showcase fully replaces it and the user explicitly accepts the replacement.
