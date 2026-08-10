# Integration Testing

Use an integration test when the risk lies in collaboration between real
components, adapters, processes, storage, or framework services inside a chosen
boundary.

## Rules

- Place the repository-named integration-test directory inside the mirrored
  production or capability scope, never before that scope.
- Define the integration boundary and the behavior visible through its public
  entry point.
- Run the real collaborators whose compatibility is the subject of the test.
- Replace only dependencies outside the chosen boundary, especially
  uncontrollable remote services needed for offline determinism.
- Exercise locally controlled filesystem, database, subprocess, package, or
  platform adapters for real when their integration is the risk under test.
- Use isolated data and resources. Create, identify, and clean them up within
  the test lifecycle.
- Assert behavior through the public boundary rather than querying internals as
  a side channel.
- Keep the suite smaller than the unit suite and cover collaboration failures
  rather than repeating unit-test cases.
- Prefer deterministic readiness signals over sleeps and arbitrary delays.

## Test doubles

Keep integration doubles separate from unit doubles even when they represent a
similar external dependency. A unit double isolates the unit; an integration
double excludes something outside the integration boundary. Share one definition
above both level directories only when the same semantic double is actually
reused at both levels, not merely because the doubles have similar names.

## Exit criteria

- The real collaborators under test were exercised.
- A failure identifies a broken integration contract rather than an unrelated
  external outage.
- The same risk is not already fully established at a cheaper level.
