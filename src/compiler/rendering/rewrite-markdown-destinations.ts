import path from "node:path";

import type { Definition, Image, Link, RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

type DestinationNode = Definition | Image | Link;

interface DestinationEdit {
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

interface RewriteMarkdownDestinationsRequest {
  /** Markdown source whose local destinations may need a new base. */
  readonly source: string;
  /** Skill-relative location of the source before composition. */
  readonly markdownPath: string;
  /** Markdown resources replaced by the composed root document. */
  readonly inlinedMarkdownPaths: ReadonlySet<string>;
}

/**
 * Rebase local destinations from one authored document to generated `SKILL.md`.
 *
 * Root-document links are changed only when their target is itself inlined.
 * Query strings and fragments are copied after the rebased path.
 */
export function rewriteMarkdownDestinations({
  source,
  markdownPath,
  inlinedMarkdownPaths,
}: RewriteMarkdownDestinationsRequest): string {
  const edits: DestinationEdit[] = [];
  for (const node of destinationNodes(source)) {
    const value = rewrittenDestination(
      node.url,
      markdownPath,
      inlinedMarkdownPaths,
    );
    if (value === null || value === node.url) continue;
    const span = destinationSpan(source, node);
    if (span !== null) edits.push({ ...span, value });
  }

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) =>
        `${result.slice(0, edit.start)}${edit.value}${result.slice(edit.end)}`,
      source,
    );
}

function rewrittenDestination(
  destination: string,
  markdownPath: string,
  inlinedMarkdownPaths: ReadonlySet<string>,
): string | null {
  if (destination.startsWith("#")) return null;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(destination)) return null;

  const suffixIndex = destination.search(/[?#]/u);
  const encodedPath =
    suffixIndex === -1 ? destination : destination.slice(0, suffixIndex);
  if (encodedPath === "") return null;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
  if (decodedPath.startsWith("/") || decodedPath.startsWith("~")) return null;

  const resolvedPath = path.posix.normalize(
    path.posix.join(path.posix.dirname(markdownPath), decodedPath),
  );
  if (resolvedPath === ".." || resolvedPath.startsWith("../")) return null;
  if (markdownPath === "SKILL.md" && !inlinedMarkdownPaths.has(resolvedPath)) {
    return null;
  }

  const rebasedPath = inlinedMarkdownPaths.has(resolvedPath)
    ? "SKILL.md"
    : resolvedPath;
  const suffix = suffixIndex === -1 ? "" : destination.slice(suffixIndex);
  return `${encodePath(rebasedPath)}${suffix}`;
}

function encodePath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function destinationNodes(source: string): DestinationNode[] {
  const nodes: DestinationNode[] = [];
  walk(fromMarkdown(source).children, nodes);
  return nodes;
}

function walk(
  nodes: readonly RootContent[],
  destinations: DestinationNode[],
): void {
  for (const node of nodes) {
    if (hasDestination(node)) destinations.push(node);
    if ("children" in node) walk(node.children, destinations);
  }
}

function hasDestination(node: RootContent): node is DestinationNode {
  return (
    node.type === "definition" || node.type === "image" || node.type === "link"
  );
}

function destinationSpan(
  source: string,
  node: DestinationNode,
): Pick<DestinationEdit, "start" | "end"> | null {
  const nodeStart = node.position?.start.offset;
  const nodeEnd = node.position?.end.offset;
  if (nodeStart === undefined || nodeEnd === undefined) return null;

  const destinationStart =
    node.type === "definition"
      ? definitionDestinationStart(source, nodeStart, nodeEnd)
      : inlineDestinationStart(source, nodeStart, nodeEnd);
  if (destinationStart === null) return null;
  return destinationEnd(source, destinationStart, nodeEnd);
}

function definitionDestinationStart(
  source: string,
  nodeStart: number,
  nodeEnd: number,
): number | null {
  const delimiter = source.indexOf("]:", nodeStart);
  if (delimiter === -1 || delimiter >= nodeEnd) return null;
  return skipWhitespace(source, delimiter + 2, nodeEnd);
}

function inlineDestinationStart(
  source: string,
  nodeStart: number,
  nodeEnd: number,
): number | null {
  const labelStart = source.indexOf("[", nodeStart);
  if (labelStart === -1 || labelStart >= nodeEnd) return null;
  let depth = 1;
  for (let index = labelStart + 1; index < nodeEnd; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === "[") depth += 1;
    if (source[index] !== "]") continue;
    depth -= 1;
    if (depth !== 0) continue;
    if (source[index + 1] !== "(") return null;
    return skipWhitespace(source, index + 2, nodeEnd);
  }
  return null;
}

function skipWhitespace(source: string, start: number, end: number): number {
  let index = start;
  while (index < end && /\s/u.test(source[index] ?? "")) index += 1;
  return index;
}

function destinationEnd(
  source: string,
  start: number,
  nodeEnd: number,
): Pick<DestinationEdit, "start" | "end"> | null {
  if (source[start] === "<") {
    for (let index = start + 1; index < nodeEnd; index += 1) {
      if (source[index] === "\\") {
        index += 1;
      } else if (source[index] === ">") {
        return { start: start + 1, end: index };
      }
    }
    return null;
  }

  let parentheses = 0;
  for (let index = start; index < nodeEnd; index += 1) {
    const character = source[index];
    if (character === "\\") {
      index += 1;
      continue;
    }
    if (/\s/u.test(character ?? "")) return { start, end: index };
    if (character === "(") parentheses += 1;
    if (character !== ")") continue;
    if (parentheses === 0) return { start, end: index };
    parentheses -= 1;
  }
  return start < nodeEnd ? { start, end: nodeEnd } : null;
}
