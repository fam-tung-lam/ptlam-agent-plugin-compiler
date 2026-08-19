# TypeScript Development Toolchain

Use this workflow to establish, migrate, or run the standard TypeScript
development toolchain:

- Node owns the runtime, pinned by version rather than assumed.
- npm owns dependencies, the lockfile, and script execution.
- TypeScript owns static type checking; it does not have to own emit.
- Biome owns formatting, linting, and import organization.
- Vitest owns test execution and `@vitest/coverage-v8` owns coverage;
  [testing.md](testing.md) owns their configuration and test code.

Apply the complete stack to new projects. An existing repository's executable
toolchain remains authoritative until its migration is in scope. Never introduce
a competing capability owner.

## Establish the stack

Pin the exact Node version in `.nvmrc` and declare the supported floor in the
`engines` field of `package.json`. The pin keeps local work reproducible; the
floor states what consumers may run. Set `"type": "module"` for a new package.

```shell
npm install --save-dev typescript @biomejs/biome vitest @vitest/coverage-v8 vite @types/node
```

Commit `package.json` and the lockfile together. Never edit the lockfile by
hand. Install with `npm ci` in CI and after any branch switch or lockfile
change.

Configure the compiler in `tsconfig.json`. Enable `strict`, then the checks that
close the gaps `strict` leaves open:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "module": "NodeNext",
    "target": "ES2024",
    "lib": ["ES2024"],
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

Match `target` and `lib` to the declared Node floor, and `module` and
`moduleResolution` to how the artifact is actually loaded. Set `noEmit` when a
bundler or the runtime produces the output, and turn emit back on only for the
build that publishes declarations. This file owns which options the project
sets; [typing.md](typing.md) owns how to write types under them.

Keep one owner for each capability. Biome formats, lints, and organizes imports
from `biome.json`; do not add Prettier or ESLint beside it for the same files.

## Run the local loop

Expose the checks as scripts so people and CI run the same commands:

```json
{
  "scripts": {
    "code:typecheck": "tsc --project tsconfig.json",
    "code:check": "biome check .",
    "code:format": "biome check --write .",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Run the smallest affected paths first, then the whole project:

```shell
npx vitest run src/domain/parse-order.test.ts
npm run code:typecheck
npx biome check --write src/domain
npm run code:check
npm run test:coverage
```

Inspect every write-mode Biome diff before staging it. The type check is the
gate that a bundler and a test run do not provide: a transpile-only pipeline
strips types without checking them, so a passing test suite proves nothing about
type errors.

## Gate CI without mutation

Install from the lockfile, then run the same checked-in configuration:

```shell
npm ci
npm run code:typecheck
npm run code:check
npm run test:coverage
```

Do not use a command that rewrites source, configuration, or the lockfile in a
verification job. Use `npm ci`, never `npm install`, so a stale lockfile fails
the job instead of being repaired silently.

## Migrate an existing project

Capture the old gates and a clean baseline. Migrate one capability at a time,
translate intentional rules and exclusions, then remove the superseded
dependency, configuration, editor setting, hook, and CI command. Name the end of
any temporary overlap; do not leave ESLint, Prettier, Jest, or `ts-node`
indefinitely beside their replacement.

Raising compiler strictness on an existing codebase surfaces errors in files the
change never touched. Enable one option at a time and fix its fallout as its own
commit rather than mixing it into a feature change.

Finish when one tool owns each capability, the manifest and lock agree, every
local and CI command selects the intended files, and every configured gate
passes with material exclusions reported.
