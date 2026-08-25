## 1. Bundle integration guide (templates/consumer-AGENTS.md)

- [x] 1.1 Rewrite the adoption section around Cases A/B/C: whole-app (`:root`), island (scope on chrome roots only, ancestor trap named, scoped imports, fonts, boundary at inner seams, skin slot, shadcn adapter pointer), retrofit (honest reskin statement + migration checklist: shadows→none, radius→0, palette→semantic roles, font→Archivo, status glyphs→marks/states; adapter as accelerator).
- [x] 1.2 Add the operational notes: CSS-reset interaction (voice-assumes-inheritance + the `.ontwerp button, .ontwerp select { text-transform: inherit }` Preflight counter-rule) and role-based testing guidance (assert roles/semantics — never palette utilities or glyphs).

## 2. Language and templates

- [x] 2.1 `language/type.md`: normative utility-mark scope rule — mono-uppercase is for data (numerals, counts, machine identifiers, coded events); prose labels/subtitles/eyebrows stay Archivo lowercase; mono-uppercase on prose is out of system.
- [x] 2.2 `templates/consumer-README.md` use-it steps match the three cases; `templates/DESIGN.md` gains an "Adoption" field recording whole-app / island / retrofit.

## 3. Repo docs

- [x] 3.1 `README.md` Cases 1–3 aligned with the bundle guide's three adoption modes (same rules, same pointers).

## 4. Verification

- [x] 4.1 Extend the bundle-content tests: shipped AGENTS.md asserts Case B start-to-finish artifacts (ancestor trap, checklist pairs, counter-rule, testing rule); design-language tests assert the type.md data/prose split.
- [x] 4.2 Run `npm run build`, `npm run validate`, `npm test`, and `openspec validate rewrite-consumer-integration-guide --strict`.
