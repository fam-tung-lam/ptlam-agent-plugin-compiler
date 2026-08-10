# Node.js Interface

The package exports `AgentPluginCompiler` for build tools and other Node.js
integrations.

## Create a compiler

```ts
import {
  AgentPluginCompiler,
  CLAUDE,
  CODEX,
} from "@fam-tung-lam/ptlam-agent-plugin-compiler";

const compiler = new AgentPluginCompiler({
  rootDir: process.cwd(),
  providers: [CLAUDE, CODEX],
});
```

`rootDir` is required and may be absolute or relative. Omit `providers` to use
`plugin/plugin.yml`; pass a list to replace it; pass `[]` for shared skills
only. The options are copied and frozen when the instance is created.

Built-in constants are `CLAUDE`, `CODEX`, `COPILOT`, `GEMINI`, and `KIMI`.

## Operations

```ts
const initialized = await compiler.init();
const validation = await compiler.validate();
const compiled = await compiler.compile();
const checked = await compiler.check();
```

The Node.js method corresponding to the CLI `compile` command is `compile()`.

| Method       | Main result facts                                            |
| ------------ | ------------------------------------------------------------ |
| `init()`     | `createdPaths`, `existingPaths`, `warnings`                  |
| `validate()` | `plugin`, `providers`, `providerSelectionSource`, `warnings` |
| `compile()`  | Validation facts, `writeResult`, `verified`, `drift`         |
| `check()`    | Validation facts, `upToDate`, `drift`                        |

Results and their nested public collections are immutable snapshots. Methods
reject when repository I/O, validation, planning, or verification cannot
complete.

## Check before publication

```ts
const result = await compiler.check();

if (!result.upToDate) {
  for (const entry of result.drift) {
    console.error(`${entry.path}: ${entry.reason}`);
  }
  process.exitCode = 1;
}
```

## Register an additional provider

Advanced integrations can create a per-instance registry:

```ts
import {
  AgentPluginCompiler,
  ArtifactKind,
  OwnershipKind,
  ProviderAdapterRegistry,
  createPlanFragment,
  createProjectPath,
  createProviderId,
  type ProviderAdapter,
} from "@fam-tung-lam/ptlam-agent-plugin-compiler";

const EXTERNAL = createProviderId("external");
const manifestPath = createProjectPath(".external-plugin/plugin.json");

const adapter = {
  id: EXTERNAL,
  compile: ({ plugin }) =>
    createPlanFragment({
      ownerId: EXTERNAL,
      ownership: {
        kind: OwnershipKind.ExactFiles,
        paths: [manifestPath],
      },
      artifacts: [
        {
          kind: ArtifactKind.File,
          path: manifestPath,
          content: new TextEncoder().encode(
            `${JSON.stringify({ name: plugin.name })}\n`,
          ),
        },
      ],
    }),
} satisfies ProviderAdapter;

const registry = new ProviderAdapterRegistry().register(adapter);
const externalCompiler = new AgentPluginCompiler(
  { rootDir: process.cwd(), providers: [EXTERNAL] },
  registry,
);

await externalCompiler.compile();
```

Each registry is immutable and isolated. `register()` returns a new registry,
and adapters must use stable exact-file ownership.

Next: compare the [built-in providers](/reference/providers), or return to the
[Guide](/guide/introduction).
