## 1. Canonical adapter source

- [x] 1.1 Add the values-only shadcn crosswalk source with root declarations, semantic-role references, and inline documentation for muted, ring, destructive, and square-radius decisions.
- [x] 1.2 Add source-level checks that reject component selectors, markup, scripts, runtime-loader code, and unresolved ontwerp role references (covers distribution scenarios “Adapter stays a thin crosswalk” and “Consumer can identify non-obvious mappings”).

## 2. Build and bundle integration

- [x] 2.1 Add deterministic generation of root and `.ontwerp`-scoped adapter CSS from the canonical source, preserving identical custom-property names and values (covers build scenarios “Adapter outputs are present after a build” and “Root and scoped adapters cannot drift”).
- [x] 2.2 Assemble both adapter artifacts under `values/shadcn/` in the consumer release bundle without adding a package or runtime dependency (covers distribution “Whole-app consumer imports the adapter”, “Island consumer imports the adapter”, and build “Dependency-free values build”).
- [x] 2.3 Add validation for required shadcn variables, semantic-role resolution, root/scoped parity, and selector confinement; make failures name the missing or unresolved mapping (covers build “Missing role mapping fails the gate”).

## 3. Verification

- [x] 3.1 Add focused tests for root and scoped CSS consumption, values-only boundaries, documented mapping decisions, output parity, and bundle placement.
- [x] 3.2 Run `npm run build`, `npm run validate`, `npm test`, and `openspec validate add-shadcn-adapter --strict`; confirm generated outputs are deterministic and no component or runtime dependency was introduced.
