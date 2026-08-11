# Continuous Integration

Generated output only helps users if it matches the source that produced it.
`plugin-compiler check` proves that without writing anything, which makes stale
output a failing build instead of a bug report.

## The two commands CI needs

| Command    | Reads output | Writes | Fails when                                            |
| ---------- | ------------ | ------ | ----------------------------------------------------- |
| `validate` | No           | No     | The manifest, a skill source, or the graph is invalid |
| `check`    | Yes          | No     | A compiler-owned path differs from the source         |

`validate` gives a precise diagnostic when the source itself is wrong. `check`
catches the other failure: a source that is valid but was never recompiled.
Running both makes the two causes easy to tell apart in a build log.

## Wire up npm scripts

```json
{
  "scripts": {
    "plugin:validate": "plugin-compiler validate",
    "plugin:check": "plugin-compiler check",
    "plugin:compile": "plugin-compiler compile",
    "plugin:verify": "npm run plugin:validate && npm run plugin:check"
  }
}
```

Authors run `npm run plugin:compile` and commit the result. CI runs
`npm run plugin:verify`.

## GitHub Actions

```yaml
name: Plugin

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run plugin:verify
```

`npm ci` installs the exact compiler version from the lockfile, which is why
`--save-exact` matters: a range could resolve to a different compiler in CI than
the one that produced the committed output.

## What a failure looks like

An out-of-date generated file:

```text
Scope: /home/runner/work/example-agent-plugin/example-agent-plugin; providers: claude; provider source: manifest.
Output check found 1 drift entry:
- skills/prepare-change-plan/SKILL.md: content-differs
```

A file added inside the compiler-owned tree:

```text
Output check found 1 drift entry:
- skills/NOTES.md: unexpected
```

An invalid source, reported by `validate` before any output is read:

```text
Command failed: Plugin validation failed with 1 error:
- plugin/plugin.yml#/skills/0/required_skills/0/skill_id: skill "prepare-change-plan" references unknown skill "inspect-repository"
```

In every case the fix is the same: run `plugin-compiler compile` locally and
commit the result, or correct `plugin/**` until `validate` passes.

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | The request completed successfully                              |
| `1`  | Compilation, validation, or generated-state verification failed |
| `2`  | CLI syntax or option usage was invalid                          |

Drift is exit code `1`, so no extra scripting is needed to fail a job.

## Check a subset of providers

CI can narrow the selection the same way `compile` does, which is useful when
one workflow publishes to one host:

```bash
npm exec -- plugin-compiler check --provider claude
```

Remember that the override replaces the manifest selection instead of narrowing
it. A check run with `--provider claude` against output compiled for Claude and
Codex reports the Codex manifest as an unexpected file:

```text
Output check found 1 drift entry:
- .codex-plugin/plugin.json: unexpected
```

Run `check` with the same selection that produced the committed output.

## Next steps

- [Generated output](/guide/generated-output) explains what `check` compares.
- [CLI reference](/reference/cli) documents every command and option.
- [Programmatic usage](/guide/programmatic-usage) runs the same check from a
  Node.js build script.
