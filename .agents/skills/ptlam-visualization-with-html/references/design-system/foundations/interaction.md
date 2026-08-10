# Interaction

Support consistent enabled, disabled, hover, focused, pressed, and selected
states. Combine state indicators when necessary; never make one state erase the
meaning of another.

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
  box-shadow: var(--elevation-focus);
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

Never auto-play. Preserve the current step across viewport changes. Back must
restore the exact previous state, and Reset must restore the first state.

Support touch, keyboard, mouse, trackpad, and assistive input through the same
state model. Every gesture-only operation needs a visible control or keyboard
route. Respond immediately to pointer and touch input, keep text selectable,
and use familiar browser behavior for scrolling, zoom, focus, and activation.

Expressive feedback uses shape morph, spring-like motion, size, containment, or
color emphasis according to the state. The state remains legible when motion is
disabled. Maintain enabled, disabled, hovered, focused, pressed, dragged, and
selected meanings consistently; combined states must remain distinguishable.

Source snapshot: Material 3 gesture, input, and interaction-state guidance,
captured with Firecrawl on 2026-08-07.
