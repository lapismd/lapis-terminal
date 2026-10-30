import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRelease, pendingChangesets } from "./release-state.mjs";
import { repository, requireQualification } from "./cargo-release.mjs";
import { artifactDirectory, verifyArtifact } from "./npm-artifact.mjs";
import {
  npmRegistered,
  npmVersion,
  packageName,
  verifyPublished,
} from "./npm-registry.mjs";
import { verifyConsumer } from "./npm-consumer.mjs";

export function npmTrigger(eventName, event, env) {
  if (
    eventName !== "workflow_dispatch" ||
    env.GITHUB_REPOSITORY !== repository ||
    env.GITHUB_REF !== "refs/heads/main"
  )
    throw Error(
      "npm publication requires a main dispatch in the owning repository",
    );
  const sha = env.GITHUB_SHA,
    mode = event.inputs?.mode;
  if (
    !/^[a-f0-9]{40}$/.test(sha ?? "") ||
    !["verify", "publish"].includes(mode)
  )
    throw Error("Invalid npm release revision or mode");
  return { sha, mode };
}

export const github = (path) =>
  JSON.parse(
    execFileSync("gh", ["api", `repos/${repository}/${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );

export async function npmPlan(
  root,
  trigger,
  { api = github, versionState = npmVersion, registered = npmRegistered } = {},
) {
  const runs = api(
    `actions/workflows/ci.yml/runs?branch=main&event=push&head_sha=${trigger.sha}&status=success&per_page=20`,
  ).workflow_runs;
  requireQualification(
    trigger.sha,
    api("branches/main").commit.sha,
    runs,
    api(`commits/${trigger.sha}/check-runs?filter=latest&per_page=100`)
      .check_runs,
  );
  const version = checkRelease(root);
  if ((await pendingChangesets(root)).length)
    throw Error("Unreleased changesets remain");
  readFileSync(join(root, `spec/src/history/releases/${version}.md`), "utf8");
  const run = runs.find(
    (value) =>
      value.head_sha === trigger.sha &&
      value.head_branch === "main" &&
      value.event === "push" &&
      value.conclusion === "success" &&
      value.head_repository?.full_name === repository,
  );
  if (!Number.isSafeInteger(run?.id) || run.id <= 0)
    throw Error("Qualified CI run identity is missing");
  const existing = await versionState(version);
  return {
    ...trigger,
    version,
    ciRun: run.id,
    missing: !existing,
    bootstrap: !existing && !(await registered()),
    integrity: existing?.dist.integrity ?? null,
  };
}

export function publishNpm(
  root,
  plan,
  manifest,
  { env = process.env, run = execFileSync } = {},
) {
  if (plan.mode !== "publish")
    throw Error("Verification cannot publish npm packages");
  const file = verifyArtifact(root, manifest, plan.sha);
  if (!plan.missing) {
    if (plan.integrity !== manifest.integrity)
      throw Error("Existing npm version differs from the qualified artifact");
    console.log("Exact npm version already exists; no upload attempted.");
    return;
  }
  if (plan.bootstrap) {
    if (!env.NODE_AUTH_TOKEN)
      throw Error(
        "Initial npm publication requires an approved bootstrap credential in npm-production or staged publication of the verified CI artifact",
      );
    const identity = run(
      "npm",
      ["whoami", "--registry", "https://registry.npmjs.org"],
      { encoding: "utf8", env },
    );
    console.log(
      `Authenticated initial npm publisher: ${String(identity).trim()}`,
    );
  } else if (env.NODE_AUTH_TOKEN)
    throw Error(
      "Registered npm publication must use trusted publishing, not a token fallback",
    );
  // An upload is attempted once. An ambiguous failure requires inspection and a fresh plan.
  run(
    "npm",
    ["publish", file, "--access", "public", "--tag", "latest", "--provenance"],
    { stdio: "inherit", env },
  );
}

async function main() {
  const stage = process.argv[2];
  if (!["plan", "verify-artifact", "publish", "verify"].includes(stage))
    throw Error("Unknown npm release stage");
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const trigger = npmTrigger(process.env.GITHUB_EVENT_NAME, event, process.env);
  const plan = await npmPlan(".", trigger);
  if (stage === "plan") {
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `sha=${plan.sha}\nversion=${plan.version}\nci_run=${plan.ciRun}\nmissing=${plan.missing}\nbootstrap=${plan.bootstrap}\nmode=${plan.mode}\n`,
      );
    console.log(JSON.stringify(plan));
    return;
  }
  const manifest = JSON.parse(
    readFileSync(join(artifactDirectory, "manifest.json"), "utf8"),
  );
  verifyArtifact(".", manifest, plan.sha);
  if (stage === "publish") publishNpm(".", plan, manifest);
  if (stage === "verify") {
    const metadata = await verifyPublished(manifest);
    verifyConsumer(".", manifest);
    writeFileSync(
      join(artifactDirectory, "registry-receipt.json"),
      JSON.stringify(
        {
          package: packageName,
          version: plan.version,
          sha: plan.sha,
          ciRun: plan.ciRun,
          integrity: metadata.dist.integrity,
          tarball: metadata.dist.tarball,
          attestations: metadata.dist.attestations.url,
        },
        null,
        2,
      ) + "\n",
    );
  }
  console.log(`${stage}: ${packageName}@${plan.version} at ${plan.sha}`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
