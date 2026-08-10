# Icon buttons

Icon buttons expose a single familiar action without a visible text label.
Always provide an accessible name and a focus-and-hover tooltip. Use the
standard variant for low emphasis,
filled for the highest emphasis, tonal for a quiet container, and outlined when
the action needs a visible boundary.

```css
.icon-button {
  --icon-button-size: 3rem;
  display: inline-grid;
  width: var(--icon-button-size);
  height: var(--icon-button-size);
  min-width: 44px;
  min-height: 44px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--shape-full);
  background: transparent;
  color: var(--color-on-surface);
  cursor: pointer;
}
.icon-button--xs {
  --icon-button-size: 2.75rem;
}
.icon-button--s {
  --icon-button-size: 3rem;
}
.icon-button--m {
  --icon-button-size: 3.5rem;
}
.icon-button--l {
  --icon-button-size: 4rem;
}
.icon-button--xl {
  --icon-button-size: 4.5rem;
}
.icon-button--filled {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.icon-button--tonal {
  background: var(--color-primary-container);
}
.icon-button--outlined {
  border-color: var(--color-outline-strong);
}
```

M3 Expressive icon buttons use the same XS-through-XL semantic scale as label
and split buttons. A selected or expanded icon button may change shape, but it
must also expose `aria-pressed` or `aria-expanded`. A toggle may pair an outlined
resting icon with a filled selected icon. Keep narrow, default, and wide visual
widths inside a target of at least 44 pixels.

Source snapshot: Material 3 icon-button overview, captured with Firecrawl on
2026-08-07.
