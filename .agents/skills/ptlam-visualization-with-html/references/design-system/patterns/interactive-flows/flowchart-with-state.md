# Flowchart with state

Use this composition when each flow transition changes observable state. Compose
the full [flowchart](../../components/diagrams/flowchart.md) contract on the
left with the [state-panel pattern](../state-panel/state-panel.md) on the right.
On narrow screens, keep flow first and state second.

```html
<div class="visual-stage" data-flow-state="request-flow">
  <div class="stage-grid">
    <div class="diagram-panel">
      <p class="eyebrow">Flow</p>
      <svg
        class="flowchart"
        viewBox="0 0 560 520"
        role="img"
        aria-labelledby="request-flow-title"
      >
        <title id="request-flow-title">Request flow</title>
        <!-- Use the node and edge contract from flowchart.md. -->
      </svg>
    </div>
    <aside class="state-panel" aria-labelledby="request-state-title">
      <h3 id="request-state-title">Current state</h3>
      <dl class="state-grid">
        <div>
          <dt>phase</dt>
          <dd data-state="phase">received</dd>
        </div>
        <div>
          <dt>attempt</dt>
          <dd data-state="attempt">0</dd>
        </div>
      </dl>
      <div class="frame" data-frame aria-live="polite">
        The request has entered the system.
      </div>
    </aside>
  </div>
</div>
```

Represent each step once:

```js
const steps = [
  {
    node: "receive",
    edge: null,
    state: { phase: "received", attempt: "0" },
    frame: "The request has entered the system.",
  },
  {
    node: "prepare",
    edge: "receive-prepare",
    state: { phase: "preparing", attempt: "0" },
    frame: "Rules and history form the working context.",
  },
];
```

During render, update all matching `data-node`, `data-edge`, and `data-state`
elements from the same step object. Add `.is-changed` only where the current
value differs from the preceding step. Do not place independent controls inside
either panel; add one shared control plane below when the user should manipulate
the timeline. This file defines a composable partial, so it deliberately uses
`data-flow-state`. Upgrade the outer attribute to `data-stepper` only after
composing the complete controls, caption, counter, and no-JavaScript summary
from
[flowchart-with-state-and-control-plane.md](flowchart-with-state-and-control-plane.md).
