# Output Files

This reference owns filename derivation, collisions, and the cache check for
mapping URLs to unique target files.

## Derive the base filename

For each valid URL:

1. Remove the `http://` or `https://` prefix.
2. Remove trailing slashes.
3. Replace `/`, `?`, `&`, `=`, `#`, and `:` with `-`.
4. Replace characters unsafe in a local filename with `-`.
5. Collapse repeated hyphens.
6. Append `-<digest>.md`, where `<digest>` is the first eight hexadecimal
   characters of the normalized URL's SHA-256 digest.

So `https://docs.example.com/api/auth` becomes
`docs.example.com-api-auth-a1b2c3d4.md`.

The digest is unconditional, so a URL keeps the same filename whether it is
scraped alone or beside a colliding URL on a later run.

## Check freshness

Read each target file's modification time and size.

| Platform | Modification-time command |
| -------- | ------------------------- |
| macOS    | `stat -f %m <file>`       |
| Linux    | `stat -c %Y <file>`       |

A file is fresh when its age is below `CACHE_TTL_HOURS` and its size is greater
than zero.

Record a fresh file as `CACHED` with its size, and drop it from the scrape
queue. Queue missing, empty, expired, and unreadable files for retrieval. When
`CACHE_TTL_HOURS` is `0`, queue every URL.

## Finish

Finish when every valid URL maps to one unique path inside the output directory,
and is either `CACHED` or queued exactly once.
