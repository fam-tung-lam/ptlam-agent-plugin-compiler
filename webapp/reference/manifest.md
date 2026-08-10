# Manifest

The canonical authored manifest is `plugin/plugin.yml`. Schema version `1` is a
closed contract: all required properties must be present and additional
properties are rejected.

## Top-level fields

| Field            | Type               | Rules                                               |
| ---------------- | ------------------ | --------------------------------------------------- |
| `schema_version` | integer            | Must be `1`                                         |
| `providers`      | unique string list | Empty is allowed; IDs use lowercase provider syntax |
| `name`           | identifier         | Lowercase kebab-case, at most 64 characters         |
| `description`    | non-empty string   | Describes the complete plugin                       |
| `version`        | string             | Semantic Versioning                                 |
| `author`         | object             | `name` required; `email` and `url` optional         |
| `homepage`       | non-empty string   | Plugin homepage                                     |
| `repository`     | non-empty string   | Source repository                                   |
| `license`        | non-empty string   | Project license identifier                          |
| `keywords`       | unique string list | At least one item                                   |
| `categories`     | category list      | At least one category                               |
| `skills`         | skill list         | At least one skill                                  |

The schema validates `homepage` and `repository` as non-empty strings. Use full
HTTPS URLs so generated provider manifests are useful to consumers.

## Category

Each category requires:

```yaml
- id: engineering
  name: Engineering
  description: Skills for repository work.
```

Every skill `category_id` must reference a declared category.

## Skill

Every skill requires these fields:

| Field             | Contract                                       |
| ----------------- | ---------------------------------------------- |
| `id`              | Lowercase kebab-case identifier                |
| `description`     | Non-empty public description                   |
| `category_id`     | ID of a declared category                      |
| `visibility`      | `internal` or `public`                         |
| `status`          | `draft`, `active`, `deprecated`, or `archived` |
| `required_skills` | Dependency list; may be empty                  |

Every ID needs a matching `plugin/skills/<id>/SKILL.md` source.

## Required skill

```yaml
required_skills:
  - skill_id: inspect-repository
    reason: The plan must reflect verified repository facts.
    instructions: Inspect the repository and pass the facts forward.
```

`skill_id`, `reason`, and `instructions` are all required. The compiler
validates the complete dependency graph, not just the YAML shape.

## Lifecycle details

A `deprecated` skill must define `deprecation` and cannot define `archive`:

```yaml
status: deprecated
deprecation:
  reason: A narrower skill replaces this workflow.
  instructions: Use prepare-focused-change instead.
  replacement_skill_id: prepare-focused-change
```

`replacement_skill_id` is optional; `reason` and `instructions` are required.

An `archived` skill must define `archive` and cannot define `deprecation`:

```yaml
status: archived
archive:
  reason: The workflow is no longer supported.
  replacement_skill_id: prepare-focused-change
```

Only `reason` is required in an archive block. Draft and active skills define
neither lifecycle detail block.

Next: read the [Authored Plugin Source](/reference/authored-source), configure
[advanced visibility and status rules](/guide/advanced-usage), or see how fields
map into [provider output](/reference/providers).
