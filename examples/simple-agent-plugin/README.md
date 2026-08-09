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

Install the exact compiler version declared in `package.json`:

```bash
npm install
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
