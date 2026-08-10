# Chips

Use chips for compact input, filters, selections, or actions. Match semantics to
behavior: button for an action, checkbox for a filter, removable token for
input.

- Assist chips trigger a contextual or automated action.
- Filter chips select tags or criteria and may replace a compact checkbox set.
- Input chips represent entered values and expose removal explicitly.
- Suggestion chips narrow intent from dynamically generated options.

Use a small button group or ordinary controls when the options are primary,
long, or need comparison; chips should stay compact and contextual.

```html
<button class="chip" type="button" aria-pressed="true">Active paths</button>
```

```css
.chip {
  min-height: 44px;
  padding-inline: var(--space-2);
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-small);
  background: transparent;
  color: var(--color-on-surface);
}
.chip[aria-pressed="true"] {
  background: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
}
```

Source snapshot: Material 3 chips overview, captured with Firecrawl on
2026-08-07.
