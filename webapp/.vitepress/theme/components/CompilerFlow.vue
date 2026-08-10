<template>
  <figure
    class="apc-compiler-flow"
    role="img"
    aria-labelledby="compiler-flow-title compiler-flow-description"
  >
    <figcaption id="compiler-flow-title" class="apc-sr-only">
      Agent Plugin Compiler transformation flow
    </figcaption>
    <p id="compiler-flow-description" class="apc-sr-only">
      A plugin manifest passes through Agent Plugin Compiler and becomes
      deterministic output for five agent providers.
    </p>

    <div class="apc-compiler-flow__diagram" aria-hidden="true">
      <div class="apc-flow-manifest">
        <svg viewBox="0 0 32 32">
          <path d="M8 4h11l5 5v19H8z" />
          <path d="M19 4v6h6M12 16h8M12 21h8" />
        </svg>
        <span>Plugin manifest</span>
      </div>

      <svg class="apc-flow-arrow apc-flow-arrow--input" viewBox="0 0 70 20">
        <path class="apc-flow-arrow__line" d="M0 10h70" />
        <path class="apc-flow-arrow__tip" d="m64 6 6 4-6 4" />
      </svg>

      <div class="apc-flow-compiler">
        <img src="/logo.svg" alt="" />
        <span>Plugin compiler</span>
      </div>

      <svg
        class="apc-flow-arrow apc-flow-arrow--output"
        viewBox="0 0 84 134"
        preserveAspectRatio="none"
      >
        <path class="apc-flow-arrow__line" d="M0 67h28" />
        <path class="apc-flow-arrow__line" d="M28 11v112" />
        <path class="apc-flow-arrow__line" d="M28 11h56" />
        <path class="apc-flow-arrow__line" d="M28 39h56" />
        <path class="apc-flow-arrow__line" d="M28 67h56" />
        <path class="apc-flow-arrow__line" d="M28 95h56" />
        <path class="apc-flow-arrow__line" d="M28 123h56" />
        <path class="apc-flow-arrow__tip" d="m78 7 6 4-6 4" />
        <path class="apc-flow-arrow__tip" d="m78 35 6 4-6 4" />
        <path class="apc-flow-arrow__tip" d="m78 63 6 4-6 4" />
        <path class="apc-flow-arrow__tip" d="m78 91 6 4-6 4" />
        <path class="apc-flow-arrow__tip" d="m78 119 6 4-6 4" />
      </svg>

      <div class="apc-flow-providers">
        <div class="apc-flow-provider-row">
          <span>Claude</span>
        </div>
        <div class="apc-flow-provider-row">
          <span>Codex</span>
        </div>
        <div class="apc-flow-provider-row">
          <span>Copilot</span>
        </div>
        <div class="apc-flow-provider-row">
          <span>Gemini</span>
        </div>
        <div class="apc-flow-provider-row">
          <span>Kimi</span>
        </div>
      </div>
    </div>
  </figure>
</template>
