import type { CategoryId } from "../identifiers.js";
import {
  createSkill,
  type Skill,
  type SkillInput,
  type SkillManifest,
} from "./skill.js";

/** Supported authored plugin manifest schema version. */
export enum PluginSchemaVersion {
  /** Version one of the authored plugin manifest schema. */
  V1 = 1,
}

/** Authorship metadata copied into provider manifests. */
export interface PluginAuthor {
  /** Human-readable author or organization name. */
  readonly name: string;
  /** Optional contact email address. */
  readonly email?: string;
  /** Optional author or organization URL. */
  readonly url?: string;
}

/** Claude marketplace listing metadata from the authored manifest. */
export interface PluginMarketplace {
  /** Marketplace identifier. */
  readonly name: string;
  /** Marketplace description. */
  readonly description: string;
  /** Description shown for this plugin's marketplace entry. */
  readonly plugin_description: string;
  /** Marketplace category label. */
  readonly category: string;
  /** Search keywords for the marketplace entry. */
  readonly keywords: readonly string[];
}

/** One declared skill category. */
export interface PluginCategory {
  /** Branded category identifier referenced by skills. */
  readonly id: CategoryId;
  /** Human-readable category name. */
  readonly name: string;
  /** Human-readable category description. */
  readonly description: string;
}

/**
 * Strictly parsed authored values before semantic and source validation.
 *
 * Use {@link AgentPluginCompiler.validate} to obtain a validated {@link Plugin}
 * rather than constructing this model from untrusted YAML yourself.
 *
 * @example
 * ```ts
 * const result = await compiler.validate();
 * const plugin: Plugin = result.plugin;
 * ```
 */
export interface PluginManifest {
  /** Version of the authored manifest contract. */
  readonly schema_version: PluginSchemaVersion;
  /** Provider-facing plugin identifier. */
  readonly name: string;
  /** Human-readable plugin description. */
  readonly description: string;
  /** Plugin release version. */
  readonly version: string;
  /** Authorship metadata. */
  readonly author: PluginAuthor;
  /** Canonical plugin homepage URL. */
  readonly homepage: string;
  /** Canonical source repository URL. */
  readonly repository: string;
  /** SPDX license expression or project license identifier. */
  readonly license: string;
  /** Provider-facing discovery keywords. */
  readonly keywords: readonly string[];
  /** Claude marketplace listing metadata. */
  readonly marketplace: PluginMarketplace;
  /** Skill categories declared by the plugin. */
  readonly categories: readonly PluginCategory[];
  /** Authored skill declarations before source files are attached. */
  readonly skills: readonly SkillManifest[];
}

/**
 * Deeply immutable, validated plugin domain model with loaded skill sources.
 *
 * Provider adapters receive this model in {@link ProviderContext.plugin}.
 *
 * @example
 * ```ts
 * const { plugin }: { plugin: Plugin } = await compiler.validate();
 * console.log(plugin.name, plugin.skills.length);
 * ```
 */
export interface Plugin extends Omit<PluginManifest, "skills"> {
  /** Validated skills with their authored source documents and resources. */
  readonly skills: readonly Skill[];
}

/** Mutable-input form used to construct a validated plugin model. */
export interface PluginInput
  extends Omit<PluginManifest, "categories" | "skills"> {
  /** Skill categories to copy into the immutable model. */
  readonly categories: Iterable<PluginCategory>;
  /** Validated skills to copy into the immutable model. */
  readonly skills: Iterable<SkillInput>;
}

/**
 * Create the deeply immutable logical model used by planners and providers.
 *
 * @param input - Validated plugin metadata, categories, and loaded skills.
 * @returns A deeply immutable plugin model with copied collections and bytes.
 */
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
