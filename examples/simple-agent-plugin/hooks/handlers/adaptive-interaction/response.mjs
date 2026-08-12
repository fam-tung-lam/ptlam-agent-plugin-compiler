function repeatedLines(response) {
  const lines = response
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 24);
  return new Set(lines).size !== lines.length;
}

/**
 * Request one bounded revision only when the draft has a material presentation issue.
 *
 * @param {{ prompt?: string, response?: string, retry?: boolean }} context Provider-neutral response context.
 * @returns {Promise<{ retry?: boolean, reason?: string }>} Bounded retry guidance.
 */
export async function handle(context) {
  if (context.retry === true) return {};

  const prompt = typeof context.prompt === "string" ? context.prompt : "";
  const response =
    typeof context.response === "string" ? context.response.trim() : "";
  const issues = [];

  if (response === "") {
    issues.push("the provider did not expose the draft, so perform one presentation pass");
  }
  if (
    response !== "" &&
    /\p{Extended_Pictographic}/u.test(response) &&
    !/\b(?:emoji|emojis)\b/iu.test(prompt)
  ) {
    issues.push("remove unrequested emojis");
  }
  if (response.length > 2400) {
    issues.push("make the response more concise without dropping required information");
  }
  if (repeatedLines(response)) {
    issues.push("remove repeated statements");
  }

  if (issues.length === 0) return {};
  return {
    retry: true,
    reason: `Revise the final response once: ${issues.join("; ")}. Preserve technical accuracy, required information, the user's requested format, and their apparent technical level. Prefer a diagram only for relationships or flows, otherwise a table for repeated comparisons, a list for grouped steps, or prose when structure adds no value.`,
  };
}
