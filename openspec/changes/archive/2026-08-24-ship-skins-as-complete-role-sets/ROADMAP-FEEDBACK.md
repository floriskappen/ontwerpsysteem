# Roadmap feedback

- The roadmap's skin-format bullet reads as if skins "name the derivation from Change 3
  that produces them"; the design that actually works puts derivation names in the semantic
  token source and skins carry only their four supply values — the roadmap should have said
  where each piece of the contract lives.
- "Ship skins … as importable CSS" under C1's slot silently depends on emitting BOTH selector
  forms (`.ontwerp[data-skin]` and `:root[data-skin]`); without the attribute form a whole-app
  consumer cannot apply a shipped file at all, which the roadmap's scoped-consumer done
  condition never surfaces.
- The roadmap never says whether the base skin gets its own file; C6 ships one file per
  alternate skin (base renders from the token CSS) and the deltas now say so. Future work on
  skin emission should keep that reading or reopen it explicitly.
