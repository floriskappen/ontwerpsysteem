## 1. Repair canonical consumer guidance

- [x] 1.1 Update `README.md` Case A and Case B instructions to name complete root/scoped token, component, effect, font, and shadcn adapter mounts, using `adapter.scoped.css` for islands.
- [x] 1.2 Update `design-system/templates/consumer-AGENTS.md` and `design-system/templates/consumer-README.md` with matching imports, `.ontwerp` root placement, and boundary/leakage safeguards; keep the files focused on wiring rather than adding integration machinery.
- [x] 1.3 Review `design-system/templates/DESIGN.md` adoption-case wording for consistency without expanding its pin-file scope.

## 2. Verify assembled documentation contract

- [x] 2.1 Add a named documentation path audit that checks every documented Case A/Case B asset path against `design-system/dist/release/`, including `values/shadcn/adapter.scoped.css`.
- [x] 2.2 Add regression assertions for complete whole-app mounts, same-root island mounts, forbidden broad scope placement, and boundary guidance; ensure each consumer-integration scenario has a failing check.
- [x] 2.3 Run the build, documentation audit, validation, tests, and strict OpenSpec validation; confirm generated release documentation matches the canonical templates.
