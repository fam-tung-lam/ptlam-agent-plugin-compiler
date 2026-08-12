# Providers

Agent Plugin Compiler includes five adapters. Each adapter consumes the same
validated plugin model and declares exact-file ownership for its host manifest.
The shared renderer owns `skills/**` and reusable hook handlers separately.

## Built-in output

| ID        | Host                 | Manifest paths                                                  |
| --------- | -------------------- | --------------------------------------------------------------- |
| `claude`  | Claude plugin        | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| `codex`   | Codex plugin         | `.codex-plugin/plugin.json`                                     |
| `copilot` | GitHub Copilot CLI   | `plugin.json`                                                   |
| `gemini`  | Gemini CLI extension | `gemini-extension.json`                                         |
| `kimi`    | Kimi Code CLI plugin | `kimi.plugin.json`                                              |

## Hook translation

All built-in adapters currently advertise the binary `supportsHooks` capability.
One authored handler tree is reused across compatible providers:

| Provider  | Request lifecycle       | Response lifecycle | Native hook output              |
| --------- | ----------------------- | ------------------ | ------------------------------- |
| `claude`  | `UserPromptSubmit`      | `Stop`             | `hooks/claude-hooks.json`       |
| `codex`   | `UserPromptSubmit`      | `Stop`             | `hooks/codex-hooks.json`        |
| `copilot` | `userPromptTransformed` | `agentStop`        | `hooks/copilot-hooks.json`      |
| `gemini`  | `BeforeAgent`           | `AfterAgent`       | conventional `hooks/hooks.json` |
| `kimi`    | `UserPromptSubmit`      | `Stop`             | inline in `kimi.plugin.json`    |

Provider-specific event names, input payloads, and response shapes stay out of
the authored manifest. The generated dispatcher normalizes request text, final
response text when the host exposes it, and retry state, then translates the
handler result back to native context or continuation output.

Hook handler failures are fail-open. A provider with no hook capability still
compiles all its other components and returns a structured skipped diagnostic;
the compiler does not emit fallback skills or provider instruction files.

Claude emits both its plugin manifest and local marketplace manifest. Codex and
Kimi point at the generated `skills/` directory. Copilot and Gemini discover the
root skill tree by host convention.

Provider schemas and fields belong to their respective hosts. The compiler's
conformance tests pin the external formats implemented by this release. Hook
translations were checked against the current official references for
[Claude Code](https://code.claude.com/docs/en/hooks),
[Codex](https://developers.openai.com/plugins/build/plugins),
[GitHub Copilot CLI](https://docs.github.com/en/copilot/reference/hooks-reference),
[Gemini CLI](https://geminicli.com/docs/hooks/reference/), and
[Kimi Code CLI](https://moonshotai.github.io/kimi-code/en/customization/plugins.html#hooks-in-plugins).

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
rejected so a provider cannot claim an open-ended repository directory. Set
`supportsHooks: true` only when `compile()` emits a valid native configuration
for both current provider-neutral lifecycle stages. Omit it otherwise; hook
declarations are hidden from the adapter and reported as non-fatal skips.

Next: use provider constants through
[Programmatic Usage](/guide/programmatic-usage), or review how selection affects
what is written in [Generated output](/guide/generated-output).
