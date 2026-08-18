# TypeScript Testing

Vitest configuration, expression, and cleanup mechanics. Use the repository's
existing test runner when it is not Vitest.

## Configure the runner

Keep one owner for shared aliases and plugins. Add a `test` section to
`vite.config.ts` when the project already has one, or use a separate
`vitest.config.ts` with `mergeConfig` when test-only settings are substantial.
Do not repeat shared settings in two files.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    retry: 0,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
});
```

Scope discovery with a precise `include` rather than a broad exclusion list.
Keep `clearMocks` and `restoreMocks` on so one test cannot inherit another's
stubbing. Keep `retry` at zero; add a bounded retry only for a documented
nondeterministic external boundary.

Install the coverage package matching the installed Vitest version. Set
`coverage.include` to the production files in scope so a file that no test
executes still appears in the report. Apply a threshold only when the user or
the repository defines one; never invent a percentage and never lower one to
make a run pass. Coverage is evidence about executed lines, not about asserted
behavior.

## Express the behavior

Import `describe`, `it`, and `expect` from `vitest`. Rely on globals only in a
project that already enabled them.

Return or await every asynchronous assertion. An unawaited `rejects` chain
resolves after the test has already finished, so it passes whatever happens:

```ts
await expect(loadOrder("missing")).rejects.toThrow(OrderNotFoundError);
```

Use `it.each` for one rule exercised with different inputs. Split cases that
need different setup, action, or outcome into separate tests.

## Own setup and cleanup

Keep one-test setup in the test. Promote repeated setup to the narrowest
`beforeEach` that contains its real consumers. Register cleanup immediately
after each successful acquisition with `onTestFinished` or an `afterEach`, so a
failure later in setup cannot leak the resource acquired earlier.

`vi.mock` is hoisted above the imports in the file, so its factory cannot read a
variable declared beside it. Use `vi.hoisted` for a value the factory needs.
Prefer injecting a collaborator over replacing a module; use `vi.spyOn` or
`vi.fn` at an external boundary and mock the module only when the boundary
cannot be injected.

Restore anything global that a test changes: `vi.useRealTimers` after
`vi.useFakeTimers`, and `vi.unstubAllEnvs` after `vi.stubEnv`. Configured
`restoreMocks` covers spies, not timers or environment stubs.

## Snapshots and type contracts

Use `toMatchSnapshot` when the complete stable structure is the behavior. For
output that varies by locale or file format, await `toMatchFileSnapshot` with an
explicit path:

```ts
await expect(rendered).toMatchFileSnapshot("./snapshots/de/invoice.txt");
```

Treat every new or changed snapshot as expected test data and compare it against
the specification before accepting it. An updated snapshot proves only that the
output changed.

Put a compile-time contract in a `<module>.test-d.ts` file with `expectTypeOf`,
and enable Vitest's `typecheck` option so those files actually run.

## Run and report

Use a file, name, or changed-file filter for a fast focused run. Use
`vitest run`, or the repository's equivalent script, for reproducible proof and
in CI; watch mode is an interactive loop, never final verification.

Run the repository's type check alongside the suite. A passing suite says
nothing about type errors when the pipeline strips types without checking them.

Report the exact commands, their results, the coverage provider, its included
production scope, and every check you did not run.

Finish when the focused test fails for the broken behavior, passes for the
implemented contract, and leaves no timer, stub, environment change, or resource
for the next test.
