import stringWidth from "string-width";

import {
  type CategoryId,
  type Plugin,
  type Skill,
  SkillStatus,
} from "../../core/index.js";

function markdownCell(value: string): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (/[\p{Cc}\p{Cf}\p{Cs}]/u.test(normalized)) {
    throw new Error(
      "Markdown table cells must not contain control, format, or surrogate characters",
    );
  }
  return normalized.replaceAll("\\", "\\\\").replaceAll("|", "\\|");
}

function renderMarkdownTable(headers: string[], rows: string[][]): string {
  const cells = [headers, ...rows].map((row) => row.map(markdownCell));
  const widths = headers.map((_, column) =>
    Math.max(3, ...cells.map((row) => stringWidth(row[column] ?? ""))),
  );
  const renderRow = (row: string[]): string =>
    `| ${row
      .map(
        (cell, column) =>
          `${cell}${" ".repeat((widths[column] ?? 0) - stringWidth(cell))}`,
      )
      .join(" | ")} |`;
  const headerRow = cells[0];
  if (headerRow === undefined) throw new Error("Markdown table needs headers");
  return [
    renderRow(headerRow),
    `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`,
    ...cells.slice(1).map(renderRow),
  ].join("\n");
}

function requireCategoryName(
  categoryNames: ReadonlyMap<CategoryId, string>,
  skill: Skill,
): string {
  const categoryName = categoryNames.get(skill.category_id);
  if (categoryName === undefined) {
    throw new Error(`Skill ${skill.id} references an unknown category`);
  }
  return categoryName;
}

/** Render the complete generated skills catalog without root README markers. */
export function renderSkillsCatalog(
  plugin: Plugin,
  publishedSkills: readonly Skill[],
): string {
  const categoryNames = new Map(
    plugin.categories.map((category) => [category.id, category.name]),
  );
  const rows = publishedSkills.map((skill) => {
    const deprecated = skill.status === SkillStatus.Deprecated;
    if (deprecated && skill.deprecation === undefined) {
      throw new Error(
        `Deprecated skill ${skill.id} has no deprecation metadata`,
      );
    }
    const status = deprecated
      ? `Deprecated — ${skill.deprecation?.reason} ${skill.deprecation?.instructions}`
      : "Active";
    const replacement = skill.deprecation?.replacement_skill_id
      ? `\`${skill.deprecation.replacement_skill_id}\``
      : "—";
    return [
      `\`${skill.id}\``,
      requireCategoryName(categoryNames, skill),
      skill.description,
      status,
      replacement,
    ];
  });

  return `${[
    "## Available skills",
    "",
    renderMarkdownTable(
      ["Skill", "Category", "Description", "Status", "Replacement"],
      rows,
    ),
  ].join("\n")}\n`;
}
