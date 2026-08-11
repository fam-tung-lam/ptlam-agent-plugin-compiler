# Introduction

Agent Plugin Compiler is the build step that Markdown agent skills never had.
You author one manifest and one Markdown file per skill. One command validates
the dependency graph between those skills and generates self-contained skills
plus an exact plugin manifest for every agent host you target.

This page explains why that build step exists and what it guarantees. To run it
against a real plugin instead, start with the [Quick Start](/guide/quick-start).

## The problem

An agent skill is a directory with a Markdown file in it. That is the whole
format. There is no place to record what a skill depends on, nothing that
resolves a reference, and no build step that fails when a reference goes stale.

Take a plugin with two skills, where `skill-a` cannot produce a correct result
unless `skill-b` runs first:

```text
skills/
├── skill-a/
│   └── SKILL.md   ← names skill-b, in prose
└── skill-b/
    └── SKILL.md
```

The dependency exists only as sentences inside `skill-a/SKILL.md`:

```markdown
# Skill A

Summarize the release.

Run `skill-b` first to collect the commit facts, because the summary must not
invent them. Pass the table it returns into step 2 unchanged. Its input format
is described in [skill-b](../skill-b/SKILL.md).

1. Read the milestone.
2. Group the commit facts by area.
```

Four separate facts are now hard-coded in that paragraph: the other skill's
name, the reason it is required, how to call it, and where it lives. Nothing
checks any of them, and the same paragraph is copied into every other skill with
the same dependency.

### What breaks for the plugin author

Rename `skill-b` to `collect-commit-facts`. The prose in `skill-a` is now wrong.
Nothing fails: not the editor, not the tests, not the publish step. The plugin
ships, and the agent follows an instruction that points at a skill that does not
exist. Retiring `skill-b`, changing what it returns, or forgetting one of the
four copies of the paragraph produces the same silent result.

### What breaks for the person installing the skill

Installers show a flat catalog. Someone browsing it sees `skill-a` and `skill-b`
as two independent choices, installs `skill-a` alone, and gets a skill whose
first instruction refers to something they do not have. Nothing warned them,
because nothing in the directory records that `skill-a` is incomplete on its
own.

### Why care is not a fix

In a programming language none of this survives to release: the module system
resolves the import, the compiler rejects the missing symbol, and the linter
flags the dead reference. A directory of Markdown files has none of those
guarantees. Over the life of a plugin, neither a person nor an agent keeps every
hand-written cross-reference synchronized.

## The solution

You declare each skill once in `plugin/plugin.yml` — its description, its
visibility, its lifecycle status, and the skills it requires — and write plain
Markdown in `plugin/skills/<skill-id>/SKILL.md`. Everything a reader or a host
sees is generated from that declaration.

Each failure above has its own answer.

### Declared dependencies replace hand-written references

A hard-coded reference goes stale because nothing owns it. In the manifest, a
dependency is data: the required skill's ID, why the parent needs it, and how
the parent should use it.

```yaml
- id: skill-a
  description: Summarize the release.
  category_id: example
  visibility: public
  status: active
  required_skills:
    - skill_id: skill-b
      reason: The summary must not invent commit facts.
      instructions: Run skill-b first and pass its table into step 2 unchanged.
```

The authored `skill-a/SKILL.md` no longer mentions `skill-b` at all. The
compiler writes the required-skills section, the link, and the frontmatter into
the generated skill. Rename `skill-b` and every dependent skill is rewritten on
the next compile. Remove it and validation fails with the exact manifest
location instead of publishing a dangling reference.

### Required skills are nested, so an installed skill is complete

Whatever a public skill requires is copied inside it, recursively. A user who
installs one skill receives everything that skill needs, without having to know
the dependency existed.

<SkillGraphTransform />

`inspect-repository` is declared once and compiled into the one skill that
requires it. `write-commit-message` declares no requirements, so nothing is
nested inside it. There is no second place to keep in sync, and no way to
install half of a skill.

### Visibility decides what users can install

Some skills are products; others are building blocks that only make sense inside
another skill. `visibility` records that difference. A `public` skill is
published as a root skill users can install. An `internal` skill is never
published as a root and exists only inside the skills that require it.

### Lifecycle status decides what is published over time

Skills are written before they are ready, get replaced, and are eventually
retired. `status` records that stage, and validation enforces it: an active
skill cannot require a draft skill, requiring a deprecated skill raises a
warning, and a non-archived skill cannot require an archived one.

Together, the two fields decide what compiling produces:

<PublicationMatrix />

A deprecated skill must carry migration instructions, and an archived skill must
say why it was retired, so the reason a skill is going away lives with the
skill. The [Skill graph](/guide/skill-graph) page covers both fields in detail.

### One authored source produces every host manifest

Each agent host wants its own manifest file, with its own field names, in its
own location. Maintaining five by hand means five chances to publish a stale
version, description, or skill list. The compiler projects one validated plugin
model into every selected host manifest, so they cannot disagree with each other
or with the skills you shipped.

### Output is deterministic, so CI can verify it

The same authored source always compiles to the same bytes. Because the compiler
declares exactly which paths it owns — the whole `skills/` tree, and one exact
file per host manifest — it can also compare the committed output with what the
source implies. `plugin-compiler check` writes nothing, reports every path that
drifted, and exits non-zero, which makes stale generated output a failing build
instead of a surprise for users. See [Generated output](/guide/generated-output)
and [Continuous integration](/guide/continuous-integration).

## Supported hosts

| Host                 | Provider ID | Generated manifests                                             |
| -------------------- | ----------- | --------------------------------------------------------------- |
| Claude plugin        | `claude`    | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| Codex plugin         | `codex`     | `.codex-plugin/plugin.json`                                     |
| GitHub Copilot CLI   | `copilot`   | `plugin.json`                                                   |
| Gemini CLI extension | `gemini`    | `gemini-extension.json`                                         |
| Kimi Code CLI plugin | `kimi`      | `kimi.plugin.json`                                              |

Select any combination in `plugin/plugin.yml`, or override the selection for a
single run. The shared `skills/**` tree is generated either way, so a plugin
that targets no host manifest still gets self-contained skills. Node.js callers
can register an adapter for a host the compiler does not ship. See
[Providers](/reference/providers).

## When to use it

The compiler is worth adding when a repository publishes agent skills and needs
at least one of these guarantees:

- a skill's dependencies are validated before publication, not after a bug
  report;
- an installed skill contains every instruction it depends on;
- several host manifests always describe the same plugin;
- generated state is reproducible locally and verifiable in CI.

A single skill with no dependencies and one target host does not need a build
step. The cost of the compiler is a manifest; the return is everything above.

## Next steps

- [Quick Start](/guide/quick-start) compiles a working plugin from an empty
  directory, with every file and command on one page.
- [Skill graph](/guide/skill-graph) covers dependencies, visibility, and
  lifecycle status in depth.
- [Generated output](/guide/generated-output) explains what the compiler owns
  and what it writes.
- [Continuous integration](/guide/continuous-integration) turns verification
  into a build gate.
