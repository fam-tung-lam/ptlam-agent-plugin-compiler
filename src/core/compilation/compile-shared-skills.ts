import path from "node:path";

import { format } from "prettier";
import { stringify } from "yaml";

import {
  createOutputFragment,
  OutputEntryKind,
  type OutputFragment,
  OutputOwnershipKind,
  type PlannedArtifactInput,
} from "../models/output.js";
import type { ValidatedPlugin } from "../models/plugin.js";
import { createProjectPath } from "../models/project-path.js";
import {
  REQUIRED_SKILLS_MARKER,
  type ValidatedSkill,
} from "../models/skill.js";
import { validateMarkdownLinks } from "../validation/validate-markdown-links.js";
import { renderSkillsCatalog } from "./render-skills-catalog.js";
import { selectPublishedSkills } from "./select-published-skills.js";

const SKILLS_ROOT = createProjectPath("skills");

export class SharedSkillsCompilationError extends Error {
  override readonly name = "SharedSkillsCompilationError";
  readonly errors: readonly string[];

  constructor(errors: Iterable<string>) {
    const normalized = Object.freeze([...new Set(errors)].filter(Boolean));
    super(
      `Shared skills compilation failed:\n${normalized
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
    this.errors = normalized;
  }
}

function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeNewlines(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function renderFrontmatter(skill: ValidatedSkill): string {
  return `---\n${stringify(
    { name: skill.id, description: skill.description },
    { lineWidth: 0 },
  ).trimEnd()}\n---`;
}

function renderRequiredSkills(skill: ValidatedSkill): string {
  if (skill.required_skills.length === 0) return "";
  const sections = ["## Required skills"];
  for (const requirement of skill.required_skills) {
    sections.push(
      `### \`${requirement.skill_id}\``,
      `**Reason:** ${requirement.reason}`,
      `**Instructions:** ${requirement.instructions}`,
      `Read [${requirement.skill_id}](skills/${requirement.skill_id}/SKILL.md).`,
    );
  }
  return sections.join("\n\n");
}

function renderSkillManifest(skill: ValidatedSkill): string {
  const sourceBody = normalizeNewlines(skill.source_body);
  const requiredSkills = renderRequiredSkills(skill);
  if (requiredSkills) {
    return `${renderFrontmatter(skill)}\n\n${sourceBody.replace(
      REQUIRED_SKILLS_MARKER,
      requiredSkills,
    )}`;
  }

  const markerIndex = sourceBody.indexOf(REQUIRED_SKILLS_MARKER);
  if (markerIndex === -1) {
    throw new SharedSkillsCompilationError([
      `${String(skill.source_path)}/SKILL.md: required-skills marker is missing`,
    ]);
  }
  const before = sourceBody.slice(0, markerIndex);
  let after = sourceBody.slice(markerIndex + REQUIRED_SKILLS_MARKER.length);
  if (before.endsWith("\n\n") && after.startsWith("\n\n")) {
    after = after.slice(2);
  }
  return `${renderFrontmatter(skill)}\n\n${before}${after}`;
}

async function formatComposedSkill(content: string): Promise<string> {
  const closing = "\n---\n";
  const closingIndex = content.indexOf(closing, 4);
  if (!content.startsWith("---\n") || closingIndex === -1) {
    throw new SharedSkillsCompilationError([
      "Composed SKILL.md is missing generated frontmatter",
    ]);
  }
  const formattedFrontmatter = await format(content.slice(4, closingIndex), {
    parser: "yaml",
    proseWrap: "always",
  });
  return `---\n${formattedFrontmatter}---\n${content.slice(
    closingIndex + closing.length,
  )}`;
}

function addFile(
  files: Map<string, string | Buffer>,
  filePath: string,
  content: string | Buffer,
): void {
  if (files.has(filePath)) {
    throw new SharedSkillsCompilationError([
      `${filePath}: duplicate composed skill path`,
    ]);
  }
  files.set(filePath, content);
}

function composeSkillTree({
  skill,
  skillsById,
  outputRoot,
  files,
}: {
  readonly skill: ValidatedSkill;
  readonly skillsById: ReadonlyMap<string, ValidatedSkill>;
  readonly outputRoot: string;
  readonly files: Map<string, string | Buffer>;
}): void {
  addFile(files, `${outputRoot}/SKILL.md`, renderSkillManifest(skill));
  for (const resource of [...skill.resources].sort((left, right) =>
    compareCodePoints(String(left.path), String(right.path)),
  )) {
    addFile(files, `${outputRoot}/${String(resource.path)}`, resource.content);
  }
  for (const requirement of skill.required_skills) {
    const requiredSkill = skillsById.get(requirement.skill_id);
    if (!requiredSkill) {
      throw new SharedSkillsCompilationError([
        `Validated skill ${skill.id} references missing skill ${requirement.skill_id}`,
      ]);
    }
    composeSkillTree({
      skill: requiredSkill,
      skillsById,
      outputRoot: `${outputRoot}/skills/${requiredSkill.id}`,
      files,
    });
  }
}

function collectDirectories(filePaths: Iterable<string>): string[] {
  const directories = new Set<string>([String(SKILLS_ROOT)]);
  for (const filePath of filePaths) {
    let directory = path.posix.dirname(filePath);
    while (directory === "skills" || directory.startsWith("skills/")) {
      directories.add(directory);
      if (directory === "skills") break;
      directory = path.posix.dirname(directory);
    }
  }
  return [...directories].sort(compareCodePoints);
}

function validateGeneratedMarkdown(
  files: ReadonlyMap<string, string | Buffer>,
  publishedSkillIds: readonly string[],
): void {
  const diagnostics: string[] = [];
  for (const skillId of publishedSkillIds) {
    const prefix = `skills/${skillId}/`;
    const sourceFiles = new Set(
      [...files.keys()]
        .filter((candidate) => candidate.startsWith(prefix))
        .map((candidate) => candidate.slice(prefix.length)),
    );
    for (const [filePath, content] of files) {
      if (!filePath.startsWith(prefix) || !filePath.endsWith(".md")) continue;
      diagnostics.push(
        ...validateMarkdownLinks({
          source: Buffer.isBuffer(content) ? content.toString("utf8") : content,
          markdownPath: filePath.slice(prefix.length),
          sourceFiles,
          skillPath: `skills/${skillId}`,
        }),
      );
    }
  }
  if (diagnostics.length > 0) {
    throw new SharedSkillsCompilationError(diagnostics);
  }
}

/** Compile one complete provider-neutral root skills tree. */
export async function compileSharedSkills(
  plugin: ValidatedPlugin,
): Promise<OutputFragment> {
  const skillsById = new Map(plugin.skills.map((skill) => [skill.id, skill]));
  const publishedSkills = selectPublishedSkills(plugin.skills);
  const files = new Map<string, string | Buffer>();
  addFile(
    files,
    "skills/README.md",
    renderSkillsCatalog(plugin, publishedSkills),
  );
  for (const skill of publishedSkills) {
    composeSkillTree({
      skill,
      skillsById,
      outputRoot: `skills/${skill.id}`,
      files,
    });
  }

  for (const [filePath, content] of files) {
    if (filePath.endsWith("/SKILL.md") && typeof content === "string") {
      files.set(filePath, await formatComposedSkill(content));
    }
  }
  validateGeneratedMarkdown(
    files,
    publishedSkills.map((skill) => skill.id),
  );

  const artifacts: PlannedArtifactInput[] = [
    ...collectDirectories(files.keys()).map((directory) => ({
      kind: OutputEntryKind.Directory as const,
      path: createProjectPath(directory),
    })),
    ...[...files].map(([filePath, content]) => ({
      kind: OutputEntryKind.File as const,
      path: createProjectPath(filePath),
      content: Buffer.from(content),
    })),
  ];
  return createOutputFragment({
    ownerId: "shared-skills",
    ownership: {
      kind: OutputOwnershipKind.CompleteTree,
      root: SKILLS_ROOT,
    },
    artifacts,
  });
}
