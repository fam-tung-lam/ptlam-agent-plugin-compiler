const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RESOURCE_HREF_TAGS = new Set(["image", "link", "script", "use"]);
const RAW_TEXT_ELEMENTS = new Set(["script", "style"]);

interface HtmlRootNode {
  readonly children: HtmlNode[];
}

interface HtmlElementNode {
  readonly kind: "element";
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: HtmlNode[];
}

interface HtmlTextNode {
  readonly kind: "text";
  readonly value: string;
}

type HtmlParentNode = HtmlRootNode | HtmlElementNode;
type HtmlNode = HtmlElementNode | HtmlTextNode;

export interface HtmlElementInspection {
  readonly tagName: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface HtmlStepperInspection {
  readonly name: string;
  readonly elements: readonly HtmlElementInspection[];
  readonly noScriptText: string;
  readonly noScriptItemCount: number;
  readonly stepCountText: string;
}

export interface HtmlSvgInspection {
  readonly role: string;
  readonly ariaLabel: string;
  readonly labelledBy: readonly string[];
}

export interface HtmlScriptInspection {
  readonly source: string;
  readonly type: string;
}

export interface HtmlDocumentInspection {
  readonly tags: Readonly<Record<string, number>>;
  readonly elements: readonly HtmlElementInspection[];
  readonly ids: readonly string[];
  readonly hrefs: readonly string[];
  readonly idText: Readonly<Record<string, string>>;
  readonly runtimeAssets: readonly string[];
  readonly steppers: readonly HtmlStepperInspection[];
  readonly svg: readonly HtmlSvgInspection[];
  readonly documentTitleText: string;
  readonly h1Text: string;
  readonly scripts: readonly HtmlScriptInspection[];
}

/** Inspect the HTML structures used by visualization policy checks. */
export function inspectHtmlDocument(source: string): HtmlDocumentInspection {
  const root = parseHtml(source);
  const elementNodes = collectElements(root);
  const elements = elementNodes.map(toElementInspection);
  const tags: Record<string, number> = {};
  const ids: string[] = [];
  const hrefs: string[] = [];
  const idText: Record<string, string> = {};
  const runtimeAssets: string[] = [];
  const svg: HtmlSvgInspection[] = [];

  for (const element of elementNodes) {
    tags[element.tagName] = (tags[element.tagName] ?? 0) + 1;

    const elementId = element.attributes["id"]?.trim();
    if (elementId) {
      ids.push(elementId);
      idText[elementId] = textContent(element);
    }

    const href = element.attributes["href"];
    if (href) hrefs.push(href);

    runtimeAssets.push(...findElementRuntimeAssets(element));

    if (element.tagName === "svg") {
      svg.push(
        Object.freeze({
          role: element.attributes["role"]?.trim() ?? "",
          ariaLabel: element.attributes["aria-label"]?.trim() ?? "",
          labelledBy: Object.freeze(
            (element.attributes["aria-labelledby"] ?? "")
              .split(/\s+/)
              .filter(Boolean),
          ),
        }),
      );
    }
  }

  const head = elementNodes.find((element) => element.tagName === "head");
  const title = head
    ? collectElements(head).find((element) => element.tagName === "title")
    : undefined;
  const h1Text = elementNodes
    .filter((element) => element.tagName === "h1")
    .map(textContent)
    .join(" ");

  return Object.freeze({
    tags: Object.freeze(tags),
    elements: Object.freeze(elements),
    ids: Object.freeze(ids),
    hrefs: Object.freeze(hrefs),
    idText: Object.freeze(idText),
    runtimeAssets: Object.freeze(runtimeAssets),
    steppers: Object.freeze(findSteppers(elementNodes)),
    svg: Object.freeze(svg),
    documentTitleText: title ? textContent(title) : "",
    h1Text,
    scripts: Object.freeze(
      elementNodes
        .filter((element) => element.tagName === "script")
        .map((element) =>
          Object.freeze({
            source: textContent(element),
            type: element.attributes["type"]?.trim().toLowerCase() ?? "",
          }),
        ),
    ),
  });
}

function parseHtml(source: string): HtmlRootNode {
  const root: HtmlRootNode = { children: [] };
  const parents: HtmlParentNode[] = [root];
  let cursor = 0;

  while (cursor < source.length) {
    if (source[cursor] !== "<") {
      const nextTag = source.indexOf("<", cursor);
      const end = nextTag === -1 ? source.length : nextTag;
      appendText(currentParent(parents), source.slice(cursor, end));
      cursor = end;
      continue;
    }

    if (source.startsWith("<!--", cursor)) {
      const commentEnd = source.indexOf("-->", cursor + 4);
      cursor = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    if (/^<![^-]/.test(source.slice(cursor, cursor + 4))) {
      const declarationEnd = findTagEnd(source, cursor + 2);
      cursor = declarationEnd === -1 ? source.length : declarationEnd + 1;
      continue;
    }

    if (source.startsWith("</", cursor)) {
      const end = findTagEnd(source, cursor + 2);
      if (end === -1) break;
      const match = source.slice(cursor + 2, end).match(/^\s*([^\s>]+)/);
      if (match?.[1]) closeElement(parents, match[1].toLowerCase());
      cursor = end + 1;
      continue;
    }

    const end = findTagEnd(source, cursor + 1);
    if (end === -1) {
      appendText(currentParent(parents), source.slice(cursor));
      break;
    }

    const token = source.slice(cursor + 1, end);
    const tagMatch = token.match(/^\s*([^\s/>]+)/);
    if (!tagMatch?.[1]) {
      appendText(currentParent(parents), "<");
      cursor += 1;
      continue;
    }

    const tagName = tagMatch[1].toLowerCase();
    const attributeSource = token.slice(tagMatch[0].length);
    const element: HtmlElementNode = {
      kind: "element",
      tagName,
      attributes: Object.freeze(parseAttributes(attributeSource)),
      children: [],
    };
    currentParent(parents).children.push(element);
    cursor = end + 1;

    if (RAW_TEXT_ELEMENTS.has(tagName)) {
      const closingTag = findRawTextClosingTag(source, cursor, tagName);
      const rawEnd = closingTag?.start ?? source.length;
      appendText(element, source.slice(cursor, rawEnd), false);
      cursor = closingTag?.end ?? source.length;
      continue;
    }

    if (!VOID_ELEMENTS.has(tagName) && !/\/\s*$/.test(token)) {
      parents.push(element);
    }
  }

  return root;
}

function findTagEnd(source: string, start: number): number {
  let quote: '"' | "'" | undefined;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if ((character === '"' || character === "'") && quote === undefined) {
      quote = character;
    } else if (character === quote) {
      quote = undefined;
    } else if (character === ">" && quote === undefined) {
      return index;
    }
  }
  return -1;
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (!name || name === "/") continue;
    attributes[name] = decodeHtmlEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }

  return attributes;
}

function findRawTextClosingTag(
  source: string,
  start: number,
  tagName: string,
): { readonly start: number; readonly end: number } | undefined {
  const pattern = new RegExp(`</${tagName}\\s*>`, "gi");
  pattern.lastIndex = start;
  const match = pattern.exec(source);
  return match
    ? { start: match.index, end: match.index + match[0].length }
    : undefined;
}

function closeElement(parents: HtmlParentNode[], tagName: string): void {
  for (let index = parents.length - 1; index > 0; index -= 1) {
    const parent = parents[index];
    if (parent && "tagName" in parent && parent.tagName === tagName) {
      parents.length = index;
      return;
    }
  }
}

function currentParent(parents: readonly HtmlParentNode[]): HtmlParentNode {
  const parent = parents.at(-1);
  if (!parent) throw new Error("HTML parser lost its root node");
  return parent;
}

function appendText(
  parent: HtmlParentNode,
  value: string,
  decode = true,
): void {
  if (!value) return;
  parent.children.push({
    kind: "text",
    value: decode ? decodeHtmlEntities(value) : value,
  });
}

function collectElements(parent: HtmlParentNode): HtmlElementNode[] {
  const elements: HtmlElementNode[] = [];
  for (const child of parent.children) {
    if (child.kind === "text") continue;
    elements.push(child, ...collectElements(child));
  }
  return elements;
}

function textContent(parent: HtmlParentNode): string {
  return parent.children
    .map((child) => (child.kind === "text" ? child.value : textContent(child)))
    .join("");
}

function toElementInspection(element: HtmlElementNode): HtmlElementInspection {
  return Object.freeze({
    tagName: element.tagName,
    attributes: element.attributes,
  });
}

function findSteppers(
  elements: readonly HtmlElementNode[],
): HtmlStepperInspection[] {
  return elements
    .filter((element) => "data-stepper" in element.attributes)
    .map((stepper, index) => {
      const descendants = collectStepperOwnedElements(stepper);
      const noScript = descendants.find(
        (element) => element.tagName === "noscript",
      );
      const count = descendants.find(
        (element) => "data-step-count" in element.attributes,
      );

      return Object.freeze({
        name: stepper.attributes["data-stepper"]?.trim() || `#${index + 1}`,
        elements: Object.freeze(descendants.map(toElementInspection)),
        noScriptText: noScript ? textContent(noScript) : "",
        noScriptItemCount: noScript
          ? collectElements(noScript).filter(
              (element) => element.tagName === "li",
            ).length
          : 0,
        stepCountText: count ? textContent(count) : "",
      });
    });
}

function collectStepperOwnedElements(
  parent: HtmlParentNode,
): HtmlElementNode[] {
  const elements: HtmlElementNode[] = [];
  for (const child of parent.children) {
    if (child.kind === "text") continue;
    if ("data-stepper" in child.attributes) continue;
    elements.push(child, ...collectStepperOwnedElements(child));
  }
  return elements;
}

function findElementRuntimeAssets(element: HtmlElementNode): string[] {
  const assets: string[] = [];
  addRuntimeAsset(assets, element.attributes["src"]);

  if (RESOURCE_HREF_TAGS.has(element.tagName)) {
    addRuntimeAsset(assets, element.attributes["href"]);
  }
  if (element.tagName === "video") {
    addRuntimeAsset(assets, element.attributes["poster"]);
  }
  if (element.tagName === "object") {
    addRuntimeAsset(assets, element.attributes["data"]);
  }

  assets.push(...findSrcsetAssets(element.attributes["srcset"] ?? ""));
  assets.push(...findCssAssets(element.attributes["style"] ?? ""));
  if (element.tagName === "style") {
    assets.push(...findCssAssets(textContent(element)));
  }

  return assets;
}

function addRuntimeAsset(
  assets: string[],
  candidate: string | undefined,
): void {
  if (candidate && !/^(?:#|data:)/i.test(candidate)) assets.push(candidate);
}

function findCssAssets(source: string): string[] {
  const assets: string[] = [];
  for (const match of source.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gis)) {
    const value = match[2]?.trim();
    if (value && !/^(?:#|data:)/i.test(value)) {
      assets.push(`css-url:${value}`);
    }
  }
  for (const match of source.matchAll(
    /@import\s+(?:url\(\s*)?['"]?([^'"\s);]+)/gi,
  )) {
    const value = match[1]?.trim();
    if (value && !/^(?:#|data:)/i.test(value)) {
      assets.push(`css-import:${value}`);
    }
  }
  return assets;
}

function findSrcsetAssets(source: string): string[] {
  const assets: string[] = [];
  for (const candidate of source.trim().split(/,\s+(?=\S)/)) {
    if (!candidate) continue;
    const value = candidate.split(/\s+/, 1)[0];
    if (value && !/^data:/i.test(value)) assets.push(`srcset:${value}`);
  }
  return assets;
}

function decodeHtmlEntities(value: string): string {
  const named: Readonly<Record<string, string>> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: "\u00a0",
    quot: '"',
  };

  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
    (entity, decimal: string, hexadecimal: string, name: string) => {
      const codePoint = decimal
        ? Number.parseInt(decimal, 10)
        : hexadecimal
          ? Number.parseInt(hexadecimal, 16)
          : undefined;
      if (codePoint !== undefined && Number.isSafeInteger(codePoint)) {
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return entity;
        }
      }
      return named[name?.toLowerCase()] ?? entity;
    },
  );
}
