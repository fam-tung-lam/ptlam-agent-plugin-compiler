import { type Skill, SkillStatus, SkillVisibility } from "./skill.js";

/**
 * Select public skills whose lifecycle permits publication as root skills.
 *
 * @param skills - Validated skills to filter without mutation.
 * @returns A frozen array containing public active and deprecated skills in
 * their original order.
 */
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
