<template>
  <section class="apc-capabilities" aria-labelledby="capabilities-title">
    <header class="apc-capabilities__header">
      <span class="apc-kicker">COMPILER GUARANTEES</span>
      <h2 id="capabilities-title">One source. Checked all the way through.</h2>
    </header>

    <div class="apc-capabilities__grid">
      <article class="apc-capability apc-capability--graph">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">01 / GRAPH</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="7" cy="8" r="3" />
            <circle cx="25" cy="8" r="3" />
            <circle cx="16" cy="24" r="3" />
            <path d="M9.7 9.5 14.3 21M22.3 9.5 17.7 21M10 8h12" />
          </svg>
        </div>
        <h3>Dependency-aware skills</h3>
        <p>
          Required skills become explicit graph edges, validated before output is
          written.
        </p>
      </article>

      <article class="apc-capability apc-capability--source">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">02 / SOURCE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M8 4h11l5 5v19H8z" />
            <path d="M19 4v6h6M12 16h8M12 21h8" />
          </svg>
        </div>
        <h3>One authored model</h3>
        <p>
          Metadata, lifecycle, visibility, categories, and provider selection
          stay together in <code>plugin/plugin.yml</code>.
        </p>
      </article>

      <article class="apc-capability apc-capability--output">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">03 / OUTPUT</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="m6 17 6 6L26 9" />
            <path d="M6 8h9M6 13h6M20 24h6" />
          </svg>
        </div>
        <h3>Deterministic by default</h3>
        <p>
          Generate exact managed paths, then use <code>check</code> to detect
          drift without writing.
        </p>
      </article>

      <article class="apc-capability apc-capability--providers">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">04 / PROVIDERS</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <rect x="4" y="5" width="9" height="9" rx="2" />
            <rect x="19" y="5" width="9" height="9" rx="2" />
            <rect x="4" y="19" width="9" height="9" rx="2" />
            <rect x="19" y="19" width="9" height="9" rx="2" />
          </svg>
        </div>
        <h3>Five provider contracts</h3>
        <p>One validated plugin model, projected into each host’s exact format.</p>
      </article>
    </div>
  </section>
</template>
