---
description: Install Agent Plugin Compiler through npm or Homebrew.
---

# Installation

Pick the install method that fits how you will use the compiler. Add the npm
package to a plugin repository for reproducible local and CI builds, or install
the command globally with Homebrew for interactive use.

::: tip Which method should I choose?

Use **npm** for a repository that builds and publishes a plugin. The exact
dependency and lockfile keep every environment on the same compiler version.

Use **Homebrew** when you want `plugin-compiler` available globally and prefer
Homebrew to manage the compiler and Node.js runtime.

:::

## npm

The compiler requires Node.js 22.6 or newer. Install the package as an exact
development dependency in the repository that owns the plugin:

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler
```

Commit `package.json` and the lockfile with the plugin source. Run the local
executable through npm:

```bash
npm exec -- plugin-compiler --help
```

To try the latest release without changing a project, run it ad hoc:

```bash
npx --yes @fam-tung-lam/ptlam-agent-plugin-compiler@latest --help
```

## Homebrew

Install from the
[PTLam Homebrew tap](https://github.com/fam-tung-lam/homebrew-tap):

```bash
brew install fam-tung-lam/tap/ptlam-agent-plugin-compiler
```

The formula installs the required Node.js runtime. Use the executable directly:

```bash
plugin-compiler --help
```

Homebrew manages upgrades and removal:

```bash
brew upgrade ptlam-agent-plugin-compiler
brew uninstall ptlam-agent-plugin-compiler
```

Homebrew follows stable npm releases but updates independently from any plugin
repository. Keep the exact npm dependency as the source of truth when local and
CI builds must use the same compiler version.

## Verify the install

Confirm that the executable is available through the channel you chose:

::: code-group

```bash [npm]
npm exec -- plugin-compiler --help
```

```bash [Homebrew]
plugin-compiler --help
```

:::

A successful command begins with the CLI usage summary:

```text
Usage: plugin-compiler [OPTIONS] <COMMAND>
```

The project currently distributes the Node.js package and Homebrew formula. It
does not publish a standalone binary installer for `curl` or `mise`.

## Next steps

- [Quick Start](/guide/quick-start) compiles a working plugin from an empty
  directory.
- [Continuous integration](/guide/continuous-integration) keeps generated output
  synchronized in CI.
- [Programmatic usage](/guide/programmatic-usage) calls the same compiler from
  Node.js.
