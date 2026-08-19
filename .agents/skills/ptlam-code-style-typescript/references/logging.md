# TypeScript Logging

Node logging package and call mechanics.

When the repository has no logging facade and the code is a new Node service,
build it on Pino ([canonical documentation](https://getpino.io)). Create the
child logger once per module and export nothing but the calls that use it.

`console` is not application logging. Use it only for a command-line program's
intentional output contract, and keep that contract straight: the program's data
goes to `stdout`, its diagnostics go to `stderr`, so a caller can pipe one
without the other.

Pass an object of fields as the first argument and keep the message a stable
literal. A message assembled by template literal cannot be grouped or filtered
by the fields inside it.

```ts
logger.debug({ batchId, count }, "loaded records for batch");
```

Inside a `catch`, pass the narrowed error under the field name the configured
serializer expects — `err` in a default Pino setup — so the stack and `cause`
survive into the record.

Configure transports, destinations, levels, and redaction once, where the
application composes its dependencies. A library that installs a transport or
sets a global level overrides a decision belonging to whoever embeds it.

Build redaction as an allowlist of fields to include, not a denylist of fields
to remove. A denylist covers the keys someone remembered on the day they wrote
it, and a nested object added later walks straight past it.

Finish when every new call goes through the owned facade, carries its values as
structured fields, and passes the error object through the serializer the
configured logging stack understands.
