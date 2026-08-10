# Authored Plugin Source

The `plugin/` directory is the source of truth. It should contain the manifest
and one source directory for every declared skill.

```text
plugin/
├── plugin.yml
└── skills/
    └── <skill-id>/
        ├── SKILL.md
        └── optional-supporting-files
```

## Manifest responsibilities

`plugin/plugin.yml` owns two kinds of information:

- plugin-wide facts such as name, version, author, links, license, keywords,
  categories, and default providers;
- skill facts such as ID, description, category, visibility, lifecycle status,
  and required skills.

The schema is closed: unknown properties are rejected. Identifiers use lowercase
kebab-case; plugin, category, and skill IDs are limited to 64 characters.

See the [Manifest reference](/reference/manifest) for the complete field
contract.

## Skill source responsibilities

Each manifest skill ID maps to `plugin/skills/<skill-id>/SKILL.md`. Supporting
files may live beside that Markdown source and are copied into generated public
skills when needed.

Write normal Markdown without YAML frontmatter. The compiler generates public
frontmatter from manifest data so metadata has one owner.

## Place dependency instructions deliberately

Use the optional marker where generated required-skill guidance should appear:

```markdown
# Prepare a change plan

Create a focused plan from verified repository facts.

<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->

1. Describe the intended outcome.
2. List the files and verification steps.
```

When the marker is absent, the compiler inserts dependency instructions after
the top-level title and introductory paragraphs, before the next top-level
block. A file without a top-level title receives the instructions first.

## Model dependency intent

Every `required_skills` entry records:

- `skill_id`: the required skill;
- `reason`: why the parent cannot stand alone;
- `instructions`: how the parent should use the required skill.

Dependencies may be nested. Validation rejects missing targets, duplicates,
self-references, cycles, and invalid lifecycle relationships before output is
written.

Next: [compile and inspect the generated result](/guide/quick-start), configure
[advanced visibility and status rules](/guide/advanced-usage), or inspect the
full [Manifest contract](/reference/manifest).
