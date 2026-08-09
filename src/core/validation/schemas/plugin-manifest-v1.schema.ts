/** Closed schema for the canonical v1 plugin manifest. */
export const pluginManifestV1Schema: object = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/blob/main/src/core/validation/schemas/plugin-manifest-v1.schema.ts",
  title: "Agent plugin manifest",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version",
    "name",
    "description",
    "version",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords",
    "marketplace",
    "categories",
    "skills",
  ],
  properties: {
    schema_version: { const: 1 },
    name: { $ref: "#/$defs/identifier" },
    description: { $ref: "#/$defs/nonEmptyString" },
    version: { $ref: "#/$defs/version" },
    author: { $ref: "#/$defs/author" },
    homepage: { $ref: "#/$defs/nonEmptyString" },
    repository: { $ref: "#/$defs/nonEmptyString" },
    license: { $ref: "#/$defs/nonEmptyString" },
    keywords: { $ref: "#/$defs/stringList" },
    marketplace: { $ref: "#/$defs/marketplace" },
    categories: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/category" },
    },
    skills: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/skill" },
    },
  },
  $defs: {
    identifier: {
      type: "string",
      maxLength: 64,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    },
    nonEmptyString: { type: "string", pattern: "\\S" },
    version: {
      type: "string",
      pattern:
        "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$",
    },
    stringList: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: { $ref: "#/$defs/nonEmptyString" },
    },
    author: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: { $ref: "#/$defs/nonEmptyString" },
        email: { $ref: "#/$defs/nonEmptyString" },
        url: { $ref: "#/$defs/nonEmptyString" },
      },
    },
    marketplace: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "description",
        "plugin_description",
        "category",
        "keywords",
      ],
      properties: {
        name: { $ref: "#/$defs/identifier" },
        description: { $ref: "#/$defs/nonEmptyString" },
        plugin_description: { $ref: "#/$defs/nonEmptyString" },
        category: { $ref: "#/$defs/identifier" },
        keywords: { $ref: "#/$defs/stringList" },
      },
    },
    category: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "description"],
      properties: {
        id: { $ref: "#/$defs/identifier" },
        name: { $ref: "#/$defs/nonEmptyString" },
        description: { $ref: "#/$defs/nonEmptyString" },
      },
    },
    skillRequirement: {
      type: "object",
      additionalProperties: false,
      required: ["skill_id", "reason", "instructions"],
      properties: {
        skill_id: { $ref: "#/$defs/identifier" },
        reason: { $ref: "#/$defs/nonEmptyString" },
        instructions: { $ref: "#/$defs/nonEmptyString" },
      },
    },
    replacement: {
      type: "object",
      additionalProperties: false,
      required: ["reason"],
      properties: {
        reason: { $ref: "#/$defs/nonEmptyString" },
        replacement_skill_id: { $ref: "#/$defs/identifier" },
      },
    },
    deprecation: {
      type: "object",
      additionalProperties: false,
      required: ["reason", "instructions"],
      properties: {
        reason: { $ref: "#/$defs/nonEmptyString" },
        instructions: { $ref: "#/$defs/nonEmptyString" },
        replacement_skill_id: { $ref: "#/$defs/identifier" },
      },
    },
    skill: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "description",
        "category_id",
        "visibility",
        "status",
        "required_skills",
      ],
      properties: {
        id: { $ref: "#/$defs/identifier" },
        description: { $ref: "#/$defs/nonEmptyString" },
        category_id: { $ref: "#/$defs/identifier" },
        visibility: { enum: ["internal", "public"] },
        status: { enum: ["draft", "active", "deprecated", "archived"] },
        required_skills: {
          type: "array",
          items: { $ref: "#/$defs/skillRequirement" },
        },
        deprecation: { $ref: "#/$defs/deprecation" },
        archive: { $ref: "#/$defs/replacement" },
      },
      allOf: [
        {
          if: {
            properties: { status: { const: "deprecated" } },
            required: ["status"],
          },
          // biome-ignore lint/suspicious/noThenProperty: JSON Schema requires the if/then/else keyword.
          then: {
            required: ["deprecation"],
            properties: {
              deprecation: { $ref: "#/$defs/deprecation" },
              archive: false,
            },
          },
          else: { properties: { deprecation: false } },
        },
        {
          if: {
            properties: { status: { const: "archived" } },
            required: ["status"],
          },
          // biome-ignore lint/suspicious/noThenProperty: JSON Schema requires the if/then/else keyword.
          then: {
            required: ["archive"],
            properties: {
              archive: { $ref: "#/$defs/replacement" },
              deprecation: false,
            },
          },
          else: { properties: { archive: false } },
        },
      ],
    },
  },
};
