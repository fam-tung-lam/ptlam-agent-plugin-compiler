# Badges

Use a badge for a short count or status attached to another component. Give the
host component an accessible description containing the same meaning.

Use a small unlabelled dot for an unread state and a larger badge for a count.
Anchor it at the upper trailing edge of the host icon. Keep count text to four
characters including an optional `+`; shorten a larger value such as `999+`
rather than letting the badge distort its host.

```html
<span class="badge" aria-hidden="true">3</span
><span class="sr-only">3 updates</span>
```

```css
.badge {
  min-inline-size: 1rem;
  padding-inline: 0.25rem;
  border-radius: var(--shape-full);
  background: var(--color-error);
  color: var(--color-on-error);
}
```

Source snapshot: Material 3 badges overview, captured with Firecrawl on
2026-08-07.
