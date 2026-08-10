# Loading indicator

Use for a short wait with unknown progress. Keep the current content visible
when possible and announce completion, not every animation frame.

Use this component only for an ongoing indeterminate process. Prefer it over an
indeterminate circular progress indicator and use it for pull-to-refresh when
that interaction exists. Use a determinate progress indicator when the process
has a measurable value or can change from unknown to known progress.

```html
<div class="loading" role="status">
  <span aria-hidden="true"></span>Loading diagram…
</div>
```

```css
.loading span {
  display: inline-block;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border: 0.25rem solid var(--color-outline);
  border-block-start-color: var(--color-primary);
  border-radius: var(--shape-full);
  animation: spin var(--motion-duration-long) linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
```

The expressive loading indicator uses evolving shape and role color. Keep a
clear text status and render a stable expressive shape under reduced motion.
It may be contained or uncontained, but it is never decorative.

Source snapshot: Material 3 loading-indicator overview, captured with Firecrawl
on 2026-08-07. Material's platform shape-morph API is unavailable on the web;
this CSS treatment preserves the semantic end states.
