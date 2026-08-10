# Manage Project Git Context

Use one project-local file for durable Git facts and preferences:

```text
<repository-root>/.ptlam-agent-plugin/skills/engineering/ptlam-git/CONTEXT.md
```

The file is a verified cache of durable project knowledge. It does not grant
permission or replace live repository evidence.

## Contents

- [Resolve the repository and write authority](#resolve-the-repository-and-write-authority)
- [Load or create the context](#load-or-create-the-context)
- [Keep one file with three kinds of information](#keep-one-file-with-three-kinds-of-information)
- [Handle earlier layouts](#handle-earlier-layouts)
- [Verify freshness and preserve scope](#verify-freshness-and-preserve-scope)
- [Apply the context and report](#apply-the-context-and-report)

## Resolve the repository and write authority

1. Resolve the repository root from the explicit task path and repository
   evidence. Keep nested repositories, submodules, and multiple repositories
   separate.
2. In a linked worktree, use only the `CONTEXT.md` visible from that worktree.
   Do not search another worktree for local context.
3. Loading context is read-only. Create or update it only when the user directly
   requests context maintenance or an already-authorized state-changing Git
   task establishes material durable knowledge.
4. If several repository roots remain plausible and the choice changes the
   stored scope, ask which repository owns the context.

Complete this step when every repository in scope has one resolved root and the
context operation is clearly read-only or writable.

## Load or create the context

- Load canonical `CONTEXT.md` when it exists. Treat current user instructions,
  repository policy, Git configuration, hooks, hosting configuration, and
  collaboration surfaces as the sources of truth.
- Continue without creating the file when it is absent and no material durable
  fact or preference needs to be stored.
- Create or update it after a direct context-maintenance request.
- During other authorized state-changing Git work, update it only when current
  evidence establishes material new, changed, or stale durable knowledge. A
  one-off choice is not a durable preference.
- Preserve unknown fields. Require an explicit migration before changing an
  unsupported schema.

Use compact identity and freshness frontmatter:

```yaml
---
schema_version: 1
skill: ptlam-git
canonical_path: skills/engineering/ptlam-git
updated_at: YYYY-MM-DD
---
```

Change `updated_at` only when stored content changes.

Complete this step when the current file state and write authority permit one
clear load, create, or update path.

## Keep one file with three kinds of information

Use sections inside `CONTEXT.md`; do not create sibling profile, preference,
research, decision, or operation-state files.

### Project profile

Record only durable repository facts that affect Git work:

- repository, workspace, submodule, and worktree boundaries;
- repository-relative policy, hook, check, and collaboration entrypoints; and
- evidence plus freshness or invalidation signals.

Link to an authoritative repository source instead of duplicating its rules.

### Git flow

Record stable flow semantics that cannot be safely rediscovered from current
ref positions alone:

- branch and ref roles, base-selection rules, and upstream or push-destination
  relationships;
- isolation, worktree, integration, review, release, and publication practices;
- required checks, gates, and hosting surfaces; and
- the scope, evidence, and invalidation signals for each fact.

Record roles and policies, not current object IDs, ref positions, queue state,
or operation progress.

### Git preferences

Record stable user or project preferences with their scope and evidence:

- commit subject, body, trailer, signing, and issue-reference preferences;
- worktree, isolation, consolidation, and meaningful-unit preferences; and
- integration, publication, pull-request, and recovery preferences.

Record a preference only when the user states it as durable. Do not infer one
from a single accepted command, branch, commit, or workflow. Do not copy the
skill's portable defaults into the project file.

Keep `CONTEXT.md` concise and current. Update facts in place and remove stale
facts when replacements are verified. Keep task-specific research,
alternatives, rationale, and decision history in the task report.

Never store:

- current object IDs, ref positions, dirty state, conflicts, checks, approvals,
  handoffs, recovery points, or other live observations;
- permission grants or standing authority for shared, destructive, or
  identity-changing actions;
- credentials, secret-bearing URLs, transient logs, or machine-specific
  absolute paths; or
- preferences inferred only from agent behavior or one-off user choices.

Complete this step when every retained item is a current durable project fact,
Git-flow fact, or explicitly supported scoped preference.

## Handle earlier layouts

When canonical `CONTEXT.md` is absent, check the earlier flat
`.ptlam-agent-plugin/skills/ptlam-git/profile.md` layout and the categorized
`.ptlam-agent-plugin/skills/engineering/ptlam-git/profile.md` layout. Load relevant
profile, flow, and preference facts in place and report the earlier layout.

During authorized writable maintenance, consolidate only verified current
profile, flow, and preference facts into canonical `CONTEXT.md`. Do not carry
research, operation state, or decision history forward. Remove replaced files
only when deletion is explicitly authorized; otherwise leave them untouched
and report them.

Complete this step when current information has one canonical destination and
every retained earlier-layout file is reported.

## Verify freshness and preserve scope

- Compare each task-relevant entry with current instructions, configuration,
  repository evidence, and shared state before relying on it.
- Refresh only task-relevant knowledge. Recheck an entry when its evidence
  changes, a recorded command fails, or current policy contradicts it. Treat
  dates as freshness signals, not proof.
- Use repository-relative paths and record evidence or invalidation signals for
  facts whose freshness is not self-evident.
- If `CONTEXT.md` is tracked, update it as ordinary project state. If ignored,
  keep it local. If untracked and not ignored, leave it untracked and report
  that status.
- Classify an automatic context change separately from the user's Git change.
  Never stage, commit, publish, or add it to `.gitignore` unless the user
  explicitly includes that effect in the authorized scope.
- Preserve unrelated files and unknown fields.

Complete this step when every used entry has current support and context
maintenance preserves repository policy, VCS treatment, and task scope.

## Apply the context and report

Use verified task-relevant entries as starting facts and preferences. They
cannot override current instructions or repository policy, authorize an action,
or replace live target observation.

After authorized state-changing work, persist only material durable facts and
preferences established by that task. During read-only work, report suggested
context changes without writing them unless the user explicitly requested
maintenance.

Report whether `CONTEXT.md` was absent, loaded, created, updated, or left
unchanged; which entries affected the task; stale or provisional entries;
earlier-layout files; and relevant tracked, ignored, or untracked status.

Complete this workflow when the task has current project context and the report
accounts for the canonical file, freshness, earlier layouts, and every context
side effect.
