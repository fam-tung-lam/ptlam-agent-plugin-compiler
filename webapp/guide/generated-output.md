# Generated Output

Generated files are a projection of `plugin/plugin.yml` and `plugin/skills/**`.
Recompile them; do not maintain them as a second source.

## Shared skill tree

The compiler owns the complete root `skills/` tree. It publishes eligible public
skills, writes a catalog, and nests required skill sources inside every public
root skill that needs them.

```text
skills/
├── README.md
└── prepare-change-plan/
    ├── SKILL.md
    └── skills/
        └── inspect-repository/
            └── SKILL.md
```

An internal skill can therefore support a public skill without appearing as a
standalone catalog entry.

## Provider manifests

Provider adapters own exact manifest paths. The built-in outputs are:

| Provider | Managed manifest paths                                          |
| -------- | --------------------------------------------------------------- |
| Claude   | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| Codex    | `.codex-plugin/plugin.json`                                     |
| Copilot  | `plugin.json`                                                   |
| Gemini   | `gemini-extension.json`                                         |
| Kimi     | `kimi.plugin.json`                                              |

Changing the provider selection also reconciles previously managed built-in
manifest files. Unselected provider output is removed from its declared exact
paths; unrelated repository files remain outside the plan.

## Select output for one run

Without an override, `validate`, `compile`, and `check` use the manifest's
`providers` list. Replace that selection for one invocation with a
comma-separated list:

```bash
npm exec -- plugin-compiler compile --provider claude,codex
```

Compile only shared skills with no provider manifests:

```bash
npm exec -- plugin-compiler compile --no-providers
```

The two provider options are mutually exclusive.

## Keep CI honest

Run `compile` when authored source changes. Run `check` in verification paths
where writes are undesirable:

```bash
npm exec -- plugin-compiler check
```

A clean check proves the selected managed paths match the same deterministic
write plan that `compile` would apply.

Next: compare [provider contracts](/reference/providers), or use the compiler
through its [Node.js interface](/reference/node-interface).
