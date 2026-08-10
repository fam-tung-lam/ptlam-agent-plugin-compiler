# Resolve Project Testing Context

Use this workflow for every project-tied testing task. The skill's installation
location is irrelevant. Store durable project-specific testing knowledge in one
file:

```text
<project-root>/.ptlam-agent-plugin/skills/engineering/ptlam-testing/CONTEXT.md
```

This file is ordinary project data used by the installed skill, not a
project-local copy of the skill. Its path follows the skill's catalog category.

## Contents

- [Resolve the project root](#resolve-the-project-root)
- [Load or create the context](#load-or-create-the-context)
- [Keep one file with three kinds of information](#keep-one-file-with-three-kinds-of-information)
- [Handle earlier layouts](#handle-earlier-layouts)
- [Verify freshness and preserve repository policy](#verify-freshness-and-preserve-repository-policy)
- [Feed the task and report](#feed-the-task-and-report)

## Resolve the project root

1. Prefer explicit paths, files, workspace selections, and repository evidence
   supplied by the task.
2. When working inside a project, walk upward to the relevant Git or build
   workspace root. Do not stop at an arbitrary package directory when the task
   is governed by a higher workspace root.
3. When the current working directory is above one or more projects, inspect
   only explicit task paths and a bounded set of nearby candidate roots. Never
   recursively scan the entire home directory to discover projects.
4. If multiple roots remain plausible and the choice would change the result,
   ask the user which project is in scope.
5. Keep `CONTEXT.md` files for multiple projects separate, even when one agent
   session works above or across them. Never merge their testing knowledge.
6. Disclose any candidate root that cannot be inspected because it is outside
   the available filesystem or sandbox scope.

Complete this step when every project in scope has one resolved root or one
explicitly reported unresolved root.

## Load or create the context

- Load the canonical `CONTEXT.md` when it exists. Treat repository instructions,
  manifests, lockfiles, build and test configuration, CI, and existing tests as
  the source of truth. `CONTEXT.md` is a verified cache of durable facts and
  preferences, not authority over current repository evidence.
- In audit mode, do not create or update `CONTEXT.md`. Report suggested changes
  with the audit findings.
- In write, fix, or explicit TDD mode, create `CONTEXT.md` only after analysis
  establishes at least one durable project-specific fact or preference. Update
  it only when the task establishes material new or changed durable knowledge.
- Preserve unknown fields. Do not destructively rewrite an unsupported schema;
  report the migration needed before changing it.

Use compact identity and freshness frontmatter:

```yaml
---
schema_version: 1
skill: ptlam-testing
canonical_path: skills/engineering/ptlam-testing
updated_at: YYYY-MM-DD
---
```

Complete this step when the current file state and mode permit a clear
read-only, create, or update path.

## Keep one file with three kinds of information

Use sections inside `CONTEXT.md`; do not create sibling profile, preference,
context, research, or decision files.

Use this compact shape. Keep `Project profile` when the file exists; omit the
other sections when they have no content:

```markdown
# Project Testing Context

## Project profile

## Project testing contexts

### <stable capability or environment>

## Testing preferences
```

### Project profile

Record only testing-relevant durable project facts:

- relative project and package boundaries;
- languages, frameworks, runtimes, and supported platforms;
- repository testing policy and authoritative configuration entry points; and
- evidence plus freshness or invalidation signals.

### Project testing contexts

Create one subsection per independently testable execution environment or
capability. Split contexts only when one or more of these materially differ:

- execution environment or target;
- testing toolchain;
- test roots, commands, or CI jobs;
- supported platforms;
- lifecycle or integration infrastructure; or
- version or dependency constraints.

Do not split solely because the project contains different packages, languages,
frameworks, SDKs, or testing tools. Use stable capability-oriented headings,
such as `Mobile client`, instead of naming a context after a replaceable tool.

For each context, record only relevant current facts:

- relative paths to which it applies;
- execution environments and targets;
- tools, their roles, and material version constraints;
- test commands, roots, and naming conventions;
- supported test levels;
- test-double or integration infrastructure constraints; and
- repository evidence plus freshness or invalidation signals.

### Testing preferences

Record stable user or project testing preferences with their scope. Do not
duplicate this skill's universal rules or store permission grants.

Keep `CONTEXT.md` concise and current. Update facts in place and remove stale
facts when their replacements are verified. Do not preserve research notes,
source-comparison snapshots, alternatives, rationale, or decision history in
project storage; report that task-specific material in the current task instead.

Complete this step when every retained item is a current durable project fact,
testing-context fact, or scoped testing preference.

## Handle earlier layouts

When canonical `CONTEXT.md` is absent, check the earlier flat
`.ptlam-agent-plugin/skills/ptlam-testing/CONTEXT.md`, then the earlier flat
`.ptlam-agent-plugin/skills/ptlam-testing/profile.md`, and then the earlier
categorized `.ptlam-agent-plugin/skills/engineering/ptlam-testing/profile.md`.
Read relevant project profile, context, and preference facts in place and report
the earlier layout.

During authorized writable context maintenance, consolidate verified current
profile, context, and preference facts into canonical `CONTEXT.md`. Do not carry
research or decision records forward. Remove replaced files only when deletion
is authorized; otherwise leave them untouched and report them as legacy files.

Complete this step when current information has one canonical destination and
every retained legacy file is explicitly reported.

## Verify freshness and preserve repository policy

- Before relying on a context fact, compare it with current repository
  instructions, manifests, lockfiles, build and test configuration, CI, and
  existing tests.
- Refresh only the information required for the task. Recheck a fact when its
  evidence changes, a recorded command fails, or current versions or
  maintenance status matter. Dates are freshness signals, not proof.
- If `CONTEXT.md` is already tracked, update it as normal project state. If it
  is ignored, keep it local. If it is untracked and not ignored, leave it
  untracked and report that status.
- Never edit `.gitignore`, stage files, or create a commit merely because
  `CONTEXT.md` was created or updated.
- Never store secrets, credentials, transient command logs, machine-specific
  absolute paths, research notes, or decision history. Use paths relative to
  the project root.

Complete this step when every used fact has current supporting evidence and any
context-file mutation preserves the repository's existing VCS treatment.

## Feed the task and report

Use the relevant `CONTEXT.md` sections as starting evidence for environment
resolution, never as hard-coded authority. In write, fix, or explicit TDD mode,
persist only material current facts and preferences established by the task. In
audit mode, report the same information only as suggested context changes.

Report whether `CONTEXT.md` was loaded, created, updated, or left unchanged; the
testing context selected; stale or provisional information; suggested
audit-only changes; legacy files; and relevant tracked, ignored, or untracked
status.

Complete this workflow when the testing task has the verified context it needs
and the report accounts for the canonical file, any legacy layout, freshness,
and VCS status.
