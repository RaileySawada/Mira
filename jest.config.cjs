module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: { url: "http://localhost/" },
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/server/"],
  setupFilesAfterEnv: ["<rootDir>/tests/support/setup.ts"],
  transform: { "^.+\\.[tj]sx?$": "<rootDir>/tests/support/transform.cjs" },
  transformIgnorePatterns: [
    "/node_modules/(?!(estree-util-.*|style-to-object|inline-style-parser|react-markdown|remark-.*|rehype-.*|unified|bail|devlop|is-plain-obj|trough|vfile.*|unist-.*|mdast-.*|micromark.*|hast-.*|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities.*|ccount|escape-string-regexp|markdown-table|zwitch|trim-lines|longest-streak|html-url-attributes|html-void-elements)/)",
  ],
  moduleNameMapper: {
    "\\.(css|svg|png)$": "<rootDir>/tests/support/assetMock.cjs",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/types/**"],
  coverageDirectory: "coverage",
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
