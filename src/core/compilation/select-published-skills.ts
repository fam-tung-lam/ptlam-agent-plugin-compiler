import { type Skill, SkillStatus, SkillVisibility } from "../models/skill.js";

/** Select public skills whose lifecycle permits publication as root skills. */
export function selectPublishedSkills<T extends Skill>(
  skills: readonly T[],
): readonly T[] {
  return Object.freeze(
    skills.filter(
      (skill) =>
        skill.visibility === SkillVisibility.Public &&
        (skill.status === SkillStatus.Active ||
          skill.status === SkillStatus.Deprecated),
    ),
  );
}
