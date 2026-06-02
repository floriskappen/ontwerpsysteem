# Motion

Motion guidelines:
1. **Low-FPS Stepped Clock**: Animations progress in discrete, flip-book steps (configured system-wide at 8fps) rather than smooth digital floats.
2. **Instant Interactions**: Element interactions (hover, active press) are immediate and hard-cut (no transitions) to emphasize mechanical contact.
3. **Reduced Motion**: All ambient particle fields and grid cycles are completely frozen or hidden on `prefers-reduced-motion: reduce`.
