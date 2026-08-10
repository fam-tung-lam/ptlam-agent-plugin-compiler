import {
  type CategoryId,
  type PluginCategory,
  type SkillId,
  type SkillManifest,
  SkillStatus,
  SkillVisibility,
} from "../../core/index.js";
import { SOURCE_MANIFEST_PATH } from "./parse-plugin-manifest.js";

export interface SkillGraphValidationResult {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** Validate IDs, references, lifecycle policy, cycles, and reachability. */
export function validateSkillGraph(
  categories: readonly PluginCategory[],
  skills: readonly SkillManifest[],
): SkillGraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const categoryCounts = countBy(categories, ({ id }) => id);
  const skillCounts = countBy(skills, ({ id }) => id);
  const categoriesById = new Map<CategoryId, PluginCategory>();
  const skillsById = new Map<SkillId, SkillManifest>();

  categories.forEach((category, index) => {
    if ((categoryCounts.get(category.id) ?? 0) > 1) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#/categories/${index}/id: duplicate category id "${category.id}"`,
      );
    }
    if (!categoriesById.has(category.id))
      categoriesById.set(category.id, category);
  });

  skills.forEach((skill, index) => {
    if ((skillCounts.get(skill.id) ?? 0) > 1) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#/skills/${index}/id: duplicate skill id "${skill.id}"`,
      );
    }
    if (!skillsById.has(skill.id)) skillsById.set(skill.id, skill);
    if (!categoriesById.has(skill.category_id)) {
      errors.push(
        `${SOURCE_MANIFEST_PATH}#/skills/${index}/category_id: unknown category "${skill.category_id}" for skill "${skill.id}"`,
      );
    }
  });

  skills.forEach((skill, index) => {
    validateRequirements(skill, index, skillsById, errors, warnings);
    validateReplacement(skill, index, "deprecation", skillsById, errors);
    validateReplacement(skill, index, "archive", skillsById, errors);
  });

  if (![...skillCounts.values()].some((count) => count > 1)) {
    validateAcyclicGraph(skills, skillsById, errors);
    warnForUnreachableInternalSkills(skills, skillsById, warnings);
  }

  return {
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

function validateRequirements(
  skill: SkillManifest,
  skillIndex: number,
  skillsById: ReadonlyMap<SkillId, SkillManifest>,
  errors: string[],
  warnings: string[],
): void {
  const requirementCounts = countBy(
    skill.required_skills,
    ({ skill_id }) => skill_id,
  );
  for (const [
    requirementIndex,
    requirement,
  ] of skill.required_skills.entries()) {
    const field = `${SOURCE_MANIFEST_PATH}#/skills/${skillIndex}/required_skills/${requirementIndex}/skill_id`;
    if ((requirementCounts.get(requirement.skill_id) ?? 0) > 1) {
      errors.push(
        `${field}: duplicate required skill "${requirement.skill_id}"`,
      );
    }

    const target = skillsById.get(requirement.skill_id);
    if (!target) {
      errors.push(
        `${field}: skill "${skill.id}" references unknown skill "${requirement.skill_id}"`,
      );
      continue;
    }
    if (target.id === skill.id) {
      errors.push(`${field}: skill "${skill.id}" cannot require itself`);
      continue;
    }

    const lifecycleError = dependencyLifecycleError(skill, target);
    if (lifecycleError !== null) errors.push(`${field}: ${lifecycleError}`);
    if (target.status === SkillStatus.Deprecated) {
      warnings.push(
        `${field}: skill "${skill.id}" requires deprecated skill "${target.id}"`,
      );
    }
  }
}

function dependencyLifecycleError(
  owner: SkillManifest,
  dependency: SkillManifest,
): string | null {
  if (owner.status === SkillStatus.Archived) return null;
  if (dependency.status === SkillStatus.Archived) {
    return `non-archived skill "${owner.id}" cannot require archived skill "${dependency.id}"`;
  }
  if (
    (owner.status === SkillStatus.Active ||
      owner.status === SkillStatus.Deprecated) &&
    dependency.status === SkillStatus.Draft
  ) {
    return `${owner.status} skill "${owner.id}" cannot require draft skill "${dependency.id}"`;
  }
  return null;
}

function validateReplacement(
  skill: SkillManifest,
  index: number,
  fieldName: "deprecation" | "archive",
  skillsById: ReadonlyMap<SkillId, SkillManifest>,
  errors: string[],
): void {
  const replacementId = skill[fieldName]?.replacement_skill_id;
  if (!replacementId) return;
  const field = `${SOURCE_MANIFEST_PATH}#/skills/${index}/${fieldName}/replacement_skill_id`;
  const replacement = skillsById.get(replacementId);
  if (!replacement) {
    errors.push(`${field}: references unknown skill "${replacementId}"`);
  } else if (replacementId === skill.id) {
    errors.push(`${field}: skill "${skill.id}" cannot replace itself`);
  } else if (
    replacement.status !== SkillStatus.Active ||
    replacement.visibility !== SkillVisibility.Public
  ) {
    errors.push(
      `${field}: replacement skill "${replacementId}" must be active and public`,
    );
  }
}

function validateAcyclicGraph(
  skills: readonly SkillManifest[],
  skillsById: ReadonlyMap<SkillId, SkillManifest>,
  errors: string[],
): void {
  const state = new Map<SkillId, 1 | 2>();
  const stack: SkillId[] = [];
  let cycleReported = false;

  function visitSkill(skillId: SkillId): void {
    state.set(skillId, 1);
    stack.push(skillId);
    const skill = skillsById.get(skillId);
    if (skill === undefined) return;
    for (const { skill_id: target } of skill.required_skills) {
      if (!skillsById.has(target) || target === skillId) continue;
      if (state.get(target) === 1 && !cycleReported) {
        const cycle = [...stack.slice(stack.indexOf(target)), target];
        errors.push(
          `${SOURCE_MANIFEST_PATH}#skills: required_skills must form an acyclic graph; found ${cycle.join(" -> ")}`,
        );
        cycleReported = true;
      } else if (!state.has(target)) {
        visitSkill(target);
      }
    }
    stack.pop();
    state.set(skillId, 2);
  }

  for (const skill of skills) {
    if (!state.has(skill.id)) visitSkill(skill.id);
  }
}

function warnForUnreachableInternalSkills(
  skills: readonly SkillManifest[],
  skillsById: ReadonlyMap<SkillId, SkillManifest>,
  warnings: string[],
): void {
  const reachable = new Set<SkillId>();
  const roots = skills.filter(
    (skill) =>
      skill.visibility === SkillVisibility.Public &&
      (skill.status === SkillStatus.Active ||
        skill.status === SkillStatus.Deprecated),
  );

  function visitSkill(skill: SkillManifest): void {
    if (reachable.has(skill.id)) return;
    reachable.add(skill.id);
    for (const { skill_id } of skill.required_skills) {
      const target = skillsById.get(skill_id);
      if (target) visitSkill(target);
    }
  }

  roots.forEach(visitSkill);
  for (const skill of skills) {
    if (
      skill.visibility === SkillVisibility.Internal &&
      skill.status === SkillStatus.Active &&
      !reachable.has(skill.id)
    ) {
      warnings.push(
        `${SOURCE_MANIFEST_PATH}#skills: internal active skill "${skill.id}" is unreachable from published outputs`,
      );
    }
  }
}

function countBy<T, K>(
  items: Iterable<T>,
  keyOf: (item: T) => K,
): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
