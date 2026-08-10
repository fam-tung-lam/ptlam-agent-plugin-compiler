# State diagram

Use a state diagram when the lesson is which transitions are allowed, including
guards, failure states, and terminal states. Do not use it to depict a work
pipeline.

```html
<svg
  class="state-diagram"
  viewBox="0 0 760 360"
  role="img"
  aria-labelledby="job-state-title"
>
  <title id="job-state-title">Job lifecycle</title>
  <g class="flow-node" data-node="scheduled" transform="translate(60 130)">
    <rect width="150" height="60" rx="12" />
    <text x="75" y="36">scheduled</text>
  </g>
  <g class="flow-node" data-node="firing" transform="translate(300 130)">
    <rect width="150" height="60" rx="12" />
    <text x="75" y="36">firing</text>
  </g>
  <g class="flow-node" data-node="complete" transform="translate(550 45)">
    <rect width="150" height="60" rx="12" />
    <text x="75" y="36">complete</text>
  </g>
  <g class="flow-node" data-node="error" transform="translate(550 215)">
    <rect width="150" height="60" rx="12" />
    <text x="75" y="36">error</text>
  </g>
  <!-- Directed edges include event and optional [guard] labels. -->
</svg>
```

Style terminal states distinctly with shape or border style, not color alone.
Put the triggering event on the edge, a guard in square brackets, and an action
after `/` when helpful: `tick [due] / claim`. When playback matters, pair the
state diagram with a right-side state panel and one control plane below using
the same `data-node` and `data-edge` contract as a flowchart.
