# TypeScript Runtime Validation

How data from outside the program becomes a trusted typed value.

TypeScript erases types before the program runs. Nothing checks an HTTP payload,
an environment variable, a file, a queue message, a CLI argument, or a
third-party response against the type you declared for it. Writing
`as OrderPayload` on parsed JSON tells the compiler to stop asking; it does not
make the value that shape.

Validate at the boundary that accepts the data. Trusted internal state that
never crosses a boundary needs an ordinary type, not a schema.

## Choose one validator

Check the installed schema library and its major version before editing, and
follow the project's shared schemas and base types. For a new project with no
established choice, use Zod ([canonical documentation](https://zod.dev)). Never
run two validation libraries over the same boundary.

## Declare the contract once

- Define the schema, then derive the static type from it. A hand-written type
  beside a schema is a second source of truth that drifts silently.
- Give each wire shape one owner near its boundary. When every caller declares
  its own version of the same payload, they stop agreeing.
- Parse once at the boundary and pass the parsed value inward. Re-validating in
  the core hides which layer is actually responsible.
- Keep coercion deliberate. Decide at the owning boundary whether a numeric
  string becomes a number, and test the conversions you accept.
- Parse `process.env` through one schema at the composition root and read
  configuration from the parsed object afterwards. Every direct `process.env`
  read elsewhere is an unchecked `string | undefined`.
- Keep the schema's field names in the project's convention and map wire names
  at the boundary, not in each consumer.

Convert a validation failure into the boundary's own error contract, as
[errors.md](errors.md) describes. A schema library's own error type is an
implementation detail of the boundary, not something to propagate inward.

A validation error carries the rejected input inside it. Report which field
failed rather than passing the library's error straight to a log record or an
outbound response.

## Prove the contract

Test each boundary with input the schema must reject, not only input it accepts.
Round-trip anything you also serialize: parse a representative payload, write it
back, and compare it against the promised wire shape.

Finish when every value entering the program is parsed by one owner, its static
type comes from that parse, invalid input fails at the boundary with the
boundary's own error, and no assertion stands in for a check.
