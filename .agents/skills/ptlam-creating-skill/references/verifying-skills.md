# Verifying Skills

This reference owns pruning, package checks, and the final report for every
create, refactor, or review operation.

For created or refactored files, delete everything
[writing for maintainers](writing-for-maintainers.md#delete-these-on-sight)
lists. For every operation, reapply Rule 1, run available validators, and
inspect the package tree. Inspect the diff only when files changed.

| Check          | Passes when                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Capability     | Rule 1 holds and every dependency names its owner.                                                                                         |
| Composition    | The foundation stays complete; each specialization rule adds a mechanic, tightens the domain, or links to its owner.                       |
| Layout         | Every file has a consumer and fits its limit; each split earns its navigation cost through ownership, conditional loading, or readability. |
| Disclosure     | `SKILL.md` holds the whole normal path; each reference sits one hop away behind a condition named there and nowhere else.                  |
| Self-contained | The package remains executable with every external URL unavailable; external links carry no required operational knowledge.                |
| Readability    | Titles, headings, and visual labels alone reveal the path and how it ends.                                                                 |
| Visual form    | Each point uses the highest form that fits it, replaces the prose it stands in for, and passes its diagram-type checks when applicable.    |
| Metadata       | Name, directory, description, and invocation agree with the host.                                                                          |
| Freshness      | Nothing duplicated, stale, unused, or placeholder remains; links resolve.                                                                  |

For a review, return the verdict, evidence for every failed check, and the
smallest correction. For changed files, report what changed and where. Always
name checks, unavailable verification, and remaining uncertainty.

Finish when both rules hold or the review accounts for every failed check, and
every authorized authored or generated effect is current.
