# Swimlanes

This reference owns Mermaid swimlane semantics and syntax for process-step
ownership and responsibility changes. The shared workflow and acceptance rules
remain in `SKILL.md`.

## Use and compatibility

Use `swimlane-beta` for a process whose owners, teams, systems, or phases are as
important as its order. Use one lane dimension throughout the diagram. Do not
mix owners, phases, and statuses as peer lanes.

This diagram type requires Mermaid 11.16 or later and its beta syntax may
change. When the target lacks it, use a flowchart with one subgraph per lane and
name the compatibility substitution.

## Build the lanes and flow

1. Choose `LR` for a handoff chain and `TB` for a long process that reads better
   vertically.
2. Declare each top-level `subgraph` as one lane with a stable id and a concise
   ownership label.
3. Put every task and decision in the lane of the owner who performs it.
4. Connect the process in execution order after the lane blocks.
5. Label a cross-lane edge when a document, message, decision, or condition
   controls the handoff.

Use flowchart-style shapes with a small, stable vocabulary:

| Shape              | Meaning                                 |
| ------------------ | --------------------------------------- |
| `Task[Do work]`    | Activity                                |
| `Decision{Ready?}` | Decision owned by that lane             |
| `Start([Start])`   | Process boundary                        |
| `Marker((A))`      | Connector only when it reduces crossing |

Use dashed arrows only for passive notification or observation. Use solid arrows
for work progression and direct handoff. Route each decision outcome with a
short condition label.

Add `accTitle` and `accDescr` when the destination renders Mermaid accessibility
metadata. The description must name the starting owner, the main handoffs, and
the terminal outcome.

## Template

```mermaid
swimlane-beta LR
    accTitle: Support escalation
    accDescr: A customer request is triaged by support and escalated to engineering when a code change is required.

    subgraph Customer [Customer]
        SubmitRequest[Submit request]
        ReceiveAnswer[Receive answer]
    end

    subgraph Support [Support]
        TriageRequest[Triage request]
        KnownIssue{Known issue?}
        SendAnswer[Send answer]
    end

    subgraph Engineering [Engineering]
        PrepareFix[Prepare fix]
    end

    SubmitRequest -->|Request received| TriageRequest
    TriageRequest --> KnownIssue
    KnownIssue -->|Yes| SendAnswer
    KnownIssue -->|No: code change| PrepareFix
    PrepareFix -->|Fix available| SendAnswer
    SendAnswer --> ReceiveAnswer
```

## Completion check

Confirm that every lane represents the same ownership dimension, every node sits
with its real owner, every responsibility change is visible, and every branch
rejoins or terminates. Split the diagram when a reader must scan too many lanes
or trace a cross-lane arrow twice to understand the process.
