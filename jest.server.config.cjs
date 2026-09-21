module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/server/**/*.test.ts"],
  transform: { "^.+\\.[tj]sx?$": "<rootDir>/tests/support/transform.cjs" },
  collectCoverageFrom: ["netlify/functions/**/*.ts"],
  coverageDirectory: "coverage/server",
  coverageReporters: ["text", "html", "json-summary"],
  coverageThreshold: { global: { functions: 100, lines: 100, statements: 100, branches: 100 } },
  clearMocks: true, restoreMocks: true,
};
