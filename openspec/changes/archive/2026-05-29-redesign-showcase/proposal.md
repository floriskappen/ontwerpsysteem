## Why

The first showcase rendered the system as an exhaustive technical inventory — every token grouped by tier and `$type`, plus a seven-state matrix — in generic, accidentally-dark chrome. That reads as a debug tool, not a design system. It buried the system instead of showing it off, and surfaced internal structure (tiers, raw dimensions/durations/numbers) that belongs in the build outputs, not on a page. The zoo should be a curated, on-brand artifact that makes the system look like itself.

## What Changes

- Reframe the `showcase` capability from an exhaustive token gallery into a **curated, designed presentation**: colour shown as a palette, type as a specimen, and components shown in use. The complete token inventory stays in the build outputs (manifest + CSS), not on the page.
- The page is **rendered in the system's own aesthetic** — it consumes the system's own tokens (surface, ink, accent, type, spacing) and honours the system's visual decisions (e.g. corner treatment), so it reskins itself when tokens change.
- **Components are shown in use** with real CSS interaction (hover, focus) instead of an enumerated state matrix.
- **Fonts are self-hosted and embedded** so the page renders in its real typefaces offline, with no network requests.
- Motion/focus accessibility is retained: ambient motion respects `prefers-reduced-motion`; interactive components show a visible focus indicator.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `showcase`: replace the "gallery by tier/type", "strictly-token-styled demo elements", and "interaction-state matrix" requirements with a curated, themed, in-use presentation; update the motion/focus and self-contained requirements (the latter now also embeds self-hosted fonts). The "renders only from built outputs" requirement is unchanged.

## Impact

- Rewrites the showcase generator (`scripts/lib/showcase-core.mjs`) and its tests; the build now embeds fonts.
- New committed assets: `assets/fonts/*.woff2` (Archivo, JetBrains Mono — OFL), base64-inlined at build time.
- No change to the token contract, the build outputs (CSS/JS/Tailwind/manifest), or the `build-pipeline` capability. The manifest is still the showcase's data source.
