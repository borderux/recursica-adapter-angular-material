// lint-staged config for this standalone package, ported from
// recursica-adapter-mantine-v8's scripts/lint-staged.config.cjs.
//
// .cjs, not .js: this package.json has "type": "module", so a plain .js file using
// `module.exports` here would be parsed as ESM and fail to load — "Failed to read
// config from file" from lint-staged, which then fails the Husky pre-commit hook
// outright.
module.exports = {
  // For all non-JS/TS files, just format them
  "*.{json,md,css,scss,html}": ["prettier --write"],

  // For JS/TS files: format and lint only the staged files, but type-check
  // the whole package (check-types isn't meaningful scoped to a subset of
  // files in TS project mode).
  "*.{js,ts}": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
    `eslint --fix ${filenames.join(" ")}`,
    "npm run check-types",
  ],
};
