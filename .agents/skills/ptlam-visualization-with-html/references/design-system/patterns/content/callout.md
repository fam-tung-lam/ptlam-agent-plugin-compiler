# Callout

Use one callout only when it changes interpretation. Do not restate the section.

```html
<aside class="callout callout--insight">
  <strong>The deep idea:</strong> durable state and the current working view are
  related, but not identical.
</aside>
```

```css
.callout {
  max-width: 72ch;
  padding: 0.9rem 1rem;
  border-left: 3px solid var(--color-secondary);
  border-radius: 0 var(--shape-small) var(--shape-small) 0;
  background: var(--color-surface-container);
  color: var(--color-on-surface-variant);
}
.callout strong {
  color: var(--color-on-surface);
}
.callout--insight {
  border-left-color: var(--color-primary);
}
.callout--caveat {
  border-left-color: var(--color-warning);
}
```

Put an analogy boundary in a caveat callout immediately after the paired visual.
State the specific relationship that does not transfer; never add a generic
disclaimer wall.
