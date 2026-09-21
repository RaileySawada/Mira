module.exports = {
  testEnvironment: "node",

  testMatch: ["<rootDir>/tests/server/**/*.test.ts"],

  transform: {
    "^.+\\.[tj]sx?$": "<rootDir>/tests/support/transform.cjs",
  },

  collectCoverageFrom: ["netlify/functions/**/*.ts"],

  coverageDirectory: "coverage/server",

  coverageReporters: ["text", "html", "json-summary"],

  coverageThreshold: {
    global: {
      functions: 90,
      lines: 90,
      statements: 90,
      branches: 85,
    },
  },

  clearMocks: true,
  restoreMocks: true,
};
