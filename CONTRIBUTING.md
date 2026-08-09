# Contributing

Thank you for helping improve the Agent Plugin Compiler. Bug reports,
documentation fixes, tests, and focused code changes are welcome.

Before contributing, use these documents as the sources of truth:

- [Development](docs/DEVELOPMENT.md) covers local setup, the project map,
  commands, test layers, and release documentation.
- [Architecture](docs/ARCHITECTURE.md) defines component boundaries, dependency
  rules, domain models, operation flows, and filesystem ownership.
- [README](README.md) defines the supported public API, CLI, behavior, and
  project scope.

This guide covers only the contribution process.

## Before you contribute

Search the [issues] and open pull requests before starting work. A direct pull
request is fine for a typo, broken link, test improvement, or small obvious fix.

Open an issue before substantial work or a change to a public or generated
contract, including:

- the package-root API or CLI;
- the manifest schema or accepted source layout;
- provider output or generated paths;
- supported runtimes or dependencies; or
- CI, package contents, or the release process.

Describe the problem and intended outcome before proposing an implementation.
This lets maintainers confirm that the change fits the compiler's scope and
avoids incompatible work.

## Report a bug

Open a [bug report][issues] with enough information to reproduce the problem:

- package version, Node.js version, npm version, operating system, and
  invocation method;
- a minimal, sanitized plugin layout and the relevant authored files;
- exact steps to reproduce;
- expected and actual behavior; and
- stdout, stderr, and the exit code when the CLI is involved.

Remove tokens, credentials, personal data, and other secrets from all examples.

## Propose a change

Open an [issue][issues] that explains:

- the user problem and who encounters it;
- why the current interface is insufficient;
- the smallest useful behavior change;
- compatibility or migration concerns; and
- alternatives you considered.

The compiler validates and compiles agent-plugin artifacts. Installation,
repository discovery, version management, and plugin publication remain outside
its scope.

## Prepare a pull request

Create a focused branch from an up-to-date `main` branch. Follow the
[development guide](docs/DEVELOPMENT.md) for setup, implementation commands,
formatting, tests, and build checks. Follow the
[architecture guide](docs/ARCHITECTURE.md) for module boundaries, public
contracts, file ownership, determinism, and filesystem safety.

Keep each pull request focused on one problem. Add or update tests when behavior
changes, and update the relevant documentation when a public contract changes.
Before requesting review, inspect the complete diff and remove unrelated
formatting, lockfile churn, generated build files, secrets, and personal data.

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

Maintainers may request changes to preserve compatibility, determinism, safety,
or the project's intentionally narrow scope. A contribution may be declined even
when it is well implemented if it does not fit that scope.

## Security reports

Do not report a vulnerability in a public issue or pull request. Follow the
[security policy](SECURITY.md) instead.

## Releases

Do not change the package version in a normal contribution. Release preparation
is a separate maintainer task described in the [release guide](docs/RELEASE.md).
Do not publish the package, create or move a Git tag, or create a GitHub Release
manually; the protected CI/CD flow owns those actions after a release pull
request is merged.

## Community expectations

Be respectful, constructive, and specific. Assume good intent, discuss ideas
rather than people, and help keep the project welcoming to contributors with
different backgrounds and levels of experience.

## License

By submitting a contribution, you agree that it may be distributed under the
project's [MIT License](LICENSE).

[issues]: https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/issues
