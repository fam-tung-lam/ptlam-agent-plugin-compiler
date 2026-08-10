# Providers

Agent Plugin Compiler includes five adapters. Each adapter consumes the same
validated plugin model and declares exact-file ownership for its host manifest.
The shared renderer owns `skills/**` separately.

## Built-in output

| ID        | Host                 | Manifest paths                                                  |
| --------- | -------------------- | --------------------------------------------------------------- |
| `claude`  | Claude plugin        | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| `codex`   | Codex plugin         | `.codex-plugin/plugin.json`                                     |
| `copilot` | GitHub Copilot CLI   | `plugin.json`                                                   |
| `gemini`  | Gemini CLI extension | `gemini-extension.json`                                         |
| `kimi`    | Kimi Code CLI plugin | `kimi.plugin.json`                                              |

Claude emits both its plugin manifest and local marketplace manifest. Codex and
Kimi point at the generated `skills/` directory. Copilot and Gemini discover the
root skill tree by host convention.

Provider schemas and fields belong to their respective hosts. The compiler's
conformance tests pin the external formats implemented by this release.

## Default selection

Declare defaults in the authored manifest:

```yaml
providers:
  - claude
  - codex
```

An empty list requests shared skills without built-in provider manifests.

## One-run override

The CLI override replaces the manifest list; it does not add to it:

```bash
plugin-compiler compile --provider copilot,gemini,kimi
```

Use `--no-providers` for an explicit empty override. The programmatic API uses
the same rule: omit `providers` for manifest defaults, pass a list to replace
them, or pass `[]` for shared skills only.

## Custom adapters

Programmatic consumers can create an isolated `ProviderAdapterRegistry` and
register another adapter. Custom provider IDs use lowercase letters, digits, and
hyphens, beginning with a letter.

An adapter must declare stable exact-file paths. Complete-tree ownership is
rejected so a provider cannot claim an open-ended repository directory.

Next: use provider constants through
[Programmatic Usage](/guide/programmatic-usage), or review the
[compile and verification workflow](/guide/quick-start).
