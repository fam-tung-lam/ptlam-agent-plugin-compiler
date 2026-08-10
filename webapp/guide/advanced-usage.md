# Advanced Usage

Visibility and lifecycle status let one skill graph serve both reusable building
blocks and a stable public catalog. Configure both fields for every skill in
`plugin/plugin.yml`.

## Visibility

| Value      | Behavior                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `public`   | Eligible for publication as a root skill and still nested inside every public skill that requires it. |
| `internal` | Never published as a root; compiled only inside reachable public skills that depend on it.            |

Use `internal` for shared procedures that should not appear as standalone
install choices. An active internal skill that cannot be reached from any
published root produces a warning because it contributes to no output.

```yaml
skills:
  - id: inspect-repository
    description: Collect verified repository facts.
    category_id: engineering
    visibility: internal
    status: active
    required_skills: []

  - id: prepare-change-plan
    description: Prepare a plan from verified facts.
    category_id: engineering
    visibility: public
    status: active
    required_skills:
      - skill_id: inspect-repository
        reason: The plan must reflect verified facts.
        instructions: Inspect the repository before preparing the plan.
```

## Lifecycle status

| Status       | Root publication and dependency rules                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `draft`      | Not published as a root. Active or deprecated skills cannot depend on it.                                             |
| `active`     | Published as a root when public; the normal state for supported skills.                                               |
| `deprecated` | Published as a root when public, requires deprecation guidance, and emits a warning when another skill depends on it. |
| `archived`   | Not published as a root, requires archive metadata, and cannot be required by a non-archived skill.                   |

Only public `active` and `deprecated` skills become root entries in `skills/**`.
Required skills are still nested according to the validated dependency graph.

## Deprecate a skill

A deprecated skill must explain the migration. A replacement is optional, but
when present it must identify an active public skill.

```yaml
status: deprecated
deprecation:
  reason: A narrower workflow replaces this skill.
  instructions: Use prepare-focused-change instead.
  replacement_skill_id: prepare-focused-change
```

## Archive a skill

An archived skill must record why it is no longer published. A replacement is
optional and follows the same active-public rule.

```yaml
status: archived
archive:
  reason: The workflow is no longer supported.
  replacement_skill_id: prepare-focused-change
```

Validation rejects incompatible lifecycle relationships before any output is
written. Review the complete [Manifest contract](/reference/manifest) for every
field and the [Authored Plugin Source](/reference/authored-source) for source
layout and dependency markers.
