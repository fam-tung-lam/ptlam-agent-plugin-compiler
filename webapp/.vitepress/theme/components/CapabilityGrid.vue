<template>
  <section class="apc-capabilities" aria-labelledby="capabilities-title">
    <header class="apc-capabilities__header">
      <span class="apc-kicker">COMPILER PIPELINE</span>
      <h2 id="capabilities-title">One authored tree. Verified output.</h2>
    </header>

    <div class="apc-capabilities__grid">
      <article class="apc-capability apc-capability--graph">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">01 / SOURCE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="7" cy="8" r="3" />
            <circle cx="25" cy="8" r="3" />
            <circle cx="16" cy="24" r="3" />
            <path d="M9.7 9.5 14.3 21M22.3 9.5 17.7 21M10 8h12" />
          </svg>
        </div>
        <h3>Author the complete plugin</h3>
        <p>
          Keep metadata in <code>plugin/plugin.yml</code> and instructions,
          assets, and supporting files under <code>plugin/skills/**</code>.
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
        <h3>Prove the skill graph</h3>
        <p>
          Validate schema, Markdown links, lifecycle rules, and recursive skill
          dependencies before any generated path changes.
        </p>
      </article>

      <article class="apc-capability apc-capability--output">
        <div class="apc-capability__topline">
          <span class="apc-capability__index">03 / COMPILE</span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="m6 17 6 6L26 9" />
            <path d="M6 8h9M6 13h6M20 24h6" />
          </svg>
        </div>
        <h3>Build self-contained skills</h3>
        <p>
          Compile each public root with the required skills it needs, then
          reconcile the compiler-owned <code>skills/**</code> tree atomically.
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
        <h3>Emit exact host contracts</h3>
        <p>
          Project the same validated model into the selected Claude, Codex,
          Copilot, Gemini, and Kimi manifest formats.
        </p>
      </article>
    </div>
  </section>
</template>
