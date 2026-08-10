# Field-guide navigation

Use visible anchor links as a map of the long page. Links scroll; they never
toggle section visibility.

```html
<nav class="field-nav" aria-label="Field guide sections">
  <a href="#overview"><span>01</span> Overview</a>
  <a href="#flow"><span>02</span> Flow</a>
  <a href="#structure"><span>03</span> Structure</a>
</nav>
```

```css
.field-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-medium);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  scrollbar-width: thin;
}
.field-nav a {
  flex: 1 1 10rem;
  min-width: 0;
  padding: 0.65rem 0.8rem;
  border-radius: var(--shape-small);
  color: var(--color-on-surface-variant);
  text-decoration: none;
}
.field-nav a:hover,
.field-nav a:focus-visible {
  color: var(--color-on-surface);
  background: var(--color-surface-container);
}
.field-nav span {
  color: var(--color-primary);
  font-family: ui-monospace, monospace;
}
```

If scroll position is tracked, update `aria-current="location"` without changing
focus. Let links wrap instead of introducing a horizontal navigation scroller at
narrow widths. Do not make the navigation sticky when it would consume
substantial vertical space on small screens.
