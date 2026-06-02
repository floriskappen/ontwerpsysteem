# Design System Brief

This document outlines the core system thesis and aesthetic direction. It is the primary guide for understanding the "why" and "feel" of the system.

## The Core Thesis

Our design system is inspired by the warmth, tactile quality, and grown order of the physical world. It captures the feeling of **warm paper, ink, pigment, grain, stepped motion, and nature expressed as behaviour rather than decoration**.

### Key Visual & Behavioral Pillars

1. **Physical & Tactile Surfaces**:
   - The primary background represents warm paper tooth.
   - Text and layout lines are treated as ink and pigment, using blend modes like `multiply` and soft bleed effects.
   - Ambience features deterministic random grain or weathering.

2. **Nature as Behaviour, Not Illustration**:
   - We avoid literal stickers, leaves, or illustration motifs of nature.
   - Instead, nature is expressed through growth algorithms (such as phyllotaxis/sunflower packing seeds) and physical dynamics (wind, rain, weather particles).

3. **Stepped Motion & Determinism**:
   - Easing and clocks use stepped motion intervals rather than ultra-smooth app-store transitions.
   - Ambience is deterministic—derived from cell indices or seeding values—so it remains reproducible and free of runtime clock jitter.

4. **Lifecycle States**:
   - Component and application states are represented using growth metaphors: *fallow* (empty/inactive), *germinating* (loading), *ripe* (complete/done), and *rising* (active/focus).

5. **The Showcase "Zoo"**:
   - The zoo is the human-facing output. It is the designed, experiential reference page that represents the system wearing itself. It is compiled from modular sources and the value layer.
