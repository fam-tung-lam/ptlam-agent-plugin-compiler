# Sequence diagram

Use a sequence diagram component for ordered messages between participants over
time. Keep this file responsible only for participants, lifelines, messages, and
their active visual state.

```html
<svg
  class="sequence"
  viewBox="0 0 700 520"
  role="img"
  aria-labelledby="sequence-title sequence-desc"
>
  <title id="sequence-title">Open and resume a session</title>
  <desc id="sequence-desc">
    Interface requests sessions from the API, which returns the session list.
  </desc>
  <g class="participant" data-participant="interface">...</g>
  <g class="participant" data-participant="api">...</g>
  <!-- Keep both vertical lifelines visible. -->
  <g class="sequence-message" data-edge="ui-list-api">
    <path d="M130 130H570" />
    <text x="350" y="116">GET /sessions</text>
  </g>
  <g class="sequence-message" data-edge="api-list-ui">
    <path d="M570 200H130" />
    <text x="350" y="186">sessions[]</text>
  </g>
</svg>
```

Give every step `sender` and `receiver` identities that match
`data-participant`. Keep lifelines visible in every frame. At each step,
emphasize one message arrow plus the sending and receiving participants, and use
line weight and a distinct dash pattern as well as color. Use solid lines for
calls and dashed lines for returns consistently.

When the learning case needs observable consequences or playback, compose this
component with the
[state-panel pattern](../../patterns/state-panel/state-panel.md) and
[control-plane pattern](../../patterns/control-plane/control-plane.md). Keep
that case-specific state and control markup out of this component file.
