# Grilling session schema

Use this canonical structure for every persisted grilling session. Omit a
section only when it truly does not apply. Keep entries concise and replace
placeholders with current session facts.

```markdown
# Grilling session: <descriptive title>

- Status: <active | awaiting-user | confirmation-pending | deferred | blocked | complete>
- Created: <timestamp>
- Updated: <timestamp>
- Workspace root: <absolute initial workspace path>

## Outcome and scope

<Intended outcome, eventual artifact or action, constraints, and non-goals.>

## Evidence

<Verified facts with source paths or links and verification dates.>

## Decision map

### Resolved

<User-owned decisions with answers, rationale, and consequences.>

### Assumptions, risks, and contradictions

<Accepted assumptions, current risks, contradictions, and invalidated branches.>

### Deferred

<Deferred decisions with owner and consequence.>

### Open decisions

<Unresolved decisions in dependency order.>

## Current checkpoint

Current question: <question or none>
Recommendation: <answer and rationale or none>
Strongest alternative: <alternative or none>
Main trade-off: <consequence or none>
Resume from: <one exact instruction for the next agent>
```

Use exactly one status:

- `active`: work is progressing and no user answer is currently required;
- `awaiting-user`: the current question has been asked;
- `confirmation-pending`: the shared-understanding summary awaits confirmation;
- `deferred`: the user intentionally postponed the session;
- `blocked`: progress requires missing evidence, authority, or external change;
  or
- `complete`: shared understanding is confirmed and no grilling decision remains.
