# Cards

Use a card for content and actions about one subject. Do not make the entire
card clickable when it contains multiple independent actions.

Choose one containment level: filled for subtle grouping, elevated when the
card must rise above a busy surface, or outlined when a visible boundary is
needed. Content determines card height and may include media, a headline,
supporting text, a list, and actions. Keep the reading order stable when the
layout reflows.

```html
<article class="card">
  <h3>Docker image</h3>
  <p>Reusable read-only layers.</p>
</article>
```

```css
.card {
  padding: var(--space-3);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--shape-large);
  background: var(--color-surface-container);
}
```

Source snapshot: Material 3 cards overview, captured with Firecrawl on
2026-08-07. Material does not supply a current web component; this file defines
the native HTML adaptation.
