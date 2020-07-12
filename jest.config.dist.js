// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  coverageDirectory: "artifacts/reports/coverage/coveralls",
  moduleDirectories: [
    "dist",
    "src/test/helpers",
    "node_modules"
  ],
  testEnvironment: "node"
};
