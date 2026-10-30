import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { attest, verify } from "sigstore";
import { artifactDirectory, verifyArtifact } from "./npm-artifact.mjs";
import { packageName } from "./npm-registry.mjs";
import { repository } from "./cargo-release.mjs";

const workflow = ".github/workflows/publish-npm.yml";
const identity = `https://github.com/${repository}/${workflow}@refs/heads/main`;
export function provenanceStatement(plan, manifest, env) {
  if (
    env.GITHUB_REPOSITORY !== repository ||
    env.GITHUB_REF !== "refs/heads/main" ||
    env.GITHUB_SHA !== plan.sha ||
    env.GITHUB_WORKFLOW_REF !== `${repository}/${workflow}@refs/heads/main` ||
    env.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
    env.RUNNER_ENVIRONMENT !== "github-hosted" ||
    !/^\d+$/.test(env.GITHUB_RUN_ID ?? "") ||
    !/^\d+$/.test(env.GITHUB_RUN_ATTEMPT ?? "")
  )
    throw Error(
      "Provenance requires the exact main publishing workflow on GitHub-hosted infrastructure",
    );
  return {
    _type: "https://in-toto.io/Statement/v1",
    subject: [
      {
        name: `pkg:npm/${packageName.replace("@", "%40")}@${manifest.version}`,
        digest: {
          sha512: Buffer.from(manifest.integrity.slice(7), "base64").toString(
            "hex",
          ),
        },
      },
    ],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType:
          "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
        externalParameters: {
          workflow: {
            repository: `https://github.com/${repository}`,
            ref: "refs/heads/main",
            path: workflow,
          },
        },
        resolvedDependencies: [
          {
            uri: `git+https://github.com/${repository}@refs/heads/main`,
            digest: { gitCommit: plan.sha },
          },
        ],
      },
      runDetails: {
        builder: { id: "https://github.com/actions/runner/github-hosted" },
        metadata: {
          invocationId: `https://github.com/${repository}/actions/runs/${env.GITHUB_RUN_ID}/attempts/${env.GITHUB_RUN_ATTEMPT}`,
        },
      },
    },
  };
}

export async function prepareProvenance(
  root,
  plan,
  manifest,
  { env = process.env, sign = attest, check = verify } = {},
) {
  if (plan.mode !== "attest")
    throw Error("Detached bootstrap provenance requires explicit attest mode");
  verifyArtifact(root, manifest, plan.sha);
  const statement = provenanceStatement(plan, manifest, env);
  const bundle = await sign(
    Buffer.from(JSON.stringify(statement)),
    "application/vnd.in-toto+json",
  );
  const payload = JSON.parse(
    Buffer.from(bundle?.dsseEnvelope?.payload ?? "", "base64").toString("utf8"),
  );
  if (JSON.stringify(payload) !== JSON.stringify(statement))
    throw Error("Signer returned a different npm provenance statement");
  await check(bundle, undefined, {
    certificateIssuer: "https://token.actions.githubusercontent.com",
    certificateIdentityURI: `^${identity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  });
  const file = join(root, artifactDirectory, "provenance.sigstore.json");
  writeFileSync(file, JSON.stringify(bundle, null, 2) + "\n");
  return file;
}
