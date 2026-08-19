/** Record the universal event without changing its provider-native result. */
export async function handle(context) {
  // Hook stdout is reserved for provider output, so examples log to stderr.
  console.error(`[observability] event: ${context.event ?? "unknown"}`);
  return {};
}
