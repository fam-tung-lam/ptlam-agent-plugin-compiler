# Writing

Prefer direct verbs, concrete nouns, sentence case, and one action per control.
Keep essential labels visible; do not rely on a tooltip for primary meaning. Let
text resize and reflow without truncating instructions or state.

Support at least 200% text scaling. Scale font size and line height together;
keep non-text control dimensions stable unless their text requires the
container to grow. Reflow or scroll the containing region rather than clipping
the label.

Truncate only when the full value remains available through a visible
disclosure, link, or keyboard-accessible tooltip. An ellipsis with no route to
the omitted text is inaccessible. Keep alternative text concise, normally no
more than 125 characters, and omit phrases such as "image of".

Source snapshot: Material 3 writing, text-resizing, and text-truncation
guidance, captured with Firecrawl on 2026-08-07.
