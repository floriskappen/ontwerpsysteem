## ADDED Requirements

### Requirement: Effect generators expose a data-returning primary function

Each effect generator SHALL expose a primary function that returns plain structured data — arrays of objects or an object of such arrays — rather than a markup string. The returned data SHALL carry the framework-neutral values a caller needs to render the effect itself: geometric coordinates, per-element animation parameters, and a stable per-element `index`. This lets a consumer map the data onto its own elements (`<circle>`, `<i>`, `<span>`) in any framework without parsing or injecting markup.

#### Scenario: Primary export returns structured data

- **WHEN** a generator's primary function is called
- **THEN** it returns an array of plain objects (or an object of such arrays) whose fields hold coordinates, animation parameters, and a per-element index
- **AND** it returns no HTML or SVG markup string

#### Scenario: Every generator has a data primary

- **WHEN** the effect modules are inspected
- **THEN** every generator that produces a field of elements exposes a data-returning function as its primary API
- **AND** no generator's only export is a markup-string function

### Requirement: Effect determinism is an enforced property of the code

Effect generators SHALL be deterministic: for a given set of inputs they SHALL produce byte-identical output on every call within a process. Randomness SHALL be derived strictly from the element index (no per-call reseeding), results SHALL be memoized per parameter set so repeated calls return the same data, and the effect modules SHALL contain no wall-clock or nondeterministic runtime source (such as `Math.random`, `Date.now`, or `performance.now`). An architecture check SHALL enforce the clock-free rule so a future edit cannot silently reintroduce runtime jitter.

#### Scenario: Repeated calls are byte-identical

- **WHEN** a generator is called twice with the same inputs
- **THEN** the two results are deeply equal
- **AND** the repeat call is served from a per-parameter-set memo rather than recomputed nondeterministically

#### Scenario: Effect modules are clock-free

- **WHEN** the architecture check scans the effect modules
- **THEN** it finds no reference to `Math.random`, `Date.now`, or `performance.now`
- **AND** the check fails the build or test suite if any is introduced

#### Scenario: Output depends only on the index and declared inputs

- **WHEN** a generator produces its data
- **THEN** each element's values are a pure function of its index and the function's arguments, with no dependence on call order or elapsed time

### Requirement: Markup wrappers are derived from the data functions

Where an effect module also ships a markup-returning wrapper (so an existing string-consuming caller keeps working), that wrapper SHALL build its markup from the output of the data function rather than generating the field independently. The data function SHALL be the single source of the field's cardinality and per-element values, so the rendered markup and the data can never diverge.

#### Scenario: Wrapper renders from the data function

- **WHEN** a markup wrapper produces its output
- **THEN** it calls the corresponding data function and renders one markup element per returned datum
- **AND** it does not compute element coordinates or parameters independently of that data

#### Scenario: Wrapper and data agree on the field

- **WHEN** a wrapper's markup is compared to its data function's output for the same inputs
- **THEN** the markup contains exactly one element per datum in the same order
