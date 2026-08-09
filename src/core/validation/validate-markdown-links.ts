import path from "node:path";

import type { Definition, Image, Link, RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

interface ValidateMarkdownLinksRequest {
  readonly source: string;
  readonly markdownPath: string;
  readonly sourceFiles: ReadonlySet<string>;
  readonly skillPath: string;
}

type DestinationNode = Definition | Image | Link;

/** Validate real Markdown destinations against one isolated logical skill tree. */
export function validateMarkdownLinks({
  source,
  markdownPath,
  sourceFiles,
  skillPath,
}: ValidateMarkdownLinksRequest): string[] {
  const errors: string[] = [];
  for (const target of linkTargets(source)) {
    if (target.startsWith("#")) continue;

    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/u.exec(target)?.[1];
    if (scheme !== undefined) {
      if (scheme.toLowerCase() !== "https") {
        errors.push(
          `${skillPath}/${markdownPath}: unsupported link scheme in "${target}"; only https links are allowed externally`,
        );
      } else if (!isValidHttpsUrl(target)) {
        errors.push(
          `${skillPath}/${markdownPath}: invalid HTTPS link "${target}"`,
        );
      }
      continue;
    }

    const targetWithoutFragment = target.split(/[?#]/u, 1)[0] ?? "";
    if (targetWithoutFragment === "") continue;

    let decodedTarget: string;
    try {
      decodedTarget = decodeURIComponent(targetWithoutFragment);
    } catch {
      errors.push(
        `${skillPath}/${markdownPath}: invalid encoded link "${target}"`,
      );
      continue;
    }
    if (decodedTarget.startsWith("/") || decodedTarget.startsWith("~")) {
      errors.push(
        `${skillPath}/${markdownPath}: local link must be skill-relative: "${target}"`,
      );
      continue;
    }

    const resolved = path.posix.normalize(
      path.posix.join(path.posix.dirname(markdownPath), decodedTarget),
    );
    if (resolved === ".." || resolved.startsWith("../")) {
      errors.push(
        `${skillPath}/${markdownPath}: local link escapes the skill: "${target}"`,
      );
    } else if (!sourceFiles.has(resolved)) {
      errors.push(
        `${skillPath}/${markdownPath}: local link target does not exist: "${target}"`,
      );
    }
  }
  return errors;
}

function isValidHttpsUrl(target: string): boolean {
  try {
    const url = new URL(target);
    return url.protocol === "https:" && url.hostname !== "";
  } catch {
    return false;
  }
}

function linkTargets(source: string): string[] {
  const targets: string[] = [];
  walk(fromMarkdown(source).children, targets);
  return targets;
}

function walk(nodes: readonly RootContent[], targets: string[]): void {
  for (const node of nodes) {
    if (hasDestination(node)) targets.push(node.url);
    if ("children" in node) walk(node.children, targets);
  }
}

function hasDestination(node: RootContent): node is DestinationNode {
  return (
    node.type === "definition" || node.type === "image" || node.type === "link"
  );
}
