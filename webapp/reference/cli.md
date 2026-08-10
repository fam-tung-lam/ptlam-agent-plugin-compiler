# CLI

The package exposes one executable named `plugin-compiler`.

```text
Usage: plugin-compiler [OPTIONS] <COMMAND>
```

## Commands

| Command    | Reads authored source | Reads output | Writes output        | Purpose                              |
| ---------- | --------------------- | ------------ | -------------------- | ------------------------------------ |
| `init`     | Existing paths        | No           | Missing source paths | Create a safe starter                |
| `validate` | Yes                   | No           | No                   | Validate manifest, skills, and graph |
| `compile`  | Yes                   | Yes          | Yes                  | Compile and verify managed output    |
| `check`    | Yes                   | Yes          | No                   | Report generated drift               |

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

The default is the current working directory. The path is resolved before the
compiler operation begins.

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

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | The request completed successfully                              |
| `1`  | Compilation, validation, or generated-state verification failed |
| `2`  | CLI syntax or option usage was invalid                          |

For `check`, detected drift is exit code `1`, making the command suitable for CI
verification.

Next: review the [manifest contract](/reference/manifest) or see the workflow in
the [Quick Start](/guide/quick-start).
