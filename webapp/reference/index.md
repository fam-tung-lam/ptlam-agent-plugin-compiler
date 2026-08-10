# Reference Overview

This reference documents the public contract of Agent Plugin Compiler
`0.1.0-beta.2`.

## Contract surfaces

| Surface             | Documentation                                        |
| ------------------- | ---------------------------------------------------- |
| Authored layout     | [Authored Plugin Source](/reference/authored-source) |
| Executable commands | [CLI](/reference/cli)                                |
| Authored data       | [Manifest v1](/reference/manifest)                   |
| Generated hosts     | [Providers](/reference/providers)                    |
| Programmatic use    | [Programmatic Usage](/guide/programmatic-usage)      |

## Sources of truth

The package behavior is defined by executable and versioned repository
contracts:

- CLI parsing, help, process tests, and exit codes;
- `src/schemas/v1/plugin-manifest.schema.json`;
- compiler and provider adapter implementations;
- exported TypeScript declarations;
- conformance tests for externally owned provider formats.

If prose and the installed package differ, use the documentation that matches
your installed version and verify behavior with focused `--help` output.

## Stability note

The package is currently a beta prerelease. Pin it exactly, review release notes
before upgrading, and recompile output with the upgraded version before
accepting the change.

Start with the [CLI reference](/reference/cli), or follow the
[Quick Start](/guide/quick-start).
