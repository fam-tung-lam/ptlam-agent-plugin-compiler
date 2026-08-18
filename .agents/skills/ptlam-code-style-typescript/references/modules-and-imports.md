# TypeScript Modules and Imports

TypeScript import, publication, and file-placement mechanics.

## Publish one intentional API

Use the repository's package layout. When a new package has no established
layout, put source under `src/` and mirror its capability structure in the test
layout the project uses.

The `exports` field of `package.json` is the published surface. Everything
outside it is internal, even when a consumer can reach it by path. Declare each
supported entry point explicitly, with its type declarations, and add `files` so
the tarball carries only what the entry points need.

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./testing": {
      "types": "./dist/testing.d.ts",
      "import": "./dist/testing.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

Keep `main` and `types` only for consumers that cannot resolve `exports`. Set
`sideEffects` honestly: claiming `false` while a module mutates global state at
import time lets a bundler delete code the program needs.

Adding, renaming, or removing an entry point changes the package contract.
Preserve it, deprecate it through the project's established mechanism, or treat
its removal as a breaking change. Importing a module must not start a server,
open a connection, or read remote state.

## Keep imports directional

- Let Biome own import grouping and order. Do not hand-sort.
- Use `import type` and `export type` for type-only references. With
  `verbatimModuleSyntax`, an unmarked import survives into the emitted output
  and can pull a runtime module in behind a type.
- Write the specifier the resolver actually needs. Under `NodeNext` ESM, a
  relative import carries its extension, and that extension is the one on the
  emitted file.
- Prefer named exports. A default export is renamed freely at each import site,
  which weakens search, auto-import, and refactoring.
- Import a package's published entry point from outside it. Internal code may
  import the owning module directly when a barrel would eagerly load unrelated
  code or create a cycle.
- Confirm that every path alias resolves for the compiler, the test runner, the
  bundler, and the published artifact. An alias that only the compiler
  understands fails at runtime.

Keep imports at module scope. A dynamic `import()` needs a verified reason, such
as an optional dependency or a deliberately deferred cost. Using one to break an
import cycle hides the cycle instead of removing it; fix the dependency
direction.

## Keep files owned

Follow the project's existing directory and file naming, including its case
convention for filenames. A repository that mixes cases breaks on a
case-sensitive filesystem after working locally on a case-insensitive one.

Keep a barrel file thin and deliberate. A package-wide barrel that re-exports
everything makes each consumer load the whole package and turns unrelated
modules into cycle participants.

Place a new test where the project already puts tests for that unit. When no
pattern exists, put the test beside its source as `<module>.test.ts` and a
type-contract test as `<module>.test-d.ts`.

Finish when every import follows the declared dependency direction, the package
exports only supported entry points, and each new file has one concrete owner.
