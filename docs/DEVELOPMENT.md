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

| Path              | Contents                                                    |
| ----------------- | ----------------------------------------------------------- |
| `src/core/`       | Models, validation, shared compilation, and output planning |
| `src/providers/`  | Claude and Codex output adapters                            |
| `src/filesystem/` | Safe reads, output inspection, and recoverable writes       |
| `src/compiler/`   | Public `PluginCompiler` orchestration                       |
| `src/cli/`        | Command parsing and terminal output                         |
| `scripts/`        | Small build and packed-package checks                       |
| `.github/`        | CI and release automation                                   |
| `tests/`          | Unit, integration, and provider conformance tests           |

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Commands

| Command                  | Use                                       |
| ------------------------ | ----------------------------------------- |
| `npm run code:typecheck` | Check TypeScript without writing files    |
| `npm run code:check`     | Check formatting and code rules           |
| `npm run code:format`    | Apply code formatting                     |
| `npm test`               | Run all Vitest tests                      |
| `npm run test:package`   | Smoke-test one packed `.tgz` in isolation |
| `npm run build`          | Create and verify `dist/`                 |
| `npm run markdown:check` | Check Markdown format and rules           |

Run one test area while editing:

```bash
npm test -- tests/src/unit-tests/core
```

## Test layers

| Layer       | Proves                                                |
| ----------- | ----------------------------------------------------- |
| Unit        | One rule or pure module                               |
| Integration | Real boundaries between compiler, disk, and CLI       |
| Conformance | Claude and Codex output matches their owned contracts |

Place a test at the lowest layer that can prove the behavior. Use real disk and
process boundaries only when those boundaries matter.

Mirror the production area first:

- Keep compiler source tests under `tests/src/` and organize them by test layer.
- Add a separate `tests/scripts/` tree only when script-specific tests exist.

## Release

See [RELEASE.md](RELEASE.md).
