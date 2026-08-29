# Components

Component guidelines:
1. **Opaque Buttons**: Buttons mask elements behind them, featuring a Ben-Day dot screen, thick bottom border, and instant press drop.
2. **Gutters for Fields**: Text fields use a solid block label column and thin rules.
3. **Pill Marks**: Status indicators are represented as boxed uppercase badges with a solid color indicator dot.
4. **Paper Cards**: Standard container cards use opaque warm paper, fully masking ambience and content behind them; a card is a sheet, never a translucent wash.
5. **Segmented Control**: A reusable pick-one mode selector of square hairline cells joined on a shared heavy rule. The selected cell inverts the unselected treatment — solid ink with paper text against paper with ink text — and switching is immediate: no slide, no transition. Distinct from the theme-switch affordance, which stays page chrome; consumers pick this class for their own modes.
6. **Visible Focus**: Every interactive component carries its own keyboard focus indicator — a 2px outline in the focus-ring role, offset off the edge — and ships it with the component. Focus is never delegated to the host page’s reset or left to the browser default.
7. **Dropdown Menu**: A pick-an-action menu that arrives under its invoker on the platform popover attribute — no script, and light-dismiss plus top-layer stacking come free. Its paper height grows in two stepped frames; its items remain fixed and unstaggered. The invoker's affordance is a solid square in the pill-dot convention, never a chevron glyph.
8. **Popover Note**: A short annotation standing off the paper on a hairline, on opaque warm ground with an accent left rule — spoken-for paper, not a translucent wash or floating card, so it carries no drop shadow. A note explains; it never asks the reader to act.
9. **Dialog Sheet**: A sheet laid over the page on the top layer, its paper height growing around fixed rows, over an ink wash rather than a blur. It is built on the popover attribute, so it light-dismisses but does **not** trap focus and its backdrop is not inert — a consumer needing a true modal keeps these classes and mounts them on a `<dialog>` opened with `showModal()`.
10. **Disclosure Fold**: An in-place fold on the `<details>` element's own open state; its body grows to intrinsic height in two stepped frames while its lines stay fixed and unstaggered. The sign is two hairline rules — a plus that loses its upright to become a minus — not a rotating chevron.
