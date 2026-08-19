---
name: ptlam-code-style-typescript
description:
  Write, review, and fix TypeScript library and application code against
  conventions for language mechanics, module boundaries, tooling, and tests. Use
  when starting or standardizing a TypeScript project, changing TypeScript code
  or its toolchain, reviewing TypeScript-specific design, or resolving
  type-check, lint, or Vitest failures. Apply ptlam-code-style first for the
  standard these mechanics satisfy. Use as the foundation for TypeScript
  framework specializations. Do not use for non-TypeScript code.
---

# PTLam TypeScript Code Style

Conventions for TypeScript library and application code: the development
toolchain, module boundaries, imports, the type system, runtime validation,
asynchronous work, errors, doc comments, logging, and tests. This skill owns
TypeScript mechanics only; the foundation owns the standard they satisfy.

## Required skills

### `ptlam-code-style`

**Reason:** Provides the language-neutral conventions and testing doctrine the TypeScript mechanics satisfy.

**Instructions:** Read and apply ptlam-code-style first.
Let it own precedence; the structure, boundary, naming, readability,
data-modeling, contract, failure, documentation, and logging
standards; the universal behavior contract; test levels; test
placement; and test doubles.
Use this skill only for TypeScript language, package, and tool
mechanics that satisfy those standards.
This specialization may be stricter than the foundation, never looser.

Read [ptlam-code-style](skills/ptlam-code-style/SKILL.md).

## Before the first edit

1. Resolve the package root and read every applicable `AGENTS.md` from the
   repository root down to the files in scope.
2. Read `package.json`, the lockfile, every `tsconfig*.json` covering the files
   in scope, the formatter and linter configuration, the test configuration, CI,
   and the nearest source and tests. Record the Node version floor, package
   manager, module system, build output, type-check command, formatter, linter,
   test runner, and their real commands.
3. Treat executable configuration and CI as the mechanic. A dependency being
   installed does not prove that the project runs it.
4. Apply stronger new-code rules to code you add or substantively change. Leave
   unrelated legacy inconsistencies alone.

For a new TypeScript project, pin Node in `.nvmrc`, use npm with a committed
lockfile, publish ES modules, run TypeScript in strict mode as a no-emit
checker, use Biome for formatting, linting, and import organization, and use
Vitest with `@vitest/coverage-v8` for tests. In an existing project, keep its
explicit working toolchain until replacing it is part of the task.

## Pick a reference

| Concern                                                                      | Reference                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Creating or standardizing the development environment, checks, or CI         | [dev-toolchain.md](references/dev-toolchain.md)             |
| Adding a module, publishing an entry point, or resolving an import cycle     | [modules-and-imports.md](references/modules-and-imports.md) |
| Writing or changing types, generics, and compiler-visible contracts          | [typing.md](references/typing.md)                           |
| Accepting data from outside the program, such as a payload, file, or env var | [runtime-validation.md](references/runtime-validation.md)   |
| Performing I/O, or managing concurrent work and resource lifetime            | [async.md](references/async.md)                             |
| Throwing, catching, translating, or preserving an error                      | [errors.md](references/errors.md)                           |
| Writing a TSDoc comment or generating API documentation                      | [documentation.md](references/documentation.md)             |
| Emitting or configuring logs                                                 | [logging.md](references/logging.md)                         |
| Writing, placing, configuring, or restructuring a Vitest test                | [testing.md](references/testing.md)                         |

## Apply the mechanics

1. Keep every changed public surface intentional and compatible with the
   package's declared entry points, module system, and supported Node versions.
2. Give changed production values precise types. Keep runtime validation
   separate from static typing: types are erased before the program runs, so the
   compiler never checks data that arrives from outside it.
3. Give every promise an owner that awaits it or handles its failure, and
   release every resource on success, failure, and cancellation.
4. Add or update behavioral tests in the existing test home. Cover the normal,
   boundary, and failure cases changed by the work.
5. Run checks from narrow to broad: focused tests, the type check, then the
   formatter and linter on changed files, then project-wide gates. Run the
   configured build when the change affects distribution.
6. For a published-package change, install the built artifact in a disposable
   project and import the changed entry points under every module system the
   package declares.

Inspect the diff after any write-mode formatter, linter fix, or hook. Report
exact commands, their results, configured exclusions that affect confidence, and
every check you did not run.

## Finish

Finish when the changed code preserves its entry-point and serialization
contracts, adds no new type or lint failure, leaves no promise unowned and no
resource unreleased, and passes the affected behavioral tests under the
project's actual toolchain.
