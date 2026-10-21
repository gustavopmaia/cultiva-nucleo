import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["coverage", "node_modules", "dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { regex: "^[^.]", message: "domain does not import packages or node modules" },
            { regex: "/(application|adapters)/", message: "domain does not know outer layers" },
          ],
        },
      ],
    },
  },
);
