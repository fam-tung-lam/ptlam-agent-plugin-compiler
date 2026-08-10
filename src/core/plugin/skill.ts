import type { CategoryId, ProjectPath, SkillId } from "../identifiers.js";

export enum SkillVisibility {
  Internal = "internal",
  Public = "public",
}

export enum SkillStatus {
  Draft = "draft",
  Active = "active",
  Deprecated = "deprecated",
  Archived = "archived",
}

export const REQUIRED_SKILLS_MARKER =
  "<!-- PLUGIN-COMPILER:REQUIRED-SKILLS -->";

export interface SkillRequirement {
  readonly skill_id: SkillId;
  readonly reason: string;
  readonly instructions: string;
}

export interface SkillDeprecation {
  readonly reason: string;
  readonly instructions: string;
  readonly replacement_skill_id?: SkillId;
}

export interface SkillArchive {
  readonly reason: string;
  readonly replacement_skill_id?: SkillId;
}

/** One parsed skill declaration before source validation. */
export interface SkillManifest {
  readonly id: SkillId;
  readonly description: string;
  readonly category_id: CategoryId;
  readonly visibility: SkillVisibility;
  readonly status: SkillStatus;
  readonly required_skills: readonly SkillRequirement[];
  readonly deprecation?: SkillDeprecation;
  readonly archive?: SkillArchive;
}

export interface SkillResourceInput {
  readonly path: ProjectPath;
  readonly content: Uint8Array;
}

export interface SkillResource {
  readonly path: ProjectPath;
  readonly content: Buffer;
}

export interface SkillInput extends Omit<SkillManifest, "required_skills"> {
  readonly required_skills: Iterable<SkillRequirement>;
  readonly source_path: ProjectPath;
  readonly source_body: string;
  readonly resources: Iterable<SkillResourceInput>;
}

export interface Skill extends SkillManifest {
  readonly source_path: ProjectPath;
  readonly source_body: string;
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

export function createSkill(input: SkillInput): Skill {
  return Object.freeze({
    ...input,
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
