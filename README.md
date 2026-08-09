# Agent Plugin Compiler

`@fam-tung-lam/ptlam-agent-plugin-compiler` validates and compiles compatible
manifest-v1 agent-plugin repositories for Claude and Codex. It is a deep module
behind two small interfaces:

- the `plugin-compiler` command-line interface; and
- the package-root `PluginCompiler` Node.js interface.

Parsing, validation, provider selection, output planning, filesystem safety, and
recovery remain private implementation details. The compiler does not install or
publish plugins, discover repositories, manage external versions, or write to a
user's home directory.

## Requirements

The first release supports:

- Node.js `>=22.6.0`;
- emitted ESM JavaScript, with no consumer TypeScript or `tsx` dependency;
- a project with `package.json` and a local npm-compatible installation; and
- npm as the supported package manager and release gate.

Install one exact version as a development dependency:

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler@0.1.0-alpha.1
```

The first release does not promise pnpm, Yarn, Bun, Deno, global installation,
or transient `npx` execution. Invoke the local binary through a package script
or `npm exec`.

## Compatible repository

Pass an existing real repository directory with this authored layout:

```text
plugin/
├── plugin.yml
└── skills/
    └── <skill-id>/
        ├── SKILL.md
        ├── agents/       # optional
        ├── assets/       # optional
        ├── references/   # optional
        └── scripts/      # optional
```

`plugin/plugin.yml` is the canonical catalog. Schema version 1 is the only
accepted manifest version. Each body-only `SKILL.md` contains exactly one
`<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->` marker. See the
[architecture guide](docs/ARCHITECTURE.md) for the source model and ownership
rules.

The repository accepts the compiler's exact output ownership. In particular,
root `skills/` is a complete managed tree that generation may replace. This is
destructive ownership: unexpected files and directories inside `skills/` may be
removed. Root `README.md` remains human-owned and is never read, planned,
compared, or written by compiler operations.

## Command-line interface

Add local scripts such as:

```json
{
  "scripts": {
    "plugin:validate": "plugin-compiler validate",
    "plugin:check": "plugin-compiler check",
    "plugin:compile": "plugin-compiler generate",
    "plugin:verify": "npm run plugin:validate && npm run plugin:check"
  }
}
```

The first release exposes exactly:

```text
plugin-compiler validate [--root <path>]
plugin-compiler check [--root <path>]
plugin-compiler generate [--root <path>]
plugin-compiler --help
plugin-compiler -h
```

Without `--root`, the root is `process.cwd()`. A relative root resolves against
that working directory; an absolute root is accepted directly. The compiler does
not search upward for a manifest. Linked, missing, non-directory, escaping, or
otherwise unsafe roots are rejected by the existing filesystem checks.

Normal success and help text use stdout. Warnings use stderr even when an
operation succeeds. Usage errors, validation or operational failures, detected
drift, and failed post-write verification use stderr; a failed generation may
also report completed writes on stdout.

| Exit code | Meaning                                                          |
| --------: | ---------------------------------------------------------------- |
|       `0` | Help or operation succeeded; check is current                    |
|       `1` | Validation, drift, generation, verification, or operation failed |
|       `2` | Command-line usage is invalid                                    |

There is no command-specific help, provider flag, JSON mode, interactive prompt,
or upward root discovery in the first release.

## Node.js interface

Import only from the package root:

```ts
import { PluginCompiler } from "@fam-tung-lam/ptlam-agent-plugin-compiler";

const compiler = new PluginCompiler({
  rootDir: "/absolute/path/to/example-plugin",
  providerIds: ["claude", "codex"],
});

await compiler.validate();
await compiler.generate();
await compiler.check();
```

The root exposes exactly one runtime value and four TypeScript types:

- `PluginCompiler`;
- `CompilerOptionsInput`;
- `ValidateResult`;
- `CheckResult`; and
- `GenerateResult`.

There is no default export or public package subpath. Deep imports into `core`,
`providers`, `filesystem`, `compiler`, `cli`, or `dist` are unsupported and
rejected by the package export map.

Programmatic callers select `claude`, `codex`, both, or an empty provider list.
The CLI always selects both in that order. An empty programmatic list still
compiles the shared `skills/` tree. Unknown and duplicate provider IDs fail
deterministically.

Programmatic operation failures reject with `Error` instances. A stable public
error-class taxonomy is not part of the first release.

## Behavior and recovery

`validate` and `check` are read-only. `check` and `generate` build identical
planned bytes. Generation validates and plans before its first write, uses
recoverable replacement for the complete `skills/` tree, rereads every owned
output, and succeeds only when post-write comparison is empty.

Identical authored inputs, selected providers, and compiler version produce
identical output paths and bytes. Provider order cannot change bytes or
collision diagnostics. Diagnostics and differences have deterministic order.

Generation is not a cross-file transaction. If an operating-system failure
occurs after an earlier standalone file changed, correct the filesystem problem
and rerun generation. The compiler does not claim protection from a hostile
concurrent process racing its filesystem operations.

## Project documentation

- [Examples](examples/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Release](docs/RELEASE.md)
- [Security policy](SECURITY.md)
- [MIT license](LICENSE)

This package compiles plugin artifacts. A host-specific installer or release
system remains responsible for installing or publishing those artifacts.
