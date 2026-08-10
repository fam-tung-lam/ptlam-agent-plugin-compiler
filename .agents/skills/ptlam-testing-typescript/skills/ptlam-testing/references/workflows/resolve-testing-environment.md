# Resolve Testing Environment

Use this workflow unless repository evidence makes the project's execution
environment and established testing toolchain both unambiguous and currently
viable, or whenever a tool must be evaluated, added, replaced, or recommended.
Viability includes compatibility with current versions, platforms, and CI;
maintenance suitability; and repository policy. Do not maintain a fixed catalog
of languages, frameworks, SDKs, or testing packages in this skill.

## Discover the project context

1. Load the relevant section of the project's `CONTEXT.md`, when the file
   exists. Treat it as starting evidence, not authority; explicit current
   repository evidence can invalidate it.
2. Read repository instructions, manifests, lockfiles, build configuration, CI
   workflows, package boundaries, supported platforms, and relevant ADRs.
3. Inspect existing tests, imports, fixtures, commands, and neighboring modules.
4. Identify:
   - the language, framework, SDK, runtime, and platforms that form the
     execution environment;
   - the test levels required by the risk;
   - the existing runners, assertion APIs, mocking dependencies, harnesses, and
     integration infrastructure;
   - version, platform, CI, licensing, or dependency-policy constraints.
5. Distinguish the execution environment from the tools used to test it. Infer
   both from repository evidence instead of matching a hard-coded target name.

## Prefer a viable established toolchain

- Reuse repository-approved tools when they support the required behavior and
  environment without distorting the test design.
- Treat existing tests and dependency declarations as evidence, not automatic
  approval. Check repository instructions and recent usage before deciding.
- Before reusing a toolchain, confirm that its installed versions remain
  compatible with the runtime, supported platforms, and CI, and that its
  maintenance state remains suitable under repository policy.
- Do not introduce a second tool for the same role merely because it is more
  familiar. Report material limitations in the established toolchain.
- Follow the installed version's current official documentation for APIs,
  lifecycle, configuration, and commands.

## Research a missing or unsuitable tool

1. Use model knowledge to form a short candidate list, then verify every current
   claim against official SDK documentation, primary package documentation,
   source repositories, changelogs, and authoritative registries.
2. Compare only candidates compatible with the project's current versions and
   supported platforms.
3. Evaluate each viable candidate against:
   - the required unit, integration, and end-to-end risks;
   - native Given-When-Then support or a readable mapping to explicit comments;
   - public-seam testing, async behavior, isolation, determinism, and cleanup;
   - mocking and test-double needs;
   - runner, IDE, CI, reporting, and platform integration;
   - maintenance status, release compatibility, documentation quality, license,
     and repository dependency policy.
4. Prefer official SDK-provided tooling when it satisfies the requirements;
   otherwise prefer the smallest maintained dependency that fits the project.
5. Do not hard-code a package version in this skill. Select a version compatible
   with the project and verify it at the time of use.
6. If current sources cannot be accessed, disclose that limitation and label the
   recommendation provisional instead of presenting model knowledge as current.

## Recommend and apply

- State the detected environment, supporting repository evidence, existing
  tools, evaluated alternatives, and the recommended choice with trade-offs.
- Use an established viable tool directly when repository policy and task scope
  make the choice unambiguous.
- When adding or replacing a dependency would materially change architecture,
  maintenance cost, or team conventions, recommend the choice and obtain user
  confirmation before modifying project files.
- Let official tool guidance refine implementation mechanics only. Preserve the
  universal rules for Given-When-Then, public seams, independent expectations,
  test levels, determinism, and test-double placement.
- Map a tool's own taxonomy to the risk-based unit, integration, or end-to-end
  level used by this skill; do not let labels alone choose the level.
- In write, fix, or explicit TDD mode, update `CONTEXT.md` only with current
  durable environment, tool, command, test-root, and preference facts according
  to the project-testing-context workflow. Keep research notes, alternatives,
  and decision history in the task report rather than project storage. In audit
  mode, only report suggested context changes.

## Report the resolution

Report the selected environment and tools, the evidence and sources used, why
the choice fits the testing approach, versions or constraints applied, exact
commands, rejected alternatives that had material trade-offs, and anything not
fully verified. Also report whether `CONTEXT.md` was loaded or changed.
