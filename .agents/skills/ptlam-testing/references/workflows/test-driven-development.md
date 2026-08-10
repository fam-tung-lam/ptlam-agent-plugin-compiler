# Test-Driven Development

Use this workflow only when the user explicitly requests TDD, test-first work,
or Red-Green-Refactor. A request for tests or integration testing alone does not
activate it.

## Work in vertical slices

1. Select one public seam and one observable behavior. Choose an obvious seam
   directly; ask only when alternatives materially change scope or design.
2. **Red**: write one test, run it, and confirm it fails for the expected
   reason. A compile failure is valid only when the next missing interface is
   the behavior currently being introduced.
3. **Green**: implement only enough production behavior to pass the test. Do not
   anticipate future cases or write a horizontal batch of tests first.
4. **Refactor**: improve the touched code while preserving behavior. Keep local,
   low-risk refactoring inside the cycle and rerun the focused tests after every
   change.
5. Repeat with the next behavior informed by the previous cycle.

## Guardrails

- Treat each test as a tracer bullet through a real public seam.
- Keep expected values independent from the implementation.
- Do not mock internal implementation structure to manufacture a Red state.
- Do not weaken the test during Green.
- Defer broad architectural refactors until the behavioral slices pass, then
  review and verify them separately.
- Preserve a readable Given-When-Then specification in every cycle.

## Completion

Run the focused test, containing suite, and proportionate repository checks.
Report the observed Red failure, the Green result, refactoring performed, and
any check not run.
