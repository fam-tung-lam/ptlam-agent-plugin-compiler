---
name: ptlam-testing
description:
  Design, write, update, run, review, and diagnose automated tests at unit,
  integration, and end-to-end levels. Use when an agent needs to select a test
  level, add or repair tests, improve testability, assess test quality, audit
  test code for compliance, maintain or refresh project-local testing context,
  resolve a project's testing environment, select or recommend compatible test
  tools, or follow an explicitly requested test-first or Red-Green-Refactor
  workflow. Do not infer TDD merely from a request for tests or integration
  testing.
---

# PTLam Testing

Test observable behavior through the smallest sufficient public seam. Keep the
core workflow universal and load only the references required by the current
test level, pattern, or workflow.

## Resolve the context and mode

1. Resolve every project root in scope from explicit task and repository
   evidence. Do not assume that the skill installation directory or current
   working directory is the project root.
2. Choose the mode, then follow the project-testing-context workflow to load the
   relevant project context. Create or update `CONTEXT.md` only after durable
   facts have been established and only in a writable mode:
   - **Write or fix**: create or change tests and make only authorized
     production changes.
   - **Audit**: inspect and report without editing unless the user explicitly
     requests fixes.
   - **TDD**: use the TDD workflow only when the user explicitly requests
     test-first development, TDD, or Red-Green-Refactor.
3. Read repository instructions, relevant context documents and ADRs, manifests,
   test configuration, neighboring production code, and existing tests. Verify
   loaded context facts against this repository evidence.
4. Identify the requested scope, execution environment, existing test tools, and
   test level. Choose the smallest sufficient level unless the user explicitly
   requests one.
5. Follow the testing-environment workflow unless repository evidence makes the
   execution environment and established toolchain both unambiguous and
   currently viable. Viability includes compatibility with current versions,
   platforms, and CI; maintenance suitability; and repository policy.
6. Apply these mandatory invariants before resolving implementation mechanics.
   Repository instructions, established conventions, selected references, and
   tool documentation cannot override these invariants. Report a repository or
   tool conflict and keep the invariant. If an explicit user instruction
   conflicts, surface the conflict and obtain direction before proceeding:
   - use Given-When-Then in every test;
   - preserve the mirrored production or capability scope before the test-level
     segment;
   - place reusable test doubles at their nearest common test scope;
   - keep audit mode read-only unless the user explicitly requests fixes;
   - activate TDD only when the user explicitly requests it.
7. Resolve only implementation mechanics not fixed by those invariants in this
   order:
   1. explicit user instructions;
   2. repository instructions and established conventions;
   3. the remaining universal rules in this file;
   4. selected test-level, workflow, and pattern references;
   5. current official SDK and tool documentation for implementation mechanics.
8. Let official tool guidance refine syntax, setup, lifecycle, and commands, but
   never silently replace the universal behavioral rules. Report unresolved
   conflicts instead of choosing silently.

## Load only relevant references

- For every project-tied task, read
  [resolve project testing context](references/workflows/resolve-project-testing-context.md)
  to locate and load `CONTEXT.md`, preserve mode semantics, and decide whether
  durable findings should be recorded.
- Select exactly one primary test level: [unit](references/test-levels/unit.md),
  [integration](references/test-levels/integration.md), or
  [end-to-end](references/test-levels/e2e.md). Load multiple levels only when
  they cover distinct risks without duplicating assertions.
- For explicit test-first work, also read
  [test-driven development](references/workflows/test-driven-development.md).
- Read
  [resolve testing environment](references/workflows/resolve-testing-environment.md)
  whenever the execution environment or tools must be detected, evaluated,
  added, replaced, or researched. Skip it only when repository evidence makes
  the environment and established toolchain both unambiguous and currently
  viable, including compatibility and maintenance suitability.
- Whenever a test double is present or proposed, read
  [test doubles](references/patterns/test-doubles.md).

## Apply the universal testing rules

- Verify behavior through a public interface. Do not test private methods,
  internal call structure, or incidental implementation details.
- Use Given-When-Then in every test. Use a test tool's native Given-When-Then
  API when it provides one. Otherwise add explicit `Given`, `When`, and `Then`
  comments; do not replace them with Arrange-Act-Assert.
- Name a test as a behavior specification in repository domain language. Make
  the expected result understandable without reading the implementation.
- Derive expected values independently from a specification, worked example, or
  known literal. Do not recompute them with the production algorithm.
- Keep one coherent behavior or risk per test. Multiple assertions are valid
  when they jointly describe that one outcome.
- Prefer real collaborators inside the selected seam. Replace a collaborator
  only at a justified boundary and follow the test-double references.
- Choose an obvious public seam without interrupting the user. Ask only when
  materially different seams would change the behavior, cost, or confidence of
  the tests.
- Avoid repeating the same assertion at several levels. Use each higher level to
  cover integration or journey risks that lower levels cannot establish.
- Keep tests deterministic and isolated. Control time, randomness, external
  services, and mutable global state at their boundaries; clean up every
  resource the test creates.

## Place tests

- Use the test root and naming convention required by the repository, detected
  execution environment, selected tool, and test level.
- Resolve the production-root-to-test-root mapping first. Under the test root,
  preserve the corresponding production or capability scope before adding the
  selected test-level directory. The structural order is:

  ```text
  <production-root>/<capability-scope>/<source-file>
  -> <test-root>/<capability-scope>/<test-level>/<test-file>
  ```

- Use the repository's names for the test root, capability directories, level
  directories, and test files. Names such as `unit-tests` and
  `integration-tests` are examples, not mandatory vocabulary.
- Do not invert that hierarchy into a repository-wide
  `<test-root>/<test-level>/<capability-scope>` layout. Keeping the capability
  scope first makes all tests for one production area discoverable together.
- When a test corresponds to production source code, mirror the remaining
  relative directory and filename inside that capability's test-level directory.
- When a test covers a capability or user journey without one corresponding
  source file, organize it inside that capability or journey scope and then its
  selected test-level directory.
- Do not apply source mirroring to test doubles. Follow
  [the test-double placement algorithm](references/patterns/test-doubles.md).
- Apply the placement rules to new tests. Do not reorganize unrelated legacy
  tests as a side effect.
- When a touched test is misplaced, notify the user and offer to migrate it now,
  leave it unchanged, or defer the migration. When moving it, remove the old
  location, update imports and configuration, and rerun the relevant tests.

## Control production changes

- In a testing-only task, change test code freely within scope and allow only
  small, behavior-preserving production refactors needed to expose a clean seam.
- Do not change observable production behavior unless the request already
  includes feature or bug-fix implementation, or the user confirms the change.
- Do not weaken an assertion merely to make a failing test pass. Establish
  whether the test, implementation, expectation, or environment is wrong.

## Audit existing tests

Treat a request to check, audit, or review tests as read-only unless the user
explicitly requests fixes. This includes the project testing context: report
suggested `CONTEXT.md` changes without creating or updating the file.

1. Define the reviewed scope and load every applicable reference.
2. Inspect corresponding production code when needed to judge behavior, seams,
   placement, and implementation coupling.
3. Identify both rule violations and materially missing scenarios at the public
   seam. Tie every gap to expected behavior, a failure mode, or a concrete risk.
   Do not demand tests for every line, branch, or method, and do not enforce a
   numeric coverage threshold unless the user or repository defines one.
4. Distinguish static findings from behavior verified by executed tests.
5. Report each finding with its location, violated rule, evidence, impact, and
   recommended correction. Include compliant aspects and unverified areas.
6. Assign one scoped verdict:
   - `Compliant`: no violations found.
   - `Compliant with recommendations`: mandatory rules pass; optional
     improvements remain.
   - `Non-compliant`: at least one mandatory rule is violated.
   - `Not fully verified`: evidence is insufficient for a complete conclusion.
7. Classify findings as:
   - `Critical`: creates false confidence or can conceal seriously broken
     behavior.
   - `Major`: violates a mandatory rule or misses material behavior.
   - `Minor`: harms readability or maintainability without losing the core
     behavioral check.

## Verify changes

1. Run the smallest focused test after each meaningful change.
2. During TDD, prove that Red fails for the expected reason before implementing
   Green.
3. Run the containing package or module suite after the focused test passes.
4. Run the relevant environment-specific suite and repository-wide checks when
   proportionate to the risk or required by repository instructions.
5. Report exact commands and results. State every skipped or unavailable check
   explicitly; never imply it passed.

## Report the result

Lead with the outcome. State the selected level, detected execution environment,
chosen tools, relevant `CONTEXT.md` information and its status, and the evidence
supporting those choices; summarize changed behavior and files; list
verification evidence; then disclose remaining risks, migrations, conflicts,
stale or provisional context facts, and checks not run.
