import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The existing application still has broad API/form payloads whose exact shapes
      // are supplied at runtime. Keep these visible without blocking builds while the
      // types are migrated incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      // React 19's new compiler-oriented rules flag established hydration/data-loading
      // effects and event-time audit timestamps. They remain warnings for review rather
      // than release-blocking errors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
