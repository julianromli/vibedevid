// Type augmentation for @testing-library/jest-dom matchers.
//
// @testing-library/jest-dom ships its Vitest augmentation as
// `declare module 'vitest' { interface Assertion ... }`. Since Vitest 4.1.6+
// (which Vite+ bundles) that augmentation silently no-ops — the merge no longer
// reaches the `Assertion` interface exported from the runtime, so `tsc` reports
// `Property 'toHaveAttribute' does not exist on type 'Assertion'`.
// See https://github.com/vitest-dev/vitest/issues/10411
//
// We import the test runtime from `vite-plus/test`, so we augment that module
// directly with jest-dom's matcher types. Runtime registration still happens via
// `import '@testing-library/jest-dom/vitest'` in tests/setup/vitest.setup.ts.
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vite-plus/test" {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
