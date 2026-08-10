# Quick Start

Once your repository contains an authored `plugin/**` source, one command
validates the skill graph, writes deterministic output, and verifies the result.
See [Installation](/guide/installation) and the
[Authored Plugin Source](/reference/authored-source) if the source is not ready
yet.

## Compile and verify

Run this command from the plugin repository root:

```bash
npm exec -- plugin-compiler compile
```

The compiler validates the complete authored source, reconciles the root
`skills/` tree and the exact host manifest paths selected by
`plugin/plugin.yml`, then verifies the new state. These files are build results:
update `plugin/**` and compile again instead of editing them by hand.

### Inspect the self-contained skills

For example, a public skill with one internal dependency compiles to this shared
tree:

```text
skills/
├── README.md
├── prepare-change-plan/
│   ├── SKILL.md
│   └── skills/
│       └── inspect-repository/
│           └── SKILL.md
└── write-commit-message/
    └── SKILL.md
```

`prepare-change-plan` can be installed by itself because its internal
`inspect-repository` dependency is nested inside it. If a required skill is
public, it is nested where needed and also emitted as its own root skill.
`skills/README.md` catalogs the published roots.

### Inspect the selected host manifests

The same validated plugin model produces the built-in host files:

| Provider | Managed manifest paths                                          |
| -------- | --------------------------------------------------------------- |
| Claude   | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| Codex    | `.codex-plugin/plugin.json`                                     |
| Copilot  | `plugin.json`                                                   |
| Gemini   | `gemini-extension.json`                                         |
| Kimi     | `kimi.plugin.json`                                              |

Without an override, `compile` uses the manifest's `providers` list. Replace it
for one run with a comma-separated selection:

```bash
npm exec -- plugin-compiler compile --provider claude,codex
```

Compile shared skills without host manifests with `--no-providers`. The two
provider options are mutually exclusive. Changing the selection removes stale
built-in manifest files from their declared exact paths while leaving unrelated
repository files outside the write plan.

Next: configure [visibility and lifecycle status](/guide/advanced-usage),
compare [provider contracts](/reference/providers), or use the compiler
[programmatically](/guide/programmatic-usage).
