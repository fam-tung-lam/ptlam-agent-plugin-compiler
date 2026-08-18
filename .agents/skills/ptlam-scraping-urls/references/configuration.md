# Configuration

This reference owns the workspace root, the canonical configuration file, the
three keys, and how a prompt override wins.

## Fix the workspace root first

Use the workspace root the invocation started in. Do not replace it with a
nested repository discovered later, or with a shell directory the run changes
into.

When the host exposes several workspace roots and the user's intended root is
unclear, ask which root owns the run.

## The canonical file

```text
<workspace-root>/.ptlam-agent-plugin/skills/utilities/ptlam-scraping-urls/CONFIG.yml
```

On the first invocation, create the parent directory and copy
[the default configuration](../assets/CONFIG.yml) there.

On later invocations, preserve manual edits. Read the file on every run before
resolving effective values.

## The three keys

| Key                  | Meaning                                        | Valid value                                    |
| -------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `OUTPUT_DIRECTORY`   | Default destination for scraped Markdown files | Non-empty path contained by the workspace root |
| `MAX_PARALLEL_TASKS` | Maximum simultaneous scrape jobs               | Positive integer                               |
| `CACHE_TTL_HOURS`    | Age below which an existing output is reused   | Non-negative number; `0` disables reuse        |

## Resolving each key

Resolve every key independently. Use the prompt's value when the user supplies
one; otherwise use the value read from `CONFIG.yml`.

The prompt may override any or all keys with assignments, a YAML block, or an
unambiguous natural-language instruction. This prompt overrides all three:

```text
OUTPUT_DIRECTORY=docs/archive MAX_PARALLEL_TASKS=3 CACHE_TTL_HOURS=24
https://docs.example.com/start
https://docs.example.com/api
```

A prompt override applies only to the current run. Change `CONFIG.yml` itself
only when the user explicitly asks to save new defaults.

Canonicalize the effective output path before creating it. Reject `..`, symlink,
or absolute-path escapes from the workspace unless the user explicitly names
that external destination for this run. Never save an external path as the
default. When external output is explicitly authorized, report that boundary
before writing.

Report an invalid effective value and stop before creating the output directory.
Never silently replace a manually edited configuration.
