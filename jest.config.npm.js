// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  collectCoverage: false,
  moduleDirectories: [
    "artifacts/npm",
    "src/test/helpers",
    "node_modules"
  ],
  testEnvironment: "node"
};
