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
- `matcher` exists in all five providers, but its target, syntax, and accepted
  values depend on the provider and event. It is ignored for some events, is a
  regular expression over different targets for others, and is an exact
  lifecycle value in Gemini.

The portable manifest should therefore continue to describe intent with only a
`lifecycle` and `.mjs` `handler`. Provider adapters remain responsible for
emitting native command-hook fields.

## Provider comparison

| Provider           | Native `type`                                                             | Native `matcher`                                                      | Current portable lifecycle mapping                                                         |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Claude Code        | `command`, `http`, `mcp_tool`, `prompt`, `agent`; support varies by event | Optional; event-dependent target and values                           | `UserPromptSubmit` / `Stop`; neither event supports matching                               |
| Codex              | Only `command` executes; `prompt` and `agent` are parsed but skipped      | Optional regex; only selected events honor it                         | `UserPromptSubmit` / `Stop`; configured matchers are ignored                               |
| GitHub Copilot CLI | `command`, `http`, and `prompt`; `prompt` is limited to `sessionStart`    | Optional anchored regex on selected events                            | `userPromptTransformed` / `agentStop`; neither is listed as matcher-filterable             |
| Gemini CLI         | Required; currently only `command` is supported                           | Optional; regex for tool events and exact string for lifecycle events | `BeforeAgent` / `AfterAgent`; generated hooks intentionally match every occurrence         |
| Kimi Code CLI      | No `type` field; every rule requires `command`                            | Optional regex over an event-specific target                          | `UserPromptSubmit` / `Stop`; native rules use `event`, `matcher`, `command`, and `timeout` |

## Detailed native values

The tables below distinguish closed value sets from dynamic strings. Tool names,
subagent names, prompt text, and error types are runtime domains rather than
portable enums.

### Claude Code

Claude supports five handler types, but not uniformly:

| Handler `type`                                   | Supported events                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`, `http`, `mcp_tool`, `prompt`, `agent` | `PermissionDenied`, `PermissionRequest`, `PostToolBatch`, `PostToolUse`, `PostToolUseFailure`, `PreToolUse`, `Stop`, `SubagentStop`, `TaskCompleted`, `TaskCreated`, `TeammateIdle`, `UserPromptExpansion`, `UserPromptSubmit`                         |
| `command`, `http`, `mcp_tool`                    | `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `Elicitation`, `ElicitationResult`, `FileChanged`, `InstructionsLoaded`, `Notification`, `PostCompact`, `PreCompact`, `SessionEnd`, `StopFailure`, `SubagentStart`, `WorktreeCreate`, `WorktreeRemove` |
| `command`, `mcp_tool`                            | `SessionStart`, `Setup`                                                                                                                                                                                                                                |

Claude matcher targets and documented values are:

| Events                                                                                                                                                          | Matcher target and documented values                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`                                                                      | Tool name, for example `Bash`, `Edit`, `Write`, or `mcp__<server>__<tool>`                                                                                                                 |
| `SessionStart`                                                                                                                                                  | `startup`, `resume`, `clear`, `compact`, `fork`                                                                                                                                            |
| `Setup`                                                                                                                                                         | `init`, `maintenance`                                                                                                                                                                      |
| `SessionEnd`                                                                                                                                                    | `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`                                                                                                   |
| `Notification`                                                                                                                                                  | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`, `elicitation_url_dialog`, `elicitation_complete`, `elicitation_response`, `agent_needs_input`, `agent_completed` |
| `SubagentStart`, `SubagentStop`                                                                                                                                 | Dynamic agent type: built-ins such as `general-purpose`, `Explore`, `Plan`, custom names, or plugin-scoped names                                                                           |
| `PreCompact`, `PostCompact`                                                                                                                                     | `manual`, `auto`                                                                                                                                                                           |
| `ConfigChange`                                                                                                                                                  | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills`                                                                                                         |
| `DirectoryAdded`                                                                                                                                                | `slash_command`, `register_repo_root`                                                                                                                                                      |
| `FileChanged`                                                                                                                                                   | Literal watched filenames rather than the normal matcher grammar                                                                                                                           |
| `StopFailure`                                                                                                                                                   | `rate_limit`, `overloaded`, `authentication_failed`, `oauth_org_not_allowed`, `billing_error`, `invalid_request`, `model_not_found`, `server_error`, `max_output_tokens`, `unknown`        |
| `InstructionsLoaded`                                                                                                                                            | `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact`                                                                                                               |
| `UserPromptExpansion`                                                                                                                                           | Dynamic skill or command name                                                                                                                                                              |
| `Elicitation`, `ElicitationResult`                                                                                                                              | Dynamic MCP server name                                                                                                                                                                    |
| `CwdChanged`, `UserPromptSubmit`, `PostToolBatch`, `Stop`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`, `MessageDisplay` | No matcher support; always fires                                                                                                                                                           |

Most matcher-enabled events accept alternatives separated by `|` or `,`.
Matchers on unsupported events are silently ignored.

### Codex

Codex currently executes only `type: "command"`. It parses `prompt` and `agent`
handlers for compatibility but skips them.

`matcher` is a regex string. `"*"`, `""`, or omission means match all. Current
matcher targets and values are:

| Event                                            | Matcher target and documented values                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `PermissionRequest`, `PreToolUse`, `PostToolUse` | Tool name. Canonical examples include `Bash`, `apply_patch`, and `mcp__<server>__<tool>`; `Edit` and `Write` are aliases for `apply_patch` |
| `PreCompact`, `PostCompact`                      | `manual`, `auto`                                                                                                                           |
| `SessionStart`                                   | `startup`, `resume`, `clear`, `compact`                                                                                                    |
| `SessionEnd`                                     | Currently only `other`                                                                                                                     |
| `SubagentStart`, `SubagentStop`                  | Dynamic subagent type                                                                                                                      |
| `UserPromptSubmit`, `Stop`                       | No matcher support; a configured matcher is ignored                                                                                        |

### GitHub Copilot CLI

Copilot supports `command`, `http`, and `prompt` handlers. `command` is the
default when `type` is omitted. `prompt` is supported only for a new interactive
`sessionStart`; it does not fire on resume or in non-interactive mode. HTTP
hooks use `type: "http"` and command hooks use or default to `type: "command"`.

For native camelCase events, a matcher is an anchored regular expression and
must match the complete value. PascalCase compatibility events use Claude-style
literal or `|`-separated tool-name matching. Native matcher support is:

| Event                                                           | Matcher target and documented values                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification`                                                  | `notification_type`: `shell_completed`, `shell_detached_completed`, `agent_completed`, `agent_idle`, `permission_prompt`, `elicitation_dialog` |
| `permissionRequest`, `preToolUse`, `postToolUse`                | Runtime tool name: `ask_user`, `bash`, `create`, `edit`, `glob`, `grep`, `powershell`, `task`, `view`, `web_fetch`, plus other runtime tools   |
| `preCompact`                                                    | `manual`, `auto`                                                                                                                               |
| `subagentStart`                                                 | Dynamic agent name                                                                                                                             |
| Other events, including `userPromptTransformed` and `agentStop` | No documented matcher support                                                                                                                  |

### Gemini CLI

Gemini requires `type` and currently accepts only `"command"`. Tool-event
matchers are regular expressions; lifecycle matchers are exact strings. Omission
matches all, and the official writing guide uses `"*"` as a catch-all for events
without a narrower documented domain.

| Events                                                                          | Matcher target and documented values                                                                                                      |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `BeforeTool`, `AfterTool`                                                       | Tool name, including built-ins such as `read_file` and `run_shell_command`, or MCP names shaped as `mcp_<server>_<tool>`; regex supported |
| `SessionStart`                                                                  | `startup`, `resume`, `clear`                                                                                                              |
| `SessionEnd`                                                                    | `exit`, `clear`, `logout`, `prompt_input_exit`, `other`                                                                                   |
| `Notification`                                                                  | Currently `ToolPermission`                                                                                                                |
| `PreCompress`                                                                   | `auto`, `manual`                                                                                                                          |
| `BeforeAgent`, `AfterAgent`, `BeforeModel`, `BeforeToolSelection`, `AfterModel` | No finite matcher value set is documented; use omission or the documented `*` catch-all unless runtime-specific filtering is verified     |

### Kimi Code CLI

Kimi has no handler `type` field. A rule consists only of `event`, optional
`matcher`, required `command`, and optional `timeout`; extra fields make the
configuration fail to load. `matcher` is a regular expression over the event's
target, and omission matches all.

| Event                                                                                      | Matcher target and documented values                      |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `UserPromptSubmit`                                                                         | Submitted prompt text                                     |
| `UserPromptQueued`                                                                         | Queued prompt text                                        |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionResult` | Dynamic tool name                                         |
| `Stop`, `SessionHeartbeat`, `Interrupt`                                                    | Empty string                                              |
| `TurnStarted`                                                                              | Turn origin, for example `user`, `task`, `system_trigger` |
| `SessionStart`                                                                             | `startup`, `resume`                                       |
| `SessionEnd`                                                                               | `exit`, `archive`                                         |
| `SubagentStart`, `SubagentStop`                                                            | Dynamic subagent name                                     |
| `TaskStarted`                                                                              | `agent`, `process`, `question`                            |
| `StopFailure`                                                                              | Dynamic error type                                        |
| `PreCompact`, `PostCompact`                                                                | `manual`, `auto`                                          |
| `Notification`                                                                             | Dynamic notification type, for example `task.completed`   |

## Current compiler behavior

The renderer already follows the native contracts:

- Claude and Codex emit nested handlers with `type: "command"` and no matcher.
- Copilot emits flat handlers with `type: "command"` and no matcher.
- Gemini emits nested handlers with `type: "command"` and no matcher.
- Kimi emits flat `event`, `command`, and `timeout` fields, with neither `type`
  nor `matcher`.

Omitting `matcher` gives the intended current behavior: every occurrence of the
mapped lifecycle event invokes the authored handler. This is especially
important because the current mappings do not share a portable filter target:
Claude and Codex ignore matchers for both mapped events, Copilot does not
document matcher support for either mapped event, Gemini uses an unfiltered
lifecycle group, and Kimi would match prompt text for `UserPromptSubmit` but an
empty string for `Stop`.

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
- [Official OpenAI Codex hooks documentation](https://developers.openai.com/codex/hooks)
- [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [Gemini CLI hooks reference](https://geminicli.com/docs/hooks/reference/)
- [Kimi Code CLI hooks reference](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html)
