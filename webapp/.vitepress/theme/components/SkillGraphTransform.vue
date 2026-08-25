<template>
  <figure
    class="apc-graph"
    role="img"
    aria-labelledby="skill-graph-title"
    aria-describedby="skill-graph-description"
  >
    <figcaption id="skill-graph-title" class="apc-sr-only">
      From a declared skill graph to self-contained generated skills
    </figcaption>
    <p id="skill-graph-description" class="apc-sr-only">
      The authored manifest declares two independent public skills.
      prepare-change-plan requires one internal skill, inspect-repository.
      write-commit-message requires nothing. That manifest is passed to the
      compiler, which validates the graph and builds a write plan, and compiles
      it into a skills directory containing a generated catalog, a
      prepare-change-plan skill whose Markdown gained a required-skills section
      and which contains a nested copy of inspect-repository, and a standalone
      write-commit-message skill. The internal dependency never appears as a
      skill users can install on its own.
    </p>

    <div class="apc-graph__panel" aria-hidden="true">
      <span class="apc-graph__eyebrow">
        Authored <code>plugin/plugin.yml</code>
      </span>

      <div class="apc-graph__group">
        <div class="apc-graph__node">
          <code>prepare-change-plan</code>
          <span class="apc-graph__tags">
            <i class="apc-tag apc-tag--public">public</i>
            <i class="apc-tag">active</i>
          </span>
        </div>

        <div class="apc-graph__edge">
          <svg class="apc-graph__connector" viewBox="0 0 20 40">
            <defs>
              <marker
                id="apc-sgt-requires"
                markerUnits="userSpaceOnUse"
                markerWidth="9"
                markerHeight="9"
                refX="8"
                refY="4.5"
                orient="auto"
              >
                <path d="M0 0 9 4.5 0 9Z" />
              </marker>
            </defs>
            <path d="M10 1v30" marker-end="url(#apc-sgt-requires)" />
          </svg>
          <span>requires</span>
        </div>

        <div class="apc-graph__node apc-graph__node--required">
          <code>inspect-repository</code>
          <span class="apc-graph__tags">
            <i class="apc-tag apc-tag--internal">internal</i>
            <i class="apc-tag">active</i>
          </span>
        </div>
      </div>

      <div class="apc-graph__group">
        <div class="apc-graph__node">
          <code>write-commit-message</code>
          <span class="apc-graph__tags">
            <i class="apc-tag apc-tag--public">public</i>
            <i class="apc-tag">active</i>
          </span>
        </div>
        <p class="apc-graph__note">requires nothing</p>
      </div>
    </div>

    <div class="apc-graph__step" aria-hidden="true">
      <svg class="apc-graph__connector" viewBox="0 0 20 40">
        <defs>
          <marker
            id="apc-sgt-input"
            markerUnits="userSpaceOnUse"
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
          >
            <path d="M0 0 9 4.5 0 9Z" />
          </marker>
        </defs>
        <path d="M10 1v30" marker-end="url(#apc-sgt-input)" />
      </svg>
      <span>is passed to</span>
    </div>

    <div class="apc-graph__compiler" aria-hidden="true">
      <img src="/logo.svg" alt="" />
      <div>
        <strong>plugin-compiler</strong>
        <span>validate graph · build write plan</span>
      </div>
    </div>

    <div class="apc-graph__step" aria-hidden="true">
      <svg class="apc-graph__connector" viewBox="0 0 20 40">
        <defs>
          <marker
            id="apc-sgt-output"
            markerUnits="userSpaceOnUse"
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
          >
            <path d="M0 0 9 4.5 0 9Z" />
          </marker>
        </defs>
        <path d="M10 1v30" marker-end="url(#apc-sgt-output)" />
      </svg>
      <span>compiles</span>
    </div>

    <div class="apc-graph__panel" aria-hidden="true">
      <span class="apc-graph__eyebrow">
        Generated <code>skills/</code>
      </span>

      <ul class="apc-graph__tree">
        <li class="apc-graph__row apc-graph__row--d0">
          <code>skills/</code>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>README.md</code>
          <span>catalog of installable skills</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>prepare-change-plan/</code>
          <span class="apc-graph__badge">installable</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d2">
          <code>SKILL.md</code>
          <span>frontmatter and required-skills section added</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d2">
          <code>skills/inspect-repository/SKILL.md</code>
          <span>the dependency, nested inside its dependent</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d1">
          <code>write-commit-message/</code>
          <span class="apc-graph__badge">installable</span>
        </li>
        <li class="apc-graph__row apc-graph__row--d2">
          <code>SKILL.md</code>
          <span>no dependencies, so nothing is nested</span>
        </li>
      </ul>
    </div>
  </figure>
</template>
