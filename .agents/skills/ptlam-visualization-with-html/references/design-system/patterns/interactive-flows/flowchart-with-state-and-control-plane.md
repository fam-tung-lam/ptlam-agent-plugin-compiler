# Flowchart with state and control plane

Use this as the default interactive learning pattern. Compose
[flowchart with state](flowchart-with-state.md), then add one shared
[control-plane pattern](../control-plane/control-plane.md) below both panels.
This is also discoverable as a “flowchart with state and controls”; “control
plane” is the canonical pattern name.

```html
<div class="visual-stage" data-stepper="request-flow">
  <div class="stage-grid">
    <div class="diagram-panel">
      <p class="eyebrow">Flow</p>
      <svg
        class="flowchart"
        viewBox="0 0 560 520"
        role="img"
        aria-labelledby="request-flow-title"
      >
        ...
      </svg>
    </div>
    <aside class="state-panel" aria-labelledby="request-state-title">...</aside>
  </div>
  <div class="control-plane" data-control-plane>
    <div class="step-readout">
      <span class="eyebrow">Current frame</span
      ><output data-step-count>1 / 6</output>
    </div>
    <p class="step-caption" data-step-caption aria-live="polite">
      The request enters the system.
    </p>
    <div class="button-row" aria-label="Flow controls">
      <button class="button button--filled" type="button" data-action="next">
        Next →
      </button>
      <button class="button" type="button" data-action="back" disabled>
        ← Back
      </button>
      <button
        class="button"
        type="button"
        data-action="play"
        aria-pressed="false"
      >
        Play
      </button>
      <button class="button button--text" type="button" data-action="reset">
        Reset
      </button>
    </div>
  </div>
  <noscript>
    <section class="noscript-summary" aria-label="All flow steps">
      <ol>
        <li>Describe step 1 with its observable state.</li>
        <li>Describe every later step and state change in order.</li>
      </ol>
    </section>
  </noscript>
</div>
```

Use a single controller per `[data-stepper]`:

```js
function createStepper(root, steps) {
  let index = 0;
  let timer = null;
  const q = (selector) => root.querySelector(selector);
  const qa = (selector) => [...root.querySelectorAll(selector)];
  const playButton = q('[data-action="play"]');

  function setPlaybackLabel() {
    playButton.textContent = index === steps.length - 1 ? "Replay ↻" : "Play";
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    playButton.setAttribute("aria-pressed", "false");
    setPlaybackLabel();
  }

  function render() {
    const step = steps[index];
    qa("[data-node]").forEach((el) =>
      el.classList.toggle("is-active", el.dataset.node === step.node),
    );
    qa("[data-edge]").forEach((el) =>
      el.classList.toggle("is-active", el.dataset.edge === step.edge),
    );
    qa("[data-state]").forEach((el) => {
      el.textContent = step.state[el.dataset.state] ?? "—";
    });
    q("[data-frame]").textContent = step.frame;
    q("[data-step-caption]").textContent = step.caption;
    q("[data-step-count]").textContent = `${index + 1} / ${steps.length}`;
    q('[data-action="back"]').disabled = index === 0;
    q('[data-action="next"]').textContent =
      index === steps.length - 1 ? "Replay ↻" : "Next →";
    if (!timer) setPlaybackLabel();
  }

  q('[data-action="next"]').addEventListener("click", () => {
    index = index === steps.length - 1 ? 0 : index + 1;
    render();
  });
  q('[data-action="back"]').addEventListener("click", () => {
    index = Math.max(0, index - 1);
    render();
  });
  q('[data-action="reset"]').addEventListener("click", () => {
    stop();
    index = 0;
    render();
  });
  playButton.addEventListener("click", () => {
    if (timer) return stop();
    if (index === steps.length - 1) {
      index = 0;
      render();
    }
    playButton.textContent = "Pause";
    playButton.setAttribute("aria-pressed", "true");
    timer = setInterval(() => {
      if (index === steps.length - 1) return stop();
      index += 1;
      render();
      if (index === steps.length - 1) stop();
    }, 1400);
  });
  render();
}
```

In production, also stop on `visibilitychange`. Keep the first frame meaningful
without JavaScript and include a `<noscript>` ordered summary of every later
caption, frame, and state transition. Do not announce every animated dash;
announce only the changed caption/state. Encode active and completed progress
with shape, line weight, or dash pattern as well as color.
