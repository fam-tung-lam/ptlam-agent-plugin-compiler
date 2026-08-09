import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import {
  isAlias,
  isMap,
  isNode,
  isPair,
  isScalar,
  LineCounter,
  type Node,
  parseDocument,
  visit,
} from "yaml";

import type { Plugin } from "../models/plugin.js";
import { pluginManifestV1Schema } from "./schemas/plugin-manifest-v1.schema.js";

export const SOURCE_MANIFEST_PATH = "plugin/plugin.yml";

const validateManifestSchema = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile<Plugin>(pluginManifestV1Schema);

export type ManifestParsingResult =
  | { readonly manifest: Plugin; readonly errors: readonly [] }
  | { readonly errors: readonly string[] };

/** Strictly parse and validate manifest text without reading a repository. */
export function parsePluginManifest(source: string): ManifestParsingResult {
  const parsed = parseStrictYaml(source, SOURCE_MANIFEST_PATH);
  if (!("value" in parsed)) return parsed;
  if (!validateManifestSchema(parsed.value)) {
    return {
      errors: Object.freeze(
        (validateManifestSchema.errors ?? []).map(formatSchemaError),
      ),
    };
  }

  const metadataErrors = validatePublicMetadata(parsed.value);
  return metadataErrors.length === 0
    ? { manifest: parsed.value, errors: [] }
    : { errors: Object.freeze(metadataErrors) };
}

function parseStrictYaml(
  source: string,
  sourceName: string,
): { readonly value: unknown } | { readonly errors: readonly string[] } {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, {
    lineCounter,
    merge: false,
    prettyErrors: false,
    schema: "core",
    uniqueKeys: true,
    version: "1.2",
  });
  const errors = [
    ...document.errors.map(
      (error) => `${sourceName}: invalid YAML (${error.message})`,
    ),
    ...document.warnings.map(
      (warning) => `${sourceName}: unsupported YAML (${warning.message})`,
    ),
  ];

  if (document.contents !== null) {
    visit(document, (_key, node) => {
      const location = yamlLocation(sourceName, lineCounter, node);
      if (isNode(node) && node.anchor)
        errors.push(`${location}: YAML anchors are not supported`);
      if (isAlias(node))
        errors.push(`${location}: YAML aliases are not supported`);
      if (isNode(node) && node.tag)
        errors.push(`${location}: explicit YAML tags are not supported`);
      if (isPair(node)) {
        if (!isScalar(node.key) || typeof node.key.value !== "string") {
          errors.push(`${location}: YAML mapping keys must be strings`);
        } else if (node.key.value === "<<") {
          errors.push(`${location}: YAML merge keys are not supported`);
        }
      }
    });
  }

  const versionNode = mappingValue(document.contents, "version");
  if (isScalar(versionNode) && versionNode.type === "PLAIN") {
    errors.push(
      `${yamlLocation(sourceName, lineCounter, versionNode)}: version must be quoted`,
    );
  }
  if (errors.length > 0) return { errors: Object.freeze(errors) };

  let value: unknown;
  try {
    value = document.toJS({ mapAsMap: false, maxAliasCount: 0 });
  } catch (error) {
    return {
      errors: Object.freeze([
        `${sourceName}: cannot convert YAML to JSON-compatible values (${errorMessage(error)})`,
      ]),
    };
  }
  const jsonError = findNonJsonValue(value, "#");
  if (jsonError !== null)
    return { errors: Object.freeze([`${sourceName}${jsonError}`]) };
  const interpolationError = findInterpolation(value, "#");
  if (interpolationError !== null) {
    return {
      errors: Object.freeze([
        `${sourceName}${interpolationError}: interpolation is not supported`,
      ]),
    };
  }
  return { value };
}

function validatePublicMetadata(manifest: Plugin): string[] {
  const errors: string[] = [];
  validateHttpsUrl(
    manifest.homepage,
    `${SOURCE_MANIFEST_PATH}#/homepage`,
    errors,
  );
  validateHttpsUrl(
    manifest.repository,
    `${SOURCE_MANIFEST_PATH}#/repository`,
    errors,
  );
  if (manifest.author.url !== undefined) {
    validateHttpsUrl(
      manifest.author.url,
      `${SOURCE_MANIFEST_PATH}#/author/url`,
      errors,
    );
  }
  if (
    manifest.author.email !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(manifest.author.email)
  ) {
    errors.push(
      `${SOURCE_MANIFEST_PATH}#/author/email: must be a valid email address`,
    );
  }
  return errors;
}

function validateHttpsUrl(
  value: string,
  field: string,
  errors: string[],
): void {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname !== "") return;
  } catch {
    // The shared diagnostic covers malformed and non-HTTPS URLs.
  }
  errors.push(`${field}: must be a valid HTTPS URL`);
}

function formatSchemaError(error: ErrorObject): string {
  let field = `${SOURCE_MANIFEST_PATH}${error.instancePath || "#"}`;
  if (error.keyword === "required")
    field += `/${String(error.params["missingProperty"])}`;
  if (error.keyword === "additionalProperties")
    field += `/${String(error.params["additionalProperty"])}`;
  return `${field}: ${error.message}`;
}

function mappingValue(
  mapping: Node | null,
  key: string,
): Node | null | undefined {
  if (!isMap(mapping)) return undefined;
  const pair = mapping.items.find(
    (item) => isPair(item) && isScalar(item.key) && item.key.value === key,
  );
  if (pair === undefined) return undefined;
  return isNode(pair.value) ? pair.value : null;
}

function yamlLocation(
  sourceName: string,
  lineCounter: LineCounter,
  node: unknown,
): string {
  const rangedNode = isPair(node)
    ? isNode(node.key)
      ? node.key
      : null
    : isNode(node)
      ? node
      : null;
  const offset = rangedNode?.range?.[0];
  if (typeof offset !== "number") return sourceName;
  const { line, col } = lineCounter.linePos(offset);
  return `${sourceName}:${line}:${col}`;
}

function findNonJsonValue(value: unknown, pointer: string): string | null {
  if (value === null || ["string", "boolean"].includes(typeof value))
    return null;
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? null
      : `${pointer}: numbers must be finite JSON values`;
  }
  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      const error = findNonJsonValue(child, `${pointer}/${index}`);
      if (error !== null) return error;
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const error = findNonJsonValue(child, `${pointer}/${escapePointer(key)}`);
      if (error !== null) return error;
    }
    return null;
  }
  return `${pointer}: value is not JSON-compatible`;
}

function findInterpolation(value: unknown, pointer: string): string | null {
  if (typeof value === "string")
    return /\$\{[^}]*\}/u.test(value) ? pointer : null;
  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      const error = findInterpolation(child, `${pointer}/${index}`);
      if (error !== null) return error;
    }
  } else if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const error = findInterpolation(
        child,
        `${pointer}/${escapePointer(key)}`,
      );
      if (error !== null) return error;
    }
  }
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function escapePointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
