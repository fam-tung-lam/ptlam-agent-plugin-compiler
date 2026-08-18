# Prompting Best Practices

This reference owns prompt decisions for skills that steer non-trivial
reasoning, tool use, output shape, long context, or autonomy. It does not own
the skill's capability or its package structure.

It adapts durable guidance from Anthropic's
[Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).
The link records attribution only; this reference contains the complete rules.
Use a model or runtime detail only when the target's local schema, tool help, or
accepted configuration verifies it.

## State the contract

Tell the agent the outcome, the local context, the constraints, what it is
allowed to change, and the shape of the output. Use ordered steps when sequence
or completeness matters.

Explain why a rule exists only when the reason helps the agent handle a case you
did not list. Use one term per concept and one strong instruction per rule.

## Structure the prompt

Use prose for a single principle, bullets for rules of equal weight, numbered
steps for ordered work, and a template when the exact output matters.

Label and bound source material, examples, and user data whenever they could be
mistaken for instructions. Put large source material before the task that uses
it. Ask for traceable evidence when the reader has to verify a conclusion.

## Use examples only when needed

Add an example only when direct instruction leaves the format, tone, boundary,
or transformation ambiguous. Keep examples relevant, varied enough to reveal the
rule behind them, and clearly separate from instructions and data.

Watch for values in an example that quietly become requirements.

## Control the output positively

Say what to produce: the required fields, their order, any limit, the language,
and the destination. Use an exact template only when exactness is part of being
done. Never let a formatting rule hide evidence or invalidate the artifact.

## Match tools to authority

Use action verbs only where the agent is authorized to act. Never infer
authority for destructive, external, or wider-reaching actions. Name a tool only
when the target exposes it and naming it improves reliability.

Run independent actions in parallel. Keep dependent actions sequential. Resolve
real parameter values before any tool call.

## Calibrate reasoning

Apply
[match specificity to the cost of getting it wrong](writing-for-maintainers.md#match-specificity-to-the-cost-of-getting-it-wrong).

Ask for visible intermediate decisions only where the work is fragile. Give
explicit finish conditions so the agent stops exploring and catches omissions.
Ask for short evidence and verification, not for hidden reasoning.

## Preserve long-running state

Keep a compact plan when the host supports one. Record the exact artifact
identities needed to resume. After context is restored, re-read the controlling
instructions and continue from verified state.

Add state files to a repository only when the workflow needs them and the user
authorized them.

## Bound agentic work

Grant autonomy for reversible local work inside scope. Require explicit prior
authority for anything destructive, hard to reverse, external, or shared.

Use subagents only when authorized and only for independent workstreams. Keep
one owner for integrated decisions and for edits that would conflict. Chain
prompts only when an inspected intermediate artifact creates a real control or
information boundary.

## Prompt review

Confirm that the outcome, the authority, and the output are explicit; that
structure separates instructions, inputs, examples, and schema; that each branch
carries the context it needs and no more; that tools and host mechanics are
verified; that positive instruction outweighs negation; that freedom matches
risk; that each example reveals a rule; and that every sentence changes behavior
or supplies required context.
