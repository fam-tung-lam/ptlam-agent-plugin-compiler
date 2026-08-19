# TypeScript Errors

The TypeScript mechanics for reporting a failure without losing its cause or
leaking an implementation boundary.

Throw an `Error` or a subclass, never a string, object literal, or number. Only
an `Error` carries a stack, and every logger and reporter downstream expects
one.

Use a built-in type when its meaning is exact: `TypeError` for an unsupported
kind, `RangeError` for a value outside its bounds. Define a domain error class
when callers need to distinguish and handle a stable failure from this package:

```ts
export class OrderNotFoundError extends Error {
  readonly orderId: string;

  constructor(orderId: string, options?: ErrorOptions) {
    super(`Order ${orderId} not found`, options);
    this.name = "OrderNotFoundError";
    this.orderId = orderId;
  }
}
```

Set `name` explicitly. Minifiers rename classes, so `constructor.name` is not a
stable discriminator in a bundled artifact. Declare and assign the field rather
than using a constructor parameter property: parameter properties emit runtime
code, so a type-stripping loader rejects them.

## Catch narrowly and keep the cause

Under `strict`, a caught value is `unknown`. Narrow it before using it; do not
assert it into an `Error`:

```ts
try {
  return await loadOrder(orderId);
} catch (error) {
  if (error instanceof OrderNotFoundError) {
    return null;
  }
  throw new OrderLoadFailedError(orderId, { cause: error });
}
```

Pass `cause` whenever a translation adds context. Rethrow the original with a
bare `throw error` when the same failure continues. Never build a new error from
`error.message` alone; the original stack is the part diagnosis needs.

Catch only what the current boundary can handle. A process, request, task, or
CLI boundary may catch everything to report an otherwise unhandled failure, but
it must keep the stack, run required cleanup, and produce an explicit outcome.

A `catch` block that neither handles nor rethrows discards the error silently,
and TypeScript reports nothing: the block satisfies every type. Make the
recovery visible in the return type instead.

## Choose one failure style per boundary

A thrown error and a returned result type are both valid in TypeScript, and a
signature that returns a result still permits a throw. Pick one style per
boundary and keep it, because a function that sometimes throws and sometimes
returns a failure value forces every caller to handle both paths.

Discriminate a Node system failure on `error.code`, such as `ENOENT`, not on the
message. Messages change between releases and locales.

Run cleanup in `finally`. A `return` or `throw` inside that block replaces the
original outcome, including the error on its way out, so keep the cleanup itself
guarded and let the original cause continue.

Finish when each failure has one owner, callers can distinguish every promised
outcome, and the original cause and stack remain available for diagnosis.
