# Commit message preferences

Apply current user instructions and repository or collaboration policy before
verified project Git context. Use these defaults only for choices those sources
leave unconstrained. This lets `CONTEXT.md` replace them for one project without
requiring a skill release.

- Use Conventional Commits with an outcome-focused subject:
  `<type>(<scope>): <description>`, omitting the scope only when it adds no
  useful context. Preferred types are `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `chore`, and `ci`.
- Make the subject explain why the change exists: name the outcome or
  capability, the broken behavior fixed, or the reason for a refactor—not the
  implementation mechanics. Use imperative mood, capitalize the description,
  omit the final period, aim for 50 characters, and never exceed 72.
- Add a short, concrete body when the subject cannot carry enough context. For
  features, show sample usage or explain the new capability. For fixes, state
  the cause and how the change prevents the failure. Prefer why over a
  step-by-step account of the implementation.
- When a commit resolves an issue, add `Fixes #<issue-number>` or
  `Closes #<issue-number>` in the body. When it contributes to resolving an
  issue but is not the final commit that closes it, add
  `Relates #<issue-number>`. Use the full issue URL for an issue in another
  repository.
