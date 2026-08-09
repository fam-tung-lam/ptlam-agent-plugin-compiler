# Contributing

Thank you for helping improve the Agent Plugin Compiler. Bug reports,
documentation fixes, tests, and focused code changes are welcome.

This project deliberately keeps a small public surface. Before contributing,
read the [README](README.md), [architecture guide](docs/ARCHITECTURE.md), and
[development guide](docs/DEVELOPMENT.md).

## Community expectations

Be respectful, constructive, and specific. Assume good intent, discuss ideas
rather than people, and help keep the project welcoming to contributors with
different backgrounds and levels of experience.

## Before you start

Search the [issues] and open pull requests before starting work. A direct pull
request is fine for a typo, broken link, test improvement, or small obvious fix.

Open an issue first when a change could affect any of these contracts:

- the package-root API or TypeScript types;
- CLI commands, output, diagnostics, or exit codes;
- the manifest schema or accepted source layout;
- generated paths or provider-owned output;
- determinism, path safety, or filesystem recovery;
- supported runtimes or dependencies; or
- CI, package contents, or the release process.

Describe the problem and intended outcome before proposing an implementation.
This lets maintainers confirm that the change fits the compiler's scope and
avoids incompatible work.

Do not report a vulnerability in a public issue or pull request. Follow the
[security policy](SECURITY.md) instead.

## Report a bug

Open a [bug report][issues] with enough information to reproduce the problem:

- package version, Node.js version, npm version, operating system, and
  invocation method;
- a minimal, sanitized plugin layout and the relevant authored files;
- exact steps to reproduce;
- expected and actual behavior; and
- stdout, stderr, and the exit code when the CLI is involved.

Remove tokens, credentials, personal data, and other secrets from all examples.

## Propose a feature

Open an [issue][issues] that explains:

- the user problem and who encounters it;
- why the current CLI or Node.js interface is insufficient;
- the smallest useful behavior change;
- compatibility or migration concerns; and
- alternatives you considered.

The compiler validates and compiles agent-plugin artifacts. Installation,
repository discovery, version management, and plugin publication remain outside
its scope.

## Set up the project

The project uses npm and requires Node.js `>=22.6.0`. The normal local version
is pinned in `.nvmrc`.

Fork the repository, clone your fork, and install the locked dependencies:

```bash
git clone https://github.com/<your-account>/ptlam-agent-plugin-compiler.git
cd ptlam-agent-plugin-compiler
nvm install
nvm use
npm ci
```

Create a focused branch from an up-to-date `main` branch. Use npm for dependency
changes and commit both `package.json` and `package-lock.json` when either must
change.

## Make a change

Keep each pull request focused on one problem. Preserve these project
invariants:

- identical inputs, providers, and compiler version produce identical paths and
  bytes;
- diagnostics and differences have stable ordering;
- all paths remain inside one real repository root;
- unsafe symlinks and unsupported source entries are rejected;
- `check` and the writing operation use the same output plan; and
- only the documented package-root API and CLI are public contracts.

Do not edit `dist/` or `coverage/`; they are generated and ignored. In the
simple example, edit only `plugin/plugin.yml` and `plugin/skills/`, then use the
compiler to regenerate its owned outputs. See the
[example guide](examples/simple-agent-plugin/README.md).

Update documentation when behavior or public contracts change.

## Add tests

Every behavior change should have a test. A bug fix should include a regression
test when practical.

Place the test at the lowest layer that proves the behavior:

| Layer       | Use for                                                  |
| ----------- | -------------------------------------------------------- |
| Unit        | One rule or pure module                                  |
| Integration | Real compiler, filesystem, or CLI boundaries             |
| Conformance | Claude or Codex output against its owned public contract |

Mirror the production area under `tests/src/`. Changes to conformance fixtures
must include evidence that the provider-owned contract changed; do not update a
golden file only to make a failing test pass.

Run a focused test while developing:

```bash
npm test -- tests/src/unit-tests/core
```

## Run the checks

Use the repository scripts so local checks match CI:

```bash
npm run code:typecheck
npm run code:check
npm run markdown:check
npm test
```

`npm test` performs a clean build before running Vitest. CI also packs the exact
npm artifact and exercises its CLI, ESM exports, and TypeScript declarations in
a clean consumer.

To apply the configured formatters locally, run:

```bash
npm run code:format
npm run markdown:format
```

Review the resulting diff and keep only intentional changes.

## Open a pull request

Open the pull request against `main`. Draft pull requests are welcome when you
want early feedback on direction.

Use a short, meaningful title. The existing history generally follows
`<type>: <lowercase summary>`, for example
`fix: reject an escaping output path`. In the description:

- explain the problem and the chosen approach;
- link the issue with `Closes #123` when applicable;
- list the checks you ran and their results;
- call out public API, CLI, schema, generated-output, or compatibility effects;
  and
- include migration notes or before-and-after output when it helps review.

Before requesting review, confirm that:

- the diff is focused and contains no unrelated formatting or lockfile churn;
- new behavior and bug fixes are covered by tests;
- documentation is current when required;
- the local checks pass; and
- the branch contains no generated build files, secrets, or personal data.

Do not change the package version in a normal contribution. Release preparation
is a separate maintainer task described in the [release guide](docs/RELEASE.md).
Do not publish the package, create or move a Git tag, or create a GitHub Release
manually; the protected CI/CD flow owns those actions after a release pull
request is merged.

Maintainers may request changes to preserve compatibility, determinism, safety,
or the project's intentionally narrow scope. A contribution may be declined even
when it is well implemented if it does not fit that scope.

## License

By submitting a contribution, you agree that it may be distributed under the
project's [MIT License](LICENSE).

[issues]: https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/issues
