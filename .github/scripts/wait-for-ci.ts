import {
  appendGitHubOutput,
  type CommandRunner,
  requireEnvironment,
  requireSuccess,
  runScript,
  sleep,
  systemCommandRunner,
} from "./run-script.ts";

export interface WorkflowRun {
  readonly conclusion?: string | null;
  readonly created_at?: string;
  readonly head_sha?: string;
  readonly id?: number;
  readonly status?: string;
}

export interface CiRunReader {
  listRuns(releaseSha: string): Promise<readonly WorkflowRun[]>;
}

export function selectLatestRun(
  runs: readonly WorkflowRun[],
  releaseSha: string,
): WorkflowRun | undefined {
  return [...runs]
    .filter((run) => run.head_sha === releaseSha)
    .sort((left, right) =>
      (left.created_at ?? "").localeCompare(right.created_at ?? ""),
    )
    .at(-1);
}

export async function waitForSuccessfulCi(
  releaseSha: string,
  reader: CiRunReader,
  options: {
    readonly delay?: (milliseconds: number) => Promise<void>;
    readonly intervalMilliseconds?: number;
    readonly maximumAttempts?: number;
  } = {},
): Promise<number> {
  const delay = options.delay ?? sleep;
  const intervalMilliseconds = options.intervalMilliseconds ?? 5_000;
  const maximumAttempts = options.maximumAttempts ?? 420;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const run = selectLatestRun(await reader.listRuns(releaseSha), releaseSha);
    if (run?.status === "completed") {
      if (run.conclusion !== "success") {
        throw new Error(
          `CI failed for ${releaseSha}: ${run.conclusion ?? "unknown"}.`,
        );
      }
      if (run.id === undefined) throw new Error("Completed CI run has no id.");
      return run.id;
    }
    if (attempt < maximumAttempts) await delay(intervalMilliseconds);
  }
  throw new Error(`Timed out waiting for CI on ${releaseSha}.`);
}

function commandReader(runner: CommandRunner, repository: string): CiRunReader {
  return {
    async listRuns(releaseSha) {
      const result = requireSuccess(
        await runner.run("gh", [
          "api",
          "--method",
          "GET",
          `repos/${repository}/actions/workflows/ci.yml/runs`,
          "-f",
          "branch=main",
          "-f",
          "event=push",
          "-f",
          `head_sha=${releaseSha}`,
          "-f",
          "per_page=20",
        ]),
        "List CI runs",
      );
      const response = JSON.parse(result.stdout) as { workflow_runs?: unknown };
      if (!Array.isArray(response.workflow_runs)) {
        throw new Error("GitHub returned invalid workflow run data.");
      }
      return response.workflow_runs as readonly WorkflowRun[];
    },
  };
}

runScript(import.meta.url, async () => {
  const releaseSha = requireEnvironment(process.env, "RELEASE_SHA");
  const repository = requireEnvironment(process.env, "GITHUB_REPOSITORY");
  const outputPath = requireEnvironment(process.env, "GITHUB_OUTPUT");
  const runId = await waitForSuccessfulCi(
    releaseSha,
    commandReader(systemCommandRunner, repository),
  );
  await appendGitHubOutput(outputPath, { run_id: String(runId) });
});
