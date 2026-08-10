# Installation

Install Agent Plugin Compiler in the repository that owns your agent plugin.

## Installation

Use `--save-exact` so the resolved compiler version is recorded without a range:

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler
```

Commit the resulting `package.json` and lockfile with your plugin source. A
locked compiler version keeps local and CI generation aligned.
