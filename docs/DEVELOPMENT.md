# Development

## Setup

The project uses npm and Node.js `>=22.6.0`. `.nvmrc` holds the normal local
version.

```bash
nvm use
npm ci
```

Use npm for this repository. The lockfile is the source of truth for installed
versions.

## Project map

| Path                       | Contents                                                   |
| -------------------------- | ---------------------------------------------------------- |
| `src/schemas/`             | Versioned JSON contracts                                   |
| `src/core/`                | Shared plugin and generated types, plus their constructors |
| `src/compiler/validation/` | Manifest and authored-source validation                    |
| `src/compiler/rendering/`  | Shared skill document and catalog rendering                |
| `src/compiler/planning/`   | Write-plan construction and generated-state comparison     |
| `src/compiler/`            | Public `AgentPluginCompiler` orchestration                 |
| `src/providers/`           | Provider adapters and per-instance registry                |
| `src/filesystem/`          | Safe reads, output inspection, and recoverable writes      |
| `src/cli/`                 | Command parsing and terminal output                        |
| `scripts/`                 | Module-boundary, build, and packed-package checks          |
| `.github/`                 | CI and release automation                                  |
| `tests/`                   | Unit, integration, and provider conformance tests          |

`core` is the cross-module type dictionary. Pipeline algorithms belong to the
compiler's validation, rendering, and planning modules.

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Commands

| Command                   | Use                                              |
| ------------------------- | ------------------------------------------------ |
| `npm run code:boundaries` | Check imports across module seams                |
| `npm run code:typecheck`  | Check TypeScript without writing files           |
| `npm run code:check`      | Check module boundaries, formatting, and code    |
| `npm run code:format`     | Apply code formatting                            |
| `npm test`                | Build, then run all Vitest tests                 |
| `npm run test:package`    | Smoke-test one packed `.tgz` in isolation        |
| `npm run build`           | Create and verify JavaScript, declarations, JSON |
| `npm run markdown:check`  | Check Markdown format and rules                  |

Run one test area while editing:

```bash
npm test -- tests/src/unit-tests/compiler
npm test -- tests/src/unit-tests/cli
npm test -- tests/src/integration-tests/cli/plugin-compiler-cli-process.test.ts
npm test -- tests/src/conformance-tests/providers
npm test -- tests/scripts/unit-tests/check-module-boundaries.test.ts
```

## Provider selection while developing

`plugin/plugin.yml` owns the repository-default `providers` list. The CLI and
`AgentPluginCompiler` accept optional overrides:

```bash
plugin-compiler compile                 # manifest providers
plugin-compiler compile --provider kimi # explicit replacement
plugin-compiler compile --no-providers  # explicit empty replacement
```

The two CLI provider options are mutually exclusive. Do not make CLI parsing
read YAML or merge a CLI list with the manifest; the compiler facade validates
the manifest, resolves precedence through its instance registry, and returns the
effective providers plus `manifest` or `override` as the selection source.

Check and compile reconcile exact files owned by every registered adapter.
Selected provider files must contain the desired bytes, while unselected
registered provider files must be absent. Unknown unregistered paths and the
root `README.md` stay outside compiler ownership.

## Test layers

| Layer       | Proves                                              |
| ----------- | --------------------------------------------------- |
| Unit        | One rule or pure module                             |
| Integration | Real boundaries between compiler, disk, and CLI     |
| Conformance | Built-in provider output matches its owned contract |

Place a test at the lowest layer that can prove the behavior. Use real disk and
process boundaries only when those boundaries matter.

Mirror the production area first:

- Keep compiler source tests under `tests/src/` and organize them by test layer.
- Keep maintainer-script tests under `tests/scripts/` and organize them by test
  layer.
- Keep every TypeScript test under `tests/`; the test-placement unit test
  enforces this repository boundary.

## Release

See [RELEASE.md](RELEASE.md).
