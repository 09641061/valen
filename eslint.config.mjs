import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const effectRestrictedSyntax = [
  {
    selector:
      "ImportDeclaration[source.value='react'] ImportSpecifier[imported.name=/^use(Layout)?Effect$/]",
    message:
      "useEffect and useLayoutEffect are banned in Valen. Use Server Components, Server Actions, useSyncExternalStore, or event handlers.",
  },
  {
    selector: "CallExpression[callee.name=/^use(Layout)?Effect$/]",
    message:
      "useEffect and useLayoutEffect are banned in Valen. Use Server Components, Server Actions, useSyncExternalStore, or event handlers.",
  },
  {
    selector:
      "CallExpression[callee.object.name='React'][callee.property.name=/^use(Layout)?Effect$/]",
    message:
      "React.useEffect and React.useLayoutEffect are banned in Valen. Use Server Components, Server Actions, useSyncExternalStore, or event handlers.",
  },
];

const processEnvRestrictedSyntax = [
  {
    selector: "MemberExpression[object.name='process'][property.name='env']",
    message:
      "Direct process.env access is banned outside src/lib/env.ts. Use getServerEnv() from '@/lib/env'.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: 250, skipBlankLines: false, skipComments: false },
      ],
      complexity: ["error", 12],
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-useless-return": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": [
        "error",
        ...effectRestrictedSyntax,
        ...processEnvRestrictedSyntax,
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: 250, skipBlankLines: false, skipComments: false },
      ],
      complexity: ["error", 12],
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-useless-return": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/lib/env.ts", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...effectRestrictedSyntax],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/features/*/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message: "UI components must not import 'server-only'.",
            },
            {
              name: "@/lib/env",
              message: "UI components must not import server environment config.",
            },
          ],
          patterns: [
            {
              group: ["*/data-access*", "**/data-access*", "@/features/*/data-access*"],
              message: "UI components must not import data-access modules.",
            },
            {
              group: ["*/loaders*", "**/loaders*", "@/features/*/loaders*"],
              message: "UI components must not import server loaders.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message: "UI primitives must not import 'server-only'.",
            },
            {
              name: "@/lib/env",
              message: "UI primitives must not import server environment config.",
            },
          ],
          patterns: [
            {
              group: ["@/features/**"],
              message: "Shared UI primitives must not depend on feature modules.",
            },
            {
              group: ["*/data-access*", "**/data-access*", "@/features/*/data-access*"],
              message: "UI primitives must not import data-access modules.",
            },
            {
              group: ["*/loaders*", "**/loaders*", "@/features/*/loaders*"],
              message: "UI primitives must not import server loaders.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/env",
              message: "App Router files must not import '@/lib/env' directly.",
            },
          ],
          patterns: [
            {
              group: ["*/data-access*", "**/data-access*", "@/features/*/data-access*"],
              message: "App Router files must use feature loaders/actions instead of data-access directly.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
