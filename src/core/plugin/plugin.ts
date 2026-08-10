import type { CategoryId } from "../identifiers.js";
import {
  createSkill,
  type Skill,
  type SkillInput,
  type SkillManifest,
} from "./skill.js";

export enum PluginSchemaVersion {
  V1 = 1,
}

export interface PluginAuthor {
  readonly name: string;
  readonly email?: string;
  readonly url?: string;
}

export interface PluginMarketplace {
  readonly name: string;
  readonly description: string;
  readonly plugin_description: string;
  readonly category: string;
  readonly keywords: readonly string[];
}

export interface PluginCategory {
  readonly id: CategoryId;
  readonly name: string;
  readonly description: string;
}

/** Strictly parsed manifest values before semantic and source validation. */
export interface PluginManifest {
  readonly schema_version: PluginSchemaVersion;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: PluginAuthor;
  readonly homepage: string;
  readonly repository: string;
  readonly license: string;
  readonly keywords: readonly string[];
  readonly marketplace: PluginMarketplace;
  readonly categories: readonly PluginCategory[];
  readonly skills: readonly SkillManifest[];
}

/** Deeply immutable plugin domain model with loaded skill sources. */
export interface Plugin extends Omit<PluginManifest, "skills"> {
  readonly skills: readonly Skill[];
}

export interface PluginInput
  extends Omit<PluginManifest, "categories" | "skills"> {
  readonly categories: Iterable<PluginCategory>;
  readonly skills: Iterable<SkillInput>;
}

/** Create the deeply immutable logical model used by planners and providers. */
export function createPlugin(input: PluginInput): Plugin {
  return Object.freeze({
    ...input,
    author: Object.freeze({ ...input.author }),
    keywords: Object.freeze([...input.keywords]),
    marketplace: Object.freeze({
      ...input.marketplace,
      keywords: Object.freeze([...input.marketplace.keywords]),
    }),
    categories: Object.freeze(
      [...input.categories].map((category) => Object.freeze({ ...category })),
    ),
    skills: Object.freeze([...input.skills].map(createSkill)),
  });
}
