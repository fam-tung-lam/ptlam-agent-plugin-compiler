/** Log each request without changing it. */
export async function handle(context) {
  // Hook stdout is reserved for provider output, so examples log to stderr.
  console.error(`[simple-logger] request: ${context.prompt ?? ""}`);
  return {};
}
