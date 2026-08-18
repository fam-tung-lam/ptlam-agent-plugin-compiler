# Composing Skills

This reference owns invocation selection and foundation-specialization mechanics
during package design.

## Choose how the skill starts

| Choose           | When                                            |
| ---------------- | ----------------------------------------------- |
| Model invocation | An agent should find the skill on its own       |
| User invocation  | Only the person should start it                 |
| A router skill   | Routing several skills is useful work by itself |

When a foundation and specialization compose, build the ownership map required
by
[skill atomicity and composition](skill-atomicity.md#compose-without-duplicating-ownership).
Classify every specialization rule before writing it. Link to the foundation
instead of paraphrasing shared behavior.

Finish when invocation is explicit and every specialization rule has one owner.
