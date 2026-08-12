const SMALL_OPERATION =
  /^(?:please\s+)?(?:rename|move|delete|remove|create|change|replace|set|update)\b/iu;
const COMPLEX_SIGNAL =
  /\b(?:architecture|ambiguous|compare|design|investigate|migrate|multiple|plan|research|trade-?offs?|verify)\b/iu;

function isSimpleAndClear(prompt) {
  const normalized = prompt.trim().replace(/\s+/gu, " ");
  if (normalized.length === 0) return true;
  const sentenceCount = normalized
    .split(/[.!?]+(?:\s+|$)/u)
    .filter(Boolean).length;
  return (
    normalized.length <= 220 &&
    sentenceCount <= 2 &&
    SMALL_OPERATION.test(normalized) &&
    !COMPLEX_SIGNAL.test(normalized)
  );
}

/**
 * Add execution context only when it materially helps a non-trivial request.
 *
 * @param {{ prompt?: string }} context Provider-neutral request context.
 * @returns {Promise<{ additionalContext?: string }>} Adaptation guidance.
 */
export async function handle(context) {
  const prompt = typeof context.prompt === "string" ? context.prompt : "";
  if (isSimpleAndClear(prompt)) return {};

  return {
    additionalContext: [
      "Adapt this request internally before acting; do not replace or restate the user's message.",
      "Preserve the user's underlying intent and literal scope.",
      "Resolve the objective, relevant context and constraints, expected output, task-relevant expertise, and proportional verification expectations.",
      "Do not invent requirements, roles, or deliverables that do not materially help this task.",
      "Answer in direct, concise language and use only the smallest presentation format that improves comprehension.",
    ].join(" "),
  };
}
