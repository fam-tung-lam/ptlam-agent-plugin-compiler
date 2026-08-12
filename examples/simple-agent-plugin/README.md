# Simple Agent plugin

This example shows the smallest practical workflow for compiling an agent plugin
for Claude and Codex.

The authored source contains three skills and one logical lifecycle hook:

- `prepare-change-plan` is public and requires `inspect-repository`;
- `inspect-repository` is an internal dependency; and
- `write-commit-message` is public and standalone.
- `simple-logger` prints each request and response to standard error, then lets
  the interaction continue unchanged.

Its source declaration is in `plugin/plugin.yml`; its two authored modules are
`plugin/hooks/simple-logger/request.mjs` and `response.mjs`. The generated
Claude and Codex configurations reuse one compiled copy of both handlers under
`hooks/handlers/`.

The compiler publishes the two public skills at the root of `skills/`. It embeds
`inspect-repository` under `prepare-change-plan/skills/`, so the dependent skill
stays self-contained.

## Run the example

The compiler dependency is declared as `file:../..`. This is npm's equivalent of
a Flutter `path` dependency: the example uses the package from the current
repository checkout instead of downloading it from the registry. A standalone
consumer should replace it with an exact published version, as shown in the
[root requirements](../../README.md#requirements).

Install and build the compiler from the repository root:

```bash
npm ci
npm run build
```

Then install the example dependencies:

```bash
cd examples/simple-agent-plugin
npm ci
```

The authored `plugin/plugin.yml` selects Claude and Codex. Compile the shared
skills tree and both provider manifests from that default:

```bash
npm run plugin:compile
```

Verify that the authored source is valid and the generated files are current:

```bash
npm run plugin:verify
```

For a one-off replacement, call the compiler directly with a comma-separated
list. To compile only shared skills for one run, pass the explicit empty
override:

```bash
npm exec -- plugin-compiler compile --provider codex
npm exec -- plugin-compiler compile --no-providers
```

Edit only `plugin/plugin.yml`, `plugin/skills/`, and `plugin/hooks/`. The
compiler owns `skills/`, generated hook files under `hooks/`, `.claude-plugin/`,
and `.codex-plugin/` in this example.
