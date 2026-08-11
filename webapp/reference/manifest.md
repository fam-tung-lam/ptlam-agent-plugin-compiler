# Manifest

`plugin/plugin.yml` is the authored source of truth. Schema version `1` is a
closed contract: every required property must be present, and unknown properties
are rejected.

## Where it lives

The manifest sits at the root of the `plugin/` directory, beside one source
directory per declared skill:

```text
plugin/
├── plugin.yml
└── skills/
    └── <skill-id>/
        ├── SKILL.md
        └── optional-supporting-files
```

Every skill `id` in the manifest needs a matching
`plugin/skills/<skill-id>/SKILL.md`. Supporting files may sit beside that
Markdown source. `plugin/skills/<skill-id>/skills/` is reserved for the
compiler, and an authored one is rejected. See
[Generated output](/guide/generated-output) for what compiling produces from
these files.

## Identifiers

`name`, every category `id`, every skill `id`, and every reference to them
(`category_id`, `skill_id`, `replacement_skill_id`) share one identifier type:
lowercase kebab-case matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`, at most 64
characters. Underscores and uppercase letters are rejected.

## Top-level fields

| Field            | Type               | Rules                                           |
| ---------------- | ------------------ | ----------------------------------------------- |
| `schema_version` | integer            | Must be `1`                                     |
| `providers`      | unique string list | Empty is allowed; IDs match `^[a-z][a-z0-9-]*$` |
| `name`           | identifier         | Lowercase kebab-case, at most 64 characters     |
| `description`    | non-empty string   | Describes the complete plugin                   |
| `version`        | string             | Semantic Versioning                             |
| `author`         | object             | `name` required; `email` and `url` optional     |
| `homepage`       | non-empty string   | Plugin homepage                                 |
| `repository`     | non-empty string   | Source repository                               |
| `license`        | non-empty string   | Project license identifier                      |
| `keywords`       | unique string list | At least one item                               |
| `categories`     | category list      | At least one category                           |
| `skills`         | skill list         | At least one skill                              |

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

## Skill

| Field             | Contract                                       |
| ----------------- | ---------------------------------------------- |
| `id`              | Identifier; needs a matching `SKILL.md` source |
| `description`     | Non-empty public description                   |
| `category_id`     | ID of a declared category                      |
| `visibility`      | `internal` or `public`                         |
| `status`          | `draft`, `active`, `deprecated`, or `archived` |
| `required_skills` | Dependency list; may be empty                  |

All six are required. `deprecation` and `archive` are the only optional
properties, and each is allowed for exactly one status.

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
