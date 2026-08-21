## Available Skills

Arrows point from a dependent skill to the skill it requires.

```mermaid
---
config:
  htmlLabels: false
---
flowchart TB
    subgraph SkillCategory0["Engineering"]
        SkillNode0["`
            inspect-repository
            (active/internal)
        `"]
        SkillNode1["`
            prepare-change-plan
            (active/public)
        `"]
        SkillNode2["`
            write-commit-message
            (active/public)
        `"]
    end
    SkillNode1 --> SkillNode0
    classDef publicSkill fill:#dbeafe,stroke:#1d4ed8,color:#172554
    classDef internalSkill fill:#f3f4f6,stroke:#4b5563,color:#111827,stroke-dasharray:5 5
    classDef deprecatedSkill fill:#fef3c7,stroke:#b45309,color:#78350f
    class SkillNode0 internalSkill
    class SkillNode1 publicSkill
    class SkillNode2 publicSkill
```

| Skill                  | Category    | Description                                                                                                                     | Visibility | Status | Replacement |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------- |
| `prepare-change-plan`  | Engineering | Create a focused implementation plan for a repository change. Use when the user asks how to implement a scoped codebase change. | public     | Active | —           |
| `write-commit-message` | Engineering | Write a concise Conventional Commit message from a change summary or diff. Use when the user asks for a commit message.         | public     | Active | —           |
