## ADDED Requirements

### Requirement: Theming is light-only by design

The design language documentation SHALL define every skin as a light paper surface whose colour roles may vary by hue, while dark mode and lightness-polarity inversion are out of scope because they conflict with the paper, grain, multiply, and ink material language.

#### Scenario: Consumer finds the light-only stance
- **WHEN** a consumer reads the theming and anti-goals language
- **THEN** it finds that skins retain a light paper ground, that dark mode is intentionally out of scope, and why the material language requires that ground

### Requirement: Existing dark themes have a supported integration response

Consumer-facing design-system guidance SHALL state that an application with an existing `.dark` theme MUST either keep design-system chrome on its light paper surface or omit the design system from dark-mode surfaces, rather than requiring a dark design-system palette.

#### Scenario: Consumer integrates with an existing dark application
- **WHEN** an application switches its own surfaces to `.dark`
- **THEN** its integration guidance offers keeping the design-system chrome light or excluding the design system from those dark surfaces as supported choices

### Requirement: Light-only theming remains documentation-only

The light-only theming change SHALL not add a dark skin, dark-mode runtime behavior, or new visual token values; the constraint is violated if the change introduces any of those implementation artifacts.

#### Scenario: No dark implementation is introduced
- **WHEN** the change's source, token, and generated-value outputs are reviewed
- **THEN** they contain no new dark skin, dark-mode runtime path, or visual token values beyond the existing light system
