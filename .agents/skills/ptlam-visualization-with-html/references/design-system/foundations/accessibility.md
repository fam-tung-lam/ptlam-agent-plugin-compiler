# Accessibility

Treat accessibility as a system property across content, layout, interaction,
styles, and components.

- Give each SVG `role="img"` and `aria-labelledby` pointing to a `<title>` and
  optional `<desc>` in that same SVG.
- Use native controls and explicit `aria-pressed` for toggles.
- Put changing captions in an `aria-live="polite"` region.
- Keep touch targets at least 44 by 44 CSS pixels.
- Maintain at least 4.5:1 contrast for body text.
- Never rely on hover, motion, or color alone to communicate required meaning.
- Keep DOM order identical to the intended visual and keyboard reading order.
- Show a visible keyboard focus indicator and a skip link to `<main>`.
- Use one meaningful `h1`, keep heading levels sequential, and use native
  landmarks. Label repeated landmarks without repeating the landmark name.
- Provide at least a 44 by 44 CSS pixel pointer target; prefer 48 by 48 for
  touch-first controls, with roughly 8 pixels between adjacent targets.
- Write alt text for an image's meaning and context. Use `alt=""` for a purely
  decorative image and keep essential information out of image-embedded text.

Use at least two indicators for interaction state when meaning matters, such as
shape plus color or border plus label. Support keyboard, screen-reader, switch,
pointer, and touch input without making one route depend on another.

Source snapshot: Material 3 accessibility, assistive-technology, designing, and
interaction-state guidance, captured with Firecrawl on 2026-08-07. This file is
the local operational contract; source lookup is required only for maintenance.
