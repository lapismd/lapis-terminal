import { createHash } from "node:crypto";

export const packageName = "@lapismd/terminal";
export const githubRepositoryId = "1422167487";
export const githubOwnerId = "311425888";
export const registry = "https://registry.npmjs.org";
const encodedName = encodeURIComponent(packageName);
const pending = (url) =>
  Object.assign(Error(`Registry propagation pending: ${url}`), {
    pending: true,
  });

async function response(url, request, allowMissing = false) {
  const value = await request(url, { signal: AbortSignal.timeout(30000) });
  if (value.status === 404) {
    if (allowMissing) return null;
    throw pending(url);
  }
  if (!value.ok)
    throw Error(`Registry request failed: HTTP ${value.status} ${url}`);
  return value;
}

export async function npmVersion(version, request = fetch) {
  const value = await response(
    `${registry}/${encodedName}/${version}`,
    request,
    true,
  );
  if (!value) return null;
  const data = await value.json();
  if (
    data.name !== packageName ||
    data.version !== version ||
    !/^sha512-[A-Za-z0-9+/]+=*$/.test(data.dist?.integrity ?? "") ||
    !String(data.dist?.tarball).startsWith(`${registry}/`)
  )
    throw Error("Malformed npm version metadata");
  return data;
}

export async function npmRegistered(request = fetch) {
  const value = await response(`${registry}/${encodedName}`, request, true);
  if (!value) return false;
  if ((await value.json()).name !== packageName)
    throw Error("Malformed npm package metadata");
  return true;
}

export function verifyProvenance(attestations, manifest) {
  const statements = (attestations?.attestations ?? [])
    .filter((entry) => entry.predicateType === "https://slsa.dev/provenance/v1")
    .map((entry) =>
      JSON.parse(
        Buffer.from(
          entry.bundle?.dsseEnvelope?.payload ?? "",
          "base64",
        ).toString("utf8"),
      ),
    );
  const digest = Buffer.from(manifest.integrity.slice(7), "base64").toString(
    "hex",
  );
  if (
    !statements.some((statement) => {
      const definition = statement.predicate?.buildDefinition;
      const workflow = definition?.externalParameters?.workflow;
      const github = definition?.internalParameters?.github;
      return (
        statement.subject?.some(
          (subject) => subject.digest?.sha512 === digest,
        ) &&
        workflow?.repository === "https://github.com/lapismd/lapis-terminal" &&
        workflow.path === ".github/workflows/publish-npm.yml" &&
        workflow.ref === "refs/heads/main" &&
        github?.event_name === "workflow_dispatch" &&
        github.repository_id === githubRepositoryId &&
        github.repository_owner_id === githubOwnerId &&
        definition.resolvedDependencies?.some(
          (dependency) => dependency.digest?.gitCommit === manifest.sha,
        )
      );
    })
  )
    throw Error(
      "npm provenance does not bind the exact source, workflow and artifact",
    );
}

export async function verifyPublished(
  manifest,
  {
    request = fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  const delays = [5000, 10000, 20000, 30000];
  for (let attempt = 0; ; attempt++) {
    try {
      const metadata = await npmVersion(manifest.version, request);
      if (!metadata)
        throw pending(`${registry}/${encodedName}/${manifest.version}`);
      if (metadata.dist.integrity !== manifest.integrity)
        throw Error(
          "Published npm integrity differs from the qualified artifact",
        );
      const tarball = await response(metadata.dist.tarball, request);
      const actual = `sha512-${createHash("sha512")
        .update(Buffer.from(await tarball.arrayBuffer()))
        .digest("base64")}`;
      if (actual !== manifest.integrity)
        throw Error("Downloaded npm tarball integrity differs");
      if (
        !metadata.dist.signatures?.length ||
        !metadata.dist.attestations?.url?.startsWith(`${registry}/`)
      )
        throw Error("Published npm signatures or provenance are missing");
      const attestation = await response(
        metadata.dist.attestations.url,
        request,
      );
      verifyProvenance(await attestation.json(), manifest);
      return metadata;
    } catch (error) {
      if (!error.pending || delays[attempt] === undefined) throw error;
      await sleep(delays[attempt]);
    }
  }
}
