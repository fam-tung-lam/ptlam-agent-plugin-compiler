# Flowchart

Use a flowchart for ordered work, decisions, loops, and responsibility. Write
the SVG in the same order that the flow runs. Prefer a top-to-bottom main path
with return loops at the side.

```html
<svg
  class="flowchart"
  viewBox="0 0 560 520"
  role="img"
  aria-labelledby="flow-title flow-desc"
>
  <title id="flow-title">Request processing flow</title>
  <desc id="flow-desc">
    The request is prepared, processed, checked, and either completed or looped
    through a tool.
  </desc>
  <defs>
    <marker
      id="flow-arrow"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path
        d="M0 0 10 5 0 10Z"
        fill="currentColor"
        style="color: var(--color-outline-strong)"
      />
    </marker>
  </defs>
  <g class="flow-edge" data-edge="receive-prepare"><path d="M280 76V126" /></g>
  <g class="flow-node" data-node="receive" transform="translate(150 20)">
    <rect width="260" height="56" rx="9" />
    <text x="130" y="34">receive request</text>
  </g>
  <g class="flow-node" data-node="prepare" transform="translate(150 126)">
    <rect width="260" height="56" rx="9" />
    <text x="130" y="34">prepare context</text>
  </g>
  <!-- Add the remaining nodes, explicit yes/no edge labels, and return loop. -->
</svg>
```

```css
.flowchart {
  min-width: 0;
}
.flow-node rect {
  fill: var(--color-surface-container);
  stroke: var(--color-outline);
  stroke-width: 1.5;
}
.flow-node text {
  fill: var(--color-on-surface);
  font:
    700 14px ui-monospace,
    monospace;
  text-anchor: middle;
}
.flow-edge path {
  fill: none;
  stroke: var(--color-outline-strong);
  stroke-width: 1.5;
  marker-end: url(#flow-arrow);
}
.flow-node.is-active rect {
  stroke: var(--color-primary);
  stroke-width: 2.5;
  filter: drop-shadow(0 0 7px rgba(232, 184, 76, 0.25));
}
.flow-node.is-complete rect {
  stroke: var(--color-success);
  stroke-dasharray: 3 2;
}
.flow-node.is-complete.is-active rect {
  stroke: var(--color-primary);
  stroke-width: 2.5;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 7px rgba(232, 184, 76, 0.25));
}
.flow-edge.is-active path {
  stroke: var(--color-primary);
  stroke-width: 2.5;
  stroke-dasharray: 7 5;
  animation: edge-flow 1s linear infinite;
}
```

Rules:

- Give every node a unique semantic `data-node` and every transition a unique
  `data-edge`.
- Label every decision exit. Do not make direction dependent on geometry alone.
- Keep edge routes outside node labels and containment boundaries.
- Use arrowheads on all directed edges, including loops.
- Provide a static default active node in the HTML.
- Encode completed progress with a dash pattern or another shape cue as well as
  color. When a loop revisits a completed node, the active weight and solid
  outline must win over the completed style.
