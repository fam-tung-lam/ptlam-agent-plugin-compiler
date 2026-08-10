# Entity-relationship diagram

Use an ERD for durable data shape, ownership, keys, cardinality, and derived or
trigger-synchronized structures.

```html
<div
  class="erd"
  role="group"
  aria-label="Sessions own messages; message search tables mirror message rows"
>
  <article class="entity" data-entity="sessions">
    <header>
      <strong>sessions</strong><span>one row per conversation</span>
    </header>
    <dl>
      <div class="field field--pk">
        <dt>id</dt>
        <dd>TEXT · primary key</dd>
      </div>
      <div>
        <dt>title</dt>
        <dd>TEXT</dd>
      </div>
    </dl>
  </article>
  <div class="relationship" aria-label="one session has many messages">
    1 ——— N
  </div>
  <article class="entity" data-entity="messages">
    <header>
      <strong>messages</strong><span>one row per turn event</span>
    </header>
    <dl>
      <div class="field field--pk">
        <dt>id</dt>
        <dd>INTEGER · primary key</dd>
      </div>
      <div class="field field--fk">
        <dt>session_id</dt>
        <dd>TEXT · foreign key</dd>
      </div>
    </dl>
  </article>
</div>
```

```css
.erd {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  min-width: 0;
}
.entity {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-medium);
  background: var(--color-surface);
}
.entity header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem;
  background: var(--color-surface-container);
}
.entity header span {
  color: var(--color-on-surface-variant);
  font-size: 0.7rem;
  text-align: right;
}
.entity dl {
  margin: 0;
}
.field {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: 0.6rem;
  padding: 0.5rem 0.8rem;
  border-top: 1px solid var(--color-outline);
}
.field dt,
.field dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}
.field dd {
  color: var(--color-on-surface-variant);
  text-align: right;
}
.field--pk dt {
  color: var(--color-primary);
}
.field--fk dt {
  color: var(--color-secondary);
}
.relationship {
  color: var(--color-on-surface-variant);
  font-family: ui-monospace, monospace;
  white-space: nowrap;
}
@media (max-width: 700px) {
  .erd {
    grid-template-columns: minmax(0, 1fr);
  }
  .relationship {
    justify-self: center;
    transform: rotate(90deg);
    margin-block: 0.5rem;
  }
}
```

Show primary and foreign keys with labels as well as color. Put cardinality at
both ends of the relationship. Use a dashed connector and a legend for
trigger-synchronized or derived tables. If the ERD is larger than a readable
viewport, split it by bounded context instead of shrinking text.

Use `role="group"`, not `role="img"`, so assistive technology can still reach
the entity headings, definition terms, field values, and relationship label.
