# Architecture decision record schema

This reference owns the ADR shape, accepted status, visual placement, and
completion standard. Read it before writing the record.

## File shape

Follow a verified repository template when it exists. Otherwise use every
heading below and write `None` with a reason where a section does not apply.

```markdown
# <NNNN>. <Decision title>

- Status: accepted
- Date: <YYYY-MM-DD>
- Decision owners: <people or role>
- Source decision: <confirmed record, spec, or evidence>

## At a glance

<One literal paragraph stating the constraint, choice, and main consequence.>

## Context

<Problem, current conditions, scope, and why a decision is required now.>

## Decision drivers

| Driver | Evidence | Weight or consequence |
| ------ | -------- | --------------------- |

## Options considered

| Option | Advantages | Liabilities | Rejection or selection reason |
| ------ | ---------- | ----------- | ----------------------------- |

## Decision

<The accepted choice and the boundary it constrains.>

## Visual impact

<An earned Mermaid diagram for material relationships, or the options table as
the visual when no faithful relationship diagram exists.>

## Consequences

### Benefits

<Expected positive effects.>

### Liabilities and risks

<Costs, limitations, failure modes, and risk owners.>

## Reversal and supersession

<Reversal cost, migration path, and how a later ADR supersedes this record.>

## Traceability

<Map drivers, alternatives, and consequences to source evidence.>
```

An ADR records one accepted choice. Split independent choices whose drivers,
alternatives, or reversal paths differ.

## Completion checks

| Check         | The ADR must                                                                |
| ------------- | --------------------------------------------------------------------------- |
| Qualification | Name the future constraint that earned a durable record.                    |
| Source        | Trace the accepted choice, drivers, and alternatives to confirmed evidence. |
| Explanation   | Let a future reader reconstruct why the chosen option won.                  |
| Visual        | Include one earned visual form that replaces equivalent prose.              |
| Decision      | State one accepted choice and its constrained boundary.                     |
| Alternatives  | Preserve each material option and its rejection reason.                     |
| Consequences  | Record benefits, liabilities, risks, owners, and reversal cost.             |
| History       | Explain supersession without rewriting the old record.                      |

Finish only when every check passes. When the decision fails qualification or
lacks confirmed rationale, return the verdict without creating an ADR.
