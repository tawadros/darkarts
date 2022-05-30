module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: [
    "plugin:node/recommended",
    "next"
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  overrides: [
    {
      files: ["hardhat.config.js"],
      globals: { task: true },
    },
    // Fix for devDependencies and unpublished require
    {
      files: ["{test,scripts}/**/*.js", "hardhat.config.js"],
      rules: {
        "node/no-unpublished-require": 0
      }
    }
  ],
};
