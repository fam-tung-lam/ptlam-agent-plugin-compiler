# Quick Start

This page starts with a repository that has no plugin in it and ends with
compiled, verified output: a self-contained skill under `skills/` and a Claude
plugin manifest. Every file and command you need is on this page.

## Before you start

- Node.js 22.6 or newer. Check with `node --version`.
- A repository that will own the plugin. Any npm project works.
- The compiler installed as the exact npm dependency from
  [Installation](/guide/installation). This walkthrough uses `npm exec` so the
  local and CI commands resolve the same compiler version.

## 1. Create the authored source

Everything you edit lives under `plugin/`. Create three files:

```text
plugin/
├── plugin.yml
└── skills/
    ├── inspect-repository/
    │   └── SKILL.md
    └── prepare-change-plan/
        └── SKILL.md
```

`plugin/plugin.yml` declares the plugin and every skill in it. This manifest has
two skills: an internal building block, and a public skill that requires it.

```yaml
schema_version: 1

providers:
  - claude

name: example-agent-plugin
description: Skills that plan repository changes from verified facts.
version: "0.1.0"

author:
  name: Your Name

homepage: https://github.com/you/example-agent-plugin
repository: https://github.com/you/example-agent-plugin
license: MIT

keywords:
  - agent
  - skills

categories:
  - id: engineering
    name: Engineering
    description: Skills for repository work.

skills:
  - id: inspect-repository
    description: Collect verified facts about a repository.
    category_id: engineering
    visibility: internal
    status: active
    required_skills: []

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

Every field above is required. Identifiers are lowercase kebab-case, `version`
must be quoted so YAML keeps it a string, and each skill `id` must have a
matching source directory.

`plugin/skills/inspect-repository/SKILL.md` holds the building block:

```markdown
# Inspect repository

Collect the facts another skill needs before it plans a change.

1. List the files and modules the change touches.
2. Record the conventions those files already follow.
```

`plugin/skills/prepare-change-plan/SKILL.md` holds the public skill. Note that
it never mentions `inspect-repository`. The dependency is declared in the
manifest, and the compiler writes the instructions for it:

```markdown
# Prepare a change plan

Create a focused implementation plan from verified repository facts.

1. State the intended outcome and constraints.
2. Order the implementation and verification steps.
```

Write plain Markdown with no YAML frontmatter. The compiler generates
frontmatter from the manifest so the metadata has one owner.

::: tip Start from a scaffold instead

`npm exec -- plugin-compiler init` writes a fully commented, schema-valid
`plugin/plugin.yml` plus matching `SKILL.md` sources for three example skills.
It only creates missing paths, so running it in an existing project is safe.

:::

## 2. Validate the source

Run every command from the repository root:

```bash
npm exec -- plugin-compiler validate
```

```text
Scope: /path/to/example-agent-plugin; providers: claude; provider source: manifest.
Validated example-agent-plugin@0.1.0: 2 skills in 1 category.
```

`validate` reads `plugin/**` and nothing else. It checks the manifest against
the schema, confirms every declared skill has a source file, and validates the
dependency graph: unknown, duplicate, self-referencing, and circular
dependencies all fail here, before anything is written.

If you rename `inspect-repository` in the manifest without updating the
requirement, `validate` exits `1` and names the exact location:

```text
Command failed: Plugin validation failed with 1 error:
- plugin/plugin.yml#/skills/0/required_skills/0/skill_id: skill "prepare-change-plan" references unknown skill "inspect-repository"
```

## 3. Compile

```bash
npm exec -- plugin-compiler compile
```

```text
Scope: /path/to/example-agent-plugin; providers: claude; provider source: manifest.
Compilation completed and post-write verification passed.
- .claude-plugin/marketplace.json: changed
- .claude-plugin/plugin.json: changed
- skills: changed
- .codex-plugin/plugin.json: unchanged
- gemini-extension.json: unchanged
- kimi.plugin.json: unchanged
- plugin.json: unchanged
```

`compile` validates the source again, writes the complete plan, then re-reads
the result from disk and verifies it matches. The report lists every path the
compiler manages, including the manifests of providers you did not select: the
compiler owns those paths either way, and keeping them absent is part of the
plan.

## 4. Read the generated output

The repository now contains generated files next to your source:

```text
skills/
├── README.md
└── prepare-change-plan/
    ├── SKILL.md
    └── skills/
        └── inspect-repository/
            └── SKILL.md
.claude-plugin/
├── marketplace.json
└── plugin.json
```

`inspect-repository` is internal, so it never becomes a skill of its own. It is
copied inside `prepare-change-plan`, which makes that skill complete for anyone
who installs it.

`skills/prepare-change-plan/SKILL.md` is your Markdown plus everything the
compiler derived from the manifest:

<!-- prettier-ignore -->
```markdown
---
name: prepare-change-plan
description: Prepare an implementation plan from verified repository facts.
---

# Prepare a change plan

Create a focused implementation plan from verified repository facts.

## Required skills

### `inspect-repository`

**Reason:** A plan must reflect the repository's actual structure.

**Instructions:** Inspect the repository first and pass the facts forward.

Read [inspect-repository](skills/inspect-repository/SKILL.md).

1. State the intended outcome and constraints.
2. Order the implementation and verification steps.
```

`skills/README.md` is the generated catalog of installable skills:

<!-- prettier-ignore -->
```markdown
## Available skills

| Skill                 | Category    | Description                                                    | Status | Replacement |
| --------------------- | ----------- | -------------------------------------------------------------- | ------ | ----------- |
| `prepare-change-plan` | Engineering | Prepare an implementation plan from verified repository facts. | Active | —           |
```

`.claude-plugin/plugin.json` is the host manifest, projected from the same
validated model:

<!-- prettier-ignore -->
```json
{
  "name": "example-agent-plugin",
  "version": "0.1.0",
  "description": "Skills that plan repository changes from verified facts.",
  "author": {
    "name": "Your Name"
  },
  "homepage": "https://github.com/you/example-agent-plugin",
  "repository": "https://github.com/you/example-agent-plugin",
  "license": "MIT",
  "keywords": [
    "agent",
    "skills"
  ],
  "skills": [
    "./skills/prepare-change-plan"
  ]
}
```

These files are build results. Edit `plugin/**` and compile again instead of
patching them by hand.

## 5. Target other hosts

Without an option, `compile` uses the `providers` list in `plugin/plugin.yml`.
Replace that list for one run with a comma-separated selection:

```bash
npm exec -- plugin-compiler compile --provider claude,codex
```

Compile the shared `skills/` tree without any host manifest:

```bash
npm exec -- plugin-compiler compile --no-providers
```

The two options are mutually exclusive. Because the compiler owns each built-in
manifest path, narrowing the selection removes the manifests you dropped instead
of leaving stale files behind.

| Provider  | Managed manifest paths                                          |
| --------- | --------------------------------------------------------------- |
| `claude`  | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| `codex`   | `.codex-plugin/plugin.json`                                     |
| `copilot` | `plugin.json`                                                   |
| `gemini`  | `gemini-extension.json`                                         |
| `kimi`    | `kimi.plugin.json`                                              |

## 6. Verify instead of trusting

Commit the generated files, then prove they still match the source:

```bash
npm exec -- plugin-compiler check
```

```text
Scope: /path/to/example-agent-plugin; providers: claude; provider source: manifest.
Output check passed.
```

`check` writes nothing. When a generated file no longer matches the source it
names every path that drifted and exits `1`:

```text
Output check found 1 drift entry:
- skills/prepare-change-plan/SKILL.md: content-differs
```

That exit code is what turns stale output into a failing build. See
[Continuous integration](/guide/continuous-integration).

## Next steps

- [Skill graph](/guide/skill-graph) covers dependencies, visibility, and
  lifecycle status in depth.
- [Generated output](/guide/generated-output) explains exactly which paths the
  compiler owns.
- [Manifest reference](/reference/manifest) documents every `plugin.yml` field.
- [CLI reference](/reference/cli) lists every command, option, and exit code.
- [Programmatic usage](/guide/programmatic-usage) runs the same pipeline from
  Node.js.
