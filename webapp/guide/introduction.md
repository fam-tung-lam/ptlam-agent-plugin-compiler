# Introduction

Agent Plugin Compiler turns an authored skill graph into a checked, publishable
plugin layout.

## The problem it solves

A public skill can rely on another skill for context or a required procedure. If
that relationship exists only in prose, an installer may publish the parent
without its dependency. Renames, lifecycle changes, and manual copies can also
leave instructions or host manifests out of sync.

The compiler gives those relationships one explicit source:

- `plugin/plugin.yml` declares plugin metadata, providers, categories, skills,
  visibility, lifecycle status, and dependency edges;
- `plugin/skills/<skill-id>/SKILL.md` contains the authored instructions;
- `skills/**` contains generated, self-contained public skills;
- provider adapters emit the selected host manifests.

## The authoring loop

```text
Initialize → Edit authored source → Validate → Generate → Check → Publish
```

1. `init` creates missing starter paths without replacing existing content.
2. You edit only the authored manifest and skill sources.
3. `validate` checks the manifest, source files, Markdown links, and dependency
   graph without inspecting generated output.
4. `generate` reconciles compiler-owned output and verifies the result from a
   fresh filesystem snapshot.
5. `check` compares current output with the desired plan without writing.

## Authored and generated files stay separate

Treat `plugin/**` as source and compiler-managed output as a build result. Do
not fix a generated skill or provider manifest by hand: update the authored
source and run `generate` again.

The compiler owns the complete root `skills/` tree and exact manifest paths for
the built-in providers. Files outside those declared paths remain outside its
write plan.

## When it is a good fit

Use the compiler when a repository publishes agent skills and needs one or more
of these guarantees:

- dependencies must be visible and validated before publication;
- public skills must include the instructions they require;
- several host manifests must reflect the same plugin metadata;
- generated state must be reproducible in local development and CI.

Next: [install the compiler](/guide/installation), or inspect the
[contract overview](/reference/).
