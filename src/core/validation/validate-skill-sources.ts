import {
  type PluginSource,
  type SourceEntry,
  SourceEntryKind,
  type SourceFile,
} from "../models/plugin-source.js";
import { createProjectPath } from "../models/project-path.js";
import {
  REQUIRED_SKILLS_MARKER,
  type Skill,
  type ValidatedSkillInput,
} from "../models/skill.js";
import { SOURCE_MANIFEST_PATH } from "./parse-plugin-manifest.js";
import { validateMarkdownLinks } from "./validate-markdown-links.js";

const SOURCE_SKILLS_PATH = "plugin/skills";
const RESERVED_REQUIRED_SKILLS_PATH = "references/required-skills";

export interface SkillSourceValidationResult {
  readonly skills: readonly ValidatedSkillInput[];
  readonly errors: readonly string[];
}

/** Validate logical authored skill facts without inspecting physical paths. */
export function validateSkillSources(
  source: PluginSource,
  manifestSkills: readonly Skill[],
): SkillSourceValidationResult {
  const errors: string[] = [];
  const seenPaths = new Set<string>();
  const entries = source.skillEntries.filter((entry) => {
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
  const discoveredSkillIds = discoverSourceSkills(entries, errors);
  validateSourceMapping(manifestSkills, discoveredSkillIds, errors);

  const skills: ValidatedSkillInput[] = [];
  for (const [index, manifestSkill] of manifestSkills.entries()) {
    const inspected = inspectSkillSource(entries, manifestSkill, index, errors);
    if (inspected !== null) skills.push({ ...manifestSkill, ...inspected });
  }
  return {
    skills: Object.freeze(skills),
    errors: Object.freeze(errors),
  };
}

function discoverSourceSkills(
  entries: readonly SourceEntry[],
  errors: string[],
): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    const entryPath = String(entry.path);
    const relativePath = entryPath.slice(`${SOURCE_SKILLS_PATH}/`.length);
    if (relativePath.includes("/")) continue;
    if (entry.kind === SourceEntryKind.Directory) {
      ids.add(relativePath);
    } else {
      errors.push(
        `${entryPath}: only skill directories are allowed directly in ${SOURCE_SKILLS_PATH}/`,
      );
    }
  }
  return ids;
}

function validateSourceMapping(
  skills: readonly Skill[],
  discoveredSkillIds: ReadonlySet<string>,
  errors: string[],
): void {
  const manifestIds = new Set(skills.map(({ id }) => id));
  for (const id of discoveredSkillIds) {
    if (!manifestIds.has(id)) {
      errors.push(
        `${SOURCE_SKILLS_PATH}/${id}: source skill is not listed in ${SOURCE_MANIFEST_PATH}`,
      );
    }
  }
  for (const id of manifestIds) {
    if (!discoveredSkillIds.has(id)) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#skills: expected ${SOURCE_SKILLS_PATH}/${id}/SKILL.md`,
      );
    }
  }
}

function inspectSkillSource(
  allEntries: readonly SourceEntry[],
  manifestSkill: Skill,
  index: number,
  errors: string[],
): Pick<
  ValidatedSkillInput,
  "source_path" | "source_body" | "resources"
> | null {
  const sourcePath = `${SOURCE_SKILLS_PATH}/${manifestSkill.id}`;
  const prefix = `${sourcePath}/`;
  const entries = allEntries.filter((entry) =>
    String(entry.path).startsWith(prefix),
  );
  const files = new Map<string, Buffer>();

  for (const entry of entries) {
    const relativePath = String(entry.path).slice(prefix.length);
    const displayPath = `${sourcePath}/${relativePath}`;
    if (relativePath.split("/").includes(".DS_Store")) {
      errors.push(`${displayPath}: unsupported service file`);
      continue;
    }
    if (
      relativePath === RESERVED_REQUIRED_SKILLS_PATH ||
      relativePath.startsWith(`${RESERVED_REQUIRED_SKILLS_PATH}/`)
    ) {
      errors.push(
        `${displayPath}: ${RESERVED_REQUIRED_SKILLS_PATH}/ is owned by the plugin compiler`,
      );
      continue;
    }
    if (entry.kind === SourceEntryKind.File) {
      files.set(relativePath, readSourceBytes(entry));
    }
  }

  const skillFile = files.get("SKILL.md");
  if (skillFile === undefined) {
    errors.push(
      `${SOURCE_MANIFEST_PATH}#/skills/${index}: expected ${sourcePath}/SKILL.md`,
    );
    return null;
  }

  const sourceBody = skillFile.toString("utf8");
  if (/^\uFEFF?---[ \t]*(?:\r?\n|$)/u.test(sourceBody)) {
    errors.push(
      `${sourcePath}/SKILL.md: authored SKILL.md must not contain YAML frontmatter`,
    );
  }
  const markerCount = sourceBody.split(REQUIRED_SKILLS_MARKER).length - 1;
  if (markerCount !== 1) {
    errors.push(
      `${sourcePath}/SKILL.md: expected exactly one ${REQUIRED_SKILLS_MARKER} marker, found ${markerCount}`,
    );
  }

  const sourceFiles = new Set(files.keys());
  for (const [relativePath, content] of files) {
    if (relativePath.endsWith(".md")) {
      errors.push(
        ...validateMarkdownLinks({
          source: content.toString("utf8"),
          markdownPath: relativePath,
          sourceFiles,
          skillPath: sourcePath,
        }),
      );
    }
  }

  return {
    source_path: createProjectPath(sourcePath),
    source_body: sourceBody,
    resources: Object.freeze(
      [...files]
        .filter(([relativePath]) => relativePath !== "SKILL.md")
        .map(([relativePath, content]) => ({
          path: createProjectPath(relativePath),
          content,
        })),
    ),
  };
}

function readSourceBytes(source: SourceFile): Buffer {
  return source.content;
}
