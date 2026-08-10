# TypeScript and Vitest stack

Use this reference for TypeScript, Vite, Vitest, and Vitest coverage mechanics.
The foundation `ptlam-testing` skill remains authoritative for testing scope,
level, observable behavior, placement, doubles, TDD, auditing, and verification
depth.

## Scope boundary

Apply these preferences to framework-free, browser-free TypeScript libraries,
Node.js code, CLIs, and tooling. They do not own DOM simulation, browser
execution, component mounting, rendering, routing, or test utilities for web
application frameworks. Use scope-specific testing guidance under the
`ptlam-testing` foundation when code requires a browser or web framework.

The bundled Vitest API references have external provenance documented in
[Acknowledgements](../ACKNOWLEDGEMENTS.md). Treat the reference snapshot as
versioned API context rather than a version-agnostic contract. Match syntax to
the target project's installed Vitest major version and consult its matching
official documentation when the versions differ.

## Stack defaults

| Concern | Preferred choice | Selection rule |
| --- | --- | --- |
| Transformation | Vite | Reuse the project's aliases, plugins, and module resolution. |
| Test runner | Vitest | Use the installed project version and repository scripts. |
| Coverage | `@vitest/coverage-v8` | Prefer V8; choose Istanbul only for a demonstrated compatibility need. |
| Runtime tests | `foo.ts` → `foo.test.ts` | Keep the test beside its source file. |
| Type-contract tests | `foo.ts` → `foo.test-d.ts` | Keep the type test beside its source file. |
| Definition API | `describe` and `it` | Import explicitly; do not author cases with `test`. |
| Complex output | `toMatchSnapshot` | Use when the complete stable structure is the behavior. |
| Language-specific output | `toMatchFileSnapshot` | Await it and pass an explicit relative golden-file path. |
| Test environment | `node` | Browser and DOM environments are outside this skill. |
| API access | Explicit imports from `vitest` | Preserve established globals only when migration is outside scope. |
| Verification mode | `vitest run` | Use watch mode only for interactive development. |

## Place test files and snapshots

The owner-approved TypeScript placement rule intentionally overrides the
foundation's generic test-root and test-level hierarchy for this specialization:

```text
src/domain/foo.ts
src/domain/foo.test.ts
src/domain/foo.test-d.ts
```

Use `describe` for the public subject or capability and `it` for behavior cases.
Keep the foundation's Given-When-Then structure inside every `it` block.

For a complex stable result:

```ts
expect(result).toMatchSnapshot();
```

For output that varies by language, use a separate explicitly named golden file
and await the file assertion:

```ts
await expect(germanOutput).toMatchFileSnapshot(
  "./snapshots/de/format-message.txt",
);
```

Treat a new or updated snapshot as expected test data: compare it with the
specification before accepting it.

## Configure Vite and Vitest

1. Prefer one owner for shared aliases and plugins. If the project already has
   `vite.config.ts`, either place a small `test` section there or merge that
   configuration into `vitest.config.ts`; do not reproduce shared settings in
   two files.
2. Prefer a separate `vitest.config.ts` when test-only settings are substantial
   or the production Vite configuration should remain focused. Use
   `defineConfig` from `vitest/config`, and use `mergeConfig` when sharing an
   existing Vite configuration.
3. Use the `node` environment. Do not add Browser Mode, `jsdom`, `happy-dom`, or
   another DOM or browser environment through this skill.
4. Preserve isolation. Enable `clearMocks` and `restoreMocks` when configuring a
   new suite; do not enable blanket mock resetting when tests intentionally
   provide reusable implementations.
5. Scope discovery with precise include patterns or `test.dir`. Exclude build
   output and generated artifacts. Do not use broad exclusions to compensate
   for an unclear test root.
6. Keep retries disabled by default. Add a bounded retry only for a documented
   nondeterministic external boundary that the selected test level must cover.

A minimal new configuration may look like:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    retry: 0,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
```

Adapt paths and syntax to repository evidence and the installed Vitest version.

## Write Vitest tests

- Import only the APIs used, such as `describe`, `it`, `expect`, hooks, and `vi`,
  from `vitest`.
- Use `describe`/`it` for authored tests. The bundled upstream references may
  show the equivalent `test` alias to preserve API context; translate case
  declarations and modifiers to `it` in project code.
- Keep assertions at a framework-free, browser-free public TypeScript seam. Do
  not introduce DOM helpers, browser automation, component harnesses, or
  framework test utilities through this skill.
- Express Given-When-Then with explicit comments because Vitest has no native
  Given-When-Then API.
- Await asynchronous assertions and promises. Use `resolves` and `rejects` when
  they make the expected outcome clearer.
- Use `it.each` or the installed version's supported equivalent when several
  inputs prove the same behavior. Keep case data readable as specifications.
- Use `expectTypeOf` or `assertType` for deliberate type-contract tests. Keep a
  separate repository type-check command because runtime tests and isolated
  type assertions do not replace whole-project TypeScript analysis.
- Prefer explicit expected values and focused matchers. Use `toMatchSnapshot`
  for complex stable outputs and awaited `toMatchFileSnapshot` with an explicit
  path for language-specific outputs; review and commit every snapshot update.
- Do not commit `it.only`. Treat `skip`, `todo`, and expected-failure tests as
  visible debt with a reason when repository policy permits them.

## Use doubles and mutable runtime controls

Follow the foundation's test-double rules before selecting a Vitest mechanism.
When a justified boundary remains:

- prefer `vi.spyOn` when the real object should remain in use and only one
  observable boundary needs control or verification;
- use `vi.fn` for an explicit function-shaped fake or stub;
- use `vi.mock` for a module boundary only when dependency injection or a real
  collaborator is not the better seam;
- remember that `vi.mock` is hoisted and use the installed version's supported
  dynamic-mocking API only when import timing requires it; and
- restore fake timers, system time, globals, environment variables, spies, and
  dynamically mocked modules in the narrowest reliable lifecycle.

Use async timer controls for code that schedules promise work. Avoid concurrent
tests when they share mutable globals, fake time, ports, files, databases, or
other resources that cannot be isolated.

## Configure coverage

1. Install the coverage package that matches Vitest's version. Prefer
   `@vitest/coverage-v8`; use `@vitest/coverage-istanbul` only for an identified
   runtime or instrumentation requirement.
2. Define `coverage.include` for the production files in scope so completely
   unexecuted files appear in the report. Exclude declarations, generated code,
   tests, and fixtures only when they are not production behavior.
3. Use terminal text output locally and HTML for inspection. Add `lcov`, JSON,
   or another reporter only when CI or another consumer requires it.
4. Apply numeric thresholds only when the user or repository defines them.
   Preserve established thresholds; do not invent a percentage or lower one to
   make a run pass.
5. Treat uncovered code as a prompt to inspect behavior and risk, not as an
   instruction to test private branches or duplicate assertions.
6. Use provider-specific ignore comments only for code that cannot yield useful
   behavior coverage, and preserve required comment annotations through Vite's
   transformation pipeline.

For Vitest 4 and later, use `coverage.include` rather than removed settings such
as `coverage.all`. Verify all version-sensitive coverage options against the
installed major version.

## Prefer stable scripts and proof commands

For a new package, prefer these script meanings while respecting existing names:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

- Use the repository's package manager and scripts instead of assuming `npm` or
  invoking an unpinned global binary.
- Use file, line, name, project, or changed-file filters for fast focused runs.
- Use `vitest run` or an equivalent repository script for reproducible proof and
  CI. Watch mode is an interactive feedback loop, not final verification.
- Run the repository's TypeScript command, commonly `tsc --noEmit` through a
  script, alongside Vitest.
- Run coverage after focused and containing tests when coverage is requested or
  required. Report its actual provider, reporters, included production scope,
  and threshold result.
