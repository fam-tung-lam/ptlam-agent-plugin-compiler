# Color tokens

The scaffold owns the exact baseline values. Consume semantic roles instead of
raw palette values: canvas and surface roles establish depth, `on-*` roles own
readable foregrounds, outline roles separate regions, and primary, secondary,
tertiary, success, warning, and error roles communicate meaning.

Use `--color-primary` for the current learning step or primary action,
`--color-secondary` for relationships, and `--color-error` only for failure. Use
color together with label, outline, weight, or shape. Keep body text at 4.5:1
contrast or higher.

These are system roles, not a fixed brand palette. Preserve all `on-*` pairings
when substituting a dynamic or branded scheme.

- Surface roles own large backgrounds and low-emphasis regions.
- Primary, secondary, and tertiary roles own descending accent emphasis.
- Container roles fill controls or foreground regions; paired `on-*` roles own
  their text and icons.
- Variant roles provide lower emphasis, outline roles define boundaries, and
  inverse roles create deliberate contrast with surrounding content.
- Fixed roles retain their tone across light and dark themes; use them only
  when that stability is intentional.

Keep each role pairing accessible in every theme. The Material source defines a
3:1 minimum for paired color roles; this skill keeps the stricter 4.5:1 floor
for body text.

Source snapshot: Material 3 color-role guidance, captured with Firecrawl on
2026-08-07.
