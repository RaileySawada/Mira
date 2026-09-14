module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: { url: "http://localhost/" },
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  transform: { "^.+\\.[tj]sx?$": "<rootDir>/tests/transform.cjs" },
  moduleNameMapper: { "\\.(css|svg|png)$": "<rootDir>/tests/assetMock.cjs" },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/types/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "json-summary"],
  coverageThreshold: {
    global: { functions: 100, lines: 100, statements: 99, branches: 95 },
  },
  clearMocks: true,
  restoreMocks: true,
};
