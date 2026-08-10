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

    <div class="apc-compiler-flow__chrome" aria-hidden="true">
      <span>COMPILATION PIPELINE</span>
      <span class="apc-compiler-flow__status">
        <span class="apc-compiler-flow__status-dot" />
        DETERMINISTIC
      </span>
    </div>

    <div class="apc-compiler-flow__diagram" aria-hidden="true">
      <div class="apc-flow-manifest">
        <svg viewBox="0 0 32 32">
          <path d="M8 4h11l5 5v19H8z" />
          <path d="M19 4v6h6M12 16h8M12 21h8" />
        </svg>
        <span>Plugin manifest</span>
      </div>

      <svg class="apc-flow-arrow apc-flow-arrow--input" viewBox="0 0 72 20">
        <path class="apc-flow-arrow__line" d="M1 10h62" />
        <path class="apc-flow-arrow__tip" d="m59 6 5 4-5 4" />
      </svg>

      <div class="apc-flow-compiler">
        <img src="/logo.svg" alt="" />
        <span>Plugin compiler</span>
      </div>

      <div class="apc-flow-providers">
        <div class="apc-flow-provider-row">
          <svg class="apc-flow-arrow" viewBox="0 0 44 16">
            <path class="apc-flow-arrow__line" d="M1 8h34" />
            <path class="apc-flow-arrow__tip" d="m31 4 5 4-5 4" />
          </svg>
          <span>Claude</span>
        </div>
        <div class="apc-flow-provider-row">
          <svg class="apc-flow-arrow" viewBox="0 0 44 16">
            <path class="apc-flow-arrow__line" d="M1 8h34" />
            <path class="apc-flow-arrow__tip" d="m31 4 5 4-5 4" />
          </svg>
          <span>Codex</span>
        </div>
        <div class="apc-flow-provider-row">
          <svg class="apc-flow-arrow" viewBox="0 0 44 16">
            <path class="apc-flow-arrow__line" d="M1 8h34" />
            <path class="apc-flow-arrow__tip" d="m31 4 5 4-5 4" />
          </svg>
          <span>Copilot</span>
        </div>
        <div class="apc-flow-provider-row">
          <svg class="apc-flow-arrow" viewBox="0 0 44 16">
            <path class="apc-flow-arrow__line" d="M1 8h34" />
            <path class="apc-flow-arrow__tip" d="m31 4 5 4-5 4" />
          </svg>
          <span>Gemini</span>
        </div>
        <div class="apc-flow-provider-row">
          <svg class="apc-flow-arrow" viewBox="0 0 44 16">
            <path class="apc-flow-arrow__line" d="M1 8h34" />
            <path class="apc-flow-arrow__tip" d="m31 4 5 4-5 4" />
          </svg>
          <span>Kimi</span>
        </div>
      </div>
    </div>
  </figure>
</template>
