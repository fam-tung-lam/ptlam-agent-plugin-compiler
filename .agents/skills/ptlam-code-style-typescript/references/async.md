# TypeScript Async and Resource Lifetime

How TypeScript code schedules asynchronous work and keeps resources correct
under concurrency.

Use `async` and `await` when the call path waits on I/O. An `async` label does
not make anything non-blocking: a synchronous file read, a synchronous crypto
call, or a long computation still occupies the single thread that runs every
other task. Move CPU-bound work to `worker_threads` or to the project's job
boundary.

## Give every promise an owner

A promise nobody awaits still runs, and its failure surfaces far from the code
that caused it. Await it, return it to a caller that awaits it, or hand it to a
supervisor with an explicit failure handler and shutdown path. Do not start
untracked background work inside a request handler or a library call.

- Use `Promise.all` when one failure should abandon the group, and remember that
  the siblings keep running; release their resources yourself.
- Use `Promise.allSettled` when every outcome matters and the caller decides
  what a partial failure means.
- Awaiting inside a `for` loop is sequential. Keep it when order or a rate limit
  requires it, and say so; otherwise use a bounded concurrent form rather than
  firing an unbounded `map` at an external service.
- Never mark a callback `async` for an API that ignores its return value. The
  rejection escapes the caller entirely.

## Bound and cancel external work

Pass an `AbortSignal` down to the call that actually performs the I/O. Racing a
promise against a timer rejects the wrapper while the underlying request keeps
running, holding its socket and its memory until it finishes anyway.

```ts
const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
```

Distinguish a timeout from a caller's cancellation: one is the dependency
failing, the other is the caller no longer wanting the result. Let cancellation
propagate after cleanup instead of converting it into a success or a retry.

## Release what you acquire

Acquire files, handles, locks, connections, and streams where you can release
them, and release them in `finally` so the failure and cancellation paths free
what the success path frees:

```ts
const handle = await open(path, "r");
try {
  return await readHeader(handle);
} finally {
  await handle.close();
}
```

Use `await using` with a disposable when the project's TypeScript version,
runtime, and target all support explicit resource management. Do not introduce
it into a project whose configuration does not compile it.

Do not share a mutable client, session, cursor, or buffer across concurrent
tasks unless its documented contract says that is safe.

Test concurrency through observable readiness and controlled collaborators. A
fixed sleep hides the race and makes the suite depend on machine speed.

Finish when no blocking call sits on the event loop, every promise has an owner
that handles its failure, every external call can time out and be cancelled, and
every acquired resource closes on all exits.
