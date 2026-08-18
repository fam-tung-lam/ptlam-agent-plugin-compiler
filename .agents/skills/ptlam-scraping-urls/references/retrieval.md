# Retrieval

This reference owns bounded retrieval, completeness, safe replacement, and the
machine-readable result returned for each queued URL.

## Run the queue

Process independent URLs without exceeding `MAX_PARALLEL_TASKS`. Use bounded
host concurrency or sequential execution. A host that supports subagents may
assign one resolved URL and target path per task, launch at most one configured
batch, and wait for it before launching the next.

For each URL:

1. Prefer an available page-to-Markdown scraper that returns the page body.
2. Otherwise use the host's URL-fetch tool and request the full page content in
   Markdown with headings, paragraphs, code, lists, tables, and document order.
3. Classify access blocks, authentication pages, empty bodies, and error pages
   as `FAILED`.
4. Classify summaries, truncated bodies, or otherwise incomplete retrievals as
   `PARTIAL`; do not present them as complete page captures.
5. Write an `OK` result to a temporary sibling file, verify it is non-empty,
   then atomically replace the target. Keep any older target when retrieval or
   verification fails.

## Return one JSON object

Return one JSON object per queued URL. Do not use a delimiter-based record that
can be confused by URL or error text.

```json
{
  "status": "OK",
  "url": "https://example.com",
  "file": "example-a1b2c3d4.md",
  "size_bytes": 1234,
  "detail": ""
}
```

`status` is `OK`, `PARTIAL`, or `FAILED`. A `PARTIAL` or `FAILED` object uses
`null` for `file` and `size_bytes` and gives a short `detail`. Continue after
either outcome.

Finish when every queued URL has exactly one result and every `OK` target exists
at the reported non-zero size.
