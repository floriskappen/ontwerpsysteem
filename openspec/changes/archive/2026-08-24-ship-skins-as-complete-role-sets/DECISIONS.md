# Decisions — ship-skins-as-complete-role-sets (worker pass, §4–§5)

## 1. Skin files now emit both adoption forms (spec clause tasks never mentioned)

**What:** `skinCss()` emits two blocks per skin — `.ontwerp[data-skin="<id>"] { … }` and
`:root[data-skin="<id>"] { … }` with identical declarations.

**Why:** The distribution delta says "Importing a skin file and setting the `data-skin`
attribute SHALL be the only steps required", carrying C1's "(with the equivalent attribute
form for whole-app adoption)". With only the scoped block, a whole-app consumer (no scope
class, attribute on `:root`) matched nothing — importing + setting the attribute was NOT
sufficient, so the SHALL was false as implemented. Tasks 2.1/2.3 only name the
`.ontwerp[data-skin]` slot; the spec requirement is stronger and is what got implemented.

**Rejected:** Documenting the limitation instead ("whole-app also needs the scope class") —
that weakens a stated capability into a documented gap, the exact roadmap-audit failure mode.

## 2. Coverage gate reuses `computeSkinRoles`, reports strands via prop coverage

**What:** Layer 2h in `validate-core.mjs` calls the build's own `computeSkinRoles()` and
derives stranded-token errors from which contract roles are missing from its returned
props, rather than parsing its error strings.

**Why:** The gate must test the same expansion the build ships with, or the two can drift.
Prop-coverage reading also avoids double-reporting: an omitted supply role is reported once
by the exact-supply-set check, and each downstream gap once as a strand.

**Rejected:** Duplicating expansion logic inside validate-core (drift risk); passing through
computeSkinRoles' raw error list (duplicated omit errors, message-string coupling).

## 3. `emitSkins()` gained an injectable `skinsPath`; zoo module write guarded

**What:** `emitSkins(distDir, { skinsPath })` forwards to `expandAllSkins`; when a foreign
source is injected the checked-in `data/skins.mjs` is NOT regenerated.

**Why:** Task 5.3 requires asserting that *emission* halts on a bad skin. Without an
injection point the only way to test it was mutating the real canonical source mid-test.
The guard is not test-only hygiene: regenerating a checked-in source file from a non-
canonical source would be wrong for any caller.

**Rejected:** Testing the halt by editing `skins.json` and restoring it in a `finally` —
a failed assertion mid-test leaves the repo tree corrupted.

## 4. All fourteen named checks live in one new file, `test/skins.test.mjs`

**What:** Checks 5.1–5.9 and 5.11–5.14 are grouped in one file by capability describe-block,
each test titled with its check id.

**Rejected:** Distributing them across `build-pipeline`/`distribution`/`showcase`/
`colour-derivations` tests to mirror the capability split — defensible, but it scatters one
change's audit trail across four files and mixes skin fixtures into suites with different
shared-build fixtures. Check ids in titles make task→test mapping mechanical.

## 5. Showcase delta: copied the pre-existing scenario verbatim into MODIFIED

**What:** `specs/showcase/spec.md` now also carries "The reskin is shown by swapping only
colour roles" alongside the strengthened "The reskin swaps the complete colour role set".

**Why:** `openspec validate --strict` failed: a MODIFIED requirement replaces the whole
block, so archiving without the copy would silently drop a scenario the accepted spec still
makes. Not a tasks-vs-spec conflict — a defect in the delta itself, caught by the gate.

## 6. 5.14's CLI gates verified at run time, not re-asserted as subprocesses in the test

**What:** Test 5.14 asserts the parts that belong in vitest (skin outputs deterministic
across builds, byte-stable regenerated zoo module, shipped in bundle); the three CLI gates
(`openspec validate --strict`, `npm run build`, `npm run validate`) were run and passed
before ticking the box.

**Rejected:** Spawning the CLIs from inside the test — slow, and the suite already runs
them via CI/handoff convention; the tick records their run.

## 7. "One skin file per shipped skin" excludes the base skin — kept as implemented

**What:** No `cream.css` is emitted; the bundle ships one file per *alternate* skin
(11 files), and the base skin's module entry stays `vars: null`.

**Why:** The build/distribution wording says "per skin" / "per shipped skin", and cream is
in the canonical source. But the base palette is already shipped as the token CSS — a
cream.css would be a machine-generated parallel copy of values the bundle carries anyway,
and reverting to base is removing the attribute (or selecting the base theme), which works
today because no block matches. The committed §2 code and the generated module's
`vars: null` contract already encode this reading; the coverage gate still checks cream
for completeness, so nothing escapes the contract.

**Rejected:** Emitting cream.css for literal compliance — redundancy presented as a feature,
and a second in-bundle statement of the base palette that consumers may treat as the
primary one. If the frontier pass disagrees, it is a three-line emitter change plus the
5.1 count assertion.

---

## Review rulings (review pass)

Each implementer call above, ruled against the repo constitution (single canonical source,
no parallel statements, capability = spec text not task ticks):

1. **Dual adoption forms — ACCEPT.** The SHALL ("importing + setting `data-skin` is the
   only step") was false with the scoped block alone; this implements the spec instead of
   documenting it down. Review strengthened 5.1: it now parses each form's brace block and
   asserts both exist AND carry identical declarations (a divergent `:root` block would
   have passed the old union parse).
2. **Gate reuses `computeSkinRoles` — ACCEPT.** One expansion implementation; prop-coverage
   avoids double-reporting omissions. Verified the gate is wired, not decorative:
   `validateTokenDir` supplies both `options.skins` (this change) and `options.derivations`
   (pre-existing), so layer 2h runs under `npm run validate`.
3. **Injectable `skinsPath` — ACCEPT.** Required-in-production seam (`runBuild` →
   `emitSkins(distDir)`), optional only for the injection point; the write guard prevents
   regenerating a checked-in file from a fixture.
4. **One test file for all fourteen checks — ACCEPT.** Its single job is this change's
   verification contract; four describe-blocks share one expensive build fixture. It does
   not duplicate the capability suites' jobs — post-archive skin tests should land here,
   keeping those suites general.
5. **Verbatim scenario copy in the showcase delta — ACCEPT.** A MODIFIED requirement
   replaces the whole block; dropping the scenario silently would lose accepted behaviour.
6. **CLI gates run outside vitest — ACCEPT.** Matches house convention (5.10 is likewise
   owner-verified); 5.14 still pins determinism and bundle presence in-suite.
7. **Base skin gets no file — ACCEPT**, and the reading is now written down: both delta
   specs say "per alternate skin" so archiving records it rather than leaving "per shipped
   skin" to contradict the emitter.

Review edits beyond the rulings: replaced the test's hand mirror of `skinsToData`
(`skinsModuleToVars`) with the exported generator; removed an unused `SUPPLY_ROLES`
fixture constant and a redundant re-expansion in 5.4; fixed the gate's pass 2 to flag
only derive-provenance strands — an omitted supply role was being reported twice
(once as an omission, once as a strand), contradicting this file's decision 2;
hoisted the canonical-skins error label into one `SKINS_FILE` constant in
validate-core.mjs (it was written out three times).
