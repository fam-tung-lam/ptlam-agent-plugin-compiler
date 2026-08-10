# Sliders

Use a native range input for approximate selection from a numeric range. Show
the current value and provide a number input when exact entry matters.

Use the standard form for a value from one end of a range, a centered form for
values diverging from a meaningful midpoint, and two coordinated inputs for a
range selection. Discrete stops must correspond to real allowed values. Apply
changes immediately, expose minimum, maximum, step, and current value, and keep
the entire range visible.

```html
<label
  >Animation speed <input type="range" min="1" max="5" value="3" /><output
    >3</output
  ></label
>
```

```css
input[type="range"] {
  accent-color: var(--color-primary);
  min-height: 44px;
}
```

The Material scale has XS through XL and horizontal or vertical orientations.
Native range inputs are the portable contract; add an inset icon only when its
meaning remains clear and the native control stays operable.

Source snapshot: Material 3 sliders overview, captured with Firecrawl on
2026-08-07.
