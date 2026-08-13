# Hook `type` and `matcher` portability

- Research date: 2026-08-13
- Providers: Claude Code, Codex, GitHub Copilot CLI, Gemini CLI, Kimi Code CLI
- Decision: do not add `type` or `matcher` to the provider-neutral hook model
  yet

## Conclusion

Neither field is universal enough for the compiler's current portable hook seam:

- `type` is absent from Kimi's hook schema. The other providers accept it, but
  their supported handler kinds differ. The compiler currently emits command
  hooks only.
- `matcher` exists in all five providers, but support and meaning depend on the
  event. It is ignored or unsupported for several events used by the compiler's
  `before-request` and `before-response` lifecycles.

The portable manifest should therefore continue to describe intent with only a
`lifecycle` and `.mjs` `handler`. Provider adapters remain responsible for
emitting native command-hook fields.

## Provider comparison

| Provider           | Native `type`                                                                | Native `matcher`                                                      | Current portable lifecycle mapping                                                         |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Claude Code        | Required; supports `command`, `http`, `mcp_tool`, `prompt`, and `agent`      | Optional and event-dependent                                          | `UserPromptSubmit` / `Stop`; neither event supports matching                               |
| Codex              | Present; only `command` handlers execute currently                           | Optional and event-dependent                                          | `UserPromptSubmit` / `Stop`; configured matchers are ignored                               |
| GitHub Copilot CLI | Optional for command hooks; also supports `http` and a limited `prompt` hook | Optional only for selected events                                     | `userPromptTransformed` / `agentStop`; neither is listed as matcher-filterable             |
| Gemini CLI         | Required; currently only `command` is supported                              | Optional; regex for tool events and exact string for lifecycle events | `BeforeAgent` / `AfterAgent`; generated hooks intentionally match every occurrence         |
| Kimi Code CLI      | Not supported                                                                | Optional regex                                                        | `UserPromptSubmit` / `Stop`; native rules use `event`, `matcher`, `command`, and `timeout` |

## Current compiler behavior

The renderer already follows the native contracts:

- Claude and Codex emit nested handlers with `type: "command"` and no matcher.
- Copilot emits flat handlers with `type: "command"` and no matcher.
- Gemini emits nested handlers with `type: "command"` and no matcher.
- Kimi emits flat `event`, `command`, and `timeout` fields, with neither `type`
  nor `matcher`.

Omitting `matcher` gives the intended current behavior: every occurrence of the
mapped lifecycle event invokes the authored handler.

## Why the fields stay provider-owned

Adding a universal `type` would either expose values Kimi cannot represent or
require provider-specific validation in the portable manifest. Adding a
universal `matcher` would imply consistent filtering where none exists for the
current lifecycle mappings. Both would weaken the existing promise that every
portable binding compiles consistently across all built-in providers.

This decision does not prevent adapters from emitting a native `type` or an
implicit match-all rule. It only keeps those execution details out of the
authored schema.

## Revisit when needed

Reopen the design if one of these requirements appears:

1. portable tool-call hooks need filtering by tool name or arguments;
2. non-command handlers become a cross-provider requirement;
3. a capability matrix is introduced for partial lifecycle or handler support;
4. provider-specific hook options are intentionally added to the manifest; or
5. native schemas converge enough to define stable portable semantics.

Any future proposal should define portable behavior first, then specify each
provider's translation and unsupported-case policy. Sharing field names alone is
insufficient because matcher targets, regex semantics, and handler types differ.

## Primary sources

All sources were accessed on 2026-08-13:

- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks)
- [Codex hooks reference](https://developers.openai.com/codex/hooks)
- [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [Gemini CLI hooks reference](https://geminicli.com/docs/hooks/reference/)
- [Kimi Code CLI hooks reference](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html)
