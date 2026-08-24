import { createHash } from "node:crypto";
import path from "node:path";

import type {
  Definition,
  Image,
  ImageReference,
  Link,
  LinkReference,
  RootContent,
} from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

type DestinationNode = Definition | Image | Link;
type ReferenceNode = ImageReference | LinkReference;

interface DestinationEdit {
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

interface RewrittenDestination {
  readonly authoredPath: string;
  readonly generatedPath: string;
}

interface RewriteMarkdownDestinationsRequest {
  /** Markdown source whose local destinations may need a new base. */
  readonly source: string;
  /** Skill-relative location of the source before composition. */
  readonly markdownPath: string;
  /** Markdown resources replaced by the composed root document. */
  readonly inlinedMarkdownPaths: ReadonlySet<string>;
  /** Original document identity used to isolate reference definitions after merging. */
  readonly referenceNamespace?: string;
}

/**
 * Rebase local destinations from one authored document to generated `SKILL.md`.
 *
 * Root-document links are changed only when their target is itself inlined.
 * Authored query strings and fragments are copied byte-for-byte after the path.
 */
export function rewriteMarkdownDestinations({
  source,
  markdownPath,
  inlinedMarkdownPaths,
  referenceNamespace,
}: RewriteMarkdownDestinationsRequest): string {
  const nodes = markdownNodes(source);
  const edits: DestinationEdit[] = [];
  for (const node of nodes) {
    if (!hasDestination(node)) continue;
    const rewritten = rewrittenDestination(
      node.url,
      markdownPath,
      inlinedMarkdownPaths,
    );
    if (rewritten === null) continue;
    const span = destinationSpan(source, node);
    if (span === null) {
      throw new Error(
        `${markdownPath}: could not locate parsed Markdown destination "${node.url}"`,
      );
    }
    const rawDestination = source.slice(span.start, span.end);
    const suffixStart = rawDestinationSuffixStart(
      rawDestination,
      rewritten.authoredPath,
      source[span.start - 1] === "<",
    );
    edits.push({
      ...span,
      value: `${rewritten.generatedPath}${rawDestination.slice(suffixStart)}`,
    });
  }
  if (referenceNamespace !== undefined) {
    edits.push(...referenceNamespaceEdits(source, nodes, referenceNamespace));
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
): RewrittenDestination | null {
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
  return {
    authoredPath: encodedPath,
    generatedPath: encodePath(rebasedPath),
  };
}

function encodePath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function markdownNodes(source: string): RootContent[] {
  const nodes: RootContent[] = [];
  walk(fromMarkdown(source).children, nodes);
  return nodes;
}

function walk(nodes: readonly RootContent[], result: RootContent[]): void {
  for (const node of nodes) {
    result.push(node);
    if ("children" in node) walk(node.children, result);
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
      : inlineDestinationStart(source, nodeStart, nodeEnd, node.type);
  if (destinationStart === null) return null;
  return destinationEnd(source, destinationStart, nodeEnd);
}

function definitionDestinationStart(
  source: string,
  nodeStart: number,
  nodeEnd: number,
): number | null {
  const label = definitionLabelSpan(source, nodeStart, nodeEnd);
  return label === null ? null : skipWhitespace(source, label.end + 2, nodeEnd);
}

function inlineDestinationStart(
  source: string,
  nodeStart: number,
  nodeEnd: number,
  nodeType: Link["type"] | Image["type"],
): number | null {
  const candidates = inlineDestinationCandidates(source, nodeStart, nodeEnd);
  for (const candidate of candidates) {
    const start = skipWhitespace(source, candidate + 2, nodeEnd);
    const span = destinationEnd(source, start, nodeEnd);
    if (span === null) continue;
    if (isStructuralDestination(source, nodeStart, nodeEnd, span, nodeType)) {
      return start;
    }
  }
  return null;
}

function isStructuralDestination(
  source: string,
  nodeStart: number,
  nodeEnd: number,
  span: Pick<DestinationEdit, "start" | "end">,
  nodeType: Link["type"] | Image["type"],
): boolean {
  const nodeSource = source.slice(nodeStart, nodeEnd);
  const probe = destinationProbe(nodeSource);
  const relativeStart = span.start - nodeStart;
  const relativeEnd = span.end - nodeStart;
  const probedSource = `${nodeSource.slice(0, relativeStart)}${probe}${nodeSource.slice(relativeEnd)}`;
  return markdownNodes(probedSource).some(
    (node) => node.type === nodeType && node.url === probe,
  );
}

function destinationProbe(source: string): string {
  const destinations = new Set(
    markdownNodes(source)
      .filter(hasDestination)
      .map((node) => node.url),
  );
  for (let index = 0; ; index += 1) {
    const probe = `plugin-compiler-destination-probe-${index}`;
    if (!destinations.has(probe)) return probe;
  }
}

function inlineDestinationCandidates(
  source: string,
  nodeStart: number,
  nodeEnd: number,
): number[] {
  const candidates: number[] = [];
  for (let index = nodeStart; index + 1 < nodeEnd; index += 1) {
    if (
      source[index] === "]" &&
      source[index + 1] === "(" &&
      !isEscaped(source, index)
    ) {
      candidates.push(index);
    }
  }
  return candidates;
}

function parsedDestination(rawDestination: string, enclosed: boolean): string {
  const destination = enclosed ? `<${rawDestination}>` : rawDestination;
  const document = fromMarkdown(`[label](${destination})`);
  const paragraph = document.children[0];
  const node = paragraph?.type === "paragraph" ? paragraph.children[0] : null;
  return node?.type === "link" ? node.url : "";
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

function rawDestinationSuffixStart(
  rawDestination: string,
  authoredPath: string,
  enclosed: boolean,
): number {
  const candidates: number[] = [];
  for (let index = 0; index < rawDestination.length; index += 1) {
    if (/[?#\\&]/u.test(rawDestination[index] ?? "")) candidates.push(index);
  }
  candidates.push(rawDestination.length);
  for (const index of candidates) {
    if (
      parsedDestination(rawDestination.slice(0, index), enclosed) ===
      authoredPath
    ) {
      return index;
    }
  }
  throw new Error(
    `could not map authored Markdown destination path "${authoredPath}" to its raw spelling`,
  );
}

function referenceNamespaceEdits(
  source: string,
  nodes: readonly RootContent[],
  namespace: string,
): DestinationEdit[] {
  const qualifiedLabels = new Map<string, string>();
  const edits: DestinationEdit[] = [];
  for (const node of nodes) {
    if (node.type !== "definition") continue;
    const span = positionedDefinitionLabelSpan(source, node);
    if (span === null) {
      throw new Error(
        `${namespace}: could not locate parsed Markdown definition "${node.identifier}"`,
      );
    }
    const qualifiedLabel =
      qualifiedLabels.get(node.identifier) ??
      qualifiedReferenceLabel(namespace, node.identifier);
    qualifiedLabels.set(node.identifier, qualifiedLabel);
    edits.push({ ...span, value: qualifiedLabel });
  }
  for (const node of nodes) {
    if (!isReference(node)) continue;
    const qualifiedLabel = qualifiedLabels.get(node.identifier);
    if (qualifiedLabel === undefined) {
      throw new Error(
        `${namespace}: could not match parsed Markdown reference "${node.identifier}" to a definition`,
      );
    }
    const edit = referenceLabelEdit(source, node, qualifiedLabel);
    if (edit === null) {
      throw new Error(
        `${namespace}: could not locate parsed Markdown reference "${node.identifier}"`,
      );
    }
    edits.push(edit);
  }
  return edits;
}

function qualifiedReferenceLabel(
  namespace: string,
  identifier: string,
): string {
  const digest = createHash("sha256")
    .update(namespace)
    .update("\0")
    .update(identifier)
    .digest("hex");
  return `plugin-compiler-${digest}`;
}

function positionedDefinitionLabelSpan(
  source: string,
  node: Definition,
): Pick<DestinationEdit, "start" | "end"> | null {
  const nodeStart = node.position?.start.offset;
  const nodeEnd = node.position?.end.offset;
  if (nodeStart === undefined || nodeEnd === undefined) return null;
  return definitionLabelSpan(source, nodeStart, nodeEnd);
}

function definitionLabelSpan(
  source: string,
  nodeStart: number,
  nodeEnd: number,
): Pick<DestinationEdit, "start" | "end"> | null {
  if (source[nodeStart] !== "[") return null;
  for (let index = nodeStart + 1; index + 1 < nodeEnd; index += 1) {
    if (
      source[index] === "]" &&
      source[index + 1] === ":" &&
      !isEscaped(source, index)
    ) {
      return { start: nodeStart + 1, end: index };
    }
  }
  return null;
}

function isReference(node: RootContent): node is ReferenceNode {
  return node.type === "imageReference" || node.type === "linkReference";
}

function referenceLabelEdit(
  source: string,
  node: ReferenceNode,
  qualifiedLabel: string,
): DestinationEdit | null {
  const nodeStart = node.position?.start.offset;
  const nodeEnd = node.position?.end.offset;
  if (nodeStart === undefined || nodeEnd === undefined) return null;
  if (node.referenceType === "shortcut") {
    return { start: nodeEnd, end: nodeEnd, value: `[${qualifiedLabel}]` };
  }
  if (node.referenceType === "collapsed") {
    return { start: nodeEnd - 1, end: nodeEnd - 1, value: qualifiedLabel };
  }
  for (let index = nodeEnd - 2; index >= nodeStart; index -= 1) {
    if (source[index] === "[" && !isEscaped(source, index)) {
      return { start: index + 1, end: nodeEnd - 1, value: qualifiedLabel };
    }
  }
  return null;
}

function isEscaped(source: string, offset: number): boolean {
  let backslashes = 0;
  for (
    let index = offset - 1;
    index >= 0 && source[index] === "\\";
    index -= 1
  ) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}
