import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ["public/sw.js", "public/sw-rules.js"],
    languageOptions: {
      globals: { ...globals.serviceworker, module: "readonly" },
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js", "*.config.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
