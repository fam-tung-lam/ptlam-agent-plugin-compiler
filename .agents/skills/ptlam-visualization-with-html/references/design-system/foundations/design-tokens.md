# Design tokens

Use reference, system, and component roles conceptually: raw values feed
semantic system roles, and components consume those roles. The scaffold owns
their exact baseline CSS values; the token references selected in `SKILL.md`
own customization and application rules.

Do not hard-code a raw color, radius, duration, or type size inside a pattern
when a semantic token exists.

- Reference tokens own raw palette, font, size, and other available values.
- System tokens give those values a UI purpose and may resolve differently for
  light, dark, high-contrast, right-to-left, or other contexts.
- Component tokens describe an element's properties and point to system or
  reference roles.

Name tokens from general to specific and keep the dependency direction
`reference -> system -> component`. Tokens are most valuable when themes,
platforms, or repeated updates must stay coordinated; avoid creating unused
token layers for one-off constants.

Source snapshot: Material 3 design-token overview and usage guidance, captured
with Firecrawl on 2026-08-07.
