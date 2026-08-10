import {
  type HtmlDocumentInspection,
  type HtmlElementInspection,
  type HtmlStepperInspection,
  inspectHtmlDocument,
} from "./inspect-html-document.ts";
import { validateEmbeddedJavaScript } from "./validate-embedded-javascript.ts";

const STEPPER_ACTIONS = ["next", "back", "play", "reset"] as const;

export interface HtmlValidationResult {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** Validate one portable HTML visualization through its document contract. */
export function validateHtmlDocument(source: string): HtmlValidationResult {
  const document = inspectHtmlDocument(source);
  const errors: string[] = [];

  validateDocumentShell(source, document, errors);
  validateReferences(document, errors);
  validateSvgAccessibility(document, errors);
  validateResponsiveCss(source, errors);
  validateSteppers(document.steppers, errors);
  validateC4Zoom(document, errors);
  errors.push(...validateEmbeddedJavaScript(document.scripts));

  return Object.freeze({
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
  });
}

function validateDocumentShell(
  source: string,
  document: HtmlDocumentInspection,
  errors: string[],
): void {
  if (!/^\s*<!doctype\s+html>/i.test(source)) {
    errors.push("missing HTML5 doctype");
  }
  if (!hasAttribute(document.elements, "html", "lang")) {
    errors.push("html element needs a lang attribute");
  }
  if (!hasAttribute(document.elements, "meta", "name", "viewport")) {
    errors.push("missing viewport meta tag");
  }
  if (!document.documentTitleText.trim()) {
    errors.push("missing non-empty title");
  }

  const mainCount = document.tags["main"] ?? 0;
  if (mainCount !== 1) {
    errors.push(`expected exactly one main element, found ${mainCount}`);
  }

  const h1Count = document.tags["h1"] ?? 0;
  if (h1Count !== 1 || !document.h1Text.trim()) {
    errors.push("expected exactly one non-empty h1");
  }

  const hasSkipLink = document.elements.some(
    ({ tagName, attributes }) =>
      tagName === "a" &&
      attributes["href"]?.startsWith("#") === true &&
      attributes["class"]?.includes("skip") === true,
  );
  if (!hasSkipLink) errors.push("missing visible-on-focus skip link");
}

function validateReferences(
  document: HtmlDocumentInspection,
  errors: string[],
): void {
  const idCounts = new Map<string, number>();
  for (const id of document.ids) {
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  const duplicateIds = [...idCounts]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  if (duplicateIds.length > 0) {
    errors.push(`duplicate ids: ${duplicateIds.join(", ")}`);
  }

  const ids = new Set(document.ids);
  const missingTargets = [...new Set(document.hrefs)]
    .filter((href) => href.startsWith("#") && href !== "#")
    .map((href) => href.slice(1))
    .filter((target) => !ids.has(target))
    .sort();
  if (missingTargets.length > 0) {
    errors.push(`missing internal link targets: ${missingTargets.join(", ")}`);
  }

  const runtimeAssets = [...new Set(document.runtimeAssets)].sort();
  if (runtimeAssets.length > 0) {
    errors.push(`runtime assets must be embedded: ${runtimeAssets.join(", ")}`);
  }
}

function validateSvgAccessibility(
  document: HtmlDocumentInspection,
  errors: string[],
): void {
  const accessibleCount = document.svg.filter((svg) => {
    if (svg.role !== "img") return false;
    if (svg.ariaLabel) return true;
    return (
      svg.labelledBy.length > 0 &&
      svg.labelledBy.every((id) => document.idText[id]?.trim())
    );
  }).length;

  if (accessibleCount !== document.svg.length) {
    errors.push(
      "all SVGs need role=img plus a non-empty aria-label or resolvable " +
        `aria-labelledby (${accessibleCount}/${document.svg.length})`,
    );
  }
}

function validateResponsiveCss(source: string, errors: string[]): void {
  const compact = source.toLowerCase().replace(/\s+/g, "");
  if (!compact.includes("prefers-reduced-motion:reduce")) {
    errors.push("missing prefers-reduced-motion handling");
  }
  if (!source.includes(":focus-visible")) {
    errors.push("missing explicit keyboard focus style");
  }
}

function validateSteppers(
  steppers: readonly HtmlStepperInspection[],
  errors: string[],
): void {
  for (const stepper of steppers) {
    for (const action of STEPPER_ACTIONS) {
      if (!hasAttribute(stepper.elements, "button", "data-action", action)) {
        errors.push(`stepper "${stepper.name}" missing ${action} button`);
      }
    }

    if (!hasAttribute(stepper.elements, undefined, "data-step-caption")) {
      errors.push(`stepper "${stepper.name}" missing synchronized caption`);
    }
    if (!hasAttribute(stepper.elements, undefined, "data-step-count")) {
      errors.push(`stepper "${stepper.name}" missing step counter`);
    }

    const noScript = stepper.elements.some(
      ({ tagName }) => tagName === "noscript",
    );
    if (!noScript) {
      errors.push(
        `stepper "${stepper.name}" missing no-JavaScript step summary`,
      );
    } else {
      validateNoScriptSummary(stepper, errors);
    }

    const playButton = stepper.elements.find(
      ({ tagName, attributes }) =>
        tagName === "button" && attributes["data-action"] === "play",
    );
    if (!playButton || !("aria-pressed" in playButton.attributes)) {
      errors.push(
        `stepper "${stepper.name}" play/pause button needs aria-pressed`,
      );
    }
  }
}

function validateNoScriptSummary(
  stepper: HtmlStepperInspection,
  errors: string[],
): void {
  const summaryText = stepper.noScriptText.trim();
  const arrowSteps = summaryText.includes("→")
    ? summaryText.split("→").length
    : 0;
  const coveredSteps = Math.max(stepper.noScriptItemCount, arrowSteps);

  if (summaryText.split(/\s+/).filter(Boolean).length < 5 || coveredSteps < 2) {
    errors.push(
      `stepper "${stepper.name}" has an empty no-JavaScript step summary`,
    );
  }

  const countMatch = stepper.stepCountText.match(/\b\d+\s*\/\s*(\d+)\b/);
  if (!countMatch?.[1]) {
    errors.push(
      `stepper "${stepper.name}" step counter must show current / total`,
    );
  } else if (coveredSteps < Number.parseInt(countMatch[1], 10)) {
    errors.push(
      `stepper "${stepper.name}" no-JavaScript summary covers ` +
        `${coveredSteps}/${countMatch[1]} steps`,
    );
  }
}

function validateC4Zoom(
  document: HtmlDocumentInspection,
  errors: string[],
): void {
  if (!hasAttribute(document.elements, undefined, "data-c4")) return;

  const levels = new Set(
    document.elements
      .map(({ attributes }) => attributes["data-c4-level"])
      .filter((level): level is string => Boolean(level)),
  );
  if (levels.size < 2) {
    errors.push("C4 semantic zoom needs at least two distinct maps");
  }
  if (!hasAttribute(document.elements, "button", "data-c4-back")) {
    errors.push("C4 semantic zoom needs an explicit Zoom out control");
  }
}

function hasAttribute(
  elements: readonly HtmlElementInspection[],
  tagName: string | undefined,
  attribute: string,
  value?: string,
): boolean {
  return elements.some(
    (element) =>
      (tagName === undefined || element.tagName === tagName) &&
      attribute in element.attributes &&
      (value === undefined || element.attributes[attribute] === value),
  );
}
