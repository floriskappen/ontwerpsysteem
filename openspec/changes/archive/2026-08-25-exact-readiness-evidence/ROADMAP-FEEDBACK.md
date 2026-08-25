# ROADMAP-FEEDBACK — exact-readiness-evidence

The remediation entry said "including the exact strict-spec count" without saying that
`openspec validate --all --strict` counts active-change deltas alongside merged capability specs, so the
number is a function of archival state (9 specs + 1 unarchived delta = 10 at this state) — the same
ambiguity that let blocker #5's stale "9" look plausible. Future evidence items should name the command
verbatim and require its literal Totals line plus composition, rather than a derived spec count.
