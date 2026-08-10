# Lists

Use a semantic list for a continuous vertical index. Keep each row's primary
label, supporting text, metadata, and actions in a predictable order.

Use a 56-pixel minimum row for one line, 72 pixels for two lines, and 88 pixels
for three lines or richer content. Center one- and two-line content vertically;
top-align rows of 88 pixels or more. A selected row needs a visible container,
shape, or label change in addition to color. Use segmented row containers only
when they improve selection and scanning; otherwise preserve one continuous
list surface.

```html
<ul class="list">
  <li><strong>Image</strong><span>Reusable layers</span></li>
</ul>
```

```css
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list > li {
  display: grid;
  gap: 0.25rem;
  min-height: 3.5rem;
  padding: var(--space-2);
  border-block-end: 1px solid var(--color-outline-variant);
}
```

Source snapshot: Material 3 lists overview, captured with Firecrawl on
2026-08-07.
