---
name: ptlam-explaining-with-analogy
description:
  Explain an unfamiliar, abstract, or complex concept through one coherent
  real-life analogy, a stable mapping table, a short story, and explicit
  caveats. Use only when the user explicitly asks for an analogy to help them
  understand or learn a concept. Do not invoke for a general request to explain,
  define, simplify, or break down a concept unless that same request explicitly
  asks for an analogy.
---

# PTLam Explaining with Analogy

Explain a concept through one vivid, structurally faithful real-life analogy.
Own the explanation semantics: a concise summary, stable mappings, a story that
demonstrates the mechanism, and every material limitation. When another agent
calls this skill, return those content components and let the caller choose the
rendering. When answering the learner directly, use the compact Markdown
fallback below.

## Parse the request

Identify:

- the concept to explain;
- the learner's background and existing knowledge;
- the part that is confusing; and
- any analogy domain the learner supplies, requires, or rules out; and
- the requested depth, language, or other output constraints.

If the concept is missing or too vague to explain accurately, ask what the
learner wants explained. Otherwise, infer ordinary presentation choices and
continue.

Complete this step when the concept, learner goal, confusing mechanism, depth,
language, analogy-domain constraints, and output constraints are known or
safely inferred.

## Establish the literal model

Before choosing an analogy, identify the minimum real structure needed to
explain the concept accurately:

- essential actors, objects, and boundaries;
- ownership, containment, dependencies, and cardinality;
- inputs, outputs, order, handoffs, and causal rules;
- relevant states, transitions, lifetimes, and failure behavior; and
- exact constraints, exceptions, or facts that must remain literal.

Cover only the core mechanism needed for the learner's goal. Verify claims when
the request or risk requires it. Do not invent details to make an analogy fit.

Complete this step when every material relationship and rule within the chosen
depth is captured and uncertain claims are verified or excluded.

## Select a validated analogy

Treat a learner-supplied analogy domain as the first candidate and validate it
against the complete mapping gate below. Use it when it passes. When it fails,
name the material mismatch and offer passing alternatives instead of silently
substituting another domain.

Generate several candidate domains internally after the literal model is
stable when no learner-supplied domain has passed. Prefer candidates that:

- mirror the concept's relationships and behavior, not merely its appearance;
- use an everyday domain the learner can picture immediately;
- remain within one coherent world; and
- map essential concepts without collisions or material contradictions.

Prefer familiar starting points when they preserve the structure:

| Concept pattern | Possible analogy domains |
| --- | --- |
| Ordered sequential work | Recipe or assembly line |
| Fast storage and retrieval | Library or filing cabinet |
| Broadcasting to unknown listeners | Radio station or newsletter |
| Complexity behind a simple surface | Restaurant menu |
| Concurrent work | Multiple cooks in one kitchen |
| Agreed communication rules | Introductions or phone etiquette |
| Adjustment from observed output | Thermostat |
| Work distributed across resources | Traffic control |

Derive a better domain when these examples do not fit.

For each candidate, build an internal mapping ledger:

```text
literal concept -> analogy counterpart -> preserved behavior -> known limit
```

Apply the complete mapping gate before presenting or using a candidate:

1. Map every essential literal concept to one stable analogy counterpart.
2. Preserve ownership, direction, order, state, cardinality, lifetime, and
   causality wherever they matter.
3. Reuse no analogy element for unrelated concepts.
4. Keep exact facts and constraints literal rather than bending the analogy.
5. Reject a candidate when a material rule needs a misleading mapping, an
   unexplained exception, or a second metaphor.

Choose the passing candidate with the strongest fidelity, coverage,
familiarity, and lowest explanation cost. Use it without adding a selection
turn unless the learner explicitly asks to choose, rejects the current analogy,
or the passing candidates expose meaningfully different teaching trade-offs.

When selection is useful, present up to three passing candidates as a numbered
list. Give each a short domain name, one sentence describing the structural
similarity, and any material teaching trade-off. Mark the strongest candidate
**(Recommended)**, ask which one to use, and stop until the learner chooses.
Never offer a candidate that failed the mapping gate.

If no coherent candidate passes, ask the learner to narrow the goal instead of
forcing a weak analogy. Complete this step when one passing analogy is selected,
with every learner-supplied domain either honored or rejected for a named
material mismatch, or when the learner has received the one scope question
needed to find a passing analogy.

## Compose the explanation

Lock the chosen analogy domain and use it throughout. Calibrate vocabulary and
depth to the learner. Be vivid and playful without weakening precision.

Produce these four semantic components in order. A calling agent may transform
their presentation while preserving their meaning. When answering directly in
Markdown, use the headings and table below without an extra introduction or
conclusion.

### In a sentence

Write one assertive, jargon-free sentence that captures the concept's essence.
Avoid hedges such as “basically” or “kind of.” Format it as a blockquote:

> [One-sentence summary]

### The map

Translate each essential story element into one real concept. Keep mappings
stable and non-colliding.

| In the story | In [concept name] | Why it maps |
| --- | --- | --- |
| [analogy element] | [concept element] | [structural similarity] |

### The story

Tell a short story entirely within the analogy domain, in second person. Never
name the real concept inside the story. Use an ordered list when sequence or
causality matters; otherwise use concise prose or an unordered list.

### Where it breaks

Name every material way the analogy misleads, omits behavior, or oversimplifies
the real concept. Keep the list concise; one or two limitations will usually be
enough. If the explanation needs many caveats, reject the analogy and select a
stronger candidate.

Complete this step when all four components are present, the depth and language
fit the learner, and every material limitation is disclosed.

## Check the explanation

Before returning it, confirm that:

- every essential real concept has one stable analogy counterpart;
- ownership, direction, order, state, cardinality, and causality are preserved
  wherever they matter;
- no analogy element represents unrelated concepts;
- the story demonstrates the mechanism instead of merely decorating it;
- exact facts and constraints remain literal in the map or caveats; and
- the learner can recover the real concept from the map without relying on the
  story alone.

If drafting reveals a failed mapping, do not return the explanation. For an
automatically selected analogy, use the next strongest passing candidate. For a
learner-selected analogy, explain the newly discovered limitation and offer
fresh passing candidates instead of silently overriding the learner's choice.

Complete this step when the explanation passes every check and is ready for the
caller to render or for direct delivery.

## Handle follow-ups

| Learner asks for | Response |
| --- | --- |
| A different analogy | Present up to three fresh passing candidates, excluding the analogy just used. |
| More depth | Expand the literal model, then revalidate the same analogy against the new scope. Keep it only if it still passes; otherwise name its boundary and offer fresh passing candidates. |
| A simpler version | Rebuild the learning goal at the simpler depth, then select from more everyday candidates that pass the complete gate. |
| A related concept | Start again for the new concept and link back only where it helps. |
| A challenge to the analogy | Name the limitation, explain the structural reason for the choice, and offer fresh candidates when needed. |

Complete a follow-up when its updated scope has passed the same literal-model,
mapping, composition, and final checks as the original explanation.
