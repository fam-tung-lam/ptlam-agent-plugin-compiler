# Divider

Use a divider only when spacing or containment does not sufficiently express a
group boundary. Use `<hr>` for a thematic break. Divide groups, not every
individual row, and keep the rule visible but visually quiet. A vertical rule
is acceptable only when the adjacent regions remain related and reflow without
it on narrow screens.

```html
<hr class="divider" />
```

```css
.divider {
  border: 0;
  border-block-start: 1px solid var(--color-outline-variant);
  margin-block: var(--space-3);
}
```

Source snapshot: Material 3 divider overview, captured with Firecrawl on
2026-08-07.
