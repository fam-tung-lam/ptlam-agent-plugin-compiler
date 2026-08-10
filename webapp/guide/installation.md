# Installation

Install Agent Plugin Compiler in the repository that owns your agent plugin.

## Requirements

- Node.js `22.6.0` or newer
- npm and a project `package.json`

The current documented contract is version `0.1.0-alpha.4`.

## Install the prerelease

Use `--save-exact` so the resolved compiler version is recorded without a range:

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler@next
```

Commit the resulting `package.json` and lockfile with your plugin source. A
locked compiler version keeps local and CI generation aligned.

## Confirm the executable

```bash
npm exec -- plugin-compiler --help
```

The help output should list `init`, `validate`, `check`, and `generate`, plus
the built-in provider IDs:

```text
claude, codex, copilot, gemini, kimi
```

## Run commands from another directory

Commands use the current working directory by default. Pass `--root` when the
plugin repository lives elsewhere:

```bash
npm exec -- plugin-compiler validate --root ../my-agent-plugin
```

`--root` is available to every command. Relative paths resolve from the current
working directory.

Next: [build a plugin in the quick start](/guide/quick-start), or review every
[CLI option](/reference/cli).
