# Writing for Maintainers

This reference owns reading order, sentence shape, visuals, and what to cut in a
skill package. The target repository's own writing rules outrank this file.

Write for the person who will change this skill in six months. They read it
once, at speed, then act. An agent reading the same text is the easier reader,
not the harder one.

## Order each file the way someone learns it

1. What this produces, and for whom.
2. What it does not cover.
3. The whole path, start to finish.
4. The terms and rules those steps depend on.
5. Exceptions and failure cases.

Never use a term before you define it. Never mention an artifact before you
introduce it.

## Match specificity to the cost of getting it wrong

| Situation                                     | Write                         |
| --------------------------------------------- | ----------------------------- |
| Context picks among safe options              | A principle                   |
| Order prevents omissions                      | Numbered steps                |
| The operation is fragile, exact, and repeated | The exact command or template |

Verify a host mechanic before you name it. A confidently wrong command costs
more than a principle that made the reader think.

## Give every sentence one job

- One idea per sentence and per bullet. Split a sentence carrying two rules.
- Name who acts. "The build fails" hides whether that is the agent, the user, or
  CI.
- End every numbered step with a result someone can observe.
- Use one word per concept across the whole package. Never vary it for style.

## Prefer a diagram, then a table, then prose

Reach for the form that costs the reader least. When more than one form carries
the point, take the highest one whose row fits.

| Form            | Fits when                                                     |
| --------------- | ------------------------------------------------------------- |
| Mermaid diagram | The point is a path, branch, hierarchy, lifecycle, or handoff |
| Table           | The point maps one key to one value                           |
| Prose           | The point is a single rule, definition, or caveat             |

A visual replaces the prose it stands in for; it never accompanies it. When a
nearby paragraph says what the visual already says, delete one of them.

Never force a diagram onto content with no shape. A padded diagram costs the
reader more than the sentence it replaced.

## Cut instead of compressing

Split a long file, or delete from it. Never fold separate points into one denser
sentence: the file shrinks and the reader's job grows.

Compressed, and unusable:

> Define the responsibility, artifact, branches, inputs, outputs, side effects,
> acceptance, boundaries, and dependencies, then apply Rule 1.

The same content, split, and actionable:

> Write one line for each: the responsibility, the artifact it produces, its
> branches, its inputs, and its acceptance standard.
>
> Then apply Rule 1 to what you wrote.

The second version is longer and costs the reader less. That is the trade to
make every time.

## Delete these on sight

Duplicated meaning. Stale instructions. Host behavior that is already the
default. Examples nothing refers to. Tool variants the skill did not choose.
Capabilities that belong to a neighboring skill. Prerequisites copied from a
dependency. Abstractions with no concrete case behind them. Any explanation that
changes no decision and no acceptance criterion.

Keep the sentence that warns someone honestly about cost, difficulty, or risk.
That one is not decoration.

## Read back before you call it done

Read only the title, the headings, and the visual labels. Nothing else.

If that alone does not reveal the path and how it ends, restructure the file. Do
not fix it by polishing sentences.
