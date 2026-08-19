# Manifest

`plugin/plugin.yml` is the authored source of truth. Schema versions `1` and `2`
are closed contracts: every required property must be present, and unknown
properties are rejected. Version `1` is frozen for existing skill-only plugins;
version `2` adds portable lifecycle hooks and is the default for new plugins.

## Where it lives

The manifest sits at the root of the `plugin/` directory, beside one source
directory per declared skill:

```text
plugin/
├── plugin.yml
├── skills/
│   └── <skill-id>/
│       ├── SKILL.md
│       └── optional-supporting-files
└── hooks/
    └── optional-grouping-directory/
        ├── request.mjs
        ├── response.mjs
        └── optional-internal-resources
```

Every skill `id` in the manifest needs a matching
`plugin/skills/<skill-id>/SKILL.md`. Supporting files may sit beside that
Markdown source. `plugin/skills/<skill-id>/skills/` is reserved for the
compiler, and an authored one is rejected. See
[Generated output](/guide/generated-output) for what compiling produces from
these files.

## Identifiers

`name`, every category or skill `id`, and every reference to them
(`category_id`, `skill_id`, `replacement_skill_id`) share one identifier type:
lowercase kebab-case matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`, at most 64
characters. Underscores and uppercase letters are rejected.

## Top-level fields

| Field            | Type               | Rules                                                 |
| ---------------- | ------------------ | ----------------------------------------------------- |
| `schema_version` | integer            | `1` for the frozen skill-only contract; otherwise `2` |
| `providers`      | unique string list | Empty is allowed; IDs match `^[a-z][a-z0-9-]*$`       |
| `name`           | identifier         | Lowercase kebab-case, at most 64 characters           |
| `description`    | non-empty string   | Describes the complete plugin                         |
| `version`        | string             | Semantic Versioning                                   |
| `author`         | object             | `name` required; `email` and `url` optional           |
| `homepage`       | non-empty string   | Plugin homepage                                       |
| `repository`     | non-empty string   | Source repository                                     |
| `license`        | non-empty string   | Project license identifier                            |
| `keywords`       | unique string list | At least one item                                     |
| `categories`     | category list      | At least one category                                 |
| `skills`         | skill list         | At least one skill                                    |
| `hooks`          | event-keyed object | Optional in v2; rejected by v1                        |

The schema validates `homepage` and `repository` as non-empty strings. Use full
HTTPS URLs so generated provider manifests are useful to consumers.

## Category

`id`, `name`, and `description` are all required:

```yaml
- id: engineering
  name: Engineering
  description: Skills for repository work.
```

Every skill `category_id` must reference a declared category.

## Hook

Hooks require `schema_version: 2`. To migrate a valid v1 manifest, change only
`schema_version` to `2`; its existing fields remain valid and an omitted `hooks`
field normalizes to an empty object.

The `hooks` object keys handler lists directly by universal event. Handler paths
are relative to `plugin/hooks/`:

```yaml
hooks:
  sessionStart:
    - handler: observability/audit.mjs
  userPromptSubmit:
    - handler: observability/audit.mjs
    - handler: simple-logger/request.mjs
  preToolUse:
    - handler: observability/audit.mjs
  postToolUse:
    - handler: observability/audit.mjs
  permissionDenied:
    - handler: observability/audit.mjs
  subagentStart:
    - handler: observability/audit.mjs
  preCompact:
    - handler: observability/audit.mjs
  stop:
    - handler: simple-logger/response.mjs
    - handler: observability/audit.mjs
  fileChanged:
    - handler: observability/audit.mjs
```

Each declared event requires a non-empty list of handler objects. Every object
contains one normalized `.mjs` path, every handler must exist below
`plugin/hooks/`, and handlers run in declaration order. Provider-specific
matcher configuration is intentionally outside this provider-neutral contract.

| Category   | Universal events                                  |
| ---------- | ------------------------------------------------- |
| Session    | `sessionStart`, `sessionEnd`                      |
| Prompt     | `userPromptSubmit`, `userPromptExpansion`         |
| Tool       | `preToolUse`, `postToolUse`, `postToolUseFailure` |
| Permission | `permissionRequest`, `permissionDenied`           |
| Subagent   | `subagentStart`, `subagentStop`                   |
| Context    | `preCompact`, `postCompact`                       |
| Lifecycle  | `stop`, `stopFailure`, `notification`, `setup`    |
| File       | `fileChanged`, `cwdChanged`                       |

Other files inside that directory are loaded as internal resources and copied
with the handlers. They are not separate manifest entries. In particular, the
hook shape has no `required` or `policies` property: per-event provider
capability decides whether native output is generated, while policies remain
private to handler implementation.

`plugin/hooks/.runtime/` is reserved for the compiler-managed dispatcher and
cannot contain authored resources.

## Skill

| Field                      | Contract                                       |
| -------------------------- | ---------------------------------------------- |
| `id`                       | Identifier; needs a matching `SKILL.md` source |
| `description`              | Non-empty public description                   |
| `disable_model_invocation` | Optional v2 boolean; defaults to `false`       |
| `category_id`              | ID of a declared category                      |
| `visibility`               | `internal` or `public`                         |
| `status`                   | `draft`, `active`, `deprecated`, or `archived` |
| `required_skills`          | Dependency list; may be empty                  |

The original six fields remain required. Schema v2 additionally accepts
`disable_model_invocation`; schema v1 rejects it. `deprecation` and `archive`
remain lifecycle-specific optional properties.

Set `disable_model_invocation: true` when a supported host should expose the
skill for explicit user invocation without letting its model select the skill
automatically. The compiler maps it to `disable-model-invocation: true` in every
generated copy of that skill. See [Providers](/reference/providers) for current
host behavior.

### Required skill

```yaml
required_skills:
  - skill_id: inspect-repository
    reason: The plan must reflect verified repository facts.
    instructions: Inspect the repository and pass the facts forward.
```

`skill_id`, `reason`, and `instructions` are all required. The compiler
validates the complete dependency graph, not just the YAML shape;
[Skill graph](/guide/skill-graph) lists what it rejects.

### Lifecycle detail blocks

Status decides which block a skill must carry. The schema rejects the block that
does not belong to the declared status.

| Status            | Required block | Required keys            | Optional key           |
| ----------------- | -------------- | ------------------------ | ---------------------- |
| `draft`, `active` | none           | —                        | —                      |
| `deprecated`      | `deprecation`  | `reason`, `instructions` | `replacement_skill_id` |
| `archived`        | `archive`      | `reason`                 | `replacement_skill_id` |

```yaml
status: deprecated
deprecation:
  reason: A narrower skill replaces this workflow.
  instructions: Use prepare-focused-change instead.
  replacement_skill_id: prepare-focused-change
```

A `replacement_skill_id` must name a declared skill other than the skill itself,
and that skill must be both `active` and `public`.

Next: apply [visibility and status rules](/guide/skill-graph), see how fields
map into [provider output](/reference/providers), or run the
[CLI](/reference/cli).
