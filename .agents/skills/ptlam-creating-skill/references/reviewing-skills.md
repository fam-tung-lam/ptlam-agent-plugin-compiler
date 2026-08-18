# Reviewing Skills

This reference owns the read-only review branch and its output. Read it only
when the operation is review.

## Preserve review authority

Inspect the package, metadata owner, dependencies, host schema, validators, and
neighboring skills needed to judge the capability. Do not edit, generate,
compile, stage, or publish files during a review.

## Apply the package standard

1. Write the capability contract: responsibility, artifact judged, branches,
   inputs, acceptance standard, authority, and dependencies.
2. Apply the six capability tests and any foundation-specialization ownership
   map from `skill-atomicity.md`.
3. Read `skill-package-layout.md`, `self-contained-documentation.md`,
   `writing-for-maintainers.md`, and `prompting-best-practices.md` as review
   criteria.
4. Run read-only validators and inspect headings, links, file consumers, and
   declared dependency edges. Audit every external link for required operational
   knowledge that the package does not contain locally.

## Return one verdict

- **Atomic:** one complete capability with one result and acceptance standard.
- **Usably focused:** one capability is clear, but justified context prevents a
  purely atomic package.
- **Unfinished:** one capability is intended, but an execution or acceptance
  branch is incomplete.
- **Mixed:** independently invocable capabilities require a split or router.

Lead with the verdict. Then report findings from highest to lowest severity. For
each finding, give an exact location, observed evidence, impact on the
human-agent contract, and the smallest correction.

Finish when every checklist failure has evidence and a correction, every check
is named, and unavailable or unmeasured verification remains explicit.
