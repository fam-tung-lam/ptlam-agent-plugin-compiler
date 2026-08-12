# CLI

The package exposes one executable named `plugin-compiler`.

```text
Usage: plugin-compiler [OPTIONS] <COMMAND>
```

Run it through npm in a repository that has the package installed:

```bash
npm exec -- plugin-compiler <command>
```

## Commands

| Command    | Reads authored source | Reads output | Writes output        | Purpose                                     |
| ---------- | --------------------- | ------------ | -------------------- | ------------------------------------------- |
| `init`     | Existing paths        | No           | Missing source paths | Create a safe starter                       |
| `validate` | Yes                   | No           | No                   | Validate manifest, skills, hooks, and graph |
| `compile`  | Yes                   | Yes          | Yes                  | Compile and verify managed output           |
| `check`    | Yes                   | Yes          | No                   | Report generated drift                      |

Show root or focused help:

```bash
plugin-compiler --help
plugin-compiler compile --help
```

Both `-h` and `--help` are accepted.

## Common root option

Every command accepts:

```text
--root <path>
```

The default is the current working directory. A relative path is resolved
against it before the compiler operation begins. The option may be given only
once.

## Provider options

`validate`, `compile`, and `check` accept exactly one provider selection mode:

```text
--provider <id>[,<id>...]
--no-providers
```

- omit both to use `plugin/plugin.yml`;
- pass `--provider claude,codex` to replace the manifest selection;
- pass `--no-providers` for shared `skills/` output only;
- do not repeat `--provider` or combine the two flags.

Built-in IDs are `claude`, `codex`, `copilot`, `gemini`, and `kimi`. The
compiler normalizes an explicit selection to stable registry order and reports
whether the effective source was `manifest` or `override`.

`init` accepts only `--root` and help because it does not select output.

## Report format

Every result begins with one scope line naming the repository root, the
effective providers, and where that selection came from:

```text
Scope: /path/to/plugin; providers: claude, codex; provider source: manifest.
```

`compile` then lists each managed path as `changed` or `unchanged`. `check` and
the verification step of `compile` list drift entries as `- <path>: <reason>`:

| Reason            | Meaning                                             |
| ----------------- | --------------------------------------------------- |
| `content-differs` | The file exists with different bytes than planned   |
| `kind-differs`    | The path is a different entry kind than planned     |
| `missing`         | A planned path does not exist                       |
| `unexpected`      | An owned path exists that the plan does not include |

When hooks are declared, `validate`, `compile`, and `check` also print one
provider-by-hook decision:

```text
Hooks:
- claude/adaptive-interaction: generated
- external/adaptive-interaction: skipped (provider-does-not-support-hooks)
```

Skipped hooks are non-fatal. Their provider's other output still participates in
compilation and drift detection.

Warnings are written to standard error and do not change the exit code.

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | The request completed successfully                              |
| `1`  | Compilation, validation, or generated-state verification failed |
| `2`  | CLI syntax or option usage was invalid                          |

For `check`, detected drift is exit code `1`, making the command suitable for CI
verification.

Next: review the [manifest contract](/reference/manifest), or wire the commands
into [continuous integration](/guide/continuous-integration).
