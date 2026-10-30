import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactDirectory, verifyArtifact } from "./npm-artifact.mjs";
import { packageName, verifyPublished } from "./npm-registry.mjs";
import { repository } from "./cargo-release.mjs";
import { github, npmPlan, npmTrigger } from "./npm-release.mjs";

export function githubRelease(
  root,
  plan,
  manifest,
  { api = github, run = execFileSync } = {},
) {
  const optional = (path) => {
    try {
      return api(path);
    } catch (error) {
      if (/HTTP 404/.test(String(error.stderr ?? error.message))) return null;
      throw error;
    }
  };
  const tag = `${packageName}@${plan.version}`;
  let reference = optional(`git/ref/tags/${encodeURIComponent(tag)}`)?.object;
  for (let depth = 0; reference?.type === "tag" && depth < 4; depth++)
    reference = api(`git/tags/${reference.sha}`).object;
  if (reference && (reference.type !== "commit" || reference.sha !== plan.sha))
    throw Error("Existing npm release tag points at another source revision");
  const existing = optional(`releases/tags/${encodeURIComponent(tag)}`);
  if (
    existing &&
    (!reference ||
      existing.tag_name !== tag ||
      existing.draft ||
      existing.prerelease)
  )
    throw Error(
      "Existing GitHub release does not match the stable qualified source",
    );
  if (!existing) {
    const notes = join(root, artifactDirectory, "release-notes.md");
    writeFileSync(
      notes,
      `${tag}\n\nQualified source: ${plan.sha}\n\nSuccessful main CI: https://github.com/${repository}/actions/runs/${plan.ciRun}\n\nPublished npm tarball integrity: ${manifest.integrity}\n\nClean frozen registry consumer, all public entrypoints, signatures and provenance passed before this release. Cargo delivery retains its separate coordinated workflow.\n`,
    );
    run(
      "gh",
      [
        "release",
        "create",
        tag,
        "--repo",
        repository,
        "--target",
        plan.sha,
        "--title",
        tag,
        "--notes-file",
        notes,
        join(root, artifactDirectory, "manifest.json"),
        join(root, artifactDirectory, manifest.tarball),
      ],
      { stdio: "inherit" },
    );
  }
  return tag;
}

async function main() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const plan = await npmPlan(
    ".",
    npmTrigger(process.env.GITHUB_EVENT_NAME, event, process.env),
  );
  if (plan.mode !== "publish")
    throw Error("Verification cannot create a GitHub release");
  const manifest = JSON.parse(
    readFileSync(join(artifactDirectory, "manifest.json"), "utf8"),
  );
  verifyArtifact(".", manifest, plan.sha);
  await verifyPublished(manifest);
  console.log(
    `GitHub release verified: ${githubRelease(".", plan, manifest)} at ${plan.sha}`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
