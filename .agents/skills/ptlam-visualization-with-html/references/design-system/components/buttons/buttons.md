# Buttons

Buttons initiate actions. Choose the variant by emphasis, not by one artifact's
workflow name. Use filled for the single highest-emphasis action, tonal for an
important quieter action, outlined for a bounded medium-emphasis action, text
for the lowest emphasis, and elevated only when a busy surface needs separation.

```css
.button {
  --button-block-size: 3rem;
  min-height: 44px;
  min-width: 44px;
  height: var(--button-block-size);
  padding: 0.65rem 0.9rem;
  border: 1px solid transparent;
  border-radius: var(--shape-full);
  background: transparent;
  color: var(--color-on-surface);
  font: 700 0.82rem/1 var(--typeface-body);
  cursor: pointer;
}
.button--xs {
  --button-block-size: 2.75rem;
}
.button--s {
  --button-block-size: 3rem;
}
.button--m {
  --button-block-size: 3.5rem;
}
.button--l {
  --button-block-size: 4rem;
}
.button--xl {
  --button-block-size: 4.5rem;
}
.button:hover:not(:disabled) {
  filter: brightness(1.08);
}
.button[aria-pressed="true"] {
  outline: 2px solid var(--color-secondary);
}
.button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
.button--elevated {
  background: var(--color-surface-container);
  box-shadow: var(--elevation-1);
}
.button--filled {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.button--tonal {
  background: var(--color-primary-container);
}
.button--outlined {
  border-color: var(--color-outline-strong);
}
.button--text {
  color: var(--color-primary);
}
```

Disable an action that cannot succeed. Update its visible label when its meaning
changes; never leave a button that appears usable but does nothing.

M3 Expressive adds five semantic sizes from XS through XL. Keep a minimum 44 CSS
pixel target in this portable-web adaptation, use stronger shape or type only
for higher-emphasis actions, and never resize surrounding controls unexpectedly.
The Material baseline button is 40 pixels high with 20-pixel leading or trailing
icons; this local CSS intentionally raises the interaction target to 44 pixels.
Keep labels concise and sentence case. A toggle button exposes
`aria-pressed`; ordinary action buttons do not.

Source snapshot: Material 3 buttons overview, captured with Firecrawl on
2026-08-07.
