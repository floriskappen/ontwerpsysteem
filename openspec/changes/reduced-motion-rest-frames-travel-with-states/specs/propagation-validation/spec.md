## ADDED Requirements

### Requirement: Reduced-motion coverage for shipped keyframes

The validation gate SHALL verify that every `@keyframes` declared in the shipped CSS has a corresponding `@media (prefers-reduced-motion: reduce)` rule that neutralises it for the selectors that reference it: the rule SHALL stop the animation (an `animation`/`animation-name` reset such as `animation: none`) and SHALL assert an explicit rest pose — a declared static value for each property the keyframe animates, or removal of the animated element from the layout. A shipped keyframe with no such reduced-motion rule, or one whose reduced-motion rule stops the animation without asserting a rest pose, SHALL fail validation with an error naming the uncovered keyframe. The check reads the shipped CSS, so a reduced-motion rule in a stylesheet that is not part of the shipped output does not count as coverage.

#### Scenario: Uncovered keyframe fails

- **WHEN** a `@keyframes` in the shipped CSS has no `@media (prefers-reduced-motion: reduce)` rule that both stops its animation and asserts a rest pose for the selectors referencing it
- **THEN** the validation gate fails, naming the uncovered keyframe

#### Scenario: Covered keyframe passes

- **WHEN** every `@keyframes` in the shipped CSS has a reduced-motion rule that stops its animation and asserts a rest pose or removes the animated element
- **THEN** the keyframe-coverage check passes

#### Scenario: A rest frame outside the shipped CSS does not satisfy the gate

- **WHEN** a shipped keyframe's only reduced-motion rule lives in a stylesheet that the build does not ship
- **THEN** the gate reports that shipped keyframe as uncovered
