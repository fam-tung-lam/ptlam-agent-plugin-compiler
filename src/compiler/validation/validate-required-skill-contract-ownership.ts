import type { SkillManifest } from "../../core/index.js";

const SKILL_ID_TOKEN_CHARACTER = /[a-z0-9-]/u;

interface ValidateRequiredSkillContractOwnershipRequest {
  /** Authored Markdown text to inspect. */
  readonly source: string;
  /** Skill-relative path displayed in diagnostics. */
  readonly markdownPath: string;
  /** Manifest declaration that owns this authored Markdown surface. */
  readonly skill: SkillManifest;
  /** Logical authored skill root displayed in diagnostics. */
  readonly skillPath: string;
}

/**
 * Rejects dependency IDs repeated outside their manifest-owned contract.
 *
 * @param request.source - Authored Markdown text to inspect.
 * @param request.markdownPath - Skill-relative path displayed in diagnostics.
 * @param request.skill - Manifest declaration that owns the Markdown surface.
 * @param request.skillPath - Logical authored skill root displayed in diagnostics.
 * @returns One path, line, and column diagnostic for every exact occurrence.
 */
export function validateRequiredSkillContractOwnership({
  source,
  markdownPath,
  skill,
  skillPath,
}: ValidateRequiredSkillContractOwnershipRequest): string[] {
  if (
    skill.required_skills.length === 0 ||
    !isDependencyContractSurface(markdownPath)
  ) {
    return [];
  }

  const errors: string[] = [];
  for (const [lineIndex, line] of source.split(/\r?\n/u).entries()) {
    for (const { skill_id: requiredSkillId } of skill.required_skills) {
      for (const column of exactSkillIdColumns(line, requiredSkillId)) {
        errors.push(
          `${skillPath}/${markdownPath}:${lineIndex + 1}:${column}: owning skill "${skill.id}" repeats required skill "${requiredSkillId}"; declare required-skill contracts only in plugin/plugin.yml and use the generated top-level required-skills block`,
        );
      }
    }
  }
  return errors;
}

function isDependencyContractSurface(markdownPath: string): boolean {
  return (
    markdownPath === "SKILL.md" ||
    (markdownPath.startsWith("references/") && markdownPath.endsWith(".md"))
  );
}

function exactSkillIdColumns(line: string, skillId: string): number[] {
  const columns: number[] = [];
  let offset = 0;

  while (offset < line.length) {
    const index = line.indexOf(skillId, offset);
    if (index === -1) break;

    const previous = line[index - 1];
    const next = line[index + skillId.length];
    if (
      (previous === undefined || !SKILL_ID_TOKEN_CHARACTER.test(previous)) &&
      (next === undefined || !SKILL_ID_TOKEN_CHARACTER.test(next))
    ) {
      columns.push(index + 1);
    }
    offset = index + skillId.length;
  }

  return columns;
}
