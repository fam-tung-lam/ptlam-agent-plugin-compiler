/**
 * Encode a JSON value using the compiler's stable human-readable layout.
 *
 * @param value - JSON-serializable value to render.
 * @returns UTF-8 bytes with two-space indentation and a trailing newline.
 * @throws `TypeError` When `JSON.stringify` rejects the value, for example due
 * to a cycle or unsupported `BigInt`.
 */
export function renderJson(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}
