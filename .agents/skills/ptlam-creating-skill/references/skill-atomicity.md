# Skill Atomicity and Composition

This reference owns the capability tests, the keep-or-split decision, the
self-contained contract, and the rules for composing a foundation with a
specialization.

The model adapts Sascha's
[Complete Guide to Atomic Note-Taking](https://zettelkasten.de/atomicity/guide/),
retrieved on 2026-08-15, from knowledge building blocks to agent capabilities.
The link records attribution only; the local tests below are complete for this
skill.

## What counts as one capability

One capability is the smallest behavior someone would invoke on its own. It has
one responsibility, produces one kind of result, works on one primary artifact
or decision, and passes one standard for being done.

Judge this by behavior, not by file count, tool count, or step count. Internal
files may sit together as long as they only serve that one behavior.

## The six tests

1. **Naming.** Can one action-oriented name identify it?
2. **Result.** Do all branches produce the same kind of result?
3. **Standard.** Do they work on the same primary artifact under one standard
   for being done?
4. **Completeness.** Can the declared inputs and dependencies reach that
   standard?
5. **Independent reuse.** Would another caller invoke one branch on its own, for
   a different responsibility? If yes, split it.
6. **Composition.** Can another skill reuse this without copying its
   instructions?

Several verbs in the name are a warning, not proof. Create, review, and repair
belong together when the artifact, the responsibility, and the standard match.
Capability atomicity does not require one file per independently nameable
subtopic; package layout owns when a file split earns its navigation cost.

## Keep, split, or route

| Evidence                                                                   | Decision                  |
| -------------------------------------------------------------------------- | ------------------------- |
| Branches share one artifact and one standard for being done                | Keep them together.       |
| A branch has its own callers, result, or standard                          | Split it.                 |
| A domain or host adds mechanics to an already complete capability          | Compose a specialization. |
| Remembering several skills is the real problem, and routing has one result | Create a router.          |
| A file serves only this capability                                         | Keep it internal.         |
| Another caller would invoke a file's workflow                              | Promote it to a skill.    |

For each split, name its capability, trigger, output, standard, boundary, and
the edges that join it to the others. Give shared behavior exactly one owner.

## Make the contract self-contained

The package must state its invocation conditions and required inputs, its
ordered actions and branch rules, its outputs and finish conditions, its
authority and side-effect limits, its stop conditions, and the dependencies that
supply what it does not own.

Self-contained does not mean dependency-free. A dependency is valid when the
host loads it, its promises cover what the caller needs, and ownership stays
explicit.

## Compose without duplicating ownership

Before writing or reviewing a foundation-and-specialization pair, map every
concern in scope:

| Concern       | Foundation owns                                 | Specialization adds                     | Link and precedence                                      |
| ------------- | ----------------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Test behavior | Observable behavior and double boundaries       | `blocTest` and Flutter runner mechanics | Specialization points to the foundation; foundation wins |
| Documentation | Public contract and explanatory-comment purpose | Dartdoc syntax and analyzer mechanics   | Specialization points to the foundation; foundation wins |

Classify every specialization rule as one of these:

- an additional domain or host mechanic;
- a stricter domain rule that does not weaken the foundation; or
- a link to the foundation owner.

A paraphrase of a foundation rule is none of the three. Remove it rather than
keeping a local copy for completeness. Report a rule whose owner remains unclear
instead of assigning it silently.

Then confirm that:

1. The foundation stays complete for its own universal responsibility.
2. The specialization owns one domain or host capability, and only that.
3. The foundation owns the shared behavior, vocabulary, and standard.
4. The specialization owns only the stricter or additional mechanics.
5. Both declare load order, inputs, outputs, authority, and conflict precedence.
6. Each references the owner instead of paraphrasing its rules.

Rule 1 passes when all six tests pass, every branch serves the one capability,
every prerequisite is declared, every shared rule has one owner, and the
ownership map contains no unclassified specialization rule.
