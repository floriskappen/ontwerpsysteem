# V1 worker loop

This file adapts the exact worker-owned sequence in `V1_WORKER_HANDOFF.md` to the DSH roadmap
runner. The handoff remains authoritative for scope, traps, task details, and the frontier cutoff.

- [x] **ship-skins-as-complete-role-sets** (archived as `2026-08-24-ship-skins-as-complete-role-sets`) — Finish C6. Do not redo its committed implementation.
  Complete the coverage gate and named automated checks. Task 5.10 remains unchecked because it is
  owner-verified in the live zoo; `V1_WORKER_HANDOFF.md` records that confirmation and explicitly
  permits archive once oversight recognises it.
- [ ] **effects-as-pure-data-modules** — Implement C5 exactly from its existing approved change.
  Byte-identical zoo output and the accepted baseline are the oracle; never regenerate the baseline.
- [ ] **reduced-motion-rest-frames-travel-with-states** — Implement C7 exactly from its existing
  approved change. Coverage is judged against shipped CSS, with the already-decided rest poses.
- [ ] **document-atmosphere-mount-and-cost-contract** — Create and implement C11 from
  `V1_ROADMAP.md` and the handoff. Encode the decided counts, opt-in default, cardinality, and
  isolation as generator defaults and validation—not new visual judgement or expansive prose.

When these four are archived, report `ROADMAP-COMPLETE` and stop. Do not create or draft C8, C9,
C10, C13, or C14. They belong to the later frontier pass described in `V1_WORKER_HANDOFF.md`.
