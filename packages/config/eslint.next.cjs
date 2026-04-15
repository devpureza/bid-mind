/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [require.resolve("./eslint.base.cjs"), "next/core-web-vitals"],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
};
