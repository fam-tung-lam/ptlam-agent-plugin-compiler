import stringWidth from "string-width";

import {
  type CategoryId,
  type Plugin,
  type Skill,
  type SkillId,
  SkillStatus,
  SkillVisibility,
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

function mermaidLabel(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function collectCatalogSkills(
  plugin: Plugin,
  publishedSkills: readonly Skill[],
): readonly Skill[] {
  const skillsById = new Map(plugin.skills.map((skill) => [skill.id, skill]));
  const reachableSkillIds = new Set<SkillId>();

  function visitSkill(skill: Skill): void {
    if (reachableSkillIds.has(skill.id)) return;
    reachableSkillIds.add(skill.id);
    for (const requirement of skill.required_skills) {
      const requiredSkill = skillsById.get(requirement.skill_id);
      if (requiredSkill === undefined) {
        throw new Error(
          `Skill ${skill.id} references missing skill ${requirement.skill_id}`,
        );
      }
      visitSkill(requiredSkill);
    }
  }

  publishedSkills.forEach(visitSkill);
  return plugin.skills.filter((skill) => reachableSkillIds.has(skill.id));
}

function renderSkillCategorySubgraphs(
  plugin: Plugin,
  graphSkills: readonly Skill[],
  nodeIds: ReadonlyMap<SkillId, string>,
): readonly string[] {
  const skillsByCategory = new Map<CategoryId, Skill[]>(
    plugin.categories.map((category) => [category.id, []]),
  );
  for (const skill of graphSkills) {
    const categorySkills = skillsByCategory.get(skill.category_id);
    if (categorySkills === undefined) {
      throw new Error(`Skill ${skill.id} references an unknown category`);
    }
    categorySkills.push(skill);
  }

  const lines: string[] = [];
  plugin.categories.forEach((category, categoryIndex) => {
    const categorySkills = skillsByCategory.get(category.id) ?? [];
    if (categorySkills.length === 0) return;

    lines.push(
      `    subgraph SkillCategory${categoryIndex}["${mermaidLabel(category.name)}"]`,
    );
    for (const skill of categorySkills) {
      const visibility =
        skill.visibility === SkillVisibility.Public
          ? "public root"
          : "internal dependency";
      const lifecycle =
        skill.status === SkillStatus.Deprecated ? ", deprecated" : "";
      lines.push(
        `        ${nodeIds.get(skill.id)}["${mermaidLabel(
          `${skill.id} [${visibility}${lifecycle}]`,
        )}"]`,
      );
    }
    lines.push("    end");
  });
  return lines;
}

function renderSkillDependencyGraph(
  plugin: Plugin,
  publishedSkills: readonly Skill[],
): string {
  if (publishedSkills.length === 0) {
    return [
      "## Skill dependency graph",
      "",
      "No skills are currently published.",
    ].join("\n");
  }

  const graphSkills = collectCatalogSkills(plugin, publishedSkills);
  const nodeIds = new Map(
    plugin.skills.map((skill, index) => [skill.id, `SkillNode${index}`]),
  );
  const graphSkillIds = new Set(graphSkills.map((skill) => skill.id));
  const lines = [
    "## Skill dependency graph",
    "",
    "Arrows point from a dependent skill to the skill it requires.",
    "",
    "```mermaid",
    "flowchart LR",
    ...renderSkillCategorySubgraphs(plugin, graphSkills, nodeIds),
  ];

  const renderedEdges = new Set<string>();
  for (const skill of graphSkills) {
    for (const requirement of skill.required_skills) {
      if (!graphSkillIds.has(requirement.skill_id)) continue;
      const edge = `${skill.id}\0${requirement.skill_id}`;
      if (renderedEdges.has(edge)) continue;
      renderedEdges.add(edge);
      lines.push(
        `    ${nodeIds.get(skill.id)} --> ${nodeIds.get(requirement.skill_id)}`,
      );
    }
  }

  lines.push(
    "    classDef publicRoot fill:#dbeafe,stroke:#1d4ed8,color:#172554",
    "    classDef internalDependency fill:#f3f4f6,stroke:#4b5563,color:#111827,stroke-dasharray:5 5",
    "    classDef deprecated fill:#fef3c7,stroke:#b45309,color:#78350f",
  );
  for (const skill of graphSkills) {
    const visibilityClass =
      skill.visibility === SkillVisibility.Public
        ? "publicRoot"
        : "internalDependency";
    lines.push(`    class ${nodeIds.get(skill.id)} ${visibilityClass}`);
    if (skill.status === SkillStatus.Deprecated) {
      lines.push(`    class ${nodeIds.get(skill.id)} deprecated`);
    }
  }
  lines.push("```");
  return lines.join("\n");
}

/**
 * Renders the generated skills catalog body without root README markers.
 *
 * @param plugin - Validated plugin supplying category metadata.
 * @param publishedSkills - Published skills to list, in desired row order.
 * @returns A newline-terminated Markdown catalog section.
 * @throws {Error} If a skill references unknown category or dependency data, deprecated metadata is missing, or a table cell contains unsupported characters.
 */
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
      skill.visibility,
      status,
      replacement,
    ];
  });

  return `${[
    "## Available skills",
    "",
    renderMarkdownTable(
      [
        "Skill",
        "Category",
        "Description",
        "Visibility",
        "Status",
        "Replacement",
      ],
      rows,
    ),
    "",
    renderSkillDependencyGraph(plugin, publishedSkills),
  ].join("\n")}\n`;
}
