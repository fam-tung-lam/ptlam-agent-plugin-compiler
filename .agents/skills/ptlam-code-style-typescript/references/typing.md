# TypeScript Typing

Type mechanics for TypeScript code. The repository's `tsconfig.json` and
installed TypeScript version decide which syntax and checks are available;
[dev-toolchain.md](dev-toolchain.md) owns those settings.

## Type changed production code

Annotate every exported value and every function parameter you add or
substantively change. Let inference own local variables and obvious return
types; annotate a return when the function is exported or when inference would
widen the contract.

- Prefer a precise domain type over `any`. Use `unknown` for a genuinely unknown
  input and narrow it before use. `any` disables checking for everything it
  touches, including the callers downstream.
- Accept the widest useful shape and return the narrowest one: take
  `Iterable<T>` or `readonly T[]`, return the concrete type the caller receives.
- Mark data that must not change as `readonly`, both on properties and on array
  and tuple parameters.
- Use `satisfies` to check a literal against a type without widening it, so the
  literal keeps its exact keys and values.
- Prefer a union of string literals over `enum`. A union needs no runtime value,
  and `as const` derives one from an existing object when the values are needed
  at runtime.
- Constrain every generic parameter, and remove a parameter that appears only
  once in the signature. It documents nothing and infers to whatever is passed.

## Make illegal states unrepresentable

Model a closed set of states as a discriminated union rather than a record of
optional fields, then handle it exhaustively:

```ts
type Fetch<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "failed"; error: Error };

function describe<T>(state: Fetch<T>): string {
  switch (state.status) {
    case "loading":
      return "loading";
    case "ready":
      return "ready";
    case "failed":
      return state.error.message;
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}
```

The `never` assignment makes a new variant a compile error at every switch that
forgot it. `noFallthroughCasesInSwitch` catches the missing `break` or `return`.

Give a distinct identifier its own type so one identifier cannot be passed where
another belongs:

```ts
declare const userIdBrand: unique symbol;
export type UserId = string & { readonly [userIdBrand]: true };
```

Use integer minor units or a decimal library for money; binary floats round in
ways an invoice eventually surfaces. Use `Date` or epoch milliseconds for an
instant and a plain `YYYY-MM-DD` string for a calendar day that has no instant.
Normalize to UTC at the boundary that accepts the value.

## Keep static and runtime guarantees distinct

Types are erased before the program runs. A type assertion at an external
boundary is a claim the compiler accepts and never checks; validate the value
instead, as [runtime-validation.md](runtime-validation.md) requires.

Narrow with `typeof`, `instanceof`, `in`, or a type predicate before reaching
for `as`. A non-null assertion needs an invariant you can state; when the
invariant is real, prefer a check that throws a useful error over silencing the
compiler.

Use `@ts-expect-error` rather than `@ts-ignore` so the suppression fails once
the underlying error is gone. Keep it on the smallest expression and state why
the checker cannot prove the fact.

For a published package, ship declarations built from the same source and check
them from a consumer's resolution mode. A type that compiles inside the
repository can still be unusable, or leak an internal type, once published.

Finish when the configured type check reports no new failure in changed code and
the types describe values the runtime really produces.
