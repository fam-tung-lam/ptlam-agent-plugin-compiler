# Tree view

This reference owns Mermaid tree-view indentation, directory markers,
descriptions, and icons for directory-like hierarchies. The shared workflow and
acceptance rules remain in `SKILL.md`.

## Use and compatibility

Use `treeView-beta` for every folder or file hierarchy and for other inventories
whose meaning is primarily parent-child nesting. Fence these hierarchies as
`mermaid`, not `text`. Use a mindmap for conceptual branches and a flowchart for
dependencies or cross-links.

Tree view requires Mermaid 11.14 or later. When the target lacks it, return a
plain text tree or a flowchart according to whether visual rendering or exact
directory notation matters more, and name the substitution.

## Encode the hierarchy

Prefer indentation input because it is easy to revise and review. Use exactly
four spaces per level. Mark directories with a trailing `/`; Mermaid renders
them as directories and bold labels. Quote a label when it contains spaces.

```mermaid
treeView-beta
    project/
        src/
            index.ts
        package.json
```

Box-drawing input with `├──`, `└──`, and `│` is valid when converting an
existing text tree, but do not mix it with indentation input in the same
diagram. Preserve the source's order when it conveys build, navigation, or
review priority; otherwise use the project's established directory ordering.

Add `## description` only when the node's role cannot be inferred from its
label. Keep descriptions short and parallel. Use `:::highlight` for the one or
few nodes the visual question emphasizes, not as a substitute for explaining the
selection.

Built-in file and folder icons appear only when `treeView.showIcons` is true.
Filename and extension icon maps require a registered icon pack. Use explicit
`icon(...)` only after confirming that registration; otherwise keep the diagram
portable without icons.

## Template

```mermaid
treeView-beta
    checkout-service/
        src/
            api/
                create-order.ts ## HTTP entry point
            domain/
                order.ts
            persistence/
                order-repository.ts
        tests/
            create-order.test.ts
        package.json
```

## Completion check

Confirm that indentation matches the actual parent-child hierarchy, every
directory has a trailing slash, sibling order is intentional, and descriptions
do not repeat labels. Remove dependency or runtime-flow claims that tree-view
syntax cannot express.
