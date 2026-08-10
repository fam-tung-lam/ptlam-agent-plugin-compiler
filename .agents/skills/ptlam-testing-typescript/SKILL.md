---
name: ptlam-testing-typescript
description:
  Design, write, update, run, audit, and diagnose tests for framework-free,
  browser-free TypeScript libraries, Node.js code, CLIs, and tooling with Vite,
  Vitest, and Vitest V8 coverage. Use when such a project needs test
  implementation, Vitest configuration, coverage, mocking, Node environments,
  type tests, or stack-specific testing review. Apply ptlam-testing first for
  testing scope, level, behavior, placement, test doubles, TDD, and audit
  authority. Do not use this specialization for web frameworks, DOM code, or
  browser-runtime testing.
---

# PTLam Testing TypeScript

Apply the universal testing workflow first, then use this specialization to
resolve framework-free, browser-free TypeScript, Vite, Vitest, and V8 coverage
mechanics. It targets TypeScript libraries, Node.js code, CLIs, and tooling.
Keep behavioral testing decisions in the foundation skill and stack decisions
here.

## Required skills

### `ptlam-testing`

**Reason:** Provides the universal testing workflow and mandatory rules.

**Instructions:** Read and apply ptlam-testing first.
Let it own scope, level, public seam, behavior, doubles, TDD, audit
authority, and verification depth.
Use this skill's source-adjacent placement instead of the foundation's
generic test-root placement.
Apply it only to framework-free, browser-free TypeScript, Vite, Vitest,
and coverage mechanics left open by the foundation.

Read [ptlam-testing](skills/ptlam-testing/SKILL.md).

## Resolve the foundation decisions

1. Read the required `ptlam-testing` skill before choosing tools, configuration,
   or test code.
2. Follow it to resolve the project root, mode, primary test level, public seam,
   test-double boundaries, TDD activation, and verification depth.
3. Keep every foundation invariant except its generic test-root placement. The
   owner-approved TypeScript rule in this specialization places each test beside
   its source file. Keep Given-When-Then and the rule that coverage percentages
   do not substitute for behavior-based test design.

Complete this step when the universal testing decisions are explicit and only
TypeScript-stack mechanics remain unresolved.

## Resolve the installed stack

1. Confirm the target is framework-free and browser-free TypeScript. If it uses
   a web application framework, DOM APIs, or a browser runtime, return to the
   foundation skill and use scope-specific testing guidance instead of this
   specialization.
2. Inspect the package manifest, lockfile, package-manager declaration, Vite and
   Vitest configuration, TypeScript configuration, scripts, CI workflows, and
   neighboring tests.
3. Reuse an established Vite/Vitest toolchain when it is compatible and viable.
   When setup or migration is in scope, select mutually compatible versions of
   `vite`, `vitest`, TypeScript, the runtime, and the coverage provider through
   the repository's package manager and preserve its lockfile.
4. Treat the installed Vitest version and its matching official documentation
   as the syntax authority. Do not apply a configuration option from another
   major version without verifying it against the installed version.
5. Read
   [TypeScript and Vitest stack](references/typescript-vitest-stack.md) whenever
   configuring, writing, running, auditing, or diagnosing Vitest tests. It owns
   the stack defaults, Vitest API preferences, coverage rules, and command
   selection.

Complete this step when the package manager, runtime, installed versions,
framework-free and browser-free scope, configuration owner, Node execution
environment, and applicable stack preferences are known.

## Load only the needed Vitest references

- For configuration ownership, supported options, version changes, or scripts,
  read [configuration](references/vitest/core-config.md) and
  [CLI](references/vitest/core-cli.md). For monorepos or multiple Node test
  groups, also read [projects](references/vitest/advanced-projects.md).
- When defining tests or suites, read [test API](references/vitest/core-test-api.md)
  and [describe API](references/vitest/core-describe.md). When setup, teardown,
  or resource lifetime is involved, also read
  [lifecycle hooks](references/vitest/core-hooks.md).
- For assertions, asynchronous expectations, custom matchers, or narrowing, read
  [expect API](references/vitest/core-expect.md). For compile-time contracts,
  also read [type testing](references/vitest/advanced-type-testing.md).
- Whenever a Vitest mock, spy, fake timer, module replacement, global stub, or
  environment-variable stub is present or proposed, read
  [mocking](references/vitest/features-mocking.md) and
  [`vi` utilities](references/vitest/advanced-vi.md) after the foundation's
  test-double reference.
- For reusable fixtures or test context, read
  [test context and fixtures](references/vitest/features-context.md). For worker
  pools, isolation, sharding, or concurrent tests, read
  [concurrency and parallelism](references/vitest/features-concurrency.md).
- For selecting or listing tests, read
  [filtering](references/vitest/features-filtering.md). When semantic tags are
  used, also read [test tags](references/vitest/features-test-tags.md).
- Whenever coverage is configured, run, merged, or diagnosed, read
  [coverage](references/vitest/features-coverage.md). When CI or machine-readable
  output is involved, also read [reporters](references/vitest/features-reporters.md).
- Whenever a snapshot exists or is proposed, read
  [snapshot testing](references/vitest/features-snapshots.md).

Complete this step when every active Vitest mechanism has its directly relevant
reference loaded and unrelated references remain unloaded.

## Apply the TypeScript testing preferences

- Place each test beside its source file and preserve the source basename:
  `foo.ts` maps to `foo.test.ts` in the same directory. A type-contract test maps
  to `foo.test-d.ts` there. Apply this source-adjacent rule instead of a separate
  test root or test-level directory unless the user explicitly requests another
  location.
- Group tests with `describe` and declare cases with `it`. Import those APIs
  explicitly from `vitest`; do not author cases with the `test` alias. When a
  bundled Vitest reference uses `test` to document the upstream API, translate
  declarations and modifiers to `it`, such as `it.each` and `it.concurrent`.
- Use `toMatchSnapshot` when a complex output's complete, stable structure is
  the behavior and a snapshot is clearer than many field assertions. Review the
  initial snapshot and every update against the specification.
- For language-specific expected output, use awaited `toMatchFileSnapshot` with
  an explicit relative file path in the assertion. Keep each language's golden
  file separate and review it as test data.
- Use Vite as the transformation and module-resolution layer and Vitest as the
  test runner. Reuse the project's Vite aliases and plugins without
  duplicating their definitions.
- Use `@vitest/coverage-v8` for coverage unless repository or runtime evidence
  requires Istanbul compatibility.
- Import Vitest APIs explicitly. Keep globals disabled unless the repository has
  an established globals-based convention that changing would disrupt.
- Use Vitest's `node` environment. Browser Mode, `jsdom`, `happy-dom`, and other
  browser or DOM environments belong outside this skill.
- Run TypeScript analysis separately because Vite transformation and ordinary
  Vitest runtime execution do not prove that the project type-checks.

Complete this step when each stack choice follows repository evidence or an
explicit preference above, and every deviation has a concrete compatibility or
project-convention reason.

## Verify and report

1. Run the smallest focused Vitest command after each meaningful change, using
   non-watch run mode for proof.
2. Run the containing package or project suite, the repository's TypeScript
   check, and the coverage command when coverage is in scope or required.
3. Apply the broader verification and reporting requirements from
   `ptlam-testing`.
4. State the resolved Vite, Vitest, coverage-provider, TypeScript, runtime, and
   package-manager versions; exact commands and results; and every skipped or
   unavailable check.

Complete the task only when the focused tests pass, proportional containing
checks are complete, TypeScript analysis is accounted for, and the report does
not imply that unrun coverage or type checks passed.
