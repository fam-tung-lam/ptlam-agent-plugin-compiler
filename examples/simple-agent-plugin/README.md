# Simple Agent plugin

This example shows the smallest practical workflow for compiling an agent plugin
for Claude and Codex.

The authored source contains three skills:

- `prepare-change-plan` is public and requires `inspect-repository`;
- `inspect-repository` is an internal dependency; and
- `write-commit-message` is public and standalone.

The compiler publishes the two public skills at the root of `skills/`. It embeds
`inspect-repository` under `prepare-change-plan/references/required-skills/`, so
the dependent skill stays self-contained.

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

Generate the shared skills tree and both provider manifests:

```bash
npm run plugin:compile
```

Verify that the authored source is valid and the generated files are current:

```bash
npm run plugin:verify
```

Edit only `plugin/plugin.yml` and `plugin/skills/`. The compiler owns `skills/`,
`.claude-plugin/`, and `.codex-plugin/` in this example.
