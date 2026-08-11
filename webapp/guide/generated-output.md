# Generated Output

The compiler treats `plugin/**` as source and everything it writes as a build
result. This page explains which paths it owns, what it puts in them, and what
happens to files it finds there that the source does not imply.

## What the compiler owns

<OwnershipMap />

Ownership comes in two kinds, and the difference matters.

The root `skills/` directory is owned as a **complete tree**. The compiler
decides the entire contents. A file you add inside it is reported by `check` as
`unexpected` and removed by the next `compile`:

```text
Output check found 2 drift entries:
- skills/NOTES.md: unexpected
- skills/prepare-change-plan/EXTRA.md: unexpected
```

Each built-in provider owns **exact files** instead. The compiler writes those
specific paths and nothing else, so a provider can never claim an open-ended
directory of yours. Custom adapters are held to the same rule: complete-tree
ownership is rejected for providers.

Every other path in the repository stays outside the write plan. Source code,
tests, documentation, and your own `README.md` are never read or written.

## What a generated skill contains

For each published skill the compiler writes `skills/<skill-id>/SKILL.md`
containing, in order:

1. **Frontmatter** derived from the manifest: `name` is the skill ID and
   `description` is the manifest description. Authored sources must not contain
   frontmatter, so this metadata has exactly one owner.
2. **Your Markdown**, unchanged.
3. **A `## Required skills` section**, one subsection per requirement, with the
   reason, the instructions, and a relative link to the nested copy. Its
   position is the marker, when the source has one, and otherwise directly after
   the title and its introductory paragraphs.

Supporting files that sit next to an authored `SKILL.md` are copied into the
generated skill at the same relative path, so a skill can ship templates,
schemas, or reference documents. `plugin/skills/<skill-id>/skills/` is reserved:
the compiler builds that directory, and an authored one is rejected.

Each required skill is copied into `skills/<skill-id>/skills/`, recursively, so
the dependency exists once in the source and as many times in the output as
there are published skills that need it. [Skill graph](/guide/skill-graph)
covers the rules that decide which skills become roots and what gets nested.

## The generated catalog

`skills/README.md` lists every published skill with its category, description,
lifecycle status, and replacement:

<!-- prettier-ignore -->
```markdown
## Available skills

| Skill                 | Category    | Description                                                    | Status | Replacement |
| --------------------- | ----------- | -------------------------------------------------------------- | ------ | ----------- |
| `prepare-change-plan` | Engineering | Prepare an implementation plan from verified repository facts. | Active | —           |
```

A deprecated skill appears with its migration guidance in the status column, so
the catalog is a truthful index of what the plugin currently offers.

## Host manifests

Every selected provider projects the same validated plugin model into its own
format. They cannot disagree with each other, because none of them is written by
hand. [Providers](/reference/providers) documents each adapter's output.

Provider selection is part of the plan, not a filter applied afterwards. The
compiler owns each built-in manifest path whether or not you selected its
provider, and a path that no selected provider produces must be absent. Removing
`codex` from `providers` therefore deletes `.codex-plugin/plugin.json` on the
next compile rather than leaving a stale manifest behind.

That is also why `compile` reports paths you did not select:

```text
Compilation completed and post-write verification passed.
- .claude-plugin/marketplace.json: changed
- .claude-plugin/plugin.json: changed
- skills: changed
- .codex-plugin/plugin.json: unchanged
- gemini-extension.json: unchanged
- kimi.plugin.json: unchanged
- plugin.json: unchanged
```

`unchanged` there means the path is absent and should stay absent.

## Determinism

The same authored source compiles to the same bytes: skills are emitted in
manifest order, resources and directories in sorted order, and JSON and YAML
through fixed formatters. There is no timestamp, no host path, and no random
identifier in the output.

Two properties follow from that. Writes are idempotent, so compiling twice
changes nothing the second time. And the committed output can be compared with
the source, which is what `plugin-compiler check` does.

## Commit the output

Commit generated files with the source. Users install the plugin from the
repository, so the output has to be there, and committing it is what lets
`check` prove that it is current. Never fix a generated file by hand: change
`plugin/**` and compile again.

## Next steps

- [Continuous integration](/guide/continuous-integration) turns `check` into a
  build gate.
- [Providers](/reference/providers) documents each host manifest.
- [CLI reference](/reference/cli) lists the commands, options, and exit codes.
