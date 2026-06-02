## 1. Versioning + changelog scaffolding

- [x] 1.1 Add `design-system/VERSION` (seed initial version) and decide the scheme (lean semver)
- [x] 1.2 Add `CHANGELOG.md` with the per-release entry format: version, date, recipe/language IDs touched, propagation note, additive-vs-breaking marker
- [x] 1.3 Document the changelog entry conventions (where the IDs come from, what a propagation note must say) in `design-system/change-propagation.md`

## 2. Build assembles the consumer bundle

- [x] 2.1 Add a bundle-assembly step to the build that emits `design-system/dist/release/` from built outputs + the durable design surface (built values, fonts, `language/`, `recipes/` + index, zoo source, rendered `index.html`, `VERSION`, `CHANGELOG.md`)
- [x] 2.2 Generate or template the consumer `AGENTS.md` into the bundle (reading order for a consuming agent), kept in sync with the dev reading order
- [x] 2.3 Ensure assembly excludes dev machinery (scripts, tests, openspec, accepted-zoo baseline) and is deterministic
- [x] 2.4 Add a test asserting bundle contents (required files present, machinery absent) and byte-identical re-assembly
- [x] 2.5 Gitignore `design-system/dist/release/` on the development branch

## 3. Release publishing flow (agent-drafted, human-approved)

- [x] 3.1 Add a `release` script that bumps `VERSION` and drafts `CHANGELOG.md` entries from recipe/language IDs touched since the previous release (using `implementsRecipes` + durable-change signals)
- [x] 3.2 Make the script stop for human review/approval before publishing — never auto-publish
- [x] 3.3 On approval, publish the assembled bundle to the dedicated `release` branch (one commit per release) and create a matching tag
- [x] 3.4 Wire `release` into `package.json` scripts and document it in the dev `AGENTS.md`

## 4. Consumer-side contract

- [x] 4.1 Define the consumer pin-file format (`.design/DESIGN.md`): pinned version + SHA, adopted parts, deviations (adapted/omitted/extended) by exception — ship as a template
- [x] 4.2 Document the consumer workflow: add `release` branch as a submodule pinned to a release, the `sync` convention (`git submodule update --remote` + show the changelog slice), and updating the pin file on sync
- [x] 4.3 Add a short consumer-facing guide (in the bundle) covering pin, sync, and propagation

## 5. Verify + seed

- [x] 5.1 `npm run build`, `npm run validate`, `npm test`, and `openspec validate --all --strict` all pass
- [x] 5.2 Cut the initial release to seed the `release` branch and tag, and confirm a fresh submodule checkout yields a consumable bundle
