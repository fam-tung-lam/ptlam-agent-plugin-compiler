---
name: ptlam-git
description:
  Apply PTLam's commit-message preferences and maintain project-local Git
  context. Use for repository-tied Git work that should load current facts or
  preferences from CONTEXT.md; for recording, refreshing, or consolidating
  durable Git context; and for creating or changing a commit message. Apply
  current user, repository, and CONTEXT.md preferences before the portable
  defaults.
---

# PTLam Git preferences

Apply only project-local Git context and commit-message preferences. Assume the
agent already knows general Git workflow mechanics.

## Load the relevant reference

1. For repository-tied Git work, read
   [project Git context](references/project-git-context.md). It owns the
   `CONTEXT.md` location, contents, maintenance rules, and reporting contract.
2. When creating or changing a commit message, read
   [commit message preferences](references/commit-message-preferences.md). It
   owns preference precedence and the portable defaults for subjects, bodies,
   and issue references.

Complete this step when the task has loaded every reference its branch needs
and no unrelated Git workflow instructions.

## Apply the preferences

1. Treat current user instructions and repository policy as sources of truth.
2. Apply verified task-relevant facts and preferences from `CONTEXT.md`.
3. For commit-message choices still unconstrained, apply the portable defaults.
4. Maintain `CONTEXT.md` only under its write and scope rules.
5. Report the context status, preferences that affected the task, and any
   stale, conflicting, or unavailable information.

Complete the workflow when current preferences have been applied, any
authorized context maintenance is verified, and the report accounts for the
`CONTEXT.md` state.
