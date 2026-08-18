# Skill Frontmatter Specification

This specification covers only Claude-style inline YAML frontmatter. It owns
those fields and their checks. Use an optional field only when the target's
local schema, validator, or accepted metadata verifies it.

When a manifest or compiler owns the metadata, edit that source instead. The
`ptlam-agent-plugin` compiler, for example, rejects frontmatter in authored
`plugin/skills/*/SKILL.md` and generates it from `plugin/plugin.yml`.

## Choose fields

Most skills need only `name` and `description`. Add an optional field only when
the workflow requires it and the target verifies it.

| Field                      | Purpose                                        |
| -------------------------- | ---------------------------------------------- |
| `name`                     | Skill and slash-command identifier             |
| `description`              | Invocation pointer, or user-facing summary     |
| `disable-model-invocation` | Restrict starting the skill to the user        |
| `argument-hint`            | Document slash-command arguments               |
| `user-invocable`           | Control menu visibility where supported        |
| `allowed-tools`            | Limit the tools available inside the skill     |
| `context`                  | Request isolated execution                     |
| `agent`                    | Select a supported subagent                    |
| `model`                    | Select a supported model                       |
| `hooks`                    | Run commands around supported lifecycle events |

## Name and description

Use the target's constraints. Common `name` constraints: lowercase letters,
digits, and hyphens; 64 characters maximum; no XML tags; and a matching
directory name.

Treat `description` as a pointer the model reads, or a summary a person reads. A
common maximum is 1024 characters. Write one trigger per branch, plus a reach
clause when another skill should compose this one. The naming and description
rules live in
[package layout](skill-package-layout.md#name-it-after-what-it-does).

## Invocation and visibility

Set `disable-model-invocation: true` only when the user must start the workflow.
Omitting it commonly permits model discovery. Use the target's local schema or
validator to distinguish discovery from menu visibility.

Use `argument-hint` to document expected arguments. Use `user-invocable` only
when a local schema, validator, or accepted example verifies how it interacts
with model invocation.

## Tools and execution

Declare the smallest `allowed-tools` set you have verified, using exact host
identifiers. Use `context: fork` only when isolation helps and you know what
context and tools the fork receives.

Select an `agent` or a `model` only from identifiers exposed by the host's local
configuration or validator, and only when the choice materially changes the
workflow.

## Hooks

Use `hooks` only when the target supports the event, the side effect is
authorized, and an explicit workflow step cannot give the same control more
clearly. Verify the matchers, commands, inputs, and failure behavior.

## String substitutions

Claude-style hosts may support:

| Variable               | Meaning                                |
| ---------------------- | -------------------------------------- |
| `$ARGUMENTS`           | All arguments                          |
| `$ARGUMENTS[N]`        | One zero-based argument                |
| `$N`                   | Short positional form, where supported |
| `${CLAUDE_SESSION_ID}` | Current session identifier             |

Omit substitutions and argument hints when the skill consumes no arguments. Use
only substitutions verified by a local schema, validator, or accepted example.

## Static checks

Confirm that every field exists on the target; that the name and directory meet
its constraints; that invocation and visibility match the chosen policy; that
the description's triggers and reach clause are complete; that every tool,
agent, model, hook, and substitution is available; that time-sensitive behavior
is locally verifiable; and that no manifest or generator owns this metadata
instead.
