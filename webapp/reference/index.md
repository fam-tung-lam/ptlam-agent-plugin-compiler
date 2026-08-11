# Reference Overview

This reference documents the public contract of Agent Plugin Compiler `0.1.0`.
It states what the package accepts and produces. The
[Guide](/guide/introduction) explains why, and shows the workflow around it.

## Contract surfaces

| Surface             | Documentation                                   | Answers                                         |
| ------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Authored source     | [Manifest v1](/reference/manifest)              | Where source files go, and every field and rule |
| Executable commands | [CLI](/reference/cli)                           | Commands, options, and exit codes               |
| Generated hosts     | [Providers](/reference/providers)               | Which manifest each provider writes             |
| Programmatic use    | [Programmatic Usage](/guide/programmatic-usage) | The Node.js API and custom adapters             |

## Sources of truth

The package behavior is defined by executable and versioned contracts in the
[repository](https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler):

- CLI parsing, help, process tests, and exit codes;
- [`src/schemas/v1/plugin-manifest.schema.json`](https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/blob/main/src/schemas/v1/plugin-manifest.schema.json);
- compiler and provider adapter implementations;
- exported TypeScript declarations;
- conformance tests for externally owned provider formats.

If prose and the installed package differ, use the documentation that matches
your installed version and verify behavior with focused `--help` output. The
[architecture guide](https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/blob/main/docs/ARCHITECTURE.md)
documents the internal design.

## Stability note

The package is stable and published under npm's `latest` tag. Pin it exactly,
review release notes before upgrading, and recompile output with the upgraded
version before accepting the change.

Start with the [CLI reference](/reference/cli), or follow the
[Quick Start](/guide/quick-start).
