# Domain context schema

This reference owns the managed business-domain sections in `CONTEXT.md`, their
merge rules, and the completion standard. Read it before changing the file.

## Managed sections

When creating a file, title it `# Project context`. Create or update only these
sections in an existing file:

```markdown
## Business glossary

| Term | Meaning in context | Not this | Context | Evidence |
| ---- | ------------------ | -------- | ------- | -------- |

## Context boundaries

### <Context name>

- Responsibility: <business responsibility>
- Language: <terms this context owns>
- Invariants: <business truths this context protects>
- Receives: <business information or events>
- Produces: <business information or events>
- Relationships: <upstream, downstream, partnership, or translation>

## Business process

### <Process name>

<One verified Mermaid diagram showing the trigger, actors, decisions, handoffs,
outcomes, and material exceptions.>

## Open domain questions

- <Question, owner, affected terms or process, and consequence, or None.>
```

Preserve unrelated headings, frontmatter, prose, diagrams, and formatting. Merge
new evidence into an existing term or context instead of creating a duplicate.
When a meaning changes, replace stale text and record the superseded meaning in
the evidence or history convention the project already uses.

## Glossary rules

| Concern       | Rule                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| Term          | Use the business's canonical singular form.                            |
| Meaning       | State one positive definition that can classify a real example.        |
| Exclusion     | Name only a plausible neighboring meaning.                             |
| Context       | Name where the definition holds; never imply global meaning silently.  |
| Evidence      | Cite a confirmed record, product document, UI phrase, or verified use. |
| Contradiction | Keep it open with an owner; never pick the tidier definition.          |

## Completion checks

| Check        | The managed context must                                              |
| ------------ | --------------------------------------------------------------------- |
| Vocabulary   | Define every triggered term once per context with evidence.           |
| Boundaries   | State responsibility, language, invariants, exchanges, and relations. |
| Process      | Show the normal path and each material business branch visually.      |
| Semantics    | Keep business boundaries distinct from code and deployment structure. |
| Consistency  | Contain no unexplained duplicate or contradictory definition.         |
| Preservation | Leave every unrelated part of an existing file unchanged.             |
| Questions    | Name the owner and consequence of each unresolved ambiguity.          |

Finish when every check passes or the exact unresolved domain question is
visible to the parent workflow.
