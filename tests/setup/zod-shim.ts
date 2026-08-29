/**
 * zod shim for the Vite+ test runner.
 *
 * `@voidzero-dev/vite-plus-core` resolves the bare `zod` specifier to zod's
 * `@zod/source` export condition in test module graphs (Vite-Plus enables
 * source-export conditions). The zod source tree has no *runtime* `z`
 * namespace — it is assembled only by the package bundler, so
 * `import { z } from "zod"` arrives as `undefined` under the runner.
 *
 * This module, aliased in vitest.config.ts, re-exports the built
 * `v4/classic/external.js` entry (the package's canonical namespace +
 * parser surface) so the `z` namespace and named parsers behave exactly as
 * they do at runtime.
 */
import * as z from "../../node_modules/zod/v4/classic/external.js";

export * from "../../node_modules/zod/v4/classic/external.js";
export { z };
export default z;
