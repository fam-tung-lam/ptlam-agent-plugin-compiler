---
name: ptlam-grilling
description:
  Conduct a persistent, interactive stress test of a plan, decision, or idea
  through one user-owned decision at a time. Use when the user explicitly
  requests a sequential grilling interview or explicitly asks to resume a prior
  grilling session; handle ordinary critique or risk-review requests as direct
  analysis. Research discoverable facts independently, expose assumptions,
  contradictions, risks, and trade-offs, recommend an answer for every decision,
  wait after each question, and require confirmed shared understanding before
  any resulting action.
---

# PTLam Grilling

Stress-test a plan, decision, or idea through a deliberate sequence of user-owned
decisions. Resolve evidence independently, expose trade-offs, and keep the user
in control of consequential choices.

## Persist the grilling session

Capture the task's initial workspace root before the first substantive question
and keep that root fixed for the session. Do not replace it with a discovered
repository root or a shell working directory changed later. When the host
exposes multiple workspace roots and the destination is ambiguous, ask which
root should own the record.

Treat invocation of this skill as authority to create and update only its
session directory and the current session file. Obtain separate authorization
before staging, committing, publishing, or changing unrelated project files.
Create new grilling sessions at:

```text
<workspace-root>/.ptlam-agent-plugin/skills/productivity/ptlam-grilling/<YYYY-MM-DD>_<title>.md
```

Use the session's creation date and a short, filesystem-safe, descriptive title.
Prefer words that identify the actual decision over generic titles such as
`planning` or `discussion`. Inspect the candidate path and same-topic records
before creating a file. Resume one clear non-complete match unless the user
explicitly asks to start fresh. If several records plausibly match, ask which one
to continue. For a fresh session, use the base filename when available;
otherwise append the first available suffix before `.md`, such as `_2`, `_3`,
and so on. Never overwrite or truncate an existing record.

Read a resumed file completely, recheck drift-prone evidence, and continue from
its next unresolved decision without repeating settled questions. Treat records
under the earlier flat `.ptlam-agent-plugin/skills/ptlam-grilling/` directory,
including its `sessions/` subdirectory, as resumable in place, but create new
records only in the canonical categorized directory.

Before creating or updating a session file, read and follow the canonical
[grilling session schema](references/grilling-session-schema.md). Keep the file
concise, readable without chat history, and sufficient for a new agent to
continue.

Complete persistence setup when the initial workspace root is fixed, the schema
is loaded, one unique new or resumable path is resolved, the initial checkpoint
is written successfully, and the user has been told the path.

Record conclusions and evidence, not a turn-by-turn transcript or hidden
reasoning. Never persist secrets, credentials, or unrelated personal data.

Use judgment about useful checkpoints, but never let the file lag behind a
materially changed decision map. Update it after a consequential answer or new
evidence changes the map, before yielding with the next substantive question,
before a summary or handoff, and when the session becomes confirmed, deferred,
blocked, or complete. If persistence fails, report the failed path and reason
instead of silently claiming the session is resumable.

## Establish the decision map

1. State the intended outcome, known constraints, and the artifact or action the
   discussion would eventually enable.
2. Inspect repository files, tools, prior decisions, and other available
   evidence for discoverable facts. Do not ask the user to retrieve facts that
   can be checked safely.
3. Build an internal decision map. Mark prerequisites, downstream effects,
   assumptions, conflicts, and branches that are already resolved.
4. Separate user-owned choices from reversible implementation mechanics. State
   a reasonable default for low-impact mechanics instead of spending a question
   on each one.

Complete the decision map when the outcome, non-goals, constraints, relevant
evidence, prerequisites, assumptions, conflicts, and known user-owned choices
are represented and the highest-impact answerable decision is identifiable.

## Interview one decision at a time

1. Select the highest-impact unresolved decision whose prerequisites are known.
2. Ask exactly one question. Include:
   - why the decision matters now;
   - the recommended answer and its rationale;
   - the strongest material alternative; and
   - the main trade-off or consequence.
3. Wait for the user's answer before asking another question.
4. Record the answer, update the decision map, and identify what it resolves or
   invalidates downstream. Persist the updated checkpoint before yielding with
   the next question.
5. Challenge contradictions with evidence. Reopen an earlier branch when a new
   answer makes it inconsistent; never smooth over incompatible decisions.
6. Continue until every outcome-changing branch is resolved or explicitly
   deferred with an owner and consequence.

Keep questions concrete. Use scenarios and counterexamples when an abstract
answer could hide different interpretations. Recommend decisively, but never
present the recommendation as the user's decision.

## Reach shared understanding

Summarize the outcome, non-goals, resolved decisions, accepted assumptions,
risks, deferred decisions, and next authorized action. Ask whether this is the
shared understanding and wait for confirmation. Persist the summary before
asking for confirmation, then record the user's confirmation or corrections.

If the user corrects the summary, update the decision map and resume from the
highest-impact unresolved decision. If the user asks to stop or act before
confirmation, persist the session as deferred and report the unresolved
decisions and consequences; an early action request is not confirmation. Treat
any subsequent request to act as a separate task with new authority, not as
completion of the grilling session.

Act on the confirmed grilling result only after the user confirms shared
understanding. Complete the grilling session when every outcome-changing
decision is resolved or explicitly deferred, the confirmation is persisted, no
material open decision remains, and the status is `complete`.
