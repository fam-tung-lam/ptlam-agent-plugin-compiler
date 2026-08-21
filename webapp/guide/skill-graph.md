# Skill Graph

Three manifest fields decide what the compiler produces from a skill:
`required_skills` records what it depends on, `visibility` records whether users
can install it, and `status` records where it is in its lifecycle. This page
covers all three and the rules validation enforces between them.

## Declare a dependency

A dependency is data, not prose. Each entry in `required_skills` records the
required skill, why the parent cannot stand alone, and how the parent should use
it:

```yaml
- id: prepare-change-plan
  description: Prepare an implementation plan from verified repository facts.
  category_id: engineering
  visibility: public
  status: active
  required_skills:
    - skill_id: inspect-repository
      reason: A plan must reflect the repository's actual structure.
      instructions: Inspect the repository first and pass the facts forward.
```

All three fields are required. The authored
`plugin/skills/prepare-change-plan/SKILL.md` does not mention
`inspect-repository` at all; the compiler writes the dependency section into the
generated skill from this declaration.

`plugin/plugin.yml` is the sole authored owner of the dependency contract.
Authored `SKILL.md` files and Markdown below `references/` must not repeat a
declared required-skill ID; the generated top-level required-skills block is the
only dependency contract in a compiled skill package.

Dependencies may be nested: a required skill can require further skills, and the
compiler follows the chain.

## What the compiler generates from it

Each requirement becomes one subsection of a generated `## Required skills`
section, followed by a relative link to the nested copy:

<!-- prettier-ignore -->
```markdown
## Required skills

### `inspect-repository`

**Reason:** A plan must reflect the repository's actual structure.

**Instructions:** Inspect the repository first and pass the facts forward.

Read [inspect-repository](skills/inspect-repository/SKILL.md).
```

By default the section is inserted after the title and its introductory
paragraphs. Place it yourself with the optional marker:

```markdown
# Prepare a change plan

Create a focused implementation plan from verified repository facts.

<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->

1. State the intended outcome and constraints.
```

The marker is removed when the skill has no requirements, so leaving it in place
is harmless.

## The catalog makes the graph visible

Every compile renders the published dependency graph into `skills/README.md` as
GitHub-compatible Mermaid. It includes every installable root, reachable
internal dependency, and isolated root, so a reviewer can see the shipped skill
architecture without reconstructing it from YAML.

Category subgraphs organize the nodes. Arrows point from each dependent skill to
what it requires, node labels show lifecycle status and visibility, and styles
distinguish public, internal, and deprecated skills. Draft, archived, and
unreachable internal skills stay out because they are not part of the published
package. The catalog table appears directly after the graph, keeping the skill
architecture visible before its installable-skill details.

## Visibility

`visibility` decides whether a skill is something users install or a building
block that only exists inside other skills.

| Value      | Effect                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `public`   | Eligible to be published as a root skill, and still nested inside every skill that requires it. |
| `internal` | Never published as a root; compiled only inside the published skills that require it.           |

Required skills are copied into their dependents recursively, so an installed
skill always carries everything it needs. Visibility only decides whether the
dependency is _also_ published on its own.

With `inspect-repository` as `internal`:

```text
skills/
├── README.md
└── prepare-change-plan/
    ├── SKILL.md
    └── skills/
        └── inspect-repository/
            └── SKILL.md
```

With `inspect-repository` as `public`:

```text
skills/
├── README.md
├── inspect-repository/
│   └── SKILL.md
└── prepare-change-plan/
    ├── SKILL.md
    └── skills/
        └── inspect-repository/
            └── SKILL.md
```

An active internal skill that no published skill can reach produces a warning,
because it contributes nothing to the output.

## Lifecycle status

`status` records where a skill is in its life. It decides whether the skill is
compiled at all, and which other skills are allowed to depend on it.

| Status       | Publication and dependency rules                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `draft`      | Never compiled. Active and deprecated skills cannot require it.                                      |
| `active`     | The normal state. Compiled as a root skill when public.                                              |
| `deprecated` | Still compiled, requires deprecation guidance, and warns when another skill requires it.             |
| `archived`   | Never compiled, requires archive metadata, and only another archived skill is allowed to require it. |

Combined with visibility, that gives four outcomes:

<PublicationMatrix />

### Deprecate a skill

A deprecated skill stays published so existing users are not cut off, and it
must explain how to move on. The generated catalog carries that guidance.

```yaml
status: deprecated
deprecation:
  reason: A narrower workflow replaces this skill.
  instructions: Use prepare-focused-change instead.
  replacement_skill_id: prepare-focused-change
```

`reason` and `instructions` are required. `replacement_skill_id` is optional,
and when present it must name a skill that is both `active` and `public`.

### Archive a skill

An archived skill is no longer compiled. The manifest keeps the record of why it
was retired.

```yaml
status: archived
archive:
  reason: The workflow is no longer supported.
  replacement_skill_id: prepare-focused-change
```

Only `reason` is required. The same replacement rule applies.

A `draft` or `active` skill declares neither block. Declaring `deprecation` on a
skill that is not deprecated, or `archive` on a skill that is not archived, is
rejected by the schema.

## What validation rejects

`plugin-compiler validate` fails, before anything is written, when:

- a `skill_id` names a skill that is not declared;
- the same skill is required twice by the same parent;
- a skill requires itself;
- requirements form a cycle;
- an authored `SKILL.md` or nested Markdown reference repeats that skill's exact
  declared required-skill ID;
- a skill references a category that is not declared;
- two skills or two categories share an ID;
- an active or deprecated skill requires a `draft` skill;
- a skill that is not archived requires an `archived` skill;
- a replacement skill is unknown, is the skill itself, or is not active and
  public.

Two situations produce warnings instead, so compilation continues:

- a skill requires a `deprecated` skill;
- an active internal skill is unreachable from every published skill.

Each diagnostic names the manifest location, for example
`plugin/plugin.yml#/skills/0/required_skills/0/skill_id`.

## Next steps

- [Generated output](/guide/generated-output) shows what the compiler writes and
  which paths it owns.
- [Manifest reference](/reference/manifest) documents the source layout and
  every field's exact contract.
