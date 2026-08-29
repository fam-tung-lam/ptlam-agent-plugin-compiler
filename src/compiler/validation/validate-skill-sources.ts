import {
  createProjectPath,
  MARKDOWN_REFERENCES_MARKER,
  type PluginSource,
  REQUIRED_SKILLS_MARKER,
  type SkillInput,
  type SkillManifest,
  type SourceEntry,
  SourceEntryKind,
} from "../../core/index.js";
import { SOURCE_MANIFEST_PATH } from "./parse-plugin-manifest.js";
import { validateMarkdownLinks } from "./validate-markdown-links.js";
import { validateRequiredSkillContractOwnership } from "./validate-required-skill-contract-ownership.js";

const SOURCE_SKILLS_PATH = "plugin/skills";
const SKILL_MARKER = "SKILL.md";
const RESERVED_NESTED_SKILLS_PATH = "skills";

interface DiscoveredSkillRoot {
  readonly id: string;
  readonly path: string;
}

/** Skill construction inputs and diagnostics recovered from authored source facts. */
export interface SkillSourceValidationResult {
  /** Immutable skill inputs with source bodies and defensively copied resources. */
  readonly skills: readonly SkillInput[];
  /** Fatal authored-layout, resource, and Markdown diagnostics. */
  readonly errors: readonly string[];
}

/**
 * Matches manifest skills to logical authored entries without filesystem I/O.
 *
 * @param source - Immutable authored manifest and skill-tree facts.
 * @param manifestSkills - Parsed manifest skills to match with source directories.
 * @returns Immutable skill construction inputs and accumulated validation errors.
 */
export function validateSkillSources(
  source: PluginSource,
  manifestSkills: readonly SkillManifest[],
): SkillSourceValidationResult {
  const errors: string[] = [];
  const entries = normalizeSourceEntries(source.skillEntries, errors);
  const roots = discoverSkillRoots(entries);
  validateRootLayout(roots, errors);
  const entriesByRootPath = indexSourceOwnership(entries, roots, errors);

  const rootsById = groupRootsById(roots);
  const manifestsById = indexManifestsById(manifestSkills);
  const inspectedByRootPath = new Map<
    string,
    Pick<SkillInput, "source_path" | "source_body" | "resources">
  >();
  for (const root of roots) {
    const inspected = inspectSkillSource(
      entriesByRootPath.get(root.path) ?? [],
      root,
      manifestsById.get(root.id),
      errors,
    );
    if (inspected !== null) inspectedByRootPath.set(root.path, inspected);
  }
  validateRootMapping(manifestSkills, roots, errors);

  const skills: SkillInput[] = [];
  for (const manifestSkill of manifestSkills) {
    const matchingRoots = rootsById.get(manifestSkill.id) ?? [];
    const matchingRoot = matchingRoots[0];
    if (matchingRoots.length !== 1 || matchingRoot === undefined) continue;
    const inspected = inspectedByRootPath.get(matchingRoot.path);
    if (inspected !== undefined)
      skills.push({ ...manifestSkill, ...inspected });
  }

  errors.sort();
  return {
    skills: Object.freeze(skills),
    errors: Object.freeze(errors),
  };
}

function normalizeSourceEntries(
  sourceEntries: readonly SourceEntry[],
  errors: string[],
): readonly SourceEntry[] {
  const seenPaths = new Set<string>();
  return sourceEntries.filter((entry) => {
    const entryPath = String(entry.path);
    if (seenPaths.has(entryPath)) {
      errors.push(`${entryPath}: duplicate logical source entry`);
      return false;
    }
    seenPaths.add(entryPath);
    if (
      entryPath === SOURCE_SKILLS_PATH &&
      entry.kind === SourceEntryKind.Directory
    ) {
      return false;
    }
    if (!entryPath.startsWith(`${SOURCE_SKILLS_PATH}/`)) {
      errors.push(
        `${entryPath}: skill source entry is outside ${SOURCE_SKILLS_PATH}/`,
      );
      return false;
    }
    return true;
  });
}

function discoverSkillRoots(
  entries: readonly SourceEntry[],
): readonly DiscoveredSkillRoot[] {
  return entries.flatMap((entry) => {
    if (entry.kind !== SourceEntryKind.File) return [];
    const entryPath = String(entry.path);
    if (!entryPath.endsWith(`/${SKILL_MARKER}`)) return [];
    const rootPath = entryPath.slice(0, -`/${SKILL_MARKER}`.length);
    if (rootPath === SOURCE_SKILLS_PATH) return [];
    return [
      Object.freeze({
        id: rootPath.slice(rootPath.lastIndexOf("/") + 1),
        path: rootPath,
      }),
    ];
  });
}

function validateRootLayout(
  roots: readonly DiscoveredSkillRoot[],
  errors: string[],
): void {
  const rootsById = groupRootsById(roots);
  for (const [id, matchingRoots] of rootsById) {
    if (matchingRoots.length < 2) continue;
    errors.push(
      `${matchingRoots[0]?.path}: skill source basename ${JSON.stringify(id)} is ambiguous; discovered roots: ${matchingRoots.map(({ path }) => path).join(", ")}`,
    );
  }

  for (let leftIndex = 0; leftIndex < roots.length; leftIndex += 1) {
    const left = roots[leftIndex];
    if (left === undefined) continue;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < roots.length;
      rightIndex += 1
    ) {
      const right = roots[rightIndex];
      if (right === undefined) continue;
      const overlap = overlappingRoots(left, right);
      if (overlap === undefined) continue;
      errors.push(
        `${overlap.descendant.path}: skill root overlaps ${overlap.ancestor.path}; each ${SKILL_MARKER} must define a non-overlapping source root`,
      );
    }
  }
}

function overlappingRoots(
  left: DiscoveredSkillRoot,
  right: DiscoveredSkillRoot,
):
  | {
      readonly ancestor: DiscoveredSkillRoot;
      readonly descendant: DiscoveredSkillRoot;
    }
  | undefined {
  if (left.path.startsWith(`${right.path}/`)) {
    return { ancestor: right, descendant: left };
  }
  if (right.path.startsWith(`${left.path}/`)) {
    return { ancestor: left, descendant: right };
  }
  return undefined;
}

function indexSourceOwnership(
  entries: readonly SourceEntry[],
  roots: readonly DiscoveredSkillRoot[],
  errors: string[],
): ReadonlyMap<string, readonly SourceEntry[]> {
  const rootsByPath = new Map(roots.map((root) => [root.path, root]));
  const entriesByRootPath = new Map<string, SourceEntry[]>(
    roots.map((root) => [root.path, []]),
  );
  for (const entry of entries) {
    const entryPath = String(entry.path);
    const owner = findOwningRoot(entryPath, rootsByPath);
    if (owner !== undefined) {
      const ownedEntries = entriesByRootPath.get(owner.path);
      if (ownedEntries === undefined) {
        throw new Error(`Missing source ownership bucket for ${owner.path}`);
      }
      ownedEntries.push(entry);
    } else if (entry.kind === SourceEntryKind.File) {
      errors.push(
        `${entryPath}: unowned authored skill input; grouping directories may contain only directories leading to skills, and files belong inside a directory with ${SKILL_MARKER}`,
      );
    }
  }
  return new Map(
    [...entriesByRootPath].map(([rootPath, ownedEntries]) => [
      rootPath,
      Object.freeze(ownedEntries),
    ]),
  );
}

function groupRootsById(
  roots: readonly DiscoveredSkillRoot[],
): ReadonlyMap<string, readonly DiscoveredSkillRoot[]> {
  const grouped = new Map<string, DiscoveredSkillRoot[]>();
  for (const root of roots) {
    const matchingRoots = grouped.get(root.id) ?? [];
    matchingRoots.push(root);
    grouped.set(root.id, matchingRoots);
  }
  return grouped;
}

function findOwningRoot(
  entryPath: string,
  rootsByPath: ReadonlyMap<string, DiscoveredSkillRoot>,
): DiscoveredSkillRoot | undefined {
  let ancestorPath = entryPath;
  while (ancestorPath !== SOURCE_SKILLS_PATH) {
    const separatorIndex = ancestorPath.lastIndexOf("/");
    if (separatorIndex < 0) return undefined;
    ancestorPath = ancestorPath.slice(0, separatorIndex);
    const root = rootsByPath.get(ancestorPath);
    if (root !== undefined) return root;
  }
  return undefined;
}

function indexManifestsById(
  skills: readonly SkillManifest[],
): ReadonlyMap<string, SkillManifest> {
  const manifestsById = new Map<string, SkillManifest>();
  for (const skill of skills) {
    if (!manifestsById.has(skill.id)) manifestsById.set(skill.id, skill);
  }
  return manifestsById;
}

function validateRootMapping(
  skills: readonly SkillManifest[],
  roots: readonly DiscoveredSkillRoot[],
  errors: string[],
): void {
  const manifestIds = new Set<string>(skills.map(({ id }) => id));
  for (const root of roots) {
    if (!manifestIds.has(root.id)) {
      errors.push(
        `${root.path}: source skill is not listed in ${SOURCE_MANIFEST_PATH}`,
      );
    }
  }

  const rootsById = groupRootsById(roots);
  for (const [index, skill] of skills.entries()) {
    if ((rootsById.get(skill.id) ?? []).length === 0) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#/skills/${index}: expected one ${SOURCE_SKILLS_PATH}/**/${skill.id}/${SKILL_MARKER} source`,
      );
    }
  }
}

function inspectSkillSource(
  ownedEntries: readonly SourceEntry[],
  root: DiscoveredSkillRoot,
  manifestSkill: SkillManifest | undefined,
  errors: string[],
): Pick<SkillInput, "source_path" | "source_body" | "resources"> | null {
  const files = new Map<string, Buffer>();

  for (const entry of ownedEntries) {
    const entryPath = String(entry.path);
    const relativePath = entryPath.slice(`${root.path}/`.length);
    if (relativePath.split("/").includes(".DS_Store")) {
      errors.push(`${entryPath}: unsupported service file`);
      continue;
    }
    if (
      relativePath === RESERVED_NESTED_SKILLS_PATH ||
      relativePath.startsWith(`${RESERVED_NESTED_SKILLS_PATH}/`)
    ) {
      errors.push(
        `${entryPath}: ${RESERVED_NESTED_SKILLS_PATH}/ is owned by the plugin compiler`,
      );
      continue;
    }
    if (entry.kind === SourceEntryKind.File) {
      files.set(relativePath, entry.content);
    }
  }

  const skillFile = files.get(SKILL_MARKER);
  if (skillFile === undefined) {
    errors.push(
      `${root.path}/${SKILL_MARKER}: discovered marker is unavailable`,
    );
    return null;
  }

  const sourceBody = skillFile.toString("utf8");
  if (/^\uFEFF?---[ \t]*(?:\r?\n|$)/u.test(sourceBody)) {
    errors.push(
      `${root.path}/${SKILL_MARKER}: authored ${SKILL_MARKER} must not contain YAML frontmatter`,
    );
  }
  const markerCount = sourceBody.split(REQUIRED_SKILLS_MARKER).length - 1;
  if (markerCount > 1) {
    errors.push(
      `${root.path}/${SKILL_MARKER}: expected at most one ${REQUIRED_SKILLS_MARKER} marker, found ${markerCount}`,
    );
  }
  if (manifestSkill?.compilation.markdown_references === "inline") {
    const referencesMarkerCount =
      sourceBody.split(MARKDOWN_REFERENCES_MARKER).length - 1;
    if (referencesMarkerCount > 1) {
      errors.push(
        `${root.path}/${SKILL_MARKER}: expected at most one ${MARKDOWN_REFERENCES_MARKER} marker, found ${referencesMarkerCount}`,
      );
    }
  }

  const sourceFiles = new Set(files.keys());
  for (const [relativePath, content] of files) {
    if (relativePath.endsWith(".md")) {
      const markdownSource = content.toString("utf8");
      errors.push(
        ...validateMarkdownLinks({
          source: markdownSource,
          markdownPath: relativePath,
          sourceFiles,
          skillPath: root.path,
        }),
      );
      if (manifestSkill !== undefined) {
        errors.push(
          ...validateRequiredSkillContractOwnership({
            source: markdownSource,
            markdownPath: relativePath,
            skill: manifestSkill,
            skillPath: root.path,
          }),
        );
      }
    }
  }

  return {
    source_path: createProjectPath(root.path),
    source_body: sourceBody,
    resources: Object.freeze(
      [...files]
        .filter(([relativePath]) => relativePath !== SKILL_MARKER)
        .map(([relativePath, content]) => ({
          path: createProjectPath(relativePath),
          content,
        })),
    ),
  };
}
