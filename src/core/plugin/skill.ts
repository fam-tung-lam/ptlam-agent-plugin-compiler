import type { CategoryId, ProjectPath, SkillId } from "../identifiers.js";

/** Whether a skill is published outside the authored plugin. */
export enum SkillVisibility {
  /** Keep the skill available only as an internal dependency. */
  Internal = "internal",
  /** Publish the skill in generated root catalogs and provider manifests. */
  Public = "public",
}

/** Lifecycle state controlling whether and how a skill is published. */
export enum SkillStatus {
  /** Incomplete skill excluded from published output. */
  Draft = "draft",
  /** Current skill included in published output. */
  Active = "active",
  /** Published skill retained with deprecation guidance. */
  Deprecated = "deprecated",
  /** Retired skill excluded from published output. */
  Archived = "archived",
}

/** Marker replaced with rendered required-skill guidance in generated documents. */
export const REQUIRED_SKILLS_MARKER =
  "<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->";

/** Marker replaced with inlined Markdown references in generated documents. */
export const MARKDOWN_REFERENCES_MARKER =
  "<!-- PLUGIN-COMPILER:MARKDOWN-REFERENCES -->";

/** How authored Markdown reference resources are compiled. */
export type MarkdownReferencesPolicy = "inline" | "preserve";

/** Optional authored compilation choices normalized to explicit policies. */
export interface SkillCompilationPolicy {
  /** Treatment of Markdown resources below `references/`. */
  readonly markdown_references: MarkdownReferencesPolicy;
}

/** One directed dependency on another skill. */
export interface SkillRequirement {
  /** Identifier of the required skill. */
  readonly skill_id: SkillId;
  /** Human-readable reason the dependency is needed. */
  readonly reason: string;
  /** Instructions for invoking or applying the required skill. */
  readonly instructions: string;
}

/** Guidance attached to a deprecated skill. */
export interface SkillDeprecation {
  /** Human-readable reason for deprecation. */
  readonly reason: string;
  /** Migration or continued-use instructions. */
  readonly instructions: string;
  /** Optional replacement skill identifier. */
  readonly replacement_skill_id?: SkillId;
}

/** Guidance attached to an archived skill. */
export interface SkillArchive {
  /** Human-readable reason for archival. */
  readonly reason: string;
  /** Optional replacement skill identifier. */
  readonly replacement_skill_id?: SkillId;
}

/** One parsed skill declaration before source validation. */
export interface SkillManifest {
  /** Stable skill identifier. */
  readonly id: SkillId;
  /** Human-readable skill description. */
  readonly description: string;
  /** Prevent supported hosts from selecting the skill without explicit user invocation. */
  readonly disable_model_invocation: boolean;
  /** Category containing this skill. */
  readonly category_id: CategoryId;
  /** Publication visibility. */
  readonly visibility: SkillVisibility;
  /** Lifecycle state. */
  readonly status: SkillStatus;
  /** Other skills that must be available with this skill. */
  readonly required_skills: readonly SkillRequirement[];
  /** Provider-neutral compilation choices for this skill. */
  readonly compilation: SkillCompilationPolicy;
  /** Required guidance when the lifecycle state is deprecated. */
  readonly deprecation?: SkillDeprecation;
  /** Required guidance when the lifecycle state is archived. */
  readonly archive?: SkillArchive;
}

/** Mutable-input form of one authored skill resource. */
export interface SkillResourceInput {
  /** Repository-relative resource path. */
  readonly path: ProjectPath;
  /** Resource bytes copied into the immutable skill model. */
  readonly content: Uint8Array;
}

/** Immutable authored skill resource with defensively copied bytes. */
export interface SkillResource {
  /** Repository-relative resource path. */
  readonly path: ProjectPath;
  /** A fresh copy of resource bytes on every read. */
  readonly content: Buffer;
}

/** Mutable-input form of a validated skill and its loaded sources. */
export interface SkillInput
  extends Omit<SkillManifest, "compilation" | "required_skills"> {
  /** Compilation choices; omission preserves every resource as a file. */
  readonly compilation?: SkillCompilationPolicy;
  /** Dependencies to copy into the immutable skill. */
  readonly required_skills: Iterable<SkillRequirement>;
  /** Repository-relative path of the authored `SKILL.md`. */
  readonly source_path: ProjectPath;
  /** Authored Markdown body. */
  readonly source_body: string;
  /** Loaded resource files to copy into the immutable skill. */
  readonly resources: Iterable<SkillResourceInput>;
}

/** Validated skill domain model with loaded source and resource facts. */
export interface Skill extends SkillManifest {
  /** Repository-relative path of the authored `SKILL.md`. */
  readonly source_path: ProjectPath;
  /** Authored Markdown body. */
  readonly source_body: string;
  /** Immutable loaded resource files. */
  readonly resources: readonly SkillResource[];
}

function createSkillResource(input: SkillResourceInput): SkillResource {
  const bytes = Buffer.from(input.content);
  return Object.freeze({
    path: input.path,
    get content(): Buffer {
      return Buffer.from(bytes);
    },
  });
}

/**
 * Copy and freeze a validated skill and its loaded resources.
 *
 * @param input - Validated declaration, source document, and resource bytes.
 * @returns A deeply immutable skill model.
 */
export function createSkill(input: SkillInput): Skill {
  return Object.freeze({
    ...input,
    compilation: Object.freeze({
      markdown_references: input.compilation?.markdown_references ?? "preserve",
    }),
    required_skills: Object.freeze(
      [...input.required_skills].map((requirement) =>
        Object.freeze({ ...requirement }),
      ),
    ),
    resources: Object.freeze([...input.resources].map(createSkillResource)),
    ...(input.deprecation === undefined
      ? {}
      : { deprecation: Object.freeze({ ...input.deprecation }) }),
    ...(input.archive === undefined
      ? {}
      : { archive: Object.freeze({ ...input.archive }) }),
  });
}
