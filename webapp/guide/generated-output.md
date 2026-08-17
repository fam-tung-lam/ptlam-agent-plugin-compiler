# Generated Output

The compiler treats `plugin/**` as source and everything it writes as a build
result. This page explains which paths it owns, what it puts in them, and what
happens to files it finds there that the source does not imply.

## What the compiler owns

<OwnershipMap />

Ownership comes in two kinds, and the difference matters.

The root `skills/` directory is owned as a **complete tree**. When a schema-v2
plugin has effective hooks for at least one selected provider, `hooks/handlers/`
is a second complete tree. Hook-free plugins and selections with no compatible
hook events claim no shared hook paths. The compiler decides the entire contents
of each owned tree. A file you add inside one is reported by `check` as
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

## Generated hooks

The authored `plugin/hooks/` tree is copied once to `hooks/handlers/`, including
handler-adjacent internal resources. The compiler also writes
`hooks/handlers/.runtime/portable-hook-dispatcher.mjs`. Compatible provider
configurations point at these shared files; handlers are not duplicated per
provider.

Native hook configuration remains exact-file-owned by the corresponding adapter.
`check` reports content or missing-file drift in both the shared handler tree
and provider-native configuration. Removing every v2 hook makes native config
files desired absent and stops claiming the shared handler tree; any prior
handler files become unowned rather than being deleted. A selected adapter
without compatible hook events receives a structured skip; its ordinary manifest
and the shared skills still compile, but no handler resources or empty hook
directories are emitted for that selection.

No fallback skill, `AGENTS.md`, equivalent instruction file, or first-class
policy output is generated.

## What a generated skill contains

For each published skill the compiler writes `skills/<skill-id>/SKILL.md`
containing, in order:

1. **Frontmatter** derived from the manifest: `name` is the skill ID,
   `description` is the manifest description, and an enabled schema-v2
   `disable_model_invocation` becomes `disable-model-invocation: true`. Authored
   sources must not contain frontmatter, so this metadata has exactly one owner.
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
visibility, lifecycle status, and replacement:

<!-- prettier-ignore -->
```markdown
## Available skills

| Skill                 | Category    | Description                                                    | Visibility | Status | Replacement |
| --------------------- | ----------- | -------------------------------------------------------------- | ---------- | ------ | ----------- |
| `prepare-change-plan` | Engineering | Prepare an implementation plan from verified repository facts. | public     | Active | —           |
```

A deprecated skill appears with its migration guidance in the status column, so
the catalog is a truthful index of what the plugin currently offers.

The catalog follows the table with a GitHub-renderable Mermaid dependency graph.
It includes every published root, every transitive required skill that can be
reached from those roots, and isolated roots that have no dependencies. Each
arrow points from a dependent skill to the skill it requires. Node labels and
styles distinguish public roots, internal dependencies, and deprecated skills.
Draft, archived, and unreachable internal skills stay out of the graph because
they are not part of the published package.

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
- hooks/claude-hooks.json: unchanged
- hooks/codex-hooks.json: unchanged
- hooks/copilot-hooks.json: unchanged
- hooks/handlers: unchanged
- hooks/hooks.json: unchanged
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
