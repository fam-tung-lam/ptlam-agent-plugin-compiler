<template>
  <section class="apc-capabilities" aria-labelledby="capabilities-title">
    <header class="apc-capabilities__header">
      <span class="apc-kicker">WHAT THE COMPILER GIVES YOU</span>
      <h2 id="capabilities-title">
        From a skill graph to a release-ready plugin.
      </h2>
    </header>

    <div class="apc-capabilities__grid">
      <article class="apc-capability apc-capability--graph">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">01 / MODEL</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="7" cy="8" r="3" />
            <circle cx="25" cy="8" r="3" />
            <circle cx="16" cy="24" r="3" />
            <path d="M9.7 9.5 14.3 21M22.3 9.5 17.7 21M10 8h12" />
          </svg>
        </div>
        <h3>Declare the graph and lifecycle</h3>
        <p>
          Give dependencies, visibility, status, migration guidance, and
          manual-only invocation one source of truth in
          <code>plugin/plugin.yml</code>.
        </p>
      </article>

      <article class="apc-capability apc-capability--source">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">02 / VALIDATE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M8 4h11l5 5v19H8z" />
            <path d="M19 4v6h6M12 16h8M12 21h8" />
          </svg>
        </div>
        <h3>Catch stale contracts before output</h3>
        <p>
          Validate schema, source layout, Markdown links, lifecycle rules, and
          recursive dependencies before any generated path changes.
        </p>
      </article>

      <article class="apc-capability apc-capability--output">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">03 / PACKAGE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="m6 17 6 6L26 9" />
            <path d="M6 8h9M6 13h6M20 24h6" />
          </svg>
        </div>
        <h3>Ship complete installable skills</h3>
        <p>
          Compile each public root with generated frontmatter, dependency
          instructions, supporting files, and every required skill nested
          recursively.
        </p>
      </article>

      <article class="apc-capability apc-capability--catalog">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">04 / CATALOG</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="8" cy="8" r="3" />
            <circle cx="24" cy="8" r="3" />
            <circle cx="16" cy="24" r="3" />
            <path d="M10.5 9.5 14.5 21M21.5 9.5 17.5 21" />
          </svg>
        </div>
        <h3>Review the published graph</h3>
        <p>
          Generate an installable-skill table and Mermaid dependency graph,
          grouped by category and labelled with lifecycle status and visibility.
        </p>
      </article>

      <article class="apc-capability apc-capability--providers">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">05 / TRANSLATE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="4" y="5" width="9" height="9" rx="2" />
            <rect x="19" y="5" width="9" height="9" rx="2" />
            <rect x="4" y="19" width="9" height="9" rx="2" />
            <rect x="19" y="19" width="9" height="9" rx="2" />
          </svg>
        </div>
        <h3>Target five hosts from one source</h3>
        <p>
          Emit exact manifests and translate portable hooks only where Claude,
          Codex, Copilot, Gemini, or Kimi exposes equivalent native events.
        </p>
      </article>

      <article class="apc-capability apc-capability--verify">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">06 / VERIFY</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M16 4 27 9v7c0 6.5-4.5 10.5-11 12-6.5-1.5-11-5.5-11-12V9z"
            />
            <path d="m10.5 16 3.5 3.5 7.5-8" />
          </svg>
        </div>
        <h3>Make generated state a build gate</h3>
        <p>
          Write bounded output with atomic file and tree operations, verify it
          from disk, and use read-only <code>check</code> to fail CI on
          deterministic drift.
        </p>
      </article>
    </div>
  </section>
</template>
