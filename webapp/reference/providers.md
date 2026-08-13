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

## Manual-only skill invocation

Schema v2 can emit `disable-model-invocation: true` in shared skill frontmatter.
Current hosts handle that field as follows:

| Provider  | Loads the skill | Prevents model invocation |
| --------- | --------------- | ------------------------- |
| `claude`  | Yes             | Yes                       |
| `codex`   | Yes             | No; ignores the field     |
| `copilot` | Yes             | Yes                       |
| `gemini`  | Yes             | No; ignores the field     |
| `kimi`    | Yes             | Yes                       |

The shared field is syntactically compatible with every built-in provider, but
it is behaviorally enforced only by Claude Code, GitHub Copilot CLI, and Kimi
Code CLI. Do not rely on it as a Codex or Gemini safety boundary.

## Hook translation

Built-in adapters advertise `supportedHookEvents`. One authored handler tree is
reused, while each binding is emitted only when the host exposes a semantically
equivalent event:

| Universal event       | Claude/Codex          | Copilot               | Gemini         | Kimi                 |
| --------------------- | --------------------- | --------------------- | -------------- | -------------------- |
| `sessionStart`        | `SessionStart`        | `sessionStart`        | `SessionStart` | `SessionStart`       |
| `sessionEnd`          | `SessionEnd`          | `sessionEnd`          | `SessionEnd`   | `SessionEnd`         |
| `userPromptSubmit`    | `UserPromptSubmit`    | `userPromptSubmitted` | `BeforeAgent`  | `UserPromptSubmit`   |
| `userPromptExpansion` | `UserPromptExpansion` | —                     | —              | —                    |
| `preToolUse`          | `PreToolUse`          | `preToolUse`          | `BeforeTool`   | `PreToolUse`         |
| `postToolUse`         | `PostToolUse`         | `postToolUse`         | `AfterTool`    | `PostToolUse`        |
| `postToolUseFailure`  | `PostToolUseFailure`  | `postToolUseFailure`  | —              | `PostToolUseFailure` |
| `permissionRequest`   | `PermissionRequest`   | `permissionRequest`   | —              | `PermissionRequest`  |
| `permissionDenied`    | `PermissionDenied`    | —                     | —              | —                    |
| `subagentStart`       | `SubagentStart`       | `subagentStart`       | —              | `SubagentStart`      |
| `subagentStop`        | `SubagentStop`        | `subagentStop`        | —              | `SubagentStop`       |
| `preCompact`          | `PreCompact`          | `preCompact`          | `PreCompress`  | `PreCompact`         |
| `postCompact`         | `PostCompact`         | —                     | —              | `PostCompact`        |
| `stop`                | `Stop`                | `agentStop`           | `AfterAgent`   | `Stop`               |
| `stopFailure`         | `StopFailure`         | —                     | —              | `StopFailure`        |
| `notification`        | `Notification`        | `notification`        | `Notification` | `Notification`       |
| `fileChanged`         | `FileChanged`         | —                     | —              | —                    |
| `cwdChanged`          | `CwdChanged`          | —                     | —              | —                    |
| `setup`               | `Setup`               | —                     | —              | —                    |

Native hook output is written to `hooks/claude-hooks.json`,
`hooks/codex-hooks.json`, `hooks/copilot-hooks.json`, conventional
`hooks/hooks.json` for Gemini, or inline in `kimi.plugin.json`.

Provider-specific event names stay out of the authored manifest. The generated
dispatcher exposes the universal event, provider ID, immutable native input,
common prompt/response fields, and retry state. Portable `additionalContext` and
stop-retry results are translated where supported; other handler results pass
through to the native hook contract.

Hook handler failures are fail-open. Unsupported events do not suppress
compatible bindings or other provider output; each receives a structured skipped
diagnostic. The compiler does not emit fallback skills or provider instruction
files.

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
[Kimi Code CLI](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html).

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
`supportedHookEvents` only for events that `compile()` emits with equivalent
native semantics. Omitted bindings are hidden from the adapter and reported as
non-fatal skips.

Next: use provider constants through
[Programmatic Usage](/guide/programmatic-usage), or review how selection affects
what is written in [Generated output](/guide/generated-output).
