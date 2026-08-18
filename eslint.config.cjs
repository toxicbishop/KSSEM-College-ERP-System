const { FlatCompat } = require("@eslint/eslintrc");


// FlatCompat bridges legacy "extends"-based configs into ESLint v9 flat config.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/pwa/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
    },
  },
];
