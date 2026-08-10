# Quick Start

This workflow creates an immediately valid authored plugin, then replaces the
starter values with your own.

## 1. Initialize the source

Run this command from the plugin repository root:

```bash
npm exec -- plugin-compiler init
```

The command creates only missing paths:

```text
plugin/
├── plugin.yml
└── skills/
    ├── inspect-repository/
    │   └── SKILL.md
    ├── prepare-change-plan/
    │   └── SKILL.md
    └── write-commit-message/
        └── SKILL.md
```

Running `init` again leaves existing manifest and skill content unchanged.

## 2. Replace the starter values

Open `plugin/plugin.yml` and replace its `TODO` values. Choose the providers to
compile by default:

```yaml
schema_version: 1

providers:
  - claude
  - codex

name: planning-skills
description: Skills for planning verified repository changes.
version: "1.0.0"

author:
  name: Example Maintainer

homepage: https://github.com/example/planning-skills
repository: https://github.com/example/planning-skills
license: MIT

keywords:
  - agent
  - planning

categories:
  - id: engineering
    name: Engineering
    description: Skills for repository work.

skills:
  - id: inspect-repository
    description: Inspect a repository and collect verified facts.
    category_id: engineering
    visibility: internal
    status: active
    required_skills: []

  - id: prepare-change-plan
    description: Prepare a change plan from verified facts.
    category_id: engineering
    visibility: public
    status: active
    required_skills:
      - skill_id: inspect-repository
        reason: The plan must reflect the repository structure.
        instructions: Inspect the repository and pass the facts forward.
```

Every declared skill needs a matching `plugin/skills/<skill-id>/SKILL.md` file.
Do not add YAML frontmatter; the compiler creates generated frontmatter from the
manifest.

## 3. Validate before writing

```bash
npm exec -- plugin-compiler validate
```

Validation checks the complete authored source and reports all recoverable
source diagnostics together.

## 4. Compile and verify

```bash
npm exec -- plugin-compiler compile
```

The compiler writes the shared `skills/` tree and the provider manifests
selected by `plugin/plugin.yml`, then verifies the new state.

## 5. Detect later drift

```bash
npm exec -- plugin-compiler check
```

`check` is read-only. It exits successfully when every managed output matches
the authored source and fails with path-level drift when it does not.

Next: learn the [authored source rules](/guide/authored-source) and the
[generated ownership model](/guide/generated-output).
