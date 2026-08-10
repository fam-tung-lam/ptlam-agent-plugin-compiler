/** Reports all independent authored-source errors found by pure validation. */
export class PluginValidationError extends Error {
  override readonly name = "PluginValidationError";
  readonly errors: readonly string[];

  constructor(errors: Iterable<string>) {
    const normalizedErrors = Object.freeze(
      [...new Set(errors)].filter(Boolean),
    );
    super(
      `Plugin validation failed with ${normalizedErrors.length} error${normalizedErrors.length === 1 ? "" : "s"}:\n${normalizedErrors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    this.errors = normalizedErrors;
  }
}
