import { createRequire } from "node:module";

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
import {
  createCategoryId,
  createHookId,
  createProjectPath,
  createProviderId,
  createSkillId,
  type HookBinding,
  type HookLifecycle,
  type HookManifest,
  type PluginCategory,
  type PluginManifest,
  PluginSchemaVersion,
  type SkillArchive,
  type SkillDeprecation,
  type SkillManifest,
  type SkillRequirement,
} from "../../core/index.js";

const require = createRequire(import.meta.url);
const pluginManifestSchemaV1 = require("../../schemas/v1/plugin-manifest.schema.json");
const pluginManifestSchemaV2 = require("../../schemas/v2/plugin-manifest.schema.json");

/** Canonical project-relative location used in manifest diagnostics. */
export const SOURCE_MANIFEST_PATH = "plugin/plugin.yml";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
});
const validateManifestSchemas = new Map([
  [PluginSchemaVersion.V1, ajv.compile(pluginManifestSchemaV1)],
  [PluginSchemaVersion.V2, ajv.compile(pluginManifestSchemaV2)],
]);

type JsonPluginCategory = Omit<PluginCategory, "id"> & {
  readonly id: string;
};

type JsonHookBinding = Omit<HookBinding, "handler"> & {
  readonly handler: string;
};

type JsonHookManifest = Omit<HookManifest, "bindings" | "id"> & {
  readonly id: string;
  readonly bindings: readonly JsonHookBinding[];
};

type JsonSkillRequirement = Omit<SkillRequirement, "skill_id"> & {
  readonly skill_id: string;
};

type JsonSkillDeprecation = Omit<SkillDeprecation, "replacement_skill_id"> & {
  readonly replacement_skill_id?: string;
};

type JsonSkillArchive = Omit<SkillArchive, "replacement_skill_id"> & {
  readonly replacement_skill_id?: string;
};

type JsonSkillManifest = Omit<
  SkillManifest,
  "archive" | "category_id" | "deprecation" | "id" | "required_skills"
> & {
  readonly archive?: JsonSkillArchive;
  readonly category_id: string;
  readonly deprecation?: JsonSkillDeprecation;
  readonly id: string;
  readonly required_skills: readonly JsonSkillRequirement[];
};

type JsonPluginManifestBase = Omit<
  PluginManifest,
  "categories" | "hooks" | "providers" | "schema_version" | "skills"
> & {
  readonly categories: readonly JsonPluginCategory[];
  readonly providers: readonly string[];
  readonly skills: readonly JsonSkillManifest[];
};

type JsonPluginManifestV1 = JsonPluginManifestBase & {
  readonly schema_version: PluginSchemaVersion.V1;
};

type JsonPluginManifestV2 = JsonPluginManifestBase & {
  readonly schema_version: PluginSchemaVersion.V2;
  readonly hooks?: readonly JsonHookManifest[];
};

type JsonPluginManifest = JsonPluginManifestV1 | JsonPluginManifestV2;

function createHookManifest(value: JsonHookManifest): HookManifest {
  return Object.freeze({
    id: createHookId(value.id),
    bindings: Object.freeze(
      value.bindings.map((binding) =>
        Object.freeze({
          lifecycle: binding.lifecycle as HookLifecycle,
          handler: createProjectPath(binding.handler),
        }),
      ),
    ),
  });
}

/** Result of strict YAML, JSON-schema, identifier, and public-metadata parsing. */
export type ManifestParsingResult =
  | {
      /** Immutable manifest when parsing succeeds. */
      readonly manifest: PluginManifest;
      /** Empty tuple discriminating successful parsing. */
      readonly errors: readonly [];
    }
  | {
      /** Immutable diagnostics when parsing fails. */
      readonly errors: readonly string[];
    };

/**
 * Parses manifest text without performing filesystem I/O.
 *
 * @param source - UTF-8 manifest text from the canonical authored path.
 * @returns Either an immutable branded manifest or immutable parsing diagnostics.
 */
export function parsePluginManifest(source: string): ManifestParsingResult {
  const parsed = parseStrictYaml(source, SOURCE_MANIFEST_PATH);
  if (!("value" in parsed)) return parsed;
  const schemaVersion = readSchemaVersion(parsed.value);
  if (schemaVersion === null) {
    return {
      errors: Object.freeze([
        `${SOURCE_MANIFEST_PATH}#/schema_version: must have required property 'schema_version'`,
      ]),
    };
  }
  const validateManifestSchema = validateManifestSchemas.get(schemaVersion);
  if (validateManifestSchema === undefined) {
    return {
      errors: Object.freeze([
        `${SOURCE_MANIFEST_PATH}/schema_version: must be one of the supported versions: 1, 2`,
      ]),
    };
  }
  if (!validateManifestSchema(parsed.value)) {
    return {
      errors: Object.freeze(
        (validateManifestSchema.errors ?? []).map(formatSchemaError),
      ),
    };
  }

  const manifest = createPluginManifest(parsed.value as JsonPluginManifest);
  const metadataErrors = validatePublicMetadata(manifest);
  return metadataErrors.length === 0
    ? { manifest, errors: [] }
    : { errors: Object.freeze(metadataErrors) };
}

function readSchemaVersion(value: unknown): number | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const version = (value as Record<string, unknown>)["schema_version"];
  return typeof version === "number" ? version : null;
}

function createDeprecation(value: JsonSkillDeprecation): SkillDeprecation {
  const { replacement_skill_id, ...metadata } = value;
  return Object.freeze({
    ...metadata,
    ...(replacement_skill_id === undefined
      ? {}
      : { replacement_skill_id: createSkillId(replacement_skill_id) }),
  });
}

function createArchive(value: JsonSkillArchive): SkillArchive {
  const { replacement_skill_id, ...metadata } = value;
  return Object.freeze({
    ...metadata,
    ...(replacement_skill_id === undefined
      ? {}
      : { replacement_skill_id: createSkillId(replacement_skill_id) }),
  });
}

function createSkillManifest(value: JsonSkillManifest): SkillManifest {
  const {
    archive,
    category_id,
    deprecation,
    id,
    required_skills,
    ...metadata
  } = value;
  return Object.freeze({
    ...metadata,
    id: createSkillId(id),
    category_id: createCategoryId(category_id),
    required_skills: Object.freeze(
      required_skills.map((requirement) =>
        Object.freeze({
          ...requirement,
          skill_id: createSkillId(requirement.skill_id),
        }),
      ),
    ),
    ...(deprecation === undefined
      ? {}
      : { deprecation: createDeprecation(deprecation) }),
    ...(archive === undefined ? {} : { archive: createArchive(archive) }),
  });
}

/** Snapshot schema-validated JSON through the only branded-ID constructors. */
function createPluginManifest(value: JsonPluginManifest): PluginManifest {
  const hooks = "hooks" in value ? (value.hooks ?? []) : [];
  return Object.freeze({
    ...value,
    author: Object.freeze({ ...value.author }),
    providers: Object.freeze(value.providers.map(createProviderId)),
    keywords: Object.freeze([...value.keywords]),
    categories: Object.freeze(
      value.categories.map((category) =>
        Object.freeze({
          ...category,
          id: createCategoryId(category.id),
        }),
      ),
    ),
    hooks: Object.freeze(hooks.map(createHookManifest)),
    skills: Object.freeze(value.skills.map(createSkillManifest)),
  });
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

function validatePublicMetadata(manifest: PluginManifest): string[] {
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
