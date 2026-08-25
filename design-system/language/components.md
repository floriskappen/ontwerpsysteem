# Components

Component guidelines:
1. **Opaque Buttons**: Buttons mask elements behind them, featuring a Ben-Day dot screen, thick bottom border, and instant press drop.
2. **Gutters for Fields**: Text fields use a solid block label column and thin rules.
3. **Pill Marks**: Status indicators are represented as boxed uppercase badges with a solid color indicator dot.
4. **Paper Cards**: Standard container cards utilize a claim background to highlight content.
5. **Segmented Control**: A reusable pick-one mode selector of square hairline cells joined on a shared heavy rule. The selected cell inverts the unselected treatment — solid ink with paper text against paper with ink text — and switching is immediate: no slide, no transition. Distinct from the theme-switch affordance, which stays page chrome; consumers pick this class for their own modes.
6. **Visible Focus**: Every interactive component carries its own keyboard focus indicator — a 2px outline in the focus-ring role, offset off the edge — and ships it with the component. Focus is never delegated to the host page’s reset or left to the browser default.
