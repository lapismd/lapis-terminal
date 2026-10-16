import { appendFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRelease, crates, pendingChangesets } from "./release-state.mjs";

export const repository = "lapismd/lapis-terminal";
const requiredChecks = ["macOS ARM64 checks", "Build specification"];
export function releaseTrigger(eventName, event, env) {
  if (env.GITHUB_REPOSITORY !== repository)
    throw Error("Unexpected repository");
  let sha, mode;
  if (eventName === "workflow_run") {
    const run = event.workflow_run;
    if (
      run?.event !== "push" ||
      run.conclusion !== "success" ||
      run.head_branch !== "main" ||
      run.head_repository?.full_name !== repository
    )
      throw Error("Only successful main push CI can release");
    sha = run.head_sha;
    mode = "publish";
  } else if (
    eventName === "workflow_dispatch" &&
    env.GITHUB_REF === "refs/heads/main"
  ) {
    sha = env.GITHUB_SHA;
    mode = event.inputs?.mode;
  } else throw Error("Release requires main CI or a main dispatch");
  if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw Error("Invalid revision");
  if (!["verify", "publish"].includes(mode))
    throw Error("Invalid release mode");
  return { sha, mode };
}

export function requireQualification(sha, main, runs, checks) {
  if (main !== sha) throw Error("Refusing a stale main revision");
  if (
    !runs.some(
      (run) =>
        run.head_sha === sha &&
        run.head_branch === "main" &&
        run.event === "push" &&
        run.conclusion === "success" &&
        run.head_repository?.full_name === repository,
    )
  )
    throw Error("No successful main CI for this exact revision");
  for (const name of requiredChecks)
    if (
      !checks.some(
        (check) =>
          check.name === name &&
          check.head_sha === sha &&
          check.app?.id === 15368 &&
          check.status === "completed" &&
          check.conclusion === "success",
      )
    )
      throw Error(`Required check is not successful: ${name}`);
}

export async function registryVersion(name, version, request = fetch) {
  const response = await request(
    `https://crates.io/api/v1/crates/${name}/${version}`,
    {
      headers: {
        "User-Agent": `lapis-terminal-release (https://github.com/${repository})`,
      },
      signal: AbortSignal.timeout(30000),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw Error(`Registry lookup failed for ${name}: HTTP ${response.status}`);
  const data = (await response.json()).version;
  if (data?.num !== version || data?.crate !== name || data.yanked !== false)
    throw Error(`Unexpected or yanked registry version: ${name}`);
  return data;
}

const github = (path) =>
  JSON.parse(
    execFileSync("gh", ["api", `repos/${repository}/${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );

export async function releasePlan(
  root,
  trigger,
  api = github,
  registry = registryVersion,
) {
  const { sha } = trigger;
  requireQualification(
    sha,
    api("branches/main").commit.sha,
    api(
      `actions/workflows/ci.yml/runs?branch=main&event=push&head_sha=${sha}&status=success&per_page=20`,
    ).workflow_runs,
    api(`commits/${sha}/check-runs?filter=latest&per_page=100`).check_runs,
  );
  const version = checkRelease(root);
  if ((await pendingChangesets(root)).length) {
    if (trigger.mode === "verify") throw Error("Unreleased changesets remain");
    return { ...trigger, version, missing: [], deferred: true };
  }
  readFileSync(
    resolve(root, `spec/src/history/releases/${version}.md`),
    "utf8",
  );
  const missing = [];
  for (const name of crates)
    if (!(await registry(name, version))) missing.push(name);
  return { ...trigger, version, missing };
}

export async function publish(
  plan,
  publishCargo,
  registry = registryVersion,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  if (plan.mode !== "publish") throw Error("Verification cannot publish");
  if (!plan.missing.length) return;
  // Cargo publishes the selected workspace packages in dependency order and waits
  // for the index. An upload error is never retried here: re-plan from registry facts.
  await publishCargo([
    "publish",
    "--locked",
    "--registry",
    "crates-io",
    ...plan.missing.flatMap((name) => ["-p", name]),
  ]);
  for (let attempt = 0; attempt < 12; attempt++) {
    const versions = await Promise.all(
      crates.map((name) => registry(name, plan.version)),
    );
    if (versions.every(Boolean)) return;
    if (attempt < 11) await sleep(5000);
  }
  throw Error(
    "Publication returned but registry visibility is unconfirmed; inspect before retrying",
  );
}

async function main() {
  const stage = process.argv[2];
  if (!["plan", "verify", "publish"].includes(stage))
    throw Error("Unknown release stage");
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const trigger = releaseTrigger(
    process.env.GITHUB_EVENT_NAME,
    event,
    process.env,
  );
  const plan = await releasePlan(".", trigger);
  if (stage !== "plan" && plan.deferred)
    throw Error("Unreleased changesets remain");
  if (stage === "plan" && process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `sha=${plan.sha}\nversion=${plan.version}\nmode=${plan.mode}\npublish=${plan.missing.length > 0}\n`,
    );
  if (stage === "publish")
    await publish(plan, (args) =>
      execFileSync(process.execPath, ["scripts/managed-cargo.mjs", ...args], {
        stdio: "inherit",
      }),
    );
  const message = plan.deferred
    ? `Publication deferred: changesets await a version PR at ${plan.sha}`
    : `${stage}: ${plan.version} at ${plan.sha}; missing crates: ${plan.missing.join(", ") || "none"}`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
