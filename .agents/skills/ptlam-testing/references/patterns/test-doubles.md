# Test Doubles

Use a test double only at a justified boundary. When a double is required, use
the repository-approved mocking dependency so the codebase uses one consistent
mechanism. When no dependency is approved, follow the testing-environment
workflow to research and recommend one before adding it.

## Choose the semantic role

- **Dummy**: satisfies a required parameter but is never used.
- **Stub**: supplies predetermined indirect input.
- **Fake**: provides a simplified working implementation of a boundary.
- **Spy**: records outgoing interactions for later assertions.
- **Mock**: carries predetermined interaction expectations and verifies them.

Name and discuss a double by the role it actually performs even when one mocking
API creates every role through a class named `Mock`.

Use a real collaborator when the selected test level requires it and it is fast,
deterministic, and safe. Otherwise use the simplest double that expresses the
required behavior. Verify an interaction only when that interaction is part of
the observable contract.

## Use the approved mocking dependency

- Reuse the repository's approved mocking dependency.
- In a read-only audit, report a missing or conflicting dependency without
  changing project files.
- When no mocking dependency exists, research and recommend the best fit for the
  detected environment before adding one. Add it only when dependency changes
  are authorized by the task or the user accepts the recommendation.
- When another mocking library already exists, do not add a second one silently.
  Offer to migrate now, retain the current library, or defer.
- Follow the selected tool's current official API and recommendations for its
  implementation mechanics. Do not let tool terminology replace the semantic
  role, boundary, or placement rules in this pattern.

## Place a double at the nearest common test scope

Place a double in the smallest scope containing every test that uses it. Move it
up only after real reuse appears. Resolve the mirrored production or capability
scope before considering the test level: level-specific doubles remain inside
that level, while a genuinely shared cross-level double belongs directly in the
capability's test scope.

```text
One test
-> keep its mocking configuration in that test

Several tests in one test class or group
-> keep it inside or beside that class or group in the test file

Several groups or the whole test file
-> create test_doubles/ in that test file's directory

Several neighboring test files
-> create test_doubles/ in their nearest common test directory

Several nested directories
-> move test_doubles/ only to their nearest common parent
```

Apply the same algorithm across test levels:

```text
<test-root>/
└── <mirrored-production-or-capability-scope>/
    ├── <test-doubles>/
    │   └── <double-shared-by-multiple-levels>
    ├── <unit-level>/
    │   └── <test-doubles>/
    │       └── <unit-only-double>
    └── <integration-level>/
        └── <test-doubles>/
            └── <integration-only-double>
```

Use the repository's established directory names, such as `test-doubles` or
`test_doubles`, and its names for each test level. The diagram fixes scope
ownership and nesting, not spelling.

For reusable doubles:

```text
<nearest-common-test-directory>/
├── test_doubles/
│   └── <one-semantic-double-per-file>
└── <tests that use the double>
```

- Keep one reusable semantic double or generation declaration per file unless a
  tool explicitly requires another layout.
- Do not create suite-root `test_doubles/` speculatively.
- Keep doubles for different test levels separate unless the exact same semantic
  double is already reused by tests at those levels. Put that shared definition
  at their nearest common capability scope, not at a repository-wide level root.
- Let a fixture or lifecycle hook construct and clean up a reusable double, but
  keep its definition in the nearest `test_doubles/` location.
- Keep one-off mock, patch, or expectation configuration inside the test.
- When reuse expands, move the original definition rather than copying it. When
  reuse contracts, move it back down when that improves locality.
- Remove the old location and update all imports after a move.

## Avoid false confidence

- Do not replace collaborators inside the implementation merely to assert call
  counts or order.
- Do not add conditional setup that reproduces the production algorithm.
- Keep stubbing specific to the Given phase of the test.
- Prefer fresh doubles per test over shared mutable state and broad resets.
- Fail or report when an unstubbed/default value affects the asserted outcome.
