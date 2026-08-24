import path from "node:path";

import { fromMarkdown } from "mdast-util-from-markdown";
import { format } from "prettier";
import { stringify } from "yaml";

import {
  type ArtifactInput,
  ArtifactKind,
  createPlanFragment,
  createProjectPath,
  MARKDOWN_REFERENCES_MARKER,
  OwnershipKind,
  type PlanFragment,
  type Plugin,
  REQUIRED_SKILLS_MARKER,
  type Skill,
  type SkillId,
  type SkillResource,
  selectPublishedSkills,
} from "../../core/index.js";
import { validateMarkdownLinks } from "../validation/index.js";
import { renderSkillsCatalog } from "./render-skills-catalog.js";
import { rewriteMarkdownDestinations } from "./rewrite-markdown-destinations.js";

const SKILLS_ROOT = createProjectPath("skills");

/** Reports one or more failures while composing the shared generated skills tree. */
export class SharedSkillsCompilationError extends Error {
  /** Stable error class name. */
  override readonly name = "SharedSkillsCompilationError";
  /** Deduplicated composition and generated-Markdown diagnostics. */
  readonly errors: readonly string[];

  /**
   * @param errors - Composition diagnostics to normalize and snapshot.
   */
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

function renderFrontmatter(skill: Skill): string {
  return `---\n${stringify(
    {
      name: skill.id,
      description: skill.description,
      ...(skill.disable_model_invocation
        ? { "disable-model-invocation": true }
        : {}),
    },
    { lineWidth: 0 },
  ).trimEnd()}\n---`;
}

function renderRequiredSkills(skill: Skill): string {
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

function defaultRequiredSkillsOffset(sourceBody: string): number {
  const blocks = fromMarkdown(sourceBody).children;
  const titleIndex = blocks.findIndex(
    (block) => block.type === "heading" && block.depth === 1,
  );
  if (titleIndex === -1) return 0;

  let boundaryIndex = titleIndex + 1;
  while (blocks[boundaryIndex]?.type === "paragraph") boundaryIndex += 1;
  return blocks[boundaryIndex]?.position?.start.offset ?? sourceBody.length;
}

function insertMarkdownSection(
  sourceBody: string,
  offset: number,
  section: string,
): string {
  const before = sourceBody.slice(0, offset);
  const after = sourceBody.slice(offset);
  const beforeSeparator =
    before.length === 0 || before.endsWith("\n\n")
      ? ""
      : before.endsWith("\n")
        ? "\n"
        : "\n\n";
  if (after.length === 0) {
    return `${before}${beforeSeparator}${section}${before.endsWith("\n") ? "\n" : ""}`;
  }
  const afterSeparator = after.startsWith("\n\n")
    ? ""
    : after.startsWith("\n")
      ? "\n"
      : "\n\n";
  return `${before}${beforeSeparator}${section}${afterSeparator}${after}`;
}

function composeRequiredSkills(skill: Skill, sourceBody: string): string {
  const requiredSkills = renderRequiredSkills(skill);
  if (requiredSkills) {
    return sourceBody.includes(REQUIRED_SKILLS_MARKER)
      ? sourceBody.replace(REQUIRED_SKILLS_MARKER, requiredSkills)
      : insertMarkdownSection(
          sourceBody,
          defaultRequiredSkillsOffset(sourceBody),
          requiredSkills,
        );
  }

  return removeMarker(sourceBody, REQUIRED_SKILLS_MARKER);
}

function removeMarker(sourceBody: string, marker: string): string {
  const markerIndex = sourceBody.indexOf(marker);
  if (markerIndex === -1) {
    return sourceBody;
  }
  const before = sourceBody.slice(0, markerIndex);
  let after = sourceBody.slice(markerIndex + marker.length);
  if (before.endsWith("\n\n") && after.startsWith("\n\n")) {
    after = after.slice(2);
  }
  return `${before}${after}`;
}

function isInlineMarkdownReference(resource: SkillResource): boolean {
  const resourcePath = String(resource.path);
  return resourcePath.startsWith("references/") && resourcePath.endsWith(".md");
}

function inlineMarkdownReferences(skill: Skill, sourceBody: string): string {
  if (skill.compilation.markdown_references !== "inline") {
    return sourceBody;
  }

  const references = skill.resources
    .filter(isInlineMarkdownReference)
    .sort((left, right) =>
      compareCodePoints(String(left.path), String(right.path)),
    );
  const inlinedMarkdownPaths = new Set(
    references.map((resource) => String(resource.path)),
  );
  const rewrittenSource = rewriteMarkdownDestinations({
    source: sourceBody,
    markdownPath: "SKILL.md",
    inlinedMarkdownPaths,
  });
  const inlinedContent = references
    .map((resource) =>
      rewriteMarkdownDestinations({
        source: normalizeNewlines(resource.content.toString("utf8")),
        markdownPath: String(resource.path),
        inlinedMarkdownPaths,
      }),
    )
    .join("\n\n");
  if (inlinedContent === "") {
    return removeMarker(rewrittenSource, MARKDOWN_REFERENCES_MARKER);
  }
  if (rewrittenSource.includes(MARKDOWN_REFERENCES_MARKER)) {
    return rewrittenSource.replace(MARKDOWN_REFERENCES_MARKER, inlinedContent);
  }
  return insertMarkdownSection(
    rewrittenSource,
    rewrittenSource.length,
    inlinedContent,
  );
}

function renderSkillDocument(skill: Skill): string {
  const sourceBody = normalizeNewlines(skill.source_body);
  const requiredSkillsComposed = composeRequiredSkills(skill, sourceBody);
  const fullyComposed = inlineMarkdownReferences(skill, requiredSkillsComposed);
  return `${renderFrontmatter(skill)}\n\n${fullyComposed}`;
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
  readonly skill: Skill;
  readonly skillsById: ReadonlyMap<SkillId, Skill>;
  readonly outputRoot: string;
  readonly files: Map<string, string | Buffer>;
}): void {
  addFile(files, `${outputRoot}/SKILL.md`, renderSkillDocument(skill));
  for (const resource of [...skill.resources].sort((left, right) =>
    compareCodePoints(String(left.path), String(right.path)),
  )) {
    if (
      skill.compilation.markdown_references === "inline" &&
      isInlineMarkdownReference(resource)
    ) {
      continue;
    }
    addFile(files, `${outputRoot}/${String(resource.path)}`, resource.content);
  }
  for (const requirement of skill.required_skills) {
    const requiredSkill = skillsById.get(requirement.skill_id);
    if (!requiredSkill) {
      throw new SharedSkillsCompilationError([
        `Skill ${skill.id} references missing skill ${requirement.skill_id}`,
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
  publishedSkillIds: readonly SkillId[],
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

/**
 * Composes the provider-neutral `skills/` tree for every published skill.
 *
 * @param plugin - Validated domain plugin to render.
 * @returns A complete-tree plan fragment containing the catalog, skill documents, dependencies, and resources.
 * @throws {SharedSkillsCompilationError} If paths collide, required skills are missing, generated Markdown is invalid, or frontmatter formatting fails.
 */
export async function compileSharedSkills(
  plugin: Plugin,
): Promise<PlanFragment> {
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

  const artifacts: ArtifactInput[] = [
    ...collectDirectories(files.keys()).map((directory) => ({
      kind: ArtifactKind.Directory as const,
      path: createProjectPath(directory),
    })),
    ...[...files].map(([filePath, content]) => ({
      kind: ArtifactKind.File as const,
      path: createProjectPath(filePath),
      content: Buffer.from(content),
    })),
  ];
  return createPlanFragment({
    ownerId: "shared-skills",
    ownership: {
      kind: OwnershipKind.CompleteTree,
      root: SKILLS_ROOT,
    },
    artifacts,
  });
}
