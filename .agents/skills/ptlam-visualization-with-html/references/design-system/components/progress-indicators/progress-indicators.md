# Progress indicators

Use a determinate indicator when measurable progress exists and an indeterminate
loading indicator otherwise. Use native `<progress>` so the current value and
maximum remain available to assistive technology.

```html
<label>Rendering <progress value="3" max="8">3 of 8</progress></label>
```

```css
progress {
  accent-color: var(--color-primary);
  inline-size: min(24rem, 100%);
}
```

The expressive indicator uses waveform, thickness, shape, and role color to make
progress easier to notice. Do not distort the underlying value or hide the
textual status. Keep high contrast between the active value and track and show a
clear end stop when the visual treatment might make completion ambiguous. Use a
linear track for ordered progress and a circular presentation only when its
compact footprint materially helps.

Source snapshot: Material 3 progress-indicator overview, captured with
Firecrawl on 2026-08-07.
