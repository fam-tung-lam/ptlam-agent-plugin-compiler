# Skill Package Layout

This reference owns what each package surface holds, how long a file may be, and
when detail leaves `SKILL.md`. The target host's own layout rules outrank this
file.

## What each surface owns

| Surface       | Owns                                                                |
| ------------- | ------------------------------------------------------------------- |
| `SKILL.md`    | The outcome, the scope, the whole normal path, and the pointers out |
| Host metadata | Discovery and interface fields                                      |
| `references/` | Conditional rules, schemas, and long examples                       |
| `scripts/`    | Deterministic operations that repeat                                |
| `assets/`     | Templates and files the produced output consumes                    |

Create a directory only when something concrete will live in it. Changelogs and
maintainer process notes belong outside the package. Setup or access guidance a
workflow needs follows the ownership rule below. Behavior another skill would
invoke on its own belongs in its own skill.

## Keep related guidance together until splitting pays off

Related rules that serve one workflow stay together while the file remains
readable. An `and` title or an independently nameable paragraph is a warning,
not a command to create another file.

| Evidence                                                                 | Decision                                   |
| ------------------------------------------------------------------------ | ------------------------------------------ |
| Same workflow owner, related rules, and comfortable reading length       | Keep together                              |
| Same owner and fragments too small to justify separate routing           | Merge                                      |
| A subsection has its own conditional consumer or owner                   | Split                                      |
| Another workflow reuses a subsection without the surrounding rules       | Split or promote one owner                 |
| Separation prevents irrelevant loading or duplicated maintenance         | Split                                      |
| Headings no longer reveal a readable path, or the file exceeds its limit | Split by workflow responsibility or delete |
| The only benefit is conceptual purity while navigation increases         | Keep together                              |

Keep each file at or under 100 physical lines, excluding table rows and complete
fenced blocks. The limit is a ceiling and review signal, not a target. Staying
below it does not justify a split; crossing it identifies a readability problem
but does not excuse an arbitrary boundary. Never compress prose to fit; see
[cut instead of compressing](writing-for-maintainers.md#cut-instead-of-compressing).

| Example                                                                                                 | Decision                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Short public-documentation and explanatory-comment rules serve one code-documentation workflow          | Keep `documentation.md` together     |
| Double selection, tool resolution, placement, and safeguards remain readable under one testing workflow | Keep `test-doubles.md` together      |
| A long reference contains setup and publishing branches loaded under different conditions               | Split by those conditional workflows |

`SKILL.md` keeps the outcome, boundary, whole normal path, shared rules, and
each step's finish condition. Move a conditional workflow behind one pointer to
the reference that owns it. Use a routing reference only for a large catalog of
mutually exclusive options.

Keep a concept's definition, rules, examples, and caveats together. Open a
reference with what it owns; keep its read condition at the `SKILL.md` pointer.
Every rule stays one hop from `SKILL.md`, and every condition is written once.

## Place resource guidance with its workflow

A resource list is not a responsibility. Give setup or access, use, procedures
or commands, links, and caveats to the surface that owns the related workflow.

| Resource's reach                                                   | Owner                     |
| ------------------------------------------------------------------ | ------------------------- |
| Every branch uses it, or no conditional workflow reference owns it | `SKILL.md`                |
| One conditional workflow uses it                                   | That workflow's reference |

Do not create a generic `tools.md`, `toolchain.md`, `dependencies.md`, or
`sources.md` solely to catalog resources. A shared resource section in
`SKILL.md` is legitimate when it serves the whole normal path. Give each rule
one owner, and link to that owner anywhere else the resource appears.

| Example                                            | Owner                  |
| -------------------------------------------------- | ---------------------- |
| Interview recorder used only during field research | `field-research.md`    |
| Legal database used only to verify citations       | `citation-checking.md` |
| Rendering tool used only to publish a report       | `publishing.md`        |
| Workspace used throughout the skill                | `SKILL.md`             |

For time-sensitive guidance, keep the required procedure local. An external link
may identify the current authoritative source, but the workflow must remain
executable without opening it. Name a concrete staleness signal, such as changed
access requirements, a revised policy or version, or a procedure that no longer
succeeds. Apply [self-contained documentation](self-contained-documentation.md)
to every external link.

## Name it after what it does

Follow the target schema first. Otherwise use a short action-oriented name in
lowercase letters, digits, and hyphens, under 64 characters, matching the
directory name. Avoid `helper`, `misc`, `utils`, and `notes`.

A model-facing description is a pointer, not a summary. State the capability,
then one trigger per branch, then a reach clause if another skill composes this
one. Drop any trigger that only renames a branch, and any prohibition that
protects nothing.

## Bundle a script only when it removes real risk

Bundle a script when deterministic execution beats re-deriving the steps each
time. Document its inputs, outputs, dependencies, exit behavior, and recovery.
Keep the reasoning in the instructions, not in the script.

Put templates and media the output consumes in `assets/`. Put conditional rules,
schemas, and long examples in `references/`.
