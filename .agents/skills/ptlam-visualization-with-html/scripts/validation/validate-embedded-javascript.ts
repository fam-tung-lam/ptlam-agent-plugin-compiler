import { spawnSync } from "node:child_process";
import vm from "node:vm";

import type { HtmlScriptInspection } from "./inspect-html-document.ts";

const CLASSIC_JAVASCRIPT_TYPES = new Set([
  "",
  "application/javascript",
  "text/javascript",
]);

/** Return stable syntax diagnostics for inline classic and module JavaScript. */
export function validateEmbeddedJavaScript(
  scripts: readonly HtmlScriptInspection[],
): readonly string[] {
  const errors: string[] = [];

  scripts.forEach((script, index) => {
    if (!script.source.trim()) return;
    if (script.type === "module") {
      const error = validateModuleJavaScript(script.source, index);
      if (error) errors.push(error);
      return;
    }
    if (!CLASSIC_JAVASCRIPT_TYPES.has(script.type)) return;

    try {
      new vm.Script(script.source, {
        filename: `inline-script-${index + 1}.js`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(
        `JavaScript block ${index + 1} does not parse: ${firstLine(message)}`,
      );
    }
  });

  return Object.freeze(errors);
}

function validateModuleJavaScript(
  source: string,
  index: number,
): string | undefined {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--check"],
    {
      encoding: "utf8",
      input: source,
    },
  );
  if (result.error) {
    return `JavaScript module block ${index + 1} could not be checked: ${firstLine(result.error.message)}`;
  }
  if (result.status === 0) return undefined;

  return `JavaScript module block ${index + 1} does not parse: ${syntaxMessage(result.stderr)}`;
}

function syntaxMessage(stderr: string): string {
  const syntaxError = stderr.match(/^SyntaxError:\s*(.+)$/m)?.[1]?.trim();
  return syntaxError || firstLine(stderr) || "unknown syntax error";
}

function firstLine(message: string): string {
  return message.split(/\r?\n/, 1)[0]?.trim() || "unknown syntax error";
}
