import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/design-system/reference/**',
    ],
    // Several tests run real production builds (zooBuiltOnce / runBuild), which
    // take seconds on their own and stretch further when vitest workers run in
    // parallel on this box — the default 5s per-test cap made the gate flaky
    // under load (see motion-contract-consistency DECISIONS.md D9). A hung test
    // still fails; it just gets an honest budget first.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
