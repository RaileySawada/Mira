const { createTransformer } = require("babel-jest");
module.exports = createTransformer({
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [
    ({ types }) => ({
      visitor: {
        MemberExpression(path) {
          if (path.matchesPattern("import.meta.env.VITE_TURNSTILE_SITE_KEY")) {
            path.replaceWith(types.stringLiteral(""));
            return;
          }
          if (path.matchesPattern("import.meta.env.PROD")) {
            path.replaceWith(
              types.memberExpression(
                types.identifier("globalThis"),
                types.identifier("__MIRA_PRODUCTION__"),
              ),
            );
          }
        },
      },
    }),
  ],
});
